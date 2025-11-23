import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Job, JobStatus } from '@/entities/jobs/job.entity';
import { Escrow, EscrowStatus } from '@/entities/escrow/escrow.entity';
import { Reputation } from '@/entities/reputation/reputation.entity';
import { User } from '@/entities/users/user.entity';
import { NotificationType } from '@/entities/notifications/notification.entity';
import { TonClientService } from './ton-client.service';
import { TelegramService } from '../telegram/telegram.service';
import { Address, Cell } from '@ton/core';

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
    private telegramService: TelegramService,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Escrow)
    private escrowRepository: Repository<Escrow>,
    @InjectRepository(Reputation)
    private reputationRepository: Repository<Reputation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    try {
      this.logger.log('Processing job creation...');
      
      const { inMessage, transaction } = parsed;
      if (!inMessage?.body) {
        this.logger.warn('No message body found for job creation');
        return;
      }

      // Parse blockchain data from transaction
      const cell = Cell.fromBase64(inMessage.body);
      const slice = cell.beginParse();
      
      // Skip op code (32 bits)
      slice.loadUint(32);
      
      // Extract job data (structure depends on smart contract)
      const blockchainId = slice.loadUint(64); // Job ID from contract
      const employerAddress = Address.parse(inMessage.source.toString());
      
      // Find or create employer user
      let employer = await this.userRepository.findOne({
        where: { walletAddress: employerAddress.toString() },
      });

      if (!employer) {
        this.logger.warn(`Employer not found for address: ${employerAddress.toString()}`);
        // Create placeholder user (will be updated when they connect Telegram)
        employer = this.userRepository.create({
          walletAddress: employerAddress.toString(),
          telegramId: 0, // Placeholder
        });
        await this.userRepository.save(employer);
      }

      // Check if job already exists (prevent duplicates)
      const existingJob = await this.jobRepository.findOne({
        where: { blockchainId: Number(blockchainId) },
      });

      if (existingJob) {
        this.logger.debug(`Job already indexed: ${blockchainId}`);
        return;
      }

      // Create job record
      const job = this.jobRepository.create({
        blockchainId: Number(blockchainId),
        employerId: employer.id,
        status: JobStatus.POSTED,
        transactionHash: transaction.hash,
        // Note: Full job details (title, description, etc.) should be stored 
        // off-chain via API when user creates job in frontend
        // This handler just confirms on-chain creation
      });

      await this.jobRepository.save(job);
      
      // Update employer stats
      employer.jobsPosted += 1;
      await this.userRepository.save(employer);

      this.logger.log(`Job created in DB: ${job.id}, blockchain ID: ${blockchainId}`);

      // Send notification to employer
      if (employer.telegramId && employer.notificationsEnabled) {
        await this.telegramService.sendNotification(
          employer.telegramId,
          NotificationType.JOB_POSTED,
          'Job Posted Successfully',
          `✅ Your job has been posted on the blockchain!\n\nJob ID: ${blockchainId}\nTransaction: ${transaction.hash}`,
          { jobId: Number(blockchainId), transactionHash: transaction.hash },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle job creation: ${error.message}`, error.stack);
    }
  }

  private async handleJobStatusUpdate(parsed: any) {
    try {
      this.logger.log('Processing job status update...');
      
      const { inMessage, transaction } = parsed;
      if (!inMessage?.body) return;

      const cell = Cell.fromBase64(inMessage.body);
      const slice = cell.beginParse();
      
      slice.loadUint(32); // Skip op code
      const jobId = slice.loadUint(64);
      const newStatus = slice.loadUint(8); // Status enum from contract

      // Map contract status to our enum
      const statusMap: { [key: number]: JobStatus } = {
        0: JobStatus.POSTED,
        1: JobStatus.IN_PROGRESS,
        2: JobStatus.COMPLETED,
        3: JobStatus.CANCELLED,
      };

      const job = await this.jobRepository.findOne({
        where: { blockchainId: Number(jobId) },
        relations: ['employer', 'worker'],
      });

      if (!job) {
        this.logger.warn(`Job not found: ${jobId}`);
        return;
      }

      const oldStatus = job.status;
      job.status = statusMap[newStatus] || JobStatus.POSTED;
      await this.jobRepository.save(job);

      this.logger.log(`Job ${jobId} status updated: ${oldStatus} -> ${job.status}`);

      // Notify relevant parties
      if (job.employer?.telegramId && job.employer.notificationsEnabled) {
        await this.telegramService.sendNotification(
          job.employer.telegramId,
          NotificationType.JOB_STARTED, // Maps to job status changes
          'Job Status Updated',
          `📋 Job status updated to: ${job.status}\nJob ID: ${jobId}`,
          { jobId: Number(jobId), oldStatus, newStatus: job.status },
        );
      }

      if (job.worker?.telegramId && job.worker.notificationsEnabled) {
        await this.telegramService.sendNotification(
          job.worker.telegramId,
          NotificationType.JOB_STARTED,
          'Job Status Updated',
          `📋 Job status updated to: ${job.status}\nJob ID: ${jobId}`,
          { jobId: Number(jobId), oldStatus, newStatus: job.status },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle job status update: ${error.message}`, error.stack);
    }
  }

  private async handleWorkerAssignment(parsed: any) {
    try {
      this.logger.log('Processing worker assignment...');
      
      const { inMessage, transaction } = parsed;
      if (!inMessage?.body) return;

      const cell = Cell.fromBase64(inMessage.body);
      const slice = cell.beginParse();
      
      slice.loadUint(32); // Skip op code
      const jobId = slice.loadUint(64);
      const workerAddress = slice.loadAddress();

      const job = await this.jobRepository.findOne({
        where: { blockchainId: Number(jobId) },
        relations: ['employer'],
      });

      if (!job) {
        this.logger.warn(`Job not found for assignment: ${jobId}`);
        return;
      }

      // Find or create worker
      let worker = await this.userRepository.findOne({
        where: { walletAddress: workerAddress.toString() },
      });

      if (!worker) {
        worker = this.userRepository.create({
          walletAddress: workerAddress.toString(),
          telegramId: 0, // Placeholder
        });
        await this.userRepository.save(worker);
      }

      job.workerId = worker.id;
      job.status = JobStatus.IN_PROGRESS;
      await this.jobRepository.save(job);

      this.logger.log(`Worker ${workerAddress.toString()} assigned to job ${jobId}`);

      // Notify employer
      if (job.employer?.telegramId && job.employer.notificationsEnabled) {
        await this.telegramService.sendNotification(
          job.employer.telegramId,
          NotificationType.JOB_ASSIGNED,
          'Worker Assigned',
          `👷 A worker has been assigned to your job!\n\nJob ID: ${jobId}\nWorker: ${workerAddress.toString().slice(0, 8)}...`,
          { jobId: Number(jobId), workerAddress: workerAddress.toString() },
        );
      }

      // Notify worker
      if (worker.telegramId && worker.notificationsEnabled) {
        await this.telegramService.sendNotification(
          worker.telegramId,
          NotificationType.JOB_ASSIGNED,
          'Job Assigned to You',
          `✅ You've been assigned to a job!\n\nJob ID: ${jobId}\nGood luck! 💪`,
          { jobId: Number(jobId) },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle worker assignment: ${error.message}`, error.stack);
    }
  }

  private async handleEscrowCreation(parsed: any) {
    try {
      this.logger.log('Processing escrow creation...');
      
      const { inMessage, transaction } = parsed;
      if (!inMessage?.body) return;

      const cell = Cell.fromBase64(inMessage.body);
      const slice = cell.beginParse();
      
      slice.loadUint(32); // Skip op code
      const jobId = slice.loadUint(64);
      const amount = slice.loadCoins(); // Amount in nanoton

      const job = await this.jobRepository.findOne({
        where: { blockchainId: Number(jobId) },
        relations: ['employer', 'worker'],
      });

      if (!job) {
        this.logger.warn(`Job not found for escrow creation: ${jobId}`);
        return;
      }

      // Check if escrow already exists
      const existingEscrow = await this.escrowRepository.findOne({
        where: { jobId: job.id },
      });

      if (existingEscrow) {
        this.logger.debug(`Escrow already exists for job: ${job.id}`);
        return;
      }

      // Create escrow
      const escrow = this.escrowRepository.create({
        blockchainId: Number(jobId),
        jobId: job.id,
        employerId: job.employerId,
        workerId: job.workerId,
        amount: Number(amount) / 1e9, // Convert nanoton to TON
        status: EscrowStatus.CREATED,
        transactionHash: transaction.hash,
      });

      await this.escrowRepository.save(escrow);

      this.logger.log(`Escrow created for job ${jobId}, amount: ${escrow.amount} TON`);

      // Notify employer
      if (job.employer?.telegramId && job.employer.notificationsEnabled) {
        await this.telegramService.sendNotification(
          job.employer.telegramId,
          NotificationType.ESCROW_CREATED,
          'Escrow Created',
          `🔒 Escrow created for your job!\n\nAmount: ${escrow.amount} TON\nJob ID: ${jobId}`,
          { jobId: Number(jobId), amount: escrow.amount },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle escrow creation: ${error.message}`, error.stack);
    }
  }

  private async handleEscrowFunding(parsed: any) {
    try {
      this.logger.log('Processing escrow funding...');
      
      const { inMessage, transaction } = parsed;
      if (!inMessage?.body) return;

      const cell = Cell.fromBase64(inMessage.body);
      const slice = cell.beginParse();
      
      slice.loadUint(32);
      const jobId = slice.loadUint(64);

      const escrow = await this.escrowRepository.findOne({
        where: { blockchainId: Number(jobId) },
        relations: ['employer', 'worker', 'job'],
      });

      if (!escrow) {
        this.logger.warn(`Escrow not found: ${jobId}`);
        return;
      }

      escrow.status = EscrowStatus.FUNDED;
      escrow.fundedAt = new Date();
      await this.escrowRepository.save(escrow);

      this.logger.log(`Escrow funded for job ${jobId}`);

      // Notify employer
      if (escrow.employer?.telegramId && escrow.employer.notificationsEnabled) {
        await this.telegramService.sendNotification(
          escrow.employer.telegramId,
          NotificationType.ESCROW_FUNDED,
          'Escrow Funded',
          `💰 Escrow has been funded!\n\nAmount: ${escrow.amount} TON\nJob ID: ${jobId}`,
          { jobId: Number(jobId), amount: escrow.amount },
        );
      }

      // Notify worker
      if (escrow.worker?.telegramId && escrow.worker.notificationsEnabled) {
        await this.telegramService.sendNotification(
          escrow.worker.telegramId,
          NotificationType.ESCROW_FUNDED,
          'Payment Secured',
          `✅ Payment secured in escrow!\n\nAmount: ${escrow.amount} TON\nJob ID: ${jobId}\n\nYou can start working now! 🚀`,
          { jobId: Number(jobId), amount: escrow.amount },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle escrow funding: ${error.message}`, error.stack);
    }
  }

  private async handleEscrowLock(parsed: any) {
    try {
      this.logger.log('Processing escrow lock...');
      
      const { inMessage } = parsed;
      if (!inMessage?.body) return;

      const cell = Cell.fromBase64(inMessage.body);
      const slice = cell.beginParse();
      
      slice.loadUint(32);
      const jobId = slice.loadUint(64);

      const escrow = await this.escrowRepository.findOne({
        where: { blockchainId: Number(jobId) },
        relations: ['employer', 'worker'],
      });

      if (!escrow) {
        this.logger.warn(`Escrow not found: ${jobId}`);
        return;
      }

      escrow.status = EscrowStatus.LOCKED;
      escrow.lockedAt = new Date();
      await this.escrowRepository.save(escrow);

      this.logger.log(`Escrow locked for job ${jobId}`);

      // Notify both parties
      const message = `🔒 Escrow has been locked.\n\nBoth parties must confirm job completion to release payment.\nJob ID: ${jobId}`;

      if (escrow.employer?.telegramId && escrow.employer.notificationsEnabled) {
        await this.telegramService.sendNotification(
          escrow.employer.telegramId,
          NotificationType.ESCROW_LOCKED,
          'Escrow Locked',
          message,
          { jobId: Number(jobId) },
        );
      }

      if (escrow.worker?.telegramId && escrow.worker.notificationsEnabled) {
        await this.telegramService.sendNotification(
          escrow.worker.telegramId,
          NotificationType.ESCROW_LOCKED,
          'Escrow Locked',
          message,
          { jobId: Number(jobId) },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle escrow lock: ${error.message}`, error.stack);
    }
  }

  private async handleEscrowCompletion(parsed: any) {
    try {
      this.logger.log('Processing escrow completion...');
      
      const { inMessage } = parsed;
      if (!inMessage?.body) return;

      const cell = Cell.fromBase64(inMessage.body);
      const slice = cell.beginParse();
      
      slice.loadUint(32);
      const jobId = slice.loadUint(64);

      const escrow = await this.escrowRepository.findOne({
        where: { blockchainId: Number(jobId) },
        relations: ['employer', 'worker', 'job'],
      });

      if (!escrow) {
        this.logger.warn(`Escrow not found: ${jobId}`);
        return;
      }

      escrow.status = EscrowStatus.COMPLETED;
      escrow.completedAt = new Date();
      await this.escrowRepository.save(escrow);

      // Update job status
      if (escrow.job) {
        escrow.job.status = JobStatus.COMPLETED;
        await this.jobRepository.save(escrow.job);
      }

      // Update worker stats
      if (escrow.worker) {
        escrow.worker.jobsCompleted += 1;
        await this.userRepository.save(escrow.worker);
      }

      this.logger.log(`Escrow completed for job ${jobId}, payment released`);

      // Notify employer
      if (escrow.employer?.telegramId && escrow.employer.notificationsEnabled) {
        await this.telegramService.sendNotification(
          escrow.employer.telegramId,
          NotificationType.JOB_COMPLETED,
          'Job Completed',
          `✅ Job completed!\n\nPayment of ${escrow.amount} TON has been released to the worker.\nJob ID: ${jobId}\n\nPlease rate the worker! ⭐`,
          { jobId: Number(jobId), amount: escrow.amount },
        );
      }

      // Notify worker
      if (escrow.worker?.telegramId && escrow.worker.notificationsEnabled) {
        await this.telegramService.sendNotification(
          escrow.worker.telegramId,
          NotificationType.PAYMENT_RECEIVED,
          'Payment Received',
          `🎉 Congratulations!\n\nYou've received ${escrow.amount} TON for completing the job!\nJob ID: ${jobId}\n\nPlease rate the employer! ⭐`,
          { jobId: Number(jobId), amount: escrow.amount },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle escrow completion: ${error.message}`, error.stack);
    }
  }

  private async handleEscrowDispute(parsed: any) {
    try {
      this.logger.log('Processing escrow dispute...');
      
      const { inMessage } = parsed;
      if (!inMessage?.body) return;

      const cell = Cell.fromBase64(inMessage.body);
      const slice = cell.beginParse();
      
      slice.loadUint(32);
      const jobId = slice.loadUint(64);

      const escrow = await this.escrowRepository.findOne({
        where: { blockchainId: Number(jobId) },
        relations: ['employer', 'worker'],
      });

      if (!escrow) {
        this.logger.warn(`Escrow not found: ${jobId}`);
        return;
      }

      escrow.status = EscrowStatus.DISPUTED;
      escrow.isDisputed = true;
      escrow.disputedAt = new Date();
      await this.escrowRepository.save(escrow);

      this.logger.log(`Escrow dispute raised for job ${jobId}`);

      // Notify both parties
      const message = `⚠️ A dispute has been raised for this escrow.\n\nJob ID: ${jobId}\nAmount: ${escrow.amount} TON\n\nPlease contact support for resolution.`;

      if (escrow.employer?.telegramId && escrow.employer.notificationsEnabled) {
        await this.telegramService.sendNotification(
          escrow.employer.telegramId,
          NotificationType.DISPUTE_RAISED,
          'Dispute Raised',
          message,
          { jobId: Number(jobId), amount: escrow.amount },
        );
      }

      if (escrow.worker?.telegramId && escrow.worker.notificationsEnabled) {
        await this.telegramService.sendNotification(
          escrow.worker.telegramId,
          NotificationType.DISPUTE_RAISED,
          'Dispute Raised',
          message,
          { jobId: Number(jobId), amount: escrow.amount },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle escrow dispute: ${error.message}`, error.stack);
    }
  }

  private async handleReputationSubmission(parsed: any) {
    try {
      this.logger.log('Processing reputation submission...');
      
      const { inMessage, transaction } = parsed;
      if (!inMessage?.body) return;

      const cell = Cell.fromBase64(inMessage.body);
      const slice = cell.beginParse();
      
      slice.loadUint(32); // Skip op code
      const jobId = slice.loadUint(64);
      const rating = slice.loadUint(8); // Rating 1-5
      const raterAddress = Address.parse(inMessage.source.toString());

      // Find job
      const job = await this.jobRepository.findOne({
        where: { blockchainId: Number(jobId) },
        relations: ['employer', 'worker'],
      });

      if (!job) {
        this.logger.warn(`Job not found for reputation: ${jobId}`);
        return;
      }

      // Find rater
      const rater = await this.userRepository.findOne({
        where: { walletAddress: raterAddress.toString() },
      });

      if (!rater) {
        this.logger.warn(`Rater not found: ${raterAddress.toString()}`);
        return;
      }

      // Determine who is being rated
      const isEmployerRating = rater.id === job.employerId;
      const rateeId = isEmployerRating ? job.workerId : job.employerId;

      if (!rateeId) {
        this.logger.warn(`Cannot determine ratee for job ${jobId}`);
        return;
      }

      // Check for duplicate rating
      const existing = await this.reputationRepository.findOne({
        where: { jobId: job.id, raterId: rater.id },
      });

      if (existing) {
        this.logger.debug(`Rating already exists for job ${job.id} from ${rater.id}`);
        return;
      }

      // Create reputation record
      const reputation = this.reputationRepository.create({
        blockchainId: Number(jobId),
        jobId: job.id,
        raterId: rater.id,
        rateeId: rateeId,
        rating: rating,
        transactionHash: transaction.hash,
      });

      await this.reputationRepository.save(reputation);

      // Update ratee's reputation score
      const ratee = await this.userRepository.findOne({ where: { id: rateeId } });
      if (ratee) {
        const allRatings = await this.reputationRepository.find({
          where: { rateeId: ratee.id },
        });

        const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
        ratee.reputationScore = totalRating / allRatings.length;
        ratee.totalRatings = allRatings.length;
        await this.userRepository.save(ratee);
      }

      this.logger.log(`Reputation submitted for job ${jobId}: ${rating}/5 stars`);

      // Notify the person being rated
      if (ratee?.telegramId && ratee.notificationsEnabled) {
        const stars = '⭐'.repeat(rating);
        await this.telegramService.sendNotification(
          ratee.telegramId,
          NotificationType.REPUTATION_RECEIVED,
          'New Rating Received',
          `⭐ You received a new rating!\n\nRating: ${stars} (${rating}/5)\nJob ID: ${jobId}\n\nNew average: ${ratee.reputationScore.toFixed(2)}/5`,
          { jobId: Number(jobId), rating, averageScore: ratee.reputationScore },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle reputation submission: ${error.message}`, error.stack);
    }
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
