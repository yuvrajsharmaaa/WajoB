# 📊 WajoB Monitoring & Logging Strategy

## Overview

This document outlines the comprehensive monitoring, logging, and observability strategy for the WajoB Telegram Mini App with TON blockchain integration.

---

## Table of Contents

1. [Monitoring Philosophy](#monitoring-philosophy)
2. [Smart Contract Monitoring](#smart-contract-monitoring)
3. [Backend Monitoring](#backend-monitoring)
4. [Frontend Monitoring](#frontend-monitoring)
5. [Centralized Logging](#centralized-logging)
6. [Alerting Strategy](#alerting-strategy)
7. [Performance Metrics](#performance-metrics)
8. [Incident Response](#incident-response)
9. [Dashboards](#dashboards)
10. [Tools and Setup](#tools-and-setup)

---

## Monitoring Philosophy

### Goals

- **Proactive Detection**: Identify issues before users notice
- **Quick Resolution**: Minimize Mean Time To Recovery (MTTR)
- **Continuous Improvement**: Learn from metrics and incidents
- **User-Centric**: Monitor what matters to users
- **Cost-Effective**: Balance coverage with operational costs

### Key Metrics

#### Golden Signals

1. **Latency**: Response times, transaction confirmation times
2. **Traffic**: Request rates, transaction volumes
3. **Errors**: Error rates, failed transactions
4. **Saturation**: Resource utilization, queue depths

#### Custom Metrics

- **Contract Health**: Balance levels, gas usage, success rates
- **User Engagement**: Active users, job postings, completions
- **Business Metrics**: Transaction volume, escrow TVL, ratings

---

## Smart Contract Monitoring

### Real-Time Contract Health Monitoring

#### Contract Monitor Service

Located at `backend/src/modules/monitoring/contract-monitor.service.ts`

**Features**:
- Checks every 5 minutes via cron job
- Monitors balance levels
- Tracks transaction success rates
- Analyzes gas usage patterns
- Detects anomalies and unusual activity

**Monitored Contracts**:
1. JobRegistry
2. Escrow
3. Reputation

#### Metrics Collected

```typescript
interface ContractMetrics {
  contractName: string;
  address: string;
  balance: bigint;              // Current TON balance
  transactionCount24h: number;  // Transactions in last 24h
  successRate: number;          // % of successful transactions
  averageGas: bigint;           // Average gas per transaction
  errorCount: number;           // Failed transactions
  lastChecked: Date;
}
```

#### Anomaly Detection

```typescript
// Low Balance Alert
if (balance < 10 TON) {
  alert('critical', 'Low contract balance');
}

// High Error Rate
if (successRate < 0.95 && txCount > 10) {
  alert('critical', 'High error rate detected');
}

// Gas Usage Spike
if (currentAvgGas > historicalAvgGas * 2) {
  alert('medium', 'Gas usage spike');
}

// Transaction Volume Spike
if (currentVolume > historicalAvgVolume * 3) {
  alert('medium', 'Unusual transaction volume');
}
```

### TON Blockchain Monitoring

#### Transaction Tracking

```typescript
// backend/src/modules/blockchain/transaction-tracker.service.ts
@Injectable()
export class TransactionTrackerService {
  @Cron('*/1 * * * *') // Every minute
  async trackPendingTransactions() {
    const pending = await this.getPendingTransactions();
    
    for (const tx of pending) {
      const status = await this.checkTransactionStatus(tx.hash);
      
      if (status === 'confirmed') {
        await this.handleConfirmed(tx);
      } else if (this.isStale(tx)) {
        await this.handleStale(tx);
      }
    }
  }

  private async checkTransactionStatus(hash: string) {
    const txResult = await this.tonClient.getTransaction(hash);
    
    if (!txResult) return 'pending';
    
    return txResult.description.type === 'generic' &&
           txResult.description.computePhase.type === 'vm' &&
           txResult.description.computePhase.success
      ? 'confirmed'
      : 'failed';
  }

  private isStale(tx: Transaction): boolean {
    const ageMinutes = (Date.now() - tx.createdAt.getTime()) / 60000;
    return ageMinutes > 10; // Stale after 10 minutes
  }
}
```

#### Gas Usage Analytics

```typescript
@Injectable()
export class GasAnalyticsService {
  async analyzeGasUsage(contractAddress: string, days: number = 7) {
    const transactions = await this.getTransactions(contractAddress, days);
    
    const gasMetrics = {
      total: 0n,
      average: 0n,
      median: 0n,
      p95: 0n,
      p99: 0n,
      min: 0n,
      max: 0n,
    };

    const gasValues = transactions
      .map(tx => tx.totalFees.coins)
      .sort((a, b) => Number(a - b));

    gasMetrics.total = gasValues.reduce((a, b) => a + b, 0n);
    gasMetrics.average = gasMetrics.total / BigInt(gasValues.length);
    gasMetrics.median = gasValues[Math.floor(gasValues.length / 2)];
    gasMetrics.p95 = gasValues[Math.floor(gasValues.length * 0.95)];
    gasMetrics.p99 = gasValues[Math.floor(gasValues.length * 0.99)];
    gasMetrics.min = gasValues[0];
    gasMetrics.max = gasValues[gasValues.length - 1];

    return gasMetrics;
  }

  async detectGasAnomalies() {
    const currentGas = await this.getCurrentAverageGas();
    const baselineGas = await this.getBaselineGas(30); // 30 days

    if (currentGas > baselineGas * 1.5n) {
      await this.alert({
        severity: 'high',
        message: 'Gas usage 50% above baseline',
        data: { current: currentGas, baseline: baselineGas },
      });
    }
  }
}
```

### Contract Event Monitoring

```typescript
@Injectable()
export class ContractEventMonitorService {
  @Cron('*/2 * * * *') // Every 2 minutes
  async monitorEvents() {
    await Promise.all([
      this.monitorJobEvents(),
      this.monitorEscrowEvents(),
      this.monitorReputationEvents(),
    ]);
  }

  private async monitorJobEvents() {
    const events = await this.indexerService.getRecentEvents('JobRegistry');
    
    const metrics = {
      jobsCreated: events.filter(e => e.type === 'job_created').length,
      jobsAssigned: events.filter(e => e.type === 'worker_assigned').length,
      jobsCompleted: events.filter(e => e.type === 'job_completed').length,
      jobsCancelled: events.filter(e => e.type === 'job_cancelled').length,
    };

    await this.saveMetrics('job_events', metrics);

    // Alert on unusual patterns
    if (metrics.jobsCancelled > metrics.jobsCreated * 0.3) {
      await this.alert({
        severity: 'medium',
        message: 'High job cancellation rate',
        data: metrics,
      });
    }
  }

  private async monitorEscrowEvents() {
    const events = await this.indexerService.getRecentEvents('Escrow');
    
    const disputes = events.filter(e => e.type === 'dispute_created');
    
    if (disputes.length > 5) {
      await this.alert({
        severity: 'high',
        message: `${disputes.length} disputes in last 2 minutes`,
        data: { disputes: disputes.length },
      });
    }
  }
}
```

---

## Backend Monitoring

### Application Performance Monitoring (APM)

#### Using Sentry

```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new ProfilingIntegration(),
    ],
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions
    profilesSampleRate: 0.1,
    beforeSend(event) {
      // Remove sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
      }
      return event;
    },
  });
}
```

#### Custom Metrics

```typescript
// backend/src/modules/monitoring/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  // Counters
  private jobCreationCounter = new Counter({
    name: 'wagob_jobs_created_total',
    help: 'Total number of jobs created',
    labelNames: ['category'],
  });

  private transactionCounter = new Counter({
    name: 'wagob_transactions_total',
    help: 'Total blockchain transactions',
    labelNames: ['contract', 'status'],
  });

  // Histograms
  private apiLatency = new Histogram({
    name: 'wagob_api_latency_seconds',
    help: 'API endpoint latency',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  private txConfirmationTime = new Histogram({
    name: 'wagob_tx_confirmation_seconds',
    help: 'Transaction confirmation time',
    labelNames: ['contract'],
    buckets: [5, 10, 30, 60, 120],
  });

  // Gauges
  private activeJobs = new Gauge({
    name: 'wagob_active_jobs',
    help: 'Number of active jobs',
  });

  private escrowTVL = new Gauge({
    name: 'wagob_escrow_tvl_ton',
    help: 'Total value locked in escrow (TON)',
  });

  // Record metrics
  recordJobCreation(category: string) {
    this.jobCreationCounter.inc({ category });
  }

  recordTransaction(contract: string, success: boolean) {
    this.transactionCounter.inc({
      contract,
      status: success ? 'success' : 'failure',
    });
  }

  recordApiCall(method: string, route: string, status: number, duration: number) {
    this.apiLatency
      .labels(method, route, status.toString())
      .observe(duration / 1000);
  }

  async updateActiveJobs() {
    const count = await this.jobsService.countActiveJobs();
    this.activeJobs.set(count);
  }

  async updateEscrowTVL() {
    const tvl = await this.escrowService.getTotalValueLocked();
    this.escrowTVL.set(Number(tvl) / 1e9); // Convert to TON
  }
}
```

### Health Checks

```typescript
// backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private contractMonitor: ContractMonitorService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      () => this.checkRedis(),
      () => this.checkContracts(),
    ]);
  }

  private async checkRedis() {
    const isHealthy = await this.redisService.ping();
    return {
      redis: {
        status: isHealthy ? 'up' : 'down',
      },
    };
  }

  private async checkContracts() {
    const health = await this.contractMonitor.getHealthStatus();
    return {
      contracts: health,
    };
  }
}
```

### Database Query Monitoring

```typescript
// backend/src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  // ... connection options
  logging: process.env.NODE_ENV !== 'production',
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000, // Log slow queries (> 1s)
};
```

```typescript
// backend/src/modules/monitoring/query-monitor.service.ts
@Injectable()
export class QueryMonitorService {
  @Cron('*/5 * * * *')
  async analyzeSlowQueries() {
    const slowQueries = await this.connection.query(`
      SELECT 
        query,
        calls,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 1000
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `);

    if (slowQueries.length > 0) {
      await this.alert({
        severity: 'medium',
        message: `${slowQueries.length} slow queries detected`,
        data: slowQueries,
      });
    }
  }
}
```

---

## Frontend Monitoring

### Error Tracking

```typescript
// src/monitoring/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  environment: process.env.REACT_APP_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Performance Monitoring

```typescript
// src/monitoring/performance.ts
export class PerformanceMonitor {
  static recordPageLoad() {
    if ('performance' in window) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      
      // Send to analytics
      this.trackMetric('page_load_time', pageLoadTime);
      
      // Log slow loads
      if (pageLoadTime > 3000) {
        console.warn(`Slow page load: ${pageLoadTime}ms`);
      }
    }
  }

  static recordTransactionTime(startTime: number, endTime: number) {
    const duration = endTime - startTime;
    this.trackMetric('transaction_time', duration);
    
    if (duration > 30000) {
      console.warn(`Slow transaction: ${duration}ms`);
    }
  }

  static trackMetric(name: string, value: number) {
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value,
        event_category: 'Performance',
      });
    }
  }
}
```

### User Activity Tracking

```typescript
// src/monitoring/analytics.ts
export class AnalyticsService {
  static trackWalletConnection(address: string) {
    this.track('wallet_connected', {
      address: this.anonymize(address),
    });
  }

  static trackJobPosting(jobId: number, category: string) {
    this.track('job_posted', {
      job_id: jobId,
      category,
    });
  }

  static trackJobApplication(jobId: number) {
    this.track('job_applied', {
      job_id: jobId,
    });
  }

  static trackTransactionError(error: string) {
    this.track('transaction_error', {
      error_type: error,
    });
  }

  private static track(event: string, data: any) {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', event, data);
    }

    // Custom analytics endpoint
    fetch('/api/v1/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, timestamp: Date.now() }),
    }).catch(console.error);
  }

  private static anonymize(address: string): string {
    return address.slice(0, 6) + '...' + address.slice(-4);
  }
}
```

---

## Centralized Logging

### ELK Stack Setup

#### Elasticsearch Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    ports:
      - "5044:5044"
      - "9600:9600"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

#### Logstash Pipeline

```ruby
# logstash/pipeline/logstash.conf
input {
  tcp {
    port => 5044
    codec => json
  }
}

filter {
  if [level] == "error" {
    mutate {
      add_tag => ["error"]
    }
  }

  if [context] == "ContractMonitor" {
    mutate {
      add_tag => ["contract"]
    }
  }

  grok {
    match => { "message" => "%{GREEDYDATA:parsed_message}" }
  }

  date {
    match => [ "timestamp", "ISO8601" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "wagob-logs-%{+YYYY.MM.dd}"
  }

  if "error" in [tags] {
    email {
      to => "ops@wagob.com"
      subject => "WajoB Error Alert"
      body => "Error detected: %{message}"
    }
  }
}
```

### Winston Logger Configuration

```typescript
// backend/src/config/logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-elasticsearch';

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  },
  index: 'wagob-logs',
};

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return `${timestamp} [${context || 'App'}] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        }),
      ),
    }),

    // File transports
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
      maxsize: 5242880,
      maxFiles: 5,
    }),

    // Elasticsearch transport (production only)
    ...(process.env.NODE_ENV === 'production'
      ? [new winston.transports.Elasticsearch(esTransportOpts)]
      : []),
  ],
});
```

### Structured Logging

```typescript
// backend/src/modules/jobs/jobs.service.ts
import { Logger } from '@nestjs/common';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  async create(jobData: CreateJobDto) {
    this.logger.log('Creating job', {
      userId: jobData.employerId,
      category: jobData.category,
      wages: jobData.wages,
    });

    try {
      const job = await this.repository.save(jobData);
      
      this.logger.log('Job created successfully', {
        jobId: job.id,
        blockchainId: job.blockchainId,
      });

      return job;
    } catch (error) {
      this.logger.error('Failed to create job', {
        error: error.message,
        stack: error.stack,
        userId: jobData.employerId,
      });
      throw error;
    }
  }
}
```

---

## Alerting Strategy

### Alert Severity Levels

1. **Critical**: Immediate action required (page on-call)
   - Contract balance < 10 TON
   - Error rate > 5%
   - System down

2. **High**: Action needed soon (notify within 15 min)
   - Gas usage spike > 2x
   - Slow queries > 5s
   - Multiple disputes

3. **Medium**: Investigate during business hours
   - Transaction volume spike
   - Increased cancellation rate
   - Performance degradation

4. **Low**: FYI, track over time
   - Minor anomalies
   - Informational events

### Alert Channels

```typescript
@Injectable()
export class AlertingService {
  async sendAlert(alert: Alert) {
    const { severity, message, data } = alert;

    // Critical alerts to multiple channels
    if (severity === 'critical') {
      await Promise.all([
        this.sendTelegram(message, data),
        this.sendEmail(message, data),
        this.sendPagerDuty(message, data),
      ]);
    }

    // High alerts to ops team
    else if (severity === 'high') {
      await Promise.all([
        this.sendTelegram(message, data),
        this.sendEmail(message, data),
      ]);
    }

    // Medium/Low alerts to logging only
    else {
      this.logger.warn(message, data);
    }
  }

  private async sendTelegram(message: string, data: any) {
    const opsChatId = this.config.get('TELEGRAM_OPS_CHAT_ID');
    await this.telegram.sendMessage(opsChatId, this.formatAlert(message, data));
  }

  private formatAlert(message: string, data: any): string {
    return `
🚨 *ALERT*

${message}

*Details:*
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

*Time:* ${new Date().toISOString()}
    `.trim();
  }
}
```

### Alert Rules

```yaml
# config/alert-rules.yml
rules:
  - name: contract_low_balance
    condition: contract.balance < 10
    severity: critical
    message: "Contract balance critically low"
    actions:
      - telegram
      - email
      - pagerduty

  - name: high_error_rate
    condition: error_rate > 0.05 && transaction_count > 10
    severity: critical
    message: "High error rate detected"
    actions:
      - telegram
      - email

  - name: gas_spike
    condition: current_gas > historical_avg_gas * 2
    severity: high
    message: "Gas usage spike detected"
    actions:
      - telegram

  - name: slow_query
    condition: query_time > 5000
    severity: medium
    message: "Slow database query"
    actions:
      - log

  - name: dispute_spike
    condition: dispute_count > 5 && time_window == "5m"
    severity: high
    message: "Multiple disputes reported"
    actions:
      - telegram
      - email
```

---

## Performance Metrics

### Key Performance Indicators (KPIs)

#### System Health
- **Uptime**: Target 99.9%
- **Response Time**: P95 < 500ms
- **Error Rate**: < 1%

#### Blockchain
- **Transaction Success Rate**: > 95%
- **Average Gas Cost**: Track trends
- **Confirmation Time**: < 30 seconds

#### Business
- **Daily Active Users**: Track growth
- **Jobs Created**: Track volume
- **Completion Rate**: > 80%
- **Average Rating**: > 4.0

### Metrics Collection

```typescript
@Injectable()
export class MetricsCollectorService {
  @Cron('*/1 * * * *') // Every minute
  async collectMetrics() {
    const metrics = {
      timestamp: new Date(),
      
      // System metrics
      activeConnections: await this.getActiveConnections(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      
      // Application metrics
      activeJobs: await this.jobsService.countActive(),
      pendingTransactions: await this.txService.countPending(),
      
      // Blockchain metrics
      contractBalances: await this.contractMonitor.getBalances(),
      recentTransactions: await this.getRecentTxCount(),
      
      // Business metrics
      dailyActiveUsers: await this.getUserCount(24),
      jobsCreatedToday: await this.getJobsCreated(24),
      completionRate: await this.calculateCompletionRate(),
    };

    await this.saveMetrics(metrics);
  }
}
```

---

## Incident Response

### Incident Severity Classification

**SEV 1 - Critical**
- Complete service outage
- Data loss
- Security breach
- Smart contract exploit

**SEV 2 - High**
- Partial service outage
- Major feature broken
- High error rates
- Performance severely degraded

**SEV 3 - Medium**
- Minor feature broken
- Degraded performance
- Some users affected

**SEV 4 - Low**
- Minor bugs
- Edge cases
- Cosmetic issues

### Response Procedures

```markdown
## SEV 1 Incident Response

1. **Immediate Actions** (0-5 minutes)
   - Page on-call engineer
   - Start incident channel
   - Assess impact
   - Begin mitigation

2. **Investigation** (5-30 minutes)
   - Gather logs and metrics
   - Identify root cause
   - Document timeline

3. **Mitigation** (30-60 minutes)
   - Implement fix or rollback
   - Verify resolution
   - Monitor stability

4. **Communication**
   - Update status page
   - Notify affected users
   - Internal updates every 30 min

5. **Post-Incident** (24-48 hours)
   - Write postmortem
   - Identify prevention measures
   - Create action items
```

### Incident Tracking

```typescript
interface Incident {
  id: string;
  severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  startedAt: Date;
  resolvedAt?: Date;
  impact: {
    usersAffected: number;
    servicesAffected: string[];
  };
  timeline: Array<{
    timestamp: Date;
    action: string;
    author: string;
  }>;
  rootCause?: string;
  resolution?: string;
  preventionMeasures?: string[];
}
```

---

## Dashboards

### Grafana Dashboards

#### Contract Health Dashboard

```json
{
  "dashboard": {
    "title": "Contract Health",
    "panels": [
      {
        "title": "Contract Balances",
        "type": "graph",
        "targets": [{
          "expr": "wagob_contract_balance_ton"
        }]
      },
      {
        "title": "Transaction Success Rate",
        "type": "stat",
        "targets": [{
          "expr": "rate(wagob_transactions_total{status=\"success\"}[5m])"
        }]
      },
      {
        "title": "Gas Usage",
        "type": "heatmap",
        "targets": [{
          "expr": "wagob_gas_usage_ton"
        }]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [{
          "expr": "rate(wagob_transactions_total{status=\"failure\"}[5m])"
        }]
      }
    ]
  }
}
```

#### Application Performance Dashboard

- Request rate (RPM)
- Response time (P50, P95, P99)
- Error rate
- Database query performance
- Cache hit rate
- Queue depth

#### Business Metrics Dashboard

- Daily Active Users (DAU)
- Jobs created/completed
- Escrow TVL
- Average transaction value
- User retention
- Reputation scores

---

## Tools and Setup

### Required Tools

1. **Sentry** - Error tracking and performance monitoring
2. **Elasticsearch + Kibana** - Centralized logging
3. **Grafana + Prometheus** - Metrics and dashboards
4. **PagerDuty** - On-call alerting (optional)
5. **Datadog** - All-in-one observability (alternative)

### Setup Instructions

#### 1. Install Monitoring Stack

```bash
# Clone monitoring configs
git clone https://github.com/wagob/monitoring-stack

# Start services
cd monitoring-stack
docker-compose up -d

# Access dashboards
# Kibana: http://localhost:5601
# Grafana: http://localhost:3000
# Prometheus: http://localhost:9090
```

#### 2. Configure Backend

```bash
# Set environment variables
export SENTRY_DSN=<your-sentry-dsn>
export ELASTICSEARCH_URL=http://localhost:9200
export TELEGRAM_OPS_CHAT_ID=<chat-id>

# Install dependencies
cd backend
npm install @sentry/node prom-client winston-elasticsearch

# Start with monitoring
npm run start:prod
```

#### 3. Configure Frontend

```bash
# Set environment variables
export REACT_APP_SENTRY_DSN=<your-sentry-dsn>
export REACT_APP_GA_ID=<google-analytics-id>

# Install dependencies
npm install @sentry/react

# Build with monitoring
npm run build
```

#### 4. Set Up Alerts

```bash
# Configure Grafana alerts
grafana-cli --config /etc/grafana/grafana.ini \
  admin reset-admin-password <new-password>

# Import alert rules
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @grafana/alert-rules.json
```

---

## Continuous Improvement

### Feedback Loop

1. **Monitor**: Collect metrics and logs
2. **Analyze**: Identify patterns and anomalies
3. **Alert**: Notify team of issues
4. **Respond**: Fix problems quickly
5. **Review**: Learn from incidents
6. **Improve**: Update systems and processes

### Regular Reviews

- **Daily**: Check dashboards, review alerts
- **Weekly**: Analyze trends, review incidents
- **Monthly**: Update alert rules, optimize monitoring
- **Quarterly**: Review SLOs, plan improvements

---

**Next: See `CONTRACT_VERSIONING.md` for contract upgrade and migration strategies**
