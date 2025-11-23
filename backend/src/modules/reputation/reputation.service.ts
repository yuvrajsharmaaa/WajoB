import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Reputation } from '@/entities/reputation/reputation.entity';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);
  private readonly CACHE_TTL = 600000; // 10 minutes (reputation changes less frequently)
  private readonly CACHE_PREFIX = 'reputation';

  constructor(
    @InjectRepository(Reputation)
    private reputationRepository: Repository<Reputation>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  /**
   * Find all reputation records
   * Cached for 10 minutes
   */
  async findAll() {
    const cacheKey = `${this.CACHE_PREFIX}:all`;
    
    try {
      const cached = await this.cacheManager.get<Reputation[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for all reputations`);
        return cached;
      }

      const reputations = await this.reputationRepository.find({
        relations: ['job', 'rater', 'ratee'],
      });

      await this.cacheManager.set(cacheKey, reputations, this.CACHE_TTL);
      return reputations;
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`);
      return this.reputationRepository.find({
        relations: ['job', 'rater', 'ratee'],
      });
    }
  }

  /**
   * Find a single reputation record by ID
   * Cached for 10 minutes
   */
  async findOne(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}:id:${id}`;
    
    try {
      const cached = await this.cacheManager.get<Reputation>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for reputation: ${id}`);
        return cached;
      }

      const reputation = await this.reputationRepository.findOne({
        where: { id },
        relations: ['job', 'rater', 'ratee'],
      });

      if (reputation) {
        await this.cacheManager.set(cacheKey, reputation, this.CACHE_TTL);
      }

      return reputation;
    } catch (error) {
      this.logger.error(`Error in findOne: ${error.message}`);
      return this.reputationRepository.findOne({
        where: { id },
        relations: ['job', 'rater', 'ratee'],
      });
    }
  }

  /**
   * Find all reputation records for a specific user (as ratee)
   * This is used to display a user's reputation score
   * Cached for 10 minutes
   */
  async findByUserId(userId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:user:${userId}`;
    
    try {
      const cached = await this.cacheManager.get<Reputation[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for user reputations: ${userId}`);
        return cached;
      }

      const reputations = await this.reputationRepository.find({
        where: { rateeId: userId },
        relations: ['rater', 'job'],
        order: { createdAt: 'DESC' },
      });

      await this.cacheManager.set(cacheKey, reputations, this.CACHE_TTL);
      return reputations;
    } catch (error) {
      this.logger.error(`Error in findByUserId: ${error.message}`);
      return this.reputationRepository.find({
        where: { rateeId: userId },
        relations: ['rater', 'job'],
        order: { createdAt: 'DESC' },
      });
    }
  }

  /**
   * Find all reputation records for a specific job
   * Cached for 10 minutes
   */
  async findByJobId(jobId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:job:${jobId}`;
    
    try {
      const cached = await this.cacheManager.get<Reputation[]>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for job reputations: ${jobId}`);
        return cached;
      }

      const reputations = await this.reputationRepository.find({
        where: { jobId },
        relations: ['rater', 'ratee'],
        order: { createdAt: 'DESC' },
      });

      await this.cacheManager.set(cacheKey, reputations, this.CACHE_TTL);
      return reputations;
    } catch (error) {
      this.logger.error(`Error in findByJobId: ${error.message}`);
      return this.reputationRepository.find({
        where: { jobId },
        relations: ['rater', 'ratee'],
        order: { createdAt: 'DESC' },
      });
    }
  }

  /**
   * Calculate average reputation score for a user
   * Cached for 10 minutes
   */
  async calculateUserScore(userId: string): Promise<number> {
    const cacheKey = `${this.CACHE_PREFIX}:score:${userId}`;
    
    try {
      const cached = await this.cacheManager.get<number>(cacheKey);
      if (cached !== null && cached !== undefined) {
        this.logger.debug(`Cache hit for user score: ${userId}`);
        return cached;
      }

      const reputations = await this.reputationRepository.find({
        where: { rateeId: userId },
      });

      if (reputations.length === 0) {
        return 0;
      }

      const totalScore = reputations.reduce((sum, rep) => sum + rep.rating, 0);
      const averageScore = totalScore / reputations.length;

      await this.cacheManager.set(cacheKey, averageScore, this.CACHE_TTL);
      return averageScore;
    } catch (error) {
      this.logger.error(`Error calculating user score: ${error.message}`);
      
      // Fallback calculation
      const reputations = await this.reputationRepository.find({
        where: { rateeId: userId },
      });

      if (reputations.length === 0) return 0;
      
      const totalScore = reputations.reduce((sum, rep) => sum + rep.rating, 0);
      return totalScore / reputations.length;
    }
  }

  /**
   * Create a new reputation record and invalidate relevant caches
   */
  async create(reputationData: Partial<Reputation>) {
    const reputation = this.reputationRepository.create(reputationData);
    const savedReputation = await this.reputationRepository.save(reputation);
    
    // Invalidate caches
    await this.invalidateCaches(savedReputation);
    
    this.logger.log(`Reputation created for user: ${savedReputation.rateeId}`);
    return savedReputation;
  }

  /**
   * Update a reputation record and invalidate relevant caches
   */
  async update(id: string, reputationData: Partial<Reputation>) {
    await this.reputationRepository.update(id, reputationData);
    const updatedReputation = await this.reputationRepository.findOne({
      where: { id },
      relations: ['job', 'rater', 'ratee'],
    });
    
    if (updatedReputation) {
      await this.invalidateCaches(updatedReputation);
      this.logger.log(`Reputation updated: ${id}`);
    }
    
    return updatedReputation;
  }

  /**
   * Delete a reputation record and invalidate relevant caches
   */
  async delete(id: string) {
    const reputation = await this.findOne(id);
    
    if (reputation) {
      await this.reputationRepository.delete(id);
      await this.invalidateCaches(reputation);
      this.logger.log(`Reputation deleted: ${id}`);
    }
    
    return reputation;
  }

  /**
   * Invalidate all caches related to this reputation record
   */
  private async invalidateCaches(reputation: Reputation) {
    try {
      // Invalidate general list cache
      await this.cacheManager.del(`${this.CACHE_PREFIX}:all`);
      
      // Invalidate specific record cache
      await this.cacheManager.del(`${this.CACHE_PREFIX}:id:${reputation.id}`);
      
      // Invalidate user-specific caches
      if (reputation.rateeId) {
        await this.cacheManager.del(`${this.CACHE_PREFIX}:user:${reputation.rateeId}`);
        await this.cacheManager.del(`${this.CACHE_PREFIX}:score:${reputation.rateeId}`);
      }
      
      // Invalidate job-specific cache
      if (reputation.jobId) {
        await this.cacheManager.del(`${this.CACHE_PREFIX}:job:${reputation.jobId}`);
      }
      
      this.logger.debug(`Invalidated caches for reputation: ${reputation.id}`);
    } catch (error) {
      this.logger.error(`Error invalidating caches: ${error.message}`);
    }
  }
}
