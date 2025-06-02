import { Injectable } from '@nestjs/common';
import { AgentType, StepResult } from '../models/action-plan.model';
import { EnhancedLogger } from '../../utils/logger';
import { MCPJiraAgent } from '../agents/mcp-jira-agent';
import { MCPConfluenceAgent } from '../agents/mcp-confluence-agent';
import { ConfigService } from '@nestjs/config';

/**
 * Interface đại diện cho một Sub-Agent
 */
export interface IAgent {
  executePrompt(prompt: string, options?: any): Promise<StepResult>;
}

/**
 * Agent Factory để tạo các agent
 */
@Injectable()
export class AgentFactory {
  private readonly logger = EnhancedLogger.getLogger(AgentFactory.name);
  private readonly useMCP: boolean;
  
  constructor(
    private readonly mcpJiraAgent: MCPJiraAgent,
    private readonly mcpConfluenceAgent: MCPConfluenceAgent,
    private readonly configService: ConfigService,
  ) {
    this.useMCP = this.configService.get<boolean>('USE_MCP_AGENTS', false);
    this.logger.log(`Agent Factory initialized with MCP ${this.useMCP ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Tạo agent phù hợp dựa vào loại
   */
  getAgent(agentType: AgentType): IAgent {
    this.logger.debug(`Creating agent for type: ${agentType}`);
    
    if (this.useMCP) {
      switch (agentType) {
        case AgentType.JIRA:
          return this.mcpJiraAgent;
        case AgentType.CONFLUENCE:
          return this.mcpConfluenceAgent;
      }
    }
    
    switch (agentType) {
      case AgentType.JIRA:
        return this.useMCP ? this.mcpJiraAgent : this.createFallbackAgent();
      case AgentType.CONFLUENCE:
        return this.useMCP ? this.mcpConfluenceAgent : this.createFallbackAgent();
      case AgentType.SLACK:
      case AgentType.CALENDAR:
      case AgentType.EMAIL:
      case AgentType.MEETING_ROOM:
      default:
        this.logger.warn(`Không có agent cho loại ${agentType}, sử dụng fallback`);
        return this.createFallbackAgent();
    }
  }
  
  /**
   * Tạo mới agent theo loại
   */
  createAgent(agentType: AgentType): IAgent {
    return this.getAgent(agentType);
  }
  
  /**
   * Tạo fallback agent đơn giản
   */
  private createFallbackAgent(): IAgent {
        return {
          executePrompt: async (prompt: string): Promise<StepResult> => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return {
              success: true,
              data: { message: `Default agent executed: ${prompt}` },
              metadata: { executionTime: 200, tokenUsage: 100 }
            };
          }
        };
  }
}