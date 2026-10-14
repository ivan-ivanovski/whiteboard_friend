import React from 'react';
import { Board, Viewport } from '../types/whiteboard';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  FolderOpen,
  Plus,
  Grid,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface TopNavProps {
  board: Board;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  viewport: Viewport;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitContent: () => void;
  onToggleGrid: () => void;
  onOpenBoardManager: () => void;
  onOpenExportModal: () => void;
  onNewBoard: () => void;
  onOpenShortcuts: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  board,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  viewport,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitContent,
  onToggleGrid,
  onOpenBoardManager,
  onOpenExportModal,
  onNewBoard,
  onOpenShortcuts,
}) => {
  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between gap-8 z-40 select-none">
      {/* Zone 1: Brand Wordmark and Active Board Selector */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
            W
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Whiteboard Studio
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <button
          onClick={onOpenBoardManager}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors max-w-[220px] truncate"
          title="Отвори менаџер на табли (Switch Board)"
        >
          <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">{board.title}</span>
        </button>
      </div>

      {/* Zone 2: Canvas Navigation, Undo/Redo, Zoom, Grid */}
      <nav className="flex items-center gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md transition-colors ${
              canUndo ? 'text-slate-700 hover:bg-white hover:shadow-xs' : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Врати назад (Undo Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md transition-colors ${
              canRedo ? 'text-slate-700 hover:bg-white hover:shadow-xs' : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Повтори (Redo Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={onZoomOut}
            className="p-1.5 text-slate-700 hover:bg-white hover:shadow-xs rounded-md transition-colors"
            title="Одзумирај (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-xs rounded-md transition-colors tabular-nums min-w-[48px] text-center"
            title="Ресетирај зум на 100%"
          >
            {zoomPercent}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-slate-700 hover:bg-white hover:shadow-xs rounded-md transition-colors"
            title="Зумирај (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fit to content */}
        <button
          onClick={onFitContent}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Прикажи сè (Fit to Screen)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Grid toggle */}
        <button
          onClick={onToggleGrid}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            board.gridType !== 'none'
              ? 'bg-slate-100 text-slate-800'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="Смени мрежа (Dots / Grid / None)"
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="capitalize">{board.gridType}</span>
        </button>
      </nav>

      {/* Zone 3: Primary Actions (Export, New Board, Help) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenShortcuts}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Кратенки на тастатура (Shortcuts)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onNewBoard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
          title="Креирај нова табла"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Нова табла</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
          title="Експортирај слика или бекап"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Експорт</span>
        </button>
      </div>
    </header>
  );
};
