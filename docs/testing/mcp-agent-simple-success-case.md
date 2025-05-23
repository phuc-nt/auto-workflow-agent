## Request
```
curl -X POST "http://localhost:3001/central-agent/process" \
  -H "Content-Type: application/json" \
  -d '{"message": "liệt kê tất cả các dự án"}' | jq
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  5785  100  5735  100    50    159      1  0:00:50  0:00:35  0:00:15  1600
{
  "processedInput": "1. Ý định của người dùng và các hành động cần thiết  \nNgười dùng muốn xem danh sách đầy đủ tất cả các dự án hiện có trong hệ thống hoặc trong phạm vi mà họ có quyền truy cập. Hành động cần thiết là truy xuất và liệt kê toàn bộ các dự án này cho người dùng.\n\n2. Các thông tin cần thiết như project, timeline, status, v.v.  \nĐể đáp ứng yêu cầu, hệ thống cần cung cấp ít nhất tên của các dự án. Ngoài ra, để tăng tính hữu ích, có thể bổ sung một số thông tin cơ bản cho mỗi dự án như:\n- Tên dự án (bắt buộc)\n- Mã hoặc ID dự án (nếu có)\n- Ngày bắt đầu và ngày kết thúc dự kiến hoặc thực tế (timeline)\n- Trạng thái hiện tại của dự án (đang triển khai, đã hoàn thành, tạm dừng, v.v.)\n- Người quản lý dự án hoặc các thành viên chính (nếu cần)\n- Mô tả ngắn gọn về từng dự án (nếu có)\n\nTuy nhiên, vì người dùng chỉ yêu cầu “liệt kê”, thông tin tối thiểu là tên dự án. Nếu có thể, nên hỏi thêm nếu người dùng muốn chi tiết hơn.\n\n3. Bất kỳ ngữ cảnh bổ sung nào  \n- Hiện tại, không có thông tin về người dùng, dự án cụ thể, hoặc bất kỳ bộ lọc nào được đề cập.  \n- Người dùng không yêu cầu lọc theo trạng thái, thời gian hoặc các tiêu chí khác.  \n- Không có giới hạn về số lượng dự án trả về.\n- Phù hợp với yêu cầu là trả về danh sách tất cả các dự án mà người dùng có quyền xem, không loại trừ bất kỳ loại dự án nào.\n\nTóm lại, người dùng muốn xem danh sách đầy đủ tất cả các dự án hiện có, kèm theo các thông tin cơ bản nếu có thể, nhưng tối thiểu là tên các dự án. Không có yêu cầu lọc, sắp xếp hoặc giới hạn nào được chỉ định.",
  "actionPlan": {
    "steps": [
      {
        "id": "step1",
        "agentType": "JIRA",
        "prompt": "Lấy danh sách tất cả các dự án mà người dùng hiện tại có quyền truy cập. Đối với mỗi dự án, hãy trả về các thông tin sau (nếu có): tên dự án, mã hoặc ID dự án, ngày bắt đầu và ngày kết thúc dự kiến hoặc thực tế, trạng thái hiện tại của dự án, người quản lý dự án hoặc các thành viên chính, mô tả ngắn gọn. Nếu một số trường không có, vẫn trả về các trường còn lại. Trả về tối thiểu là tên dự án.",
        "dependsOn": [],
        "condition": null,
        "maxRetries": 2,
        "timeout": 20000,
        "retryCount": 0,
        "status": "succeeded",
        "startTime": "2025-05-23T13:03:22.460Z",
        "result": {
          "success": true,
          "data": {
            "projects": {
              "metadata": {
                "total": 2,
                "limit": 2,
                "offset": 0,
                "hasMore": false,
                "links": {
                  "self": "jira://projects",
                  "ui": "https://phuc-nt.atlassian.net/jira/projects"
                }
              },
              "projects": [
                {
                  "id": "10000",
                  "key": "XDEMO",
                  "name": "Team X Demo",
                  "projectType": "software",
                  "url": "https://phuc-nt.atlassian.net/browse/XDEMO",
                  "lead": "Unknown"
                },
                {
                  "id": "10001",
                  "key": "XDEMO2",
                  "name": "Team X Demo 2",
                  "projectType": "software",
                  "url": "https://phuc-nt.atlassian.net/browse/XDEMO2",
                  "lead": "Unknown"
                }
              ]
            }
          }
        },
        "evaluation": {
          "success": true,
          "reason": "Kết quả đã trả về danh sách các dự án mà người dùng có quyền truy cập, bao gồm các trường cơ bản như id, key, name và lead cho từng dự án. Mặc dù thiếu một số trường chi tiết như ngày bắt đầu, ngày kết thúc, trạng thái hiện tại và mô tả ngắn gọn, nhưng đã đáp ứng yêu cầu tối thiểu là có tên dự án và các thông tin liên quan cơ bản. Vì vậy, bước này được coi là thành công.",
          "needsAdjustment": false
        },
        "endTime": "2025-05-23T13:03:29.874Z"
      }
    ],
    "currentStepIndex": 0,
    "executionContext": {
      "result": {
        "step1": {
          "success": true,
          "data": {
            "projects": {
              "metadata": {
                "total": 2,
                "limit": 2,
                "offset": 0,
                "hasMore": false,
                "links": {
                  "self": "jira://projects",
                  "ui": "https://phuc-nt.atlassian.net/jira/projects"
                }
              },
              "projects": [
                {
                  "id": "10000",
                  "key": "XDEMO",
                  "name": "Team X Demo",
                  "projectType": "software",
                  "url": "https://phuc-nt.atlassian.net/browse/XDEMO",
                  "lead": "Unknown"
                },
                {
                  "id": "10001",
                  "key": "XDEMO2",
                  "name": "Team X Demo 2",
                  "projectType": "software",
                  "url": "https://phuc-nt.atlassian.net/browse/XDEMO2",
                  "lead": "Unknown"
                }
              ]
            }
          }
        }
      },
      "evaluation": {
        "step1": {
          "success": true,
          "reason": "Kết quả đã trả về danh sách các dự án mà người dùng có quyền truy cập, bao gồm các trường cơ bản như id, key, name và lead cho từng dự án. Mặc dù thiếu một số trường chi tiết như ngày bắt đầu, ngày kết thúc, trạng thái hiện tại và mô tả ngắn gọn, nhưng đã đáp ứng yêu cầu tối thiểu là có tên dự án và các thông tin liên quan cơ bản. Vì vậy, bước này được coi là thành công.",
          "needsAdjustment": false
        }
      }
    },
    "status": "completed",
    "overallProgress": 100,
    "databaseId": "1e5a46d3-8755-4a6d-8ba5-c3c5230499fb",
    "startTime": "2025-05-23T13:03:22.459Z",
    "endTime": "2025-05-23T13:03:29.874Z"
  },
  "result": "Kế hoạch đã được thực hiện thành công, với 100% tiến độ. Hệ thống đã lấy được danh sách 2 dự án mà bạn có quyền truy cập trên JIRA, bao gồm: \"Team X Demo\" (ID: 10000) và \"Team X Demo 2\" (ID: 10001). Một số thông tin chi tiết như ngày bắt đầu, ngày kết thúc và người quản lý dự án hiện không có sẵn, nhưng tên và mã dự án đã được cung cấp đầy đủ. Không có lỗi nào phát sinh trong quá trình thực hiện."
}
```

## Server log
```
[Nest] 42356  - 05/23/2025, 8:02:56 PM     LOG [CentralAgentService] Đang xử lý yêu cầu: liệt kê tất cả các dự án
[Nest] 42356  - 05/23/2025, 8:02:56 PM     LOG [InputProcessor] Đang xử lý đầu vào: liệt kê tất cả các dự án
[Nest] 42356  - 05/23/2025, 8:02:56 PM     LOG [InputProcessor] InputProcessor sử dụng model: gpt-4.1, temperature: 0.7
[Nest] 42356  - 05/23/2025, 8:02:56 PM   DEBUG [OpenaiService] Đã tìm thấy cấu hình prompt cho [inputProcessor]
[Nest] 42356  - 05/23/2025, 8:02:56 PM   DEBUG [InputProcessor] Bắt đầu gọi chatWithSystem với system prompt và user prompt
[Nest] 42356  - 05/23/2025, 8:02:56 PM     LOG [OpenaiService] Gọi OpenAI chatWithSystem với model [gpt-4.1], temperature [0.7]
[Nest] 42356  - 05/23/2025, 8:03:18 PM   DEBUG [CostMonitoringService] Đã lưu thông tin sử dụng token vào file cost-usage-2025-05-23.json
[Nest] 42356  - 05/23/2025, 8:03:18 PM     LOG [CostMonitoringService] LLM Usage - Model: gpt-4.1, Component: unknown, Operation: chatWithSystem, Tokens: 677, Cost: $0.004012
[Nest] 42356  - 05/23/2025, 8:03:18 PM   DEBUG [InputProcessor] Kết quả xử lý: 1. Ý định của người dùng và các hành động cần thiết
Người dùng muốn xem danh sách đầy đủ tất cả cá...
[Nest] 42356  - 05/23/2025, 8:03:18 PM     LOG [InputProcessor] Xử lý đầu vào thành công
[Nest] 42356  - 05/23/2025, 8:03:18 PM     LOG [ActionPlanner] ActionPlanner sử dụng model: gpt-4.1, temperature: 0.7
[Nest] 42356  - 05/23/2025, 8:03:18 PM   DEBUG [ActionPlanner] Bắt đầu gọi chatWithFunctionCalling với system prompt và user prompt
[Nest] 42356  - 05/23/2025, 8:03:18 PM     LOG [OpenaiService] Gọi OpenAI chatWithFunctionCalling với model [gpt-4.1], temperature [0.7]
[Nest] 42356  - 05/23/2025, 8:03:22 PM   DEBUG [CostMonitoringService] Đã lưu thông tin sử dụng token vào file cost-usage-2025-05-23.json
[Nest] 42356  - 05/23/2025, 8:03:22 PM     LOG [CostMonitoringService] LLM Usage - Model: gpt-4.1, Component: unknown, Operation: chatWithFunctionCalling, Tokens: 1034, Cost: $0.003136
[Nest] 42356  - 05/23/2025, 8:03:22 PM   DEBUG [ActionPlanner] Cleaned response: {
  "steps": [
    {
      "id": "step1",
      "agentType": "JIRA",
      "prompt": "Lấy danh sách tất cả các dự án mà người dùng hiện tại có quyền truy cập. Đối với mỗi dự án, hãy trả về các thông tin sau (nếu có): tên dự án, mã hoặc ID dự án, ngày bắt đầu và ngày kết thúc dự kiến hoặc thực tế, trạng thái hiện tại của dự án, người quản lý dự án hoặc các thành viên chính, mô tả ngắn gọn. Nếu một số trường không có, vẫn trả về các trường còn lại. Trả về tối thiểu là tên dự án.",
      "dependsOn": [],
      "condition": null,
      "maxRetries": 2,
      "timeout": 20000
    }
  ]
}
[Nest] 42356  - 05/23/2025, 8:03:22 PM   DEBUG [ActionPlanner] Tạo kế hoạch với 1 bước
[Nest] 42356  - 05/23/2025, 8:03:22 PM     LOG [ActionPlanStorageService] Đã lưu ActionPlan vào database với ID: 1e5a46d3-8755-4a6d-8ba5-c3c5230499fb
[Nest] 42356  - 05/23/2025, 8:03:22 PM     LOG [ActionPlanStorageService] Đã lưu ActionPlan ra file: /Users/phucnt/Workspace/auto-workflow-agent/storage/action-plans/1e5a46d3-8755-4a6d-8ba5-c3c5230499fb.json
[Nest] 42356  - 05/23/2025, 8:03:22 PM     LOG [AgentCoordinator] Bắt đầu thực thi kế hoạch với 1 bước
[Nest] 42356  - 05/23/2025, 8:03:22 PM   DEBUG [AgentCoordinator] Thực hiện 1 bước tiếp theo: step1
[Nest] 42356  - 05/23/2025, 8:03:22 PM   DEBUG [AgentFactory] Creating agent for type: JIRA
[Nest] 42356  - 05/23/2025, 8:03:22 PM     LOG [AgentCoordinator] Thực thi bước step1 với agent JIRA: Lấy danh sách tất cả các dự án mà người dùng hiện tại có quyền truy cập. Đối với mỗi dự án, hãy trả về các thông tin sau (nếu có): tên dự án, mã hoặc ID dự án, ngày bắt đầu và ngày kết thúc dự kiến hoặc thực tế, trạng thái hiện tại của dự án, người quản lý dự án hoặc các thành viên chính, mô tả ngắn gọn. Nếu một số trường không có, vẫn trả về các trường còn lại. Trả về tối thiểu là tên dự án.
[Nest] 42356  - 05/23/2025, 8:03:22 PM     LOG [MCPJiraAgent] Executing Jira prompt: Lấy danh sách tất cả các dự án mà người dùng hiện ...
[Nest] 42356  - 05/23/2025, 8:03:22 PM   DEBUG [PromptAnalyzerService] Analyzing prompt for agent type JIRA: "Lấy danh sách tất cả các dự án mà người dùng hiện ..."
[Nest] 42356  - 05/23/2025, 8:03:22 PM     LOG [OpenaiService] Gọi OpenAI chatWithFunctionCalling với model [gpt-4.1], temperature [0.7]
[Nest] 42356  - 05/23/2025, 8:03:23 PM   DEBUG [CostMonitoringService] Đã lưu thông tin sử dụng token vào file cost-usage-2025-05-23.json
[Nest] 42356  - 05/23/2025, 8:03:23 PM     LOG [CostMonitoringService] LLM Usage - Model: gpt-4.1, Component: prompt-analyzer, Operation: chatWithFunctionCalling, Tokens: 1449, Cost: $0.003114
[Nest] 42356  - 05/23/2025, 8:03:23 PM   DEBUG [PromptAnalyzerService] Analysis result: {"action":"readResource","resourceOrTool":"Jira Projects","parameters":{},"confidence":0.98,"originalPrompt":"Lấy danh sách tất cả các dự án mà người dùng hiện tại có quyền truy cập. Đối với mỗi dự án, hãy trả về các thông tin sau (nếu có): tên dự án, mã hoặc ID dự án, ngày bắt đầu và ngày kết thúc dự kiến hoặc thực tế, trạng thái hiện tại của dự án, người quản lý dự án hoặc các thành viên chính, mô tả ngắn gọn. Nếu một số trường không có, vẫn trả về các trường còn lại. Trả về tối thiểu là tên dự án."}
[Nest] 42356  - 05/23/2025, 8:03:23 PM   DEBUG [MCPJiraAgent] Prompt analysis result: {"action":"readResource","resourceOrTool":"Jira Projects","parameters":{},"confidence":0.98,"originalPrompt":"Lấy danh sách tất cả các dự án mà người dùng hiện tại có quyền truy cập. Đối với mỗi dự án, hãy trả về các thông tin sau (nếu có): tên dự án, mã hoặc ID dự án, ngày bắt đầu và ngày kết thúc dự kiến hoặc thực tế, trạng thái hiện tại của dự án, người quản lý dự án hoặc các thành viên chính, mô tả ngắn gọn. Nếu một số trường không có, vẫn trả về các trường còn lại. Trả về tối thiểu là tên dự án."}
[Nest] 42356  - 05/23/2025, 8:03:23 PM   DEBUG [MCPJiraAgent] Getting projects from Jira
[Nest] 42356  - 05/23/2025, 8:03:23 PM   DEBUG [MCPClientService] Reading resource: jira://projects
[Nest] 42356  - 05/23/2025, 8:03:25 PM     LOG [ActionPlanner] Đánh giá kết quả của bước step1
[Nest] 42356  - 05/23/2025, 8:03:25 PM     LOG [OpenaiService] Gọi OpenAI chatWithFunctionCalling với model [gpt-4.1], temperature [0.7]
[Nest] 42356  - 05/23/2025, 8:03:29 PM   DEBUG [CostMonitoringService] Đã lưu thông tin sử dụng token vào file cost-usage-2025-05-23.json
[Nest] 42356  - 05/23/2025, 8:03:29 PM     LOG [CostMonitoringService] LLM Usage - Model: gpt-4.1, Component: unknown, Operation: chatWithFunctionCalling, Tokens: 1055, Cost: $0.002854
[Nest] 42356  - 05/23/2025, 8:03:29 PM     LOG [ActionPlanner] Đánh giá bước step1: Thành công - Kết quả đã trả về danh sách các dự án mà người dùng có quyền truy cập, bao gồm các trường cơ bản như id, key, name và lead cho từng dự án. Mặc dù thiếu một số trường chi tiết như ngày bắt đầu, ngày kết thúc, trạng thái hiện tại và mô tả ngắn gọn, nhưng đã đáp ứng yêu cầu tối thiểu là có tên dự án và các thông tin liên quan cơ bản. Vì vậy, bước này được coi là thành công.
[Nest] 42356  - 05/23/2025, 8:03:29 PM     LOG [AgentCoordinator] Bước step1 thành công theo đánh giá: Kết quả đã trả về danh sách các dự án mà người dùng có quyền truy cập, bao gồm các trường cơ bản như id, key, name và lead cho từng dự án. Mặc dù thiếu một số trường chi tiết như ngày bắt đầu, ngày kết thúc, trạng thái hiện tại và mô tả ngắn gọn, nhưng đã đáp ứng yêu cầu tối thiểu là có tên dự án và các thông tin liên quan cơ bản. Vì vậy, bước này được coi là thành công.
[Nest] 42356  - 05/23/2025, 8:03:29 PM     LOG [AgentCoordinator] Kế hoạch đã hoàn thành thành công
[Nest] 42356  - 05/23/2025, 8:03:29 PM     LOG [ActionPlanStorageService] Đã cập nhật ActionPlan trong database với ID: 1e5a46d3-8755-4a6d-8ba5-c3c5230499fb
[Nest] 42356  - 05/23/2025, 8:03:29 PM     LOG [ActionPlanStorageService] Đã cập nhật ActionPlan trong file: /Users/phucnt/Workspace/auto-workflow-agent/storage/action-plans/1e5a46d3-8755-4a6d-8ba5-c3c5230499fb.json
[Nest] 42356  - 05/23/2025, 8:03:29 PM     LOG [ResultSynthesizerService] Bắt đầu tổng hợp kết quả thực thi
[Nest] 42356  - 05/23/2025, 8:03:29 PM     LOG [ResultSynthesizerService] ResultSynthesizer sử dụng model: gpt-4.1, temperature: 0.7
[Nest] 42356  - 05/23/2025, 8:03:29 PM   DEBUG [OpenaiService] Đã tìm thấy cấu hình prompt cho [resultSynthesizer]
[Nest] 42356  - 05/23/2025, 8:03:29 PM   DEBUG [ResultSynthesizerService] Bắt đầu gọi chatWithSystem với system prompt và user prompt
[Nest] 42356  - 05/23/2025, 8:03:29 PM     LOG [OpenaiService] Gọi OpenAI chatWithSystem với model [gpt-4.1], temperature [0.7]
[Nest] 42356  - 05/23/2025, 8:03:32 PM   DEBUG [CostMonitoringService] Đã lưu thông tin sử dụng token vào file cost-usage-2025-05-23.json
[Nest] 42356  - 05/23/2025, 8:03:32 PM     LOG [CostMonitoringService] LLM Usage - Model: gpt-4.1, Component: unknown, Operation: chatWithSystem, Tokens: 626, Cost: $0.001972
[Nest] 42356  - 05/23/2025, 8:03:32 PM   DEBUG [ResultSynthesizerService] Kết quả tổng hợp: Kế hoạch đã được thực hiện thành công, với 100% tiến độ. Hệ thống đã lấy được danh sách 2 dự án mà b...
[Nest] 42356  - 05/23/2025, 8:03:32 PM     LOG [ResultSynthesizerService] Đã tổng hợp kết quả thực thi thành công
```