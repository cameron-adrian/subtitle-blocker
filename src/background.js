// MV3 service worker.
//
// The content script and popup talk to each other directly via
// tabs.sendMessage / runtime.onMessage, so the service worker has no
// long-lived responsibilities today. It exists because MV3 requires a
// background context for the extension, and to give us a hook for future
// features (e.g. commands API shortcuts, tab-lifecycle-driven profile
// auto-apply).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
