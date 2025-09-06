/* script.js — clean drag+resize+persist desktop, random mobile, pan+zoom/pinch */

const canvas = document.getElementById("canvas");
const stage  = document.getElementById("stage");

const IMAGE_COUNT = 23;
const IS_MOBILE = window.matchMedia("(max-width: 640px)").matches;
const PERSIST_KEY = "hello-layout-v4";

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

// ---------- Mobile random ----------
function computeMobileLayoutRandom() {
  const ids = Array.from({length:IMAGE_COUNT},(_,i)=>`frame-${i+1}`);
  const layout={};
  ids.forEach(id=>{
    layout[id]={x:Math.random()*800,y:Math.random()*600,w:210+Math.random()*90};
  });
  return layout;
}

// ---------- Persistence ----------
function loadSaved(){
  try{ return JSON.parse(localStorage.getItem(PERSIST_KEY)||"{}"); }catch{return {};}
}
function saveAll(){
  if(IS_MOBILE) return; // mobile ไม่ persist
  const obj={};
  stage.querySelectorAll(".draggable").forEach(el=>{
    obj[el.dataset.id]={
      x:parseFloat(el.style.left)||0,
      y:parseFloat(el.style.top)||0,
      w:parseFloat(el.style.width)||0,
      h:parseFloat(el.style.height)||0
    };
  });
  localStorage.setItem(PERSIST_KEY,JSON.stringify(obj));
}

// ---------- Initial Layout ----------
const saved = loadSaved();
const initialLayout = (IS_MOBILE? computeMobileLayoutRandom(): (Object.keys(saved).length?saved:desktopLayout));

const els=[];
for(let i=1;i<=IMAGE_COUNT;i++){
  const el=document.createElement("img");
  el.src=`elements/frame-${i}.png`;
  el.className="draggable hover-bounce";
  el.dataset.id=`frame-${i}`;
  stage.appendChild(el);
  els.push(el);
}
applyLayout(initialLayout);

function applyLayout(layout){
  els.forEach(el=>{
    const lay=layout[el.dataset.id];
    if(!lay) return;
    el.style.left=lay.x+"px";
    el.style.top =lay.y+"px";
    el.style.width=lay.w+"px";
    if(lay.h) el.style.height=lay.h+"px";
  });
}

// ---------- Pan & Zoom ----------
let scale=IS_MOBILE?0.6:0.5, originX=0, originY=0;
function applyTransform(){ stage.style.transform=`translate(${originX}px,${originY}px) scale(${scale})`; }
applyTransform();

canvas.addEventListener("wheel",e=>{
  e.preventDefault();
  const prev=scale, delta=-e.deltaY*0.001;
  scale=Math.min(3,Math.max(0.3,scale+delta));
  const r=stage.getBoundingClientRect();
  const mx=(e.clientX-r.left)/prev, my=(e.clientY-r.top)/prev;
  originX=e.clientX-mx*scale;
  originY=e.clientY-my*scale;
  applyTransform();
},{passive:false});

// ---------- Pinch Zoom ----------
const pointerMap=new Map();
function pinchInfo(){
  const pts=[...pointerMap.values()];
  if(pts.length<2) return null;
  const [a,b]=pts;
  return {cx:(a.x+b.x)/2, cy:(a.y+b.y)/2, dist:Math.hypot(b.x-a.x,b.y-a.y)};
}
let pinchState=null;
window.addEventListener("pointermove",e=>{
  if(pointerMap.size>=2 && e.pointerType!=="mouse"){
    const info=pinchInfo(); if(!info) return;
    if(!pinchState){ pinchState={startDist:info.dist,startScale:scale}; }
    else{
      const k=info.dist/pinchState.startDist;
      scale=Math.min(3,Math.max(0.3,pinchState.startScale*k));
      applyTransform();
    }
  }
},{passive:false});
canvas.addEventListener("pointerdown",e=>pointerMap.set(e.pointerId,{x:e.clientX,y:e.clientY}));
["pointerup","pointercancel","pointerout"].forEach(ev=>{
  window.addEventListener(ev,e=>{pointerMap.delete(e.pointerId); if(pointerMap.size<2) pinchState=null;});
});

// ---------- Selection ----------
let selection=null,resizing=null;
function showSelection(el){
  hideSelection();
  selection=document.createElement("div");
  selection.className="kw-selection";
  ["nw","ne","sw","se"].forEach(pos=>{
    const h=document.createElement("div");
    h.className="kw-handle"; h.dataset.pos=pos;
    h.addEventListener("pointerdown",ev=>startResize(ev,el,pos));
    selection.appendChild(h);
  });
  stage.appendChild(selection);
  updateSelection(el);
}
function updateSelection(el){
  if(!selection) return;
  const s=stage.getBoundingClientRect(), r=el.getBoundingClientRect();
  selection.style.left=(r.left-s.left)/scale+"px";
  selection.style.top =(r.top -s.top )/scale+"px";
  selection.style.width=r.width/scale+"px";
  selection.style.height=r.height/scale+"px";
}
function hideSelection(){ if(selection) selection.remove(); selection=null; }

// ---------- Drag ----------
let active=null, offsetX=0, offsetY=0;
function stageLocalXY(clientX, clientY){
  const s=stage.getBoundingClientRect();
  return {x:(clientX-s.left)/scale, y:(clientY-s.top)/scale};
}

stage.addEventListener("pointerdown",e=>{
  const el=e.target.closest("img.draggable");
  if(!el){ hideSelection(); return; }
  active=el;
  const r=el.getBoundingClientRect();
  offsetX=e.clientX-r.left; offsetY=e.clientY-r.top;
  showSelection(el);
  el.setPointerCapture(e.pointerId);
});

stage.addEventListener("pointermove",e=>{
  if(resizing) return onResizeMove(e);
  if(!active) return;
  const pos=stageLocalXY(e.clientX-offsetX,e.clientY-offsetY);
  active.style.left=pos.x+"px";
  active.style.top =pos.y+"px";
  updateSelection(active);
});

stage.addEventListener("pointerup",e=>{
  if(resizing){ endResize(); return; }
  if(!active) return;
  saveAll();
  active.releasePointerCapture(e.pointerId);
  active=null;
});

// ---------- Resize ----------
function startResize(e,el,pos){
  e.stopPropagation(); e.preventDefault();
  const r=el.getBoundingClientRect(), s=stage.getBoundingClientRect();
  resizing={el,pos,startX:e.clientX,startY:e.clientY,startW:r.width,startH:r.height,startL:(r.left-s.left)/scale,startT:(r.top-s.top)/scale};
}
function onResizeMove(e){
  if(!resizing) return;
  const {el,pos,startX,startY,startW,startH,startL,startT}=resizing;
  let dx=(e.clientX-startX)/scale, dy=(e.clientY-startY)/scale;
  let newW=startW,newH=startH,newL=startL,newT=startT;
  if(pos.includes("e")) newW=startW+dx;
  if(pos.includes("s")) newH=startH+dy;
  if(pos.includes("w")){ newW=startW-dx; newL=startL+dx; }
  if(pos.includes("n")){ newH=startH-dy; newT=startT+dy; }
  el.style.left=newL+"px"; el.style.top=newT+"px"; el.style.width=newW+"px"; el.style.height=newH+"px";
  updateSelection(el);
}
function endResize(){ saveAll(); resizing=null; }
