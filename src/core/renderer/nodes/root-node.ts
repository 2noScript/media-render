import { BaseNode } from "./base-node";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";

export class RootNode extends BaseNode<{ duration: number }> {
  constructor(params: { duration: number }) {
    super(params);
  }

  async buildFrame(
    time: number,
    renderer: CanvasRenderer,
    path: string
  ): Promise<{
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  }> {
    const items: FrameItemDescriptor[] = [];
    const textures: TextureUploadDescriptor[] = [];

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const start = child.params.startTime !== undefined ? child.params.startTime : 0;
      const dur = child.params.duration !== undefined ? child.params.duration : Infinity;
      
      if (time >= start && time < start + dur) {
        const result = await child.buildFrame(time, renderer, `${path}:${i}`);
        items.push(...result.items);
        textures.push(...result.textures);
      }
    }

    return { items, textures };
  }
}
