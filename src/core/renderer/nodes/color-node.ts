import { VisualNode } from "./visual-node";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";

export class ColorNode extends VisualNode {
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
    const textureId = `${path}:color`;
    const resolved = this.resolved;
    if (!resolved) return { items: [], textures: [] };
    
    const width = resolved.width ?? renderer.width;
    const height = resolved.height ?? renderer.height;
    const color = this.params.params?.["color"] ?? "#000000";

    const texture: TextureUploadDescriptor = {
      kind: "rendered",
      id: textureId,
      contentHash: `color:${color}:${width}x${height}`,
      width,
      height,
      draw: (ctx) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
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
        rotationDegrees: 0,
        flipX: false,
        flipY: false,
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
nodeRegistry.register("color", (el) => {
  return new ColorNode(el);
});
