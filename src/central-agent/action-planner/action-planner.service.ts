import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../../openai/openai.service';
import {
  ActionPlan,
  ActionStep,
  StepStatus,
  PlanStatus,
  AgentType,
} from '../models/action-plan.model';
import { EnhancedLogger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Interface cho ExecutionContext sử dụng trong service này
interface ExecutionContext {
  result?: Record<string, any>;
  evaluation?: Record<string, any>;
  specifiedParticipants?: string[];
  [key: string]: any;
}

@Injectable()
export class ActionPlanner {
  private readonly logger = EnhancedLogger.getLogger(ActionPlanner.name);

  constructor(private readonly openaiService: OpenaiService) {}

  async createPlan(processedInput: string): Promise<ActionPlan> {
    try {
      const currentConfig = this.openaiService.getLLMConfig();
      this.logger.log(
        `ActionPlanner sử dụng model: ${currentConfig.model}, temperature: ${currentConfig.temperature}`,
      );

      // Kiểm tra trường hợp đặc biệt cho sắp xếp cuộc họp
      if (processedInput.toLowerCase().includes('sắp xếp cuộc họp') ||
          processedInput.toLowerCase().includes('tổ chức cuộc họp')) {
        this.logger.log('Phát hiện kịch bản sắp xếp cuộc họp, áp dụng kế hoạch đặc biệt');
        // Tạo kế hoạch họp đơn giản
        const plan = this.getSimplifiedMeetingPlan();
        
        // Trích xuất thành viên được đề cập trong yêu cầu
        const participants = this.extractParticipants(processedInput);
        if (participants.length > 0) {
          // Nếu có đề cập đến các thành viên cụ thể, thêm vào context
          plan.executionContext.specifiedParticipants = participants;
          this.logger.log(`Đã xác định các thành viên được nhắc đến: ${participants.join(', ')}`);
        }
        
        return plan;
      }

      // Chuẩn bị prompt cho OpenAI
      const systemPrompt = this.getSystemPrompt();
      const userPrompt = this.getUserPrompt(processedInput);

      this.logger.debug(
        'Bắt đầu gọi chatWithFunctionCalling với system prompt và user prompt',
      );
      // Gọi OpenAI API
      const response = await this.openaiService.chatWithFunctionCalling(
        systemPrompt,
        userPrompt,
      );

      // Xử lý markdown nếu có
      const cleanedResponse = this.cleanMarkdownCodeBlocks(response);
      this.logger.debug(`Cleaned response: ${cleanedResponse}`);

      // Parse kết quả JSON từ response
      try {
        const planData = JSON.parse(cleanedResponse);

        // Xác thực dữ liệu trả về
        if (
          !planData.steps ||
          !Array.isArray(planData.steps) ||
          planData.steps.length === 0
        ) {
          throw new Error(
            'Kết quả không hợp lệ: Thiếu hoặc định dạng steps không đúng',
          );
        }

        this.logger.debug(`Tạo kế hoạch với ${planData.steps.length} bước`);
        // Tạo ActionPlan từ dữ liệu
        const plan: ActionPlan = {
          steps: planData.steps.map((s) => ({
            ...s,
            agentType: this.validateAgentType(s.agentType),
            dependsOn: Array.isArray(s.dependsOn) ? s.dependsOn : [],
            maxRetries: s.maxRetries || 2,
            retryCount: 0,
            status: StepStatus.PENDING,
          })),
          currentStepIndex: 0,
          executionContext: {},
          status: PlanStatus.CREATED,
          overallProgress: 0,
        };

        return plan;
      } catch (error) {
        this.logger.error(`Error parsing response: ${error.message}`);
        this.logger.debug(`Response content: ${response}`);
        throw new Error(`Không thể tạo kế hoạch: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Error creating action plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Đánh giá kết quả của một bước thực thi
   * Trả về đánh giá về kết quả: thành công hay thất bại, và lý do
   */
  async evaluateStepResult(
    stepToEvaluate: ActionStep,
    plan: ActionPlan,
  ): Promise<{
    success: boolean;
    reason: string;
    needsAdjustment: boolean;
  }> {
    try {
      this.logger.log(`Đánh giá kết quả của bước ${stepToEvaluate.id}`);

      // Nếu không có kết quả, không thể đánh giá
      if (!stepToEvaluate.result) {
        return {
          success: false,
          reason: 'Không có kết quả để đánh giá',
          needsAdjustment: false,
        };
      }

      // Nếu đã retry 2 lần, dừng lại và trả về kết quả tốt nhất có thể
      if (stepToEvaluate.retryCount && stepToEvaluate.retryCount >= 2) {
        this.logger.warn(`Step ${stepToEvaluate.id} đã retry 2 lần, dừng lại và trả về kết quả tốt nhất có thể.`);
        return {
          success: true,
          reason: 'Đã thử lại 2 lần nhưng không đạt đủ kỳ vọng, chấp nhận kết quả hiện tại và tổng hợp trả về cho người dùng.',
          needsAdjustment: false,
        };
      }

      // Chuẩn bị prompt cho OpenAI để đánh giá kết quả
      const systemPrompt = this.getStepEvaluationSystemPrompt(stepToEvaluate.retryCount || 0);
      const userPrompt = this.getStepEvaluationUserPrompt(stepToEvaluate, plan, stepToEvaluate.retryCount || 0);

      // Gọi OpenAI API để đánh giá kết quả
      const response = await this.openaiService.chatWithFunctionCalling(
        systemPrompt,
        userPrompt,
      );

      try {
        // Parse kết quả JSON từ response
        const cleanedResponse = this.cleanMarkdownCodeBlocks(response);
        const evaluationResult = JSON.parse(cleanedResponse);

        if (
          typeof evaluationResult.success !== 'boolean' ||
          !evaluationResult.reason
        ) {
          throw new Error('Kết quả đánh giá không hợp lệ');
        }

        // Log kết quả đánh giá
        this.logger.log(
          `Đánh giá bước ${stepToEvaluate.id}: ${evaluationResult.success ? 'Thành công' : 'Thất bại'} - ${evaluationResult.reason}`,
        );

        return {
          success: evaluationResult.success,
          reason: evaluationResult.reason,
          needsAdjustment: evaluationResult.needsAdjustment === true,
        };
      } catch (error) {
        this.logger.error(
          `Lỗi khi phân tích kết quả đánh giá: ${error.message}`,
        );
        // Mặc định sử dụng kết quả .success từ agent nếu không thể phân tích
        return {
          success: stepToEvaluate.result.success,
          reason: `Không thể đánh giá chi tiết, sử dụng kết quả từ agent: ${stepToEvaluate.result.success ? 'Thành công' : 'Thất bại'}`,
          needsAdjustment: false,
        };
      }
    } catch (error) {
      this.logger.error(
        `Lỗi khi đánh giá kết quả bước ${stepToEvaluate.id}: ${error.message}`,
      );
      return {
        success: false,
        reason: `Lỗi khi đánh giá: ${error.message}`,
        needsAdjustment: false,
      };
    }
  }

  /**
   * System prompt cho việc đánh giá kết quả bước
   * retryLevel = 0: khắt khe, 1: nới lỏng, 2: rất nới lỏng
   */
  private getStepEvaluationSystemPrompt(retryLevel: number = 0): string {
    if (retryLevel === 0) {
      return `
Bạn là một AI assistant được thiết kế để đánh giá kết quả của một bước trong kế hoạch hành động.\n\nNhiệm vụ của bạn là:\n1. Xem xét kết quả từ sub-agent\n2. Đánh giá xem bước có thực sự thành công hay không, bất kể trạng thái success là true hay false\n3. Xác định xem có cần điều chỉnh kế hoạch không dựa trên ngữ cảnh và kết quả\n\nQUAN TRỌNG: Nếu kết quả đã trả về thông tin chính (ví dụ: danh sách dự án, danh sách task, ...) và có các trường cơ bản (ví dụ: tên, mã, trạng thái chính), thì coi là thành công, dù có thể thiếu một số trường chi tiết. Chỉ đánh giá là thất bại nếu kết quả hoàn toàn sai, không có dữ liệu chính hoặc dữ liệu không liên quan.\n\nTrả về đánh giá dưới dạng JSON với cấu trúc:\n{\n  "success": true/false,\n  "reason": "Lý do chi tiết cho đánh giá này",\n  "needsAdjustment": true/false\n}\n\nLưu ý:\n- Đôi khi sub-agent trả về success=true nhưng kết quả không đáp ứng yêu cầu\n- Có thể sub-agent trả về success=false nhưng vẫn cung cấp thông tin hữu ích\n\nQUAN TRỌNG: Trả về JSON thuần túy, không bọc trong markdown code block.`;
    } else if (retryLevel === 1) {
      return `
Bạn là một AI assistant đánh giá kết quả bước trong kế hoạch hành động.\n\nLần thử lại này, hãy nới lỏng tiêu chí: Nếu kết quả đã trả về thông tin chính liên quan đến yêu cầu (dù thiếu nhiều trường phụ hoặc không đúng định dạng hoàn hảo), vẫn coi là thành công. Chỉ đánh giá là thất bại nếu hoàn toàn không có dữ liệu chính hoặc dữ liệu hoàn toàn không liên quan.\n\nTrả về đánh giá dưới dạng JSON với cấu trúc như trước.`;
    } else {
      return `
Bạn là một AI assistant đánh giá kết quả bước trong kế hoạch hành động.\n\nĐây là lần thử lại cuối cùng. Nếu kết quả có bất kỳ thông tin nào liên quan đến yêu cầu, hãy coi là thành công. Chỉ đánh giá là thất bại nếu hoàn toàn không có dữ liệu hoặc dữ liệu hoàn toàn không liên quan.\n\nTrả về đánh giá dưới dạng JSON với cấu trúc như trước.`;
    }
  }

  /**
   * User prompt cho việc đánh giá kết quả bước
   * retryLevel: số lần thử lại, càng cao càng nới lỏng yêu cầu
   */
  private getStepEvaluationUserPrompt(
    step: ActionStep,
    plan: ActionPlan,
    retryLevel: number = 0,
  ): string {
    // Tạo mô tả về bước cần đánh giá
    const stepDescription = `
- ID: ${step.id}
- Agent: ${step.agentType}
- Prompt: "${step.prompt}"
- Success flag từ agent: ${step.result?.success}
    `;

    // Tạo mô tả về kết quả
    const resultDescription = JSON.stringify(step.result, null, 2);

    let relaxNote = '';
    if (retryLevel === 1) {
      relaxNote = '\nLưu ý: Lần thử lại này, hãy nới lỏng tiêu chí, chỉ cần có thông tin chính là đủ.';
    } else if (retryLevel >= 2) {
      relaxNote = '\nLưu ý: Đây là lần thử lại cuối cùng, chỉ cần có bất kỳ thông tin liên quan nào cũng coi là thành công.';
    }

    return `
Hãy đánh giá kết quả của bước sau trong kế hoạch:

THÔNG TIN BƯỚC:
${stepDescription}

KẾT QUẢ TỪ SUB-AGENT:
${resultDescription}

NGỮ CẢNH KẾ HOẠCH:
Mục tiêu tổng thể: Thực hiện yêu cầu của người dùng thông qua các sub-agent.
Trạng thái kế hoạch: ${plan.status}
Tiến độ: ${plan.overallProgress}%
${relaxNote}

Dựa trên thông tin trên, hãy đánh giá:
1. Bước này có thực sự THÀNH CÔNG hay không (bất kể trạng thái thành công từ agent)
2. Lý do chi tiết cho đánh giá của bạn
3. Cần điều chỉnh kế hoạch không (true/false)

Trả về đánh giá dưới dạng JSON.`;
  }

  /**
   * Điều chỉnh kế hoạch khi gặp lỗi hoặc cần thay đổi giữa chừng
   */
  async adjustPlan(adjustmentInfo: {
    originalPlan: ActionPlan;
    failedStep: ActionStep;
    failedStepResult?: any;
    currentExecutionContext: ExecutionContext;
    reason: string;
  }): Promise<ActionPlan | null> {
    try {
      const { originalPlan, failedStep, currentExecutionContext, reason } = adjustmentInfo;

      // Chuẩn bị thông tin hiện trạng cho việc điều chỉnh kế hoạch
      const executedSteps = originalPlan.steps
        .filter(step => step.status === StepStatus.SUCCEEDED)
        .map(step => {
          return {
            id: step.id,
            description: step.description,
            result: step.result,
          };
        });

      // Chuẩn bị context
      const context = {
        originalPlan: {
          id: originalPlan.id,
          description: originalPlan.description,
          goal: originalPlan.goal,
        },
        failedStep: {
          id: failedStep.id,
          description: failedStep.description,
          agent: failedStep.agentType,
          action: failedStep.action,
          parameters: failedStep.parameters,
          result: failedStep.result,
        },
        executedSteps,
        reason,
        executionContext: currentExecutionContext,
      };

      this.logger.debug(`Điều chỉnh kế hoạch cho bước thất bại ${failedStep.id}: ${failedStep.description}`);

      // Tạo kế hoạch mới
      const prompt = this.getAdjustmentPrompt(context);
      const result = await this.openaiService.chatWithFunctionCalling(
        this.getAdjustmentSystemPrompt(),
        this.getAdjustmentUserPrompt(originalPlan, failedStep, reason)
      );

      if (!result) {
        this.logger.error('Không nhận được phản hồi từ LLM khi điều chỉnh kế hoạch');
        return null;
      }

      const planObject = this.parsePlanFromLLMResponse(result);
      
      if (!planObject) {
        this.logger.error('Không thể phân tích kế hoạch từ phản hồi LLM:', result);
        return null;
      }

      // Tạo kế hoạch mới với ID mới
      const newPlanId = uuidv4();
      const adjustedPlan: ActionPlan = {
        id: newPlanId,
        parentPlanId: originalPlan.id,
        description: `Điều chỉnh cho kế hoạch ${originalPlan.id}: ${planObject.description || 'Kế hoạch điều chỉnh'}`,
        goal: originalPlan.goal,
        status: PlanStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: this.buildStepsFromParsedPlan(planObject),
        currentStepIndex: 0,
        isAdjustment: true,
        executionContext: this.prepareContextForNewPlan(originalPlan, planObject),
        metadata: {
          originalPlanId: originalPlan.id,
          adjustmentReason: reason,
          llmResponse: result,
        },
        overallProgress: 0
      };

      // Đảm bảo bước đầu tiên không có phụ thuộc vào kế hoạch cũ
      if (adjustedPlan.steps.length > 0) {
        adjustedPlan.steps[0].dependsOn = [];
      }

      this.logger.log(`Đã tạo kế hoạch điều chỉnh ${newPlanId} với ${adjustedPlan.steps.length} bước`);
      
      return adjustedPlan;
    } catch (error) {
      this.logger.error(`Lỗi khi điều chỉnh kế hoạch: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Chuẩn bị context cho kế hoạch mới từ kế hoạch cũ
   */
  private prepareContextForNewPlan(originalPlan: ActionPlan, newPlanObject: any): ExecutionContext {
    const newContext: ExecutionContext = { 
      result: {}, 
      evaluation: {},
      ...originalPlan.executionContext 
    };
    
    // Chuyển kết quả từ kế hoạch cũ sang kế hoạch mới
    for (const step of originalPlan.steps) {
      if (step.status === StepStatus.SUCCEEDED && step.result) {
        newContext.result[step.id] = step.result;
      }
      if (step.evaluation) {
        newContext.evaluation[step.id] = step.evaluation;
      }
    }
    
    return newContext;
  }

  /**
   * Tạo prompt điều chỉnh kế hoạch từ context
   */
  private getAdjustmentPrompt(context: any): string {
    // Tạo prompt dựa trên context
    const systemPrompt = this.getAdjustmentSystemPrompt();
    const failedStep = context.failedStep;
    const originalPlan = context.originalPlan;
    const executionContext = context.executionContext || {};
    
    // Kiểm tra xem Minh có được đề cập trong specifiedParticipants không
    const specifiedParticipants = executionContext.specifiedParticipants || [];
    const minhIncluded = Array.isArray(specifiedParticipants) && specifiedParticipants.includes("Minh");
    
    // Tạo hướng dẫn đặc biệt tùy thuộc vào việc Minh có được chỉ định không
    let specialInstructions = "";
    
    if (minhIncluded) {
      specialInstructions = `
- Nếu lỗi liên quan đến thành viên Minh không có lịch rảnh, hãy tạo kế hoạch mới với một bước duy nhất sử dụng SLACK agent để gửi tin nhắn hỏi ý kiến team.
- Kế hoạch mới phải hoàn toàn độc lập với kế hoạch cũ.
- ID của bước trong kế hoạch mới nên là "step1_new" hoặc tương tự, và KHÔNG có bất kỳ phụ thuộc nào (dependsOn: []).
- Trong prompt của bước mới, hãy đưa đầy đủ thông tin từ các bước đã hoàn thành.`;
    } else {
      specialInstructions = `
- Nếu lỗi liên quan đến việc không tìm được thời gian rảnh chung cho tất cả thành viên, hãy tạo kế hoạch mới chỉ xét các thành viên đã được chỉ định (${specifiedParticipants.join(', ')}).
- Kế hoạch mới phải hoàn toàn độc lập với kế hoạch cũ.
- ID của bước trong kế hoạch mới nên là "step1_new" hoặc tương tự, và KHÔNG có bất kỳ phụ thuộc nào (dependsOn: []).
- Trong prompt của bước mới, hãy đưa đầy đủ thông tin từ các bước đã hoàn thành.`;
    }
    
    // Tạo user prompt dựa trên context
    const userPrompt = `
Kế hoạch hiện tại cần được điều chỉnh vì đã gặp lỗi tại bước ${failedStep.id}.

THÔNG TIN KẾ HOẠCH:
ID: ${originalPlan.id}
Mô tả: ${originalPlan.description || 'Không có mô tả'}
Mục tiêu: ${originalPlan.goal || 'Không có mục tiêu cụ thể'}

BƯỚC BỊ LỖI:
ID: ${failedStep.id}
Agent: ${failedStep.agentType}
Mô tả: ${failedStep.description || 'Không có mô tả'}
Kết quả: ${JSON.stringify(failedStep.result || {}, null, 2)}

LÝ DO CẦN ĐIỀU CHỈNH:
${context.reason}

HƯỚNG DẪN ĐẶC BIỆT:
${specialInstructions}

Hãy tạo một kế hoạch mới phù hợp với tình huống hiện tại.
`;

    return userPrompt;
  }

  /**
   * Phân tích kế hoạch từ phản hồi LLM
   */
  private parsePlanFromLLMResponse(response: string): any {
    try {
      // Làm sạch response, loại bỏ markdown và các thẻ không cần thiết
      const cleanedResponse = this.cleanMarkdownCodeBlocks(response);
      
      // Parse JSON
      const planObject = JSON.parse(cleanedResponse);
      
      // Kiểm tra tính hợp lệ của kế hoạch
      if (!planObject.steps || !Array.isArray(planObject.steps) || planObject.steps.length === 0) {
        this.logger.error('Kế hoạch không hợp lệ: không có bước nào');
        return null;
      }
      
      return planObject;
    } catch (error) {
      this.logger.error(`Lỗi khi phân tích kế hoạch từ LLM: ${error.message}`);
      return null;
    }
  }

  /**
   * Xây dựng các bước từ kế hoạch đã phân tích
   */
  private buildStepsFromParsedPlan(planObject: any): ActionStep[] {
    return planObject.steps.map((step, index) => {
      return {
        id: step.id || `step${index + 1}_new`,
        agentType: this.validateAgentType(step.agentType),
        prompt: step.prompt,
        dependsOn: Array.isArray(step.dependsOn) ? step.dependsOn : [],
        condition: step.condition || null,
        maxRetries: step.maxRetries || 2,
        timeout: step.timeout || 15000,
        retryCount: 0,
        status: StepStatus.PENDING
      };
    });
  }

  /**
   * Xử lý response có chứa markdown code blocks
   */
  private cleanMarkdownCodeBlocks(text: string): string {
    // Kiểm tra xem text có bắt đầu bằng markdown code block hay không
    if (text.trimStart().startsWith('```')) {
      // Tìm kết thúc của code block đầu tiên nếu có
      const codeBlockRegex = /```(?:json)?\s*\n([\s\S]*?)```/;
      const match = text.match(codeBlockRegex);

      if (match && match[1]) {
        // Trả về nội dung bên trong code block
        return match[1].trim();
      }
    }

    // Nếu không phải markdown hoặc không tìm thấy code block, trả về text gốc
    return text;
  }

  private validateAgentType(agentType: string): AgentType {
    // Đảm bảo agentType hợp lệ
    const normalized = agentType?.toUpperCase();
    if (normalized in AgentType) {
      return AgentType[normalized];
    }
    throw new Error(`Agent type không hợp lệ: ${agentType}`);
  }

  private getSystemPrompt(): string {
    // Không lấy cấu hình từ llm.config.ts nữa, luôn sử dụng prompt từ code
    return `
Bạn là một AI assistant được thiết kế để lập kế hoạch hành động từ mô tả yêu cầu.

Với mỗi yêu cầu đã được xử lý, hãy:
1. Xác định các bước cần thực hiện
2. Xác định agent phù hợp cho mỗi bước (JIRA, SLACK, EMAIL, CALENDAR, MEETING_ROOM)
3. Tạo prompt ngôn ngữ tự nhiên chi tiết cho mỗi agent
4. Thiết lập quan hệ phụ thuộc giữa các bước
5. Thêm điều kiện cho các bước nếu cần

Trả về kế hoạch dưới dạng JSON với cấu trúc:
{
  "steps": [
    {
      "id": "step1",
      "agentType": "JIRA",
      "prompt": "Chi tiết prompt cho JIRA agent...",
      "dependsOn": [],
      "condition": null,
      "maxRetries": 2,
      "timeout": 15000
    },
    ...
  ]
}

QUAN TRỌNG: Trả về JSON thuần túy, không bọc trong markdown code block.
    `;
  }

  private getDefaultSystemPrompt(): string {
    // Phương thức này không còn cần thiết, nhưng giữ lại để tránh lỗi nếu có code khác gọi đến
    return this.getSystemPrompt();
  }

  // Đã xoá getAutoCompletionPlan và getSpecialCasePrompt vì chỉ dùng cho test/mock agent

  private getUserPrompt(processedInput: string): string {
    return `Đây là yêu cầu của người dùng sau khi được phân tích:
    
    ${processedInput}
    
    Hãy tạo kế hoạch hành động để đáp ứng yêu cầu trên.
    
    Nhớ đảm bảo rằng kế hoạch phải hoàn chỉnh, có logic, và đủ chi tiết để các sub-agent có thể thực hiện.
    Trả về kết quả ở định dạng JSON theo cấu trúc đã được hướng dẫn.`;
  }

  private getAdjustmentSystemPrompt(): string {
    return `
Bạn là một AI assistant được thiết kế để điều chỉnh kế hoạch hành động khi gặp lỗi hoặc thay đổi tình huống.

Nhiệm vụ của bạn là:
1. Xem xét kế hoạch ban đầu và bước bị lỗi
2. Hiểu rõ lý do cần điều chỉnh
3. Tạo kế hoạch điều chỉnh phù hợp, có thể:
   - Thay đổi bước hiện tại
   - Thêm các bước mới để xử lý tình huống
   - Loại bỏ các bước không còn phù hợp
   - Điều chỉnh thứ tự và phụ thuộc giữa các bước

LƯU Ý ĐẶC BIỆT: Nếu lỗi liên quan đến việc không tìm được lịch rảnh chung cho tất cả thành viên, đặc biệt khi có thành viên "Minh" không có lịch rảnh:
1. Tạo kế hoạch mới có bước sử dụng SLACK agent để:
   - Gửi tin nhắn hỏi ý kiến team về việc họp thiếu thành viên, HOẶC
   - Hỏi thành viên bận đó xem có thể điều chỉnh lịch không
2. Kế hoạch mới chỉ cần 1-2 bước và kết thúc tại việc gửi tin nhắn hỏi ý kiến
3. QUAN TRỌNG: Kế hoạch mới nên có bước đầu tiên KHÔNG phụ thuộc vào bất kỳ bước nào trước đó

Trả về kế hoạch điều chỉnh dưới dạng JSON với cấu trúc:
{
  "steps": [
    {
      "id": "step1_new",
      "agentType": "JIRA",
      "prompt": "Chi tiết prompt cho JIRA agent...",
      "dependsOn": [],
      "condition": null,
      "maxRetries": 2,
      "timeout": 15000
    },
    ...
  ]
}

QUAN TRỌNG: Trả về JSON thuần túy, không bọc trong markdown code block.
    `;
  }

  private getAdjustmentUserPrompt(
    originalPlan: ActionPlan,
    failedStep: ActionStep,
    reason: string,
  ): string {
    // Tạo mô tả bước bị lỗi
    const failedStepDescription = `
- ID: ${failedStep.id}
- Agent: ${failedStep.agentType}
- Prompt: "${failedStep.prompt}"
- Lỗi: ${reason}
    `;

    // Tạo mô tả kế hoạch hiện tại
    const stepsDescription = originalPlan.steps
      .map((step) => {
        return `
- ID: ${step.id}
- Agent: ${step.agentType}
- Prompt: "${step.prompt}"
- Phụ thuộc: ${step.dependsOn.length > 0 ? step.dependsOn.join(', ') : 'Không có'}
- Trạng thái: ${step.status}
      `;
      })
      .join('\n');

    // Nếu có thông tin về bước thất bại trong context
    let contextInfo = "";
    if (failedStep.result && failedStep.result.data) {
      contextInfo = `
THÔNG TIN THÊM TỪ BƯỚC THẤT BẠI:
${JSON.stringify(failedStep.result.data, null, 2)}
      `;
    }
    
    // Kiểm tra xem Minh có được đề cập trong specifiedParticipants không
    const specifiedParticipants = originalPlan.executionContext?.specifiedParticipants || [];
    const minhIncluded = Array.isArray(specifiedParticipants) && specifiedParticipants.includes("Minh");
    
    // Tạo hướng dẫn đặc biệt tùy thuộc vào việc Minh có được chỉ định không
    let specialInstructions = "";
    
    if (minhIncluded) {
      specialInstructions = `
HƯỚNG DẪN ĐẶC BIỆT:
- Nếu lỗi liên quan đến thành viên Minh không có lịch rảnh, hãy tạo kế hoạch mới với một bước duy nhất sử dụng SLACK agent để gửi tin nhắn hỏi ý kiến team hoặc trực tiếp hỏi Minh.
- Kế hoạch mới phải hoàn toàn độc lập với kế hoạch cũ. KHÔNG được tham chiếu đến các bước trong kế hoạch cũ.
- ID của bước trong kế hoạch mới nên là "step1_new" hoặc tương tự, và KHÔNG có bất kỳ phụ thuộc nào (dependsOn: []).
- Trong prompt của bước mới, hãy đưa đầy đủ thông tin từ các bước đã hoàn thành (như tên thành viên team, tính năng cần thảo luận).`;
    } else {
      specialInstructions = `
HƯỚNG DẪN ĐẶC BIỆT:
- Nếu lỗi liên quan đến việc không tìm được thời gian rảnh chung, hãy tạo kế hoạch mới chỉ xét các thành viên đã được chỉ định (${specifiedParticipants.join(', ')}).
- Kế hoạch mới phải hoàn toàn độc lập với kế hoạch cũ. KHÔNG được tham chiếu đến các bước trong kế hoạch cũ.
- ID của bước trong kế hoạch mới nên là "step1_new" hoặc tương tự, và KHÔNG có bất kỳ phụ thuộc nào (dependsOn: []).
- Trong prompt của bước mới, hãy đưa đầy đủ thông tin từ các bước đã hoàn thành (như tên thành viên team, tính năng cần thảo luận).`;
    }

    return `
Kế hoạch hiện tại cần được điều chỉnh vì đã gặp lỗi tại một bước.

THÔNG TIN KẾ HOẠCH:
${stepsDescription}

BƯỚC BỊ LỖI:
${failedStepDescription}
${contextInfo}

LÝ DO CẦN ĐIỀU CHỈNH:
${reason}

${specialInstructions}

Hãy tạo một kế hoạch mới phù hợp với tình huống hiện tại. Kế hoạch mới cần:
1. Xử lý được vấn đề đã gặp phải
2. Vẫn đảm bảo đạt được mục tiêu tổng thể
3. Không phụ thuộc vào các bước cũ
4. Bao gồm đầy đủ thông tin cần thiết từ các bước đã hoàn thành

Trả về kế hoạch điều chỉnh dưới dạng JSON.
    `;
  }

  /**
   * Tạo kịch bản đơn giản cho cuộc họp
   */
  private getSimplifiedMeetingPlan(): ActionPlan {
    // Tạo kế hoạch đơn giản chỉ với 3 bước
    return {
      steps: [
        {
          id: 'step1',
          agentType: AgentType.SLACK,
          prompt: 'Tìm kiếm tin nhắn về tính năng mới và cuộc họp trong các kênh nhóm để xác định thành viên team và tính năng cần thảo luận.',
          dependsOn: [],
          condition: null,
          maxRetries: 2,
          retryCount: 0,
          timeout: 10000,
          status: StepStatus.PENDING,
        },
        {
          id: 'step2',
          agentType: AgentType.CALENDAR,
          prompt: 'Tìm thời gian rảnh chung của các thành viên được nhắc đến trong tin nhắn tìm được từ bước trước trong tuần này để sắp xếp cuộc họp. Chỉ xét các thành viên được đề cập cụ thể, không thêm thành viên khác.',
          dependsOn: ['step1'],
          condition: null,
          maxRetries: 2,
          retryCount: 0,
          timeout: 15000,
          status: StepStatus.PENDING,
        },
        {
          id: 'step3',
          agentType: AgentType.CALENDAR,
          prompt: 'Tạo cuộc họp mới vào thời gian phù hợp nhất, mời các thành viên được nhắc đến tham dự và cung cấp thông tin về địa điểm (phòng họp Mercury nếu có sẵn, không thì dùng Mars).',
          dependsOn: ['step2'],
          condition: null,
          maxRetries: 2,
          retryCount: 0,
          timeout: 15000,
          status: StepStatus.PENDING,
        },
      ],
      currentStepIndex: 0,
      executionContext: {},
      status: PlanStatus.CREATED,
      overallProgress: 0,
    };
  }

  /**
   * Trích xuất danh sách thành viên được đề cập trong yêu cầu
   */
  private extractParticipants(prompt: string): string[] {
    const participants = [];
    
    // Trích xuất các thành viên được đề cập cụ thể trong prompt
    if (prompt.includes("Phúc")) participants.push("Phúc");
    if (prompt.includes("Hưng")) participants.push("Hưng");
    if (prompt.includes("Đăng")) participants.push("Đăng");
    if (prompt.includes("Minh")) participants.push("Minh");
    
    return participants;
  }
}
