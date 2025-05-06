# Tài liệu Auto Workflow Agent

Thư mục này chứa toàn bộ tài liệu của dự án Auto Workflow Agent. Bộ tài liệu được cấu trúc để phục vụ nhiều mục đích khác nhau: từ học tập, phát triển, triển khai đến kiểm thử.

## Cấu trúc tài liệu

### 📁 knowledge
Chứa kiến thức, bài học và hướng dẫn tổng hợp từ quá trình phát triển thực tế. Đây là nơi lưu trữ tài liệu có giá trị chia sẻ với cộng đồng.

- [**ai_agent_development_guide_part1.md**](knowledge/ai_agent_development_guide_part1.md): Giới thiệu tổng quan về kiến trúc và các khái niệm cơ bản
- [**ai_agent_development_guide_part2.md**](knowledge/ai_agent_development_guide_part2.md): Chi tiết về Central Agent và cách xây dựng hệ thống

### 📁 requirements
Mô tả các yêu cầu chức năng và phi chức năng của hệ thống.

- [**requirement_v1.md**](requirements/requirement_v1.md): Tài liệu yêu cầu phiên bản 1, bao gồm tổng quan, kiến trúc và các kịch bản sử dụng

### 📁 implementation
Kế hoạch và chi tiết triển khai hệ thống.

- [**implementation_plan.md**](implementation/implementation_plan.md): Kế hoạch triển khai chi tiết, phân chia theo các giai đoạn và bài học kinh nghiệm

### 📁 testing
Các kịch bản kiểm thử để đánh giá hệ thống.

- [**central_agent_complex_scenarios.md**](testing/central_agent_complex_scenarios.md): Mô tả các kịch bản kiểm thử phức tạp cho Central Agent

### 📁 dev-guide
Hướng dẫn chi tiết cho nhà phát triển mới.

#### 📁 dev-guide/prompts
- [**central_agent_prompts.md**](dev-guide/prompts/central_agent_prompts.md): Template prompt cho các thành phần của Central Agent

#### 📁 dev-guide/tool_api_reference
Tài liệu tham khảo API cho các công cụ tích hợp:
- [**jira_api_reference.md**](dev-guide/tool_api_reference/jira_api_reference.md): Tài liệu tham khảo API JIRA
- [**slack_api_reference.md**](dev-guide/tool_api_reference/slack_api_reference.md): Tài liệu tham khảo API Slack
- [**confluence_api_reference.md**](dev-guide/tool_api_reference/confluence_api_reference.md): Tài liệu tham khảo API Confluence

### 📁 presentations
Tài liệu trình bày và giải thích luồng hoạt động của hệ thống.

- [**agent_workflow_explain_vi.html**](presentations/agent_workflow_explain_vi.html): Trình bày luồng hoạt động bằng tiếng Việt
- [**agent_workflow_explain_en.html**](presentations/agent_workflow_explain_en.html): Trình bày luồng hoạt động bằng tiếng Anh

## Lưu ý
Bộ tài liệu được phát triển theo phương pháp "vừa làm vừa học". Thay vì thiết kế chi tiết từ đầu, chúng tôi xây dựng dần dần và tổng hợp kiến thức, kinh nghiệm từ thực tế phát triển.

Những tài liệu trong thư mục `knowledge` đặc biệt có giá trị cho những ai muốn tìm hiểu về cách xây dựng một hệ thống AI Agent theo kiến trúc Central-Sub Agent.

## Đóng góp
Chúng tôi rất hoan nghênh mọi đóng góp để cải thiện bộ tài liệu. Nếu bạn có bất kỳ đề xuất nào, vui lòng tạo issue hoặc pull request. 