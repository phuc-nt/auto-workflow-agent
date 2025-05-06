import { Injectable } from '@nestjs/common';
import { InputProcessor } from './input-processor/input-processor.service';
import { ProjectConfigReader } from './project-config/project-config-reader.service';
import { ActionPlanner } from './action-planner/action-planner.service';
import { ActionPlanStorageService } from './file-storage/action-plan-storage.service';
import { AgentCoordinator } from './agent-coordinator/agent-coordinator.service';
import { ActionPlan, PlanStatus, StepStatus } from './models/action-plan.model';
import { EnhancedLogger } from '../utils/logger';
import { ResultSynthesizerService } from './result-synthesizer/result-synthesizer.service';

@Injectable()
export class CentralAgentService {
  private readonly logger = EnhancedLogger.getLogger(CentralAgentService.name);
  
  constructor(
    private readonly inputProcessor: InputProcessor,
    private readonly projectConfigReader: ProjectConfigReader,
    private readonly actionPlanner: ActionPlanner,
    private readonly actionPlanStorage: ActionPlanStorageService,
    private readonly agentCoordinator: AgentCoordinator,
    private readonly resultSynthesizer: ResultSynthesizerService,
  ) {}
  
  /**
   * Xử lý yêu cầu từ người dùng
   */
  async processRequest(
    input: string,
    userId: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
  ): Promise<any> {
    try {
      this.logger.log(`Đang xử lý yêu cầu: ${input}`);
      
      // 1. Đọc thông tin dự án
      const projectContext = await this.projectConfigReader.getProjectContext(userId);
      
      // 2. Sử dụng Input Processor để phân tích yêu cầu
      const processedInput = await this.inputProcessor.processInput(
        input,
        {
          user: { id: userId, name: projectContext?.user?.name || userId },
          project: projectContext?.project,
          conversationHistory,
        },
      );
      
      // 3. Sử dụng Action Planner để lập kế hoạch hành động
      const actionPlan = await this.actionPlanner.createPlan(processedInput);
      
      // 4. Lưu kế hoạch vào storage
      const savedPlan = await this.actionPlanStorage.savePlan(actionPlan);
      
      // Cập nhật databaseId cho actionPlan để đảm bảo cập nhật đúng plan
      const planWithId = { 
        ...actionPlan, 
        databaseId: savedPlan.id
      };
      
      // 5. Thực thi kế hoạch bằng Agent Coordinator
      const executedPlan = await this.agentCoordinator.executePlan(planWithId);
      
      // 6. Lưu kết quả thực thi vào storage
      await this.actionPlanStorage.updatePlan(executedPlan);
      
      // 7. Sử dụng Result Synthesizer để tổng hợp kết quả
      const result = await this.resultSynthesizer.synthesizeResult(
        executedPlan,
        processedInput
      );
      
      // Trả về kết quả
      return {
        processedInput,
        actionPlan: executedPlan,
        result
      };
      
    } catch (error) {
      this.logger.error(`Lỗi khi xử lý yêu cầu: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Lấy ActionPlan theo ID
   */
  async getActionPlanById(id: string) {
    this.logger.log(`Lấy ActionPlan với ID: ${id}`);
    return this.actionPlanStorage.getPlanById(id);
  }

  /**
   * Lấy ActionPlan mới nhất của người dùng
   */
  async getLatestActionPlan(userId: string) {
    this.logger.log(`Lấy ActionPlan mới nhất của userId: ${userId}`);
    return this.actionPlanStorage.getLatestPlanByUserId(userId);
  }

  private findUserNameById(userId: string, projectConfig: any): string {
    // Trong phase đầu, đơn giản hóa bằng cách trả về user đầu tiên
    return projectConfig.projectMembers[0]?.name || 'Unknown User';
  }
} 