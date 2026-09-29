import * as THREE from 'three';
import { V3 } from '../core/utils.js';
import { gunScene } from './scene.js';
import { flashTex } from './textures.js';

gunScene.add(new THREE.HemisphereLight(0xffe0c0, 0x302018, 1));
const gunSun = new THREE.DirectionalLight(0xffd0a0, .8); gunSun.position.set(1, 2, 1); gunScene.add(gunSun);
export const gunRoot = new THREE.Group(); gunScene.add(gunRoot);
export const gBase = new V3(.24, -.22, -.5);

(() => {
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: .45, metalness: .7 });
  const mid = new THREE.MeshStandardMaterial({ color: 0x3d4046, roughness: .6, metalness: .5 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xff9a3c, roughness: .5, metalness: .2 });
  const add = (geo, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.x = rx; gunRoot.add(m); return m; };
  add(new THREE.BoxGeometry(.09, .12, .42), dark, 0, 0, 0);
  add(new THREE.BoxGeometry(.075, .09, .3), mid, 0, .005, -.34);
  add(new THREE.CylinderGeometry(.018, .018, .2, 10), dark, 0, .01, -.58, Math.PI / 2);
  add(new THREE.BoxGeometry(.06, .18, .09), mid, 0, -.13, -.06, .2);
  add(new THREE.BoxGeometry(.07, .1, .22), mid, 0, -.02, .28);
  add(new THREE.BoxGeometry(.06, .14, .07), dark, 0, -.11, .1, -.3);
  add(new THREE.BoxGeometry(.03, .04, .09), dark, 0, .08, -.06);
  add(new THREE.BoxGeometry(.092, .02, .18), accent, 0, .035, -.02);
})();

export const gunFlash = new THREE.Mesh(new THREE.PlaneGeometry(.26, .26), new THREE.MeshBasicMaterial({ map: flashTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
gunFlash.position.set(0, .01, -.72); gunFlash.visible = false; gunRoot.add(gunFlash);

// Kimme/Korn-Ersatz: kleines Rotpunktvisier, oben auf der Waffe montiert.
// Das Fenster in der Mitte des Rahmens hat KEINE Geometrie ("Loch") - man sieht
// durch die Lücke hindurch die eigentliche Szene, der rote Punkt sitzt davor.
export const SIGHT_OFFSET = new V3(0, .11, -.05);
(() => {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: .5, metalness: .6 });
  const sight = new THREE.Group(); sight.position.copy(SIGHT_OFFSET); gunRoot.add(sight);
  const HOLE_W = .09, HOLE_H = .055, THICK = .009, OUT_W = HOLE_W + THICK * 2, OUT_H = HOLE_H + THICK * 2;
  const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .012), frameMat); m.position.set(x, y, 0); sight.add(m); };
  bar(OUT_W, THICK, 0, HOLE_H / 2 + THICK / 2);
  bar(OUT_W, THICK, 0, -(HOLE_H / 2 + THICK / 2));
  bar(THICK, OUT_H, -(HOLE_W / 2 + THICK / 2), 0);
  bar(THICK, OUT_H, HOLE_W / 2 + THICK / 2, 0);
  const post = new THREE.Mesh(new THREE.BoxGeometry(.018, .03, .018), frameMat);
  post.position.set(0, -.062, .015); sight.add(post);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
  const dot = new THREE.Mesh(new THREE.CircleGeometry(.001, 16), dotMat);
  dot.position.set(0, 0, .004); sight.add(dot);
})();

gunRoot.position.copy(gBase);
