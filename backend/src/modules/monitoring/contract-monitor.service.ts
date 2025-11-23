import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { TonClient, Address } from '@ton/ton';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertStatus, AlertSeverity } from '../../entities/monitoring/alert.entity';
import { MetricSnapshot } from '../../entities/monitoring/metric-snapshot.entity';
import { TelegramService } from '../telegram/telegram.service';

/**
 * Real-Time Smart Contract Monitoring Service
 * 
 * Monitors:
 * - Contract balances
 * - Transaction success rates
 * - Gas usage patterns
 * - Error occurrences
 * - Unusual activity detection
 */

interface ContractMetrics {
  contractName: string;
  address: string;
  balance: bigint;
  transactionCount24h: number;
  successRate: number;
  averageGas: bigint;
  errorCount: number;
  lastChecked: Date;
}

interface AnomalyDetection {
  type: 'balance' | 'gas' | 'errors' | 'volume';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  timestamp: Date;
}

@Injectable()
export class ContractMonitorService {
  private readonly logger = new Logger(ContractMonitorService.name);
  private readonly tonClient: TonClient;
  private readonly contracts: Map<string, string> = new Map();
  
  // Thresholds for alerting
  private readonly MIN_BALANCE = 10n * 1000000000n; // 10 TON
  private readonly MAX_GAS_SPIKE = 2.0; // 2x average
  private readonly MAX_ERROR_RATE = 0.05; // 5%
  private readonly MAX_VOLUME_SPIKE = 3.0; // 3x average

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @InjectRepository(MetricSnapshot)
    private readonly metricsRepository: Repository<MetricSnapshot>,
  ) {
    // Initialize TON client
    this.tonClient = new TonClient({
      endpoint: this.configService.get('TON_API_ENDPOINT'),
      apiKey: this.configService.get('TON_API_KEY'),
    });

    // Load contract addresses
    this.contracts.set('JobRegistry', this.configService.get('JOB_REGISTRY_ADDRESS'));
    this.contracts.set('Escrow', this.configService.get('ESCROW_ADDRESS'));
    this.contracts.set('Reputation', this.configService.get('REPUTATION_ADDRESS'));
  }

  /**
   * Main monitoring cron job - runs every 5 minutes
   */
  @Cron('*/5 * * * *')
  async monitorContracts() {
    this.logger.log('Starting contract monitoring cycle...');

    try {
      const metrics: ContractMetrics[] = [];

      // Collect metrics for all contracts
      for (const [name, address] of this.contracts.entries()) {
        const metric = await this.collectContractMetrics(name, address);
        metrics.push(metric);

        // Save snapshot
        await this.saveMetricSnapshot(metric);
      }

      // Detect anomalies
      const anomalies = await this.detectAnomalies(metrics);

      // Alert on anomalies
      if (anomalies.length > 0) {
        await this.handleAnomalies(anomalies);
      }

      this.logger.log(`Monitoring cycle complete. Checked ${metrics.length} contracts, found ${anomalies.length} anomalies`);

    } catch (error) {
      this.logger.error('Contract monitoring failed:', error);
      await this.alertCritical('Monitoring System Failure', error.message);
    }
  }

  /**
   * Collect comprehensive metrics for a contract
   */
  private async collectContractMetrics(
    contractName: string,
    addressStr: string,
  ): Promise<ContractMetrics> {
    this.logger.debug(`Collecting metrics for ${contractName}...`);

    const address = Address.parse(addressStr);
    
    // Get current balance
    const balance = await this.getContractBalance(address);

    // Get recent transactions
    const transactions = await this.getRecentTransactions(address, 24); // Last 24 hours

    // Calculate success rate
    const successfulTxs = transactions.filter(tx => tx.success).length;
    const successRate = transactions.length > 0 
      ? successfulTxs / transactions.length 
      : 1.0;

    // Calculate average gas
    const totalGas = transactions.reduce((sum, tx) => sum + tx.gasUsed, 0n);
    const averageGas = transactions.length > 0 
      ? totalGas / BigInt(transactions.length) 
      : 0n;

    // Count errors
    const errorCount = transactions.filter(tx => !tx.success).length;

    return {
      contractName,
      address: addressStr,
      balance,
      transactionCount24h: transactions.length,
      successRate,
      averageGas,
      errorCount,
      lastChecked: new Date(),
    };
  }

  /**
   * Get contract balance
   */
  private async getContractBalance(address: Address): Promise<bigint> {
    try {
      const balance = await this.tonClient.getBalance(address);
      return BigInt(balance);
    } catch (error) {
      this.logger.error(`Failed to get balance for ${address}:`, error);
      return 0n;
    }
  }

  /**
   * Get recent transactions for analysis
   */
  private async getRecentTransactions(
    address: Address,
    hours: number,
  ): Promise<Array<{ success: boolean; gasUsed: bigint; timestamp: number }>> {
    try {
      const transactions = await this.tonClient.getTransactions(address, {
        limit: 100,
      });

      const cutoff = Date.now() / 1000 - hours * 3600;

      return transactions
        .filter(tx => tx.now > cutoff)
        .map(tx => ({
          success: tx.description.type === 'generic' && 
                   tx.description.computePhase.type === 'vm' &&
                   tx.description.computePhase.success,
          gasUsed: tx.totalFees.coins,
          timestamp: tx.now,
        }));
    } catch (error) {
      this.logger.error(`Failed to get transactions for ${address}:`, error);
      return [];
    }
  }

  /**
   * Detect anomalies in metrics
   */
  private async detectAnomalies(
    currentMetrics: ContractMetrics[],
  ): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    for (const metric of currentMetrics) {
      // Check low balance
      if (metric.balance < this.MIN_BALANCE) {
        anomalies.push({
          type: 'balance',
          severity: 'high',
          message: `Low balance detected in ${metric.contractName}`,
          data: {
            contract: metric.contractName,
            balance: metric.balance.toString(),
            threshold: this.MIN_BALANCE.toString(),
          },
          timestamp: new Date(),
        });
      }

      // Check high error rate
      if (metric.successRate < (1 - this.MAX_ERROR_RATE) && metric.transactionCount24h > 10) {
        anomalies.push({
          type: 'errors',
          severity: 'critical',
          message: `High error rate in ${metric.contractName}`,
          data: {
            contract: metric.contractName,
            successRate: metric.successRate,
            errorCount: metric.errorCount,
            totalTransactions: metric.transactionCount24h,
          },
          timestamp: new Date(),
        });
      }

      // Check gas usage spikes
      const historicalAvgGas = await this.getHistoricalAverageGas(metric.contractName);
      if (historicalAvgGas > 0n && metric.averageGas > historicalAvgGas * 2n) {
        anomalies.push({
          type: 'gas',
          severity: 'medium',
          message: `Gas usage spike detected in ${metric.contractName}`,
          data: {
            contract: metric.contractName,
            currentAvg: metric.averageGas.toString(),
            historicalAvg: historicalAvgGas.toString(),
            spike: Number(metric.averageGas) / Number(historicalAvgGas),
          },
          timestamp: new Date(),
        });
      }

      // Check transaction volume spikes
      const historicalAvgVolume = await this.getHistoricalAverageVolume(metric.contractName);
      if (historicalAvgVolume > 0 && metric.transactionCount24h > historicalAvgVolume * this.MAX_VOLUME_SPIKE) {
        anomalies.push({
          type: 'volume',
          severity: 'medium',
          message: `Transaction volume spike in ${metric.contractName}`,
          data: {
            contract: metric.contractName,
            currentVolume: metric.transactionCount24h,
            historicalAvg: historicalAvgVolume,
            spike: metric.transactionCount24h / historicalAvgVolume,
          },
          timestamp: new Date(),
        });
      }
    }

    return anomalies;
  }

  /**
   * Handle detected anomalies
   */
  private async handleAnomalies(anomalies: AnomalyDetection[]) {
    for (const anomaly of anomalies) {
      // Map severity to AlertSeverity enum
      const severityMap: Record<string, AlertSeverity> = {
        'low': AlertSeverity.INFO,
        'medium': AlertSeverity.WARNING,
        'high': AlertSeverity.ERROR,
        'critical': AlertSeverity.CRITICAL,
      };

      // Save alert to database
      const alert = this.alertRepository.create({
        title: anomaly.type,
        description: anomaly.message,
        severity: severityMap[anomaly.severity] || AlertSeverity.INFO,
        source: 'contract-monitor',
        metadata: anomaly.data,
        status: AlertStatus.ACTIVE,
      });
      await this.alertRepository.save(alert);

      // Send notifications based on severity
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        await this.alertOpsTeam(anomaly);
      }
    }
  }

  /**
   * Alert operations team via multiple channels
   */
  private async alertOpsTeam(anomaly: AnomalyDetection) {
    const message = `
🚨 *${anomaly.severity.toUpperCase()} ALERT*

${anomaly.message}

*Details:*
\`\`\`json
${JSON.stringify(anomaly.data, null, 2)}
\`\`\`

*Time:* ${anomaly.timestamp.toISOString()}
    `.trim();

    // Send to Telegram ops channel
    const opsChatId = this.configService.get('TELEGRAM_OPS_CHAT_ID');
    if (opsChatId) {
      await this.telegramService.sendMessage(opsChatId, message);
    }

    // TODO: Add other alerting channels (Slack, PagerDuty, email)
  }

  /**
   * Alert for critical system failures
   */
  private async alertCritical(title: string, details: string) {
    const message = `
🔥 *CRITICAL: ${title}*

${details}

*Time:* ${new Date().toISOString()}

Immediate attention required!
    `.trim();

    const opsChatId = this.configService.get('TELEGRAM_OPS_CHAT_ID');
    if (opsChatId) {
      await this.telegramService.sendMessage(opsChatId, message);
    }
  }

  /**
   * Save metric snapshot for historical analysis
   */
  private async saveMetricSnapshot(metric: ContractMetrics) {
    // Save multiple metrics as separate snapshots
    const snapshots = [
      {
        metricName: 'balance',
        contractName: metric.contractName,
        value: parseFloat(metric.balance.toString()),
        unit: 'TON',
        metadata: { lastChecked: metric.lastChecked },
      },
      {
        metricName: 'transaction_count',
        contractName: metric.contractName,
        value: metric.transactionCount24h,
        transactionCount: metric.transactionCount24h,
        metadata: { period: '24h', lastChecked: metric.lastChecked },
      },
      {
        metricName: 'success_rate',
        contractName: metric.contractName,
        value: metric.successRate,
        unit: 'percentage',
        metadata: { lastChecked: metric.lastChecked },
      },
      {
        metricName: 'average_gas',
        contractName: metric.contractName,
        value: parseFloat(metric.averageGas.toString()),
        averageGas: parseInt(metric.averageGas.toString()),
        unit: 'gas',
        metadata: { lastChecked: metric.lastChecked },
      },
    ];

    for (const snapshotData of snapshots) {
      const snapshot = this.metricsRepository.create(snapshotData);
      await this.metricsRepository.save(snapshot);
    }
  }

  /**
   * Get historical average gas usage
   */
  private async getHistoricalAverageGas(contractName: string): Promise<bigint> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const snapshots = await this.metricsRepository.find({
      where: {
        contractName,
        createdAt: sevenDaysAgo as any, // TypeORM will use >= comparison
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    if (snapshots.length === 0) return 0n;

    const sum = snapshots.reduce(
      (acc, s) => acc + BigInt(s.averageGas),
      0n,
    );

    return sum / BigInt(snapshots.length);
  }

  /**
   * Get historical average transaction volume
   */
  private async getHistoricalAverageVolume(contractName: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const snapshots = await this.metricsRepository.find({
      where: {
        contractName,
        createdAt: sevenDaysAgo as any,
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    if (snapshots.length === 0) return 0;

    const sum = snapshots.reduce((acc, s) => acc + s.transactionCount, 0);
    return sum / snapshots.length;
  }

  /**
   * Get current health status of all contracts
   */
  async getHealthStatus() {
    const health = {
      status: 'healthy',
      contracts: [],
      lastChecked: new Date(),
    };

    for (const [name, address] of this.contracts.entries()) {
      const metrics = await this.collectContractMetrics(name, address);
      
      let status = 'healthy';
      if (metrics.balance < this.MIN_BALANCE) status = 'warning';
      if (metrics.successRate < 0.95) status = 'critical';

      health.contracts.push({
        name,
        address,
        status,
        balance: metrics.balance.toString(),
        successRate: metrics.successRate,
        transactionCount24h: metrics.transactionCount24h,
      });

      if (status === 'critical') health.status = 'critical';
      else if (status === 'warning' && health.status === 'healthy') {
        health.status = 'warning';
      }
    }

    return health;
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit = 50) {
    return this.alertRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: number) {
    await this.alertRepository.update(alertId, {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date(),
    });
  }
}
