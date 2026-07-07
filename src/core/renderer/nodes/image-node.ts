export function renderImageNodeToContext({
  el,
  ctx,
  imagesMap
}: {
  el: any;
  ctx: any;
  imagesMap: Record<string, any>;
}): void {
  const img = imagesMap[el.id];
  if (!img) return;

  ctx.save();
  ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1.0;
  ctx.drawImage(img, el.x || 0, el.y || 0, el.width || img.width, el.height || img.height);
  ctx.restore();
}
