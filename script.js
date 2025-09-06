// =====================================================
// Canvas Playground — Clean build (drag + resize + persist(desktop) + mobile-random + pan + zoom/pinch + hover-bounce)
// =====================================================

// ---------- Config ----------
const IMAGE_COUNT = 23;
const IS_MOBILE = window.matchMedia('(max-width: 640px)').matches;
const PERSIST_KEY = 'hello-layout-v3';      // desktop only
const PERSIST_ON_MOBILE = false;             // keep mobile "random every load"
const WHEEL_ZOOM_STEP = 0.001;               // desktop wheel zoom speed
const SCALE_MIN = 0.3, SCALE_MAX = 3;

// Desktop default layout (fixed)
const desktopLayout = {
  "frame-1":  { "x": 646.51,  "y": -281.271, "w": 300 },
  "frame-2":  { "x": 75.6457, "y": -184.501, "w": 300 },
  "frame-3":  { "x": 1222.89, "y": 128.086,  "w": 300 },
  "frame-4":  { "x": 1630.49, "y": 102.215,  "w": 256.25 },
  "frame-5":  { "x": 1358.34, "y": -205.033, "w": 272.28 },
  "frame-6":  { "x": 122.905, "y": 401.245,  "w": 300 },
  "frame-7":  { "x": -477.218,"y": -38.3265, "w": 237.677 },
  "frame-8":  { "x": 937.073, "y": 299.138,  "w": 300 },
  "frame-9":  { "x": 130.481, "y": 65.5438,  "w": 300 },
  "frame-10": { "x": -317.917,"y": 195.851,  "w": 300 },
  "frame-11": { "x": -183.49, "y": 642.815,  "w": 300 },
  "frame-12": { "x": -624.919,"y": -366.449, "w": 300 },
  "frame-13": { "x": -692.494,"y": 152.045,  "w": 341.243 },
  "frame-14": { "x": -224.904,"y": -286.979, "w": 300 },
  "frame-15": { "x": 1705.41, "y": -221.885, "w": 300 },
  "frame-16": { "x": -677.793,"y": 481.315,  "w": 300 },
  "frame-17": { "x": 1546.96, "y": 442.999,  "w": 300 },
  "frame-18": { "x": 1438.88, "y": 757.966,  "w": 300 },
  "frame-19": { "x": 456.796, "y": 615.772,  "w": 422.33 },
  "frame-20": { "x": 1068.47, "y": 641.17,   "w": 300 },
  "frame-21": { "x": 962.906, "y": -127.276, "w": 300 },
  "frame-22": { "x": 476.185, "y": 106.032,  "w": 413.955 },
  "frame-23": { "x": -579.162,"y": 699.192,  "w": 300 }
};

// ---------- Mobile random layout (every load) ----------
function computeMobileLayoutRandom() {
  const ids = Array.from({ length: IMAGE_COUNT }, (_, i) => `frame-${i + 1}`);
  const baseWMin = 210, baseWMax = 300;
  const minDist = 250, tries = 600;
  const R_x = 750, R_y = 950;

  const placed = [], layout = {};
  function rand() { return Math.random(); }
  function randomInEllipse() {
    const theta = rand() * Math.PI * 2;
    const r = Math.sqrt(rand());
    return { x: Math.cos(theta) * R_x * r, y: Math.sin(theta) * R_y * r };
  }
  function farEnough(x, y) {
    for (const p of placed) if (Math.hypot(x - p.x, y - p.y) < minDist) return false;
    return true;
  }

  ids.forEach(id => {
    const w = baseWMin + Math.random() * (baseWMax - baseWMin);
    let pos = null;
    for (let t = 0; t < tries; t++) {
      const p = randomInEllipse();
      if (farEnough(p.x, p.y)) { pos = p; break; }
    }
    if (!pos) pos = randomInEllipse();
    placed.push(pos);
    layout[id] = { x: pos.x, y: pos.y, w };
  });
  return layout;
}

// ---------- Persistence (desktop only unless toggled) ----------
function loadSavedLayout() {
  if (IS_MOBILE && !PERSIST_ON_MOBILE) return {};
  try { return JSON.parse(localStorage.getItem(PERSIST_KEY) || '{}'); }
  catch { return {}; }
}
function saveLayoutNow() {
  if (IS_MOBILE && !PERSIST_ON_MOBILE) return; // skip on mobile
  const obj = {};
  stage.querySelectorAll('.draggable').forEach(el => {
    obj[el.dataset.id] = {
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top)  || 0,
      w: parseFloat(el.style.width) || 0,
      h: parseFloat(el.style.height) || 0
    };
  });
  try { localStorage.setItem(PERSIST_KEY, JSON.stringify(obj)); } catch {}
}
const saveLayout = (() => { let t=null; return () => { clearTimeout(t); t=setTimeout(saveLayoutNow,120); }; })();

// ---------- DOM ----------
const canvas = document.getElementById('canvas');
const stage  = document.getElementById('stage');
if (!canvas || !stage) throw new Error('Missing #canvas or #stage');

// inject minimal CSS (hover bounce + cursor + selection)
(function injectCSS(){
  const css = `
    #stage .draggable{ position:absolute; cursor:grab; user-select:none; -webkit-user-drag:none; transform-origin:center; }
    #stage .draggable:active{ cursor:grabbing; }
    @keyframes kw_bounce{ 0%{transform:scale(.98)} 50%{transform:scale(1.04)} 100%{transform:scale(1)} }
    .hover-bounce:hover{ animation: kw_bounce .8s cubic-bezier(.2,.75,.25,1.2); }

    .kw-selection{ position:absolute; border:2px dashed rgba(0,0,0,.35); border-radius:10px; pointer-events:none; }
    .kw-handle{ position:absolute; width:12px;height:12px;border-radius:50%; background:#fff; border:1px solid rgba(0,0,0,.35); box-shadow:0 1px 3px rgba(0,0,0,.25); pointer-events:all; }
    .kw-handle[data-pos="nw"]{ left:-6px; top:-6px; cursor:nwse-resize; }
    .kw-handle[data-pos="ne"]{ right:-6px; top:-6px; cursor:nesw-resize; }
    .kw-handle[data-pos="sw"]{ left:-6px; bottom:-6px; cursor:nesw-resize; }
    .kw-handle[data-pos="se"]{ right:-6px; bottom:-6px; cursor:nwse-resize; }
  `;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
})();

// build elements
const els = [];
const loadPromises = [];
for (let i = 1; i <= IMAGE_COUNT; i++) {
  const el = document.createElement('img');
  el.src = `elements/frame-${i}.png`;
  el.className = 'draggable hover-bounce';
  el.dataset.id = `frame-${i}`;
  el.draggable = false;
  el.addEventListener('dragstart', e => e.preventDefault());
  stage.appendChild(el);
  els.push(el);
  loadPromises.push(new Promise(res => {
    if (el.complete) return res();
    el.onload = () => res();
    el.onerror = () => res();
  }));
}

// choose initial layout
const saved = loadSavedLayout();
const initialLayout =
  (Object.keys(saved).length ? saved : (IS_MOBILE ? computeMobileLayoutRandom() : desktopLayout));

function applyLayout(layout) {
  els.forEach(el => {
    const lay = layout[el.dataset.id];
    if (!lay) return;
    el.style.left  = `${lay.x}px`;
    el.style.top   = `${lay.y}px`;
    el.style.width = `${lay.w}px`;
    if (lay.h) el.style.height = `${lay.h}px`; else el.style.removeProperty('height');
  });
}
applyLayout(initialLayout);

// stage transform (pan + zoom)
let scale   = IS_MOBILE ? 0.6 : 0.5;
let originX = 0, originY = 0;

function applyTransform() {
  stage.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}

// center view on content after images loaded
function centerStageOnContent() {
  if (!els.length) return;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  els.forEach(el=>{
    const l=el.offsetLeft,t=el.offsetTop,w=el.offsetWidth,h=el.offsetHeight;
    minX=Math.min(minX,l); minY=Math.min(minY,t);
    maxX=Math.max(maxX,l+w); maxY=Math.max(maxY,t+h);
  });
  const contentW=maxX-minX, contentH=maxY-minY;
  const viewW=canvas.clientWidth, viewH=canvas.clientHeight;
  const cx=minX+contentW/2, cy=minY+contentH/2;
  originX=(viewW/2)-(cx*scale);
  originY=(viewH/2)-(cy*scale);
  applyTransform();
}

Promise.all(loadPromises).then(() => {
  centerStageOnContent();
  // seed storage once on desktop if empty
  if (!IS_MOBILE && !Object.keys(saved).length) saveLayoutNow();
});

// =====================================================
// Pointer handling (drag element, resize handles, pan background, pinch zoom)
// =====================================================
const pointerMap = new Map();
const getXY = e => ({ x: e.clientX, y: e.clientY });

let selection=null, selectionTarget=null;
function showSelection(el){
  hideSelection();
  selectionTarget = el;
  selection = document.createElement('div');
  selection.className = 'kw-selection';
  ['nw','ne','sw','se'].forEach(pos=>{
    const h = document.createElement('div');
    h.className = 'kw-handle';
    h.dataset.pos = pos;
    h.addEventListener('pointerdown', e => startResize(e, el, pos), {passive:false});
    selection.appendChild(h);
  });
  stage.appendChild(selection);
  updateSelection(el);
}
function updateSelection(el){
  if(!selection) return;
  const s = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  selection.style.left   = (r.left - s.left) / scale + 'px';
  selection.style.top    = (r.top  - s.top ) / scale + 'px';
  selection.style.width  = r.width  / scale + 'px';
  selection.style.height = r.height / scale + 'px';
}
function hideSelection(){
  selectionTarget = null;
  if(selection) selection.remove();
  selection = null;
}

// drag element
let activeDrag=null, dragOffset={x:0,y:0}, dragPointerId=null;

// pan background
let panActive=false, panPointerId=null, panPrev=null;

// resize
let resizing=null; // {el,pos,startX,startY,startW,startH,startL,startT}

function stageToLocal(clientX, clientY) {
  const s = stage.getBoundingClientRect();
  return {
    x: (clientX - s.left) / scale,
    y: (clientY - s.top)  / scale
  };
}

// ----- pointerdown -----
canvas.addEventListener('pointerdown', (e) => {
  pointerMap.set(e.pointerId, getXY(e));
  const isLeft = (e.button === 0 || e.pointerType !== 'mouse');

  // handle click on element -> drag
  const piece = e.target.closest && e.target.closest('.draggable');
  if (piece && isLeft) {
    activeDrag = piece;
    const r = piece.getBoundingClientRect();
    dragOffset.x = e.clientX - r.left;
    dragOffset.y = e.clientY - r.top;
    showSelection(piece);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    dragPointerId = e.pointerId;
    piece.style.cursor = 'grabbing';
    e.preventDefault();
    return;
  }

  // background -> pan
  if (isLeft) {
    panActive = true;
    panPointerId = e.pointerId;
    panPrev = getXY(e);
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
    return;
  }
}, {passive:false});

// ----- pointermove -----
window.addEventListener('pointermove', (e) => {
  if (pointerMap.has(e.pointerId)) pointerMap.set(e.pointerId, getXY(e));

  // quick cancel if mouse button released
  if (e.pointerType === 'mouse' && e.buttons === 0 && (activeDrag || resizing || panActive)) {
    endAll();
    return;
  }

  // resize in progress
  if (resizing) {
    e.preventDefault();
    const { el, pos, startX, startY, startW, startH, startL, startT } = resizing;
    const locStart = { x:startX, y:startY };
    const dx = (e.clientX - locStart.x) / scale;
    const dy = (e.clientY - locStart.y) / scale;

    let newW = startW, newH = startH, newL = startL, newT = startT;
    if (pos.includes('e')) newW = startW + dx;
    if (pos.includes('s')) newH = startH + dy;
    if (pos.includes('w')) { newW = startW - dx; newL = startL + dx; }
    if (pos.includes('n')) { newH = startH - dy; newT = startT + dy; }

    // min size guard
    newW = Math.max(40, newW);
    newH = Math.max(40, newH);

    el.style.left = newL + 'px';
    el.style.top  = newT + 'px';
    el.style.width = newW + 'px';
    el.style.height = newH + 'px';
    updateSelection(el);
    saveLayout();
    return;
  }

  // drag piece
  if (activeDrag && (e.buttons & 1)) {
    e.preventDefault();
    const s = stage.getBoundingClientRect();
    const x = (e.clientX - dragOffset.x - s.left) / scale;
    const y = (e.clientY - dragOffset.y - s.top ) / scale;
    activeDrag.style.left = `${x}px`;
    activeDrag.style.top  = `${y}px`;
    updateSelection(activeDrag);
    saveLayout();
    return;
  }

  // pan background
  if (panActive && (e.buttons & 1) && e.pointerId === panPointerId) {
    e.preventDefault();
    originX += (e.clientX - (panPrev?.x ?? e.clientX));
    originY += (e.clientY - (panPrev?.y ?? e.clientY));
    panPrev = getXY(e);
    applyTransform();
    return;
  }
}, {passive:false});

// ----- pointerup / cancel etc. -----
function endAll() {
  try {
    if (dragPointerId != null && canvas.hasPointerCapture?.(dragPointerId)) {
      canvas.releasePointerCapture(dragPointerId);
    }
  } catch {}
  dragPointerId = null;
  if (activeDrag) activeDrag.style.cursor = 'grab';
  activeDrag = null;

  resizing = null;
  panActive = false;
  panPointerId = null;
  panPrev = null;

  pointerMap.clear();
  saveLayoutNow();
}
['pointerup','pointercancel','pointerleave','pointerout','mouseup','mouseleave','blur'].forEach(ev=>{
  window.addEventListener(ev, endAll, {passive:true});
});
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) endAll(); });
canvas.addEventListener('lostpointercapture', endAll);

// ----- resize handles -----
function startResize(e, el, pos) {
  e.stopPropagation(); e.preventDefault();
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  resizing = {
    el, pos,
    startX: e.clientX,
    startY: e.clientY,
    startW: r.width,
    startH: r.height,
    startL: (r.left - s.left) / 1,  // already in CSS px of stage coords
    startT: (r.top  - s.top ) / 1
  };
  try { canvas.setPointerCapture(e.pointerId); } catch {}
}

// =====================================================
// Zoom / Pinch
// =====================================================

// mouse wheel zoom (desktop)
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const prev = scale;
  const delta = -e.deltaY * WHEEL_ZOOM_STEP;
  scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale + delta));

  const r = stage.getBoundingClientRect(); // transformed box
  const mx = (e.clientX - r.left) / prev;
  const my = (e.clientY - r.top ) / prev;
  originX = e.clientX - mx * scale;
  originY = e.clientY - my * scale;
  applyTransform();
}, {passive:false});

// touch pinch zoom
function pinchInfo() {
  const pts = [...pointerMap.values()];
  if (pts.length < 2) return null;
  const [a,b] = pts;
  return { cx:(a.x+b.x)/2, cy:(a.y+b.y)/2, dist:Math.hypot(b.x-a.x, b.y-a.y) };
}

let pinchState = null;
canvas.addEventListener('pointerdown', (/* e already handled above */) => {
  // nothing else; map filled in pointerdown handler
});
window.addEventListener('pointermove', (e) => {
  // when 2+ pointers and not mouse => pinch
  if (pointerMap.size >= 2 && e.pointerType !== 'mouse') {
    const info = pinchInfo(); if (!info) return;
    if (!pinchState) {
      const rect = stage.getBoundingClientRect();
      pinchState = { startDist: info.dist, startScale: scale, rect, cx: info.cx, cy: info.cy };
    } else {
      const k = info.dist / pinchState.startDist;
      const newScale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, pinchState.startScale * k));
      const prev = scale; scale = newScale;
      const mx = (pinchState.cx - pinchState.rect.left) / prev;
      const my = (pinchState.cy - pinchState.rect.top ) / prev;
      originX = pinchState.cx - mx * scale;
      originY = pinchState.cy - my * scale;
      applyTransform();
    }
  }
}, {passive:false});
['pointerup','pointercancel','pointerleave','pointerout'].forEach(ev=>{
  window.addEventListener(ev, () => { if (pointerMap.size < 2) pinchState = null; }, {passive:true});
});

// =====================================================
// Responsiveness: if user never interacted and no saved layout, switch on breakpoint
// =====================================================
const mq = window.matchMedia('(max-width: 640px)');
mq.addEventListener?.('change', (ev) => {
  if (Object.keys(loadSavedLayout()).length) return; // don't override saved
  if (IS_MOBILE && !PERSIST_ON_MOBILE) return;       // already mobile random
  const layout = ev.matches ? computeMobileLayoutRandom() : desktopLayout;
  applyLayout(layout);
  centerStageOnContent();
  if (!IS_MOBILE) saveLayoutNow();
});
