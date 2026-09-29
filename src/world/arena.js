import * as THREE from 'three';
import { scene } from '../render/scene.js';
import { matConcrete, matFloor, matCrate, matHazard, matLamp } from '../render/textures.js';

export const boxes = [];

function boxGeo(w, h, d, scale) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (!scale) return g;
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0] / scale, uv.getY(i) * dims[f][1] / scale); }
  return g;
}
function addBox(x, z, w, d, h, kind) {
  const mat = kind === 'crate' ? matCrate : kind === 'hazard' ? matHazard : matConcrete;
  const geo = kind === 'concrete' ? boxGeo(w, h, d, 4) : boxGeo(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, h / 2, z); m.castShadow = true; m.receiveShadow = true; scene.add(m);
  boxes.push({ min: [x - w / 2, 0, z - d / 2], max: [x + w / 2, h, z + d / 2], h });
}
function rot4(x, z, w, d, h, k) { addBox(x, z, w, d, h, k); addBox(-z, x, d, w, h, k); addBox(-x, -z, w, d, h, k); addBox(z, -x, d, w, h, k); }
function quad(x, z, w, d, h, k) { addBox(x, z, w, d, h, k); addBox(-x, z, w, d, h, k); addBox(x, -z, w, d, h, k); addBox(-x, -z, w, d, h, k); }

const floor = new THREE.Mesh(new THREE.PlaneGeometry(82, 82), matFloor);
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const ring = new THREE.Mesh(new THREE.RingGeometry(9.2, 9.6, 64), new THREE.MeshBasicMaterial({ color: 0xc9621c, transparent: true, opacity: .45 }));
ring.rotation.x = -Math.PI / 2; ring.position.y = .012; scene.add(ring);

addBox(0, -40.5, 83, 1, 7, 'concrete'); addBox(0, 40.5, 83, 1, 7, 'concrete');
addBox(-40.5, 0, 1, 81, 7, 'concrete'); addBox(40.5, 0, 1, 81, 7, 'concrete');
addBox(0, 0, 6, 6, 1.2, 'concrete');
rot4(0, 3.5, 6, 1, .8, 'concrete'); rot4(0, 4.5, 6, 1, .4, 'concrete');
quad(10, 10, 2, 2, 7, 'concrete');
rot4(22, 12, 1, 10, 3, 'concrete');
rot4(28, 28, 2.2, 2.2, 2.2, 'crate'); rot4(30.4, 27.7, 1.6, 1.6, 1.6, 'crate'); rot4(27.9, 25.4, 1.4, 1.4, 1.1, 'crate');
rot4(18, -2, 2.2, 2.2, 2.2, 'crate'); rot4(18.2, .9, 1.6, 1.6, 1.3, 'crate');
rot4(31, -8, 1, 6, 1.3, 'hazard');
rot4(6, 24, 1.8, 1.8, 1.8, 'crate');
rot4(-14, 32, 5, 1, 1.3, 'hazard');

// Lampenleisten an den Wänden (nur Deko)
const lampGeo = new THREE.BoxGeometry(2.4, .12, .12);
for (let i = -32; i <= 32; i += 16) {
  [[i, 5.6, -39.9, 0], [i, 5.6, 39.9, 0], [-39.9, 5.6, i, 1], [39.9, 5.6, i, 1]].forEach(([x, y, z, r]) => {
    const l = new THREE.Mesh(lampGeo, matLamp); l.position.set(x, y, z); l.rotation.y = r ? Math.PI / 2 : 0; scene.add(l);
  });
}
