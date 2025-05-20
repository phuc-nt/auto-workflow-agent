# Kế hoạch chi tiết: Tích hợp MCP Client vào Auto Workflow Agent

## Tổng quan

File này chứa kế hoạch chi tiết và danh sách kiểm tra (checklist) cho việc tích hợp MCP (Model Context Protocol) client vào dự án Auto Workflow Agent. Khác với kế hoạch tổng thể dài hạn trong `implementation_plan.md`, tài liệu này tập trung vào các bước cụ thể và chi tiết kỹ thuật để triển khai MCP Client.

## Mục tiêu

- Tích hợp MCP Client vào Auto Workflow Agent để kết nối với MCP Server
- Thay thế các Mock Agent hiện tại bằng các Sub-Agent sử dụng MCP Client
- Đảm bảo tương thích với kiến trúc Central-Sub Agent hiện có
- Tối ưu hiệu suất và độ tin cậy của hệ thống

## Kết quả đã có

- ✅ Đã có sample code MCP client trong `dev_mcp-atlassian-test-client`
- ✅ Đã test thành công kết nối đến MCP Atlassian Server
- ✅ Đã xác nhận các tool và resource của MCP Server hoạt động tốt
- ✅ Đã tạo module MCP Client với các service và interfaces cơ bản
- ✅ Đã tạo các MCP Agent cho Jira và Confluence
- ✅ Đã cấu hình MCP Client đọc biến môi trường trong `.env`
- ✅ Đã tích hợp MCP Agent vào Agent Factory

## Tiến độ hiện tại (Ngày 20/05/2025)

### Đã hoàn thành
1. **Cơ sở hạ tầng MCP Client**
   - ✅ Module MCP Client (`mcp-client.module.ts`)
   - ✅ Service chính kết nối MCP Server (`mcp-client.service.ts`)
   - ✅ Interface và DTO cho MCP Client (`interfaces/mcp-client.interface.ts`) 
   - ✅ Service con cho Jira (`jira-mcp.service.ts`) và Confluence (`confluence-mcp.service.ts`)
   - ✅ Cấu hình môi trường trong file `.env`

2. **MCP Agent**
   - ✅ Class `MCPJiraAgent` và `MCPConfluenceAgent` implement interface `IAgent`
   - ✅ Tích hợp với `AgentFactory` với flag `USE_MCP_AGENTS` để chuyển đổi
   - ✅ Endpoint test `/central-agent/test-mcp` để kiểm tra tích hợp

3. **Cấu hình và biến môi trường**
   - ✅ Biến `USE_MCP_AGENTS` để enable/disable MCP
   - ✅ Đường dẫn tới MCP Server trong `MCP_SERVER_PATH`
   - ✅ Thông tin xác thực Atlassian (API token, email, etc.)

4. **Phân tích prompt trong MCPJiraAgent và MCPConfluenceAgent**
   - ✅ Đã triển khai `PromptAnalyzerService` sử dụng LLM để phân tích các pattern phức tạp
   - ✅ Hỗ trợ cả tiếng Việt và tiếng Anh thông qua LLM
   - ✅ Vẫn giữ lại phương thức regex-based parsing để fallback khi LLM cho kết quả độ tin cậy thấp

5. **Liệt kê và sử dụng MCP resources/tools**
   - ✅ Đã triển khai `MCPInventoryService` để quản lý danh sách resources và tools từ MCP Server
   - ✅ Hỗ trợ caching để tối ưu hiệu suất
   - ✅ Phân loại resources và tools theo loại agent (JIRA, CONFLUENCE)

6. **Tài liệu**
   - ✅ Đã hoàn thành Hướng dẫn Chi tiết Triển khai Sub-Agent với MCP Client
   - ✅ Đã chỉnh sửa tài liệu để thay thế code examples bằng mô tả và diagram
   - ✅ Đã thêm các sequence diagram và flow diagram cho quá trình hoạt động

### Vấn đề đang được giải quyết
1. **Hiệu năng và ổn định kết nối**
   - ⚠️ Đã triển khai cơ chế circuit breaker nhưng cần được test thêm
   - ⚠️ Cần cải thiện hệ thống retry và backoff khi gặp lỗi
   - ⚠️ Cần tối ưu hơn nữa việc sử dụng connection pooling

2. **Xử lý các trường hợp phức tạp**
   - ⚠️ Cần cải thiện khả năng xử lý các prompt phức tạp và đa ngôn ngữ
   - ⚠️ Cần xử lý tốt hơn các trường hợp đa nhiệm (multi-task) trong một prompt
   - ⚠️ Đang thiếu test case cho các scenario phức tạp và edge cases

## Kế hoạch tiếp theo

### 1. Cải thiện PromptAnalyzerService

- [x] **1.1. Tạo PromptAnalyzerService**
  - [x] Service `src/mcp-client/services/prompt-analyzer.service.ts` đã triển khai
  - [x] Đã tích hợp với OpenAI cho việc phân tích prompt 
  - [x] Đã thiết kế schema cho output: xác định action, resource/tool và parameters

- [x] **1.2. Cập nhật MCPJiraAgent**
  - [x] Đã thay thế logic phân tích regex bằng PromptAnalyzerService
  - [x] Đã tạo các function call để mapping với MCP resources và tools
  - [x] Đã cải thiện xử lý lỗi khi phân tích prompt

- [x] **1.3. Cập nhật MCPConfluenceAgent**
  - [x] Đã thay thế logic phân tích regex
  - [x] Đã sử dụng PromptAnalyzerService cho việc phân tích

- [ ] **1.4. Cải thiện độ chính xác của PromptAnalyzer**
  - [ ] Thu thập thêm training examples từ các test case phức tạp
  - [ ] Fine-tune hệ thống với nhiều pattern prompt khác nhau
  - [ ] Tạo hệ thống đánh giá và theo dõi độ chính xác

### 2. Cải thiện MCPInventoryService

- [x] **2.1. Liệt kê tất cả resources và tools**
  - [x] Đã tham khảo `dev_mcp-atlassian-test-client/src/list-mcp-inventory.ts`
  - [x] Đã tạo phương thức `listAllResources` và `listAllTools` trong MCPClientService
  - [x] Đã triển khai cache kết quả để tối ưu performance

- [ ] **2.2. Nâng cao cơ chế lựa chọn resource/tool động**
  - [ ] Thiết kế thuật toán dựa trên vector embedding để so khớp prompt với resource/tool tốt hơn
  - [ ] Tạo cơ sở dữ liệu vector để lưu trữ mô tả resource/tool và kết nối với prompt
  - [ ] Xây dựng cơ chế học tập liên tục để cải thiện độ chính xác của việc chọn resource/tool

- [ ] **2.3. Mở rộng schema cho resources và tools**
  - [ ] Tạo schema rõ ràng hơn cho từng loại resource và tool
  - [ ] Thêm ví dụ sử dụng (examples) vào schema để LLM hiểu rõ hơn
  - [ ] Triển khai validation tự động dựa trên schema

### 3. Tối ưu và kiểm thử nâng cao

- [ ] **3.1. Test case phức tạp cho PromptAnalyzer**
  - [ ] Tạo test suite với các prompt phức tạp và đa ngôn ngữ
  - [ ] Test các trường hợp mơ hồ và yêu cầu đa nhiệm
  - [ ] Test khả năng xử lý dữ liệu cấu trúc trong prompt

- [ ] **3.2. Integration test cho luồng end-to-end**
  - [ ] Test kịch bản từ người dùng → CentralAgent → AgentCoordinator → MCP Agent → MCP Server
  - [ ] Tạo các test cases mô phỏng các tác vụ thực tế người dùng sẽ yêu cầu
  - [ ] Test luồng lỗi và khả năng phục hồi của hệ thống

- [ ] **3.3. Benchmark hiệu năng**
  - [ ] Đo thời gian phản hồi của các thành phần khác nhau trong hệ thống
  - [ ] Tối ưu các điểm nghẽn (bottlenecks) trong luồng xử lý
  - [ ] So sánh hiệu năng trước và sau khi tối ưu

### 4. Refactoring và cải thiện chất lượng code

- [ ] **4.1. Refactor MCPClientService**
  - [ ] Cải thiện cấu trúc code và tách biệt các concern
  - [ ] Áp dụng design patterns phù hợp (Factory, Strategy, Observer)
  - [ ] Tăng cường kiểm soát error handling

- [ ] **4.2. Refactor MCP Agents**
  - [ ] Tách biệt logic nghiệp vụ và logic kết nối
  - [ ] Áp dụng SOLID principles triệt để hơn
  - [ ] Cải thiện tính mở rộng để dễ dàng thêm các agent mới

- [ ] **4.3. Cải thiện khả năng kiểm thử**
  - [ ] Tăng độ bao phủ test
  - [ ] Áp dụng Dependency Injection triệt để để dễ dàng mock
  - [ ] Tạo test fixtures và helpers cho việc testing

### 5. Xử lý các trường hợp phức tạp

- [ ] **5.1. Triển khai mock MCP Server nâng cao**
  - [ ] Tạo mock server với khả năng mô phỏng độ trễ và lỗi ngẫu nhiên
  - [ ] Tích hợp mock server vào CI/CD pipeline
  - [ ] Xây dựng bộ test data đa dạng cho nhiều kịch bản

- [ ] **5.2. Xử lý đa ngôn ngữ tốt hơn**
  - [ ] Cải thiện xử lý tiếng Việt trong các prompt phức tạp
  - [ ] Xử lý tốt các trường hợp prompt có lẫn nhiều ngôn ngữ
  - [ ] Cải thiện việc trích xuất tham số từ prompt đa ngôn ngữ

- [ ] **5.3. Xử lý dữ liệu phức tạp**
  - [ ] Xử lý pagination cho kết quả lớn từ Jira và Confluence
  - [ ] Cải thiện việc xử lý các định dạng dữ liệu đặc biệt (Confluence markup, JQL)
  - [ ] Xử lý tệp đính kèm và nội dung rich text

### 6. Nâng cao tính ổn định và khả năng chịu lỗi

- [ ] **6.1. Cải thiện Circuit Breaker**
  - [ ] Tinh chỉnh các thông số Circuit Breaker (ngưỡng lỗi, thời gian reset)
  - [ ] Triển khai Circuit Breaker theo domain (Jira và Confluence riêng biệt)
  - [ ] Thêm logging chi tiết cho quá trình chuyển đổi trạng thái

- [ ] **6.2. Cơ chế retry nâng cao**
  - [ ] Triển khai exponential backoff với jitter
  - [ ] Phân loại lỗi để quyết định có nên retry hay không
  - [ ] Cấu hình số lần retry tối đa và thời gian giữa các lần retry

- [ ] **6.3. Cơ chế fallback**
  - [ ] Tạo các chiến lược fallback khi MCP Server không khả dụng
  - [ ] Sử dụng cache làm fallback data khi thích hợp
  - [ ] Triển khai degraded mode khi chỉ một phần MCP Server bị lỗi

### 7. Tài liệu và triển khai

- [x] **7.1. Cập nhật tài liệu**
  - [x] Đã cập nhật tài liệu hướng dẫn triển khai Sub-Agent với MCP Client
  - [x] Đã thêm các sơ đồ luồng và sequence diagrams
  - [ ] Cập nhật API documentation cho MCP Client

- [ ] **7.2. Triển khai và giám sát**
  - [ ] Xây dựng dashboards giám sát hiệu suất MCP Client
  - [ ] Thiết lập các alerts cho các metrics quan trọng
  - [ ] Tạo runbooks cho việc xử lý sự cố
  
### 8. Test case phức tạp cần thêm

- [ ] **8.1. Test cases đa luồng nghiệp vụ**
  - [ ] Test case 1: Tìm kiếm issues trên nhiều dự án và tạo báo cáo trên Confluence
  - [ ] Test case 2: Phân tích comment trên issues và cập nhật thông tin tương ứng
  - [ ] Test case 3: Tìm kiếm trang Confluence và tạo issue dựa trên nội dung

- [ ] **8.2. Test cases xử lý lỗi**
  - [ ] Test case 4: Xử lý khi MCP Server trả về lỗi 500
  - [ ] Test case 5: Xử lý khi kết nối MCP Server bị ngắt giữa chừng
  - [ ] Test case 6: Xử lý khi LLM trả về phân tích không chính xác

- [ ] **8.3. Test cases hiệu năng**
  - [ ] Test case 7: Xử lý hàng trăm requests đồng thời
  - [ ] Test case 8: Benchmark thời gian phản hồi khi cache hit/miss
  - [ ] Test case 9: Test độ trễ khi phân tích prompt phức tạp

## Mô hình tích hợp LLM với MCP Agent

### Thiết kế PromptAnalyzerService

```typescript
// PromptAnalyzerService - Phân tích prompt bằng LLM
@Injectable()
export class PromptAnalyzerService {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly mcpInventoryService: MCPInventoryService
  ) {}

  async analyzePrompt(prompt: string, agentType: AgentType): Promise<PromptAnalysisResult> {
    // 1. Lấy danh sách resources và tools từ inventory
    const { resources, tools } = await this.mcpInventoryService.getInventoryByAgentType(agentType);
    
    // 2. Xây dựng prompt cho LLM với thông tin về resources và tools
    const systemPrompt = this.buildSystemPrompt(resources, tools, agentType);
    
    // 3. Gọi OpenAI để phân tích
    const result = await this.openaiService.chatWithFunctionCalling(
      systemPrompt,
      [{ role: 'user', content: prompt }],
      this.getFunctionSchema()
    );
    
    // 4. Phân tích kết quả và trả về
    return this.parseAnalysisResult(result);
  }

  private getFunctionSchema() {
    return {
      name: 'analyze_prompt',
      description: 'Phân tích prompt người dùng để xác định action, resource/tool và parameters',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['readResource', 'callTool'],
            description: 'Loại hành động: đọc resource hoặc gọi tool'
          },
          resourceOrTool: {
            type: 'string',
            description: 'Tên của resource hoặc tool được sử dụng'
          },
          parameters: {
            type: 'object',
            description: 'Parameters cần thiết cho resource/tool'
          },
          confidence: {
            type: 'number',
            description: 'Mức độ tin cậy của phân tích (0-1)'
          }
        },
        required: ['action', 'resourceOrTool', 'parameters']
      }
    };
  }
}

### Thiết kế MCPInventoryService

```typescript
// MCPInventoryService - Quản lý thông tin về resources và tools
@Injectable()
export class MCPInventoryService {
  private resourcesCache: Map<string, any> = new Map();
  private toolsCache: Map<string, any> = new Map();
  
  constructor(private readonly mcpClientService: MCPClientService) {}
  
  async getInventoryByAgentType(agentType: AgentType): Promise<{resources: any[], tools: any[]}> {
    // Lấy thông tin resources và tools từ cache hoặc MCP Server
    let resources = [];
    let tools = [];
    
    switch (agentType) {
      case AgentType.JIRA:
        resources = await this.getJiraResources();
        tools = await this.getJiraTools();
        break;
      case AgentType.CONFLUENCE:
        resources = await this.getConfluenceResources();
        tools = await this.getConfluenceTools();
        break;
      default:
        throw new Error(`Không hỗ trợ agent type: ${agentType}`);
    }
    
    return { resources, tools };
  }
  
  async getAllResources(): Promise<any[]> {
    if (this.resourcesCache.size === 0) {
      const meta = await this.mcpClientService.readResource({ uri: 'meta://' });
      // Xử lý meta data và lưu vào cache
    }
    
    return Array.from(this.resourcesCache.values());
  }
  
  async getAllTools(): Promise<any[]> {
    if (this.toolsCache.size === 0) {
      const meta = await this.mcpClientService.readResource({ uri: 'meta://' });
      // Xử lý meta data và lưu vào cache
    }
    
    return Array.from(this.toolsCache.values());
  }
}
```

### Tích hợp với MCPJiraAgent

```typescript
// MCPJiraAgent với LLM Integration
@Injectable()
export class MCPJiraAgent implements IAgent {
  constructor(
    private readonly jiraMCPService: JiraMCPService,
    private readonly promptAnalyzer: PromptAnalyzerService
  ) {}
  
  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    try {
      // Sử dụng LLM để phân tích prompt
      const analysis = await this.promptAnalyzer.analyzePrompt(prompt, AgentType.JIRA);
      
      // Thực hiện hành động dựa trên kết quả phân tích
      if (analysis.action === 'readResource') {
        return await this.executeReadResource(analysis.resourceOrTool, analysis.parameters);
      } else if (analysis.action === 'callTool') {
        return await this.executeCallTool(analysis.resourceOrTool, analysis.parameters);
      } else {
        throw new Error(`Không hỗ trợ hành động: ${analysis.action}`);
      }
    } catch (error) {
      this.logger.error(`Error executing prompt: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  private async executeReadResource(resourceUri: string, params: any): Promise<StepResult> {
    // Xây dựng URI đầy đủ với parameters
    const fullUri = this.buildResourceUri(resourceUri, params);
    
    try {
      const result = await this.jiraMCPService.readResource(fullUri);
      return {
        success: true,
        data: { result, source: 'MCP_JIRA_AGENT' }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  private async executeCallTool(toolName: string, params: any): Promise<StepResult> {
    try {
      const result = await this.jiraMCPService.callTool(toolName, params);
      return {
        success: true,
        data: { result, source: 'MCP_JIRA_AGENT' }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

## Lưu ý quan trọng

1. **Xử lý lỗi:** Đặc biệt chú ý xử lý các trường hợp lỗi kết nối, timeout, và lỗi từ MCP Server. Cần phân loại lỗi để có chiến lược xử lý phù hợp (retry, fallback, fail fast).

2. **Performance:** Cân nhắc việc cache kết quả, pooling connection hoặc các chiến lược tối ưu khác. Khả năng phục vụ đồng thời nhiều request từ các agent khác nhau là rất quan trọng.

3. **Tính linh hoạt:** Thiết kế sao cho dễ dàng mở rộng với các loại MCP Server khác. Sử dụng các interfaces và dependency injection để đảm bảo code không bị ràng buộc chặt chẽ với Atlassian MCP.

4. **Khả năng thay thế:** Đảm bảo có thể dễ dàng chuyển đổi giữa Mock Agent và MCP Agent. Việc này rất quan trọng cho testing và phát triển khi không có kết nối đến MCP Server thật.

5. **Cấu hình:** Sử dụng biến môi trường để cấu hình đường dẫn MCP Server và các thông số khác. Đảm bảo mọi thông số có thể cấu hình được đều nằm trong file config.

6. **LLM Integration:** Đảm bảo rằng việc sử dụng LLM không làm chậm quá trình xử lý, cân nhắc caching kết quả phân tích hoặc chạy các phiên bản nhẹ hơn của mô hình.

7. **Resource Management:** Quản lý tốt việc sử dụng tài nguyên khi gọi LLM và MCP Server. Theo dõi và giới hạn số lượng token sử dụng và số lượng API calls.

8. **Code Quality:** Đảm bảo code luôn được kiểm thử đầy đủ và tuân theo các nguyên tắc SOLID. Sử dụng tools như SonarQube để theo dõi chất lượng code.

9. **Observability:** Triển khai logging, metrics và tracing đầy đủ để có thể dễ dàng debug và phát hiện vấn đề trong môi trường production.

10. **Regression Testing:** Đảm bảo rằng các thay đổi trong MCP client không làm ảnh hưởng đến các tính năng hiện có. Automation testing là bắt buộc.

## Kế hoạch Refactoring

Sau khi xem xét mã nguồn hiện tại, chúng ta cần thực hiện một số refactoring để cải thiện chất lượng code và khả năng bảo trì:

1. **Áp dụng Repository Pattern**
   - Tách logic truy cập dữ liệu từ MCP Server vào các repository riêng biệt
   - Tạo interfaces để dễ dàng mock cho việc testing
   - Mỗi repository tập trung vào một domain cụ thể (JiraRepository, ConfluenceRepository)

2. **Cải thiện Error Handling**
   - Tạo hệ thống custom exception classes cho MCP Client
   - Triển khai error handling nhất quán trong toàn bộ module
   - Xử lý lỗi phân cấp: retry errors, fatal errors, và degraded operation errors

3. **Tối ưu Performance**
   - Triển khai connection pooling nâng cao
   - Cải thiện caching strategy với invalidation policy rõ ràng
   - Sử dụng batch operations khi có thể để giảm số lượng network calls

4. **Cải thiện Testability**
   - Tăng độ bao phủ test cho tất cả các thành phần
   - Tạo test fixtures cho các MCP responses phổ biến
   - Áp dụng TDD cho các tính năng mới

5. **Documentation**
   - Thêm JSDoc cho tất cả các public APIs
   - Tạo các ví dụ code trong tài liệu
   - Tự động tạo API documentation từ code comments

## Tài nguyên tham khảo

- [`dev_mcp-atlassian-test-client`](/Users/phucnt/Workspace/auto-workflow-agent/dev_mcp-atlassian-test-client): Mã nguồn mẫu cho MCP Client
- [Model Context Protocol Documentation](https://modelcontextprotocol.github.io/): Tài liệu chính thức của MCP
- [`docs/knowledge/ai_agent_development_guide_part1.md`](/Users/phucnt/Workspace/auto-workflow-agent/docs/knowledge/ai_agent_development_guide_part1.md): Hướng dẫn phát triển AI Agent phần 1
- [`docs/knowledge/ai_agent_development_guide_part2.md`](/Users/phucnt/Workspace/auto-workflow-agent/docs/knowledge/ai_agent_development_guide_part2.md): Hướng dẫn phát triển AI Agent phần 2
- [`docs/knowledge/mcp_agent_implementation_guide.md`](/Users/phucnt/Workspace/auto-workflow-agent/docs/knowledge/mcp_agent_implementation_guide.md): Hướng dẫn Chi tiết Triển khai Sub-Agent với MCP Client
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html): Mô hình Circuit Breaker cho fault tolerance
- [Resilience4j Documentation](https://resilience4j.readme.io/): Thư viện fault tolerance cho Java/TypeScript
