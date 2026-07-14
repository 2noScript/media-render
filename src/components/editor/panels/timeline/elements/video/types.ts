import type { Effect } from "@/services/effects/types";
import type { Mask } from "@/services/masks/types";
import type { BlendMode, Transform } from "@/services/rendering";
import type { RetimeConfig } from "../audio/types";
import type { BaseTimelineElement } from "../../types/base";

export interface VideoElement extends BaseTimelineElement {
	type: "video";
	mediaId: string;
	isSourceAudioEnabled?: boolean;
	hidden?: boolean;
	retime?: RetimeConfig;
	effects?: Effect[];
	masks?: Mask[];
}
export type CreateVideoElement = Omit<VideoElement, "id">;
