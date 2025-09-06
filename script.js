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

// ✅ Layout ที่ export มา
const DEFAULT_LAYOUT = {
  "frame-1": { "x": 559.862, "y": -265.146, "w": 300 },
  "frame-2": { "x": 199.552, "y": -258.173, "w": 300 },
  "frame-3": { "x": 1222.89, "y": 128.086, "w": 300 },
  "frame-4": { "x": 1590.36, "y": 77.2933, "w": 300 },
  "frame-5": { "x": 1164.87, "y": -352.947, "w": 272.28 },
  "frame-6": { "x": -48.2512, "y": 412.354, "w": 300 },
  "frame-7": { "x": -744.39, "y": -39.764, "w": 281.138 },
  "frame-8": { "x": 1110.39, "y": 452.076, "w": 300 },
  "frame-9": { "x": 17.7854, "y": 52.6063, "w": 300 },
  "frame-10": { "x": -354.706, "y": 144.367, "w": 300 },
  "frame-11": { "x": -410.061, "y": 758.198, "w": 300 },
  "frame-12": { "x": -624.919, "y": -366.449, "w": 300 },
  "frame-13": { "x": -940.393, "y": 161.022, "w": 341.243 },
  "frame-14": { "x": -224.904, "y": -286.979, "w": 300 },
  "frame-15": { "x": 1661.94, "y": -297.323, "w": 300 },
  "frame-16": { "x": -677.793, "y": 481.315, "w": 300 },
  "frame-17": { "x": 1719.61, "y": 451.78, "w": 300 },
  "frame-18": { "x": 1343.76, "y": 742.083, "w": 300 },
  "frame-19": { "x": 316.257, "y": 629.694, "w": 422.33 },
  "frame-20": { "x": 866.272, "y": 789.904, "w": 300 },
  "frame-21": { "x": 968.336, "y": -86.6432, "w": 300 },
  "frame-22": { "x": 545.63, "y": 226.149, "w": 332.112 },
  "frame-23": { "x": -812.935, "y": 697.34, "w": 300 }
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

    const baseDelay=(i-1)*0.04, jitter=Math.random()*0.18;
    img.style.animationDelay = (baseDelay + jitter).toFixed(2) + "s";
    img.addEventListener("animationend", (ev)=>{
      if(ev.animationName==='popIn'){ img.classList.remove('entrance'); img.style.animationDelay=''; }
    });

    stage.appendChild(img);
  }
})();

/* ===== ที่เหลือ (drag / pan / zoom / resize / persist / exportLayout) ===== */
/* 👉 ใช้โค้ดฟูลเวอร์ชันที่ฉันส่งไปก่อนหน้านี้ได้เลย
   - ไม่ต้องแก้ส่วนล่าง
   - แค่เปลี่ยน DEFAULT_LAYOUT เป็น JSON อันนี้
   - ตั้ง PERSIST=false
*/
