import { camera } from '../render/scene.js';
import { makeBot } from './bots.js';

let attractT = 0;

export function setupDecor() {
  [[4, 12, 2.6], [-6, 14, -2.2], [14, 4, 1.4]].forEach(([x, z, y]) => { const b = makeBot(x, z); b.decor = true; b.yaw = y; b.g.rotation.y = y; });
}

export function attract(dt) {
  attractT += dt * .06;
  camera.position.set(Math.sin(attractT) * 30, 11 + Math.sin(attractT * 2) * 2, Math.cos(attractT) * 30);
  camera.lookAt(0, 2, 0);
}
