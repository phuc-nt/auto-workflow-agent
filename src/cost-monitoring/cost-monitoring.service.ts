import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LLMUsageRecord } from '../entity/LLMUsageRecord';
import { ConfigService } from '@nestjs/config';
import { calculateCost } from '../config/model-cost.config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  TokenUsageDto, 
  CostSummaryDto, 
  DailyCostDto,
  MonthlyCostDto,
  ComponentCostDto,
  ModelCostDto,
  ThresholdDto,
  UpdateThresholdDto,
  CostReportDto
} from './dto/cost.dto';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostSummary {
  cost: number;
  usage: TokenUsage;
  count: number;
}

export interface CostReport {
  id: string;
  date: string;
  records: LLMUsageRecord[];
  summary: CostSummary;
}

@Injectable()
export class CostMonitoringService {
  private readonly logger = new Logger(CostMonitoringService.name);
  private dailyThreshold: number;
  private monthlyThreshold: number;
  private readonly storagePath: string;

  constructor(
    @InjectRepository(LLMUsageRecord)
    private readonly usageRepository: Repository<LLMUsageRecord>,
    private readonly configService: ConfigService,
  ) {
    // Đọc ngưỡng chi phí từ config
    this.dailyThreshold = this.configService.get<number>('DAILY_COST_THRESHOLD', 1.0);  // $1 mặc định
    this.monthlyThreshold = this.configService.get<number>('MONTHLY_COST_THRESHOLD', 10.0);  // $10 mặc định
    
    // Đường dẫn lưu trữ file
    this.storagePath = path.join(process.cwd(), 'storage', 'cost-usage');
    
    // Đảm bảo thư mục tồn tại
    this.ensureStorageDirectoryExists();
    
    this.logger.log(`Khởi tạo Cost Monitoring Service với ngưỡng: daily=$${this.dailyThreshold}, monthly=$${this.monthlyThreshold}`);
  }

  /**
   * Đảm bảo thư mục lưu trữ tồn tại
   */
  private ensureStorageDirectoryExists(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
      // Tạo file .gitignore để không commit dữ liệu
      fs.writeFileSync(path.join(this.storagePath, '.gitignore'), '*.json\n!.gitignore\n');
    }
  }

  /**
   * Lưu thông tin sử dụng token
   */
  async trackTokenUsage(data: {
    model: string;
    component: string;
    operation: string;
    tokenUsage: TokenUsageDto;
    metadata?: Record<string, any>;
  }): Promise<LLMUsageRecord> {
    const { model, component, operation, tokenUsage, metadata } = data;
    
    // Tính chi phí dựa trên model và usage
    const cost = calculateCost(
      model,
      tokenUsage.promptTokens,
      tokenUsage.completionTokens
    );
    
    // Tạo record mới
    const usageRecord = this.usageRepository.create({
      timestamp: new Date(),
      model,
      component,
      operation,
      tokenUsage,
      cost,
      metadata
    });
    
    // Lưu vào database
    await this.usageRepository.save(usageRecord);
    
    // Lưu vào file
    await this.appendToFile(usageRecord);
    
    this.logger.log(
      `LLM Usage - Model: ${model}, Component: ${component}, Operation: ${operation}, ` +
      `Tokens: ${tokenUsage.totalTokens}, Cost: $${cost.toFixed(6)}`
    );
    
    return usageRecord;
  }

  /**
   * Lưu thông tin vào file
   */
  private async appendToFile(record: LLMUsageRecord): Promise<void> {
    try {
      // Lấy ngày hiện tại để đặt tên file
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const fileName = `cost-usage-${today}.json`;
      const filePath = path.join(this.storagePath, fileName);
      
      // Đọc file nếu đã tồn tại
      let fileData: { records: LLMUsageRecord[] } = { records: [] };
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        fileData = JSON.parse(fileContent);
      }
      
      // Thêm record mới
      fileData.records.push(record);
      
      // Ghi lại vào file
      fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
      
      this.logger.debug(`Đã lưu thông tin sử dụng token vào file ${fileName}`);
    } catch (error) {
      this.logger.error(`Lỗi khi lưu thông tin sử dụng token vào file: ${error.message}`);
    }
  }

  /**
   * Lấy chi phí theo ngày
   */
  async getDailyCost(date: Date = new Date()): Promise<CostSummaryDto> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return this.getCostByDateRange(startDate, endDate);
  }
  
  /**
   * Lấy chi phí theo tháng
   */
  async getMonthlyCost(year: number, month: number): Promise<CostSummaryDto> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    return this.getCostByDateRange(startDate, endDate);
  }
  
  /**
   * Lấy chi phí theo khoảng thời gian
   */
  private async getCostByDateRange(startDate: Date, endDate: Date): Promise<CostSummaryDto> {
    const records = await this.usageRepository.find({
      where: {
        timestamp: Between(startDate, endDate)
      }
    });
    
    return this.calculateSummary(records);
  }
  
  /**
   * Lấy chi phí theo component
   */
  async getUsageByComponent(): Promise<Record<string, CostSummaryDto>> {
    const result: Record<string, CostSummaryDto> = {};
    
    // Lấy danh sách các component
    const components = await this.usageRepository
      .createQueryBuilder('record')
      .select('record.component')
      .distinct(true)
      .getRawMany();
    
    // Lấy chi phí cho từng component
    for (const item of components) {
      const component = item.record_component;
      const records = await this.usageRepository.find({
        where: { component }
      });
      
      result[component] = this.calculateSummary(records);
    }
    
    return result;
  }
  
  /**
   * Lấy chi phí theo model
   */
  async getUsageByModel(): Promise<Record<string, CostSummaryDto>> {
    const result: Record<string, CostSummaryDto> = {};
    
    // Lấy danh sách các model
    const models = await this.usageRepository
      .createQueryBuilder('record')
      .select('record.model')
      .distinct(true)
      .getRawMany();
    
    // Lấy chi phí cho từng model
    for (const item of models) {
      const model = item.record_model;
      const records = await this.usageRepository.find({
        where: { model }
      });
      
      result[model] = this.calculateSummary(records);
    }
    
    return result;
  }
  
  /**
   * Tính toán tổng hợp từ các records
   */
  private calculateSummary(records: LLMUsageRecord[]): CostSummaryDto {
    const summary: CostSummaryDto = {
      cost: 0,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      count: records.length
    };
    
    for (const record of records) {
      summary.cost += record.cost;
      summary.usage.promptTokens += record.tokenUsage.promptTokens;
      summary.usage.completionTokens += record.tokenUsage.completionTokens;
      summary.usage.totalTokens += record.tokenUsage.totalTokens;
    }
    
    return summary;
  }
  
  /**
   * Tạo báo cáo chi phí theo ngày
   */
  async generateDailyReport(date: Date = new Date()): Promise<CostReportDto> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const records = await this.usageRepository.find({
      where: {
        timestamp: Between(startDate, endDate)
      }
    });
    
    const summary = this.calculateSummary(records);
    
    const report: CostReportDto = {
      id: uuidv4(),
      date: startDate.toISOString().split('T')[0],
      records,
      summary
    };
    
    // Lưu báo cáo vào file
    this.saveReportToFile(report);
    
    return report;
  }
  
  /**
   * Lưu báo cáo vào file
   */
  private saveReportToFile(report: CostReportDto): void {
    try {
      const fileName = `report-${report.date}-${report.id}.json`;
      const filePath = path.join(this.storagePath, fileName);
      
      fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
      
      this.logger.log(`Đã lưu báo cáo chi phí vào file ${fileName}`);
    } catch (error) {
      this.logger.error(`Lỗi khi lưu báo cáo chi phí vào file: ${error.message}`);
    }
  }
  
  /**
   * Kiểm tra ngưỡng chi phí theo ngày (chạy mỗi giờ)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkDailyCostThreshold() {
    try {
      const dailyCost = await this.getDailyCost();
      
      if (dailyCost.cost >= this.dailyThreshold) {
        this.logger.warn(`Daily cost threshold exceeded: $${dailyCost.cost.toFixed(2)} >= $${this.dailyThreshold}`);
        // TODO: Gửi thông báo cảnh báo
        
        // Tạo báo cáo chi phí
        await this.generateDailyReport();
      }
    } catch (error) {
      this.logger.error(`Error checking daily cost threshold: ${error.message}`);
    }
  }
  
  /**
   * Kiểm tra ngưỡng chi phí theo tháng (chạy mỗi ngày)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkMonthlyCostThreshold() {
    try {
      const now = new Date();
      const monthlyCost = await this.getMonthlyCost(now.getFullYear(), now.getMonth() + 1);
      
      if (monthlyCost.cost >= this.monthlyThreshold) {
        this.logger.warn(`Monthly cost threshold exceeded: $${monthlyCost.cost.toFixed(2)} >= $${this.monthlyThreshold}`);
        // TODO: Gửi thông báo cảnh báo
      }
      
      // Tạo báo cáo chi phí theo ngày
      await this.generateDailyReport(now);
    } catch (error) {
      this.logger.error(`Error checking monthly cost threshold: ${error.message}`);
    }
  }
  
  /**
   * Tạo báo cáo chi phí định kỳ hàng ngày vào lúc nửa đêm
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async createDailyReport() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await this.generateDailyReport(yesterday);
      
      this.logger.log(`Đã tạo báo cáo chi phí cho ngày ${yesterday.toISOString().split('T')[0]}`);
    } catch (error) {
      this.logger.error(`Error creating daily report: ${error.message}`);
    }
  }
} 