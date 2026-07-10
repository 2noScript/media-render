---
name: media_render_manifest
description: Guide on constructing a complete and valid Media Render Manifest JSON object with settings and tracks.
---

# Media Render Manifest Skill

This skill guides AI agents on how to assemble a complete, valid `Manifest` object for the Media Render engine.

## Manifest Structure

```typescript
interface Manifest {
  id: string;
  settings: {
    width: number;        // Canvas width in pixels
    height: number;       // Canvas height in pixels
    fps: number;          // Frames per second (e.g. 24, 30, 60)
    format: "mp4" | "webm";
    quality?: "low" | "medium" | "high" | "very_high";
    shouldIncludeAudio?: boolean;
  };
  tracks: Track[];        // Array of VideoTrack | AudioTrack | TextTrack | GraphicTrack | EffectTrack
}
```

---

## Settings Reference

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `width` | `number` | ✅ | — | Output video width in pixels |
| `height` | `number` | ✅ | — | Output video height in pixels |
| `fps` | `number` | ✅ | — | Output frame rate |
| `format` | `"mp4" \| "webm"` | ✅ | — | Output container format |
| `quality` | `"low" \| "medium" \| "high" \| "very_high"` | ❌ | `"high"` | Video bitrate quality preset |
| `shouldIncludeAudio` | `boolean` | ❌ | `false` | Whether to mix and include audio in the output |

### Quality Bitrate Map

| Quality | Video Bitrate | Audio Bitrate |
|---------|--------------|---------------|
| `low` | 1 Mbps | 64 kbps |
| `medium` | 2.5 Mbps | 128 kbps |
| `high` | 5 Mbps | 192 kbps |
| `very_high` | 8 Mbps | 256 kbps |

---

## Validation Rules

The engine validates every manifest before rendering. These rules must be satisfied:

1. `id` must be a non-empty string.
2. `settings.width` and `settings.height` must be positive integers.
3. `settings.fps` must be a positive number.
4. `settings.format` must be `"mp4"` or `"webm"`.
5. `tracks` must be a non-empty array.
6. Exactly **one** video track must have `isMain: true`.
7. Every element must have a unique `id`, a non-negative `startTime`, and a positive `duration`.

---

## Common Resolutions

| Name | Width | Height | Aspect Ratio |
|------|-------|--------|-------------|
| 360p Landscape | 640 | 360 | 16:9 |
| 720p Landscape | 1280 | 720 | 16:9 |
| 1080p Landscape | 1920 | 1080 | 16:9 |
| 9:16 Shorts/TikTok | 1080 | 1920 | 9:16 |
| 1:1 Square | 1080 | 1080 | 1:1 |

---

## Minimal Valid Manifest

```json
{
  "id": "minimal-example",
  "settings": {
    "width": 640,
    "height": 360,
    "fps": 30,
    "format": "mp4"
  },
  "tracks": [
    {
      "id": "track-main",
      "name": "Main",
      "type": "video",
      "isMain": true,
      "muted": false,
      "hidden": false,
      "elements": [
        {
          "id": "clip-1",
          "type": "video",
          "sourceUrl": "./assets/sample.mp4",
          "startTime": 0,
          "duration": 5.0,
          "trimStart": 0,
          "trimEnd": 0,
          "params": { "width": 640, "height": 360 }
        }
      ]
    }
  ]
}
```

## Full Multi-Track Manifest

```json
{
  "id": "full-example",
  "settings": {
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "format": "mp4",
    "quality": "high",
    "shouldIncludeAudio": true
  },
  "tracks": [
    {
      "id": "track-main",
      "name": "Main Video",
      "type": "video",
      "isMain": true,
      "muted": false,
      "hidden": false,
      "elements": [
        {
          "id": "bg",
          "type": "video",
          "sourceUrl": "./assets/background.mp4",
          "startTime": 0,
          "duration": 10.0,
          "trimStart": 0,
          "trimEnd": 0,
          "params": { "volume": 0.0, "width": 1080, "height": 1920 }
        }
      ]
    },
    {
      "id": "track-subtitles",
      "name": "Subtitles",
      "type": "text",
      "hidden": false,
      "elements": [
        {
          "id": "sub-1",
          "type": "text",
          "startTime": 0,
          "duration": 3.0,
          "trimStart": 0,
          "trimEnd": 0,
          "params": {
            "content": "Welcome!",
            "fontSize": 48,
            "color": "#FFFFFF",
            "transform.positionY": 400
          }
        }
      ]
    },
    {
      "id": "track-bgm",
      "name": "Music",
      "type": "audio",
      "muted": false,
      "elements": [
        {
          "id": "bgm",
          "type": "audio",
          "sourceUrl": "./assets/music.mp3",
          "startTime": 0,
          "duration": 10.0,
          "trimStart": 0,
          "trimEnd": 0,
          "params": { "volume": 0.3 }
        }
      ]
    }
  ]
}
```
