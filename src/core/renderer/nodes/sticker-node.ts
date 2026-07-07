import { VisualNode } from "./visual-node";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";

export class StickerNode extends VisualNode {
  private image: any;

  constructor(params: any, image: any) {
    super(params);
    this.image = image;
  }

  buildFrame(
    renderer: CanvasRenderer,
    path: string
  ): {
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  } {
    if (!this.image || !this.resolved) return { items: [], textures: [] };

    const resolved = this.resolved;
    const textureId = `${path}:sticker`;
    const width = this.image.width;
    const height = this.image.height;

    const texture: TextureUploadDescriptor = {
      kind: "external",
      id: textureId,
      source: this.image,
      width,
      height,
    };

    const targetWidth = (resolved.width || width) * (resolved.scaleX ?? 1.0);
    const targetHeight = (resolved.height || height) * (resolved.scaleY ?? 1.0);

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
        width: targetWidth,
        height: targetHeight,
        rotationDegrees: resolved.rotationDegrees,
        flipX: resolved.flipX,
        flipY: resolved.flipY,
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
nodeRegistry.register("sticker", (el, renderer) => {
  const img = renderer.imagesMap[el.id] || renderer.imagesMap[el.stickerId];
  return new StickerNode(el, img);
});

