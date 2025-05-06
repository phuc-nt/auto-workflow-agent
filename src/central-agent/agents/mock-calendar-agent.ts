import { Injectable } from '@nestjs/common';
import { EnhancedLogger } from '../../utils/logger';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MockCalendarAgent implements IAgent {
  private readonly logger = EnhancedLogger.getLogger('MockCalendarAgent');
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
  
  async executePrompt(prompt: string): Promise<StepResult> {
    this.logger.log(`MockCalendarAgent executing: ${prompt}`);
    
    // Giả lập độ trễ
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Xử lý dựa trên prompt
    if (prompt.toLowerCase().includes('tìm') && prompt.toLowerCase().includes('thời gian')) {
      return this.findAvailableTime(prompt);
    }
    
    if (prompt.toLowerCase().includes('đặt') || prompt.toLowerCase().includes('tạo cuộc họp')) {
      return this.createMeeting(prompt);
    }
    
    if (prompt.toLowerCase().includes('lịch') && prompt.toLowerCase().includes('kiểm tra')) {
      return this.checkSchedule(prompt);
    }
    
    // Fallback response
    return {
      success: true,
      data: {
        message: `Calendar: ${prompt}`,
        result: "Đã xử lý yêu cầu liên quan đến lịch"
      },
      metadata: {
        executionTime: 500,
        tokenUsage: 180
      }
    };
  }
  
  /**
   * Tìm thời gian rảnh cho cuộc họp
   */
  private findAvailableTime(prompt: string): StepResult {
    // Lấy danh sách người tham gia từ prompt (nếu có)
    const participants = this.extractParticipants(prompt);
    
    // Kiểm tra xem Minh có trong danh sách người tham gia không
    const minhIncluded = participants.includes("Minh");
    
    // Danh sách khung giờ trống trong tuần này
    let availableTimeSlots = [];
    
    if (minhIncluded) {
      // Nếu Minh tham gia, không có khung giờ nào phù hợp cho tất cả
      availableTimeSlots = [];
      
      // Trả về kết quả thất bại
      return {
        success: false,
        error: {
          code: 'NO_COMMON_TIME',
          message: 'Không tìm thấy khung giờ chung phù hợp cho tất cả thành viên',
          details: 'Thành viên Minh không có khung giờ trống nào trong tuần này'
        },
      data: {
          participants: participants,
          unavailableMembers: [{
            name: "Minh",
            reason: "Lịch đã kín trong toàn bộ tuần này"
          }],
          partialAvailableSlots: [
            {
              startTime: "2025-04-22T09:00:00Z", // Thứ Ba, 9:00 AM
              endTime: "2025-04-22T10:30:00Z",   // Thứ Ba, 10:30 AM
              participants: ["Phúc", "Hưng", "Đăng"],
              availableRooms: ["Mercury", "Venus"]
            },
            {
              startTime: "2025-04-23T14:00:00Z", // Thứ Tư, 2:00 PM
              endTime: "2025-04-23T15:30:00Z",   // Thứ Tư, 3:30 PM
              participants: ["Phúc", "Hưng", "Đăng"],
              availableRooms: ["Mars", "Jupiter"]
            }
          ],
          message: "Không tìm thấy khung giờ phù hợp cho tất cả thành viên"
      },
      metadata: {
          executionTime: 650,
          tokenUsage: 220
        }
      };
    } else {
      // Nếu Minh không tham gia, có các khung giờ phù hợp
      availableTimeSlots = [
        {
          startTime: "2025-04-22T09:00:00Z", // Thứ Ba, 9:00 AM
          endTime: "2025-04-22T10:30:00Z",   // Thứ Ba, 10:30 AM
          participants: ["Phúc", "Hưng", "Đăng"],
          availableRooms: ["Mercury", "Venus"]
        },
        {
          startTime: "2025-04-23T14:00:00Z", // Thứ Tư, 2:00 PM
          endTime: "2025-04-23T15:30:00Z",   // Thứ Tư, 3:30 PM
          participants: ["Phúc", "Hưng", "Đăng"],
          availableRooms: ["Mars", "Jupiter"]
        },
        {
          startTime: "2025-04-24T10:00:00Z", // Thứ Năm, 10:00 AM
          endTime: "2025-04-24T11:30:00Z",   // Thứ Năm, 11:30 AM
          participants: ["Phúc", "Hưng", "Đăng"],
          availableRooms: ["Saturn", "Venus"]
        },
        {
          startTime: "2025-04-25T15:00:00Z", // Thứ Sáu, 3:00 PM
          endTime: "2025-04-25T16:30:00Z",   // Thứ Sáu, 4:30 PM
          participants: ["Phúc", "Hưng", "Đăng"],
          availableRooms: ["Mercury", "Mars"]
        }
      ];
    
    return {
      success: true,
      data: {
          availableTimeSlots,
          recommendedSlot: availableTimeSlots[0], // Mặc định khuyến nghị slot đầu tiên
          participants: participants,
          message: `Đã tìm thấy ${availableTimeSlots.length} khung giờ phù hợp trong tuần này`
      },
      metadata: {
          executionTime: 650,
          tokenUsage: 220
        }
      };
    }
  }
  
  /**
   * Tạo cuộc họp mới
   */
  private createMeeting(prompt: string): StepResult {
    // Tạo ID ngẫu nhiên cho cuộc họp
    const meetingId = `meeting-${Math.floor(Math.random() * 10000)}`;
    
    // Lấy danh sách người tham gia
    const participants = this.extractParticipants(prompt);
    
    // Xác định thời gian cuộc họp
    let startTime, endTime;
    
    if (prompt.includes("thứ ba") || prompt.includes("thứ 3")) {
      startTime = "2025-04-22T09:00:00Z";
      endTime = "2025-04-22T10:30:00Z";
    } else if (prompt.includes("thứ tư") || prompt.includes("thứ 4")) {
      startTime = "2025-04-23T14:00:00Z";
      endTime = "2025-04-23T15:30:00Z";
    } else if (prompt.includes("thứ năm") || prompt.includes("thứ 5")) {
      startTime = "2025-04-24T10:00:00Z";
      endTime = "2025-04-24T11:30:00Z";
    } else if (prompt.includes("thứ sáu") || prompt.includes("thứ 6")) {
      startTime = "2025-04-25T15:00:00Z";
      endTime = "2025-04-25T16:30:00Z";
    } else {
      // Mặc định là ngày mai
      startTime = "2025-04-22T09:00:00Z";
      endTime = "2025-04-22T10:30:00Z";
    }
    
    // Xác định phòng họp
    const meetingRoom = prompt.includes("Mars") ? "Mars" : 
                       prompt.includes("Venus") ? "Venus" : 
                       prompt.includes("Mercury") ? "Mercury" : "Mercury";
    
    return {
      success: true,
      data: {
        meetingId,
        title: "Họp về tính năng mới",
        description: "Thảo luận về tính năng xác thực mới cho dự án XDEMO2",
        startTime,
        endTime,
        location: meetingRoom,
        participants,
        organizer: "Phúc",
        meetingLink: "https://meet.google.com/abc-defg-hij",
        calendar: "Team Dev",
        message: `Đã tạo cuộc họp ${meetingId} vào ${new Date(startTime).toLocaleString()} tại ${meetingRoom}`
      },
      metadata: {
        executionTime: 720,
        tokenUsage: 240
      }
    };
  }
  
  /**
   * Kiểm tra lịch của người dùng
   */
  private checkSchedule(prompt: string): StepResult {
    // Lấy người dùng từ prompt (nếu có)
    const participants = this.extractParticipants(prompt);
    const user = participants.length > 0 ? participants[0] : "Phúc";
    
    // Danh sách sự kiện trong lịch
    const events = [
      {
        id: "event1",
        title: "Daily Standup",
        startTime: "2025-04-21T09:00:00Z",
        endTime: "2025-04-21T09:30:00Z",
        participants: ["Phúc", "Hưng", "Đăng", "Minh"],
        location: "Mercury"
      },
      {
        id: "event2",
        title: "Sprint Planning",
        startTime: "2025-04-22T14:00:00Z",
        endTime: "2025-04-22T16:00:00Z",
        participants: ["Phúc", "Hưng", "Đăng"],
        location: "Mars"
      },
      {
        id: "event3",
        title: "1-1 với PM",
        startTime: "2025-04-23T10:00:00Z",
        endTime: "2025-04-23T11:00:00Z",
        participants: ["Phúc"],
        location: "Venus"
      },
      {
        id: "event4",
        title: "Demo với khách hàng",
        startTime: "2025-04-24T15:00:00Z",
        endTime: "2025-04-24T16:30:00Z",
        participants: ["Phúc", "Hưng", "Đăng", "Minh"],
        location: "Jupiter"
      }
    ];
    
    // Lọc các sự kiện của người dùng
    const userEvents = events.filter(event => 
      event.participants.includes(user)
    );
    
    return {
      success: true,
      data: {
        user,
        events: userEvents,
        busyTimeSlots: userEvents.map(event => ({
          startTime: event.startTime,
          endTime: event.endTime,
          title: event.title
        })),
        message: `Đã tìm thấy ${userEvents.length} sự kiện trong lịch của ${user} trong tuần này`
      },
      metadata: {
        executionTime: 580,
        tokenUsage: 210
      }
    };
  }
  
  /**
   * Trích xuất danh sách người tham gia từ prompt
   */
  private extractParticipants(prompt: string): string[] {
    const defaultTeam = ["Phúc", "Hưng", "Đăng", "Minh"];
    const participants = [];
    
    // Chỉ trích xuất các thành viên được đề cập cụ thể trong prompt
    if (prompt.includes("Phúc")) participants.push("Phúc");
    if (prompt.includes("Hưng")) participants.push("Hưng");
    if (prompt.includes("Đăng")) participants.push("Đăng");
    if (prompt.includes("Minh")) participants.push("Minh");
    
    // Nếu prompt nhắc đến "team phát triển" hoặc "toàn bộ team" mà không liệt kê cụ thể thành viên
    // thì mới sử dụng toàn bộ team mặc định
    if (participants.length === 0 && (
        prompt.toLowerCase().includes("team phát triển") || 
        prompt.toLowerCase().includes("toàn bộ team") ||
        prompt.toLowerCase().includes("tất cả thành viên"))) {
      return defaultTeam;
    }
    
    return participants.length > 0 ? participants : defaultTeam;
  }
} 