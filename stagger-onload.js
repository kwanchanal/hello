/* stagger-onload.js — v4 (fix drag/resize lock)
 * - กันเฟรมวูบซ้ายบนเหมือนเดิม (pre-hide #stage)
 * - เล่นแอนิเมชันเสร็จแล้ว "ยกเลิก" (cancel) เพื่อไม่ไปครอบ transform ของการลาก/รีไซซ์
 * - เคารพ prefers-reduced-motion
 */

(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // --- pre-hide stage to avoid top-left flash ---
  const stage = document.getElementById('stage');
  if (stage) {
    stage.style.visibility = 'hidden';
    stage.style.opacity = '0';
  }
  const preStyle = document.createElement('style');
  preStyle.setAttribute('data-kw-pre', '');
  preStyle.textContent = `.kw-pre-hide{visibility:hidden!important;opacity:0!important}`;
  document.head.appendChild(preStyle);

  // --- config ---
  const CFG = {
    selectors: [
      '[data-piece]', '.piece', '.item', '.el', '.sprite', '.draggable',
      '#stage > *', '#stage img', '#stage svg',
      '.elements img', '.elements svg', '.elements > *',
      'main img', 'main svg',
      'img', 'svg'
    ],
    perItemStep: 100,
    jitter: 240,
    baseDelay: 140,
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

  // --- utils ---
  const uniq = a => Array.from(new Set(a));
  const choose = a => a[Math.floor(Math.random() * a.length)];
  const rInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const rBetween = (min, max) => Math.random() * (max - min) + min;

  function visible(el) {
    const r = el.getBoundingClientRect?.();
    return r && r.width > 0 && r.height > 0;
  }

  function getTargets() {
    const bag = [];
    CFG.selectors.forEach(sel => document.querySelectorAll(sel).forEach(n => bag.push(n)));
    let list = uniq(bag).filter(n => {
      const tag = n.tagName || '';
      if (/^(SCRIPT|LINK|STYLE|META|HEAD)$/.test(tag)) return false;
      return visible(n);
    });
    list = list.filter(n => {
      const t = (n.tagName || '').toLowerCase();
      if ((t === 'div' || t === 'section' || t === 'article') && n.children.length === 0) return false;
      return true;
    });
    return list.length > CFG.hardCap ? list.slice(0, CFG.hardCap) : list;
  }

  function waitImages(nodes) {
    const imgs = [];
    nodes.forEach(n => {
      if (n.tagName && n.tagName.toLowerCase() === 'img') imgs.push(n);
      n.querySelectorAll && n.querySelectorAll('img').forEach(i => imgs.push(i));
    });
    const pending = uniq(imgs).filter(i => !(i.complete && i.naturalWidth > 0));
    if (!pending.length) return Promise.resolve();
    return new Promise(resolve => {
      let left = pending.length;
      const done = () => { if (--left <= 0) resolve(); };
      pending.forEach(i => {
        i.addEventListener('load', done, { once: true });
        i.addEventListener('error', done, { once: true });
      });
      setTimeout(resolve, 2500);
    });
  }

  // --- main ---
  async function run() {
    const nodes = getTargets();
    if (!nodes.length) {
      if (stage) { stage.style.visibility = 'visible'; stage.style.opacity = '1'; }
      return;
    }

    nodes.forEach(n => {
      n.classList.add('kw-pre-hide');
      n.style.willChange = 'transform, opacity, filter';
    });

    await waitImages(nodes);

    if (stage) {
      stage.style.visibility = 'visible';
      stage.style.opacity = '1';
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);

        const idx = nodes.indexOf(el);
        const delay = Math.max(
          0,
          Math.min(CFG.maxDelay, CFG.baseDelay + idx * CFG.perItemStep + rInt(-CFG.jitter / 2, CFG.jitter / 2))
        );
        const dur = rBetween(CFG.durMin, CFG.durMax);
        const variant = choose(CFG.variants);

        // เก็บ transform พื้นฐานก่อนเล่น (สำคัญสำหรับ drag/resize)
        const baseTransform = el.style.transform || '';

        setTimeout(() => {
          if (!document.body.contains(el)) return;

          el.classList.remove('kw-pre-hide');

          const anim = el.animate(
            [
              { opacity: 0, transform: variant.from, filter: `blur(${variant.blur}px)` },
              { opacity: 1, transform: baseTransform || 'none', filter: 'blur(0px)' }
            ],
            {
              duration: dur,
              easing: CFG.easing,
              fill: 'none' // ไม่ทิ้งค่าไว้
            }
          );

          anim.addEventListener('finish', () => {
            // คืนค่าเดิมทั้งหมด เพื่อให้ drag/resize ทำงานผ่าน inline transform ได้
            el.style.opacity = '1';
            el.style.transform = baseTransform;
            el.style.filter = 'none';
            el.style.willChange = 'auto';
            anim.cancel(); // ปลดอิทธิพลแอนิเมชันให้หมด
          });
        }, delay);
      });
    }, { threshold: 0.01 });

    nodes.forEach(n => io.observe(n));
  }

  // รอจนสคริปต์จัดวางของคุณทำงานเสร็จก่อน แล้วค่อยเล่น
  window.addEventListener('load', run, { once: true });
})();
