const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Mouse click-through
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),

  // Overlay listeners
  onToggleVisibility: (callback) => ipcRenderer.on('toggle-visibility', callback),
  onUpdateBlocker: (callback) => ipcRenderer.on('update-blocker', (_event, data) => callback(data)),
  onUpdateOpacity: (callback) => ipcRenderer.on('update-opacity', (_event, value) => callback(value)),
  onUpdateColor: (callback) => ipcRenderer.on('update-color', (_event, value) => callback(value)),
  onRequestState: (callback) => ipcRenderer.on('request-state', callback),
  sendBlockerState: (state) => ipcRenderer.send('blocker-state', state),

  // Profile management
  listProfiles: () => ipcRenderer.invoke('list-profiles'),
  loadProfile: (name) => ipcRenderer.invoke('load-profile', name),
  saveProfile: (name, data) => ipcRenderer.invoke('save-profile', name, data),
  deleteProfile: (name) => ipcRenderer.invoke('delete-profile', name),

  // Apply profile to overlay
  applyProfile: (data) => ipcRenderer.send('apply-profile', data),

  // Opacity
  setOpacity: (value) => ipcRenderer.send('set-opacity', value),

  // Color
  setColor: (value) => ipcRenderer.send('set-color', value),

  // Blocker state
  getBlockerState: () => ipcRenderer.invoke('get-blocker-state'),

  // Last profile
  getLastProfile: () => ipcRenderer.invoke('get-last-profile'),
  setLastProfile: (name) => ipcRenderer.invoke('set-last-profile', name),
});
