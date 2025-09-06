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
    el.style.le
