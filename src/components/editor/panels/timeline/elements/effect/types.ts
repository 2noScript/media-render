import type { ParamValues } from "@/core/params";
import type { BaseTimelineElement } from "../../types/base";

export interface EffectElement extends BaseTimelineElement {
	type: "effect";
	effectType: string;
}

export type CreateEffectElement = Omit<EffectElement, "id">;
