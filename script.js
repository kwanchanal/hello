// =========================
// Canvas Playground — JS (Desktop fixed + Mobile random-looking)
// =========================

// ---------- DESKTOP LAYOUT (คงที่ตามที่ให้มา) ----------
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

// ---------- MOBILE LAYOUT: “สุ่มดูมั่วๆ” (deterministic) ----------
/**
 * ใช้ PRNG แบบมี seed เพื่อให้ "สุ่มแต่คงที่" ทุกครั้งที่ผู้ใช้เปิด
 * (จะให้สุ่มใหม่จริงๆ ให้ใส่ ?shuffle ที่ URL)
 */
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function computeMobileLayoutRandom() {
  // seed คงที่ เว้นแต่ใส่ ?shuffle
  const q = new URLSearchParams(location.search);
  const seed = q.has('shuffle') ? (Date.now() & 0xffffffff) : 0xBEEF2025;
  const rand = mulberry32(seed);

  const ids = Array.from({length:23}, (_,i)=>`frame-${i+1}`);

  // ขนาดพื้นฐาน + สุ่มนิดหน่อย
  const baseWMin = 210, baseWMax = 300;

  // เราจะวางตำแหน่งแบบ radial (กระจายรอบๆ center) + กันชนขั้นต่ำ
  const minDist = 250;          // ระยะกันชนระหว่างจุด (ยิ่งมากยิ่งเว้น)
  const tries   = 600;          // จำนวนครั้งสูงสุดที่พยายามวางแต่ละชิ้น

  // พื้นที่วงรีสำหรับสุ่ม (จะถูก center อีกทีตอน render)
  // ปรับคร่าวๆ ให้เข้ากับมือถือแนวตั้ง
  const R_x = 750;              // รัศมีแนวนอน
  const R_y = 950;              // รัศมีแนวตั้ง

  const placed = [];            // เก็บจุดที่วางแล้ว
  const layout = {};

  function randomInEllipse() {
    // มุมสุ่ม + radius แบบ bias ไปกลาง (sqrt)
    const theta = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()); // ทำให้กระจุกกลางมากขึ้น
    const x = Math.cos(theta) * R_x * r;
    const y = Math.sin(theta) * R_y * r;
    return {x, y};
  }

  function farEnough(x, y) {
    for (const p of placed) {
      const dx = x - p.x;
      const dy = y - p.y;
      if (Math.hypot(dx, dy) < minDist) return false;
    }
    return true;
  }

  ids.forEach((id) => {
    const w = baseWMin + rand() * (baseWMax - baseWMin);
    let pos = null;
    for (let t = 0; t < tries; t++) {
      const p = randomInEllipse();
      if (farEnough(p.x, p.y)) { pos = p; break; }
    }
    // ถ้าเต็มที่แล้วยังชน ก็ยอมวางทับได้บ้าง
    if (!pos) pos = randomInEllipse();

    placed.push(pos);
    // ศูนย์ (0,0) คือกลางเวที เราเลยไม่ต้องลบ/บวก offset อะไร
    layout[id] = { x: pos.x, y: pos.y, w };
  });

  return layout;
}

// ---------- เลือก layout ตามหน้าจอ ----------
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
    const id = el.dataset.id;
    const lay = layout[id];
    if (!lay) return;
    el.style.left  = lay.x + 'px';
    el.style.top   = lay.y + 'px';
    el.style.width = lay.w + 'px';
  });
}
applyLayout(initialLayout);

// ---------- Pan / Zoom ----------
let scale   = isMobile ? 0.6 : 0.5;  // มือถือซูมเข้าเล็กน้อย
let originX = 0, originY = 0;

function applyTransform() {
  stage.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}
applyTransform();

// จัดให้ content อยู่กลางจอ
function centerStageOnContent(){
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

// pointer helpers
const pointerMap = new Map();
function getXY(e){ return {x:e.clientX, y:e.clientY}; }
function pinchInfo(){
  const pts=[...pointerMap.values()];
  if(pts.length<2) return null;
  const [a,b]=pts; const cx=(a.x+b.x)/2, cy=(a.y+b.y)/2;
  return {cx,cy,dist:Math.hypot(b.x-a.x,b.y-a.y)};
}

let selection=null, activeDrag=null, dragOffset={x:0,y:0}, userInteracted=false;

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

// pointer flow
canvas.addEventListener('pointerdown',(e)=>{
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

  // drag element
  if(activeDrag && pointerMap.size===1){
    const s=stage.getBoundingClientRect();
    const x=(e.clientX-dragOffset.x-s.left)/scale;
    const y=(e.clientY-dragOffset.y-s.top )/scale;
    activeDrag.style.left=x+'px'; activeDrag.style.top=y+'px';
    updateSelection(activeDrag); e.preventDefault(); return;
  }

  // pan
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

// เปลี่ยนเลย์เอาต์เมื่อข้าม breakpoint (ถ้ายังไม่เล่น)
const mq = window.matchMedia('(max-width: 640px)');
mq.addEventListener?.('change', (ev)=>{
  if(userInteracted) return;
  const layout = ev.matches ? computeMobileLayoutRandom() : desktopLayout;
  applyLayout(layout);
  centerStageOnContent();
});

// Export layout (พิมพ์ใน Console: exportLayout())
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

// Dev helper: ?mobile / ?desktop / ?shuffle
(function enforceByQuery(){
  const q=new URLSearchParams(location.search);
  if(q.has('mobile') || q.has('desktop') || q.has('shuffle')){
    const layout = q.has('desktop') ? desktopLayout : computeMobileLayoutRandom();
    applyLayout(layout);
    centerStageOnContent();
  }
})();

