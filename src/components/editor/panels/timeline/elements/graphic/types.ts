import type { Effect } from "@/services/effects/types";
import type { Mask } from "@/services/masks/types";
import type { ParamValues } from "@/core/params";
import type { BlendMode, Transform } from "@/services/rendering";
import type { BaseTimelineElement } from "../../types/base";

export interface StickerElement extends BaseTimelineElement {
	type: "sticker";
	stickerId: string;
	/** Natural dimensions of the sticker asset, stored at insert time. Used by renderer and preview bounds to avoid split-brain geometry. */
	intrinsicWidth?: number;
	intrinsicHeight?: number;
	hidden?: boolean;
	effects?: Effect[];
}

export interface GraphicElement extends BaseTimelineElement {
	type: "graphic";
	definitionId: string;
	hidden?: boolean;
	effects?: Effect[];
	masks?: Mask[];
}

export type CreateStickerElement = Omit<StickerElement, "id">;
export type CreateGraphicElement = Omit<GraphicElement, "id">;
