import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Logger mở rộng hỗ trợ lưu logs ra file và hiển thị màu sắc trên terminal
 */
export class EnhancedLogger extends Logger {
  private static loggerInstances: Map<string, EnhancedLogger> = new Map();
  private static logFile: string;
  private static fileStream: fs.WriteStream;
  
  /**
   * Khởi tạo logging system
   */
  static initialize() {
    // Tạo thư mục logs nếu chưa tồn tại
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
    
    // Tạo file log với timestamp
    const date = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    this.logFile = path.join(logsDir, `app-${date}.log`);
    
    // Tạo stream
    this.fileStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    
    // Log thông tin khởi tạo
    const initMessage = `=== Logging initialized at ${new Date().toISOString()} ===`;
    this.fileStream.write(`${initMessage}\n`);
    console.log(`\x1b[36m${initMessage}\x1b[0m`);
  }
  
  /**
   * Lấy instance của logger
   */
  static getLogger(context: string): EnhancedLogger {
    if (!this.fileStream) {
      this.initialize();
    }
    
    if (!this.loggerInstances.has(context)) {
      this.loggerInstances.set(context, new EnhancedLogger(context));
    }
    
    return this.loggerInstances.get(context);
  }
  
  /**
   * Log debug với màu cyan
   */
  debug(message: string) {
    // Ghi ra file
    const formattedMessage = `[DEBUG] [${this.context}] ${message}`;
    EnhancedLogger.fileStream.write(`${new Date().toISOString()} - ${formattedMessage}\n`);
    
    // Ghi ra console với màu
    super.debug(`\x1b[36m${message}\x1b[0m`);
  }
  
  /**
   * Log thông tin với màu xanh
   */
  log(message: string) {
    // Ghi ra file
    const formattedMessage = `[INFO] [${this.context}] ${message}`;
    EnhancedLogger.fileStream.write(`${new Date().toISOString()} - ${formattedMessage}\n`);
    
    // Ghi ra console với màu
    super.log(`\x1b[32m${message}\x1b[0m`);
  }
  
  /**
   * Log cảnh báo với màu vàng
   */
  warn(message: string) {
    // Ghi ra file
    const formattedMessage = `[WARN] [${this.context}] ${message}`;
    EnhancedLogger.fileStream.write(`${new Date().toISOString()} - ${formattedMessage}\n`);
    
    // Ghi ra console với màu
    super.warn(`\x1b[33m${message}\x1b[0m`);
  }
  
  /**
   * Log lỗi với màu đỏ
   */
  error(message: string, trace?: string) {
    // Ghi ra file
    const formattedMessage = `[ERROR] [${this.context}] ${message}`;
    EnhancedLogger.fileStream.write(`${new Date().toISOString()} - ${formattedMessage}\n`);
    if (trace) {
      EnhancedLogger.fileStream.write(`${new Date().toISOString()} - [ERROR] [${this.context}] ${trace}\n`);
    }
    
    // Ghi ra console với màu
    super.error(`\x1b[31m${message}\x1b[0m`, trace);
  }
  
  /**
   * Log verbose với màu xám
   */
  verbose(message: string) {
    // Ghi ra file
    const formattedMessage = `[VERBOSE] [${this.context}] ${message}`;
    EnhancedLogger.fileStream.write(`${new Date().toISOString()} - ${formattedMessage}\n`);
    
    // Ghi ra console với màu
    super.verbose(`\x1b[90m${message}\x1b[0m`);
  }
} 