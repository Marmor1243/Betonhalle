import * as THREE from 'three';
import { rand } from '../core/utils.js';
import { scene } from './scene.js';

const PMAX = 700;
const pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), pVel = new Float32Array(PMAX * 3);
const pLife = new Float32Array(PMAX), pMax = new Float32Array(PMAX), pBase = new Float32Array(PMAX * 3), pGrav = new Float32Array(PMAX);
for (let i = 0; i < PMAX; i++) pPos[i * 3 + 1] = -999;
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .09, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
points.frustumCulled = false; scene.add(points);
let pNext = 0;

export function emit(pos, nrm, n, col, speed, life, grav = 12) {
  const c = new THREE.Color(col);
  for (let k = 0; k < n; k++) {
    const i = pNext; pNext = (pNext + 1) % PMAX;
    pPos[i * 3] = pos.x; pPos[i * 3 + 1] = pos.y; pPos[i * 3 + 2] = pos.z;
    const s = speed * rand(.3, 1);
    pVel[i * 3] = (nrm.x + rand(-.8, .8)) * s; pVel[i * 3 + 1] = (nrm.y + rand(-.3, .9)) * s; pVel[i * 3 + 2] = (nrm.z + rand(-.8, .8)) * s;
    pLife[i] = pMax[i] = life * rand(.5, 1); pGrav[i] = grav;
    pBase[i * 3] = c.r; pBase[i * 3 + 1] = c.g; pBase[i * 3 + 2] = c.b;
  }
}
export function updateParticles(dt) {
  for (let i = 0; i < PMAX; i++) {
    if (pLife[i] <= 0) continue;
    pLife[i] -= dt;
    if (pLife[i] <= 0) { pPos[i * 3 + 1] = -999; continue; }
    pVel[i * 3 + 1] -= pGrav[i] * dt;
    pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
    if (pPos[i * 3 + 1] < .02) { pPos[i * 3 + 1] = .02; pVel[i * 3 + 1] *= -.3; pVel[i * 3] *= .6; pVel[i * 3 + 2] *= .6; }
    const f = pLife[i] / pMax[i];
    pCol[i * 3] = pBase[i * 3] * f; pCol[i * 3 + 1] = pBase[i * 3 + 1] * f; pCol[i * 3 + 2] = pBase[i * 3 + 2] * f;
  }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
}

const tracerGeo = new THREE.BoxGeometry(1, 1, 1);
const tracers = [];
export function addTracer(a, b, color, w = .022) {
  const L = a.distanceTo(b); if (L < .1) return;
  const m = new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.scale.set(w, w, L); m.position.copy(a).lerp(b, .5); m.lookAt(b);
  scene.add(m); tracers.push({ m, t: .08 });
}
export function updateTracers(dt) {
  for (let i = tracers.length - 1; i >= 0; i--) {
    const tr = tracers[i]; tr.t -= dt; tr.m.material.opacity = Math.max(0, tr.t / .08) * .9;
    if (tr.t <= 0) { scene.remove(tr.m); tr.m.material.dispose(); tracers.splice(i, 1); }
  }
}
