import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './entity/User';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { JiraModule } from './jira/jira.module';
import { SlackModule } from './slack/slack.module';
import { CentralAgentModule } from './central-agent/central-agent.module';
import { ActionPlanEntity } from './central-agent/entities/action-plan.entity';
import { LLMUsageRecord } from './entity/LLMUsageRecord';
import { CostMonitoringModule } from './cost-monitoring/cost-monitoring.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MockJiraAgent } from './central-agent/agents/mock-jira-agent';
import { MockSlackAgent } from './central-agent/agents/mock-slack-agent';
import { MockConfluenceAgent } from './central-agent/agents/mock-confluence-agent';
import { MockCalendarAgent } from './central-agent/agents/mock-calendar-agent';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load .env toàn cục
    // Sử dụng TypeORM với SQLite, lưu vào file để dữ liệu không bị mất khi restart
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, ActionPlanEntity, LLMUsageRecord],
      synchronize: true,
      logging: false,
    }),
    ScheduleModule.forRoot(), // Đăng ký schedule module cho cron jobs
    UserModule,
    ChatModule,
    JiraModule,
    SlackModule,
    CentralAgentModule,
    CostMonitoringModule,
  ],
  controllers: [
    // ... existing code ...
  ],
  providers: [
    // ... existing code ...
    MockJiraAgent,
    MockSlackAgent,
    MockConfluenceAgent,
    MockCalendarAgent,
    // ... existing code ...
  ],
})
export class AppModule {}
