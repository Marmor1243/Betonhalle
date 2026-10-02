import * as THREE from 'three';
import { V3 } from '../core/utils.js';
import { gunScene } from './scene.js';
import { flashTex } from './textures.js';

gunScene.add(new THREE.HemisphereLight(0xffe0c0, 0x302018, 1));
const gunSun = new THREE.DirectionalLight(0xffd0a0, .8); gunSun.position.set(1, 2, 1); gunScene.add(gunSun);
export const gunRoot = new THREE.Group(); gunScene.add(gunRoot);
export const gBase = new V3(.24, -.22, -.5);
gunRoot.position.copy(gBase);

const dark = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: .45, metalness: .7 });
const mid = new THREE.MeshStandardMaterial({ color: 0x3d4046, roughness: .6, metalness: .5 });
const accent = new THREE.MeshStandardMaterial({ color: 0xff9a3c, roughness: .5, metalness: .2 });
const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: .5, metalness: .6 });
const dotMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
// Wie tief jede Waffe beim Wechsel abtaucht - das Gewehr ist deutlich größer
// und braucht mehr Weg, sonst guckt der Lauf noch ins Bild bevor es verschwindet.
const SWITCH_DROP = { rifle: .7, pistol: .35 };

// Kimme/Korn-Ersatz: kleines Rotpunktvisier. Das Fenster in der Mitte des
// Rahmens hat KEINE Geometrie ("Loch") - man sieht durch die Lücke hindurch
// die eigentliche Szene, der rote Punkt sitzt davor.
function addSight(parent, offset, holeW, holeH) {
  const thick = .009, outW = holeW + thick * 2, outH = holeH + thick * 2;
  const sight = new THREE.Group(); sight.position.copy(offset); parent.add(sight);
  const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .012), frameMat); m.position.set(x, y, 0); sight.add(m); };
  bar(outW, thick, 0, holeH / 2 + thick / 2);
  bar(outW, thick, 0, -(holeH / 2 + thick / 2));
  bar(thick, outH, -(holeW / 2 + thick / 2), 0);
  bar(thick, outH, holeW / 2 + thick / 2, 0);
  const post = new THREE.Mesh(new THREE.BoxGeometry(.018, .03, .018), frameMat);
  post.position.set(0, -.062, .015); sight.add(post);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(.001, 16), dotMat);
  dot.position.set(0, 0, .004); sight.add(dot);
  return sight;
}
// Klassisches Kimme-Korn-Visier: ein Korn (Steg) vorn am Lauf, eine Kimme
// (zwei Blöcke mit Lücke dazwischen) weiter hinten Richtung Auge. Der
// Zielpunkt (offset) liegt auf der Spitze des Korns - dort läuft man beim
// Zielen mit der Bildmitte zusammen.
function addIronSight(parent, offset) {
  const post = new THREE.Mesh(new THREE.BoxGeometry(.012, .03, .012), frameMat);
  post.position.set(offset.x, offset.y - .012, offset.z); parent.add(post);
  const gap = .022, w = .013, h = .02, rearZ = offset.z + .17;
  const nb = (x) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .012), frameMat); m.position.set(x, offset.y - .015, rearZ); parent.add(m); };
  nb(-(gap / 2 + w / 2)); nb(gap / 2 + w / 2);
}
function addFlash(parent, x, y, z, size = .26) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: flashTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.position.set(x, y, z); m.visible = false; parent.add(m);
  return m;
}

function buildRifle() {
  const group = new THREE.Group(); gunRoot.add(group);
  const add = (geo, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.x = rx; group.add(m); return m; };
  add(new THREE.BoxGeometry(.09, .12, .42), dark, 0, 0, 0);
  add(new THREE.BoxGeometry(.075, .09, .3), mid, 0, .005, -.34);
  add(new THREE.CylinderGeometry(.018, .018, .2, 10), dark, 0, .01, -.58, Math.PI / 2);
  add(new THREE.BoxGeometry(.06, .18, .09), mid, 0, -.13, -.06, .2);
  add(new THREE.BoxGeometry(.07, .1, .22), mid, 0, -.02, .28);
  add(new THREE.BoxGeometry(.06, .14, .07), dark, 0, -.11, .1, -.3);
  add(new THREE.BoxGeometry(.03, .04, .09), dark, 0, .08, -.06);
  add(new THREE.BoxGeometry(.092, .02, .18), accent, 0, .035, -.02);
  const flash = addFlash(group, 0, .01, -.72);
  const sightOffset = new V3(0, .11, -.05);
  addSight(group, sightOffset, .09, .055);
  return { group, flash, sightOffset };
}

function buildPistol() {
  const group = new THREE.Group(); gunRoot.add(group); group.visible = false;
  const add = (geo, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.x = rx; group.add(m); return m; };
  add(new THREE.BoxGeometry(.065, .075, .24), dark, 0, .02, -.02); // Schlitten
  add(new THREE.BoxGeometry(.05, .17, .08), mid, 0, -.12, .06, .12); // Griff
  add(new THREE.CylinderGeometry(.013, .013, .09, 8), dark, 0, .03, -.16, Math.PI / 2); // Lauf
  add(new THREE.BoxGeometry(.035, .05, .05), dark, 0, -.015, .09); // Abzugsbereich
  add(new THREE.BoxGeometry(.068, .015, .16), accent, 0, .05, -.03); // Akzentstreifen
  const flash = addFlash(group, 0, .03, -.28, .16);
  const sightOffset = new V3(0, .088, -.12);
  addIronSight(group, sightOffset);
  return { group, flash, sightOffset };
}

const weapons = { rifle: buildRifle(), pistol: buildPistol() };
for (const key in weapons) weapons[key].anim = key === 'rifle' ? 0 : 1;
weapons.pistol.group.position.y = -SWITCH_DROP.pistol;
let activeName = 'rifle';

export function setActiveWeapon(name) {
  if (!weapons[name] || name === activeName) return;
  activeName = name;
  weapons[name].group.visible = true;
}
export function activeFlash() { return weapons[activeName].flash; }
export function activeSightOffset() { return weapons[activeName].sightOffset; }

// Während eines Messerstichs wird die aktive Waffe über dasselbe Auf/Ab wie
// beim Waffenwechsel kurz weggesteckt, damit der Stich nicht durch sie
// hindurchgeht - danach kommt sie genauso wieder hoch.
let meleeHiding = false;
export function setMeleeHiding(v) { meleeHiding = v; }

// Schnelle Wechsel-Animation: die aktive Waffe wandert nach oben in Position,
// die abgelegte (oder während eines Messerstichs weggesteckte) taucht nach
// unten weg - kein Aufploppen mehr, aber bewusst sehr fix, damit man dadurch
// keine spürbare Zeit im Kampf verliert.
export function tickWeaponSwitch(dt) {
  for (const key in weapons) {
    const w = weapons[key];
    const shouldHide = key !== activeName || meleeHiding;
    const target = shouldHide ? 1 : 0;
    if (!shouldHide) w.group.visible = true;
    w.anim += (target - w.anim) * Math.min(1, dt * 22);
    if (Math.abs(w.anim - target) < .003) w.anim = target;
    w.group.position.y = -SWITCH_DROP[key] * w.anim;
    if (shouldHide && w.anim >= .997) w.group.visible = false;
  }
}

// Messer-Stich: schwenkt unabhängig von der gerade ausgerüsteten Waffe kurz
// über diese hinweg ein - kein Waffenwechsel nötig, reine Notfall-Aktion.
const knifeBlade = new THREE.MeshStandardMaterial({ color: 0xcfd3d6, roughness: .25, metalness: .85 });
const knifeHandle = new THREE.MeshStandardMaterial({ color: 0x24211d, roughness: .6, metalness: .3 });
const glove = new THREE.MeshStandardMaterial({ color: 0x3d4046, roughness: .7, metalness: .1 });
export const knifeGroup = new THREE.Group(); gunRoot.add(knifeGroup); knifeGroup.visible = false;
(() => {
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.028, .01, .2), knifeBlade);
  blade.position.set(0, 0, -.14); knifeGroup.add(blade);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(.07, .014, .02), knifeBlade);
  guard.position.set(0, 0, -.03); knifeGroup.add(guard);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(.032, .034, .1), knifeHandle);
  handle.position.set(0, 0, .03); knifeGroup.add(handle);
  // Nur die Hand sitzt fest am Griff - Ober-/Unterarm werden separat per IK
  // animiert (siehe unten), damit sich der Ellbogen beim Ausstrecken sichtbar
  // streckt statt nur ein starrer Stab zu sein.
  const hand = new THREE.Mesh(new THREE.BoxGeometry(.055, .06, .1), glove);
  hand.position.set(0, -.005, .11); knifeGroup.add(hand);
})();
export const KNIFE_START = new V3(.2, -.24, -.08);
export const KNIFE_PEAK = new V3(-.03, -.02, -.42);

// Einfache 2-Segment-IK (Ober-/Unterarm) von einer festen Schulter zur
// jeweils aktuellen Handposition (= knifeGroup.position). Je weiter die Hand
// von der Schulter weg ist, desto gestreckter der Ellbogen - automatisch,
// ohne die Animation von Hand aus keyframen zu müssen.
export const armGroup = new THREE.Group(); gunRoot.add(armGroup); armGroup.visible = false;
const ARM_SHOULDER = new V3(.26, -.32, .22);
const ARM_L1 = .36, ARM_L2 = .38;
const upperArmMesh = new THREE.Mesh(new THREE.BoxGeometry(.13, .13, 1), glove); armGroup.add(upperArmMesh);
const forearmMesh = new THREE.Mesh(new THREE.BoxGeometry(.11, .11, 1), glove); armGroup.add(forearmMesh);
function orientSegment(mesh, from, to) {
  const dir = to.clone().sub(from); const dist = dir.length() || .001; dir.normalize();
  mesh.position.copy(from).addScaledVector(dir, dist / 2);
  mesh.scale.z = dist;
  mesh.quaternion.setFromUnitVectors(new V3(0, 0, 1), dir);
}
export function updateArmIK(target) {
  const toTarget = target.clone().sub(ARM_SHOULDER);
  const d = Math.max(Math.abs(ARM_L1 - ARM_L2) + .01, Math.min(ARM_L1 + ARM_L2 - .01, toTarget.length()));
  const dirN = toTarget.normalize();
  const cosA = (ARM_L1 * ARM_L1 + d * d - ARM_L2 * ARM_L2) / (2 * ARM_L1 * d);
  const angleA = Math.acos(Math.max(-1, Math.min(1, cosA)));
  let bendRef = new V3(0, 1, 0);
  let perp = bendRef.sub(dirN.clone().multiplyScalar(bendRef.dot(dirN)));
  if (perp.lengthSq() < 1e-6) perp = new V3(1, 0, 0);
  perp.normalize();
  const elbowDir = dirN.clone().multiplyScalar(Math.cos(angleA)).add(perp.multiplyScalar(Math.sin(angleA)));
  const elbow = ARM_SHOULDER.clone().addScaledVector(elbowDir, ARM_L1);
  orientSegment(upperArmMesh, ARM_SHOULDER, elbow);
  orientSegment(forearmMesh, elbow, target);
}
