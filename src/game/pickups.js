import * as THREE from 'three';
import { rand } from '../core/utils.js';
import { scene } from '../render/scene.js';

export const pickups = [];
const pickMat = new THREE.MeshStandardMaterial({ color: 0x5fe08a, emissive: 0x2a9a50, emissiveIntensity: 1.1, roughness: .4 });

export function spawnPickup(x, z) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(.5, .16, .16), pickMat), new THREE.Mesh(new THREE.BoxGeometry(.16, .5, .16), pickMat));
  g.position.set(x, .8, z); scene.add(g);
  pickups.push({ g, x, z, t: rand(0, 6), life: 25 });
}
