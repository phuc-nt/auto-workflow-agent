# Kế hoạch triển khai Central Agent

## Tổng quan
Kế hoạch triển khai Central Agent theo mô hình đã thiết kế, tập trung vào việc xây dựng từng module riêng biệt và tích hợp chúng với nhau. Trong giai đoạn đầu, các sub-agent sẽ được mock để tập trung vào việc xây dựng hoàn chỉnh Central Agent.

## Danh sách tác vụ và tiến độ

### Phase 1: Thiết lập cơ bản
- [x] Tạo cấu trúc thư mục cho Central Agent
- [x] Thiết lập các interface cơ bản
- [x] Tạo API endpoint chính cho central agent
- [x] Thêm unit test cơ bản

### Phase 2: Input Processor
- [x] Thiết kế interface và class cho Input Processor
- [x] Tích hợp OpenAI API cho việc phân tích yêu cầu
- [x] Xây dựng prompt template cho Input Processor
- [x] Tạo mock data cho các trường hợp test
- [x] Viết unit test cho Input Processor
- [x] Kiểm thử API endpoint với Input Processor

### Phase 3: Project Config Reader
- [x] Xây dựng class ProjectConfigReader
- [x] Tích hợp đọc file cấu hình dự án
- [x] Viết unit test cho ProjectConfigReader

### Phase 4: Action Planner
- [x] Thiết kế interface và class cho Action Planner
- [x] Xây dựng cấu trúc ActionPlan và ActionStep
- [x] Tích hợp OpenAI API cho việc lập kế hoạch
- [x] Xây dựng prompt template cho Action Planner
- [x] Viết unit test cho Action Planner

### Phase 5: Agent Coordinator
- [x] Thiết kế interface và class cho Agent Coordinator
- [x] Xây dựng logic xử lý các bước trong kế hoạch
- [x] Phát triển cơ chế tương tác với các sub-agent (mock)
- [x] Viết unit test cho Agent Coordinator

### Phase 6: Result Synthesizer
- [x] Thiết kế interface và class cho Result Synthesizer
- [x] Tích hợp OpenAI API cho việc tổng hợp kết quả
- [x] Xây dựng prompt template cho Result Synthesizer
- [x] Viết unit test cho Result Synthesizer

### Phase 7: Mock Sub-Agents
- [x] Tạo mock JIRA Agent
- [x] Tạo mock Slack Agent
- [x] Tạo Agent Factory để quản lý các agent

### Phase 8: Tích hợp hoàn chỉnh
- [x] Tích hợp tất cả các module
- [x] Tạo e2e test cho toàn bộ luồng xử lý
- [ ] Viết API documentation
- [x] Kiểm thử với các kịch bản sử dụng thực tế

### Phase 9: Cấu hình tập trung LLM
- [x] Tạo file cấu hình tập trung cho LLM và prompt
- [x] Triển khai các API endpoints để quản lý cấu hình
- [x] Cập nhật các thành phần để sử dụng cấu hình tập trung
- [x] Cải thiện hệ thống logging để theo dõi việc sử dụng LLM

### Phase 10: Theo dõi chi phí (Cost Monitoring)
- [x] Tạo module theo dõi chi phí sử dụng LLM
- [x] Thiết kế cấu trúc dữ liệu cho việc lưu trữ thông tin sử dụng token
- [x] Cập nhật `OpenaiService` để theo dõi và tính toán chi phí
- [x] Tạo API endpoints để xem thống kê chi phí
- [x] Triển khai cơ chế cảnh báo khi chi phí vượt ngưỡng

### Phiên làm việc #11: Cải thiện MockJiraAgent và MockSlackAgent
- Đã cải thiện MockJiraAgent để bổ sung trường `lastUpdated` (ngày cập nhật cuối cùng) vào tất cả các task được trả về
- Đã sửa lỗi trong phương thức `findTasks` của MockJiraAgent không cung cấp thông tin ngày cập nhật cuối cùng
- Đã cải thiện MockSlackAgent với những nâng cấp sau:
  - Cập nhật phương thức `mockSearchMessages` để trả về dữ liệu tin nhắn thực tế và đa dạng hơn
  - Bổ sung khả năng tìm kiếm tin nhắn liên quan đến các task XDEMO2-xxx
  - Cải thiện phương thức `mockGetConversationForTask` để hỗ trợ nhiều mã task thay vì chỉ một task
  - Bổ sung các trường dữ liệu chi tiết cho tin nhắn như kênh (channel), timestamp và định dạng đầy đủ
  - Hỗ trợ tìm kiếm tin nhắn liên quan đến việc hoàn thành công việc
- Đã kiểm thử kỹ lưỡng với kịch bản "tôi xong việc hôm nay rồi" và sửa các lỗi sau:
  - Sửa lỗi "Empty reply from server" khi xử lý các yêu cầu phức tạp
  - Khắc phục vấn đề bước step1 (JIRA) thất bại do thiếu trường dữ liệu cần thiết
  - Đảm bảo tính nhất quán trong định dạng dữ liệu trả về giữa các agent
- Đã cải thiện khả năng của AgentCoordinator trong việc đánh giá kết quả từ các agent một cách chính xác hơn
- Đã tối ưu hóa hiệu suất tổng thể của hệ thống khi xử lý nhiều yêu cầu liên tiếp

Các cải tiến này giúp Central Agent xử lý liền mạch các yêu cầu phức tạp như "tôi xong việc hôm nay rồi", có thể thực hiện đầy đủ quy trình từ việc tìm kiếm task, kiểm tra tin nhắn liên quan, cập nhật trạng thái, thông báo trên Slack và cập nhật báo cáo trên Confluence mà không bị gián đoạn. Hệ thống giờ đây đã sẵn sàng để xử lý các tình huống thực tế với độ tin cậy cao hơn.

## Bài học kinh nghiệm
1. **Cấu hình cổng kết nối**: Fix cứng cổng trong main.ts để tránh xung đột với các tiến trình khác
2. **SQLite cho môi trường phát triển**: Cần đảm bảo gói `sqlite3` đã được cài đặt khi sử dụng TypeORM với SQLite
3. **OpenAI API key**: Đảm bảo API key được cấu hình đúng trong file .env
4. **Thực hiện lệnh từ thư mục đúng**: Cần phải cd vào thư mục dev_assist_backend trước khi chạy npm run start:dev
5. **Cấu hình đường dẫn file**: Cần đảm bảo đường dẫn file cấu hình dự án được xác định đúng trong môi trường
6. **Xử lý lỗi kết nối cơ sở dữ liệu**: Kiểm tra SQLite đã được cài đặt đúng cách và có quyền truy cập vào thư mục lưu trữ cơ sở dữ liệu
7. **Quản lý databaseId**: Đảm bảo truyền databaseId khi cập nhật kết quả thực thi để tránh tạo nhiều kế hoạch mới
8. **Xử lý điều kiện tiếng Việt**: Cần xử lý đặc biệt đối với các điều kiện bằng tiếng Việt trong phương thức evaluateCondition
9. **Ánh xạ model cho thư viện tiktoken**: Khi sử dụng các model mới, cần ánh xạ sang các model mà thư viện tiktoken hỗ trợ
10. **Cập nhật bảng giá thường xuyên**: Đảm bảo bảng giá được cập nhật theo giá mới nhất từ OpenAI
11. **Điều chỉnh kế hoạch dựa trên LLM**: Sử dụng LLM để tạo kế hoạch thay thế là cách tiếp cận hiệu quả, nhưng cần đảm bảo hướng dẫn rõ ràng (prompt) để có kết quả như mong đợi