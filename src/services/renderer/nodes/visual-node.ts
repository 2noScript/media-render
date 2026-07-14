import { BaseNode } from "./base-node";
import type { Effect, EffectPass } from "@/services/effects/types";
import type { Mask } from "@/services/masks/types";
import type { BlendMode, Transform } from "@/services/rendering";
import type {
	RetimeConfig,
	VisualElement,
} from "@/components/editor/panels/timeline";

export interface VisualNodeParams {
	id?: string;
	duration: number;
	timeOffset: number;
	trimStart: number;
	trimEnd: number;
	retime?: RetimeConfig;
	transform: Transform;
	animations?: VisualElement["animations"];
	opacity: number;
	blendMode?: BlendMode;
	effects?: Effect[];
	masks?: Mask[];
}

export interface ResolvedVisualNodeState {
	localTime: number;
	transform: Transform;
	opacity: number;
	effectPasses: EffectPass[][];
}

export interface ResolvedVisualSourceNodeState extends ResolvedVisualNodeState {
	source: any;
	sourceWidth: number;
	sourceHeight: number;
}

export abstract class VisualNode<
	Params extends VisualNodeParams = VisualNodeParams,
	Resolved extends ResolvedVisualNodeState = ResolvedVisualNodeState,
> extends BaseNode<Params, Resolved> {}
