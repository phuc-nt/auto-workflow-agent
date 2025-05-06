# Test Cases cho Slack Agent

Tổ chức: T07UZEWG7A9  
Kênh dự án: C08JFTGTN2K

## Test Case 1: Gửi tin nhắn đến channel
**Mục tiêu:** Kiểm tra khả năng gửi tin nhắn đến channel dự án  
**Input (Câu lệnh tiếng Việt):**
```
Gửi tin nhắn đến channel dự án với nội dung "Xin chào team, tôi vừa hoàn thành tính năng đăng nhập. Mọi người có thể kiểm tra tại branch feature/login"
```

**Expected API Params:**
```json
{
  "channel": "C08JFTGTN2K",
  "text": "Xin chào team, tôi vừa hoàn thành tính năng đăng nhập. Mọi người có thể kiểm tra tại branch feature/login"
}
```

**API Endpoint:**
- URL: `https://slack.com/api/chat.postMessage`
- Method: POST
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
- Agent cần xác định kênh dự án từ cấu hình dự án (C08JFTGTN2K)
- Không cần xử lý đặc biệt cho nội dung tin nhắn, chỉ cần trích xuất từ câu lệnh

## Test Case 2: Gửi tin nhắn riêng tư
**Mục tiêu:** Kiểm tra khả năng gửi tin nhắn riêng tư đến thành viên  
**Input (Câu lệnh tiếng Việt):**
```
Gửi tin nhắn cho Hưng với nội dung "Xin chào Hưng, bạn có thể review PR #1234 không?"
```

**Expected API Params:**
```json
{
  "channel": "U12345678",
  "text": "Xin chào Hưng, bạn có thể review PR #1234 không?"
}
```

**API Endpoint:**
- URL: `https://slack.com/api/chat.postMessage`
- Method: POST
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
- Agent cần tìm user ID của "Hưng" từ tên người dùng (cần gọi API user.lookupByEmail hoặc users.list trước)
- Sau khi có user ID, sử dụng ID đó làm giá trị cho trường "channel"
- Cần lưu trữ mapping giữa tên thành viên và user ID

## Test Case 3: Tìm kiếm tin nhắn
**Mục tiêu:** Kiểm tra khả năng tìm kiếm tin nhắn trong lịch sử chat  
**Input (Câu lệnh tiếng Việt):**
```
Tìm kiếm các tin nhắn có chứa từ khóa "đăng nhập" trong channel dự án từ tuần trước
```

**Bot Token Scopes cần thiết:**
- `channels:history` - Cho phép bot xem tin nhắn trong các kênh công khai
- `channels:read` - Cho phép bot truy xuất danh sách các kênh công khai

**Expected API Params:**
```
channel=C08JFTGTN2K
limit=100
oldest=1728000000 (timestamp của tuần trước)
```

**API Endpoint:**
- URL: `https://slack.com/api/conversations.history`
- Method: GET
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
- Sử dụng `conversations.history` API để lấy danh sách tin nhắn từ channel
- Lọc tin nhắn có chứa từ khóa "đăng nhập" tại phía client
- Có thể giới hạn khoảng thời gian tìm kiếm bằng tham số `oldest` và `latest`
- Hỗ trợ phân trang với tham số `limit` và `cursor`
- Không cần mã hóa URL cho từ khóa tiếng Việt trong xử lý lọc
- Để tìm tin nhắn từ "tuần trước", tính toán timestamp tương ứng và đặt vào tham số `oldest`
- Nên lưu trữ channel ID trong file cấu hình dự án thay vì hardcode

**Ví dụ Response thành công:**
```json
{
  "ok": true,
  "messages": [
    {
      "type": "message",
      "user": "U08JYGLUU5Q",
      "text": "Xin chào team, tôi vừa hoàn thành tính năng đăng nhập. Mọi người có thể kiểm tra tại branch feature/login",
      "ts": "1743521681.704129"
    }
  ],
  "has_more": false
}
```

## Test Case 4: Tạo thread mới
**Mục tiêu:** Kiểm tra khả năng tạo thread từ tin nhắn  
**Input (Câu lệnh tiếng Việt):**
```
Trả lời tin nhắn có ID "1616734022.000400" trong channel dự án với nội dung "Đã sửa xong các lỗi, mọi người có thể kiểm tra lại"
```

**Expected API Params:**
```json
{
  "channel": "C08JFTGTN2K",
  "thread_ts": "1616734022.000400",
  "text": "Đã sửa xong các lỗi, mọi người có thể kiểm tra lại"
}
```

**API Endpoint:**
- URL: `https://slack.com/api/chat.postMessage`
- Method: POST
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
- Agent cần trích xuất ID tin nhắn (thread_ts) từ câu lệnh
- ID kênh phải được xác định từ cấu hình dự án
- thread_ts phải là ID tin nhắn hợp lệ trong kênh

## Test Case 5: Thông báo trạng thái task
**Mục tiêu:** Kiểm tra khả năng thông báo trạng thái task lên Slack  
**Input (Câu lệnh tiếng Việt):**
```
Thông báo lên channel dự án rằng task XDEMO2-6 đã được chuyển sang trạng thái "Done"
```

**Bot Token Scopes cần thiết:**
- `chat:write` - Cho phép bot gửi tin nhắn
- `chat:write.customize` - Cho phép bot tùy chỉnh tên và icon (tùy chọn)

**Jira API Call (Bước 1):**
```
curl -X GET "https://phuc-nt.atlassian.net/rest/api/2/issue/XDEMO2-6" -H "Authorization: Basic {Base64 encoded credentials}" -H "Content-Type: application/json"
```

**Slack API Params (Bước 2):**
```json
{
  "channel": "C08JFTGTN2K",
  "text": "📢 Thông báo: Task XDEMO2-6 đã được chuyển sang trạng thái Done",
  "attachments": [
    {
      "title": "XDEMO2-6: Cập nhật tính năng đăng nhập",
      "title_link": "https://phuc-nt.atlassian.net/browse/XDEMO2-6",
      "text": "Assignee: Hung Nguyen\nStatus: Done",
      "color": "#36a64f"
    }
  ]
}
```

**API Endpoint (Slack):**
- URL: `https://slack.com/api/chat.postMessage`
- Method: POST
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
1. **Quy trình 2 bước**:
   - Bước 1: Gọi Jira API để lấy thông tin chi tiết về task
   - Bước 2: Sử dụng thông tin từ Jira để tạo thông báo trên Slack

2. **Xác thực Jira**:
   - Sử dụng basic authentication với email và API token
   - Token được lưu trữ an toàn trong file `.env` và được mã hóa Base64: `email:token`

3. **Xử lý dữ liệu**:
   - Trích xuất các trường quan trọng từ phản hồi Jira: key, summary, status, assignee
   - Tạo URL trực tiếp đến issue: `https://phuc-nt.atlassian.net/browse/{key}`

4. **Định dạng thông báo**:
   - Cần sử dụng màu phù hợp với trạng thái:
     - `#36a64f` (xanh lá) cho "Done"
     - `#0052cc` (xanh dương) cho "In Progress"
     - `#ff9900` (cam) cho "To Do"
   - Khi không có assignee, hiển thị "Unassigned" thay vì để trống

**Ví dụ Response thành công:**
```json
{
  "ok": true,
  "channel": "C08JFTGTN2K",
  "ts": "1743523080.134639",
  "message": {
    "user": "U08JYGLUU5Q",
    "type": "message",
    "text": "📢 Thông báo: Task XDEMO2-6 đã được chuyển sang trạng thái Done",
    "attachments": [
      {
        "color": "36a64f",
        "title": "XDEMO2-6: Cập nhật tính năng đăng nhập",
        "title_link": "https://phuc-nt.atlassian.net/browse/XDEMO2-6",
        "text": "Assignee: Hung Nguyen\nStatus: Done"
      }
    ]
  }
}
```

**Lưu ý quan trọng**:
- Đảm bảo bot có quyền truy cập cả Jira API và Slack API
- Cần xử lý lỗi nếu issue không tồn tại trên Jira
- Nên cache thông tin issue khi gọi nhiều lần để tránh quá tải API

## Các vấn đề thường gặp khi triển khai Slack API

### 1. Xác thực và quyền truy cập
- Token Bot phải có đủ quyền (scopes) tương ứng với các API gọi
- Các scopes phổ biến: `chat:write`, `search:read`, `users:read`, `channels:history`, `channels:read`
- Token được lưu trữ an toàn trong file `.env`
- **Lưu ý**: API `search.messages` thường yêu cầu User Token, không phải Bot Token, nên cần lựa chọn phương pháp thay thế như `conversations.history`

### 2. Xử lý ID và tên
- Channel có thể được tham chiếu bằng ID (C08JFTGTN2K) hoặc tên (#project-channel)
- User có thể được tham chiếu bằng ID (U12345678) hoặc email
- Nên cache mapping giữa tên và ID để tránh gọi API lookup quá nhiều
- ID của user có thể thay đổi giữa các workspace, nên cần lưu trữ ID theo workspace

### 3. Định dạng tin nhắn
- Slack hỗ trợ nhiều loại định dạng: plain text, mrkdwn, blocks, attachments
- Attachment đang dần bị thay thế bởi Block Kit, có thể cân nhắc sử dụng Block Kit trong các triển khai mới
- Cần escape các ký tự đặc biệt trong tin nhắn: `&`, `<`, `>`
- Tiếng Việt được hỗ trợ tốt, nhưng cần đảm bảo encoding UTF-8 trong các request

### 4. Tích hợp với Jira
- Khi thông báo về task Jira, cần gọi Jira API trước để lấy thông tin chi tiết
- Sử dụng cùng một token Jira đã cấu hình trong file `.env`
- Tạo link trực tiếp đến task Jira để người dùng có thể truy cập nhanh
- Xử lý trường hợp task không tồn tại hoặc không có quyền truy cập

### 5. Rate Limiting và Performance
- Slack API có giới hạn số lượng request trong một khoảng thời gian (Tier 1: 1 request/giây)
- Khi gọi nhiều API cùng lúc, cần xử lý rate limiting bằng cách triển khai hàng đợi và delay
- Nên cache kết quả của các API ít thay đổi như `users.list` hoặc `conversations.list`
- Sử dụng cursor-based pagination khi làm việc với lượng dữ liệu lớn

### 6. Xử lý lỗi
- API có thể trả về lỗi như `channel_not_found`, `not_in_channel`, `not_allowed_token_type`
- Triển khai retry logic cho lỗi tạm thời và xử lý phù hợp cho lỗi vĩnh viễn
- Kiểm tra `ok` field trong response để xác nhận request thành công
- Log đầy đủ thông tin lỗi để dễ dàng debug

### 7. Threading và Conversation Management
- Sử dụng `thread_ts` để trả lời trong thread đúng cách
- Theo dõi các cuộc hội thoại đang diễn ra có thể yêu cầu lưu trữ state
- Nên thiết kế luồng hội thoại rõ ràng để tránh nhầm lẫn giữa tin nhắn trong thread và channel chính 