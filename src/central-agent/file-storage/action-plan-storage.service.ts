import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionPlanEntity } from '../entities/action-plan.entity';
import { ActionPlan } from '../models/action-plan.model';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';
import { EnhancedLogger } from '../../utils/logger';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

interface ActionPlanFile {
  id: string;
  userId: string;
  originalMessage: string;
  processedInput: string;
  plan: ActionPlan;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ActionPlanStorageService {
  private readonly logger = EnhancedLogger.getLogger(ActionPlanStorageService.name);
  private readonly storagePath: string;
  
  constructor(
    @InjectRepository(ActionPlanEntity)
    private actionPlanRepository: Repository<ActionPlanEntity>,
  ) {
    // Đường dẫn thư mục lưu trữ kế hoạch
    this.storagePath = path.resolve(process.cwd(), 'storage', 'action-plans');
    this.ensureStorageDirectoryExists();
  }
  
  /**
   * Đảm bảo thư mục lưu trữ tồn tại
   */
  private async ensureStorageDirectoryExists(): Promise<void> {
    try {
      await mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      this.logger.error(`Không thể tạo thư mục lưu trữ: ${error.message}`);
    }
  }
  
  /**
   * Lưu kế hoạch hành động vào database và file
   */
  async savePlan(actionPlan: ActionPlan): Promise<ActionPlanEntity> {
    try {
      // Tạo entity để lưu vào database
      const entity = new ActionPlanEntity();
      entity.status = actionPlan.status;
      entity.stepsCount = actionPlan.steps.length;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      
      // Lưu vào database
      const savedEntity = await this.actionPlanRepository.save(entity);
      this.logger.log(`Đã lưu ActionPlan vào database với ID: ${savedEntity.id}`);
      
      // Lưu ra file
      const planWithId = { ...actionPlan, databaseId: savedEntity.id };
      const filePath = path.join(this.storagePath, `${savedEntity.id}.json`);
      await writeFile(filePath, JSON.stringify(planWithId, null, 2), 'utf8');
      this.logger.log(`Đã lưu ActionPlan ra file: ${filePath}`);
      
      return savedEntity;
    } catch (error) {
      this.logger.error(`Lỗi khi lưu ActionPlan: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Cập nhật kế hoạch hành động
   */
  async updatePlan(actionPlan: ActionPlan): Promise<void> {
    try {
      // Lấy databaseId từ actionPlan nếu có
      const databaseId = (actionPlan as any).databaseId;
      
      if (databaseId) {
        // Cập nhật entity trong database
        await this.actionPlanRepository.update(databaseId, {
          status: actionPlan.status,
          progress: actionPlan.overallProgress,
          completedAt: actionPlan.endTime,
          updatedAt: new Date(),
        });
        this.logger.log(`Đã cập nhật ActionPlan trong database với ID: ${databaseId}`);
        
        // Cập nhật file
        const filePath = path.join(this.storagePath, `${databaseId}.json`);
        await writeFile(filePath, JSON.stringify(actionPlan, null, 2), 'utf8');
        this.logger.log(`Đã cập nhật ActionPlan trong file: ${filePath}`);
      } else {
        this.logger.warn('Không có databaseId, không thể cập nhật ActionPlan');
        // Lưu mới nếu không có databaseId
        await this.savePlan(actionPlan);
      }
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật ActionPlan: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Lưu kế hoạch hành động từ yêu cầu người dùng 
   * (legacy method - giữ lại để tương thích ngược)
   */
  async saveActionPlan(
    userId: string,
    userRequest: string,
    processedInput: string,
    actionPlan: ActionPlan,
  ): Promise<ActionPlanEntity> {
    // Tạo entity để lưu vào database
    const entity = new ActionPlanEntity();
    entity.userId = userId;
    entity.userRequest = userRequest;
    entity.processedInput = processedInput;
    entity.status = actionPlan.status;
    entity.stepsCount = actionPlan.steps.length;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    
    // Lưu vào database
    const savedEntity = await this.actionPlanRepository.save(entity);
    this.logger.log(`Đã lưu ActionPlan vào database với ID: ${savedEntity.id}`);
    
    // Lưu ra file
    await this.ensureStorageDirectoryExists();
    const planWithId = { ...actionPlan, databaseId: savedEntity.id };
    const filePath = path.join(this.storagePath, `${savedEntity.id}.json`);
    await writeFile(filePath, JSON.stringify(planWithId, null, 2), 'utf8');
    this.logger.log(`Đã lưu ActionPlan ra file: ${filePath}`);
    
    return savedEntity;
  }
  
  /**
   * Lấy ActionPlan theo ID
   */
  async getPlanById(id: string): Promise<ActionPlanFile | null> {
    try {
      const filePath = path.join(this.storagePath, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`ActionPlan với ID ${id} không tồn tại`);
        return null;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent) as ActionPlanFile;
    } catch (error) {
      this.logger.error(`Lỗi khi đọc ActionPlan: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Lấy ActionPlan mới nhất của người dùng
   */
  async getLatestPlanByUserId(userId: string): Promise<ActionPlanFile | null> {
    try {
      const files = fs.readdirSync(this.storagePath);
      
      // Đọc tất cả các file và lọc theo userId
      const userPlans: ActionPlanFile[] = [];
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(this.storagePath, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const plan = JSON.parse(fileContent) as ActionPlanFile;
        
        if (plan.userId === userId) {
          userPlans.push(plan);
        }
      }
      
      if (userPlans.length === 0) {
        this.logger.warn(`Không tìm thấy ActionPlan nào cho userId ${userId}`);
        return null;
      }
      
      // Sắp xếp theo thời gian tạo mới nhất
      userPlans.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      return userPlans[0];
    } catch (error) {
      this.logger.error(`Lỗi khi tìm ActionPlan: ${error.message}`);
      return null;
    }
  }
} 