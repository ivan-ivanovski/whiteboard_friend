import React from 'react';
import { Sparkles, PenTool, Eraser, Move } from 'lucide-react';

interface CanvasWatermarkProps {
  visible: boolean;
}

export const CanvasWatermark: React.FC<CanvasWatermarkProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none transition-opacity duration-700 ${
        visible ? 'opacity-85' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center text-center max-w-md px-6">
        {/* Brand Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-300/80 mb-2">
          Whiteboard Friend
        </h1>

        {/* Quiet Subtitle */}
        <p className="text-xs sm:text-sm font-medium text-slate-400/80 mb-5 max-w-sm">
          Ваше лично платно за слободно скицирање, белешки и дијаграми.
        </p>

        {/* Intuitive Gesture Hints */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400/70 font-medium">
          <div className="flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-indigo-400/80" />
            <span>Пенкало со притисок</span>
          </div>

          <span>·</span>

          <div className="flex items-center gap-1.5">
            <Eraser className="w-3.5 h-3.5 text-rose-400/80" />
            <span>Пречкртајте за бришење</span>
          </div>

          <span>·</span>

          <div className="flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-emerald-400/80" />
            <span>2 прста за поместување и зум</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400/50 mt-4">
          (Допрете или нацртајте потез за почеток)
        </p>
      </div>
    </div>
  );
};
