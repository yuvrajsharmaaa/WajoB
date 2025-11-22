import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '@/entities/jobs/job.entity';
import { IndexerService } from './indexer.service';
import { TonClientService } from './ton-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  providers: [IndexerService, TonClientService],
  exports: [IndexerService, TonClientService],
})
export class BlockchainModule {}
