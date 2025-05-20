import { Injectable } from '@nestjs/common';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';
import { JiraMCPService } from '../../mcp-client/jira-mcp.service';
import { EnhancedLogger } from '../../utils/logger';
import { PromptAnalyzerService } from '../prompt-analyzer/prompt-analyzer.service';
import { AgentType } from '../../mcp-client/mcp-inventory.service';

@Injectable()
export class MCPJiraAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger(MCPJiraAgent.name);

  constructor(
    private readonly jiraMCPService: JiraMCPService,
    private readonly promptAnalyzer: PromptAnalyzerService
  ) {}

  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    try {
      this.logger.log(`Executing Jira prompt: ${prompt.substring(0, 50)}...`);
      
      // Sử dụng PromptAnalyzerService để phân tích prompt
      const analysis = await this.promptAnalyzer.analyzePrompt(prompt, AgentType.JIRA);
      
      this.logger.debug(`Prompt analysis result: ${JSON.stringify(analysis)}`);
      
      // Nếu phân tích không đáng tin cậy, sử dụng phân tích regex truyền thống
      if (analysis.confidence < 0.7) {
        this.logger.warn(`Low confidence in analysis (${analysis.confidence}), falling back to regex parsing`);
        return this.handleWithRegexParsing(prompt);
      }
      
      // Xử lý dựa trên phân tích LLM
      if (analysis.action === 'readResource') {
        // Xử lý đọc resource
        try {
          const resourceName = analysis.resourceOrTool.toLowerCase();
          
          // Xử lý theo loại resource
          if (resourceName.includes('project') || resourceName === 'jira://projects') {
            // Lấy danh sách projects
            this.logger.debug(`Getting projects from Jira`);
            const projects = await this.jiraMCPService.getProjects();
            return {
              success: true,
              data: { projects }
            };
          } else if (resourceName.includes('issue') || resourceName.includes('jira://issues')) {
            // Lấy danh sách issues với JQL
            this.logger.debug(`Getting issues with JQL: ${analysis.parameters?.jql || ''}`);
            const issues = await this.jiraMCPService.getIssues(analysis.parameters?.jql || '');
            return {
              success: true,
              data: { issues }
            };
          } else if (resourceName.includes('user') || resourceName.includes('jira://user')) {
            // Lấy thông tin user
            const username = analysis.parameters?.query || 'current';
            this.logger.debug(`Getting user info for: ${username}`);
            const userInfo = await this.jiraMCPService.getUserInfo(username);
            return {
              success: true,
              data: { user: userInfo }
            };
          } else {
            // Fallback cho các resource khác
            const path = resourceName.startsWith('jira://') ? 
              resourceName.substring(7) : resourceName;
            
            this.logger.debug(`Reading generic resource: ${path}`);
            const result = await this.jiraMCPService.readJiraResource(path);
            
            return {
              success: true,
              data: { result }
            };
          }
        } catch (error) {
          return {
            success: false,
            error: `Error reading resource: ${error.message}`
          };
        }
      } else if (analysis.action === 'callTool') {
        // Xử lý gọi tool
        try {
          const toolName = analysis.resourceOrTool;
          
          // Dựa vào tên tool để gọi phương thức tương ứng
          switch(toolName.toLowerCase()) {
            case 'createissue':
              const issue = await this.jiraMCPService.createIssue(
                analysis.parameters.projectKey,
                analysis.parameters.summary,
                analysis.parameters.description,
                analysis.parameters.issueType || 'Task'
              );
              return {
                success: true,
                data: { issue }
              };
              
            case 'updateissue':
              const updateResult = await this.jiraMCPService.updateIssue(
                analysis.parameters.issueKey,
                analysis.parameters.fields || {}
              );
              return {
                success: true,
                data: { result: updateResult }
              };
              
            case 'addcomment':
              const comment = await this.jiraMCPService.addComment(
                analysis.parameters.issueKey,
                analysis.parameters.comment
              );
              return {
                success: true,
                data: { comment }
              };
              
            case 'addworklog':
            case 'logwork':
              const timeSpent = analysis.parameters.timeSpentSeconds || 
                this.convertTimeToSeconds(analysis.parameters.timeSpent || '1h');
                
              const worklog = await this.jiraMCPService.addWorklog(
                analysis.parameters.issueKey,
                timeSpent,
                analysis.parameters.comment
              );
              return {
                success: true,
                data: { worklog }
              };
              
            default:
              return {
                success: false,
                error: `Unsupported Jira tool: ${toolName}`
              };
          }
        } catch (error) {
          return {
            success: false,
            error: `Error calling tool: ${error.message}`
          };
        }
      } else {
        return {
          success: false,
          error: `Unknown action: ${analysis.action}`,
        };
      }
    } catch (error) {
      this.logger.error(`Error executing prompt: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Xử lý prompt bằng regex parsing khi LLM phân tích có độ tin cậy thấp
   */
  private async handleWithRegexParsing(prompt: string): Promise<StepResult> {
    try {
      const { action, params } = this.parsePrompt(prompt);
      
      switch (action) {
        case 'getIssues':
          return await this.getIssues(params);
        case 'createIssue':
          return await this.createIssue(params);
        case 'updateIssue':
          return await this.updateIssue(params);
        case 'addComment':
          return await this.addComment(params);
        case 'logWork':
          return await this.logWork(params);
        default:
          return {
            success: false,
            error: `Unsupported action: ${action}`,
          };
      }
    } catch (error) {
      this.logger.error(`Error in regex parsing: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private parsePrompt(prompt: string): { action: string; params: any } {
    try {
      const lowercasePrompt = prompt.toLowerCase();

      // Improved issue searching detection
      if (lowercasePrompt.includes('get issues') || 
          lowercasePrompt.includes('find issues') ||
          lowercasePrompt.includes('search issues') ||
          lowercasePrompt.includes('list issues') ||
          lowercasePrompt.includes('show issues') ||
          lowercasePrompt.includes('view issues') ||
          lowercasePrompt.includes('truy xuất') ||
          lowercasePrompt.includes('tìm kiếm') ||
          (lowercasePrompt.includes('issues') && 
           (lowercasePrompt.includes('project') || lowercasePrompt.includes('status')))
      ) {
        return {
          action: 'getIssues',
          params: { 
            jql: this.extractJQL(prompt) 
          }
        };
      }

      if (lowercasePrompt.includes('create issue') || lowercasePrompt.includes('create task')) {
        return {
          action: 'createIssue',
          params: this.extractIssueDetails(prompt)
        };
      }

      if (lowercasePrompt.includes('update issue') || lowercasePrompt.includes('update task')) {
        return {
          action: 'updateIssue',
          params: this.extractUpdateDetails(prompt)
        };
      }

      if (lowercasePrompt.includes('add comment')) {
        return {
          action: 'addComment',
          params: this.extractCommentDetails(prompt)
        };
      }

      if (lowercasePrompt.includes('log work') || lowercasePrompt.includes('add worklog')) {
        return {
          action: 'logWork',
          params: this.extractWorklogDetails(prompt)
        };
      }

      throw new Error(`Could not parse action from prompt: ${prompt}`);
    } catch (error) {
      this.logger.error(`Error parsing prompt: ${error.message}`);
      throw error;
    }
  }

  private extractJQL(prompt: string): string {
    // Improved JQL extraction with better pattern matching
    const projectMatch = prompt.match(/project\s*[=:]?\s*['"]?(\w+)['"]?/i) ||
                        prompt.match(/(?:from|in|of)\s+project\s+['"]?(\w+)['"]?/i) ||
                        prompt.match(/dự án\s+['"]?(\w+)['"]?/i);
    
    const statusMatch = prompt.match(/status\s*[=:]?\s*['"]([^'"]+)['"]/) ||
                       prompt.match(/(?:with|has)\s+status\s+['"]([^'"]+)['"]/) ||
                       prompt.match(/trạng thái\s+['"]([^'"]+)['"]/) ||
                       prompt.match(/status\s+(?:is|in|=)\s+['"]([^'"]+)['"]/i);
    
    const jqlParts = [];
    
    if (projectMatch) {
      jqlParts.push(`project = "${projectMatch[1]}"`);
    }
    
    if (statusMatch) {
      const status = statusMatch[1].trim();
      jqlParts.push(`status = "${status}"`);
    }
    
    // Add default ordering if no conditions
    return jqlParts.length > 0 
      ? jqlParts.join(' AND ') + ' ORDER BY created DESC'
      : 'created >= -30d ORDER BY created DESC';
  }

  private extractIssueDetails(prompt: string): any {
    // Basic extraction, can be enhanced with LLM
    const projectMatch = prompt.match(/project[:\s]+(\w+)/i);
    const summaryMatch = prompt.match(/summary[:\s]+"([^"]+)"/i);
    const descriptionMatch = prompt.match(/description[:\s]+"([^"]+)"/i);
    
    return {
      projectKey: projectMatch ? projectMatch[1] : 'DEFAULT',
      summary: summaryMatch ? summaryMatch[1] : 'New Issue',
      description: descriptionMatch ? descriptionMatch[1] : '',
      issueType: 'Task'
    };
  }

  private extractUpdateDetails(prompt: string): any {
    const issueKeyMatch = prompt.match(/issue[:\s]+(\w+-\d+)/i);
    const statusMatch = prompt.match(/status[:\s]+"([^"]+)"/i);
    
    return {
      issueKey: issueKeyMatch ? issueKeyMatch[1] : '',
      fields: {
        status: statusMatch ? { name: statusMatch[1] } : undefined
      }
    };
  }

  private extractCommentDetails(prompt: string): any {
    const issueKeyMatch = prompt.match(/issue[:\s]+(\w+-\d+)/i);
    const commentMatch = prompt.match(/comment[:\s]+"([^"]+)"/i);
    
    return {
      issueKey: issueKeyMatch ? issueKeyMatch[1] : '',
      comment: commentMatch ? commentMatch[1] : ''
    };
  }

  private extractWorklogDetails(prompt: string): any {
    const issueKeyMatch = prompt.match(/issue[:\s]+(\w+-\d+)/i);
    const timeSpentMatch = prompt.match(/time[:\s]+(\d+[hmd])/i);
    const commentMatch = prompt.match(/comment[:\s]+"([^"]+)"/i);
    
    return {
      issueKey: issueKeyMatch ? issueKeyMatch[1] : '',
      timeSpent: timeSpentMatch ? timeSpentMatch[1] : '1h',
      comment: commentMatch ? commentMatch[1] : ''
    };
  }

  private async getIssues(params: any): Promise<StepResult> {
    try {
      const issues = await this.jiraMCPService.getIssues(params.jql);
      return {
        success: true,
        data: { issues }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async createIssue(params: any): Promise<StepResult> {
    try {
      const issue = await this.jiraMCPService.createIssue(
        params.projectKey,
        params.summary,
        params.description,
        params.issueType
      );
      return {
        success: true,
        data: { issue }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async updateIssue(params: any): Promise<StepResult> {
    try {
      const result = await this.jiraMCPService.updateIssue(
        params.issueKey,
        params.fields
      );
      return {
        success: true,
        data: { result }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async addComment(params: any): Promise<StepResult> {
    try {
      const comment = await this.jiraMCPService.addComment(
        params.issueKey,
        params.comment
      );
      return {
        success: true,
        data: { comment }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async logWork(params: any): Promise<StepResult> {
    try {
      const worklog = await this.jiraMCPService.addWorklog(
        params.issueKey,
        this.convertTimeToSeconds(params.timeSpent),
        params.comment
      );
      return {
        success: true,
        data: { worklog }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private convertTimeToSeconds(timeSpent: string): number {
    const time = parseInt(timeSpent);
    const unit = timeSpent.slice(-1);
    
    switch (unit) {
      case 'h':
        return time * 3600;
      case 'm':
        return time * 60;
      case 'd':
        return time * 8 * 3600; // Assuming 8 hours per day
      default:
        return time * 3600; // Default to hours
    }
  }
}
