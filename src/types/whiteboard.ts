export type ToolType = 
  | 'select' 
  | 'hand' 
  | 'pen' 
  | 'highlighter' 
  | 'eraser' 
  | 'ruler' 
  | 'sticky' 
  | 'shape' 
  | 'connector' 
  | 'text' 
  | 'checklist';

export type ShapeKind = 
  | 'rectangle' 
  | 'rounded-rect' 
  | 'circle' 
  | 'diamond' 
  | 'cloud';

export type ConnectorStyle = 'straight' | 'curved' | 'orthogonal';

export type CardinalAnchor = 'top' | 'right' | 'bottom' | 'left';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface FreehandStrokeElement {
  id: string;
  type: 'stroke';
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  opacity: number;
  points: Point[];
  roughBounds?: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface StickyNoteElement {
  id: string;
  type: 'sticky';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  title: string;
  content: string;
  rotation?: number;
}

export interface ShapeElement {
  id: string;
  type: 'shape';
  shapeKind: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  text?: string;
  textColor?: string;
}

export interface ConnectorElement {
  id: string;
  type: 'connector';
  fromId?: string;
  fromAnchor?: CardinalAnchor;
  fromPoint: { x: number; y: number };
  toId?: string;
  toAnchor?: CardinalAnchor;
  toPoint: { x: number; y: number };
  style: ConnectorStyle;
  arrowStart?: boolean;
  arrowEnd?: boolean;
  color: string;
  width: number;
  label?: string;
}

export interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  bold?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistElement {
  id: string;
  type: 'checklist';
  x: number;
  y: number;
  width: number;
  title: string;
  items: ChecklistItem[];
  color: string;
}

export type BoardElement = 
  | FreehandStrokeElement 
  | StickyNoteElement 
  | ShapeElement 
  | ConnectorElement 
  | TextElement 
  | ChecklistElement;

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Board {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  viewport: Viewport;
  gridType: 'dots' | 'grid' | 'none';
  elements: BoardElement[];
}

export interface RulerState {
  visible: boolean;
  x: number;
  y: number;
  angle: number; // in degrees
  length: number;
}
