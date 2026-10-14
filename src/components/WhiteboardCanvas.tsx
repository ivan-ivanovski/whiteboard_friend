import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Board,
  BoardElement,
  CardinalAnchor,
  ConnectorElement,
  FreehandStrokeElement,
  Point,
  RulerState,
  ShapeKind,
  ToolType,
  Viewport,
} from '../types/whiteboard';
import { renderBackgroundGrid, renderAllStrokes, drawSmoothedStroke } from '../utils/canvasRenderer';
import { snapToRuler, hitTestStroke, getElementAnchorPoints, getElementBoundingBox } from '../utils/geometry';
import {
  isScribbleGesture,
  findElementsUnderScribble,
  detectHoldToSnap,
} from '../utils/gestureDetection';
import { StickyNoteView } from './StickyNoteView';
import { ChecklistView } from './ChecklistView';
import { ShapeView } from './ShapeView';
import { RulerOverlay } from './RulerOverlay';
import { RadialMenu } from './RadialMenu';
import { CanvasWatermark } from './CanvasWatermark';

interface WhiteboardCanvasProps {
  board: Board;
  onUpdateElements: (elements: BoardElement[], recordHistory?: boolean) => void;
  viewport: Viewport;
  onUpdateViewport: (vp: Viewport) => void;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  highlighterColor: string;
  highlighterWidth: number;
  activeShapeKind: ShapeKind;
  stickyColor: string;
  ruler: RulerState;
  onUpdateRuler: (ruler: RulerState) => void;
  onCloseRuler: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  board,
  onUpdateElements,
  viewport,
  onUpdateViewport,
  activeTool,
  setActiveTool,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  highlighterColor,
  highlighterWidth,
  activeShapeKind,
  stickyColor,
  ruler,
  onUpdateRuler,
  onCloseRuler,
  canUndo = false,
  canRedo = false,
  onUndo = () => {},
  onRedo = () => {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const strokesCanvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Canvas interaction status (to dissolve watermark intro text)
  const [hasInteracted, setHasInteracted] = useState(false);

  // Scratch-to-erase notification toast
  const [eraseNotification, setEraseNotification] = useState<string | null>(null);

  // Active inking stroke
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<FreehandStrokeElement | null>(null);

  // Hold-to-snap timer & state
  const holdTimerRef = useRef<any>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const [isSnappedShape, setIsSnappedShape] = useState(false);

  // Radial Menu (Double tap with pen/pointer)
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const [radialMenu, setRadialMenu] = useState<{
    screenPos: { x: number; y: number };
    worldPos: Point;
  } | null>(null);

  // Canvas Panning state
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Stylus Palm Rejection & Multi-touch Gesture tracking
  const activePointersRef = useRef<Map<number, { x: number; y: number; pointerType: string }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(1);
  const isStylusActiveRef = useRef<boolean>(false);

  // Connector drawing state
  const [activeConnectorPreview, setActiveConnectorPreview] = useState<{
    fromId?: string;
    fromAnchor?: CardinalAnchor;
    fromPoint: Point;
    currentPoint: Point;
  } | null>(null);

  // Element dragging state
  const isDraggingElementRef = useRef(false);
  const dragStartMouseRef = useRef<Point>({ x: 0, y: 0 });
  const dragStartElementPosRef = useRef<Point>({ x: 0, y: 0 });

  // Convert screen coordinates to canvas world coordinates
  const screenToWorld = useCallback((clientX: number, clientY: number): Point => {
    if (!containerRef.current) return { x: clientX, y: clientY };
    const rect = containerRef.current.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      x: (sx - viewport.x * viewport.zoom) / viewport.zoom,
      y: (sy - viewport.y * viewport.zoom) / viewport.zoom,
    };
  }, [viewport]);

  // Resize canvas according to window dimensions
  const resizeCanvases = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    [gridCanvasRef.current, strokesCanvasRef.current].forEach((canvas) => {
      if (canvas) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.resetTransform?.();
          ctx.scale(dpr, dpr);
        }
      }
    });

    renderBackground();
    renderStrokes();
  }, [viewport, board.gridType]);

  const renderBackground = useCallback(() => {
    if (!gridCanvasRef.current || !containerRef.current) return;
    const ctx = gridCanvasRef.current.getContext('2d');
    if (!ctx) return;
    renderBackgroundGrid(
      ctx,
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
      viewport,
      board.gridType,
      false
    );
  }, [viewport, board.gridType]);

  const renderStrokes = useCallback(() => {
    if (!strokesCanvasRef.current || !containerRef.current) return;
    const ctx = strokesCanvasRef.current.getContext('2d');
    if (!ctx) return;
    const strokeElements = board.elements.filter(
      (el): el is FreehandStrokeElement => el.type === 'stroke'
    );
    renderAllStrokes(
      ctx,
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
      strokeElements,
      viewport
    );
  }, [board.elements, viewport]);

  useEffect(() => {
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    return () => window.removeEventListener('resize', resizeCanvases);
  }, [resizeCanvases]);

  useEffect(() => {
    renderBackground();
  }, [renderBackground]);

  useEffect(() => {
    renderStrokes();
  }, [renderStrokes]);

  // Track spacebar for pan tool toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    setHasInteracted(true);
    const zoomFactor = 1.1;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newZoom = e.deltaY < 0 
      ? Math.min(4, viewport.zoom * zoomFactor)
      : Math.max(0.15, viewport.zoom / zoomFactor);

    // Zoom centered on cursor
    const newX = mouseX / newZoom - (mouseX / viewport.zoom - viewport.x);
    const newY = mouseY / newZoom - (mouseY / viewport.zoom - viewport.y);

    onUpdateViewport({
      x: newX,
      y: newY,
      zoom: newZoom,
    });
  };

  // Start connector dragging from an element anchor
  const handleStartConnector = (elementId: string, anchor: CardinalAnchor, startPoint: Point) => {
    setActiveConnectorPreview({
      fromId: elementId,
      fromAnchor: anchor,
      fromPoint: startPoint,
      currentPoint: startPoint,
    });
  };

  // Update a single element in the board
  const handleUpdateElement = (updated: BoardElement, recordHistory: boolean = true) => {
    const nextElements = board.elements.map((el) => (el.id === updated.id ? updated : el));
    onUpdateElements(nextElements, recordHistory);
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    const nextElements = board.elements.filter((el) => {
      if (el.id === id) return false;
      if (el.type === 'connector' && (el.fromId === id || el.toId === id)) return false;
      return true;
    });
    onUpdateElements(nextElements, true);
    if (selectedId === id) setSelectedId(null);
  };

  // Duplicate element
  const handleDuplicateElement = (element: BoardElement) => {
    const offset = 30;
    const now = Date.now();
    let duplicated: BoardElement;

    if (element.type === 'sticky') {
      duplicated = {
        ...element,
        id: `sticky-${now}-${Math.random().toString(36).substring(2, 5)}`,
        x: element.x + offset,
        y: element.y + offset,
      };
    } else if (element.type === 'shape') {
      duplicated = {
        ...element,
        id: `shape-${now}-${Math.random().toString(36).substring(2, 5)}`,
        x: element.x + offset,
        y: element.y + offset,
      };
    } else if (element.type === 'checklist') {
      duplicated = {
        ...element,
        id: `cl-${now}-${Math.random().toString(36).substring(2, 5)}`,
        x: element.x + offset,
        y: element.y + offset,
      };
    } else if (element.type === 'text') {
      duplicated = {
        ...element,
        id: `text-${now}-${Math.random().toString(36).substring(2, 5)}`,
        x: element.x + offset,
        y: element.y + offset,
      };
    } else {
      return;
    }

    onUpdateElements([...board.elements, duplicated], true);
    setSelectedId(duplicated.id);
  };

  // Erase strokes hit-tested with point
  const eraseAtPoint = (worldPt: Point) => {
    let erasedAny = false;
    const nextElements = board.elements.filter((el) => {
      if (el.type === 'stroke') {
        const hit = hitTestStroke(el, worldPt, 14);
        if (hit) {
          erasedAny = true;
          return false;
        }
      }
      return true;
    });

    if (erasedAny) {
      onUpdateElements(nextElements, true);
    }
  };

  // POINTER DOWN: Universal support for Stylus, Touch, Mouse
  const handlePointerDown = (e: React.PointerEvent) => {
    // Fade watermark out on first touch/interaction
    setHasInteracted(true);

    // Palm Rejection: If stylus is active, ignore accidental finger/palm touch events
    if (isStylusActiveRef.current && e.pointerType === 'touch') {
      return;
    }

    activePointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      pointerType: e.pointerType,
    });

    if (e.pointerType === 'pen') {
      isStylusActiveRef.current = true;
    }

    // MULTI-TOUCH GESTURE: 2 fingers on tablet -> Start Pinch Zoom & Two-Finger Pan!
    if (activePointersRef.current.size === 2) {
      isDrawingRef.current = false;
      currentStrokeRef.current = null;
      isPanningRef.current = false;

      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDistRef.current = dist;
      initialPinchZoomRef.current = viewport.zoom;
      panStartRef.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      return;
    }

    // DOUBLE-TAP DETECTION for Radial Pen Menu
    const now = Date.now();
    const worldPt = screenToWorld(e.clientX, e.clientY);

    if (lastTapRef.current && (now - lastTapRef.current.time < 320)) {
      const tapDist = Math.hypot(e.clientX - lastTapRef.current.x, e.clientY - lastTapRef.current.y);
      if (tapDist < 25) {
        // Double-tap confirmed! Open radial menu at tap point
        lastTapRef.current = null;
        isDrawingRef.current = false;
        currentStrokeRef.current = null;
        setRadialMenu({
          screenPos: { x: e.clientX, y: e.clientY },
          worldPos: worldPt,
        });
        return;
      }
    }
    lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };

    // Capture pointer
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}

    // Middle click or space key: pan
    if (e.button === 1 || spacePressed || activeTool === 'hand') {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Auto Inking on Tablet Pen
    const isStylusPen = e.pointerType === 'pen';
    const effectiveTool: ToolType = isStylusPen && activeTool === 'select'
      ? 'pen'
      : activeTool;

    // INKING (Pen / Highlighter)
    if (effectiveTool === 'pen' || effectiveTool === 'highlighter') {
      isDrawingRef.current = true;
      setIsSnappedShape(false);

      const snapped = snapToRuler(worldPt, ruler);
      const startPt = snapped.point;
      const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
      startPt.pressure = pressure;

      const newStroke: FreehandStrokeElement = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'stroke',
        tool: effectiveTool,
        color: effectiveTool === 'pen' ? strokeColor : highlighterColor,
        width: effectiveTool === 'pen' ? strokeWidth : highlighterWidth,
        opacity: effectiveTool === 'pen' ? 1 : 0.45,
        points: [startPt],
      };

      currentStrokeRef.current = newStroke;
      lastMoveTimeRef.current = Date.now();

      // Clear any previous hold timer
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      return;
    }

    // ERASER
    if (effectiveTool === 'eraser') {
      eraseAtPoint(worldPt);
      return;
    }

    // STICKY NOTE: Place at click
    if (effectiveTool === 'sticky') {
      const newSticky: BoardElement = {
        id: `sticky-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'sticky',
        x: Math.round(worldPt.x - 110),
        y: Math.round(worldPt.y - 100),
        width: 220,
        height: 190,
        color: stickyColor,
        title: 'Нова белешка',
        content: '',
        rotation: 0,
      };
      onUpdateElements([...board.elements, newSticky], true);
      setSelectedId(newSticky.id);
      setActiveTool('select');
      return;
    }

    // SHAPE: Place at click
    if (effectiveTool === 'shape') {
      const newShape: BoardElement = {
        id: `shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'shape',
        shapeKind: activeShapeKind,
        x: Math.round(worldPt.x - 80),
        y: Math.round(worldPt.y - 40),
        width: 160,
        height: 80,
        fillColor: '#FFFFFF',
        strokeColor: '#4F46E5',
        strokeWidth: 2,
        text: 'Нова форма',
        textColor: '#0F172A',
      };
      onUpdateElements([...board.elements, newShape], true);
      setSelectedId(newShape.id);
      setActiveTool('select');
      return;
    }

    // CHECKLIST: Place at click
    if (effectiveTool === 'checklist') {
      const newChecklist: BoardElement = {
        id: `checklist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'checklist',
        x: Math.round(worldPt.x - 130),
        y: Math.round(worldPt.y - 80),
        width: 260,
        title: '📋 Нова листа со задачи',
        color: '#FFFFFF',
        items: [
          { id: `item-1`, text: 'Прва задача', completed: false },
          { id: `item-2`, text: 'Втора задача', completed: false },
        ],
      };
      onUpdateElements([...board.elements, newChecklist], true);
      setSelectedId(newChecklist.id);
      setActiveTool('select');
      return;
    }

    // TEXT: Place at click
    if (effectiveTool === 'text') {
      const newText: BoardElement = {
        id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'text',
        x: Math.round(worldPt.x),
        y: Math.round(worldPt.y),
        width: 240,
        height: 36,
        text: 'Кликнете за текст',
        fontSize: 18,
        color: '#0F172A',
        bold: true,
      };
      onUpdateElements([...board.elements, newText], true);
      setSelectedId(newText.id);
      setActiveTool('select');
      return;
    }

    // CONNECTOR
    if (effectiveTool === 'connector') {
      setActiveConnectorPreview({
        fromPoint: worldPt,
        currentPoint: worldPt,
      });
      return;
    }

    // Deselect if clicking blank canvas with SELECT
    setSelectedId(null);
    setSelectedIds([]);
  };

  // POINTER MOVE: Universal support
  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        pointerType: e.pointerType,
      });
    }

    // MULTI-TOUCH GESTURE: Two fingers pinch zoom & pan
    if (activePointersRef.current.size === 2 && initialPinchDistRef.current !== null && containerRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const currentCenter = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };

      const scale = currentDist / initialPinchDistRef.current;
      const targetZoom = Math.min(4, Math.max(0.15, initialPinchZoomRef.current * scale));

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = currentCenter.x - rect.left;
      const mouseY = currentCenter.y - rect.top;

      const dx = (currentCenter.x - panStartRef.current.x) / viewport.zoom;
      const dy = (currentCenter.y - panStartRef.current.y) / viewport.zoom;

      const newX = mouseX / targetZoom - (mouseX / viewport.zoom - (viewport.x + dx));
      const newY = mouseY / targetZoom - (mouseY / viewport.zoom - (viewport.y + dy));

      onUpdateViewport({
        x: newX,
        y: newY,
        zoom: targetZoom,
      });

      panStartRef.current = currentCenter;
      return;
    }

    // 1. Panning canvas
    if (isPanningRef.current) {
      const dx = (e.clientX - panStartRef.current.x) / viewport.zoom;
      const dy = (e.clientY - panStartRef.current.y) / viewport.zoom;
      onUpdateViewport({
        ...viewport,
        x: viewport.x + dx,
        y: viewport.y + dy,
      });
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const worldPt = screenToWorld(e.clientX, e.clientY);

    // 2. Freehand inking with Stylus Pressure and Hold-to-Snap
    if (isDrawingRef.current && currentStrokeRef.current) {
      const snapped = snapToRuler(worldPt, ruler);
      const pt = snapped.point;
      pt.pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;

      currentStrokeRef.current.points.push(pt);

      // Render live stroke onto strokes canvas
      if (strokesCanvasRef.current) {
        const ctx = strokesCanvasRef.current.getContext('2d');
        if (ctx) {
          drawSmoothedStroke(ctx, currentStrokeRef.current, viewport);
        }
      }

      // HOLD-TO-SNAP: If pointer pauses near same point for 400ms, snap line or circle!
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        if (isDrawingRef.current && currentStrokeRef.current && !isSnappedShape) {
          const snapResult = detectHoldToSnap(currentStrokeRef.current.points);
          if (snapResult) {
            currentStrokeRef.current.points = snapResult.snappedPoints;
            setIsSnappedShape(true);
            try {
              navigator.vibrate?.(25);
            } catch {}
            // Live re-render
            renderStrokes();
            if (strokesCanvasRef.current) {
              const ctx = strokesCanvasRef.current.getContext('2d');
              if (ctx) {
                drawSmoothedStroke(ctx, currentStrokeRef.current, viewport);
              }
            }
          }
        }
      }, 420);

      return;
    }

    // 3. Eraser dragging
    if (activeTool === 'eraser' && (e.buttons === 1 || e.pressure > 0)) {
      eraseAtPoint(worldPt);
      return;
    }

    // 4. Connector preview tracking
    if (activeConnectorPreview) {
      setActiveConnectorPreview({
        ...activeConnectorPreview,
        currentPoint: worldPt,
      });
      return;
    }

    // 5. Dragging an element on the canvas
    if (isDraggingElementRef.current && selectedId) {
      const dx = (e.clientX - dragStartMouseRef.current.x) / viewport.zoom;
      const dy = (e.clientY - dragStartMouseRef.current.y) / viewport.zoom;

      const targetEl = board.elements.find((el) => el.id === selectedId);
      if (targetEl && (targetEl.type === 'sticky' || targetEl.type === 'shape' || targetEl.type === 'checklist' || targetEl.type === 'text')) {
        const nextX = Math.round(dragStartElementPosRef.current.x + dx);
        const nextY = Math.round(dragStartElementPosRef.current.y + dy);

        const nextElements = board.elements.map((el) => {
          if (el.id === selectedId) {
            return { ...el, x: nextX, y: nextY };
          }
          if (el.type === 'connector') {
            let updatedConn = { ...el };
            if (el.fromId === selectedId) {
              const anchors = getElementAnchorPoints({ ...targetEl, x: nextX, y: nextY });
              const matched = anchors.find((a) => a.anchor === el.fromAnchor);
              if (matched) updatedConn.fromPoint = matched.point;
            }
            if (el.toId === selectedId) {
              const anchors = getElementAnchorPoints({ ...targetEl, x: nextX, y: nextY });
              const matched = anchors.find((a) => a.anchor === el.toAnchor);
              if (matched) updatedConn.toPoint = matched.point;
            }
            return updatedConn;
          }
          return el;
        });

        onUpdateElements(nextElements, false);
      }
    }
  };

  // POINTER UP / CANCEL: Universal finish with SCRATCH-TO-ERASE detection
  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);

    if (e.pointerType === 'pen') {
      isStylusActiveRef.current = false;
    }

    if (activePointersRef.current.size < 2) {
      initialPinchDistRef.current = null;
    }

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    isPanningRef.current = false;

    // Finish inking
    if (isDrawingRef.current && currentStrokeRef.current) {
      isDrawingRef.current = false;
      const finishedStroke = currentStrokeRef.current;
      currentStrokeRef.current = null;

      // SCRATCH-TO-ERASE (Scribble-Out) GESTURE RECOGNITION!
      // If user drew a fast zig-zag scribble over something, erase the elements underneath!
      const scribbleCheck = isScribbleGesture(finishedStroke.points);

      if (scribbleCheck.isScribble) {
        const targetIds = findElementsUnderScribble(scribbleCheck.bbox, board.elements);

        if (targetIds.length > 0) {
          // Erase matched elements and DISCARD the scribble stroke itself!
          const nextElements = board.elements.filter((el) => {
            if (targetIds.includes(el.id)) return false;
            if (el.type === 'connector' && (targetIds.includes(el.fromId || '') || targetIds.includes(el.toId || ''))) return false;
            return true;
          });

          onUpdateElements(nextElements, true);

          // Visual feedback
          setEraseNotification('✨ Пречкртано и избришано');
          try {
            navigator.vibrate?.([30, 40, 30]);
          } catch {}
          setTimeout(() => setEraseNotification(null), 1800);

          renderStrokes();
          return;
        }
      }

      // Normal stroke finished
      if (finishedStroke.points.length > 0) {
        onUpdateElements([...board.elements, finishedStroke], true);
      }
    }

    // Finish connector
    if (activeConnectorPreview) {
      const worldPt = screenToWorld(e.clientX, e.clientY);
      let targetElementId: string | undefined;
      let targetAnchor: CardinalAnchor | undefined;
      let endPoint = worldPt;

      for (const el of board.elements) {
        if (el.id === activeConnectorPreview.fromId) continue;
        const anchors = getElementAnchorPoints(el);
        for (const a of anchors) {
          if (Math.hypot(a.point.x - worldPt.x, a.point.y - worldPt.y) < 30) {
            targetElementId = el.id;
            targetAnchor = a.anchor;
            endPoint = a.point;
            break;
          }
        }
        if (targetElementId) break;
      }

      const newConnector: ConnectorElement = {
        id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        type: 'connector',
        fromId: activeConnectorPreview.fromId,
        fromAnchor: activeConnectorPreview.fromAnchor,
        fromPoint: activeConnectorPreview.fromPoint,
        toId: targetElementId,
        toAnchor: targetAnchor,
        toPoint: endPoint,
        style: 'straight',
        arrowEnd: true,
        color: '#4F46E5',
        width: 2.5,
      };

      onUpdateElements([...board.elements, newConnector], true);
      setActiveConnectorPreview(null);
    }

    // Finish dragging element
    if (isDraggingElementRef.current) {
      isDraggingElementRef.current = false;
      onUpdateElements([...board.elements], true);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    handlePointerUp(e);
  };

  // Element mouse/pointer down to select and start dragging
  const handleElementPointerDown = (e: React.PointerEvent, el: BoardElement) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setSelectedId(el.id);

    isDraggingElementRef.current = true;
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };

    if (el.type === 'sticky' || el.type === 'shape' || el.type === 'checklist' || el.type === 'text') {
      dragStartElementPosRef.current = { x: el.x, y: el.y };
    }
  };

  // Add sticky note directly at radial menu point
  const handleAddStickyAtPoint = () => {
    if (!radialMenu) return;
    const pt = radialMenu.worldPos;
    const newSticky: BoardElement = {
      id: `sticky-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'sticky',
      x: Math.round(pt.x - 110),
      y: Math.round(pt.y - 95),
      width: 220,
      height: 190,
      color: stickyColor,
      title: 'Нова белешка',
      content: '',
      rotation: 0,
    };
    onUpdateElements([...board.elements, newSticky], true);
    setSelectedId(newSticky.id);
  };

  // Add checklist directly at radial menu point
  const handleAddChecklistAtPoint = () => {
    if (!radialMenu) return;
    const pt = radialMenu.worldPos;
    const newChecklist: BoardElement = {
      id: `checklist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'checklist',
      x: Math.round(pt.x - 130),
      y: Math.round(pt.y - 80),
      width: 260,
      title: '📋 Нова листа со задачи',
      color: '#FFFFFF',
      items: [
        { id: `item-1`, text: 'Прва задача', completed: false },
        { id: `item-2`, text: 'Втора задача', completed: false },
      ],
    };
    onUpdateElements([...board.elements, newChecklist], true);
    setSelectedId(newChecklist.id);
  };

  // Render SVG connector paths
  const renderConnector = (conn: ConnectorElement) => {
    const isSelected = selectedId === conn.id;
    const p1 = conn.fromPoint;
    const p2 = conn.toPoint;

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const headlen = 10;
    const arrowPoint1 = {
      x: p2.x - headlen * Math.cos(angle - Math.PI / 6),
      y: p2.y - headlen * Math.sin(angle - Math.PI / 6),
    };
    const arrowPoint2 = {
      x: p2.x - headlen * Math.cos(angle + Math.PI / 6),
      y: p2.y - headlen * Math.sin(angle + Math.PI / 6),
    };

    return (
      <g
        key={conn.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(conn.id);
        }}
        className="cursor-pointer group"
      >
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke="transparent"
          strokeWidth={14}
        />
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={isSelected ? '#4F46E5' : conn.color || '#475569'}
          strokeWidth={isSelected ? (conn.width || 2) + 1.5 : conn.width || 2}
          strokeDasharray={isSelected ? '6 3' : undefined}
          strokeLinecap="round"
        />
        {conn.arrowEnd && (
          <polygon
            points={`${p2.x},${p2.y} ${arrowPoint1.x},${arrowPoint1.y} ${arrowPoint2.x},${arrowPoint2.y}`}
            fill={isSelected ? '#4F46E5' : conn.color || '#475569'}
          />
        )}
      </g>
    );
  };

  const getCursor = () => {
    if (spacePressed || activeTool === 'hand') return 'grab';
    if (activeTool === 'pen' || activeTool === 'highlighter') return 'crosshair';
    if (activeTool === 'eraser') return 'cell';
    if (activeTool === 'sticky' || activeTool === 'shape' || activeTool === 'checklist' || activeTool === 'text') return 'copy';
    if (activeTool === 'connector') return 'crosshair';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onWheel={handleWheel}
      className="absolute inset-0 top-14 overflow-hidden select-none touch-none"
      style={{
        cursor: getCursor(),
        backgroundColor: '#F8FAFC',
        touchAction: 'none',
      }}
    >
      {/* 1. Background Grid Canvas */}
      <canvas
        ref={gridCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* 2. Freehand Inking Canvas */}
      <canvas
        ref={strokesCanvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* 3. Scalable SVG Connectors Layer */}
      <svg
        className="absolute inset-0 pointer-events-none w-full h-full"
        style={{
          transform: `translate(${viewport.x * viewport.zoom}px, ${viewport.y * viewport.zoom}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {board.elements
          .filter((el): el is ConnectorElement => el.type === 'connector')
          .map(renderConnector)}

        {/* Live connector dragging preview */}
        {activeConnectorPreview && (
          <line
            x1={activeConnectorPreview.fromPoint.x}
            y1={activeConnectorPreview.fromPoint.y}
            x2={activeConnectorPreview.currentPoint.x}
            y2={activeConnectorPreview.currentPoint.y}
            stroke="#6366F1"
            strokeWidth={2.5}
            strokeDasharray="5 4"
          />
        )}
      </svg>

      {/* 4. Interactive HTML / DOM Elements Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${viewport.x * viewport.zoom}px, ${viewport.y * viewport.zoom}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {board.elements.map((el) => {
          const isSelected = selectedId === el.id;

          if (el.type === 'sticky') {
            return (
              <div key={el.id} className="pointer-events-auto" onPointerDown={(e) => handleElementPointerDown(e, el)}>
                <StickyNoteView
                  element={el}
                  isSelected={isSelected}
                  onSelect={(e) => {
                    e.stopPropagation();
                    setSelectedId(el.id);
                  }}
                  onUpdate={(up) => handleUpdateElement(up, true)}
                  onDelete={handleDeleteElement}
                  onDuplicate={handleDuplicateElement}
                  onStartConnector={handleStartConnector}
                  zoom={viewport.zoom}
                />
              </div>
            );
          }

          if (el.type === 'checklist') {
            return (
              <div key={el.id} className="pointer-events-auto" onPointerDown={(e) => handleElementPointerDown(e, el)}>
                <ChecklistView
                  element={el}
                  isSelected={isSelected}
                  onSelect={(e) => {
                    e.stopPropagation();
                    setSelectedId(el.id);
                  }}
                  onUpdate={(up) => handleUpdateElement(up, true)}
                  onDelete={handleDeleteElement}
                  onDuplicate={handleDuplicateElement}
                  onStartConnector={handleStartConnector}
                />
              </div>
            );
          }

          if (el.type === 'shape') {
            return (
              <div key={el.id} className="pointer-events-auto" onPointerDown={(e) => handleElementPointerDown(e, el)}>
                <ShapeView
                  element={el}
                  isSelected={isSelected}
                  onSelect={(e) => {
                    e.stopPropagation();
                    setSelectedId(el.id);
                  }}
                  onUpdate={(up) => handleUpdateElement(up, true)}
                  onDelete={handleDeleteElement}
                  onDuplicate={handleDuplicateElement}
                  onStartConnector={handleStartConnector}
                />
              </div>
            );
          }

          if (el.type === 'text') {
            return (
              <div
                key={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                }}
                onPointerDown={(e) => handleElementPointerDown(e, el)}
                className={`absolute pointer-events-auto select-none cursor-move p-1 rounded ${
                  isSelected ? 'ring-2 ring-indigo-500 bg-white/80' : ''
                }`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                }}
              >
                <input
                  type="text"
                  value={el.text}
                  onChange={(e) => handleUpdateElement({ ...el, text: e.target.value })}
                  style={{
                    fontSize: el.fontSize,
                    color: el.color,
                    fontWeight: el.bold ? 'bold' : 'normal',
                  }}
                  className="w-full bg-transparent focus:outline-none"
                />
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* 5. Virtual Ruler Overlay */}
      <RulerOverlay
        ruler={ruler}
        viewport={viewport}
        onUpdateRuler={onUpdateRuler}
        onClose={onCloseRuler}
      />

      {/* 6. Subtle Canvas Watermark Intro (Fades out when interacting) */}
      <CanvasWatermark visible={!hasInteracted && board.elements.length <= 1} />

      {/* 7. Scratch-to-Erase Visual Feedback Toast */}
      {eraseNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          {eraseNotification}
        </div>
      )}

      {/* 8. Radial Pen Menu (Double Tap) */}
      <RadialMenu
        isOpen={radialMenu !== null}
        position={radialMenu?.screenPos || null}
        onClose={() => setRadialMenu(null)}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onSelectColor={setStrokeColor}
        onAddStickyAtPoint={handleAddStickyAtPoint}
        onAddChecklistAtPoint={handleAddChecklistAtPoint}
      />
    </div>
  );
};
