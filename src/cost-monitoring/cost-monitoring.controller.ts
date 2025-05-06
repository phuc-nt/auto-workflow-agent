import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, Post, Body } from '@nestjs/common';
import { CostMonitoringService, CostSummary, CostReport } from './cost-monitoring.service';
import { 
  DailyCostDto, 
  MonthlyCostDto, 
  ComponentCostDto, 
  ModelCostDto, 
  ThresholdDto, 
  UpdateThresholdDto, 
  CreateReportDto,
  CostReportDto
} from './dto/cost.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('cost-monitoring')
@Controller('cost-monitoring')
export class CostMonitoringController {
  constructor(private readonly costMonitoringService: CostMonitoringService) {}
  
  /**
   * Lấy chi phí theo ngày
   */
  @ApiOperation({ summary: 'Lấy chi phí theo ngày' })
  @ApiQuery({ name: 'date', required: false, description: 'Ngày cần lấy chi phí (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Thành công', type: DailyCostDto })
  @Get('daily')
  async getDailyCost(
    @Query('date') dateStr?: string
  ): Promise<DailyCostDto> {
    const date = dateStr ? new Date(dateStr) : new Date();
    const summary = await this.costMonitoringService.getDailyCost(date);
    
    return {
      date: date.toISOString().split('T')[0],
      summary
    };
  }
  
  /**
   * Lấy chi phí theo tháng
   */
  @ApiOperation({ summary: 'Lấy chi phí theo tháng' })
  @ApiResponse({ status: 200, description: 'Thành công', type: MonthlyCostDto })
  @ApiQuery({ name: 'year', description: 'Năm', required: false })
  @ApiQuery({ name: 'month', description: 'Tháng', required: false })
  @Get('monthly')
  async getMonthlyCost(
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
    @Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe) monthNum: number
  ): Promise<MonthlyCostDto> {
    // Chuyển đổi số tháng thành chuỗi định dạng 'YYYY-MM'
    const month = `${year}-${monthNum.toString().padStart(2, '0')}`;
    
    const summary = await this.costMonitoringService.getMonthlyCost(year, monthNum);
    
    return {
      month,
      summary
    };
  }
  
  /**
   * Lấy chi phí phân loại theo component
   */
  @ApiOperation({ summary: 'Lấy chi phí phân loại theo component' })
  @ApiResponse({ status: 200, description: 'Thành công', type: ComponentCostDto })
  @Get('by-component')
  async getUsageByComponent(): Promise<ComponentCostDto> {
    const components = await this.costMonitoringService.getUsageByComponent();
    
    return {
      components
    };
  }
  
  /**
   * Lấy chi phí phân loại theo model
   */
  @ApiOperation({ summary: 'Lấy chi phí phân loại theo model' })
  @ApiResponse({ status: 200, description: 'Thành công', type: ModelCostDto })
  @Get('by-model')
  async getUsageByModel(): Promise<ModelCostDto> {
    const models = await this.costMonitoringService.getUsageByModel();
    
    return {
      models
    };
  }
  
  /**
   * Kiểm tra ngưỡng chi phí
   */
  @ApiOperation({ summary: 'Lấy ngưỡng chi phí' })
  @ApiResponse({ status: 200, description: 'Thành công', type: ThresholdDto })
  @Get('threshold')
  async getThresholds(): Promise<ThresholdDto> {
    return {
      daily: this.costMonitoringService['dailyThreshold'],
      monthly: this.costMonitoringService['monthlyThreshold']
    };
  }
  
  /**
   * Cập nhật ngưỡng chi phí
   */
  @ApiOperation({ summary: 'Cập nhật ngưỡng chi phí' })
  @ApiBody({ type: UpdateThresholdDto })
  @ApiResponse({ status: 200, description: 'Thành công', type: ThresholdDto })
  @Post('threshold')
  async updateThresholds(
    @Body() body: UpdateThresholdDto
  ): Promise<ThresholdDto> {
    if (body.daily !== undefined) {
      this.costMonitoringService['dailyThreshold'] = body.daily;
    }
    
    if (body.monthly !== undefined) {
      this.costMonitoringService['monthlyThreshold'] = body.monthly;
    }
    
    return {
      daily: this.costMonitoringService['dailyThreshold'],
      monthly: this.costMonitoringService['monthlyThreshold']
    };
  }
  
  /**
   * Tạo báo cáo chi phí theo ngày
   */
  @ApiOperation({ summary: 'Tạo báo cáo chi phí theo ngày' })
  @ApiBody({ type: CreateReportDto })
  @ApiResponse({ status: 201, description: 'Thành công tạo báo cáo', type: CostReportDto })
  @Post('report/daily')
  async createDailyReport(
    @Body() body: CreateReportDto
  ): Promise<CostReport> {
    const date = body.date ? new Date(body.date) : new Date();
    return this.costMonitoringService.generateDailyReport(date);
  }
} 