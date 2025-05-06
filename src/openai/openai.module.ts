import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { CostMonitoringModule } from '../cost-monitoring/cost-monitoring.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    forwardRef(() => CostMonitoringModule),
  ],
  controllers: [OpenaiController],
  providers: [OpenaiService],
  exports: [OpenaiService],
})
export class OpenaiModule {}
