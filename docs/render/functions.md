# Developer Guide: Renderer Class and Method Functions Reference

This document provides a detailed reference of all core classes, helper services, and individual method functions inside the `media-render` server-side export engine. Use this guide to understand the execution roles and properties of each function when modifying the codebase.

---

## 🗺️ System Overview

The rendering pipeline is split into three main modules to keep concerns separated:

```
                  ┌────────────────────────────────────────┐
                  │            exporter() loop             │
                  └──────────────────┬─────────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            ▼                        ▼                        ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────┐
│     AssetRegistry     │ │    CanvasRenderer     │ │   AudioPipeline   │
│                       │ │                       │ │                   │
│ Pre-fetches and caches│ │ Drains frame loops &  │ │ Processes Filter-  │
│ video demuxers, raw   │ │ compiles Scene Graph  │ │ Complex (amix) &  │
│ image frames, fonts.  │ │ nodes (RootNode tree).│ │ outputs PCM data. │
└───────────────────────┘ └──────────┬────────────┘ └───────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │     SkiaCompositor     │
                        │                        │
                        │ Synchronizes textures &│
                        │ composites onto canvas.│
                        └────────────────────────┘
```

---

## 1. CanvasRenderer (`src/core/renderer/canvas-renderer.ts`)

Manages timeline boundaries, size configurations, and scene graph compilation.

### `calculateDuration(manifest: EditorManifest): number`
* **Purpose**: Calculates the total duration (in seconds) of the video project based on the main track elements.
* **Logic**: 
  1. Finds the first track where `type === "video"` and `isMain === true`.
  2. Sums the `duration` parameter of all timeline elements in this track.
* **Returns**: Total seconds of timeline playback (`0` if no main track is found).

### `render({ manifest, time }: { manifest: EditorManifest; time: number }): Promise<void>`
* **Purpose**: Generates a single composite image frame at timestamp `time`.
* **Flow**:
  1. Calls `assetRegistry.ensureAssetsLoaded(manifest)` to pre-load missing images or video sinks.
  2. Calls `buildSceneGraph(manifest)` to rebuild the Node tree.
  3. Calls `rootNode.buildFrame(time, this, "root")` to retrieve active frame item descriptors and texture definitions.
  4. Triggers `skiaCompositor.syncTextures(textures)` to upload/clear offscreen canvases.
  5. Invokes `skiaCompositor.render(frameDescriptor, ctx)` to draw layers in Z-Index order onto the virtual renderer canvas.

### `buildSceneGraph(manifest: EditorManifest): void`
* **Purpose**: Rebuilds the memory Node tree hierarchy (Scene Graph) based on the latest manifest track states.
* **Logic (2-Pass)**:
  - **Pass 1**: Finds the main track, sorts elements chronologically by `startTime` (with alphabetical `id` fallbacks), and appends `BlurBackgroundNode` instances to the tree first.
  - **Pass 2**: Gathers main and overlay tracks (reversed to render index `0` topmost), sorts elements, and registers visual nodes (`VideoNode`, `TextNode`, etc.) dynamically via the registry.

---

## 2. AssetRegistry (`src/core/renderer/asset-registry.ts`)

Handles asynchronous prefetching, asset downloading, and texture caches.

### `ensureAssetsLoaded(manifest: EditorManifest): Promise<void>`
* **Purpose**: Pre-loads images, registers remote fonts, and opens video stream demuxers before drawing loops start.
* **Key Fields**:
  - `imagesMap`: Caches downloaded raw image and sticker objects.
  - `videoSinksMap`: Holds decoded frame sinks (`VideoSampleSink`) for all active video clips.
  - `inputsMap`: Caches raw media `Input` readers.

### `dispose(): Promise<void>`
* **Purpose**: Clean up native bindings. Disposes and releases all `Input` decoder instances cached inside the registry.

---

## 3. AudioPipeline (`src/core/renderer/audio-pipeline.ts`)

Orchestrates multi-channel audio mixing using the FFmpeg FilterComplex API.

### `collectAudioClips(manifest: EditorManifest): any[]`
* **Purpose**: Scans the manifest and filters out all elements containing audio channels (from `"audio"` tracks or video elements inside `"video"` tracks).

### `setupAudioMix(clips: any[]): Promise<void>`
* **Purpose**: Instantiates demuxers and registers delay filters for audio mixing.
* **Logic**:
  1. Open demuxer and decoder streams for each audio resource.
  2. Calculate delay offset parameters (`adelay=${startTime}`) and trim intervals (`atrim=start=${trimStart}`).
  3. Build an `amix` FilterGraph string (e.g. `[0:a]adelay=1000|1000[a0]; [1:a]adelay=0|0[a1]; [a0][a1]amix=inputs=2[a_final]`).
  4. Instantiate the native decoder frames generator `FilterComplexAPI`.

### `pushAudioFrames(audioSource: any): Promise<void>`
* **Purpose**: Iterates over mixed PCM buffers from the filter graph and pushes them to the media writer.
* **Logic**: Calls `.next()` on the generator loop until exhausted, wrapping frames inside `AudioSample` objects.

### `limitGenerator(generator: AsyncIterable<av.Frame | null>, duration: number)`
* **Purpose**: Restricts audio generator playback to prevent reading packets past the element's configured timeline `duration` boundary.

---

## 4. SkiaCompositor (`src/core/renderer/compositor/skia-compositor.ts`)

Performs high-performance 2D canvas drawing and transformation matrix operations.

### `syncTextures(textures: TextureUploadDescriptor[]): void`
* **Purpose**: Maintains a cached map of offscreen canvas textures. Re-creates canvas surfaces only when size, content, or hash identifiers change.

### `render(frame: FrameDescriptor, targetCtx: any): void`
* **Purpose**: Composes texture layers onto the main export canvas.
* **Matrix Logic**: Applies rotation, flipping, scale and offset operations centered at `(centerX, centerY)` for each descriptor before calling `targetCtx.drawImage`.
