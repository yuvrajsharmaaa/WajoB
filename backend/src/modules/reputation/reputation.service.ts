import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reputation } from '@/entities/reputation/reputation.entity';

@Injectable()
export class ReputationService {
  constructor(
    @InjectRepository(Reputation)
    private reputationRepository: Repository<Reputation>,
  ) {}

  async findAll() {
    return this.reputationRepository.find({
      relations: ['job', 'rater', 'ratee'],
    });
  }

  async findOne(id: string) {
    return this.reputationRepository.findOne({
      where: { id },
      relations: ['job', 'rater', 'ratee'],
    });
  }

  async findByUserId(userId: string) {
    return this.reputationRepository.find({
      where: { rateeId: userId },
      relations: ['rater'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(reputationData: Partial<Reputation>) {
    const reputation = this.reputationRepository.create(reputationData);
    return this.reputationRepository.save(reputation);
  }
}
