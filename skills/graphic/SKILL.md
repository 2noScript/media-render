---
name: graphic
description: Guide on using and constructing Graphic timeline elements JSON schema in media-render.
---

# Graphic Element Schema Skill

This skill guides on how to construct and validate Graphic timeline elements JSON schema.

## 📝 Graphic Element Specification (`"type": "graphic"`)

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
