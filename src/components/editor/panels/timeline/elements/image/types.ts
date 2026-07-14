import type { Effect } from "@/services/effects/types";
import type { Mask } from "@/services/masks/types";
import type { BlendMode, Transform } from "@/services/rendering";
import type { BaseTimelineElement } from "../../types/base";

export interface ImageElement extends BaseTimelineElement {
	type: "image";
	mediaId: string;
	hidden?: boolean;
	effects?: Effect[];
	masks?: Mask[];
}

export type CreateImageElement = Omit<ImageElement, "id">;
