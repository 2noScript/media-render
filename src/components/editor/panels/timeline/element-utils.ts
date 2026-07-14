import type { TimelineElement } from "@/components/editor/panels/timeline";

export function canElementHaveAudio(element: TimelineElement): boolean {
	return element.type === "video" || element.type === "audio";
}

import type { VisualElement } from "@/components/editor/panels/timeline";

export function isVisualElement(element: TimelineElement): element is VisualElement {
	return (
		element.type === "video" ||
		element.type === "image" ||
		element.type === "text" ||
		element.type === "sticker" ||
		element.type === "graphic"
	);
}
