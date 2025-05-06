import { Injectable } from '@nestjs/common';
import { ActionPlan, StepStatus } from '../models/action-plan.model';
import { OpenaiService } from '../../openai/openai.service';
import { EnhancedLogger } from '../../utils/logger';

@Injectable()
export class ResultSynthesizerService {
  private readonly logger = EnhancedLogger.getLogger(ResultSynthesizerService.name);
  
  constructor(private readonly openaiService: OpenaiService) {}
  
  async synthesizeResult(
    actionPlan: ActionPlan,
    processedInput: string,
  ): Promise<string> {
    this.logger.log('Bắt đầu tổng hợp kết quả thực thi');
    
    // Nếu kế hoạch không hoàn thành, trả về kết quả đơn giản
    if (actionPlan.status !== 'completed') {
      return `Kế hoạch thực thi đã ${actionPlan.status}. Tiến độ: ${actionPlan.overallProgress}%`;
    }
    
    try {
      const currentConfig = this.openaiService.getLLMConfig();
      this.logger.log(`ResultSynthesizer sử dụng model: ${currentConfig.model}, temperature: ${currentConfig.temperature}`);
      
      // Tạo context cho yêu cầu
      const context = this.prepareContext(actionPlan, processedInput);
      
      // Lấy cấu hình prompt từ cấu hình tập trung
      const promptConfig = this.openaiService.getPromptConfig('resultSynthesizer');
      
      if (!promptConfig) {
        this.logger.warn('Không tìm thấy cấu hình prompt cho ResultSynthesizer, sử dụng mặc định');
      }
      
      // Gọi OpenAI API để tổng hợp kết quả
      const systemPrompt = promptConfig?.systemPrompt || this.getDefaultSystemPrompt();
      const userPrompt = this.getUserPrompt(context);
      
      this.logger.debug('Bắt đầu gọi chatWithSystem với system prompt và user prompt');
      // Sử dụng phương thức chatWithSystem thay vì chatWithFunctionCalling
      const response = await this.openaiService.chatWithSystem(systemPrompt, userPrompt);
      
      this.logger.debug(`Kết quả tổng hợp: ${response.substring(0, 100)}...`);
      this.logger.log('Đã tổng hợp kết quả thực thi thành công');
      return response;
    } catch (error) {
      this.logger.error(`Lỗi khi tổng hợp kết quả: ${error.message}`);
      // Trả về kết quả đơn giản nếu gặp lỗi
      return `Đã thực hiện ${this.countSuccessfulSteps(actionPlan)}/${actionPlan.steps.length} bước thành công.`;
    }
  }
  
  private getDefaultSystemPrompt(): string {
    return `
Bạn là một AI assistant được thiết kế để tổng hợp kết quả từ nhiều bước thực thi.

Với kết quả từ mỗi bước, hãy:
1. Phân tích trạng thái và dữ liệu trả về
2. Tổng hợp thành một phản hồi ngắn gọn, rõ ràng
3. Tập trung vào kết quả đạt được và các lỗi quan trọng
4. Sử dụng ngôn ngữ tự nhiên, thân thiện

Đảm bảo phản hồi ngắn gọn, dễ hiểu và cung cấp đầy đủ thông tin cần thiết.
    `;
  }
  
  private getUserPrompt(context: any): string {
    return `
Tổng hợp kết quả thực hiện kế hoạch với các bước sau:

${context.stepSummaries}

Trạng thái tổng thể: ${context.plan.status}
Tiến độ: ${context.plan.overallProgress}%

Dựa trên các kết quả trên, hãy tạo một tóm tắt ngắn gọn rõ ràng của toàn bộ quá trình thực thi để trả lời cho người dùng.
Tập trung vào các kết quả đạt được, thông tin quan trọng và các lỗi nếu có.
Sử dụng ngôn ngữ tự nhiên, thân thiện và ngắn gọn.
    `;
  }
  
  private prepareContext(actionPlan: ActionPlan, processedInput: string): any {
    // Tạo tóm tắt cho mỗi bước
    const stepSummaries = actionPlan.steps.map(step => {
      const status = this.formatStatus(step.status);
      let summary = `Bước ${step.id} (${step.agentType}): ${step.prompt}\nTrạng thái: ${status}`;
      
      if (step.result) {
        if (step.result.success) {
          summary += `\nKết quả: ${this.formatResultData(step.result.data)}`;
        } else if (step.result.error) {
          summary += `\nLỗi: ${JSON.stringify(step.result.error)}`;
        }
      }
      
      return summary;
    }).join('\n\n');
    
    return {
      plan: {
        status: actionPlan.status,
        overallProgress: actionPlan.overallProgress,
        startTime: actionPlan.startTime,
        endTime: actionPlan.endTime,
      },
      stepSummaries,
      processedInput,
    };
  }
  
  private formatStatus(status: StepStatus): string {
    const statusMap = {
      pending: 'Đang chờ',
      waiting: 'Đang chờ các bước phụ thuộc',
      running: 'Đang thực thi',
      succeeded: 'Thành công',
      failed: 'Thất bại',
      retrying: 'Đang thử lại',
      skipped: 'Bỏ qua',
      cancelled: 'Đã hủy',
    };
    
    return statusMap[status] || status;
  }
  
  private formatResultData(data: any): string {
    if (!data) return 'Không có dữ liệu';
    
    // Xử lý trường hợp data là object có thuộc tính message
    if (data.message) {
      return data.message;
    }
    
    // Xử lý trường hợp data là array
    if (Array.isArray(data)) {
      return data.map(item => JSON.stringify(item)).join(', ');
    }
    
    // Nếu là object phức tạp, chuyển thành string
    return JSON.stringify(data);
  }
  
  private countSuccessfulSteps(actionPlan: ActionPlan): number {
    return actionPlan.steps.filter(step => step.status === 'succeeded').length;
  }
} 