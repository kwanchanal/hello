// =========================
// Canvas Playground — JS (mobile friendly)
// =========================

// Layout เริ่มต้น (ล่าสุด)
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

// ----- สร้าง elements -----
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

  loadPromises.push(new Promise(res => {
    if (el.complete) return res();
    el.onload = () => res();
    el.onerror = () => res();
  }));
}

// ----- State: pan/zoom -----
let scale = 0.5;             // เริ่มซูมออก 50%
let originX = 0, originY = 0;

function applyTransform() {
  stage.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}
applyTransform();

// ----- Utilities -----
const pointerMap = new Map();   // pointerId -> {x,y}
function getPointerXY(e) { return { x: e.clientX, y: e.clientY }; }

// คิดศูนย์กลางและระยะของสองจุด (สำหรับ pinch)
function pinchInfo() {
  const pts = [...pointerMap.values()];
  if (pts.length < 2) return null;
  const [p1, p2] = pts;
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  return { cx, cy, dist };
}

// จัดกึ่งกลางให้คอนเทนต์อยู่กลาง viewport
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

  const contentCx = minX + contentW / 2;
  const contentCy = minY + contentH / 2;

  originX = (viewW / 2) - (contentCx * scale);
  originY = (viewH / 2) - (contentCy * scale);
  applyTransform();
}

// หลังรูปโหลดครบ ค่อย center
Promise.all(loadPromises).then(() => {
  centerStageOnContent();
});

// ----- Selection / Drag / Resize -----
let selection = null;
let activeDrag = null;
let dragOffset = { x:0, y:0 };

function addSelection(el) {
  removeSelection();
  selection = document.createElement('div');
  selection.className = 'selection';

  ['nw','ne','sw','se'].forEach(pos => {
    const h = document.createElement('div');
    h.className = 'handle ' + pos;
    h.addEventListener('pointerdown', e => startResize(e, el, pos));
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

// Resize
let resizing = null;
function startResize(e, el, corner) {
  e.stopPropagation();
  el.setPointerCapture(e.pointerId);
  resizing = {
    el, corner,
    startX: e.clientX,
    startY: e.clientY,
    startW: el.offsetWidth,
    startH: el.offsetHeight
  };
  window.addEventListener('pointermove', onResizeMove, { passive:false });
  window.addEventListener('pointerup',   endResize,     { passive:true  });
}
function onResizeMove(e) {
  if (!resizing) return;
  e.preventDefault();
  const { el, corner, startX, startY, startW, startH } = resizing;
  const dx = (e.clientX - startX) / scale;
  const dy = (e.clientY - startY) / scale;
  if (corner.includes('e')) el.style.width  = (startW + dx) + 'px';
  if (corner.includes('s')) el.style.height = (startH + dy) + 'px';
  updateSelection(el);
}
function endResize() {
  resizing = null;
  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup',   endResize);
}

// ----- Pointer Events: pan / drag / pinch -----

// เริ่มกด
canvas.addEventListener('pointerdown', (e) => {
  // เก็บทุก pointer ไว้ก่อน (เพื่อรู้ว่าเป็น pinch หรือไม่)
  pointerMap.set(e.pointerId, getPointerXY(e));

  // ถ้าแตะบน element → drag
  if (e.target.classList && e.target.classList.contains('draggable') && pointerMap.size === 1) {
    activeDrag = e.target;
    const rect = activeDrag.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    dragOffset.x = (e.clientX - rect.left);
    dragOffset.y = (e.clientY - rect.top);

    addSelection(activeDrag);
    activeDrag.setPointerCapture(e.pointerId);
  }

  // กันเบราว์เซอร์ scroll/zoom เอง
  e.preventDefault();
}, { passive:false });

// ระหว่างลาก/แพน/พินช์
canvas.addEventListener('pointermove', (e) => {
  // อัปเดตตำแหน่ง pointer ปัจจุบัน
  pointerMap.set(e.pointerId, getPointerXY(e));

  if (resizing) return; // ถ้ากำลังรีไซส์ ให้ onResizeMove จัดการ

  // โหมด pinch (2 นิ้ว)
  if (pointerMap.size >= 2) {
    const info = pinchInfo();
    if (!info) return;

    // เก็บค่า static ครั้งแรกของ pinch
    if (!canvas._pinch) {
      canvas._pinch = {
        startDist: info.dist,
        startScale: scale,
        // คำนวณให้ซูมรอบจุดกลางของสองนิ้ว
        stageRect: stage.getBoundingClientRect(),
        centerX: info.cx,
        centerY: info.cy
      };
    } else {
      const k = info.dist / canvas._pinch.startDist;
      const newScale = Math.min(Math.max(0.3, canvas._pinch.startScale * k), 3);

      // รักษาจุดกลางไว้ที่เดิม (zoom to focal point)
      const prev = scale;
      scale = newScale;
      const mx = (canvas._pinch.centerX - canvas._pinch.stageRect.left) / prev;
      const my = (canvas._pinch.centerY - canvas._pinch.stageRect.top)  / prev;
      originX = canvas._pinch.centerX - mx * scale;
      originY = canvas._pinch.centerY - my * scale;
      applyTransform();
      updateSelection(activeDrag);
    }
    e.preventDefault();
    return;
  }

  // โหมด drag (นิ้วเดียวบน element)
  if (activeDrag && pointerMap.size === 1) {
    const stageRect = stage.getBoundingClientRect();
    const x = (e.clientX - dragOffset.x - stageRect.left) / scale;
    const y = (e.clientY - dragOffset.y - stageRect.top)  / scale;
    activeDrag.style.left = x + 'px';
    activeDrag.style.top  = y + 'px';
    updateSelection(activeDrag);
    e.preventDefault();
    return;
  }

  // โหมด pan (นิ้วเดียวบนพื้นหลัง)
  if (!activeDrag && pointerMap.size === 1) {
    // ใช้วิธี delta จากครั้งก่อน
    const prev = canvas._panPrev || getPointerXY(e);
    originX += (e.clientX - prev.x);
    originY += (e.clientY - prev.y);
    canvas._panPrev = getPointerXY(e);
    applyTransform();
    e.preventDefault();
    return;
  }
}, { passive:false });

// ปล่อยนิ้ว/เมาส์
canvas.addEventListener('pointerup', (e) => {
  pointerMap.delete(e.pointerId);
  if (activeDrag) {
    try { activeDrag.releasePointerCapture(e.pointerId); } catch {}
  }
  if (pointerMap.size < 2) canvas._pinch = null;
  if (pointerMap.size === 0) {
    activeDrag = null;
    canvas._panPrev = null;
  }
}, { passive:true });

canvas.addEventListener('pointercancel', (e) => {
  pointerMap.delete(e.pointerId);
  canvas._pinch = null;
  canvas._panPrev = null;
  activeDrag = null;
}, { passive:true });

// ----- Wheel zoom สำหรับ desktop -----
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const prev = scale;
  const delta = -e.deltaY * 0.001;
  scale = Math.min(Math.max(0.3, scale + delta), 3);

  const rect = stage.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / prev;
  const my = (e.clientY - rect.top)  / prev;
  originX = e.clientX - mx * scale;
  originY = e.clientY - my * scale;

  applyTransform();
}, { passive:false });

// ----- Export layout (พิมพ์ใน Console: exportLayout()) -----
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
