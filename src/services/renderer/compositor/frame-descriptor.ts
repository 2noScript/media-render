import type { AnyBaseNode } from "../nodes/base-node";
import type { CanvasRenderer } from "../canvas-renderer";
import type {
	FrameDescriptor,
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "./types";

/**
 * Builds the intermediate FrameDescriptor by delegating polymorphically
 * to the RootNode and traversing down the scene graph.
 */
export async function buildFrameDescriptor({
	node,
	renderer,
}: {
	node: AnyBaseNode;
	renderer: CanvasRenderer;
}): Promise<{
	frame: FrameDescriptor;
	textures: TextureUploadDescriptor[];
}> {
	const { items, textures } = node.buildFrame(renderer, "root");

	return {
		frame: {
			width: renderer.width,
			height: renderer.height,
			clear: {
				color: [0, 0, 0, 1],
			},
			items,
		},
		textures,
	};
}
