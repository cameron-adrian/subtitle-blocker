const profileSelect = document.getElementById('profile-select');
const loadBtn = document.getElementById('load-btn');
const deleteBtn = document.getElementById('delete-btn');
const profileName = document.getElementById('profile-name');
const saveBtn = document.getElementById('save-btn');
const opacitySlider = document.getElementById('opacity-slider');
const opacityValue = document.getElementById('opacity-value');
const colorPicker = document.getElementById('color-picker');

async function refreshProfileList() {
  const profiles = await window.api.listProfiles();
  profileSelect.innerHTML = '<option value="">-- Select Profile --</option>';
  profiles.forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    profileSelect.appendChild(opt);
  });
}

loadBtn.addEventListener('click', async () => {
  const name = profileSelect.value;
  if (!name) return;

  const data = await window.api.loadProfile(name);
  if (data) {
    window.api.applyProfile(data);
    window.api.setLastProfile(name);

    // Sync appearance controls
    if (data.opacity !== undefined) {
      opacitySlider.value = data.opacity;
      opacityValue.textContent = Math.round(data.opacity * 100) + '%';
    }
    if (data.color !== undefined) {
      colorPicker.value = data.color;
    }
  }
});

deleteBtn.addEventListener('click', async () => {
  const name = profileSelect.value;
  if (!name) return;

  await window.api.deleteProfile(name);
  await refreshProfileList();
});

saveBtn.addEventListener('click', async () => {
  const name = profileName.value.trim();
  if (!name) {
    profileName.focus();
    return;
  }

  const state = await window.api.getBlockerState();
  if (state) {
    await window.api.saveProfile(name, state);
    await window.api.setLastProfile(name);
    profileName.value = '';
    await refreshProfileList();
    profileSelect.value = name;
  }
});

opacitySlider.addEventListener('input', () => {
  const val = parseFloat(opacitySlider.value);
  opacityValue.textContent = Math.round(val * 100) + '%';
  window.api.setOpacity(val);
});

colorPicker.addEventListener('input', () => {
  window.api.setColor(colorPicker.value);
});

// Init
refreshProfileList();
