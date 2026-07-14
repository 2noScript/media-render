# Headless Renderer — Port web → media-render (SceneTracks)

## Mục tiêu

Port toàn bộ `web/src/services/renderer/` vào `media-render/src/`, dùng **đúng y hệ type `SceneTracks` + `MediaAsset`** như web — không dùng `Manifest`.

Chỉ đổi 3 điểm adapter:

| Web (browser) | media-render (server) |
|---|---|
| `OffscreenCanvas` / `new Image()` | `Canvas` / `loadImage()` từ `@napi-rs/canvas` |
| `wasmCompositor` | `skiaCompositor` |
| `BufferTarget` → `ArrayBuffer` | `FilePathTarget` → file path |

---

## Cấu trúc thư mục — 1:1 mapping

```
media-render/src/
├── core/
│   ├── animation/              ← PORT từ web/src/core/animation/ (nguyên xi)
│   │   ├── bezier.ts
│   │   ├── binding-values.ts
│   │   ├── curve-bridge.ts
│   │   ├── effect-param-channel.ts
│   │   ├── graph-channels.ts
│   │   ├── graphic-param-channel.ts
│   │   ├── index.ts
│   │   ├── interpolation.ts
│   │   ├── keyframe-query.ts
│   │   ├── keyframes.ts
│   │   ├── property-groups.ts
│   │   ├── property-registry.ts
│   │   ├── resolve.ts
│   │   ├── target-resolver.ts
│   │   ├── timeline-snap-points.ts
│   │   ├── transform.ts
│   │   └── types.ts
│   ├── params/                 ← PORT từ web/src/core/params/
│   │   ├── index.ts
│   │   └── registry.ts
│   └── project/               ← PORT chỉ types cần thiết
│       └── types.ts            (TBackground, TCanvasSize)
│
├── components/
│   └── editor/
│       └── panels/
│           └── timeline/       ← PORT từ web (chỉ types, bỏ UI)
│               ├── types/
│               │   ├── index.ts
│               │   ├── base.ts
│               │   ├── scene.ts    (SceneTracks, TScene, Bookmark)
│               │   └── tracks.ts   (VideoTrack, AudioTrack, OverlayTrack, ...)
│               ├── elements/
│               │   ├── audio/types.ts    (AudioElement, RetimeConfig)
│               │   ├── effect/types.ts   (EffectElement)
│               │   ├── graphic/types.ts  (StickerElement, GraphicElement)
│               │   ├── image/types.ts    (ImageElement)
│               │   ├── text/types.ts     (TextElement)
│               │   ├── transition/types.ts (TransitionElement)
│               │   └── video/types.ts    (VideoElement)
│               └── index.ts     (re-export SceneTracks + calculateTotalDuration)
│
├── services/
│   ├── renderer/               ← PORT từ web/src/services/renderer/ (1:1)
│   │   ├── canvas-renderer.ts      [REWRITE - OffscreenCanvas → Skia Canvas]
│   │   ├── canvas-utils.ts         [REWRITE - tạo Skia Canvas]
│   │   ├── scene-builder.ts        [PORT NGUYÊN - input: SceneTracks + MediaAsset[]]
│   │   ├── scene-exporter.ts       [PORT+ADAPT - BufferTarget → FilePathTarget]
│   │   ├── resolve.ts              [PORT+ADAPT - loadImage, videoCache]
│   │   ├── compositor/
│   │   │   ├── types.ts            [PORT - CanvasImageSource → Canvas]
│   │   │   ├── frame-descriptor.ts [PORT NGUYÊN]
│   │   │   ├── utils.ts            [PORT+ADAPT - OffscreenCanvas → Skia]
│   │   │   └── skia-compositor.ts  [REWRITE - match wasmCompositor API]
│   │   └── nodes/
│   │       ├── base-node.ts        [PORT NGUYÊN]
│   │       ├── root-node.ts        [PORT NGUYÊN]
│   │       ├── visual-node.ts      [PORT+ADAPT - CanvasImageSource → Canvas]
│   │       ├── video-node.ts       [PORT NGUYÊN]
│   │       ├── image-node.ts       [PORT+ADAPT - new Image() → loadImage napi]
│   │       ├── text-node.ts        [PORT NGUYÊN]
│   │       ├── blur-background-node.ts [PORT NGUYÊN]
│   │       ├── color-node.ts       [PORT NGUYÊN]
│   │       ├── effect-layer-node.ts [PORT NGUYÊN]
│   │       ├── graphic-node.ts     [PORT NGUYÊN]
│   │       ├── sticker-node.ts     [PORT+ADAPT - new Image() → loadImage napi]
│   │       └── transition-node.ts  [PORT+ADAPT - wasmCompositor → skiaCompositor]
│   │
│   ├── effects/                ← PORT từ web/src/services/effects/
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── index.ts
│   │   └── definitions/
│   │       ├── blur.ts
│   │       └── index.ts
│   │
│   ├── transitions/            ← PORT từ web/src/services/transitions/
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── index.ts
│   │   └── definitions/
│   │       ├── blur.ts, fade.ts, flash.ts
│   │       ├── glitch.ts, overlay.ts
│   │       ├── slide.ts, zoom.ts
│   │       └── index.ts
│   │
│   ├── masks/                  ← PORT từ web/src/services/masks/
│   │   ├── types.ts            (bỏ MaskHandlePosition, MaskInteractionDefinition - UI only)
│   │   ├── registry.ts
│   │   ├── index.ts
│   │   └── definitions/
│   │       ├── box-like.ts, cinematic-bars.ts
│   │       ├── custom.ts, diamond.ts, ellipse.ts
│   │       ├── heart.ts, rectangle.ts
│   │       ├── split.ts, star.ts, text.ts
│   │       └── index.ts
│   │
│   ├── graphics/               ← PORT từ web/src/services/graphics/
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── index.ts            (bỏ buildGraphicPreviewUrl)
│   │   └── definitions/
│   │       ├── ellipse.ts, polygon.ts
│   │       ├── rectangle.ts, shared.ts, star.ts
│   │       └── index.ts
│   │
│   ├── text/                   ← PORT từ web/src/services/text/
│   │   ├── constants.ts
│   │   ├── layout.ts
│   │   ├── measure-element.ts
│   │   └── primitives.ts
│   │
│   ├── gradients/              ← PORT từ web/src/services/gradients/
│   │   ├── canvas.ts
│   │   ├── parser.ts
│   │   └── index.ts
│   │
│   ├── stickers/               ← PORT từ web/src/services/stickers/
│   │   ├── resolver.ts
│   │   └── sticker-id.ts
│   │
│   ├── rendering/              ← PORT từ web/src/services/rendering/
│   │   └── index.ts            (Transform, BlendMode, buildTransformFromParams, ...)
│   │
│   ├── media/                  ← PORT từ web/src/services/media/types.ts
│   │   └── types.ts            (MediaAsset, MediaType)
│   │
│   ├── video-cache/            ← PORT+ADAPT từ web/src/services/video-cache/
│   │   └── service.ts          (VideoCache class, thay File → url string)
│   │
│   └── render/                 ← Service entry point mới
│       └── render.service.ts   (gọi scene-exporter với SceneTracks)
│
└── lib/
    ├── retime/                 ← PORT từ web/src/lib/retime/
    │   ├── resolve.ts          (getSourceTimeAtClipTime)
    │   ├── rate.ts
    │   └── index.ts
    └── background/
        └── defaults.ts         (DEFAULT_BACKGROUND_BLUR_INTENSITY)
```

---

## Key types được dùng (giống hệt web)

```ts
// SceneTracks — giống hệt web
export interface SceneTracks {
  overlay: OverlayTrack[];   // VideoTrack | TextTrack | GraphicTrack | EffectTrack
  main: VideoTrack;
  audio: AudioTrack[];
}

// MediaAsset — giống hệt web (file optional trên server)
export interface MediaAsset {
  id: string;
  name: string;
  type: "image" | "video" | "audio";
  width?: number; height?: number; duration?: number;
  fps?: number; hasAudio?: boolean;
  file?: File;     // optional trên server (browser dùng, server bỏ qua)
  url?: string;    // server dùng cái này để load media
}
```

**Note**: `MediaAsset.file` là optional — server chỉ dùng `url`. `videoCache.getFrameAt()` dùng `url` thay vì `file`.

---

## scene-builder.ts — Port nguyên từ web

Input giống hệt web:

```ts
export function buildScene({
  canvasSize,
  tracks,       // SceneTracks
  mediaAssets,  // MediaAsset[]
  duration,
  background,
  isPreview,
}: BuildSceneParams): RootNode
```

Không thay đổi logic — web đã dùng `mediaAsset.url` để render.

---

## scene-exporter.ts — Port + đổi target

```ts
// Web:
async export({ rootNode }): Promise<ArrayBuffer | null>

// media-render:
async export({ rootNode, outputPath }): Promise<string | null>  // trả file path
```

| Web | media-render |
|---|---|
| `new BufferTarget()` | `new FilePathTarget(outputPath)` |
| `output.target.buffer` | `outputPath` |
| `AudioBufferSource` | `AudioSampleSource` (node-av) |
| `frameRateToFloat(fps: FrameRate)` | `fps` là `number` trực tiếp |
| `TICKS_PER_SECOND`, `mediaTimeToSeconds` | bỏ (dùng seconds thuần) |

Giữ nguyên:
- `EventEmitter` pattern + `SceneExporterEvents` (progress, complete, error, cancelled)
- `cancel()` method
- `qualityMap` (low / medium / high / very_high)
- Frame loop logic

---

## video-cache/service.ts — Port + adapt

```ts
// Web:
getFrameAt({ mediaId, file: File, time })

// media-render:
getFrameAt({ mediaId, url: string, time })
```

- Thay `BlobSource(file)` → URL-based source từ mediabunny
- Giữ nguyên `VideoCache` class, `CanvasSink`, frame chain logic

---

## canvas-utils.ts — Thay OffscreenCanvas → Skia

```ts
// Web:
export function createOffscreenCanvas({ width, height }): OffscreenCanvas | HTMLCanvasElement {
  return new OffscreenCanvas(width, height);
}

// media-render:
export function createOffscreenCanvas({ width, height }): Canvas {
  return createCanvas(width, height); // @napi-rs/canvas
}
```

---

## compositor/skia-compositor.ts — Match wasmCompositor API

```ts
class SkiaCompositor {
  ensureInitialized({ width, height }): void
  getCanvas(): Canvas
  syncTextures(textures: TextureUploadDescriptor[]): void
  render(frame: FrameDescriptor): void
}
export const skiaCompositor = new SkiaCompositor();
```

---

## resolve.ts — Port nguyên (552 lines), chỉ đổi 2 chỗ

| | Web | media-render |
|---|---|---|
| Video decode | `videoCache.getFrameAt({ mediaId, file, time })` | `videoCache.getFrameAt({ mediaId, url, time })` |
| Image load | `loadImageSource(url)` — `new Image()` | `loadImageSource(url)` — `loadImage()` napi |
| Time unit | `mediaTimeToSeconds({ time })` (ticks) | bỏ — `time` là seconds trực tiếp |

Tất cả hàm giữ nguyên tên và signature:
- `resolveRenderTree({ node, renderer, time })`
- `resolveVisualState({ params, context, sourceWidth, sourceHeight })`
- `resolveVideoNode`, `resolveImageNode`, `resolveStickerNode`
- `resolveTextNode`, `resolveGraphicNode`, `resolveBlurBackgroundNode`
- `resolveTransitionNode`, `resolveEffectLayerNode`

---

## render.service.ts — Entry point mới

```ts
// media-render/src/services/render/render.service.ts
import { SceneExporter } from "../renderer/scene-exporter";
import { buildScene } from "../renderer/scene-builder";
import { calculateTotalDuration } from "../../components/editor/panels/timeline";
import type { SceneTracks } from "../../components/editor/panels/timeline";
import type { MediaAsset } from "../media/types";
import type { TBackground, TCanvasSize } from "../../core/project/types";

export interface RenderSceneParams {
  tracks: SceneTracks;
  mediaAssets: MediaAsset[];
  canvasSize: TCanvasSize;
  background: TBackground;
  fps: number;
  format: "mp4" | "webm";
  quality: "low" | "medium" | "high" | "very_high";
  outputPath: string;
  onProgress?: (progress: number) => void;
}

export class RenderService {
  async renderScene(params: RenderSceneParams): Promise<string> {
    const { tracks, mediaAssets, canvasSize, background, fps, format, quality, outputPath, onProgress } = params;
    const duration = calculateTotalDuration({ tracks });
    const scene = buildScene({ canvasSize, tracks, mediaAssets, duration, background });
    const exporter = new SceneExporter({
      width: canvasSize.width,
      height: canvasSize.height,
      fps,
      format,
      quality,
    });
    if (onProgress) {
      exporter.on("progress", onProgress);
    }
    return exporter.export({ rootNode: scene, outputPath });
  }
}
```

---

## Import aliases

Web dùng `@/` alias. media-render dùng relative imports:

```ts
// Web:
import { ... } from "@/services/effects"
import { ... } from "@/core/animation"

// media-render (relative):
import { ... } from "../../services/effects"
import { ... } from "../../core/animation"
```

---

## Files bị XÓA trong media-render (cũ)

```
src/core/renderer/asset-registry.ts
src/core/renderer/audio-pipeline.ts
src/core/renderer/font-loader.ts
src/core/renderer/animation-resolver.ts
src/core/renderer/effect-preview.ts
src/core/renderer/mask-feather.ts
src/core/renderer/bootstrap.ts
src/core/renderer/nodes/        ← toàn bộ
src/core/renderer/resolve.ts
src/core/renderer/canvas-renderer.ts
src/core/renderer/exporter.ts
src/types/manifest.ts
src/services/render.service.ts
```

---

## Verification

```bash
cd media-render
bun test:element:video
bun test:element:image
bun test:element:text
bun test:element:sticker
bun test:element:graphic
bun test:element:effect
bun test:transition
bun test:backdrop
bun test:animations
bun test:effects
```
