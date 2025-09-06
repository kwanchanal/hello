// =========================
// Canvas Playground — Full JS (fixed pan logic + anti-stuck)
// =========================

// ---------- Desktop layout (fixed) ----------
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

// ---------- Mobile layout (random every load) ----------
function computeMobileLayoutRandom() {
  const ids = Array.from({ length: 23 }, (_, i) => `frame-${i + 1}`);
  const baseWMin = 210, baseWMax = 300;
  const minDist = 250, tries = 600;
  const R_x = 750, R_y = 950;

  function rand() { return Math.random(); }
  function randomInEllipse() {
    const theta = rand() * Math.PI * 2;
    const r = Math.sqrt(rand());
    return { x: Math.cos(theta) * R_x * r, y: Math.sin(theta) * R_y * r };
  }
  const placed = [], layout = {};
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

// ---------- Choose layout ----------
const isMobile = window.matchMedia('(max-width: 640px)').matches;
const initialLayout = isMobile ? computeMobileLayoutRandom() : desktopLayout;

// ---------- DOM ----------
const canvas = document.getElementById('canvas');
const stage  = document.getElementById('stage');

const els = [];
const loadPromises = [];
for (let i = 1; i <= 23; i++) {
  const el = document.createElement('img');
  el.src = `elements/frame-${i}.png`;
  el.className = 'draggable entrance';
  el.dataset.id = `frame-${i}`;
  el.draggable = false; // kill native image-drag
  el.addEventListener('dragstart', e => e.preventDefault());
  stage.appendChild(el);
  els.push(el);
  loadPromises.push(new Promise(res => {
    if (el.complete) return res();
    el.onload = () => res();
    el.onerror = () => res();
  }));
}

function applyLayout(layout) {
  els.forEach(el => {
    const lay = layout[el.dataset.id];
    if (!lay) return;
    el.style.left  = lay.x + 'px';
    el.style.top   = lay.y + 'px';
    el.style.width = lay.w + 'px';
    el.style.removeProperty('height');
  });
}
applyLayout(initialLayout);

// ---------- Pan / Zoom ----------
let scale   = isMobile ? 0.6 : 0.5;
let originX = 0, originY = 0;
function applyTransform() {
  stage.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}
applyTransform();

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
Promise.all(loadPromises).then(centerStageOnContent);

// =====================================================
//        Pointer handling (no pan unless mouse down)
// =====================================================
const pointerMap = new Map();
function getXY(e){ return {x:e.clientX, y:e.clientY}; }
function pinchInfo(){
  const pts=[...pointerMap.values()];
  if(pts.length<2) return null;
  const [a,b]=pts;
  return { cx:(a.x+b.x)/2, cy:(a.y+b.y)/2, dist:Math.hypot(b.x-a.x,b.y-a.y) };
}

let selection=null, activeDrag=null, dragOffset={x:0,y:0}, userInteracted=false;
let resizing=null;
let dragPointerId=null;

// NEW: explicit pan state
let panActive = false;
let panPointerId = null;

// selection frame + handles
function addSelection(el){
  removeSelection();
  selection=document.createElement('div');
  selection.className='selection';
  ['nw','ne','sw','se'].forEach(pos=>{
    const h=document.createElement('div');
    h.className='handle '+pos;
    h.addEventListener('pointerdown',e=>startResize(e,el,pos), {passive:false});
    selection.appendChild(h);
  });
  stage.appendChild(selection);
  updateSelection(el);
}
function updateSelection(el){
  if(!selection) return;
  const s=stage.getBoundingClientRect(), r=el.getBoundingClientRect();
  selection.style.left=(r.left-s.left)/scale+'px';
  selection.style.top =(r.top -s.top )/scale+'px';
  selection.style.width =r.width /scale+'px';
  selection.style.height=r.height/scale+'px';
}
function removeSelection(){ if(selection) selection.remove(); selection=null; }

function startResize(e,el,corner){
  e.stopPropagation(); e.preventDefault(); userInteracted=true;
  try{ canvas.setPointerCapture(e.pointerId); }catch{}
  resizing={el,corner,startX:e.clientX,startY:e.clientY,startW:el.offsetWidth,startH:el.offsetHeight};
  dragPointerId = e.pointerId;
}

function onResizeMove(e){
  if(!resizing) return;
  e.preventDefault();
  const {el,corner,startX,startY,startW,startH}=resizing;
  const dx=(e.clientX-startX)/scale, dy=(e.clientY-startY)/scale;
  if(corner.includes('e')) el.style.width =(startW+dx)+'px';
  if(corner.includes('s')) el.style.height=(startH+dy)+'px';
  updateSelection(el);
}

// เคลียร์สถานะทั้งหมด
function endAllPointers(){
  try {
    if (dragPointerId !== null && canvas.hasPointerCapture?.(dragPointerId)) {
      canvas.releasePointerCapture(dragPointerId);
    }
  } catch {}
  dragPointerId=null;
  resizing=null;
  activeDrag=null;
  panActive=false;
  panPointerId=null;
  canvas._pinch=null;
  canvas._panPrev=null;
  pointerMap.clear();
}

// เริ่มกด
canvas.addEventListener('pointerdown',(e)=>{
  // เก็บเฉพาะ pointer ที่เริ่มกดจริง
  pointerMap.set(e.pointerId, getXY(e));

  // คลิกบน element → drag
  if(e.target.classList?.contains('draggable') && e.buttons===1){
    userInteracted=true;
    activeDrag=e.target;
    const r=activeDrag.getBoundingClientRect();
    dragOffset.x=e.clientX-r.left;
    dragOffset.y=e.clientY-r.top;
    addSelection(activeDrag);
    try{ canvas.setPointerCapture(e.pointerId); }catch{}
    dragPointerId = e.pointerId;
    e.preventDefault();
    return;
  }

  // ไม่ได้คลิก element → เริ่ม pan เฉพาะเมื่อกดปุ่มซ้ายจริง
  if(e.buttons===1){
    panActive = true;
    panPointerId = e.pointerId;
    canvas._panPrev = getXY(e);
    try{ canvas.setPointerCapture(e.pointerId); }catch{}
    dragPointerId = e.pointerId;
    e.preventDefault();
    return;
  }
}, {passive:false});

// ขยับ (window)
window.addEventListener('pointermove',(e)=>{
  // อัปเดตเฉพาะ pointer ที่เรา track อยู่
  if (pointerMap.has(e.pointerId)) {
    pointerMap.set(e.pointerId, getXY(e));
  }

  // ถ้าปล่อยเมาส์แล้ว แต่ยังมี state → เคลียร์
  if (e.pointerType === 'mouse' && e.buttons === 0 && (activeDrag || resizing || panActive)) {
    endAllPointers(); return;
  }

  // resizing
  if (resizing) { onResizeMove(e); return; }

  // pinch (touch ≥ 2 นิ้วเท่านั้น)
  if (pointerMap.size >= 2 && e.pointerType !== 'mouse') {
    const info=pinchInfo(); if(!info) return;
    if(!canvas._pinch){
      canvas._pinch={startDist:info.dist,startScale:scale,rect:stage.getBoundingClientRect(),cx:info.cx,cy:info.cy};
    } else {
      const k=info.dist/canvas._pinch.startDist;
      const newScale=Math.min(Math.max(0.3, canvas._pinch.startScale*k), 3);
      const prev=scale; scale=newScale;
      const mx=(canvas._pinch.cx-canvas._pinch.rect.left)/prev;
      const my=(canvas._pinch.cy-canvas._pinch.rect.top )/prev;
      originX=canvas._pinch.cx - mx*scale;
      originY=canvas._pinch.cy - my*scale;
      applyTransform(); if(activeDrag) updateSelection(activeDrag);
    }
    e.preventDefault();
    return;
  }

  // drag element (ต้องกดปุ่มซ้ายอยู่)
  if (activeDrag && e.buttons===1){
    const s=stage.getBoundingClientRect();
    const x=(e.clientX-dragOffset.x-s.left)/scale;
    const y=(e.clientY-dragOffset.y-s.top )/scale;
    activeDrag.style.left=x+'px';
    activeDrag.style.top =y+'px';
    updateSelection(activeDrag);
    e.preventDefault();
    return;
  }

  // pan canvas (ทำเฉพาะเมื่อ panActive และเป็น pointer เดิม และยังคงกดปุ่ม)
  if (panActive && e.pointerId===panPointerId && e.buttons===1){
    const prev=canvas._panPrev||getXY(e);
    originX += (e.clientX-prev.x);
    originY += (e.clientY-prev.y);
    canvas._panPrev=getXY(e);
    applyTransform();
    e.preventDefault();
    return;
  }
}, {passive:false});

// ปล่อย / ยกเลิก / ออกนอก / blur → เคลียร์
function globalPointerEnd(){ endAllPointers(); }
window.addEventListener('pointerup',        globalPointerEnd, {passive:true});
window.addEventListener('pointercancel',    globalPointerEnd, {passive:true});
window.addEventListener('pointerleave',     globalPointerEnd, {passive:true});
window.addEventListener('pointerout',       globalPointerEnd, {passive:true});
window.addEventListener('mouseup',          globalPointerEnd, {passive:true});
window.addEventListener('mouseleave',       globalPointerEnd, {passive:true});
window.addEventListener('contextmenu',      globalPointerEnd, {passive:true});
window.addEventListener('blur',             globalPointerEnd);
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) globalPointerEnd(); });
canvas.addEventListener('lostpointercapture', globalPointerEnd);

// wheel zoom (desktop)
canvas.addEventListener('wheel',(e)=>{
  e.preventDefault();
  const prev=scale, delta=-e.deltaY*0.001;
  scale=Math.min(Math.max(0.3, scale+delta), 3);
  const r=stage.getBoundingClientRect();
  const mx=(e.clientX-r.left)/prev, my=(e.clientY-r.top)/prev;
  originX=e.clientX - mx*scale;
  originY=e.clientY - my*scale;
  applyTransform();
},{passive:false});

// auto switch layout at breakpoint (only if user hasn't interacted)
const mq = window.matchMedia('(max-width: 640px)');
mq.addEventListener?.('change', (ev)=>{
  if(userInteracted) return;
  const layout = ev.matches ? computeMobileLayoutRandom() : desktopLayout;
  applyLayout(layout);
  centerStageOnContent();
});

// export layout (Console: exportLayout())
window.exportLayout = function(){
  const obj={};
  document.querySelectorAll('.draggable').forEach(el=>{
    obj[el.dataset.id]={
      x: parseFloat(el.style.left)||0,
      y: parseFloat(el.style.top)||0,
      w: parseFloat(el.style.width)||0
    };
  });
  console.log(JSON.stringify(obj,null,2));
  return obj;
};

// dev helper: ?mobile / ?desktop
(function enforceByQuery(){
  const q=new URLSearchParams(location.search);
  if(q.has('mobile') || q.has('desktop')){
    const layout = q.has('desktop') ? desktopLayout : computeMobileLayoutRandom();
    applyLayout(layout);
    centerStageOnContent();
  }
})();
