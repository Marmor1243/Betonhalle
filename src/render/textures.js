import * as THREE from 'three';
import { maxAniso } from './renderer.js';

function canvasTex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso;
  return t;
}
function speckle(g, s, n, cols, alpha) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[i % cols.length]; g.globalAlpha = Math.random() * alpha;
    const r = Math.random() * 2 + .5; g.fillRect(Math.random() * s, Math.random() * s, r, r);
  }
  g.globalAlpha = 1;
}
function stains(g, s, n, col) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = 30 + Math.random() * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

export const floorTex = canvasTex(512, (g, s) => {
  g.fillStyle = '#4a4640'; g.fillRect(0, 0, s, s);
  speckle(g, s, 9000, ['#37342f', '#5b564e', '#2d2a26'], .6);
  stains(g, s, 7, 'rgba(25,22,18,.28)');
  g.strokeStyle = '#26231f'; g.lineWidth = 4; g.strokeRect(0, 0, s, s);
  g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; g.strokeRect(4, 4, s - 8, s - 8);
});
floorTex.repeat.set(20, 20);

export const concreteTex = canvasTex(512, (g, s) => {
  g.fillStyle = '#77726a'; g.fillRect(0, 0, s, s);
  speckle(g, s, 7000, ['#625d56', '#8a857c', '#55514b'], .55);
  stains(g, s, 5, 'rgba(40,34,28,.22)');
  g.fillStyle = 'rgba(30,28,25,.55)';
  for (let y = 0; y <= s; y += 128) g.fillRect(0, y - 1, s, 2);
  for (let x = 0; x <= s; x += 256) g.fillRect(x - 1, 0, 2, s);
  for (let y = 64; y < s; y += 128) for (let x = 64; x < s; x += 128) {
    g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fillStyle = 'rgba(30,28,25,.6)'; g.fill();
  }
});

export const crateTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#44503f'; g.fillRect(0, 0, s, s);
  for (let x = 16; x < s; x += 24) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, 0, 5, s); g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x + 5, 0, 2, s); }
  speckle(g, s, 2500, ['#2c3329', '#6a7160', '#8c5a2b'], .5);
  g.strokeStyle = '#262c23'; g.lineWidth = 14; g.strokeRect(0, 0, s, s);
  g.fillStyle = 'rgba(236,230,218,.72)'; g.font = '600 30px "IBM Plex Mono", monospace'; g.textAlign = 'center';
  g.fillText('BH-' + (10 + Math.floor(Math.random() * 80)), s / 2, s / 2 + 10);
  g.font = '600 13px "IBM Plex Mono", monospace'; g.fillText('MAX 2400 KG', s / 2, s / 2 + 34);
});

export const hazardTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#6f6a62'; g.fillRect(0, 0, s, s);
  speckle(g, s, 3000, ['#5a554e', '#86817a'], .55);
  g.save(); g.beginPath(); g.rect(0, 0, s, s * .22); g.clip();
  g.fillStyle = '#e0a126'; g.fillRect(0, 0, s, s * .22);
  g.fillStyle = '#1b1a18';
  for (let x = -s; x < s * 2; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 24, 0); g.lineTo(x + 24 - s * .22, s * .22); g.lineTo(x - s * .22, s * .22); g.fill(); }
  g.restore();
});

export const flashTex = canvasTex(128, (g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, 'rgba(255,245,220,1)'); gr.addColorStop(.25, 'rgba(255,180,90,.9)'); gr.addColorStop(1, 'rgba(255,120,30,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,220,160,.8)'; g.lineWidth = 6;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.beginPath(); g.moveTo(s / 2, s / 2); g.lineTo(s / 2 + Math.cos(a) * s * .48, s / 2 + Math.sin(a) * s * .48); g.stroke(); }
});
flashTex.wrapS = flashTex.wrapT = THREE.ClampToEdgeWrapping;

export const skyTex = canvasTex(8, () => {});
(() => {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#15161f'); gr.addColorStop(.38, '#3b2e3a'); gr.addColorStop(.49, '#d9793a'); gr.addColorStop(.52, '#7a4a33'); gr.addColorStop(1, '#1c1714');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256); skyTex.image = c; skyTex.needsUpdate = true;
})();

export const matConcrete = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: .92, metalness: 0 });
export const matFloor = new THREE.MeshStandardMaterial({ map: floorTex, roughness: .95, metalness: 0 });
export const matCrate = new THREE.MeshStandardMaterial({ map: crateTex, roughness: .7, metalness: .35 });
export const matHazard = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: .9 });
export const matLamp = new THREE.MeshBasicMaterial({ color: 0xffb35c });
