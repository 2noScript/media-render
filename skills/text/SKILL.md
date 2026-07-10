---
name: text
description: Guide on using and constructing Text timeline elements JSON schema in media-render.
---

# Text Element Schema Skill

This skill guides on how to construct and validate Text timeline elements JSON schema.

## 📝 Text Element Specification (`"type": "text"`)

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
