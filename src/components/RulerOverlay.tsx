import React, { useRef } from 'react';
import { RulerState, Viewport } from '../types/whiteboard';
import { RotateCw, X } from 'lucide-react';

interface RulerOverlayProps {
  ruler: RulerState;
  viewport: Viewport;
  onUpdateRuler: (updated: RulerState) => void;
  onClose: () => void;
}

export const RulerOverlay: React.FC<RulerOverlayProps> = ({
  ruler,
  viewport,
  onUpdateRuler,
  onClose,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);

  if (!ruler.visible) return null;

  // Screen coordinates
  const screenX = ruler.x * viewport.zoom + viewport.x * viewport.zoom;
  const screenY = ruler.y * viewport.zoom + viewport.y * viewport.zoom;
  const screenLength = ruler.length * viewport.zoom;
  const height = 64 * viewport.zoom;

  // Handle Dragging the ruler body
  const handleDragMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startRulerX = ruler.x;
    const startRulerY = ruler.y;

    const onMouseMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startMouseX) / viewport.zoom;
      const dy = (ev.clientY - startMouseY) / viewport.zoom;
      onUpdateRuler({
        ...ruler,
        x: startRulerX + dx,
        y: startRulerY + dy,
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle Rotating via center dial
  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rulerCenterScreenX = screenX;
    const rulerCenterScreenY = screenY;

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - rulerCenterScreenX;
      const dy = ev.clientY - rulerCenterScreenY;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle < 0) angle += 360;

      // Snap near cardinal angles (0, 30, 45, 60, 90, 180)
      const snapPoints = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
      for (const sp of snapPoints) {
        if (Math.abs(angle - sp) < 3) {
          angle = sp % 360;
          break;
        }
      }

      onUpdateRuler({
        ...ruler,
        angle: Math.round(angle),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Generate tick marks for ruler edge
  const ticksCount = Math.floor(ruler.length / 10);
  const ticks = Array.from({ length: ticksCount + 1 });

  return (
    <div
      ref={rulerRef}
      onMouseDown={handleDragMouseDown}
      className="absolute select-none cursor-move z-30"
      style={{
        left: screenX,
        top: screenY,
        width: screenLength,
        height: height,
        transform: `translate(-50%, -50%) rotate(${ruler.angle}deg)`,
        transformOrigin: 'center center',
      }}
    >
      <div className="w-full h-full relative rounded-md bg-white/90 backdrop-blur-md border border-slate-300 shadow-2xl flex items-center justify-between px-3 overflow-hidden">
        {/* Top Edge Tick marks */}
        <div className="absolute top-0 left-0 right-0 h-4 flex justify-between pointer-events-none">
          {ticks.map((_, i) => {
            const isMajor = i % 5 === 0;
            return (
              <div
                key={i}
                className={`border-r border-slate-700/60 ${isMajor ? 'h-3.5' : 'h-2'}`}
                style={{ width: `${100 / ticksCount}%` }}
              >
                {isMajor && i > 0 && (
                  <span className="text-[9px] font-mono font-medium text-slate-600 block pl-1">
                    {i / 5}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Center Angle Dial and Close */}
        <div className="mx-auto flex items-center gap-3 bg-slate-900/10 backdrop-blur-sm px-3 py-1 rounded-full z-10">
          <div
            onMouseDown={handleRotateMouseDown}
            className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:text-indigo-600 font-mono text-xs font-semibold text-slate-800"
            title="Завртете го линијарот (Rotate)"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{ruler.angle}°</span>
          </div>

          <div className="h-3 w-px bg-slate-400" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="hover:text-red-600 text-slate-600 transition-colors"
            title="Затвори линијар (Close)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Edge Tick marks */}
        <div className="absolute bottom-0 left-0 right-0 h-3 flex justify-between pointer-events-none">
          {ticks.map((_, i) => (
            <div
              key={i}
              className={`border-r border-slate-400 ${i % 5 === 0 ? 'h-2.5' : 'h-1.5'}`}
              style={{ width: `${100 / ticksCount}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
