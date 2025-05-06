import { Injectable } from '@nestjs/common';
import { EnhancedLogger } from '../../utils/logger';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';

@Injectable()
export class MockJiraAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger('MockJiraAgent');
  
  async executePrompt(prompt: string): Promise<StepResult> {
    this.logger.log(`MockJiraAgent executing: ${prompt}`);
    
    // Giả lập độ trễ
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Kiểm tra trường hợp đặc biệt cho tính năng mới
    if (prompt.toLowerCase().includes('tính năng mới') || prompt.toLowerCase().includes('feature')) {
      return this.mockGetNewFeatureInfo();
    }
    
    // Xử lý dựa trên prompt
    if (prompt.includes('XDEMO2-1')) {
      return this.mockGetIssueDetails('XDEMO2-1');
    }
    
    if (prompt.toLowerCase().includes('tìm') && (prompt.toLowerCase().includes('task') || prompt.toLowerCase().includes('công việc'))) {
      return this.findTasks(prompt);
    }
    
    if (prompt.toLowerCase().includes('cập nhật') || prompt.toLowerCase().includes('update')) {
      return this.updateTask(prompt);
    }
    
    if (prompt.toLowerCase().includes('tạo') || prompt.toLowerCase().includes('create')) {
      return this.createTask(prompt);
    }
    
    if (prompt.toLowerCase().includes('trạng thái') || prompt.toLowerCase().includes('status')) {
      return this.getTaskStatus(prompt);
    }
    
    if (prompt.toLowerCase().includes('báo cáo') || prompt.toLowerCase().includes('report')) {
      return this.createReport(prompt);
    }
    
    // Fallback response
    return {
      success: true,
      data: {
        message: `JIRA: ${prompt}`,
        result: "Không có thao tác cụ thể cho yêu cầu này"
      },
      metadata: {
        executionTime: 500,
        tokenUsage: 180
      }
    };
  }
  
  /**
   * Tìm kiếm các task của người dùng
   */
  private findTasks(prompt: string): StepResult {
    const userId = prompt.includes('user123') ? 'user123' : 'unknown';
    
    // Kiểm tra nếu tìm task đã hoàn thành hôm nay
    if (prompt.toLowerCase().includes('hoàn thành') && prompt.toLowerCase().includes('hôm nay')) {
      return {
        success: true,
        data: {
          tasks: [
            {
              id: 'XDEMO2-5',
              key: 'XDEMO2-5',
              summary: 'Cập nhật tài liệu API',
              status: 'Done',
              assignee: 'user123',
              dueDate: '2025-04-20',
              completedDate: '2025-04-20T14:30:00.000Z',
              priority: 'Medium',
              url: 'https://example.com/jira/XDEMO2-5',
              lastUpdated: '2025-04-20T14:30:00.000Z'
            },
            {
              id: 'XDEMO2-7',
              key: 'XDEMO2-7', 
              summary: 'Tối ưu hiệu suất trang chủ',
              status: 'Done',
              assignee: 'user123',
              dueDate: '2025-04-21',
              completedDate: '2025-04-20T16:45:00.000Z',
              priority: 'High',
              url: 'https://example.com/jira/XDEMO2-7',
              lastUpdated: '2025-04-20T16:45:00.000Z'
            }
          ],
          totalFound: 2,
          message: 'Đã tìm thấy 2 task hoàn thành trong ngày hôm nay'
        },
        metadata: {
          executionTime: 450,
          tokenUsage: 160
        }
      };
    }
    
    // Nếu prompt yêu cầu tìm task đang làm hoặc cần làm, chỉ trả về task In Progress hoặc To Do
    if (
      (prompt.toLowerCase().includes('in progress') || prompt.toLowerCase().includes('đang thực hiện') || prompt.toLowerCase().includes('to do') || prompt.toLowerCase().includes('cần làm'))
    ) {
      return {
        success: true,
        data: {
          tasks: [
            {
              id: 'XDEMO2-1',
              key: 'XDEMO2-1',
              summary: 'Fix login page layout',
              status: 'In Progress',
              assignee: userId,
              dueDate: '2025-04-30',
              priority: 'High',
              url: 'https://example.com/jira/XDEMO2-1',
              lastUpdated: '2025-04-20T09:15:00.000Z'
            },
            {
              id: 'XDEMO2-2',
              key: 'XDEMO2-2',
              summary: 'Add unit tests for auth service',
              status: 'To Do',
              assignee: userId,
              dueDate: '2025-05-05',
              priority: 'Medium',
              url: 'https://example.com/jira/XDEMO2-2',
              lastUpdated: '2025-04-19T16:30:00.000Z'
            },
            {
              id: 'XDEMO2-3',
              key: 'XDEMO2-3',
              summary: 'Update documentation',
              status: 'In Progress',
              assignee: userId,
              dueDate: '2025-04-28',
              priority: 'Low',
              url: 'https://example.com/jira/XDEMO2-3',
              lastUpdated: '2025-04-20T11:45:00.000Z'
            }
          ],
          totalFound: 3,
          message: `Đã tìm thấy 3 task đang mở của người dùng ${userId}`
        },
        metadata: {
          executionTime: 450,
          tokenUsage: 160
        }
      };
    }
    
    // Mặc định trả về task đang mở (giữ nguyên logic cũ)
    return {
      success: true,
      data: {
        tasks: [
          {
            id: 'XDEMO2-1',
            key: 'XDEMO2-1',
            summary: 'Fix login page layout',
            status: 'In Progress',
            assignee: userId,
            dueDate: '2025-04-30',
            priority: 'High',
            url: 'https://example.com/jira/XDEMO2-1',
            lastUpdated: '2025-04-20T09:15:00.000Z'
          },
          {
            id: 'XDEMO2-2',
            key: 'XDEMO2-2',
            summary: 'Add unit tests for auth service',
            status: 'To Do',
            assignee: userId,
            dueDate: '2025-05-05',
            priority: 'Medium',
            url: 'https://example.com/jira/XDEMO2-2',
            lastUpdated: '2025-04-19T16:30:00.000Z'
          },
          {
            id: 'XDEMO2-3',
            key: 'XDEMO2-3',
            summary: 'Update documentation',
            status: 'In Progress',
            assignee: userId,
            dueDate: '2025-04-28',
            priority: 'Low',
            url: 'https://example.com/jira/XDEMO2-3',
            lastUpdated: '2025-04-20T11:45:00.000Z'
          }
        ],
        totalFound: 3,
        message: `Đã tìm thấy 3 task đang mở của người dùng ${userId}`
      },
      metadata: {
        executionTime: 450,
        tokenUsage: 160
      }
    };
  }
  
  /**
   * Cập nhật trạng thái task
   */
  private updateTask(prompt: string): StepResult {
    // Tìm tất cả mã task trong prompt
    const taskMatches = prompt.match(/XDEMO2-\d+/g);
    
    // Danh sách task để cập nhật
    let taskKeys: string[] = [];
    
    if (taskMatches && taskMatches.length > 0) {
      // Loại bỏ các mã task trùng lặp
      taskKeys = [...new Set(taskMatches)];
    } else {
      // Nếu không tìm thấy mã task cụ thể, sử dụng danh sách mặc định
      taskKeys = ['XDEMO2-1', 'XDEMO2-2', 'XDEMO2-3'];
      
      // Kiểm tra nếu prompt có đề cập đến "tất cả" hoặc "all"
      if (prompt.toLowerCase().includes('tất cả') || 
          prompt.toLowerCase().includes('all') ||
          prompt.toLowerCase().includes('các task')) {
        taskKeys = ['XDEMO2-1', 'XDEMO2-2', 'XDEMO2-3', 'XDEMO2-5', 'XDEMO2-7'];
      }
    }
    
    // Xác định trạng thái cần cập nhật
    let status = '';
    if (prompt.toLowerCase().includes('done') || prompt.toLowerCase().includes('hoàn thành')) {
      status = 'Done';
    } else if (prompt.toLowerCase().includes('in progress') || prompt.toLowerCase().includes('đang thực hiện')) {
      status = 'In Progress';
    } else if (prompt.toLowerCase().includes('to do') || prompt.toLowerCase().includes('cần làm')) {
      status = 'To Do';
    } else {
      status = 'Done'; // Mặc định là Done nếu không xác định được
    }
    
    // Tạo danh sách các tasks đã cập nhật
    const updatedTasks = taskKeys.map(key => ({
      key,
      oldStatus: 'In Progress',
      newStatus: status,
      updatedBy: 'user123',
      timestamp: new Date().toISOString()
    }));
    
    return {
      success: true,
      data: {
        updatedTasks,
        totalUpdated: taskKeys.length,
        status,
        message: `Đã cập nhật ${taskKeys.length} task sang trạng thái ${status}: ${taskKeys.join(', ')}`
      },
      metadata: {
        executionTime: 600 + taskKeys.length * 50, // Thêm 50ms cho mỗi task
        tokenUsage: 190 + taskKeys.length * 10 // Thêm 10 token cho mỗi task
      }
    };
  }
  
  /**
   * Tạo task mới
   */
  private createTask(prompt: string): StepResult {
    // Tạo mã task mới ngẫu nhiên
    const randomNum = Math.floor(Math.random() * 100) + 10;
    const newTaskKey = `XDEMO2-${randomNum}`;
    
    let summary = 'New task';
    if (prompt.includes(':')) {
      const parts = prompt.split(':');
      if (parts.length > 1) {
        summary = parts[1].trim();
      }
    }
    
    return {
      success: true,
      data: {
        taskKey: newTaskKey,
        summary: summary,
        status: 'To Do',
        assignee: 'user123',
        createdBy: 'user123',
        dueDate: null,
        priority: 'Medium',
        url: `https://example.com/jira/${newTaskKey}`,
        message: `Đã tạo task ${newTaskKey}: ${summary}`
      },
      metadata: {
        executionTime: 550,
        tokenUsage: 175
      }
    };
  }
  
  /**
   * Lấy trạng thái task
   */
  private getTaskStatus(prompt: string): StepResult {
    let taskKey = '';
    let matches = prompt.match(/XDEMO2-\d+/);
    
    if (matches) {
      taskKey = matches[0];
    } else {
      // Nếu không tìm thấy mã task cụ thể, giả định là XDEMO2-5
      taskKey = 'XDEMO2-5';
    }
    
    return {
      success: true,
      data: {
        taskKey: taskKey,
        status: 'In Progress',
        assignee: 'user123',
        lastUpdated: '2025-04-19T16:30:00.000Z',
        lastComment: 'Đang làm phần UI, dự kiến hoàn thành trong hôm nay',
        message: `Task ${taskKey} hiện đang ở trạng thái In Progress`
      },
      metadata: {
        executionTime: 480,
        tokenUsage: 170
      }
    };
  }
  
  /**
   * Tạo báo cáo
   */
  private createReport(prompt: string): StepResult {
    return {
      success: true,
      data: {
        reportId: `REPORT-${Date.now()}`,
        reportDate: new Date().toISOString(),
        userId: 'user123',
        completedTasks: [
          {
            id: 'XDEMO2-5',
            key: 'XDEMO2-5',
            summary: 'Cập nhật tài liệu API',
            completedDate: '2025-04-20T14:30:00.000Z'
          },
          {
            id: 'XDEMO2-7',
            key: 'XDEMO2-7', 
            summary: 'Tối ưu hiệu suất trang chủ',
            completedDate: '2025-04-20T16:45:00.000Z'
          }
        ],
        inProgressTasks: [
          {
            id: 'XDEMO2-1',
            key: 'XDEMO2-1',
            summary: 'Fix login page layout',
            dueDate: '2025-04-30'
          }
        ],
        upcomingTasks: [
          {
            id: 'XDEMO2-2',
            key: 'XDEMO2-2',
            summary: 'Add unit tests for auth service',
            dueDate: '2025-05-05'
          }
        ],
        reportContent: 'Báo cáo ngày 20/04/2025\n\nCông việc đã hoàn thành:\n- XDEMO2-5: Cập nhật tài liệu API\n- XDEMO2-7: Tối ưu hiệu suất trang chủ\n\nCông việc đang thực hiện:\n- XDEMO2-1: Fix login page layout (deadline: 30/04/2025)\n\nCông việc sắp tới:\n- XDEMO2-2: Add unit tests for auth service (deadline: 05/05/2025)',
        message: 'Đã tạo báo cáo công việc cho ngày hôm nay'
      },
      metadata: {
        executionTime: 650,
        tokenUsage: 200
      }
    };
  }
  
  /**
   * Trả về thông tin giả lập về một issue cụ thể
   */
  private mockGetIssueDetails(issueId: string): StepResult {
    return {
      success: true,
      data: {
        id: issueId,
        title: 'Lỗi đăng nhập trên thiết bị iOS',
        description: 'Người dùng báo cáo không thể đăng nhập vào ứng dụng trên thiết bị iOS sau khi cập nhật lên phiên bản mới nhất. Lỗi xảy ra trên iOS 15 trở lên.',
        assignee: 'Phúc Nguyễn',
        status: 'In Progress',
        priority: 'High',
        epic: 'AUTH-123',
        epicName: 'Cải thiện trải nghiệm đăng nhập',
        comments: [
          {
            author: 'Minh',
            content: 'Tôi đã tái tạo được lỗi này trên iPhone 12 với iOS 15.4. Có vẻ như vấn đề liên quan đến cách chúng ta xử lý token xác thực.',
            created: '2023-05-15T09:23:45Z'
          },
          {
            author: 'Hưng',
            content: 'Tôi đã kiểm tra mã và thấy rằng chúng ta đang sử dụng một phương thức lưu trữ token đã bị deprecated từ iOS 15. Cần cập nhật để sử dụng KeyChain API mới.',
            created: '2023-05-15T10:15:22Z'
          }
        ]
      },
      metadata: {
        executionTime: 243,
        tokenUsage: 120
      }
    };
  }
  
  /**
   * Trả về thông tin giả lập về tính năng mới
   */
  private mockGetNewFeatureInfo(): StepResult {
    return {
      success: true,
      data: {
        features: [
          {
            id: "XDEMO2-10",
            title: "Xác thực hai yếu tố",
            description: "Thêm tính năng xác thực hai yếu tố cho người dùng",
            assignee: "Phúc",
            status: "In Progress",
            priority: "High",
            epic: "XDEMO2-5",
            epicName: "Cải thiện bảo mật"
          },
          {
            id: "XDEMO2-11",
            title: "Dashboard thống kê người dùng",
            description: "Thêm dashboard thống kê người dùng cho admin",
            assignee: "Đăng",
            status: "To Do",
            priority: "Medium",
            epic: "XDEMO2-6",
            epicName: "Báo cáo và thống kê"
          }
        ],
        project: {
          key: "XDEMO2",
          name: "Dự án mẫu Demo 2",
          teamMembers: [
            {
              name: "Phúc",
              role: "Developer",
              username: "phuc.nguyen"
            },
            {
              name: "Hưng",
              role: "Developer",
              username: "hung.nguyen"
            },
            {
              name: "Đăng",
              role: "Developer",
              username: "dang.nguyen"
            },
            {
              name: "Minh",
              role: "Tester",
              username: "minh.nguyen"
            }
          ]
        },
        meetingNotes: "Cần tổ chức cuộc họp về tính năng xác thực mới"
      },
      metadata: {
        executionTime: 300,
        tokenUsage: 120
      }
    };
  }
} 