# Timeline Simulation Case: From JSON to Rendered Video

This document simulates a complete timeline scenario (a 5-second promotional clip) and traces the step-by-step rendering sequence for a specific timestamp to illustrate the exact composition order.

---

## 📅 1. Timeline Setup (Simulated Project)

We want to render a **5-second video** (Resolution: 1280x720, 30 FPS). The track layout is structured from top-most layer (drawn last) to bottom-most layer (drawn first) as follows:

```
Timeline:           0s ──────────────────────── 2.5s ──────────────────────── 5s
[Z-Index 4: Top]    ✨ Screen Effect (Overlay 0)     [TrackType: "effect"]  ──────────────────────────────────
[Z-Index 3: High]   💬 Subtitle Caption (Overlay 1)  [TrackType: "text"]    ━━━━ (2s - 4s) ━━━━
[Z-Index 2: Mid]    🏷️ Logo Sticker (Overlay 2)      [TrackType: "graphic"] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Z-Index 1: Bottom] 🎬 Main Video (Main Track)       [TrackType: "video"]   ──────────────────────────────────
[Audio: No Z-Index] 🎵 BG Music (Audio Track)        [TrackType: "audio"]   ─────────────────────────────────────
```

### Manifest JSON Payload:
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
  "tracks": [
    {
      "id": "track-effect-layers",
      "type": "effect",
      "elements": [
        {
          "id": "effect-vignette",
          "type": "effect",
          "startTime": 0.0,
          "duration": 5.0,
          "trimStart": 0,
          "trimEnd": 0,
          "effectType": "vignette"
        }
      ],
      "hidden": false
    },
    {
      "id": "track-text-subtitles",
      "type": "text",
      "elements": [
        {
          "id": "sub-1",
          "type": "text",
          "startTime": 2.0,
          "duration": 2.0,
          "text": "Chào mừng các bạn!",
          "style": {
            "fontSize": 48,
            "color": "#FFFFFF",
            "fontFamily": "Roboto",
            "x": 640,
            "y": 600,
            "textAlign": "center",
            "strokeColor": "#000000",
            "strokeWidth": 4
          }
        }
      ],
      "hidden": false
    },
    {
      "id": "track-overlay-stickers",
      "type": "graphic",
      "elements": [
        {
          "id": "sticker-logo",
          "type": "sticker",
          "startTime": 1.0,
          "duration": 4.0,
          "stickerId": "brand_logo",
          "width": 150,
          "height": 150,
          "x": 1050,
          "y": 50,
          "animations": {
            "opacity": [
              { "time": 0, "value": 0.0 },
              { "time": 1.0, "value": 1.0 }
            ]
          }
        }
      ],
      "hidden": false
    },
    {
      "id": "track-main-video",
      "type": "video",
      "isMain": true,
      "elements": [
        {
          "id": "video-bg",
          "type": "video",
          "startTime": 0.0,
          "duration": 5.0,
          "trimStart": 10.0,
          "trimEnd": 0,
          "sourceUrl": "http://example.com/landscape.mp4",
          "width": 800,
          "height": 600,
          "x": 240,
          "y": 60,
          "blurIntensity": 15,
          "volume": 0.5
        }
      ],
      "hidden": false
    },
    {
      "id": "track-audio-bgm",
      "type": "audio",
      "elements": [
        {
          "id": "music-beat",
          "type": "audio",
          "startTime": 0.0,
          "duration": 5.0,
          "trimStart": 0,
          "trimEnd": 0,
          "sourceUrl": "http://example.com/music.mp3",
          "volume": 0.4
        }
      ]
    }
  ]
}
```

---

## 🎯 2. Walkthrough Case: Rendering Frame at $t = 2.5\text{s}$

Here is the exact step-by-step sequence of events executed by the engine to compute and draw the frame at the $2.5\text{s}$ mark:

### Bước 1: Trích lọc các Element hoạt động (Temporal Filtering)
Hệ thống duyệt qua toàn bộ các track để tìm các element hiển thị tại $t = 2.5\text{s}$:
- **`effect-vignette`**: $0.0 \le 2.5 < 5.0 \implies$ **Hoạt động (Active)**.
- **`sub-1`**: $2.0 \le 2.5 < 4.0 \implies$ **Hoạt động (Active)**.
- **`sticker-logo`**: $1.0 \le 2.5 < 5.0 \implies$ **Hoạt động (Active)**.
- **`video-bg`**: $0.0 \le 2.5 < 5.0 \implies$ **Hoạt động (Active)**.
- **`music-beat`**: $0.0 \le 2.5 < 5.0 \implies$ **Hoạt động (Active)** (Audio).

---

### Bước 2: Sắp xếp các Lớp vẽ theo Z-Index (Z-Index Sorting)
Hệ thống tiến hành phân lớp các track hình ảnh theo thứ tự từ dưới lên trên:
1. **Background**: Lớp phóng to và làm mờ từ `video-bg` $\implies$ Tạo `BlurBackgroundNode` (Z-Index = 0).
2. **Main Video Track**: `video-bg` (Z-Index = 1).
3. **Overlay Graphic Track**: `sticker-logo` (Z-Index = 2).
4. **Text Track**: `sub-1` (Z-Index = 3).
5. **Effect Track**: `effect-vignette` (Z-Index = 4, lớp filter mờ góc đen đè lên trên cùng toàn màn hình).

---

### Bước 3: Nội suy các giá trị Keyframe (Animation Interpolation)
Tại thời điểm $t = 2.5\text{s}$, local clip time của sticker-logo là $t_{\text{local}} = 2.5 - 1.0 = 1.5\text{s}$.
- Cấu hình Keyframes cho `opacity`:
  - $K_1$ tại $T_1 = 0\text{s}$, giá trị $V_1 = 0.0$.
  - $K_2$ tại $T_2 = 1.0\text{s}$, giá trị $V_2 = 1.0$.
- Do $t_{\text{local}} = 1.5\text{s}$ lớn hơn thời gian mốc khóa cuối cùng ($1.0\text{s}$), hệ thống khóa giá trị ở mốc cuối cùng:
  $$\text{opacity} = 1.0 \quad (\text{Hiển thị đầy đủ})$$

---

### Bước 4: Quy trình Vẽ các Lớp Đồ họa (Compositor Drawing sequence)

```
[Bắt đầu vẽ Khung hình 2.5s]
  │
  ├── 1. Vẽ Layer 1 (Blur Background)
  │      - Giải mã khung hình video ở giây thứ: 2.5 + trimStart (10.0) = 12.5s.
  │      - Phóng to ảnh thô 800x600 lên bao phủ màn hình 1280x720.
  │      - Áp dụng bộ lọc context.filter = "blur(15px)" của Skia Canvas.
  │
  ├── 2. Vẽ Layer 2 (Main Video Clip)
  │      - Vẽ khung hình gốc giải mã ở giây thứ 12.5s vào giữa canvas.
  │      - Kích thước: 800x600, vị trí: x = 240, y = 60.
  │
  ├── 3. Vẽ Layer 3 (Sticker Logo)
  │      - Lấy ảnh sticker đã load trong bộ nhớ đệm.
  │      - Vẽ tại x = 1050, y = 50 với kích thước 150x150, độ mờ opacity = 1.0.
  │
  ├── 4. Vẽ Layer 4 (Subtitle Text - Trên cùng)
  │      - Thiết lập font size = 48px, font family = Roboto.
  │      - Vẽ viền đen rộng 4px: context.strokeText("Chào mừng các bạn!", 640, 600).
  │      - Tô chữ màu trắng: context.fillText("Chào mừng các bạn!", 640, 600).
  │
[Kết thúc vẽ ──> Gửi Khung hình đến CanvasSource để encode video]
```

---

### Bước 5: Trộn Âm thanh (Audio Mixing at 2.5s)
* Hai luồng âm thanh được trộn đè (amix) thành 1 khung PCM duy nhất và đẩy vào luồng âm thanh xuất của video.

---

## 🎭 3. Case 2: Multiple Video Tracks (Picture-in-Picture Setup)

Đây là trường hợp timeline chứa 2 track video: 1 track video nền chính và 1 track video phụ đè lên góc màn hình dạng Picture-in-Picture (PiP).

```
Timeline:           0s ──────────────────────── 3.0s ──────────────────────── 5s
[Z-Index 2: Mid]    🖼️ Overlay Video PiP (Overlay 0)  [TrackType: "video"] ━━━━ (2s - 4s) ━━━━
[Z-Index 1: Bottom] 🎬 Main Video Track (Main Track) [TrackType: "video"] ──────────────────────────────────
```

### JSON Manifest (Trích đoạn Tracks):
```json
{
  "tracks": [
    {
      "id": "track-pip-video",
      "type": "video",
      "elements": [
        {
          "id": "pip-clip",
          "type": "video",
          "startTime": 2.0,
          "duration": 2.0,
          "sourceUrl": "http://example.com/facecam.mp4",
          "width": 320,
          "height": 180,
          "x": 50,
          "y": 50,
          "volume": 0.8
        }
      ],
      "isMain": false,
      "hidden": false
    },
    {
      "id": "track-main-video",
      "type": "video",
      "isMain": true,
      "elements": [
        {
          "id": "video-bg",
          "type": "video",
          "startTime": 0.0,
          "duration": 5.0,
          "sourceUrl": "http://example.com/gameplay.mp4",
          "width": 1280,
          "height": 720,
          "x": 0,
          "y": 0,
          "volume": 0.2
        }
      ],
      "hidden": false
    }
  ]
}
```

### Quy trình dựng hình tại $t = 3.0\text{s}$:
1. **Lọc Element Hoạt động**:
   - `video-bg` ($0.0 \le 3.0 < 5.0$) $\implies$ Hoạt động.
   - `pip-clip` ($2.0 \le 3.0 < 4.0$) $\implies$ Hoạt động.
2. **Sắp xếp Z-Index (Bottom-to-Top)**:
   - `overlayTracks` chỉ chứa `[track-pip-video]`.
   - `orderedTracks` là `[track-main-video, track-pip-video]`.
   - Lớp vẽ 1: `video-bg` (Main Video, Z-Index = 1).
   - Lớp vẽ 2: `pip-clip` (Overlay Video, Z-Index = 2).
3. **Quy trình vẽ**:
   - Vẽ khung hình gameplay độ phân giải 1280x720 làm nền (Z-Index = 1).
   - Vẽ khung hình facecam kích thước 320x180 đè lên góc trên bên trái tại tọa độ `(50, 50)` (Z-Index = 2).
4. **Trộn âm**:
   - Trộn âm thanh từ video gốc `gameplay.mp4` (âm lượng `0.2`) và video phụ `facecam.mp4` (âm lượng `0.8`) tại thời điểm $t = 3.0\text{s}$ thành 1 luồng âm duy nhất.

---

## 🎭 4. Case 3: Complex Multi-layer Video & Sticker Stacking Order

Trường hợp phức tạp này minh họa cơ chế **đảo ngược mảng overlay** để đảm bảo phụ đề nằm trên cùng, nhãn dán ở giữa và video PiP ở dưới cùng.

```
Timeline:           0s ──────────────────────── 2.0s ──────────────────────── 5s
[Z-Index 3: Top]    💬 Subtitle Caption (Overlay 0)  [TrackType: "text"]    ━━━━ (1s - 4s) ━━━━
[Z-Index 2: High]   🏷️ Watermark Sticker (Overlay 1) [TrackType: "graphic"] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Z-Index 1: Mid]    🎬 PIP Video Overlay (Overlay 2) [TrackType: "video"]   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Z-Index 0: Bottom] 🎬 Main Video (Main Track)       [TrackType: "video"]   ──────────────────────────────────
```

### JSON Manifest (Trích đoạn Tracks):
```json
{
  "tracks": [
    {
      "id": "track-text-subtitles",
      "type": "text",
      "elements": [
        {
          "id": "sub-1",
          "type": "text",
          "startTime": 1.0,
          "duration": 3.0,
          "text": "Phụ đề đè lên tất cả!"
        }
      ]
    },
    {
      "id": "track-stickers",
      "type": "graphic",
      "elements": [
        {
          "id": "sticker-star",
          "type": "sticker",
          "startTime": 0.0,
          "duration": 5.0,
          "stickerId": "yellow_star"
        }
      ]
    },
    {
      "id": "track-pip",
      "type": "video",
      "elements": [
        {
          "id": "pip-clip",
          "type": "video",
          "startTime": 0.0,
          "duration": 5.0
        }
      ],
      "isMain": false
    },
    {
      "id": "track-main",
      "type": "video",
      "isMain": true,
      "elements": [
        {
          "id": "main-bg",
          "type": "video",
          "startTime": 0.0,
          "duration": 5.0
        }
      ]
    }
  ]
}
```

### Quy trình dựng hình tại $t = 2.0\text{s}$:
1. **Dựng mảng Overlay ban đầu**:
   - `overlayTracks = [track-text-subtitles, track-stickers, track-pip]`.
2. **Đảo ngược mảng Overlay (`overlayTracks.reverse()`)**:
   - Đảo ngược thành: `[track-pip, track-stickers, track-text-subtitles]`.
3. **Thứ tự ghép Scene Graph (Bottom-to-Top)**:
   - `orderedTracks = [track-main, track-pip, track-stickers, track-text-subtitles]`.
4. **Kết quả Z-Index vẽ trên Canvas**:
   - **Vẽ 1**: `main-bg` (Lớp nền chính).
   - **Vẽ 2**: `pip-clip` (Lớp video phụ, đè lên lớp nền chính).
   - **Vẽ 3**: `sticker-star` (Lớp nhãn dán, đè lên cả video chính và video phụ).
   - **Vẽ 4**: `sub-1` (Lớp phụ đề, vẽ cuối cùng để đè lên tất cả các lớp hình ảnh bên dưới).
