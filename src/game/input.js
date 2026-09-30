import { $, isTouch } from '../core/utils.js';
import { settings, onSettingsChange } from '../core/settings.js';
import { canvas } from '../render/renderer.js';
import { S, P } from './state.js';
import { startReload } from './combat.js';
import { pause, resumePlay } from './flow.js';
import { toggleBigMap } from './minimap.js';

export const keys = {};
export let mouseDown = false, touchFire = false;
// aimHeld: rechte Maustaste ist gedrückt. Ob dadurch tatsächlich gezielt wird
// (S.ads), entscheidet update.js zusätzlich anhand von P.onGround.
export let aimHeld = false;
let locked = false, everLocked = false;
export let noLock = isTouch;
let mdx = 0, mdy = 0;

export function stopInput() { mouseDown = false; touchFire = false; aimHeld = false; }
onSettingsChange((key) => { if (key === 'adsToggle') aimHeld = false; });
export function consumeMouseDelta() { const dx = mdx, dy = mdy; mdx = mdy = 0; return { dx, dy }; }

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (S.mode === 'play') {
    if (e.code === 'KeyR') startReload();
    if (e.code === 'Tab') { e.preventDefault(); toggleBigMap(); }
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if ((e.code === 'Escape' || e.code === 'KeyP') && noLock) pause();
  }
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseDown = false; aimHeld = false; if (S.mode === 'play' && noLock && !isTouch) pause(); });
document.addEventListener('mousemove', e => {
  if (S.mode !== 'play' || isTouch || !(locked || noLock)) return;
  if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return;
  const s = .0022 * settings.sens * .85 * (S.ads ? .45 : 1);
  P.yaw -= e.movementX * s; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - e.movementY * s));
  mdx += e.movementX; mdy += e.movementY;
});
canvas.addEventListener('mousedown', e => {
  if (isTouch) return;
  if (e.button === 0) { if (S.mode === 'play') { if (!locked && !noLock) requestLock(); mouseDown = true; } }
  else if (e.button === 2) { if (S.mode === 'play') aimHeld = settings.adsToggle ? !aimHeld : true; }
});
addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; if (e.button === 2 && !settings.adsToggle) aimHeld = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

export function requestLock() {
  if (isTouch) return;
  try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(lockFailed); } catch (e) { lockFailed(); }
}
function lockFailed() {
  if (!everLocked) { noLock = true; if (S.mode === 'paused') resumePlay(); }
  else $('pauseHint').textContent = 'Der Browser braucht einen Moment. Bitte gleich noch einmal auf „Weiter“ klicken.';
}
document.addEventListener('pointerlockerror', lockFailed);
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (locked) { everLocked = true; if (S.mode === 'paused') resumePlay(); }
  else if (S.mode === 'play' && !noLock) pause();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && S.mode === 'play') pause(); });

// Touch
export const joy = { id: null, sx: 0, sy: 0, x: 0, y: 0 };
const look = { id: null, lx: 0, ly: 0 };
if (isTouch) {
  $('keysDesk').hidden = true; $('keysTouch').hidden = false; $('sens').closest('label').hidden = true;
  const app = $('app');
  app.addEventListener('touchstart', e => {
    if (S.mode !== 'play') return;
    for (const t of e.changedTouches) {
      if (t.target.tagName === 'BUTTON') continue;
      if (t.clientX < innerWidth / 2 && joy.id === null) { joy.id = t.identifier; joy.sx = t.clientX; joy.sy = t.clientY; joy.x = joy.y = 0; }
      else if (look.id === null) { look.id = t.identifier; look.lx = t.clientX; look.ly = t.clientY; }
    }
    e.preventDefault();
  }, { passive: false });
  app.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === joy.id) {
        let dx = t.clientX - joy.sx, dy = t.clientY - joy.sy; const L = Math.hypot(dx, dy);
        if (L > 50) { dx *= 50 / L; dy *= 50 / L; }
        joy.x = dx / 50; joy.y = -dy / 50;
        $('knob').style.transform = `translate(${dx}px,${dy}px)`;
      } else if (t.identifier === look.id) {
        P.yaw -= (t.clientX - look.lx) * .0055; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - (t.clientY - look.ly) * .0055));
        look.lx = t.clientX; look.ly = t.clientY;
      }
    }
    e.preventDefault();
  }, { passive: false });
  const end = e => {
    for (const t of e.changedTouches) {
      if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; $('knob').style.transform = ''; }
      if (t.identifier === look.id) look.id = null;
    }
  };
  app.addEventListener('touchend', end); app.addEventListener('touchcancel', end);
  const hold = (id, on, off) => { const el = $(id); el.addEventListener('touchstart', e => { e.preventDefault(); on(); }, { passive: false }); el.addEventListener('touchend', e => { e.preventDefault(); off && off(); }); el.addEventListener('touchcancel', () => off && off()); };
  hold('tFire', () => touchFire = true, () => touchFire = false);
  hold('tJump', () => keys.Space = true, () => keys.Space = false);
  hold('tReload', () => startReload());
}
