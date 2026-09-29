import * as THREE from 'three';

export const V3 = THREE.Vector3;
export const $ = id => document.getElementById(id);
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const rand = (a, b) => a + Math.random() * (b - a);
export const isTouch = matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;

export function store(k, v) {
  try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
}
