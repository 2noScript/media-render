# Effect Element Specification (`effect`)

This document defines the schema, behavior, and parameter options for screen-wide filter and overlay effects in the timeline.

## 📝 Element Schema

```json
{
  "id": "vignette-effect-example",
  "name": "Soft Vignette",
  "type": "effect",
  "effectType": "vignette",
  "startTime": 0.0,
  "duration": 5.0,
  "params": {
    "color": "black",
    "intensity": 0.6,
    "smoothness": 0.5
  }
}
```

## ⚙️ Properties & Parameters

### Root Properties
| Property | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `id` | `string` | *Required* | Unique identifier of the element. |
| `name` | `string` | `""` | User-friendly display name. |
| `type` | `string` | `"effect"` | Must be set strictly to `"effect"`. |
| `effectType` | `string` | *Required* | Type of filter effect to apply (currently supports `"vignette"`). |
| `startTime` | `number` | `0` | Timeline position in seconds where the effect becomes active. |
| `duration` | `number` | *Required* | Duration in seconds the effect is active. |

### Parameters (`params`)
For `effectType: "vignette"`:
| Parameter Key | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `color` | `string` | `"black"` | Color of the vignette border shading. |
| `intensity` | `number` | `0.5` | Vignette shading density/opacity factor (`0.0` to `1.0`). |
| `smoothness` | `number` | `0.5` | Vignette center gradient blur radius factor (`0.0` to `1.0`). |
