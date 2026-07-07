import { BaseNode } from "./base-node";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";

export class ColorNode extends BaseNode {
  constructor(params: any) {
    super(params);
  }

  async buildFrame(
    _time: number,
    renderer: CanvasRenderer,
    path: string
  ): Promise<{
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  }> {
    const textureId = `${path}:color`;
    const width = this.params.width || renderer.width;
    const height = this.params.height || renderer.height;
    const color = this.params.color || "#000000";

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

    const item: FrameItemDescriptor = {
      type: "layer",
      textureId,
      transform: {
        centerX: (this.params.x || 0) + width / 2,
        centerY: (this.params.y || 0) + height / 2,
        width,
        height,
        rotationDegrees: 0,
        flipX: false,
        flipY: false,
      },
      opacity: 1,
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

