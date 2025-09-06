// stagger-onload.js
(() => {
  const CFG = {
    selectors: [
      // interactive elements (.draggable) ถูกตัดออกไป ไม่ animate
      '#stage > *:not(.draggable)',
      '#stage img:not(.draggable)',
      '#stage svg:not(.draggable)',
      '.elements img:not(.draggable)',
      '.elements svg:not(.draggable)',
      '.elements > *:not(.draggable)',
      'main img:not(.draggable)',
      'main svg:not(.draggable)',
      'img:not(.draggable)',
      'svg:not(.draggable)'
    ],
    rootMargin: '0px',
    threshold: 0.1,
    stagger: 100, // ms ระยะห่าง
    duration: 600 // ms ระยะเวลา animate
  };

  function animateElements(targets) {
    targets.forEach((el, idx) => {
      const delay = idx * CFG.stagger;
      const anim = el.animate(
        [
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: CFG.duration,
          delay,
          fill: 'none',
          easing: 'ease-out'
        }
      );
      anim.addEventListener('finish', () => anim.cancel()); // reset style
    });
  }

  window.addEventListener('load', () => {
    const els = document.querySelectorAll(CFG.selectors.join(','));
    animateElements(Array.from(els));
  });
})();
