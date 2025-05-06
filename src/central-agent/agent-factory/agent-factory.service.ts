import { Injectable } from '@nestjs/common';
import { AgentType, StepResult } from '../models/action-plan.model';
import { EnhancedLogger } from '../../utils/logger';
import { MockJiraAgent } from '../agents/mock-jira-agent';
import { MockSlackAgent } from '../agents/mock-slack-agent';
import { MockConfluenceAgent } from '../agents/mock-confluence-agent';
import { MockCalendarAgent } from '../agents/mock-calendar-agent';

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
  
  constructor(
    private readonly mockJiraAgent: MockJiraAgent,
    private readonly mockSlackAgent: MockSlackAgent,
    private readonly mockConfluenceAgent: MockConfluenceAgent,
    private readonly mockCalendarAgent: MockCalendarAgent,
  ) {}
  
  /**
   * Tạo agent phù hợp dựa vào loại
   */
  getAgent(agentType: AgentType): IAgent {
    this.logger.debug(`Creating agent for type: ${agentType}`);
    
    switch (agentType) {
      case AgentType.JIRA:
        return this.mockJiraAgent;
      case AgentType.SLACK:
        return this.mockSlackAgent;
      case AgentType.CALENDAR:
        return this.mockCalendarAgent;
      case AgentType.CONFLUENCE:
        return this.mockConfluenceAgent;
      case AgentType.EMAIL:
      case AgentType.MEETING_ROOM:
        // Sử dụng Calendar agent cho meeting room
        return this.mockCalendarAgent;
      default:
        this.logger.warn(`Không có agent cho loại ${agentType}, sử dụng fallback`);
        // Fallback agent đơn giản
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
  
  /**
   * Tạo mới agent theo loại
   */
  createAgent(agentType: AgentType): IAgent {
    return this.getAgent(agentType);
  }
} 