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

    const textVal = this.params.text ?? this.params.params?.["content"] ?? "";
    const fontFamilyVal = this.params.style?.fontFamily ?? this.params.params?.["fontFamily"] ?? "sans-serif";
    const fontSizeVal = this.params.style?.fontSize ?? this.params.params?.["fontSize"] ?? 40;
    const fontWeightVal = this.params.style?.fontWeight ?? this.params.params?.["fontWeight"] ?? "normal";
    const textAlignVal = this.params.style?.textAlign ?? this.params.params?.["textAlign"] ?? "center";
    const colorVal = this.params.style?.color ?? this.params.params?.["color"] ?? "white";
    const strokeColorVal = this.params.style?.strokeColor ?? this.params.params?.["strokeColor"];
    const strokeWidthVal = this.params.style?.strokeWidth ?? this.params.params?.["strokeWidth"];

    const contentHash = `text:${textVal}:${fontFamilyVal}:${fontSizeVal}:${fontWeightVal}:${textAlignVal}:${colorVal}:${strokeColorVal}:${strokeWidthVal}:${JSON.stringify(resolved)}`;

    const texture: TextureUploadDescriptor = {
      kind: "rendered",
      id: textureId,
      contentHash,
      width,
      height,
      draw: (ctx) => {
        ctx.save();
        ctx.font = `${fontWeightVal} ${fontSizeVal}px "${fontFamilyVal}"`;
        ctx.textBaseline = "middle";
        ctx.textAlign = textAlignVal as any;

        const posX = resolved.x;
        const posY = resolved.y;

        if (strokeColorVal && strokeWidthVal) {
          ctx.strokeStyle = strokeColorVal;
          ctx.lineWidth = strokeWidthVal;
          ctx.lineJoin = "round";
          ctx.strokeText(textVal, posX, posY);
        }

        ctx.fillStyle = colorVal;
        ctx.fillText(textVal, posX, posY);
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

