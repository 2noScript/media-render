# Sticker Element Specification (`sticker`)

This document defines the schema, behavior, and parameter options for visual stickers and animations overlay layers in the timeline.

## 📝 Element Schema

```json
{
  "id": "animated-sticker-example",
  "name": "Wow Sticker",
  "type": "sticker",
  "stickerId": "wow_sticker",
  "sourceUrl": "https://example.com/assets/wow.png",
  "startTime": 1.0,
  "duration": 3.0,
  "params": {
    "transform.positionX": 120,
    "transform.positionY": -50,
    "transform.scaleX": 1.2,
    "transform.scaleY": 1.2,
    "transform.rotate": 15,
    "transform.flipX": false,
    "transform.flipY": false,
    "opacity": 0.9
  }
}
```

## ⚙️ Properties & Parameters

### Root Properties
| Property | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Required* | Unique identifier of the element. |
| `name` | `string` | `""` | User-friendly display name. |
| `type` | `string` | `"sticker"` | Must be set strictly to `"sticker"`. |
| `stickerId` | `string` | *Required* | Identifier of the sticker model. |
| `sourceUrl` | `string` | *Optional* | Local path or remote URL to download/use the sticker image resource. |
| `intrinsicWidth` | `number` | *Optional* | Intrinsic pixel width of the sticker. |
| `intrinsicHeight`| `number` | *Optional* | Intrinsic pixel height of the sticker. |
| `startTime` | `number` | `0` | Timeline position in seconds where the sticker displays. |
| `duration` | `number` | *Required* | Length of time in seconds to show the sticker. |
| `hidden` | `boolean` | `false` | Disables rendering of this element if set to `true`. |

### Parameters (`params`)
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `opacity` | `number` | `1.0` | Layer transparency factor (`0.0` to `1.0`). |

### Transform Parameters (`params`)
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `transform.positionX` | `number` | `0` | Center-relative horizontal offset from canvas center. |
| `transform.positionY` | `number` | `0` | Center-relative vertical offset from canvas center. |
| `transform.scaleX` | `number` | `1.0` | Horizontal scaling factor. |
| `transform.scaleY` | `number` | `1.0` | Vertical scaling factor. |
| `transform.rotate` | `number` | `0` | Bounding box rotation angle clockwise in degrees. |
| `transform.flipX` | `boolean` | `false` | Mirrors the image horizontally. |
| `transform.flipY` | `boolean` | `false` | Mirrors the image vertically. |
