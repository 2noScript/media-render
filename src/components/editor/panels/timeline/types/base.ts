import type { ElementAnimations } from "@/core/animation/types";
import type { ParamValues } from "@/core/params";

export interface ElementRef {
	trackId: string;
	elementId: string;
}

export interface BaseTimelineElement {
	id: string;
	name: string;
	duration: number;
	startTime: number;
	trimStart: number;
	trimEnd: number;
	sourceDuration?: number;
	animations?: ElementAnimations;
	params: ParamValues;
}
