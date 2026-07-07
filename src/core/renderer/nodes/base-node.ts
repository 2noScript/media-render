import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";

export type BaseNodeParams = any;
export type AnyBaseNode = BaseNode<BaseNodeParams>;

export abstract class BaseNode<Params extends BaseNodeParams = BaseNodeParams> {
  params: Params;
  resolved: any = null;
  children: BaseNode[] = [];

  constructor(params?: Params) {
    this.params = params ?? ({} as Params);
  }

  add(child: BaseNode) {
    this.children.push(child);
    return this;
  }

  remove(child: BaseNode) {
    this.children = this.children.filter((c) => c !== child);
    return this;
  }

  abstract buildFrame(
    renderer: CanvasRenderer,
    path: string
  ): {
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  };
}
