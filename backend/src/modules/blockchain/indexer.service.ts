import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Job, JobStatus } from '@/entities/jobs/job.entity';
import { Escrow, EscrowStatus } from '@/entities/escrow/escrow.entity';
import { Reputation } from '@/entities/reputation/reputation.entity';
import { TonClientService } from './ton-client.service';

/**
 * Blockchain Indexer Service
 * 
 * Periodically queries TON smart contracts and syncs data to PostgreSQL
 * Handles:
 * - Job creation, updates, assignments
 * - Escrow funding, locking, releases
 * - Reputation submissions
 */
@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);
  private isIndexing = false;
  private lastIndexedBlock = 0;

  constructor(
    private tonClient: TonClientService,
    private configService: ConfigService,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  /**
   * Main indexing cron job
   * Runs every 10 seconds (configurable via TON_INDEXER_INTERVAL)
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async indexBlockchainData() {
    if (this.isIndexing) {
      this.logger.debug('Indexing already in progress, skipping...');
      return;
    }

    try {
      this.isIndexing = true;
      this.logger.debug('Starting blockchain indexing...');

      // Index each contract
      await this.indexJobRegistry();
      await this.indexEscrowContract();
      await this.indexReputationContract();

      this.logger.debug('Blockchain indexing completed');
    } catch (error) {
      this.logger.error(`Indexing failed: ${error.message}`, error.stack);
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Index JobRegistry contract
   */
  private async indexJobRegistry() {
    try {
      const contractAddress = this.tonClient.getJobRegistryAddress();
      if (!contractAddress) {
        this.logger.warn('JobRegistry contract address not configured');
        return;
      }

      // Get recent transactions
      const transactions = await this.tonClient.getTransactions(
        contractAddress,
        20,
      );

      for (const tx of transactions) {
        const parsed = this.tonClient.parseTransaction(tx);
        if (!parsed || !parsed.inMessage) continue;

        const { op, value } = parsed.inMessage;

        // Op codes from frontend hooks
        switch (op) {
          case '0x7362d09c': // create_job
            await this.handleJobCreation(parsed);
            break;
          case '0x5fcc3d14': // update_job_status
            await this.handleJobStatusUpdate(parsed);
            break;
          case '0x235caf52': // assign_worker
            await this.handleWorkerAssignment(parsed);
            break;
          default:
            this.logger.debug(`Unknown op code: ${op}`);
        }
      }
    } catch (error) {
      this.logger.error(`JobRegistry indexing failed: ${error.message}`);
    }
  }

  /**
   * Index Escrow contract
   */
  private async indexEscrowContract() {
    try {
      const contractAddress = this.tonClient.getEscrowAddress();
      if (!contractAddress) {
        this.logger.warn('Escrow contract address not configured');
        return;
      }

      const transactions = await this.tonClient.getTransactions(
        contractAddress,
        20,
      );

      for (const tx of transactions) {
        const parsed = this.tonClient.parseTransaction(tx);
        if (!parsed || !parsed.inMessage) continue;

        const { op } = parsed.inMessage;

        switch (op) {
          case '0x8f4a33db': // create_escrow
            await this.handleEscrowCreation(parsed);
            break;
          case '0x2fcb26a8': // fund_escrow
            await this.handleEscrowFunding(parsed);
            break;
          case '0x5de7c0ab': // lock_escrow
            await this.handleEscrowLock(parsed);
            break;
          case '0x6a8d4f12': // confirm_completion
            await this.handleEscrowCompletion(parsed);
            break;
          case '0x7b3e5c91': // raise_dispute
            await this.handleEscrowDispute(parsed);
            break;
        }
      }
    } catch (error) {
      this.logger.error(`Escrow indexing failed: ${error.message}`);
    }
  }

  /**
   * Index Reputation contract
   */
  private async indexReputationContract() {
    try {
      const contractAddress = this.tonClient.getReputationAddress();
      if (!contractAddress) {
        this.logger.warn('Reputation contract address not configured');
        return;
      }

      const transactions = await this.tonClient.getTransactions(
        contractAddress,
        20,
      );

      for (const tx of transactions) {
        const parsed = this.tonClient.parseTransaction(tx);
        if (!parsed || !parsed.inMessage) continue;

        const { op } = parsed.inMessage;

        if (op === '0x9e6f2a84') {
          // submit_rating
          await this.handleReputationSubmission(parsed);
        }
      }
    } catch (error) {
      this.logger.error(`Reputation indexing failed: ${error.message}`);
    }
  }

  /**
   * Event handlers
   */
  private async handleJobCreation(parsed: any) {
    this.logger.log('Processing job creation...');
    // TODO: Parse transaction body and create job in database
    // Extract: title, description, location, wages, duration, category
  }

  private async handleJobStatusUpdate(parsed: any) {
    this.logger.log('Processing job status update...');
    // TODO: Update job status in database
  }

  private async handleWorkerAssignment(parsed: any) {
    this.logger.log('Processing worker assignment...');
    // TODO: Assign worker to job in database
  }

  private async handleEscrowCreation(parsed: any) {
    this.logger.log('Processing escrow creation...');
    // TODO: Create escrow record in database
  }

  private async handleEscrowFunding(parsed: any) {
    this.logger.log('Processing escrow funding...');
    // TODO: Update escrow status to FUNDED
  }

  private async handleEscrowLock(parsed: any) {
    this.logger.log('Processing escrow lock...');
    // TODO: Update escrow status to LOCKED
  }

  private async handleEscrowCompletion(parsed: any) {
    this.logger.log('Processing escrow completion...');
    // TODO: Update escrow status to COMPLETED
  }

  private async handleEscrowDispute(parsed: any) {
    this.logger.log('Processing escrow dispute...');
    // TODO: Update escrow status to DISPUTED
  }

  private async handleReputationSubmission(parsed: any) {
    this.logger.log('Processing reputation submission...');
    // TODO: Create reputation record and update user scores
  }

  /**
   * Manual trigger for testing
   */
  async triggerManualSync() {
    this.logger.log('Manual sync triggered');
    await this.indexBlockchainData();
  }

  /**
   * Get indexing status
   */
  getStatus() {
    return {
      isIndexing: this.isIndexing,
      lastIndexedBlock: this.lastIndexedBlock,
      network: this.configService.get('TON_NETWORK'),
    };
  }
}
