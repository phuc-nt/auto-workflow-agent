import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionPlanEntity } from '../entities/action-plan.entity';
import { ActionPlan } from '../models/action-plan.model';

@Injectable()
export class ActionPlanRepository {
  constructor(
    @InjectRepository(ActionPlanEntity)
    private readonly actionPlanRepo: Repository<ActionPlanEntity>,
  ) {}

  /**
   * Lưu ActionPlan vào cơ sở dữ liệu
   */
  async saveActionPlan(
    userId: string,
    originalMessage: string,
    processedInput: string,
    actionPlan: ActionPlan,
  ): Promise<ActionPlanEntity> {
    const entity = new ActionPlanEntity();
    entity.userId = userId;
    entity.userRequest = originalMessage;
    entity.processedInput = processedInput;
    entity.plan = actionPlan;
    entity.status = actionPlan.status;
    entity.progress = actionPlan.overallProgress;

    return this.actionPlanRepo.save(entity);
  }

  /**
   * Lấy ActionPlan mới nhất của người dùng
   */
  async getLatestPlanByUserId(userId: string): Promise<ActionPlanEntity | null> {
    return this.actionPlanRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy ActionPlan theo ID
   */
  async getPlanById(id: string): Promise<ActionPlanEntity | null> {
    return this.actionPlanRepo.findOne({
      where: { id },
    });
  }

  /**
   * Cập nhật trạng thái và tiến độ của ActionPlan
   */
  async updatePlanStatus(
    id: string,
    status: string,
    overallProgress: number,
    actionPlan: ActionPlan,
  ): Promise<void> {
    await this.actionPlanRepo.update(
      { id },
      { status, progress: overallProgress, plan: actionPlan },
    );
  }
} 