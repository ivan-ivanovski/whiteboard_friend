import React, { useState } from 'react';
import { ChecklistElement, CardinalAnchor, Point } from '../types/whiteboard';
import { Check, Plus, Trash2, Copy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChecklistViewProps {
  element: ChecklistElement;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updated: ChecklistElement) => void;
  onDelete: (id: string) => void;
  onDuplicate: (element: ChecklistElement) => void;
  onStartConnector: (elementId: string, anchor: CardinalAnchor, startPoint: Point) => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onStartConnector,
}) => {
  const [newText, setNewText] = useState('');

  const toggleItem = (itemId: string) => {
    const nextItems = element.items.map((item) => {
      if (item.id === itemId) {
        const nextCompleted = !item.completed;
        if (nextCompleted) {
          // Trigger confetti burst on checking item
          try {
            confetti({
              particleCount: 25,
              spread: 45,
              origin: { y: 0.6 },
              colors: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'],
            });
          } catch {}
        }
        return { ...item, completed: nextCompleted };
      }
      return item;
    });
    onUpdate({ ...element, items: nextItems });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: newText.trim(),
      completed: false,
    };
    onUpdate({
      ...element,
      items: [...element.items, newItem],
    });
    setNewText('');
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdate({
      ...element,
      items: element.items.filter((i) => i.id !== itemId),
    });
  };

  const completedCount = element.items.filter((i) => i.completed).length;

  const anchors: { anchor: CardinalAnchor; style: React.CSSProperties }[] = [
    { anchor: 'top', style: { top: -6, left: '50%', transform: 'translateX(-50%)' } },
    { anchor: 'right', style: { right: -6, top: '50%', transform: 'translateY(-50%)' } },
    { anchor: 'bottom', style: { bottom: -6, left: '50%', transform: 'translateX(-50%)' } },
    { anchor: 'left', style: { left: -6, top: '50%', transform: 'translateY(-50%)' } },
  ];

  return (
    <div
      onClick={onSelect}
      className={`absolute group select-none transition-shadow rounded-xl p-4 flex flex-col cursor-move bg-white border border-slate-200/80 ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-xl'
          : 'shadow-md hover:shadow-lg'
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        backgroundColor: element.color || '#FFFFFF',
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
            const midX = anchor === 'left' ? element.x : anchor === 'right' ? element.x + element.width : element.x + element.width / 2;
            const midY = anchor === 'top' ? element.y : anchor === 'bottom' ? element.y + 160 : element.y + 80;
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

      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-black/5">
        <input
          type="text"
          value={element.title}
          onChange={(e) => onUpdate({ ...element, title: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Наслов на листа..."
          className="font-bold text-slate-900 text-sm bg-transparent focus:outline-none flex-1"
        />
        <span className="text-[11px] font-medium text-slate-500 tabular-nums">
          {completedCount}/{element.items.length}
        </span>
      </div>

      {/* Checklist items */}
      <div className="space-y-1.5 mb-3">
        {element.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 group/item py-0.5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => toggleItem(item.id)}
              className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                item.completed
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-slate-300 hover:border-slate-400 bg-white'
              }`}
            >
              {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
            <span
              className={`text-xs flex-1 transition-colors leading-tight ${
                item.completed
                  ? 'line-through text-slate-400'
                  : 'text-slate-800'
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => handleDeleteItem(item.id)}
              className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new task input */}
      <form onSubmit={handleAddItem} className="flex items-center gap-1.5 pt-1" onMouseDown={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="+ Додај задача..."
          className="flex-1 text-xs bg-black/5 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
        />
        {newText.trim() && (
          <button
            type="submit"
            className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </form>
    </div>
  );
};
