const { globalShortcut, app } = require('electron');

function registerShortcuts(toggleBlocker, showSettings) {
  globalShortcut.register('CommandOrControl+Shift+H', toggleBlocker);
  globalShortcut.register('CommandOrControl+Shift+S', showSettings);
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    app.exit(0);
  });
}

module.exports = { registerShortcuts };
