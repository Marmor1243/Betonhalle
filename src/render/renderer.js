import * as THREE from 'three';
import { $ } from '../core/utils.js';

export const canvas = $('c');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;

export const maxAniso = renderer.capabilities.getMaxAnisotropy();
