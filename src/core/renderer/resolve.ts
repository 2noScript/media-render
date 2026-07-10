import { BaseNode } from "./nodes/base-node";
import { VisualNode } from "./nodes/visual-node";
import { VideoNode } from "./nodes/video-node";
import { BlurBackgroundNode } from "./nodes/blur-background-node";
import { TransitionNode } from "./nodes/transition-node";
import { CanvasRenderer } from "./canvas-renderer";

/**
 * Traverses the scene node tree asynchronously to pre-resolve layout transforms,
 * fetch required video samples, and prepare visual state for synchronous frame drawing.
 */
export async function resolveRenderTree(
  node: BaseNode,
  renderer: CanvasRenderer,
  time: number
): Promise<void> {
  // Set default resolved state to null (inactive)
  node.resolved = null;

  const start = node.params.startTime !== undefined ? node.params.startTime : 0;
  const dur = node.params.duration !== undefined ? node.params.duration : Infinity;
  const isActive = time >= start && time < start + dur;

  if (isActive) {
    // Default truthy value so custom BaseNodes are marked active
    node.resolved = node.params;

    // 1. Resolve keyframes / visual state for VisualNode/TransitionNode instances
    if (node instanceof VisualNode) {
      node.resolved = node.resolveState(time);
    } else if (node instanceof BlurBackgroundNode) {
      // BlurBackgroundNode requires async video frame decoding or image lookup
      await node.resolveBackdrop(time, renderer);
    } else if (node instanceof TransitionNode) {
      await node.resolveTransition(time, renderer);
    }

    // 2. Await asynchronous resources (e.g. video samples)
    if (node instanceof VideoNode) {
      await node.resolveVideoFrame(time);
    }
  }


  // 3. Recursively resolve children in parallel
  if (node.children && node.children.length > 0) {
    await Promise.all(
      node.children.map((child) => resolveRenderTree(child, renderer, time))
    );
  }
}
