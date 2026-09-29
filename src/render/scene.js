import * as THREE from 'three';
import { skyTex } from './textures.js';

export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x5b4034, 40, 130);
export const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 400);
camera.rotation.order = 'YXZ';
scene.add(camera);

export const gunScene = new THREE.Scene();
export const gunCam = new THREE.PerspectiveCamera(58, 1, 0.01, 10);

scene.add(new THREE.HemisphereLight(0x9aa6c4, 0x3a2a20, .6));
const sun = new THREE.DirectionalLight(0xffcf9a, 1.15);
sun.position.set(35, 48, 22); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 160 });
sun.shadow.bias = -0.0006;
scene.add(sun);

const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
scene.add(sky);

export const muzzleLight = new THREE.PointLight(0xffb060, 0, 9, 2);
muzzleLight.position.set(.25, -.1, -.9); camera.add(muzzleLight);
