const blocker = document.getElementById('blocker');

const MIN_WIDTH = 100;
const MIN_HEIGHT = 30;

let isDragging = false;
let isResizing = false;
let resizeEdges = { n: false, s: false, e: false, w: false };
let dragStartX = 0;
let dragStartY = 0;
let startRect = { x: 0, y: 0, w: 0, h: 0 };

// Position the blocker absolutely (remove the CSS transform centering)
function initPosition() {
  const rect = blocker.getBoundingClientRect();
  blocker.style.left = rect.left + 'px';
  blocker.style.top = rect.top + 'px';
  blocker.style.transform = 'none';
  blocker.style.bottom = 'auto';
}

window.addEventListener('DOMContentLoaded', initPosition);

// Click-through toggle
blocker.addEventListener('mouseenter', () => {
  window.api.setIgnoreMouse(false);
});

blocker.addEventListener('mouseleave', () => {
  if (!isDragging && !isResizing) {
    window.api.setIgnoreMouse(true);
  }
});

// Drag logic
blocker.addEventListener('mousedown', (e) => {
  if (e.target.classList.contains('resize-handle')) return;

  isDragging = true;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
  startRect.x = blocker.offsetLeft;
  startRect.y = blocker.offsetTop;
  e.preventDefault();
});

// Resize logic
document.querySelectorAll('.resize-handle').forEach((handle) => {
  handle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeEdges = {
      n: handle.classList.contains('resize-n') || handle.classList.contains('resize-ne') || handle.classList.contains('resize-nw'),
      s: handle.classList.contains('resize-s') || handle.classList.contains('resize-se') || handle.classList.contains('resize-sw'),
      e: handle.classList.contains('resize-e') || handle.classList.contains('resize-ne') || handle.classList.contains('resize-se'),
      w: handle.classList.contains('resize-w') || handle.classList.contains('resize-nw') || handle.classList.contains('resize-sw'),
    };
    dragStartX = e.screenX;
    dragStartY = e.screenY;
    startRect.x = blocker.offsetLeft;
    startRect.y = blocker.offsetTop;
    startRect.w = blocker.offsetWidth;
    startRect.h = blocker.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
  });
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.screenX - dragStartX;
    const dy = e.screenY - dragStartY;
    blocker.style.left = (startRect.x + dx) + 'px';
    blocker.style.top = (startRect.y + dy) + 'px';
  } else if (isResizing) {
    const dx = e.screenX - dragStartX;
    const dy = e.screenY - dragStartY;

    let newX = startRect.x;
    let newY = startRect.y;
    let newW = startRect.w;
    let newH = startRect.h;

    if (resizeEdges.e) {
      newW = Math.max(MIN_WIDTH, startRect.w + dx);
    }
    if (resizeEdges.w) {
      const proposedW = startRect.w - dx;
      if (proposedW >= MIN_WIDTH) {
        newW = proposedW;
        newX = startRect.x + dx;
      }
    }
    if (resizeEdges.s) {
      newH = Math.max(MIN_HEIGHT, startRect.h + dy);
    }
    if (resizeEdges.n) {
      const proposedH = startRect.h - dy;
      if (proposedH >= MIN_HEIGHT) {
        newH = proposedH;
        newY = startRect.y + dy;
      }
    }

    blocker.style.left = newX + 'px';
    blocker.style.top = newY + 'px';
    blocker.style.width = newW + 'px';
    blocker.style.height = newH + 'px';
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging || isResizing) {
    isDragging = false;
    isResizing = false;
    // Check if cursor is still over blocker
    const rect = blocker.getBoundingClientRect();
    // We can't easily check here, so just leave mouse events enabled
    // The mouseleave on the blocker will handle it
  }
});

// IPC: toggle visibility
window.api.onToggleVisibility(() => {
  blocker.classList.toggle('hidden');
});

// IPC: update blocker from profile
window.api.onUpdateBlocker((data) => {
  if (data.x !== undefined) blocker.style.left = data.x + 'px';
  if (data.y !== undefined) blocker.style.top = data.y + 'px';
  if (data.width !== undefined) blocker.style.width = data.width + 'px';
  if (data.height !== undefined) blocker.style.height = data.height + 'px';
  if (data.opacity !== undefined) blocker.style.opacity = data.opacity;
  if (data.color !== undefined) blocker.style.background = data.color;
  blocker.style.transform = 'none';
  blocker.style.bottom = 'auto';
});

// IPC: update opacity
window.api.onUpdateOpacity((value) => {
  blocker.style.opacity = value;
});

// IPC: update color
window.api.onUpdateColor((value) => {
  blocker.style.background = value;
});

// IPC: send current state
window.api.onRequestState(() => {
  window.api.sendBlockerState({
    x: blocker.offsetLeft,
    y: blocker.offsetTop,
    width: blocker.offsetWidth,
    height: blocker.offsetHeight,
    opacity: parseFloat(blocker.style.opacity) || 0.85,
    color: blocker.style.background || '#000000',
  });
});
