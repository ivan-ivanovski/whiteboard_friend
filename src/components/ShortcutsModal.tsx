import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'V', desc: 'Алатка за селекција (Select)' },
    { key: 'H / Space', desc: 'Рака за поместување на платното (Pan Canvas)' },
    { key: 'P', desc: 'Пенкало за слободно цртање (Pen)' },
    { key: 'M', desc: 'Фломастер / Маркер за истакнување (Highlighter)' },
    { key: 'E', desc: 'Гума за бришење потези (Eraser)' },
    { key: 'R', desc: 'Прикажи / Сокриј виртуелен линијар (Ruler)' },
    { key: 'S', desc: 'Постави ново лепливо ливче (Sticky Note)' },
    { key: 'D', desc: 'Постави геометриска форма (Shape)' },
    { key: 'A', desc: 'Нацртај стрелка / поврзувач (Arrow Connector)' },
    { key: 'T', desc: 'Постави текст (Text box)' },
    { key: 'C', desc: 'Постави листа со задачи (Checklist)' },
    { key: 'Ctrl + Z', desc: 'Врати чекор назад (Undo)' },
    { key: 'Ctrl + Y', desc: 'Повтори чекор напред (Redo)' },
    { key: 'Ctrl + D', desc: 'Дуплирај селектиран елемент' },
    { key: 'Delete', desc: 'Избриши селектиран елемент' },
    { key: 'Тркалце (Wheel)', desc: 'Зумирање на платното (10% - 500%)' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Кратенки на тастатура</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-2">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
              <span className="text-xs text-slate-700 font-medium">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono font-semibold text-slate-800 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
