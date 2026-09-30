import { clamp } from './utils.js';
import { settings, onSettingsChange } from './settings.js';

// Die Sound-Effekte selbst sind absichtlich leise ausgesteuert (einzelne
// Lautstärken um .1-.5); ohne diesen Boost wirkt selbst der volle Regler zu
// leise. Der Regler bleibt 0-1, das Ergebnis ist einfach lauter/leiser skaliert.
const SFX_GAIN_SCALE = 2.4;

let AC = null, master = null, noiseBuf = null;

export function initAudio() {
  if (AC) { if (AC.resume) AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = settings.sfxVolume * SFX_GAIN_SCALE; master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * .5, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
}
onSettingsChange((key, value) => { if (key === 'sfxVolume' && master) master.gain.value = value * SFX_GAIN_SCALE; });

function noise(dur, freq, type, vol, q = 1, delay = 0) {
  if (!AC) return; const t = AC.currentTime + delay;
  const s = AC.createBufferSource(); s.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + .03);
}
function tone(f0, f1, dur, type, vol, delay = 0) {
  if (!AC) return; const t = AC.currentTime + delay;
  const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .03);
}

export const sfx = {
  shot() { noise(.13, 2400, 'lowpass', .5); tone(170, 45, .11, 'sine', .45); },
  bot(dist) { const v = clamp(1 - dist / 70, .06, .6) * .45; noise(.1, 1300, 'bandpass', v, .8); tone(320, 90, .07, 'square', v * .2); },
  hit(head) { if (head) tone(2300, 1900, .08, 'triangle', .22); else tone(1400, 1300, .04, 'square', .08); },
  kill() { tone(520, 1100, .14, 'triangle', .18); tone(780, 1560, .12, 'sine', .1, .05); },
  hurt() { tone(130, 55, .22, 'sawtooth', .18); noise(.12, 600, 'lowpass', .25); },
  reload() { noise(.03, 3200, 'highpass', .3); noise(.04, 2200, 'highpass', .35, 1, .75); noise(.03, 3800, 'highpass', .3, 1, 1.25); },
  empty() { noise(.02, 4000, 'highpass', .25); },
  pickup() { tone(500, 1000, .16, 'sine', .22); tone(750, 1500, .16, 'sine', .12, .08); },
  wave() { tone(220, 220, .35, 'sawtooth', .07); tone(330, 330, .35, 'sawtooth', .05, .12); },
  step() { noise(.05, 300, 'lowpass', .06); }
};
