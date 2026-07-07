import { createCanvasSurface } from "./canvas-utils";

/**
 * Applies a blur feather filter to a mask canvas.
 */
export function applyMaskFeather({
  maskCanvas,
  width,
  height,
  feather,
}: {
  maskCanvas: any;
  width: number;
  height: number;
  feather: number;
}): any {
  if (feather <= 0) {
    return maskCanvas;
  }

  const { canvas, context } = createCanvasSurface({ width, height });
  context.filter = `blur(${feather}px)`;
  context.drawImage(maskCanvas, 0, 0, width, height);

  return canvas;
}
