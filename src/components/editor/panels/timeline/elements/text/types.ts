import type { Effect } from "@/services/effects/types";
import type { BaseTimelineElement } from "../../types/base";

export interface TextElement extends BaseTimelineElement {
	type: "text";
	hidden?: boolean;
	effects?: Effect[];
	textAlign?: any;
}

export type CreateTextElement = Omit<TextElement, "id">;
