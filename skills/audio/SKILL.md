---
name: audio
description: Guide on using and constructing Audio timeline elements JSON schema in media-render.
---

# Audio Element Schema Skill

This skill guides on how to construct and validate Audio timeline elements JSON schema.

## 📝 Audio Element Specification (`"type": "audio"`)

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
