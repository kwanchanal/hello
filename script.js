// ===== CONFIG =====
const COUNT = 23; // จำนวน elements
const EXT   = "png"; // นามสกุลไฟล์
const pathFor = i => `elements/frame-${i}.${EXT}`;

const DEFAULT_LAYOUT = {}; // เดี๋ยวเราจะ export มาวางตรงนี้ทีหลัง
const BASE_W = 300;
const MIN_W  = 60;

// ===== DOM =====
const canvas = document.getElementById("canvas");
const stage  = document.getElementById("stage");

// ===== Utilities =====
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ===== Add images =====
(function addImages(){
  for(let i=1;i<=COUNT;i++){
    const id  = `frame-${i}`;
    const img = document.createElement("img");
    img.src = pathFor(i);
    img.alt = id;
    img.className = "draggable entrance";
    img.dataset.id = id;

    // ใช้ตำแหน่งจาก DEFAULT_LAYOUT ถ้ามี
    const keep = DEFAULT_LAYOUT[id];
    if(keep){
      img.style.left  = keep.x + "px";
      img.style.top   = keep.y + "px";
      img.style.width = (keep.w || BASE_W) + "px";
    }else{
      img.style.left  = (100 + (i*40)) + "px";
      img.style.top   = (80 + (i*30)) + "px";
      img.style.width = BASE_W + "px";
    }

    stage.appendChild(img);
  }
})();

// ===== Export layout =====
window.exportLayout = function () {
  const obj = {};
  stage.querySelectorAll(".draggable").forEach(el => {
    const id = el.dataset.id || el.getAttribute("alt");
    obj[id] = {
      x: parseFloat(el.style.left)  || 0,
      y: parseFloat(el.style.top)   || 0,
      w: parseFloat(el.style.width) || BASE_W
    };
  });
  const json = JSON.stringify(obj, null, 2);
  console.log(json);
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(json).then(()=>console.log("Copied to clipboard"));
  }
  return json;
};
