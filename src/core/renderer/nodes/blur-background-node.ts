import { BaseNode } from "./base-node";
import { ImageData } from "@napi-rs/canvas";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";
import { createCanvasSurface } from "../canvas-utils";

export class BlurBackgroundNode extends BaseNode {
  private videoSinksMap: Record<string, any>;
  private imagesMap: Record<string, any>;

  constructor(
    params: any,
    videoSinksMap: Record<string, any>,
    imagesMap: Record<string, any>,
    _canvasWidth: number,
    _canvasHeight: number
  ) {
    super(params);
    this.videoSinksMap = videoSinksMap;
    this.imagesMap = imagesMap;
  }

  async buildFrame(
    time: number,
    renderer: CanvasRenderer,
    path: string
  ): Promise<{
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  }> {
    let sourceCanvas: any = null;

    if (this.params.type === "video") {
      const localTime = (time - this.params.startTime) + this.params.trimStart;
      const sink = this.videoSinksMap[this.params.id];
      if (sink) {
        const sample = await sink.getSample(localTime);
        if (sample) {
          const width = sample.displayWidth;
          const height = sample.displayHeight;
          
          const { canvas, context } = createCanvasSurface({ width, height });
          const rawBuffer = Buffer.alloc(width * height * 4);
          await sample.copyTo(rawBuffer, { format: "RGBA" } as any);
          const clamped = new Uint8ClampedArray(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);
          const imageData = new ImageData(clamped, width, height);
          context.putImageData(imageData, 0, 0);
          sample.close();
          sourceCanvas = canvas;
        }
      }
    } else if (this.params.type === "image") {
      sourceCanvas = this.imagesMap[this.params.id];
    }

    if (!sourceCanvas) {
      return { items: [], textures: [] };
    }

    const textureId = `${path}:blur-background`;
    const { width, height } = renderer;

    const texture: TextureUploadDescriptor = {
      kind: "rendered",
      id: textureId,
      contentHash: `blur:${this.params.id}:${time}:${this.params.blurIntensity}`,
      width,
      height,
      draw: (ctx) => {
        ctx.save();
        ctx.filter = `blur(${this.params.blurIntensity || 20}px)`;

        const backdropWidth = sourceCanvas.width;
        const backdropHeight = sourceCanvas.height;
        const coverScale = Math.max(width / backdropWidth, height / backdropHeight);
        const scaledWidth = backdropWidth * coverScale;
        const scaledHeight = backdropHeight * coverScale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        ctx.drawImage(sourceCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
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
