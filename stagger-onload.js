/* stagger-onload.js
 * Cute staggered pop-in + tiny bounce on first load.
 * - Works with <img>, <svg>, และ element ทั่วไป (มี .piece/.item/.el/.sprite หรือมี data-piece)
 * - เคารพ prefers-reduced-motion
 * - ไม่แตะของเดิม: แค่ฉีด CSS เอง + ใส่ inline animation ให้แต่ละชิ้น
 */

(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Inject minimal CSS keyframes (no need to edit your CSS file) ----
  const css = `
  @keyframes kw_pop_in {
    0%   { opacity: 0; transform: translateY(10px) scale(0.96); }
    60%  { opacity: 1; transform: translateY(-2px) scale(1.02); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .kw-anim-target { opacity: 0; will-change: transform, opacity; }
  @media (prefers-reduced-motion: reduce) {
    .kw-anim-target { opacity: 1 !important; transform: none !important; animation: none !important; }
  }`;
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-kw-stagger', '');
  styleEl.appendChild(document.createTextNode(css));
  document.head.appendChild(styleEl);

  // ---- Choose candidates to animate (broad but safe) ----
  function getCandidates() {
    // พยายามเลือก element “รูป/ชิ้น” ที่น่าจะเป็นตัวเล่น
    const selectors = [
      '[data-piece]', '.piece', '.item', '.el', '.sprite',
      '#stage img', '#stage svg', 'main img', 'main svg',
      'img.frame', 'svg.frame',
      // fallback กว้างๆ
      'img', 'svg'
    ];
    // รวม, unique, และกรองซ้ำ
    const set = new Set();
    selectors.forEach(sel => document.querySelectorAll(sel).for
