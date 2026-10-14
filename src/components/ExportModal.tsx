import React, { useState } from 'react';
import { Board } from '../types/whiteboard';
import { exportToPNG, exportToSVG, exportToJSON } from '../utils/exportUtils';
import { X, Image, FileCode2, FileJson, Check, Download } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, board }) => {
  const [bgChoice, setBgChoice] = useState<'white' | 'dark' | 'transparent'>('white');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      await exportToPNG(board, bgChoice);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = () => {
    exportToSVG(board);
    onClose();
  };

  const handleExportJSON = () => {
    exportToJSON(board);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Експортирај ја таблата</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* 1. High-Res PNG Option */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">PNG Слика (Висока Резолуција)</h3>
                <p className="text-xs text-slate-500">Погодно за споделување и презентации</p>
              </div>
            </div>

            {/* Background picker */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-600 font-medium">Позадина:</span>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setBgChoice('white')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    bgChoice === 'white' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Бела
                </button>
                <button
                  onClick={() => setBgChoice('transparent')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    bgChoice === 'transparent' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Проѕирна
                </button>
                <button
                  onClick={() => setBgChoice('dark')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    bgChoice === 'dark' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Темна
                </button>
              </div>
            </div>

            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Се подготвува...' : 'Преземи како PNG'}</span>
            </button>
          </div>

          {/* 2. SVG Vector */}
          <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">SVG Векторски Формат</h3>
                <p className="text-xs text-slate-500">Без загуба на квалитет при зумирање</p>
              </div>
            </div>
            <button
              onClick={handleExportSVG}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SVG</span>
            </button>
          </div>

          {/* 3. JSON Backup */}
          <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Комплетна Резервна Копија (JSON)</h3>
                <p className="text-xs text-slate-500">Зачувајте ја таблата со сите елементи за повторен увоз</p>
              </div>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
