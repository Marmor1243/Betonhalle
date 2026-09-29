import { $, isTouch, store } from '../core/utils.js';
import { initAudio } from '../core/audio.js';
import { scene } from '../render/scene.js';
import { S, resetGame, getBest, showBest } from './state.js';
import { bots } from './bots.js';
import { pickups } from './pickups.js';
import { setupDecor } from './menu.js';
import { requestLock, stopInput, noLock } from './input.js';

function show(id, on) { $(id).hidden = !on; }

export function beginGame() {
  initAudio(); resetGame();
  S.mode = 'play';
  show('ovStart', false); show('ovOver', false); show('ovPause', false); show('hud', true); show('touch', isTouch);
  requestLock();
}

export function pause() {
  if (S.mode !== 'play') return;
  S.mode = 'paused'; stopInput();
  $('pauseHint').textContent = noLock ? 'Tippe auf „Weiter“, um weiterzuspielen.' : 'Klick auf „Weiter“ fängt die Maus wieder ein.';
  show('ovPause', true); show('touch', false);
}

export function resumePlay() { S.mode = 'play'; show('ovPause', false); show('touch', isTouch); initAudio(); }

export function gameOver() {
  S.mode = 'over'; stopInput();
  if (document.pointerLockElement) document.exitPointerLock();
  $('rWave').textContent = S.wave; $('rKills').textContent = S.kills;
  $('rScore').textContent = S.score.toLocaleString('de-DE');
  $('rAcc').textContent = (S.shots ? Math.round(S.hits / S.shots * 100) : 0) + '%';
  $('rHs').textContent = S.heads;
  const best = getBest(), isBest = !best || S.score > best.score;
  if (isBest && S.score > 0) store('bh_best', JSON.stringify({ score: S.score, wave: S.wave, kills: S.kills }));
  $('newBest').hidden = !(isBest && S.score > 0);
  showBest();
  show('hud', false); show('touch', false); show('ovOver', true);
}

export function goMenu() {
  if (document.pointerLockElement) document.exitPointerLock();
  for (const b of bots) scene.remove(b.g); bots.length = 0;
  for (const p of pickups) scene.remove(p.g); pickups.length = 0;
  stopInput();
  S.mode = 'menu';
  show('hud', false); show('touch', false); show('ovPause', false); show('ovOver', false); show('ovStart', true);
  setupDecor(); showBest();
}

$('btnStart').addEventListener('click', beginGame);
$('btnAgain').addEventListener('click', beginGame);
$('btnResume').addEventListener('click', () => { if (noLock) resumePlay(); else requestLock(); });
$('btnMenu').addEventListener('click', goMenu);
$('btnMenu2').addEventListener('click', goMenu);
$('btnQuit').addEventListener('click', () => { S.mode = 'play'; gameOver(); });
