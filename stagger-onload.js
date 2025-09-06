/* stagger-onload.js — Kwan cute stagger v2
 * ทำให้แต่ละ element ค่อยๆ โผล่มาแบบมีชีวิตชีวา (stagger + tiny bounce + random direction)
 * - ใช้ Web Animations API เพื่อไม่ชน transform เดิมของ element (เช่นตัวที่ลากได้)
 * - รอให้รูปโหลดก่อนแล้วค่อยเล่น จะได้ไม่กระตุก
 * - เคารพ prefers-reduced-motion
 * - ไม่ต้องแก้ style.css/script.js เดิม
 */

(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // ตั้งค่าหลัก: ปรับตรงนี้ได้
  const CONFIG = {
    // selector ที่คิดว่าเป็น "ชิ้น/รูป" บนหน้า (ครอบคลุมกว้างขึ้น)
    selectors: [
      '[data-piece]', '.piece', '.item', '.el', '.sprite', '.draggable',
      '#stage > *', '#stage img', '#stage svg',
      '.elements img', '.elements svg', '.elements > *',
      'main img', 'main svg',
      'img', 'svg'
    ],
    // ระยะห่างเวลาแบบขั้นบันไดต่อชิ้น + สุ่ม
    perItemStep: 90,      // ms ต่อ index
    jitter: 220,          // ms แกว่งสุ่ม
    baseDelay: 120,       // ms เปิดหัวนิดนึง
    maxDelay: 2600,       // ms ไม่ให้ยืดเยื้อเกินไป
    // ระยะเวลาและ easing
    durMin: 620,          // ms
    durMax: 920,          // ms
    easing: 'cubic-bezier(.2,.75,.25,1.2)', // นุ่มๆ เด้งกำลังดี
    // ทิศ/สไตล์เริ่มต้นแบบสุ่ม
    variants: [
      { from: 'translateY(18px) scale(0.96)', blur: 2 },
      { from: 'translateY(-14px) scale(0.96)', blur: 2 },
      { from: 'translateX(18px) scale(0.96)', blur: 2 },
      { from: 'translateX(-18px) scale(0.96)', blur: 2 },
      { from: 'scale(0.92)', blur: 2 }
    ],
    // จำกัดจำนวนสูงสุด ถ้าหน้าทั้งหน้ามี element เยอะมาก
    hardCap: 400
  };

  // -------- utilities --------
  function uniq(list) {
    const set = new Set();
    list.forEach(n => set.add(n));
    return Array.from(set);
  }

  function inViewport(el) {
    const r = el.getBoundingClientRect?.();
    return r && r.width > 0 && r.height > 0;
  }

  function getCandidates() {
    // รวมทุก selector แล้วกรองซ้ำ/ของไม่แสดงผลออก
    const found = [];
    CONFIG.selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(n => found.push(n));
    });
    let list = uniq(found).filter(n => {
      const tag = n.tagName || '';
      if (/^(SCRIPT|LINK|STYLE|META|HEAD)$/.test(tag)) return false;
      if (!inViewport(n)) return false;
      return true;
    });

    // ตัดพวก container ใหญ่ๆ ที่ไม่มีรูป/เนื้อหาออกบ้าง
    list = list.filter(n => {
      const tag = (n.tagName || '').toLowerCase();
      if (tag === 'div' || tag === 'section' || tag === 'article') {
        // ถ้าเป็นกล่องเปล่าๆ ก็ข้าม
        return n.children.length === 0 ? false : true;
      }
      return true;
    });

    // กันเยอะเกินไป
    if (list.length > CONFIG.hardCap) {
      list = list.slice(0, CONFIG.hardCap);
    }
    return list;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function choose(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function waitForImages(nodes) {
    const imgs = [];
    nodes.forEach(n => {
      if (n.tagName && n.tagName.toLowerCase() === 'img') imgs.push(n);
      // เผื่อมีรูปซ่อนในลูก
      n.querySelectorAll && n.querySelectorAll('img').forEach(img => imgs.push(img));
    });
    const uniqImgs = uniq(imgs);
    if (!uniqImgs.length) return Promise.resolve();

    const pending = uniqImgs
      .filter(img => !(img.complete && img.naturalWidth > 0));

    if (!pending.length) return Promise.resolve();

    return new Promise(resolve => {
      let left = pending.length;
      const done = () => {
        left -= 1;
        if (left <= 0) resolve();
      };
      pending.forEach(img => {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
      // safety timeout 2.5s เผื่อบางรูปช้า
      setTimeout(resolve, 2500);
    });
  }

  // -------- main anim --------
  async function run() {
    const nodes = getCandidates();
    if (!nodes.length) return;

    // ซ่อนเบาๆ ก่อน เพื่อกันภาพแวบ
    nodes.forEach(n => {
      n.style.opacity = '0';
      n.style.willChange = 'transform, opacity, filter';
    });

    await waitForImages(nodes);

    // ใช้ IntersectionObserver เพื่อเล่นเฉพาะที่อยู่ใน viewport (เผื่อหน้ายาว)
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);

        const idx = nodes.indexOf(el);
        const varObj = choose(CONFIG.variants);
        const delay = Math.max(
          0,
          Math.min(
            CONFIG.maxDelay,
            CONFIG.baseDelay + idx * CONFIG.perItemStep + randInt(-CONFIG.jitter / 2, CONFIG.jitter / 2)
          )
        );
        const dur = randBetween(CONFIG.durMin, CONFIG.durMax);

        // ใช้ WAAPI เพื่อไม่ทับ transform เดิม
        // เพิ่ม blur เบาหน่อย ให้ดูฟุ้งตอนโผล่
        const keyframes = [
          { opacity: 0, transform: varObj.from, filter: `blur(${varObj.blur}px)` },
          { opacity: 1, transform: 'none', filter: 'blur(0px)' }
        ];

        // เริ่มเล่นแบบ stagger
        setTimeout(() => {
          // ถ้าโดนลบจาก DOM ไปแล้ว ให้ข้าม
          if (!document.body.contains(el)) return;

          // แก้เผื่อ element มี visibility:hidden จาก CSS อื่น
          el.style.visibility = 'visible';

          const anim = el.animate(keyframes, {
            duration: dur,
            easing: CONFIG.easing,
            fill: 'both'
          });

          anim.addEventListener('finish', () => {
            el.style.opacity = '1';
            el.style.filter = 'none';
            // คืน will-change เป็น auto เพื่อประหยัด
            el.style.willChange = 'auto';
          });
        }, delay);
      });
    }, { root: null, rootMargin: '0px', threshold: 0.01 });

    // observe ทุกตัว
    nodes.forEach(n => io.observe(n));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
