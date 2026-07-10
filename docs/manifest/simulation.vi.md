# Mô phỏng Dòng thời gian: Từ JSON Manifest đến Video Đầu Ra

Tài liệu này mô tả kịch bản mô phỏng kết xuất một dòng thời gian video hoàn chỉnh (đoạn clip quảng cáo dài 5 giây), đồng thời theo dõi từng bước dựng hình chi tiết tại một mốc thời gian cụ thể để làm rõ quy trình kết xuất và phân lớp.

---

## 📅 1. Thiết lập Dòng thời gian (Timeline)

Chúng ta muốn kết xuất một **video dài 5 giây** (Độ phân giải: 1280x720, 30 FPS). Cách xếp lớp các track từ trên xuống dưới (Z-Index từ cao xuống thấp) được cấu trúc như sau:

```
Dòng thời gian:      0s ──────────────────────── 2.5s ──────────────────────── 5s
[Z-Index 4: Trên cùng] ✨ Hiệu ứng Vignette (Bộ lọc)   [Đặt trong: tracks.overlay] ───────────────────────────
[Z-Index 3: Cao]       💬 Văn bản Phụ đề Subtitle      [Đặt trong: tracks.overlay] ━━━━ (2s - 4s) ━━━━
[Z-Index 2: Trung]     🏷️ Nhãn dán Logo Sticker        [Đặt trong: tracks.overlay] ━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Z-Index 1: Dưới cùng] 🎬 Clip Video nền chính          [Đặt trong: tracks.main]    ───────────────────────────
[Âm thanh: Không Z]    🎵 Nhạc nền BGM Audio           [Đặt trong: tracks.audio]   ───────────────────────────
```

### JSON Manifest Payload:
```json
{
  "id": "promo-timeline-simulation",
  "settings": {
    "width": 1280,
    "height": 720,
    "fps": 30,
    "format": "mp4",
    "shouldIncludeAudio": true
  },
  "tracks": {
    "main": {
      "id": "track-main-video",
      "name": "Main Track",
      "type": "video",
      "isMain": true,
      "muted": false,
      "hidden": false,
      "elements": [
        {
          "id": "video-bg",
          "type": "video",
          "startTime": 0.0,
          "duration": 5.0,
          "trimStart": 10.0,
          "trimEnd": 0,
          "sourceUrl": "./test-assets/mov_bbb.mp4",
          "params": {
            "volume": 0.5,
            "width": 800,
            "height": 600,
            "transform.positionX": 0,
            "transform.positionY": 0,
            "blurIntensity": 15
          }
        }
      ]
    },
    "audio": [
      {
        "id": "track-audio-bgm",
        "name": "BGM Track",
        "type": "audio",
        "elements": [
          {
            "id": "music-beat",
            "type": "audio",
            "startTime": 0.0,
            "duration": 5.0,
            "trimStart": 0,
            "trimEnd": 0,
            "sourceUrl": "./test-assets/synth_bgm.mp3",
            "params": {
              "volume": 0.4,
              "muted": false
            }
          }
        ]
      }
    ],
    "overlay": [
      {
        "id": "track-effect-layers",
        "name": "Filter Track",
        "type": "effect",
        "hidden": false,
        "elements": [
          {
            "id": "effect-vignette",
            "type": "effect",
            "startTime": 0.0,
            "duration": 5.0,
            "effectType": "vignette",
            "params": {
              "color": "black",
              "intensity": 0.7
            }
          }
        ]
      },
      {
        "id": "track-text-subtitles",
        "name": "Subtitle Track",
        "type": "text",
        "hidden": false,
        "elements": [
          {
            "id": "sub-1",
            "type": "text",
            "startTime": 2.0,
            "duration": 2.0,
            "params": {
              "content": "Chào mừng các bạn!",
              "fontSize": 48,
              "color": "#FFFFFF",
              "fontFamily": "Roboto",
              "textAlign": "center",
              "strokeColor": "#000000",
              "strokeWidth": 4,
              "transform.positionX": 0,
              "transform.positionY": 240
            }
          }
        ]
      },
      {
        "id": "track-overlay-stickers",
        "name": "Sticker Track",
        "type": "graphic",
        "hidden": false,
        "elements": [
          {
            "id": "sticker-logo",
            "type": "sticker",
            "stickerId": "brand_logo",
            "startTime": 1.0,
            "duration": 4.0,
            "params": {
              "transform.positionX": 410,
              "transform.positionY": -210,
              "transform.scaleX": 1.0,
              "transform.scaleY": 1.0
            },
            "animations": {
              "transform.opacity": [
                { "time": 0, "value": 0.0 },
                { "time": 1.0, "value": 1.0 }
              ]
            }
          }
        ]
      }
    ]
  }
}
```

---

## 🎯 2. Quy trình Kết xuất Khung hình tại giây $t = 2.5\text{s}$

Đây là chuỗi các bước chi tiết mà bộ kết xuất (rendering engine) thực hiện để dựng và vẽ khung hình tại giây thứ $2.5$:

### Bước 1: Trích lọc phần tử hoạt động (Temporal Filtering)
Hệ thống kiểm tra điều kiện thời gian hoạt động của mọi phần tử trên tất cả các track tại $t = 2.5\text{s}$:
- **`effect-vignette`**: $0.0 \le 2.5 < 5.0 \implies$ **Hoạt động**.
- **`sub-1`**: $2.0 \le 2.5 < 4.0 \implies$ **Hoạt động**.
- **`sticker-logo`**: $1.0 \le 2.5 < 5.0 \implies$ **Hoạt động**.
- **`video-bg`**: $0.0 \le 2.5 < 5.0 \implies$ **Hoạt động**.
- **`music-beat`**: $0.0 \le 2.5 < 5.0 \implies$ **Hoạt động (Trộn âm)**.

---

### Bước 2: Phân cấp Z-Index xếp chồng (Z-Index Sorting)
Hệ thống tiến hành sắp xếp các node hình ảnh vào đồ thị vẽ từ dưới lên trên:
1. **Lớp lót nền Backdrop (Z-Index = 0)**: Được tạo tự động do video `video-bg` có tham số `blurIntensity: 15` $\implies$ Tạo ra `BlurBackgroundNode`.
2. **Lớp Video chính (Z-Index = 1)**: Khung hình video chính `video-bg` (nằm trong `tracks.main`).
3. **Lớp Sticker Logo (Z-Index = 2)**: Nhãn dán `sticker-logo` (nằm ở track overlay thứ ba trong danh sách overlay).
4. **Lớp Text Subtitle (Z-Index = 3)**: Văn bản `sub-1` (nằm ở track overlay thứ hai trong danh sách overlay).
5. **Lớp Vignette Effect (Z-Index = 4)**: Hiệu ứng lọc hình ảnh đè lên trên cùng của màn hình (nằm ở track overlay đầu tiên trong danh sách overlay).

*(Lưu ý: Mảng `overlay` được duyệt đảo ngược để vẽ track phụ đề/văn bản sau cùng, đảm bảo phụ đề luôn nằm trên tất cả các lớp hình ảnh khác).*

---

### Bước 3: Nội suy giá trị hoạt ảnh Keyframe
Tại thời điểm $t = 2.5\text{s}$, thời gian cục bộ (local clip time) của nhãn dán `sticker-logo` là $t_{\text{local}} = 2.5 - 1.0 = 1.5\text{s}$.
- Cấu hình hoạt ảnh cho `transform.opacity`:
  - Khóa $K_1$ tại $0\text{s}$: giá trị `0.0`.
  - Khóa $K_2$ tại $1.0\text{s}$: giá trị `1.0`.
- Vì thời điểm cục bộ $t_{\text{local}} = 1.5\text{s}$ lớn hơn mốc khóa cuối cùng ($1.0\text{s}$), hệ thống sẽ khóa giá trị ở mốc tối đa:
  $$\text{opacity} = 1.0 \quad (\text{Hiển thị rõ 100\%})$$

---

### Bước 4: Chuỗi vẽ đồ họa trên Skia Canvas
```
[Bắt đầu vẽ Khung hình 2.5s]
  │
  ├── 1. Vẽ Layer 1 (Blur Background - Z-Index 0)
  │      - Trích xuất frame tại giây thứ: 2.5 + trimStart (10.0) = 12.5s từ VideoReader.
  │      - Phóng to ảnh thô 800x600 lên bao phủ toàn màn hình 1280x720.
  │      - Áp dụng bộ lọc nhòe blur(15px).
  │
  ├── 2. Vẽ Layer 2 (Main Video Clip - Z-Index 1)
  │      - Vẽ khung hình gốc giải mã tại giây 12.5s vào chính giữa canvas.
  │      - Kích thước: 800x600, căn giữa màn hình (x = 0, y = 0 tương đối từ tâm).
  │
  ├── 3. Vẽ Layer 3 (Sticker Logo - Z-Index 2)
  │      - Vẽ sticker "brand_logo" tại vị trí x = 410, y = -210 (từ tâm).
  │      - Kích thước 150x150, áp dụng opacity = 1.0.
  │
  ├── 4. Vẽ Layer 4 (Subtitle Text - Z-Index 3)
  │      - Sử dụng phông chữ Roboto, kích thước chữ 48px.
  │      - Vẽ đường viền nét ngoài màu đen dày 4px quanh chữ.
  │      - Vẽ chữ màu trắng: "Chào mừng các bạn!" căn giữa tại y = 240.
  │
  ├── 5. Vẽ Layer 5 (Vignette Effect - Z-Index 4)
  │      - Áp dụng bộ lọc Vignette mờ tối các góc màn hình để tăng tính nghệ thuật.
  │
[Kết thúc vẽ ──> Đẩy canvas khung hình hoàn thiện vào luồng Encoder]
```

---

## 🎭 3. Ca mô phỏng 2: Nhiều Track Video (Picture-in-Picture)

K kịch bản timeline chứa 2 track video: 1 track video nền chính và 1 track video phụ đè lên góc màn hình dạng Picture-in-Picture (PiP).

```
Dòng thời gian:      0s ──────────────────────── 3.0s ──────────────────────── 5s
[Z-Index 2: Trên]    🖼️ Video PIP facecam            [Đặt trong: tracks.overlay] ━━━━ (2s - 4s) ━━━━
[Z-Index 1: Dưới]    🎬 Video nền chính gameplay     [Đặt trong: tracks.main]    ───────────────────────────
```

### JSON Manifest (Trích đoạn Tracks):
```json
{
  "tracks": {
    "main": {
      "id": "track-main-video",
      "type": "video",
      "isMain": true,
      "elements": [
        {
          "id": "video-bg",
          "type": "video",
          "startTime": 0.0,
          "duration": 5.0,
          "sourceUrl": "./test-assets/gameplay.mp4",
          "params": {
            "volume": 0.2,
            "width": 1280,
            "height": 720
          }
        }
      ]
    },
    "audio": [],
    "overlay": [
      {
        "id": "track-pip-video",
        "type": "video",
        "elements": [
          {
            "id": "pip-clip",
            "type": "video",
            "startTime": 2.0,
            "duration": 2.0,
            "sourceUrl": "./test-assets/facecam.mp4",
            "params": {
              "volume": 0.8,
              "width": 320,
              "height": 180,
              "transform.positionX": -430,
              "transform.positionY": -220
            }
          }
        ]
      }
    ]
  }
}
```

### Quy trình dựng hình tại giây $t = 3.0\text{s}$:
1. **Kiểm tra hoạt động**:
   - `video-bg` hoạt động ($0.0 \le 3.0 < 5.0$).
   - `pip-clip` hoạt động ($2.0 \le 3.0 < 4.0$).
2. **Quy trình vẽ**:
   - Vẽ khung hình video `gameplay.mp4` độ phân giải đầy đủ 1280x720 làm lớp nền bên dưới.
   - Vẽ khung hình video phụ `facecam.mp4` kích thước nhỏ 320x180 đè lên trên góc trên bên trái màn hình tại vị trí lệch tâm `(-430, -220)`.
3. **Trộn âm**:
   - Trộn âm thanh từ video nền `gameplay.mp4` (âm lượng `0.2`) và video facecam `facecam.mp4` (âm lượng `0.8`) thành một luồng âm PCM duy nhất.
