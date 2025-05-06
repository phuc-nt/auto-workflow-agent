import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentralAgentController } from './central-agent.controller';
import { CentralAgentService } from './central-agent.service';
import { InputProcessor } from './input-processor/input-processor.service';
import { ProjectConfigReader } from './project-config/project-config-reader.service';
import { OpenaiModule } from '../openai/openai.module';
import { ActionPlanner } from './action-planner/action-planner.service';
import { ActionPlanEntity } from './entities/action-plan.entity';
import { ActionPlanStorageService } from './file-storage/action-plan-storage.service';
import { AgentCoordinator } from './agent-coordinator/agent-coordinator.service';
import { AgentFactory } from './agent-factory/agent-factory.service';
import { MockJiraAgent } from './agents/mock-jira-agent';
import { MockSlackAgent } from './agents/mock-slack-agent';
import { MockConfluenceAgent } from './agents/mock-confluence-agent';
import { MockCalendarAgent } from './agents/mock-calendar-agent';
import { ConfigModule } from '../config/config.module';
import { ResultSynthesizerService } from './result-synthesizer/result-synthesizer.service';

@Module({
  imports: [
    OpenaiModule,
    ConfigModule,
    TypeOrmModule.forFeature([ActionPlanEntity]),
  ],
  controllers: [CentralAgentController],
  providers: [
    CentralAgentService,
    InputProcessor,
    ProjectConfigReader,
    ActionPlanner,
    ActionPlanStorageService,
    AgentCoordinator,
    MockJiraAgent,
    MockSlackAgent,
    MockConfluenceAgent,
    MockCalendarAgent,
    AgentFactory,
    ResultSynthesizerService
  ],
  exports: [CentralAgentService],
})
export class CentralAgentModule {} 