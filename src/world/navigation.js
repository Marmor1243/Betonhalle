import { clamp } from '../core/utils.js';
import { boxes } from './level.js';

// Navigationsraster: Größe/Ursprung sind pro Level einstellbar (setNavBounds),
// damit sowohl die quadratische Wellen-Arena als auch längliche Story-Level
// (mehrere verkettete Abschnitte) ein passend großes Raster bekommen.
let cell = 1, minX = -40, minZ = -40, W = 80, H = 80;
let blocked, gS, came, seen, done;
function allocGrids() {
  blocked = new Uint8Array(W * H);
  gS = new Float32Array(W * H); came = new Int32Array(W * H);
  seen = new Uint32Array(W * H); done = new Uint32Array(W * H);
}
allocGrids();

export function setNavBounds(x0, x1, z0, z1, cellSize = 1) {
  cell = cellSize; minX = x0; minZ = z0;
  W = Math.max(1, Math.ceil((x1 - x0) / cell));
  H = Math.max(1, Math.ceil((z1 - z0) / cell));
  allocGrids();
}

export function rebuildNavGrid() {
  blocked.fill(0);
  for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) {
    const x = minX + (i + .5) * cell, z = minZ + (j + .5) * cell;
    for (const b of boxes) if (x > b.min[0] - .6 && x < b.max[0] + .6 && z > b.min[2] - .6 && z < b.max[2] + .6) { blocked[i + j * W] = 1; break; }
  }
}
const cellOf = (x, z) => [clamp(Math.floor((x - minX) / cell), 0, W - 1), clamp(Math.floor((z - minZ) / cell), 0, H - 1)];
function nearestFree(ci, cj) {
  if (!blocked[ci + cj * W]) return [ci, cj];
  for (let r = 1; r < 12; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
    const i = ci + di, j = cj + dj;
    if (i >= 0 && j >= 0 && i < W && j < H && !blocked[i + j * W]) return [i, j];
  }
  return null;
}
let stampN = 0;
export function findPath(sx, sz, tx, tz) {
  const s = nearestFree(...cellOf(sx, sz)), t = nearestFree(...cellOf(tx, tz));
  if (!s || !t) return [];
  stampN++;
  const si = s[0] + s[1] * W, ti = t[0] + t[1] * W;
  const hf = [], hi = [];
  const push = (f, i) => { hf.push(f); hi.push(i); let k = hf.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= hf[k]) break; [hf[p], hf[k]] = [hf[k], hf[p]]; [hi[p], hi[k]] = [hi[k], hi[p]]; k = p; } };
  const pop = () => {
    const top = hi[0], lf = hf.pop(), li = hi.pop();
    if (hf.length) { hf[0] = lf; hi[0] = li; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hf.length && hf[l] < hf[m]) m = l; if (r < hf.length && hf[r] < hf[m]) m = r; if (m === k) break; [hf[m], hf[k]] = [hf[k], hf[m]]; [hi[m], hi[k]] = [hi[k], hi[m]]; k = m; } }
    return top;
  };
  const hx = t[0], hz = t[1];
  const heur = (i, j) => { const dx = Math.abs(i - hx), dz = Math.abs(j - hz); return Math.max(dx, dz) + .414 * Math.min(dx, dz); };
  seen[si] = stampN; gS[si] = 0; came[si] = -1; push(heur(s[0], s[1]), si);
  let found = false, iter = 0;
  while (hf.length && iter++ < 7000) {
    const c = pop();
    if (done[c] === stampN) continue;
    done[c] = stampN;
    if (c === ti) { found = true; break; }
    const ci = c % W, cj = (c / W) | 0;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= W || j >= H) continue;
      const n = i + j * W;
      if (blocked[n] || done[n] === stampN) continue;
      if (di && dj && (blocked[ci + di + cj * W] || blocked[ci + (cj + dj) * W])) continue;
      const g = gS[c] + (di && dj ? 1.414 : 1);
      if (seen[n] !== stampN || g < gS[n]) { seen[n] = stampN; gS[n] = g; came[n] = c; push(g + heur(i, j), n); }
    }
  }
  if (!found) return [];
  const path = [];
  for (let c = ti; c !== -1 && c !== si; c = came[c]) path.push({ x: minX + (c % W + .5) * cell, z: minZ + ((c / W | 0) + .5) * cell });
  return path.reverse();
}
export function clearLine(ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, n = Math.ceil(Math.hypot(dx, dz) / .4);
  for (let k = 1; k <= n; k++) { const [i, j] = cellOf(ax + dx * k / n, az + dz * k / n); if (blocked[i + j * W]) return false; }
  return true;
}
