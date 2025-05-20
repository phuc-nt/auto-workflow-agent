import { Injectable } from '@nestjs/common';
import { MCPClientService } from './mcp-client.service';
import { EnhancedLogger } from '../utils/logger';

@Injectable()
export class ConfluenceMCPService {
  private readonly logger = EnhancedLogger.getLogger(ConfluenceMCPService.name);
  private readonly BASE_URI = 'confluence://';

  constructor(private readonly mcpClient: MCPClientService) {}

  async getPage(pageId: string): Promise<any> {
    try {
      const uri = `${this.BASE_URI}pages/${pageId}`;
      const result = await this.mcpClient.readResource(uri);
      return JSON.parse(result[0].text);
    } catch (error) {
      this.logger.error(`Failed to get page: ${error.message}`);
      throw error;
    }
  }

  async createPage(spaceKey: string, title: string, content: string, parentId?: string): Promise<any> {
    try {
      const result = await this.mcpClient.callTool('createPage', {
        spaceKey,
        title,
        content,
        parentId
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      this.logger.error(`Failed to create page: ${error.message}`);
      throw error;
    }
  }

  async updatePage(pageId: string, title: string, content: string, version: number): Promise<any> {
    try {
      const result = await this.mcpClient.callTool('updatePage', {
        pageId,
        title,
        content,
        version
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      this.logger.error(`Failed to update page: ${error.message}`);
      throw error;
    }
  }

  async searchPages(cql: string): Promise<any[]> {
    try {
      const uri = `${this.BASE_URI}search?cql=${encodeURIComponent(cql)}`;
      const result = await this.mcpClient.readResource(uri);
      return JSON.parse(result[0].text).results;
    } catch (error) {
      this.logger.error(`Failed to search pages: ${error.message}`);
      throw error;
    }
  }

  async getChildren(pageId: string): Promise<any[]> {
    try {
      const uri = `${this.BASE_URI}pages/${pageId}/children`;
      const result = await this.mcpClient.readResource(uri);
      return JSON.parse(result[0].text).results;
    } catch (error) {
      this.logger.error(`Failed to get children: ${error.message}`);
      throw error;
    }
  }

  async addComment(pageId: string, comment: string): Promise<any> {
    try {
      const result = await this.mcpClient.callTool('addComment', {
        pageId,
        comment
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      this.logger.error(`Failed to add comment: ${error.message}`);
      throw error;
    }
  }
}
