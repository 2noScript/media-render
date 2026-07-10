---
name: image
description: Guide on using and constructing Image timeline elements JSON schema in media-render.
---

# Image Element Schema Skill

This skill guides on how to construct and validate Image timeline elements JSON schema.

## 📐 Core Principles

1. **Center-Relative Coordinates**:
   - Origin `(0, 0)` is the exact center of the composition viewport.
   - Coordinate offsets are defined in the `params` block under the keys `"transform.positionX"` and `"transform.positionY"`.
2. **Timeline Timing**:
   - `startTime`: Global timeline timestamp in seconds when the element starts.
   - `duration`: Screen time duration in seconds.

## 📝 Image Element Specification (`"type": "image"`)

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
