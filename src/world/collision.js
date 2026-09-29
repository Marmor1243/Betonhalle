import { V3, clamp } from '../core/utils.js';
import { boxes } from './arena.js';

export function resolveCircle(p, r, feetY, stepH) {
  for (let it = 0; it < 2; it++) for (const b of boxes) {
    if (b.h <= feetY + stepH) continue;
    const cx = clamp(p.x, b.min[0], b.max[0]), cz = clamp(p.z, b.min[2], b.max[2]);
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x += dx / d * (r - d); p.z += dz / d * (r - d); }
    else {
      const l = p.x - b.min[0], rr = b.max[0] - p.x, u = p.z - b.min[2], dd = b.max[2] - p.z, m = Math.min(l, rr, u, dd);
      if (m === l) p.x = b.min[0] - r; else if (m === rr) p.x = b.max[0] + r; else if (m === u) p.z = b.min[2] - r; else p.z = b.max[2] + r;
    }
  }
  let ground = 0;
  for (const b of boxes) {
    if (b.h > feetY + stepH || b.h <= ground) continue;
    const cx = clamp(p.x, b.min[0], b.max[0]), cz = clamp(p.z, b.min[2], b.max[2]);
    const dx = p.x - cx, dz = p.z - cz;
    if (dx * dx + dz * dz < (r * .6) * (r * .6)) ground = b.h;
  }
  return ground;
}

function rayBox(o, d, b, maxT) {
  let tmin = 0, tmax = maxT, axis = -1, sign = 0;
  for (let a = 0; a < 3; a++) {
    const oa = o[a], da = d[a], mn = b.min[a], mx = b.max[a];
    if (Math.abs(da) < 1e-9) { if (oa < mn || oa > mx) return null; continue; }
    let t1 = (mn - oa) / da, t2 = (mx - oa) / da, s = -1;
    if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; s = 1; }
    if (t1 > tmin) { tmin = t1; axis = a; sign = s; }
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  return axis < 0 ? null : { t: tmin, axis, sign };
}

const _o = [0, 0, 0], _d = [0, 0, 0];
export function traceWorld(o, d, maxT) {
  _o[0] = o.x; _o[1] = o.y; _o[2] = o.z; _d[0] = d.x; _d[1] = d.y; _d[2] = d.z;
  let best = maxT; const n = new V3();
  if (d.y < -1e-6) { const t = -o.y / d.y; if (t > 0 && t < best) { best = t; n.set(0, 1, 0); } }
  for (const b of boxes) {
    const h = rayBox(_o, _d, b, best);
    if (h && h.t > 0 && h.t < best) { best = h.t; n.set(0, 0, 0); n.setComponent(h.axis, h.sign); }
  }
  return { t: best, n, hit: best < maxT };
}
