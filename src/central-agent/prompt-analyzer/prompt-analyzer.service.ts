import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../../openai/openai.service';
import { MCPInventoryService, AgentType, MCPResource, MCPTool } from '../../mcp-client/mcp-inventory.service';
import { EnhancedLogger } from '../../utils/logger';

/**
 * Kết quả phân tích prompt
 */
export interface PromptAnalysisResult {
  action: 'readResource' | 'callTool';
  resourceOrTool: string;
  parameters: Record<string, any>;
  confidence: number;
  originalPrompt: string;
}

/**
 * Service phân tích prompt bằng LLM
 * Sử dụng OpenAI và function calling để phân tích prompt và xác định:
 * - Hành động cần thực hiện (đọc resource hoặc gọi tool)
 * - Resource/tool được sử dụng
 * - Parameters cần thiết
 */
@Injectable()
export class PromptAnalyzerService {
  private readonly logger = EnhancedLogger.getLogger(PromptAnalyzerService.name);

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly mcpInventoryService: MCPInventoryService
  ) {}

  /**
   * Phân tích prompt bằng LLM để xác định hành động, resource/tool và parameters
   * @param prompt Prompt người dùng
   * @param agentType Loại agent (JIRA, CONFLUENCE)
   * @returns Kết quả phân tích
   */
  async analyzePrompt(prompt: string, agentType: AgentType): Promise<PromptAnalysisResult> {
    this.logger.debug(`Analyzing prompt for agent type ${agentType}: "${prompt.substring(0, 50)}..."`);

    try {
      // 1. Lấy danh sách resources và tools từ inventory
      const { resources, tools } = await this.mcpInventoryService.getInventoryByAgentType(agentType);
      
      // 2. Xây dựng prompt cho LLM với thông tin về resources và tools
      const systemPrompt = this.buildSystemPrompt(resources, tools, agentType);
      
      // 3. Gọi OpenAI để phân tích
      const result = await this.openaiService.chatWithFunctionCalling(
        systemPrompt,
        prompt,
        'prompt-analyzer'
      );

      // 4. Phân tích kết quả và trả về
      const analysis = this.parseAnalysisResult(result, prompt);
      
      this.logger.debug(`Analysis result: ${JSON.stringify(analysis)}`);
      return analysis;
    } catch (error) {
      this.logger.error(`Error analyzing prompt: ${error.message}`);
      throw new Error(`Failed to analyze prompt: ${error.message}`);
    }
  }

  /**
   * Xây dựng system prompt cho LLM với thông tin về resources và tools
   * @param resources Danh sách resources
   * @param tools Danh sách tools
   * @param agentType Loại agent
   * @returns System prompt
   */
  private buildSystemPrompt(resources: MCPResource[], tools: MCPTool[], agentType: AgentType): string {
    const resourcesInfo = resources
      .map(r => `- ${r.name}: ${r.description} (URI: ${r.uri})`)
      .join('\n');
    
    const toolsInfo = tools
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');
    
    return `
You are a helpful AI assistant that analyzes user prompts to determine the appropriate MCP (Model Context Protocol) action, resource/tool, and parameters needed.

### TASK
Your task is to analyze the user's prompt and determine:
1. Whether they want to read a resource or call a tool
2. Which specific resource or tool they want to use
3. What parameters are needed for that resource or tool

### AVAILABLE ${agentType} RESOURCES
${resourcesInfo}

### AVAILABLE ${agentType} TOOLS
${toolsInfo}

### INSTRUCTIONS
- Carefully analyze the user's request to understand their intent
- Distinguish between requests that need to read data (use readResource) vs. perform actions (use callTool)
- Select the most appropriate resource or tool based on the user's need
- Extract all required parameters from the prompt
- Return your analysis with high confidence only when you're sure of the mapping
- Support both English and Vietnamese language prompts

### OUTPUT FORMAT
You must respond with a JSON object following this structure:
{
  "action": "readResource" or "callTool",
  "resourceOrTool": "name of resource or tool",
  "parameters": {
    // All parameters needed for the resource/tool
  },
  "confidence": 0.0-1.0 (your confidence in this analysis)
}
`;
  }

  /**
   * Phân tích kết quả từ LLM và chuyển đổi thành PromptAnalysisResult
   * @param result Kết quả từ LLM
   * @param originalPrompt Prompt gốc từ người dùng
   * @returns Kết quả phân tích đã được xử lý
   */
  private parseAnalysisResult(result: string, originalPrompt: string): PromptAnalysisResult {
    try {
      // Tìm và trích xuất JSON từ kết quả LLM
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from LLM response');
      }
      
      const resultJson = JSON.parse(jsonMatch[0]);
      
      // Validate JSON structure
      if (!resultJson.action || !resultJson.resourceOrTool) {
        throw new Error('Invalid analysis result: missing required fields');
      }
      
      // Validate action type
      if (resultJson.action !== 'readResource' && resultJson.action !== 'callTool') {
        throw new Error(`Invalid action type: ${resultJson.action}`);
      }
      
      // Đảm bảo parameters là object
      const parameters = resultJson.parameters || {};
      
      // Đảm bảo confidence là số trong khoảng 0-1
      const confidence = typeof resultJson.confidence === 'number' ? 
        Math.min(Math.max(resultJson.confidence, 0), 1) : 0.5;
      
      return {
        action: resultJson.action,
        resourceOrTool: resultJson.resourceOrTool,
        parameters,
        confidence,
        originalPrompt
      };
    } catch (error) {
      this.logger.error(`Error parsing analysis result: ${error.message}`);
      throw new Error(`Failed to parse analysis result: ${error.message}`);
    }
  }

  /**
   * Lấy schema cho function calling của OpenAI
   * @returns Function schema
   */
  private getFunctionSchema() {
    return {
      name: 'analyze_prompt',
      description: 'Phân tích prompt người dùng để xác định action, resource/tool và parameters',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['readResource', 'callTool'],
            description: 'Loại hành động: đọc resource hoặc gọi tool'
          },
          resourceOrTool: {
            type: 'string',
            description: 'Tên của resource hoặc tool được sử dụng'
          },
          parameters: {
            type: 'object',
            description: 'Parameters cần thiết cho resource/tool'
          },
          confidence: {
            type: 'number',
            description: 'Mức độ tin cậy của phân tích (0-1)'
          }
        },
        required: ['action', 'resourceOrTool', 'parameters']
      }
    };
  }
}
