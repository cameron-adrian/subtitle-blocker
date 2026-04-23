const STORE_KEY = 'subtitle-blocker-store';

async function _readStore() {
  const result = await api.storage.local.get(STORE_KEY);
  return result[STORE_KEY] || { profiles: {}, lastProfile: null };
}

async function _writeStore(store) {
  await api.storage.local.set({ [STORE_KEY]: store });
}

async function listProfiles() {
  const store = await _readStore();
  return Object.keys(store.profiles).sort();
}

async function loadProfile(name) {
  const store = await _readStore();
  return store.profiles[name] || null;
}

async function saveProfile(name, data) {
  const store = await _readStore();
  store.profiles[name] = data;
  await _writeStore(store);
}

async function deleteProfile(name) {
  const store = await _readStore();
  delete store.profiles[name];
  if (store.lastProfile === name) store.lastProfile = null;
  await _writeStore(store);
}

async function getLastProfile() {
  const store = await _readStore();
  return store.lastProfile;
}

async function setLastProfile(name) {
  const store = await _readStore();
  store.lastProfile = name;
  await _writeStore(store);
}
