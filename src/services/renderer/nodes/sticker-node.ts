import { loadImage } from "@napi-rs/canvas";
import { resolveStickerId } from "@/services/stickers";
import {
	VisualNode,
	type ResolvedVisualSourceNodeState,
	type VisualNodeParams,
} from "./visual-node";

export interface StickerNodeParams extends VisualNodeParams {
	stickerId: string;
	intrinsicWidth?: number;
	intrinsicHeight?: number;
}

interface CachedStickerSource {
	source: any;
	width: number;
	height: number;
}

const stickerSourceCache = new Map<string, Promise<CachedStickerSource>>();

export function loadStickerSource({
	stickerId,
}: {
	stickerId: string;
}): Promise<CachedStickerSource> {
	const cached = stickerSourceCache.get(stickerId);
	if (cached) return cached;

	const promise = (async (): Promise<CachedStickerSource> => {
		const url = resolveStickerId({
			stickerId,
			options: { width: 200, height: 200 },
		});

		const image = await loadImage(url);

		return {
			source: image,
			width: image.width,
			height: image.height,
		};
	})();

	stickerSourceCache.set(stickerId, promise);
	return promise;
}

import type {
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "../compositor/types";
import type { CanvasRenderer } from "../canvas-renderer";
import {
	computeVisualTransform,
	buildMaskArtifacts,
} from "../compositor/utils";

export class StickerNode extends VisualNode<
	StickerNodeParams,
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
