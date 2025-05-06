import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CentralAgentService } from './central-agent.service';

@Controller('central-agent')
export class CentralAgentController {
  constructor(private readonly centralAgentService: CentralAgentService) {}

  @Post('process')
  async processRequest(@Body() body: { message: string, userId: string }) {
    return this.centralAgentService.processRequest(body.message, body.userId);
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