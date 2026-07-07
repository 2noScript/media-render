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
    const width = this.params.width ?? this.params.params?.["width"] ?? renderer.width;
    const height = this.params.height ?? this.params.params?.["height"] ?? renderer.height;
    const color = this.params.color ?? this.params.params?.["color"] ?? "#000000";
    const xVal = this.params.x ?? this.params.params?.["transform.positionX"] ?? 0;
    const yVal = this.params.y ?? this.params.params?.["transform.positionY"] ?? 0;

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
        centerX: xVal + width / 2,
        centerY: yVal + height / 2,
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

