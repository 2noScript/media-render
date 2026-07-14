import {
	VisualNode,
	type ResolvedVisualSourceNodeState,
	type VisualNodeParams,
} from "./visual-node";

export interface ImageNodeParams extends VisualNodeParams {
	url: string;
	maxSourceSize?: number;
}

import { loadImage } from "@napi-rs/canvas";
import { createOffscreenCanvas } from "../canvas-utils";

export interface CachedImageSource {
	source: any;
	width: number;
	height: number;
}

const imageSourceCache = new Map<string, Promise<CachedImageSource>>();

export function loadImageSource(
	url: string,
	maxSourceSize?: number,
): Promise<CachedImageSource> {
	const cacheKey = `${url}::${maxSourceSize ?? "full"}`;

	const cached = imageSourceCache.get(cacheKey);
	if (cached) return cached;

	const promise = (async (): Promise<CachedImageSource> => {
		const image = await loadImage(url);

		const naturalWidth = image.width;
		const naturalHeight = image.height;
		const exceedsLimit =
			maxSourceSize &&
			(naturalWidth > maxSourceSize || naturalHeight > maxSourceSize);

		if (exceedsLimit) {
			const scale = Math.min(
				maxSourceSize / naturalWidth,
				maxSourceSize / naturalHeight,
			);
			const scaledWidth = Math.round(naturalWidth * scale);
			const scaledHeight = Math.round(naturalHeight * scale);

			const offscreen = createOffscreenCanvas({ width: scaledWidth, height: scaledHeight });
			const ctx = offscreen.getContext("2d");

			if (ctx) {
				ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
				return { source: offscreen, width: scaledWidth, height: scaledHeight };
			}
		}

		return { source: image, width: naturalWidth, height: naturalHeight };
	})();

	imageSourceCache.set(cacheKey, promise);
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

export class ImageNode extends VisualNode<
	ImageNodeParams,
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
