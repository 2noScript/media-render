---
name: media_render_api
description: Guide on using the Media Render programmatic API (RenderService, exporter, startServer) and HTTP endpoints.
---

# Media Render API Skill

This skill guides AI agents on how to invoke the Media Render engine — both as an imported library and as an HTTP API server.

---

## Method 1: Library Usage (In-Process)

All public APIs are exported from the main entrypoint `src/index.ts`.

### RenderService

The recommended high-level API. Validates the manifest before rendering.

```typescript
import { RenderService } from "media-render/src/index";

const service = new RenderService();

const videoPath = await service.renderManifest(
  manifest,           // Manifest object (required)
  onProgress,         // (progress: number) => void (optional, 0–100)
  customOutputPath    // string — output file path (optional)
);
```

- **Returns**: `Promise<string>` — absolute path to the rendered video file.
- **Throws**: `Error` with `[ManifestValidationError]` prefix if the manifest is invalid.
- **Default output**: `./test-outputs/<manifest.id>.<format>` if `customOutputPath` is omitted.

### exporter (Low-Level)

Direct access to the rendering pipeline without validation.

```typescript
import { exporter } from "media-render/src/index";

const videoPath = await exporter(manifest, onProgress, customOutputPath);
```

### startServer

Programmatically start the HTTP API server.

```typescript
import { startServer } from "media-render/src/index";

const server = startServer({ port: 3005 });
// server.stop();  // to shut down
```

---

## Method 2: HTTP API Server

Start the server via CLI (`bun start`) or Docker (`docker compose up`).

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/render` | Submit a manifest to render a video |
| `GET` | `/render/:id/progress` | Query render progress (0–100%) |
| `GET` | `/health` | System resource status and GPU detection |
| `GET` | `/docs` | Swagger UI documentation page |
| `GET` | `/docs/json` | Swagger spec JSON schema |

### POST /render

**Request Body**: A full `Manifest` JSON object.

**Success Response** (`200`):
```json
{
  "success": true,
  "message": "Render completed successfully!",
  "videoPath": "/app/test-outputs/my-video.mp4",
  "durationSeconds": 4.57
}
```

**Error Responses**:
- `400` — Invalid JSON body.
- `429` — Concurrent render limit reached.
- `500` — Internal rendering error.
- `503` — System resource limits exceeded.

### GET /render/:id/progress

**Success Response** (`200`):
```json
{
  "success": true,
  "progress": 52,
  "status": "rendering"
}
```

Status values: `"rendering"` | `"completed"` | `"failed"`.

Progress records auto-expire after 5 minutes.

### GET /health

**Success Response** (`200` if healthy, `503` if degraded):
```json
{
  "status": "healthy",
  "activeRenders": 1,
  "concurrentLimit": 2,
  "gpu": {
    "detectedHardwareAcceleration": {
      "nvidia_nvenc": false,
      "apple_videotoolbox": true,
      "intel_qsv": false
    },
    "optimalVideoEncoder": "h264_videotoolbox",
    "isGpuAccelerationActive": true
  },
  "resources": {
    "systemMemoryUsagePercent": "72.30",
    "processMemoryMb": "145.20",
    "cpuCores": 11,
    "loadAvg1Min": 3.12,
    "cpuLoadRatio": "0.28"
  }
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3005` | HTTP server port |
| `CONCURRENT_RENDER_LIMIT` | `2` | Max simultaneous render jobs |
| `MAX_MEMORY_USAGE_PERCENT` | `99` | System memory usage threshold |
| `MAX_PROCESS_MEMORY_MB` | `1536` | Process RSS memory limit (MB) |
| `MAX_CPU_LOAD_RATIO` | `0.9` | CPU load average ratio threshold |
