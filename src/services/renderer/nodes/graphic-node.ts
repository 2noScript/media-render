import { createOffscreenCanvas } from "../canvas-utils";
import {
	DEFAULT_GRAPHIC_SOURCE_SIZE,
	getGraphicDefinition,
	registerDefaultGraphics,
} from "@/services/graphics";
import type { ParamValues } from "@/core/params";
import {
	VisualNode,
	type ResolvedVisualNodeState,
	type VisualNodeParams,
} from "./visual-node";

export interface GraphicNodeParams extends VisualNodeParams {
	definitionId: string;
	params: ParamValues;
}

export interface ResolvedGraphicNodeState extends ResolvedVisualNodeState {
	resolvedParams: ParamValues;
}

export class GraphicNode extends VisualNode<
	GraphicNodeParams,
	ResolvedGraphicNodeState
> {
	private cachedKey: string | null = null;
	private cachedSource: any = null;

	constructor(params: GraphicNodeParams) {
		super(params);
		registerDefaultGraphics();
	}

	getSource({
		resolvedParams,
	}: {
		resolvedParams: ParamValues;
	}): any {
		const definition = getGraphicDefinition({
			definitionId: this.params.definitionId,
		});
		const cacheKey = JSON.stringify({
			definitionId: this.params.definitionId,
			params: resolvedParams,
		});
		if (this.cachedSource && this.cachedKey === cacheKey) {
			return this.cachedSource;
		}

		const canvas = createOffscreenCanvas({
			width: DEFAULT_GRAPHIC_SOURCE_SIZE,
			height: DEFAULT_GRAPHIC_SOURCE_SIZE,
		});
		const ctx = canvas.getContext("2d") as any;
		if (!ctx) {
			return null;
		}

		definition.render({
			ctx,
			params: resolvedParams,
			width: DEFAULT_GRAPHIC_SOURCE_SIZE,
			height: DEFAULT_GRAPHIC_SOURCE_SIZE,
		});

		this.cachedKey = cacheKey;
		this.cachedSource = canvas;
		return canvas;
	}

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

		const source = this.getSource({
			resolvedParams: this.resolved.resolvedParams,
		});
		if (!source) {
			return { items: [], textures: [] };
		}

		const textures = new Map<string, TextureUploadDescriptor>();
		const items: FrameItemDescriptor[] = [];

		const textureId = `${path}:source`;
		textures.set(textureId, {
			id: textureId,
			source,
			width: DEFAULT_GRAPHIC_SOURCE_SIZE,
			height: DEFAULT_GRAPHIC_SOURCE_SIZE,
		});

		const transform = computeVisualTransform({
			renderer,
			resolved: this.resolved,
			sourceWidth: DEFAULT_GRAPHIC_SOURCE_SIZE,
			sourceHeight: DEFAULT_GRAPHIC_SOURCE_SIZE,
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

import type {
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "../compositor/types";
import type { CanvasRenderer } from "../canvas-renderer";
import {
	computeVisualTransform,
	buildMaskArtifacts,
} from "../compositor/utils";
