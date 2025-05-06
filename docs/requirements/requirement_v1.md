# YÊU CẦU: AUTO WORKFLOW AGENT

## 1. Tổng quan

Auto Workflow Agent là hệ thống AI Agent thông minh tự động hóa các quy trình làm việc dựa trên kiến trúc Central-Sub Agent. Mục tiêu chính là giúp người dùng tự động hóa các tác vụ hành chính và quản lý dự án thông qua các lệnh bằng ngôn ngữ tự nhiên.

## 2. Kiến trúc Central-Sub Agent

### 2.1 Kiến trúc tổng quan

```
┌─────────────┐      ┌───────────────────────────────────────┐
│             │      │ Central Agent                         │
│  Web UI/API ├──────┤ ┌─────────────┐ ┌─────────────────┐  │
│             │      │ │ Input       │ │ Action Planner  │  │
└─────────────┘      │ │ Processor   │ │                 │  │
                     │ └─────────────┘ └─────────────────┘  │
                     │ ┌─────────────┐ ┌─────────────────┐  │
                     │ │ Agent       │ │ Result          │  │
                     │ │ Coordinator │ │ Synthesizer     │  │
                     │ └──────┬──────┘ └─────────────────┘  │
                     └────────┼──────────────────────────────┘
                              │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼─────┐    ┌──────▼─────┐    ┌──────▼─────┐
    │ JIRA Agent │    │ Slack Agent│    │ Other Agent│
    └────────────┘    └────────────┘    └────────────┘
```

### 2.2 Thành phần chính

1. **Central Agent**: Điều phối toàn bộ luồng xử lý
   - **Input Processor**: Phân tích yêu cầu người dùng (LLM-powered)
   - **Action Planner**: Lập kế hoạch hành động (LLM-powered)
   - **Agent Coordinator**: Điều phối các Sub-Agent thực hiện kế hoạch
   - **Result Synthesizer**: Tổng hợp kết quả (LLM-powered)

2. **Sub-Agents**: Các agent chuyên biệt thực hiện tác vụ cụ thể
   - **JIRA Agent**: Quản lý task, issue, dự án
   - **Slack Agent**: Gửi thông báo, tìm kiếm tin nhắn
   - **Calendar Agent**: Lên lịch và quản lý cuộc họp
   - **Confluence Agent**: Tạo và quản lý tài liệu
   - **Email Agent**: Gửi và phản hồi email

## 3. Kịch bản sử dụng chính

1. **Quản lý công việc hàng ngày**
   - Kết thúc ngày làm việc: Cập nhật trạng thái task, ghi nhận thời gian, thông báo cho team
   - Báo cáo tiến độ: Tổng hợp các task đã hoàn thành, đang làm, và sắp đến hạn

2. **Lập kế hoạch và lịch trình**
   - Sắp xếp cuộc họp: Tìm thời gian phù hợp và lên lịch cuộc họp
   - Tạo sprint mới: Tạo sprint trên JIRA và thông báo trên Slack

3. **Quản lý tài liệu**
   - Tạo báo cáo: Tổng hợp thông tin từ JIRA và tạo báo cáo trên Confluence
   - Cập nhật tài liệu: Thêm thông tin mới vào tài liệu hiện có

## 4. Yêu cầu kỹ thuật

### 4.1 Backend
- NestJS framework (TypeScript)
- OpenAI API (GPT-4, GPT-4 mini) cho các thành phần LLM-powered
- SQLite (dev) / PostgreSQL (prod) cho lưu trữ dữ liệu

### 4.2 Tích hợp
- JIRA API: REST API với xác thực OAuth/API token
- Slack API: Webhooks và Slack API
- Calendar: Google Calendar/Microsoft Calendar API
- Email: SMTP/IMAP hoặc API của dịch vụ email

### 4.3 Phi chức năng
- **Quản lý chi phí**: Theo dõi và tối ưu sử dụng token LLM
- **Bảo mật**: Mã hóa dữ liệu, xác thực người dùng, quản lý quyền truy cập
- **Mở rộng**: Kiến trúc plugin cho phép thêm Sub-Agent mới dễ dàng

## 5. Mốc phát triển

1. **Alpha** (2 tuần): Central Agent cơ bản, JIRA Agent và Slack Agent mock
2. **Beta** (4 tuần): Tích hợp thực tế với JIRA và Slack, cải thiện độ chính xác
3. **1.0** (8 tuần): Bổ sung Calendar Agent, Email Agent, và giao diện người dùng hoàn chỉnh
