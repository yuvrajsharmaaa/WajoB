import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Escrow } from '@/entities/escrow/escrow.entity';

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(Escrow)
    private escrowRepository: Repository<Escrow>,
  ) {}

  async findAll() {
    return this.escrowRepository.find({
      relations: ['job', 'employer', 'worker'],
    });
  }

  async findOne(id: string) {
    return this.escrowRepository.findOne({
      where: { id },
      relations: ['job', 'employer', 'worker'],
    });
  }

  async create(escrowData: Partial<Escrow>) {
    const escrow = this.escrowRepository.create(escrowData);
    return this.escrowRepository.save(escrow);
  }

  async update(id: string, escrowData: Partial<Escrow>) {
    await this.escrowRepository.update(id, escrowData);
    return this.findOne(id);
  }
}
