# Image Element Specification (`image`)

This document defines the schema, behavior, and parameter options for static image layers in the timeline.

## 📝 Element Schema

```json
{
  "id": "picsum-image-example",
  "name": "Picsum Image",
  "type": "image",
  "sourceUrl": "https://picsum.photos/640/360",
  "duration": 5.0,
  "startTime": 0,
  "params": {
    "width": 640,
    "height": 360,
    "transform.positionX": 0,
    "transform.positionY": 0,
    "transform.scaleX": 1.0,
    "transform.scaleY": 1.0,
    "transform.rotate": 0,
    "transform.flipX": false,
    "transform.flipY": false,
    "opacity": 1.0,
    "blurIntensity": 15
  }
}
```

## ⚙️ Properties & Parameters

### Root Properties
| Property | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Required* | Unique identifier of the element. |
| `name` | `string` | `""` | User-friendly display name. |
| `type` | `string` | `"image"` | Must be set strictly to `"image"`. |
| `sourceUrl` | `string` | *Required* | Local path or remote HTTP URL pointing to the image file (`.png`, `.jpg`, `.jpeg`). |
| `startTime` | `number` | `0` | Timeline position in seconds where the image starts displaying. |
| `duration` | `number` | *Required* | Length of time in seconds to show the image on the screen. |
| `hidden` | `boolean` | `false` | Disables rendering of this element if set to `true`. |

### Parameters (`params`)
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `width` | `number` | *Asset width* | Base bounding box width before scale. |
| `height` | `number` | *Asset height*| Base bounding box height before scale. |
| `opacity` | `number` | `1.0` | Layer transparency factor (`0.0` to `1.0`). |
| `blurIntensity` | `number` | *Optional* | Gaussian blur radius for backdrop cover fill layout. |

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
