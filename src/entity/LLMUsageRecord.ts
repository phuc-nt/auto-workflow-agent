import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class LLMUsageRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  model: string;

  @Column()
  component: string;

  @Column()
  operation: string;

  @Column('simple-json')
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  @Column('float')
  cost: number;

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>;
} 