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
gunRoot.position.copy(gBase);
