import { BaseNode } from "./base-node";
import type {
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "../compositor/types";
import type { CanvasRenderer } from "../canvas-renderer";
import { createOffscreenCanvas } from "../canvas-utils";
import { drawCssBackground } from "@/services/gradients";

export type ColorNodeParams = {
	color: string;
};

export class ColorNode extends BaseNode<ColorNodeParams> {
	buildFrame(
		renderer: CanvasRenderer,
		path: string,
	): {
		items: FrameItemDescriptor[];
		textures: TextureUploadDescriptor[];
	} {
		const textureId = `${path}:color`;
		const canvas = createOffscreenCanvas({
			width: renderer.width,
			height: renderer.height,
		});
		const ctx = canvas.getContext("2d") as any;
		if (!ctx) {
			return { items: [], textures: [] };
		}

		if (/gradient\(/i.test(this.params.color)) {
			drawCssBackground({
				ctx,
				width: renderer.width,
				height: renderer.height,
				css: this.params.color,
			});
		} else {
			ctx.fillStyle = this.params.color;
			ctx.fillRect(0, 0, renderer.width, renderer.height);
		}

		const texture: TextureUploadDescriptor = {
			id: textureId,
			source: canvas,
			width: renderer.width,
			height: renderer.height,
		};

		const item: FrameItemDescriptor = {
			type: "layer",
			textureId,
			transform: {
				centerX: renderer.width / 2,
				centerY: renderer.height / 2,
				width: renderer.width,
				height: renderer.height,
				rotationDegrees: 0,
				flipX: false,
				flipY: false,
			},
			opacity: 1,
			blendMode: "normal",
			effectPassGroups: [],
			mask: null,
		};

		return {
			items: [item],
			textures: [texture],
		};
	}
}
