import { createCanvas, ImageData } from "@napi-rs/canvas";

export async function renderVideoNodeToContext({
  el,
  time,
  ctx,
  videoSinksMap
}: {
  el: any;
  time: number;
  ctx: any;
  videoSinksMap: Record<string, any>;
}): Promise<void> {
  const localTime = (time - el.startTime) + el.trimStart;
  const sink = videoSinksMap[el.id];
  if (!sink) return;

  const sample = await sink.getSample(localTime);
  if (!sample) return;

  const width = sample.displayWidth;
  const height = sample.displayHeight;

  // 1. Create a temporary canvas sized matching the source frame
  const tempCanvas = createCanvas(width, height);
  const tempCtx = tempCanvas.getContext("2d");

  // 2. Copy raw RGBA pixel buffer from VideoSample to local memory
  const rawBuffer = Buffer.alloc(width * height * 4);
  await sample.copyTo(rawBuffer, { format: "RGBA" } as any);

  // 3. Initialize standard W3C ImageData object backed by the raw buffer
  const clamped = new Uint8ClampedArray(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);
  const imageData = new ImageData(clamped, width, height);

  tempCtx.putImageData(imageData, 0, 0);

  // 4. Draw temporary canvas onto the main canvas (applying scaling, translation, and opacity)
  ctx.save();
  ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1.0;
  ctx.drawImage(tempCanvas, el.x || 0, el.y || 0, el.width || width, el.height || height);
  ctx.restore();

  sample.close();
}
