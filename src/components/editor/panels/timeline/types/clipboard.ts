import type { CreateTimelineElement } from "../elements/index";
import type { TrackType } from "./scene";

export interface ClipboardItem {
	trackId: string;
	trackType: TrackType;
	element: CreateTimelineElement;
}
