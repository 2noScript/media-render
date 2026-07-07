import { BaseNode } from "./base-node";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";

export class RootNode extends BaseNode<{ duration: number }> {
  constructor(params: { duration: number }) {
    super(params);
  }

  buildFrame(
    renderer: CanvasRenderer,
    path: string
  ): {
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  } {
    const items: FrameItemDescriptor[] = [];
    const textures: TextureUploadDescriptor[] = [];

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (child.resolved !== null) {
        const result = child.buildFrame(renderer, `${path}:${i}`);
        items.push(...result.items);
        textures.push(...result.textures);
      }
    }

    return { items, textures };
  }
}
