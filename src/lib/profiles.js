// Each setting lives in its own storage key so concurrent writers (popup +
// content scripts in different tabs) don't clobber each other through a
// shared read-modify-write blob. storage.local.set({k: v}) is per-key
// atomic, so independent keys eliminate the lost-write race.
const KEYS = {
  PROFILES: 'subtitle-blocker.profiles',
  LAST_PROFILE: 'subtitle-blocker.lastProfile',
  VISIBILITY_MODE: 'subtitle-blocker.visibilityMode',
  GLOBAL_VISIBLE: 'subtitle-blocker.globalVisible',
  FEATHER_EDGES: 'subtitle-blocker.featherEdges',
};

// Migrate the previous single-blob layout to the split keys. Existing
// installs would otherwise lose their saved profiles on upgrade. The promise
// is memoised so parallel callers all await the same migration.
const LEGACY_KEY = 'subtitle-blocker-store';
let _migrationPromise = null;

async function _doMigrate() {
  const { [LEGACY_KEY]: legacy } = await api.storage.local.get(LEGACY_KEY);
  if (!legacy) return;
  const writes = {};
  if (legacy.profiles) writes[KEYS.PROFILES] = legacy.profiles;
  if (legacy.lastProfile != null) writes[KEYS.LAST_PROFILE] = legacy.lastProfile;
  if (legacy.visibilityMode) writes[KEYS.VISIBILITY_MODE] = legacy.visibilityMode;
  if (legacy.globalVisible != null) writes[KEYS.GLOBAL_VISIBLE] = Boolean(legacy.globalVisible);
  if (legacy.featherEdges != null) writes[KEYS.FEATHER_EDGES] = Boolean(legacy.featherEdges);
  if (Object.keys(writes).length) await api.storage.local.set(writes);
  await api.storage.local.remove(LEGACY_KEY);
}

function _ensureMigrated() {
  if (!_migrationPromise) _migrationPromise = _doMigrate();
  return _migrationPromise;
}

async function _get(key, fallback) {
  await _ensureMigrated();
  const result = await api.storage.local.get(key);
  return result[key] ?? fallback;
}

async function _set(key, value) {
  await _ensureMigrated();
  await api.storage.local.set({ [key]: value });
}

async function listProfiles() {
  const profiles = await _get(KEYS.PROFILES, {});
  return Object.keys(profiles).sort();
}

async function loadProfile(name) {
  const profiles = await _get(KEYS.PROFILES, {});
  return profiles[name] || null;
}

// The profiles dict is the one key that still reads-modify-writes, but only
// the popup writes it and only one popup is open at a time, so writers
// aren't concurrent in practice.
async function saveProfile(name, data) {
  const profiles = await _get(KEYS.PROFILES, {});
  profiles[name] = data;
  await _set(KEYS.PROFILES, profiles);
}

async function deleteProfile(name) {
  const profiles = await _get(KEYS.PROFILES, {});
  delete profiles[name];
  await _set(KEYS.PROFILES, profiles);
  const last = await _get(KEYS.LAST_PROFILE, null);
  if (last === name) await _set(KEYS.LAST_PROFILE, null);
}

async function getLastProfile() {
  return _get(KEYS.LAST_PROFILE, null);
}

async function setLastProfile(name) {
  await _set(KEYS.LAST_PROFILE, name);
}

async function getVisibilityMode() {
  return _get(KEYS.VISIBILITY_MODE, DEFAULT_VISIBILITY_MODE);
}

async function setVisibilityMode(mode) {
  await _set(KEYS.VISIBILITY_MODE, mode);
}

async function getGlobalVisible() {
  return Boolean(await _get(KEYS.GLOBAL_VISIBLE, false));
}

async function setGlobalVisible(value) {
  await _set(KEYS.GLOBAL_VISIBLE, Boolean(value));
}

async function getFeatherEdges() {
  return Boolean(await _get(KEYS.FEATHER_EDGES, DEFAULT_FEATHER_EDGES));
}

async function setFeatherEdges(value) {
  await _set(KEYS.FEATHER_EDGES, Boolean(value));
}
