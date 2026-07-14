import type { Mask, MaskDefaultContext, MaskType } from "@/services/masks/types";
import { masksRegistry } from "./registry";
import { generateUUID } from "@/lib/utils/id";

export { masksRegistry } from "./registry";
export { registerDefaultMasks } from "./definitions";

export function buildDefaultMaskInstance({
	maskType,
	elementSize,
}: {
	maskType: MaskType;
	elementSize?: { width: number; height: number };
}): Mask {
	const definition = masksRegistry.get(maskType);
	const context: MaskDefaultContext = { elementSize };
	return { ...definition.buildDefault(context), id: generateUUID() } as Mask;
}
