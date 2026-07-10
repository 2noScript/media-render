---
name: effect
description: Guide on using and constructing Effect timeline elements JSON schema in media-render.
---

# Effect Element Schema Skill

This skill guides on how to construct and validate Effect timeline elements JSON schema.

## 📝 Effect Element Specification (`"type": "effect"`)

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
