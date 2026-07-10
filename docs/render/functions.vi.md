# Tài liệu tra cứu: Các Lớp và Hàm chức năng trong Bộ kết xuất

Tài liệu này cung cấp danh sách tra cứu chi tiết về tất cả các lớp cốt lõi, dịch vụ hỗ trợ và các hàm chức năng chính bên trong công cụ kết xuất video server-side `media-render`.

---

## 🗺️ Sơ đồ Phân hệ

Luồng xử lý kết xuất (rendering pipeline) được chia làm ba phân hệ chính:

```
                   ┌────────────────────────────────────────┐
                   │             exporter() loop            │
                   └──────────────────┬─────────────────────┘
                                      │
            ┌────────────────────────┼────────────────────────┐
            ▼                        ▼                        ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────┐
│     AssetRegistry     │ │    CanvasRenderer     │ │   AudioPipeline   │
│                       │ │                       │ │                   │
│ Quản lý tải trước và   │ │ Duyệt vòng lặp khung  │ │ Xử lý đồ thị trộn │
│ bộ đệm video decoder, │ │ hình và dựng cây      │ │ âm thanh (amix) & │
│ hình ảnh, phông chữ.  │ │ cấu trúc Scene Graph. │ │ xuất dữ liệu PCM. │
└───────────────────────┘ └──────────┬────────────┘ └───────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │     SkiaCompositor     │
                        │                        │
                        │ Đồng bộ các texture và │
                        │ vẽ tổng hợp lên canvas.│
                        └────────────────────────┘
```

---

## 1. CanvasRenderer (`src/core/renderer/canvas-renderer.ts`)

Quản lý giới hạn dòng thời gian, cấu hình kích thước và biên dịch Scene Graph (cây node đồ họa).

### `calculateDuration(manifest: EditorManifest): number`
*   **Mục đích**: Tính toán tổng thời lượng video (giây) của dự án dựa trên các phần tử trong track chính.
*   **Logic**: Duyệt qua track `main` và tính tổng thời gian phát của tất cả các phần tử trên đó.

### `render({ manifest, time }): Promise<void>`
*   **Mục đích**: Vẽ tổng hợp một khung hình duy nhất tại mốc thời gian chỉ định.
*   **Luồng chạy**: Tải tài nguyên cần thiết -> Dựng Scene Graph -> Tạo Frame Descriptor -> Đồng bộ hóa Textures -> Gọi Skia Compositor để vẽ đè các lớp hình ảnh theo Z-Index.

### `buildSceneGraph(manifest: EditorManifest): void`
*   **Mục đích**: Dựng lại cấu trúc cây Node trong bộ nhớ dựa trên trạng thái mới nhất của các track.

---

## 2. AssetRegistry (`src/core/renderer/asset-registry.ts`)

Quản lý tải trước tài nguyên bất đồng bộ, bộ nhớ đệm hình ảnh và tệp giải mã luồng video.

### `ensureAssetsLoaded(manifest: EditorManifest): Promise<void>`
*   **Mục đích**: Tải xuống các hình ảnh, sticker, đăng ký phông chữ từ xa và mở các bộ giải mã video trước khi bắt đầu vòng lặp xuất tệp video.
*   **Bộ nhớ lưu trữ**:
    - `imagesMap`: Lưu trữ các ảnh tĩnh và sticker đã tải.
    - `videoSinksMap`: Lưu luồng giải mã (`VideoSampleSink`) của các video đang phát.

### `dispose(): Promise<void>`
*   **Mục đích**: Giải phóng toàn bộ bộ nhớ và các đối tượng giải mã luồng video trong registry để tránh rò rỉ bộ nhớ (memory leaks).

---

## 3. AudioPipeline (`src/core/renderer/audio-pipeline.ts`)

Điều phối quá trình trộn nhiều kênh âm thanh song song bằng đồ thị FFmpeg FilterComplex API.

### `collectAudioClips(manifest: EditorManifest): any[]`
*   **Mục đích**: Quét dòng thời gian thu thập toàn bộ các tệp tin âm thanh (gồm cả nhạc nền BGM và tiếng gốc của các clip video phụ).

### `setupAudioMix(clips: any[]): Promise<void>`
*   **Mục đích**: Khởi tạo đồ thị trộn âm `amix` của FFmpeg để điều chỉnh âm lượng (`volume`), cắt ghép (`atrim`) và dịch chuyển thời gian phát (`adelay`).

### `pushAudioFrames(audioSource: any): Promise<void>`
*   **Mục đích**: Lấy dữ liệu đệm PCM từ đồ thị trộn âm và đẩy liên tục vào bộ ghi tệp video đầu ra.
