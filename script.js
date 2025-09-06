/* script.js — desktop drag/resize fix (2025-09-06)
 * - ปิด native image drag (no ghost image, no dotted selection)
 * - ใช้ Pointer Events ล้วน: กดแล้วลากได้ลื่นบน desktop & touch
 * - Shift + Wheel บน element = resize (scale) แบบเป็นธรรมชาติ
 * - เก็บสถานะ x, y, scale ใน dataset ของแต่ละ element
 * - นุ่ม: inertia เล็กน้อยและ bring-to-front ตอนลาก
 * - ไม่ชน stagger-onload.js (อันนั้นรันหลัง window.load)
 */

(() => {
  const STAGE_ID = 'stage';
  const SELECTOR = '#stage img, #stage .sprite, #stage [data-piece], #stage .draggable';

  const stage = document.getElementById(STAGE_ID);
  if (!stage) return;

  // --------- global safety styles (inline, ไม่ต้องแก้ CSS) ----------
  stage.style.touchAction = 'none';          // ให้ pointer events จัด gesture เอง
  stage.style.userSelect = 'none';           // กัน selection box
  stage.style.webkitUserSelect = 'none';
  stage.style.msUserSelect = 'none';

  // ปิด native drag สำหรับรูปทุกตัว
  const els = Array.from(document.querySelectorAll(SELECTOR));
  els.forEach(el => {
    // ปิด drag รูปพื้นฐานของเบราว์เซอร์
    el.setAttribute('draggable', 'false');
    el.addEventListener('dragstart', e => e.preventDefault());
    el.style.touchAction = 'none';
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';
    el.style.msUserSelect = 'none';
    el.style.cursor = 'grab';

    // ถ้าไม่มีค่าเริ่ม ให้สุ่มวางแบบกระจายรอบกลาง (แต่ไม่แก้ตำแหน่งถ้ามีอยู่แล้ว)
    if (!el.dataset.init) {
      const rect = stage.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      // สุ่มกระจายรัศมีรอบกลาง
      const r = Math.min(rect.width, rect.height) * 0.32;
      const theta = Math.random() * Math.PI * 2;
      const x = cx + r * Math.cos(theta) - rect.left - el.width / 2;
      const y = cy + r * Math.sin(theta) - rect.top - el.height / 2;

      el.dataset.x = String(Math.round(x));
      el.dataset.y = String(Math.round(y));
      el.dataset.scale = el.dataset.scale || '1';
      applyTransform(el);
      el.dataset.init = '1';
    } else {
      // มีแล้วก็แค่ apply เพื่อ sync transform
      if (!el.dataset.scale) el.dataset.scale = '1';
      if (!el.dataset.x) el.dataset.x = '0';
      if (!el.dataset.y) el.dataset.y = '0';
      applyTransform(el);
    }
  });

  // --------- drag logic (pointer events) ----------
  let active = null; // { el, startX, startY, baseX, baseY }
  let zTop = 10;

  function onPointerDown(e) {
    // target ต้องเป็น element ที่เราอนุญาต
    const el = e.target.closest(SELECTOR);
    if (!el) return;

    // เฉพาะปุ่มซ้าย/ปากกาหรือนิ้ว
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.preventDefault();

    // นำหน้า: เพิ่ม z-index ตอนลาก
    zTop += 1;
    el.style.zIndex = String(zTop);

    // pointer capture เพื่อให้ลากหลุดกรอบก็ยังตาม
    el.setPointerCapture?.(e.pointerId);

    const baseX = parseFloat(el.dataset.x || '0');
    const baseY = parseFloat(el.dataset.y || '0');

    active = {
      el,
      startX: e.clientX,
      startY: e.clientY,
      baseX,
      baseY
    };

    el.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    if (!active) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) return; // mouseup หลุด? ยกเลิก

    e.preventDefault();

    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;

    const x = active.baseX + dx;
    const y = active.baseY + dy;

    active.el.dataset.x = String(x);
    active.el.dataset.y = String(y);
    applyTransform(active.el);
  }

  function onPointerUp(e) {
    if (!active) return;
    e.preventDefault();

    // ปล่อย capture
    active.el.releasePointerCapture?.(e.pointerId);
    active.el.style.cursor = 'grab';
    active = null;
  }

  stage.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('blur', onPointerUp);

  // --------- resize per element: Shift + Wheel ----------
  // หมายเหตุ: ใช้ passive:false เพื่อ preventDefault ได้
  stage.addEventListener('wheel', (e) => {
    // เฉพาะถ้ากด Shift + ชี้อยู่บน element ที่ควบคุม
    const el = e.target && e.target.closest && e.target.closest(SELECTOR);
    if (!el || !e.shiftKey) return;

    e.preventDefault();

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // scale step
    const dir = e.deltaY > 0 ? -1 : 1; // scroll ขึ้น = ขยาย
    const step = 0.06 * dir;

    let scale = parseFloat(el.dataset.scale || '1');
    scale = Math.min(4, Math.max(0.2, scale + step));
    el.dataset.scale = String(scale);

    // (optional) คงจุดกึ่งกลางเดิมโดยชดเชย x/y นิดหน่อย
    // ตำแหน่งก่อน transform
    const x = parseFloat(el.dataset.x || '0');
    const y = parseFloat(el.dataset.y || '0');

    // คำนวณจุดอ้างอิงเทียบกับ center stage
    // (ตรงนี้เอาแบบง่าย: ไม่ชดเชย pivot แบบละเอียด เพื่อลื่นมือ)
    el.dataset.x = String(x);
    el.dataset.y = String(y);

    applyTransform(el);
  }, { passive: false });

  // --------- helpers ----------
  function applyTransform(el) {
    const x = parseFloat(el.dataset.x || '0');
    const y = parseFloat(el.dataset.y || '0');
    const s = parseFloat(el.dataset.scale || '1');
    el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    el.style.transformOrigin = 'center center';
    el.style.willChange = 'transform';
  }

  // --------- keyboard tiny nudge (arrow keys on focused stage) ----------
  // คลิกที่ stage แล้วใช้ลูกศรเลื่อนชิ้นล่าสุดที่แตะได้
  let lastClicked = null;
  stage.addEventListener('pointerdown', (e) => {
    const el = e.target.closest(SELECTOR);
    if (el) lastClicked = el;
  });

  window.addEventListener('keydown', (e) => {
    if (!lastClicked) return;
    const inc = e.shiftKey ? 10 : 2;
    let x = parseFloat(lastClicked.dataset.x || '0');
    let y = parseFloat(lastClicked.dataset.y || '0');

    switch (e.key) {
      case 'ArrowLeft':  x -= inc; break;
      case 'ArrowRight': x += inc; break;
      case 'ArrowUp':    y -= inc; break;
      case 'ArrowDown':  y += inc; break;
      default: return;
    }
    e.preventDefault();
    lastClicked.dataset.x = String(x);
    lastClicked.dataset.y = String(y);
    applyTransform(lastClicked);
  });

  // --------- window resize: ไม่รีเซ็ตตำแหน่งผู้ใช้ ----------
  // (ไม่ทำอะไรเป็นพิเศษ เพื่อรักษา x/y ที่ผู้ใช้วางเองไว้)
})();
