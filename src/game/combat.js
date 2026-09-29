import * as THREE from 'three';
import { V3, rand } from '../core/utils.js';
import { camera, muzzleLight } from '../render/scene.js';
import { gunFlash } from '../render/weapon.js';
import { traceWorld } from '../world/collision.js';
import { emit, addTracer } from '../render/particles.js';
import { sfx } from '../core/audio.js';
import { S, P } from './state.js';
import { bots } from './bots.js';
import { feed, hitmarker, dmgIndicator, spreadNow } from './hud.js';
import { spawnPickup } from './pickups.js';
import { gameOver } from './flow.js';

const raycaster = new THREE.Raycaster();

export function fire() {
  S.fireCd = .095; S.ammo--; S.shots++;
  const moving = Math.hypot(P.vx, P.vz) > 1;
  const spread = spreadNow(moving);
  S.bloom = Math.min(S.bloom + .005, .035);
  camera.updateMatrixWorld();
  const fwd = new V3(0, 0, -1).applyQuaternion(camera.quaternion);
  const right = new V3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new V3(0, 1, 0).applyQuaternion(camera.quaternion);
  const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread;
  const dir = fwd.clone().addScaledVector(right, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize();
  const origin = camera.position.clone();
  const w = traceWorld(origin, dir, 250);
  raycaster.set(origin, dir); raycaster.far = w.t;
  const targets = []; for (const b of bots) if (!b.dead && !b.decor) targets.push(...b.hit);
  const hits = raycaster.intersectObjects(targets, false);
  const muzzle = camera.localToWorld(new V3(.2, -.15, -.7));
  let end;
  if (hits.length) {
    const h = hits[0], b = h.object.userData.bot, part = h.object.userData.part;
    end = h.point;
    const head = part === 'head';
    const dmg = head ? 70 : part === 'legs' ? 18 : 26;
    S.hits++;
    emit(h.point, dir.clone().negate(), head ? 16 : 9, head ? 0xffd060 : 0xff7040, 4, .35);
    damageBot(b, dmg, head);
  } else {
    end = origin.clone().addScaledVector(dir, w.t);
    if (w.hit) emit(end, w.n, 8, 0xffc080, 4, .35);
  }
  addTracer(muzzle, end, 0xffd08a);
  gunFlash.visible = true; gunFlash.rotation.z = Math.random() * 6; S.flashT = .04;
  muzzleLight.intensity = 3;
  S.kick = 1;
  const k = .009 + Math.random() * .004;
  P.pitch = Math.min(1.5, P.pitch + k); S.recoilRec += k * .65;
  P.yaw += rand(-.002, .002);
  sfx.shot();
}

function damageBot(b, dmg, head) {
  b.hp -= dmg; b.flash = 1;
  b.lastX = P.x; b.lastZ = P.z; b.memory = 4;
  if (!b.sees) { b.targetYaw = Math.atan2(P.x - b.x, P.z - b.z); b.losT = 0; }
  if (b.hp <= 0) {
    b.dead = true; b.deathT = 0; b.flashMesh.visible = false;
    S.kills++; if (head) S.heads++;
    const pts = 100 + (head ? 50 : 0) + (S.wave - 1) * 10;
    S.score += pts;
    feed(`${b.name} ausgeschaltet${head ? ' · Kopfschuss' : ''}  +${pts}`, head);
    emit(new V3(b.x, 1.3, b.z), new V3(0, 1, 0), 40, 0xff5a30, 5, .9);
    hitmarker(true); sfx.kill();
    if (Math.random() < .35) spawnPickup(b.x, b.z);
  } else { hitmarker(false); sfx.hit(head); }
}

export function damagePlayer(d, fx, fz) {
  if (S.mode !== 'play') return;
  S.hp -= d; S.lastHurt = S.time; S.shake = Math.min(1, S.shake + .5);
  dmgIndicator(fx, fz); sfx.hurt();
  if (S.hp <= 0) gameOver();
}

export function startReload() { if (S.reloading > 0 || S.ammo === 30) return; S.reloading = 1.6; sfx.reload(); }
