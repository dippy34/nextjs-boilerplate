import { Vector3 } from 'three';

/**
 * Two-body motion in universal variables (Battin / Vallado): one formulation for ellipses,
 * parabolas and hyperbolas, exact to rounding for any time step. Used for "on rails" time warp
 * and for the orbit readouts.
 */

function stumpffC(z: number): number {
  if (z > 1e-6) return (1 - Math.cos(Math.sqrt(z))) / z;
  if (z < -1e-6) return (Math.cosh(Math.sqrt(-z)) - 1) / -z;
  return 1 / 2 - z / 24 + (z * z) / 720;
}

function stumpffS(z: number): number {
  if (z > 1e-6) { const s = Math.sqrt(z); return (s - Math.sin(s)) / (s * s * s); }
  if (z < -1e-6) { const s = Math.sqrt(-z); return (Math.sinh(s) - s) / (s * s * s); }
  return 1 / 6 - z / 120 + (z * z) / 5040;
}

/** Propagate (r, v) about a point mass `mu` by `dt` seconds, in place. Returns false if it failed to converge. */
export function propagateKepler(r: Vector3, v: Vector3, mu: number, dt: number): boolean {
  if (dt === 0) return true;
  const r0 = r.length();
  const v2 = v.lengthSq();
  const sqmu = Math.sqrt(mu);
  const rv = r.dot(v);
  const alpha = 2 / r0 - v2 / mu; // 1/a
  // whole periods of an ellipse are dropped (keeps Newton well conditioned)
  if (alpha > 0) {
    const P = 2 * Math.PI / (sqmu * Math.pow(alpha, 1.5));
    if (Math.abs(dt) > P) dt -= Math.trunc(dt / P) * P;
  }
  let chi: number;
  if (alpha > 1e-12) chi = sqmu * dt * alpha;
  else if (alpha < -1e-12) {
    const a = 1 / alpha;
    const s = Math.sign(dt) || 1;
    chi = s * Math.sqrt(-a) * Math.log(Math.max(1e-300, (-2 * mu * alpha * dt) / (rv + s * Math.sqrt(-mu * a) * (1 - r0 * alpha))));
    if (!Number.isFinite(chi)) chi = sqmu * dt / r0;
  } else chi = sqmu * dt / r0;
  let ok = false;
  let z = 0, C = 0.5, S = 1 / 6, rr = r0;
  for (let i = 0; i < 60; i++) {
    z = alpha * chi * chi;
    C = stumpffC(z); S = stumpffS(z);
    const chi2 = chi * chi;
    const F = (rv / sqmu) * chi2 * C + (1 - alpha * r0) * chi2 * chi * S + r0 * chi - sqmu * dt;
    rr = (rv / sqmu) * chi * (1 - z * S) + (1 - alpha * r0) * chi2 * C + r0;
    let d = F / rr;
    // keep steps bounded on wild first guesses
    if (Math.abs(d) > Math.abs(chi) + 1e3 && i < 5) d = Math.sign(d) * (Math.abs(chi) + 1e3) * 0.5;
    chi -= d;
    if (Math.abs(d) <= 1e-12 * Math.max(1, Math.abs(chi))) { ok = true; break; }
  }
  z = alpha * chi * chi;
  C = stumpffC(z); S = stumpffS(z);
  const chi2 = chi * chi;
  const f = 1 - (chi2 / r0) * C;
  const g = dt - (chi2 * chi / sqmu) * S;
  const nx = f * r.x + g * v.x, ny = f * r.y + g * v.y, nz = f * r.z + g * v.z;
  const rn = Math.hypot(nx, ny, nz);
  const fd = (sqmu / (rn * r0)) * (z * S - 1) * chi;
  const gd = 1 - (chi2 / rn) * C;
  const vx = fd * r.x + gd * v.x, vy = fd * r.y + gd * v.y, vz = fd * r.z + gd * v.z;
  r.set(nx, ny, nz);
  v.set(vx, vy, vz);
  return ok;
}

export interface Conic {
  /** semi-major axis (m; negative for hyperbolas, Infinity for parabolas) */
  a: number;
  e: number;
  /** periapsis / apoapsis distance from the centre (m; apoapsis Infinity when unbound) */
  rp: number;
  ra: number;
  /** orbital period (s), Infinity when unbound */
  period: number;
  /** time until the next periapsis / apoapsis (s; NaN when there is none ahead) */
  tPe: number;
  tAp: number;
  /** specific orbital energy (J/kg) */
  energy: number;
  /** inclination to the world (ICRF) equator, rad */
  inc: number;
}

/** The osculating conic of (r, v) about `mu`. */
export function conicOf(r: Vector3, v: Vector3, mu: number): Conic {
  const rl = r.length();
  const v2 = v.lengthSq();
  const energy = v2 / 2 - mu / rl;
  const h = _h.crossVectors(r, v);
  const hl = h.length();
  const ev = _e.crossVectors(v, h).divideScalar(mu).addScaledVector(r, -1 / rl);
  const e = ev.length();
  const p = (hl * hl) / mu;
  const rp = p / (1 + e);
  const a = Math.abs(energy) < 1e-12 ? Infinity : -mu / (2 * energy);
  const inc = hl > 0 ? Math.acos(Math.max(-1, Math.min(1, h.z / hl))) : 0;
  const rv = r.dot(v);
  if (e < 1 && a > 0 && Number.isFinite(a)) {
    const ra = a * (1 + e);
    const n = Math.sqrt(mu / (a * a * a));
    const period = (2 * Math.PI) / n;
    let E = Math.atan2(rv / Math.sqrt(mu * a), 1 - rl / a);
    if (e < 1e-9) E = 0;
    const M = E - e * Math.sin(E);
    const mod = (x: number) => ((x % period) + period) % period;
    return { a, e, rp, ra, period, tPe: mod(-M / n), tAp: mod((Math.PI - M) / n), energy, inc };
  }
  // unbound: time to periapsis if still ahead
  let tPe = NaN;
  if (a < 0 && e > 1) {
    const n = Math.sqrt(mu / (-a * a * a));
    const F = Math.asinh(rv / (e * Math.sqrt(-mu * a)));
    const M = e * Math.sinh(F) - F;
    if (M < 0) tPe = -M / n;
  }
  return { a, e, rp, ra: Infinity, period: Infinity, tPe, tAp: NaN, energy, inc };
}

/**
 * Time (s) until the conic first comes down to radius R (an impact with a sphere), or NaN if it
 * never does going forward.
 */
export function timeToRadius(r: Vector3, v: Vector3, mu: number, R: number): number {
  const rl = r.length();
  const rv = r.dot(v);
  const c = conicOf(r, v, mu);
  if (c.rp >= R) return NaN;
  if (rl <= R) return 0;
  if (c.e < 1 && c.a > 0) {
    if (R > c.ra) return NaN;
    const a = c.a, e = c.e;
    const n = Math.sqrt(mu / (a * a * a));
    const E0 = Math.atan2(rv / Math.sqrt(mu * a), 1 - rl / a);
    const M0 = E0 - e * Math.sin(E0);
    const cosE = Math.max(-1, Math.min(1, (1 - R / a) / Math.max(e, 1e-12)));
    const Ei = -Math.acos(cosE); // inbound crossing (before periapsis)
    const Mi = Ei - e * Math.sin(Ei);
    const P = 2 * Math.PI / n;
    return ((((Mi - M0) / n) % P) + P) % P;
  }
  if (c.a < 0) {
    if (rv >= 0) return NaN; // outbound: never comes back
    const a = c.a, e = c.e;
    const n = Math.sqrt(mu / (-a * a * a));
    const F0 = Math.asinh(rv / (e * Math.sqrt(-mu * a)));
    const M0 = e * Math.sinh(F0) - F0;
    const coshF = Math.max(1, (1 - R / a) / e);
    const Fi = -Math.acosh(coshF);
    const Mi = e * Math.sinh(Fi) - Fi;
    return (Mi - M0) / n;
  }
  return NaN;
}

const _h = new Vector3();
const _e = new Vector3();
