# Project Summary (Hello)

Interactive single‑page portfolio with two frames (Home + Work). Home is a draggable emoji canvas with bubbles, audio, and a floating folder icon. Work is a separate frame that slides up with an Apple‑style album slider, multiple stacked widgets, Finder‑style modals (Creative/Website/Press/Resume), video widgets, and desktop‑style icons. Navigation is via scroll gestures or clicking the folder/stack buttons.

## Primary Files
- `index.html`
  - Defines the two frames: `.frame-home` (main canvas) and `.frame-work` (work gallery).
  - Inserts album slider markup, slider overlay, stacked widgets, video cards, and desktop icon group in frame 2.
  - Populates slider images from `work/Work1.png` … `work/Work22.png` and stack preview images from `work/stack-work*.png`.
  - Contains the logic for:
    - Frame switching (home/work) via scroll or clicking the folder icon.
    - Stack vs. slider toggle (stack click opens slider; slider click returns to stack).
    - Finder‑style modals for Creative Coder / Corperate Websites / Press / Resume.
    - Video widgets (TrueMoney + Lisasme) with hover/touch controls.
    - Press item links.
    - Widget positioning via inline `left/top` percentages on work widgets.

- `style.css`
  - Styling for the two frames, transitions, and layout.
  - Work gallery slider styles (3D tilt, overlap, brightness fade for side cards).
  - Stack preview styles (stacked images + hover “spread” animation).
  - Slider overlay blur when active.
  - Finder‑style window UI for creative/website/press modals.
  - Video widget cards and labels.
  - Windows‑style background image (`bg/windows.png`) covering the full viewport.
  - Centering constraints for `.work-frame-inner` (fixed max size with responsive scaling).
  - Desktop icon group styles.
  - Bubble styles (Find Me, Work bubble), album slider, arrows, tooltip styling.

- `script.js`
  - Creates and positions draggable emoji elements from `elements/frame-*.png`.
  - Desktop uses fixed `desktopLayout` positions (old version layout restored).
  - Mobile uses random layout (`computeMobileLayoutRandom`).
  - Manages drag/resize selection, layout persistence, hint typing, audio toggle.
  - Adds a floating folder icon in Home (work entry trigger) and positions it per device.

## Frames and Navigation
- **Home frame (`.frame-home`)**
  - Contains the main canvas, draggable emojis, bubbles, hint, and audio control.
  - Folder icon on Home triggers entry to Work.

- **Work frame (`.frame-work`)**
  - Default view is **stack mode** (stack preview visible, slider hidden).
  - Click stack preview to open slider.
  - Click slider or “More” to return to stack.
  - Click “Done” or scroll up to return Home.
  - Additional stacked widgets open Finder‑style modals:
    - Creative Coder (`creative-collection/`)
    - Corperate Websites (`website/`)
    - Press (`press/`)
    - Resume (`resume/Kwanchanok_Phonor_Resume.pdf`)
  - Two video widgets:
    - `vdo/tmncoin.mp4` (no autoplay)
    - `vdo/lisasme.mp4` with `poster` thumbnail
  - Desktop icon group with icons + two‑line labels (includes Resume icon).

- **Navigation triggers**
  - Scroll down or click folder icon → Work frame.
  - Scroll up or click Done → Home frame.
  - In Work: More or slider click → stack; stack click → slider.

## Slider
- **Files**: `work/Work1.png` through `work/Work22.png`.
- **Behavior**:
  - Center card has highest z‑index; side cards tilt and darken using CSS vars (`--offset`, `--abs`).
  - Manual horizontal scroll/drag with infinite loop via transform.
  - Slider overlay blur is enabled with `body.work-slider-active`.

## Stack Preview
- Stack images are `work/stack-work1.png`, `work/stack-work2.png`, `work/stack-work3.png`.
- `stack-work1` is placed as the **third** image (topmost in list).
- Hover on stack spreads images outward.

## Dock
- Dock uses icons:
  - Done = `icon/Box2.png`
  - More = `icon/Box3.png`
- Dock is at bottom of Work frame.
  - Currently hidden via CSS.

## Folder Icon (Home)
- Folder icon uses `icon/File.png` (set in `script.js`).
- Always on top; positioned center‑lower on desktop, and center‑lower on mobile.
- Label: “Works”; tooltip: “Explore” (auto looped tooltip animation).

## Bubbles & Text
- Work bubble text: “This site is Interactive / Play as you want 🙋🏻‍♀️”.
- Find Me bubble is styled blue; “Find Me” label forced to black.

## Assets
- `elements/` → emoji images (`frame-1` … `frame-23`), some removed via `SKIP_IDS`.
- `work/` → slider images.
- `icon/` → UI icons (Folder, File, Box2, Box3, etc.).
- `creative-collection/` → Creative Coder stack + modal images.
- `website/` → Corperate Websites stack + modal images.
- `press/` → Press stack + modal images.
- `resume/` → Resume icon + PDF preview.
- `icon-desktop/` → desktop icon images.
- `vdo/` → video files and thumbnails.
- `audio/` → background music.

## Notes / Gotchas
- Desktop uses fixed layout; mobile randomizes positions each load.
- Stack/slide behavior is driven by body classes: `frame-work-active`, `work-stack-active`, and `work-slider-active`.
- Finder modals are toggled with body classes: `creative-modal-active`, `website-modal-active`, `press-modal-active`, `resume-modal-active`.
- Slider only opens when clicking the stack; it does not auto‑open on frame switch.
- If slider/arrow visibility fails, check z‑index / pointer-events in `style.css`.
