---
name: media_render_tracks
description: Guide on constructing and configuring Media Render track schemas, track types, Z-index layering, and multi-track composition.
---

# Media Render Tracks Skill

This skill guides AI agents on how to construct track configurations within a Media Render manifest.

## Track Types

There are 5 track types:

| Type | Interface | Contains | Purpose |
|------|-----------|----------|---------|
| `"video"` | `VideoTrack` | `VideoElement`, `ImageElement` | Main and overlay video/image layers |
| `"text"` | `TextTrack` | `TextElement` | Titles, subtitles, captions |
| `"audio"` | `AudioTrack` | `AudioElement` | Background music, voiceovers |
| `"graphic"` | `GraphicTrack` | `StickerElement`, `GraphicElement` | Stickers, vector shapes |
| `"effect"` | `EffectTrack` | `EffectElement` | Screen-wide filters (vignette, etc.) |

---

## Track Flags

### `isMain` (VideoTrack only)
- Exactly **one** video track must have `"isMain": true`.
- The main track is rendered at the bottom of the visual stack (Z-index 0).
- All other video tracks are overlay layers stacked on top.

### `muted`
- Available on `VideoTrack` and `AudioTrack`.
- When `true`, all audio from elements in this track is silenced in the final mix.

### `hidden`
- Available on `VideoTrack`, `TextTrack`, `GraphicTrack`, `EffectTrack`.
- When `true`, the entire track is skipped during visual rendering.

---

## Z-Index Layering Order (Bottom to Top)

1. **Blur Backdrop** (auto-generated if main video has `blurIntensity`)
2. **Main Video Track** (`isMain: true`)
3. **Overlay Tracks** (rendered in **reverse** array order — index 0 is on top)
4. **Effect Tracks** (screen-wide filters applied last)

> Audio tracks are excluded from the visual stack and routed to the audio mix pipeline.

---

## Track Schema Examples

### Video Track (Main)
```json
{
  "id": "track-main",
  "name": "Main Video",
  "type": "video",
  "isMain": true,
  "muted": false,
  "hidden": false,
  "elements": [
    {
      "id": "clip-1",
      "type": "video",
      "sourceUrl": "./assets/clip.mp4",
      "startTime": 0,
      "duration": 5.0,
      "trimStart": 0,
      "trimEnd": 0,
      "params": { "volume": 1.0, "width": 640, "height": 360 }
    }
  ]
}
```

### Video Track (Overlay)
```json
{
  "id": "track-overlay-pip",
  "name": "PiP Overlay",
  "type": "video",
  "isMain": false,
  "muted": false,
  "hidden": false,
  "elements": [
    {
      "id": "pip-cam",
      "type": "video",
      "sourceUrl": "./assets/facecam.mp4",
      "startTime": 0,
      "duration": 5.0,
      "trimStart": 0,
      "trimEnd": 0,
      "params": {
        "width": 160, "height": 90,
        "transform.positionX": 200,
        "transform.positionY": 100
      }
    }
  ]
}
```

### Text Track
```json
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
        "content": "Hello World",
        "fontSize": 28,
        "color": "#FFFFFF",
        "transform.positionY": 80
      }
    }
  ]
}
```

### Audio Track
```json
{
  "id": "track-bgm",
  "name": "Background Music",
  "type": "audio",
  "muted": false,
  "elements": [
    {
      "id": "bgm-1",
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
```

### Graphic Track
```json
{
  "id": "track-stickers",
  "name": "Stickers",
  "type": "graphic",
  "hidden": false,
  "elements": [
    {
      "id": "sticker-1",
      "type": "sticker",
      "stickerId": "emoji_fire",
      "startTime": 1.0,
      "duration": 2.0,
      "trimStart": 0,
      "trimEnd": 0,
      "params": { "transform.positionX": -100, "transform.positionY": -80 }
    }
  ]
}
```

### Effect Track
```json
{
  "id": "track-effects",
  "name": "Vignette",
  "type": "effect",
  "hidden": false,
  "elements": [
    {
      "id": "vig-1",
      "type": "effect",
      "effectType": "vignette",
      "startTime": 0,
      "duration": 5.0,
      "trimStart": 0,
      "trimEnd": 0,
      "params": { "intensity": 0.6, "smoothness": 0.5, "color": "black" }
    }
  ]
}
```

---

## Multi-Track Composition Rules

1. Elements within a track are sorted by `startTime` (ascending). Ties are broken by `id` alphabetically.
2. The total project duration is calculated from the maximum `startTime + duration` across **all** tracks.
3. Gaps between elements on the same track result in transparency (no frame drawn for that track).
4. Multiple video tracks create picture-in-picture or overlay compositions.
5. Multiple audio tracks are mixed together using FFmpeg's `amix` filter.
