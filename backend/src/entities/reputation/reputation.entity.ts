import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Job } from '../jobs/job.entity';

@Entity('reputations')
@Unique(['jobId', 'raterId']) // Prevent duplicate ratings for same job
@Index(['rateeId', 'createdAt'])
export class Reputation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'blockchain_id', type: 'bigint', nullable: true })
  @Index()
  blockchainId: number;

  @Column({ name: 'job_id' })
  jobId: string;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'rater_id' })
  raterId: string;

  @ManyToOne(() => User, (user) => user.ratingsGiven)
  @JoinColumn({ name: 'rater_id' })
  rater: User;

  @Column({ name: 'ratee_id' })
  rateeId: string;

  @ManyToOne(() => User, (user) => user.ratingsReceived)
  @JoinColumn({ name: 'ratee_id' })
  ratee: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_hash' })
  transactionHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
