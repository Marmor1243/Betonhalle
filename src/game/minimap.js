import { $ } from '../core/utils.js';
import { P } from './state.js';
import { bots } from './bots.js';
import { boxes } from '../world/level.js';
import { missionPOI } from './story.js';

const cv = $('minimapCv'), ctx = cv.getContext('2d');
const bigCv = $('bigmapCv'), bigCtx = bigCv.getContext('2d');
const bigWrap = $('bigmap');

const MINI_RADIUS = 26;
let bigOpen = false;

export function toggleBigMap() { bigOpen = !bigOpen; bigWrap.hidden = !bigOpen; }
export function closeBigMap() { bigOpen = false; bigWrap.hidden = true; }

// Dreht/verschiebt einen Weltpunkt relativ zu `origin` in Bildschirmkoordinaten.
// yaw=0 ergibt eine nordausgerichtete Projektion (Vogelperspektive), ein von
// P.yaw abgeleiteter Winkel dreht die Karte so, dass „vorne“ immer oben liegt.
function project(dx, dz, yaw, scale, cx, cy) {
  const mx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
  const my = -dx * Math.sin(yaw) - dz * Math.cos(yaw);
  return [cx + mx * scale, cy - my * scale];
}

function clearBg(c, w, h) {
  c.clearRect(0, 0, w, h);
  c.fillStyle = 'rgba(10,9,8,.55)';
  c.fillRect(0, 0, w, h);
}

function drawWalls(c, origin, yaw, scale, cx, cy) {
  c.fillStyle = 'rgba(236,230,218,.26)';
  for (const b of boxes) {
    const corners = [[b.min[0], b.min[2]], [b.max[0], b.min[2]], [b.max[0], b.max[2]], [b.min[0], b.max[2]]];
    c.beginPath();
    corners.forEach(([x, z], i) => {
      const [sx, sy] = project(x - origin.x, z - origin.z, yaw, scale, cx, cy);
      if (i === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
    });
    c.closePath(); c.fill();
  }
}

function drawDot(c, x, y, r, color) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = color; c.fill();
}

function drawArrow(c, x, y, dirx, diry, size, color) {
  const rx = -diry, ry = dirx;
  c.beginPath();
  c.moveTo(x + dirx * size, y + diry * size);
  c.lineTo(x - dirx * size * .7 + rx * size * .55, y - diry * size * .7 + ry * size * .55);
  c.lineTo(x - dirx * size * .7 - rx * size * .55, y - diry * size * .7 - ry * size * .55);
  c.closePath(); c.fillStyle = color; c.fill();
}

function drawPOI(c, origin, yaw, scale, cx, cy) {
  const poi = missionPOI(); if (!poi) return;
  const [sx, sy] = project(poi.x - origin.x, poi.z - origin.z, yaw, scale, cx, cy);
  c.beginPath(); c.arc(sx, sy, poi.r * scale, 0, Math.PI * 2);
  c.strokeStyle = 'rgba(255,154,60,.85)'; c.lineWidth = 2; c.stroke();
  drawDot(c, sx, sy, 2.5, '#ff9a3c');
}

function drawBots(c, origin, yaw, scale, cx, cy) {
  for (const b of bots) {
    if (b.dead || b.decor) continue;
    const dx = b.x - origin.x, dz = b.z - origin.z;
    const [sx, sy] = project(dx, dz, yaw, scale, cx, cy);
    drawDot(c, sx, sy, 3, '#ff3b30');
  }
}

// Wie drawBots, aber Gegner außerhalb des Radius werden exakt auf den Rand
// des quadratischen Minimap-Panels geklemmt (in ihrer tatsächlichen Richtung)
// statt ausgeblendet zu werden - so bleibt die Richtung entfernter Bots immer
// sichtbar, und sie wirken nicht fälschlich näher als sie sind.
function drawBotsClamped(c, origin, yaw, scale, cx, cy, radius, edgeHalf) {
  for (const b of bots) {
    if (b.dead || b.decor) continue;
    const dx = b.x - origin.x, dz = b.z - origin.z;
    const [sx, sy] = project(dx, dz, yaw, scale, cx, cy);
    if (Math.hypot(dx, dz) <= radius) { drawDot(c, sx, sy, 3.5, '#ff3b30'); continue; }
    const ex = sx - cx, ey = sy - cy;
    const k = edgeHalf / Math.max(Math.abs(ex), Math.abs(ey), 1e-4);
    drawDot(c, cx + ex * k, cy + ey * k, 4, '#ff3b30');
  }
}

export function drawMinimap() {
  const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
  const scale = (w / 2 - 6) / MINI_RADIUS;
  const origin = { x: P.x, z: P.z };
  clearBg(ctx, w, h);
  drawWalls(ctx, origin, P.yaw, scale, cx, cy);
  drawPOI(ctx, origin, P.yaw, scale, cx, cy);
  drawBotsClamped(ctx, origin, P.yaw, scale, cx, cy, MINI_RADIUS, w / 2 - 5);
  const [nx, ny] = project(0, -1, P.yaw, MINI_RADIUS - 9, cx, cy);
  ctx.fillStyle = 'rgba(236,230,218,.55)'; ctx.font = '600 11px IBM Plex Mono, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N', nx, ny);
  drawArrow(ctx, cx, cy, 0, -1, 7, '#ece6da');

  if (bigOpen) drawBigMap();
}

function levelBounds() {
  if (!boxes.length) return { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const b of boxes) {
    minX = Math.min(minX, b.min[0]); maxX = Math.max(maxX, b.max[0]);
    minZ = Math.min(minZ, b.min[2]); maxZ = Math.max(maxZ, b.max[2]);
  }
  return { minX, maxX, minZ, maxZ };
}

function drawBigMap() {
  const w = bigCv.width, h = bigCv.height, cx = w / 2, cy = h / 2;
  const { minX, maxX, minZ, maxZ } = levelBounds();
  const spanX = Math.max(4, maxX - minX), spanZ = Math.max(4, maxZ - minZ);
  const pad = 28;
  const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanZ);
  const origin = { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 };
  clearBg(bigCtx, w, h);
  drawWalls(bigCtx, origin, 0, scale, cx, cy);
  drawPOI(bigCtx, origin, 0, scale, cx, cy);
  drawBots(bigCtx, origin, 0, scale, cx, cy);
  const [px, py] = project(P.x - origin.x, P.z - origin.z, 0, scale, cx, cy);
  drawArrow(bigCtx, px, py, -Math.sin(P.yaw), -Math.cos(P.yaw), 10, '#ece6da');
}
