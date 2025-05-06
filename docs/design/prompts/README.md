# Thiết kế Prompt và Function Definitions

Thư mục này chứa các tài liệu định nghĩa prompt và function definitions được sử dụng để giao tiếp với các mô hình LLM trong hệ thống. Mục đích là chuẩn hóa cách tương tác với LLM để đảm bảo kết quả nhất quán và theo cấu trúc mong muốn.

## Danh sách tài liệu

- **`central_agent_prompts.md`** - Định nghĩa prompt và function definitions cho Central Agent, bao gồm:
  - System prompts cho Input Processor, Action Planner, và Result Synthesizer
  - User message templates
  - Function definitions cho tương tác với OpenAI API
  - Ví dụ về kết quả mong muốn
  - Kỹ thuật tối ưu prompt

## Mục tiêu thiết kế prompt

- Đảm bảo giao tiếp hiệu quả với các mô hình LLM
- Định hướng mô hình tạo ra kết quả theo cấu trúc cần thiết
- Tối ưu hóa sử dụng tokens và chi phí API
- Chuẩn hóa cách thức các thành phần tương tác với LLM
- Thiết lập best practices cho việc sử dụng LLM trong hệ thống

## Cách sử dụng tài liệu này

Tài liệu trong thư mục này cung cấp hướng dẫn cụ thể cho developers về:
- Cách xây dựng prompt để giao tiếp với LLM
- Cách sử dụng function calling với OpenAI API
- Các strategy để xử lý khi LLM trả về kết quả không mong muốn
- Pattern và template chuẩn cho từng thành phần của hệ thống 