import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/entities/users/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepository.find();
  }

  async findOne(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByTelegramId(telegramId: number) {
    return this.userRepository.findOne({ where: { telegramId } });
  }

  async findByWalletAddress(walletAddress: string) {
    return this.userRepository.findOne({ where: { walletAddress } });
  }

  async create(userData: Partial<User>) {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>) {
    await this.userRepository.update(id, userData);
    return this.findOne(id);
  }
}
