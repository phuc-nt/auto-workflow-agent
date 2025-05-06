# Kiểm thử Central Agent

Thư mục này chứa các tài liệu về kế hoạch, chiến lược và kịch bản kiểm thử cho Central Agent. Mục đích là đảm bảo tất cả các thành phần của Central Agent hoạt động đúng theo thiết kế và đáp ứng các yêu cầu chức năng.

## Danh sách tài liệu

- **`central_agent_testing_plan.md`** - Kế hoạch kiểm thử chi tiết, bao gồm:
  - Các loại kiểm thử (unit, integration, system)
  - Kịch bản kiểm thử cụ thể
  - Metrics và tiêu chí đánh giá
  - Môi trường kiểm thử
  - Kế hoạch triển khai

## Mục tiêu kiểm thử Central Agent

- Đảm bảo các thành phần riêng lẻ (Input Processor, Action Planner, v.v.) hoạt động đúng
- Kiểm tra tích hợp giữa các thành phần trong Central Agent
- Kiểm tra tích hợp giữa Central Agent và các Sub-Agent
- Đánh giá hiệu suất và độ ổn định của hệ thống
- Phát hiện và khắc phục các lỗi trước khi triển khai

## Loại kiểm thử

1. **Unit Testing**: Kiểm thử từng thành phần riêng lẻ
   - Input Processor
   - Action Planner
   - Agent Coordinator
   - Result Synthesizer

2. **Integration Testing**: Kiểm thử sự tương tác giữa các thành phần
   - Luồng xử lý end-to-end
   - Tích hợp với Sub-Agents
   - Xử lý ngữ cảnh hội thoại

3. **Kịch bản kiểm thử thực tế**: Kiểm thử các tình huống từ thực tế
   - Báo cáo hoàn thành công việc
   - Tạo nhiệm vụ mới
   - Xử lý lỗi và retry
   - Đánh giá điều kiện và phụ thuộc 