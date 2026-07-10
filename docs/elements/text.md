# Text Element Specification (`text`)

This document defines the schema, behavior, and parameter options for rendering text, titles, subtitles, and captions in the timeline.

## 📝 Element Schema

```json
{
  "id": "font-text-example",
  "name": "Bangers Font Segment",
  "type": "text",
  "startTime": 5.9,
  "duration": 2.0,
  "fontUrl": "https://raw.githubusercontent.com/google/fonts/main/ofl/bangers/Bangers-Regular.ttf",
  "params": {
    "content": "Bangers Comic Regular Outline (Cyan)",
    "fontSize": 44,
    "color": "#00FFFF",
    "fontFamily": "Bangers",
    "strokeColor": "#333333",
    "strokeWidth": 2,
    "textAlign": "center",
    "background.enabled": true,
    "background.color": "rgba(0, 0, 0, 0.6)",
    "background.cornerRadius": 30,
    "background.paddingX": 10,
    "background.paddingY": 10,
    "background.offsetX": 0,
    "background.offsetY": 0,
    "transform.positionX": 0,
    "transform.positionY": 80
  }
}
```

## ⚙️ Properties & Parameters

### Root Properties
| Property | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Required* | Unique identifier of the element. |
| `name` | `string` | `""` | User-friendly display name. |
| `type` | `string` | `"text"` | Must be set strictly to `"text"`. |
| `startTime` | `number` | `0` | Global timeline offset in seconds when the text becomes active. |
| `duration` | `number` | `0` | Screen time duration in seconds. |
| `fontUrl` | `string` | *Optional* | HTTP URL download path for custom Web Fonts (`.ttf` or `.otf`). |
| `hidden` | `boolean` | `false` | Skips rendering of this element if set to `true`. |

### Parameters (`params`)
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `content` | `string` | `""` | The plain text content to display. |
| `fontFamily` | `string` | `"sans-serif"` | Font family name (matches the family name defined in `fontUrl` if loaded). |
| `fontSize` | `number` | `40` | Text font size in pixels. |
| `fontWeight` | `string` | `"normal"` | Font weight (e.g. `"normal"`, `"bold"`, `"500"`). |
| `color` | `string` | `"white"` | Core text fill color (hex, RGB/A, or standard names). |
| `textAlign` | `string` | `"center"` | Horizontal text alignment: `"left"`, `"center"`, `"right"`, `"start"`, `"end"`. |
| `strokeColor` | `string` | *Optional* | Color of the text stroke outline (for high contrast subtitles). |
| `strokeWidth` | `number` | *Optional* | Line width thickness of the stroke outline in pixels. |

### Transform Parameters (`params`)
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `transform.positionX` | `number` | `0` | Center-relative horizontal offset from canvas center. |
| `transform.positionY` | `number` | `0` | Center-relative vertical offset from canvas center. |

### Subtitle Background Parameters (`params`)
OpenCut standardizes text backdrop styling using dot-notation fields inside the `params` block:
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `background.enabled` | `boolean` | `false` | Enables/disables the background solid box behind the text. |
| `background.color` | `string` | `"transparent"`| Color of the background box. |
| `background.cornerRadius`| `number` | `0` | Corner roundness percentage (`0` to `100`). |
| `background.paddingX` | `number` | `8` | Horizontal padding in pixels around the text block. |
| `background.paddingY` | `number` | `8` | Vertical padding in pixels around the text block. |
| `background.offsetX` | `number` | `0` | Horizontal displacement offset for the background bar. |
| `background.offsetY` | `number` | `0` | Vertical displacement offset for the background bar. |
