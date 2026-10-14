import React from 'react';
import {
  ToolType,
  ShapeKind,
} from '../types/whiteboard';
import {
  MousePointer2,
  Hand,
  PenTool,
  Highlighter,
  Eraser,
  Ruler,
  StickyNote,
  Square,
  ArrowRight,
  Type,
  CheckSquare,
  Circle,
  Diamond,
  Cloud,
} from 'lucide-react';

interface ToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  // Pen & Highlighter settings
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  highlighterColor: string;
  setHighlighterColor: (color: string) => void;
  highlighterWidth: number;
  setHighlighterWidth: (width: number) => void;
  // Shape settings
  activeShapeKind: ShapeKind;
  setActiveShapeKind: (kind: ShapeKind) => void;
  // Ruler
  rulerVisible: boolean;
  toggleRuler: () => void;
  // Sticky color
  stickyColor: string;
  setStickyColor: (color: string) => void;
}

const PEN_COLORS = [
  { name: 'Dark Slate', value: '#0F172A' },
  { name: 'Electric Indigo', value: '#4F46E5' },
  { name: 'Crimson Rose', value: '#E11D48' },
  { name: 'Emerald Green', value: '#059669' },
  { name: 'Golden Amber', value: '#D97706' },
  { name: 'Purple Orchid', value: '#9333EA' },
  { name: 'Pure White', value: '#FFFFFF' },
];

const HIGHLIGHTER_COLORS = [
  { name: 'Neon Yellow', value: '#FACC15' },
  { name: 'Fresh Mint', value: '#4ADE80' },
  { name: 'Sky Cyan', value: '#38BDF8' },
  { name: 'Soft Coral', value: '#FB923C' },
  { name: 'Pastel Pink', value: '#F472B6' },
];

const STICKY_COLORS = [
  { name: 'Yellow', value: '#FEF08A' },
  { name: 'Mint', value: '#BBF7D0' },
  { name: 'Lavender', value: '#E9D5FF' },
  { name: 'Coral', value: '#FED7AA' },
  { name: 'Sky', value: '#BAE6FD' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  highlighterColor,
  setHighlighterColor,
  highlighterWidth,
  setHighlighterWidth,
  activeShapeKind,
  setActiveShapeKind,
  rulerVisible,
  toggleRuler,
  stickyColor,
  setStickyColor,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-40 select-none">
      {/* Contextual Sub-bar for Pen / Highlighter / Shapes / Sticky */}
      {activeTool === 'pen' && (
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg border border-slate-200">
          <div className="flex items-center gap-1.5">
            {PEN_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setStrokeColor(c.value)}
                className={`w-5 h-5 rounded-full transition-transform border border-black/15 ${
                  strokeColor === c.value ? 'scale-125 ring-2 ring-indigo-500' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            {[2, 4, 8, 14].map((w) => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                className={`px-2 py-0.5 rounded text-xs font-semibold tabular-nums transition-colors ${
                  strokeWidth === w ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTool === 'highlighter' && (
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg border border-slate-200">
          <div className="flex items-center gap-1.5">
            {HIGHLIGHTER_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setHighlighterColor(c.value)}
                className={`w-5 h-5 rounded-full transition-transform border border-black/15 ${
                  highlighterColor === c.value ? 'scale-125 ring-2 ring-indigo-500' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            {[14, 22, 32].map((w) => (
              <button
                key={w}
                onClick={() => setHighlighterWidth(w)}
                className={`px-2 py-0.5 rounded text-xs font-semibold tabular-nums transition-colors ${
                  highlighterWidth === w ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTool === 'shape' && (
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-200">
          <button
            onClick={() => setActiveShapeKind('rectangle')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeShapeKind === 'rectangle' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Правоаголник"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveShapeKind('circle')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeShapeKind === 'circle' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Круг / Елипса"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveShapeKind('diamond')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeShapeKind === 'diamond' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Ромб (Одлука/Decision)"
          >
            <Diamond className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveShapeKind('cloud')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeShapeKind === 'cloud' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Облаче / Облак"
          >
            <Cloud className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTool === 'sticky' && (
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-200">
          {STICKY_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setStickyColor(c.value)}
              className={`w-5 h-5 rounded-full transition-transform border border-black/10 ${
                stickyColor === c.value ? 'scale-125 ring-2 ring-indigo-500' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      )}

      {/* Main Floating Tool Strip */}
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200">
        {/* Select */}
        <button
          onClick={() => setActiveTool('select')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'select'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Селекција (V)"
        >
          <MousePointer2 className="w-5 h-5" />
        </button>

        {/* Hand / Pan */}
        <button
          onClick={() => setActiveTool('hand')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'hand'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Поместување / Рака (H / Space)"
        >
          <Hand className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-0.5" />

        {/* Pen */}
        <button
          onClick={() => setActiveTool('pen')}
          className={`p-2 rounded-xl transition-all relative ${
            activeTool === 'pen'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Пенкало (P)"
        >
          <PenTool className="w-5 h-5" />
          <span
            className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: strokeColor }}
          />
        </button>

        {/* Highlighter */}
        <button
          onClick={() => setActiveTool('highlighter')}
          className={`p-2 rounded-xl transition-all relative ${
            activeTool === 'highlighter'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Маркер / Фломастер (M)"
        >
          <Highlighter className="w-5 h-5" />
          <span
            className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: highlighterColor }}
          />
        </button>

        {/* Eraser */}
        <button
          onClick={() => setActiveTool('eraser')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'eraser'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Гума за бришење (E)"
        >
          <Eraser className="w-5 h-5" />
        </button>

        {/* Ruler */}
        <button
          onClick={toggleRuler}
          className={`p-2 rounded-xl transition-all ${
            rulerVisible
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Виртуелен Линијар (R)"
        >
          <Ruler className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-0.5" />

        {/* Sticky Note */}
        <button
          onClick={() => setActiveTool('sticky')}
          className={`p-2 rounded-xl transition-all relative ${
            activeTool === 'sticky'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Лепливо ливче (S)"
        >
          <StickyNote className="w-5 h-5" />
          <span
            className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full border border-black/10"
            style={{ backgroundColor: stickyColor }}
          />
        </button>

        {/* Geometric Shape */}
        <button
          onClick={() => setActiveTool('shape')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'shape'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Геометриска форма (D)"
        >
          <Square className="w-5 h-5" />
        </button>

        {/* Connector / Arrow */}
        <button
          onClick={() => setActiveTool('connector')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'connector'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Стрелка / Поврзувач (A)"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Text */}
        <button
          onClick={() => setActiveTool('text')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'text'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Текст (T)"
        >
          <Type className="w-5 h-5" />
        </button>

        {/* Checklist */}
        <button
          onClick={() => setActiveTool('checklist')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'checklist'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Листа со задачи (C)"
        >
          <CheckSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
