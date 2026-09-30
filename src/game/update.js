import { V3, clamp, rand, isTouch } from '../core/utils.js';
import { settings } from '../core/settings.js';
import { scene, camera, muzzleLight } from '../render/scene.js';
import { gunRoot, gBase, gunFlash, SIGHT_OFFSET } from '../render/weapon.js';
import { resolveCircle } from '../world/collision.js';
import { emit } from '../render/particles.js';
import { sfx } from '../core/audio.js';
import { S, P, startWave, spawnBot, aliveCount } from './state.js';
import { keys, joy, mouseDown, touchFire, aimHeld, consumeMouseDelta } from './input.js';
import { fire, startReload } from './combat.js';
import { bots, updateBot } from './bots.js';
import { pickups } from './pickups.js';
import { feed, banner, updateHUD } from './hud.js';
import { storyTick } from './story.js';

function adsFovFor(baseFov) { return Math.atan(Math.tan(baseFov * Math.PI / 360) / 2) * 360 / Math.PI; }

let currentFov = settings.fov;
let adsT = 0;
let slideTilt = 0;
// Zielposition der Waffe: das Visier (SIGHT_OFFSET) landet exakt in der Bildmitte,
// in ADS_EYE_Z Metern vor der Kamera - nicht der Waffenkörper selbst.
const ADS_EYE_Z = -.28;
const ADS_POS = new V3(-SIGHT_OFFSET.x, -SIGHT_OFFSET.y, ADS_EYE_Z - SIGHT_OFFSET.z);

export function update(dt) {
  S.time += dt;
  // Zielen (ADS) nur am Boden möglich - in der Luft automatisch unterbrochen,
  // erst nach der Landung (auch bei weiterhin gedrückter Taste) wieder aktiv.
  S.ads = aimHeld && P.onGround;
  // Zielen per Pfeiltasten
  const lx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), ly = (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0);
  if (lx || ly) { P.yaw -= lx * 2.2 * settings.sens * dt; P.pitch = clamp(P.pitch + ly * 1.6 * settings.sens * dt, -1.5, 1.5); }
  // Bewegung
  let ix = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x;
  let iz = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) + joy.y;
  const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
  const sprint = (keys.ShiftLeft || keys.ShiftRight || (isTouch && joy.y > .92)) && iz > .3;
  const fwx = -Math.sin(P.yaw), fwz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);

  // Ducken / Sprint-Slide: aus dem Sprint heraus Ducken gedrückt -> kurzer,
  // abbremsender Boost in Laufrichtung, danach bleibt man geduckt, solange die
  // Taste gehalten wird. Direkt nach einem Sprung eingeleitet (Bunny-Hop-
  // Fenster) gibt's nochmal deutlich mehr Speed - so wie in Krunker.
  P.jumpBoostT = Math.max(0, (P.jumpBoostT || 0) - dt);
  const crouchHeld = !!keys.KeyC;
  if (crouchHeld && sprint && P.onGround && !P.sliding && Math.hypot(P.vx, P.vz) > 4) {
    P.sliding = true; P.slideT = .9;
    const L = Math.hypot(P.vx, P.vz);
    P.slideDirX = P.vx / L; P.slideDirZ = P.vz / L;
    P.slideSpeed = Math.max(L * 1.55, 16) * (P.jumpBoostT > 0 ? 1.35 : 1);
    P.jumpBoostT = 0;
  }
  if (P.sliding) {
    P.slideT -= dt;
    P.slideSpeed = Math.max(0, P.slideSpeed - dt * 9);
    if (P.slideT <= 0 || P.slideSpeed < 2.5 || !crouchHeld || !P.onGround) P.sliding = false;
  }
  P.crouch = (P.crouch || 0) + (((crouchHeld || P.sliding) ? 1 : 0) - (P.crouch || 0)) * Math.min(1, dt * 10);

  let tx, tz, acc;
  if (P.sliding) {
    tx = P.slideDirX * P.slideSpeed; tz = P.slideDirZ * P.slideSpeed;
    acc = Math.min(1, dt * 6);
  } else {
    const speed = (sprint ? 10 : 6.5) * (S.ads ? .5 : 1) * (crouchHeld && P.onGround ? .5 : 1);
    tx = (fwx * iz + rx * ix) * speed; tz = (fwz * iz + rz * ix) * speed;
    acc = Math.min(1, dt * (P.onGround ? 12 : 2.5));
  }
  P.vx += (tx - P.vx) * acc; P.vz += (tz - P.vz) * acc;
  if (keys.Space && P.onGround) { P.vy = 7.6; P.onGround = false; P.sliding = false; P.jumpBoostT = .45; }
  const prevY = P.y;
  // Fast-Fall: nur auf dem Weg nach unten (nie beim Hochsteigen, sonst killt
  // man die Sprunghöhe) UND nur wenn C zwischendurch losgelassen wurde - man
  // kann es nicht einfach durchgehend gedrückt halten. Timing: vorm Sprung C
  // loslassen, springen, im Fallen C wieder drücken -> schneller unten für
  // den nächsten Slide.
  if (P.onGround) P.crouchReleasedInAir = false;
  else if (!crouchHeld) P.crouchReleasedInAir = true;
  const fastFall = crouchHeld && !P.onGround && P.vy <= 0 && P.crouchReleasedInAir;
  P.vy = Math.max(P.vy - (fastFall ? 46 : 22) * dt, fastFall ? -48 : -30);
  P.x += P.vx * dt; P.z += P.vz * dt; P.y += P.vy * dt;
  const ground = resolveCircle(P, .4, prevY, .45);
  if (P.y <= ground) { P.y = ground; P.vy = 0; P.onGround = true; }
  else P.onGround = P.y - ground < .02 && P.vy <= 0;
  if (P.onGround && Math.hypot(P.vx, P.vz) > 2) { S.stepT -= dt * Math.hypot(P.vx, P.vz); if (S.stepT <= 0) { S.stepT = 2.6; sfx.step(); } }

  // Rückstoß-Erholung
  const rec = Math.min(S.recoilRec, dt * .3); P.pitch -= rec; S.recoilRec -= rec;
  S.shake = Math.max(0, S.shake - dt * 3);
  const shakeAmt = S.shake * .04 * settings.shake;
  const eyeH = 1.6 - P.crouch * .6;
  camera.position.set(P.x + rand(-1, 1) * shakeAmt, P.y + eyeH + rand(-1, 1) * shakeAmt, P.z);
  camera.rotation.set(P.pitch, P.yaw, 0);

  // Zielen (ADS-Zoom)
  const targetFov = S.ads ? adsFovFor(settings.fov) : settings.fov;
  currentFov += (targetFov - currentFov) * Math.min(1, dt * 12);
  if (Math.abs(camera.fov - currentFov) > .01) { camera.fov = currentFov; camera.updateProjectionMatrix(); }
  adsT += ((S.ads ? 1 : 0) - adsT) * Math.min(1, dt * 11);

  // Waffe
  S.fireCd -= dt; S.bloom = Math.max(0, S.bloom - dt * .09);
  if (S.reloading > 0) { S.reloading -= dt; if (S.reloading <= 0) { S.reloading = 0; S.ammo = 30; } }
  const trigger = mouseDown || touchFire;
  if (trigger && S.fireCd <= 0 && S.reloading <= 0) {
    if (S.ammo > 0) fire(); else { startReload(); if (S.reloading <= 0) { sfx.empty(); S.fireCd = .25; } }
  }
  if (S.flashT > 0) { S.flashT -= dt; if (S.flashT <= 0) gunFlash.visible = false; }
  muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * 60);

  // Viewmodel
  S.kick = Math.max(0, S.kick - dt * 12);
  const hs = P.onGround ? Math.min(1, Math.hypot(P.vx, P.vz) / 6.5) : 0;
  S.bobT = (S.bobT || 0) + dt * (sprint ? 13 : 9) * hs;
  const { dx: mdx, dy: mdy } = consumeMouseDelta();
  S.swayX = (S.swayX || 0) + (clamp(-mdx * .0004, -.04, .04) - (S.swayX || 0)) * Math.min(1, dt * 10);
  S.swayY = (S.swayY || 0) + (clamp(mdy * .0004, -.04, .04) - (S.swayY || 0)) * Math.min(1, dt * 10);
  const rl = S.reloading > 0 ? Math.sin((1 - S.reloading / 1.6) * Math.PI) : 0;
  const steady = 1 - adsT * .75;
  const kickSteady = 1 - adsT * .82;
  slideTilt += ((P.sliding && !S.ads ? 1 : 0) - slideTilt) * Math.min(1, dt * 9);
  const bx = gBase.x + (ADS_POS.x - gBase.x) * adsT, by = gBase.y + (ADS_POS.y - gBase.y) * adsT, bz = gBase.z + (ADS_POS.z - gBase.z) * adsT;
  gunRoot.position.set(bx + Math.cos(S.bobT) * .012 * hs * steady + S.swayX * steady, by + Math.abs(Math.sin(S.bobT)) * .012 * hs * steady - rl * .12 + S.swayY * steady, bz + S.kick * .06 * kickSteady);
  gunRoot.rotation.set(S.kick * .1 * kickSteady - rl * .7, (sprint ? .25 : 0) * (1 - adsT), rl * .4 + slideTilt * .35);

  // Regeneration bis 60
  if (S.time - S.lastHurt > 5 && S.hp < 60) S.hp = Math.min(60, S.hp + 7 * dt);

  // Pickups
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i]; p.t += dt; p.life -= dt;
    p.g.rotation.y = p.t * 2; p.g.position.y = .8 + Math.sin(p.t * 3) * .12;
    const near = Math.hypot(p.x - P.x, p.z - P.z) < 1.3 && Math.abs(P.y - 0) < 2.2;
    if ((near && S.hp < 100) || p.life <= 0) {
      if (near) { S.hp = Math.min(100, S.hp + 40); sfx.pickup(); feed('Reparaturkit +40'); emit(p.g.position, new V3(0, 1, 0), 18, 0x5fe08a, 3, .5, 2); }
      scene.remove(p.g); pickups.splice(i, 1);
    }
  }

  // Bots
  for (let i = bots.length - 1; i >= 0; i--) if (bots[i]) updateBot(bots[i], dt);
  if (S.mode !== 'play') return;

  // Wellen (nur im Wellen-Modus) bzw. Missionslogik (Story-Modus)
  if (S.gameType === 'story') {
    storyTick(dt);
  } else if (S.intermission > 0) { S.intermission -= dt; if (S.intermission <= 0) startWave(S.wave + 1); }
  else {
    S.spawnT -= dt;
    if (S.toSpawn > 0 && aliveCount() < S.maxAlive && S.spawnT <= 0) { if (spawnBot()) S.toSpawn--; S.spawnT = rand(.9, 1.8); }
    if (S.toSpawn === 0 && aliveCount() === 0) {
      const bonus = 250 * S.wave; S.score += bonus;
      S.hp = Math.min(100, S.hp + 25);
      banner('Welle ' + S.wave + ' geschafft', '+' + bonus + ' Bonus · +25 Gesundheit');
      S.intermission = 5;
    }
  }
  updateHUD();
}
