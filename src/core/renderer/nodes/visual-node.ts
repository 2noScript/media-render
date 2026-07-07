import { BaseNode } from "./base-node";
import { resolveAnimatedValue } from "../animation-resolver";

export abstract class VisualNode<Params extends any = any> extends BaseNode<Params> {
  
  /**
   * Resolves dynamic keyframe animations at a specific local timeline timestamp.
   */
  resolveState(time: number) {
    const params = this.params as any;
    const localTime = time - params.startTime;
    
    // Resolve base fallback values
    const opacityBase = params.opacity !== undefined ? params.opacity : (params.params?.["opacity"] !== undefined ? params.params["opacity"] : 1.0);
    const xBase = params.x !== undefined ? params.x : (params.params?.["transform.positionX"] !== undefined ? params.params["transform.positionX"] : 0);
    const yBase = params.y !== undefined ? params.y : (params.params?.["transform.positionY"] !== undefined ? params.params["transform.positionY"] : 0);
    const widthBase = params.width !== undefined ? params.width : (params.params?.["width"] !== undefined ? params.params["width"] : undefined);
    const heightBase = params.height !== undefined ? params.height : (params.params?.["height"] !== undefined ? params.params["height"] : undefined);
    const rotationBase = params.rotationDegrees !== undefined ? params.rotationDegrees : (params.params?.["transform.rotate"] !== undefined ? params.params["transform.rotate"] : 0);
    const flipXBase = params.flipX !== undefined ? params.flipX : (params.params?.["transform.flipX"] !== undefined ? params.params["transform.flipX"] : false);
    const flipYBase = params.flipY !== undefined ? params.flipY : (params.params?.["transform.flipY"] !== undefined ? params.params["transform.flipY"] : false);
    const scaleXBase = params.scaleX !== undefined ? params.scaleX : (params.params?.["transform.scaleX"] !== undefined ? params.params["transform.scaleX"] : 1.0);
    const scaleYBase = params.scaleY !== undefined ? params.scaleY : (params.params?.["transform.scaleY"] !== undefined ? params.params["transform.scaleY"] : 1.0);

    const opacity = resolveAnimatedValue(
      params.animations?.opacity,
      localTime,
      opacityBase
    );
    
    const x = resolveAnimatedValue(
      params.animations?.x ?? params.animations?.["transform.positionX"],
      localTime,
      xBase
    );
    
    const y = resolveAnimatedValue(
      params.animations?.y ?? params.animations?.["transform.positionY"],
      localTime,
      yBase
    );
    
    const width = resolveAnimatedValue(
      params.animations?.width,
      localTime,
      widthBase
    );
    
    const height = resolveAnimatedValue(
      params.animations?.height,
      localTime,
      heightBase
    );

    const rotationDegrees = resolveAnimatedValue(
      params.animations?.rotationDegrees ?? params.animations?.["transform.rotate"],
      localTime,
      rotationBase
    );

    const flipX = resolveAnimatedValue(
      params.animations?.flipX ?? params.animations?.["transform.flipX"],
      localTime,
      flipXBase
    );

    const flipY = resolveAnimatedValue(
      params.animations?.flipY ?? params.animations?.["transform.flipY"],
      localTime,
      flipYBase
    );

    const scaleX = resolveAnimatedValue(
      params.animations?.scaleX ?? params.animations?.["transform.scaleX"],
      localTime,
      scaleXBase
    );

    const scaleY = resolveAnimatedValue(
      params.animations?.scaleY ?? params.animations?.["transform.scaleY"],
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
}
