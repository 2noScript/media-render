# Timeline Track Specification

This document defines the schema, types, layering mechanics, and structure of tracks within the OpenCut manifest.

## 📝 Track Schema Example

Tracks organize elements into parallel channels of audio, video, graphics, text, and effects.

```json
{
  "id": "track-video-overlay",
  "name": "Main Visual Track",
  "type": "video",
  "isMain": true,
  "muted": false,
  "elements": [
    {
      "id": "bg-clip-1",
      "type": "video",
      "sourceUrl": "./test-assets/mov_bbb.mp4",
      "startTime": 0,
      "duration": 5.0
    }
  ]
}
```

## ⚙️ Track Properties

| Property | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Required* | Unique identifier of the track. |
| `name` | `string` | `""` | User-friendly label for editor display. |
| `type` | `string` | *Required* | Type of elements this track holds: `"video"`, `"audio"`, `"text"`, `"graphic"`, or `"effect"`. |
| `isMain` | `boolean` | `false` | Marks this track as the primary timeline sequence. The duration of elements on this track determines the default overall video duration. |
| `muted` | `boolean` | `false` | Disables audio playback for all elements contained within this track. |
| `hidden` | `boolean` | `false` | Hides rendering for all elements within this track. |
| `elements` | `array` | `[]` | List of segment element objects. |

## 🥞 Composition & Z-Index Layering

The rendering engine composites tracks on the canvas according to their order in the `tracks` list:
1. **Track Stacking (Z-Index):** Tracks are rendered in **reverse track stacking order**. The first track in the array (e.g. `isMain: true` background video) is drawn at the bottom-most layer. Each subsequent track in the array is composited on top of previous layers.
2. **Text Priority:** Text/subtitles tracks should always be placed towards the end of the `tracks` array to ensure they layer on top of all videos, graphics, and effects.
3. **Element Overlaps:** Within a single track, elements cannot overlap in time. If they do, they are drawn sequentially based on their `startTime` (with earlier elements drawn first).
