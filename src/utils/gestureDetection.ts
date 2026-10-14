import { Point, BoardElement } from '../types/whiteboard';
import { BoundingBox, getElementBoundingBox } from './geometry';

/**
 * Checks if a freehand stroke is an intentional "scratch-to-erase" / scribble-out gesture.
 * A scribble consists of rapid direction reversals (zig-zags) in horizontal or vertical axes.
 */
export function isScribbleGesture(points: Point[]): { isScribble: boolean; bbox: BoundingBox } {
  if (points.length < 10) {
    return {
      isScribble: false,
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  let xReversals = 0;
  let yReversals = 0;
  let prevDx = 0;
  let prevDy = 0;
  let totalLength = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;

    if (i > 0) {
      const pPrev = points[i - 1];
      const dx = p.x - pPrev.x;
      const dy = p.y - pPrev.y;
      totalLength += Math.hypot(dx, dy);

      // Check horizontal reversals with noise threshold (>= 4px)
      if (Math.abs(dx) >= 4) {
        if (prevDx !== 0 && Math.sign(dx) !== Math.sign(prevDx)) {
          xReversals++;
        }
        prevDx = dx;
      }

      // Check vertical reversals with noise threshold (>= 4px)
      if (Math.abs(dy) >= 4) {
        if (prevDy !== 0 && Math.sign(dy) !== Math.sign(prevDy)) {
          yReversals++;
        }
        prevDy = dy;
      }
    }
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const perimeter = 2 * (width + height);

  // A scribble has a high ratio of path length compared to bounding box (dense overlapping strokes)
  // and at least 3-4 direction changes
  const hasReversals = xReversals >= 3 || yReversals >= 3;
  const isDense = totalLength > perimeter * 1.2;

  const isScribble = hasReversals && isDense;

  return {
    isScribble,
    bbox: { minX, minY, maxX, maxY },
  };
}

/**
 * Checks if two bounding boxes overlap or intersect.
 */
export function doBoxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
}

/**
 * Finds all elements that overlap with a scribble's bounding box.
 */
export function findElementsUnderScribble(scribbleBox: BoundingBox, elements: BoardElement[]): string[] {
  const matchedIds: string[] = [];

  for (const el of elements) {
    const elBox = getElementBoundingBox(el);
    if (doBoxesOverlap(scribbleBox, elBox)) {
      matchedIds.push(el.id);
    }
  }

  return matchedIds;
}

/**
 * Detects if a stroke was held to snap into a straight line or geometric shape.
 */
export function detectHoldToSnap(points: Point[]): {
  type: 'line' | 'circle';
  snappedPoints: Point[];
} | null {
  if (points.length < 8) return null;

  const start = points[0];
  const end = points[points.length - 1];

  let totalDist = 0;
  for (let i = 1; i < points.length; i++) {
    totalDist += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  const directDist = Math.hypot(end.x - start.x, end.y - start.y);

  // 1. Straight Line Snap: Direct distance is >= 86% of total stroke length
  if (directDist > 30 && directDist / totalDist >= 0.86) {
    // Generate intermediate points along perfectly straight line
    return {
      type: 'line',
      snappedPoints: [
        start,
        { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        end,
      ],
    };
  }

  // 2. Circle/Ellipse Snap: Start and end are close, roughly circular
  const loopCloseDist = Math.hypot(end.x - start.x, end.y - start.y);
  if (points.length > 15 && totalDist > 80 && loopCloseDist < totalDist * 0.25) {
    // Calculate center and radius
    let sumX = 0;
    let sumY = 0;
    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
    }
    const centerX = sumX / points.length;
    const centerY = sumY / points.length;

    let avgRadius = 0;
    for (const p of points) {
      avgRadius += Math.hypot(p.x - centerX, p.y - centerY);
    }
    avgRadius /= points.length;

    // Generate smoothed circle points
    const circlePoints: Point[] = [];
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      circlePoints.push({
        x: centerX + Math.cos(angle) * avgRadius,
        y: centerY + Math.sin(angle) * avgRadius,
        pressure: 0.5,
      });
    }

    return {
      type: 'circle',
      snappedPoints: circlePoints,
    };
  }

  return null;
}
