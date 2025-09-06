/* ============================
   Canvas Playground – script.js
   ============================ */

/* ===== CONFIG ===== */
// PERSIST=false = ล็อกเลย์เอาต์เริ่มต้นให้ทุกคนเห็นเหมือนกัน
// PERSIST=true  = โหมดแก้ของเราเอง (ลาก/ย่อแล้วเก็บลง localStorage)
const PERSIST = false;

// จำนวนรูป + นามสกุล + สร้าง path
const COUNT = 23;
const EXT   = "png";
const pathFor = i => `elements/frame-${i}.${EXT}`;

// วาง JSON จาก exportLayout() ของคุณตรงนี้เพื่อ "แช่แข็ง" หน้าเริ่มต้น
const DEFAULT_LAYOUT = {
  /* ตัวอย่างโครง:
  "frame-1": { "x": 120, "y": 150, "w": 300 },
  "frame-2": { "x": 420, "y": 160, "w": 280 }
  */
};

const BASE_W = 300;
const MIN_W  = 60;

/* ===== DOM ===== */
const canvas = document.getElementById('canvas');
const stage  = document.getElementById('stage');

/* ===== Utils ===== */
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

/* ===== Put all images on stage ===== */
(function addImages(){
  const saved = PERSIST ? JSON.parse(localStorage.getItem("canvas_positions_v1")||"{}") : {};
  const COLS=6, GAP=140, START_X=120, START_Y=120;

  for(let i=1;i<=COUNT;i++){
    const id  = `frame-${i}`;
    const img = document.createElement("img");
    img.src = pathFor(i);
    img.alt = id;
    img.className = "draggable entrance";
    img.dataset.id = id;
    img.decoding = "async";
    img.loading  = "lazy";
    img.onerror  = () => console.warn("missing image:", img.src);

    // ตำแหน่ง: saved (ถ้าเปิด persist) > DEFAULT_LAYOUT > วางแบบกริด
    const keep = (PERSIST && saved[id]) || DEFAULT_LAYOUT[id];
    if(keep){
      img.style.left  = keep.x + "px";
      img.style.top   = keep.y + "px";
      img.style.width = (keep.w || BASE_W) + "px";
    }else{
      const col=(i-1)%COLS, row=Math.floor((i-1)/COLS);
      img.style.left  = (START_X + col*(BASE_W + GAP*0.6)) + "px";
      img.style.top   = (START_Y  + row*(BASE_W*0.6 + GAP)) + "px";
      img.style.width = BASE_W + "px";
    }

    // staged entrance delay
    const baseDelay=(i-1)*0.04, jitter=Math.random()*0.18;
    img.style.animationDelay = (baseDelay + jitter).toFixed(2) + "s";
    img.addEventListener("animationend", (ev)=>{
      if(ev.animationName==='popIn'){ img.classList.remove('entrance'); img.style.animationDelay=''; }
    });

    stage.appendChild(img);
  }
})();

/* ===== View transform (pan/zoom) ===== */
let scale=0.5, minScale=0.3, maxScale=3, tx=0, ty=0;
const apply = ()=>{ stage.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`; };

function centerStage(){
  const vw=canvas.clientWidth, vh=canvas.clientHeight;
  const sw=stage.offsetWidth*scale, sh=stage.offsetHeight*scale;
  tx=(vw-sw)/2; ty=(vh-sh)/2; apply();
}
window.addEventListener('resize', centerStage);
requestAnimationFrame(centerStage);

// zoom desktop: Ctrl/Cmd + wheel
canvas.addEventListener('wheel',(e)=>{
  const zooming=e.ctrlKey||e.metaKey; if(!zooming) return;
  e.preventDefault();
  const r=canvas.getBoundingClientRect(), cx=e.clientX-r.left, cy=e.clientY-r.top;
  zoomAt(cx,cy, Math.exp(-e.deltaY*0.0018));
},{passive:false});

function zoomAt(cx, cy, factor){
  const wx=(cx-tx)/scale, wy=(cy-ty)/scale;
  const ns=clamp(scale*factor, minScale, maxScale);
  tx = cx - wx*ns; ty = cy - wy*ns; scale = ns; apply();
}

// mobile double tap reset
let lastTap=0;
canvas.addEventListener('pointerdown',(e)=>{
  if(e.pointerType!=='mouse'){
    const t=Date.now();
    if(t-lastTap<300 && e.target===canvas){ scale=0.5; centerStage(); }
    lastTap=t;
  }
});

/* ===== Selection + Resize (Figma-like) ===== */
let selBox=null, selected=null;
function ensureSelBox(){
  if(selBox) return;
  selBox = document.createElement('div');
  selBox.className='selection';
  ["nw","ne","sw","se"].forEach(pos=>{
    const h=document.createElement('div');
    h.className=`handle ${pos}`; h.dataset.pos=pos;
    h.addEventListener('pointerdown', startResize);
    selBox.appendChild(h);
  });
  stage.appendChild(selBox);
}
function getRatio(el){
  return el.naturalWidth ? el.naturalHeight/el.naturalWidth :
         (el.getBoundingClientRect().height/el.getBoundingClientRect().width || 1);
}
function updateSelBox(){
  if(!selected||!selBox) return;
  const x=parseFloat(selected.style.left)||0;
  const y=parseFloat(selected.style.top)||0;
  const w=parseFloat(selected.style.width)||BASE_W;
  const h=w*getRatio(selected);
  selBox.style.left=x+'px'; selBox.style.top=y+'px'; selBox.style.width=w+'px'; selBox.style.height=h+'px';
  selBox.style.display='block';
}
function clearSelection(){ selected=null; if(selBox) selBox.style.display='none'; }
function select(el){ if(selected!==el){ ensureSelBox(); selected=el; updateSelBox(); } }

/* ===== Pointer gestures (drag/pan/pinch + resize) ===== */
const pointers=new Map();
let panning=false, panStart={tx:0,ty:0,x:0,y:0};
let dragging=null, dragStart={x:0,y:0,ox:0,oy:0};
let resizing=false, resizePos=null, rOrig={x:0,y:0,w:0,ratio:1};

canvas.addEventListener('pointerdown',(e)=>{
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,target:e.target});
  if(e.target.classList.contains('handle')) return;

  if(e.target.classList.contains('draggable')){
    dragging=e.target;
    select(dragging);
    dragging.setPointerCapture(e.pointerId);
    const wx=(e.clientX-tx)/scale, wy=(e.clientY-ty)/scale;
    dragStart={ x:wx, y:wy, ox:parseFloat(dragging.style.left)||0, oy:parseFloat(dragging.style.top)||0 };
  }else if(e.target===canvas){
    clearSelection();
    panning=true; panStart={tx,ty,x:e.clientX,y:e.clientY};
  }
},{passive:false});

canvas.addEventListener('pointermove',(e)=>{
  const p=pointers.get(e.pointerId); if(!p) return;
  p.x=e.clientX; p.y=e.clientY;

  if(dragging){
    e.preventDefault();
    const wx=(e.clientX-tx)/scale, wy=(e.clientY-ty)/scale;
    dragging.style.left = (dragStart.ox + (wx-dragStart.x))+'px';
    dragging.style.top  = (dragStart.oy + (wy-dragStart.y))+'px';
    updateSelBox();
    return;
  }
  if(panning){
    e.preventDefault();
    tx = panStart.tx + (e.clientX - panStart.x);
    ty = panStart.ty + (e.clientY - panStart.y);
    apply();
  }
},{passive:false});

window.addEventListener('pointerup',(e)=>{
  pointers.delete(e.pointerId);
  if(dragging){ dragging.releasePointerCapture?.(e.pointerId); dragging=null; persist(); }
  if(panning){ panning=false; }
  if(resizing) endResize(e);
});
window.addEventListener('pointercancel',(e)=>{
  pointers.delete(e.pointerId);
  dragging=null; panning=false; if(resizing) endResize(e);
});

// resize
function startResize(e){
  e.stopPropagation(); if(!selected) return;
  resizing=true; resizePos=e.currentTarget.dataset.pos;
  selected.setPointerCapture(e.pointerId);
  rOrig={
    x: parseFloat(selected.style.left)||0,
    y: parseFloat(selected.style.top)||0,
    w: parseFloat(selected.style.width)||BASE_W,
    ratio: getRatio(selected)
  };
  selected.dataset._rx=(e.clientX-tx)/scale;
}
function onResizeMove(e){
  if(!resizing||!selected) return;
  const wx=(e.clientX-tx)/scale;
  const dx = wx - (+selected.dataset._rx);
  let newW=rOrig.w, newX=rOrig.x, newY=rOrig.y;

  if(resizePos==='se'){ newW=rOrig.w+dx; }
  else if(resizePos==='ne'){ newW=rOrig.w+dx; newY=rOrig.y + ((rOrig.w*rOrig.ratio) - Math.max(MIN_W,newW)*rOrig.ratio); }
  else if(resizePos==='sw'){ newW=rOrig.w-dx; newX=rOrig.x+(rOrig.w-newW); }
  else if(resizePos==='nw'){ newW=rOrig.w-dx; newX=rOrig.x+(rOrig.w-newW); newY=rOrig.y + ((rOrig.w*rOrig.ratio) - Math.max(MIN_W,newW)*rOrig.ratio); }

  newW=Math.max(MIN_W,newW);
  selected.style.width=newW+'px';
  selected.style.left =newX+'px';
  selected.style.top  =newY+'px';
  updateSelBox();
}
function endResize(e){
  if(!resizing) return;
  resizing=false; selected.releasePointerCapture?.(e.pointerId);
  persist();
}
window.addEventListener('pointermove', onResizeMove, {passive:false});

// คลิกบน stage ที่ว่าง = clear
stage.addEventListener('pointerdown',(e)=>{ if(e.target===stage) clearSelection(); });

/* ===== Persist (เฉพาะตอน PERSIST=true) ===== */
function persist(){
  if(!PERSIST) return;
  const obj={};
  stage.querySelectorAll('.draggable').forEach(el=>{
    obj[el.dataset.id] = {
      x: parseFloat(el.style.left)||0,
      y: parseFloat(el.style.top)||0,
      w: parseFloat(el.style.width)||BASE_W
    };
  });
  localStorage.setItem('canvas_positions_v1', JSON.stringify(obj));
}

/* ===== Tools for authoring ===== */
// export layout เป็น JSON + copy ให้ด้วย
window.exportLayout = function(){
  const obj={};
  stage.querySelectorAll('.draggable').forEach(el=>{
    const id = el.dataset.id || el.getAttribute("alt") || el.src.split("/").pop().replace(/\.\w+$/,'');
    obj[id] = {
      x: parseFloat(el.style.left)||0,
      y: parseFloat(el.style.top)||0,
      w: parseFloat(el.style.width)||BASE_W
    };
  });
  const json = JSON.stringify(obj, null, 2);
  console.log(json);
  if(navigator.clipboard?.writeText){ navigator.clipboard.writeText(json).then(()=>console.log('Copied layout JSON to clipboard')); }
  return json;
};

window.clearSavedLayout = function(){
  localStorage.removeItem('canvas_positions_v1');
  console.log('Cleared local saved layout');
};
