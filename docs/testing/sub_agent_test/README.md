# Kiểm thử Sub-Agent

Thư mục này chứa các tài liệu về kế hoạch, chiến lược và kịch bản kiểm thử cho các Sub-Agent trong hệ thống DevAssist Bot. Mục đích là đảm bảo các Sub-Agent hoạt động đúng chức năng và tích hợp tốt với Central Agent.

## Mục tiêu kiểm thử Sub-Agent

- Đảm bảo các Sub-Agent (JIRA, Slack, Confluence, v.v.) hoạt động đúng chức năng
- Kiểm tra khả năng xử lý các prompt từ Central Agent
- Đánh giá tính chính xác của các hành động thực hiện trên các dịch vụ bên ngoài
- Đảm bảo xử lý lỗi đúng cách và có cơ chế retry hiệu quả
- Kiểm tra tính tương thích giữa các Sub-Agent và Central Agent

## Loại kiểm thử

1. **Unit Testing**: Kiểm thử chức năng độc lập của từng Sub-Agent
   - Khả năng phân tích prompt
   - Khả năng xác định hành động và tham số
   - Xử lý exceptions và lỗi

2. **Integration Testing**: Kiểm thử tương tác với Central Agent
   - Luồng giao tiếp giữa Central Agent và Sub-Agent
   - Xử lý kết quả trả về từ Sub-Agent
   - Đảm bảo định dạng dữ liệu tương thích

3. **Mock Testing**: Kiểm thử với dịch vụ bên ngoài giả lập
   - Mô phỏng các API calls để kiểm thử không cần kết nối thực
   - Tạo các kịch bản lỗi để kiểm tra xử lý lỗi

## Cấu trúc tài liệu kiểm thử Sub-Agent

Mỗi Sub-Agent sẽ có kế hoạch kiểm thử riêng với định dạng sau:
- Mô tả chung về Sub-Agent và phạm vi kiểm thử
- Danh sách chức năng cần kiểm thử
- Test cases cụ thể với input và expected output
- Cách triển khai mock services
- Kịch bản kiểm thử tích hợp với Central Agent

## Lưu ý

Tài liệu kiểm thử Sub-Agent cần được cập nhật khi có thay đổi về API của các dịch vụ bên ngoài hoặc khi có thêm các chức năng mới cho Sub-Agent. 