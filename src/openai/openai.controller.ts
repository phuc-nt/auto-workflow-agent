import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { FetchDataDto } from './dto/fetch-data.dto';
import { LLMConfig } from '../config/llm.config';

@Controller('openai')
export class OpenaiController {
  private readonly logger = new Logger(OpenaiController.name);
  
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('chat')
  async chat(@Body('prompt') prompt: string) {
    this.logger.log(`API Request - chat với prompt: ${prompt?.substring(0, 50)}...`);
    return { result: await this.openaiService.chat(prompt) };
  }

  @Post('fetch-data')
  async fetchData(@Body() fetchDataDto: FetchDataDto) {
    this.logger.log(`API Request - fetchData với URL: ${fetchDataDto.url}`);
    return this.openaiService.fetchData(fetchDataDto);
  }
  
  @Get('model')
  getModel() {
    const model = this.openaiService.getModel();
    this.logger.log(`API Request - getModel, model hiện tại: ${model}`);
    return { model };
  }
  
  @Get('config')
  getLLMConfig() {
    const config = this.openaiService.getLLMConfig();
    this.logger.log(`API Request - getLLMConfig: ${JSON.stringify(config)}`);
    return { config };
  }
  
  @Post('config')
  updateLLMConfig(@Body() config: Partial<LLMConfig>) {
    this.logger.log(`API Request - updateLLMConfig: ${JSON.stringify(config)}`);
    this.openaiService.updateLLMConfig(config);
    return { success: true, config: this.openaiService.getLLMConfig() };
  }
  
  @Post('test-model')
  async testModel(@Body() data: { model?: string, prompt: string }) {
    const oldConfig = this.openaiService.getLLMConfig();
    this.logger.log(`API Request - testModel với model: ${data.model || oldConfig.model}, prompt: ${data.prompt.substring(0, 50)}...`);
    
    try {
      // Tạm thời đổi model nếu được chỉ định
      if (data.model) {
        this.openaiService.updateLLMConfig({ model: data.model });
      }
      
      // Thực hiện chat
      const startTime = Date.now();
      const result = await this.openaiService.chat(data.prompt);
      const executionTime = Date.now() - startTime;
      
      this.logger.log(`Test model thành công, thời gian: ${executionTime}ms`);
      
      // Khôi phục lại cấu hình cũ nếu đã thay đổi
      if (data.model) {
        this.openaiService.updateLLMConfig(oldConfig);
      }
      
      return {
        success: true,
        result,
        model: data.model || oldConfig.model,
        executionTime,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi test model: ${error.message}`);
      
      // Khôi phục lại cấu hình cũ nếu đã thay đổi
      if (data.model) {
        this.openaiService.updateLLMConfig(oldConfig);
      }
      
      return {
        success: false,
        error: error.message,
        model: data.model || oldConfig.model,
      };
    }
  }
}
