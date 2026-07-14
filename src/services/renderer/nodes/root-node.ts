import { BaseNode } from "./base-node";
import type {
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "../compositor/types";
import type { CanvasRenderer } from "../canvas-renderer";

export type RootNodeParams = {
	duration: number;
};

export class RootNode extends BaseNode<RootNodeParams> {
	get duration() {
		return this.params.duration ?? 0;
	}

	buildFrame(
		renderer: CanvasRenderer,
		path: string,
	): {
		items: FrameItemDescriptor[];
		textures: TextureUploadDescriptor[];
	} {
		const items: FrameItemDescriptor[] = [];
		const textures: TextureUploadDescriptor[] = [];

		for (let i = 0; i < this.children.length; i++) {
			const child = this.children[i];
			if (child.resolved !== null && !child.suppressDraw) {
				const result = child.buildFrame(renderer, `${path}:${i}`);
				items.push(...result.items);
				textures.push(...result.textures);
			}
		}

		return { items, textures };
	}
}
