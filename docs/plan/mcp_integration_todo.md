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

## Danh sách công việc

### 1. Thiết lập cơ sở hạ tầng

- [ ] **1.1. Tạo module MCP Client mới**
  - [ ] Tạo thư mục `src/mcp-client`
  - [ ] Tạo module file `src/mcp-client/mcp-client.module.ts`
  - [ ] Tạo service file `src/mcp-client/mcp-client.service.ts` 
  - [ ] Thiết lập cấu hình trong `.env` và thêm các biến môi trường cần thiết

- [ ] **1.2. Cài đặt các dependency**
  - [ ] Thêm `@modelcontextprotocol/sdk` vào package.json
  - [ ] Cài đặt các package phụ thuộc khác nếu cần

### 2. Thiết kế các interface và service cần thiết

- [ ] **2.1. Xây dựng interface cơ bản**
  - [ ] Tạo `src/mcp-client/interfaces/mcp-client.interface.ts` 
  - [ ] Định nghĩa interface `IMCPClient` với các phương thức cần thiết
  - [ ] Tạo các DTO (Data Transfer Object) cho input/output

- [ ] **2.2. Tạo lớp MCPClientService**
  - [ ] Implement interface `IMCPClient`
  - [ ] Cài đặt logic kết nối đến MCP Server
  - [ ] Xử lý các exception và retry logic

- [ ] **2.3. Tạo các service con cho Jira và Confluence**
  - [ ] Tạo `src/mcp-client/jira-mcp.service.ts`
  - [ ] Tạo `src/mcp-client/confluence-mcp.service.ts`
  - [ ] Phân chia logic của từng service theo domain

### 3. Tích hợp với Agent Factory

- [ ] **3.1. Sửa Agent Factory**
  - [ ] Cập nhật `src/central-agent/agent-factory/agent-factory.service.ts`
  - [ ] Thêm các agent mới sử dụng MCP client
  - [ ] Đảm bảo khả năng sử dụng cả Mock Agent và MCP Agent

- [ ] **3.2. Tạo các MCP Agent**
  - [ ] Tạo `src/central-agent/agents/mcp-jira-agent.ts`
  - [ ] Tạo `src/central-agent/agents/mcp-confluence-agent.ts`
  - [ ] Implement interface `IAgent` cho các agent mới

### 4. Cập nhật logic xử lý

- [ ] **4.1. Cập nhật Agent Coordinator**
  - [ ] Sửa logic trong `src/central-agent/agent-coordinator/agent-coordinator.service.ts` nếu cần
  - [ ] Thêm xử lý cho các lỗi mới từ MCP client

- [ ] **4.2. Cập nhật Action Planner**
  - [ ] Sửa các template prompt trong Action Planner để tương thích với MCP Agent
  - [ ] Cập nhật logic tạo kế hoạch nếu cần

### 5. Xử lý cấu hình và môi trường

- [ ] **5.1. Thêm cấu hình MCP Server**
  - [ ] Tạo `src/config/mcp.config.ts`
  - [ ] Thêm các tùy chọn cấu hình cho MCP client

- [ ] **5.2. Xử lý biến môi trường**
  - [ ] Cập nhật `.env.example` với các biến mới
  - [ ] Thêm validation cho các biến môi trường mới

### 6. Kiểm thử

- [ ] **6.1. Viết unit test**
  - [ ] Tạo test cho MCPClientService
  - [ ] Tạo test cho Jira/Confluence MCP service
  - [ ] Tạo test cho các MCP Agent mới

- [ ] **6.2. Viết integration test**
  - [ ] Kiểm tra kết nối từ Agent Coordinator đến MCP Agent
  - [ ] Kiểm tra luồng hoàn chỉnh từ user request đến kết quả trả về

- [ ] **6.3. Tạo các kịch bản test**
  - [ ] Kịch bản tạo issue trên Jira
  - [ ] Kịch bản tạo trang trên Confluence
  - [ ] Kịch bản kết hợp nhiều tool khác nhau

### 7. Triển khai và Tài liệu

- [ ] **7.1. Cập nhật tài liệu**
  - [ ] Cập nhật README và hướng dẫn phát triển
  - [ ] Viết tài liệu về cách mở rộng và tùy chỉnh MCP Agent

- [ ] **7.2. Chuyển đổi dần dần**
  - [ ] Tạo cơ chế switch giữa Mock Agent và MCP Agent
  - [ ] Triển khai theo từng giai đoạn, có thể rollback nếu cần

## Chi tiết kỹ thuật

### Cấu trúc kết nối MCP Client

```typescript
// Ví dụ mẫu kết nối MCP Client
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Khởi tạo client
const client = new Client({ 
  name: "auto-workflow-agent-mcp-client", 
  version: "1.0.0" 
});

// Cấu hình đường dẫn tới server
const serverPath = process.env.MCP_SERVER_PATH;

// Khởi tạo transport
const transport = new StdioClientTransport({
  command: "node",
  args: [serverPath],
  env: process.env as Record<string, string>
});

// Kết nối tới server
await client.connect(transport);

// Thực hiện các tác vụ
const result = await client.readResource({ uri: "jira://issues" });
```

### Cấu trúc MCP Agent

```typescript
// Ví dụ mẫu cho MCP Jira Agent
import { Injectable } from '@nestjs/common';
import { IAgent } from '../agent-factory/agent-factory.service';
import { StepResult } from '../models/action-plan.model';
import { MCPClientService } from '../../mcp-client/mcp-client.service';

@Injectable()
export class MCPJiraAgent implements IAgent {
  constructor(private mcpClientService: MCPClientService) {}
  
  async executePrompt(prompt: string, options?: any): Promise<StepResult> {
    try {
      // Phân tích prompt để xác định hành động cần thực hiện
      const { action, params } = this.parsePrompt(prompt);
      
      // Dựa vào action, gọi hàm tương ứng
      switch (action) {
        case 'getIssues':
          return await this.getIssues(params);
        case 'createIssue':
          return await this.createIssue(params);
        // Các trường hợp khác...
        default:
          return {
            success: false,
            error: `Không hỗ trợ hành động: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  private parsePrompt(prompt: string) {
    // Logic phân tích prompt
    // Trả về { action, params }
  }
  
  private async getIssues(params: any): Promise<StepResult> {
    const result = await this.mcpClientService.readResource({ 
      uri: "jira://issues" 
    });
    
    return {
      success: true,
      data: {
        issues: JSON.parse(result.contents[0].text).issues,
        source: "MCP_JIRA_AGENT"
      }
    };
  }
  
  private async createIssue(params: any): Promise<StepResult> {
    const result = await this.mcpClientService.callTool({
      name: "createIssue",
      parameters: {
        projectKey: params.projectKey,
        summary: params.summary,
        description: params.description,
        // Các tham số khác
      }
    });
    
    return {
      success: true,
      data: {
        issue: JSON.parse(result.content[0].text),
        source: "MCP_JIRA_AGENT"
      }
    };
  }
}
```

## Lưu ý quan trọng

1. **Xử lý lỗi:** Đặc biệt chú ý xử lý các trường hợp lỗi kết nối, timeout, và lỗi từ MCP Server
2. **Performance:** Cân nhắc việc cache kết quả, pooling connection hoặc các chiến lược tối ưu khác
3. **Tính linh hoạt:** Thiết kế sao cho dễ dàng mở rộng với các loại MCP Server khác
4. **Khả năng thay thế:** Đảm bảo có thể dễ dàng chuyển đổi giữa Mock Agent và MCP Agent
5. **Cấu hình:** Sử dụng biến môi trường để cấu hình đường dẫn MCP Server và các thông số khác

## Tài nguyên tham khảo

- [`dev_mcp-atlassian-test-client`](/Users/phucnt/Workspace/auto-workflow-agent/dev_mcp-atlassian-test-client): Mã nguồn mẫu cho MCP Client
- [Model Context Protocol Documentation](https://modelcontextprotocol.github.io/): Tài liệu chính thức của MCP
- [`docs/knowledge/ai_agent_development_guide_part1.md`](/Users/phucnt/Workspace/auto-workflow-agent/docs/knowledge/ai_agent_development_guide_part1.md): Hướng dẫn phát triển AI Agent phần 1
- [`docs/knowledge/ai_agent_development_guide_part2.md`](/Users/phucnt/Workspace/auto-workflow-agent/docs/knowledge/ai_agent_development_guide_part2.md): Hướng dẫn phát triển AI Agent phần 2
