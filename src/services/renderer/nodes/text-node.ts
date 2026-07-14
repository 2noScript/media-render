import { BaseNode } from "./base-node";
import type { TextElement } from "@/components/editor/panels/timeline";
import type { EffectPass } from "@/services/effects/types";
import type { BlendMode, Transform } from "@/services/rendering";
import { drawMeasuredTextLayout } from "@/services/text/primitives";
import type { MeasuredTextElement } from "@/services/text/measure-element";
import type {
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "../compositor/types";
import type { CanvasRenderer } from "../canvas-renderer";
import { createOffscreenCanvas } from "../canvas-utils";

export type TextNodeParams = TextElement & {
	transform: Transform;
	opacity: number;
	blendMode?: BlendMode;
	canvasCenter: { x: number; y: number };
	canvasHeight: number;
	textBaseline?: CanvasTextBaseline;
};

export interface ResolvedTextNodeState {
	transform: Transform;
	opacity: number;
	textColor: string;
	backgroundColor: string;
	effectPasses: EffectPass[][];
	measuredText: MeasuredTextElement;
}

export class TextNode extends BaseNode<TextNodeParams, ResolvedTextNodeState> {
	buildFrame(
		renderer: CanvasRenderer,
		path: string,
	): {
		items: FrameItemDescriptor[];
		textures: TextureUploadDescriptor[];
	} {
		if (!this.resolved) {
			return { items: [], textures: [] };
		}

		const textureId = `${path}:text`;
		const canvas = createOffscreenCanvas({
			width: renderer.width,
			height: renderer.height,
		});
		const ctx = canvas.getContext("2d") as any;
		if (!ctx) {
			return { items: [], textures: [] };
		}

		renderTextToContext({
			node: this,
			ctx,
		});

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
			opacity: this.resolved.opacity,
			blendMode: this.params.blendMode ?? "normal",
			effectPassGroups: this.resolved.effectPasses,
			mask: null,
		};

		return {
			items: [item],
			textures: [texture],
		};
	}
}

export function renderTextToContext({
	node,
	ctx,
}: {
	node: TextNode;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}): void {
	const resolved = node.resolved;
	if (!resolved) {
		return;
	}

	const x = resolved.transform.position.x + node.params.canvasCenter.x;
	const y = resolved.transform.position.y + node.params.canvasCenter.y;
	const baseline = node.params.textBaseline ?? "middle";

	ctx.save();
	ctx.translate(x, y);
	ctx.scale(resolved.transform.scaleX, resolved.transform.scaleY);
	if (resolved.transform.rotate) {
		ctx.rotate((resolved.transform.rotate * Math.PI) / 180);
	}

	drawMeasuredTextLayout({
		ctx,
		layout: resolved.measuredText,
		textColor: resolved.textColor,
		background: resolved.measuredText.resolvedBackground,
		backgroundColor: resolved.backgroundColor,
		textBaseline: baseline,
	});

	ctx.restore();
}
