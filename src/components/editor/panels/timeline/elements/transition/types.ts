import type { BaseTimelineElement } from "../../types/base";

export interface TransitionElement extends BaseTimelineElement {
	type: "transition";
	transitionType: string;
	fromElementId: string;
	toElementId: string;
}

export type CreateTransitionElement = Omit<TransitionElement, "id">;
