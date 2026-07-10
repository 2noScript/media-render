# Timeline Simulation Case: From JSON to Rendered Video

This document simulates a complete timeline scenario (a 5-second promotional clip) and traces the step-by-step rendering sequence for a specific timestamp to illustrate the exact composition order.

---

## 📅 1. Timeline Setup (Simulated Project)

We want to render a **5-second video** (Resolution: 1280x720, 30 FPS). The track layout is structured from top-most layer (drawn last) to bottom-most layer (drawn first) as follows:

```
Timeline:           0s ──────────────────────── 2.5s ──────────────────────── 5s
[Z-Index 4: Top]    ✨ Screen Effect (Overlay 0)     [Placed in: tracks.overlay] ───────────────────────────
[Z-Index 3: High]   💬 Subtitle Caption (Overlay 1)  [Placed in: tracks.overlay] ━━━━ (2s - 4s) ━━━━
[Z-Index 2: Mid]    🏷️ Logo Sticker (Overlay 2)      [Placed in: tracks.overlay] ━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Z-Index 1: Bottom] 🎬 Main Video (Main Track)       [Placed in: tracks.main]    ───────────────────────────
[Audio: No Z-Index] 🎵 BG Music (Audio Track)        [Placed in: tracks.audio]   ───────────────────────────
```

### Manifest JSON Payload:
```json
{
  "id": "promo-timeline-simulation",
  "settings": {
    "width": 1280,
    "height": 720,
    "fps": 30,
    "format": "mp4",
    "shouldIncludeAudio": true
  },
  "tracks": {
    "main": {
      "id": "track-main-video",
      "name": "Main Track",
      "type": "video",
      "isMain": true,
      "muted": false,
      "hidden": false,
      "elements": [
        {
          "id": "video-bg",
          "type": "video",
          "startTime": 0.0,
          "duration": 5.0,
          "trimStart": 10.0,
          "trimEnd": 0,
          "sourceUrl": "./test-assets/mov_bbb.mp4",
          "params": {
            "volume": 0.5,
            "width": 800,
            "height": 600,
            "transform.positionX": 0,
            "transform.positionY": 0,
            "blurIntensity": 15
          }
        }
      ]
    },
    "audio": [
      {
        "id": "track-audio-bgm",
        "name": "BGM Track",
        "type": "audio",
        "elements": [
          {
            "id": "music-beat",
            "type": "audio",
            "startTime": 0.0,
            "duration": 5.0,
            "trimStart": 0,
            "trimEnd": 0,
            "sourceUrl": "./test-assets/synth_bgm.mp3",
            "params": {
              "volume": 0.4,
              "muted": false
            }
          }
        ]
      }
    ],
    "overlay": [
      {
        "id": "track-effect-layers",
        "name": "Filter Track",
        "type": "effect",
        "hidden": false,
        "elements": [
          {
            "id": "effect-vignette",
            "type": "effect",
            "startTime": 0.0,
            "duration": 5.0,
            "effectType": "vignette",
            "params": {
              "color": "black",
              "intensity": 0.7
            }
          }
        ]
      },
      {
        "id": "track-text-subtitles",
        "name": "Subtitle Track",
        "type": "text",
        "hidden": false,
        "elements": [
          {
            "id": "sub-1",
            "type": "text",
            "startTime": 2.0,
            "duration": 2.0,
            "params": {
              "content": "Welcome everyone!",
              "fontSize": 48,
              "color": "#FFFFFF",
              "fontFamily": "Roboto",
              "textAlign": "center",
              "strokeColor": "#000000",
              "strokeWidth": 4,
              "transform.positionX": 0,
              "transform.positionY": 240
            }
          }
        ]
      },
      {
        "id": "track-overlay-stickers",
        "name": "Sticker Track",
        "type": "graphic",
        "hidden": false,
        "elements": [
          {
            "id": "sticker-logo",
            "type": "sticker",
            "stickerId": "brand_logo",
            "startTime": 1.0,
            "duration": 4.0,
            "params": {
              "transform.positionX": 410,
              "transform.positionY": -210,
              "transform.scaleX": 1.0,
              "transform.scaleY": 1.0
            },
            "animations": {
              "transform.opacity": [
                { "time": 0, "value": 0.0 },
                { "time": 1.0, "value": 1.0 }
              ]
            }
          }
        ]
      }
    ]
  }
}
```

---

## 🎯 2. Walkthrough Case: Rendering Frame at $t = 2.5\text{s}$

Here is the exact step-by-step sequence of events executed by the engine to compute and draw the frame at the $2.5\text{s}$ mark:

### Step 1: Active Element Filtering (Temporal Filtering)
The engine checks the active state of each element at $t = 2.5\text{s}$:
- **`effect-vignette`**: $0.0 \le 2.5 < 5.0 \implies$ **Active**.
- **`sub-1`**: $2.0 \le 2.5 < 4.0 \implies$ **Active**.
- **`sticker-logo`**: $1.0 \le 2.5 < 5.0 \implies$ **Active**.
- **`video-bg`**: $0.0 \le 2.5 < 5.0 \implies$ **Active**.
- **`music-beat`**: $0.0 \le 2.5 < 5.0 \implies$ **Active (Audio Mixing)**.

---

### Step 2: Z-Index Layer Ordering (Z-Index Sorting)
The engine builds the visual draw tree from bottom to top:
1. **Background Backdrop (Z-Index = 0)**: Created dynamically due to `blurIntensity: 15` on `video-bg` $\implies$ Instantiates `BlurBackgroundNode`.
2. **Main Video Clip (Z-Index = 1)**: Base video frame `video-bg` (from `tracks.main`).
3. **Sticker Logo Layer (Z-Index = 2)**: Sticker icon `sticker-logo` (from the sticker overlay track).
4. **Text Subtitle Layer (Z-Index = 3)**: Title caption `sub-1` (from the text overlay track).
5. **Vignette Filter Layer (Z-Index = 4)**: The screen vignetting shading effect (from the effect overlay track).

*(Note: The `overlay` array is traversed in reverse order to ensure text tracks are rendered on top of everything else).*

---

### Step 3: Keyframe Animation Interpolation
At $t = 2.5\text{s}$, the local clip time for `sticker-logo` is $t_{\text{local}} = 2.5 - 1.0 = 1.5\text{s}$.
- Opacity keyframe timeline:
  - Key $K_1$ at $0\text{s}$: value `0.0`.
  - Key $K_2$ at $1.0\text{s}$: value `1.0`.
- Because $t_{\text{local}} = 1.5\text{s}$ exceeds the final keyframe timestamp ($1.0\text{s}$), the engine clamps to the final value:
  $$\text{opacity} = 1.0 \quad (\text{Fully visible})$$

---

### Step 4: Canvas Composition Draw Loop
```
[Start Frame Render 2.5s]
  │
  ├── 1. Render Layer 1 (Blur Background - Z-Index 0)
  │      - Retrieve frame at timestamp: 2.5 + trimStart (10.0) = 12.5s from VideoReader.
  │      - Stretch raw 800x600 image to fit entire 1280x720 canvas viewport.
  │      - Apply Skia context blur filter blur(15px).
  │
  ├── 2. Render Layer 2 (Main Video Clip - Z-Index 1)
  │      - Draw decoded gameplay frame at 12.5s centered onto the main canvas.
  │      - Dimensions: 800x600, positioned at center offset (x = 0, y = 0).
  │
  ├── 3. Render Layer 3 (Sticker Logo - Z-Index 2)
  │      - Draw "brand_logo" sticker graphics at offset x = 410, y = -210.
  │      - Bounds: 150x150, opacity = 1.0.
  │
  ├── 4. Render Layer 4 (Subtitle Text - Z-Index 3)
  │      - Set font Roboto, size 48px.
  │      - Stroke outer black outline with thickness 4px.
  │      - Draw white subtitle text centered at y = 240.
  │
  ├── 5. Render Layer 5 (Vignette Effect - Z-Index 4)
  │      - Compose darken overlay vignette onto the whole screen.
  │
[End Frame Render ──> Send complete canvas frame to CanvasSource to encode]
```

---

## 🎭 3. Case 2: Multiple Video Tracks (Picture-in-Picture)

This scenario details composition with a main background gameplay video and a smaller overlay facecam PiP video.

```
Timeline:           0s ──────────────────────── 3.0s ──────────────────────── 5s
[Z-Index 2: Top]    🖼️ Overlay Video PIP            [Placed in: tracks.overlay] ━━━━ (2s - 4s) ━━━━
[Z-Index 1: Bottom] 🎬 Main Video Background         [Placed in: tracks.main]    ───────────────────────────
```

### JSON Manifest (Tracks excerpt):
```json
{
  "tracks": {
    "main": {
      "id": "track-main-video",
      "type": "video",
      "isMain": true,
      "elements": [
        {
          "id": "video-bg",
          "type": "video",
          "startTime": 0.0,
          "duration": 5.0,
          "sourceUrl": "./test-assets/gameplay.mp4",
          "params": {
            "volume": 0.2,
            "width": 1280,
            "height": 720
          }
        }
      ]
    },
    "audio": [],
    "overlay": [
      {
        "id": "track-pip-video",
        "type": "video",
        "elements": [
          {
            "id": "pip-clip",
            "type": "video",
            "startTime": 2.0,
            "duration": 2.0,
            "sourceUrl": "./test-assets/facecam.mp4",
            "params": {
              "volume": 0.8,
              "width": 320,
              "height": 180,
              "transform.positionX": -430,
              "transform.positionY": -220
            }
          }
        ]
      }
    ]
  }
}
```

### Render sequence at $t = 3.0\text{s}$:
1. **Temporal filtering**:
   - `video-bg` is active.
   - `pip-clip` is active.
2. **Drawing**:
   - Draw background `gameplay.mp4` frame at full 1280x720 size at Z-Index: 1.
   - Draw facecam `facecam.mp4` frame at 320x180 offset at `(-430, -220)` at Z-Index: 2.
3. **Audio**:
   - Blend audio samples from `gameplay.mp4` (volume `0.2`) and `facecam.mp4` (volume `0.8`) into a single PCM stream.
