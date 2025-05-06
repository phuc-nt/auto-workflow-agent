# Tài liệu DevAssist Bot

Thư mục này chứa tất cả tài liệu liên quan đến thiết kế, triển khai, kiểm thử và vận hành DevAssist Bot. Mục đích là cung cấp thông tin đầy đủ và cập nhật về hệ thống cho cả developer và người dùng.

## Cấu trúc thư mục

- **`design/`** - Tài liệu thiết kế
  - `central_agent/` - Thiết kế Central Agent
  - `prompts/` - Định nghĩa prompt và function definitions cho LLM
  - `tool_api_reference/` - Tài liệu tham khảo API của các công cụ bên ngoài

- **`implementation/`** - Tài liệu hướng dẫn triển khai
  - `central_agent/` - Chi tiết triển khai Central Agent

- **`testing/`** - Tài liệu kiểm thử
  - `central_agent_test/` - Kế hoạch kiểm thử Central Agent
  - `sub_agent_test/` - Kế hoạch kiểm thử Sub-Agent

- **`requirements/`** - Tài liệu yêu cầu
  - `requirement_v1.md` - Tài liệu yêu cầu gốc, mô tả chi tiết về ý tưởng

- **`presentations/`** - Tài liệu trình bày và minh họa
  - `agent_workflow_explain_en.html` - Animation minh họa luồng hoạt động (tiếng Anh)
  - `agent_workflow_explain_vi.html` - Animation minh họa luồng hoạt động (tiếng Việt)
  - `assets/` - Tài nguyên hỗ trợ cho files trình bày (CSS, JS, fonts)

- **`product_management/`** - Tài liệu quản lý sản phẩm

- **`api_reference/`** - Tài liệu tham khảo API của hệ thống

## Quy ước đặt tên

- Tên file sử dụng snake_case
- Tất cả tài liệu viết bằng Markdown
- Đặt tên file mô tả rõ nội dung, ví dụ: `central_agent_basic_design.md`
- Mỗi thư mục con có một file README.md giải thích mục đích và nội dung của thư mục đó

## Hướng dẫn cập nhật tài liệu

1. Đảm bảo tài liệu được đặt đúng thư mục theo phân loại
2. Cập nhật README.md của thư mục tương ứng nếu thêm tài liệu mới
3. Sử dụng các liên kết tương đối để tham chiếu giữa các tài liệu
4. Đảm bảo tài liệu được cập nhật đồng bộ với code

## Lưu ý

- Các file cấu hình hệ thống được đặt trong thư mục `config/` ở thư mục gốc, không nằm trong `docs/`
- File cấu hình mẫu cho dự án (`project_config_demo.json`) nằm trong thư mục `config/`
- Các tài nguyên hỗ trợ (CSS, JS, fonts) cho files trình bày được đặt trong thư mục `presentations/assets/` thay vì một thư mục assets riêng biệt

## Liên hệ

Nếu có bất kỳ câu hỏi hoặc đề xuất về tài liệu, vui lòng liên hệ:
- Email: [dev@devassist.com](mailto:dev@devassist.com)
- Slack: #devassist-documentation 