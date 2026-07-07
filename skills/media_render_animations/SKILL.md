---
name: media_render_animations
description: Guide on constructing keyframe animation schemas for Media Render timeline elements.
---

# Media Render Animations Skill

This skill guides AI agents on how to define keyframe animations on timeline elements within a Media Render manifest.

## Overview

Animations are defined per-element inside the `animations` object. Each key is a **property path** that maps to a visual attribute. The engine resolves animated values at each frame using linear interpolation (LERP) for numbers and step interpolation for strings/booleans.

---

## Animatable Property Paths

| Property Path | Type | Description |
|--------------|------|-------------|
| `opacity` | `number` | Element opacity (0.0–1.0) |
| `transform.positionX` | `number` | Horizontal offset from center (px) |
| `transform.positionY` | `number` | Vertical offset from center (px) |
| `transform.scaleX` | `number` | Horizontal scale multiplier |
| `transform.scaleY` | `number` | Vertical scale multiplier |
| `transform.rotate` | `number` | Rotation in degrees |
| `width` | `number` | Element width (px) |
| `height` | `number` | Element height (px) |

---

## Keyframe Format

Each animation channel contains an array of `keys`. Each key defines a value at a specific **local time** (relative to the element's `startTime`, not the global timeline).

### Simple Format (Flat Array)

```json
{
  "animations": {
    "opacity": [
      { "id": "k1", "time": 0, "value": 0 },
      { "id": "k2", "time": 0.5, "value": 1 },
      { "id": "k3", "time": 4.5, "value": 1 },
      { "id": "k4", "time": 5.0, "value": 0 }
    ]
  }
}
```

### Channel Format (With Interpolation Metadata)

```json
{
  "animations": {
    "opacity": {
      "keys": [
        {
          "id": "k1",
          "time": 0,
          "value": 0,
          "segmentToNext": "linear",
          "tangentMode": "auto"
        },
        {
          "id": "k2",
          "time": 1.0,
          "value": 1,
          "segmentToNext": "linear",
          "tangentMode": "auto"
        }
      ],
      "extrapolation": {
        "before": "hold",
        "after": "hold"
      }
    }
  }
}
```

---

## Interpolation Types

| `segmentToNext` | Behavior |
|-----------------|----------|
| `"linear"` | Linear interpolation (LERP) between keyframes |
| `"step"` | Holds the current value until the next keyframe |
| `"bezier"` | Cubic bezier curve (uses `leftHandle`/`rightHandle`) |

> The engine currently resolves all numeric values using **linear interpolation**. String and boolean values use **step interpolation** (hold until next key).

---

## Extrapolation Modes

| Mode | Behavior |
|------|----------|
| `"hold"` | Holds the first/last keyframe value outside the range |
| `"linear"` | Extends the slope of the nearest segment |

---

## Resolution Logic

At each frame, the engine:
1. Computes `localTime = globalTime - element.startTime`.
2. Finds the two surrounding keyframes for each animated property.
3. Calculates the interpolation ratio: `ratio = (localTime - k1.time) / (k2.time - k1.time)`.
4. Applies LERP: `value = k1.value + (k2.value - k1.value) * ratio`.
5. If `localTime` is before the first key, returns the first key's value.
6. If `localTime` is after the last key, returns the last key's value.

---

## Common Animation Patterns

### Fade In / Fade Out
```json
{
  "animations": {
    "opacity": [
      { "id": "k1", "time": 0, "value": 0 },
      { "id": "k2", "time": 0.3, "value": 1 },
      { "id": "k3", "time": 4.7, "value": 1 },
      { "id": "k4", "time": 5.0, "value": 0 }
    ]
  }
}
```

### Slide In From Left
```json
{
  "animations": {
    "transform.positionX": [
      { "id": "k1", "time": 0, "value": -300 },
      { "id": "k2", "time": 0.5, "value": 0 }
    ]
  }
}
```

### Scale Up Entrance
```json
{
  "animations": {
    "transform.scaleX": [
      { "id": "k1", "time": 0, "value": 0.5 },
      { "id": "k2", "time": 0.4, "value": 1.0 }
    ],
    "transform.scaleY": [
      { "id": "k1", "time": 0, "value": 0.5 },
      { "id": "k2", "time": 0.4, "value": 1.0 }
    ]
  }
}
```

### Combined Fade + Slide
```json
{
  "animations": {
    "opacity": [
      { "id": "k1", "time": 0, "value": 0 },
      { "id": "k2", "time": 0.5, "value": 1 }
    ],
    "transform.positionY": [
      { "id": "k1", "time": 0, "value": 50 },
      { "id": "k2", "time": 0.5, "value": 0 }
    ]
  }
}
```
