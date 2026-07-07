import { VisualNode } from "./visual-node";
import { ImageData } from "@napi-rs/canvas";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";
import { createCanvasSurface } from "../canvas-utils";

export class VideoNode extends VisualNode {
  private sink: any;
  private resolvedVideoFrame: {
    canvas: any;
    width: number;
    height: number;
  } | null = null;

  constructor(params: any, sink: any) {
    super(params);
    this.sink = sink;
  }

  /**
   * Asynchronously resolves and caches the video frame at the target local time.
   */
  async resolveVideoFrame(time: number): Promise<void> {
    this.resolvedVideoFrame = null;
    if (!this.sink) return;

    const localTime = (time - this.params.startTime) + this.params.trimStart;
    const sample = await this.sink.getSample(localTime);
    if (!sample) return;

    const width = sample.displayWidth;
    const height = sample.displayHeight;

    const { canvas, context } = createCanvasSurface({ width, height });
    const rawBuffer = Buffer.alloc(width * height * 4);
    await sample.copyTo(rawBuffer, { format: "RGBA" } as any);
    const clamped = new Uint8ClampedArray(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);
    const imageData = new ImageData(clamped, width, height);
    context.putImageData(imageData, 0, 0);
    sample.close();

    this.resolvedVideoFrame = { canvas, width, height };
  }

  /**
   * Synchronously builds the frame descriptors from the pre-resolved video frame state.
   */
  buildFrame(
    renderer: CanvasRenderer,
    path: string
  ): {
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  } {
    if (!this.resolvedVideoFrame || !this.resolved) {
      return { items: [], textures: [] };
    }

    const { canvas, width, height } = this.resolvedVideoFrame;
    const resolved = this.resolved;
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
nodeRegistry.register("video", (el, renderer) => {
  return new VideoNode(el, renderer.videoSinksMap[el.id]);
});
