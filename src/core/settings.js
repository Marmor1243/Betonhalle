import { store } from './utils.js';

const DEFAULTS = { sfxVolume: .5, musicVolume: .5, fov: 75, shake: 1, adsToggle: false, minimap: true, minimapSize: 160, sens: 1.2 };

// Die zugrundeliegende Lautstärke-Skalierung (siehe audio.js/music.js) hat sich
// geändert - ältere gespeicherte Regler-Stände würden dadurch falsch klingen.
// Beim ersten Laden nach diesem Update werden Effekt-/Musik-Lautstärke daher
// einmalig hart auf die neue Mitte zurückgesetzt.
const AUDIO_TUNE_VERSION = 2;

function load() {
  let saved;
  try { saved = JSON.parse(store('bh_settings')) || {}; } catch (e) { saved = {}; }
  const merged = Object.assign({}, DEFAULTS, saved);
  if (saved._audioTune !== AUDIO_TUNE_VERSION) {
    merged.sfxVolume = DEFAULTS.sfxVolume;
    merged.musicVolume = DEFAULTS.musicVolume;
    merged._audioTune = AUDIO_TUNE_VERSION;
    store('bh_settings', JSON.stringify(merged));
  }
  return merged;
}

export const settings = load();

const listeners = [];
export function onSettingsChange(fn) { listeners.push(fn); }

export function setSetting(key, value) {
  settings[key] = value;
  store('bh_settings', JSON.stringify(settings));
  for (const fn of listeners) fn(key, value);
}
