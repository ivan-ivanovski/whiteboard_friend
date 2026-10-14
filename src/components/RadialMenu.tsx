import React, { useEffect, useRef } from 'react';
import {
  Undo2,
  Redo2,
  PenTool,
  Highlighter,
  Eraser,
  StickyNote,
  CheckSquare,
  X,
} from 'lucide-react';
import { ToolType } from '../types/whiteboard';

interface RadialMenuProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onSelectColor: (color: string) => void;
  onAddStickyAtPoint: () => void;
  onAddChecklistAtPoint: () => void;
}

const QUICK_COLORS = [
  '#0F172A', // Dark Slate
  '#4F46E5', // Indigo
  '#E11D48', // Crimson
  '#059669', // Emerald
  '#D97706', // Amber
];

export const RadialMenu: React.FC<RadialMenuProps> = ({
  isOpen,
  position,
  onClose,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  activeTool,
  onSelectTool,
  onSelectColor,
  onAddStickyAtPoint,
  onAddChecklistAtPoint,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('pointerdown', handleClickOutside);
    }
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 select-none animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative flex flex-col items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-3 min-w-[210px]">
        {/* Top Header */}
        <div className="flex items-center justify-between w-full pb-2 mb-2 border-b border-slate-100">
          <span className="text-[11px] font-bold text-slate-700 tracking-wide uppercase">
            Брзо мени (Pen Menu)
          </span>
          <button
            onClick={onClose}
            className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary Row: Undo, Redo, Tools */}
        <div className="flex items-center justify-center gap-1.5 w-full mb-2.5">
          <button
            onClick={() => {
              onUndo();
              onClose();
            }}
            disabled={!canUndo}
            className={`p-2 rounded-xl transition-colors ${
              canUndo
                ? 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Врати назад (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              onRedo();
              onClose();
            }}
            disabled={!canRedo}
            className={`p-2 rounded-xl transition-colors ${
              canRedo
                ? 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Повтори (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <button
            onClick={() => {
              onSelectTool('pen');
              onClose();
            }}
            className={`p-2 rounded-xl transition-colors ${
              activeTool === 'pen'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
            }`}
            title="Пенкало"
          >
            <PenTool className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              onSelectTool('highlighter');
              onClose();
            }}
            className={`p-2 rounded-xl transition-colors ${
              activeTool === 'highlighter'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
            }`}
            title="Маркер"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              onSelectTool('eraser');
              onClose();
            }}
            className={`p-2 rounded-xl transition-colors ${
              activeTool === 'eraser'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700'
            }`}
            title="Гума"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Row: Quick Colors */}
        <div className="flex items-center justify-center gap-2 w-full py-1.5 px-2 bg-slate-50 rounded-xl mb-2.5">
          {QUICK_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                onSelectColor(c);
                onSelectTool('pen');
                onClose();
              }}
              className="w-5 h-5 rounded-full border border-black/15 hover:scale-125 transition-transform"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Quick Add Elements at Tap Point */}
        <div className="grid grid-cols-2 gap-1.5 w-full">
          <button
            onClick={() => {
              onAddStickyAtPoint();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors border border-amber-200/60"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Ливче</span>
          </button>

          <button
            onClick={() => {
              onAddChecklistAtPoint();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors border border-emerald-200/60"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Задачи</span>
          </button>
        </div>
      </div>
    </div>
  );
};
