# CLAUDE.md - Hướng Dẫn Vận Hành Cho Media Render

Tài liệu hướng dẫn phát triển và vận hành dành cho các coding agent trên dự án `media-render`.

---

## 🛠️ Lệnh Chạy Dự Án (Commands)

### Lập Trình & Khởi Chạy
* **Cài đặt dependencies:** `bun install`
* **Khởi chạy HTTP API Server (Elysia):** `bun start` (hoặc `bun run src/index.ts`)
* **Kiểm tra kiểu dữ liệu (Typecheck):** `bun run tsc --noEmit`

### Chạy Các Bài Test (Test Suites)
* **Test Manifest tổng hợp:** `bun run test:render`
* **Test Video dọc 9:16 (Shorts/TikTok):** `bun run test:shorts`
* **Test Trình chiếu ảnh (Slideshow):** `bun run test:slideshow`
* **Test Video karaoke/lyrics:** `bun run test:lyrics`

*Tất cả tệp video kiểm thử được kết xuất ra thư mục `./test-outputs/`.*

---

## 📐 Quy Tắc Thiết Kế & Quy Chuẩn Lập Trình (Coding Guidelines)

### 1. Quản Lý Tài Nguyên C++ Native (NodeAV/FFmpeg)
* **Giải phóng bộ nhớ:** Bắt buộc sử dụng Native Explicit Resource Management `[Symbol.dispose]()` đối với tất cả các thực thể C++ của FFmpeg để tránh rò rỉ bộ nhớ nghiêm trọng trong vòng lặp render:
  * Đóng gói: `packet[Symbol.dispose]()`, `frame[Symbol.dispose]()`
  * Đóng decoder: `decoder[Symbol.dispose]()`
  * Đóng demuxer: `demuxer[Symbol.dispose]()`
  * Đóng encoder: `encoder[Symbol.dispose]()`
  * Đóng muxer: `await muxer.close()`, `muxer[Symbol.dispose]()`
* **Khởi tạo đối tượng:** Luôn gọi các hàm static bất đồng bộ mở tệp như `Demuxer.open(url)` và `Muxer.open(path)` thay vì sử dụng phương thức khởi tạo trực tiếp `.create(...)`.
* **Tham số thời gian:** Luôn dùng `av.Rational` cho timeBase, ví dụ: `new av.Rational(1, fps)`.

### 2. Vòng Lặp Xử Lý Đa Luồng Interleaved
* Để tránh lỗi *Double Generator Consumption* (sập tiến trình âm thanh khi kéo tuần tự video rồi mới kéo audio), bộ lọc đa luồng của FFmpeg Filter Complex phải được xử lý song song:
  * Lặp qua generator video chính: `for await (const videoFrame of complexFilter.frames(videoLabel, inputs))`
  * Bên trong vòng lặp video, liên tục kéo (pull) các audio frames có sẵn trong bộ đệm của filter:
    ```typescript
    while (true) {
      const audioFrame = await complexFilter.receive(audioLabel).catch(() => null);
      if (!audioFrame) break;
      // encode & write audio packets
      audioFrame[Symbol.dispose]();
    }
    ```

### 3. Thiết Kế Hàng Đợi & Stateless API
* **Stateless API:** `media-render` không quản lý hàng đợi hay lưu trạng thái. Nó nhận request HTTP POST `/render`, chạy render ngay lập tức và trả về đường dẫn file video.
* **Concurrency Guard:** Sử dụng biến môi trường `CONCURRENT_RENDER_LIMIT` để giới hạn số luồng xử lý song song. Khi quá tải, trả về `HTTP 429 Too Many Requests`.
* **Resource Guard:** Dùng `ResourceGuard` để giám sát dung lượng bộ nhớ RSS của tiến trình Bun, RAM hệ thống và CPU Load trước khi chạy tác vụ mới để tránh bị Docker OOMKilled. Khi quá tải tài nguyên, trả về `HTTP 503 Service Unavailable`.
