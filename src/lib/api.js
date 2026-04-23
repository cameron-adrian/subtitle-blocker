// Unified WebExtension API handle.
// Firefox exposes `browser` with Promise-returning methods.
// Chrome exposes `chrome`; in MV3 its methods also return Promises when no
// callback is passed (storage.local since Chrome 88, tabs since 99, runtime since 99).
// In service workers `globalThis` covers both window and worker scopes.
const api = globalThis.browser || globalThis.chrome;
