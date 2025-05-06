import { Injectable } from '@nestjs/common';
import { EnhancedLogger } from '../../utils/logger';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';

@Injectable()
export class MockSlackAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger('MockSlackAgent');
  
  async executePrompt(prompt: string): Promise<StepResult> {
    this.logger.log(`MockSlackAgent executing: ${prompt}`);
    
    // Giả lập độ trễ
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Xử lý dựa trên prompt
    if (prompt.toLowerCase().includes('thông báo') || prompt.toLowerCase().includes('gửi tin nhắn')) {
      if (prompt.toLowerCase().includes('đã hoàn thành') || prompt.toLowerCase().includes('cập nhật')) {
        return this.mockSendCompletionMessage(prompt);
      } else if (prompt.toLowerCase().includes('khoảng thời gian') || 
                prompt.toLowerCase().includes('đề xuất thời gian') || 
                prompt.toLowerCase().includes('thời gian phù hợp') || 
                prompt.toLowerCase().includes('lịch họp') ||
                prompt.toLowerCase().includes('cuộc họp')) {
        return this.mockSendMeetingTimeProposal(prompt);
      } else if (prompt.toLowerCase().includes('minh') && 
                (prompt.toLowerCase().includes('bận') || 
                 prompt.toLowerCase().includes('lịch trống') || 
                 prompt.toLowerCase().includes('điều chỉnh lịch'))) {
        return this.mockSendScheduleAdjustmentInquiry(prompt);
      } else {
        return this.mockSendGeneralMessage(prompt);
      }
    }
    
    if (prompt.toLowerCase().includes('tìm kiếm')) {
      return this.mockSearchMessages(prompt);
    }
    
    // Kiểm tra nếu prompt hỏi về lịch bận của Minh
    if ((prompt.toLowerCase().includes('hỏi') || prompt.toLowerCase().includes('kiểm tra')) && 
        prompt.toLowerCase().includes('minh') && 
        (prompt.toLowerCase().includes('bận') || prompt.toLowerCase().includes('lịch') || prompt.toLowerCase().includes('thời gian'))) {
      return this.mockSendScheduleAdjustmentInquiry(prompt);
    }
    
    // Fallback
    return {
      success: true,
      data: {
        message: `Đã gửi tin nhắn: ${prompt}`,
        channel: 'general',
        timestamp: new Date().toISOString()
      },
      metadata: {
        executionTime: 300,
        tokenUsage: 50
      }
    };
  }
  
  /**
   * Tìm kiếm tin nhắn
   */
  private mockSearchMessages(prompt: string): StepResult {
    // Kiểm tra xem prompt có đề cập đến task XDEMO2 không
    const taskMatches = prompt.match(/XDEMO2-\d+/g);
    const taskIds = taskMatches ? [...new Set(taskMatches)] : [];
    
    // Lấy thông tin thành viên được chỉ định trong context nếu có
    let specifiedParticipants = [];
    try {
      const contextMatch = prompt.match(/context\.specifiedParticipants/);
      if (contextMatch) {
        // Nếu có tham chiếu đến context.specifiedParticipants trong prompt
        const participantsMatch = prompt.match(/\[(.*?)\]/);
        if (participantsMatch && participantsMatch[1]) {
          specifiedParticipants = participantsMatch[1].split(',').map(p => p.trim().replace(/"/g, ''));
        }
      }
    } catch (error) {
      this.logger.error(`Lỗi khi phân tích thành viên từ context: ${error.message}`);
    }
    
    // Tạo danh sách tin nhắn động dựa trên context
    let messages = [];
    
    // Nếu tìm thấy các task cụ thể, tạo tin nhắn liên quan đến chúng
    if (taskIds.length > 0) {
      messages = taskIds.map(taskId => {
        // Tạo các loại tin nhắn khác nhau cho mỗi task
        return {
          text: `Đã hoàn thành task ${taskId}. Code đã được review và merge.`,
          user: 'U12345',
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
          channel: 'general',
          threadTs: `${Date.now() - 3600000}.${Math.floor(Math.random() * 1000000)}`
        };
      });
    } 
    // Nếu tìm kiếm về việc hoàn thành công việc 
    else if (prompt.toLowerCase().includes('hoàn thành') || 
             prompt.toLowerCase().includes('xong việc') || 
             prompt.toLowerCase().includes('done')) {
      messages = [
        {
          text: 'Đã hoàn thành task XDEMO2-1. PR đã được merge.',
          user: 'U12345',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          channel: 'general'
        },
        {
          text: 'Đã xong task XDEMO2-2 và XDEMO2-3. Cần team review code.',
          user: 'U67890',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          channel: 'dev-team'
        },
        {
          text: 'Tôi đã hoàn thành tất cả công việc được giao hôm nay (XDEMO2-5, XDEMO2-7)',
          user: 'U12345',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          channel: 'status-updates'
        }
      ];
    }
    // Nếu tìm kiếm về tính năng mới hoặc cuộc họp
    else if (prompt.toLowerCase().includes('tính năng mới') || 
             prompt.toLowerCase().includes('cuộc họp') ||
             prompt.toLowerCase().includes('họp') ||
             prompt.toLowerCase().includes('thảo luận')) {
      // Xác định thành viên team dựa trên context hoặc sử dụng mặc định
      let teamMembers = specifiedParticipants.length > 0 
        ? specifiedParticipants 
        : ["Phúc", "Hưng", "Đăng"];
        
      // Format danh sách thành viên thành chuỗi đề cập
      const memberMentions = teamMembers.map(member => `@${member}`).join(' ');
      
      // Tạo tin nhắn phù hợp với thành viên được chỉ định
      messages = [
        {
          text: `Chúng ta cần tổ chức cuộc họp về tính năng authentication mới cho dự án XDEMO2. ${memberMentions} cần tham gia.`,
          user: 'U12345',
          userName: 'Phúc',
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 ngày trước
          channel: 'dev-team',
          channelId: 'C08JFTGTN2K'
        },
        {
          text: 'Các tính năng mới cho XDEMO2 trong sprint này bao gồm: 1. Cải thiện UX đăng nhập, 2. Thêm xác thực 2FA, 3. Dashboard thống kê người dùng',
          user: 'U67890',
          userName: 'Hưng',
          timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 ngày trước
          channel: 'project-xdemo',
          channelId: 'C08JFTGTN2K'
        },
        {
          text: `Team phát triển gồm ${memberMentions} sẽ làm việc trên tính năng xác thực mới. Cần sắp xếp thời gian họp tuần này.`,
          user: 'U55555',
          userName: 'Đăng',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 ngày trước
          channel: 'general',
          channelId: 'C08JFTGTN2K'
        }
      ];
    }
    // Tìm kiếm mặc định
    else {
      messages = [
        {
          text: 'Đã hoàn thành task XDEMO2-1',
          user: 'U12345',
          timestamp: new Date().toISOString(),
          channel: 'general'
        },
        {
          text: 'Cần review task XDEMO2-2',
          user: 'U67890',
          timestamp: new Date().toISOString(),
          channel: 'dev-team'
        }
      ];
    }
    
    return {
      success: true,
      data: {
        messages,
        total: messages.length,
        query: prompt.substring(0, 50)
      },
      metadata: {
        executionTime: 310 + messages.length * 10,
        tokenUsage: 160 + messages.length * 20
      }
    };
  }
  
  /**
   * Giả lập gửi thông báo hoàn thành công việc
   */
  private mockSendCompletionMessage(prompt: string): StepResult {
    // Xác định kênh và người nhận
    const channelInfo = this.getChannelInfo(prompt);
    
    // Tạo tin nhắn
    const message = {
      text: "Thông báo: Đã hoàn thành công việc được giao",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "✅ Cập nhật trạng thái công việc",
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${this.extractUserName(prompt)}* đã cập nhật trạng thái của ${this.extractTaskCount(prompt)} task sang *Done*:`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: "*Task*: XDEMO2-1: Fix login page layout"
            },
            {
              type: "mrkdwn",
              text: "*Trạng thái*: Done ✅"
            },
            {
              type: "mrkdwn",
              text: "*Task*: XDEMO2-2: Add unit tests for auth service"
            },
            {
              type: "mrkdwn",
              text: "*Trạng thái*: Done ✅"
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `🕒 Cập nhật lúc ${new Date().toLocaleTimeString()} ${new Date().toLocaleDateString()}`
            }
          ]
        }
      ]
    };
    
    return {
      success: true,
      data: {
        message: message,
        messageText: message.text,
        channel: channelInfo.channel,
        channelId: channelInfo.channelId,
        timestamp: new Date().toISOString(),
        messageType: 'task_update'
      },
      metadata: {
        executionTime: 320,
        tokenUsage: 110
      }
    };
  }
  
  /**
   * Giả lập gửi tin nhắn thông thường
   */
  private mockSendGeneralMessage(prompt: string): StepResult {
    // Xác định kênh và người nhận
    const channelInfo = this.getChannelInfo(prompt);
    
    // Trích xuất nội dung tin nhắn từ prompt
    const messageContent = this.extractMessageContent(prompt);
    
    // Tạo tin nhắn
    const message = {
      text: messageContent,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: messageContent
          }
        }
      ]
    };
    
    return {
      success: true,
      data: {
        message: message,
        messageText: message.text,
        channel: channelInfo.channel,
        channelId: channelInfo.channelId,
        timestamp: new Date().toISOString(),
        messageType: 'general'
      },
      metadata: {
        executionTime: 300,
        tokenUsage: 80
      }
    };
  }
  
  /**
   * Phương thức hỗ trợ lấy thông tin kênh từ prompt
   */
  private getChannelInfo(prompt: string): { channel: string, channelId: string } {
    if (prompt.toLowerCase().includes('channel')) {
      const channelMatch = prompt.match(/channel\s+#([a-zA-Z0-9_-]+)/i);
      if (channelMatch && channelMatch[1]) {
        return {
          channel: channelMatch[1],
          channelId: `C${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        };
      }
    }
    
    if (prompt.toLowerCase().includes('general')) {
      return {
        channel: 'general',
        channelId: 'C08JFTGTN2K'
      };
    }
    
    if (prompt.toLowerCase().includes('dev')) {
      return {
        channel: 'dev',
        channelId: 'C08JFTGTN2L'
      };
    }
    
    // Mặc định là channel general
    return {
      channel: 'general',
      channelId: 'C08JFTGTN2K'
    };
  }
  
  /**
   * Phương thức hỗ trợ trích xuất tên người dùng từ prompt
   */
  private extractUserName(prompt: string): string {
    // Mặc định là user123
    let userName = 'user123';
    
    // Tìm các pattern như "user X", "người dùng X", và các tên phổ biến
    if (prompt.match(/user\s+([a-zA-Z0-9_-]+)/i)) {
      userName = prompt.match(/user\s+([a-zA-Z0-9_-]+)/i)[1];
    } else if (prompt.match(/người dùng\s+([a-zA-Z0-9_-]+)/i)) {
      userName = prompt.match(/người dùng\s+([a-zA-Z0-9_-]+)/i)[1];
    } else if (prompt.toLowerCase().includes('phúc')) {
      userName = 'Phúc';
    } else if (prompt.toLowerCase().includes('hưng')) {
      userName = 'Hưng';
    } else if (prompt.toLowerCase().includes('đăng')) {
      userName = 'Đăng';
    }
    
    return userName;
  }
  
  /**
   * Phương thức hỗ trợ trích xuất số lượng task từ prompt
   */
  private extractTaskCount(prompt: string): number {
    // Tìm các số trong prompt
    const matches = prompt.match(/\d+\s+task/i);
    if (matches) {
      const count = parseInt(matches[0]);
      if (!isNaN(count)) {
        return count;
      }
    }
    
    // Mặc định là 2 task
    return 2;
  }
  
  /**
   * Phương thức hỗ trợ trích xuất nội dung tin nhắn từ prompt
   */
  private extractMessageContent(prompt: string): string {
    // Tìm các pattern như "với nội dung X", "message X"
    const contentMatch = prompt.match(/với nội dung[:\s]+["'](.+?)["']/i) || 
                        prompt.match(/message[:\s]+["'](.+?)["']/i) ||
                        prompt.match(/tin nhắn[:\s]+["'](.+?)["']/i);
    
    if (contentMatch && contentMatch[1]) {
      return contentMatch[1];
    }
    
    // Nếu không tìm thấy pattern cụ thể, sử dụng prompt làm nội dung
    return `Thông báo: ${prompt}`;
  }
  
  /**
   * Giả lập gửi tin nhắn
   */
  private mockSendMessage(prompt: string): StepResult {
    // Nếu là thông báo về việc cập nhật trạng thái task từ Jira
    if (prompt.toLowerCase().includes('cập nhật') && 
        (prompt.toLowerCase().includes('task') || prompt.toLowerCase().includes('công việc')) &&
        (prompt.toLowerCase().includes('hoàn thành') || prompt.toLowerCase().includes('done'))) {
      
      // Tìm mã task trong prompt (pattern XDEMO2-xxx)
      const taskMatches = prompt.match(/XDEMO2-\d+/g);
      const taskIds = taskMatches ? [...new Set(taskMatches)] : ['XDEMO2-1', 'XDEMO2-3']; // Lấy unique values
      
      return {
        success: true,
        data: {
          messageId: `slack-${Date.now()}`,
          channel: "general",
          timestamp: new Date().toISOString(),
          text: `✅ Đã cập nhật ${taskIds.length} task sang trạng thái Done: ${taskIds.join(', ')}`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "✅ Cập nhật task thành công"
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Đã cập nhật ${taskIds.length} task sang trạng thái *Done*:`
              }
            },
            ...taskIds.map(taskId => ({
              type: "section",
              text: {
                type: "mrkdwn",
                text: `• *${taskId}*: Đã hoàn thành`
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Xem chi tiết"
                },
                url: `https://example.com/jira/${taskId}`
              }
            })),
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `🤖 *DevAssist Bot* | ${new Date().toLocaleString('vi-VN')}`
                }
              ]
            }
          ]
        },
        metadata: {
          executionTime: 280,
          tokenUsage: 130
        }
      };
    }
    
    // Nếu là yêu cầu xác nhận về việc hoàn thành công việc
    if (prompt.toLowerCase().includes('hoàn thành công việc') || 
        prompt.toLowerCase().includes('xác nhận') || 
        prompt.toLowerCase().includes('cảm ơn')) {
      
      // Trích xuất nội dung tin nhắn từ prompt nếu có
      let messageContent = '';
      const matches = prompt.match(/'(.*?)'/);
      if (matches && matches.length > 1) {
        messageContent = matches[1];
      } else {
        messageContent = "Cảm ơn bạn đã thông báo. Vui lòng cung cấp thêm thông tin về công việc đã hoàn thành.";
      }
      
      return {
        success: true,
        data: {
          messageId: "slack-confirmation-123",
          channel: "direct-message",
          timestamp: new Date().toISOString(),
          text: messageContent,
          recipientId: "user123"
        },
        metadata: {
          executionTime: 280,
          tokenUsage: 130
        }
      };
    }
    
    // Nếu là thông báo về cập nhật báo cáo trong Confluence
    if (prompt.toLowerCase().includes('báo cáo') && prompt.toLowerCase().includes('confluence')) {
      return {
        success: true,
        data: {
          messageId: `slack-report-${Date.now()}`,
          channel: "reports",
          timestamp: new Date().toISOString(),
          text: "📝 Đã cập nhật báo cáo hàng ngày trên Confluence",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "📝 *Đã cập nhật báo cáo hàng ngày*"
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Báo cáo ngày ${new Date().toLocaleDateString('vi-VN')} đã được cập nhật trên Confluence với những task đã hoàn thành hôm nay.`
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*Xem báo cáo đầy đủ tại:*"
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Xem báo cáo"
                },
                url: "https://confluence.example.com/pages/CONF-456"
              }
            }
          ]
        },
        metadata: {
          executionTime: 280,
          tokenUsage: 130
        }
      };
    }
    
    // Nếu là thông báo về task DEV-123
    if (prompt.toLowerCase().includes('dev-123')) {
      return {
        success: true,
        data: {
          messageId: "slack-123",
          channel: "dev-team",
          timestamp: "2023-04-20T17:32:10Z",
          text: "✅ user123 đã hoàn thành task DEV-123: Implement login feature"
        },
        metadata: {
          executionTime: 280,
          tokenUsage: 130
        }
      };
    }
    
    // Response mặc định cho các trường hợp khác
    return {
      success: true,
      data: {
        messageId: '1621234567.123456',
        channel: 'C08JFTGTN2K',
        timestamp: new Date().toISOString(),
        message: {
          text: `Đã gửi thông báo: ${prompt.substring(0, 50)}...`
        }
      },
      metadata: {
        executionTime: 280,
        tokenUsage: 130
      }
    };
  }
  
  /**
   * Lấy các tin nhắn liên quan đến một task
   */
  private mockGetConversationForTask(prompt: string): StepResult {
    // Tìm mã task XDEMO2-xxx trong prompt
    const taskMatches = prompt.match(/XDEMO2-\d+/g);
    const taskIds = taskMatches ? [...new Set(taskMatches)] : [];
    
    // Nếu có tìm thấy task nào không
    if (taskIds.length > 0) {
      // Tạo tin nhắn cho mỗi task được đề cập
      const allMessages = taskIds.flatMap(taskId => {
        // Số id từ mã task
        const taskNumber = parseInt(taskId.split('-')[1]);
        
        // Tạo các tin nhắn liên quan đến task này
        return [
          {
            author: "user123",
            text: `Tôi bắt đầu làm task ${taskId}`,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            channel: "dev-team"
          },
          {
            author: "team_lead",
            text: `${taskId} cần được hoàn thành trước thứ 6 nhé`,
            timestamp: new Date(Date.now() - 72000000).toISOString(),
            channel: "dev-team"
          },
          {
            author: "user123",
            text: `Đã hoàn thành task ${taskId}, PR: https://github.com/example/PR-${taskNumber}`,
            timestamp: new Date(Date.now() - 28800000).toISOString(),
            channel: "dev-team"
          },
          {
            author: "reviewer",
            text: `Đã approve PR của task ${taskId}`,
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            channel: "dev-team"
          }
        ];
      });
      
      return {
        success: true,
        data: {
          messages: allMessages,
          channel: "dev-team",
          taskIds,
          total: allMessages.length
        },
        metadata: {
          executionTime: 380 + taskIds.length * 50,
          tokenUsage: 160 + taskIds.length * 40
        }
      };
    }
    
    // Nếu prompt đề cập đến DEV-123
    if (prompt.toLowerCase().includes('dev-123')) {
      return {
        success: true,
        data: {
          messages: [
            {
              author: "user123",
              text: "Đang gặp khó khăn với việc xử lý refresh token",
              timestamp: "2023-04-20T09:30:00Z",
              channel: "dev-team"
            },
            {
              author: "team_lead",
              text: "Thử cách này xem: https://auth0.com/docs/tokens/refresh-tokens",
              timestamp: "2023-04-20T10:15:00Z",
              channel: "dev-team"
            },
            {
              author: "user123",
              text: "Đã giải quyết được vấn đề và implement xong phần login flow",
              timestamp: "2023-04-20T14:20:00Z",
              channel: "dev-team"
            }
          ],
          channel: "dev-team",
          taskId: "DEV-123"
        },
        metadata: {
          executionTime: 380,
          tokenUsage: 160
        }
      };
    }

    // Fallback cho trường hợp tìm kiếm về việc hoàn thành công việc
    if (prompt.toLowerCase().includes('hoàn thành') || 
        prompt.toLowerCase().includes('xong việc') ||
        prompt.toLowerCase().includes('done')) {
      return {
        success: true,
        data: {
          messages: [
            { 
              text: 'Tôi đã hoàn thành các task XDEMO2-1, XDEMO2-3 và XDEMO2-5 hôm nay', 
              user: 'user123', 
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              channel: "status-updates"
            },
            { 
              text: 'Great job! Cần cập nhật JIRA để team biết', 
              user: 'manager', 
              timestamp: new Date(Date.now() - 3500000).toISOString(),
              channel: "status-updates" 
            },
            { 
              text: 'Đã update JIRA status rồi. Đã set các task sang Done.', 
              user: 'user123', 
              timestamp: new Date(Date.now() - 3400000).toISOString(),
              channel: "status-updates"
            }
          ],
          channel: "status-updates",
          query: "hoàn thành công việc",
          total: 3
        },
        metadata: {
          executionTime: 310,
          tokenUsage: 160
        }
      };
    }

    // Fallback cho các trường hợp khác
    return {
      success: true,
      data: {
        messages: [
          { text: 'Tôi đang làm task này', user: 'U12345', timestamp: '2023-04-19T10:30:00Z', channel: "general" },
          { text: 'Cần trợ giúp về phần ABC', user: 'U12345', timestamp: '2023-04-19T11:45:00Z', channel: "general" },
          { text: 'Đã giải quyết được vấn đề', user: 'U12345', timestamp: '2023-04-19T15:20:00Z', channel: "general" }
        ],
        channel: "general",
        total: 3,
        query: prompt.substring(0, 50)
      },
      metadata: {
        executionTime: 310,
        tokenUsage: 160
      }
    };
  }
  
  /**
   * Giả lập gửi tin nhắn đề xuất thời gian cho cuộc họp
   */
  private mockSendMeetingTimeProposal(prompt: string): StepResult {
    // Xác định người nhận
    let recipients: string[] = [];
    if (prompt.toLowerCase().includes('user123')) {
      recipients.push('user123');
    }
    if (prompt.toLowerCase().includes('phúc')) {
      recipients.push('phúc');
    }
    if (prompt.toLowerCase().includes('hưng')) {
      recipients.push('hưng');
    }
    
    // Mặc định nếu không tìm thấy người nhận cụ thể
    if (recipients.length === 0) {
      recipients = ['user123'];
    }
    
    // Tạo giả lập các khoảng thời gian đề xuất
    const timeSlots = [
      { day: 'Thứ Ba', date: '2025-04-22', time: '10:00 - 11:00', location: 'Phòng họp A' },
      { day: 'Thứ Tư', date: '2025-04-23', time: '14:00 - 15:00', location: 'Phòng họp B' },
      { day: 'Thứ Năm', date: '2025-04-24', time: '09:00 - 10:00', location: 'Phòng họp A' }
    ];
    
    // Tạo tin nhắn với các khối tương tác
    const message = {
      text: `*Đề xuất thời gian cho cuộc họp*\n\nDưới đây là các khoảng thời gian mà tất cả người tham gia (${recipients.join(', ')}) đều rảnh:`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Đề xuất thời gian cho cuộc họp',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Dưới đây là các khoảng thời gian mà tất cả người tham gia (${recipients.join(', ')}) đều rảnh:`
          }
        },
        {
          type: 'divider'
        },
        ...timeSlots.map(slot => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${slot.day} (${slot.date})*\n${slot.time}\nĐịa điểm: ${slot.location}`
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Chọn',
              emoji: true
            },
            value: `${slot.date}_${slot.time}`
          }
        })),
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Vui lòng chọn một khoảng thời gian phù hợp hoặc đề xuất thời gian khác'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Đề xuất thời gian khác',
                emoji: true
              },
              value: 'propose_different_time'
            }
          ]
        }
      ]
    };
    
    // Tạo thông tin kênh và người nhận
    const channelInfo = this.getChannelInfo(prompt);
    
    return {
      success: true,
      data: {
        message: message,
        messageText: message.text,
        channel: channelInfo.channel,
        channelId: channelInfo.channelId,
        recipients: recipients,
        timestamp: new Date().toISOString(),
        meetingProposal: {
          timeSlots: timeSlots,
          attendees: recipients,
          notes: "Cuộc họp với " + recipients.join(", ")
        },
        messageType: 'meeting_proposal'
      },
      metadata: {
        executionTime: 350,
        tokenUsage: 120
      }
    };
  }
  
  /**
   * Giả lập gửi tin nhắn hỏi về việc điều chỉnh lịch của Minh
   */
  private mockSendScheduleAdjustmentInquiry(prompt: string): StepResult {
    // Kiểm tra xem prompt có muốn hỏi ý kiến team hay hỏi trực tiếp Minh
    const isTeamInquiry = prompt.toLowerCase().includes('team') || 
                         prompt.toLowerCase().includes('mọi người') || 
                         prompt.toLowerCase().includes('họp thiếu');
    
    if (isTeamInquiry) {
      // Tạo tin nhắn hỏi ý kiến team về việc họp thiếu Minh
      const message = {
        text: "Hỏi ý kiến về cuộc họp tính năng xác thực mới",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Đề xuất cuộc họp về tính năng xác thực mới",
              emoji: true
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Chúng ta cần tổ chức cuộc họp về tính năng xác thực mới nhưng *Minh không có lịch trống* trong tuần này."
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Có các khung giờ sau phù hợp cho @Phúc, @Hưng và @Đăng:\n• *Thứ Ba (22/04)* 9:00 - 10:30\n• *Thứ Tư (23/04)* 14:00 - 15:30"
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Họp không có Minh",
                  emoji: true
                },
                value: "proceed_without_minh",
                style: "primary"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Tìm thời gian khác",
                  emoji: true
                },
                value: "find_alternative_time"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Hỏi Minh có thể điều chỉnh",
                  emoji: true
                },
                value: "ask_minh"
              }
            ]
          }
        ]
      };
      
      return {
        success: true,
        data: {
          message: message,
          channel: "dev-team",
          channelId: "C08JFTGTN2K",
          messageId: `schedule-inquiry-${Date.now()}`,
          timestamp: new Date().toISOString(),
          recipients: ["Phúc", "Hưng", "Đăng"],
          thread: null,
          messageType: "schedule_adjustment_inquiry_team"
        },
        metadata: {
          executionTime: 350,
          tokenUsage: 150
        }
      };
    } else {
      // Tạo tin nhắn trực tiếp hỏi Minh có thể điều chỉnh lịch không
      const message = {
        text: "Hỏi về khả năng điều chỉnh lịch cho cuộc họp tính năng xác thực mới",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Chào Minh, team cần tổ chức cuộc họp về tính năng xác thực mới trong tuần này. Tuy nhiên, có vẻ lịch của bạn đã kín."
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Bạn có thể điều chỉnh lịch để tham gia vào một trong các khung giờ sau không?\n• *Thứ Ba (22/04)* 9:00 - 10:30\n• *Thứ Tư (23/04)* 14:00 - 15:30"
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Thứ Ba được",
                  emoji: true
                },
                value: "tuesday_available",
                style: "primary"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Thứ Tư được",
                  emoji: true
                },
                value: "wednesday_available",
                style: "primary"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Không thể tham gia",
                  emoji: true
                },
                value: "cannot_attend"
              }
            ]
          }
        ]
      };
      
      return {
        success: true,
        data: {
          message: message,
          channel: "direct-message",
          channelId: "D08ABCDEFG",
          messageId: `direct-msg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          recipient: "Minh",
          thread: null,
          messageType: "schedule_adjustment_inquiry_direct"
        },
        metadata: {
          executionTime: 330,
          tokenUsage: 140
        }
      };
    }
  }
} 