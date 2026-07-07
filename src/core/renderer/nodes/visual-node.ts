import { BaseNode } from "./base-node";
import { resolveAnimatedValue } from "../animation-resolver";

export abstract class VisualNode<Params extends any = any> extends BaseNode<Params> {
  
  /**
   * Resolves dynamic keyframe animations at a specific local timeline timestamp.
   */
  resolveState(time: number) {
    const params = this.params as any;
    const localTime = time - params.startTime;
    
    const opacity = resolveAnimatedValue(
      params.animations?.opacity,
      localTime,
      params.opacity !== undefined ? params.opacity : 1.0
    );
    
    const x = resolveAnimatedValue(
      params.animations?.x,
      localTime,
      params.x || 0
    );
    
    const y = resolveAnimatedValue(
      params.animations?.y,
      localTime,
      params.y || 0
    );
    
    const width = resolveAnimatedValue(
      params.animations?.width,
      localTime,
      params.width
    );
    
    const height = resolveAnimatedValue(
      params.animations?.height,
      localTime,
      params.height
    );

    return {
      opacity,
      x,
      y,
      width,
      height
    };
  }
}
