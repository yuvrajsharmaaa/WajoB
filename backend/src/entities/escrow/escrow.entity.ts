import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Job } from '../jobs/job.entity';

export enum EscrowStatus {
  CREATED = 'created',
  FUNDED = 'funded',
  LOCKED = 'locked',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
  RESOLVED = 'resolved',
}

@Entity('escrows')
@Index(['status', 'createdAt'])
export class Escrow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'blockchain_id', type: 'bigint', nullable: true })
  @Index()
  blockchainId: number;

  @Column({ name: 'job_id', unique: true })
  jobId: string;

  @OneToOne(() => Job, (job) => job.escrow)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'employer_id' })
  employerId: string;

  @ManyToOne(() => User, (user) => user.employerEscrows)
  @JoinColumn({ name: 'employer_id' })
  employer: User;

  @Column({ name: 'worker_id', nullable: true })
  workerId: string;

  @ManyToOne(() => User, (user) => user.workerEscrows, { nullable: true })
  @JoinColumn({ name: 'worker_id' })
  worker: User;

  @Column({ type: 'decimal', precision: 18, scale: 9 })
  amount: number;

  @Column({
    type: 'enum',
    enum: EscrowStatus,
    default: EscrowStatus.CREATED,
  })
  @Index()
  status: EscrowStatus;

  @Column({ type: 'boolean', default: false, name: 'employer_confirmed' })
  employerConfirmed: boolean;

  @Column({ type: 'boolean', default: false, name: 'worker_confirmed' })
  workerConfirmed: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_disputed' })
  isDisputed: boolean;

  @Column({ type: 'text', nullable: true, name: 'dispute_reason' })
  disputeReason: string;

  @Column({ type: 'timestamp', nullable: true, name: 'funded_at' })
  fundedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'locked_at' })
  lockedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'disputed_at' })
  disputedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_hash' })
  transactionHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
