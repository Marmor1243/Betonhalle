import { $, clamp } from '../core/utils.js';
import { settings } from '../core/settings.js';
import { S, P, aliveCount } from './state.js';
import { missionStatusText } from './story.js';
import { drawMinimap } from './minimap.js';

const hudCache = {};
function setT(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }

let bannerTimer = 0;
export function banner(t, s) { $('bannerT').textContent = t; $('bannerS').textContent = s || ''; $('banner').classList.add('on'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => $('banner').classList.remove('on'), 2200); }
export function hitmarker(kill) { const h = $('hitm'); h.classList.remove('on', 'kill'); void h.offsetWidth; h.classList.add('on'); if (kill) h.classList.add('kill'); }
export function feed(txt, hs) {
  const f = $('feed'), d = document.createElement('div'); d.textContent = txt; if (hs) d.className = 'hs';
  f.prepend(d); while (f.children.length > 5) f.lastChild.remove();
  setTimeout(() => d.remove(), 4500);
}
export function dmgIndicator(fx, fz) {
  const vx = fx - P.x, vz = fz - P.z;
  const fwx = -Math.sin(P.yaw), fwz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
  const ang = Math.atan2(vx * rx + vz * rz, vx * fwx + vz * fwz);
  const d = document.createElement('div'); d.className = 'dmg'; d.style.transform = `rotate(${ang}rad)`;
  $('dmgring').appendChild(d); setTimeout(() => d.remove(), 1150);
}
export function spreadNow(moving) {
  const base = .003 + (moving ? .016 : 0) + (P.onGround ? 0 : .05) + S.bloom;
  return S.ads ? base * .35 : base;
}
export function updateHUD() {
  if (S.gameType === 'story') {
    setT('topLbl', 'Mission'); setT('waveN', '');
    setT('botsLeft', missionStatusText());
  } else {
    setT('topLbl', 'Welle'); setT('waveN', String(S.wave || 1));
    const left = S.toSpawn + aliveCount();
    setT('botsLeft', S.intermission > 0 ? 'Pause zwischen den Wellen' : left === 1 ? '1 Bot übrig' : left + ' Bots übrig');
  }
  setT('score', S.score.toLocaleString('de-DE'));
  setT('kills', String(S.kills));
  const hp = Math.max(0, Math.ceil(S.hp));
  setT('hpN', String(hp));
  const bar = $('hpBar'); bar.style.width = hp + '%'; bar.classList.toggle('low', hp <= 30);
  setT('ammoN', String(S.ammo));
  $('ammo').classList.toggle('empty', S.ammo === 0);
  setT('ammoLbl', S.reloading > 0 ? 'Lädt nach …' : S.ammo === 0 ? 'Leer – R drücken' : 'Magazin');
  $('reloadBar').style.width = S.reloading > 0 ? ((1 - S.reloading / 1.6) * 100) + '%' : '0%';
  const moving = Math.hypot(P.vx, P.vz) > 1;
  const gap = 5 + (spreadNow(moving) * 520);
  const xh = $('xhair');
  xh.classList.toggle('ads', S.ads);
  const c = xh.children;
  c[0].style.top = (-gap - 9) + 'px'; c[1].style.top = gap + 'px'; c[2].style.left = (-gap - 9) + 'px'; c[3].style.left = gap + 'px';
  const since = S.time - S.lastHurt;
  const lowPulse = hp <= 30 ? .25 + Math.sin(S.time * 5) * .1 : 0;
  $('vignette').style.opacity = String(Math.max(clamp(1 - since * 1.8, 0, 1) * .8, lowPulse));
  const mm = $('minimap');
  mm.hidden = !settings.minimap;
  mm.style.width = mm.style.height = settings.minimapSize + 'px';
  $('stats').style.setProperty('--mmOffset', (settings.minimap ? settings.minimapSize + 18 : 0) + 'px');
  if (settings.minimap) drawMinimap();
}
