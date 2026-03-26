const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function getFilePath() {
  return path.join(app.getPath('userData'), 'profiles.json');
}

function readStore() {
  const filePath = getFilePath();
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { profiles: {}, lastProfile: null };
  }
}

function writeStore(store) {
  const filePath = getFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

function listProfiles() {
  const store = readStore();
  return Object.keys(store.profiles);
}

function loadProfile(name) {
  const store = readStore();
  return store.profiles[name] || null;
}

function saveProfile(name, data) {
  const store = readStore();
  store.profiles[name] = data;
  writeStore(store);
}

function deleteProfile(name) {
  const store = readStore();
  delete store.profiles[name];
  if (store.lastProfile === name) {
    store.lastProfile = null;
  }
  writeStore(store);
}

function getLastProfile() {
  const store = readStore();
  return store.lastProfile;
}

function setLastProfile(name) {
  const store = readStore();
  store.lastProfile = name;
  writeStore(store);
}

module.exports = {
  listProfiles,
  loadProfile,
  saveProfile,
  deleteProfile,
  getLastProfile,
  setLastProfile,
};
