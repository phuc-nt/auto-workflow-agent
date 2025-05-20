import { Injectable, OnModuleInit } from '@nestjs/common';
import { MCPClientService } from './mcp-client.service';
import { EnhancedLogger } from '../utils/logger';

/**
 * Enum xác định loại agent
 */
export enum AgentType {
  JIRA = 'JIRA',
  CONFLUENCE = 'CONFLUENCE',
}

/**
 * Đại diện cho một resource trong MCP
 */
export interface MCPResource {
  name: string;
  description: string;
  uri: string;
  parameters?: Record<string, any>;
}

/**
 * Đại diện cho một tool trong MCP
 */
export interface MCPTool {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

/**
 * Service quản lý inventory (danh sách resources và tools) của MCP Server
 * Cung cấp các phương thức để lấy resources và tools theo loại agent
 * Sử dụng caching để tối ưu hiệu suất
 */
@Injectable()
export class MCPInventoryService implements OnModuleInit {
  private readonly logger = EnhancedLogger.getLogger(MCPInventoryService.name);
  private resourcesCache = new Map<string, MCPResource>();
  private toolsCache = new Map<string, MCPTool>();
  private isInitialized = false;

  constructor(private readonly mcpClient: MCPClientService) {}

  async onModuleInit() {
    // Khởi tạo cache khi module khởi động nếu MCP client đã được kết nối
    if (this.mcpClient.isConnected()) {
      await this.initializeCache();
    }
  }

  /**
   * Khởi tạo cache cho resources và tools
   */
  async initializeCache(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      this.logger.log('Initializing MCP inventory cache...');
      
      try {
        // Lấy danh sách resources và tools từ MCP Server
        await this.fetchAllResources();
        await this.fetchAllTools();
      } catch (error) {
        this.logger.warn(`Could not fetch from meta resource: ${error.message}. Adding fallback resources and tools.`);
        // Thêm các resource và tool mặc định nếu không thể lấy từ meta://
        this.addKnownJiraResources();
        this.addKnownConfluenceResources();
        this.addKnownJiraTools();
        this.addKnownConfluenceTools();
      }
      
      this.isInitialized = true;
      this.logger.log(`MCP inventory cache initialized with ${this.resourcesCache.size} resources and ${this.toolsCache.size} tools`);
    } catch (error) {
      this.logger.error(`Failed to initialize MCP inventory cache: ${error.message}`);
      // Không throw error nữa, cho phép ứng dụng chạy với cache rỗng
      this.isInitialized = true;
    }
  }

  /**
   * Lấy danh sách resources và tools dựa trên loại agent
   */
  async getInventoryByAgentType(agentType: AgentType): Promise<{resources: MCPResource[], tools: MCPTool[]}> {
    // Đảm bảo cache đã được khởi tạo
    if (!this.isInitialized) {
      await this.initializeCache();
    }
    
    let resources: MCPResource[] = [];
    let tools: MCPTool[] = [];
    
    switch (agentType) {
      case AgentType.JIRA:
        resources = this.getJiraResources();
        tools = this.getJiraTools();
        break;
      case AgentType.CONFLUENCE:
        resources = this.getConfluenceResources();
        tools = this.getConfluenceTools();
        break;
      default:
        throw new Error(`Không hỗ trợ agent type: ${agentType}`);
    }
    
    return { resources, tools };
  }
  
  /**
   * Lấy tất cả resources từ cache
   */
  getAllResources(): MCPResource[] {
    return Array.from(this.resourcesCache.values());
  }
  
  /**
   * Lấy tất cả tools từ cache
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.toolsCache.values());
  }
  
  /**
   * Lấy danh sách resources của Jira
   */
  private getJiraResources(): MCPResource[] {
    return Array.from(this.resourcesCache.values())
      .filter(resource => resource.uri?.startsWith('jira://'));
  }
  
  /**
   * Lấy danh sách tools của Jira
   */
  private getJiraTools(): MCPTool[] {
    // Danh sách các tool của Jira thường bắt đầu với các prefix cụ thể
    // hoặc được xác định thông qua các metadata khác
    return Array.from(this.toolsCache.values())
      .filter(tool => {
        // Lọc các tool liên quan đến Jira
        const jiraToolPrefixes = ['create', 'update', 'get', 'search', 'add'];
        const jiraEntityTypes = ['issue', 'project', 'comment', 'worklog'];
        
        return jiraToolPrefixes.some(prefix => tool.name.toLowerCase().startsWith(prefix)) &&
               jiraEntityTypes.some(entity => tool.name.toLowerCase().includes(entity));
      });
  }
  
  /**
   * Lấy danh sách resources của Confluence
   */
  private getConfluenceResources(): MCPResource[] {
    return Array.from(this.resourcesCache.values())
      .filter(resource => resource.uri?.startsWith('confluence://'));
  }
  
  /**
   * Lấy danh sách tools của Confluence
   */
  private getConfluenceTools(): MCPTool[] {
    // Tương tự với Jira, lọc các tool của Confluence
    return Array.from(this.toolsCache.values())
      .filter(tool => {
        // Lọc các tool liên quan đến Confluence
        const confluenceToolPrefixes = ['create', 'update', 'get', 'search', 'add'];
        const confluenceEntityTypes = ['page', 'space', 'comment', 'content'];
        
        return confluenceToolPrefixes.some(prefix => tool.name.toLowerCase().startsWith(prefix)) &&
               confluenceEntityTypes.some(entity => tool.name.toLowerCase().includes(entity));
      });
  }
  
  /**
   * Lấy tất cả resources từ MCP Server
   */
  private async fetchAllResources(): Promise<void> {
    try {
      // Sử dụng listResources để lấy danh sách resources
      const resourcesResult = await this.mcpClient.listResources();
      
      if (!resourcesResult || !resourcesResult.resources || !Array.isArray(resourcesResult.resources)) {
        this.logger.warn('No resources found in MCP Server or invalid response format');
        return;
      }
      
      // Xử lý danh sách resources
      for (const resource of resourcesResult.resources) {
        const uri = resource.uri || resource.uriPattern || '';
        const name = resource.name || uri;
        
        this.resourcesCache.set(name, {
          name: name,
          description: resource.description || '',
          uri: uri,
          parameters: resource.parameters || {}
        });
      }
      
      // Log số lượng resources đã tìm thấy
      this.logger.debug(`Found ${resourcesResult.resources.length} resources from MCP Server`);
    } catch (error) {
      this.logger.error(`Error fetching resources: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Lấy tất cả tools từ MCP Server
   */
  private async fetchAllTools(): Promise<void> {
    try {
      // Sử dụng listTools để lấy danh sách tools
      const toolsResult = await this.mcpClient.listTools();
      
      if (!toolsResult || !toolsResult.tools || !Array.isArray(toolsResult.tools)) {
        this.logger.warn('No tools found in MCP Server or invalid response format');
        
        // Nếu không lấy được tools từ server, sử dụng danh sách tools đã biết
        this.addKnownJiraTools();
        this.addKnownConfluenceTools();
        return;
      }
      
      // Xử lý danh sách tools
      for (const tool of toolsResult.tools) {
        this.toolsCache.set(tool.name, {
          name: tool.name,
          description: tool.description || '',
          parameters: tool.parameters || {}
        });
      }
      
      // Nếu không có tools nào, thêm các tools đã biết
      if (toolsResult.tools.length === 0) {
        this.logger.warn('No tools returned from MCP Server, adding known tools');
        this.addKnownJiraTools();
        this.addKnownConfluenceTools();
      } else {
        this.logger.debug(`Found ${toolsResult.tools.length} tools from MCP Server`);
      }
    } catch (error) {
      this.logger.error(`Error fetching tools: ${error.message}`);
      
      // Nếu có lỗi, thử thêm các tools đã biết
      this.logger.warn(`Falling back to known tools due to error: ${error.message}`);
      this.addKnownJiraTools();
      this.addKnownConfluenceTools();
      
      // Không throw error để allow fallback
    }
  }
  
  /**
   * Thêm các tool đã biết cho Jira
   */
  private addKnownJiraTools(): void {
    const jiraTools = [
      { name: 'createIssue', description: 'Create a new Jira issue' },
      { name: 'updateIssue', description: 'Update an existing Jira issue' },
      { name: 'addComment', description: 'Add a comment to a Jira issue' },
      { name: 'addWorklog', description: 'Add a worklog entry to a Jira issue' }
    ];
    
    for (const tool of jiraTools) {
      this.toolsCache.set(tool.name, {
        name: tool.name,
        description: tool.description,
        parameters: {}
      });
    }
  }
  
  /**
   * Thêm các tool đã biết cho Confluence
   */
  private addKnownConfluenceTools(): void {
    const confluenceTools = [
      { name: 'createPage', description: 'Create a new Confluence page' },
      { name: 'updatePage', description: 'Update an existing Confluence page' },
      { name: 'addComment', description: 'Add a comment to a Confluence page' }
    ];
    
    for (const tool of confluenceTools) {
      this.toolsCache.set(tool.name, {
        name: tool.name,
        description: tool.description,
        parameters: {}
      });
    }
  }
  
  /**
   * Thêm các resources đã biết cho Jira
   */
  private addKnownJiraResources(): void {
    const jiraResources = [
      { 
        name: 'jira://issues',
        description: 'Get Jira issues with optional JQL filter',
        uri: 'jira://issues'
      },
      { 
        name: 'jira://issue/{issueKey}',
        description: 'Get a specific Jira issue by key',
        uri: 'jira://issue/{issueKey}'
      },
      { 
        name: 'jira://projects',
        description: 'Get all Jira projects',
        uri: 'jira://projects'
      }
    ];
    
    for (const resource of jiraResources) {
      this.resourcesCache.set(resource.name, {
        name: resource.name,
        description: resource.description,
        uri: resource.uri,
        parameters: {}
      });
    }
  }
  
  /**
   * Thêm các resources đã biết cho Confluence
   */
  private addKnownConfluenceResources(): void {
    const confluenceResources = [
      { 
        name: 'confluence://pages',
        description: 'Get Confluence pages',
        uri: 'confluence://pages'
      },
      { 
        name: 'confluence://pages/{pageId}',
        description: 'Get a specific Confluence page by ID',
        uri: 'confluence://pages/{pageId}'
      },
      { 
        name: 'confluence://spaces',
        description: 'Get Confluence spaces',
        uri: 'confluence://spaces'
      }
    ];
    
    for (const resource of confluenceResources) {
      this.resourcesCache.set(resource.name, {
        name: resource.name,
        description: resource.description,
        uri: resource.uri,
        parameters: {}
      });
    }
  }
}