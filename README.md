# Auto Workflow Agent - Central-Sub Agent Architecture

Hệ thống AI Agent tự động hóa quy trình làm việc dựa trên kiến trúc Central-Sub Agent, được xây dựng trên nền tảng NestJS.

## Giới thiệu dự án

Auto Workflow Agent là hệ thống AI Agent thông minh có khả năng tự động hóa các quy trình làm việc phức tạp. Hệ thống sử dụng kiến trúc Central-Sub Agent, trong đó Central Agent điều phối nhiều Sub-Agent chuyên biệt (JIRA, Slack, Calendar, Confluence, v.v.) để hoàn thành các tác vụ như quản lý công việc, lên lịch họp, và tạo báo cáo.

### Kiến trúc tổng quan

Hệ thống bao gồm các thành phần chính:

- **Central Agent**: Điều phối toàn bộ luồng xử lý
  - **Input Processor**: Phân tích yêu cầu người dùng (LLM-powered)
  - **Action Planner**: Lập kế hoạch hành động (LLM-powered)
  - **Agent Coordinator**: Điều phối các Sub-Agent thực hiện kế hoạch
  - **Result Synthesizer**: Tổng hợp kết quả (LLM-powered)
  - **Project Config Reader**: Đọc thông tin dự án, thành viên

- **Sub-Agents**: Các agent chuyên biệt thực hiện tác vụ cụ thể
  - JIRA Agent
  - Slack Agent
  - Calendar Agent
  - Confluence Agent
  - Email Agent

### Công nghệ sử dụng

- **Backend**: NestJS (TypeScript)
- **Database**: SQLite (phát triển), PostgreSQL (sản xuất)
- **LLM Integration**: OpenAI API (GPT-4, GPT-4 mini)
- **API Documentation**: Swagger

## Cài đặt và chạy

### Yêu cầu hệ thống

- Node.js 16+
- npm hoặc yarn
- Tài khoản OpenAI API

### Cài đặt và cấu hình

1. Clone repository:
```bash
git clone https://github.com/yourusername/auto-workflow-agent.git
cd auto-workflow-agent
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env từ mẫu:
```bash
cp .env.example .env
```

4. Cấu hình các biến môi trường trong .env:
```
OPENAI_API_KEY=your_api_key
PORT=3001
```

### Chạy ứng dụng

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Kiểm thử

### Kịch bản kiểm thử

Dự án bao gồm nhiều kịch bản kiểm thử phức tạp để đánh giá khả năng của hệ thống:

1. **Kết thúc ngày làm việc**: Agent tự động tìm các task đang làm, cập nhật trạng thái, và thông báo cho team.
   ```bash
   curl -X POST "http://localhost:3001/central-agent/process" \
     -H "Content-Type: application/json" \
     -d '{"message": "tôi xong việc hôm nay rồi", "userId": "user123"}' --max-time 300
   ```

2. **Sắp xếp lịch họp**: Agent tìm khung giờ phù hợp và tạo cuộc họp mới.
   ```bash
   curl -X POST "http://localhost:3001/central-agent/process" \
     -H "Content-Type: application/json" \
     -d '{"message": "sắp xếp cuộc họp với Phúc, Đăng và Hưng để kickoff dự án X", "userId": "user123"}' | jq
   ```

Xem thêm kịch bản kiểm thử tại: `docs/testing/central_agent_test`

### Unit Tests

```bash
npm run test
```

## Tài liệu

Xem thêm tài liệu chi tiết:

- Kiến trúc tổng quan: `docs/presentations/ai_agent_development_guide_part1.md`
- Chi tiết Central Agent: `docs/presentations/ai_agent_development_guide_part2.md`
- Kế hoạch triển khai: `docs/implementation/central_agent/implementation_plan.md`
- Kịch bản kiểm thử: `docs/testing/central_agent_test/central_agent_complex_scenarios.md`

## License

[MIT Licensed](LICENSE)
