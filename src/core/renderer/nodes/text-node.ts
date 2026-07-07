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
    const params = this.params as any;
    const { width, height } = renderer;
    const textVal = params.text ?? params.params?.["content"] ?? "";
    const fontFamilyVal = params.fontFamily ?? params.params?.["fontFamily"] ?? "sans-serif";
    const fontSizeVal = params.fontSize ?? params.params?.["fontSize"] ?? 40;
    const fontWeightVal = params.fontWeight ?? params.params?.["fontWeight"] ?? "normal";
    const textAlignVal = params.textAlign ?? params.params?.["textAlign"] ?? "center";
    const colorVal = params.color ?? params.params?.["color"] ?? "white";
    const strokeColorVal = params.strokeColor ?? params.params?.["strokeColor"];
    const strokeWidthVal = params.strokeWidth ?? params.params?.["strokeWidth"];

    const backgroundEnabledVal = params.params?.["background.enabled"] !== undefined 
      ? params.params["background.enabled"] 
      : (params.backgroundColor !== undefined || params.params?.["backgroundColor"] !== undefined || params.params?.["bgColor"] !== undefined);

    const backgroundColorVal = params.params?.["background.color"] 
      ?? params.backgroundColor 
      ?? params.params?.["backgroundColor"] 
      ?? params.params?.["bgColor"] 
      ?? "transparent";

    const backgroundCornerRadiusVal = params.params?.["background.cornerRadius"] ?? 0;
    
    const backgroundPaddingXVal = params.params?.["background.paddingX"] 
      ?? params.backgroundPadding 
      ?? params.params?.["backgroundPadding"] 
      ?? 8;

    const backgroundPaddingYVal = params.params?.["background.paddingY"] 
      ?? params.backgroundPadding 
      ?? params.params?.["backgroundPadding"] 
      ?? 8;

    const backgroundOffsetXVal = params.params?.["background.offsetX"] ?? 0;
    const backgroundOffsetYVal = params.params?.["background.offsetY"] ?? 0;

    const contentHash = `text:${textVal}:${fontFamilyVal}:${fontSizeVal}:${fontWeightVal}:${textAlignVal}:${colorVal}:${strokeColorVal}:${strokeWidthVal}:${backgroundEnabledVal}:${backgroundColorVal}:${backgroundCornerRadiusVal}:${backgroundPaddingXVal}:${backgroundPaddingYVal}:${backgroundOffsetXVal}:${backgroundOffsetYVal}:${JSON.stringify(resolved)}`;

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

        if (backgroundEnabledVal && backgroundColorVal && backgroundColorVal !== "transparent") {
          const metrics = ctx.measureText(textVal);
          const textWidth = metrics.width;
          const textHeight = fontSizeVal; // Approximate font height

          let rectX = posX + backgroundOffsetXVal;
          const rectY = posY - textHeight / 2 - backgroundPaddingYVal + backgroundOffsetYVal;
          const rectW = textWidth + backgroundPaddingXVal * 2;
          const rectH = textHeight + backgroundPaddingYVal * 2;

          if (textAlignVal === "center") {
            rectX = posX - textWidth / 2 - backgroundPaddingXVal + backgroundOffsetXVal;
          } else if (textAlignVal === "right" || textAlignVal === "end") {
            rectX = posX - textWidth - backgroundPaddingXVal + backgroundOffsetXVal;
          } else {
            rectX = posX - backgroundPaddingXVal + backgroundOffsetXVal;
          }

          ctx.fillStyle = backgroundColorVal;
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === "function" && backgroundCornerRadiusVal > 0) {
            const p = Math.max(0, Math.min(backgroundCornerRadiusVal, 100)) / 100;
            const radius = (Math.min(rectW, rectH) / 2) * p;
            (ctx as any).roundRect(rectX, rectY, rectW, rectH, radius);
          } else {
            ctx.rect(rectX, rectY, rectW, rectH);
          }
          ctx.fill();
        }

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

