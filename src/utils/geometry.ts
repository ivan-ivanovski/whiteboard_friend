import { BoardElement, CardinalAnchor, Point, RulerState } from '../types/whiteboard';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function getElementBoundingBox(el: BoardElement): BoundingBox {
  switch (el.type) {
    case 'sticky':
    case 'shape':
      return {
        minX: el.x,
        minY: el.y,
        maxX: el.x + el.width,
        maxY: el.y + el.height,
      };
    case 'checklist':
      // Height depends on items count (approx 60px header + 36px per item + 30px footer)
      const approxHeight = 60 + el.items.length * 36 + 40;
      return {
        minX: el.x,
        minY: el.y,
        maxX: el.x + el.width,
        maxY: el.y + approxHeight,
      };
    case 'text':
      return {
        minX: el.x,
        minY: el.y,
        maxX: el.x + el.width,
        maxY: el.y + el.height,
      };
    case 'stroke': {
      if (el.points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of el.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const pad = el.width / 2;
      return {
        minX: minX - pad,
        minY: minY - pad,
        maxX: maxX + pad,
        maxY: maxY + pad,
      };
    }
    case 'connector': {
      return {
        minX: Math.min(el.fromPoint.x, el.toPoint.x) - 10,
        minY: Math.min(el.fromPoint.y, el.toPoint.y) - 10,
        maxX: Math.max(el.fromPoint.x, el.toPoint.x) + 10,
        maxY: Math.max(el.fromPoint.y, el.toPoint.y) + 10,
      };
    }
  }
}

export function getElementAnchorPoints(el: BoardElement): { anchor: CardinalAnchor; point: Point }[] {
  if (el.type === 'stroke' || el.type === 'connector') return [];

  const bbox = getElementBoundingBox(el);
  const midX = (bbox.minX + bbox.maxX) / 2;
  const midY = (bbox.minY + bbox.maxY) / 2;

  return [
    { anchor: 'top', point: { x: midX, y: bbox.minY } },
    { anchor: 'right', point: { x: bbox.maxX, y: midY } },
    { anchor: 'bottom', point: { x: midX, y: bbox.maxY } },
    { anchor: 'left', point: { x: bbox.minX, y: midY } },
  ];
}

export function findClosestAnchor(
  elements: BoardElement[],
  point: Point,
  maxDistance: number = 24
): { elementId: string; anchor: CardinalAnchor; point: Point } | null {
  let closest: { elementId: string; anchor: CardinalAnchor; point: Point } | null = null;
  let minDist = maxDistance;

  for (const el of elements) {
    if (el.type === 'stroke' || el.type === 'connector') continue;
    const anchors = getElementAnchorPoints(el);
    for (const a of anchors) {
      const dist = Math.hypot(a.point.x - point.x, a.point.y - point.y);
      if (dist < minDist) {
        minDist = dist;
        closest = { elementId: el.id, anchor: a.anchor, point: a.point };
      }
    }
  }

  return closest;
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

export function hitTestStroke(stroke: { points: Point[]; width: number }, point: Point, threshold: number = 8): boolean {
  if (stroke.points.length < 2) {
    if (stroke.points.length === 1) {
      return Math.hypot(stroke.points[0].x - point.x, stroke.points[0].y - point.y) <= (stroke.width / 2 + threshold);
    }
    return false;
  }
  const effThreshold = stroke.width / 2 + threshold;
  for (let i = 0; i < stroke.points.length - 1; i++) {
    if (distanceToSegment(point, stroke.points[i], stroke.points[i + 1]) <= effThreshold) {
      return true;
    }
  }
  return false;
}

/**
 * Projects a point onto the ruler edge if within snapping distance (e.g., 20px).
 * Returns the projected point and whether it was snapped.
 */
export function snapToRuler(point: Point, ruler: RulerState, snapThreshold: number = 24): { point: Point; snapped: boolean } {
  if (!ruler.visible) return { point, snapped: false };

  const rad = (ruler.angle * Math.PI) / 180;
  // Ruler line defined by center (ruler.x, ruler.y) and angle
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);

  const halfLen = ruler.length / 2;
  const startX = ruler.x - dx * halfLen;
  const startY = ruler.y - dy * halfLen;
  const endX = ruler.x + dx * halfLen;
  const endY = ruler.y + dy * halfLen;

  const dist = distanceToSegment(point, { x: startX, y: startY }, { x: endX, y: endY });

  if (dist <= snapThreshold) {
    // Project point onto segment
    const t = Math.max(0, Math.min(1,
      ((point.x - startX) * (endX - startX) + (point.y - startY) * (endY - startY)) /
      ((endX - startX) ** 2 + (endY - startY) ** 2)
    ));
    return {
      point: {
        x: startX + t * (endX - startX),
        y: startY + t * (endY - startY),
      },
      snapped: true,
    };
  }

  return { point, snapped: false };
}
