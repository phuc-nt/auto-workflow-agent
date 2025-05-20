import { Module } from '@nestjs/common';
import { MCPClientService } from './mcp-client.service';
import { JiraMCPService } from './jira-mcp.service';
import { ConfluenceMCPService } from './confluence-mcp.service';

@Module({
  providers: [MCPClientService, JiraMCPService, ConfluenceMCPService],
  exports: [MCPClientService, JiraMCPService, ConfluenceMCPService],
})
export class MCPClientModule {}
