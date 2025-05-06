import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OpenAI } from 'openai';
import { FetchDataDto, FetchDataResponseDto } from './dto/fetch-data.dto';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { DEFAULT_LLM_CONFIG, LLMConfig, PromptConfig, PROMPT_CONFIGS } from '../config/llm.config';
import { CostMonitoringService, TokenUsage } from '../cost-monitoring/cost-monitoring.service';
import { countTokens } from '../utils/token-counter';

// Định nghĩa interface cho adapter
export interface AuthAdapter {
  getAuthHeaders(): Record<string, string>;
}

// Adapter cho Jira authentication
export class JiraAuthAdapter implements AuthAdapter {
  constructor(
    private readonly email: string,
    private readonly apiToken: string,
  ) {}

  getAuthHeaders(): Record<string, string> {
    const authHeader = `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`;
    return {
      Authorization: authHeader,
      Accept: 'application/json',
    };
  }
}

// Adapter cho Slack authentication
export class SlackAuthAdapter implements AuthAdapter {
  constructor(private readonly botToken: string) {}

  getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.botToken}`,
      'Content-Type': 'application/json',
    };
  }
}

// Adapter mặc định (không có auth)
export class NoAuthAdapter implements AuthAdapter {
  getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }
}

@Injectable()
export class OpenaiService {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);
  private llmConfig: LLMConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly costMonitoringService?: CostMonitoringService, // Optional để tránh circular dependency
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    
    this.llmConfig = { ...DEFAULT_LLM_CONFIG };
    
    // Cho phép override bằng biến môi trường
    const envModel = this.configService.get<string>('OPENAI_MODEL');
    if (envModel) {
      this.llmConfig.model = envModel;
    }
    
    this.logger.log(`Khởi tạo OpenAI Service với model: ${this.llmConfig.model}, temperature: ${this.llmConfig.temperature}`);
  }

  /**
   * Lấy cấu hình model hiện tại
   */
  getLLMConfig(): LLMConfig {
    return { ...this.llmConfig };
  }
  
  /**
   * Cập nhật cấu hình model
   */
  updateLLMConfig(config: Partial<LLMConfig>): void {
    const oldModel = this.llmConfig.model;
    const oldTemp = this.llmConfig.temperature;
    
    this.llmConfig = { ...this.llmConfig, ...config };
    
    this.logger.log(`Cập nhật cấu hình LLM: model từ [${oldModel}] thành [${this.llmConfig.model}], temperature từ [${oldTemp}] thành [${this.llmConfig.temperature}]`);
  }
  
  /**
   * Lấy cấu hình prompt theo loại
   */
  getPromptConfig(type: string): PromptConfig | undefined {
    const config = PROMPT_CONFIGS[type];
    if (config) {
      this.logger.debug(`Đã tìm thấy cấu hình prompt cho [${type}]`);
    } else {
      this.logger.warn(`Không tìm thấy cấu hình prompt cho [${type}]`);
    }
    return config;
  }

  /**
   * Lấy thông tin về model đang được sử dụng
   */
  getModel(): string {
    return this.llmConfig.model;
  }

  /**
   * Theo dõi việc sử dụng token
   */
  private async trackTokenUsage(data: {
    operation: string;
    component?: string;
    promptTokens: number;
    completionTokens: number;
    executionTime?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // Nếu không có cost monitoring service, bỏ qua
    if (!this.costMonitoringService) {
      return;
    }
    
    try {
      const tokenUsage: TokenUsage = {
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.promptTokens + data.completionTokens
      };
      
      await this.costMonitoringService.trackTokenUsage({
        model: this.llmConfig.model,
        component: data.component || 'unknown',
        operation: data.operation,
        tokenUsage,
        metadata: {
          ...(data.metadata || {}),
          executionTime: data.executionTime
        }
      });
    } catch (error) {
      this.logger.error(`Error tracking token usage: ${error.message}`);
    }
  }

  async chat(prompt: string, component: string = 'unknown') {
    try {
      const startTime = Date.now();
      this.logger.log(`Gọi OpenAI chat với model [${this.llmConfig.model}], temperature [${this.llmConfig.temperature}]`);
      
      // Ước tính số token dùng cho prompt
      const promptTokens = countTokens(prompt, this.llmConfig.model);
      
      const response = await this.openai.chat.completions.create({
        model: this.llmConfig.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.llmConfig.temperature,
        max_tokens: this.llmConfig.maxTokens,
      });

      const executionTime = Date.now() - startTime;
      
      // Theo dõi việc sử dụng token
      await this.trackTokenUsage({
        operation: 'chat',
        component,
        promptTokens: response.usage?.prompt_tokens || promptTokens,
        completionTokens: response.usage?.completion_tokens || 0,
        executionTime,
        metadata: { prompt }
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error calling OpenAI: ${error.message}`);
      throw error;
    }
  }

  /**
   * Thực hiện chat với system prompt và user prompt
   */
  async chatWithSystem(systemPrompt: string, userPrompt: string, component: string = 'unknown') {
    try {
      const startTime = Date.now();
      this.logger.log(`Gọi OpenAI chatWithSystem với model [${this.llmConfig.model}], temperature [${this.llmConfig.temperature}]`);
      
      // Ước tính số token dùng cho prompt
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];
      const promptTokens = countTokens(systemPrompt, this.llmConfig.model) + 
                          countTokens(userPrompt, this.llmConfig.model) + 10; // 10 token for message format
      
      const response = await this.openai.chat.completions.create({
        model: this.llmConfig.model,
        messages,
        temperature: this.llmConfig.temperature,
        max_tokens: this.llmConfig.maxTokens,
      });

      const executionTime = Date.now() - startTime;
      
      // Theo dõi việc sử dụng token
      await this.trackTokenUsage({
        operation: 'chatWithSystem',
        component,
        promptTokens: response.usage?.prompt_tokens || promptTokens,
        completionTokens: response.usage?.completion_tokens || 0,
        executionTime,
        metadata: { 
          systemPrompt,
          userPrompt 
        }
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error with system prompt chat: ${error.message}`);
      throw error;
    }
  }

  async chatWithFunctionCalling(systemPrompt: string, userPrompt: string, component: string = 'unknown') {
    try {
      const startTime = Date.now();
      this.logger.log(`Gọi OpenAI chatWithFunctionCalling với model [${this.llmConfig.model}], temperature [${this.llmConfig.temperature}]`);
      
      // Ước tính số token dùng cho prompt
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];
      const promptTokens = countTokens(systemPrompt, this.llmConfig.model) + 
                          countTokens(userPrompt, this.llmConfig.model) + 
                          countTokens(JSON.stringify(this.getFetchDataFunction()), this.llmConfig.model);
      
      const response = await this.openai.chat.completions.create({
        model: this.llmConfig.model,
        messages,
        temperature: this.llmConfig.temperature,
        max_tokens: this.llmConfig.maxTokens,
        tools: [
          {
            type: 'function',
            function: this.getFetchDataFunction(),
          },
        ],
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0].message;
      let completionTokens = response.usage?.completion_tokens || 0;

      // Check if there are tool_calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Prepare the messages array for the next call
        const messagesWithToolResults: ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
          responseMessage,
        ];

        // Process each tool call
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const functionArgs = JSON.parse(toolCall.function.arguments);

          let result;
          if (functionName === 'fetchData') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            result = await this.fetchDataWithAuth(functionArgs);
          } else {
            // Process other functions if any
            continue;
          }

          // Add the result to the messages array
          messagesWithToolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        this.logger.log(`Gọi lại OpenAI với kết quả function calls, model [${this.llmConfig.model}]`);
        
        // Ước tính số token cho tool results
        const toolResultsContent = messagesWithToolResults
          .filter(m => m.role === 'tool')
          .map(m => m.content)
          .join('');
        const toolResultsTokens = countTokens(toolResultsContent, this.llmConfig.model);
        
        // Call OpenAI again with all results from the functions
        const secondResponse = await this.openai.chat.completions.create({
          model: this.llmConfig.model,
          messages: messagesWithToolResults,
          temperature: this.llmConfig.temperature,
          max_tokens: this.llmConfig.maxTokens,
        });

        // Cập nhật số token
        completionTokens += secondResponse.usage?.completion_tokens || 0;
        
        const executionTime = Date.now() - startTime;
      
        // Theo dõi việc sử dụng token
        await this.trackTokenUsage({
          operation: 'chatWithFunctionCalling',
          component,
          promptTokens: response.usage?.prompt_tokens + (secondResponse.usage?.prompt_tokens - response.usage?.completion_tokens) || promptTokens + toolResultsTokens,
          completionTokens,
          executionTime,
          metadata: { 
            systemPrompt,
            userPrompt,
            functionCalls: responseMessage.tool_calls?.length || 0
          }
        });

        return secondResponse.choices[0].message.content;
      }

      const executionTime = Date.now() - startTime;
      
      // Theo dõi việc sử dụng token (không có function calls)
      await this.trackTokenUsage({
        operation: 'chatWithFunctionCalling',
        component,
        promptTokens: response.usage?.prompt_tokens || promptTokens,
        completionTokens,
        executionTime,
        metadata: { 
          systemPrompt,
          userPrompt
        }
      });

      return responseMessage.content;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error with function calling: ${error.message}`);
      throw error;
    }
  }

  /**
   * Định nghĩa function fetchData cho function calling
   */
  private getFetchDataFunction() {
    return {
      name: 'fetchData',
      description: 'Make a request to a URL',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Full URL to get data',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'HTTP method, default is GET',
            default: 'GET',
          },
          headers: {
            type: 'object',
            description: 'Additional headers for the request',
          },
          body: {
            type: 'object',
            description: 'Body for the request (only for POST, PUT)',
          },
          authType: {
            type: 'string',
            enum: ['none', 'jira', 'slack'],
            description: 'Type of authentication to use',
            default: 'none',
          },
        },
        required: ['url'],
      },
    };
  }

  async fetchDataWithAuth(
    fetchDataDto: FetchDataDto,
  ): Promise<FetchDataResponseDto> {
    try {
      const {
        url,
        method = 'GET',
        headers = {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        body,
        authType = 'none',
      } = fetchDataDto;

      // Chọn adapter dựa trên loại xác thực
      let authAdapter: AuthAdapter;

      switch (authType) {
        case 'jira':
          authAdapter = new JiraAuthAdapter(
            this.configService.get<string>('JIRA_EMAIL'),
            this.configService.get<string>('JIRA_API_TOKEN'),
          );
          break;
        case 'slack':
          authAdapter = new SlackAuthAdapter(
            this.configService.get<string>('SLACK_BOT_TOKEN'),
          );
          break;
        default:
          authAdapter = new NoAuthAdapter();
      }

      // Lấy headers xác thực từ adapter
      const authHeaders = authAdapter.getAuthHeaders();

      const response = await firstValueFrom(
        this.httpService.request({
          url,
          method,
          headers: {
            ...authHeaders,
            ...headers,
          },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: body,
        }),
      );

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error fetching data: ${error.message}`);
      throw error;
    }
  }

  // Giữ lại phương thức nguyên bản để tương thích ngược
  async fetchData(fetchDataDto: FetchDataDto): Promise<FetchDataResponseDto> {
    return this.fetchDataWithAuth({ ...fetchDataDto });
  }
}
