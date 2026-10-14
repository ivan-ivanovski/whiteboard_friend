import React from 'react';
import {
  PenTool,
  StickyNote,
  CheckSquare,
  Ruler,
  Layers,
  X,
  Sparkles,
  Smartphone,
  ChevronDown,
} from 'lucide-react';
import { ToolType } from '../types/whiteboard';

interface WelcomeBannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (tool: ToolType) => void;
  onOpenTemplates: () => void;
  onToggleRuler: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  onOpenTemplates,
  onToggleRuler,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full max-w-xl px-4 pointer-events-none select-none">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-6 pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Добредојдовте во Whiteboard Studio
                </h2>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Stylus & PWA
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ваше лично бесконечно платно за скицирање, белешки и дијаграми.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Затвори (Close)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Launch Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => {
              onSelectAction('pen');
              onClose();
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition-all group"
          >
            <PenTool className="w-5 h-5 mb-1.5 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Пенкало</span>
            <span className="text-[10px] text-slate-400 font-mono">P</span>
          </button>

          <button
            onClick={() => {
              onSelectAction('sticky');
              onClose();
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-300 text-slate-700 hover:text-amber-700 transition-all group"
          >
            <StickyNote className="w-5 h-5 mb-1.5 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Ливче</span>
            <span className="text-[10px] text-slate-400 font-mono">S</span>
          </button>

          <button
            onClick={() => {
              onSelectAction('checklist');
              onClose();
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 transition-all group"
          >
            <CheckSquare className="w-5 h-5 mb-1.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Задачи</span>
            <span className="text-[10px] text-slate-400 font-mono">C</span>
          </button>

          <button
            onClick={() => {
              onToggleRuler();
              onClose();
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-orange-50/80 border border-slate-200/80 hover:border-orange-300 text-slate-700 hover:text-orange-700 transition-all group"
          >
            <Ruler className="w-5 h-5 mb-1.5 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Линијар</span>
            <span className="text-[10px] text-slate-400 font-mono">R</span>
          </button>
        </div>

        {/* Shortcuts & Tablet Guide */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Поддршка за таблет и дигитално пенкало:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span><strong>Пенкало / Stylus:</strong> Динамичен притисок и palm rejection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span><strong>2 прста:</strong> Слободно влечење и зумирање (Pinch)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span><strong>Кратенки:</strong> P Пенкало · M Маркер · E Гума</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span><strong>Историја:</strong> Ctrl+Z враќа чекор, Ctrl+Y повторува</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => {
              onOpenTemplates();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Отвори шаблони на табли →</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Започни со работа
          </button>
        </div>
      </div>
    </div>
  );
};
