import { BaseNode } from "./base-node";
import { FrameItemDescriptor, TextureUploadDescriptor } from "../compositor/types";
import { CanvasRenderer } from "../canvas-renderer";
import { createCanvasSurface } from "../canvas-utils";
import { transitionsRegistry, applyEasing } from "../../../transitions";
import { VisualNode } from "./visual-node";
import { VideoNode } from "./video-node";
import { BlurBackgroundNode } from "./blur-background-node";
import { skiaCompositor } from "../compositor/skia-compositor";

export class TransitionNode extends BaseNode {
  private fromNode: BaseNode | null = null;
  private toNode: BaseNode | null = null;
  private progress = 0;

  constructor(params: any) {
    super(params);
  }

  /**
   * Helper to search for sibling nodes in the root node.
   */
  private findNodeById(renderer: CanvasRenderer, id: string): BaseNode | null {
    // Sibling nodes are children of rootNode
    const root = (renderer as any).rootNode;
    if (!root) return null;
    return root.children.find((child: any) => child.params?.id === id) || null;
  }

  /**
   * Asynchronously resolves the transition state and forces resolution of the incoming clip.
   */
  async resolveTransition(time: number, renderer: CanvasRenderer): Promise<void> {
    const fromId = this.params.fromElementId;
    const toId = this.params.toElementId;

    this.fromNode = this.findNodeById(renderer, fromId);
    this.toNode = this.findNodeById(renderer, toId);

    if (!this.toNode) return;

    // Suppress drawing on root canvas for both nodes
    if (this.fromNode) (this.fromNode as any).suppressDraw = true;
    (this.toNode as any).suppressDraw = true;

    // Calculate progress (0.0 -> 1.0)
    const startTime = this.params.startTime ?? 0;
    const duration = this.params.duration ?? 0.5;
    const rawProgress = (time - startTime) / duration;

    // Get transition definition to read its static easing setting
    const type = this.params.transitionType;
    const def = transitionsRegistry.get(type);
    const easing = def?.easing ?? "ease-in-out";

    this.progress = applyEasing(rawProgress, easing);

    // Force resolution of the incoming (toNode) clip at the correct playback time.
    // The incoming clip starts playing from its trimStart time.
    const toClipStartTime = this.toNode.params.startTime ?? 0;
    const elapsedInTransition = time - startTime;
    const toTime = toClipStartTime + elapsedInTransition;

    // Force resolve toNode
    await this.forceResolveNode(this.toNode, renderer, toTime);
  }

  private async forceResolveNode(node: BaseNode, renderer: CanvasRenderer, time: number) {
    node.resolved = null;
    if (node instanceof VisualNode) {
      node.resolved = node.resolveState(time);
    } else if (node instanceof BlurBackgroundNode) {
      await node.resolveBackdrop(time, renderer);
    }
    if (node instanceof VideoNode) {
      await node.resolveVideoFrame(time);
    }
  }

  private renderToOffscreen(node: BaseNode, renderer: CanvasRenderer, path: string): any {
    const { canvas, context } = createCanvasSurface({
      width: renderer.width,
      height: renderer.height,
    });

    const frame = node.buildFrame(renderer, path);
    skiaCompositor.syncTextures(frame.textures);
    skiaCompositor.render(
      {
        width: renderer.width,
        height: renderer.height,
        clear: { color: [0, 0, 0, 0] }, // clear transparent
        items: frame.items,
      },
      context
    );

    return canvas;
  }

  buildFrame(
    renderer: CanvasRenderer,
    path: string
  ): {
    items: FrameItemDescriptor[];
    textures: TextureUploadDescriptor[];
  } {
    const type = this.params.transitionType;
    const def = transitionsRegistry.get(type);

    if (!def || !this.resolved) {
      return { items: [], textures: [] };
    }

    // Render fromNode (if active) and toNode to offscreen canvases
    let fromCanvas: any = null;
    if (this.fromNode && this.fromNode.resolved) {
      fromCanvas = this.renderToOffscreen(this.fromNode, renderer, `${path}:from`);
    }

    let toCanvas: any = null;
    if (this.toNode && this.toNode.resolved) {
      toCanvas = this.renderToOffscreen(this.toNode, renderer, `${path}:to`);
    }

    // Create target output canvas surface
    const { canvas: outCanvas, context: outCtx } = createCanvasSurface({
      width: renderer.width,
      height: renderer.height,
    });

    // Run transition renderer
    def.renderer.render({
      fromCanvas,
      toCanvas,
      progress: this.progress,
      params: this.params.params || {},
      width: renderer.width,
      height: renderer.height,
      output: outCtx,
    });

    const textureId = `${path}:transition`;

    const texture: TextureUploadDescriptor = {
      kind: "external",
      id: textureId,
      source: outCanvas,
      width: renderer.width,
      height: renderer.height,
    };

    const item: FrameItemDescriptor = {
      type: "layer",
      textureId,
      transform: {
        centerX: renderer.width / 2,
        centerY: renderer.height / 2,
        width: renderer.width,
        height: renderer.height,
        rotationDegrees: 0,
        flipX: false,
        flipY: false,
      },
      opacity: 1.0,
      blendMode: "normal",
      mask: null,
    };

    return {
      items: [item],
      textures: [texture],
    };
  }
}

import { nodeRegistry } from "./registry";
nodeRegistry.register("transition", (el) => {
  return new TransitionNode(el);
});
