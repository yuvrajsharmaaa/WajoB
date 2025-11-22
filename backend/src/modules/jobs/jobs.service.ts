import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '@/entities/jobs/job.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async findAll() {
    return this.jobRepository.find({
      relations: ['employer', 'worker', 'escrow'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.jobRepository.findOne({
      where: { id },
      relations: ['employer', 'worker', 'escrow'],
    });
  }

  async create(jobData: Partial<Job>) {
    const job = this.jobRepository.create(jobData);
    return this.jobRepository.save(job);
  }

  async update(id: string, jobData: Partial<Job>) {
    await this.jobRepository.update(id, jobData);
    return this.findOne(id);
  }
}
