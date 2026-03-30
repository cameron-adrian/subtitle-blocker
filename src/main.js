const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { createTray } = require('./lib/tray');
const { registerShortcuts } = require('./lib/shortcuts');
const profiles = require('./lib/profiles');

let overlayWin = null;
let settingsWin = null;
let tray = null;

function createOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().bounds;

  overlayWin = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    resizable: false,
    fullscreenable: false,
    type: 'panel',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWin.setAlwaysOnTop(true, 'screen-saver');
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWin.setIgnoreMouseEvents(true, { forward: true });
  overlayWin.loadFile(path.join(__dirname, 'overlay', 'overlay.html'));

  // Re-assert always-on-top periodically to survive macOS Space transitions
  setInterval(() => {
    if (overlayWin && !overlayWin.isDestroyed()) {
      overlayWin.setAlwaysOnTop(true, 'screen-saver');
    }
  }, 1000);
}

function createSettingsWindow() {
  settingsWin = new BrowserWindow({
    width: 420,
    height: 520,
    show: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWin.setMenuBarVisibility(false);
  settingsWin.loadFile(path.join(__dirname, 'settings', 'settings.html'));

  settingsWin.on('close', (e) => {
    e.preventDefault();
    settingsWin.hide();
  });
}

function showSettings() {
  if (settingsWin) {
    settingsWin.show();
    settingsWin.focus();
  }
}

function toggleBlocker() {
  if (overlayWin) {
    overlayWin.webContents.send('toggle-visibility');
  }
}

// IPC handlers

ipcMain.on('set-ignore-mouse', (_event, ignore) => {
  if (overlayWin) {
    overlayWin.setIgnoreMouseEvents(ignore, { forward: true });
    if (!ignore) {
      overlayWin.setFocusable(true);
    } else {
      overlayWin.setFocusable(false);
    }
  }
});

ipcMain.handle('list-profiles', () => {
  return profiles.listProfiles();
});

ipcMain.handle('load-profile', (_event, name) => {
  return profiles.loadProfile(name);
});

ipcMain.handle('save-profile', (_event, name, data) => {
  profiles.saveProfile(name, data);
});

ipcMain.handle('delete-profile', (_event, name) => {
  profiles.deleteProfile(name);
});

ipcMain.on('apply-profile', (_event, data) => {
  if (overlayWin) {
    overlayWin.webContents.send('update-blocker', data);
  }
});

ipcMain.on('set-opacity', (_event, value) => {
  if (overlayWin) {
    overlayWin.webContents.send('update-opacity', value);
  }
});

ipcMain.on('set-color', (_event, value) => {
  if (overlayWin) {
    overlayWin.webContents.send('update-color', value);
  }
});

ipcMain.handle('get-blocker-state', () => {
  return new Promise((resolve) => {
    if (overlayWin) {
      overlayWin.webContents.send('request-state');
      ipcMain.once('blocker-state', (_event, state) => {
        resolve(state);
      });
    } else {
      resolve(null);
    }
  });
});

ipcMain.handle('get-last-profile', () => {
  return profiles.getLastProfile();
});

ipcMain.handle('set-last-profile', (_event, name) => {
  profiles.setLastProfile(name);
});

// App lifecycle

app.whenReady().then(async () => {
  // Hide dock icon on macOS so the app acts as a background utility,
  // which helps the panel window float above fullscreen Spaces
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  createOverlayWindow();
  createSettingsWindow();
  tray = createTray(toggleBlocker, showSettings);
  registerShortcuts(toggleBlocker, showSettings);

  // Load last used profile
  const lastProfile = profiles.getLastProfile();
  if (lastProfile) {
    const data = profiles.loadProfile(lastProfile);
    if (data) {
      // Give overlay a moment to load
      overlayWin.webContents.once('did-finish-load', () => {
        overlayWin.webContents.send('update-blocker', data);
      });
    }
  }
});

app.on('will-quit', () => {
  const { globalShortcut } = require('electron');
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Keep app running (tray-based)
});
