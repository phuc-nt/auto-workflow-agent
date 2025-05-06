import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JiraService } from './jira.service';
import { JiraController } from './jira.controller';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [ConfigModule.forRoot(), HttpModule, OpenaiModule],
  providers: [JiraService],
  controllers: [JiraController],
  exports: [JiraService],
})
export class JiraModule {}
