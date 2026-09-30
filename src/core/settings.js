import { store } from './utils.js';

const DEFAULTS = { volume: .45, fov: 75, shake: 1, adsToggle: false, minimap: true, minimapSize: 160, sens: 1.2 };

function load() {
  try { return Object.assign({}, DEFAULTS, JSON.parse(store('bh_settings')) || {}); } catch (e) { return Object.assign({}, DEFAULTS); }
}

export const settings = load();

const listeners = [];
export function onSettingsChange(fn) { listeners.push(fn); }

export function setSetting(key, value) {
  settings[key] = value;
  store('bh_settings', JSON.stringify(settings));
  for (const fn of listeners) fn(key, value);
}
