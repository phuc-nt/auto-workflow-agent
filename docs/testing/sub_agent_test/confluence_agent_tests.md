# Test Cases cho Confluence Agent

Tổ chức: T07UZEWG7A9  
Space Key: TX

## Test Case 1: Tạo trang Confluence mới
**Mục tiêu:** Kiểm tra khả năng tạo trang mới trong không gian làm việc chỉ định  
**Input (Câu lệnh tiếng Việt):**
```
Tạo trang Daily Report cho dự án XDEMO2 với tiêu đề "Daily Report - XDEMO2 Project - 24/03/2025"
```

**Expected API Params:**
```json
{
  "type": "page",
  "title": "Daily Report - XDEMO2 Project - 24/03/2025",
  "space": {
    "key": "TX"
  },
  "body": {
    "storage": {
      "value": "<h1>Daily Report - XDEMO2 Project - 24/03/2025</h1><p>Nội dung báo cáo hàng ngày của dự án XDEMO2.</p><h2>Các task đã hoàn thành</h2><ul><li>Task 1</li><li>Task 2</li></ul><h2>Vấn đề tồn đọng</h2><ul><li>Issue 1</li><li>Issue 2</li></ul><h2>Kế hoạch ngày mai</h2><ul><li>Plan 1</li><li>Plan 2</li></ul>",
      "representation": "storage"
    }
  }
}
```

**API Endpoint:**
- URL: `https://<your-domain>.atlassian.net/wiki/rest/api/content`
- Method: POST
- Headers: 
  - `Content-Type: application/json`
  - `Authorization: Basic <base64-encoded-credentials>`

**Chú thích triển khai:**
- Agent cần xác định space key từ cấu hình (TX)
- Tạo nội dung mẫu với cấu trúc cơ bản dựa vào loại báo cáo (Daily Report)
- Sử dụng đúng định dạng HTML cho nội dung trang
- Xác thực qua Basic Authentication với thông tin được mã hóa Base64 (username:api-token)

**Kết quả thực thi:**
```json
{
  "id": "4030466",
  "type": "page",
  "status": "current",
  "title": "Daily Report - XDEMO2 Project - 24/03/2025",
  "space": {
    "id": 131230,
    "key": "TX",
    "name": "Team X",
    "type": "collaboration",
    "status": "current",
    "_links": {
      "webui": "/spaces/TX",
      "self": "https://phuc-nt.atlassian.net/wiki/rest/api/space/TX"
    }
  },
  "history": {
    "latest": true,
    "createdBy": {
      "accountId": "557058:24acce7b-a0c1-4f45-97f1-7eb4afd2ff5f",
      "displayName": "Phúc Nguyễn"
    },
    "createdDate": "2025-04-03T14:02:55.475Z"
  },
  "version": {
    "number": 1
  },
  "body": {
    "storage": {
      "value": "<h1>Daily Report - XDEMO2 Project - 24/03/2025</h1><p>Nội dung báo cáo hàng ngày của dự án XDEMO2.</p><h2>Các task đã hoàn thành</h2><ul><li>Task 1</li><li>Task 2</li></ul><h2>Vấn đề tồn đọng</h2><ul><li>Issue 1</li><li>Issue 2</li></ul><h2>Kế hoạch ngày mai</h2><ul><li>Plan 1</li><li>Plan 2</li></ul>",
      "representation": "storage"
    }
  },
  "_links": {
    "webui": "/spaces/TX/pages/4030466/Daily+Report+-+XDEMO2+Project+-+24+03+2025",
    "self": "https://phuc-nt.atlassian.net/wiki/rest/api/content/4030466"
  }
}
```

**Phân tích kết quả:**
- Response trả về HTTP 200 OK
- Trang Confluence đã được tạo thành công với ID: 4030466
- Các thông tin như title, space key, nội dung được lưu đúng như yêu cầu
- Đường dẫn truy cập trang đã được tạo: `/spaces/TX/pages/4030466/Daily+Report+-+XDEMO2+Project+-+24+03+2025`
- Cần lưu ý: Khi tạo trang với tiêu đề đã tồn tại trong cùng không gian, API sẽ trả về lỗi 400 với thông báo "A page with this title already exists"

## Test Case 2: Tìm kiếm trang bằng CQL
**Mục tiêu:** Kiểm tra khả năng tìm kiếm trang Confluence dựa trên tiêu đề hoặc nội dung  
**Input (Câu lệnh tiếng Việt):**
```
Tìm kiếm tất cả các báo cáo Daily Report trong không gian TX
```

**Expected API Params:**
```
cql=space=TX AND title~"Daily Report"
limit=10
```

**API Endpoint:**
- URL: `https://<your-domain>.atlassian.net/wiki/rest/api/content/search`
- Method: GET
- Headers: 
  - `Authorization: Basic <base64-encoded-credentials>`

**Chú thích triển khai:**
- Sử dụng Confluence Query Language (CQL) để tìm kiếm
- Giới hạn số lượng kết quả trả về (limit=10) để tránh quá tải
- Có thể mở rộng tìm kiếm với các toán tử khác như AND, OR và các trường khác
- Mã hóa đúng các ký tự đặc biệt trong URL query

**Kết quả thực thi:**
```json
{
  "results": [
    {
      "id": "4030466",
      "type": "page",
      "status": "current",
      "title": "Daily Report - XDEMO2 Project - 24/03/2025",
      "_links": {
        "webui": "/spaces/TX/pages/4030466/Daily+Report+-+XDEMO2+Project+-+24+03+2025",
        "self": "https://phuc-nt.atlassian.net/wiki/rest/api/content/4030466",
        "tinyui": "/x/AoA9"
      }
    },
    {
      "id": "262390",
      "type": "page",
      "status": "current",
      "title": "Daily Report - XDEMO2 Project - 23/03/2025",
      "_links": {
        "webui": "/spaces/TX/pages/262390/Daily+Report+-+XDEMO2+Project+-+23+03+2025",
        "self": "https://phuc-nt.atlassian.net/wiki/rest/api/content/262390",
        "tinyui": "/x/9gAE"
      }
    }
  ],
  "start": 0,
  "limit": 10,
  "size": 2,
  "_links": {
    "self": "https://phuc-nt.atlassian.net/wiki/rest/api/content/search?cql=space%3dTX+AND+title~%22Daily+Report%22"
  }
}
```

**Phân tích kết quả:**
- Response trả về HTTP 200 OK
- Tìm thấy 2 trang phù hợp với tiêu chí tìm kiếm
- Kết quả bao gồm các trang với ID 4030466 (trang mới vừa tạo ở Test Case 1) và 262390
- Mỗi kết quả bao gồm thông tin cơ bản về trang và các đường dẫn để truy cập
- Cả hai trang đều có tiêu đề chứa "Daily Report" và thuộc không gian TX
- Kết quả phù hợp với điều kiện tìm kiếm đã chỉ định trong CQL

## Test Case 3: Đọc nội dung trang
**Mục tiêu:** Kiểm tra khả năng đọc và trích xuất nội dung trang Confluence  
**Input (Câu lệnh tiếng Việt):**
```
Đọc nội dung trang có ID 262390
```

**Expected API Params:**
```
id=262390
expand=body.storage
```

**API Endpoint:**
- URL: `https://<your-domain>.atlassian.net/wiki/rest/api/content/{id}`
- Method: GET
- Headers: 
  - `Authorization: Basic <base64-encoded-credentials>`

**Chú thích triển khai:**
- Cần chỉ định tham số expand=body.storage để lấy nội dung HTML của trang
- ID trang phải được trích xuất từ câu lệnh hoặc từ kết quả tìm kiếm trước đó
- Xử lý trường hợp ID không hợp lệ hoặc không có quyền truy cập

**Kết quả thực thi:**
```json
{
  "id": "262390",
  "type": "page",
  "status": "current",
  "title": "Daily Report - XDEMO2 Project - 23/03/2025",
  "body": {
    "storage": {
      "value": "<h1>Daily Report - XDEMO2 Project - 23/03/2025</h1><h3>23/03/2025</h3><p><strong>Win</strong></p><ol><li>Hoàn thành task XDEMO2-1: [Web UI] Cung cấp giao diện chat để nhập lệnh</li></ol><p><strong>Needs input</strong></p><ol><li>Cần thêm thông tin chi tiết về yêu cầu của task XDEMO2-4: [Web UI] Lưu lịch sử chat để tham khảo sau</li><li>Cần xác định mức độ ưu tiên cho các task còn lại</li></ol><p><strong>Focus</strong></p><ol><li>Tiếp tục triển khai task XDEMO2-2: [Web UI] Hiển thị kết quả dưới dạng văn bản có định dạng</li><li>Bắt đầu phân tích task XDEMO2-3: [Web UI] Hỗ trợ hiển thị trạng thái xử lý</li></ol><p><strong>Tổng quan trạng thái dự án</strong></p><table><tbody><tr><th>Task</th><th>Tiêu đề</th><th>Trạng thái</th></tr><tr><td>XDEMO2-1</td><td>[Web UI] Cung cấp giao diện chat để nhập lệnh</td><td>Done</td></tr><tr><td>XDEMO2-2</td><td>[Web UI] Hiển thị kết quả dưới dạng văn bản có định dạng</td><td>To Do</td></tr><tr><td>XDEMO2-3</td><td>[Web UI] Hỗ trợ hiển thị trạng thái xử lý</td><td>To Do</td></tr><tr><td>XDEMO2-4</td><td>[Web UI] Lưu lịch sử chat để tham khảo sau</td><td>To Do</td></tr></tbody></table><p><strong>Notes</strong></p><p>Dự án đang tiến triển đúng kế hoạch. Đã hoàn thành 1/4 task (25%). Cần tập trung vào việc hoàn thành các task còn lại theo thứ tự ưu tiên.</p><p><strong>Important Links</strong></p><ul><li><a href=\"https://phuc-nt.atlassian.net/browse/XDEMO2\">XDEMO2 Project in Jira</a></li><li><a href=\"https://phuc-nt.atlassian.net/browse/XDEMO2-1\">XDEMO2-1</a></li><li><a href=\"https://phuc-nt.atlassian.net/browse/XDEMO2-2\">XDEMO2-2</a></li><li><a href=\"https://phuc-nt.atlassian.net/browse/XDEMO2-3\">XDEMO2-3</a></li><li><a href=\"https://phuc-nt.atlassian.net/browse/XDEMO2-4\">XDEMO2-4</a></li></ul>",
      "representation": "storage"
    }
  },
  "_links": {
    "webui": "/spaces/TX/pages/262390/Daily+Report+-+XDEMO2+Project+-+23+03+2025",
    "self": "https://phuc-nt.atlassian.net/wiki/rest/api/content/262390"
  }
}
```

**Phân tích kết quả:**
- Response trả về HTTP 200 OK
- Đã truy xuất thành công nội dung trang với ID 262390
- Nội dung trang bao gồm HTML đã được định dạng đầy đủ với các tiêu đề, bảng và danh sách
- Trang chứa báo cáo Daily Report với các thành phần:
  - Các task đã hoàn thành (Win section)
  - Các vấn đề cần thêm thông tin (Needs input section)
  - Các nhiệm vụ ưu tiên (Focus section)
  - Bảng tổng quan trạng thái các task trong dự án
  - Ghi chú về tiến độ dự án
  - Các đường dẫn quan trọng đến Jira tickets
- Việc mở rộng với tham số expand=body.storage đã cung cấp đầy đủ nội dung HTML cần thiết

## Test Case 4: Cập nhật trang Confluence
**Mục tiêu:** Kiểm tra khả năng cập nhật nội dung trang đã tồn tại  
**Input (Câu lệnh tiếng Việt):**
```
Cập nhật trang có ID 262390, thêm task mới "Hoàn thành tính năng đăng nhập" vào phần "Các task đã hoàn thành"
```

**Expected API Params:**
```json
{
  "type": "page",
  "title": "Daily Report - XDEMO2 Project - 23/03/2025",
  "version": {
    "number": 2
  },
  "body": {
    "storage": {
      "value": "<h1>Daily Report - XDEMO2 Project - 23/03/2025</h1><p>Nội dung báo cáo hàng ngày của dự án XDEMO2.</p><h2>Các task đã hoàn thành</h2><ul><li>Task 1</li><li>Task 2</li><li>Hoàn thành tính năng đăng nhập</li></ul><h2>Vấn đề tồn đọng</h2><ul><li>Issue 1</li><li>Issue 2</li></ul><h2>Kế hoạch ngày mai</h2><ul><li>Plan 1</li><li>Plan 2</li></ul>",
      "representation": "storage"
    }
  }
}
```

**API Endpoint:**
- URL: `https://<your-domain>.atlassian.net/wiki/rest/api/content/{id}`
- Method: PUT
- Headers: 
  - `Content-Type: application/json`
  - `Authorization: Basic <base64-encoded-credentials>`

**Chú thích triển khai:**
1. **Quy trình 2 bước**:
   - Bước 1: GET trang hiện tại để lấy thông tin về phiên bản và nội dung
   - Bước 2: PUT để cập nhật trang với nội dung mới và số phiên bản tăng lên

2. **Xử lý phiên bản**:
   - Cần tăng số phiên bản lên 1 so với phiên bản hiện tại
   - Không tăng version sẽ gây lỗi 409 Conflict

3. **Xử lý nội dung**:
   - Phân tích cấu trúc HTML hiện tại để chèn nội dung mới vào đúng vị trí
   - Phải giữ nguyên các phần khác của trang

**Kết quả thực thi:**
```json
{
  "id": "262390",
  "type": "page",
  "status": "current",
  "title": "Daily Report - XDEMO2 Project - 23/03/2025",
  "space": {
    "id": 131230,
    "key": "TX",
    "name": "Team X",
    "type": "collaboration",
    "status": "current"
  },
  "version": {
    "number": 2,
    "by": {
      "accountId": "557058:24acce7b-a0c1-4f45-97f1-7eb4afd2ff5f",
      "displayName": "Phúc Nguyễn"
    },
    "when": "2025-04-03T16:00:34.139Z"
  },
  "body": {
    "storage": {
      "value": "<h1>Daily Report - XDEMO2 Project - 23/03/2025</h1><h3>23/03/2025</h3><p><strong>Win</strong></p><ol><li>Hoàn thành task XDEMO2-1: [Web UI] Cung cấp giao diện chat để nhập lệnh</li><li>Hoàn thành tính năng đăng nhập</li></ol>...",
      "representation": "storage"
    }
  },
  "_links": {
    "webui": "/spaces/TX/pages/262390/Daily+Report+-+XDEMO2+Project+-+23+03+2025",
    "self": "https://phuc-nt.atlassian.net/wiki/rest/api/content/262390"
  }
}
```

**Phân tích kết quả:**
- Response trả về HTTP 200 OK
- Trang đã được cập nhật thành công với phiên bản mới (version 2)
- Nội dung đã được cập nhật để thêm "Hoàn thành tính năng đăng nhập" vào phần "Win" (Các task đã hoàn thành)
- Quá trình cập nhật bao gồm hai bước:
  1. Trước tiên lấy thông tin phiên bản hiện tại (version 1)
  2. Sau đó gửi PUT request với phiên bản tăng lên 1 (version 2) và nội dung đã chỉnh sửa
- Cập nhật thành công cho thấy quy trình xử lý phiên bản và nội dung hoạt động đúng
- Cần lưu ý: việc không tăng số version sẽ dẫn đến lỗi 409 Conflict

## Test Case 5: Tạo báo cáo từ dữ liệu Jira
**Mục tiêu:** Kiểm tra khả năng tạo báo cáo Confluence từ dữ liệu Jira  
**Input (Câu lệnh tiếng Việt):**
```
Tạo báo cáo Sprint hiện tại cho dự án XDEMO2 trên Confluence
```

**Jira API Call (Bước 1):**
```
curl -X GET "https://phuc-nt.atlassian.net/rest/api/2/search?jql=project=XDEMO2" -H "Authorization: Basic {Base64 encoded credentials}" -H "Content-Type: application/json"
```

**Confluence API Params (Bước 2):**
```json
{
  "type": "page",
  "title": "Sprint Report - XDEMO2 Project - Sprint 1",
  "space": {
    "key": "TX"
  },
  "body": {
    "storage": {
      "value": "<h1>Sprint Report - XDEMO2 Project - Sprint 1</h1><p>Báo cáo tiến độ Sprint hiện tại của dự án XDEMO2.</p><h2>Tổng quan</h2><ul><li>Bắt đầu: 23/03/2025</li><li>Kết thúc: 05/04/2025</li><li>Tổng số task: 6</li><li>Hoàn thành: 1 (16.7%)</li><li>Đang thực hiện: 1 (16.7%)</li><li>Chưa bắt đầu: 4 (66.6%)</li></ul><h2>Task đã hoàn thành</h2><table><tbody><tr><th>Key</th><th>Summary</th><th>Assignee</th></tr><tr><td>XDEMO2-1</td><td>[Web UI] Cung cấp giao diện chat để nhập lệnh</td><td>Hung Nguyen</td></tr></tbody></table><h2>Task đang xử lý</h2><table><tbody><tr><th>Key</th><th>Summary</th><th>Assignee</th></tr><tr><td>XDEMO2-6</td><td>Cập nhật tính năng đăng nhập</td><td>Hung Nguyen</td></tr></tbody></table><h2>Task chưa bắt đầu</h2><table><tbody><tr><th>Key</th><th>Summary</th><th>Assignee</th></tr><tr><td>XDEMO2-2</td><td>[Web UI] Hiển thị kết quả dưới dạng văn bản có định dạng</td><td>Phúc Nguyễn</td></tr><tr><td>XDEMO2-3</td><td>[Web UI] Hỗ trợ hiển thị trạng thái xử lý</td><td>Phúc Nguyễn</td></tr><tr><td>XDEMO2-4</td><td>[Web UI] Lưu lịch sử chat để tham khảo sau</td><td>Phúc Nguyễn</td></tr><tr><td>XDEMO2-5</td><td>Cập nhật tính năng đăng nhập</td><td>Phúc Nguyễn</td></tr></tbody></table><h2>Vấn đề tồn đọng</h2><ul><li>Nhiều task chưa được bắt đầu, cần phân bổ nguồn lực hợp lý</li><li>Task XDEMO2-5 và XDEMO2-6 có nội dung trùng lặp, cần rà soát</li></ul><h2>Kế hoạch tiếp theo</h2><ul><li>Ưu tiên hoàn thành task XDEMO2-6</li><li>Triển khai song song các task UI còn lại</li><li>Rà soát và loại bỏ các task trùng lặp</li></ul>",
      "representation": "storage"
    }
  }
}
```

**API Endpoint (Confluence):**
- URL: `https://<your-domain>.atlassian.net/wiki/rest/api/content`
- Method: POST
- Headers: 
  - `Content-Type: application/json`
  - `Authorization: Basic <base64-encoded-credentials>`

**Chú thích triển khai:**
1. **Quy trình đa bước**:
   - Bước 1: Gọi Jira API để lấy thông tin Sprint hiện tại và các task trong Sprint
   - Bước 2: Phân tích dữ liệu và tạo báo cáo với định dạng HTML
   - Bước 3: Tạo trang Confluence mới với nội dung báo cáo

2. **Xác thực Jira và Confluence**:
   - Sử dụng cùng một cặp thông tin xác thực cho cả hai API
   - Thông tin được mã hóa Base64: `email:token`

3. **Xử lý dữ liệu Jira**:
   - Trích xuất thông tin Sprint (tên, ngày bắt đầu, kết thúc)
   - Phân loại task theo trạng thái (Done, In Progress, To Do)
   - Tính toán số liệu thống kê (tổng số task, tỷ lệ hoàn thành)

4. **Định dạng báo cáo Confluence**:
   - Sử dụng HTML table để hiển thị danh sách task
   - Tạo mục tổng quan với các thông tin chính về Sprint
   - Phân chia rõ ràng giữa các phần của báo cáo

**Kết quả thực thi:**
```json
{
  "id": "4161539",
  "type": "page",
  "status": "current",
  "title": "Sprint Report - XDEMO2 Project - Sprint 1",
  "space": {
    "id": 131230,
    "key": "TX",
    "name": "Team X",
    "type": "collaboration",
    "status": "current"
  },
  "history": {
    "latest": true,
    "createdBy": {
      "accountId": "557058:24acce7b-a0c1-4f45-97f1-7eb4afd2ff5f",
      "displayName": "Phúc Nguyễn"
    },
    "createdDate": "2025-04-03T16:07:34.556Z"
  },
  "version": {
    "number": 1
  },
  "body": {
    "storage": {
      "value": "<h1>Sprint Report - XDEMO2 Project - Sprint 1</h1><p>Báo cáo tiến độ Sprint hiện tại của dự án XDEMO2.</p><h2>Tổng quan</h2><ul><li>Bắt đầu: 23/03/2025</li><li>Kết thúc: 05/04/2025</li><li>Tổng số task: 6</li><li>Hoàn thành: 1 (16.7%)</li><li>Đang thực hiện: 1 (16.7%)</li><li>Chưa bắt đầu: 4 (66.6%)</li></ul>...",
      "representation": "storage"
    }
  },
  "_links": {
    "webui": "/spaces/TX/pages/4161539/Sprint+Report+-+XDEMO2+Project+-+Sprint+1",
    "self": "https://phuc-nt.atlassian.net/wiki/rest/api/content/4161539",
    "tinyui": "/x/A4A-/"
  }
}
```

**Phân tích kết quả:**
- Response trả về HTTP 200 OK
- Trang báo cáo Sprint đã được tạo thành công với ID: 4161539
- Quy trình tạo báo cáo đã thực hiện đầy đủ các bước:
  1. Lấy dữ liệu từ Jira API: tìm thấy 6 task thuộc dự án XDEMO2 với các trạng thái khác nhau
  2. Phân tích dữ liệu: phân loại task theo trạng thái (Done, In Progress, To Do)
  3. Tạo nội dung báo cáo dạng HTML với đầy đủ các thành phần
  4. Tạo trang Confluence với nội dung báo cáo
- Báo cáo bao gồm đầy đủ các phần:
  - Thông tin tổng quan về Sprint
  - Danh sách task đã hoàn thành (XDEMO2-1)
  - Danh sách task đang xử lý (XDEMO2-6)
  - Danh sách task chưa bắt đầu (XDEMO2-2, XDEMO2-3, XDEMO2-4, XDEMO2-5)
  - Vấn đề tồn đọng và kế hoạch tiếp theo
- Việc thực hiện thành công test case này cho thấy khả năng tích hợp dữ liệu từ Jira vào Confluence hoạt động tốt

## Các vấn đề thường gặp khi triển khai Confluence API

### 1. Xác thực và quyền truy cập
- Sử dụng Basic Authentication với email và API token
- API token phải có đủ quyền để đọc/ghi vào Confluence
- Không nên sử dụng mật khẩu thông thường, chỉ sử dụng API token
- Lưu trữ thông tin xác thực an toàn trong file `.env`

### 2. Quản lý phiên bản trang
- Khi cập nhật trang, cần tăng version number lên 1 so với phiên bản hiện tại
- Lỗi phổ biến: 409 Conflict khi không tăng version number
- Luôn GET trang hiện tại trước khi PUT để cập nhật

### 3. Xử lý nội dung HTML
- Nội dung trang Confluence được lưu dưới dạng HTML
- Cần xử lý cẩn thận khi chèn hoặc sửa đổi nội dung HTML
- Sử dụng thư viện xử lý HTML như cheerio (Node.js) hoặc BeautifulSoup (Python)
- Đảm bảo mã HTML hợp lệ để tránh lỗi khi hiển thị

### 4. Tích hợp với Jira
- Khi tạo báo cáo từ dữ liệu Jira, cần xử lý các trường hợp không có dữ liệu
- Sử dụng JQL (Jira Query Language) để lọc chính xác dữ liệu cần thiết
- Tạo link trực tiếp đến các issue Jira trong báo cáo
- Xử lý các trạng thái task khác nhau một cách phù hợp

### 5. Rate Limiting và Performance
- Confluence API có giới hạn số lượng request trong một khoảng thời gian
- Triển khai cơ chế chờ và thử lại khi gặp lỗi 429 Too Many Requests
- Cache kết quả tìm kiếm và thông tin trang để giảm số lượng request
- Sử dụng batch request khi có thể để giảm số lượng API call

### 6. Xử lý ký tự đặc biệt
- Mã hóa đúng cách các ký tự đặc biệt trong URL query
- Xử lý các ký tự HTML trong nội dung trang (< > &)
- Đảm bảo hỗ trợ Unicode cho tiếng Việt trong nội dung trang
- Sử dụng encodeURIComponent cho các tham số URL

### 7. Xử lý lỗi
- Triển khai retry logic cho lỗi tạm thời (5xx)
- Xử lý phù hợp cho lỗi xác thực (401) và quyền truy cập (403)
- Log đầy đủ thông tin lỗi để dễ dàng debug
- Thông báo rõ ràng cho người dùng khi có lỗi xảy ra 