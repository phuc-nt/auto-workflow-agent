import { Injectable } from '@nestjs/common';
import { EnhancedLogger } from '../../utils/logger';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';

@Injectable()
export class MockConfluenceAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger('MockConfluenceAgent');
  
  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    this.logger.log(`MockConfluenceAgent executing: ${prompt}`);
    
    // Giả lập độ trễ
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (prompt.toLowerCase().includes('daily report') || 
        prompt.toLowerCase().includes('báo cáo hàng ngày') || 
        prompt.toLowerCase().includes('dev-123')) {
      return this.mockUpdateDailyReport(prompt);
    }
    
    if (prompt.toLowerCase().includes('tìm kiếm') || prompt.toLowerCase().includes('search')) {
      return this.mockSearchPages(prompt);
    }
    
    if (prompt.toLowerCase().includes('tạo trang') || prompt.toLowerCase().includes('create page')) {
      return this.mockCreatePage(prompt);
    }
    
    if (prompt.toLowerCase().includes('cập nhật') || prompt.toLowerCase().includes('update')) {
      return this.mockUpdatePage(prompt);
    }
    
    // Default là lấy nội dung
    return this.mockGetPageContent(prompt);
  }
  
  /**
   * Tìm kiếm trang trên Confluence
   */
  private mockSearchPages(prompt: string): StepResult {
    // Tìm kiếm tài liệu thiết kế database
    if (prompt.toLowerCase().includes('database') || prompt.toLowerCase().includes('thiết kế')) {
      return {
        success: true,
        data: {
          results: [
            {
              id: 'page123',
              title: 'Thiết kế Database',
              url: 'https://example.com/confluence/page123',
              lastUpdated: '2023-03-15',
              space: 'DEV',
              excerpt: 'Tài liệu mô tả chi tiết thiết kế database cho dự án Dev-Assist...'
            },
            {
              id: 'page124',
              title: 'Schema Database - Dev Environment',
              url: 'https://example.com/confluence/page124',
              lastUpdated: '2023-04-01',
              space: 'DEV',
              excerpt: 'Database schema cho môi trường development...'
            },
            {
              id: 'page125',
              title: 'Hướng dẫn tối ưu Database',
              url: 'https://example.com/confluence/page125',
              lastUpdated: '2023-02-20',
              space: 'DEV',
              excerpt: 'Best practices cho việc tối ưu queries và database structure...'
            }
          ],
          total: 3
        },
        metadata: {
          executionTime: 520,
          tokenUsage: 190
        }
      };
    }
    
    // Mặc định trả về kết quả tìm kiếm
    return {
      success: true,
      data: {
        results: [
          {
            id: 'page123',
            title: 'Tài liệu kỹ thuật',
            url: 'https://example.com/confluence/page123',
            lastUpdated: '2023-03-15',
            space: 'DEV',
            excerpt: 'Tài liệu kỹ thuật cho dự án...'
          }
        ],
        total: 1
      },
      metadata: {
        executionTime: 480,
        tokenUsage: 180
      }
    };
  }
  
  /**
   * Cập nhật nội dung trang
   */
  private mockUpdatePage(prompt: string): StepResult {
    return {
      success: true,
      data: {
        id: 'page123',
        title: 'Sprint-Review',
        url: 'https://example.com/confluence/page123',
        lastUpdated: new Date().toISOString(),
        message: 'Trang đã được cập nhật thành công'
      },
      metadata: {
        executionTime: 550,
        tokenUsage: 200
      }
    };
  }
  
  /**
   * Tạo trang mới
   */
  private mockCreatePage(prompt: string): StepResult {
    return {
      success: true,
      data: {
        id: 'page456',
        title: prompt.includes('title:') ? prompt.split('title:')[1].split(',')[0].trim() : 'Trang mới',
        url: 'https://example.com/confluence/page456',
        created: new Date().toISOString(),
        message: 'Trang đã được tạo thành công'
      },
      metadata: {
        executionTime: 600,
        tokenUsage: 220
      }
    };
  }
  
  /**
   * Lấy nội dung trang
   */
  private mockGetPageContent(prompt: string): StepResult {
    return {
      success: true,
      data: {
        id: 'page123',
        title: 'Sprint-Review',
        content: '# Sprint Review\n\n## Sprint 8\n\n### Tiến độ\n- Hoàn thành: 6/12 tasks\n- Đang thực hiện: 4/12 tasks\n- Chưa bắt đầu: 2/12 tasks\n\n### Vấn đề gặp phải\n- Khó khăn khi tích hợp với API bên thứ ba\n- Thiếu tài nguyên cho việc testing',
        url: 'https://example.com/confluence/page123',
        lastUpdated: '2023-04-10'
      },
      metadata: {
        executionTime: 480,
        tokenUsage: 210
      }
    };
  }
  
  /**
   * Cập nhật báo cáo hàng ngày
   */
  private mockUpdateDailyReport(prompt: string): StepResult {
    return {
      success: true,
      data: {
        pageId: "CONF-456",
        title: "Daily Report - " + new Date().toLocaleDateString('vi-VN'),
        url: "https://confluence.example.com/pages/CONF-456",
        updated: true,
        sections: [
          {
            title: "Công việc hoàn thành",
            content: prompt.toLowerCase().includes('dev-123') ? 
                     "- DEV-123: Implement login feature (user123) - Đã triển khai login flow và xử lý refresh token" :
                     "- XDEMO2-5: Cập nhật tài liệu API (user123)\n- XDEMO2-7: Tối ưu hiệu suất trang chủ (user123)"
          },
          {
            title: "Công việc đang thực hiện",
            content: "- XDEMO2-1: Fix login page layout (user123)"
          },
          {
            title: "Kế hoạch ngày mai",
            content: "- XDEMO2-2: Add unit tests for auth service"
          },
          {
            title: "Vấn đề gặp phải",
            content: prompt.toLowerCase().includes('gặp khó khăn') ?
                     prompt.split('gặp khó khăn')[1].trim() :
                     "Không có vấn đề đáng chú ý"
          }
        ],
        content: `# Báo cáo ngày ${new Date().toLocaleDateString('vi-VN')}\n\n## Công việc hoàn thành\n- XDEMO2-5: Cập nhật tài liệu API (user123)\n- XDEMO2-7: Tối ưu hiệu suất trang chủ (user123)\n\n## Công việc đang thực hiện\n- XDEMO2-1: Fix login page layout (user123)\n\n## Kế hoạch ngày mai\n- XDEMO2-2: Add unit tests for auth service\n\n## Vấn đề gặp phải\nKhông có vấn đề đáng chú ý`
      },
      metadata: {
        executionTime: 550,
        tokenUsage: 200
      }
    };
  }
} 