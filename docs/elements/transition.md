# Transition System & Plugin Architecture

This document describes the design, implementation, and extension pattern of the transition rendering system in `media-render`.

---

## 🗺️ 1. Architecture Overview

Transitions in OpenCut are registry-driven, decoupling visual effect rendering from the core timeline traversal.

```
+--------------------------------------------------------------------------+
|                            CanvasRenderer                                |
+--------------------------------------------------------------------------+
                                     │
                                     ▼
+--------------------------------------------------------------------------+
|                         TransitionNode (resolve)                         |
|  - Identifies fromNode (outgoing) & toNode (incoming)                    |
|  - Calculates transition progress (0.0 -> 1.0) and applies easing        |
|  - Force-resolves toNode (since it is technically inactive on timeline)  |
+--------------------------------------------------------------------------+
                                     │
                                     ▼
+--------------------------------------------------------------------------+
|                         TransitionNode (render)                          |
|  - Renders fromNode to temporary offscreen fromCanvas                    |
|  - Renders toNode to temporary offscreen toCanvas                        |
|  - Invokes matched TransitionRenderer.render() on output context          |
|  - Exposes output canvas as a single compositor layer                     |
+--------------------------------------------------------------------------+
```

---

## ⚙️ 2. Core Typings

The system is defined in `media-render/src/transitions/types.ts`:

### `TransitionDefinition`
Defines registry metadata, parameters, and the rendering logic:
```typescript
export interface TransitionDefinition {
  type: string;             // Registry key (matches TransitionElement.transitionType)
  name: string;             // Human-readable name
  group: string;            // Organising category (e.g. Basic, Slide, Zoom)
  keywords: string[];
  defaultDuration?: number; // fallback duration in seconds
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out"; // Static easing curve
  params: TransitionParamDefinition[]; // schema for custom parameters
  renderer: TransitionRenderer;
}
```

### `TransitionRenderer`
Performs Canvas 2D drawing operations to blend the two source surfaces:
```typescript
export interface TransitionRenderContext {
  fromCanvas: Canvas | null; // Outgoing frame surface
  toCanvas: Canvas | null;   // Incoming frame surface
  progress: number;          // Blend progress (0.0 to 1.0, eased)
  params: Record<string, any>; // custom param values
  width: number;
  height: number;
  output: CanvasRenderingContext2D; // target canvas context to draw onto
}

export interface TransitionRenderer {
  render(ctx: TransitionRenderContext): void;
}
```

---

## 🎨 3. Custom Param Schema

Custom parameters (e.g. intensity, angle, frequency) can be configured per transition and will be exposed to the inspector UI.

```typescript
export interface TransitionParamDefinition {
  key: string;
  label: string;
  type: "number" | "color" | "boolean" | "select";
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
}
```

---

## 🚀 4. How to Add a New Transition (Step-by-Step)

To add a new transition effect (e.g. "wipe_right"):

### Step 1: Create the definition file
Create a file under `src/transitions/definitions/` (e.g. `src/transitions/definitions/wipe.ts`):

```typescript
import type { TransitionDefinition } from "../types";

export const wipeRightDefinition: TransitionDefinition = {
  type: "wipe_right",
  name: "Wipe Right",
  group: "Slide",
  keywords: ["wipe", "right", "slide", "reveal"],
  defaultDuration: 0.5,
  easing: "ease-in-out",
  params: [],
  renderer: {
    render({ fromCanvas, toCanvas, progress, width, height, output }) {
      output.clearRect(0, 0, width, height);
      const boundaryX = progress * width;

      // Draw outgoing clip on the left
      if (fromCanvas) {
        output.save();
        output.beginPath();
        output.rect(boundaryX, 0, width - boundaryX, height);
        output.clip();
        output.drawImage(fromCanvas, 0, 0, width, height);
        output.restore();
      }

      // Draw incoming clip on the right
      if (toCanvas) {
        output.save();
        output.beginPath();
        output.rect(0, 0, boundaryX, height);
        output.clip();
        output.drawImage(toCanvas, 0, 0, width, height);
        output.restore();
      }
    }
  }
};
```

### Step 2: Register the new definition
Import and register the definition in `src/transitions/definitions/index.ts`:

```typescript
import { wipeRightDefinition } from "./wipe";

export function registerDefaultTransitions(): void {
  registerTransitions(
    // ... other transitions
    wipeRightDefinition
  );
}
```

Now, the system will automatically parse and render `"wipe_right"` when it appears in the manifest!
