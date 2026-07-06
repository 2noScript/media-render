# Media Render Microservice

Dịch vụ vi mô (Microservice) chuyên biệt kết xuất video và đa phương tiện phi tuyến tính (**Non-linear Video/Media Renderer**). Dịch vụ được xây dựng trên nền tảng **Bun runtime**, **Elysia web framework** và **NodeAV** (FFmpeg C++ API native wrapper).

`media-render` hoạt động ở chế độ **Stateless API Worker**, tiếp nhận cấu trúc kịch bản timeline chuẩn **OpenCut** (`ProjectManifest`) qua HTTP API, thực thi dựng phim song song và trả về đường dẫn video kết quả ngay lập tức.

---

## 🚀 1. Tính Năng Nổi Bật

* **Dựng Timeline Phức Tạp (OpenCut Spec):** Hỗ trợ nối video, tự lấp khoảng trống (gap filling), chèn logo/sticker chồng lấn thời gian (Z-Index Overlays), vẽ phụ đề nhiều luồng chạy song song (`drawtext`), và trộn đa luồng âm thanh cùng hiệu ứng BGM/SFX (`amix`).
* **Không Trạng Thái (Stateless API):** Cực kỳ thích hợp cho việc scale-out (chạy nhiều pods song song). Backend NestJS chịu trách nhiệm quản lý hàng đợi và điều phối công việc.
* **Giới Hạn Concurrency (Tải Song Song):** Cấu hình giới hạn số tác vụ render chạy đồng thời qua `CONCURRENT_RENDER_LIMIT` trong tệp `.env`. Trả về mã lỗi `HTTP 429 Too Many Requests` khi bận.
* **Tự Chủ Bảo Vệ Tài Nguyên (Active Resource Guard):** Giám sát thời gian thực RAM hệ thống, RAM RSS của tiến trình Bun, và CPU Load trung bình. Tự động từ chối request bằng `HTTP 503 Service Unavailable` nếu tài nguyên vượt ngưỡng an toàn để phòng tránh container bị tắt đột ngột do tràn bộ nhớ (Docker OOMKilled).
* **Swagger UI Thống Nhất:** Cung cấp Swagger UI thông qua CDN phục vụ tại endpoint `/swagger` và raw spec JSON tại `/swagger/json`.
* **Health Check API:** Phục vụ Kubernetes/Docker Compose readiness & liveness probes tại endpoint `/health`.

---

## ⚙️ 2. Cấu Hình Biến Môi Trường (.env)

Tạo file `.env` tại thư mục gốc dựa trên mẫu `.env.example`:

| Khóa | Mặc định | Ý nghĩa |
| :--- | :--- | :--- |
| `PORT` | `3005` | Cổng HTTP Server của Elysia. |
| `CONCURRENT_RENDER_LIMIT` | `2` | Số lượng tác vụ render được xử lý song song tối đa cùng lúc. |
| `MAX_MEMORY_USAGE_PERCENT` | `85` | Ngưỡng % RAM hệ thống tối đa cho phép khởi chạy task mới (Nên đặt `99` khi phát triển local). |
| `MAX_PROCESS_MEMORY_MB` | `1536` | Giới hạn dung lượng RAM RSS tối đa tiến trình Bun được chiếm dụng (MB) để tránh bị Docker OOM. |
| `MAX_CPU_LOAD_RATIO` | `0.9` | Tỷ lệ tải CPU Load 1 phút trung bình trên mỗi nhân (0.9 = 90% load của toàn bộ CPU). |

---

## 🛠️ 3. Cài Đặt & Khởi Chạy Local

### Yêu Cầu Hệ Thống:
* Đã cài đặt **Bun** (phiên bản 1.1 hoặc 1.2+).
* Đã cài đặt thư viện FFmpeg C API (yêu cầu đối với NodeAV):
  * **macOS:** `brew install ffmpeg`
  * **Ubuntu/Linux:** `sudo apt-get install -y ffmpeg libavcodec-dev libavformat-dev libavutil-dev libswscale-dev libswresample-dev build-essential python3 pkg-config`

### Cài đặt Dependencies:
```bash
bun install
```

### Khởi chạy HTTP API Server:
```bash
bun start
```
* Server chạy tại: `http://localhost:3005`
* Swagger UI phục vụ tại: `http://localhost:3005/swagger`
* Health Check tại: `http://localhost:3005/health`

---

## 🧪 4. Bộ Kịch Bản Kiểm Thử Thể Loại Đa Dạng (Test Cases)

Chúng tôi cung cấp các bộ test case đại diện cho các thể loại video thực tế để kiểm tra và phát triển tính năng. Các file test tự động sử dụng assets local tải về tại `./test-assets/` để chạy ngoại tuyến (offline) với tốc độ cao:

1. **Test Manifest Tổng Hợp (Gaps, Overlays, Subtitles, Audio Mix):**
   ```bash
   bun run test:render
   ```
2. **Test Video Dọc 9:16 (Shorts/TikTok style với text ở giữa màn hình):**
   ```bash
   bun run test:shorts
   ```
3. **Test Video Trình Chiếu Ảnh (Slideshow dựng hoàn toàn từ ảnh tĩnh nối tiếp và nhạc nền):**
   ```bash
   bun run test:slideshow
   ```
4. **Test Video Phụ Đề / Karaoke / Lyric (Hình nền tĩnh chạy dài, nhạc nền và chữ lyrics hiển thị nối tiếp):**
   ```bash
   bun run test:lyrics
   ```

*Tất cả video thành phẩm được kết xuất ra thư mục `./test-outputs/` (đã được cấu hình tự động bỏ qua trong Git).*

---

## 🐳 5. Đóng Gói Với Docker Compose

Docker Compose giúp tự động tải đầy đủ dependencies của FFmpeg C API và đóng gói chạy ổn định trong container:

### Khởi chạy container ở chế độ nền (Detached mode):
```bash
docker compose up --build -d
```

### Xem logs:
```bash
docker compose logs -f
```

### Dừng container:
```bash
docker compose down
```

### Các cấu hình Docker tích hợp:
* **Docker Volume Mount:** Mount `./test-outputs` ra máy host để bạn dễ dàng lấy video kết xuất và mount `./test-assets` để chứa nguyên liệu test.
* **Docker Healthcheck:** Tự động thăm dò sức khỏe của container thông qua `/health` endpoint mỗi 15 giây.
