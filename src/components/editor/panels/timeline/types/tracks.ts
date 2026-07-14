import type { VideoElement } from "../elements/video/types";
import type { ImageElement } from "../elements/image/types";
import type { TransitionElement } from "../elements/transition/types";
import type { TextElement } from "../elements/text/types";
import type { AudioElement } from "../elements/audio/types";
import type { StickerElement, GraphicElement } from "../elements/graphic/types";
import type { EffectElement } from "../elements/effect/types";

interface BaseTrack {
	id: string;
	name: string;
}

export interface VideoTrack extends BaseTrack {
	type: "video";
	elements: (VideoElement | ImageElement | TransitionElement)[];
	muted: boolean;
	hidden: boolean;
}

export interface TextTrack extends BaseTrack {
	type: "text";
	elements: TextElement[];
	hidden: boolean;
}

export interface AudioTrack extends BaseTrack {
	type: "audio";
	elements: AudioElement[];
	muted: boolean;
}

export interface GraphicTrack extends BaseTrack {
	type: "graphic";
	elements: (StickerElement | GraphicElement)[];
	hidden: boolean;
}

export interface EffectTrack extends BaseTrack {
	type: "effect";
	elements: EffectElement[];
	hidden: boolean;
}

export type TimelineTrack =
	| VideoTrack
	| TextTrack
	| AudioTrack
	| GraphicTrack
	| EffectTrack;

export type OverlayTrack = VideoTrack | TextTrack | GraphicTrack | EffectTrack;
