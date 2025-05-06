import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { EnhancedLogger } from '../../utils/logger';

const readFile = promisify(fs.readFile);

@Injectable()
export class ProjectConfigReader {
  private readonly logger = EnhancedLogger.getLogger(ProjectConfigReader.name);
  private readonly configPath: string;
  private configCache: any = null;

  constructor() {
    // Đường dẫn mặc định đến file cấu hình
    this.configPath = path.join(process.cwd(), 'src', 'config', 'project_config_demo.json');
    this.logger.log(`Project config path: ${this.configPath}`);
  }

  /**
   * Đọc cấu hình dự án từ file
   */
  async getProjectConfig(): Promise<any> {
    if (this.configCache) {
      return this.configCache;
    }
    
    try {
      const data = await readFile(this.configPath, 'utf8');
      this.configCache = JSON.parse(data);
      return this.configCache;
    } catch (error) {
      this.logger.error(`Lỗi đọc file cấu hình dự án: ${error.message}`);
      throw new Error(`Không thể đọc cấu hình dự án: ${error.message}`);
    }
  }
  
  /**
   * Lấy thông tin ngữ cảnh dự án và người dùng
   */
  async getProjectContext(userId: string): Promise<any> {
    try {
      // Đọc cấu hình dự án
      const config = await this.getProjectConfig();
      
      // Tìm thông tin người dùng
      const userInfo = this.findUserInfoById(userId, config);
      
      // Tạo và trả về context
      return {
        user: userInfo,
        project: {
          key: config.jira?.projectKey,
          jiraDomain: config.jira?.domain,
          slackChannel: config.slack?.projectChannel,
          slackTeamId: config.slack?.teamId
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo project context: ${error.message}`);
      // Trả về dữ liệu tối thiểu thay vì ném lỗi
      return {
        user: { id: userId, name: userId },
        project: {}
      };
    }
  }
  
  /**
   * Tìm thông tin người dùng từ ID
   */
  private findUserInfoById(userId: string, config: any): any {
    try {
      // Tìm kiếm trong projectMembers
      const member = config.projectMembers?.find(
        (m: any) => m.jiraAccountId === userId || m.email === userId
      );
      
      if (member) {
        return {
          id: userId,
          name: member.name,
          email: member.email,
          jiraAccountId: member.jiraAccountId
        };
      }
      
      // Nếu không tìm thấy, trả về thông tin cơ bản
      return {
        id: userId,
        name: userId
      };
    } catch (error) {
      this.logger.warn(`Không thể tìm thông tin người dùng: ${error.message}`);
      return {
        id: userId,
        name: userId
      };
    }
  }
  
  clearCache() {
    this.configCache = null;
  }
} 