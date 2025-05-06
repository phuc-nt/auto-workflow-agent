# Tổng quan về Test Case

## Giới thiệu
Tài liệu này mô tả các test case được sử dụng để kiểm tra chức năng của các agent trong hệ thống DevAssist Bot. Các test case tập trung vào việc kiểm tra khả năng function calling của các agent để thực hiện các tác vụ độc lập.

## Thông tin môi trường
Các test case được thực hiện trên môi trường test với các thông tin cấu hình như sau:
- **Dự án JIRA:** XDEMO2 (https://phuc-nt.atlassian.net)
- **Tổ chức Slack:** T07UZEWG7A9
- **Kênh dự án Slack:** C08JFTGTN2K
- **Thành viên dự án:**
  - Phúc (phucnt0@gmail.com)
  - Hưng (ng.duchungbmt@gmail.com)
  - Đăng (mrburgundy2911@gmail.com)

## Cấu trúc test
Mỗi test case bao gồm các thành phần:
- **Mục tiêu:** Mô tả mục tiêu của test case
- **Input (Câu lệnh tiếng Việt):** Câu lệnh đầu vào bằng ngôn ngữ tự nhiên
- **Expected API Params:** Các tham số API mong đợi sau khi phân tích câu lệnh
- **API Endpoint:** Thông tin về API cần gọi (URL và Method)
- **Chú thích triển khai:** Thông tin bổ sung về cách triển khai test case

## Phạm vi test
- **JIRA Agent:** 5 test case kiểm tra các chức năng cơ bản của JIRA như tạo issue, cập nhật trạng thái, tìm kiếm, gán người dùng và lấy danh sách issue
- **Slack Agent:** 5 test case kiểm tra các chức năng cơ bản của Slack như gửi tin nhắn, tìm kiếm tin nhắn, tạo thread và thông báo trạng thái

## Thách thức đặc biệt
Qua quá trình kiểm thử, đã phát hiện một số thách thức đặc biệt cần lưu ý:

1. **Xử lý tiếng Việt:**
   - Khi sử dụng từ khóa tiếng Việt trong truy vấn JQL, cần mã hóa URL đúng cách
   - Cần sử dụng các hàm mã hóa URL chuẩn (như encodeURIComponent, urllib.parse.quote)

2. **Xử lý thời gian trong JQL:**
   - Các hàm JQL thời gian như startOfWeek() và endOfWeek() có thể không hoạt động như mong đợi
   - Nên chuẩn bị các phương án thay thế sử dụng ngày cụ thể hoặc điều kiện "is not EMPTY"

3. **Transition ID:**
   - Transition ID cho các trạng thái là cụ thể cho từng dự án
   - Cần gọi API lấy danh sách transitions trước khi thực hiện chuyển trạng thái

4. **Thay đổi assignee:**
   - Việc chuyển trạng thái có thể ảnh hưởng đến assignee của issue
   - Cần kiểm tra và điều chỉnh assignee sau khi thay đổi trạng thái nếu cần thiết

## Thực hiện test
Các test case nên được thực hiện theo trình tự từ đơn giản đến phức tạp để dễ dàng phát hiện và xử lý vấn đề. Khi thực hiện test, cần đánh giá:
1. Khả năng phân tích câu lệnh tiếng Việt của agent
2. Độ chính xác của các tham số API được trích xuất
3. Việc gọi đúng API endpoint với các tham số đã được chuẩn bị

## Tiêu chí đánh giá
- **Đạt:** Agent tạo đúng tham số API từ câu lệnh tiếng Việt và gọi đúng API endpoint
- **Không đạt:** Agent tạo sai tham số hoặc gọi sai API endpoint
- **Không áp dụng:** Test case không thể thực hiện do các yếu tố bên ngoài

## Tài liệu liên quan
- [Test Cases cho JIRA Agent](jira_agent_tests.md)
- [Test Cases cho Slack Agent](slack_agent_tests.md)
- [Ghi chú về triển khai](test_notes.md)
- [Tài liệu yêu cầu](../requirement_v1.md) 