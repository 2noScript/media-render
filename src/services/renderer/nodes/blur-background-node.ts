import type { EffectPass } from "@/services/effects/types";
import type { RetimeConfig } from "@/components/editor/panels/timeline";
import { BaseNode } from "./base-node";
import type {
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "../compositor/types";
import type { CanvasRenderer } from "../canvas-renderer";
import { createOffscreenCanvas } from "../canvas-utils";

export type BlurBackgroundNodeParams = {
	mediaId: string;
	url: string;
	file?: any;
	mediaType: "video" | "image";
	duration: number;
	timeOffset: number;
	trimStart: number;
	trimEnd: number;
	retime?: RetimeConfig;
	blurIntensity: number;
};

export type BackdropSource = {
	source: any;
	width: number;
	height: number;
};

export interface ResolvedBlurBackgroundNodeState {
	backdropSource: BackdropSource;
	passes: EffectPass[];
}

export class BlurBackgroundNode extends BaseNode<
	BlurBackgroundNodeParams,
	ResolvedBlurBackgroundNodeState
> {
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
		const textureId = `${path}:blur-background`;
		const backdropCanvas = createOffscreenCanvas({
			width: renderer.width,
			height: renderer.height,
		});
		const backdropCtx = backdropCanvas.getContext("2d") as any;
		if (!backdropCtx) {
			return { items: [], textures: [] };
		}
		const { backdropSource, passes } = this.resolved;
		const coverScale = Math.max(
			renderer.width / backdropSource.width,
			renderer.height / backdropSource.height,
		);
		const scaledWidth = backdropSource.width * coverScale;
		const scaledHeight = backdropSource.height * coverScale;
		const offsetX = (renderer.width - scaledWidth) / 2;
		const offsetY = (renderer.height - scaledHeight) / 2;
		backdropCtx.drawImage(
			backdropSource.source,
			offsetX,
			offsetY,
			scaledWidth,
			scaledHeight,
		);

		const texture: TextureUploadDescriptor = {
			id: textureId,
			source: backdropCanvas,
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
			effectPassGroups: [passes],
			mask: null,
		};

		return {
			items: [item],
			textures: [texture],
		};
	}
}
