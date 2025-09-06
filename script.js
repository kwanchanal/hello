// =========================
// Canvas Playground — JS
// =========================

// Layout เริ่มต้น
const initialLayout = {
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

const canvas = document.getElementById('canvas');
const stage  = document.getElementById('stage');

// โหลด element 1–23
const els = [];
const loadPromises = [];

for (let i = 1; i <= 23; i++) {
  const el = document.createElement('img');
  el.src = `elements/frame-${i}.png`;
  el.className = 'draggable entrance';
  el.dataset.id = `frame-${i}`;

  const lay = initialLayout[`frame-${i}`];
  el.style.left  = lay.x + 'px';
  el.style.top   = lay.y + 'px';
  el.style.width = lay.w + 'px';

  stage.appendChild(el);
  els.push(el);

  // รอโหลดรูป
  loadPromises.push(new Promise(res => {
    if (el.complete) return res();
    el.onload = () => res();
    el.onerror = () => res(); // error ก็ถือว่าโหลดเสร็จเพื่อไม่ค้าง
  }));
}

// -------- Pan + Zoom ----------
let scale = 0.5;          // 🔥 เริ่มซูมออก 50%
let originX = 0, originY = 0;
let isPanning = false, startX = 0, startY = 0;

function updateStage() {
  stage.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}

canvas.addEventListener('mousedown', (e) => {
  if (e.target === canvas || e.target === stage) {
    isPanning = true;
    startX = e.clientX - originX;
    startY = e.clientY - originY;
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  originX = e.clientX - startX;
  originY = e.clientY - startY;
  updateStage();
});
canvas.addEventListener('mouseup',   () => isPanning = false);
canvas.addEventListener('mouseleave',() => isPanning = false);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const prev = scale;
  const delta = -e.deltaY * 0.001;
  scale = Math.min(Math.max(0.3, scale + delta), 3);

  // โฟกัสซูมตรงตำแหน่งเมาส์
  const rect = stage.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / prev;
  const my = (e.clientY - rect.top)  / prev;
  originX = e.clientX - mx * scale;
  originY = e.clientY - my * scale;

  updateStage();
}, { passive:false });

// ---------- Center on content (หลังรูปโหลดครบ) ----------
Promise.all(loadPromises).then(() => {
  centerStageOnContent();   // จัดกึ่งกลางครั้งแรก
  updateStage();
  // ถ้าชอบให้จัดใหม่เมื่อ resize จอ:
  window.addEventListener('resize', () => {
    // centerStageOnContent(); // uncomment ถ้าอยาก recenter auto ตอน resize
  });
});

function centerStageOnContent() {
  if (els.length === 0) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  els.forEach(el => {
    const left = el.offsetLeft;
    const top  = el.offsetTop;
    const w    = el.offsetWidth;
    const h    = el.offsetHeight;
    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, left + w);
    maxY = Math.max(maxY, top  + h);
  });

  const contentW = maxX - minX;
  const contentH = maxY - minY;

  const viewW = canvas.clientWidth;
  const viewH = canvas.clientHeight;

  // จุดศูนย์กลางของคอนเทนต์ (ในพิกัด stage)
  const contentCx = minX + contentW / 2;
  const contentCy = minY + contentH / 2;

  // ต้องการให้จุดนี้ไปอยู่ที่กลาง viewport
  originX = (viewW / 2) - (contentCx * scale);
  originY = (viewH / 2) - (contentCy * scale);
}

// ---------- Drag + Resize + Selection ----------
let active = null;
let offsetX = 0, offsetY = 0;
let selection = null;

stage.addEventListener('mousedown', (e) => {
  const t = e.target;
  if (t.classList.contains('draggable')) {
    active = t;
    const rect = active.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // add selection frame
    addSelection(active);

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup',   endDrag);
  }
});

function drag(e) {
  if (!active) return;
  const stageRect = stage.getBoundingClientRect();
  const x = (e.clientX - offsetX - stageRect.left) / scale;
  const y = (e.clientY - offsetY - stageRect.top)  / scale;
  active.style.left = x + 'px';
  active.style.top  = y + 'px';
  updateSelection(active);
}

function endDrag() {
  active = null;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup',   endDrag);
}

function addSelection(el) {
  removeSelection();
  selection = document.createElement('div');
  selection.className = 'selection';

  ['nw','ne','sw','se'].forEach(pos => {
    const h = document.createElement('div');
    h.className = 'handle ' + pos;
    h.addEventListener('mousedown', (e) => startResize(e, el, pos));
    selection.appendChild(h);
  });

  stage.appendChild(selection);
  updateSelection(el);
}

function updateSelection(el) {
  if (!selection) return;
  const stageRect = stage.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  selection.style.left   = (rect.left - stageRect.left) / scale + 'px';
  selection.style.top    = (rect.top  - stageRect.top)  / scale + 'px';
  selection.style.width  = rect.width  / scale + 'px';
  selection.style.height = rect.height / scale + 'px';
}

function removeSelection() {
  if (selection) selection.remove();
  selection = null;
}

// -------- Resize --------
let resizing = null;
function startResize(e, el, corner) {
  e.stopPropagation();
  resizing = {
    el, corner,
    startX: e.clientX,
    startY: e.clientY,
    startW: el.offsetWidth,
    startH: el.offsetHeight
  };
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup',   endResize);
}
function resize(e) {
  if (!resizing) return;
  const { el, corner, startX, startY, startW, startH } = resizing;
  const dx = (e.clientX - startX) / scale;
  const dy = (e.clientY - startY) / scale;

  if (corner.includes('e')) el.style.width  = (startW + dx) + 'px';
  if (corner.includes('s')) el.style.height = (startH + dy) + 'px';

  updateSelection(el);
}
function endResize() {
  resizing = null;
  document.removeEventListener('mousemove', resize);
  document.removeEventListener('mouseup',   endResize);
}

// -------- Export layout (พิมพ์ใน Console: exportLayout()) --------
window.exportLayout = function () {
  const obj = {};
  document.querySelectorAll('.draggable').forEach(el => {
    obj[el.dataset.id] = {
      x: parseFloat(el.style.left)  || 0,
      y: parseFloat(el.style.top)   || 0,
      w: parseFloat(el.style.width) || 0
    };
  });
  console.log(JSON.stringify(obj, null, 2));
  return obj;
};

