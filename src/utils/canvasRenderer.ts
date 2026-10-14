import { FreehandStrokeElement, Point, Viewport } from '../types/whiteboard';

export function renderBackgroundGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewport: Viewport,
  gridType: 'dots' | 'grid' | 'none',
  isDark: boolean
): void {
  ctx.clearRect(0, 0, width, height);
  if (gridType === 'none') return;

  const baseSpacing = 28;
  const scaledSpacing = baseSpacing * viewport.zoom;

  // Don't draw if too dense
  if (scaledSpacing < 8) return;

  const offsetX = (viewport.x * viewport.zoom) % scaledSpacing;
  const offsetY = (viewport.y * viewport.zoom) % scaledSpacing;

  ctx.save();

  if (gridType === 'dots') {
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.14)';
    const dotRadius = Math.max(1, 1.2 * Math.min(1.5, viewport.zoom));

    for (let x = offsetX; x < width; x += scaledSpacing) {
      for (let y = offsetY; y < height; y += scaledSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (gridType === 'grid') {
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = offsetX; x < width; x += scaledSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += scaledSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws a smoothed stroke onto the canvas.
 * Handles Catmull-Rom or Quadratic Midpoint Bezier curve interpolation.
 */
export function drawSmoothedStroke(
  ctx: CanvasRenderingContext2D,
  stroke: FreehandStrokeElement,
  viewport?: Viewport
): void {
  const points = stroke.points;
  if (!points || points.length === 0) return;

  ctx.save();
  if (viewport) {
    ctx.translate(viewport.x * viewport.zoom, viewport.y * viewport.zoom);
    ctx.scale(viewport.zoom, viewport.zoom);
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'highlighter') {
    ctx.globalAlpha = stroke.opacity || 0.4;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    // Highlighter blending
    ctx.globalCompositeOperation = 'multiply';
  } else {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.globalCompositeOperation = 'source-over';
  }

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    ctx.fill();
    ctx.restore();
    return;
  }

  if (points.length === 2) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const hasPressure = stroke.tool === 'pen' && points.some((p) => p.pressure !== undefined && p.pressure > 0);

  if (hasPressure && points.length > 2) {
    // Render dynamic pressure stroke with varying line width
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const pressure = p1.pressure ?? 0.5;
      // Modulate width by pressure (0.4 to 1.6 scale)
      const dynamicWidth = Math.max(1, stroke.width * (0.35 + 1.3 * pressure));

      ctx.beginPath();
      ctx.lineWidth = dynamicWidth;
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // Smooth midpoint quadratic curve
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  // Last point
  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders all strokes on the ink canvas.
 */
export function renderAllStrokes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokes: FreehandStrokeElement[],
  viewport: Viewport
): void {
  ctx.clearRect(0, 0, width, height);

  for (const stroke of strokes) {
    drawSmoothedStroke(ctx, stroke, viewport);
  }
}
