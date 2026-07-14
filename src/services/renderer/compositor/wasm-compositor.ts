import { Canvas, SKRSContext2D } from "@napi-rs/canvas";
import { FrameDescriptor, TextureUploadDescriptor } from "./types";
import { createCanvasSurface } from "../canvas-utils";

class WasmCompositor {
	private canvas: Canvas | null = null;
	private context: SKRSContext2D | null = null;
	private initializedSize: { width: number; height: number } | null = null;
	private uploadedTextures = new Map<string, { source: any; width: number; height: number }>();

	public ensureInitialized({ width, height }: { width: number; height: number }): void {
		if (!this.canvas) {
			const res = createCanvasSurface({ width, height });
			this.canvas = res.canvas;
			this.context = res.context;
			this.initializedSize = { width, height };
			return;
		}

		if (
			!this.initializedSize ||
			this.initializedSize.width !== width ||
			this.initializedSize.height !== height
		) {
			const res = createCanvasSurface({ width, height });
			this.canvas = res.canvas;
			this.context = res.context;
			this.initializedSize = { width, height };
		}
	}

	public getCanvas(): Canvas {
		if (!this.canvas) {
			throw new Error("Compositor is not initialized");
		}
		return this.canvas;
	}

	public syncTextures(textures: TextureUploadDescriptor[]): void {
		const nextIds = new Set(textures.map((t) => t.id));
		for (const previousId of this.uploadedTextures.keys()) {
			if (!nextIds.has(previousId)) {
				this.uploadedTextures.delete(previousId);
			}
		}

		for (const texture of textures) {
			this.uploadedTextures.set(texture.id, {
				source: texture.source,
				width: texture.width,
				height: texture.height,
			});
		}
	}

	public render(frame: FrameDescriptor): void {
		if (!this.context) {
			throw new Error("Compositor is not initialized");
		}
		const targetCtx = this.context;

		// 1. Clear target context
		const [r, g, b, a] = frame.clear.color;
		targetCtx.clearRect(0, 0, frame.width, frame.height);
		targetCtx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
		targetCtx.fillRect(0, 0, frame.width, frame.height);

		// 2. Render each item
		for (const item of frame.items) {
			if (item.type === "layer") {
				const cached = this.uploadedTextures.get(item.textureId);
				if (!cached) continue;

				const textureSource = cached.source;

				targetCtx.save();
				targetCtx.globalAlpha = item.opacity;
				if (item.blendMode && item.blendMode !== "normal") {
					targetCtx.globalCompositeOperation = item.blendMode as any;
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

export const wasmCompositor = new WasmCompositor();
