import type { CanvasRenderer } from "../canvas-renderer";
import type {
	FrameItemDescriptor,
	TextureUploadDescriptor,
} from "../compositor/types";

export type BaseNodeParams = object | undefined;
export type AnyBaseNode = BaseNode<BaseNodeParams, unknown>;

export abstract class BaseNode<
	Params extends BaseNodeParams = BaseNodeParams,
	Resolved = unknown,
> {
	params: Params;
	resolved: Resolved | null = null;
	suppressDraw?: boolean;

	constructor(params?: Params) {
		this.params = params ?? ({} as Params);
	}

	abstract buildFrame(
		renderer: CanvasRenderer,
		path: string,
	): {
		items: FrameItemDescriptor[];
		textures: TextureUploadDescriptor[];
	};

	children: AnyBaseNode[] = [];

	add(child: AnyBaseNode) {
		this.children.push(child);
		return this;
	}

	remove(child: AnyBaseNode) {
		this.children = this.children.filter((c) => c !== child);
		return this;
	}
}
