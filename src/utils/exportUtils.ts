import { Board, BoardElement } from '../types/whiteboard';
import { getElementBoundingBox } from './geometry';

export function calculateBoardBounds(elements: BoardElement[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 1200, maxY: 800 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const box = getElementBoundingBox(el);
    if (box.minX < minX) minX = box.minX;
    if (box.minY < minY) minY = box.minY;
    if (box.maxX > maxX) maxX = box.maxX;
    if (box.maxY > maxY) maxY = box.maxY;
  }

  const pad = 60;
  return {
    minX: Math.floor(minX - pad),
    minY: Math.floor(minY - pad),
    maxX: Math.ceil(maxX + pad),
    maxY: Math.ceil(maxY + pad),
  };
}

export async function exportToPNG(board: Board, background: 'white' | 'dark' | 'transparent' = 'white'): Promise<void> {
  const bounds = calculateBoardBounds(board.elements);
  const width = Math.max(400, bounds.maxX - bounds.minX);
  const height = Math.max(300, bounds.maxY - bounds.minY);

  const canvas = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);

  // Background
  if (background === 'white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  } else if (background === 'dark') {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.translate(-bounds.minX, -bounds.minY);

  // 1. Draw Connectors first (underneath shapes)
  for (const el of board.elements) {
    if (el.type === 'connector') {
      ctx.save();
      ctx.strokeStyle = el.color || '#475569';
      ctx.lineWidth = el.width || 2;
      ctx.beginPath();
      ctx.moveTo(el.fromPoint.x, el.fromPoint.y);
      if (el.style === 'curved') {
        const dx = el.toPoint.x - el.fromPoint.x;
        ctx.bezierCurveTo(
          el.fromPoint.x + dx * 0.5, el.fromPoint.y,
          el.toPoint.x - dx * 0.5, el.toPoint.y,
          el.toPoint.x, el.toPoint.y
        );
      } else {
        ctx.lineTo(el.toPoint.x, el.toPoint.y);
      }
      ctx.stroke();

      // Arrowhead
      if (el.arrowEnd) {
        const angle = Math.atan2(el.toPoint.y - el.fromPoint.y, el.toPoint.x - el.fromPoint.x);
        const headlen = 12;
        ctx.fillStyle = el.color || '#475569';
        ctx.beginPath();
        ctx.moveTo(el.toPoint.x, el.toPoint.y);
        ctx.lineTo(
          el.toPoint.x - headlen * Math.cos(angle - Math.PI / 6),
          el.toPoint.y - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          el.toPoint.x - headlen * Math.cos(angle + Math.PI / 6),
          el.toPoint.y - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 2. Draw Shapes
  for (const el of board.elements) {
    if (el.type === 'shape') {
      ctx.save();
      ctx.fillStyle = el.fillColor;
      ctx.strokeStyle = el.strokeColor;
      ctx.lineWidth = el.strokeWidth;

      if (el.shapeKind === 'rectangle') {
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.shapeKind === 'rounded-rect') {
        const r = 12;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, r);
        ctx.fill();
        ctx.stroke();
      } else if (el.shapeKind === 'circle') {
        ctx.beginPath();
        ctx.ellipse(el.x + el.width / 2, el.y + el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (el.shapeKind === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(el.x + el.width / 2, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height / 2);
        ctx.lineTo(el.x + el.width / 2, el.y + el.height);
        ctx.lineTo(el.x, el.y + el.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (el.shapeKind === 'cloud') {
        const r = 12;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, [20, 20, 20, 20]);
        ctx.fill();
        ctx.stroke();
      }

      if (el.text) {
        ctx.fillStyle = el.textColor || '#0F172A';
        ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.text, el.x + el.width / 2, el.y + el.height / 2);
      }
      ctx.restore();
    }
  }

  // 3. Draw Sticky Notes
  for (const el of board.elements) {
    if (el.type === 'sticky') {
      ctx.save();
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      if (el.rotation) {
        ctx.rotate((el.rotation * Math.PI) / 180);
      }
      ctx.translate(-el.width / 2, -el.height / 2);

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      // Note background
      ctx.fillStyle = el.color;
      ctx.beginPath();
      ctx.roundRect(0, 0, el.width, el.height, 4);
      ctx.fill();

      ctx.shadowColor = 'transparent';

      // Title
      if (el.title) {
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(el.title, 14, 14);
      }

      // Content
      if (el.content) {
        ctx.fillStyle = '#334155';
        ctx.font = '13px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const lines = el.content.split('\n');
        let currentY = el.title ? 38 : 16;
        for (const line of lines) {
          ctx.fillText(line, 14, currentY);
          currentY += 18;
          if (currentY > el.height - 14) break;
        }
      }

      ctx.restore();
    }
  }

  // 4. Draw Checklists
  for (const el of board.elements) {
    if (el.type === 'checklist') {
      ctx.save();
      const height = 48 + el.items.length * 32 + 20;

      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = el.color || '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.width, height, 8);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.shadowColor = 'transparent';

      // Title
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(el.title, el.x + 16, el.y + 14);

      // Items
      let itemY = el.y + 44;
      for (const item of el.items) {
        // Box
        ctx.strokeStyle = item.completed ? '#16A34A' : '#94A3B8';
        ctx.fillStyle = item.completed ? '#16A34A' : '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(el.x + 16, itemY, 16, 16, 3);
        ctx.fill();
        ctx.stroke();

        if (item.completed) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(el.x + 19, itemY + 8);
          ctx.lineTo(el.x + 23, itemY + 12);
          ctx.lineTo(el.x + 29, itemY + 4);
          ctx.stroke();
        }

        ctx.fillStyle = item.completed ? '#94A3B8' : '#1E293B';
        ctx.font = '13px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.text, el.x + 40, itemY + 8);

        if (item.completed) {
          const textW = ctx.measureText(item.text).width;
          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(el.x + 40, itemY + 8);
          ctx.lineTo(el.x + 40 + textW, itemY + 8);
          ctx.stroke();
        }

        itemY += 30;
      }

      ctx.restore();
    }
  }

  // 5. Draw Text elements
  for (const el of board.elements) {
    if (el.type === 'text') {
      ctx.save();
      ctx.fillStyle = el.color;
      ctx.font = `${el.bold ? 'bold ' : ''}${el.fontSize || 16}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(el.text, el.x, el.y);
      ctx.restore();
    }
  }

  // 6. Draw Freehand Strokes
  for (const el of board.elements) {
    if (el.type === 'stroke') {
      const points = el.points;
      if (!points || points.length === 0) continue;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.tool === 'highlighter') {
        ctx.globalAlpha = el.opacity || 0.45;
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.width;
      } else {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.width;
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // Trigger download
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  const safeTitle = board.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'whiteboard';
  a.download = `${safeTitle}-${Date.now()}.png`;
  a.click();
}

export function exportToSVG(board: Board): void {
  const bounds = calculateBoardBounds(board.elements);
  const width = Math.max(400, bounds.maxX - bounds.minX);
  const height = Math.max(300, bounds.maxY - bounds.minY);

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX} ${bounds.minY} ${width} ${height}" width="${width}" height="${height}">\n`;
  svgContent += `<style>text { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }</style>\n`;
  svgContent += `<rect x="${bounds.minX}" y="${bounds.minY}" width="${width}" height="${height}" fill="#FFFFFF"/>\n`;

  // Connectors
  for (const el of board.elements) {
    if (el.type === 'connector') {
      svgContent += `<line x1="${el.fromPoint.x}" y1="${el.fromPoint.y}" x2="${el.toPoint.x}" y2="${el.toPoint.y}" stroke="${el.color}" stroke-width="${el.width}" />\n`;
    }
  }

  // Shapes
  for (const el of board.elements) {
    if (el.type === 'shape') {
      if (el.shapeKind === 'rectangle' || el.shapeKind === 'rounded-rect') {
        const rx = el.shapeKind === 'rounded-rect' ? 8 : 0;
        svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${rx}" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}"/>\n`;
      } else if (el.shapeKind === 'circle') {
        svgContent += `<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}"/>\n`;
      }
      if (el.text) {
        svgContent += `<text x="${el.x + el.width / 2}" y="${el.y + el.height / 2}" fill="${el.textColor || '#000'}" font-size="14" font-weight="600" text-anchor="middle" dominant-baseline="middle">${escapeXML(el.text)}</text>\n`;
      }
    }
  }

  // Sticky notes
  for (const el of board.elements) {
    if (el.type === 'sticky') {
      svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="4" fill="${el.color}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"/>\n`;
      if (el.title) {
        svgContent += `<text x="${el.x + 12}" y="${el.y + 22}" fill="#0F172A" font-size="14" font-weight="bold">${escapeXML(el.title)}</text>\n`;
      }
      if (el.content) {
        const lines = el.content.split('\n');
        let y = el.y + 44;
        for (const line of lines) {
          svgContent += `<text x="${el.x + 12}" y="${y}" fill="#334155" font-size="12">${escapeXML(line)}</text>\n`;
          y += 18;
        }
      }
    }
  }

  // Freehand strokes
  for (const el of board.elements) {
    if (el.type === 'stroke' && el.points.length > 0) {
      const d = el.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const opacity = el.tool === 'highlighter' ? (el.opacity || 0.45) : 1;
      svgContent += `<path d="${d}" fill="none" stroke="${el.color}" stroke-width="${el.width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>\n`;
    }
  }

  svgContent += `</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = board.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'whiteboard';
  a.download = `${safeTitle}-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(board: Board): void {
  const jsonStr = JSON.stringify(board, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = board.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'whiteboard';
  a.download = `${safeTitle}-backup-${Date.now()}.whiteboard.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(file: File): Promise<Board> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.id || !Array.isArray(parsed.elements)) {
          throw new Error('Invalid whiteboard file format');
        }
        resolve(parsed as Board);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
