const profileSelect = document.getElementById('profile-select');
const loadBtn = document.getElementById('load-btn');
const deleteBtn = document.getElementById('delete-btn');
const profileName = document.getElementById('profile-name');
const saveBtn = document.getElementById('save-btn');
const toggleBtn = document.getElementById('toggle-btn');
const opacitySlider = document.getElementById('opacity-slider');
const opacityValue = document.getElementById('opacity-value');
const colorPicker = document.getElementById('color-picker');
const blurSlider = document.getElementById('blur-slider');
const blurValue = document.getElementById('blur-value');
const statusEl = document.getElementById('status');

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
  if (state.color) colorPicker.value = state.color;
  const blur = state.blur ?? 0;
  blurSlider.value = blur;
  blurValue.textContent = blur + 'px';
}

// --- Event wiring -----------------------------------------------------

toggleBtn.addEventListener('click', async () => {
  await sendToContent({ type: MSG.TOGGLE_VISIBILITY });
});

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
  if (data.color !== undefined) colorPicker.value = data.color;
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

colorPicker.addEventListener('input', async () => {
  await sendToContent({ type: MSG.SET_COLOR, value: colorPicker.value });
});

blurSlider.addEventListener('input', async () => {
  const val = parseInt(blurSlider.value, 10);
  blurValue.textContent = val + 'px';
  await sendToContent({ type: MSG.SET_BLUR, value: val });
});

// --- Init -------------------------------------------------------------

(async () => {
  await refreshProfileList();
  await syncFromContent();
})();
