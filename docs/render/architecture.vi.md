# Đặc tả Thiết kế: Bộ kết xuất dòng thời gian đồng nhất (Isomorphic Timeline Renderer)

Đặc tả thiết kế này chi tiết hóa luồng công việc, sơ đồ kiến trúc và cấu trúc mã nguồn được triển khai để chuyển đổi (port) công cụ kết xuất video/dòng thời gian phi tuyến tính từ phía client (`opencut-classic`) sang phía server (`media-render`).

Mục tiêu chính là **duy trì tương thích 100% về API signature (các Lớp, Hàm, Tham số) với client** để đảm bảo dễ dàng đồng bộ hóa, đồng thời thay thế các thành phần chỉ chạy trên trình duyệt (Canvas DOM, WebGL) bằng các thư viện tương đương chạy trên máy chủ (`@napi-rs/canvas`).

---

## 🎨 1. Kiến trúc Hệ thống Hình ảnh

### A. Sơ đồ So sánh: Xem trước trên Client (Client Preview) vs Kết xuất trên Server (Server Export)
Mã nguồn phía server loại bỏ hoàn toàn việc chờ đợi thời gian thực (real-time tick delays) và giới hạn tương tác DOM để đạt được hiệu suất kết xuất tối đa:

```mermaid
graph TB
    classDef clientClass fill:#2b3a4a,stroke:#3498db,stroke-width:2px,color:#fff;
    classDef serverClass fill:#2c3e50,stroke:#e74c3c,stroke-width:2px,color:#fff;
    classDef sharedClass fill:#1e272e,stroke:#2ecc71,stroke-width:2px,color:#fff;

    subgraph Client ["Xem trước trên Client"]
        A1["Timeline Editor UI"] --> A2("Vòng lặp Preview")
        A2 -->|Đợi đồng hồ hệ thống| A3("Trì hoãn thời gian thực 1/FPS")
        A3 -->|Vẽ khung hình| A4["HTML5 Canvas DOM"]
        A4 -->|Phát tiếng| A5["Browser AudioContext"]
    end

    subgraph Shared ["Timeline Manifest đồng nhất"]
        M1["Timeline JSON Manifest"]
        M2["Mediabunny API"]
    end

    subgraph Server ["Xuất Video trên Server"]
        B1[Tải trước tài nguyên] --> B2(Vòng lặp tua nhanh)
        B2 -->|Chạy tối đa công suất CPU| B3(Không trì hoãn thời gian)
        B3 -->|Dựng khung hình ảo| B4["@napi-rs/canvas 2D"]
        B4 -->|CanvasSource bắt khung hình| B5[CanvasSource]
        B6[NodeAV Audio Filter Complex] -->|Trộn PCM| B7[AudioSampleSource]
        B5 & B7 -->|Đóng gói Muxing| B8[Tệp Video đầu ra]
    end

    M1 -.->|Định nghĩa các drawing node| A1
    M1 -.->|Gửi lệnh kết xuất| B1
    M2 -.->|API đồng nhất| A2
    M2 -.->|API đồng nhất| B2

    class A1,A2,A3,A4,A5 clientClass;
    class B1,B2,B3,B4,B5,B6,B7,B8 serverClass;
    class M1,M2 sharedClass;
```

---

### B. Ánh xạ Công nghệ cốt lõi
Bảng ánh xạ chi tiết các thư viện trình duyệt sang các thư viện thay thế chạy trên server:

```mermaid
graph TB
    classDef clientClass fill:#2b3a4a,stroke:#3498db,stroke-width:2px,color:#fff;
    classDef serverClass fill:#2c3e50,stroke:#e74c3c,stroke-width:2px,color:#fff;
    classDef sharedClass fill:#1e272e,stroke:#2ecc71,stroke-width:2px,color:#fff;

    subgraph ClientRenderer ["Client - Browser Renderer"]
        C1["OffscreenCanvas"]
        C2["WebGL / WASM Compositing"]
        C3["WebCodecs / HTMLVideoElement"]
        C4["Browser Font Loading"]
    end

    subgraph SharedRenderer ["Thành phần đồng nhất"]
        S1["W3C Canvas 2D standard Context"]
        S2["CanvasSource API"]
    end

    subgraph ServerRenderer ["Server - Headless Renderer"]
        R1["@napi-rs/canvas virtual Canvas"]
        R2[Vẽ đồ họa bằng CPU qua Rust Skia]
        R3[VideoSampleSink Mediabunny]
        R4[RemoteFontLoader / Cache Disk]
    end

    %% Ánh xạ
    C1 <-->|Canvas vẽ ảo| R1
    C2 <-->|Xử lý đồ họa & hiệu ứng| R2
    C3 <-->|Giải mã Video| R3
    C4 <-->|Tải phông chữ| R4

    %% Giao diện hợp nhất
    S1 -.->|Standard Drawing API| C2
    S1 -.->|Standard Drawing API| R2
    S2 -.->|Tự động bắt khung hình| C1
    S2 -.->|Tự động bắt khung hình| R1

    class C1,C2,C3,C4 clientClass;
    class R1,R2,R3,R4 serverClass;
    class S1,S2 sharedClass;
```

---

## ⚙️ 2. Quy trình Vẽ chi tiết của Bộ Kết xuất

Cốt lõi của quá trình kết xuất nằm ở vòng lặp tua nhanh thời gian (Fast-Forward Loop) chạy độc lập với đồng hồ hệ thống:

1. **Khởi tạo Canvas ảo**: `media-render` khởi tạo một đối tượng Canvas ảo từ thư viện `@napi-rs/canvas` với kích thước được chỉ định bởi cấu hình `settings` của manifest.
2. **Khởi tạo nguồn hình ảnh (CanvasSource)**: Kết nối canvas ảo này với bộ mã hóa video của `Mediabunny`.
3. **Giải quyết node theo mốc thời gian**:
   - Tại mỗi bước thời gian $t = i / fps$, bộ quản lý duyệt qua cây Scene Graph (các Node như `VideoNode`, `TextNode`, `ImageNode`, `TransitionNode`).
   - Các thuộc tính hoạt ảnh keyframe được nội suy và áp dụng các phép dịch chuyển, co giãn, xoay và opacity xung quanh tọa độ tâm của mỗi node.
4. **Vẽ đè đồ họa**: Skia engine (Rust) biên dịch các lệnh vẽ Canvas 2D chuẩn W3C và lưu ảnh trực tiếp vào bộ đệm của canvas ảo.
5. **Đóng gói Video/Audio**: Bộ giải mã video bắt các khung hình này từ canvas, đồng thời lồng kênh âm thanh đã trộn từ FFmpeg `FilterComplex` để ghi trực tiếp xuống ổ đĩa.
