import { loadImage, Image } from "@napi-rs/canvas";
import { createCanvasSurface } from "./canvas-utils";
import * as path from "path";
import * as fs from "fs";

const PREVIEW_SIZE = 160;
const DEFAULT_PREVIEW_PATH = path.resolve("./test-assets/preview.jpg");

class EffectPreviewService {
  private previewImage: Image | null = null;

  readonly PREVIEW_SIZE = PREVIEW_SIZE;

  /**
   * Initializes the service by attempting to load the local test asset image.
   */
  async init(): Promise<void> {
    if (!this.previewImage && fs.existsSync(DEFAULT_PREVIEW_PATH)) {
      try {
        this.previewImage = await loadImage(DEFAULT_PREVIEW_PATH);
      } catch (err) {
        console.warn(`[EffectPreview] Failed to load preview image: ${err}`);
      }
    }
  }

  /**
   * Generates a PNG preview buffer of the specified effect.
   */
  async renderPreviewBuffer({
    effectType,
    opacity = 1.0,
    blurRadius = 0,
  }: {
    effectType: string;
    opacity?: number;
    blurRadius?: number;
  }): Promise<Buffer> {
    await this.init();

    const size = PREVIEW_SIZE;
    const { canvas, context } = createCanvasSurface({ width: size, height: size });

    // Draw placeholder background if image is not loaded
    if (!this.previewImage) {
      context.fillStyle = "#334155"; // Gray slate background
      context.fillRect(0, 0, size, size);
      
      context.fillStyle = "#ffffff";
      context.font = "bold 14px sans-serif";
      context.textAlign = "center";
      context.fillText("Effect Preview", size / 2, size / 2 - 10);
      context.font = "12px sans-serif";
      context.fillText(effectType, size / 2, size / 2 + 15);
    } else {
      context.drawImage(this.previewImage as any, 0, 0, size, size);
    }

    // Apply the filters on a second draw pass
    if (blurRadius > 0 || opacity < 1.0) {
      const { canvas: tempCanvas, context: tempCtx } = createCanvasSurface({ width: size, height: size });
      
      tempCtx.save();
      if (blurRadius > 0) {
        tempCtx.filter = `blur(${blurRadius}px)`;
      }
      tempCtx.globalAlpha = opacity;
      
      if (this.previewImage) {
        tempCtx.drawImage(this.previewImage as any, 0, 0, size, size);
      } else {
        tempCtx.fillStyle = "#334155";
        tempCtx.fillRect(0, 0, size, size);
      }
      tempCtx.restore();
      
      // Clear original context and draw filter output
      context.clearRect(0, 0, size, size);
      context.drawImage(tempCanvas as any, 0, 0);
    }

    return canvas.toBuffer("image/png");
  }
}

export const effectPreviewService = new EffectPreviewService();
