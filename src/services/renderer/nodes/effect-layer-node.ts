import type { EffectPass } from "@/services/effects/types";
import type { ParamValues } from "@/core/params";
import { BaseNode } from "./base-node";
import type {
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "../compositor/types";
import type { CanvasRenderer } from "../canvas-renderer";

export type EffectLayerNodeParams = {
	effectType: string;
	effectParams: ParamValues;
	timeOffset: number;
	duration: number;
};

export type ResolvedEffectLayerNodeState = {
	passes: EffectPass[];
};

export class EffectLayerNode extends BaseNode<
	EffectLayerNodeParams,
	ResolvedEffectLayerNodeState
> {
	buildFrame(
		renderer: CanvasRenderer,
		path: string,
	): {
		items: FrameItemDescriptor[];
		textures: TextureUploadDescriptor[];
	} {
		if (!this.resolved || this.resolved.passes.length === 0) {
			return { items: [], textures: [] };
		}

		const item: FrameItemDescriptor = {
			type: "sceneEffect",
			effectPassGroups: [this.resolved.passes],
		};

		return {
			items: [item],
			textures: [],
		};
	}
}
