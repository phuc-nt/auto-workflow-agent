# Tài liệu Kỹ thuật Tổng quan: Auto Workflow Agent

## 1. Giới thiệu

### 1.1. Mục tiêu
Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc kỹ thuật và luồng hoạt động của hệ thống Auto Workflow Agent. Mục tiêu của hệ thống là tự động hóa các quy trình làm việc phức tạp thông qua việc sử dụng một AI Agent trung tâm điều phối các Sub-Agent chuyên biệt. Người dùng có thể tương tác với hệ thống bằng ngôn ngữ tự nhiên để yêu cầu thực hiện các tác vụ như quản lý công việc, lên lịch họp, tạo báo cáo, và nhiều hơn nữa. Tài liệu này dành cho các kỹ sư phát triển, kiến trúc sư hệ thống và các bên liên quan muốn hiểu rõ hơn về cách hệ thống được thiết kế và hoạt động.

### 1.2. Kiến trúc Central-Sub Agent
Hệ thống được xây dựng dựa trên mô hình **Central-Sub Agent** (còn gọi là Orchestrator-Workers), nơi một **Central Agent** (Agent Điều phối Trung tâm) chịu trách nhiệm tiếp nhận yêu cầu từ người dùng, phân tích, lập kế hoạch hành động, điều phối các **Sub-Agents** (Agent Chuyên biệt) thực hiện các tác vụ cụ thể trên các hệ thống bên ngoài như Jira, Confluence, v.v. Hiện tại, hệ thống ưu tiên sử dụng các **MCP Agent** (Model Context Protocol) để tương tác với các dịch vụ bên ngoài một cách chuẩn hóa. Nếu không có MCP Agent phù hợp hoặc khi MCP không được kích hoạt, hệ thống sẽ sử dụng **Fallback Agent** (tuy nhiên, các Fallback/mock agent đã bị loại bỏ sau các lần refactor).

## 2. Kiến trúc Tổng quan

Hệ thống Auto Workflow Agent bao gồm các thành phần chính sau:

```mermaid
graph TD
    User([Người dùng/Client]) -->|Yêu cầu HTTP| APILayer[API Layer]
    APILayer --> CA[Central Agent]

    subgraph CA [Central Agent]
        direction LR
        IP[Input Processor]
        AP[Action Planner]
        AC[Agent Coordinator]
        RS[Result Synthesizer]
        PCR[Config Reader]
        APS[Action Plan Storage]
        AF[Agent Factory]
    end

    AC --> AF
    AF -->|Chọn Agent| SubAgents[Sub-Agents]
    
    subgraph SubAgents
        direction TB
        MCPJira[MCPJiraAgent]
        MCPConfluence[MCPConfluenceAgent]
    end

    MCPJira -->|MCP Client| MCPServer[Atlassian MCP Server]
    MCPConfluence -->|MCP Client| MCPServer
    MCPServer --> JiraAPI[Jira API]
    MCPServer --> ConfluenceAPI[Confluence API]

    PCR --> |Đọc cấu hình| ConfigFiles[File Cấu hình Dự án]
    IP --> AP
    AP --> AC
    AC --> RS
    AP --> APS
    AC --> APS
    RS --> APILayer

    classDef llm fill:#f9f,stroke:#333,stroke-width:2px;
    class IP,AP,RS llm;
```

**Luồng chính tổng thể:**
1.  **Người dùng** gửi yêu cầu (ví dụ: "liệt kê các task Jira của tôi") thông qua **API Layer**.
2.  **Central Agent** tiếp nhận yêu cầu.
3.  Các thành phần bên trong Central Agent xử lý yêu cầu:
    *   **Config Reader**: Tải thông tin ngữ cảnh liên quan đến người dùng và dự án.
    *   **Input Processor**: Phân tích yêu cầu của người dùng để hiểu rõ ý định và trích xuất các thực thể quan trọng.
    *   **Action Planner**: Dựa trên đầu ra của Input Processor, tạo ra một kế hoạch hành động (Action Plan) gồm nhiều bước (steps). Mỗi bước xác định Sub-Agent cần gọi và thông tin cho Sub-Agent đó.
    *   **Action Plan Storage**: Lưu trữ Action Plan.
    *   **Agent Coordinator**: Thực thi Action Plan. Nó gọi **Agent Factory** để lấy đối tượng Sub-Agent tương ứng cho từng bước.
    *   **Agent Factory**: Tạo hoặc cung cấp một instance của Sub-Agent cần thiết (ví dụ: `MCPJiraAgent`).
    *   **Sub-Agents** (ví dụ: `MCPJiraAgent`, `MCPConfluenceAgent`): Thực hiện các tác vụ cụ thể bằng cách tương tác với các hệ thống bên ngoài. Trong kiến trúc hiện tại, các Sub-Agent này chủ yếu sử dụng **Model Context Protocol (MCP)** để giao tiếp với **Atlassian MCP Server**, hoạt động như một cổng vào Jira, Confluence.
    *   **Agent Coordinator**: Cập nhật trạng thái Action Plan vào Action Plan Storage sau khi các bước được thực thi.
    *   **Result Synthesizer**: Tổng hợp kết quả từ việc thực thi Action Plan thành một phản hồi dễ hiểu cho người dùng.
4.  **API Layer** trả kết quả về cho người dùng.


## 3. Luồng xử lý chi tiết và các thành phần Central Agent

Central Agent là bộ não của hệ thống. Luồng xử lý của một yêu cầu trong hệ thống Auto Workflow Agent diễn ra theo các bước sau:

```mermaid
sequenceDiagram
    participant User
    participant APILayer as API Layer
    participant CAS as CentralAgentService
    participant PCR as ConfigReader
    participant IP as InputProcessor (LLM)
    participant AP as ActionPlanner (LLM)
    participant APS as ActionPlanStorage
    participant AC as AgentCoordinator
    participant AF as AgentFactory
    participant SA as SubAgent (e.g., MCPJiraAgent)
    participant RS as ResultSynthesizer (LLM)

    User->>APILayer: POST /central-agent/process (yêu cầu)
    APILayer->>CAS: processRequest(input, userId)
    
    CAS->>PCR: getProjectContext(userId)
    PCR-->>CAS: projectContext
    
    CAS->>IP: processInput(input, context)
    IP-->>CAS: processedInput
    
    CAS->>AP: createPlan(processedInput)
    AP-->>CAS: actionPlan
    
    CAS->>APS: savePlan(actionPlan)
    APS-->>CAS: savedPlan (with ID)
    
    Note over CAS: Gán databaseId vào actionPlan
    
    CAS->>AC: executePlan(actionPlanWithId)
    AC->>AF: getAgent(step.agentType)
    AF-->>AC: subAgentInstance
    AC->>SA: executePrompt(step.prompt)
    SA-->>AC: stepResult
    AC->>APS: updatePlan(executedPlan)
    APS-->>AC: (ack)
    AC-->>CAS: executedPlan
        
    CAS->>RS: synthesizeResult(executedPlan, processedInput)
    RS-->>CAS: finalResponse
    
    CAS-->>APILayer: {processedInput, actionPlan, finalResponse}
    APILayer-->>User: Phản hồi JSON
```

### 3.1. Config Reader (`ProjectConfigReader`)

*   **Mục đích**: Cung cấp thông tin ngữ cảnh cần thiết cho việc xử lý yêu cầu. Thông tin này có thể bao gồm chi tiết người dùng, thông tin dự án, kênh liên lạc, các công cụ tích hợp, danh sách thành viên, mã dự án, v.v.
*   **Đầu vào**: ID người dùng.
*   **Đầu ra**: Đối tượng chứa thông tin ngữ cảnh (ví dụ: `projectContext`).
*   **Hoạt động**: Đọc từ các file cấu hình (ví dụ: file JSON) hoặc cơ sở dữ liệu (trong tương lai) để lấy thông tin liên quan đến người dùng và dự án họ đang làm việc.
*   **Không sử dụng LLM**.

### 3.2. Input Processor (`InputProcessor`)

*   **Mục đích**: Phân tích yêu cầu bằng ngôn ngữ tự nhiên của người dùng để hiểu rõ ý định (intent) và trích xuất các thông tin quan trọng (entities).
*   **Đầu vào**:
    *   Chuỗi yêu cầu của người dùng.
    *   Thông tin ngữ cảnh từ `Config Reader` (bao gồm thông tin người dùng, dự án).
    *   Lịch sử hội thoại (nếu có).
*   **Đầu ra**: Một đối tượng có cấu trúc (`ProcessedInput`) chứa:
    *   `intent`: Ý định chính của người dùng.
    *   `entities`: Các thực thể liên quan (ví dụ: tên dự án, loại task, người được giao việc, thời gian).
    *   `requiredAgents`: Danh sách các loại Sub-Agent có thể cần để thực hiện yêu cầu.
    *   `detailedDescription`: Mô tả chi tiết về yêu cầu, một cách rõ ràng.
*   **Sử dụng LLM**: LLM được sử dụng để hiểu sâu ngôn ngữ tự nhiên, xác định ý định và trích xuất thực thể một cách linh hoạt. Gửi yêu cầu của người dùng kèm theo context (thông tin người dùng, dự án, lịch sử hội thoại) đến LLM.
*   **Ví dụ Output (`ProcessedInput`)** (Từ yêu cầu "liệt kê tất cả các dự án"):
    ```
    "1. Ý định của người dùng và các hành động cần thiết
    Người dùng muốn xem danh sách đầy đủ tất cả các dự án hiện có...
    2. Các thông tin cần thiết như project, timeline, status, v.v.
    Để đáp ứng yêu cầu, hệ thống cần cung cấp ít nhất tên của các dự án...
    3. Bất kỳ ngữ cảnh bổ sung nào
    Hiện tại, không có thông tin về người dùng, dự án cụ thể..."
    ```

### 3.3. Action Planner (`ActionPlanner`)

*   **Mục đích**: Tạo ra một kế hoạch hành động (Action Plan) chi tiết dựa trên kết quả phân tích từ `Input Processor`. Đồng thời, đánh giá kết quả của từng bước và điều chỉnh kế hoạch nếu cần (feedback loop).
*   **Đầu vào**: `ProcessedInput` từ `Input Processor`, `StepResult` từ `AgentCoordinator` (cho việc đánh giá).
*   **Đầu ra**: `ActionPlan`, `StepEvaluation`.
*   **Cấu trúc `ActionPlan`**: Một đối tượng JSON bao gồm:
    *   `id`: Định danh duy nhất cho kế hoạch.
    *   `userId`: ID người dùng.
    *   `status`: Trạng thái của kế hoạch (Pending, Running, Succeeded, Failed).
    *   `steps`: Một mảng các bước (steps) cần thực hiện. Mỗi bước (`ActionStep`) bao gồm:
        *   `id`: ID của bước.
        *   `agentType`: Loại Sub-Agent cần sử dụng (ví dụ: JIRA, CONFLUENCE).
        *   `prompt`: Mô tả chi tiết hoặc lệnh cho Sub-Agent.
        *   `status`: Trạng thái của bước.
        *   `dependsOn`: Các bước phụ thuộc.
        *   `condition`: Điều kiện thực thi.
        *   `result`: Kết quả của bước sau khi thực thi (lưu trong `executionContext`).
        *   `maxRetries`, `timeoutInSeconds` (hoặc `timeout`).
    *   `currentStepIndex`: Chỉ số của bước đang thực thi.
    *   `executionContext`: Nơi lưu trữ kết quả của các bước.
*   **Sử dụng LLM**:
    1.  **Tạo Kế hoạch**: Gửi "Processed Input" và context (thông tin dự án, các agent có sẵn) đến LLM để yêu cầu tạo một Action Plan. LLM sẽ trả về một cấu trúc JSON bao gồm danh sách các `ActionStep`. LLM giúp xác định các bước cần thiết, sắp xếp chúng theo thứ tự logic, xác định sự phụ thuộc, và tạo `prompt` chi tiết cho từng Sub-Agent.
        *   **Ví dụ Output (`ActionPlan`)**:
            ```json
            {
              "steps": [
                {
                  "id": "step1",
                  "agentType": "JIRA",
                  "prompt": "Lấy danh sách tất cả các dự án...",
                  "dependsOn": [],
                  "condition": null,
                  "maxRetries": 2,
                  "timeout": 20000 
                }
              ]
            }
            ```
    2.  **Đánh giá Kết quả Bước (`StepEvaluation`)**: Sau mỗi bước thực thi, `ActionPlanner` nhận `StepResult` từ `AgentCoordinator`. Nó gửi `StepResult`, `ActionStep` hiện tại, và toàn bộ `ActionPlan` (bao gồm `executionContext`) cho LLM để đánh giá. LLM sẽ trả về `StepEvaluation` bao gồm `success` (bước đó thành công hay không), `reason` (lý do), và `needsAdjustment` (liệu kế hoạch có cần điều chỉnh hay không).
        *   **Ví dụ Output (`StepEvaluation`)** (cho step1 thành công):
            ```json
            {
              "success": true,
              "reason": "Kết quả đã trả về danh sách các dự án...",
              "needsAdjustment": false
            }
            ```
        *   **Ví dụ Output (`StepEvaluation`)** (cho step1 thất bại sau 2 retries, quyết định chấp nhận kết quả):
            ```json
            {
              "success": true, 
              "reason": "Đã thử lại 2 lần nhưng không đạt đủ kỳ vọng, chấp nhận kết quả hiện tại và tổng hợp trả về cho người dùng.",
              "needsAdjustment": false
            }
            ```
    3.  **Điều chỉnh Kế hoạch (Feedback Loop)**: Nếu `StepEvaluation` cho thấy `needsAdjustment` là `true` (ví dụ, bước gặp lỗi không thể retry hoặc kết quả không như mong đợi nhưng có thể có hướng giải quyết khác), `ActionPlanner` sẽ sử dụng LLM để tạo một kế hoạch mới (Adjusted Action Plan) dựa trên tình hình thất bại, kết quả của bước lỗi, và context hiện tại. Kế hoạch mới này sẽ được gửi lại cho `AgentCoordinator` để tiếp tục thực thi. Đây là vòng lặp phản hồi quan trọng giúp hệ thống linh hoạt và có khả năng tự sửa lỗi.

### 3.4. Action Plan Storage

*   **Mục đích**: Lưu trữ và quản lý các Action Plan.
*   **Hoạt động**:
    *   Lưu Action Plan mới được tạo bởi `Action Planner`.
    *   Cập nhật trạng thái của Action Plan và các bước của nó trong quá trình thực thi bởi `Agent Coordinator`.
    *   Cung cấp khả năng truy vấn Action Plan theo ID hoặc theo người dùng.
*   **Lưu trữ**: Hiện tại có thể sử dụng file system hoặc cơ sở dữ liệu trong bộ nhớ, có thể mở rộng ra cơ sở dữ liệu quan hệ/NoSQL trong tương lai.

### 3.5. Agent Factory (`AgentFactory`)

*   **Mục đích**: Cung cấp (khởi tạo hoặc lấy từ pool) một instance của Sub-Agent phù hợp dựa trên `agentType` được yêu cầu trong một bước của Action Plan.
*   **Đầu vào**: `agentType` (ví dụ: JIRA, CONFLUENCE).
*   **Đầu ra**: Một instance của Sub-Agent tương ứng (ví dụ: `MCPJiraAgent`).
*   **Hoạt động/Logic**:
    *   Kiểm tra biến môi trường `USE_MCP_AGENTS`.
    *   Nếu `USE_MCP_AGENTS=true`, ưu tiên trả về các agent sử dụng MCP (ví dụ: `MCPJiraAgent` cho `AgentType.JIRA`, `MCPConfluenceAgent` cho `AgentType.CONFLUENCE`).
    *   Nếu `USE_MCP_AGENTS=false` hoặc MCP agent không tồn tại cho `agentType` đó, hoặc nếu MCP Agent không phù hợp:
        *   Trước đây có thể trả về một mock agent (hiện tại đã bị xoá) hoặc Fallback Agent.
        *   Hiện tại, nếu không tìm thấy agent phù hợp, hệ thống sẽ báo lỗi.
    *   Quản lý việc khởi tạo và cấu hình cho các agent, bao gồm việc inject các dependency cần thiết như `ConfigService` hay các MCP service.
*   **Không sử dụng LLM**.

### 3.6. Agent Coordinator (`AgentCoordinator`)

*   **Mục đích**: Điều phối việc thực thi các bước trong `ActionPlan`.
*   **Đầu vào**: `ActionPlan` đã được tạo và lưu.
*   **Hoạt động**:
    1.  Lặp qua các bước (`ActionStep`) trong `ActionPlan`.
    2.  Kiểm tra sự phụ thuộc (`dependsOn`) và điều kiện thực thi (`condition`) của từng bước.
    3.  Đối với mỗi bước sẵn sàng thực thi:
        *   Gọi `Agent Factory` để lấy Sub-Agent tương ứng với `agentType`.
        *   Gọi phương thức `executePrompt` (hoặc một phương thức tương tự) trên Sub-Agent với `prompt` của bước.
        *   Nhận kết quả (`StepResult`) từ Sub-Agent và lưu vào `executionContext` của `ActionPlan`.
    4.  Cập nhật trạng thái (`status`) và kết quả (`result`) của bước vào `ActionPlan`.
    5.  Lưu lại `ActionPlan` đã cập nhật vào `ActionPlanStorage`.
    6.  Xử lý lỗi:
        *   Gọi `ActionPlanner` để đánh giá `StepResult`.
        *   Nếu bước thất bại và `StepEvaluation` từ `ActionPlanner` không yêu cầu điều chỉnh (`needsAdjustment=false`), `AgentCoordinator` có thể thử lại (retry) bước đó dựa trên `maxRetries`.
        *   Nếu `StepEvaluation` chỉ ra `needsAdjustment=true`, kích hoạt vòng lặp phản hồi bằng cách yêu cầu `ActionPlanner` (thông qua `CentralAgentService`) điều chỉnh kế hoạch.
        *   Nếu vẫn thất bại sau các lần thử lại hoặc điều chỉnh, nó có thể dừng kế hoạch.
*   **Đầu ra**: `ActionPlan` đã được thực thi với trạng thái và kết quả của từng bước.
*   **Không sử dụng LLM trực tiếp**, nhưng phối hợp chặt chẽ với `ActionPlanner` (sử dụng LLM).

### 3.7. Result Synthesizer (`ResultSynthesizer`)

*   **Mục đích**: Tổng hợp kết quả từ `ActionPlan` đã thực thi (bao gồm tất cả `StepResult` và `StepEvaluation`) thành một phản hồi mạch lạc, dễ hiểu cho người dùng cuối.
*   **Đầu vào**:
    *   `ActionPlan` đã thực thi.
    *   `ProcessedInput` (để hiểu yêu cầu gốc của người dùng).
    *   Yêu cầu ngôn ngữ phản hồi.
*   **Đầu ra**: Một chuỗi văn bản hoặc đối tượng JSON chứa phản hồi cuối cùng.
*   **Sử dụng LLM**: LLM được sử dụng để:
    *   Phân tích kết quả của các bước trong `ActionPlan`.
    *   Lọc thông tin quan trọng.
    *   Tạo ra một bản tóm tắt hoặc câu trả lời bằng ngôn ngữ tự nhiên, phù hợp với yêu cầu ban đầu của người dùng.
*   **Ví dụ Output (`Synthesized Result`)** (cho trường hợp thành công):
    ```
    "Kế hoạch đã được thực hiện thành công, với 100% tiến độ. Hệ thống đã lấy được danh sách 2 dự án mà bạn có quyền truy cập trên JIRA..."
    ```
*   **Ví dụ Output (`Synthesized Result`)** (cho trường hợp thất bại một phần):
    ```
    "Kết quả thực hiện kế hoạch như sau:
    Ở bước 1, hệ thống đã cố gắng truy xuất các task hiện tại mà người dùng tên 'Phuc' đang đảm nhiệm trên JIRA, nhưng gặp lỗi... 
    Ở bước 2, ... hệ thống đã gửi tin nhắn tới tài khoản Slack của Phuc..."
    ```

## 4. Sub-Agents và Tích hợp Model Context Protocol (MCP)

### 4.1. Vai trò của Sub-Agents

Sub-Agents là các thành phần chuyên biệt thực hiện các tác vụ cụ thể bằng cách tương tác với các hệ thống hoặc dịch vụ bên ngoài (ví dụ: Jira, Confluence, Calendar, Email). Mỗi Sub-Agent hiểu rõ về API và logic của hệ thống mà nó đại diện.

Sau khi refactor, hệ thống đã loại bỏ các mock/fallback agent và tập trung vào việc sử dụng các agent dựa trên MCP.

### 4.2. Model Context Protocol (MCP)

MCP là một giao thức mở được thiết kế để các mô hình AI (như Central Agent) có thể tương tác một cách an toàn và tiêu chuẩn hóa với các nguồn dữ liệu và công cụ bên ngoài.

*   **Lợi ích của MCP**:
    *   **Tiêu chuẩn hóa**: Cung cấp một cách nhất quán để AI truy cập dữ liệu (Resources) và thực hiện hành động (Tools).
    *   **Bảo mật**: Cho phép kiểm soát chi tiết quyền truy cập của AI vào các hệ thống bên ngoài.
    *   **Linh hoạt**: Dễ dàng thêm hoặc sửa đổi các khả năng của Sub-Agent mà không cần thay đổi lớn ở Central Agent.
    *   **Khám phá (Discovery)**: MCP Server có thể cung cấp danh sách các Resources và Tools có sẵn, giúp AI hiểu được những gì nó có thể làm.

### 4.3. Các thành phần MCP trong hệ thống

*   **MCP Client**: Được tích hợp bên trong các Sub-Agent chuyên biệt (ví dụ: `MCPJiraAgent` sử dụng một MCP client để nói chuyện với MCP Server). Thư viện `mcp-client-node` có thể được sử dụng ở đây.
*   **MCP Server**: Là một dịch vụ riêng biệt (ví dụ: `Atlassian MCP Server`) hoạt động như một gateway. Nó nhận yêu cầu MCP từ MCP Client, biên dịch chúng thành các lệnh gọi API cụ thể đến hệ thống đích (Jira, Confluence) và trả kết quả về.
    *   **Resources**: Đại diện cho dữ liệu có thể đọc (ví dụ: `jira://issues`, `confluence://pages`).
    *   **Tools**: Đại diện cho các hành động có thể thực hiện (ví dụ: `jira.createIssue`, `confluence.createPage`).

### 4.4. Luồng tương tác với Sub-Agent sử dụng MCP

Khi `Agent Coordinator` cần thực thi một bước yêu cầu `AgentType` là `JIRA` hoặc `CONFLUENCE` và `USE_MCP_AGENTS` là `true`:
1.  `AgentCoordinator` yêu cầu `AgentFactory` cung cấp một agent cho `JIRA` (hoặc `CONFLUENCE`).
2.  `AgentFactory` trả về một instance của `MCPJiraAgent` (hoặc `MCPConfluenceAgent`).
3.  `MCPJiraAgent` (ví dụ) được inject các service cần thiết như `ConfigService` và `MCPJiraService`.
4.  Khi `MCPJiraAgent` nhận `prompt` từ `AgentCoordinator`, nó có thể sử dụng logic nội bộ hoặc `PromptAnalyzerService` (LLM-powered, nếu có) để phân tích `prompt` và xác định `resource` hoặc `tool` MCP nào cần sử dụng, cùng với các `parameters` cần thiết.
5.  `MCPJiraAgent` sử dụng `MCPJiraService`.
6.  `MCPJiraService` sử dụng một `MCPClientService` chung để tạo yêu cầu MCP (ví dụ: `readResource('jira://projects')` hoặc `callTool('createIssue', {...})`).
7.  `MCPClientService` gửi yêu cầu này đến `Atlassian MCP Server` đã được cấu hình.
8.  `Atlassian MCP Server` xác thực yêu cầu, thực hiện lệnh gọi API tương ứng đến Jira, và trả kết quả về cho `MCPClientService`.
9.  Kết quả được truyền ngược lại qua `MCPJiraService`, `MCPJiraAgent`, và cuối cùng đến `AgentCoordinator` dưới dạng `StepResult`.

```mermaid
graph TD
    AC[Agent Coordinator] -->|step.agentType=JIRA| AF[Agent Factory]
    AF -->|new MCPJiraAgent| MJAAgent[MCPJiraAgent]
    MJAAgent -->|Phân tích prompt| MJAAgent
    MJAAgent -->|Sử dụng| MJAService[MCPJiraService]
    MJAService -->|Sử dụng| MCPClientService[MCPClientService]
    MCPClientService -->|Gửi yêu cầu MCP| AtlassianMCPServer[Atlassian MCP Server]
    AtlassianMCPServer -->|Gọi API| JiraPlatform[Jira Platform API]
    JiraPlatform -->|Kết quả API| AtlassianMCPServer
    AtlassianMCPServer -->|Kết quả MCP| MCPClientService
    MCPClientService -->|Kết quả| MJAService
    MJAService -->|StepResult| MJAAgent
    MJAAgent -->|StepResult| AC
```

Hệ thống cũng có các MCP Agent tương tự cho Confluence (`MCPConfluenceAgent` và `MCPConfluenceService`).

## 5. Luồng Dữ liệu Tổng thể và Vai trò của LLM

### 5.1. Luồng Dữ liệu Chính

1.  **Đầu vào**: Yêu cầu người dùng (văn bản tự nhiên).
2.  **Xử lý Ngữ cảnh**: `ConfigReader` tải thông tin liên quan.
3.  **Hiểu Yêu cầu (LLM)**: `InputProcessor` chuyển đổi yêu cầu thành cấu trúc (ý định, thực thể, mô tả chi tiết).
4.  **Lập Kế hoạch (LLM)**: `ActionPlanner` tạo `ActionPlan` với các bước, mỗi bước có `agentType` và `prompt`.
5.  **Lưu trữ Kế hoạch**: `ActionPlanStorage` lưu `ActionPlan`.
6.  **Thực thi**:
    *   `AgentCoordinator` lặp qua các bước.
    *   `AgentFactory` cung cấp Sub-Agent.
    *   Sub-Agent (ví dụ: `MCPJiraAgent`) có thể dùng LLM (qua `PromptAnalyzerService`) hoặc logic riêng để diễn giải `prompt` của bước thành lệnh gọi MCP cụ thể.
    *   Sub-Agent tương tác với hệ thống ngoài (Jira, Confluence) thông qua MCP Server.
    *   Kết quả từng bước (`StepResult`) được ghi lại.
    *   `ActionPlanner` đánh giá `StepResult` (LLM) và có thể yêu cầu điều chỉnh kế hoạch (LLM).
7.  **Cập nhật Kế hoạch**: `ActionPlanStorage` cập nhật `ActionPlan` với kết quả và trạng thái.
8.  **Tổng hợp Kết quả (LLM)**: `ResultSynthesizer` tạo phản hồi cuối cùng cho người dùng từ `ActionPlan` đã thực thi và `ProcessedInput`.
9.  **Đầu ra**: Phản hồi cho người dùng (văn bản tự nhiên hoặc JSON).

### 5.2. Vai trò của LLM

LLM đóng vai trò then chốt ở nhiều giai đoạn:
*   **Input Processor**: Hiểu sâu yêu cầu đa dạng của người dùng, trích xuất thông tin chính xác để tạo `ProcessedInput`.
*   **Action Planner**:
    *   Tạo ra các kế hoạch phức tạp, đa bước, có khả năng thích ứng. LLM giúp xác định các Sub-Agent cần thiết và tạo ra các `prompt` phù hợp cho chúng.
    *   Đánh giá kết quả của từng bước (`StepEvaluation`) để xác định thành công, thất bại và liệu có cần điều chỉnh kế hoạch hay không.
    *   Điều chỉnh kế hoạch (feedback loop) nếu cần thiết dựa trên `StepEvaluation`.
*   **(Tiềm năng trong Sub-Agent)**: Một số Sub-Agent (ví dụ: MCP Agents) có thể sử dụng LLM (thông qua `PromptAnalyzerService`) để diễn giải `prompt` từ `ActionPlanner` thành các tham số cụ thể cho việc gọi `resource` hoặc `tool` của MCP. Hiện tại, các MCP Agent có thể tự phân tích hoặc sử dụng service này.
*   **Result Synthesizer**: Chuyển đổi dữ liệu kỹ thuật từ kết quả thực thi kế hoạch (`ActionPlan` và `ProcessedInput`) thành một phản hồi tự nhiên, dễ hiểu và hữu ích cho người dùng.

## 6. Các Endpoint Chính (`central-agent.controller.ts`)

*   **`POST /central-agent/process`**:
    *   **Mục đích**: Endpoint chính để người dùng gửi yêu cầu xử lý.
    *   **Đầu vào**: `{ message: string, userId: string }`
    *   **Hoạt động**: Kích hoạt toàn bộ luồng xử lý của `CentralAgentService` (Input Processing, Action Planning, Execution, Result Synthesis).
    *   **Đầu ra**: JSON chứa `processedInput`, `actionPlan` (đã thực thi), và `result` (phản hồi cuối cùng từ `ResultSynthesizer`).

*   **`POST /central-agent/test-mcp`**:
    *   **Mục đích**: Endpoint dùng để kiểm tra nhanh tích hợp với MCP.
    *   **Đầu vào**: `{ testCase: string }` (ví dụ: "jira" hoặc "confluence"). Nếu không có, mặc định là "jira".
    *   **Hoạt động**: Gửi một yêu cầu định sẵn ("list all jira projects" hoặc "list all confluence spaces") vào `CentralAgentService`.
    *   **Đầu ra**: Tương tự như `/process`.

*   **`GET /central-agent/plan/:id`**:
    *   **Mục đích**: Lấy thông tin chi tiết của một Action Plan theo ID của nó.
    *   **Đầu vào**: `id` (string) từ URL path.
    *   **Đầu ra**: Đối tượng Action Plan.

*   **`GET /central-agent/plan/user/:userId`**:
    *   **Mục đích**: Lấy Action Plan mới nhất của một người dùng cụ thể.
    *   **Đầu vào**: `userId` (string) từ URL path.
    *   **Đầu ra**: Đối tượng Action Plan mới nhất.

## 7. Xử lý Lỗi và Tính Bền Vững

*   **Thử lại (Retry)**: `AgentCoordinator` có cơ chế thử lại các bước bị lỗi dựa trên cấu hình `maxRetries` trong mỗi `ActionStep` và quyết định từ `StepEvaluation` của `ActionPlanner` (nếu không cần điều chỉnh).
*   **Vòng lặp Phản hồi (Feedback Loop)**: Nếu một bước thất bại liên tục hoặc gặp lỗi không thể xử lý, và `StepEvaluation` từ `ActionPlanner` cho thấy `needsAdjustment=true`, `AgentCoordinator` sẽ yêu cầu `ActionPlanner` (thông qua `CentralAgentService`) tạo một kế hoạch mới hoặc điều chỉnh kế hoạch hiện tại. Cơ chế này giúp hệ thống linh hoạt và có khả năng tự sửa lỗi.
*   **Logging**: Hệ thống sử dụng `EnhancedLogger` để ghi log chi tiết các bước xử lý và lỗi, giúp cho việc theo dõi và gỡ lỗi.

## 8. Tổng kết và Hướng phát triển Tiếp theo

Auto Workflow Agent cung cấp một nền tảng mạnh mẽ để tự động hóa các quy trình công việc phức tạp bằng cách kết hợp khả năng của LLM và kiến trúc agent điều phối. Các cải tiến tiềm năng bao gồm:

*   Mở rộng danh sách các Sub-Agent để hỗ trợ nhiều công cụ và dịch vụ hơn.
*   Nâng cao khả năng tự học và tự điều chỉnh kế hoạch của `ActionPlanner`.
*   Cải thiện giao diện người dùng để tương tác dễ dàng hơn.
*   Tích hợp sâu hơn với các hệ thống quản lý dự án và giao tiếp hiện có.
*   Tăng cường khả năng giám sát và gỡ lỗi cho các Action Plan đang chạy.
*   Cải tiến `PromptAnalyzerService` cho MCP Agents để phân tích prompt hiệu quả hơn.

## 9. Brainstorming: Các hướng cải thiện tiềm năng

Dưới đây là ghi nhận về các ý tưởng và hướng cải thiện đã được thảo luận cho hệ thống Auto Workflow Agent:

### Cải thiện 1: Nâng cao thông tin cho Action Planner và Sub-Agents

*   **Vấn đề**: `Action Planner` và các `Sub-Agent` (như `MCPJiraAgent`) có thể chưa có đủ thông tin chi tiết về "năng lực" thực sự của các `MCP server` mà chúng tương tác.
*   **Đề xuất**:
    1.  **`Action Planner` biết Tool/Resource của MCP Server**:
        *   `Action Planner` nên có khả năng truy cập (hoặc được cung cấp) danh sách các `Tool` (tập hợp các actions) và `Resource` (đối tượng dữ liệu) mà mỗi `MCP server` (ví dụ: Jira MCP Server, Confluence MCP Server) hỗ trợ.
        *   Thông tin này cần bao gồm cả `description` (mô tả chi tiết) của từng action/tool/resource.
        *   **Lợi ích**: Giúp `Action Planner` tạo ra các kế hoạch hành động (Action Plan) chính xác hơn, phù hợp hơn với khả năng thực tế của các `MCP server`. Giảm thiểu việc tạo ra các bước kế hoạch không khả thi.
    2.  **`Sub-Agent` (ví dụ: `MCPJiraAgent`) lấy đủ thông tin Action từ MCP Server**:
        *   Khi một `Sub-Agent` (như `MCPJiraAgent`) tương tác với `MCP Server`, nó cần đảm bảo lấy được đầy đủ thông tin về các "actions" mà server đó cung cấp.
        *   Thông tin này phải bao gồm:
            *   `uri`: Địa chỉ để gọi action.
            *   `description`: Mô tả chi tiết về action, mục đích và cách hoạt động của nó.
            *   `schema`: Cấu trúc dữ liệu đầu vào (input schema) và đầu ra (output schema) của action.
        *   **Lợi ích**: Cung cấp cho `PromptAnalyzerService` (bên trong `Sub-Agent`) đầy đủ ngữ cảnh để phân tích prompt của người dùng một cách chính xác, từ đó xác định đúng "action" cần gọi trên `MCP Server` và chuẩn bị các "parameters" phù hợp dựa trên `schema`.
*   **Ưu điểm của Cải thiện 1**:
    *   Tăng độ chính xác và hiệu quả của `Action Planner` và `PromptAnalyzerService`.
    *   Giữ được sự chuyên môn hóa của các `Sub-Agent`.
    *   Hệ thống dễ bảo trì và mở rộng khi có thêm các `MCP service` mới.
*   **Điểm cần cân nhắc của Cải thiện 1**:
    *   Cần thiết kế luồng lấy và cập nhật thông tin `Tool`/`Resource`/`Action` từ `MCP server` một cách hiệu quả.
    *   Có thể tăng một chút độ phức tạp trong việc quản lý và đồng bộ hóa thông tin.

#### Sơ đồ Thành phần (Cải thiện 1)
```mermaid
flowchart TD
    subgraph CentralAgent_Imp1[Central Agent]
        AP_Imp1[Action Planner LLM]
        AC_Imp1[Agent Coordinator]
        PCR_Imp1[Config Reader]
        IP_Imp1[Input Processor LLM]
    end

    subgraph SubAgent_Imp1[MCPJiraAgent Sub-Agent]
        PAS_Imp1[PromptAnalyzerService LLM]
        MCPClient_Imp1[MCP Client Logic]
    end

    MCPServer_Imp1[MCP Server e.g., Jira MCP]
    CapabilitiesDB_Imp1[(MCP Capabilities: Tools, Resources, Schemas, Descriptions)]

    AC_Imp1 --> MCPServer_Imp1
    MCPServer_Imp1 -.-> CapabilitiesDB_Imp1
    AP_Imp1 -.-> CapabilitiesDB_Imp1

    AC_Imp1 --> SubAgent_Imp1
    SubAgent_Imp1 --> MCPServer_Imp1
    PAS_Imp1 --> MCPClient_Imp1
    MCPClient_Imp1 --> MCPServer_Imp1
    
    classDef llm fill:#f9f,stroke:#333,stroke-width:2px
    class AP_Imp1,PAS_Imp1,IP_Imp1 llm
```

#### Luồng Xử lý (Cải thiện 1)
```mermaid
sequenceDiagram
    participant AP as Action Planner (LLM)
    participant AC as Agent Coordinator
    participant SubAgent as MCPJiraAgent
    participant PAS as PromptAnalyzerService (LLM in SubAgent)
    participant MCPServer as MCP Server

    Note over AP, MCPServer: Initial phase: Action Planner and/or SubAgent fetch/are aware of detailed MCP capabilities (Tools, Resources, Schemas) from MCP Server.

    AP->>AC: ActionStep (with general prompt)
    AC->>SubAgent: Execute(prompt)
    SubAgent->>MCPServer: Request detailed info for relevant actions/tools (if not already cached/known)
    MCPServer-->>SubAgent: Action Details (URI, description, schema)
    SubAgent->>PAS: AnalyzePrompt(prompt, ActionDetails)
    PAS-->>SubAgent: MCPCommand (action_name, parameters based on schema)
    SubAgent->>MCPServer: Execute MCPCommand
    MCPServer-->>SubAgent: Result
```

### Cải thiện 2: Đơn giản hóa kiến trúc bằng cách loại bỏ Sub-Agent

*   **Vấn đề**: Kiến trúc có thể trở nên đơn giản hơn nếu giảm bớt một lớp agent.
*   **Đề xuất**:
    1.  **Loại bỏ `Sub-Agent`**: Không cần các `Sub-Agent` chuyên biệt như `MCPJiraAgent` hay `MCPConfluenceAgent` nữa.
    2.  **`Agent Coordinator` trở thành MCP Client**:
        *   `Agent Coordinator` sẽ trực tiếp đóng vai trò là một `MCP client`.
        *   Nó sẽ chịu trách nhiệm lấy danh sách các "actions" (bao gồm `uri`, `description`, `schema`) từ các `MCP server` khác nhau.
        *   `Agent Coordinator` cung cấp trực tiếp thông tin về các "actions" này cho `Action Planner`.
    3.  **`Action Planner` quyết định toàn diện**:
        *   Dựa trên thông tin "action" nhận được, `Action Planner` sẽ tự mình lên kế hoạch, chọn "action" cụ thể cần thực thi trên `MCP server`, và quyết định luôn các "parameters" cho action đó.
        *   `Agent Coordinator` sau đó chỉ việc thực thi lệnh gọi action đó tới `MCP server` theo chỉ dẫn của `Action Planner`.
*   **Ưu điểm của Cải thiện 2**:
    *   Kiến trúc tổng thể gọn nhẹ hơn.
    *   Logic tương tác với `MCP server` được tập trung tại `Agent Coordinator`.
    *   `Action Planner` có cái nhìn tổng thể và quyền quyết định cao hơn.
*   **Điểm cần cân nhắc của Cải thiện 2**:
    *   `Agent Coordinator` sẽ trở nên rất phức tạp, phải quản lý logic client cho nhiều loại `MCP service`.
    *   Mất tính chuyên môn hóa, khó khăn hơn khi các `MCP service` có đặc thù giao tiếp quá khác biệt.
    *   `Action Planner` cần logic phức tạp hơn để xử lý đa dạng các loại action mà không có sự "tiền xử lý" từ `Sub-Agent`.

#### Sơ đồ Thành phần (Cải thiện 2)
```mermaid
flowchart TD
    subgraph CentralAgent_Imp2[Central Agent]
        AP_Imp2[Action Planner LLM]
        AC_Imp2[Agent Coordinator]
        PCR_Imp2[Config Reader]
        IP_Imp2[Input Processor LLM]
    end

    MCPServer_Imp2[MCP Server e.g., Jira MCP]
    CapabilitiesInfo_Imp2[(MCP Action Info: URI, desc, schema)]

    AC_Imp2 --> MCPServer_Imp2
    MCPServer_Imp2 -.-> CapabilitiesInfo_Imp2
    AC_Imp2 -.-> CapabilitiesInfo_Imp2
    
    IP_Imp2 --> AP_Imp2
    AP_Imp2 --> AC_Imp2
    AC_Imp2 --> MCPServer_Imp2
    
    classDef llm fill:#f9f,stroke:#333,stroke-width:2px
    class AP_Imp2,IP_Imp2 llm
```

#### Luồng Xử lý (Cải thiện 2)
```mermaid
sequenceDiagram
    participant IP as InputProcessor
    participant AP as Action Planner (LLM)
    participant AC as Agent Coordinator
    participant MCPServer as MCP Server

    IP->>AP: ProcessedInput
    AC->>MCPServer: Request All Available MCP Actions (names, URI, desc, schemas)
    MCPServer-->>AC: List of MCP Actions
    Note over AP, AC: AC provides Action List to AP
    AP->>AC: ActionPlan (Steps define specific MCP action_name and parameters)
    
    loop Each ActionStep in ActionPlan
        AC->>MCPServer: Execute MCPAction (action_name, parameters from ActionStep)
        MCPServer-->>AC: Result
    end
```

### Cải thiện 3: Kiến trúc Tinh gọn Tối ưu cho MCP và Action Planner Thông minh

*   **Tiền đề cốt lõi**: Hệ thống chỉ sử dụng Model Context Protocol (MCP) để thực hiện mọi "action" tương tác với các dịch vụ bên ngoài. Điều này cho phép chúng ta đơn giản hóa đáng kể kiến trúc bằng cách loại bỏ các lớp trung gian không còn cần thiết khi hệ thống hoàn toàn dựa trên MCP.
*   **Mục tiêu kép**:
    1.  **Giảm thiểu độ phức tạp kiến trúc**: Loại bỏ các thành phần trung gian không còn cần thiết khi hệ thống hoàn toàn dựa trên MCP.
    2.  **Tăng hiệu quả và độ chính xác của việc lập kế hoạch (planning)**: `Action Planner` đưa ra quyết định ở mức độ chi tiết và trực tiếp hơn, gắn liền với "năng lực" thực tế của các MCP server.

*   **Các thành phần được loại bỏ hoặc vai trò thay đổi đáng kể**:
    *   **Các `Sub-Agent` chuyên biệt (ví dụ: `MCPJiraAgent`, `MCPConfluenceAgent`)**: Hoàn toàn được loại bỏ. Logic "hiểu" prompt và "biết" cách gọi MCP của chúng giờ đây được tích hợp vào `Action Planner` (nhờ `MCP Capability Registry`) và logic thực thi MCP được tập trung ở `Agent Coordinator`.
    *   **`PromptAnalyzerService`**: Được loại bỏ, giúp giảm một tầng xử lý LLM.

*   **Ưu điểm của "Cải thiện 3"**:
    *   **Kiến trúc tinh gọn và rõ ràng**: Giảm đáng kể số lượng thành phần, làm cho luồng dữ liệu trở nên trực tiếp và dễ hiểu hơn.
    *   **Lập kế hoạch hiệu quả và chính xác**: `Action Planner` có toàn quyền truy cập vào "năng lực" thực tế của MCP, cho phép tạo ra các kế hoạch tối ưu và giảm thiểu lỗi do thiếu thông tin hoặc hiểu sai về khả năng của các tool.
    *   **Giảm độ trễ và chi phí LLM**: Loại bỏ ít nhất một bước gọi LLM trung gian (trong `PromptAnalyzerService`), có khả năng tăng tốc độ phản hồi và giảm chi phí vận hành.
    *   **Tập trung logic MCP**: Việc tương tác với MCP được quản lý bởi `MCPClientService` và `MCP Capability Registry`, giúp việc bảo trì và mở rộng dễ dàng hơn khi có sự thay đổi từ các `MCP Server` hoặc khi muốn tích hợp `MCP Server` mới.

*   **Những điểm cần cân nhắc và phát triển thêm**:
    *   **Sự phức tạp của `Action Planner`**: `Prompt` và logic của LLM cho `Action Planner` sẽ cần được thiết kế rất cẩn thận để nó có thể xử lý hiệu quả lượng thông tin lớn từ `MCP Capability Registry` và tạo ra các `ActionStep` MCP chi tiết, chính xác.
    *   **Khởi tạo và duy trì `MCP Capability Registry`**: Cần một cơ chế mạnh mẽ và hiệu quả để khám phá, lưu trữ, và cập nhật thông tin năng lực MCP, đặc biệt nếu các `MCP Server` có thể thay đổi API hoặc năng lực của chúng một cách δυναμικά.
    *   **Xử lý lỗi MCP**: Logic xử lý lỗi chi tiết khi giao tiếp với `MCP Server` (ví dụ: server không khả dụng, lỗi xác thực, lỗi từ API của dịch vụ đích) cần được xây dựng kỹ lưỡng trong `MCPClientService` và cách `Agent Coordinator`/`Action Planner` phản ứng với các lỗi đó.
    *   **Migration**: Nếu hệ thống đã có sẵn, việc chuyển đổi sang kiến trúc này đòi hỏi nỗ lực refactor đáng kể.

#### Sơ đồ Thành phần (Cải thiện 3)
```mermaid
flowchart TD
    subgraph CentralAgent_Imp3[Central Agent]
        AP_Imp3[Action Planner LLM]
        AC_Imp3[Agent Coordinator]
        PCR_Imp3[Config Reader]
        IP_Imp3[Input Processor LLM]
        MCPCapReg_Imp3[MCP Capability Registry]
        MCPClientSvc_Imp3[MCPClientService Centralized]
    end

    MCPServers_Imp3[Multiple MCP Servers Jira, Confluence, etc.]

    MCPServers_Imp3 -->|1. Discovered by/Populates| MCPCapReg_Imp3
    MCPCapReg_Imp3 --|> Stores: Tools, Resources, Schemas, Descriptions per MCP Server| MCPCapReg_Imp3
    
    IP_Imp3 --> AP_Imp3
    AP_Imp3 -->|2. Uses MCPCapReg_Imp3 for context| MCPCapReg_Imp3
    AP_Imp3 -->|3. Creates ActionSteps with precise MCP details target server, tool/resource name, formatted params| AC_Imp3
    
    AC_Imp3 -->|4. Forwards MCP details from ActionStep to| MCPClientSvc_Imp3
    MCPClientSvc_Imp3 -->|5. Executes MCP command on target| MCPServers_Imp3
    
    classDef llm fill:#f9f,stroke:#333,stroke-width:2px
    class AP_Imp3,IP_Imp3 llm
```

#### Luồng Xử lý (Cải thiện 3)
```mermaid
sequenceDiagram
    participant MCPCapReg as MCP Capability Registry
    participant MCPServers as MCP Servers
    participant IP as InputProcessor
    participant AP as Action Planner (LLM)
    participant AC as Agent Coordinator
    participant MCPClientSvc as MCPClientService

    MCPCapReg->>MCPServers: Discover/Fetch Capabilities (Tools, Resources, Schemas)
    MCPServers-->>MCPCapReg: Capabilities Info
    Note over MCPCapReg: Stores capabilities

    IP->>AP: ProcessedInput
    AP->>MCPCapReg: Get MCP Capabilities (as context for planning)
    MCPCapReg-->>AP: Capabilities
    AP->>AC: ActionPlan (Steps define: mcpTargetServerId, mcpActionType, mcpActionName, mcpParameters)
    
    loop Each ActionStep in ActionPlan
        AC->>MCPClientSvc: ExecuteMCPAction(step.mcpTargetServerId, step.mcpActionType, step.mcpActionName, step.mcpParameters)
        MCPClientSvc->>MCPServers: (Targeted) MCP Request
        MCPServers-->>MCPClientSvc: MCP Response
        MCPClientSvc-->>AC: StepResult
    end
```

### Bảng so sánh các giải pháp cải thiện

| Tiêu chí                          | Cải thiện 1 (Nâng cao thông tin)                                  | Cải thiện 2 (Loại bỏ Sub-Agent)                                     | Cải thiện 3 (Kiến trúc Tinh gọn MCP)                                  |
| --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Kiến trúc & Độ phức tạp**     | Vẫn có Sub-Agent chuyên biệt. Thêm logic lấy/quản lý năng lực MCP. | Loại bỏ Sub-Agent. Agent Coordinator phức tạp hơn.                  | Tinh gọn nhất: Loại bỏ Sub-Agent & PromptAnalyzerService.              |
| **Vai trò Action Planner (LLM)** | Tạo kế hoạch dựa trên kiến thức tổng quan về năng lực MCP.         | Quyết định chi tiết: chọn action MCP cụ thể và parameters.        | Quyết định chi tiết nhất: Tạo ActionStep MCP đầy đủ (target, action, params) dựa trên MCP Capability Registry. |
| **Tương tác MCP**                 | Sub-Agent (với PromptAnalyzerService LLM) phân tích prompt, tạo và gửi lệnh MCP. | Agent Coordinator lấy thông tin actions, cung cấp cho AP, rồi trực tiếp thực thi lệnh MCP theo chỉ dẫn của AP. | Agent Coordinator nhận lệnh MCP chi tiết từ AP, chuyển cho MCPClientService tập trung để thực thi. |
| **Thành phần LLM chính**        | - Input Processor<br>- Action Planner<br>- PromptAnalyzerService (trong Sub-Agent)<br>- Result Synthesizer | - Input Processor<br>- Action Planner<br>- Result Synthesizer        | - Input Processor<br>- Action Planner<br>- Result Synthesizer          |
| **Ưu điểm chính**                 | - Tăng độ chính xác của AP & PAS.<br>- Giữ chuyên môn hóa của Sub-Agent.<br>- Dễ bảo trì/mở rộng MCP. | - Kiến trúc gọn hơn.<br>- Logic MCP tập trung một phần ở AC.<br>- AP có quyền quyết định cao hơn. | - Kiến trúc tinh gọn, rõ ràng nhất.<br>- Lập kế hoạch hiệu quả, chính xác.<br>- Giảm độ trễ/chi phí LLM (ít hơn 1 LLM call).<br>- Logic MCP tập trung, dễ bảo trì/mở rộng. |
| **Nhược điểm/Cân nhắc**          | - Cần cơ chế cập nhật năng lực MCP.<br>- Tăng chút độ phức tạp quản lý thông tin. | - Agent Coordinator rất phức tạp.<br>- Mất chuyên môn hóa nếu MCP service khác biệt nhiều.<br>- AP cần logic phức tạp hơn nhiều. | - AP (prompt & logic LLM) rất phức tạp.<br>- Cần cơ chế mạnh cho MCP Capability Registry (khám phá, cập nhật).<br>- Cần xử lý lỗi MCP kỹ lưỡng.<br>- Refactor lớn nếu hệ thống đã có sẵn. |

</rewritten_file> 