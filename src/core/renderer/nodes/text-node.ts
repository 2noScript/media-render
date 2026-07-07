import { VisualNode } from "./visual-node";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";

export class TextNode extends VisualNode {
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
    const textureId = `${path}:text`;
    const resolved = this.resolved;
    if (!resolved) return { items: [], textures: [] };
    const { width, height } = renderer;

    const params = this.params as any;
    const textVal = params.text ?? params.params?.["content"] ?? "";
    const fontFamilyVal = params.fontFamily ?? params.params?.["fontFamily"] ?? "sans-serif";
    const fontSizeVal = params.fontSize ?? params.params?.["fontSize"] ?? 40;
    const fontWeightVal = params.fontWeight ?? params.params?.["fontWeight"] ?? "normal";
    const textAlignVal = params.textAlign ?? params.params?.["textAlign"] ?? "center";
    const colorVal = params.color ?? params.params?.["color"] ?? "white";
    const strokeColorVal = params.strokeColor ?? params.params?.["strokeColor"];
    const strokeWidthVal = params.strokeWidth ?? params.params?.["strokeWidth"];

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

        const posX = (renderer.width / 2) + resolved.x;
        const posY = (renderer.height / 2) + resolved.y;

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

