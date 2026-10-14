import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Board,
  BoardElement,
  RulerState,
  ShapeKind,
  ToolType,
  Viewport,
} from './types/whiteboard';
import {
  loadAllBoards,
  saveAllBoards,
  getActiveBoardId,
  setActiveBoardId,
  createNewBoard,
} from './utils/storage';
import { calculateBoardBounds } from './utils/exportUtils';
import { TopNav } from './components/TopNav';
import { Toolbar } from './components/Toolbar';
import { WhiteboardCanvas } from './components/WhiteboardCanvas';
import { BoardModal } from './components/BoardModal';
import { ExportModal } from './components/ExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';

export default function App() {
  const [boards, setBoards] = useState<Board[]>(() => loadAllBoards());
  const [activeBoardId, setActiveId] = useState<string>(() => {
    const saved = getActiveBoardId();
    const all = loadAllBoards();
    return all.find((b) => b.id === saved) ? saved : (all[0]?.id || 'default-board');
  });

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0] || createNewBoard();

  // Undo / Redo History Stack for current board
  const [history, setHistory] = useState<BoardElement[][]>([activeBoard.elements]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Tools state
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [strokeColor, setStrokeColor] = useState('#0F172A');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [highlighterColor, setHighlighterColor] = useState('#FACC15');
  const [highlighterWidth, setHighlighterWidth] = useState(20);
  const [activeShapeKind, setActiveShapeKind] = useState<ShapeKind>('rounded-rect');
  const [stickyColor, setStickyColor] = useState('#FEF08A');

  // Virtual Ruler
  const [ruler, setRuler] = useState<RulerState>({
    visible: false,
    x: 450,
    y: 350,
    angle: 0,
    length: 320,
  });

  // Modals
  const [isBoardManagerOpen, setIsBoardManagerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    saveAllBoards(boards);
    setActiveBoardId(activeBoardId);
  }, [boards, activeBoardId]);

  // When active board changes, reset history stack
  const handleSelectBoard = (id: string) => {
    setActiveId(id);
    const target = boards.find((b) => b.id === id);
    if (target) {
      setHistory([target.elements]);
      setHistoryIndex(0);
    }
  };

  // Update elements on active board
  const handleUpdateElements = (nextElements: BoardElement[], recordHistory: boolean = true) => {
    // Update board in state
    setBoards((prevBoards) =>
      prevBoards.map((b) =>
        b.id === activeBoardId
          ? { ...b, elements: nextElements, updatedAt: Date.now() }
          : b
      )
    );

    if (recordHistory) {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(nextElements);
      // Keep max 40 steps
      if (nextHistory.length > 40) nextHistory.shift();
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    }
  };

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevElements = history[prevIndex];
      setHistoryIndex(prevIndex);
      setBoards((prevBoards) =>
        prevBoards.map((b) =>
          b.id === activeBoardId
            ? { ...b, elements: prevElements, updatedAt: Date.now() }
            : b
        )
      );
    }
  }, [historyIndex, history, activeBoardId]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextElements = history[nextIndex];
      setHistoryIndex(nextIndex);
      setBoards((prevBoards) =>
        prevBoards.map((b) =>
          b.id === activeBoardId
            ? { ...b, elements: nextElements, updatedAt: Date.now() }
            : b
        )
      );
    }
  }, [historyIndex, history, activeBoardId]);

  // Viewport navigation
  const handleUpdateViewport = (vp: Viewport) => {
    setBoards((prevBoards) =>
      prevBoards.map((b) =>
        b.id === activeBoardId ? { ...b, viewport: vp } : b
      )
    );
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(4, activeBoard.viewport.zoom * 1.2);
    handleUpdateViewport({ ...activeBoard.viewport, zoom: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.15, activeBoard.viewport.zoom / 1.2);
    handleUpdateViewport({ ...activeBoard.viewport, zoom: newZoom });
  };

  const handleResetZoom = () => {
    handleUpdateViewport({ ...activeBoard.viewport, zoom: 1 });
  };

  const handleFitContent = () => {
    if (activeBoard.elements.length === 0) {
      handleUpdateViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const bounds = calculateBoardBounds(activeBoard.elements);
    const contentW = bounds.maxX - bounds.minX;
    const contentH = bounds.maxY - bounds.minY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight - 60; // minus topbar

    const zoom = Math.min(1.5, Math.max(0.3, Math.min(screenW / (contentW + 120), screenH / (contentH + 120))));
    const centerX = screenW / 2 / zoom - (bounds.minX + contentW / 2);
    const centerY = screenH / 2 / zoom - (bounds.minY + contentH / 2);

    handleUpdateViewport({ x: centerX, y: centerY, zoom });
  };

  const handleToggleGrid = () => {
    const types: Board['gridType'][] = ['dots', 'grid', 'none'];
    const nextIdx = (types.indexOf(activeBoard.gridType) + 1) % types.length;
    const nextType = types[nextIdx];
    setBoards((prev) =>
      prev.map((b) => (b.id === activeBoardId ? { ...b, gridType: nextType } : b))
    );
  };

  const handleCreateBoard = (newB: Board) => {
    setBoards((prev) => [newB, ...prev]);
    setActiveId(newB.id);
    setHistory([newB.elements]);
    setHistoryIndex(0);
  };

  const handleUpdateBoardMeta = (updated: Board) => {
    setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleDeleteBoard = (id: string) => {
    const remaining = boards.filter((b) => b.id !== id);
    if (remaining.length > 0) {
      setBoards(remaining);
      setActiveId(remaining[0].id);
      setHistory([remaining[0].elements]);
      setHistoryIndex(0);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Tool shortcuts
      const k = e.key.toLowerCase();
      if (k === 'v') setActiveTool('select');
      else if (k === 'h') setActiveTool('hand');
      else if (k === 'p') setActiveTool('pen');
      else if (k === 'm') setActiveTool('highlighter');
      else if (k === 'e') setActiveTool('eraser');
      else if (k === 'r') setRuler((prev) => ({ ...prev, visible: !prev.visible }));
      else if (k === 's') setActiveTool('sticky');
      else if (k === 'd') setActiveTool('shape');
      else if (k === 'a') setActiveTool('connector');
      else if (k === 't') setActiveTool('text');
      else if (k === 'c') setActiveTool('checklist');
      else if (e.key === 'Escape') setActiveTool('select');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 select-none">
      {/* 1. Top Navigation Bar */}
      <TopNav
        board={activeBoard}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        viewport={activeBoard.viewport}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitContent={handleFitContent}
        onToggleGrid={handleToggleGrid}
        onOpenBoardManager={() => setIsBoardManagerOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onNewBoard={() => setIsBoardManagerOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* 2. Layered Infinite Whiteboard Canvas Engine with Gestures & Watermark */}
      <WhiteboardCanvas
        board={activeBoard}
        onUpdateElements={handleUpdateElements}
        viewport={activeBoard.viewport}
        onUpdateViewport={handleUpdateViewport}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        strokeWidth={strokeWidth}
        highlighterColor={highlighterColor}
        highlighterWidth={highlighterWidth}
        activeShapeKind={activeShapeKind}
        stickyColor={stickyColor}
        ruler={ruler}
        onUpdateRuler={setRuler}
        onCloseRuler={() => setRuler((prev) => ({ ...prev, visible: false }))}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* 3. Ergonomic Floating Toolbar */}
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        highlighterColor={highlighterColor}
        setHighlighterColor={setHighlighterColor}
        highlighterWidth={highlighterWidth}
        setHighlighterWidth={setHighlighterWidth}
        activeShapeKind={activeShapeKind}
        setActiveShapeKind={setActiveShapeKind}
        rulerVisible={ruler.visible}
        toggleRuler={() => setRuler((prev) => ({ ...prev, visible: !prev.visible }))}
        stickyColor={stickyColor}
        setStickyColor={setStickyColor}
      />

      {/* 4. Board Switcher & Templates Modal */}
      <BoardModal
        isOpen={isBoardManagerOpen}
        onClose={() => setIsBoardManagerOpen(false)}
        boards={boards}
        activeBoardId={activeBoardId}
        onSelectBoard={handleSelectBoard}
        onCreateBoard={handleCreateBoard}
        onUpdateBoard={handleUpdateBoardMeta}
        onDeleteBoard={handleDeleteBoard}
      />

      {/* 5. Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        board={activeBoard}
      />

      {/* 6. Shortcuts Cheatsheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
