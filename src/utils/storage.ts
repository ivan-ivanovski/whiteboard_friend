import { Board } from '../types/whiteboard';

const STORAGE_KEY_BOARDS = 'whiteboard_studio_boards_v1';
const STORAGE_KEY_ACTIVE_BOARD = 'whiteboard_studio_active_board_id_v1';

export function createDefaultBoard(): Board {
  const now = Date.now();
  return {
    id: 'default-welcome-board',
    title: 'Моја Прва Табла (My First Board)',
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, zoom: 1 },
    gridType: 'dots',
    elements: [
      // Welcome Sticky Note
      {
        id: 'elem-welcome-sticky',
        type: 'sticky',
        x: 100,
        y: 120,
        width: 240,
        height: 220,
        color: '#FEF08A', // Yellow
        title: '💡 Добредојдовте!',
        content: 'Ова е ваше лично дигитално платно за скицирање, белешки и дијаграми.\n\n• Изберете пенкало или маркер (P/H)\n• Додајте лепливи ливчиња (S)\n• Поврзете форми со стрелки (A)',
        rotation: -2,
      },
      // Daily Checklist
      {
        id: 'elem-tasks-checklist',
        type: 'checklist',
        x: 390,
        y: 120,
        width: 270,
        title: '📋 Денешни задачи',
        color: '#BBF7D0', // Mint
        items: [
          { id: 'item-1', text: 'Скицирај нова идеја на таблата', completed: true },
          { id: 'item-2', text: 'Поврзи форми со стрелки', completed: false },
          { id: 'item-3', text: 'Испробај го виртуелниот линијар', completed: false },
          { id: 'item-4', text: 'Експортирај белешка како PNG слика', completed: false },
        ],
      },
      // Diagram Shape 1: Idea
      {
        id: 'elem-shape-1',
        type: 'shape',
        shapeKind: 'rounded-rect',
        x: 720,
        y: 130,
        width: 170,
        height: 70,
        fillColor: '#E0E7FF',
        strokeColor: '#4F46E5',
        strokeWidth: 2,
        text: '1. Идеја & Скица',
        textColor: '#312E81',
      },
      // Diagram Shape 2: Plan
      {
        id: 'elem-shape-2',
        type: 'shape',
        shapeKind: 'diamond',
        x: 960,
        y: 110,
        width: 130,
        height: 110,
        fillColor: '#FEF3C7',
        strokeColor: '#D97706',
        strokeWidth: 2,
        text: 'Преглед?',
        textColor: '#78350F',
      },
      // Diagram Shape 3: Execution
      {
        id: 'elem-shape-3',
        type: 'shape',
        shapeKind: 'rounded-rect',
        x: 1160,
        y: 130,
        width: 170,
        height: 70,
        fillColor: '#DCFCE7',
        strokeColor: '#16A34A',
        strokeWidth: 2,
        text: '2. Реализација',
        textColor: '#14532D',
      },
      // Connector 1 -> 2
      {
        id: 'elem-conn-1',
        type: 'connector',
        fromId: 'elem-shape-1',
        fromAnchor: 'right',
        fromPoint: { x: 890, y: 165 },
        toId: 'elem-shape-2',
        toAnchor: 'left',
        toPoint: { x: 960, y: 165 },
        style: 'straight',
        arrowEnd: true,
        color: '#6366F1',
        width: 2.5,
      },
      // Connector 2 -> 3
      {
        id: 'elem-conn-2',
        type: 'connector',
        fromId: 'elem-shape-2',
        fromAnchor: 'right',
        fromPoint: { x: 1090, y: 165 },
        toId: 'elem-shape-3',
        toAnchor: 'left',
        toPoint: { x: 1160, y: 165 },
        style: 'straight',
        arrowEnd: true,
        color: '#16A34A',
        width: 2.5,
      },
      // Initial Stroke demonstration (handwritten doodle / underline)
      {
        id: 'elem-stroke-1',
        type: 'stroke',
        tool: 'highlighter',
        color: '#FDE047',
        width: 18,
        opacity: 0.45,
        points: [
          { x: 100, y: 85 },
          { x: 180, y: 84 },
          { x: 260, y: 86 },
          { x: 330, y: 85 },
        ],
      },
      {
        id: 'elem-text-title',
        type: 'text',
        x: 100,
        y: 60,
        width: 400,
        height: 40,
        text: '✨ Добредојдовте на вашиот Whiteboard',
        fontSize: 22,
        color: '#0F172A',
        bold: true,
      },
    ],
  };
}

export function loadAllBoards(): Board[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOARDS);
    if (!raw) {
      const defaultBoard = createDefaultBoard();
      saveAllBoards([defaultBoard]);
      setActiveBoardId(defaultBoard.id);
      return [defaultBoard];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const defaultBoard = createDefaultBoard();
    saveAllBoards([defaultBoard]);
    return [defaultBoard];
  } catch (err) {
    console.error('Error loading boards from localStorage:', err);
    return [createDefaultBoard()];
  }
}

export function saveAllBoards(boards: Board[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BOARDS, JSON.stringify(boards));
  } catch (err) {
    console.error('Error saving boards to localStorage:', err);
  }
}

export function getActiveBoardId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_BOARD) || 'default-welcome-board';
  } catch {
    return 'default-welcome-board';
  }
}

export function setActiveBoardId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_BOARD, id);
  } catch (err) {
    console.error('Error setting active board ID:', err);
  }
}

export function createNewBoard(title: string = 'Нова Табла (New Board)', template: 'blank' | 'brainstorm' | 'flowchart' | 'kanban' = 'blank'): Board {
  const now = Date.now();
  const id = `board-${now}-${Math.random().toString(36).substring(2, 7)}`;
  let elements: Board['elements'] = [];

  if (template === 'brainstorm') {
    elements = [
      {
        id: `sticky-${now}-1`,
        type: 'sticky',
        x: 200,
        y: 150,
        width: 220,
        height: 180,
        color: '#FEF08A',
        title: 'Главна цел',
        content: 'Дефинирајте го главниот фокус на проектот овде.',
        rotation: -1,
      },
      {
        id: `sticky-${now}-2`,
        type: 'sticky',
        x: 460,
        y: 150,
        width: 220,
        height: 180,
        color: '#BAE6FD',
        title: 'Идеи & Решенија',
        content: 'Што сè може да направиме за да ја постигнеме целта?',
        rotation: 2,
      },
      {
        id: `sticky-${now}-3`,
        type: 'sticky',
        x: 720,
        y: 150,
        width: 220,
        height: 180,
        color: '#BBF7D0',
        title: 'Следни чекори',
        content: 'Конкретни акции и рокови за имплементација.',
        rotation: 0,
      },
    ];
  } else if (template === 'flowchart') {
    elements = [
      {
        id: `s-${now}-1`,
        type: 'shape',
        shapeKind: 'rounded-rect',
        x: 200,
        y: 200,
        width: 160,
        height: 70,
        fillColor: '#E0E7FF',
        strokeColor: '#4F46E5',
        strokeWidth: 2,
        text: 'Почеток (Start)',
        textColor: '#312E81',
      },
      {
        id: `s-${now}-2`,
        type: 'shape',
        shapeKind: 'diamond',
        x: 430,
        y: 185,
        width: 120,
        height: 100,
        fillColor: '#FEF3C7',
        strokeColor: '#D97706',
        strokeWidth: 2,
        text: 'Услов?',
        textColor: '#78350F',
      },
      {
        id: `s-${now}-3`,
        type: 'shape',
        shapeKind: 'rounded-rect',
        x: 630,
        y: 200,
        width: 160,
        height: 70,
        fillColor: '#DCFCE7',
        strokeColor: '#16A34A',
        strokeWidth: 2,
        text: 'Крај (Success)',
        textColor: '#14532D',
      },
      {
        id: `c-${now}-1`,
        type: 'connector',
        fromId: `s-${now}-1`,
        fromAnchor: 'right',
        fromPoint: { x: 360, y: 235 },
        toId: `s-${now}-2`,
        toAnchor: 'left',
        toPoint: { x: 430, y: 235 },
        style: 'straight',
        arrowEnd: true,
        color: '#4F46E5',
        width: 2,
      },
      {
        id: `c-${now}-2`,
        type: 'connector',
        fromId: `s-${now}-2`,
        fromAnchor: 'right',
        fromPoint: { x: 550, y: 235 },
        toId: `s-${now}-3`,
        toAnchor: 'left',
        toPoint: { x: 630, y: 235 },
        style: 'straight',
        arrowEnd: true,
        color: '#16A34A',
        width: 2,
      },
    ];
  } else if (template === 'kanban') {
    elements = [
      {
        id: `cl-${now}-1`,
        type: 'checklist',
        x: 150,
        y: 150,
        width: 260,
        title: '📌 За правење (To Do)',
        color: '#FED7AA',
        items: [
          { id: 'k-1', text: 'Спецификација на архитектура', completed: false },
          { id: 'k-2', text: 'Дизајн на интерфејс', completed: false },
        ],
      },
      {
        id: `cl-${now}-2`,
        type: 'checklist',
        x: 450,
        y: 150,
        width: 260,
        title: '⚡ Во изработка (In Progress)',
        color: '#BAE6FD',
        items: [
          { id: 'k-3', text: 'Кодирање на компоненти', completed: false },
        ],
      },
      {
        id: `cl-${now}-3`,
        type: 'checklist',
        x: 750,
        y: 150,
        width: 260,
        title: '✅ Завршено (Done)',
        color: '#BBF7D0',
        items: [
          { id: 'k-4', text: 'Иницијален концепт', completed: true },
        ],
      },
    ];
  }

  return {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    viewport: { x: 0, y: 0, zoom: 1 },
    gridType: 'dots',
    elements,
  };
}
