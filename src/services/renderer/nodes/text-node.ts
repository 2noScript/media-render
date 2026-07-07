import { TextElement } from "../../../types/editor-manifest";

export function renderTextNodeToContext({
  el,
  ctx,
  canvasWidth,
  canvasHeight
}: {
  el: TextElement;
  ctx: any;
  canvasWidth: number;
  canvasHeight: number;
}): void {
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = el.style.textAlign || "center";
  
  const fontSize = el.style.fontSize || 24;
  const fontFamily = el.style.fontFamily || "Arial";
  ctx.font = `${fontSize}px "${fontFamily}"`;

  // Default draw coordinates: horizontally centered and 100px from the bottom if not specified
  const posX = el.style.x !== undefined ? el.style.x : canvasWidth / 2;
  const posY = el.style.y !== undefined ? el.style.y : canvasHeight - 100;

  // 1. Draw outline stroke (essential for high contrast readability of subtitles over various backgrounds)
  if (el.style.strokeColor) {
    ctx.strokeStyle = el.style.strokeColor;
    ctx.lineWidth = el.style.strokeWidth || 4;
    ctx.lineJoin = "round";
    ctx.strokeText(el.text, posX, posY);
  }

  // 2. Fill the main text body over the outline stroke
  ctx.fillStyle = el.style.color || "white";
  ctx.fillText(el.text, posX, posY);
  
  ctx.restore();
}
