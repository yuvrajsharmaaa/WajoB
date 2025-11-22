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
import { Escrow } from '../escrow/escrow.entity';

export enum JobStatus {
  POSTED = 'posted',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PENDING_CONFIRMATION = 'pending_confirmation',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum JobCategory {
  SECURITY = 'security',
  WATCHMAN = 'watchman',
  GATE_SECURITY = 'gate_security',
  NIGHT_GUARD = 'night_guard',
  PATROL = 'patrol',
  OTHER = 'other',
}

@Entity('jobs')
@Index(['status', 'createdAt'])
@Index(['category', 'status'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'blockchain_id', type: 'bigint', nullable: true })
  @Index()
  blockchainId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'decimal', precision: 18, scale: 9 })
  wages: number;

  @Column({ type: 'int' })
  duration: number;

  @Column({
    type: 'enum',
    enum: JobCategory,
    default: JobCategory.SECURITY,
  })
  category: JobCategory;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.POSTED,
  })
  @Index()
  status: JobStatus;

  @Column({ name: 'employer_id' })
  employerId: string;

  @ManyToOne(() => User, (user) => user.jobsPostedRelation)
  @JoinColumn({ name: 'employer_id' })
  employer: User;

  @Column({ name: 'worker_id', nullable: true })
  workerId: string;

  @ManyToOne(() => User, (user) => user.jobsWorkedRelation, { nullable: true })
  @JoinColumn({ name: 'worker_id' })
  worker: User;

  @OneToOne(() => Escrow, (escrow) => escrow.job, { nullable: true })
  escrow: Escrow;

  @Column({ type: 'timestamp', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_hash' })
  transactionHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
