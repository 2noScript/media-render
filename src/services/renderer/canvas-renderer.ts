import { Canvas, SKRSContext2D } from "@napi-rs/canvas";
import type { AnyBaseNode } from "./nodes/base-node";
import { buildFrameDescriptor } from "./compositor/frame-descriptor";
import { skiaCompositor } from "./compositor/skia-compositor";
import { resolveRenderTree } from "./resolve";
import { createCanvasSurface } from "./canvas-utils";

export type FrameRate = {
	numerator: number;
	denominator: number;
};

export type CanvasRendererParams = {
	width: number;
	height: number;
	fps: FrameRate;
};

export class CanvasRenderer {
	canvas: Canvas;
	context: SKRSContext2D;
	width: number;
	height: number;
	fps: FrameRate;

	constructor({ width, height, fps }: CanvasRendererParams) {
		this.width = width;
		this.height = height;
		this.fps = fps;

		const res = createCanvasSurface({ width, height });
		this.canvas = res.canvas;
		this.context = res.context;
	}

	getOutputCanvas(): Canvas {
		skiaCompositor.ensureInitialized({
			width: this.width,
			height: this.height,
		});
		return skiaCompositor.getCanvas();
	}

	setSize({ width, height }: { width: number; height: number }) {
		this.width = width;
		this.height = height;

		const res = createCanvasSurface({ width, height });
		this.canvas = res.canvas;
		this.context = res.context;
	}

	async render({ node, time }: { node: AnyBaseNode; time: number }) {
		(this as any).rootNode = node;
		await resolveRenderTree({ node, renderer: this, time });
		const { frame, textures } = await buildFrameDescriptor({
			node,
			renderer: this,
		});
		skiaCompositor.ensureInitialized({
			width: this.width,
			height: this.height,
		});
		skiaCompositor.syncTextures(textures);
		skiaCompositor.render(frame);
	}
}
