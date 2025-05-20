import { Injectable } from '@nestjs/common';
import { MCPClientService } from './mcp-client.service';
import { EnhancedLogger } from '../utils/logger';

@Injectable()
export class JiraMCPService {
  private readonly logger = EnhancedLogger.getLogger(JiraMCPService.name);
  private readonly BASE_URI = 'jira://';

  constructor(private readonly mcpClient: MCPClientService) {}

  async getIssues(jql?: string): Promise<any[]> {
    try {
      const uri = jql ? 
        `${this.BASE_URI}issues?jql=${encodeURIComponent(jql)}` : 
        `${this.BASE_URI}issues`;
      
      const result = await this.mcpClient.readResource(uri);
      return JSON.parse(result[0].text).issues;
    } catch (error) {
      this.logger.error(`Failed to get issues: ${error.message}`);
      throw error;
    }
  }

  async createIssue(projectKey: string, summary: string, description: string, issueType: string = 'Task'): Promise<any> {
    try {
      const result = await this.mcpClient.callTool('createIssue', {
        projectKey,
        summary,
        description,
        issueType
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      this.logger.error(`Failed to create issue: ${error.message}`);
      throw error;
    }
  }

  async updateIssue(issueKey: string, fields: Record<string, any>): Promise<any> {
    try {
      const result = await this.mcpClient.callTool('updateIssue', {
        issueKey,
        fields
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      this.logger.error(`Failed to update issue: ${error.message}`);
      throw error;
    }
  }

  async addComment(issueKey: string, comment: string): Promise<any> {
    try {
      const result = await this.mcpClient.callTool('addComment', {
        issueKey,
        comment
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      this.logger.error(`Failed to add comment: ${error.message}`);
      throw error;
    }
  }

  async getIssueWorklog(issueKey: string): Promise<any[]> {
    try {
      const uri = `${this.BASE_URI}issue/${issueKey}/worklog`;
      const result = await this.mcpClient.readResource(uri);
      return JSON.parse(result[0].text).worklogs;
    } catch (error) {
      this.logger.error(`Failed to get issue worklog: ${error.message}`);
      throw error;
    }
  }

  async addWorklog(issueKey: string, timeSpentSeconds: number, comment?: string): Promise<any> {
    try {
      const result = await this.mcpClient.callTool('addWorklog', {
        issueKey,
        timeSpentSeconds,
        comment
      });

      return JSON.parse(result.content[0].text);
    } catch (error) {
      this.logger.error(`Failed to add worklog: ${error.message}`);
      throw error;
    }
  }

  async getProjects(): Promise<any[]> {
    try {
      const uri = `${this.BASE_URI}projects`;
      const result = await this.mcpClient.readResource(uri);
      // MCP SDK >=1.11 returns { contents: [ { text: ... } ] }
      return JSON.parse(result.contents[0].text);
    } catch (error) {
      this.logger.error(`Failed to get projects: ${error.message}`);
      throw error;
    }
  }

  async getUserInfo(username: string = 'current'): Promise<any> {
    try {
      const uri = `${this.BASE_URI}user/${username}`;
      const result = await this.mcpClient.readResource(uri);
      return JSON.parse(result[0].text);
    } catch (error) {
      this.logger.error(`Failed to get user info: ${error.message}`);
      throw error;
    }
  }
  
  async readJiraResource(resourcePath: string): Promise<any> {
    try {
      const uri = resourcePath.startsWith(this.BASE_URI) 
        ? resourcePath 
        : `${this.BASE_URI}${resourcePath}`;
      
      const result = await this.mcpClient.readResource(uri);
      return JSON.parse(result[0].text);
    } catch (error) {
      this.logger.error(`Failed to read Jira resource ${resourcePath}: ${error.message}`);
      throw error;
    }
  }
}
