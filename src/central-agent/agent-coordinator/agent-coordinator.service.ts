import { Injectable } from '@nestjs/common';
import { ActionPlan, ActionStep, StepStatus, PlanStatus, StepResult, AgentType } from '../models/action-plan.model';
import { EnhancedLogger } from '../../utils/logger';
import { AgentFactory } from '../agent-factory/agent-factory.service';
import { ActionPlanner } from '../action-planner/action-planner.service';

@Injectable()
export class AgentCoordinator {
  private readonly logger = EnhancedLogger.getLogger(AgentCoordinator.name);
  
  constructor(
    private readonly agentFactory: AgentFactory,
    private readonly actionPlanner: ActionPlanner
  ) {}
  
  /**
   * Thực thi kế hoạch hành động
   */
  async executePlan(actionPlan: ActionPlan): Promise<ActionPlan> {
    this.logger.log(`Bắt đầu thực thi kế hoạch với ${actionPlan.steps.length} bước`);
    
    try {
      // Khởi tạo thời gian bắt đầu và trạng thái
      actionPlan.startTime = new Date();
      actionPlan.status = PlanStatus.RUNNING;
      
      // Thực thi từng bước trong kế hoạch
      while (this.hasStepsToExecute(actionPlan)) {
        const nextSteps = this.getNextStepsToExecute(actionPlan);
        
        // Không còn bước nào để thực hiện
        if (nextSteps.length === 0) {
          this.logger.warn('Không có bước nào có thể thực hiện tiếp, nhưng kế hoạch chưa hoàn thành');
          break;
        }
        
        this.logger.debug(`Thực hiện ${nextSteps.length} bước tiếp theo: ${nextSteps.map(i => actionPlan.steps[i].id).join(', ')}`);
        
        // Thực thi từng bước một để có thể điều chỉnh kế hoạch sau mỗi bước
        for (const stepIndex of nextSteps) {
          await this.executeStep(actionPlan, stepIndex);
          
          // Kiểm tra xem có cần điều chỉnh kế hoạch không
          const stepResult = actionPlan.steps[stepIndex].result;
          const stepStatus = actionPlan.steps[stepIndex].status;
          
          if (stepStatus === StepStatus.FAILED) {
            const evaluation = actionPlan.steps[stepIndex].evaluation;
            if (evaluation && evaluation.needsAdjustment) {
              const adjustedPlan = await this.considerPlanAdjustment(actionPlan, stepIndex);
              if (adjustedPlan) {
                this.logger.log(`Kế hoạch đã được điều chỉnh sau bước ${actionPlan.steps[stepIndex].id}`);
                actionPlan = adjustedPlan;
              }
            }
          }
        }
        
        // Cập nhật tiến độ
        actionPlan.overallProgress = this.calculateProgress(actionPlan);
      }
      
      // Cập nhật trạng thái cuối cùng
      actionPlan.endTime = new Date();
      
      if (this.allStepsCompleted(actionPlan)) {
        actionPlan.status = PlanStatus.COMPLETED;
        this.logger.log('Kế hoạch đã hoàn thành thành công');
      } else {
        actionPlan.status = PlanStatus.FAILED;
        this.logger.error('Kế hoạch thất bại do một số bước không thành công');
      }
      
      return actionPlan;
      
    } catch (error) {
      this.logger.error(`Lỗi khi thực thi kế hoạch: ${error.message}`);
      actionPlan.status = PlanStatus.FAILED;
      actionPlan.error = error;
      actionPlan.endTime = new Date();
      return actionPlan;
    }
  }
  
  /**
   * Xem xét điều chỉnh kế hoạch dựa trên kết quả thực thi
   */
  private async considerPlanAdjustment(plan: ActionPlan, failedStepIndex: number): Promise<ActionPlan | null> {
    const failedStep = plan.steps[failedStepIndex];
    
    // Kiểm tra nếu bước thất bại cần được xử lý đặc biệt
    if (!this.needsPlanAdjustment(failedStep)) {
      return null;
    }
    
    this.logger.log(`Xem xét điều chỉnh kế hoạch sau khi bước ${failedStep.id} thất bại`);
    
    try {
      // Xây dựng thông tin để gửi cho ActionPlanner
      const adjustmentInfo = {
        originalPlan: plan,
        failedStep,
        failedStepResult: failedStep.result,
        currentExecutionContext: plan.executionContext,
        reason: failedStep.evaluation?.reason || this.getAdjustmentReason(failedStep)
      };
      
      // Gọi ActionPlanner để điều chỉnh kế hoạch
      const adjustedPlan = await this.actionPlanner.adjustPlan(adjustmentInfo);
      
      if (adjustedPlan) {
        // Đảm bảo các bước đã hoàn thành được giữ nguyên
        adjustedPlan.steps.forEach((step, index) => {
          const originalStep = plan.steps.find(s => s.id === step.id);
          if (originalStep && 
              [StepStatus.SUCCEEDED, StepStatus.SKIPPED].includes(originalStep.status)) {
            step.status = originalStep.status;
            step.result = originalStep.result;
            step.evaluation = originalStep.evaluation;
            step.startTime = originalStep.startTime;
            step.endTime = originalStep.endTime;
          }
        });
        
        // Đảm bảo không có phụ thuộc vào các bước không tồn tại
        adjustedPlan.steps.forEach(step => {
          // Lọc bỏ các phụ thuộc không tồn tại trong kế hoạch mới
          if (step.dependsOn && step.dependsOn.length > 0) {
            step.dependsOn = step.dependsOn.filter(depId => 
              adjustedPlan.steps.some(s => s.id === depId)
            );
          }
        });
        
        // Đảm bảo bước đầu tiên không có phụ thuộc
        if (adjustedPlan.steps.length > 0) {
          adjustedPlan.steps[0].dependsOn = [];
        }
        
        // Cập nhật context
        adjustedPlan.executionContext = {
          ...plan.executionContext,
          result: { ...plan.executionContext.result || {} },
          evaluation: { ...plan.executionContext.evaluation || {} }
        };
        
        // Đảm bảo các kết quả từ bước đã hoàn thành được chuyển sang context mới
        plan.steps.forEach(step => {
          if (step.status === StepStatus.SUCCEEDED && step.result) {
            adjustedPlan.executionContext.result[step.id] = step.result;
          }
          if (step.evaluation) {
            adjustedPlan.executionContext.evaluation[step.id] = step.evaluation;
          }
        });
        
        // Giữ thời gian bắt đầu
        adjustedPlan.startTime = plan.startTime;
        adjustedPlan.overallProgress = this.calculateProgress(adjustedPlan);
        
        this.logger.debug(`Đã điều chỉnh kế hoạch: ${adjustedPlan.steps.length} bước mới, bắt đầu với ${adjustedPlan.steps[0]?.id || 'không có bước nào'}`);
        
        return adjustedPlan;
      }
    } catch (error) {
      this.logger.error(`Lỗi khi điều chỉnh kế hoạch: ${error.message}`);
    }
    
    return null;
  }
  
  /**
   * Kiểm tra xem bước thất bại có cần điều chỉnh kế hoạch không
   */
  private needsPlanAdjustment(failedStep: ActionStep): boolean {
    // Nếu đánh giá từ ActionPlanner cho biết cần điều chỉnh
    if (failedStep.evaluation && failedStep.evaluation.needsAdjustment) {
      return true;
    }
    
    // Nếu là task không tồn tại
    if (failedStep.result?.error?.code === 'ISSUE_NOT_FOUND') {
      return true;
    }
    
    // Nếu là phòng họp đã bị đặt
    if (failedStep.result?.error?.code === 'ROOM_UNAVAILABLE') {
      return true;
    }
    
    // Nếu là bug cần phê duyệt đặc biệt
    if (failedStep.agentType === AgentType.JIRA && 
        failedStep.prompt.toLowerCase().includes('bug') && 
        failedStep.result?.data?.bugs?.some(bug => bug.needsApproval)) {
      return true;
    }
    
    // Nếu sprint không đạt đủ tiến độ
    if (failedStep.agentType === AgentType.JIRA && 
        failedStep.prompt.toLowerCase().includes('tiến độ') && 
        failedStep.result?.data?.progress < 80) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Lấy lý do cần điều chỉnh kế hoạch
   */
  private getAdjustmentReason(failedStep: ActionStep): string {
    // Nếu đã có đánh giá từ ActionPlanner, sử dụng lý do từ đó
    if (failedStep.evaluation && failedStep.evaluation.reason) {
      return failedStep.evaluation.reason;
    }
    
    if (failedStep.result?.error?.code === 'ISSUE_NOT_FOUND') {
      return `Task không tồn tại: ${failedStep.result.error.message}`;
    }
    
    if (failedStep.result?.error?.code === 'ROOM_UNAVAILABLE') {
      return `Phòng họp không khả dụng: ${failedStep.result.error.message}. Các phòng họp khả dụng: ${failedStep.result.error.availableRooms?.join(', ')}`;
    }
    
    if (failedStep.agentType === AgentType.JIRA && 
        failedStep.prompt.toLowerCase().includes('bug') && 
        failedStep.result?.data?.bugs?.some(bug => bug.needsApproval)) {
      const approvalBugs = failedStep.result.data.bugs.filter(bug => bug.needsApproval);
      return `Có ${approvalBugs.length} bug cần phê duyệt đặc biệt trước khi gán cho QA`;
    }
    
    if (failedStep.agentType === AgentType.JIRA && 
        failedStep.prompt.toLowerCase().includes('tiến độ') && 
        failedStep.result?.data?.progress < 80) {
      return `Tiến độ sprint chỉ đạt ${failedStep.result.data.progress}%, không đủ điều kiện để lên lịch họp review`;
    }
    
    return `Bước ${failedStep.id} thất bại và cần điều chỉnh kế hoạch`;
  }
  
  /**
   * Kiểm tra xem kế hoạch còn bước nào cần thực hiện không
   */
  private hasStepsToExecute(plan: ActionPlan): boolean {
    return plan.steps.some(step => 
      [StepStatus.PENDING, StepStatus.WAITING, StepStatus.RETRYING].includes(step.status)
    );
  }
  
  /**
   * Lấy danh sách các bước tiếp theo có thể thực hiện
   * Một bước có thể thực hiện khi:
   * 1. Trạng thái là PENDING hoặc RETRYING
   * 2. Tất cả các bước phụ thuộc đã hoàn thành (SUCCEEDED)
   */
  private getNextStepsToExecute(plan: ActionPlan): number[] {
    return plan.steps.reduce((executables, step, index) => {
      if ([StepStatus.PENDING, StepStatus.RETRYING, StepStatus.WAITING].includes(step.status)) {
        const dependenciesCompleted = this.checkDependenciesCompleted(step, plan);
        
        if (dependenciesCompleted) {
          executables.push(index);
        } else {
          // Cập nhật trạng thái chờ nếu đang PENDING
          if (step.status === StepStatus.PENDING) {
            step.status = StepStatus.WAITING;
          }
        }
      }
      return executables;
    }, [] as number[]);
  }
  
  /**
   * Kiểm tra xem tất cả các bước phụ thuộc đã hoàn thành chưa
   */
  private checkDependenciesCompleted(step: ActionStep, plan: ActionPlan): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }
    
    // Kiểm tra từng dependency
    return step.dependsOn.every(depId => {
      const depStep = plan.steps.find(s => s.id === depId);
      if (!depStep) {
        this.logger.warn(`Bước ${step.id} phụ thuộc vào bước không tồn tại: ${depId}`);
        return false;
      }
      return depStep.status === StepStatus.SUCCEEDED;
    });
  }
  
  /**
   * Thực thi một bước trong kế hoạch
   */
  private async executeStep(plan: ActionPlan, stepIndex: number): Promise<void> {
    const step = plan.steps[stepIndex];
    
    try {
      // Cập nhật trạng thái bắt đầu
      step.status = StepStatus.RUNNING;
      step.startTime = new Date();
      
      // Kiểm tra điều kiện thực thi nếu có
      if (step.condition && !this.evaluateCondition(step.condition, plan.executionContext)) {
        this.logger.log(`Bỏ qua bước ${step.id} do điều kiện không thỏa: ${step.condition}`);
        step.status = StepStatus.SKIPPED;
        step.endTime = new Date();
        return;
      }
      
      // Render prompt với context hiện tại
      const renderedPrompt = this.renderPromptTemplate(step.prompt, plan.executionContext);
      
      // Lấy agent tương ứng với loại agent của step
      const agent = this.agentFactory.getAgent(step.agentType);
      
      // Gọi agent thực hiện prompt
      const options = {
        timeout: step.timeout || 30000,
        metadata: {
          stepId: step.id,
          planIndex: plan.currentStepIndex
        }
      };
      
      this.logger.log(`Thực thi bước ${step.id} với agent ${step.agentType}: ${renderedPrompt}`);
      const result = await agent.executePrompt(renderedPrompt, options);
      
      // Lưu kết quả
      step.result = result;
      
      // Gửi kết quả cho ActionPlanner để đánh giá
      const evaluation = await this.actionPlanner.evaluateStepResult(step, plan);
      step.evaluation = evaluation;
      
      // Cập nhật trạng thái dựa trên đánh giá từ ActionPlanner
      if (evaluation.success) {
        step.status = StepStatus.SUCCEEDED;
        this.logger.log(`Bước ${step.id} thành công theo đánh giá: ${evaluation.reason}`);
      } else {
        // Xử lý retry
        if (step.retryCount < (step.maxRetries || 2)) {
          step.retryCount = (step.retryCount || 0) + 1;
          step.status = StepStatus.RETRYING;
          this.logger.warn(`Bước ${step.id} thất bại theo đánh giá, thử lại lần ${step.retryCount}/${step.maxRetries}: ${evaluation.reason}`);
        } else {
          step.status = StepStatus.FAILED;
          step.error = new Error(evaluation.reason || result.error?.message || 'Thực thi thất bại sau nhiều lần thử');
          this.logger.error(`Bước ${step.id} thất bại sau ${step.retryCount} lần thử: ${step.error.message}`);
        }
      }
      
      // Cập nhật executionContext với kết quả mới
      plan.executionContext = {
        ...plan.executionContext,
        result: {
          ...(plan.executionContext.result || {}),
          [step.id]: step.result
        },
        evaluation: {
          ...(plan.executionContext.evaluation || {}),
          [step.id]: step.evaluation
        }
      };
      
    } catch (error) {
      // Xử lý lỗi
      this.logger.error(`Lỗi khi thực thi bước ${step.id}: ${error.message}`);
      step.status = StepStatus.FAILED;
      step.error = error;
      
      // Cố gắng đánh giá ngay cả khi có lỗi
      try {
        step.evaluation = {
          success: false,
          reason: `Lỗi khi thực thi: ${error.message}`,
          needsAdjustment: true
        };
      } catch (evalError) {
        this.logger.error(`Không thể tạo đánh giá cho bước lỗi: ${evalError.message}`);
      }
      
    } finally {
      step.endTime = new Date();
    }
  }
  
  /**
   * Đánh giá điều kiện để thực hiện bước
   */
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      // Xử lý điều kiện tiếng Việt
      const processedCondition = this.processVietnameseCondition(condition);
      
      // Sử dụng Function constructor để đánh giá điều kiện trong context
      const evalFunction = new Function(...Object.keys(context), `return ${processedCondition};`);
      return evalFunction(...Object.values(context));
    } catch (error) {
      this.logger.error(`Lỗi khi đánh giá điều kiện '${condition}': ${error.message}`);
      return false;
    }
  }
  
  /**
   * Xử lý điều kiện tiếng Việt thành biểu thức JavaScript
   */
  private processVietnameseCondition(condition: string): string {
    // Nếu điều kiện rỗng hoặc undefined, trả về true
    if (!condition) return 'true';
    
    // Xử lý các từ khóa tiếng Việt thông dụng
    let processedCondition = condition
      .replace(/Nếu/gi, '')
      .replace(/có/gi, '')
      .replace(/không/gi, '!')
      .replace(/và/gi, '&&')
      .replace(/hoặc/gi, '||')
      .replace(/bằng/gi, '===')
      .replace(/khác/gi, '!==')
      .replace(/lớn hơn/gi, '>')
      .replace(/nhỏ hơn/gi, '<')
      .replace(/lớn hơn hoặc bằng/gi, '>=')
      .replace(/nhỏ hơn hoặc bằng/gi, '<=');
      
    // Xử lý trường hợp câu điều kiện đơn giản
    if (processedCondition.includes('task') || 
        processedCondition.includes('công việc') || 
        processedCondition.includes('nhiệm vụ')) {
      return 'true'; // Mặc định trả về true nếu liên quan đến task, công việc
    }
    
    // Kiểm tra xem có thể đánh giá biểu thức hay không
    try {
      // Thử compile biểu thức để xem có lỗi syntax không
      new Function(`return ${processedCondition};`);
      return processedCondition;
    } catch (error) {
      this.logger.warn(`Không thể xử lý điều kiện '${condition}', trả về true mặc định`);
      return 'true'; // Nếu không xử lý được, trả về true
    }
  }
  
  /**
   * Render template với các biến từ context
   */
  private renderPromptTemplate(template: string, context: Record<string, any>): string {
    if (!template || typeof template !== 'string') return template;
    
    // Nếu có object specifiedParticipants trong context, thêm vào template
    if (context.specifiedParticipants && Array.isArray(context.specifiedParticipants)) {
      if (!template.includes('context.specifiedParticipants')) {
        // Thêm thông tin về specifiedParticipants vào cuối prompt
        template += `\n\nLưu ý: Chỉ xét các thành viên được chỉ định trong context.specifiedParticipants = [${context.specifiedParticipants.map(p => `"${p}"`).join(', ')}]`;
      }
    }
    
    // Thay thế các biến trong template
    let result = template;
    
    // Thay thế các biến đơn giản kiểu {{variable}}
    const simpleVariablePattern = /\{\{([\w\.]+)\}\}/g;
    let match;
    while ((match = simpleVariablePattern.exec(template)) !== null) {
      const fullMatch = match[0];
      const variablePath = match[1];
      let value = this.getValueFromPath(context, variablePath);
      value = typeof value === 'object' ? JSON.stringify(value) : String(value);
      result = result.replace(fullMatch, value);
    }
    
    // Thay thế các vòng lặp kiểu {{#each items}}...{{/each}}
    const loopPattern = /\{\{#each\s+([\w\.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    while ((match = loopPattern.exec(template)) !== null) {
      const fullMatch = match[0];
      const arrayPath = match[1];
      const template = match[2];
      
      const array = this.getValueFromPath(context, arrayPath);
      if (Array.isArray(array)) {
        const renderedItems = array.map(item => {
          let itemTemplate = template;
          // Đơn giản hóa: thay thế {{this}} bằng item
          itemTemplate = itemTemplate.replace(/\{\{this\}\}/g, String(item));
          // Thay thế {{this.property}} cho các object
          if (typeof item === 'object') {
            const itemPattern = /\{\{this\.([\w\.]+)\}\}/g;
            let itemMatch;
            while ((itemMatch = itemPattern.exec(template)) !== null) {
              const itemFullMatch = itemMatch[0];
              const itemPath = itemMatch[1];
              let value = this.getValueFromPath(item, itemPath);
              value = typeof value === 'object' ? JSON.stringify(value) : String(value);
              itemTemplate = itemTemplate.replace(itemFullMatch, value);
            }
          }
          return itemTemplate;
        }).join('');
        result = result.replace(fullMatch, renderedItems);
      } else {
        result = result.replace(fullMatch, '');
      }
    }
    
    return result;
  }
  
  /**
   * Lấy giá trị từ đường dẫn (vd: result.step1.data.items)
   */
  private getValueFromPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * Tính toán tiến độ tổng thể của kế hoạch
   */
  private calculateProgress(plan: ActionPlan): number {
    const completedSteps = plan.steps.filter(s => 
      [StepStatus.SUCCEEDED, StepStatus.FAILED, StepStatus.SKIPPED].includes(s.status)
    ).length;
    
    return Math.round((completedSteps / plan.steps.length) * 100);
  }
  
  /**
   * Kiểm tra xem tất cả các bước đã hoàn thành thành công chưa
   */
  private allStepsCompleted(plan: ActionPlan): boolean {
    return plan.steps.every(s => 
      s.status === StepStatus.SUCCEEDED || s.status === StepStatus.SKIPPED
    );
  }
} 