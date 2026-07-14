import type { StickerProvider } from "@/services/stickers/types";
import { DefinitionRegistry } from "@/core/params/registry";

export class StickersRegistry extends DefinitionRegistry<
	string,
	StickerProvider
> {
	constructor() {
		super("sticker provider");
	}
}

export const stickersRegistry = new StickersRegistry();
