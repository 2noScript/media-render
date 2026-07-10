---
name: sticker
description: Guide on using and constructing Sticker timeline elements JSON schema in media-render.
---

# Sticker Element Schema Skill

This skill guides on how to construct and validate Sticker timeline elements JSON schema.

## 📝 Sticker Element Specification (`"type": "sticker"`)

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
