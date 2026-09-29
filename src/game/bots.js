import * as THREE from 'three';
import { V3, rand, clamp } from '../core/utils.js';
import { scene } from '../render/scene.js';
import { flashTex } from '../render/textures.js';
import { traceWorld, resolveCircle } from '../world/collision.js';
import { findPath, clearLine } from '../world/navigation.js';
import { emit, addTracer } from '../render/particles.js';
import { sfx } from '../core/audio.js';
import { S, P } from './state.js';
import { damagePlayer } from './combat.js';

export const bots = [];
const botBody = new THREE.MeshStandardMaterial({ color: 0x33373d, roughness: .5, metalness: .65 });
const botAccent = new THREE.MeshStandardMaterial({ color: 0x8a2a1c, roughness: .6, metalness: .3 });
const botVisor = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
let botSerial = 0;

export function makeBot(x, z) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ';
  const body = botBody.clone(), accent = botAccent.clone();
  const mk = (w, h, d, mat, px, py, pz, part) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(px, py, pz); m.castShadow = true; g.add(m); if (part) m.userData.part = part; return m; };
  const legL = mk(.22, .8, .26, body, -.15, .4, 0, 'legs'), legR = mk(.22, .8, .26, body, .15, .4, 0, 'legs');
  legL.geometry.translate(0, -.4, 0); legL.position.y = .8; legR.geometry.translate(0, -.4, 0); legR.position.y = .8;
  const torso = mk(.72, .75, .44, body, 0, 1.18, 0, 'body');
  mk(.5, .28, .05, accent, 0, 1.25, .23);
  mk(.2, .2, .5, body, -.46, 1.3, .05);
  const arm = mk(.16, .16, .5, body, .44, 1.22, .18);
  const head = mk(.42, .38, .42, body, 0, 1.76, 0, 'head');
  mk(.34, .08, .02, botVisor, 0, 1.78, .215);
  mk(.1, .12, .62, accent, .34, 1.2, .38);
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  fl.scale.set(.5, .5, .5); fl.position.set(.34, 1.2, .78); fl.visible = false; g.add(fl);
  g.position.set(x, 0, z); scene.add(g);
  const bot = {
    g, body, accent, legL, legR, flashMesh: fl, hit: [torso, head, legL, legR],
    x, z, vx: 0, vz: 0, yaw: rand(-3, 3), targetYaw: 0, hp: S.diff.hp, dead: false, deathT: 0,
    sees: false, losT: rand(0, .2), react: 1, fireT: rand(.5, 1.2), strafeT: 0, strafeDir: 1,
    path: null, repath: 0, lastX: 0, lastZ: 0, memory: 0, flash: 0, flashT: 0, phase: rand(0, 6),
    pref: rand(9, 19), name: 'RX-' + String(++botSerial).padStart(2, '0'), decor: false, burst: 0
  };
  for (const m of bot.hit) m.userData.bot = bot;
  bots.push(bot);
  return bot;
}

function botLOS(b) {
  const o = new V3(b.x, 1.7, b.z), t = new V3(P.x, P.y + 1.5, P.z);
  const d = t.clone().sub(o), L = d.length(); d.divideScalar(L);
  return !traceWorld(o, d, L).hit;
}
function shortAngle(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

export function updateBot(b, dt) {
  if (b.decor) return;
  if (b.dead) {
    b.deathT += dt;
    b.g.rotation.x = Math.max(-1.45, b.g.rotation.x - dt * 5 * (1 + b.deathT * 3));
    if (b.deathT > 2) b.g.position.y = -(b.deathT - 2) * .8;
    if (b.deathT > 3.2) { scene.remove(b.g); bots.splice(bots.indexOf(b), 1); }
    return;
  }
  b.flash = Math.max(0, b.flash - dt * 7);
  b.body.emissive.setRGB(b.flash * .9, b.flash * .25, b.flash * .1);
  if (b.flashT > 0) { b.flashT -= dt; if (b.flashT <= 0) b.flashMesh.visible = false; }

  const dx = P.x - b.x, dz = P.z - b.z, dist = Math.hypot(dx, dz) || .001;
  b.losT -= dt;
  if (b.losT <= 0) {
    b.losT = rand(.1, .18);
    const s = dist < 65 && botLOS(b);
    if (s && !b.sees) b.react = S.diff.react * rand(.7, 1.3);
    b.sees = s;
    if (s) { b.lastX = P.x; b.lastZ = P.z; b.memory = 4; }
  }
  if (!b.sees) b.memory -= dt;

  let mx = 0, mz = 0, spd = S.diff.speed;
  if (b.sees) {
    b.path = null; b.react -= dt;
    b.strafeT -= dt;
    if (b.strafeT <= 0) { b.strafeT = rand(.5, 1.8); b.strafeDir = Math.random() < .5 ? -1 : 1; if (Math.random() < .2) b.strafeDir = 0; }
    const nx = dx / dist, nz = dz / dist, px = -nz, pz = nx;
    const ap = dist > b.pref + 4 ? 1 : dist < b.pref - 5 ? -.7 : 0;
    mx = nx * ap + px * b.strafeDir * .85; mz = nz * ap + pz * b.strafeDir * .85;
    spd *= .75;
    b.targetYaw = Math.atan2(dx, dz);
    b.fireT -= dt;
    const aimed = Math.abs(shortAngle(b.targetYaw - b.yaw)) < .35;
    if (b.react <= 0 && b.fireT <= 0 && aimed && dist < 55) {
      botShoot(b, dist);
      if (b.burst > 0) { b.burst--; b.fireT = .13; }
      else { b.burst = Math.random() < .5 ? 2 : 0; b.fireT = S.diff.fireInt * rand(.8, 1.4); }
    }
  } else {
    b.repath -= dt;
    const useMem = b.memory > 0;
    const tx = useMem ? b.lastX : P.x, tz = useMem ? b.lastZ : P.z;
    if (b.repath <= 0 || !b.path) { b.repath = rand(.6, 1); b.path = findPath(b.x, b.z, tx, tz); }
    if (b.path && b.path.length) {
      let guard = 0;
      while (b.path.length > 1 && guard++ < 6 && clearLine(b.x, b.z, b.path[1].x, b.path[1].z)) b.path.shift();
      const w = b.path[0], wx = w.x - b.x, wz = w.z - b.z, wl = Math.hypot(wx, wz);
      if (wl < .5) b.path.shift(); else { mx = wx / wl; mz = wz / wl; }
    } else if (useMem) b.memory = 0;
    b.fireT = Math.max(b.fireT, .25);
    if (mx || mz) b.targetYaw = Math.atan2(mx, mz);
  }
  const k = Math.min(1, dt * 8);
  b.vx += (mx * spd - b.vx) * k; b.vz += (mz * spd - b.vz) * k;
  b.x += b.vx * dt; b.z += b.vz * dt;
  for (const o of bots) {
    if (o === b || o.dead || o.decor) continue;
    const ox = b.x - o.x, oz = b.z - o.z, d2 = ox * ox + oz * oz;
    if (d2 < 1.2 && d2 > 1e-6) { const d = Math.sqrt(d2), push = (1.1 - d) * .5; b.x += ox / d * push; b.z += oz / d * push; }
  }
  const px = b.x - P.x, pz = b.z - P.z, pd = Math.hypot(px, pz);
  if (pd < .9 && pd > 1e-4 && Math.abs(P.y) < 1.5) { b.x += px / pd * (.9 - pd); b.z += pz / pd * (.9 - pd); }
  resolveCircle(b, .45, 0, 0);
  b.yaw += shortAngle(b.targetYaw - b.yaw) * Math.min(1, dt * 9);
  const sp = Math.hypot(b.vx, b.vz);
  b.phase += sp * dt * 2.4;
  const swing = Math.sin(b.phase) * Math.min(1, sp / 3) * .6;
  b.legL.rotation.x = swing; b.legR.rotation.x = -swing;
  b.g.position.set(b.x, Math.abs(Math.sin(b.phase)) * .04 * Math.min(1, sp / 3), b.z);
  b.g.rotation.y = b.yaw;
}

function botShoot(b, dist) {
  const muzzle = b.g.localToWorld(new V3(.34, 1.2, .8));
  b.flashMesh.visible = true; b.flashT = .05;
  const pm = Math.hypot(P.vx, P.vz);
  const chance = S.diff.acc * clamp(1.15 - dist / 45, .25, 1) * (pm > 7 ? .6 : pm > 1.5 ? .8 : 1) * (P.onGround ? 1 : .7);
  const hit = Math.random() < chance;
  const target = new V3(P.x, P.y + 1.2 + rand(-.3, .3), P.z);
  if (!hit) target.add(new V3(rand(-1, 1), rand(-.4, .8), rand(-1, 1)).normalize().multiplyScalar(rand(.7, 1.8)));
  const dir = target.clone().sub(muzzle), L = dir.length(); dir.divideScalar(L);
  let end;
  if (hit) { end = target; damagePlayer(S.diff.dmg * rand(.85, 1.15), b.x, b.z); }
  else {
    const w = traceWorld(muzzle, dir, L * 2.5); end = muzzle.clone().addScaledVector(dir, w.t);
    if (w.hit) emit(end, w.n, 5, 0xffb070, 3, .3);
  }
  addTracer(muzzle, end, 0xff5040, .03);
  sfx.bot(dist);
}
