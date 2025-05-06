# Ghi chú về việc triển khai test case

## Mục đích của test case
Test case được thiết kế để kiểm tra khả năng của agent trong việc:
1. Phân tích câu lệnh tiếng Việt (ngôn ngữ tự nhiên) 
2. Trích xuất các thông tin quan trọng
3. Ánh xạ thông tin sang định dạng tham số API chính xác
4. Gọi đúng API endpoint với các tham số đã chuẩn bị

Mỗi test case mô tả câu lệnh đầu vào và các tham số API mong đợi, không tập trung vào kết quả trả về cuối cùng.

## Quản lý thông tin xác thực và cấu hình

### Thông tin xác thực (Authentication)
- Các token API và thông tin nhạy cảm được lưu trong file `.env`
- File `.env` đã được thêm vào `.gitignore` để tránh đưa lên repository
- Các biến môi trường được khai báo trong file cấu hình dự án (project_config.json)

### Thông tin thành viên
- AccountId của các thành viên dự án được lưu trong `docs/project_config.json`
- Agent nên sử dụng thông tin này thay vì gọi API tìm kiếm người dùng mỗi lần
- Format của accountId JIRA: `557058:8c1557f3-81f6-4479-a006-dd5e914a7c11`

## Test Case 1: Tạo issue mới

### Các điểm cần lưu ý khi triển khai
1. **Cấu trúc API request:**
   - Request cần được đóng gói trong trường `fields`
   - Các trường như `priority` và `project` cần được định nghĩa dưới dạng object thay vì string
   - Agent cần ánh xạ từ "cao" sang "High" trong trường priority

2. **Vấn đề với assignee:**
   - Không thể trực tiếp gán người dùng bằng email trong API call tạo issue
   - Cần thực hiện 2 API call riêng biệt:
     1. Tạo issue
     2. Gán issue cho người dùng bằng cách sử dụng accountId

3. **Kết quả API call mẫu:**
   - Khi tạo issue thành công, API trả về:
   ```json
   {
     "id": "10033",
     "key": "XDEMO2-5",
     "self": "https://phuc-nt.atlassian.net/rest/api/2/issue/10033"
   }
   ```

### Cú pháp curl mẫu
```bash
# Tạo issue
curl -X POST -H "Content-Type: application/json" -H "Authorization: Basic $(echo -n '$JIRA_EMAIL:$JIRA_API_TOKEN' | base64)" "https://phuc-nt.atlassian.net/rest/api/2/issue" -d '{"fields":{"project":{"key":"XDEMO2"},"summary":"Cập nhật tính năng đăng nhập","description":"Cần cập nhật lại API xác thực người dùng","issuetype":{"name":"Task"},"priority":{"name":"High"}}}'

# Gán issue cho người dùng
curl -X PUT -H "Content-Type: application/json" -H "Authorization: Basic $(echo -n '$JIRA_EMAIL:$JIRA_API_TOKEN' | base64)" "https://phuc-nt.atlassian.net/rest/api/2/issue/XDEMO2-6/assignee" -d '{"accountId":"557058:8c1557f3-81f6-4479-a006-dd5e914a7c11"}'
```

## Các vấn đề thường gặp

### 1. Xác thực và quyền truy cập
- Cần API token với đầy đủ quyền truy cập
- Phải xác thực qua Basic Auth với email và API token
- Token phải có quyền tạo/sửa issue trong dự án
- Sử dụng biến môi trường từ file `.env` cho bảo mật

### 2. Ánh xạ thông tin
- Agent cần có bảng ánh xạ từ các thuật ngữ tiếng Việt sang các giá trị tương ứng trong JIRA:
  - "priority cao" -> `"priority": {"name": "High"}`
  - "trạng thái In Progress" -> transition ID phù hợp
  - "tuần này" -> `duedate >= startOfWeek() AND duedate <= endOfWeek()`

### 3. Query JQL
- Các câu lệnh tìm kiếm cần được chuyển đổi thành JQL
- Cú pháp JQL phụ thuộc vào phiên bản JIRA
- Cần hiểu các hàm JQL cho các khái niệm thời gian như "tuần này", "tháng trước", v.v.
- **Quan trọng**: Khi tìm kiếm với từ khóa tiếng Việt, cần mã hóa URL đúng cách
- Các hàm thời gian JQL (startOfWeek, endOfWeek) có thể không hoạt động như mong đợi trong một số trường hợp, nên cung cấp các phương pháp thay thế

### 4. AccountId
- JIRA API hiện đại sử dụng accountId thay vì username
- Sử dụng accountId từ cấu hình dự án (project_config.json)
- Không cần gọi API tìm kiếm người dùng nếu đã có accountId trong cấu hình

## Khuyến nghị triển khai

1. **Xử lý ngôn ngữ tự nhiên:**
   - Tạo bộ từ điển thuật ngữ tiếng Việt - JIRA
   - Xác định các mẫu câu và cấu trúc thường gặp
   - Sử dụng LLM để trích xuất thông tin từ câu lệnh

2. **Xử lý tiếng Việt và mã hóa URL:**
   - Đảm bảo các từ khóa tiếng Việt được mã hóa URL đúng cách khi gửi API request
   - Sử dụng các hàm mã hóa URL chuẩn của ngôn ngữ lập trình (encodeURIComponent, urllib.parse.quote)
   - Kiểm tra kết quả trả về khi tìm kiếm với từ khóa tiếng Việt để đảm bảo độ chính xác

3. **Xử lý thời gian:**
   - Chuẩn bị các phương án thay thế cho các hàm JQL thời gian nếu chúng không hoạt động như mong đợi
   - Sử dụng các ngày cụ thể thay vì các hàm thời gian (ví dụ: "2024-05-27" thay vì startOfWeek())
   - Cân nhắc việc sử dụng điều kiện "is not EMPTY" để tìm tất cả các issue có deadline

4. **Xử lý lỗi:**
   - Kiểm tra thông tin đầu vào trước khi gọi API
   - Xử lý các trường hợp thiếu thông tin
   - Có cơ chế yêu cầu thông tin bổ sung khi cần

5. **Cache và lưu trữ:**
   - Sử dụng accountId từ cấu hình dự án thay vì gọi API tìm kiếm
   - Cache kết quả tìm kiếm nếu cần
   - Định kỳ cập nhật thông tin để đảm bảo tính chính xác 