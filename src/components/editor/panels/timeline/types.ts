export type { ElementRef, BaseTimelineElement } from "./types/base";
export type { Bookmark, TrackType, TScene, SceneTracks } from "./types/scene";
export type {
	VideoTrack,
	TextTrack,
	AudioTrack,
	GraphicTrack,
	EffectTrack,
	TimelineTrack,
	OverlayTrack,
} from "./types/tracks";

// Element types
export type {
	VideoElement,
	ImageElement,
	TransitionElement,
	CreateVideoElement,
	CreateImageElement,
	CreateTransitionElement,
	AudioElement,
	UploadAudioElement,
	LibraryAudioElement,
	RetimeConfig,
	CreateAudioElement,
	CreateUploadAudioElement,
	CreateLibraryAudioElement,
	TextElement,
	CreateTextElement,
	StickerElement,
	GraphicElement,
	CreateStickerElement,
	CreateGraphicElement,
	EffectElement,
	CreateEffectElement,
	TimelineElement,
	ElementType,
	ElementUpdatePatch,
	MaskableElement,
	RetimableElement,
	VisualElement,
	CreateTimelineElement,
} from "./elements/index";

export {
	MASKABLE_ELEMENT_TYPES,
	RETIMABLE_ELEMENT_TYPES,
	VISUAL_ELEMENT_TYPES,
	getElementCapabilities,
} from "./elements/index";

export type { ElementCapabilities } from "./elements/index";
