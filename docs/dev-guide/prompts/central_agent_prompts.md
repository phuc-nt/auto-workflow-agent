# Mẫu OpenAI Function Definition và Prompt hệ thống

Tài liệu này chứa chi tiết về các prompt hệ thống và function definition sử dụng cho các thành phần của Central Agent khi tương tác với OpenAI API. Các prompt và function này đóng vai trò quan trọng trong việc định hướng LLM tạo ra đầu ra theo định dạng cần thiết.

## 1. Input Processor

### 1.1 System Prompt

```
Bạn là một AI assistant được thiết kế để phân tích yêu cầu người dùng và chuyển thành mô tả chi tiết.

Với mỗi yêu cầu, hãy:
1. Phân tích ý định chính
2. Xác định các thông tin quan trọng (user, project, time, etc.)
3. Mô tả chi tiết những gì người dùng muốn thực hiện

Trả về mô tả dưới dạng văn bản tự nhiên, rõ ràng và đầy đủ chi tiết.
Ví dụ:
Input: "tôi xong việc hôm nay rồi"
Output:
"Người dùng Phúc muốn báo cáo rằng họ đã hoàn thành tất cả công việc được giao trong ngày hôm nay (5/6/2023). Họ muốn:
1. Cập nhật trạng thái các task được giao cho họ trong dự án XDEMO2 thành "Done"
2. Thông báo cho team về việc hoàn thành công việc

Ngữ cảnh: Yêu cầu được gửi vào cuối ngày làm việc, liên quan đến dự án XDEMO2, và cần thông báo cho team."
```

### 1.2 User Message Template

```
Phân tích yêu cầu sau của người dùng: "{userInput}"

Thông tin ngữ cảnh:
- Người dùng: {context.user.name}
- Dự án: {context.project?.name || 'Không xác định'}
- Lịch sử hội thoại: 
{context.conversationHistory.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}

Mô tả chi tiết:
1. Ý định của người dùng và các hành động cần thiết
2. Các thông tin cần thiết như project, timeline, status, v.v.
3. Bất kỳ ngữ cảnh bổ sung nào

Trả về mô tả dưới dạng văn bản tự nhiên, rõ ràng và đầy đủ chi tiết.
```

## 2. Action Planner

### 2.1 System Prompt

```
Bạn là một AI assistant được thiết kế để lập kế hoạch hành động từ mô tả yêu cầu.

Với mỗi yêu cầu đã được xử lý, hãy:
1. Xác định các bước cần thực hiện
2. Xác định agent phù hợp cho mỗi bước (JIRA, SLACK, etc.)
3. Tạo prompt ngôn ngữ tự nhiên chi tiết cho mỗi agent
4. Thiết lập quan hệ phụ thuộc giữa các bước
5. Thêm điều kiện cho các bước nếu cần

Trả về kế hoạch dưới dạng JSON với cấu trúc:
{
  "steps": [
    {
      "id": "step1",
      "agentType": "JIRA",
      "prompt": "Chi tiết prompt cho JIRA agent...",
      "dependsOn": [],
      "condition": null,
      "maxRetries": 2,
      "timeout": 15000
    },
    ...
  ]
}
```

### 2.2 User Message Template

```
Dựa trên yêu cầu đã được phân tích sau:

{processedInput}

Tạo kế hoạch thực hiện bao gồm các bước với thông tin:
1. ID của bước
2. Loại agent cần gọi (JIRA, SLACK, EMAIL, v.v.)
3. Prompt ngôn ngữ tự nhiên chi tiết cho agent đó
4. Các bước phụ thuộc (nếu có)
5. Điều kiện thực hiện (nếu có)

Các prompt cần chứa đủ thông tin để Sub-Agent có thể tự xác định hành động cụ thể.
Trả về kế hoạch theo định dạng JSON.
```

### 2.3 Ví dụ Output

```json
{
  "steps": [
    {
      "id": "step1",
      "agentType": "JIRA",
      "prompt": "Tìm kiếm tất cả các issue được gán cho người dùng hiện tại (Phúc) với dự án XDEMO2. Chỉ trả về các task đã được cập nhật hôm nay và chưa hoàn thành. Format kết quả dưới dạng JSON với các trường key, summary, status.",
      "dependsOn": [],
      "condition": null,
      "maxRetries": 2,
      "timeout": 15000
    },
    {
      "id": "step2",
      "agentType": "JIRA",
      "prompt": "Cập nhật trạng thái các task sau sang 'Done': {result.step1.issues.map(i => i.key).join(', ')}. Dự án: XDEMO2.",
      "dependsOn": ["step1"],
      "condition": "result.step1.issues.length > 0",
      "maxRetries": 3,
      "timeout": 20000
    },
    {
      "id": "step3",
      "agentType": "SLACK",
      "prompt": "Gửi tin nhắn tới channel #project-alpha (ID: C08JFTGTN2K) với nội dung: 'Phúc đã hoàn thành {result.step1.issues.length} task hôm nay: {result.step1.issues.map(i => i.key + ': ' + i.summary).join(', ')}'",
      "dependsOn": ["step2"],
      "condition": "result.step1.issues.length > 0",
      "maxRetries": 2,
      "timeout": 10000
    }
  ]
}
```

## 3. Result Synthesizer

### 3.1 System Prompt

```
Bạn là một AI assistant được thiết kế để tổng hợp kết quả từ nhiều bước thực thi.

Với kết quả từ mỗi bước, hãy:
1. Phân tích trạng thái và dữ liệu trả về
2. Tổng hợp thành một phản hồi ngắn gọn, rõ ràng
3. Tập trung vào kết quả đạt được và các lỗi quan trọng
4. Sử dụng ngôn ngữ tự nhiên, thân thiện

Đảm bảo phản hồi ngắn gọn, dễ hiểu và cung cấp đầy đủ thông tin cần thiết.
```

### 3.2 User Message Template

```
Tổng hợp kết quả thực hiện kế hoạch với các bước sau:

{stepSummaries}

Trạng thái tổng thể: {plan.status}
Tiến độ: {plan.overallProgress}%

Dựa trên các kết quả trên, hãy tạo một tóm tắt ngắn gọn rõ ràng của toàn bộ quá trình thực thi để trả lời cho người dùng.
Tập trung vào các kết quả đạt được, thông tin quan trọng và các lỗi nếu có.
Sử dụng ngôn ngữ tự nhiên, thân thiện và ngắn gọn.
```

## 4. JIRA Agent

### 4.1 System Prompt

```
Bạn là JIRA Agent, một AI assistant được thiết kế để thực hiện các thao tác liên quan đến JIRA.

Khả năng của bạn bao gồm:
1. Tìm kiếm issues dựa trên JQL
2. Tạo issues mới
3. Cập nhật trạng thái và thông tin của issues
4. Tìm kiếm users
5. Thêm comment

Nhiệm vụ của bạn là:
1. Phân tích prompt được cung cấp
2. Xác định hành động cần thực hiện (searchIssues, createIssue, updateIssue, etc.)
3. Xác định các tham số cần thiết từ nội dung prompt
4. Thực hiện hành động và trả về kết quả

Trả về kết quả dưới dạng JSON với cấu trúc:
{
  "success": true,
  "data": { ... },
  "metadata": {
    "executionTime": 1250,
    "tokenUsage": 320
  }
}

Hoặc nếu có lỗi:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  },
  "metadata": { ... }
}
```

### 4.2 Ví dụ Prompt và Response

```
// Prompt
Tìm kiếm tất cả các issue được gán cho người dùng hiện tại (Phúc) với dự án XDEMO2. Chỉ trả về các task đã được cập nhật hôm nay và chưa hoàn thành. Format kết quả dưới dạng JSON với các trường key, summary, status.

// Response
{
  "success": true,
  "data": {
    "issues": [
      {"key": "XDEMO2-5", "summary": "Cập nhật tính năng đăng nhập", "status": "In Progress"},
      {"key": "XDEMO2-7", "summary": "Fix lỗi validation form", "status": "In Progress"}
    ]
  },
  "metadata": {
    "executionTime": 1250,
    "tokenUsage": 320
  }
}
```

## 5. Slack Agent

### 5.1 System Prompt

```
Bạn là Slack Agent, một AI assistant được thiết kế để thực hiện các thao tác liên quan đến Slack.

Khả năng của bạn bao gồm:
1. Gửi tin nhắn tới channel
2. Gửi tin nhắn trực tiếp
3. Tạo các message blocks với formatting
4. Lấy thông tin về channels, users

Nhiệm vụ của bạn là:
1. Phân tích prompt được cung cấp
2. Xác định hành động cần thực hiện (sendMessage, getDMChannel, etc.)
3. Xác định các tham số cần thiết từ nội dung prompt
4. Thực hiện hành động và trả về kết quả

Trả về kết quả dưới dạng JSON với cấu trúc:
{
  "success": true,
  "data": { ... },
  "metadata": {
    "executionTime": 850,
    "tokenUsage": 210
  }
}

Hoặc nếu có lỗi:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  },
  "metadata": { ... }
}
```

### 5.2 Ví dụ Prompt và Response

```
// Prompt
Gửi tin nhắn tới channel #project-alpha (ID: C08JFTGTN2K) với nội dung: 'Phúc đã hoàn thành 2 task hôm nay: XDEMO2-5: Cập nhật tính năng đăng nhập, XDEMO2-7: Fix lỗi validation form'

// Response
{
  "success": true,
  "data": {
    "messageId": "1621234567.123456",
    "timestamp": "1621234567.123456",
    "channel": "C08JFTGTN2K"
  },
  "metadata": {
    "executionTime": 850,
    "tokenUsage": 210
  }
}
```

## 6. Cách tối ưu Prompt

### 6.1 Kỹ thuật Few-shot Learning

Trong nhiều prompt, chúng ta sử dụng kỹ thuật few-shot learning bằng cách cung cấp ví dụ cho model. Điều này giúp model hiểu rõ định dạng đầu ra mong muốn:

```
Ví dụ:
Input: "tôi xong việc hôm nay rồi"
Output:
"Người dùng Phúc muốn báo cáo rằng họ đã hoàn thành tất cả công việc được giao trong ngày hôm nay..."
```

### 6.2 Điều chỉnh Temperature

- Sử dụng temperature thấp (0.2-0.3) cho các nhiệm vụ cần độ chính xác cao như Action Planner
- Sử dụng temperature cao hơn (0.5-0.7) cho Result Synthesizer nếu muốn câu trả lời linh hoạt hơn

### 6.3 Chiến lược Retry

Khi thất bại trong việc parse JSON hoặc kết quả không đạt yêu cầu, chúng ta có thể retry với prompt điều chỉnh:

```
// Prompt điều chỉnh
Dựa trên yêu cầu đã được phân tích sau:

{processedInput}

Tạo kế hoạch thực hiện dưới dạng JSON hợp lệ với cấu trúc chính xác như sau:
{
  "steps": [
    {
      "id": "step1",
      "agentType": "JIRA", // Một trong các loại: JIRA, SLACK, EMAIL, GIT, CONFLUENCE
      "prompt": "Chi tiết prompt",
      "dependsOn": [], // Mảng các ID step mà step này phụ thuộc
      "condition": null // Điều kiện để thực hiện, hoặc null
    }
  ]
}

Đảm bảo JSON đúng cú pháp, không có lỗi và bao gồm đầy đủ thông tin cho mỗi step.
```

## 7. Function Calling

### 7.1 Định nghĩa Function cho Input Processing

```json
{
  "name": "processUserInput",
  "description": "Process user input to extract intents and context",
  "parameters": {
    "type": "object",
    "properties": {
      "analysis": {
        "type": "string",
        "description": "Detailed analysis of the user's request in natural language"
      }
    },
    "required": ["analysis"]
  }
}
```

### 7.2 Định nghĩa Function cho Action Planning

```json
{
  "name": "createActionPlan",
  "description": "Create an action plan based on processed input",
  "parameters": {
    "type": "object",
    "properties": {
      "steps": {
        "type": "array",
        "description": "List of steps to execute",
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "Unique identifier for the step"
            },
            "agentType": {
              "type": "string",
              "enum": ["JIRA", "SLACK", "EMAIL", "GIT", "CONFLUENCE"],
              "description": "Type of agent to execute the step"
            },
            "prompt": {
              "type": "string",
              "description": "Natural language prompt for the agent"
            },
            "dependsOn": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "IDs of steps this step depends on"
            },
            "condition": {
              "type": "string",
              "description": "Condition to evaluate before executing this step",
              "nullable": true
            },
            "maxRetries": {
              "type": "integer",
              "description": "Maximum number of retries if step fails",
              "default": 3
            },
            "timeout": {
              "type": "integer",
              "description": "Timeout in milliseconds",
              "default": 30000
            }
          },
          "required": ["id", "agentType", "prompt"]
        }
      }
    },
    "required": ["steps"]
  }
}
```

## 8. Best Practices

### 8.1 Kiểm tra và tối ưu Prompt

1. **Testing**: Thử nghiệm các prompt với nhiều loại input khác nhau
2. **Revising**: Điều chỉnh dựa trên kết quả từ testing
3. **Versioning**: Theo dõi các phiên bản prompt và hiệu suất tương ứng

### 8.2 Xử lý lỗi thông minh

1. **Retry với điều chỉnh**: Khi thất bại, thêm thông tin về lỗi vào prompt mới
2. **Graceful degradation**: Có chiến lược dự phòng khi LLM không tạo ra đúng định dạng
3. **Logging**: Ghi lại tất cả prompt và response để debug

### 8.3 Cải thiện liên tục

1. **A/B Testing**: So sánh hiệu suất của các phiên bản prompt khác nhau
2. **Human Feedback**: Thu thập feedback từ người dùng để cải thiện
3. **Automated Evaluation**: Sử dụng các metric tự động để đánh giá chất lượng

## 9. Tham khảo

- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [Prompting Best Practices](https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-openai-api)
- [JSON Schema Documentation](https://json-schema.org/understanding-json-schema) 