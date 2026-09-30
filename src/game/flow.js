import { $, isTouch, store } from '../core/utils.js';
import { initAudio } from '../core/audio.js';
import { playMenuMusic, pauseMenuMusic, playWaveMusic, pauseWaveMusic } from '../core/music.js';
import { scene } from '../render/scene.js';
import { buildWaveArena } from '../world/arena.js';
import { S, resetGame, getBest, showBest } from './state.js';
import { bots } from './bots.js';
import { pickups } from './pickups.js';
import { setupDecor } from './menu.js';
import { startMission1 } from './story.js';
import { requestLock, stopInput, noLock } from './input.js';
import { closeBigMap } from './minimap.js';

function show(id, on) { $(id).hidden = !on; }

function startPlay(type) {
  initAudio(); resetGame(); closeBigMap(); pauseMenuMusic();
  S.gameType = type;
  if (type === 'story') { startMission1(); pauseWaveMusic(); } else { playWaveMusic(); }
  S.mode = 'play';
  show('ovStart', false); show('ovOver', false); show('ovPause', false); show('hud', true); show('touch', isTouch);
  requestLock();
}
export function beginGame() { startPlay('waves'); }
export function beginStory() { startPlay('story'); }

export function pause() {
  if (S.mode !== 'play') return;
  S.mode = 'paused'; stopInput();
  $('pauseHint').textContent = noLock ? 'Tippe auf „Weiter“, um weiterzuspielen.' : 'Klick auf „Weiter“ fängt die Maus wieder ein.';
  show('ovPause', true); show('touch', false);
}

export function resumePlay() { S.mode = 'play'; show('ovPause', false); show('touch', isTouch); initAudio(); }

export function gameOver() {
  S.mode = 'over'; stopInput(); closeBigMap(); pauseWaveMusic();
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
  stopInput(); closeBigMap(); pauseWaveMusic();
  S.mode = 'menu';
  buildWaveArena();
  show('hud', false); show('touch', false); show('ovPause', false); show('ovOver', false); show('ovStart', true);
  setupDecor(); showBest(); playMenuMusic();
}

$('btnStart').addEventListener('click', beginGame);
$('btnStory').addEventListener('click', beginStory);
$('btnAgain').addEventListener('click', () => startPlay(S.gameType || 'waves'));
$('btnResume').addEventListener('click', () => { if (noLock) resumePlay(); else requestLock(); });
$('btnMenu').addEventListener('click', goMenu);
$('btnMenu2').addEventListener('click', goMenu);
$('btnQuit').addEventListener('click', () => { S.mode = 'play'; gameOver(); });
