import {
	VisualNode,
	type ResolvedVisualSourceNodeState,
	type VisualNodeParams,
} from "./visual-node";
import type {
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "../compositor/types";
import type { CanvasRenderer } from "../canvas-renderer";
import {
	computeVisualTransform,
	buildMaskArtifacts,
} from "../compositor/utils";

export interface VideoNodeParams extends VisualNodeParams {
	url: string;
	file?: any;
	mediaId: string;
}

export class VideoNode extends VisualNode<
	VideoNodeParams,
	ResolvedVisualSourceNodeState
> {
	buildFrame(
		renderer: CanvasRenderer,
		path: string,
	): {
		items: FrameItemDescriptor[];
		textures: TextureUploadDescriptor[];
	} {
		if (!this.resolved || !this.resolved.source) {
			return { items: [], textures: [] };
		}

		const textures = new Map<string, TextureUploadDescriptor>();
		const items: FrameItemDescriptor[] = [];

		const textureId = `${path}:source`;
		textures.set(textureId, {
			id: textureId,
			source: this.resolved.source,
			width: this.resolved.sourceWidth,
			height: this.resolved.sourceHeight,
		});

		const transform = computeVisualTransform({
			renderer,
			resolved: this.resolved,
			sourceWidth: this.resolved.sourceWidth,
			sourceHeight: this.resolved.sourceHeight,
		});

		const { mask, strokeLayer } = buildMaskArtifacts({
			node: this,
			renderer,
			path,
			transform,
			textures,
		});

		items.push({
			type: "layer",
			textureId,
			transform,
			opacity: this.resolved.opacity,
			blendMode: this.params.blendMode ?? "normal",
			effectPassGroups: this.resolved.effectPasses,
			mask,
		});

		if (strokeLayer) {
			items.push(strokeLayer);
		}

		return {
			items,
			textures: Array.from(textures.values()),
		};
	}
}
