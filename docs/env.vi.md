# Cấu hình & Biến môi trường

Tài liệu này mô tả các biến môi trường có sẵn để cấu hình microservice `media-render`.

Để tùy chỉnh môi trường của bạn:
1. Sao chép `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
2. Điều chỉnh các giá trị bên dưới để phù hợp với hiệu năng máy chủ của bạn.

## Danh sách các biến cấu hình

| Biến | Giá trị mặc định | Mô tả |
| :--- | :--- | :--- |
| `PORT` | `3005` | Cổng HTTP mà máy chủ Elysia lắng nghe các yêu cầu. |
| `BACKEND_URL` | `http://localhost:4000` | Endpoint của backend chính để gọi callback hoặc báo cáo tiến trình. |
| `CONCURRENT_RENDER_LIMIT` | `2` | Số lượng tác vụ render song song tối đa được phép chạy cùng lúc. |
| `MAX_MEMORY_USAGE_PERCENT` | `99` | Ngưỡng phần trăm bộ nhớ hệ thống (RAM) tối đa để chấp nhận các yêu cầu render mới. |
| `MAX_PROCESS_MEMORY_MB` | `1536` | Bộ nhớ RAM thực tế (RSS MB) tối đa mà Bun tiến trình có thể dùng trước khi từ chối tác vụ mới. |
| `MAX_CPU_LOAD_RATIO` | `0.9` | Tỉ lệ tải CPU trung bình trong 1 phút tối đa được phép (ví dụ: `0.9` = `90%` số nhân CPU bận rộn). |
