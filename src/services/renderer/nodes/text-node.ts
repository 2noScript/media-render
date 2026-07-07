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

  // Tọa độ vẽ mặc định ở giữa chiều ngang, và cách đáy 100px nếu không truyền
  const posX = el.style.x !== undefined ? el.style.x : canvasWidth / 2;
  const posY = el.style.y !== undefined ? el.style.y : canvasHeight - 100;

  // 1. Vẽ viền Stroke đen (áp dụng cho karaoke/subtitles hiển thị rõ ràng trên nền tối/sáng)
  if (el.style.strokeColor) {
    ctx.strokeStyle = el.style.strokeColor;
    ctx.lineWidth = el.style.strokeWidth || 4;
    ctx.lineJoin = "round";
    ctx.strokeText(el.text, posX, posY);
  }

  // 2. Vẽ màu chữ chính đè lên trên viền
  ctx.fillStyle = el.style.color || "white";
  ctx.fillText(el.text, posX, posY);
  
  ctx.restore();
}
