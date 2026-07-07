# Media Render Microservice

A specialized, stateless **Non-linear Video/Media Renderer** microservice built on the **Bun runtime**, **Elysia web framework**, and **NodeAV** (native FFmpeg C++ API wrapper).

`media-render` acts as a **Stateless API Worker** that accepts the **OpenCut** timeline specification format (`ProjectManifest`) via HTTP API, performs fast parallel media rendering, and returns the path of the generated video immediately.

---

## 🚀 1. Key Features

- **Complex Timeline Composition (OpenCut Spec):** Supports video concatenation, automatic gap-filling, logo/sticker overlays (Z-Index Overlays), multi-track karaoke subtitles (`drawtext`), and multi-track audio/BGM mixing (`amix`).
- **Stateless Architecture:** Ideal for horizontal scaling (running multiple pods in parallel). A NestJS backend coordinates queue management.
- **Concurrency Rate Limiting:** Configurable parallel rendering limits via `CONCURRENT_RENDER_LIMIT` in `.env`. Returns `HTTP 429 Too Many Requests` when overloaded.
- **Active Resource Guard (Self-Protection):** Real-time monitoring of system memory, Bun process RSS memory, and average CPU Load. Automatically rejects new tasks with `HTTP 503 Service Unavailable` if thresholds are exceeded to prevent container out-of-memory crashes (Docker OOMKilled).
- **Swagger Documentation:** Unified Swagger UI served via CDN at `/swagger` and raw JSON spec at `/swagger/json`.
- **Health Check API:** Serves Kubernetes/Docker Compose readiness and liveness probes at `/health`.

---

## ⚙️ 2. Environment Variables (.env)

Create a `.env` file in the root directory based on the `.env.example` template:

| Key | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3005` | HTTP Server port for Elysia. |
| `CONCURRENT_RENDER_LIMIT` | `2` | Maximum number of rendering tasks processed concurrently. |
| `MAX_MEMORY_USAGE_PERCENT` | `85` | Maximum system RAM percentage allowed to start a new task (Set to `99` for local development). |
| `MAX_PROCESS_MEMORY_MB` | `1536` | Maximum RSS memory (MB) the Bun process is allowed to consume before rejecting tasks. |
| `MAX_CPU_LOAD_RATIO` | `0.9` | 1-minute CPU Load average ratio per core (e.g. 0.9 = 90% load across all cores). |

---

## 🛠️ 3. Installation & Local Development

### System Requirements:
- **Bun** (version 1.1 or 1.2+).
- **FFmpeg C API libraries** (required for NodeAV):
  - **macOS:** `brew install ffmpeg`
  - **Ubuntu/Linux:** `sudo apt-get install -y ffmpeg libavcodec-dev libavformat-dev libavutil-dev libswscale-dev libswresample-dev build-essential python3 pkg-config`

### Install Dependencies:
```bash
bun install
```

### Start the Server:
```bash
bun start
```
- Server running at: `http://localhost:3005`
- Swagger UI served at: `http://localhost:3005/swagger`
- Health Check endpoint: `http://localhost:3005/health`

---

## 🧪 4. Test Scenarios

We provide mock manifest test scripts representing real-world video formats. These scripts use local test assets located in `./test-assets/` for fast offline execution:

1. **Integrated Manifest Test (Gaps, Overlays, Subtitles, Audio Mix):**
   ```bash
   bun run test:render
   ```
2. **Vertical 9:16 Video (Shorts/TikTok style with centered text overlays):**
   ```bash
   bun run test:shorts
   ```
3. **Image Slideshow (Rendered entirely from sequential images and background music):**
   ```bash
   bun run test:slideshow
   ```
4. **Lyrics / Karaoke Video (Continuous wallpaper, background track, and timed subtitles):**
   ```bash
   bun run test:lyrics
   ```

*All output videos are saved in the `./test-outputs/` directory (ignored by git).*

---

## 🐳 5. Containerization with Docker Compose

Docker Compose builds and bundles the FFmpeg dependencies automatically to run reliably in any environment:

### Spin up the container in detached mode:
```bash
docker compose up --build -d
```

### View logs:
```bash
docker compose logs -f
```

### Stop the service:
```bash
docker compose down
```

### Integrated Docker Features:
- **Volume Mounts:** Mounts `./test-outputs` to easily access rendered files from the host, and `./test-assets` to provide source assets.
- **Docker Healthcheck:** Automatically probes container health via the `/health` endpoint every 15 seconds.
