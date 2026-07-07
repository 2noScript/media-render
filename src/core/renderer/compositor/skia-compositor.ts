import { FrameDescriptor, TextureUploadDescriptor } from "./types";
import { createCanvasSurface } from "../canvas-utils";

export class SkiaCompositor {
  private cache = new Map<
    string,
    | { kind: "rendered"; canvas: any; contentHash: string; width: number; height: number }
    | { kind: "external"; source: any; width: number; height: number }
  >();

  public syncTextures(textures: TextureUploadDescriptor[]): void {
    const nextIds = new Set(textures.map((t) => t.id));
    for (const previousId of this.cache.keys()) {
      if (!nextIds.has(previousId)) {
        this.cache.delete(previousId);
      }
    }

    for (const texture of textures) {
      if (texture.kind === "external") {
        this.cache.set(texture.id, {
          kind: "external",
          source: texture.source,
          width: texture.width,
          height: texture.height,
        });
      } else {
        const previous = this.cache.get(texture.id);
        if (
          previous &&
          previous.kind === "rendered" &&
          previous.contentHash === texture.contentHash &&
          previous.width === texture.width &&
          previous.height === texture.height
        ) {
          continue;
        }

        let canvas: any;
        if (
          previous &&
          previous.kind === "rendered" &&
          previous.width === texture.width &&
          previous.height === texture.height
        ) {
          canvas = previous.canvas;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, texture.width, texture.height);
        } else {
          const res = createCanvasSurface({
            width: texture.width,
            height: texture.height,
          });
          canvas = res.canvas;
        }

        const ctx = canvas.getContext("2d");
        texture.draw(ctx);

        this.cache.set(texture.id, {
          kind: "rendered",
          canvas,
          contentHash: texture.contentHash,
          width: texture.width,
          height: texture.height,
        });
      }
    }
  }

  public render(frame: FrameDescriptor, targetCtx: any): void {
    // 1. Clear target context
    const [r, g, b, a] = frame.clear.color;
    targetCtx.clearRect(0, 0, frame.width, frame.height);
    targetCtx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    targetCtx.fillRect(0, 0, frame.width, frame.height);

    // 2. Render each item
    for (const item of frame.items) {
      if (item.type === "layer") {
        const cached = this.cache.get(item.textureId);
        if (!cached) continue;

        const textureSource = cached.kind === "rendered" ? cached.canvas : cached.source;

        targetCtx.save();
        targetCtx.globalAlpha = item.opacity;
        if (item.blendMode && item.blendMode !== "normal") {
          targetCtx.globalCompositeOperation = item.blendMode;
        }

        const transform = item.transform;
        const x = transform.centerX - transform.width / 2;
        const y = transform.centerY - transform.height / 2;
        const flipX = transform.flipX ? -1 : 1;
        const flipY = transform.flipY ? -1 : 1;
        const requiresTransform = transform.rotationDegrees !== 0 || flipX !== 1 || flipY !== 1;

        if (requiresTransform) {
          targetCtx.translate(transform.centerX, transform.centerY);
          targetCtx.rotate((transform.rotationDegrees * Math.PI) / 180);
          targetCtx.scale(flipX, flipY);
          targetCtx.translate(-transform.centerX, -transform.centerY);
        }

        targetCtx.drawImage(textureSource, x, y, transform.width, transform.height);
        targetCtx.restore();
      }
    }
  }
}

export const skiaCompositor = new SkiaCompositor();
