import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LLMUsageRecord } from '../entity/LLMUsageRecord';
import { CostMonitoringService } from './cost-monitoring.service';
import { CostMonitoringController } from './cost-monitoring.controller';
import { ConfigModule } from '@nestjs/config';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LLMUsageRecord]),
    ConfigModule,
    forwardRef(() => OpenaiModule),
  ],
  controllers: [CostMonitoringController],
  providers: [CostMonitoringService],
  exports: [CostMonitoringService]
})
export class CostMonitoringModule {} 