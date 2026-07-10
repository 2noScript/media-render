# Graphic Element Specification (`graphic`)

This document defines the schema, behavior, and parameter options for graphic shape and overlay layers in the timeline.

## 📝 Element Schema

```json
{
  "id": "solid-color-graphic",
  "name": "Red Accent Box",
  "type": "graphic",
  "definitionId": "rectangle",
  "startTime": 0.0,
  "duration": 5.0,
  "params": {
    "color": "#FF0000",
    "width": 100,
    "height": 100,
    "transform.positionX": -200,
    "transform.positionY": 100,
    "transform.scaleX": 1.0,
    "transform.scaleY": 1.0,
    "transform.rotate": 45,
    "opacity": 0.8
  }
}
```

## ⚙️ Properties & Parameters

### Root Properties
| Property | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Required* | Unique identifier of the element. |
| `name` | `string` | `""` | User-friendly display name. |
| `type` | `string` | `"graphic"` | Must be set strictly to `"graphic"`. |
| `definitionId` | `string` | *Required* | Type of graphic element (currently supports shape types, e.g. `"rectangle"`). |
| `startTime` | `number` | `0` | Timeline position in seconds where the shape appears. |
| `duration` | `number` | *Required* | Length of time in seconds to show the shape. |
| `hidden` | `boolean` | `false` | Disables rendering of this element if set to `true`. |

### Parameters (`params`)
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `color` | `string` | `"transparent"`| Fill color for the graphic shape. |
| `width` | `number` | `100` | Bounding box base width in pixels. |
| `height` | `number` | `100` | Bounding box base height in pixels. |
| `opacity` | `number` | `1.0` | Layer transparency factor (`0.0` to `1.0`). |

### Transform Parameters (`params`)
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `transform.positionX` | `number` | `0` | Center-relative horizontal offset from canvas center. |
| `transform.positionY` | `number` | `0` | Center-relative vertical offset from canvas center. |
| `transform.scaleX` | `number` | `1.0` | Horizontal scaling factor. |
| `transform.scaleY` | `number` | `1.0` | Vertical scaling factor. |
| `transform.rotate` | `number` | `0` | Bounding box rotation angle clockwise in degrees. |
| `transform.flipX` | `boolean` | `false` | Mirrors the shape horizontally. |
| `transform.flipY` | `boolean` | `false` | Mirrors the shape vertically. |
