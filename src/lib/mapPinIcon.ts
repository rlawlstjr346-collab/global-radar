/** Draws a classic teardrop map pin (circle head + diamond tail) for use as a Mapbox GL icon image. */
export function createPinIcon(
  fillColor: string,
  options: { size?: number; strokeColor?: string; strokeWidth?: number } = {},
): ImageData {
  const size = options.size ?? 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round(size * 1.3);
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const r = size * 0.32;
  const cy = r + size * 0.06;

  ctx.save();
  ctx.translate(cx, cy + r * 0.2);
  ctx.rotate(Math.PI / 4);
  const half = r * 0.85;
  ctx.fillStyle = fillColor;
  ctx.fillRect(-half, -half, half * 2, half * 2);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
  if (options.strokeColor) {
    ctx.lineWidth = options.strokeWidth ?? 2;
    ctx.strokeStyle = options.strokeColor;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
