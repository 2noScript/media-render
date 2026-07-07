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

  // 1. Tạo Canvas phụ nhỏ có kích thước bằng frame nguồn
  const tempCanvas = createCanvas(width, height);
  const tempCtx = tempCanvas.getContext("2d");

  // 2. Copy dữ liệu pixel RGBA thô từ VideoSample sang Canvas phụ
  const rawBuffer = Buffer.alloc(width * height * 4);
  await sample.copyTo(rawBuffer, { format: "RGBA" } as any);

  // 3. Khởi tạo ImageData chuẩn W3C (đầu ra của napi-rs/canvas tương thích tốt với Bun)
  const clamped = new Uint8ClampedArray(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);
  const imageData = new ImageData(clamped, width, height);

  tempCtx.putImageData(imageData, 0, 0);

  // 4. Vẽ Canvas phụ lên Canvas chính (tự động co giãn scale, xoay transform, áp dụng opacity)
  ctx.save();
  ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1.0;
  ctx.drawImage(tempCanvas, el.x || 0, el.y || 0, el.width || width, el.height || height);
  ctx.restore();

  sample.close();
}
