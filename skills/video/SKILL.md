---
name: video
description: Guide on using and constructing Video timeline elements JSON schema in media-render.
---

# Video Element Schema Skill

This skill guides on how to construct and validate Video timeline elements JSON schema when creating or modifying rendering manifests.

## 📐 Core Principles

1. **Center-Relative Coordinates**:
   - Origin `(0, 0)` is the exact center of the composition viewport.
   - Coordinate offsets are defined in the `params` block under the keys `"transform.positionX"` and `"transform.positionY"`.
2. **Timeline Timing**:
   - `startTime`: Global timeline timestamp in seconds when the element starts.
   - `duration`: Screen time duration in seconds.
   - `trimStart` / `trimEnd`: Decoding crop offsets in seconds.

## 📝 Video Element Specification (`"type": "video"`)

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
