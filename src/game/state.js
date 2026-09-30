import { V3, $, rand, store } from '../core/utils.js';
import { scene } from '../render/scene.js';
import { traceWorld } from '../world/collision.js';
import { buildWaveArena } from '../world/arena.js';
import { emit } from '../render/particles.js';
import { bots, makeBot } from './bots.js';
import { pickups } from './pickups.js';
import { banner } from './hud.js';
import { sfx } from '../core/audio.js';

export const S = { mode: 'menu', diff: { acc: .3, dmg: 8, fireInt: .9, speed: 3.5, react: .7, hp: 100 } };
export const P = { x: 0, y: 1.2, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, onGround: true };

export function getBest() { try { return JSON.parse(store('bh_best')) || null; } catch (e) { return null; } }
export function showBest() {
  const b = getBest();
  $('bestLine').innerHTML = b ? `Bestwert: <b>${b.score.toLocaleString('de-DE')} Punkte</b> · Welle ${b.wave} · ${b.kills} Kills` : 'Noch kein Bestwert.';
}
showBest();

export function resetGame() {
  for (const b of bots) scene.remove(b.g); bots.length = 0;
  for (const p of pickups) scene.remove(p.g); pickups.length = 0;
  buildWaveArena();
  Object.assign(S, { gameType: 'waves', hp: 100, wave: 0, kills: 0, score: 0, shots: 0, hits: 0, heads: 0, lastHurt: -99, time: 0, ammo: 30, reloading: 0, fireCd: 0, bloom: 0, toSpawn: 0, spawnT: 0, intermission: 2.5, recoilRec: 0, kick: 0, shake: 0, maxAlive: 3, stepT: 0, ads: false });
  S.diff = diffFor(1);
  Object.assign(P, { x: 0, y: 1.2, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, onGround: true });
  $('feed').innerHTML = ''; $('dmgring').innerHTML = '';
  banner('Bereit machen', 'Welle 1 startet gleich');
}

export function diffFor(n) {
  return { acc: Math.min(.26 + n * .05, .72), dmg: Math.min(7 + n * .8, 15), fireInt: Math.max(1 - n * .055, .45), speed: Math.min(3.4 + n * .2, 5.6), react: Math.max(.75 - n * .05, .25), hp: 100 + Math.max(0, n - 4) * 15 };
}
export function startWave(n) {
  S.wave = n; S.toSpawn = 2 + n * 2; S.maxAlive = Math.min(2 + n, 8); S.spawnT = .3; S.diff = diffFor(n);
  banner('Welle ' + n, S.toSpawn + ' Bots im Anmarsch'); sfx.wave();
}

const SPAWNS = [[34, 34], [-34, 34], [34, -34], [-34, -34], [0, 36], [0, -36], [36, 0], [-36, 0], [20, 36], [-20, -36], [36, -20], [-36, 20]];
export function spawnBot() {
  let cands = SPAWNS.map(([x, z]) => ({ x, z, d: Math.hypot(x - P.x, z - P.z) })).filter(c => c.d > 22);
  cands = cands.filter(c => !bots.some(b => !b.dead && Math.hypot(b.x - c.x, b.z - c.z) < 2));
  if (!cands.length) return false;
  const hidden = cands.filter(c => { const o = new V3(c.x, 1.7, c.z), t = new V3(P.x, P.y + 1.5, P.z), d = t.clone().sub(o), L = d.length(); return traceWorld(o, d.divideScalar(L), L).hit; });
  const pool = hidden.length ? hidden : cands;
  const c = pool[Math.floor(Math.random() * pool.length)];
  const b = makeBot(c.x + rand(-1, 1), c.z + rand(-1, 1));
  b.memory = 0; b.lastX = P.x; b.lastZ = P.z;
  emit(new V3(b.x, .2, b.z), new V3(0, 1, 0), 30, 0xff6a3c, 4, .8, 3);
  return true;
}
export function aliveCount() { let n = 0; for (const b of bots) if (!b.dead && !b.decor) n++; return n; }
