---
name: media_render_elements
description: Guide on using and constructing Media Render timeline element JSON schemas (video, image, audio, text, sticker, graphic, effect).
---

# Media Render Elements Schema Skill

This skill guides AI agents on how to construct and validate Media Render timeline element JSON schemas when creating or modifying rendering manifests.

## 📐 Core Principles

1. **Center-Relative Coordinates**:
   - Origin `(0, 0)` is the exact center of the composition viewport.
   - Coordinate offsets are defined in the `params` block under the keys `"transform.positionX"` and `"transform.positionY"`.
2. **Timeline Timing**:
   - `startTime`: Global timeline timestamp in seconds when the element starts.
   - `duration`: Screen time duration in seconds.
   - `trimStart` / `trimEnd`: Decoding crop offsets in seconds (for video and audio assets).

---

## 📝 Element Specifications

### 1. Video Element (`"type": "video"`)
Used for decoding and compositing video streams.
- **Key Parameters**:
  - `params.volume`: Volume gain `0.0` to `1.0`.
  - `params.width` / `params.height`: Base bounding box dimensions.
  - `params.blurIntensity`: (Optional) Backdrop cover blur radius (e.g. `20`).
  - `isSourceAudioEnabled`: Set `true` to mix the audio track of the video.
  - `retime`: (Optional) `{ "rate": number }` to speed up/slow down playback.

```json
{
  "id": "video-clip-example",
  "type": "video",
  "sourceUrl": "./test-assets/mov_bbb.mp4",
  "startTime": 0,
  "duration": 5.0,
  "trimStart": 0,
  "trimEnd": 0,
  "params": {
    "volume": 0.0,
    "width": 640,
    "height": 360,
    "transform.positionX": 0,
    "transform.positionY": 0
  }
}
```

### 2. Image Element (`"type": "image"`)
Used for static image overlays.
- **Key Parameters**: Same coordinate, rotation, scaling, and `blurIntensity` options as video elements.

```json
{
  "id": "image-clip-example",
  "type": "image",
  "sourceUrl": "https://picsum.photos/640/360",
  "startTime": 0,
  "duration": 5.0,
  "params": {
    "width": 640,
    "height": 360,
    "transform.positionX": 0,
    "transform.positionY": 0
  }
}
```

### 3. Text Element (`"type": "text"`)
Used for titles, subtitles, and text backgrounds.
- **Key Parameters**:
  - `params.content`: The text content.
  - `params.fontFamily` / `params.fontSize` / `params.color`.
  - `params.strokeColor` / `params.strokeWidth` (for text outline stroke).
  - `params.textAlign`: `"left" | "center" | "right" | "start" | "end"`.
  - `fontUrl`: (Optional) Downloadable font URL (`.ttf` or `.otf`).
- **Dot-Notation Background settings**:
  - `params.background.enabled`: `true` or `false`.
  - `params.background.color` (e.g. `"rgba(0,0,0,0.6)"`).
  - `params.background.cornerRadius` / `params.background.paddingX` / `params.background.paddingY`.

```json
{
  "id": "text-clip-example",
  "type": "text",
  "startTime": 0,
  "duration": 5.0,
  "params": {
    "content": "Subtitle Overlay",
    "fontSize": 32,
    "color": "#FFFFFF",
    "fontFamily": "sans-serif",
    "textAlign": "center",
    "background.enabled": true,
    "background.color": "rgba(0, 0, 0, 0.5)",
    "background.paddingX": 10,
    "background.paddingY": 6,
    "transform.positionX": 0,
    "transform.positionY": 80
  }
}
```

### 4. Audio Element (`"type": "audio"`)
Used for background music and voice tracks.
- **Key Parameters**:
  - `params.volume`: Volume multiplier.
  - `params.muted`: Mute state boolean.

```json
{
  "id": "bgm-example",
  "type": "audio",
  "sourceUrl": "./test-assets/synth_bgm.mp3",
  "startTime": 1.0,
  "duration": 4.0,
  "trimStart": 0,
  "params": {
    "volume": 0.5,
    "muted": false
  }
}
```

### 5. Sticker Element (`"type": "sticker"`)
Used for sticker icon overlays.
- **Key Parameters**: `stickerId` (required), transforms.

```json
{
  "id": "sticker-example",
  "type": "sticker",
  "stickerId": "thumbs_up",
  "startTime": 0,
  "duration": 3.0,
  "params": {
    "transform.positionX": 150,
    "transform.positionY": -100,
    "transform.scaleX": 1.0,
    "transform.scaleY": 1.0
  }
}
```

### 6. Graphic Element (`"type": "graphic"`)
Used for vector shape overlays (e.g., rectangles).
- **Key Parameters**:
  - `definitionId`: e.g. `"rectangle"`.
  - `params.color`: Hex or RGB shape fill color.

```json
{
  "id": "rectangle-example",
  "type": "graphic",
  "definitionId": "rectangle",
  "startTime": 0,
  "duration": 5.0,
  "params": {
    "color": "#FF0000",
    "width": 100,
    "height": 100,
    "transform.positionX": 0,
    "transform.positionY": 0
  }
}
```

### 7. Effect Element (`"type": "effect"`)
Used for screen filters like vignette shading.
- **Key Parameters**:
  - `effectType`: e.g. `"vignette"`.
  - `params.color` / `params.intensity` / `params.smoothness`.

```json
{
  "id": "effect-example",
  "type": "effect",
  "effectType": "vignette",
  "startTime": 0,
  "duration": 5.0,
  "params": {
    "color": "black",
    "intensity": 0.7,
    "smoothness": 0.5
  }
}
```
