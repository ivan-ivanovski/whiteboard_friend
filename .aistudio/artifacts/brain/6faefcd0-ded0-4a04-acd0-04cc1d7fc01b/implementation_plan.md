# Whiteboard Friend (Stylus Gestures, Scratch-to-Erase & Canvas Intro)

Transform the personal whiteboard into **Whiteboard Friend** with natural pen-only productivity gestures: scratch-to-erase (scribble-out), subtle canvas watermark intro that fades on first touch, radial quick menu on double-tap, hold-to-snap lines and shapes, lasso selection, and comprehensive accessibility.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your answers, Whiteboard Friend will prioritize an intuitive, keyboard-free tablet experience where your digital pen behaves like a magic pencil.

- **Scratch-to-Erase (Scribble-Out)**: Fast zig-zag / back-and-forth pen scribbling over any stroke, text, sticky note, or shape will automatically trigger erasure with a gentle fade/puff visual feedback.
- **Canvas Intro Text**: Replaces the floating modal box with an elegant, non-intrusive plain text watermark embedded directly into the canvas background ("Whiteboard Friend · Скицирајте со пенкало или допрете за почеток"), which smoothly dissolves on the user's very first stroke, touch, or click.
- **Pen-First Radial Menu (Double-Tap)**: Double-tapping with stylus/pen opens an ergonomic circular/pie menu right at the pen tip with instant shortcuts (Undo, Redo, Eraser toggle, Ink Colors, Sticky Note).
- **Hold-to-Snap (Smart Shapes)**: Drawing a line, circle, or box and holding the pen still for 400ms at the end automatically snaps it into a mathematically perfect straight line, true circle, or crisp rectangle.
- **Lasso Selection**: Encircling elements with the pen allows grouping and moving multiple items simultaneously.
- **Branding Update**: App title and identity refreshed to **Whiteboard Friend** across the interface, TopNav, manifest, and meta tags.

---

## 1. Overview & Core Concept

- **What It Does**: Enhances the existing infinite canvas with intelligent pen gesture recognition so users on iPads, Android tablets, Surface devices, or touch laptops can work completely without a keyboard or toolbar clicks.
- **Target Audience / Persona**: Sketchers, note-takers, teachers, and visual thinkers who use styluses (Apple Pencil, S-Pen, Surface Pen) and want effortless, friction-free interaction.
- **Key Value**: No tool switching needed—scribble out to erase, hold to straighten, double-tap for quick actions, and a clean blank canvas that stays distraction-free.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Clean First Impression (Zero-State Canvas)**:
   - When opening an empty canvas or on fresh load, no obstructive popup modal appears.
   - Instead, the center of the canvas shows quiet, elegant typography integrated into the grid:
     ```
     Whiteboard Friend
     Скицирајте слободно со пенкало · 2 прста за зум · Пречкртајте за бришење
     ```
   - As soon as the pen touches the canvas or user adds an item, the text smoothly fades out (`opacity: 0`), leaving an uncluttered workspace.
2. **Scratch-to-Erase In Action**:
   - The user writes or draws a diagram and makes a mistake.
   - Without reaching for the toolbar or clicking Eraser, the user simply draws a quick back-and-forth zig-zag over the unwanted stroke or sticky note.
   - The gesture recognition algorithm detects 3+ rapid direction reversals within a compact bounding box; the target item dissolves and the scribble stroke itself is discarded.
3. **Double-Tap Radial Quick Menu**:
   - Double-tapping the pen anywhere on the canvas opens a compact, semi-translucent circular pie menu directly centered around the pen tip.
   - Fast access to: Undo, Redo, Switch Pen/Highlighter, Toggle Eraser, Color swatches, and Place Sticky.
   - Tapping an item or tapping outside instantly dismisses the menu.
4. **Hold-to-Snap Perfect Lines & Shapes**:
   - Draw an approximate line or circle and pause with the pen held down for ~400ms.
   - The rough line smoothly morphs into a laser-straight vector line or true geometric ellipse/rectangle.

### Visual Identity & Theme

- **Branding**: "Whiteboard Friend" wordmark with warm indigo-violet accent and playful pencil insignia.
- **Palette & Atmosphere**: Crisp slate grid with zero visual clutter. Watermark uses quiet 14px–20px typography (`text-slate-400/60`).
- **Radial Menu Design**: Apple-inspired frosted glass circle (`bg-white/90 backdrop-blur-md shadow-xl`) with high-contrast tactile icon buttons.

---

## 3. Key Product Decisions & Trade-Offs

- **Scribble Detection Algorithm**:
  - *Chosen Approach*: Track the acute angle changes / bounding-box velocity reversals of a stroke during inking. If a stroke has $\ge 3$ directional inflections ($dx$ or $dy$ signs flipping back and forth) and bounding area overlap $> 50\%$ with existing elements, identify it as a scribble-out command.
  - *Why*: Highly responsive ($\le 16\text{ms}$), runs client-side with zero dependencies, and matches natural physical writing habits.
- **Canvas Intro Persistence**:
  - *Chosen Approach*: Reactive state linked to whether the current board has user-drawn strokes or active edits, with automatic fade-out on `pointerdown`.
  - *Why*: Eliminates the annoyance of closing a modal window while still guiding first-time users.

---

## 4. Technical Architecture & Data Strategy

### System Layout & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar                              │
│  [Whiteboard Friend]  [Board: My Ideas]  [Install PWA]  [Undo] [Export]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│                      Infinite Interactive Canvas                        │
│                                                                        │
│        (Subtle Canvas Watermark Intro - Fades on first touch)          │
│                                                                        │
│         [Radial Pen Menu]  ◄── (Appears on Pen Double-Tap)             │
│            ┌───┬───┬───┐                                               │
│            │ ↶ │ 🖌│ 🗑 │                                               │
│            └───┴───┴───┘                                               │
│                                                                        │
│         [Scribble-to-Erase Gesture]                                    │
│             ~~~~~~ ──► Erases stroke/note underneath                   │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                     Floating Main Toolbar (Docked)                     │
│  [Select] [Pen] [Highlighter] [Eraser] [Ruler] [Sticky] [Shapes] [Text] │
└────────────────────────────────────────────────────────────────────────┘
```

### Gesture Recognition Engine

- **Scribble Detection**:
  ```typescript
  export function detectScribble(points: Point[]): boolean {
    if (points.length < 8) return false;
    let reversals = 0;
    let prevDx = 0;
    for (let i = 2; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      if (Math.abs(dx) > 3) {
        if (prevDx !== 0 && Math.sign(dx) !== Math.sign(prevDx)) {
          reversals++;
        }
        prevDx = dx;
      }
    }
    return reversals >= 3;
  }
  ```
- **Hold-to-Snap Timer**: `setTimeout` (400ms) on pointerdown/move when velocity drops near zero; if held, calculates best-fit straight line or circle.
- **Radial Pie Menu Component**: `src/components/RadialMenu.tsx` rendered at screen coordinates of double-tap event.
