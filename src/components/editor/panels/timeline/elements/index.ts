import type { ParamValues } from "@/core/params";

// Re-export all element types
export type { VideoElement, CreateVideoElement } from "./video/types";
export type { ImageElement, CreateImageElement } from "./image/types";
export type {
	TransitionElement,
	CreateTransitionElement,
} from "./transition/types";

export type {
	AudioElement,
	UploadAudioElement,
	LibraryAudioElement,
	RetimeConfig,
	CreateAudioElement,
	CreateUploadAudioElement,
	CreateLibraryAudioElement,
} from "./audio/types";

export type {
	TextElement,
	CreateTextElement,
} from "./text/types";

export type {
	StickerElement,
	GraphicElement,
	CreateStickerElement,
	CreateGraphicElement,
} from "./graphic/types";

export type { EffectElement, CreateEffectElement } from "./effect/types";

// Union types
import type { VideoElement } from "./video/types";
import type { ImageElement } from "./image/types";
import type { TransitionElement } from "./transition/types";
import type { AudioElement } from "./audio/types";
import type { TextElement } from "./text/types";
import type { StickerElement, GraphicElement } from "./graphic/types";
import type { EffectElement } from "./effect/types";

export type TimelineElement =
	| AudioElement
	| VideoElement
	| ImageElement
	| TextElement
	| StickerElement
	| GraphicElement
	| EffectElement
	| TransitionElement;

export type ElementType = TimelineElement["type"];

function elementTypes<T extends ElementType[]>(...types: T): T {
	return types;
}

export const MASKABLE_ELEMENT_TYPES = elementTypes("video", "image", "graphic");
export type MaskableElement = Extract<
	TimelineElement,
	{ type: (typeof MASKABLE_ELEMENT_TYPES)[number] }
>;

export const RETIMABLE_ELEMENT_TYPES = elementTypes("video", "audio");
export type RetimableElement = Extract<
	TimelineElement,
	{ type: (typeof RETIMABLE_ELEMENT_TYPES)[number] }
>;

export const VISUAL_ELEMENT_TYPES = elementTypes(
	"video",
	"image",
	"text",
	"sticker",
	"graphic",
);
export type VisualElement = Extract<
	TimelineElement,
	{ type: (typeof VISUAL_ELEMENT_TYPES)[number] }
>;

import type { CreateVideoElement } from "./video/types";
import type { CreateImageElement } from "./image/types";
import type { CreateTransitionElement } from "./transition/types";
import type { CreateAudioElement } from "./audio/types";
import type { CreateTextElement } from "./text/types";
import type {
	CreateStickerElement,
	CreateGraphicElement,
} from "./graphic/types";
import type { CreateEffectElement } from "./effect/types";

export type CreateTimelineElement =
	| CreateAudioElement
	| CreateVideoElement
	| CreateImageElement
	| CreateTextElement
	| CreateStickerElement
	| CreateGraphicElement
	| CreateEffectElement
	| CreateTransitionElement;

export type ElementUpdatePatch = { params?: Partial<ParamValues> };

export { getElementCapabilities } from "./capabilities";
export type { ElementCapabilities } from "./capabilities";
