import { Injectable } from '@nestjs/common';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';
import { ConfluenceMCPService } from '../../mcp-client/confluence-mcp.service';
import { EnhancedLogger } from '../../utils/logger';
import { PromptAnalyzerService } from '../prompt-analyzer/prompt-analyzer.service';
import { AgentType } from '../../mcp-client/mcp-inventory.service';

@Injectable()
export class MCPConfluenceAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger(MCPConfluenceAgent.name);

  constructor(
    private readonly confluenceMCPService: ConfluenceMCPService,
    private readonly promptAnalyzer: PromptAnalyzerService
  ) {}

  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    try {
      this.logger.log(`Executing Confluence prompt: ${prompt.substring(0, 50)}...`);
      
      // Sử dụng PromptAnalyzerService để phân tích prompt
      const analysis = await this.promptAnalyzer.analyzePrompt(prompt, AgentType.CONFLUENCE);
      
      this.logger.debug(`Prompt analysis result: ${JSON.stringify(analysis)}`);
      
      // Nếu phân tích không đáng tin cậy, sử dụng phân tích regex truyền thống
      if (analysis.confidence < 0.7) {
        this.logger.warn(`Low confidence in analysis (${analysis.confidence}), falling back to regex parsing`);
        return this.handleWithRegexParsing(prompt);
      }
      
      // Xử lý dựa trên phân tích LLM
      if (analysis.action === 'readResource') {
        try {
          // Xác định loại resource cần đọc
          const resourceUri = analysis.resourceOrTool;
          const pageIdMatch = resourceUri.match(/pages\/(\d+)/);
          
          if (pageIdMatch) {
            // Đọc trang cụ thể
            const pageId = pageIdMatch[1];
            const page = await this.confluenceMCPService.getPage(pageId);
            
            return {
              success: true,
              data: { page }
            };
          } else if (resourceUri.includes('search') || analysis.parameters.cql) {
            // Tìm kiếm trang
            const pages = await this.confluenceMCPService.searchPages(
              analysis.parameters.cql || ''
            );
            
            return {
              success: true,
              data: { pages }
            };
          } else if (resourceUri.includes('children') && analysis.parameters.pageId) {
            // Lấy các trang con
            const children = await this.confluenceMCPService.getChildren(
              analysis.parameters.pageId
            );
            
            return {
              success: true,
              data: { children }
            };
          } else {
            return {
              success: false,
              error: `Unsupported resource URI: ${resourceUri}`
            };
          }
        } catch (error) {
          return {
            success: false,
            error: `Error reading resource: ${error.message}`
          };
        }
      } else if (analysis.action === 'callTool') {
        try {
          const toolName = analysis.resourceOrTool;
          
          // Dựa vào tên tool để gọi phương thức tương ứng
          switch(toolName.toLowerCase()) {
            case 'createpage':
              const page = await this.confluenceMCPService.createPage(
                analysis.parameters.spaceKey,
                analysis.parameters.title,
                analysis.parameters.content,
                analysis.parameters.parentId
              );
              return {
                success: true,
                data: { page }
              };
              
            case 'updatepage':
              const updatedPage = await this.confluenceMCPService.updatePage(
                analysis.parameters.pageId,
                analysis.parameters.title,
                analysis.parameters.content,
                analysis.parameters.version || 1
              );
              return {
                success: true,
                data: { page: updatedPage }
              };
              
            case 'addcomment':
              const comment = await this.confluenceMCPService.addComment(
                analysis.parameters.pageId,
                analysis.parameters.comment
              );
              return {
                success: true,
                data: { comment }
              };
              
            default:
              return {
                success: false,
                error: `Unsupported Confluence tool: ${toolName}`
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
        case 'getPage':
          return await this.getPage(params);
        case 'createPage':
          return await this.createPage(params);
        case 'updatePage':
          return await this.updatePage(params);
        case 'searchPages':
          return await this.searchPages(params);
        case 'addComment':
          return await this.addComment(params);
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

      if (lowercasePrompt.includes('get page')) {
        return {
          action: 'getPage',
          params: this.extractPageId(prompt)
        };
      }

      if (lowercasePrompt.includes('create page')) {
        return {
          action: 'createPage',
          params: this.extractPageCreateDetails(prompt)
        };
      }

      if (lowercasePrompt.includes('update page')) {
        return {
          action: 'updatePage',
          params: this.extractPageUpdateDetails(prompt)
        };
      }

      if (lowercasePrompt.includes('search pages')) {
        return {
          action: 'searchPages',
          params: this.extractSearchQuery(prompt)
        };
      }

      if (lowercasePrompt.includes('add comment')) {
        return {
          action: 'addComment',
          params: this.extractCommentDetails(prompt)
        };
      }

      throw new Error(`Could not parse action from prompt: ${prompt}`);
    } catch (error) {
      this.logger.error(`Error parsing prompt: ${error.message}`);
      throw error;
    }
  }

  private extractPageId(prompt: string): any {
    const pageIdMatch = prompt.match(/page[:\s]+(\d+)/i);
    return {
      pageId: pageIdMatch ? pageIdMatch[1] : ''
    };
  }

  private extractPageCreateDetails(prompt: string): any {
    const spaceMatch = prompt.match(/space[:\s]+(\w+)/i);
    const titleMatch = prompt.match(/title[:\s]+"([^"]+)"/i);
    const contentMatch = prompt.match(/content[:\s]+"([^"]+)"/i);
    const parentMatch = prompt.match(/parent[:\s]+(\d+)/i);
    
    return {
      spaceKey: spaceMatch ? spaceMatch[1] : 'DOC',
      title: titleMatch ? titleMatch[1] : 'New Page',
      content: contentMatch ? contentMatch[1] : '',
      parentId: parentMatch ? parentMatch[1] : undefined
    };
  }

  private extractPageUpdateDetails(prompt: string): any {
    const pageIdMatch = prompt.match(/page[:\s]+(\d+)/i);
    const titleMatch = prompt.match(/title[:\s]+"([^"]+)"/i);
    const contentMatch = prompt.match(/content[:\s]+"([^"]+)"/i);
    const versionMatch = prompt.match(/version[:\s]+(\d+)/i);
    
    return {
      pageId: pageIdMatch ? pageIdMatch[1] : '',
      title: titleMatch ? titleMatch[1] : '',
      content: contentMatch ? contentMatch[1] : '',
      version: versionMatch ? parseInt(versionMatch[1]) : 1
    };
  }

  private extractSearchQuery(prompt: string): any {
    const queryMatch = prompt.match(/query[:\s]+"([^"]+)"/i);
    return {
      cql: queryMatch ? queryMatch[1] : 'type = page'
    };
  }

  private extractCommentDetails(prompt: string): any {
    const pageIdMatch = prompt.match(/page[:\s]+(\d+)/i);
    const commentMatch = prompt.match(/comment[:\s]+"([^"]+)"/i);
    
    return {
      pageId: pageIdMatch ? pageIdMatch[1] : '',
      comment: commentMatch ? commentMatch[1] : ''
    };
  }

  private async getPage(params: any): Promise<StepResult> {
    try {
      const page = await this.confluenceMCPService.getPage(params.pageId);
      return {
        success: true,
        data: { page }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async createPage(params: any): Promise<StepResult> {
    try {
      const page = await this.confluenceMCPService.createPage(
        params.spaceKey,
        params.title,
        params.content,
        params.parentId
      );
      return {
        success: true,
        data: { page }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async updatePage(params: any): Promise<StepResult> {
    try {
      const page = await this.confluenceMCPService.updatePage(
        params.pageId,
        params.title,
        params.content,
        params.version
      );
      return {
        success: true,
        data: { page }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async searchPages(params: any): Promise<StepResult> {
    try {
      const pages = await this.confluenceMCPService.searchPages(params.cql);
      return {
        success: true,
        data: { pages }
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
      const comment = await this.confluenceMCPService.addComment(
        params.pageId,
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
}
