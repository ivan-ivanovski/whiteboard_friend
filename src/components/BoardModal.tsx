import React, { useState, useRef } from 'react';
import { Board } from '../types/whiteboard';
import { createNewBoard } from '../utils/storage';
import { importFromJSON } from '../utils/exportUtils';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  FolderOpen,
  Upload,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  boards: Board[];
  activeBoardId: string;
  onSelectBoard: (id: string) => void;
  onCreateBoard: (board: Board) => void;
  onUpdateBoard: (board: Board) => void;
  onDeleteBoard: (id: string) => void;
}

export const BoardModal: React.FC<BoardModalProps> = ({
  isOpen,
  onClose,
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
  onUpdateBoard,
  onDeleteBoard,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'my-boards' | 'new-template'>('my-boards');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const startRename = (b: Board) => {
    setEditingId(b.id);
    setEditingTitle(b.title);
  };

  const saveRename = (b: Board) => {
    if (editingTitle.trim()) {
      onUpdateBoard({ ...b, title: editingTitle.trim(), updatedAt: Date.now() });
    }
    setEditingId(null);
  };

  const handleDuplicate = (b: Board) => {
    const dup: Board = {
      ...b,
      id: `board-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${b.title} (Копија)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onCreateBoard(dup);
  };

  const handleCreateTemplate = (template: 'blank' | 'brainstorm' | 'flowchart' | 'kanban') => {
    const names = {
      blank: 'Празна Табла',
      brainstorm: 'Бреинсторминг Сесија',
      flowchart: 'Дијаграм на Систем',
      kanban: 'Канбан & Задачи',
    };
    const newB = createNewBoard(names[template], template);
    onCreateBoard(newB);
    onSelectBoard(newB.id);
    onClose();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromJSON(file);
      imported.id = `board-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      imported.title = `${imported.title} (Увезено)`;
      onCreateBoard(imported);
      onSelectBoard(imported.id);
      onClose();
    } catch (err) {
      alert('Грешка при увоз на датотеката. Проверете дали е валиден .whiteboard.json формат.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Ваши Дигитални Табли
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="px-6 pt-3 pb-1 flex items-center gap-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('my-boards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'my-boards'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Зачувани табли ({boards.length})
          </button>
          <button
            onClick={() => setActiveTab('new-template')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'new-template'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            + Креирај со шаблон
          </button>

          <div className="ml-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json,.whiteboard.json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 hover:bg-slate-100 rounded-md transition-colors"
              title="Увези табла од датотека"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Увези JSON</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'my-boards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {boards.map((b) => {
                const isActive = b.id === activeBoardId;
                const isEditingThis = editingId === b.id;

                return (
                  <div
                    key={b.id}
                    className={`relative p-4 rounded-xl border transition-all text-left flex flex-col justify-between gap-3 ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveRename(b)}
                            className="text-sm font-semibold text-slate-900 border border-indigo-400 rounded px-2 py-0.5 w-full focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveRename(b)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3
                            onClick={() => {
                              onSelectBoard(b.id);
                              onClose();
                            }}
                            className="text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer truncate flex-1"
                          >
                            {b.title}
                          </h3>
                          {isActive && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                              Активна
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{b.elements.length} елементи</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(b.updatedAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          onSelectBoard(b.id);
                          onClose();
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Отвори табла →
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startRename(b)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                          title="Преименувај"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(b)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                          title="Дуплирај"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {boards.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Дали сте сигурни дека сакате да ја избришете таблата "${b.title}"?`)) {
                                onDeleteBoard(b.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            title="Избриши"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleCreateTemplate('blank')}
                className="p-5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left flex flex-col gap-2 group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Празна Табла (Blank Canvas)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Чисто бесконечно платно за слободно скицирање, цртање и водење лични белешки.
                </p>
              </button>

              <button
                onClick={() => handleCreateTemplate('brainstorm')}
                className="p-5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left flex flex-col gap-2 group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Бреинсторминг (FigJam стил)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Подготвени колони со лепливи ливчиња за идеи, решенија и следни чекори.
                </p>
              </button>

              <button
                onClick={() => handleCreateTemplate('flowchart')}
                className="p-5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left flex flex-col gap-2 group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Дијаграм на Систем (Draw.io стил)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Поврзани блокови, услови и стрелки за архитектонски или логички дијаграми.
                </p>
              </button>

              <button
                onClick={() => handleCreateTemplate('kanban')}
                className="p-5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left flex flex-col gap-2 group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Канбан Листи со Задачи</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Интерактивни чеклисти со штиклирање за следење на дневни и проектни задачи.
                </p>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
