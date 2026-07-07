import { BaseNode } from "./base-node";
import { resolveAnimatedValue } from "../animation-resolver";

export abstract class VisualNode<Params extends any = any> extends BaseNode<Params> {
  
  /**
   * Resolves dynamic keyframe animations at a specific local timeline timestamp.
   */
  resolveState(time: number) {
    const params = this.params as any;
    const localTime = time - params.startTime;
    
    const editorParams = params.params || {};

    // Resolve base timeline values directly from the editor params block
    const opacityBase = editorParams["opacity"] !== undefined ? editorParams["opacity"] : 1.0;
    const xBase = editorParams["transform.positionX"] !== undefined ? editorParams["transform.positionX"] : 0;
    const yBase = editorParams["transform.positionY"] !== undefined ? editorParams["transform.positionY"] : 0;
    const widthBase = editorParams["width"];
    const heightBase = editorParams["height"];
    const rotationBase = editorParams["transform.rotate"] !== undefined ? editorParams["transform.rotate"] : 0;
    const flipXBase = editorParams["transform.flipX"] !== undefined ? editorParams["transform.flipX"] : false;
    const flipYBase = editorParams["transform.flipY"] !== undefined ? editorParams["transform.flipY"] : false;
    const scaleXBase = editorParams["transform.scaleX"] !== undefined ? editorParams["transform.scaleX"] : 1.0;
    const scaleYBase = editorParams["transform.scaleY"] !== undefined ? editorParams["transform.scaleY"] : 1.0;

    const opacity = resolveAnimatedValue(
      params.animations?.["opacity"],
      localTime,
      opacityBase
    );
    
    const x = resolveAnimatedValue(
      params.animations?.["transform.positionX"],
      localTime,
      xBase
    );
    
    const y = resolveAnimatedValue(
      params.animations?.["transform.positionY"],
      localTime,
      yBase
    );
    
    const width = resolveAnimatedValue(
      params.animations?.["width"],
      localTime,
      widthBase
    );
    
    const height = resolveAnimatedValue(
      params.animations?.["height"],
      localTime,
      heightBase
    );

    const rotationDegrees = resolveAnimatedValue(
      params.animations?.["transform.rotate"],
      localTime,
      rotationBase
    );

    const flipX = resolveAnimatedValue(
      params.animations?.["transform.flipX"],
      localTime,
      flipXBase
    );

    const flipY = resolveAnimatedValue(
      params.animations?.["transform.flipY"],
      localTime,
      flipYBase
    );

    const scaleX = resolveAnimatedValue(
      params.animations?.["transform.scaleX"],
      localTime,
      scaleXBase
    );

    const scaleY = resolveAnimatedValue(
      params.animations?.["transform.scaleY"],
      localTime,
      scaleYBase
    );

    return {
      opacity,
      x,
      y,
      width,
      height,
      rotationDegrees,
      flipX,
      flipY,
      scaleX,
      scaleY
    };
  }

  /**
   * Resolves layer center coordinates relative to the canvas center.
   */
  protected resolveCenter(
    resolved: any,
    canvasWidth: number,
    canvasHeight: number
  ) {
    return {
      centerX: (canvasWidth / 2) + (resolved.x ?? 0),
      centerY: (canvasHeight / 2) + (resolved.y ?? 0)
    };
  }
}
