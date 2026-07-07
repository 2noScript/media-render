import { VisualNode } from "./visual-node";
import { ImageData } from "@napi-rs/canvas";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";
import { createCanvasSurface } from "../canvas-utils";

export class VideoNode extends VisualNode {
  private sink: any;

  constructor(params: any, sink: any) {
    super(params);
    this.sink = sink;
  }

  async buildFrame(
    time: number,
    _renderer: CanvasRenderer,
    path: string
  ): Promise<{
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  }> {
    const localTime = (time - this.params.startTime) + this.params.trimStart;
    if (!this.sink) return { items: [], textures: [] };

    const sample = await this.sink.getSample(localTime);
    if (!sample) return { items: [], textures: [] };

    const width = sample.displayWidth;
    const height = sample.displayHeight;

    const { canvas, context } = createCanvasSurface({ width, height });
    const rawBuffer = Buffer.alloc(width * height * 4);
    await sample.copyTo(rawBuffer, { format: "RGBA" } as any);
    const clamped = new Uint8ClampedArray(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);
    const imageData = new ImageData(clamped, width, height);
    context.putImageData(imageData, 0, 0);
    sample.close();

    const resolved = this.resolveState(time);
    const textureId = `${path}:video`;

    const texture: TextureUploadDescriptor = {
      kind: "external",
      id: textureId,
      source: canvas,
      width,
      height,
    };

    const targetWidth = (resolved.width || width) * (resolved.scaleX ?? 1.0);
    const targetHeight = (resolved.height || height) * (resolved.scaleY ?? 1.0);

    const item: FrameItemDescriptor = {
      type: "layer",
      textureId,
      transform: {
        centerX: (resolved.x ?? 0) + targetWidth / 2,
        centerY: (resolved.y ?? 0) + targetHeight / 2,
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
nodeRegistry.register("video", (el, renderer) => {
  return new VideoNode(el, renderer.videoSinksMap[el.id]);
});

