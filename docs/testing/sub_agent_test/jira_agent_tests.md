# Test Cases cho JIRA Agent

Dự án: XDEMO2  
Domain: https://phuc-nt.atlassian.net

## Test Case 1: Tạo issue mới
**Mục tiêu:** Kiểm tra khả năng tạo issue mới trên JIRA và gán cho thành viên  
**Input (Câu lệnh tiếng Việt):**
```
Tạo một task JIRA mới với tiêu đề "Cập nhật tính năng đăng nhập", mô tả "Cần cập nhật lại API xác thực người dùng", priority cao, gán cho Phúc
```

**Expected API Flow:**
1. Tạo issue mới
2. Gán issue cho thành viên (separate API call)

**Expected API Params (Tạo issue):**
```json
{
  "fields": {
    "project": {
      "key": "XDEMO2"
    },
    "summary": "Cập nhật tính năng đăng nhập",
    "description": "Cần cập nhật lại API xác thực người dùng",
    "issuetype": {
      "name": "Task"
    },
    "priority": {
      "name": "High"
    }
  }
}
```

**API Endpoint (Tạo issue):**
- URL: `https://phuc-nt.atlassian.net/rest/api/2/issue`
- Method: POST

**Expected API Params (Gán issue):**
```json
{
  "accountId": "557058:24acce7b-a0c1-4f45-97f1-7eb4afd2ff5f"
}
```

**API Endpoint (Gán issue):**
- URL: `https://phuc-nt.atlassian.net/rest/api/2/issue/{issueKey}/assignee`
- Method: PUT
- Chú ý: {issueKey} phải được thay thế bằng key của issue vừa tạo (ví dụ: XDEMO2-7)

**Chú thích triển khai:**
- Agent cần phân tích câu lệnh tiếng Việt và trích xuất thông tin cho các trường cần thiết
- Trường priority cần được ánh xạ từ "cao" sang "High" trong JIRA
- Việc gán issue không thể thực hiện trong cùng API call tạo issue, cần gọi 2 API riêng biệt
- Cần lấy accountId của thành viên từ cấu hình dự án (project_config.json)
- Cần lưu lại issueKey từ kết quả API tạo issue để sử dụng trong API gán issue

## Test Case 2: Cập nhật trạng thái issue
**Mục tiêu:** Kiểm tra khả năng cập nhật trạng thái của issue hiện có  
**Input (Câu lệnh tiếng Việt):**
```
Cập nhật trạng thái của task XDEMO2-6 thành "In Progress"
```

**Expected API Flow:**
1. Lấy danh sách các transition khả dụng (optional)
2. Thực hiện transition

**Expected API Params (Lấy transitions - optional):**
Không cần tham số, chỉ cần gọi API GET

**API Endpoint (Lấy transitions - optional):**
- URL: `https://phuc-nt.atlassian.net/rest/api/2/issue/XDEMO2-6/transitions`
- Method: GET

**Expected API Params (Thực hiện transition):**
```json
{
  "transition": {
    "id": "11"
  }
}
```

**API Endpoint (Thực hiện transition):**
- URL: `https://phuc-nt.atlassian.net/rest/api/2/issue/XDEMO2-6/transitions`
- Method: POST
- Chú ý: XDEMO2-6 nên được thay thế bằng issue key thực tế cần cập nhật

**Chú thích triển khai:**
- Transition ID "11" cho "In Progress" là cụ thể cho dự án XDEMO2, có thể khác trong các dự án khác
- Nên gọi API GET transitions trước để xác định chính xác transition ID, đặc biệt khi làm việc với nhiều dự án
- Việc chuyển trạng thái có thể ảnh hưởng đến assignee của issue (ví dụ: tự động gán lại)

## Test Case 3: Tìm kiếm tin nhắn
**Mục tiêu:** Kiểm tra khả năng tìm kiếm và truy xuất thông tin tin nhắn trong channel  
**Input (Câu lệnh tiếng Việt):**
```
Tìm tất cả các tin nhắn có chứa từ khóa "đăng nhập" trong dự án XDEMO2
```

**Bot Token Scopes cần thiết:**
- `channels:history` - Cho phép bot xem tin nhắn trong các kênh công khai
- `channels:read` - Cho phép bot truy xuất danh sách các kênh công khai

**Expected API Params:**
```
channel=C08JFTGTN2K
limit=100 (hoặc số lượng tin nhắn cần tìm)
```

**API Endpoint:**
- URL: `https://slack.com/api/conversations.history`
- Method: GET
- Headers: `Authorization: Bearer xoxb-your-token`

**Chú thích triển khai:**
- Agent cần tạo câu truy vấn JQL (JIRA Query Language) từ câu lệnh tiếng Việt
- Cần xác định các trường dữ liệu cần lấy về (key, summary, status, assignee)
- **Quan trọng**: Khi tìm kiếm với từ khóa tiếng Việt hoặc có ký tự đặc biệt, cần phải mã hóa URL đúng cách
- Ví dụ: "đăng nhập" phải được mã hóa thành "%C4%91%C4%83ng%20nh%E1%BA%ADp" trong URL
- Có thể sử dụng các hàm chuẩn của ngôn ngữ lập trình để mã hóa URL (encodeURIComponent, urllib.parse.quote, v.v.)

## Test Case 4: Gán issue cho thành viên
**Mục tiêu:** Kiểm tra khả năng gán issue cho thành viên trong dự án  
**Input (Câu lệnh tiếng Việt):**
```
Gán task XDEMO2-6 cho Hưng
```

**Expected API Params:**
```json
{
  "accountId": "557058:8c1557f3-81f6-4479-a006-dd5e914a7c11"
}
```

**API Endpoint:**
- URL: `https://phuc-nt.atlassian.net/rest/api/2/issue/XDEMO2-6/assignee`
- Method: PUT
- Chú ý: XDEMO2-6 nên được thay thế bằng issue key thực tế cần gán

**Chú thích triển khai:**
- AccountId của Hưng ("557058:8c1557f3-81f6-4479-a006-dd5e914a7c11") được lấy từ cấu hình dự án
- Không thể gán người dùng bằng tên hoặc email, phải sử dụng accountId

## Test Case 5: Lấy danh sách issue được gán
**Mục tiêu:** Kiểm tra khả năng lấy danh sách issue đang được gán cho người dùng  
**Input (Câu lệnh tiếng Việt):**
```
Hiển thị tất cả các issue đang được gán cho Hưng với deadline trong tuần này
```

**Expected API Params:**
```
jql=assignee = "557058:8c1557f3-81f6-4479-a006-dd5e914a7c11" AND duedate >= startOfWeek() AND duedate <= endOfWeek()&fields=key,summary,status,duedate
```

**Alternative JQL Approaches:**
```
# Tìm với ngày cụ thể trong khoảng
jql=assignee = "557058:8c1557f3-81f6-4479-a006-dd5e914a7c11" AND duedate >= "2024-05-27" AND duedate <= "2024-06-02"

# Tìm tất cả issue có deadline (không rỗng)
jql=assignee = "557058:8c1557f3-81f6-4479-a006-dd5e914a7c11" AND duedate is not EMPTY
```

**API Endpoint:**
- URL: `https://phuc-nt.atlassian.net/rest/api/2/search`
- Method: GET

**Chú thích triển khai:**
- JQL sử dụng accountId của Hưng thay vì tên hiển thị
- Các hàm startOfWeek() và endOfWeek() là hàm JQL của JIRA, giúp xác định khoảng thời gian "tuần này"
- Agent cần chuyển đổi từ khái niệm thời gian tiếng Việt sang các hàm JQL tương ứng
- Nếu các hàm thời gian của JQL không hoạt động chính xác, có thể sử dụng các cách tiếp cận thay thế
- Nên xử lý trường hợp không tìm thấy issue nào (mảng issues rỗng) 