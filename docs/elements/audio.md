# Audio Element Specification (`audio`)

This document defines the schema, behavior, and parameter options for audio and music tracks in the timeline.

## 📝 Element Schema

```json
{
  "id": "background-music-example",
  "name": "Synth BGM",
  "type": "audio",
  "sourceUrl": "./test-assets/synth_bgm.mp3",
  "startTime": 0.5,
  "duration": 7.5,
  "trimStart": 1.0,
  "trimEnd": 0.5,
  "params": {
    "volume": 0.4,
    "muted": false
  }
}
```

## ⚙️ Properties & Parameters

### Root Properties
| Property | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Required* | Unique identifier of the element. |
| `name` | `string` | `""` | User-friendly display name. |
| `type` | `string` | `"audio"` | Must be set strictly to `"audio"`. |
| `sourceUrl` | `string` | *Required* | Local path or remote URL to the audio asset (`.mp3`, `.wav`, etc.). |
| `startTime` | `number` | `0` | The timestamp in seconds on the global timeline where this audio starts playing. |
| `duration` | `number` | *Required* | Playback duration in seconds on the timeline. |
| `trimStart` | `number` | `0` | Trim offset in seconds from the start of the source audio asset. |
| `trimEnd` | `number` | `0` | Trim offset in seconds from the end of the source audio asset. |
| `hidden` | `boolean` | `false` | Disables rendering of this element if set to `true`. |
| `retime` | `object` | *Optional* | Retiming configuration (speed multiplier, e.g. `{ "rate": 1.5 }`). |

### Parameters (`params`)
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `volume` | `number` | `1.0` | Output volume scaling factor (`0.0` to `1.0`). |
| `muted` | `boolean` | `false` | Mutes this specific audio element when set to `true`. |
