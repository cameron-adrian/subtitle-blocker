(() => {
  // Avoid double-injection if the script is re-run (e.g. SPA navigation).
  if (window.__subtitleBlockerInjected) return;
  window.__subtitleBlockerInjected = true;

  // ---- Shadow-DOM overlay setup ----------------------------------------
  const host = document.createElement('div');
  host.id = 'subtitle-blocker-host';
  // The host itself takes no space and intercepts no events — pointer-events
  // on the wrapper/blocker decide what's interactive.
  host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; width: 0; height: 0;';

  const shadow = host.attachShadow({ mode: 'open' });

  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = api.runtime.getURL('src/content/overlay.css');
  shadow.appendChild(styleLink);

  const wrapper = document.createElement('div');
  wrapper.className = 'wrapper';
  shadow.appendChild(wrapper);

  const blocker = document.createElement('div');
  blocker.className = 'blocker';
  wrapper.appendChild(blocker);

  const HANDLE_CLASSES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  for (const dir of HANDLE_CLASSES) {
    const h = document.createElement('div');
    h.className = `resize-handle resize-${dir}`;
    h.dataset.dir = dir;
    blocker.appendChild(h);
  }

  document.documentElement.appendChild(host);

  // Initial position: horizontally centered, near the bottom of the viewport.
  function applyInitialPosition() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(DEFAULT_WIDTH, vw - 40);
    const h = DEFAULT_HEIGHT;
    blocker.style.width = w + 'px';
    blocker.style.height = h + 'px';
    blocker.style.left = Math.round((vw - w) / 2) + 'px';
    blocker.style.top = Math.max(0, vh - h - DEFAULT_BOTTOM_OFFSET) + 'px';
    blocker.style.opacity = String(DEFAULT_OPACITY);
    blocker.style.background = DEFAULT_COLOR;
    setBlur(DEFAULT_BLUR);
  }

  function setBlur(px) {
    const n = Number(px) || 0;
    const filter = n > 0 ? `blur(${n}px)` : '';
    blocker.style.backdropFilter = filter;
    // Safari / older WebKit alias.
    blocker.style.webkitBackdropFilter = filter;
    blocker.dataset.blur = String(n);
  }
  applyInitialPosition();

  // ---- Drag / resize ---------------------------------------------------
  // Ported from the Electron overlay; screenX/Y -> clientX/Y because the
  // overlay now lives in the page viewport, not a fullscreen OS window.
  let isDragging = false;
  let isResizing = false;
  let resizeEdges = { n: false, s: false, e: false, w: false };
  let dragStartX = 0;
  let dragStartY = 0;
  let startRect = { x: 0, y: 0, w: 0, h: 0 };

  blocker.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('resize-handle')) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startRect.x = blocker.offsetLeft;
    startRect.y = blocker.offsetTop;
    e.preventDefault();
    e.stopPropagation();
  });

  shadow.querySelectorAll('.resize-handle').forEach((handle) => {
    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      const dir = handle.dataset.dir;
      resizeEdges = {
        n: dir.includes('n'),
        s: dir.includes('s'),
        e: dir.includes('e'),
        w: dir.includes('w'),
      };
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      startRect.x = blocker.offsetLeft;
      startRect.y = blocker.offsetTop;
      startRect.w = blocker.offsetWidth;
      startRect.h = blocker.offsetHeight;
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Attach drag/resize move+up to window (capture phase) so we keep tracking
  // even if the pointer strays off the blocker while the button is held.
  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      blocker.style.left = (startRect.x + dx) + 'px';
      blocker.style.top = (startRect.y + dy) + 'px';
    } else if (isResizing) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

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
  }, true);

  window.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
  }, true);

  // ---- Fullscreen re-parenting ----------------------------------------
  // A fullscreen element is rendered in the browser's top layer above
  // everything else, so our overlay must be re-attached inside it to stay
  // on top of the video.
  document.addEventListener('fullscreenchange', () => {
    const fsEl = document.fullscreenElement;
    const parent = fsEl || document.documentElement;
    if (host.parentNode !== parent) {
      parent.appendChild(host);
    }
  });

  // ---- Messaging ------------------------------------------------------
  function getState() {
    return {
      x: blocker.offsetLeft,
      y: blocker.offsetTop,
      width: blocker.offsetWidth,
      height: blocker.offsetHeight,
      opacity: parseFloat(blocker.style.opacity) || DEFAULT_OPACITY,
      color: rgbToHex(blocker.style.background) || DEFAULT_COLOR,
      blur: Number(blocker.dataset.blur) || DEFAULT_BLUR,
    };
  }

  function applyState(data) {
    if (data.x !== undefined) blocker.style.left = data.x + 'px';
    if (data.y !== undefined) blocker.style.top = data.y + 'px';
    if (data.width !== undefined) blocker.style.width = data.width + 'px';
    if (data.height !== undefined) blocker.style.height = data.height + 'px';
    if (data.opacity !== undefined) blocker.style.opacity = String(data.opacity);
    if (data.color !== undefined) blocker.style.background = data.color;
    if (data.blur !== undefined) setBlur(data.blur);
  }

  // The popup stores colors as hex, but CSSStyleDeclaration.background
  // normalizes to rgb()/rgba(). Convert back so state round-trips cleanly.
  function rgbToHex(str) {
    if (!str) return null;
    if (str.startsWith('#')) return str;
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    const h = (n) => Number(n).toString(16).padStart(2, '0');
    return '#' + h(m[1]) + h(m[2]) + h(m[3]);
  }

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || !msg.type) return;
    switch (msg.type) {
      case MSG.PING:
        sendResponse({ ok: true });
        return;
      case MSG.TOGGLE_VISIBILITY:
        wrapper.classList.toggle('hidden');
        sendResponse({ hidden: wrapper.classList.contains('hidden') });
        return;
      case MSG.UPDATE_BLOCKER:
        applyState(msg.data || {});
        sendResponse({ ok: true });
        return;
      case MSG.SET_OPACITY:
        blocker.style.opacity = String(msg.value);
        sendResponse({ ok: true });
        return;
      case MSG.SET_COLOR:
        blocker.style.background = msg.value;
        sendResponse({ ok: true });
        return;
      case MSG.SET_BLUR:
        setBlur(msg.value);
        sendResponse({ ok: true });
        return;
      case MSG.GET_STATE:
        sendResponse({
          state: getState(),
          hidden: wrapper.classList.contains('hidden'),
        });
        return;
    }
  });

  // ---- Auto-apply last profile for this host --------------------------
  (async () => {
    try {
      const last = await getLastProfile();
      if (last) {
        const data = await loadProfile(last);
        if (data) applyState(data);
      }
    } catch (_err) {
      // Storage may briefly be unavailable during SW startup; ignore.
    }
  })();
})();
