import { clamp } from '../core/utils.js';
import { boxes } from './arena.js';

const N = 80, OFF = 40, blocked = new Uint8Array(N * N);
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
  const x = -OFF + i + .5, z = -OFF + j + .5;
  for (const b of boxes) if (x > b.min[0] - .6 && x < b.max[0] + .6 && z > b.min[2] - .6 && z < b.max[2] + .6) { blocked[i + j * N] = 1; break; }
}
const cellOf = (x, z) => [clamp(Math.floor(x + OFF), 0, N - 1), clamp(Math.floor(z + OFF), 0, N - 1)];
function nearestFree(ci, cj) {
  if (!blocked[ci + cj * N]) return [ci, cj];
  for (let r = 1; r < 12; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
    const i = ci + di, j = cj + dj;
    if (i >= 0 && j >= 0 && i < N && j < N && !blocked[i + j * N]) return [i, j];
  }
  return null;
}
const gS = new Float32Array(N * N), came = new Int32Array(N * N), seen = new Uint32Array(N * N), done = new Uint32Array(N * N);
let stampN = 0;
export function findPath(sx, sz, tx, tz) {
  const s = nearestFree(...cellOf(sx, sz)), t = nearestFree(...cellOf(tx, tz));
  if (!s || !t) return [];
  stampN++;
  const si = s[0] + s[1] * N, ti = t[0] + t[1] * N;
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
    const ci = c % N, cj = (c / N) | 0;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const n = i + j * N;
      if (blocked[n] || done[n] === stampN) continue;
      if (di && dj && (blocked[ci + di + cj * N] || blocked[ci + (cj + dj) * N])) continue;
      const g = gS[c] + (di && dj ? 1.414 : 1);
      if (seen[n] !== stampN || g < gS[n]) { seen[n] = stampN; gS[n] = g; came[n] = c; push(g + heur(i, j), n); }
    }
  }
  if (!found) return [];
  const path = [];
  for (let c = ti; c !== -1 && c !== si; c = came[c]) path.push({ x: -OFF + (c % N) + .5, z: -OFF + ((c / N) | 0) + .5 });
  return path.reverse();
}
export function clearLine(ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, n = Math.ceil(Math.hypot(dx, dz) / .4);
  for (let k = 1; k <= n; k++) { const [i, j] = cellOf(ax + dx * k / n, az + dz * k / n); if (blocked[i + j * N]) return false; }
  return true;
}
