import type { ElementType } from "./index";

export interface ElementCapabilities {
	canDrag: boolean;
	canResize: boolean;
	hasKeyframes: boolean;
	canMute: boolean;
	canHide: boolean;
	canCopy: boolean;
	hasContextMenu: boolean;
	trackLayer: "video" | "text" | "audio" | "graphic" | "effect";
}

const CAPABILITIES_REGISTRY: Record<ElementType, ElementCapabilities> = {
	video: {
		canDrag: true,
		canResize: true,
		hasKeyframes: true,
		canMute: true,
		canHide: true,
		canCopy: true,
		hasContextMenu: true,
		trackLayer: "video",
	},
	image: {
		canDrag: true,
		canResize: true,
		hasKeyframes: true,
		canMute: false,
		canHide: true,
		canCopy: true,
		hasContextMenu: true,
		trackLayer: "video",
	},
	text: {
		canDrag: true,
		canResize: true,
		hasKeyframes: true,
		canMute: false,
		canHide: true,
		canCopy: true,
		hasContextMenu: true,
		trackLayer: "text",
	},
	audio: {
		canDrag: true,
		canResize: true,
		hasKeyframes: false,
		canMute: true,
		canHide: false,
		canCopy: true,
		hasContextMenu: true,
		trackLayer: "audio",
	},
	sticker: {
		canDrag: true,
		canResize: true,
		hasKeyframes: true,
		canMute: false,
		canHide: true,
		canCopy: true,
		hasContextMenu: true,
		trackLayer: "graphic",
	},
	graphic: {
		canDrag: true,
		canResize: true,
		hasKeyframes: true,
		canMute: false,
		canHide: true,
		canCopy: true,
		hasContextMenu: true,
		trackLayer: "graphic",
	},
	effect: {
		canDrag: true,
		canResize: true,
		hasKeyframes: false,
		canMute: false,
		canHide: true,
		canCopy: true,
		hasContextMenu: true,
		trackLayer: "effect",
	},
	transition: {
		canDrag: false,
		canResize: false,
		hasKeyframes: false,
		canMute: false,
		canHide: false,
		canCopy: false,
		hasContextMenu: true,
		trackLayer: "video",
	},
};

export function getElementCapabilities(type: ElementType): ElementCapabilities {
	return CAPABILITIES_REGISTRY[type];
}
