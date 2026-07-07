# Media Render Microservice

A specialized, stateless **Non-linear Video/Media Renderer** microservice built on the **Bun runtime**, **Elysia web framework**, and **NodeAV** (native FFmpeg C++ API wrapper).

`media-render` acts as a **Stateless API Worker** that accepts the timeline specification format (`EditorManifest`) via HTTP API, performs fast parallel media rendering, and returns the path of the generated video immediately.

---

## ⚙️ 1. Environment Variables (.env)

Create a `.env` file in the root directory based on the `.env.example` template:

| Key | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3005` | HTTP Server port for Elysia. |
| `CONCURRENT_RENDER_LIMIT` | `2` | Maximum number of rendering tasks processed concurrently. |
| `MAX_MEMORY_USAGE_PERCENT` | `85` | Maximum system RAM percentage allowed to start a new task (Set to `99` for local development). |
| `MAX_PROCESS_MEMORY_MB` | `1536` | Maximum RSS memory (MB) the Bun process is allowed to consume before rejecting tasks. |
| `MAX_CPU_LOAD_RATIO` | `0.9` | 1-minute CPU Load average ratio per core (e.g. 0.9 = 90% load across all cores). |

---

## 🛠️ 2. Quick Start

Requires **Bun (1.1+)** & **FFmpeg** (with development libraries).

```bash
bun install
bun start
```
* **API Server:** `http://localhost:3005` (Swagger Docs: `/docs` | Health Check: `/health`)

---

## 🧪 3. Testing

Run local offline tests using mock assets:
```bash
# Standard composition (video, overlays, subs, audio)
bun run test:render

# Specific format tests (Shorts, Slideshow, Karaoke)
bun run test:shorts
bun run test:slideshow
bun run test:lyrics
```
*Outputs are saved in `./test-outputs/`.*

---

## 🐳 4. Docker Compose

Run the service in a pre-configured Docker container (includes FFmpeg):
```bash
# Start container (detached mode)
docker compose up --build -d

# Stop container
docker compose down
```
*Auto-mounts `./test-outputs/` for host access and features health checking on `/health`.*

---

## 📡 5. API Usage Guide (cURL Examples)

You can interact with the stateless rendering service directly via HTTP requests using `curl`.

### A. Health Check & Resource Diagnostics
Query the resource usage guard and render queue status:
```bash
curl -i http://localhost:3005/health
```

### B. Trigger a Video Render (POST `/render`)
Send an `EditorManifest` JSON payload to composite a video. The server will download remote assets, perform parallel rendering, and return the path to the output video:

```bash
curl -X POST http://localhost:3005/render \
  -H "Content-Type: application/json" \
  -d '{
    "id": "curl-test-render",
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
        "id": "track-main-video",
        "name": "Main Video Track",
        "type": "video",
        "isMain": true,
        "muted": false,
        "hidden": false,
        "elements": [
          {
            "id": "element-video-1",
            "name": "Big Buck Bunny Sample",
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
            "opacity": 1.0,
            "volume": 1.0
          }
        ]
      }
    ]
  }'
```

#### Successful Response:
```json
{
  "success": true,
  "message": "Render completed successfully!",
  "videoPath": "/app/test-outputs/output-ef9bfca6-f29c-4acd-b2d5-2a050cc831e7.mp4",
  "durationSeconds": 5.0
}
```

### C. Check Render Progress (GET `/render/:id/progress`)
Query the real-time percentage progress of an active or recently finished rendering task:
```bash
curl -i http://localhost:3005/render/curl-test-render/progress
```

#### Progress Response (Rendering):
```json
{
  "success": true,
  "progress": 45,
  "status": "rendering"
}
```

#### Progress Response (Completed):
```json
{
  "success": true,
  "progress": 100,
  "status": "completed",
  "videoPath": "/app/test-outputs/output-xxx.mp4"
}
```
