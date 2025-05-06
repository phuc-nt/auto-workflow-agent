import { ApiProperty } from '@nestjs/swagger';

export class TokenUsageDto {
  @ApiProperty({ description: 'Số token của prompt', example: 150 })
  promptTokens: number;

  @ApiProperty({ description: 'Số token của completion', example: 50 })
  completionTokens: number;

  @ApiProperty({ description: 'Tổng số token', example: 200 })
  totalTokens: number;
}

export class CostSummaryDto {
  @ApiProperty({ description: 'Chi phí tính bằng USD', example: 0.025 })
  cost: number;

  @ApiProperty({ description: 'Thông tin sử dụng token', type: TokenUsageDto })
  usage: TokenUsageDto;

  @ApiProperty({ description: 'Số lượng records', example: 10 })
  count: number;
}

export class DailyCostDto {
  @ApiProperty({ description: 'Ngày của báo cáo', example: '2023-06-01' })
  date: string;

  @ApiProperty({ description: 'Thông tin chi phí', type: CostSummaryDto })
  summary: CostSummaryDto;
}

export class MonthlyCostDto {
  @ApiProperty({ description: 'Tháng của báo cáo', example: '2023-06' })
  month: string;

  @ApiProperty({ description: 'Thông tin chi phí', type: CostSummaryDto })
  summary: CostSummaryDto;
}

export class ComponentCostDto {
  @ApiProperty({ description: 'Tên component', example: { 'chat': {}, 'summarize': {} } })
  components: Record<string, CostSummaryDto>;
}

export class ModelCostDto {
  @ApiProperty({ description: 'Thông tin chi phí theo model', example: { 'gpt-4': {}, 'gpt-3.5-turbo': {} } })
  models: Record<string, CostSummaryDto>;
}

export class ThresholdDto {
  @ApiProperty({ description: 'Ngưỡng chi phí hàng ngày', example: 1.0 })
  daily: number;

  @ApiProperty({ description: 'Ngưỡng chi phí hàng tháng', example: 10.0 })
  monthly: number;
}

export class UpdateThresholdDto {
  @ApiProperty({ description: 'Ngưỡng chi phí hàng ngày', example: 1.0, required: false })
  daily?: number;

  @ApiProperty({ description: 'Ngưỡng chi phí hàng tháng', example: 10.0, required: false })
  monthly?: number;
}

export class CreateReportDto {
  @ApiProperty({ description: 'Ngày cần tạo báo cáo', example: '2023-06-01' })
  date: string;
}

export class CostReportDto {
  @ApiProperty({ description: 'ID của báo cáo', example: 'f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454' })
  id: string;

  @ApiProperty({ description: 'Ngày của báo cáo', example: '2023-06-01' })
  date: string;

  @ApiProperty({ description: 'Chi tiết sử dụng', type: 'array', items: { type: 'object' } })
  records: any[];

  @ApiProperty({ description: 'Thông tin tổng hợp', type: CostSummaryDto })
  summary: CostSummaryDto;
} 