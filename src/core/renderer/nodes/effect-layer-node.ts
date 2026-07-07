import { BaseNode } from "./base-node";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";

export class EffectLayerNode extends BaseNode {
  constructor(params: any) {
    super(params);
  }

  buildFrame(
    renderer: CanvasRenderer,
    path: string
  ): {
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  } {
    const textureId = `${path}:effect`;
    const width = renderer.width;
    const height = renderer.height;

    const texture: TextureUploadDescriptor = {
      kind: "rendered",
      id: textureId,
      contentHash: `effect:${this.params.effectType}:${width}:${height}`,
      width,
      height,
      draw: (ctx) => {
        if (this.params.effectType === "vignette") {
          const cx = width / 2;
          const cy = height / 2;
          const innerRadius = Math.min(cx, cy) * 0.5;
          const outerRadius = Math.max(cx, cy) * 1.2;
          const gradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
          gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
          gradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        } else {
          ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
          ctx.fillRect(0, 0, width, height);
        }
      },
    };

    const item: FrameItemDescriptor = {
      type: "layer",
      textureId,
      transform: {
        centerX: width / 2,
        centerY: height / 2,
        width,
        height,
        rotationDegrees: 0,
        flipX: false,
        flipY: false,
      },
      opacity: 1.0,
      blendMode: "normal",
      mask: null,
    };

    return {
      items: [item],
      textures: [texture],
    };
  }
}

import { nodeRegistry } from "./registry";
nodeRegistry.register("effect", (el) => {
  return new EffectLayerNode(el);
});
