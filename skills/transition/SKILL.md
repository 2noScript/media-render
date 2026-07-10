---
name: transition
description: Guide on using and constructing Transition timeline elements JSON schema in media-render.
---

# Transition Element Schema Skill

This skill guides on how to construct and validate Transition timeline elements JSON schema.

## 📝 Transition Element Specification (`"type": "transition"`)

Used for blending two clips together. Resides directly on the main VideoTrack elements array.
- **Key Parameters**:
  - `transitionType`: Name of transition effect (e.g. `"fade"`, `"slide_left"`, `"zoom_spin"`).
  - `fromElementId`: ID of the outgoing clip.
  - `toElementId`: ID of the incoming clip.
  - `params.intensity`: (Optional) Custom effect strength factor.
  - `params.scale`: (Optional) Custom scale factor.
  - `params.angle`: (Optional) Custom rotation angle.
  - `params.frequency`: (Optional) Custom oscillation waves.
  - `params.color`: (Optional) Custom hex tint / dip-to-color code.

```json
{
  "id": "transition-example",
  "type": "transition",
  "transitionType": "fade",
  "fromElementId": "clip-0",
  "toElementId": "clip-1",
  "startTime": 1.5,
  "duration": 1.0,
  "params": {
    "intensity": 1.0
  }
}
```
