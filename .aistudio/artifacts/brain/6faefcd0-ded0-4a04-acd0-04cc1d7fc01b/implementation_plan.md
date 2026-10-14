# Whiteboard Studio (Personal Canvas & Notes)

A versatile personal visual workspace combining Microsoft Whiteboard's fluid inking, Draw.io's diagramming shapes and connectors, and FigJam's colorful sticky notes and task lists on an infinite, hardware-accelerated canvas.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your clarifications, the application is tailored for personal visual note-taking, sketching, and structured diagramming, with local offline persistence and zero external account dependencies.

- **Hybrid Workflow Confirmed**: Merges fluid pen/highlighter sketching (Microsoft Whiteboard style) with structured shapes and connectors (Draw.io style) and vibrant sticky notes & checklists (FigJam style).
- **Core Toolset Confirmed**:
  1. Freehand Pen (variable stroke, smoothness) & Semi-transparent Highlighter
  2. Precision Eraser (stroke eraser + point eraser) & Virtual Canvas Ruler
  3. Colorful Sticky Notes (with markdown-style bulleted text and quick color presets)
  4. Geometric Shapes (rectangles, rounded boxes, circles/ellipses, diamonds, clouds)
  5. Connectors & Arrows (straight, curved/elbow arrows that can snap to element anchors)
  6. Rich Text Boxes & Interactive Task Checklists (clickable completion toggles)
- **Local Persistence & Board Management Confirmed**: Multi-board switcher with board templates, auto-save to browser `localStorage` / `IndexedDB`, duplicate/rename boards, and lossless JSON import/export as well as high-res PNG and vector SVG export.
- **Language & Interface Tone**: Clean Macedonian and English support with crisp, accessible tooltips and clear shortcuts.

---

## 1. Overview & Core Concept

- **What It Does**: Provides an ultra-responsive, infinite 2D canvas with pan, zoom, grid snapping (dots, grid, or blank), and an intuitive floating toolbar. Users can freely sketch with natural ink, highlight key ideas, place sticky notes for brainstorming, draw diagrams with snapped connectors, and manage structured checklist notes.
- **Target Audience / Persona**: Anyone looking for a private, fast personal sketchbook, idea organizer, flowchart sketcher, or daily task visual board without account friction or latency.
- **Key Value**: Zero setup, instant loading, complete data privacy stored on the user's device, with the tactile satisfaction of a physical whiteboard combined with modern digital editing.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Board Navigation & Canvas Exploration**:
   - The user opens the app to their last active board or an empty canvas with an elegant subtle dot grid.
   - Smooth panning (spacebar + drag, middle mouse click, or two-finger scroll) and zooming (mouse wheel or pinch gesture from 10% to 500%) with a quick "Reset View" (100%) and "Fit to Content" shortcut.
2. **Tool Selection & Inking**:
   - Dockable bottom/top floating toolbar with quick keys (`V` Select, `P` Pen, `H` Highlighter, `E` Eraser, `R` Ruler, `S` Sticky Note, `D` Shape, `A` Arrow/Connector, `T` Text, `C` Checklist).
   - Pen & Highlighter palette offers calibrated stroke sizes (thin, medium, bold, chisel) and curated ink colors (Classic Ink, Pastel, Vibrant).
   - Virtual Ruler tool can be placed on the canvas and rotated to draw perfectly straight constrained lines.
3. **Diagramming & Sticky Notes Creation**:
   - Click or drag to drop sticky notes in pastel yellow, mint, lavender, coral, sky blue, and charcoal.
   - Click connector anchor points on any shape or sticky note and drag to connect to another object; arrows route cleanly and stay linked when moving items.
4. **Task & Notes Flow**:
   - Drop a task list block directly onto the canvas; click checkboxes to check off completed items; reorder or strike through tasks.
5. **Multi-Board Management & Export**:
   - Header board switcher dropdown: switch between "Brainstorming", "System Architecture", "Daily Sprint Notes", or create a new board with one click.
   - Export modal: export selected area or entire canvas as crisp PNG (with transparent or solid background), vector SVG, or backup JSON file.

### Visual Identity & Theme

- **Aesthetic Direction**: Minimalist, tactile, distraction-free productivity studio inspired by modern workspace tools (Figma, Linear, Apple Notes, Microsoft Fluent).
- **Color Palette & Mood**:
  - Canvas Background: Crisp neutral off-white (`#F8FAFC`) in light mode or slate charcoal (`#0F172A`) in dark mode.
  - Structural Surfaces: Pure white card surfaces (`#FFFFFF`) / deep obsidian (`#1E293B`) with 1px hairline borders (`rgba(0,0,0,0.08)`).
  - Sticky Note Palette: Mellow Lemon (`#FEF08A`), Soft Mint (`#BBF7D0`), Lavender Dream (`#E9D5FF`), Coral Peach (`#FED7AA`), Sky Mist (`#BAE6FD`), Slate Minimal (`#F1F5F9`).
  - Ink Accents: Deep Ink (`#0F172A`), Electric Indigo (`#4F46E5`), Crimson Rose (`#E11D48`), Emerald Green (`#059669`), Golden Amber (`#D97706`).
- **Typography & Hierarchy**:
  - Primary UI & Headers: Modern sans for clean readability.
  - Sticky Note & Handwritten Feel: Clean legible sans with optional handwritten/casual styling for sticky titles.
  - Metrics / Zoom indicator / Coordinates: Tabular figures (`tabular-nums` / `JetBrains Mono`).
- **Interactive Feedback & Motion**:
  - Micro-interactions on toolbar items with subtle 150ms spring settling.
  - Canvas cursor changes contextually (crosshair for drawing, grab for panning, pointer for selecting, resize handles for bounding boxes).

---

## 3. Key Product Decisions & Trade-Offs

- **Canvas Architecture: HTML5 2D Canvas + Interactive Layer**:
  - *Chosen Approach*: Multi-layered canvas architecture:
    1. Background Grid Canvas (draws infinite dots/grids at current viewport matrix).
    2. Freehand Stroke Canvas (renders pen, highlighter, eraser masks with path smoothing).
    3. Structured Elements (Shapes, Sticky Notes, Checklist Cards, Connectors) managed as vector objects rendered with interactive selection handles, bounding boxes, and connector ports.
  - *Why*: Provides 60fps buttery smooth freehand inking latency while keeping sticky notes and checklists crisp, editable, and accessible with native inputs.
- **Local Persistence Strategy**:
  - *Chosen Approach*: Automatic reactive saving to browser `localStorage` with JSON serialization and backup/restore.
  - *Why*: Instant offline capability, zero cloud signup barrier, zero latency, guaranteed user privacy.
- **Connectors & Routing**:
  - *Chosen Approach*: Smart orthogonal and curved Bezier connectors with 4 cardinal attachment points (top, right, bottom, left) per shape/sticky note.
  - *Why*: Replicates Draw.io's diagramming power without visual clutter.

---

## 4. Technical Architecture & Data Strategy

### System Layout & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar                              │
│  [Board Title & Switcher]  [Undo/Redo]  [Zoom %]  [Export/Import] [Theme]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                      Infinite Interactive Canvas                        │
│                                                                        │
│  ┌─────────────────────────┐         ┌──────────────────────────────┐  │
│  │   Sticky Note (Yellow)  │────────►│  Shape: Process Step (Blue)  │  │
│  │   - Design whiteboard   │ Connector│  - Implement core engine    │  │
│  │   - Add connector tools │ (Snapped)└──────────────┬───────────────┘  │
│  └─────────────────────────┘                         │                 │
│                                                      ▼                 │
│  ┌─────────────────────────┐         ┌──────────────────────────────┐  │
│  │  Interactive Checklist  │         │  Freehand Pen & Highlighter  │  │
│  │  ☑ Canvas pan/zoom      │         │   (Natural smoothed curves)  │  │
│  │  ☐ Export to PNG/SVG    │         │  ~~~~~~~~~~~~~~~~~~~~~~~~~~  │  │
│  └─────────────────────────┘         └──────────────────────────────┘  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                     Floating Main Toolbar (Docked)                     │
│  [Select] [Pen] [Marker] [Eraser] [Ruler] [Sticky] [Shape] [Arrow] [Text]│
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

```typescript
export interface Board {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  viewport: { x: number; y: number; zoom: number };
  gridType: 'dots' | 'lines' | 'none';
  elements: BoardElement[];
}

export type BoardElement = 
  | FreehandStrokeElement
  | StickyNoteElement
  | ShapeElement
  | ConnectorElement
  | TextElement
  | ChecklistElement;

export interface FreehandStrokeElement {
  id: string;
  type: 'stroke';
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number; pressure?: number }[];
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
  shapeKind: 'rectangle' | 'rounded-rect' | 'circle' | 'diamond' | 'cloud';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  text?: string;
}

export interface ConnectorElement {
  id: string;
  type: 'connector';
  fromId?: string;
  fromPoint: { x: number; y: number };
  fromAnchor?: 'top' | 'right' | 'bottom' | 'left';
  toId?: string;
  toPoint: { x: number; y: number };
  toAnchor?: 'top' | 'right' | 'bottom' | 'left';
  style: 'straight' | 'curved' | 'orthogonal';
  arrowStart?: boolean;
  arrowEnd?: boolean;
  color: string;
  width: number;
}

export interface ChecklistElement {
  id: string;
  type: 'checklist';
  x: number;
  y: number;
  width: number;
  title: string;
  items: { id: string; text: string; completed: boolean }[];
  color: string;
}
```

### Interactive Component & State Mapping

- **Canvas Viewport Store**: Tracks transform matrix `[scale, 0, 0, scale, panX, panY]`, translates screen mouse events to canvas world coordinates.
- **History (Undo / Redo Stack)**: Command pattern with immutable state snapshots allowing instantaneous `Ctrl+Z` / `Ctrl+Y`.
- **Selection & Transform Box**: Drag-to-select multiple items, resize with corner/edge handles, duplicate (`Ctrl+D`), delete (`Backspace`/`Delete`), bring to front / send to back.
- **Ruler Tool**: Interactive overlay ruler that can be dragged and rotated (`0°`, `30°`, `45°`, `90°`), guiding the pen to draw straight lines effortlessly.
- **Export Engine**: Renders off-screen canvas matching the bounding box of elements for crisp PNG export or SVG vector serialization.
