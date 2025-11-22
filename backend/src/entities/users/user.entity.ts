import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Job } from '../jobs/job.entity';
import { Escrow } from '../escrow/escrow.entity';
import { Reputation } from '../reputation/reputation.entity';

export enum UserRole {
  WORKER = 'worker',
  EMPLOYER = 'employer',
  BOTH = 'both',
}

@Entity('users')
@Index(['telegramId'], { unique: true })
@Index(['walletAddress'], { unique: true, where: 'wallet_address IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'telegram_id', type: 'bigint', unique: true })
  @Index()
  telegramId: number;

  @Column({ name: 'telegram_username', nullable: true })
  telegramUsername: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'wallet_address', nullable: true, unique: true })
  @Index()
  walletAddress: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.WORKER,
  })
  role: UserRole;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'profile_photo_url', nullable: true })
  profilePhotoUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'reputation_score' })
  reputationScore: number;

  @Column({ type: 'int', default: 0, name: 'total_ratings' })
  totalRatings: number;

  @Column({ type: 'int', default: 0, name: 'jobs_completed' })
  jobsCompleted: number;

  @Column({ type: 'int', default: 0, name: 'jobs_posted' })
  jobsPosted: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: true, name: 'notifications_enabled' })
  notificationsEnabled: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_active_at' })
  lastActiveAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Job, (job) => job.employer)
  jobsPostedRelation: Job[];

  @OneToMany(() => Job, (job) => job.worker)
  jobsWorkedRelation: Job[];

  @OneToMany(() => Escrow, (escrow) => escrow.employer)
  employerEscrows: Escrow[];

  @OneToMany(() => Escrow, (escrow) => escrow.worker)
  workerEscrows: Escrow[];

  @OneToMany(() => Reputation, (reputation) => reputation.rater)
  ratingsGiven: Reputation[];

  @OneToMany(() => Reputation, (reputation) => reputation.ratee)
  ratingsReceived: Reputation[];
}
