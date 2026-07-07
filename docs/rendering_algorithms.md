# Developer Guide: Rendering and Animation Algorithms

This document provides a detailed breakdown of the mathematical formulas, algorithms, and logical structures used to composite frames and resolve animations in `media-render`.

---

## 1. 2D Affine Transformation Matrix Algorithm

To support translation, rotation, and axis-flipping around an element's custom origin (its center coordinate) without distorting the layout, the renderer applies a sequence of affine transforms on the 2D Skia Canvas.

### Mathematical Operations Sequence

Given an element with center coordinates $(C_x, C_y)$, rotation angle $\theta$ (in degrees), and scale factors $S_x$ (`flipX ? -1 : 1`) and $S_y$ (`flipY ? -1 : 1`), the transformation matrix $M$ is calculated by:

$$M = T(C_x, C_y) \times R(\theta) \times S(S_x, S_y) \times T(-C_x, -C_y)$$

Where:
* $T(u, v)$ is the Translation matrix.
* $R(\theta)$ is the Rotation matrix.
* $S(s_x, s_y)$ is the Scaling matrix.

### Canvas Implementation (`src/core/renderer/compositor/skia-compositor.ts`)

```typescript
// 1. Shift context origin to the element center
targetCtx.translate(transform.centerX, transform.centerY);

// 2. Rotate the coordinates by angle theta (converted to radians)
targetCtx.rotate((transform.rotationDegrees * Math.PI) / 180);

// 3. Mirror/Scale coordinates
targetCtx.scale(flipX, flipY);

// 4. Shift origin back to execute the relative drawing
targetCtx.translate(-transform.centerX, -transform.centerY);

// 5. Draw the texture source image
targetCtx.drawImage(textureSource, x, y, transform.width, transform.height);
```

This guarantees that rotation and flipping are applied relative to the element's actual midpoint rather than the canvas top-left `(0, 0)` origin.

---

## 2. Keyframe Linear Interpolation (LERP) Algorithm

Properties such as coordinates, scale, angle, and opacity can change over time through editor keyframes. The animation engine calculates intermediate values at any time $t$ using linear interpolation.

### Mathematical Formula

If time $t$ falls between keyframe times $t_1$ and $t_2$, the interpolation ratio $r$ is:

$$r = \frac{t - t_1}{t_2 - t_1}$$

The resolved value $V$ is calculated using the LERP formula:

$$V = V_1 + (V_2 - V_1) \times r$$

Where $V_1$ is the value at $t_1$ and $V_2$ is the value at $t_2$.

### Code Implementation (`src/core/renderer/animation-resolver.ts`)

```typescript
export function interpolateLinear(startValue: number, endValue: number, ratio: number): number {
  return startValue + (endValue - startValue) * ratio;
}

export function resolveAnimatedValue<T extends number | string | boolean>(
  keyframes: Keyframe<T>[] | undefined,
  localTime: number,
  fallbackValue: T
): T {
  if (!keyframes || keyframes.length === 0) return fallbackValue;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Boundary checks
  if (localTime <= sorted[0].time) return sorted[0].value;
  if (localTime >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  // Linear Interpolation loop
  for (let i = 0; i < sorted.length - 1; i++) {
    const k1 = sorted[i];
    const k2 = sorted[i + 1];
    if (localTime >= k1.time && localTime <= k2.time) {
      if (typeof k1.value === "number" && typeof k2.value === "number") {
        const ratio = (localTime - k1.time) / (k2.time - k1.time);
        return interpolateLinear(k1.value, k2.value, ratio) as any;
      }
      return k1.value; // Step interpolation fallback for strings/booleans
    }
  }

  return fallbackValue;
}
```

---

## 3. Texture Cache & Hashing Algorithm (Incremental Rendering)

To avoid drawing static offscreen canvases repeatedly (which degrades CPU export performance), the compositor uses a cached-rendered texture mapping.

### Logic Flow

```
                      ┌─────────────────────────────────┐
                      │ TextureUploadDescriptor received│
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                             /─────────────────\
                            <  Is texture.id   >
                            <   cached in Map? >
                             \─────────────────/
                               Yes│       │No
                                  ▼       └─────────────────┐
                      /─────────────────────────\           │
                     <   Do dimensions and       >          │
                     <   contentHash match?      >          │
                      \─────────────────────────/           │
                        Yes│               │No              │
                           ▼               ▼                ▼
                     ┌──────────┐ ┌─────────────────┐ ┌─────────────┐
                     │ Skip     │ │ Clear existing  │ │ Create new  │
                     │ Re-draw  │ │ canvas surface  │ │ Canvas      │
                     └──────────┘ └────────┬────────┘ └──────┬──────┘
                                           │                 │
                                           ▼                 ▼
                                  ┌─────────────────────────────────┐
                                  │   Invoke texture.draw(ctx)      │
                                  └─────────────────────────────────┘
```

This ensures only "dirty" or modified text/image elements are re-drawn, while static layers are instantly composited from the cache map.

---

## 4. Scene Graph Traversal Algorithm

The rendering engine represents the timeline layout as a tree of Nodes.

1. **Tree Initialization**: `CanvasRenderer` constructs a `RootNode` representing the composite duration of the video.
2. **Two-Pass Layer Partitioning**:
   - **Pass 1 (Blur Backdrops)**: Traverse primary track visual elements and prepend offscreen `BlurBackgroundNode` instances.
   - **Pass 2 (Visual Elements)**: Traverse tracks (reversed overlay order) to compile nodes like `VideoNode`, `TextNode`, `GraphicNode`.
3. **Recursive Collection**: `rootNode.buildFrame()` recursively requests all children to resolve their active layouts and textures at timestamp $t$, resulting in a flattened drawing queue of `FrameItemDescriptor` items sent to the compositor.
