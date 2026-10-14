import React, { useState } from 'react';
import { StickyNoteElement, CardinalAnchor, Point } from '../types/whiteboard';
import { Trash2, Copy, Palette } from 'lucide-react';

interface StickyNoteViewProps {
  element: StickyNoteElement;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: StickyNoteElement) => void;
  onDelete: (id: string) => void;
  onDuplicate: (element: StickyNoteElement) => void;
  onStartConnector: (elementId: string, anchor: CardinalAnchor, startPoint: Point) => void;
  zoom: number;
}

const STICKY_COLORS = [
  { name: 'Yellow', value: '#FEF08A', border: '#FACC15' },
  { name: 'Mint', value: '#BBF7D0', border: '#86EFAC' },
  { name: 'Lavender', value: '#E9D5FF', border: '#D8B4FE' },
  { name: 'Coral', value: '#FED7AA', border: '#FDBA74' },
  { name: 'Sky', value: '#BAE6FD', border: '#7DD3FC' },
  { name: 'Slate', value: '#F1F5F9', border: '#E2E8F0' },
];

export const StickyNoteView: React.FC<StickyNoteViewProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onStartConnector,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...element, title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...element, content: e.target.value });
  };

  const handleColorSelect = (color: string) => {
    onUpdate({ ...element, color });
    setShowColorPicker(false);
  };

  const anchors: { anchor: CardinalAnchor; style: React.CSSProperties }[] = [
    { anchor: 'top', style: { top: -6, left: '50%', transform: 'translateX(-50%)' } },
    { anchor: 'right', style: { right: -6, top: '50%', transform: 'translateY(-50%)' } },
    { anchor: 'bottom', style: { bottom: -6, left: '50%', transform: 'translateX(-50%)' } },
    { anchor: 'left', style: { left: -6, top: '50%', transform: 'translateY(-50%)' } },
  ];

  return (
    <div
      onClick={onSelect}
      className={`absolute group select-none transition-shadow rounded-lg p-3 flex flex-col cursor-move ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-xl'
          : 'shadow-md hover:shadow-lg'
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        minHeight: element.height,
        backgroundColor: element.color,
        transform: `rotate(${element.rotation || 0}deg)`,
      }}
    >
      {/* Anchor points for drawing connectors */}
      {anchors.map(({ anchor, style }) => (
        <button
          key={anchor}
          aria-label={`Connect from ${anchor}`}
          style={style}
          className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 opacity-0 group-hover:opacity-100 hover:scale-125 transition-all shadow-sm z-20 cursor-crosshair"
          onMouseDown={(e) => {
            e.stopPropagation();
            const bbox = e.currentTarget.getBoundingClientRect();
            // Cardinal anchor world point
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
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Смени боја (Change Color)"
              className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {showColorPicker && (
              <div className="absolute top-8 left-0 flex gap-1 p-1.5 bg-white rounded-lg shadow-xl border border-slate-200 z-40">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleColorSelect(c.value)}
                    className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value }}
                    title={c.name}
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

      {/* Sticky Header */}
      <input
        type="text"
        value={element.title}
        onChange={handleTitleChange}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Наслов на белешка..."
        className="w-full bg-transparent font-bold text-slate-900 text-sm focus:outline-none placeholder:text-slate-500/60 mb-1"
      />

      {/* Sticky Body */}
      <textarea
        value={element.content}
        onChange={handleContentChange}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Запишете идеи, скици или белешки..."
        className="w-full flex-1 bg-transparent text-slate-800 text-xs leading-relaxed focus:outline-none resize-none placeholder:text-slate-500/50"
        rows={6}
      />
    </div>
  );
};
