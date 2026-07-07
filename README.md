# Media Render Microservice

A high-performance, stateless **non-linear video and media renderer** built on the **Bun runtime** and **NodeAV** (native FFmpeg bindings). It processes timeline specifications (`Manifest`) in parallel and outputs high-quality, fully-rendered video compositions.

---

## ⚡ Prerequisites
- **FFmpeg** installed on your host system.

---

## 📦 Usage Method 1: Using as a Library

You can import and use the rendering core directly in your TypeScript/JavaScript codebase without running a web server. All public core APIs are exported from the main library entrypoint `src/index.ts`.

### 1. In-Process Manifest Rendering

To render a video directly from your code, use the **`RenderService`** class (or the standalone `exporter` function).

#### Import & Instantiation:
```typescript
import { RenderService } from "./src/index"; // Or from the package name if linked/published

const renderService = new RenderService();
```

#### `renderManifest` Method Signature:
```typescript
const videoPath = await renderService.renderManifest(
  manifest,           // 1. Manifest object (required)
  onProgress,         // 2. Callback for rendering progress: (progress: number) => void (optional)
  customOutputPath    // 3. Output file save path (optional)
);
```

* **`manifest`**: The timeline configuration object (`Manifest`) containing settings, tracks, and elements.
* **`onProgress`**: An optional callback receiving the render progress percentage (`0` to `100`) as each frame compiles (ideal for logging/progress bars).
* **`customOutputPath`**: A relative or absolute path to save the output video file (e.g., `/var/outputs/my-video.mp4`). If omitted, the file defaults to the `./test-outputs/` folder with the name format `<manifest_id>.<format>`.

#### Complete Example:
```typescript
import { RenderService, Manifest } from "./src/index";

const renderService = new RenderService();

async function run() {
  const manifest: Manifest = {
    id: "render-direct-example",
    settings: {
      width: 640,
      height: 360,
      fps: 30,
      format: "mp4",
      quality: "high",
      shouldIncludeAudio: true
    },
    tracks: [
      {
        id: "track-main-video",
        type: "video",
        isMain: true,
        elements: [
          {
            id: "bg-clip",
            type: "video",
            sourceUrl: "./test-assets/mov_bbb.mp4",
            startTime: 0,
            duration: 5.0,
            params: {
              volume: 0.0,
              width: 640,
              height: 360
            }
          }
        ]
      }
    ]
  };

  try {
    const videoPath = await renderService.renderManifest(
      manifest,
      (progress) => {
        console.log(`Video rendering progress: ${progress}%`);
      },
      "./test-outputs/direct-output.mp4" // Save directly to custom file path
    );
    console.log(`🎉 Video rendered successfully at: ${videoPath}`);
  } catch (error) {
    console.error("❌ Video rendering failed:", error);
  }
}

run();
```

### 2. Programmatic HTTP Server

If you want to run the HTTP API Server directly within your application code (e.g., embedded inside a NestJS or Express/Bun app):

#### Usage:
```typescript
import { startServer } from "./src/index";

// Start the server and retrieve the Bun Server instance
const server = startServer({ 
  port: 3005 // API server port, defaults to env PORT or 3005
});

// To stop the server when no longer needed:
// server.stop();
```

---

## 📡 Usage Method 2: Running as a Standalone HTTP Server

You can run the microservice as a standalone HTTP API Server to serve other applications via one of the two methods below.

### 1. Running via CLI (Local Mode)
```bash
bun install
bun start
```
- **API Server:** `http://localhost:3005`
- **Swagger Documentation:** `http://localhost:3005/docs`
- **Health Check:** `http://localhost:3005/health`

### 2. Running via Docker (Docker Mode)
A pre-packaged environment containing Bun, FFmpeg, and canvas rendering libraries:
```bash
# Start rendering service in background
docker compose up --build -d

# Shutdown rendering service
docker compose down
```

---

## ⚙️ Configuration

All environment variables and resource limits are documented in detail in [env.md](docs/env.md).

---

## 📖 Manifest & Element Guides

Detailed technical specifications, timing diagrams, and JSON schemas for tracks and elements:
- [Track Specification & Layering](docs/tracks/track_schema.md)
- [Video Element Spec (`video`)](docs/elements/video_element.md)
- [Image Element Spec (`image`)](docs/elements/image_element.md)
- [Audio Element Spec (`audio`)](docs/elements/audio_element.md)
- [Text Element Spec (`text`)](docs/elements/text_element.md)
- [Sticker Element Spec (`sticker`)](docs/elements/sticker_element.md)
- [Graphic Element Spec (`graphic`)](docs/elements/graphic_element.md)
- [Effect Element Spec (`effect`)](docs/elements/effect_element.md)

---

## 🧪 Testing

Automated E2E testing scenarios using mock assets:

```bash
# Test command syntax: bun run test:[name]
# Examples:
bun run test:render
bun run test:element:video
bun run test:track:muted

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
