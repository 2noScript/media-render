import { VisualNode } from "./visual-node";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";

export class TextNode extends VisualNode {
  constructor(params: any) {
    super(params);
  }

  async buildFrame(
    time: number,
    renderer: CanvasRenderer,
    path: string
  ): Promise<{
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  }> {
    const textureId = `${path}:text`;
    const resolved = this.resolveState(time);
    const { width, height } = renderer;

    const contentHash = `text:${this.params.text}:${JSON.stringify(this.params.style)}:${JSON.stringify(resolved)}`;

    const texture: TextureUploadDescriptor = {
      kind: "rendered",
      id: textureId,
      contentHash,
      width,
      height,
      draw: (ctx) => {
        ctx.save();
        ctx.font = `${this.params.style?.fontWeight || "normal"} ${this.params.style?.fontSize || 40}px "${this.params.style?.fontFamily || "sans-serif"}"`;
        ctx.textBaseline = "middle";
        ctx.textAlign = this.params.style?.textAlign || "center";

        const posX = resolved.x;
        const posY = resolved.y;

        if (this.params.style?.strokeColor && this.params.style?.strokeWidth) {
          ctx.strokeStyle = this.params.style.strokeColor;
          ctx.lineWidth = this.params.style.strokeWidth;
          ctx.lineJoin = "round";
          ctx.strokeText(this.params.text, posX, posY);
        }

        ctx.fillStyle = this.params.style?.color || "white";
        ctx.fillText(this.params.text, posX, posY);
        ctx.restore();
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
      opacity: resolved.opacity,
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
nodeRegistry.register("text", (el) => {
  return new TextNode(el);
});

