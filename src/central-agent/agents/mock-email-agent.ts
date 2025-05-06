import { Injectable } from '@nestjs/common';
import { EnhancedLogger } from '../../utils/logger';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MockEmailAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger('MockEmailAgent');
  private readonly projectConfig: any;
  
  constructor() {
    try {
      const configPath = path.join(process.cwd(), 'src/config/project_config_demo.json');
      this.projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.logger.log('Đã tải thông tin cấu hình dự án thành công');
    } catch (error) {
      this.logger.error(`Không thể tải thông tin cấu hình dự án: ${error.message}`);
      this.projectConfig = { projectMembers: [] };
    }
  }
  
  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    this.logger.log(`MockEmailAgent executing: ${prompt}`);
    
    // Giả lập độ trễ
    await new Promise(resolve => setTimeout(resolve, 350));
    
    // Xử lý dựa trên prompt
    if (prompt.toLowerCase().includes('gửi lời mời') || 
        prompt.toLowerCase().includes('invite') || 
        prompt.toLowerCase().includes('cuộc họp')) {
      return this.mockSendInvitation(prompt);
    }
    
    if (prompt.toLowerCase().includes('tìm kiếm') || 
        prompt.toLowerCase().includes('phản hồi khách hàng') || 
        prompt.toLowerCase().includes('feedback')) {
      return this.mockSearchCustomerFeedback(prompt);
    }
    
    if (prompt.toLowerCase().includes('gửi báo cáo') || 
        prompt.toLowerCase().includes('send report')) {
      return this.mockSendReport(prompt);
    }
    
    // Default là gửi email thông thường
    return this.mockSendGeneralEmail(prompt);
  }
  
  /**
   * Giả lập gửi lời mời họp qua email
   */
  private mockSendInvitation(prompt: string): StepResult {
    const recipients = this.extractRecipientsFromConfig(prompt);
    const meetingTitle = this.extractMeetingTitle(prompt);
    const meetingTime = this.extractMeetingTime(prompt);
    const location = this.extractLocation(prompt);
    
    return {
      success: true,
      data: {
        messageId: `email_${Date.now()}`,
        to: recipients,
        subject: `Lời mời: ${meetingTitle}`,
        content: {
          title: meetingTitle,
          time: meetingTime,
          location: location,
          joinLink: `https://meet.example.com/${meetingTitle.replace(/\s+/g, '-').toLowerCase()}`,
          calendar: {
            type: 'ics',
            event: {
              start: meetingTime,
              end: this.calculateEndTime(meetingTime),
              summary: meetingTitle,
              location: location,
              organizer: this.projectConfig.projectMembers?.length > 0 ? 
                this.projectConfig.projectMembers[0].email : 'user123@example.com'
            }
          }
        },
        sentAt: new Date().toISOString(),
        status: 'sent'
      },
      metadata: {
        executionTime: 350,
        tokenUsage: 160
      }
    };
  }
  
  /**
   * Giả lập tìm kiếm phản hồi khách hàng từ email
   */
  private mockSearchCustomerFeedback(prompt: string): StepResult {
    let feedbacks = [];
    
    // Kiểm tra xem prompt có đề cập đến loại feedback cụ thể không
    if (prompt.toLowerCase().includes('đăng nhập') || prompt.toLowerCase().includes('login')) {
      feedbacks = [
        {
          id: 'email_fb_001',
          from: 'customer1@example.com',
          subject: 'Phản hồi về tính năng đăng nhập',
          receivedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          content: 'Tôi gặp vấn đề khi đăng nhập bằng tài khoản Google, hệ thống báo lỗi "Không thể xác thực".',
          category: 'Bug',
          priority: 'High'
        },
        {
          id: 'email_fb_002',
          from: 'customer2@example.com',
          subject: 'Góp ý cải thiện trang đăng nhập',
          receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          content: 'Trang đăng nhập nên có tùy chọn "Ghi nhớ đăng nhập" để tiện lợi hơn cho người dùng.',
          category: 'Feature Request',
          priority: 'Medium'
        },
        {
          id: 'email_fb_003',
          from: 'customer3@example.com',
          subject: 'Đánh giá quá trình đăng nhập',
          receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          content: 'Tôi thấy quá trình đăng nhập khá dễ dàng, nhưng hơi chậm khi xác thực qua 2FA.',
          category: 'Performance',
          priority: 'Low'
        }
      ];
    } else if (prompt.toLowerCase().includes('giao diện') || prompt.toLowerCase().includes('ui')) {
      feedbacks = [
        {
          id: 'email_fb_004',
          from: 'customer4@example.com',
          subject: 'Đánh giá về giao diện mới',
          receivedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          content: 'Tôi rất thích giao diện mới, đặc biệt là bảng điều khiển trực quan và dễ sử dụng.',
          category: 'UI/UX',
          priority: 'Medium'
        }
      ];
    } else {
      // Phản hồi mặc định
      feedbacks = [
        {
          id: 'email_fb_005',
          from: 'customer5@example.com',
          subject: 'Phản hồi chung về ứng dụng',
          receivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          content: 'Ứng dụng hoạt động tốt, nhưng tôi muốn có thêm tính năng xuất báo cáo sang Excel.',
          category: 'Feature Request',
          priority: 'Medium'
        },
        {
          id: 'email_fb_006',
          from: 'customer6@example.com',
          subject: 'Báo lỗi ứng dụng',
          receivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          content: 'Khi tôi cố gắng tải lên file lớn hơn 10MB, ứng dụng bị treo và không phản hồi.',
          category: 'Bug',
          priority: 'High'
        }
      ];
    }
    
    return {
      success: true,
      data: {
        feedbacks,
        total: feedbacks.length,
        categories: this.countByCategory(feedbacks),
        timeRange: 'last 14 days'
      },
      metadata: {
        executionTime: 380,
        tokenUsage: 200
      }
    };
  }
  
  /**
   * Giả lập gửi báo cáo qua email
   */
  private mockSendReport(prompt: string): StepResult {
    const recipients = this.extractRecipientsFromConfig(prompt);
    let reportType = 'general';
    let reportTitle = 'Báo cáo tổng hợp';
    
    if (prompt.toLowerCase().includes('tiến độ')) {
      reportType = 'progress';
      reportTitle = 'Báo cáo tiến độ dự án';
    } else if (prompt.toLowerCase().includes('phản hồi') || prompt.toLowerCase().includes('feedback')) {
      reportType = 'feedback';
      reportTitle = 'Báo cáo phân tích phản hồi khách hàng';
    } else if (prompt.toLowerCase().includes('tài liệu')) {
      reportType = 'documentation';
      reportTitle = 'Kế hoạch cập nhật tài liệu';
    }
    
    return {
      success: true,
      data: {
        messageId: `email_${Date.now()}`,
        to: recipients,
        subject: reportTitle,
        content: {
          title: reportTitle,
          summary: `Tóm tắt báo cáo ${reportType}`,
          attachments: [
            {
              fileName: `${reportType}_report.pdf`,
              size: '1.2MB',
              url: `https://example.com/reports/${reportType}_${Date.now()}.pdf`
            }
          ],
          htmlBody: this.generateReportHtml(reportType),
          plainText: this.generateReportPlainText(reportType)
        },
        sentAt: new Date().toISOString(),
        status: 'sent'
      },
      metadata: {
        executionTime: 380,
        tokenUsage: 180
      }
    };
  }
  
  /**
   * Giả lập gửi email thông thường
   */
  private mockSendGeneralEmail(prompt: string): StepResult {
    const recipients = this.extractRecipientsFromConfig(prompt);
    const subject = this.extractSubject(prompt);
    const body = this.extractBody(prompt);
    
    return {
      success: true,
      data: {
        messageId: `email_${Date.now()}`,
        to: recipients,
        subject: subject,
        content: {
          htmlBody: `<div>${body}</div>`,
          plainText: body
        },
        sentAt: new Date().toISOString(),
        status: 'sent'
      },
      metadata: {
        executionTime: 330,
        tokenUsage: 150
      }
    };
  }
  
  // Các phương thức hỗ trợ
  private extractRecipients(prompt: string): string[] {
    if (prompt.toLowerCase().includes('team dev') || prompt.toLowerCase().includes('dev team')) {
      return ['dev1@example.com', 'dev2@example.com', 'dev3@example.com'];
    } else if (prompt.toLowerCase().includes('quản lý') || prompt.toLowerCase().includes('manager')) {
      return ['manager@example.com', 'project-lead@example.com'];
    } else if (prompt.toLowerCase().includes('tất cả') || prompt.toLowerCase().includes('everyone') || prompt.toLowerCase().includes('all')) {
      return ['team@example.com'];
    }
    return ['default@example.com'];
  }
  
  private extractMeetingTitle(prompt: string): string {
    if (prompt.toLowerCase().includes('tính năng mới')) return 'Thảo luận tính năng mới';
    if (prompt.toLowerCase().includes('báo cáo')) return 'Báo cáo tiến độ dự án';
    if (prompt.toLowerCase().includes('sprint')) return 'Sprint Planning Meeting';
    return 'Cuộc họp mới';
  }
  
  private extractMeetingTime(prompt: string): string {
    // Chỉ ví dụ, trong thực tế cần phân tích phức tạp hơn
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (prompt.toLowerCase().includes('tomorrow') || prompt.toLowerCase().includes('ngày mai')) {
      return tomorrow.toISOString();
    }
    
    // Mặc định là thứ 6 tuần này
    const friday = new Date(now);
    const currentDay = friday.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToAdd = currentDay <= 5 ? 5 - currentDay : 6; // Tính số ngày cần thêm để tới thứ 6
    friday.setDate(friday.getDate() + daysToAdd);
    friday.setHours(10, 0, 0, 0); // 10:00 AM
    
    return friday.toISOString();
  }
  
  private calculateEndTime(startTime: string): string {
    const startDate = new Date(startTime);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1); // Mặc định cuộc họp kéo dài 1 giờ
    return endDate.toISOString();
  }
  
  private extractLocation(prompt: string): string {
    if (prompt.toLowerCase().includes('phòng họp a')) return 'Phòng họp A';
    if (prompt.toLowerCase().includes('phòng họp b')) return 'Phòng họp B';
    if (prompt.toLowerCase().includes('online') || prompt.toLowerCase().includes('trực tuyến')) {
      return 'Online - Google Meet';
    }
    return 'Phòng họp A'; // Mặc định
  }
  
  private extractSubject(prompt: string): string {
    // Logic đơn giản để tạo tiêu đề từ prompt
    const words = prompt.split(' ');
    if (words.length <= 5) return prompt;
    return words.slice(0, 5).join(' ') + '...';
  }
  
  private extractBody(prompt: string): string {
    return `Nội dung email: ${prompt}`;
  }
  
  private countByCategory(feedbacks: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    feedbacks.forEach(feedback => {
      if (feedback.category) {
        result[feedback.category] = (result[feedback.category] || 0) + 1;
      }
    });
    return result;
  }
  
  private generateReportHtml(reportType: string): string {
    switch (reportType) {
      case 'progress':
        return '<h1>Báo cáo tiến độ dự án</h1><p>Tiến độ hoàn thành: 65%</p>';
      case 'feedback':
        return '<h1>Báo cáo phản hồi khách hàng</h1><p>Tổng số phản hồi: 15</p>';
      case 'documentation':
        return '<h1>Kế hoạch cập nhật tài liệu</h1><p>Số tài liệu cần cập nhật: 7</p>';
      default:
        return '<h1>Báo cáo tổng hợp</h1><p>Nội dung báo cáo</p>';
    }
  }
  
  private generateReportPlainText(reportType: string): string {
    switch (reportType) {
      case 'progress':
        return 'Báo cáo tiến độ dự án\n\nTiến độ hoàn thành: 65%';
      case 'feedback':
        return 'Báo cáo phản hồi khách hàng\n\nTổng số phản hồi: 15';
      case 'documentation':
        return 'Kế hoạch cập nhật tài liệu\n\nSố tài liệu cần cập nhật: 7';
      default:
        return 'Báo cáo tổng hợp\n\nNội dung báo cáo';
    }
  }
  
  // Phương thức mới để trích xuất người nhận từ cấu hình dự án
  private extractRecipientsFromConfig(prompt: string): string[] {
    // Nếu không có thông tin cấu hình, sử dụng phương thức cũ
    if (!this.projectConfig.projectMembers || !this.projectConfig.projectMembers.length) {
      return this.extractRecipients(prompt);
    }
    
    // Nếu đề cập đến "tất cả" hoặc "all" hoặc "everyone", trả về email của tất cả thành viên
    if (prompt.toLowerCase().includes('tất cả') || 
        prompt.toLowerCase().includes('all') || 
        prompt.toLowerCase().includes('everyone')) {
      return this.projectConfig.projectMembers.map(member => member.email);
    }
    
    // Tìm kiếm tên người nhận trong prompt
    const recipients = [];
    for (const member of this.projectConfig.projectMembers) {
      if (prompt.toLowerCase().includes(member.name.toLowerCase())) {
        recipients.push(member.email);
      }
    }
    
    // Nếu không tìm thấy ai, trả về từ phương thức cũ
    if (recipients.length === 0) {
      return this.extractRecipients(prompt);
    }
    
    return recipients;
  }
} 