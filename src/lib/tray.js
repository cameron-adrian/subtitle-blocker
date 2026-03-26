const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

let trayInstance = null;

function createTray(toggleBlocker, showSettings) {
  // Create a simple 16x16 icon programmatically (purple square)
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch {
    // Fallback: create a tiny icon from a data URL
    icon = nativeImage.createEmpty();
  }

  // If no icon file, create one from buffer
  if (icon.isEmpty()) {
    icon = createDefaultIcon();
  }

  trayInstance = new Tray(icon.resize({ width: 16, height: 16 }));
  trayInstance.setToolTip('Subtitle Blocker');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Blocker',
      click: toggleBlocker,
    },
    {
      label: 'Settings',
      click: showSettings,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.exit(0);
      },
    },
  ]);

  trayInstance.setContextMenu(contextMenu);
  trayInstance.on('click', toggleBlocker);

  return trayInstance;
}

function createDefaultIcon() {
  // Create a 16x16 RGBA buffer (purple square)
  const size = 16;
  const channels = 4;
  const buffer = Buffer.alloc(size * size * channels);
  for (let i = 0; i < size * size; i++) {
    buffer[i * channels + 0] = 203; // R
    buffer[i * channels + 1] = 166; // G
    buffer[i * channels + 2] = 247; // B
    buffer[i * channels + 3] = 255; // A
  }
  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

module.exports = { createTray };
