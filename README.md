# Media Render Microservice

[Tiếng Việt](README.vi.md)

A high-performance, stateless **non-linear video and media rendering engine** built on the **Bun runtime** using **NodeAV** (native FFmpeg bindings) and **@napi-rs/canvas** (native Skia rendering). It parses timeline manifests to composite and export fully rendered video/audio files.

---

## ⚡ Prerequisites
* **FFmpeg** installed on your host system.

---

## 🚀 Quick Start (Standalone HTTP Server)

### 1. Local CLI Mode
```bash
bun install
bun start
```
* **API Server**: `http://localhost:3005`
* **Swagger Docs**: `http://localhost:3005/docs`
* **Health Check**: `http://localhost:3005/health`

### 2. Docker Mode
A pre-packaged environment containing Bun, FFmpeg, and native Skia canvas libraries:
```bash
docker compose up --build -d  # Start service
docker compose down           # Stop service
```

---

## 📦 Usage as a Library

You can import and use the rendering core directly in your TypeScript/JavaScript application:

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
  (progress) => console.log(`Progress: ${progress}%`),
  "./test-outputs/output.mp4"
);
console.log(`Rendered: ${videoPath}`);
```

---

## ⚙️ Configuration
All environment variables (`PORT`, `CONCURRENT_RENDER_LIMIT`, resource limits) are documented in [env.md](docs/env.md).

---

## 📖 Documentation Directory

Detailed specifications, time-mapping logics, and node-rendering algorithms:

| Category | Reference Guide |
| :--- | :--- |
| **Manifest** | [Architecture & Schema](docs/manifest/architecture.md) • [Render Dataflow](docs/manifest/flow.md) • [Simulation Cases](docs/manifest/simulation.md) |
| **Tracks** | [Track Schema Spec](docs/tracks/schema.md) • [Layering & Z-Index](docs/tracks/layering.md) |
| **Elements** | [Video](docs/elements/video.md) • [Image](docs/elements/image.md) • [Audio](docs/elements/audio.md) • [Text](docs/elements/text.md) • [Sticker](docs/elements/sticker.md) • [Graphic](docs/elements/graphic.md) • [Effect](docs/elements/effect.md) • [Transition](docs/elements/transition.md) |
| **Rendering** | [Algorithms Guide](docs/render/algorithms.md) • [Visual System Plan](docs/render/architecture.md) • [Core Functions](docs/render/functions.md) |
| **Config** | [Environment Variables](docs/env.md) |

---

## 🧪 Testing

Execute automated E2E render tests using mock assets:

```bash
# Run a specific transition test interactively
bun run test:transition

# Run a standard track/element test
bun run test gaps
bun run test element:video

# Run all test suites sequentially
bun run test:render && bun run test:gaps && bun run test:animations && bun run test:pip
```

All rendered video outputs are saved under `./test-outputs/`.
