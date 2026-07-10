# Timeline Track Specification

This document defines the schema, types, layering mechanics, and structure of tracks within the OpenCut manifest.

## 📝 Tracks Object Schema Example

Tracks organize elements into parallel channels of audio, video, graphics, text, and effects under the `tracks` object of the manifest:

```json
{
  "tracks": {
    "main": {
      "id": "track-main-video",
      "name": "Main Visual Track",
      "type": "video",
      "isMain": true,
      "muted": false,
      "hidden": false,
      "elements": [
        {
          "id": "bg-clip-1",
          "type": "video",
          "sourceUrl": "./test-assets/mov_bbb.mp4",
          "startTime": 0,
          "duration": 5.0,
          "params": {}
        }
      ]
    },
    "audio": [],
    "overlay": []
  }
}
```

## ⚙️ Track Properties

| Property | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Required* | Unique identifier of the track. |
| `name` | `string` | `""` | User-friendly label for editor display. |
| `type` | `string` | *Required* | Type of elements this track holds: `"video"`, `"audio"`, `"text"`, `"graphic"`, or `"effect"`. |
| `isMain` | `boolean` | `false` | Marks this track as the primary timeline sequence (applicable to the `main` track). |
| `muted` | `boolean` | `false` | Disables audio playback for all elements contained within this track. |
| `hidden` | `boolean` | `false` | Hides rendering for all elements within this track. |
| `elements` | `array` | `[]` | List of segment element objects (e.g. VideoElement, ImageElement, TransitionElement, AudioElement, TextElement). |

## 🥞 Composition & Z-Index Layering

The rendering engine composites tracks on the canvas according to their role in the `tracks` structure:
1. **Track Stacking (Z-Index):**
   - **`main` Track:** Drawn at the bottom-most layer.
   - **`overlay` Tracks:** Processed in **reverse order**. The first track in the array (e.g., PiP video) is drawn directly on top of `main`, and each subsequent track in the array is composited on top of previous layers.
2. **Text Priority:** Text/subtitles tracks should be placed towards the end of the `overlay` array to ensure they layer on top of all videos, graphics, and screen effects.
3. **Transition Elements:** Transition elements (`type: "transition"`) reside directly on the `VideoTrack` (e.g., the `main` track) at the boundary between two consecutive clips, blending them together using offscreen surfaces.

