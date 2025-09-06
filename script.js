// Layout เริ่มต้น
const initialLayout = {
  "frame-1": { "x": 646.51, "y": -281.271, "w": 300 },
  "frame-2": { "x": 75.6457, "y": -184.501, "w": 300 },
  "frame-3": { "x": 1222.89, "y": 128.086, "w": 300 },
  "frame-4": { "x": 1630.49, "y": 102.215, "w": 256.25 },
  "frame-5": { "x": 1358.34, "y": -205.033, "w": 272.28 },
  "frame-6": { "x": 122.905, "y": 401.245, "w": 300 },
  "frame-7": { "x": -477.218, "y": -38.3265, "w": 237.677 },
  "frame-8": { "x": 937.073, "y": 299.138, "w": 300 },
  "frame-9": { "x": 130.481, "y": 65.5438, "w": 300 },
  "frame-10": { "x": -317.917, "y": 195.851, "w": 300 },
  "frame-11": { "x": -183.49, "y": 642.815, "w": 300 },
  "frame-12": { "x": -624.919, "y": -366.449, "w": 300 },
  "frame-13": { "x": -692.494, "y": 152.045, "w": 341.243 },
  "frame-14": { "x": -224.904, "y": -286.979, "w": 300 },
  "frame-15": { "x": 1705.41, "y": -221.885, "w": 300 },
  "frame-16": { "x": -677.793, "y": 481.315, "w": 300 },
  "frame-17": { "x": 1546.96, "y": 442.999, "w": 300 },
  "frame-18": { "x": 1438.88, "y": 757.966, "w": 300 },
  "frame-19": { "x": 456.796, "y": 615.772, "w": 422.33 },
  "frame-20": { "x": 1068.47, "y": 641.17, "w": 300 },
  "frame-21": { "x": 962.906, "y": -127.276, "w": 300 },
  "frame-22": { "x": 476.185, "y": 106.032, "w": 413.955 },
  "frame-23": { "x": -579.162, "y": 699.192, "w": 300 }
};

const stage = document.getElementById("stage");

// โหลด element 1–23
for (let i = 1; i <= 23; i++) {
  const el = document.createElement("img");
  el.src = `elements/frame-${i}.png`;
  el.className = "draggable entrance";
  el.dataset.id = `frame-${i}`;

  const lay = initialLayout[`frame-${i}`];
  el.style.left = lay.x + "px";
  el.style.top = lay.y + "px";
  el.style.width = lay.w + "px";

  stage.appendChild(el);
}

// Pan + Zoom
let scale = 0.5, originX = 0, originY = 0; // 🔥 เริ่มต้นที่ 50% zoom out
let isPanning = false, startX = 0, startY = 0;

const canvas = document.getElementById("canvas");

canvas.addEventListener("mousedown", e => {
  if (e.target === canvas || e.target === stage) {
    isPanning = true;
    startX = e.clientX - originX;
    startY = e.clientY - originY;
  }
});
canvas.addEventListener("mousemove", e => {
  if (!isPanning) return;
  originX = e.clientX - startX;
  originY = e.clientY - startY;
  updateStage();
});
canvas.addEventListener("mouseup", () => isPanning = false);
canvas.addEventListener("mouseleave", () => isPanning = false);

canvas.addEventListener("wheel", e => {
  e.preventDefault();
  const scaleAmount = -e.deltaY * 0.001;
  scale = Math.min(Math.max(0.3, scale + scaleAmount), 3);
  updateStage();
});

function updateStage() {
  stage.style.transform = `translate(${originX}px,${originY}px) scale(${scale})`;
}
updateStage();

// Drag + Resize + Selection
let active = null;
let offsetX = 0, offsetY = 0;
let selection = null;

stage.addEventListener("mousedown", e => {
  if (e.target.classList.contains("draggable")) {
    active = e.target;
    const rect = active.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", endDrag);

    // add selection frame
    addSelection(active);
  }
});

function drag(e) {
  if (!active) return;
  const x = e.clientX - offsetX - stage.getBoundingClientRect().left;
  const y = e.clientY - offsetY - stage.getBoundingClientRect().top;
  active.style.left = x / scale + "px";
  active.style.top = y / scale + "px";
  updateSelection(active);
}

function endDrag() {
  active = null;
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", endDrag);
}

function addSelection(el) {
  removeSelection();
  selection = document.createElement("div");
  selection.className = "selection";

  const handles = ["nw","ne","sw","se"].map(pos => {
    const h = document.createElement("div");
    h.className = "handle " + pos;
    selection.appendChild(h);
    h.addEventListener("mousedown", e => startResize(e, el, pos));
    return h;
  });

  stage.appendChild(selection);
  updateSelection(el);
}

function updateSelection(el) {
  if (!selection) return;
  const rect = el.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  selection.style.left = (rect.left - stageRect.left)/scale + "px";
  selection.style.top = (rect.top - stageRect.top)/scale + "px";
  selection.style.width = rect.width/scale + "px";
  selection.style.height = rect.height/scale + "px";
}

function removeSelection() {
  if (selection) selection.remove();
  selection = null;
}

// Resize
let resizing = null;
function startResize(e, el, corner) {
  e.stopPropagation();
  resizing = {el, corner, startX:e.clientX, startY:e.clientY, startW:el.offsetWidth, startH:el.offsetHeight};
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", endResize);
}
function resize(e) {
  if (!resizing) return;
  let {el, corner, startX, startY, startW, startH} = resizing;
  let dx = (e.clientX - startX) / scale;
  let dy = (e.clientY - startY) / scale;
  if (corner.includes("e")) el.style.width = (startW + dx) + "px";
  if (corner.includes("s")) el.style.height = (startH + dy) + "px";
  updateSelection(el);
}
function endResize() {
  resizing = null;
  document.removeEventListener("mousemove", resize);
  document.removeEventListener("mouseup", endResize);
}

// Export layout
window.exportLayout = function(){
  const obj = {};
  document.querySelectorAll(".draggable").forEach(el=>{
    obj[el.dataset.id] = {
      x: parseFloat(el.style.left)||0,
      y: parseFloat(el.style.top)||0,
      w: parseFloat(el.style.width)||0
    };
  });
  console.log(JSON.stringify(obj,null,2));
  return obj;
};
