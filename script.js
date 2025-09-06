// =========================
// Canvas Playground — JS (Responsive Desktop/Mobile)
// =========================

// -------- Desktop layout (ตำแหน่งล่าสุดที่คุณให้มา) --------
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

// -------- Mobile layout (จัดใหม่ให้อ่านง่ายในแนวตั้ง) --------
// สร้างแบบไดนามิกเป็น "กริด" 3 คอลัมน์ จัดกลางอัตโนมัติ
function computeMobileLayout() {
  const L = {};
  const cols   = 3;          // จำนวนคอลัมน์ในแนวตั้ง
  const w      = 260;        // ความกว้างเริ่มต้นของแต่ละรูป
  const gapX   = 120;        // ช่องว่างแนวนอน
  const gapY   = 140;        // ช่องว่างแนวตั้ง
  const total  = 23;

  // คำนวณ offset ให้อยู่กลางประมาณจอ 1080x1920 (จะ center อีกชั้นตอน render)
  const gridW  = cols * w + (cols - 1) * gapX;
  const startX = -gridW / 2; // ให้จุด 0 อยู่กลางเวที

  for (let i = 1; i <= total; i++) {
    const idx = i - 1;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = startX + col * (w + gapX);
    const y = -450 + row * (w + gapY); // ขยับขึ้นนิด ให้พื้นที่ด้านล่างพอ hint
    L[`frame-${i}`] = { x, y, w };
  }
  return L;
}

// -------- สลับ layout ตามหน้าจอ --------
const isMobile = window.matchMedia('(max-width: 640px)').matches;
const initialLayout = isMobile ? computeMobileLayout() : desktopLayout;

// -------- เตรียม DOM --------
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
  stage.appendChild(el);
  els.push(el);
  loadPromises.push(new Promise(res => {
    if (el.complete) return res();
    el.onload = () => res();
    el.onerror = () => res();
  }));
}

// ใส่ layout ลง element
function applyLayout(layout) {
  els.forEach(el => {
    const id = el.dataset.id;
    const lay = layout[id];
    if (!lay) return;
    el.style.left  = lay.x + 'px';
    el.style.top   = lay.y + 'px';
    el.style.width = lay.w + 'px';
  });
}
applyLayout(initialLayout);

// -------- Pan / Zoom (Pointer-friendly) --------
let scale   = isMobile ? 0.6 : 0.5;  // mobile ซูมเข้ามาหน่อย
let originX = 0, originY = 0;

function applyTransform() {
  stage.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}
applyTransform();

const pointerMap = new Map();
function getXY(e){ return {x:e.clientX, y:e.clientY}; }
function pinchInfo(){
  const pts = [...pointerMap.values()];
  if (pts.length < 2) return null;
  const [a,b] = pts;
  const cx=(a.x+b.x)/2, cy=(a.y+b.y)/2;
  const dist=Math.hypot(b.x-a.x,b.y-a.y);
  return {cx,cy,dist};
}

// จัดกึ่งกลางให้กลุ่ม element อยู่กลาง viewport
function centerStageOnContent(){
  if (!els.length) return;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  els.forEach(el=>{
    const l=el.offsetLeft,t=el.offsetTop,w=el.offsetWidth,h=el.offsetHeight;
    minX=Math.min(minX,l);                minY=Math.min(minY,t);
    maxX=Math.max(maxX,l+w);              maxY=Math.max(maxY,t+h);
  });
  const contentW=maxX-minX, contentH=maxY-minY;
  const viewW=canvas.clientWidth, viewH=canvas.clientHeight;
  const cx=minX+contentW/2, cy=minY+contentH/2;
  originX=(viewW/2)-(cx*scale);
  originY=(viewH/2)-(cy*scale);
  applyTransform();
}

Promise.all(loadPromises).then(centerStageOnContent);

// ----- Selection / Drag / Resize -----
let selection=null; let activeDrag=null; let dragOffset={x:0,y:0};
let userInteracted=false; // กัน reflow layout อัตโนมัติหลังผู้ใช้เริ่มเล่น

function addSelection(el){
  removeSelection();
  selection=document.createElement('div');
  selection.className='selection';
  ['nw','ne','sw','se'].forEach(pos=>{
    const h=document.createElement('div');
    h.className='handle '+pos;
    h.addEventListener('pointerdown',e=>startResize(e,el,pos));
    selection.appendChild(h);
  });
  stage.appendChild(selection);
  updateSelection(el);
}
function updateSelection(el){
  if(!selection) return;
  const s=stage.getBoundingClientRect();
  const r=el.getBoundingClientRect();
  selection.style.left=(r.left-s.left)/scale+'px';
  selection.style.top =(r.top -s.top )/scale+'px';
  selection.style.width =r.width /scale+'px';
  selection.style.height=r.height/scale+'px';
}
function removeSelection(){ if(selection) selection.remove(); selection=null; }

let resizing=null;
function startResize(e,el,corner){
  e.stopPropagation(); userInteracted=true;
  el.setPointerCapture(e.pointerId);
  resizing={el,corner,startX:e.clientX,startY:e.clientY,startW:el.offsetWidth,startH:el.offsetHeight};
  window.addEventListener('pointermove',onResizeMove,{passive:false});
  window.addEventListener('pointerup',endResize,{passive:true});
}
function onResizeMove(e){
  if(!resizing) return; e.preventDefault();
  const {el,corner,startX,startY,startW,startH}=resizing;
  const dx=(e.clientX-startX)/scale, dy=(e.clientY-startY)/scale;
  if(corner.includes('e')) el.style.width =(startW+dx)+'px';
  if(corner.includes('s')) el.style.height=(startH+dy)+'px';
  updateSelection(el);
}
function endResize(){
  resizing=null;
  window.removeEventListener('pointermove',onResizeMove);
  window.removeEventListener('pointerup',endResize);
}

// ----- Pointer flow: drag / pan / pinch -----
canvas.addEventListener('pointerdown', (e)=>{
  pointerMap.set(e.pointerId, getXY(e));
  if(e.target.classList?.contains('draggable') && pointerMap.size===1){
    userInteracted=true;
    activeDrag=e.target;
    const r=activeDrag.getBoundingClientRect();
    dragOffset.x=e.clientX-r.left; dragOffset.y=e.clientY-r.top;
    addSelection(activeDrag);
    activeDrag.setPointerCapture(e.pointerId);
  }
  e.preventDefault();
},{passive:false});

canvas.addEventListener('pointermove',(e)=>{
  pointerMap.set(e.pointerId, getXY(e));
  if(resizing) return;
  // pinch
  if(pointerMap.size>=2){
    const info=pinchInfo(); if(!info) return;
    if(!canvas._pinch){
      canvas._pinch={startDist:info.dist,startScale:scale,rect:stage.getBoundingClientRect(),cx:info.cx,cy:info.cy};
    }else{
      const k=info.dist/canvas._pinch.startDist;
      const newScale=Math.min(Math.max(0.3, canvas._pinch.startScale*k), 3);
      const prev=scale; scale=newScale;
      const mx=(canvas._pinch.cx-canvas._pinch.rect.left)/prev;
      const my=(canvas._pinch.cy-canvas._pinch.rect.top )/prev;
      originX=canvas._pinch.cx - mx*scale;
      originY=canvas._pinch.cy - my*scale;
      applyTransform(); updateSelection(activeDrag);
    }
    e.preventDefault(); return;
  }
  // drag one finger on element
  if(activeDrag && pointerMap.size===1){
    const s=stage.getBoundingClientRect();
    const x=(e.clientX-dragOffset.x-s.left)/scale;
    const y=(e.clientY-dragOffset.y-s.top )/scale;
    activeDrag.style.left=x+'px'; activeDrag.style.top=y+'px';
    updateSelection(activeDrag); e.preventDefault(); return;
  }
  // pan background
  if(!activeDrag && pointerMap.size===1){
    const prev=canvas._panPrev||getXY(e);
    originX+=(e.clientX-prev.x); originY+=(e.clientY-prev.y);
    canvas._panPrev=getXY(e); applyTransform(); e.preventDefault(); return;
  }
},{passive:false});

canvas.addEventListener('pointerup',(e)=>{
  pointerMap.delete(e.pointerId);
  if(activeDrag){ try{ activeDrag.releasePointerCapture(e.pointerId);}catch{} }
  if(pointerMap.size<2) canvas._pinch=null;
  if(pointerMap.size===0){ activeDrag=null; canvas._panPrev=null; }
},{passive:true});

canvas.addEventListener('pointercancel',(e)=>{
  pointerMap.delete(e.pointerId);
  canvas._pinch=null; canvas._panPrev=null; activeDrag=null;
},{passive:true});

// wheel zoom (desktop)
canvas.addEventListener('wheel',(e)=>{
  e.preventDefault();
  const prev=scale, delta=-e.deltaY*0.001;
  scale=Math.min(Math.max(0.3, scale+delta), 3);
  const r=stage.getBoundingClientRect();
  const mx=(e.clientX-r.left)/prev, my=(e.clientY-r.top)/prev;
  originX=e.clientX - mx*scale; originY=e.clientY - my*scale;
  applyTransform();
},{passive:false});

// ----- Reflow เมื่อขนาดจอข้าม breakpoint (ก่อนผู้ใช้เริ่มเล่นเท่านั้น) -----
const mq = window.matchMedia('(max-width: 640px)');
mq.addEventListener?.('change', (ev)=>{
  if(userInteracted) return; // ถ้าเริ่มเล่นแล้ว ไม่เปลี่ยน layout อัตโนมัติ
  const layout = ev.matches ? computeMobileLayout() : desktopLayout;
  applyLayout(layout);
  centerStageOnContent();
});

// ----- Export layout (พิมพ์ใน Console: exportLayout()) -----
window.exportLayout = function(){
  const obj = {};
  document.querySelectorAll('.draggable').forEach(el=>{
    obj[el.dataset.id] = {
      x: parseFloat(el.style.left)  || 0,
      y: parseFloat(el.style.top)   || 0,
      w: parseFloat(el.style.width) || 0
    };
  });
  console.log(JSON.stringify(obj, null, 2));
  return obj;
};

// ----- Optional: บังคับโหมดผ่าน query (?mobile / ?desktop) -----
(function enforceByQuery(){
  const q = new URLSearchParams(location.search);
  if(q.has('mobile') || q.has('desktop')){
    const layout = q.has('mobile') ? computeMobileLayout() : desktopLayout;
    applyLayout(layout);
    centerStageOnContent();
  }
})();
