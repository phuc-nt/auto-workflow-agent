import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../../openai/openai.service';
import { EnhancedLogger } from '../../utils/logger';

@Injectable()
export class InputProcessor {
  private readonly logger = EnhancedLogger.getLogger(InputProcessor.name);
  
  constructor(private readonly openaiService: OpenaiService) {}
  
  /**
   * Xử lý đầu vào từ người dùng để xác định ý định và ngữ cảnh
   */
  async processInput(
    input: string,
    context: Record<string, any> = {},
  ): Promise<string> {
    this.logger.log(`Đang xử lý đầu vào: ${input}`);
    
    const currentConfig = this.openaiService.getLLMConfig();
    this.logger.log(`InputProcessor sử dụng model: ${currentConfig.model}, temperature: ${currentConfig.temperature}`);

    try {
      // Lấy cấu hình prompt từ cấu hình tập trung
      const promptConfig = this.openaiService.getPromptConfig('inputProcessor');
      
      if (!promptConfig) {
        this.logger.warn('Không tìm thấy cấu hình prompt cho InputProcessor, sử dụng mặc định');
      }
      
      const systemPrompt = promptConfig?.systemPrompt || this.getDefaultSystemPrompt();
      const userPrompt = this.getUserPrompt(input, context);
      
      this.logger.debug('Bắt đầu gọi chatWithSystem với system prompt và user prompt');
      // Sử dụng phương thức chat với system prompt
      const result = await this.openaiService.chatWithSystem(systemPrompt, userPrompt);
      
      // Xử lý kết quả nếu cần...
      this.logger.debug(`Kết quả xử lý: ${result.substring(0, 100)}...`);
      
      this.logger.log('Xử lý đầu vào thành công');
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi xử lý đầu vào: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Tạo prompt cho người dùng
   */
  private getUserPrompt(input: string, context: Record<string, any>): string {
    return `
Phân tích yêu cầu sau của người dùng: "${input}"

Thông tin ngữ cảnh:
- Người dùng: ${context.user?.name || 'Không xác định'}
- Dự án: ${context.project?.name || 'Không xác định'}
- Lịch sử hội thoại: 
${context.conversationHistory ? context.conversationHistory.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n') : 'Không có'}

Mô tả chi tiết:
1. Ý định của người dùng và các hành động cần thiết
2. Các thông tin cần thiết như project, timeline, status, v.v.
3. Bất kỳ ngữ cảnh bổ sung nào

Trả về mô tả dưới dạng văn bản tự nhiên, rõ ràng và đầy đủ chi tiết.
`;
  }
  
  /**
   * System prompt mặc định nếu không tìm thấy trong cấu hình
   */
  private getDefaultSystemPrompt(): string {
    return `
Bạn là một AI assistant được thiết kế để phân tích yêu cầu người dùng và chuyển thành mô tả chi tiết.

Với mỗi yêu cầu, hãy:
1. Phân tích ý định chính
2. Xác định các thông tin quan trọng (user, project, time, etc.)
3. Mô tả chi tiết những gì người dùng muốn thực hiện

Trả về mô tả dưới dạng văn bản tự nhiên, rõ ràng và đầy đủ chi tiết.
`;
  }
} 