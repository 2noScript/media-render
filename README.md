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

# Run all test suites sequentially
bun run test:render && bun run test:shorts && bun run test:slideshow && bun run test:lyrics && bun run test:gaps && bun run test:animations && bun run test:pip && bun run test:effects && bun run test:fonts && bun run test:audio && bun run test:backdrop && bun run test:compat
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
            "width": 640,
            "height": 360,
            "x": 0,
            "y": 0,
            "opacity": 1.0
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

