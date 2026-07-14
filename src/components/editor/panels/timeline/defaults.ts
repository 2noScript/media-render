const DEFAULT_NEW_ELEMENT_DURATION = 5;
import type { TTimelineViewState } from "@/core/project/types";
import type { BlendMode, Transform } from "@/services/rendering";
import type { TextElement } from "./types";

const defaultTransform: Transform = {
	scaleX: 1,
	scaleY: 1,
	position: { x: 0, y: 0 },
	rotate: 0,
};

const defaultOpacity = 1;
const defaultBlendMode: BlendMode = "normal";
const defaultVolume = 0;

const defaultTextLetterSpacing = 0;
const defaultTextLineHeight = 1.2;

const defaultTextBackground = {
	enabled: false,
	color: "#000000",
	cornerRadius: 0,
	paddingX: 30,
	paddingY: 42,
	offsetX: 0,
	offsetY: 0,
};

const defaultTextElement: Omit<TextElement, "id"> = {
	type: "text",
	name: "Text",
	duration: DEFAULT_NEW_ELEMENT_DURATION,
	startTime: 0,
	trimStart: 0,
	trimEnd: 0,
	params: {
		content: "Default text",
		fontSize: 15,
		fontFamily: "Arial",
		color: "#ffffff",
		textAlign: "center",
		fontWeight: "normal",
		fontStyle: "normal",
		textDecoration: "none",
		letterSpacing: defaultTextLetterSpacing,
		lineHeight: defaultTextLineHeight,
		"background.enabled": defaultTextBackground.enabled,
		"background.color": defaultTextBackground.color,
		"background.cornerRadius": defaultTextBackground.cornerRadius,
		"background.paddingX": defaultTextBackground.paddingX,
		"background.paddingY": defaultTextBackground.paddingY,
		"background.offsetX": defaultTextBackground.offsetX,
		"background.offsetY": defaultTextBackground.offsetY,
		"transform.positionX": defaultTransform.position.x,
		"transform.positionY": defaultTransform.position.y,
		"transform.scaleX": defaultTransform.scaleX,
		"transform.scaleY": defaultTransform.scaleY,
		"transform.rotate": defaultTransform.rotate,
		opacity: defaultOpacity,
		blendMode: defaultBlendMode,
	},
};

const defaultTimelineViewState: TTimelineViewState = {
	zoomLevel: 1,
	scrollLeft: 0,
	playheadTime: 0,
};

export const DEFAULTS = {
	element: {
		transform: defaultTransform,
		opacity: defaultOpacity,
		blendMode: defaultBlendMode,
		volume: defaultVolume,
	},
	text: {
		letterSpacing: defaultTextLetterSpacing,
		lineHeight: defaultTextLineHeight,
		background: defaultTextBackground,
		element: {
			...defaultTextElement,
			// Convenience shorthands so callers can still use DEFAULTS.text.element.fontSize etc.
			name: "Text",
			content: "Default text",
			fontSize: 15,
			fontFamily: "Arial",
			fontWeight: "normal",
			fontStyle: "normal",
			textAlign: "center" as const,
			textDecoration: "none" as const,
			opacity: defaultOpacity,
		},
	},
	timeline: {
		viewState: defaultTimelineViewState,
	},
};
