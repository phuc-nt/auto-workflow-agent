# Thiết kế Central Agent

Thư mục này chứa các tài liệu thiết kế chi tiết cho Central Agent - thành phần trung tâm của DevAssist Bot chịu trách nhiệm điều phối và điều khiển luồng xử lý.

## Danh sách tài liệu

- **`central_agent_basic_design.md`** - Tài liệu thiết kế cơ bản, bao gồm:
  - Tổng quan về mục tiêu và vai trò của Central Agent
  - Kiến trúc và các thành phần chính
  - Luồng xử lý yêu cầu người dùng
  - Cơ chế tương tác với các Sub-Agent
  - Các lưu ý về khả năng mở rộng và các thách thức

## Mục tiêu của thiết kế Central Agent

- Định nghĩa một kiến trúc module linh hoạt cho Central Agent
- Xác định rõ trách nhiệm của từng thành phần (Input Processor, Action Planner, Agent Coordinator, Result Synthesizer)
- Thiết lập quy trình rõ ràng cho việc xử lý yêu cầu từ người dùng
- Tạo cơ chế để mở rộng dễ dàng khi thêm các Sub-Agent mới
- Đảm bảo khả năng xử lý đồng thời nhiều yêu cầu 