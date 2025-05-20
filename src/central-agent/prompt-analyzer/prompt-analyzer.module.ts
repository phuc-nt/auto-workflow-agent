import { Module } from '@nestjs/common';
import { PromptAnalyzerService } from './prompt-analyzer.service';
import { MCPClientModule } from '../../mcp-client/mcp-client.module';
import { OpenaiModule } from '../../openai/openai.module';
import { MCPInventoryService } from '../../mcp-client/mcp-inventory.service';

@Module({
  imports: [MCPClientModule, OpenaiModule],
  providers: [PromptAnalyzerService, MCPInventoryService],
  exports: [PromptAnalyzerService],
})
export class PromptAnalyzerModule {}
