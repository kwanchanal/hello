// stagger-onload.js — animate เฉพาะของที่ไม่ draggable
(() => {
  const CFG = {
    selectors: [
      '#stage > *:not(.draggable)',
      '#stage img:not(.draggable)',
      '#stage svg:not(.draggable)',
      '.elements img:not(.draggable)',
      '.elements svg:not(.draggable)',
      '.elements > *:not(.draggable)',
      'main img:not(.draggable)',
      'main svg:not(.draggable)'
    ],
    stagger: 90,
    duration: 600,
    easing: 'cubic-bezier(.2,.75,.25,1.2)'
  };

  function animateElements(nodes){
    nodes.forEach((el, i) => {
      const anim = el.animate(
        [
          { opacity: 0, transform: 'translateY(20px) scale(.96)', filter:'blur(1.5px)' },
          { opacity: 1, transform: 'translateY(0) scale(1)',      filter:'blur(0)' }
        ],
        { duration: CFG.duration, delay: i*CFG.stagger, easing: CFG.easing, fill: 'none' }
      );
      anim.addEventListener('finish', () => anim.cancel());
    });
  }

  window.addEventListener('load', () => {
    const els = Array.from(document.querySelectorAll(CFG.selectors.join(',')));
    if (els.length) animateElements(els);
  }, { once: true });
})();
