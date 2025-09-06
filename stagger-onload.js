/* stagger-onload.js — v3 (no top-left flash)
 * - ซ่อน #stage ชั่วคราวตั้งแต่เฟรมแรก -> รอรูป + layout พร้อม -> เผยด้วย stagger
 * - ใช้ Web Animations API ไม่ทับ transform เดิม (เช่น element ที่ลากได้)
 * - เคารพ prefers-reduced-motion
 */

(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // ---------- prelayout: ซ่อน #stage ให้เร็วที่สุด ----------
  // พยายามหา #stage แล้วซ่อนไว้ทันที เพื่อตัดเฟรมที่ element ไปโผล่ที่ (0,0)
  const stage = document.getElementById('stage');
  if (stage) {
    stage.style.visibility = 'hidden';
    stage.style.opacity = '0';
  }

  // inject CSS เล็กน้อย (เผื่อหน้าไม่มี #stage ให้ fallback ซ่อนเฉพาะสิ่งที่จะเล่น)
  const preCSS = `
    .kw-pre-hide { visibility:hidden !important; opacity:0 !important; }
  `;
  const preStyle = document.createElement('style');
  preStyle.setAttribute('data-kw-pre', '');
  preStyle.appendChild(document.createTextNode(preCSS));
  document.head.appendChild(preStyle);

  // ---------- config ----------
  const CONFIG = {
    selectors: [
      '[data-piece]', '.piece', '.item', '.el', '.sprite', '.draggable',
      '#stage > *', '#stage img', '#stage svg',
      '.elements img', '.elements svg', '.elements > *',
      'main img', 'main svg',
      'img', 'svg'
    ],
    perItemStep: 100,     // ms ต่อ index
    jitter: 240,          // แกว่งสุ่มเวลา
    baseDelay: 140,       // เปิดหัวเล็กน้อย
    maxDelay: 2800,
    durMin: 680,
    durMax: 980,
    easing: 'cubic-bezier(.2,.75,.25,1.2)',
    variants: [
      { from: 'translateY(18px) scale(0.96)', blur: 2 },
      { from: 'translateY(-14px) scale(0.96)', blur: 2 },
      { from: 'translateX(18px) scale(0.96)', blur: 2 },
      { from: 'translateX(-18px) scale(0.96)', blur: 2 },
      { from: 'scale(0.92)', blur: 2 }
    ],
    hardCap: 400
  };

  // ---------- utils ----------
  const uniq = (list) => Array.from(new Set(list));
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randBetween = (min, max) => Math.random() * (max - min) + min;
  const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function inViewport(el) {
    const r = el.getBoundingClientRect?.();
    return r && r.width > 0 && r.height > 0;
  }

  function getCandidates() {
    const found = [];
    CONFIG.selectors.forEach(sel => document.querySelectorAll(sel).forEach(n => found.push(n)));
    let list = uniq(found).filter(n => {
      const tag = n.tagName || '';
      if (/^(SCRIPT|LINK|STYLE|META|HEAD)$/.test(tag)) return false;
      if (!inViewport(n)) return false;
      return true;
    });

    list = list.filter(n => {
      const tag = (n.tagName || '').toLowerCase();
      if ((tag === 'div' || tag === 'section' || tag === 'article') && n.children.length === 0) return false;
      return true;
    });

    if (list.length > CONFIG.hardCap) list = list.slice(0, CONFIG.hardCap);
    return list;
  }

  function waitForImages(nodes) {
    const imgs = [];
    nodes.forEach(n => {
      if (n.tagName && n.tagName.toLowerCase() === 'img') imgs.push(n);
      n.querySelectorAll && n.querySelectorAll('img').forEach(i => imgs.push(i));
    });
    const uniqImgs = uniq(imgs);
    const pending = uniqImgs.filter(img => !(img.complete && img.naturalWidth > 0));
    if (!pending.length) return Promise.resolve();

    return new Promise(resolve => {
      let left = pending.length;
      const done = () => { if (--left <= 0) resolve(); };
      pending.forEach(img => {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
      setTimeout(resolve, 2500); // safety
    });
  }

  // ---------- main ----------
  async function run() {
    const nodes = getCandidates();
    if (!nodes.length) {
      // ไม่มีเป้าหมาย ก็แค่ออก #stage ให้เห็น
      if (stage) { stage.style.visibility = 'visible'; stage.style.opacity = '1'; }
      return;
    }

    // ป้องกันแวบ: ซ่อนทุกชิ้นไว้ก่อน
    nodes.forEach(n => {
      n.classList.add('kw-pre-hide');
      n.style.willChange = 'transform, opacity, filter';
    });

    await waitForImages(nodes);

    // ตอนนี้ layout + รูปพร้อมแล้ว ค่อยโชว์ stage
    if (stage) {
      stage.style.visibility = 'visible';
      stage.style.opacity = '1';
    }

    // เล่นเฉพาะที่เข้าหน้าจอ (เผื่อหน้ายาว)
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);

        const idx = nodes.indexOf(el);
        const varObj = choose(CONFIG.variants);
        const delay = Math.max(
          0,
          Math.min(CONFIG.maxDelay, CONFIG.baseDelay + idx * CONFIG.perItemStep + randInt(-CONFIG.jitter / 2, CONFIG.jitter / 2))
        );
        const dur = randBetween(CONFIG.durMin, CONFIG.durMax);

        // เลิกซ่อนทันทีที่กำลังจะเล่น (จะไม่เห็นเฟรมที่ (0,0) เพราะ stage เพิ่งถูกเปิด)
        setTimeout(() => {
          if (!document.body.contains(el)) return;

          el.classList.remove('kw-pre-hide');

          const anim = el.animate(
            [
              { opacity: 0, transform: varObj.from, filter: `blur(${varObj.blur}px)` },
              { opacity: 1, transform: 'none', filter: 'blur(0px)' }
            ],
            { duration: dur, easing: CONFIG.easing, fill: 'both' }
          );

          anim.addEventListener('finish', () => {
            el.style.opacity = '1';
            el.style.filter = 'none';
            el.style.willChange = 'auto';
          });
        }, delay);
      });
    }, { threshold: 0.01 });

    nodes.forEach(n => io.observe(n));
  }

  // ใช้ window.load เพื่อให้สคริปต์วางตำแหน่งของคุณทำงานเสร็จก่อน (กันแวบ)
  window.addEventListener('load', run, { once: true });
})();
