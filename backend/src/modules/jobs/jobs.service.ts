import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Job, JobStatus } from '@/entities/jobs/job.entity';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly CACHE_TTL = 300000; // 5 minutes in milliseconds
  private readonly CACHE_PREFIX = 'jobs';

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  /**
   * Find all jobs with optional filtering by status and category
   * Results are cached for 5 minutes
   */
  async findAll(status?: JobStatus, category?: string) {
    const cacheKey = `${this.CACHE_PREFIX}:all:${status || 'all'}:${category || 'all'}`;
    
    try {
      // Check cache first
      const cached = await this.cacheManager.get<Job[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return cached;
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);

      // Build query conditions
      const whereConditions: any = {};
      if (status) whereConditions.status = status;
      if (category) whereConditions.category = category;

      // Query database
      const jobs = await this.jobRepository.find({
        where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
        relations: ['employer', 'worker', 'escrow'],
        order: { createdAt: 'DESC' },
      });

      // Cache the results
      await this.cacheManager.set(cacheKey, jobs, this.CACHE_TTL);
      
      return jobs;
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`, error.stack);
      
      // Fallback to database on cache error
      const whereConditions: any = {};
      if (status) whereConditions.status = status;
      if (category) whereConditions.category = category;

      return this.jobRepository.find({
        where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
        relations: ['employer', 'worker', 'escrow'],
        order: { createdAt: 'DESC' },
      });
    }
  }

  /**
   * Find a single job by ID
   * Results are cached for 5 minutes
   */
  async findOne(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}:id:${id}`;
    
    try {
      // Check cache first
      const cached = await this.cacheManager.get<Job>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return cached;
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);

      // Query database
      const job = await this.jobRepository.findOne({
        where: { id },
        relations: ['employer', 'worker', 'escrow'],
      });

      if (job) {
        // Cache the result
        await this.cacheManager.set(cacheKey, job, this.CACHE_TTL);
      }
      
      return job;
    } catch (error) {
      this.logger.error(`Error in findOne: ${error.message}`, error.stack);
      
      // Fallback to database on cache error
      return this.jobRepository.findOne({
        where: { id },
        relations: ['employer', 'worker', 'escrow'],
      });
    }
  }

  /**
   * Find jobs by blockchain ID (from smart contract)
   */
  async findByBlockchainId(blockchainId: number): Promise<Job | null> {
    const cacheKey = `${this.CACHE_PREFIX}:blockchain:${blockchainId}`;
    
    try {
      const cached = await this.cacheManager.get<Job>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for blockchain ID: ${blockchainId}`);
        return cached;
      }

      const job = await this.jobRepository.findOne({
        where: { blockchainId },
        relations: ['employer', 'worker', 'escrow'],
      });

      if (job) {
        await this.cacheManager.set(cacheKey, job, this.CACHE_TTL);
      }
      
      return job;
    } catch (error) {
      this.logger.error(`Error finding job by blockchain ID: ${error.message}`);
      return this.jobRepository.findOne({
        where: { blockchainId },
        relations: ['employer', 'worker', 'escrow'],
      });
    }
  }

  /**
   * Create a new job and invalidate relevant caches
   */
  async create(jobData: Partial<Job>) {
    const job = this.jobRepository.create(jobData);
    const savedJob = await this.jobRepository.save(job);
    
    // Invalidate all list caches
    await this.invalidateListCaches(savedJob);
    
    this.logger.log(`Job created: ${savedJob.id}`);
    return savedJob;
  }

  /**
   * Update a job and invalidate relevant caches
   */
  async update(id: string, jobData: Partial<Job>) {
    await this.jobRepository.update(id, jobData);
    const updatedJob = await this.jobRepository.findOne({
      where: { id },
      relations: ['employer', 'worker', 'escrow'],
    });
    
    if (updatedJob) {
      // Invalidate specific job cache
      await this.cacheManager.del(`${this.CACHE_PREFIX}:id:${id}`);
      
      // Invalidate blockchain ID cache if present
      if (updatedJob.blockchainId) {
        await this.cacheManager.del(`${this.CACHE_PREFIX}:blockchain:${updatedJob.blockchainId}`);
      }
      
      // Invalidate all list caches
      await this.invalidateListCaches(updatedJob);
      
      this.logger.log(`Job updated: ${id}`);
    }
    
    return updatedJob;
  }

  /**
   * Delete a job and invalidate relevant caches
   */
  async delete(id: string) {
    const job = await this.findOne(id);
    
    if (job) {
      await this.jobRepository.delete(id);
      
      // Invalidate specific job cache
      await this.cacheManager.del(`${this.CACHE_PREFIX}:id:${id}`);
      
      // Invalidate blockchain ID cache if present
      if (job.blockchainId) {
        await this.cacheManager.del(`${this.CACHE_PREFIX}:blockchain:${job.blockchainId}`);
      }
      
      // Invalidate all list caches
      await this.invalidateListCaches(job);
      
      this.logger.log(`Job deleted: ${id}`);
    }
    
    return job;
  }

  /**
   * Invalidate all list caches that might include this job
   */
  private async invalidateListCaches(job: Job) {
    try {
      // Invalidate general list cache
      await this.cacheManager.del(`${this.CACHE_PREFIX}:all:all:all`);
      
      // Invalidate status-specific caches
      if (job.status) {
        await this.cacheManager.del(`${this.CACHE_PREFIX}:all:${job.status}:all`);
      }
      
      // Invalidate category-specific caches
      if (job.category) {
        await this.cacheManager.del(`${this.CACHE_PREFIX}:all:all:${job.category}`);
      }
      
      // Invalidate status + category cache
      if (job.status && job.category) {
        await this.cacheManager.del(`${this.CACHE_PREFIX}:all:${job.status}:${job.category}`);
      }
      
      this.logger.debug(`Invalidated list caches for job status: ${job.status}, category: ${job.category}`);
    } catch (error) {
      this.logger.error(`Error invalidating caches: ${error.message}`);
    }
  }
}
