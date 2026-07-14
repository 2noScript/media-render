import { BaseNode } from "./base-node";
import type {
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "../compositor/types";
import type { CanvasRenderer } from "../canvas-renderer";
import { createOffscreenCanvas } from "../canvas-utils";
import { skiaCompositor } from "../compositor/skia-compositor";
import { transitionsRegistry } from "@/services/transitions";

export interface TransitionNodeParams {
	id: string;
	transitionType: string;
	duration: number;
	fromElementId: string;
	toElementId: string;
	startTime: number;
	params?: Record<string, any>;
}

export class TransitionNode extends BaseNode<
	TransitionNodeParams,
	{ progress: number }
> {
	buildFrame(
		renderer: CanvasRenderer,
		path: string,
	): {
		items: FrameItemDescriptor[];
		textures: TextureUploadDescriptor[];
	} {
		const root = (renderer as any).rootNode;
		if (!root || !this.resolved) {
			return { items: [], textures: [] };
		}

		skiaCompositor.ensureInitialized({
			width: renderer.width,
			height: renderer.height,
		});

		const fromNode =
			root.children.find(
				(child: any) => child.params?.id === this.params.fromElementId,
			) ?? null;
		const toNode =
			root.children.find(
				(child: any) => child.params?.id === this.params.toElementId,
			) ?? null;

		let fromCanvas: any = null;
		if (fromNode?.resolved) {
			fromNode.suppressDraw = false;
			const result = fromNode.buildFrame(renderer, `${path}:from`);
			fromNode.suppressDraw = true;

			skiaCompositor.syncTextures(result.textures);
			skiaCompositor.render({
				width: renderer.width,
				height: renderer.height,
				clear: { color: [0, 0, 0, 0] },
				items: result.items,
			});

			fromCanvas = createOffscreenCanvas({
				width: renderer.width,
				height: renderer.height,
			});
			const ctx = fromCanvas.getContext("2d") as any;
			if (ctx) {
				ctx.drawImage(skiaCompositor.getCanvas(), 0, 0);
			}
		}

		let toCanvas: any = null;
		if (toNode?.resolved) {
			toNode.suppressDraw = false;
			const result = toNode.buildFrame(renderer, `${path}:to`);
			toNode.suppressDraw = true;

			skiaCompositor.syncTextures(result.textures);
			skiaCompositor.render({
				width: renderer.width,
				height: renderer.height,
				clear: { color: [0, 0, 0, 0] },
				items: result.items,
			});

			toCanvas = createOffscreenCanvas({
				width: renderer.width,
				height: renderer.height,
			});
			const ctx = toCanvas.getContext("2d") as any;
			if (ctx) {
				ctx.drawImage(skiaCompositor.getCanvas(), 0, 0);
			}
		}

		const outCanvas = createOffscreenCanvas({
			width: renderer.width,
			height: renderer.height,
		});
		const outCtx = outCanvas.getContext("2d") as any;

		const def = transitionsRegistry.get(this.params.transitionType);
		if (def && outCtx) {
			def.renderer.render({
				fromCanvas,
				toCanvas,
				progress: this.resolved.progress,
				params: this.params.params || {},
				width: renderer.width,
				height: renderer.height,
				output: outCtx,
				createCanvas: (w: number, h: number) => createOffscreenCanvas({ width: w, height: h }),
			});
		}

		const textureId = `${path}:transition`;
		const texture: TextureUploadDescriptor = {
			id: textureId,
			source: outCanvas,
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
