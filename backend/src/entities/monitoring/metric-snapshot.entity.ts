import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('metric_snapshots')
@Index(['metricName', 'createdAt'])
@Index(['contractName', 'createdAt'])
@Index(['createdAt'])
export class MetricSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'metric_name' })
  @Index()
  metricName: string;

  @Column({ type: 'varchar', length: 255, name: 'contract_name', nullable: true })
  @Index()
  contractName: string;

  @Column({ type: 'decimal', precision: 18, scale: 9 })
  value: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  unit: string;

  @Column({ type: 'bigint', nullable: true, name: 'average_gas' })
  averageGas: number;

  @Column({ type: 'int', nullable: true, name: 'transaction_count' })
  transactionCount: number;

  @Column({ type: 'jsonb', nullable: true })
  tags: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
