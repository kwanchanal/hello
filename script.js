const draggables = document.querySelectorAll('.draggable');
let active = null, offsetX = 0, offsetY = 0;

draggables.forEach(el => {
  el.addEventListener('mousedown', startDrag);
  el.addEventListener('touchstart', startDrag);

  function startDrag(e) {
    active = el;
    const rect = el.getBoundingClientRect();
    if (e.type === 'mousedown') {
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', endDrag);
    } else {
      offsetX = e.touches[0].clientX - rect.left;
      offsetY = e.touches[0].clientY - rect.top;
      document.addEventListener('touchmove', drag);
      document.addEventListener('touchend', endDrag);
    }
  }

  function drag(e) {
    if (!active) return;
    let clientX = e.clientX || e.touches[0].clientX;
    let clientY = e.clientY || e.touches[0].clientY;
    active.style.left = (clientX - offsetX) + 'px';
    active.style.top = (clientY - offsetY) + 'px';
  }

  function endDrag() {
    active = null;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', endDrag);
  }
});
