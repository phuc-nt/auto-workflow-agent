import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CentralAgentService } from './central-agent.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('central-agent')
export class CentralAgentController {
  constructor(private readonly centralAgentService: CentralAgentService) {}

  @Post('process')
  async processRequest(@Body() body: { message: string, userId: string }) {
    return this.centralAgentService.processRequest(body.message, body.userId);
  }
  
  @Post('test-mcp')
  @ApiOperation({ summary: 'Test MCP integration' })
  @ApiResponse({ status: 200, description: 'Successfully tested MCP integration' })
  async testMCPIntegration(@Body('testCase') testCase: string = 'jira') {
    return this.centralAgentService.processRequest(
      testCase === 'jira' 
        ? 'list all jira projects'
        : 'list all confluence spaces',
      '',
      []
    );
  }
  
  @Get('plan/:id')
  async getActionPlanById(@Param('id') id: string) {
    return this.centralAgentService.getActionPlanById(id);
  }
  
  @Get('plan/user/:userId')
  async getLatestActionPlan(@Param('userId') userId: string) {
    return this.centralAgentService.getLatestActionPlan(userId);
  }
}