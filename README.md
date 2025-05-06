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

## Hướng dẫn cài đặt

### Yêu cầu hệ thống

- Node.js 16+
- npm hoặc yarn
- Git
- SQLite (dev) hoặc PostgreSQL (prod)
- Tài khoản OpenAI API

### Cài đặt chi tiết

1. **Clone repository**:
```bash
git clone https://github.com/phuc-nt/auto-workflow-agent.git
cd auto-workflow-agent
```

2. **Cài đặt dependencies**:
```bash
npm install
```

3. **Tạo file .env từ mẫu**:
```bash
cp .env.example .env
```

4. **Build dự án**:
```bash
npm run build
```

### Gỡ lỗi cài đặt thường gặp

- **Lỗi PORT đã được sử dụng**: Thay đổi cổng trong file .env hoặc kiểm tra các tiến trình đang chạy:
  ```bash
  lsof -i :3001  # Kiểm tra tiến trình đang sử dụng cổng 3001
  ```

## Hướng dẫn cấu hình

### Cấu hình cơ bản (.env)

```
# Cấu hình cơ bản
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=dev-assist

# OpenAI
OPENAI_API_KEY=syour_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
```

### Cấu hình nâng cao

#### Project Config (src/config/project_config_demo.json)

File cấu hình chứa thông tin về dự án, thành viên, và các công cụ được tích hợp:

```json
{
  "project": {
    "name": "Project X",
    "key": "XDEMO",
    "members": [
      {
        "id": "user123",
        "name": "Nguyễn Văn A",
        "email": "a@example.com",
        "slack": "U123456"
      }
    ]
  }
}
```

#### Cấu hình LLM (src/config/llm.config.ts)

Tùy chỉnh mô hình và prompt template:

```typescript
/**
 * Cấu hình mặc định cho LLM
 */
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  model: 'gpt-4.1-mini', // Default model
  temperature: 0.7, // Default temperature
};

/**
 * Cấu hình prompt cho từng thành phần
 */
export const PROMPT_CONFIGS: Record<string, PromptConfig> = {
  inputProcessor: {
    systemPrompt: `
Bạn là một AI assistant được thiết kế để phân tích yêu cầu người dùng và chuyển thành mô tả chi tiết.

Với mỗi yêu cầu, hãy:
1. Phân tích ý định chính
2. Xác định các thông tin quan trọng (user, project, time, etc.)
3. Mô tả chi tiết những gì người dùng muốn thực hiện
...`,
    examples: [
      // Ví dụ về input/output
    ]
  },
  actionPlanner: {
    systemPrompt: `...` 
  },
  // ... các cấu hình khác
};
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

- Kiến trúc tổng quan: [`docs/knowledge/ai_agent_development_guide_part1.md`](docs/knowledge/ai_agent_development_guide_part1.md)
- Chi tiết Central Agent: [`docs/knowledge/ai_agent_development_guide_part2.md`](docs/knowledge/ai_agent_development_guide_part2.md)
- Kế hoạch triển khai: [`docs/implementation/implementation_plan.md`](docs/implementation/implementation_plan.md)
- Kịch bản kiểm thử: [`docs/testing/central_agent_complex_scenarios.md`](docs/testing/central_agent_complex_scenarios.md)
- Tham khảo API: [`docs/dev-guide/tool_api_reference/`](docs/dev-guide/tool_api_reference/)
- Prompts: [`docs/dev-guide/prompts/central_agent_prompts.md`](docs/dev-guide/prompts/central_agent_prompts.md)

## License

[MIT Licensed](LICENSE)
