import React, { useState } from 'react';
import { ShapeElement, CardinalAnchor, Point } from '../types/whiteboard';
import { Trash2, Copy, Palette } from 'lucide-react';

interface ShapeViewProps {
  element: ShapeElement;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: ShapeElement) => void;
  onDelete: (id: string) => void;
  onDuplicate: (element: ShapeElement) => void;
  onStartConnector: (elementId: string, anchor: CardinalAnchor, startPoint: Point) => void;
}

const PRESET_FILLS = [
  { fill: '#FFFFFF', stroke: '#94A3B8', text: '#0F172A' },
  { fill: '#E0E7FF', stroke: '#4F46E5', text: '#312E81' },
  { fill: '#DCFCE7', stroke: '#16A34A', text: '#14532D' },
  { fill: '#FEF3C7', stroke: '#D97706', text: '#78350F' },
  { fill: '#FCE7F3', stroke: '#DB2777', text: '#831843' },
  { fill: '#F1F5F9', stroke: '#475569', text: '#0F172A' },
];

export const ShapeView: React.FC<ShapeViewProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onStartConnector,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = element.width;
    const startH = element.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dw = moveEvent.clientX - startX;
      const dh = moveEvent.clientY - startY;
      onUpdate({
        ...element,
        width: Math.max(60, startW + dw),
        height: Math.max(40, startH + dh),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const anchors: { anchor: CardinalAnchor; style: React.CSSProperties }[] = [
    { anchor: 'top', style: { top: -6, left: '50%', transform: 'translateX(-50%)' } },
    { anchor: 'right', style: { right: -6, top: '50%', transform: 'translateY(-50%)' } },
    { anchor: 'bottom', style: { bottom: -6, left: '50%', transform: 'translateX(-50%)' } },
    { anchor: 'left', style: { left: -6, top: '50%', transform: 'translateY(-50%)' } },
  ];

  const renderShapeSVG = () => {
    const w = element.width;
    const h = element.height;
    const strokeW = element.strokeWidth;

    switch (element.shapeKind) {
      case 'rounded-rect':
        return (
          <rect
            x={strokeW / 2}
            y={strokeW / 2}
            width={w - strokeW}
            height={h - strokeW}
            rx={10}
            fill={element.fillColor}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
          />
        );
      case 'circle':
        return (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={(w - strokeW) / 2}
            ry={(h - strokeW) / 2}
            fill={element.fillColor}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
          />
        );
      case 'diamond':
        return (
          <polygon
            points={`${w / 2},${strokeW / 2} ${w - strokeW / 2},${h / 2} ${w / 2},${h - strokeW / 2} ${strokeW / 2},${h / 2}`}
            fill={element.fillColor}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
          />
        );
      case 'cloud':
        return (
          <rect
            x={strokeW / 2}
            y={strokeW / 2}
            width={w - strokeW}
            height={h - strokeW}
            rx={20}
            fill={element.fillColor}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
            strokeDasharray="4 2"
          />
        );
      case 'rectangle':
      default:
        return (
          <rect
            x={strokeW / 2}
            y={strokeW / 2}
            width={w - strokeW}
            height={h - strokeW}
            fill={element.fillColor}
            stroke={element.strokeColor}
            strokeWidth={strokeW}
          />
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`absolute group select-none cursor-move ${
        isSelected ? 'ring-2 ring-indigo-500 rounded-lg' : ''
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
      }}
    >
      <svg className="w-full h-full overflow-visible pointer-events-none">
        {renderShapeSVG()}
      </svg>

      {/* Center Text Display / Input */}
      <div
        className="absolute inset-0 flex items-center justify-center p-2 text-center"
        onDoubleClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <textarea
            autoFocus
            value={element.text || ''}
            onChange={(e) => onUpdate({ ...element, text: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full h-full bg-transparent text-center font-semibold text-xs resize-none focus:outline-none"
            style={{ color: element.textColor || '#0F172A' }}
          />
        ) : (
          <span
            className="font-semibold text-xs leading-snug px-1 pointer-events-none break-words"
            style={{ color: element.textColor || '#0F172A' }}
          >
            {element.text || 'Двоен клик за текст'}
          </span>
        )}
      </div>

      {/* Anchor points */}
      {anchors.map(({ anchor, style }) => (
        <button
          key={anchor}
          aria-label={`Connect from ${anchor}`}
          style={style}
          className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 opacity-0 group-hover:opacity-100 hover:scale-125 transition-all shadow-sm z-20 cursor-crosshair"
          onMouseDown={(e) => {
            e.stopPropagation();
            const midX = anchor === 'left' ? element.x : anchor === 'right' ? element.x + element.width : element.x + element.width / 2;
            const midY = anchor === 'top' ? element.y : anchor === 'bottom' ? element.y + element.height : element.y + element.height / 2;
            onStartConnector(element.id, anchor, { x: midX, y: midY });
          }}
        />
      ))}

      {/* Floating Action Menu when Selected */}
      {isSelected && (
        <div
          className="absolute -top-11 left-0 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-md shadow-lg border border-slate-200 z-30"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <button
              onClick={() => setShowPalette(!showPalette)}
              title="Стил & Боја"
              className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {showPalette && (
              <div className="absolute top-8 left-0 flex gap-1 p-1.5 bg-white rounded-lg shadow-xl border border-slate-200 z-40">
                {PRESET_FILLS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onUpdate({
                        ...element,
                        fillColor: p.fill,
                        strokeColor: p.stroke,
                        textColor: p.text,
                      });
                      setShowPalette(false);
                    }}
                    className="w-5 h-5 rounded-md border-2 hover:scale-110 transition-transform"
                    style={{ backgroundColor: p.fill, borderColor: p.stroke }}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => onDuplicate(element)}
            title="Дуплирај (Duplicate Ctrl+D)"
            className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(element.id)}
            title="Избриши (Delete)"
            className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Resize Handle */}
      {isSelected && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-indigo-600 rounded-sm cursor-nwse-resize border-2 border-white shadow-sm z-30"
        />
      )}
    </div>
  );
};
