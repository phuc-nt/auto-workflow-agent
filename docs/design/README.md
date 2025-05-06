# Tài liệu thiết kế

Thư mục này chứa các tài liệu thiết kế cho DevAssist Bot. Mục đích chính là nêu rõ kiến trúc tổng thể, thiết kế chi tiết các thành phần, và định nghĩa các giao diện giữa các module của hệ thống.

## Cấu trúc thư mục

- **`central_agent/`** - Tài liệu thiết kế cho Central Agent
  - `central_agent_basic_design.md` - Thiết kế cơ bản, mô tả tổng quan về mục tiêu, architecture, và các components của Central Agent

- **`prompts/`** - Định nghĩa các prompt và cấu trúc JSON cho giao tiếp với LLM
  - `central_agent_prompts.md` - Các system prompt và function definitions cho các module của Central Agent

- **`tool_api_reference/`** - Tài liệu tham khảo API cho các công cụ và dịch vụ bên ngoài được sử dụng trong hệ thống

## Mục tiêu của tài liệu thiết kế

- Cung cấp tầm nhìn tổng thể về hệ thống và mục tiêu thiết kế
- Định nghĩa rõ ràng về kiến trúc, các thành phần, và cách chúng tương tác
- Xác định rõ trách nhiệm của từng module
- Thiết lập các quy ước, pattern, và chuẩn mực được áp dụng trong dự án 