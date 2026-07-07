import { VisualNode } from "./visual-node";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";

export class GraphicNode extends VisualNode {
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
    const resolved = this.resolved;
    if (!resolved) return { items: [], textures: [] };
    const textureId = `${path}:graphic`;
    const width = resolved.width || 100;
    const height = resolved.height || 100;

    const texture: TextureUploadDescriptor = {
      kind: "rendered",
      id: textureId,
      contentHash: `graphic:${this.params.definitionId}:${width}:${height}`,
      width,
      height,
      draw: (ctx) => {
        ctx.fillStyle = "#FF3366"; // Standard placeholder graphic color
        if (this.params.definitionId === "circle") {
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, width, height);
        }
      },
    };

    const { centerX, centerY } = this.resolveCenter(
      resolved,
      renderer.width,
      renderer.height
    );

    const item: FrameItemDescriptor = {
      type: "layer",
      textureId,
      transform: {
        centerX,
        centerY,
        width,
        height,
        rotationDegrees: resolved.rotationDegrees ?? 0,
        flipX: resolved.flipX ?? false,
        flipY: resolved.flipY ?? false,
      },
      opacity: resolved.opacity ?? 1.0,
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
nodeRegistry.register("graphic", (el) => {
  return new GraphicNode(el);
});
