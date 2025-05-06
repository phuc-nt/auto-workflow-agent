import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ActionPlan, PlanStatus } from '../models/action-plan.model';

@Entity('action_plans')
export class ActionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true, name: 'original_message' })
  userRequest: string;

  @Column({ type: 'text', nullable: true })
  processedInput: string;

  @Column({ type: 'json', nullable: true })
  plan: ActionPlan;

  @Column({ type: 'integer', default: 0 })
  stepsCount: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: PlanStatus.CREATED,
  })
  status: string;

  @Column({ default: 0, name: 'overall_progress' })
  progress: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ nullable: true })
  completedAt: Date;
} 