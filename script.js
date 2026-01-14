const canvas = document.getElementById('canvas');
const stage  = document.getElementById('stage');

const IMAGE_COUNT = 23;
const SKIP_IDS = new Set(['frame-6']);
const IS_MOBILE = window.matchMedia('(max-width: 640px)').matches;
const PERSIST_KEY = 'hello-layout-v3';
const PERSIST_ON_MOBILE = false;
const WHEEL_ZOOM_STEP = 0.001;
const SCALE_MIN = 0.3, SCALE_MAX = 3;

const desktopLayout = {
  "frame-1":  { "x": 1050,  "y": -400, "w": 300 },
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
  "frame-19": { "x": 456.796, "y": 645.772,  "w": 422.33 },
  "frame-20": { "x": 1068.47, "y": 641.17,   "w": 300 },
  "frame-21": { "x": 962.906, "y": -127.276, "w": 300 },
  "frame-22": { "x": 476.185, "y": 106.032,  "w": 350 },
  "frame-23": { "x": -579.162,"y": 699.192,  "w": 300 }
};

function computeMobileLayoutRandom() {
  const ids = Array.from({ length: IMAGE_COUNT }, (_, i) => `frame-${i + 1}`);
  const layout = {};
  ids.forEach(id => {
    layout[id] = { x: Math.random()*800, y: Math.random()*650, w: 210 + Math.random()*90 };
  });
  return layout;
}

function loadSavedLayout() {
  if (IS_MOBILE && !PERSIST_ON_MOBILE) return {};
  try { return JSON.parse(localStorage.getItem(PERSIST_KEY) || '{}'); }
  catch { return {}; }
}
function saveLayoutNow() {
  if (IS_MOBILE && !PERSIST_ON_MOBILE) return;
  const obj = {};
  stage.querySelectorAll('.draggable').forEach(el => {
    if (el.dataset.id === 'folder') return;
    obj[el.dataset.id] = {
      x: parseFloat(el.style.left) || 0,
      y: parseFloat(el.style.top)  || 0,
      w: parseFloat(el.style.width) || 0,
      h: parseFloat(el.style.height) || 0
    };
  });
  try { localStorage.setItem(PERSIST_KEY, JSON.stringify(obj)); } catch {}
}
const saveLayout = (()=>{let t=null;return()=>{clearTimeout(t);t=setTimeout(saveLayoutNow,120);};})();

const els = [];
const loadPromises = [];
for (let i = 1; i <= IMAGE_COUNT; i++) {
  const id = `frame-${i}`;
  if (SKIP_IDS.has(id)) continue;
  const el = document.createElement('img');
  el.src = `elements/${id}.png`;
  el.className = 'draggable hover-bounce entering';
  el.dataset.id = id;
  if (el.dataset.id === 'frame-22') {
    el.classList.add('entering-first');
  }
  el.draggable = false;
  el.addEventListener('dragstart', e => e.preventDefault());
  stage.appendChild(el);
  els.push(el);
  loadPromises.push(new Promise(res => {
    if (el.complete) return res();
    el.onload = () => res();
    el.onerror = () => res();
  }));
}

const folderDesktopPos = { x: 0, y: 0 };
const folderMobilePos = { x: 0, y: 0 };
const folderDefaultSize = { w: 300, h: 300 };
const folderMobileSize = { w: 250, h: 250 };

const folderWrap = document.createElement('div');
folderWrap.className = 'folder-item entering';
folderWrap.dataset.id = 'folder';
folderWrap.style.zIndex = '200';
folderWrap.style.left = (IS_MOBILE ? folderMobilePos.x : folderDesktopPos.x) + 'px';
folderWrap.style.top = (IS_MOBILE ? folderMobilePos.y : folderDesktopPos.y) + 'px';

const folderImg = document.createElement('img');
folderImg.src = 'icon/File.png';
folderImg.alt = 'Works';
folderImg.draggable = false;
folderImg.addEventListener('dragstart', e => e.preventDefault());

const folderLabel = document.createElement('span');
folderLabel.className = 'folder-label';
folderLabel.textContent = 'Works';

const folderTooltip = document.createElement('span');
folderTooltip.className = 'folder-tooltip';
folderTooltip.textContent = 'Explore';

folderWrap.appendChild(folderImg);
folderWrap.appendChild(folderLabel);
folderWrap.appendChild(folderTooltip);
stage.appendChild(folderWrap);

const folderSize = IS_MOBILE ? folderMobileSize : folderDefaultSize;
folderImg.style.width = folderSize.w + 'px';
folderImg.style.height = folderSize.h + 'px';

const saved = loadSavedLayout();
const initialLayout = IS_MOBILE ? computeMobileLayoutRandom() : desktopLayout;
if (!IS_MOBILE && Object.keys(saved).length) {
  try { localStorage.removeItem(PERSIST_KEY); } catch {}
}

function applyLayout(layout) {
  els.forEach(el => {
    const lay = layout[el.dataset.id];
    if (!lay) return;
    el.style.left  = lay.x + 'px';
    el.style.top   = lay.y + 'px';
    el.style.width = lay.w + 'px';
    if (lay.h) el.style.height = lay.h + 'px'; else el.style.removeProperty('height');
  });
}
applyLayout(initialLayout);

let scale = IS_MOBILE ? 0.6 : 0.5;
const STAGE_OFFSET_Y = -40;
let originX = 0, originY = 0;
function applyTransform() {
  stage.style.transform = `translate(${originX}px, ${originY + STAGE_OFFSET_Y}px) scale(${scale})`;
}
applyTransform();

function centerStageOnContent() {
  if (!els.length) return;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  els.forEach(el => {
    const l = el.offsetLeft, t = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
    minX = Math.min(minX, l);
    minY = Math.min(minY, t);
    maxX = Math.max(maxX, l + w);
    maxY = Math.max(maxY, t + h);
  });
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const viewW = canvas.clientWidth;
  const viewH = canvas.clientHeight;
  originX = (viewW / 2) - (cx * scale);
  originY = (viewH / 2) - (cy * scale);
  applyTransform();
}

Promise.all(loadPromises).then(() => {
  centerStageOnContent();
  if (folderWrap) {
    if (IS_MOBILE) {
      const viewW = canvas.clientWidth;
      const viewH = canvas.clientHeight;
      const target = stageLocalXY(viewW / 2, viewH / 2);
      const size = folderMobileSize;
      folderWrap.style.left = (target.x - size.w / 2) + 'px';
      folderWrap.style.top = (target.y + viewH * 0.48 - size.h / 2) + 'px';
    } else {
      const viewW = canvas.clientWidth;
      const viewH = canvas.clientHeight;
      const target = stageLocalXY(viewW / 2, viewH / 2);
      const size = folderDefaultSize;
      folderWrap.style.left = (target.x - size.w / 2 - (viewW * 0.15)) + 'px';
      folderWrap.style.top = (target.y + viewH * 0.18 - size.h / 2) + 'px';
    }
    folderWrap.style.zIndex = '200';
    const size = IS_MOBILE ? folderMobileSize : folderDefaultSize;
    folderImg.style.width = size.w + 'px';
    folderImg.style.height = size.h + 'px';
  }
  if (!IS_MOBILE) saveLayoutNow();
});


let selection=null,resizing=null;
function showSelection(el){
  hideSelection();
  selection=document.createElement('div');
  selection.className='kw-selection';
  ['nw','ne','sw','se'].forEach(pos=>{
    const h=document.createElement('div');
    h.className='kw-handle'; h.dataset.pos=pos;
    h.addEventListener('pointerdown', ev=>startResize(ev,el,pos));
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
function hideSelection(){ if(selection) selection.remove(); selection=null; }

let active=null, offsetX=0, offsetY=0;
function stageLocalXY(clientX, clientY){
  const s=stage.getBoundingClientRect();
  return {x:(clientX-s.left)/scale, y:(clientY-s.top)/scale};
}

stage.addEventListener('pointerdown', e => {
  const el = e.target.closest('img.draggable');
  if (!el) { hideSelection(); return; }

  if (!el.classList.contains('float-emoji')) {
    el.getAnimations?.().forEach(a => a.cancel());
  }
  el.classList.remove('entering');

  active = el;
  const r = el.getBoundingClientRect();
  offsetX = e.clientX - r.left;
  offsetY = e.clientY - r.top;
  showSelection(el);
  el.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove', e => {
  if (resizing) return onResizeMove(e);
  if (!active) return;
  const pos = stageLocalXY(e.clientX - offsetX, e.clientY - offsetY);
  active.style.left = pos.x + 'px';
  active.style.top  = pos.y + 'px';
  updateSelection(active);
  saveLayout();
});
stage.addEventListener('pointerup', e => {
  if (resizing){ endResize(); return; }
  if (!active) return;
  saveLayoutNow();
  active.releasePointerCapture(e.pointerId);
  active = null;
});

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
  newW=Math.max(40,newW); newH=Math.max(40,newH);
  el.style.left=newL+'px'; el.style.top=newT+'px'; el.style.width=newW+'px'; el.style.height=newH+'px';
  updateSelection(el);
  saveLayout();
}
function endResize(){ saveLayoutNow(); resizing=null; }

const hintText = document.querySelector('.hint-text');
if (hintText) {
  const prefixText = "Hello! It’s Kwan\nNice seeing you here\n\n";
  const phrases = ["How are you today?", "What are you looking for?"];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    hintText.textContent = prefixText + phrases[0];
  } else {
    let phraseIndex = 0;
    let introIndex = 0;
    let phraseCharIndex = 0;
    let introDone = false;
    let isDeleting = false;

    const typeDelay = 55;
    const deleteDelay = 30;
    const holdDelay = 1200;

    const tick = () => {
      const current = phrases[phraseIndex];

      if (!introDone) {
        introIndex = Math.min(prefixText.length, introIndex + 1);
        hintText.textContent = prefixText.slice(0, introIndex);
        if (introIndex === prefixText.length) introDone = true;
        setTimeout(tick, typeDelay);
        return;
      }

      if (!isDeleting) {
        phraseCharIndex = Math.min(current.length, phraseCharIndex + 1);
      } else {
        phraseCharIndex = Math.max(0, phraseCharIndex - 1);
      }

      hintText.textContent = prefixText + current.slice(0, phraseCharIndex);

      if (!isDeleting && phraseCharIndex === current.length) {
        isDeleting = true;
        setTimeout(tick, holdDelay);
        return;
      }

      if (isDeleting && phraseCharIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(tick, typeDelay);
        return;
      }

      setTimeout(tick, isDeleting ? deleteDelay : typeDelay);
    };

    tick();
  }
}

const contactValue = document.querySelector('.contact-value');
const contactToggle = document.querySelector('.contact-toggle');
if (contactValue && contactToggle) {
  const masked = contactValue.dataset.masked || '**********';
  const reveal = contactValue.dataset.reveal || '';
  contactValue.textContent = masked;

  contactToggle.addEventListener('click', () => {
    const isMasked = contactValue.textContent === masked;
    contactValue.textContent = isMasked ? reveal : masked;
    contactToggle.setAttribute('aria-pressed', String(isMasked));
    contactToggle.setAttribute('aria-label', isMasked ? 'Hide full email' : 'Show full email');
  });
}

const audioToggle = document.querySelector('.audio-toggle');
const audioEl = document.getElementById('bg-music');
if (audioToggle && audioEl) {
  const audioLabel = audioToggle.querySelector('.audio-label');
  const setState = (playing) => {
    audioToggle.setAttribute('aria-pressed', String(playing));
    audioToggle.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    if (audioLabel) audioLabel.textContent = playing ? 'Pause' : 'Play';
  };
  setState(!audioEl.paused);

  audioToggle.addEventListener('click', async () => {
    if (audioEl.paused) {
      try {
        await audioEl.play();
        setState(true);
      } catch {
        setState(false);
      }
    } else {
      audioEl.pause();
      setState(false);
    }
  });

  audioEl.addEventListener('ended', () => setState(false));
  audioEl.addEventListener('play', () => setState(true));
  audioEl.addEventListener('pause', () => setState(false));
}
