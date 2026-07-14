import { Canvas, createCanvas } from "@napi-rs/canvas";

/**
 * Creates a canvas surface and its 2D context using Skia rendering engine.
 */
export function createCanvasSurface({
  width,
  height,
}: {
  width: number;
  height: number;
}): {
  canvas: Canvas;
  context: any;
} {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create 2D rendering context");
  }
  return { canvas, context };
}

export function createOffscreenCanvas({
  width,
  height,
}: {
  width: number;
  height: number;
}): Canvas {
  return createCanvas(width, height);
}

