import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { IMCPClient, MCPClientConfig, MCPClientError } from './interfaces/mcp-client.interface';
import { EnhancedLogger } from '../utils/logger';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MCPClientService implements IMCPClient, OnModuleInit, OnModuleDestroy {
  private readonly logger = EnhancedLogger.getLogger(MCPClientService.name);
  private client: Client;
  private transport: StdioClientTransport;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    const config: MCPClientConfig = {
      name: 'auto-workflow-agent-mcp-client',
      version: '1.0.0',
      serverPath: this.configService.get<string>('MCP_SERVER_PATH'),
    };

    this.client = new Client({ 
      name: config.name, 
      version: config.version 
    });

    this.transport = new StdioClientTransport({
      command: 'node',
      args: [config.serverPath],
      env: process.env as Record<string, string>
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    try {
      if (!this.isInitialized) {
        this.logger.log('Connecting to MCP Server...');
        await this.client.connect(this.transport);
        this.isInitialized = true;
        this.logger.log('Successfully connected to MCP Server');
      }
    } catch (error) {
      const errorMsg = 'Failed to connect to MCP Server: ' + error.message;
      this.logger.error(errorMsg);
      throw new MCPClientError(errorMsg, error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.logger.log('Disconnecting from MCP Server...');
      
      // Since there's no explicit disconnect method in the SDK,
      // we'll clean up our references to allow garbage collection
      this.transport = null;
      this.client = null;
      this.isInitialized = false;
      
      this.logger.log('Successfully disconnected from MCP Server');
    } catch (error) {
      const errorMsg = 'Failed to disconnect from MCP Server: ' + error.message;
      this.logger.error(errorMsg);
      throw new MCPClientError(errorMsg, error);
    }
  }

  async readResource(uri: string): Promise<any> {
    try {
      if (!this.isInitialized) {
        throw new MCPClientError('MCP Client is not initialized');
      }

      this.logger.debug(`Reading resource: ${uri}`);
      const result = await this.client.readResource({ uri });
      return result;
    } catch (error) {
      this.logger.error(`Failed to read resource ${uri}: ${error.message}`);
      throw new MCPClientError(`Failed to read resource ${uri}`, error);
    }
  }

  async callTool(name: string, parameters: Record<string, any>): Promise<any> {
    try {
      if (!this.isInitialized) {
        throw new MCPClientError('MCP Client is not initialized');
      }

      this.logger.debug(`Calling tool ${name} with parameters: ${JSON.stringify(parameters)}`);
      const result = await this.client.callTool({
        name: name,
        arguments: parameters,
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to call tool ${name}: ${error.message}`);
      throw new MCPClientError(`Failed to call tool ${name}`, error);
    }
  }

  async listTools(): Promise<any> {
    try {
      if (!this.isInitialized) {
        throw new MCPClientError('MCP Client is not initialized');
      }

      this.logger.debug(`Listing available tools`);
      const result = await this.client.listTools();
      return result;
    } catch (error) {
      this.logger.error(`Failed to list tools: ${error.message}`);
      throw new MCPClientError(`Failed to list tools`, error);
    }
  }

  async listResources(): Promise<any> {
    try {
      if (!this.isInitialized) {
        throw new MCPClientError('MCP Client is not initialized');
      }

      this.logger.debug(`Listing available resources`);
      const result = await this.client.listResources();
      return result;
    } catch (error) {
      this.logger.error(`Failed to list resources: ${error.message}`);
      throw new MCPClientError(`Failed to list resources`, error);
    }
  }

  isConnected(): boolean {
    return this.isInitialized;
  }
}
