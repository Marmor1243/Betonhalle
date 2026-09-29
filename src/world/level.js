import * as THREE from 'three';
import { scene } from '../render/scene.js';
import { matConcrete, matFloor, matCrate, matHazard } from '../render/textures.js';

// Die aktuell aktive Level-Geometrie. Wellen-Arena und Story-Missionen teilen sich
// diese Liste - beim Wechsel wird sie über clearLevel() geleert und neu befüllt,
// damit Kollision/Navigation immer nur EIN aktives Level kennen.
export const boxes = [];
const levelMeshes = [];

export function clearLevel() {
  for (const m of levelMeshes) scene.remove(m);
  levelMeshes.length = 0;
  boxes.length = 0;
}

export function addDecor(mesh) { scene.add(mesh); levelMeshes.push(mesh); return mesh; }

function boxGeo(w, h, d, scale) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (!scale) return g;
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0] / scale, uv.getY(i) * dims[f][1] / scale); }
  return g;
}
export function addBox(x, z, w, d, h, kind) {
  const mat = kind === 'crate' ? matCrate : kind === 'hazard' ? matHazard : matConcrete;
  const geo = kind === 'concrete' ? boxGeo(w, h, d, 4) : boxGeo(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, h / 2, z); m.castShadow = true; m.receiveShadow = true;
  addDecor(m);
  const entry = { min: [x - w / 2, 0, z - d / 2], max: [x + w / 2, h, z + d / 2], h };
  boxes.push(entry);
  return { mesh: m, entry };
}
// Entfernt eine per addBox() gebaute Sperre wieder (z.B. eine Tür, die erst
// nach Abschluss einer Missionsstufe aufgeht). Ruft danach rebuildNavGrid()
// selbst NICHT auf - das macht der Aufrufer, da meist mehrere Dinge auf einmal
// entfernt/hinzugefügt werden.
export function removeBox(handle) {
  if (!handle) return;
  scene.remove(handle.mesh);
  const mi = levelMeshes.indexOf(handle.mesh); if (mi >= 0) levelMeshes.splice(mi, 1);
  const bi = boxes.indexOf(handle.entry); if (bi >= 0) boxes.splice(bi, 1);
}
export function rot4(x, z, w, d, h, k) { addBox(x, z, w, d, h, k); addBox(-z, x, d, w, h, k); addBox(-x, -z, w, d, h, k); addBox(z, -x, d, w, h, k); }
export function quad(x, z, w, d, h, k) { addBox(x, z, w, d, h, k); addBox(-x, z, w, d, h, k); addBox(x, -z, w, d, h, k); addBox(-x, -z, w, d, h, k); }
export function addFloor(w, d, x = 0, z = 0) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), matFloor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(x, 0, z); floor.receiveShadow = true;
  return addDecor(floor);
}
