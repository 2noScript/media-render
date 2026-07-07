# Media Render Microservice

A high-performance, stateless **non-linear video and media renderer** built on the **Bun runtime**, **Elysia web framework**, and **NodeAV** (native FFmpeg bindings). It processes timeline specifications (`Manifest`) in parallel and outputs high-quality, fully-rendered video compositions.

---

## ⚡ Quick Start

### Prerequisite
- **FFmpeg**

### Run Server
```bash
bun install
bun start
```
- **API Server:** `http://localhost:3005`
- **Swagger Documentation:** `http://localhost:3005/docs`
- **Health Check:** `http://localhost:3005/health`

---

## ⚙️ Configuration

Environment variables and system limits are documented in [env.md](docs/env.md).

---

## 📖 Manifest & Element Guides

Detailed parameter specifications, timing models, and JSON schemas for tracks and elements:
- [Track Specification & Layering](docs/tracks/track_schema.md)
- [Video Element Spec (`video`)](docs/elements/video_element.md)
- [Image Element Spec (`image`)](docs/elements/image_element.md)
- [Audio Element Spec (`audio`)](docs/elements/audio_element.md)
- [Text Element Spec (`text`)](docs/elements/text_element.md)
- [Sticker Element Spec (`sticker`)](docs/elements/sticker_element.md)
- [Graphic Element Spec (`graphic`)](docs/elements/graphic_element.md)
- [Effect Element Spec (`effect`)](docs/elements/effect_element.md)

---

## 🐳 Docker Deployment

A pre-packaged environment containing Bun, FFmpeg, and canvas assets is available:

```bash
# Start rendering service
docker compose up --build -d

# Shutdown service
docker compose down
```

---

## 🧪 Testing

Run automated E2E tests using mock assets:

```bash
# Run specific manifest test
bun run test:render
bun run test:shorts
bun run test:lyrics

# Run isolated element tests
bun run test:element:video
bun run test:element:image
bun run test:element:audio
bun run test:element:text
bun run test:element:sticker
bun run test:element:graphic
bun run test:element:effect

# Run isolated track configuration tests
bun run test:track:muted
bun run test:track:hidden
bun run test:track:main
bun run test:track:multi_video
bun run test:track:multi_audio

# Run all test suites sequentially
bun run test:render && bun run test:shorts && bun run test:slideshow && bun run test:lyrics && bun run test:gaps && bun run test:animations && bun run test:pip && bun run test:effects && bun run test:audio && bun run test:backdrop && bun run test:compat
```

All rendered video outputs are saved under `./test-outputs/`.

---

## 📡 API Usage (cURL Examples)

### 1. Trigger Video Render (`POST /render`)
Submit a render job payload to begin video generation:

```bash
curl -X POST http://localhost:3005/render \
  -H "Content-Type: application/json" \
  -d '{
    "id": "curl-example",
    "settings": {
      "width": 640,
      "height": 360,
      "fps": 30,
      "format": "mp4",
      "quality": "high",
      "shouldIncludeAudio": true
    },
    "tracks": [
      {
        "id": "track-main",
        "type": "video",
        "isMain": true,
        "elements": [
          {
            "id": "el-video",
            "type": "video",
            "sourceUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
            "duration": 5,
            "startTime": 0,
            "trimStart": 0,
            "trimEnd": 0,
            "params": {
              "volume": 0.0,
              "width": 640,
              "height": 360,
              "transform.positionX": 0,
              "transform.positionY": 0,
              "opacity": 1.0
            }
          }
        ]
      }
    ]
  }'
```

### 2. Query Render Progress (`GET /render/:id/progress`)
Check the completion percentage and status of a specific render job:

```bash
curl http://localhost:3005/render/curl-example/progress
```

---

## 📐 Coordinate System & Layout Guidelines

To align correctly with OpenCut's editor schema, all visual layers (video, image, text, sticker, graphic) use a **center-relative coordinate system**.

### 1. Positioning (`transform.positionX`, `transform.positionY`)
- **Origin `(0, 0)`:** Center of the canvas viewport.
- **X-axis:** Positive offsets move right, negative offsets move left.
- **Y-axis:** Positive offsets move down, negative offsets move up.
- **Example:** For a standard `640x360` canvas:
  - `(0, 0)` is the exact center.
  - `(0, -80)` offsets the element up by 80px (e.g. top subtitles).
  - `(0, 80)` offsets the element down by 80px (e.g. bottom subtitles).

### 2. Text Background Configuration
Text background properties are defined using dot-notation within the element's `params` object:
- `"background.enabled"` (boolean): Enables or disables the text background bar.
- `"background.color"` (string): Color of the background (e.g., `"rgba(0, 0, 0, 0.6)"`).
- `"background.cornerRadius"` (number, `0` to `100`): The percentage of corner rounding.
- `"background.paddingX"` / `"background.paddingY"` (number): Horizontal and vertical padding in pixels.
- `"background.offsetX"` / `"background.offsetY"` (number): Position offset of the background bar relative to the text.

