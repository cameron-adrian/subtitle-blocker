const profileSelect = document.getElementById('profile-select');
const loadBtn = document.getElementById('load-btn');
const deleteBtn = document.getElementById('delete-btn');
const profileName = document.getElementById('profile-name');
const saveBtn = document.getElementById('save-btn');
const toggleBtn = document.getElementById('toggle-btn');
const modeRadios = [...document.querySelectorAll('input[name="vis-mode"]')];
const opacitySlider = document.getElementById('opacity-slider');
const opacityValue = document.getElementById('opacity-value');
const swatches = [...document.querySelectorAll('.swatch')];
const colorHex = document.getElementById('color-hex');
const blurSlider = document.getElementById('blur-slider');
const blurValue = document.getElementById('blur-value');
const featherToggle = document.getElementById('feather-toggle');
const statusEl = document.getElementById('status');

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function setColorUI(color) {
  const lc = (color || '').toLowerCase();
  colorHex.value = lc;
  for (const s of swatches) {
    s.classList.toggle('active', s.dataset.color.toLowerCase() === lc);
  }
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
  if (text) {
    setTimeout(() => {
      if (statusEl.textContent === text) {
        statusEl.textContent = '';
        statusEl.classList.remove('error');
      }
    }, 2500);
  }
}

async function getActiveTabId() {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  return tab ? tab.id : null;
}

async function sendToContent(message) {
  const tabId = await getActiveTabId();
  if (tabId == null) {
    setStatus('No active tab', true);
    return null;
  }
  try {
    return await api.tabs.sendMessage(tabId, message);
  } catch (err) {
    setStatus("Overlay not available on this page", true);
    return null;
  }
}

async function refreshProfileList(preselect) {
  const names = await listProfiles();
  profileSelect.innerHTML = '<option value="">-- Select Profile --</option>';
  for (const name of names) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    profileSelect.appendChild(opt);
  }
  if (preselect && names.includes(preselect)) {
    profileSelect.value = preselect;
  }
}

async function syncFromContent() {
  const resp = await sendToContent({ type: MSG.GET_STATE });
  if (!resp || !resp.state) return;
  const { state } = resp;
  opacitySlider.value = state.opacity;
  opacityValue.textContent = Math.round(state.opacity * 100) + '%';
  if (state.color) setColorUI(state.color);
  const blur = state.blur ?? 0;
  blurSlider.value = blur;
  blurValue.textContent = blur + 'px';
}

// --- Event wiring -----------------------------------------------------

toggleBtn.addEventListener('click', async () => {
  await sendToContent({ type: MSG.TOGGLE_VISIBILITY });
});

for (const radio of modeRadios) {
  radio.addEventListener('change', async () => {
    if (!radio.checked) return;
    if (radio.value === MODE_GLOBAL) {
      // Seed globalVisible from the active tab so the mode switch doesn't
      // surprise the user by flipping the current tab's visibility. Every
      // other tab then adopts this state via storage.onChanged.
      const resp = await sendToContent({ type: MSG.GET_STATE });
      const visible = resp ? !resp.hidden : false;
      await setGlobalVisible(visible);
    }
    await setVisibilityMode(radio.value);
  });
}

loadBtn.addEventListener('click', async () => {
  const name = profileSelect.value;
  if (!name) return;
  const data = await loadProfile(name);
  if (!data) {
    setStatus('Profile not found', true);
    return;
  }
  await setLastProfile(name);
  await sendToContent({ type: MSG.UPDATE_BLOCKER, data });
  if (data.opacity !== undefined) {
    opacitySlider.value = data.opacity;
    opacityValue.textContent = Math.round(data.opacity * 100) + '%';
  }
  if (data.color !== undefined) setColorUI(data.color);
  if (data.blur !== undefined) {
    blurSlider.value = data.blur;
    blurValue.textContent = data.blur + 'px';
  }
  setStatus(`Loaded "${name}"`);
});

deleteBtn.addEventListener('click', async () => {
  const name = profileSelect.value;
  if (!name) return;
  await deleteProfile(name);
  await refreshProfileList();
  setStatus(`Deleted "${name}"`);
});

saveBtn.addEventListener('click', async () => {
  const name = profileName.value.trim();
  if (!name) {
    profileName.focus();
    return;
  }
  const resp = await sendToContent({ type: MSG.GET_STATE });
  if (!resp || !resp.state) return;
  await saveProfile(name, resp.state);
  await setLastProfile(name);
  profileName.value = '';
  await refreshProfileList(name);
  setStatus(`Saved "${name}"`);
});

opacitySlider.addEventListener('input', async () => {
  const val = parseFloat(opacitySlider.value);
  opacityValue.textContent = Math.round(val * 100) + '%';
  await sendToContent({ type: MSG.SET_OPACITY, value: val });
});

// Preset color swatches. Using plain buttons instead of <input type="color">
// because the native OS color-picker dialog takes focus away from the
// extension popup in Firefox, which causes the popup to close before the
// user's choice commits.
for (const sw of swatches) {
  sw.addEventListener('click', async () => {
    const color = sw.dataset.color;
    setColorUI(color);
    await sendToContent({ type: MSG.SET_COLOR, value: color });
  });
}

colorHex.addEventListener('change', async () => {
  const val = colorHex.value.trim();
  if (!HEX_RE.test(val)) {
    setStatus('Hex must be #rrggbb', true);
    return;
  }
  setColorUI(val);
  await sendToContent({ type: MSG.SET_COLOR, value: val });
});

blurSlider.addEventListener('input', async () => {
  const val = parseInt(blurSlider.value, 10);
  blurValue.textContent = val + 'px';
  await sendToContent({ type: MSG.SET_BLUR, value: val });
});

featherToggle.addEventListener('change', async () => {
  await setFeatherEdges(featherToggle.checked);
  // Content scripts pick up the change via storage.onChanged.
});

async function syncMode() {
  const mode = await getVisibilityMode();
  for (const radio of modeRadios) {
    radio.checked = radio.value === mode;
  }
}

async function syncFeather() {
  featherToggle.checked = await getFeatherEdges();
}

// --- Init -------------------------------------------------------------

(async () => {
  await Promise.all([refreshProfileList(), syncMode(), syncFeather()]);
  await syncFromContent();
})();
