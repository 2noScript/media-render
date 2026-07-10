# Media Render Microservice

[English](README.md)

Microservice **kết xuất video phi tuyến tính (non-linear video renderer)** hiệu năng cao, không lưu trạng thái (stateless), được xây dựng trên môi trường chạy **Bun runtime** sử dụng **NodeAV** (kết nối FFmpeg gốc) và **@napi-rs/canvas** (thư viện Skia render hiệu năng cao). Dịch vụ này phân tích cấu trúc timeline manifest để xử lý xếp lớp, composite và xuất ra các tệp tin video/audio hoàn chỉnh.

---

## ⚡ Yêu cầu hệ thống
* Máy chủ của bạn phải cài đặt sẵn **FFmpeg**.

---

## 🚀 Khởi động nhanh (Chạy HTTP Server độc lập)

### 1. Chạy trực tiếp bằng CLI (Local Mode)
```bash
bun install
bun start
```
* **API Server**: `http://localhost:3005`
* **Swagger Docs**: `http://localhost:3005/docs`
* **Health Check**: `http://localhost:3005/health`

### 2. Chạy bằng Docker (Docker Mode)
Sử dụng môi trường được đóng gói sẵn chứa Bun, FFmpeg và các thư viện đồ họa Skia:
```bash
docker compose up --build -d  # Khởi động dịch vụ ở background
docker compose down           # Dừng dịch vụ
```

---

## 📦 Sử dụng như một Thư viện (Library)

Bạn có thể nhập trực tiếp core render vào dự án TypeScript/JavaScript của mình mà không cần chạy máy chủ HTTP độc lập:

```typescript
import { RenderService, Manifest } from "./src/index";

const renderService = new RenderService();

const manifest: Manifest = {
  id: "simple-example",
  settings: {
    width: 640,
    height: 360,
    fps: 30,
    format: "mp4",
    quality: "high",
    shouldIncludeAudio: false
  },
  tracks: {
    main: {
      id: "track-main",
      name: "Main Track",
      type: "video",
      isMain: true,
      muted: true,
      hidden: false,
      elements: [
        {
          id: "clip-1",
          type: "video",
          sourceUrl: "./test-assets/mov_bbb.mp4",
          startTime: 0,
          duration: 5.0,
          trimStart: 0,
          trimEnd: 0,
          params: { width: 640, height: 360 }
        }
      ]
    },
    audio: [],
    overlay: []
  }
};

const videoPath = await renderService.renderManifest(
  manifest,
  (progress) => console.log(`Tiến độ: ${progress}%`),
  "./test-outputs/output.mp4"
);
console.log(`Đã xuất video tại: ${videoPath}`);
```

---

## ⚙️ Cấu hình
Mọi biến môi trường (`PORT`, giới hạn tác vụ song song `CONCURRENT_RENDER_LIMIT`, giới hạn tài nguyên hệ thống) được ghi chi tiết tại tài liệu [Cấu hình & Biến môi trường (env.vi.md)](docs/env.vi.md).

---

## 📖 Mục lục Tài liệu kỹ thuật (Tiếng Việt)

Đặc tả chi tiết cấu trúc manifest, giải thuật dựng hình, quy tắc phân lớp Z-Index:

| Danh mục | Tài liệu chi tiết |
| :--- | :--- |
| **Manifest** | [Kiến trúc & Schema](docs/manifest/architecture.vi.md) • [Luồng xử lý Render](docs/manifest/flow.vi.md) • [Các ca mô phỏng](docs/manifest/simulation.vi.md) |
| **Tracks** | [Đặc tả Schema](docs/tracks/schema.vi.md) • [Cơ chế xếp lớp Z-Index](docs/tracks/layering.vi.md) |
| **Elements** | [Video](docs/elements/video.vi.md) • [Image](docs/elements/image.vi.md) • [Audio](docs/elements/audio.vi.md) • [Text](docs/elements/text.vi.md) • [Sticker](docs/elements/sticker.vi.md) • [Graphic](docs/elements/graphic.vi.md) • [Effect](docs/elements/effect.vi.md) • [Hiệu ứng chuyển cảnh (Transition)](docs/elements/transition.vi.md) |
| **Rendering** | [Thuật toán](docs/render/algorithms.vi.md) • [Thiết kế hệ thống](docs/render/architecture.vi.md) • [Danh sách hàm](docs/render/functions.vi.md) |

---

## 🧪 Chạy Kiểm thử (Testing)

Thực thi kiểm thử E2E kết xuất video với tài nguyên giả lập:

```bash
# Chạy tương tác một test hiệu ứng chuyển cảnh
bun run test:transition

# Chạy test phần tử hoặc khoảng trống dòng thời gian cụ thể
bun run test gaps
bun run test element:video

# Chạy tuần tự tất cả các kịch bản kiểm thử
bun run test:render && bun run test:gaps && bun run test:animations && bun run test:pip
```

Toàn bộ video kết xuất thử nghiệm sẽ được lưu tại thư mục `./test-outputs/`.
