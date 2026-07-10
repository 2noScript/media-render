# Video Element Specification (`video`)

This document defines the schema, behavior, and parameter options for video clip layers in the timeline.

## 📝 Element Schema

```json
{
  "id": "landscape-clip-example",
  "name": "Landscape Bunny Clip",
  "type": "video",
  "sourceUrl": "./test-assets/mov_bbb.mp4",
  "duration": 5.0,
  "startTime": 0,
  "trimStart": 0,
  "trimEnd": 0,
  "isSourceAudioEnabled": true,
  "params": {
    "volume": 0.5,
    "width": 360,
    "height": 202,
    "transform.positionX": 0,
    "transform.positionY": 0,
    "transform.scaleX": 1.0,
    "transform.scaleY": 1.0,
    "transform.rotate": 0,
    "transform.flipX": false,
    "transform.flipY": false,
    "opacity": 1.0,
    "blurIntensity": 20
  }
}
```

## ⚙️ Properties & Parameters

### Root Properties
| Property | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Required* | Unique identifier of the element. |
| `name` | `string` | `""` | User-friendly display name. |
| `type` | `string` | `"video"` | Must be set strictly to `"video"`. |
| `sourceUrl` | `string` | *Required* | Local filepath or remote URL pointing to the video asset. |
| `startTime` | `number` | `0` | Timeline position in seconds where the video starts playing. |
| `duration` | `number` | *Required* | Playback duration in seconds on the timeline. |
| `trimStart` | `number` | `0` | Offset time in seconds from where the source asset starts decoding. |
| `trimEnd` | `number` | `0` | Offset time in seconds from the end of the source asset to cut. |
| `isSourceAudioEnabled`| `boolean`| `false` | Enables demuxing and mixing the video's audio channel. |
| `hidden` | `boolean` | `false` | Disables rendering of this element if set to `true`. |
| `retime` | `object` | *Optional* | Retiming configuration (speed multiplier, e.g. `{ "rate": 1.5 }`). |

### Parameters (`params`)
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `volume` | `number` | `1.0` | Output volume gain factor (`0.0` to `1.0`). |
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
