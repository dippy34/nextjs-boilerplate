/**
 * God mode's N-body engine (no DOM: it runs in a Web Worker, src/god/nbody.worker.ts, and in the
 * unit tests, tests/nbody.test.ts).
 *
 * Massive bodies (Sun, planets, dwarf planets, the major moons, anything spawned) attract each
 * other and are integrated with IAS15 (Rein & Spiegel 2015): a 15th-order Gauss-Radau
 * predictor-corrector with an adaptive step chosen from the per-particle timescales of the
 * acceleration's derivatives (the criterion of Pham, Rein & Spiegel 2024), compensated
 * summation of positions and velocities. It is accurate to near machine precision per orbit,
 * handles close encounters by shrinking the step, and runs backwards as well as forwards.
 *
 * Massless test particles (asteroids, comets, an asteroid swarm) feel the massive bodies only.
 * They have their own IAS15 integrator with its own (much longer) step, which reads the massive
 * bodies' positions at any time from the dense output of the massive integrator's steps (the
 * Radau polynomial of each step), so thousands of slow particles cost little next to Io's
 * 1.8-day orbit setting the massive step.
 *
 * Units: SI (m, m/s, s, m^3/s^2). Time `t` is seconds from an arbitrary epoch (the sandbox's start).
 * Collisions merge bodies conserving mass and momentum; a body inside another's Roche limit is
 * torn into a debris ring (its mass joins the primary); anything reaching a black hole's capture
 * radius is swallowed. Each produces a `SimEvent` for the renderer (flash, debris, sound).
 */

export const FLAG_STAR = 1;
export const FLAG_BLACK_HOLE = 2;
/** never broken up by tides (stars and holes are handled by `FLAG_*` already; spawned rigid things) */
export const FLAG_RIGID = 4;

/** A particle as plain data (what crosses the worker boundary). */
export interface PState {
  id: number;
  /** G·M (m^3/s^2); 0 for test particles */
  gm: number;
  /** collision radius (m) */
  r: number;
  flags: number;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  /** oblateness: J2, its reference (equatorial) radius (m) and the spin pole (unit) */
  j2?: number; req?: number; px?: number; py?: number; pz?: number;
}

export type SimEventKind = 'merge' | 'swallow' | 'roche' | 'impact';
export interface SimEvent {
  kind: SimEventKind;
  t: number;
  /** body that remains (merge survivor, the hole, the primary) */
  survivor: number;
  /** body that is gone */
  victim: number;
  /** where it happened and the survivor's velocity afterwards */
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  /** relative speed of the encounter (m/s) */
  speed: number;
  /** mass (G·M) of the victim */
  gm: number;
  /** debris ring: distance from the primary (m) and the victim's orbit normal relative to it */
  ringR?: number;
  nx?: number; ny?: number; nz?: number;
}

// Gauss-Radau spacings (7 nodes plus 0)
const H = [0, 0.0562625605369221464656521910318, 0.180240691736892364987579942780, 0.352624717113169637373907769648,
  0.547153626330555383001448554766, 0.734210177215410531523210605558, 0.885320946839095768090359771030, 0.977520613561287501891174488626];
/** C[j][k]: coefficient of h^k in prod_{m=1..j} (h - H[m]); converts g (Newton form) to b (power form) */
const C: number[][] = (() => {
  const c: number[][] = [[1]];
  for (let j = 1; j < 7; j++) {
    const row = new Array<number>(j + 1).fill(0);
    for (let k = 0; k <= j; k++) row[k] = (k > 0 ? c[j - 1][k - 1] : 0) - H[j] * (k < j ? c[j - 1][k] : 0);
    c.push(row);
  }
  return c;
})();
/** RINV[n][j] = 1 / (H[n] - H[j]) */
const RINV: number[][] = H.map((hn, n) => H.slice(0, n).map((hj) => 1 / (hn - hj)));
const SAFETY = 0.25;
const SQRT7_5040 = (eps: number) => Math.pow(eps * 5040, 1 / 7);

export type AccelFn = (x: Float64Array, t: number, out: Float64Array) => void;

/** One recorded massive step: everything needed to evaluate positions anywhere inside it. */
interface StepRecord { t: number; dt: number; n: number; x: Float64Array; v: Float64Array; a: Float64Array; b: Float64Array[]; gm: Float64Array; r: Float64Array; flags: Int32Array; ids: Int32Array }

/** IAS15 on a flat array of 3D particles (positions `x`, velocities `v`). */
export class Radau {
  n = 0;
  x = new Float64Array(0);
  v = new Float64Array(0);
  /** acceleration at the start of the next step */
  a0 = new Float64Array(0);
  private csx = new Float64Array(0);
  private csv = new Float64Array(0);
  private b: Float64Array[] = [];
  private e: Float64Array[] = [];
  private g: Float64Array[] = [];
  private xs = new Float64Array(0);
  private fn = new Float64Array(0);
  private a0Valid = false;
  /** next (signed) step size, s */
  dt = 600;
  eps = 1e-6;
  /** steps taken / force evaluations (statistics) */
  steps = 0;
  evals = 0;
  /** called after every accepted step, with the start time, the step and the converged polynomial */
  onStep: ((t0: number, dt: number, x0: Float64Array, v0: Float64Array, a0: Float64Array, b: Float64Array[]) => void) | null = null;
  private x0 = new Float64Array(0);
  private v0 = new Float64Array(0);

  constructor(public accel: AccelFn) {}

  resize(n: number): void {
    const n3 = n * 3;
    this.n = n;
    const keep = (a: Float64Array) => { const o = new Float64Array(n3); o.set(a.subarray(0, Math.min(a.length, n3))); return o; };
    this.x = keep(this.x);
    this.v = keep(this.v);
    this.a0 = new Float64Array(n3);
    this.csx = new Float64Array(n3);
    this.csv = new Float64Array(n3);
    this.xs = new Float64Array(n3);
    this.fn = new Float64Array(n3);
    this.x0 = new Float64Array(n3);
    this.v0 = new Float64Array(n3);
    this.b = Array.from({ length: 7 }, () => new Float64Array(n3));
    this.e = Array.from({ length: 7 }, () => new Float64Array(n3));
    this.g = Array.from({ length: 7 }, () => new Float64Array(n3));
    this.reset();
  }

  /** Forget the predictor (after the state was changed from outside). */
  reset(): void {
    for (const a of this.b) a.fill(0);
    for (const a of this.e) a.fill(0);
    this.csx.fill(0);
    this.csv.fill(0);
    this.a0Valid = false;
  }

  /**
   * One accepted step of at most |dtTry| (signed). Returns the step taken; `this.dt` holds the
   * suggested next step.
   */
  step(t: number, dtTry: number): number {
    const n3 = this.n * 3;
    const { x, v, b, g, xs, fn, a0 } = this;
    if (n3 === 0) { this.dt = dtTry; return dtTry; }
    if (!this.a0Valid) { this.accel(x, t, a0); this.evals++; this.a0Valid = true; }
    let dt = dtTry;
    for (let attempt = 0; attempt < 40; attempt++) {
      // g from the predicted b (back substitution: b_k = sum_{j>=k} C[j][k] g_j)
      for (let k = 6; k >= 0; k--) {
        const gk = g[k], bk = b[k];
        for (let i = 0; i < n3; i++) {
          let s = bk[i];
          for (let j = k + 1; j < 7; j++) s -= C[j][k] * g[j][i];
          gk[i] = s;
        }
      }
      let pcPrev = Infinity;
      for (let iter = 0; iter < 12; iter++) {
        let maxDb6 = 0, maxA = 0;
        const B0 = b[0], B1 = b[1], B2 = b[2], B3 = b[3], B4 = b[4], B5 = b[5], B6 = b[6];
        for (let nIdx = 1; nIdx < 8; nIdx++) {
          const h = H[nIdx];
          const dth = dt * h;
          const dt2h2 = dth * dth;
          for (let i = 0; i < n3; i++) {
            xs[i] = x[i] + v[i] * dth + dt2h2 * (a0[i] * 0.5 + h * (B0[i] * (1 / 6) + h * (B1[i] * (1 / 12) + h * (B2[i] * (1 / 20) + h * (B3[i] * (1 / 30) + h * (B4[i] * (1 / 42) + h * (B5[i] * (1 / 56) + h * B6[i] * (1 / 72))))))));
          }
          this.accel(xs, t + h * dt, fn);
          this.evals++;
          const d = substep(nIdx, n3, fn, a0, g, b, nIdx === 7);
          if (nIdx === 7) {
            maxDb6 = d;
            for (let i = 0; i < n3; i++) { const af = fn[i] < 0 ? -fn[i] : fn[i]; if (af > maxA) maxA = af; }
          }
        }
        const pc = maxA > 0 ? maxDb6 / maxA : 0;
        if (!(pc > 1e-16)) break;
        if (iter > 2 && pc >= pcPrev) break;
        pcPrev = pc;
      }
      // step size from the per-particle timescales of the acceleration's derivatives at the end
      let minT2 = Infinity;
      for (let p = 0; p < this.n; p++) {
        let y2 = 0, y3 = 0, y4 = 0;
        for (let c = 0; c < 3; c++) {
          const i = p * 3 + c;
          const aEnd = a0[i] + b[0][i] + b[1][i] + b[2][i] + b[3][i] + b[4][i] + b[5][i] + b[6][i];
          const d1 = b[0][i] + 2 * b[1][i] + 3 * b[2][i] + 4 * b[3][i] + 5 * b[4][i] + 6 * b[5][i] + 7 * b[6][i];
          const d2 = 2 * b[1][i] + 6 * b[2][i] + 12 * b[3][i] + 20 * b[4][i] + 30 * b[5][i] + 42 * b[6][i];
          y2 += aEnd * aEnd; y3 += d1 * d1; y4 += d2 * d2;
        }
        const den = y3 + Math.sqrt(y4 * y2);
        if (!(y2 > 0) || !(den > 0)) continue;
        const t2 = (2 * y2) / den;
        if (t2 < minT2) minT2 = t2;
      }
      let dtNew = Number.isFinite(minT2) ? Math.sqrt(minT2) * Math.abs(dt) * SQRT7_5040(this.eps) : Math.abs(dt) / SAFETY;
      if (!Number.isFinite(dtNew) || dtNew <= 0) dtNew = Math.abs(dt) * SAFETY;
      if (dtNew < SAFETY * Math.abs(dt) && attempt < 39) {
        // reject: retry with the smaller step (the polynomial rescaled as the predictor)
        const ratio = (Math.sign(dt) * dtNew) / dt;
        for (let k = 0; k < 7; k++) { const s = ratio ** (k + 1); const bk = b[k], ek = this.e[k]; for (let i = 0; i < n3; i++) { bk[i] *= s; ek[i] *= s; } }
        dt = Math.sign(dt) * dtNew;
        continue;
      }
      if (dtNew > Math.abs(dt) / SAFETY) dtNew = Math.abs(dt) / SAFETY;
      // accept: advance (compensated sums)
      if (this.onStep) { this.x0.set(x); this.v0.set(v); }
      const { csx, csv } = this;
      for (let i = 0; i < n3; i++) {
        const dx = v[i] * dt + dt * dt * (a0[i] / 2 + b[0][i] / 6 + b[1][i] / 12 + b[2][i] / 20 + b[3][i] / 30 + b[4][i] / 42 + b[5][i] / 56 + b[6][i] / 72);
        let y = dx - csx[i]; let tt = x[i] + y; csx[i] = (tt - x[i]) - y; x[i] = tt;
        const dv = dt * (a0[i] + b[0][i] / 2 + b[1][i] / 3 + b[2][i] / 4 + b[3][i] / 5 + b[4][i] / 6 + b[5][i] / 7 + b[6][i] / 8);
        y = dv - csv[i]; tt = v[i] + y; csv[i] = (tt - v[i]) - y; v[i] = tt;
      }
      if (this.onStep) this.onStep(t, dt, this.x0, this.v0, a0, b);
      // the acceleration at the end is the start of the next step
      this.accel(x, t + dt, a0);
      this.evals++;
      this.steps++;
      // predict the next step's polynomial (only for modest changes of step)
      const q = (Math.sign(dt) * dtNew) / dt;
      if (q > 0 && q <= 20) predict(b, this.e, q, n3);
      else { for (const bk of b) bk.fill(0); for (const ek of this.e) ek.fill(0); }
      this.dt = Math.sign(dt) * dtNew;
      return dt;
    }
    return dt;
  }

  /** Evaluate positions inside a recorded step at fraction h (0..1). */
  static positionAt(rec: { dt: number; x: Float64Array; v: Float64Array; a: Float64Array; b: Float64Array[] }, h: number, out: Float64Array, n3: number): void {
    const { dt, x, v, a, b } = rec;
    const dt2h2 = dt * dt * h * h;
    for (let i = 0; i < n3; i++) {
      out[i] = x[i] + v[i] * dt * h + dt2h2 * (a[i] / 2 + h * (b[0][i] / 6 + h * (b[1][i] / 12 + h * (b[2][i] / 20 + h * (b[3][i] / 30 + h * (b[4][i] / 42 + h * (b[5][i] / 56 + h * b[6][i] / 72)))))));
    }
  }
}

/** Substep n (1..7): update g[n-1] from the force fn and the b polynomial (unrolled; generated). */
function substep(n: number, n3: number, fn: Float64Array, a0: Float64Array, g: Float64Array[], b: Float64Array[], track: boolean): number {
  const g0 = g[0], g1 = g[1], g2 = g[2], g3 = g[3], g4 = g[4], g5 = g[5], g6 = g[6];
  const b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6];
  let maxDg = 0;
  switch (n) {
    case 1: {
      const r0 = RINV[1][0];
      const c0 = C[0][0];
      for (let i = 0; i < n3; i++) {
        const gn = (fn[i] - a0[i]) * r0;
        const dg = gn - g0[i];
        g0[i] = gn;
        b0[i] += c0 * dg;
      }
      break;
    }
    case 2: {
      const r0 = RINV[2][0];
      const r1 = RINV[2][1];
      const c0 = C[1][0];
      const c1 = C[1][1];
      for (let i = 0; i < n3; i++) {
        const gn = ((fn[i] - a0[i]) * r0 - g0[i]) * r1;
        const dg = gn - g1[i];
        g1[i] = gn;
        b0[i] += c0 * dg;
        b1[i] += c1 * dg;
      }
      break;
    }
    case 3: {
      const r0 = RINV[3][0];
      const r1 = RINV[3][1];
      const r2 = RINV[3][2];
      const c0 = C[2][0];
      const c1 = C[2][1];
      const c2 = C[2][2];
      for (let i = 0; i < n3; i++) {
        const gn = (((fn[i] - a0[i]) * r0 - g0[i]) * r1 - g1[i]) * r2;
        const dg = gn - g2[i];
        g2[i] = gn;
        b0[i] += c0 * dg;
        b1[i] += c1 * dg;
        b2[i] += c2 * dg;
      }
      break;
    }
    case 4: {
      const r0 = RINV[4][0];
      const r1 = RINV[4][1];
      const r2 = RINV[4][2];
      const r3 = RINV[4][3];
      const c0 = C[3][0];
      const c1 = C[3][1];
      const c2 = C[3][2];
      const c3 = C[3][3];
      for (let i = 0; i < n3; i++) {
        const gn = ((((fn[i] - a0[i]) * r0 - g0[i]) * r1 - g1[i]) * r2 - g2[i]) * r3;
        const dg = gn - g3[i];
        g3[i] = gn;
        b0[i] += c0 * dg;
        b1[i] += c1 * dg;
        b2[i] += c2 * dg;
        b3[i] += c3 * dg;
      }
      break;
    }
    case 5: {
      const r0 = RINV[5][0];
      const r1 = RINV[5][1];
      const r2 = RINV[5][2];
      const r3 = RINV[5][3];
      const r4 = RINV[5][4];
      const c0 = C[4][0];
      const c1 = C[4][1];
      const c2 = C[4][2];
      const c3 = C[4][3];
      const c4 = C[4][4];
      for (let i = 0; i < n3; i++) {
        const gn = (((((fn[i] - a0[i]) * r0 - g0[i]) * r1 - g1[i]) * r2 - g2[i]) * r3 - g3[i]) * r4;
        const dg = gn - g4[i];
        g4[i] = gn;
        b0[i] += c0 * dg;
        b1[i] += c1 * dg;
        b2[i] += c2 * dg;
        b3[i] += c3 * dg;
        b4[i] += c4 * dg;
      }
      break;
    }
    case 6: {
      const r0 = RINV[6][0];
      const r1 = RINV[6][1];
      const r2 = RINV[6][2];
      const r3 = RINV[6][3];
      const r4 = RINV[6][4];
      const r5 = RINV[6][5];
      const c0 = C[5][0];
      const c1 = C[5][1];
      const c2 = C[5][2];
      const c3 = C[5][3];
      const c4 = C[5][4];
      const c5 = C[5][5];
      for (let i = 0; i < n3; i++) {
        const gn = ((((((fn[i] - a0[i]) * r0 - g0[i]) * r1 - g1[i]) * r2 - g2[i]) * r3 - g3[i]) * r4 - g4[i]) * r5;
        const dg = gn - g5[i];
        g5[i] = gn;
        b0[i] += c0 * dg;
        b1[i] += c1 * dg;
        b2[i] += c2 * dg;
        b3[i] += c3 * dg;
        b4[i] += c4 * dg;
        b5[i] += c5 * dg;
      }
      break;
    }
    case 7: {
      const r0 = RINV[7][0];
      const r1 = RINV[7][1];
      const r2 = RINV[7][2];
      const r3 = RINV[7][3];
      const r4 = RINV[7][4];
      const r5 = RINV[7][5];
      const r6 = RINV[7][6];
      const c0 = C[6][0];
      const c1 = C[6][1];
      const c2 = C[6][2];
      const c3 = C[6][3];
      const c4 = C[6][4];
      const c5 = C[6][5];
      const c6 = C[6][6];
      for (let i = 0; i < n3; i++) {
        const gn = (((((((fn[i] - a0[i]) * r0 - g0[i]) * r1 - g1[i]) * r2 - g2[i]) * r3 - g3[i]) * r4 - g4[i]) * r5 - g5[i]) * r6;
        const dg = gn - g6[i];
        g6[i] = gn;
        b0[i] += c0 * dg;
        b1[i] += c1 * dg;
        b2[i] += c2 * dg;
        b3[i] += c3 * dg;
        b4[i] += c4 * dg;
        b5[i] += c5 * dg;
        b6[i] += c6 * dg;
        if (track) { const d = dg < 0 ? -dg : dg; if (d > maxDg) maxDg = d; }
      }
      break;
    }
  }
  return maxDg;
}

/**
 * The next step's polynomial from this one's (step ratio q). `e` holds the previous prediction:
 * its error (b - e) is carried over as a correction, as in REBOUND's IAS15.
 */
function predict(b: Float64Array[], e: Float64Array[], q: number, n3: number): void {
  const q2 = q * q, q3 = q2 * q, q4 = q3 * q, q5 = q4 * q, q6 = q5 * q, q7 = q6 * q;
  for (let i = 0; i < n3; i++) {
    const b0 = b[0][i], b1 = b[1][i], b2 = b[2][i], b3 = b[3][i], b4 = b[4][i], b5 = b[5][i], b6 = b[6][i];
    const be0 = b0 - e[0][i], be1 = b1 - e[1][i], be2 = b2 - e[2][i], be3 = b3 - e[3][i], be4 = b4 - e[4][i], be5 = b5 - e[5][i], be6 = b6 - e[6][i];
    e[0][i] = q * (b6 * 7 + b5 * 6 + b4 * 5 + b3 * 4 + b2 * 3 + b1 * 2 + b0);
    e[1][i] = q2 * (b6 * 21 + b5 * 15 + b4 * 10 + b3 * 6 + b2 * 3 + b1);
    e[2][i] = q3 * (b6 * 35 + b5 * 20 + b4 * 10 + b3 * 4 + b2);
    e[3][i] = q4 * (b6 * 35 + b5 * 15 + b4 * 5 + b3);
    e[4][i] = q5 * (b6 * 21 + b5 * 6 + b4);
    e[5][i] = q6 * (b6 * 7 + b5);
    e[6][i] = q7 * b6;
    b[0][i] = e[0][i] + be0; b[1][i] = e[1][i] + be1; b[2][i] = e[2][i] + be2; b[3][i] = e[3][i] + be3;
    b[4][i] = e[4][i] + be4; b[5][i] = e[5][i] + be5; b[6][i] = e[6][i] + be6;
  }
}

/** Capture radius of a black hole (m): a few Schwarzschild radii, at least 1,000 km so it can be hit. */
export function captureRadius(gm: number): number {
  const rs = (2 * gm) / (299_792_458 ** 2);
  return Math.max(50 * rs, 1e6);
}

/** Roche limit (m) of a fluid body of radius `r` and G·M `gm` around a primary of G·M `gmP`. */
export function rocheLimit(r: number, gm: number, gmP: number): number {
  return 2.44 * r * Math.cbrt(gmP / gm);
}

/** The sandbox universe: massive bodies + test particles, advanced together. */
export class NBody {
  t = 0;
  /** massive bodies */
  ids = new Int32Array(0);
  gm = new Float64Array(0);
  r = new Float64Array(0);
  flags = new Int32Array(0);
  /** oblate bodies: [index, J2·R², pole x, y, z] per entry (flat) */
  private oblate: number[] = [];
  readonly mass: Radau;
  /** test particles */
  tids = new Int32Array(0);
  tr = new Float64Array(0);
  readonly test: Radau;
  tt = 0;
  events: SimEvent[] = [];
  /** collisions and tides on (off in a pure-gravity test) */
  collisions = true;
  private log: StepRecord[] = [];
  private logN = 0;
  private logCursor = 0;
  private scratch = new Float64Array(0);
  private dir = 0;

  constructor(eps = 1e-6) {
    this.mass = new Radau((x, _t, out) => this.gravity(x, out));
    this.test = new Radau((x, t, out) => this.testGravity(x, t, out));
    this.mass.eps = eps;
    this.test.eps = eps;
    this.mass.onStep = (t0, dt, x0, v0, a0, b) => this.record(t0, dt, x0, v0, a0, b);
  }

  get n(): number { return this.mass.n; }
  get nTest(): number { return this.test.n; }

  setState(t: number, massive: PState[], tests: PState[] = []): void {
    this.t = t;
    this.tt = t;
    const n = massive.length;
    this.ids = new Int32Array(n); this.gm = new Float64Array(n); this.r = new Float64Array(n); this.flags = new Int32Array(n);
    this.mass.resize(n);
    this.j2 = massive.map((p) => (p.j2 ? { j2: p.j2, req: p.req ?? p.r, px: p.px ?? 0, py: p.py ?? 0, pz: p.pz ?? 1 } : null));
    this.indexOblate();
    massive.forEach((p, i) => {
      this.ids[i] = p.id; this.gm[i] = p.gm; this.r[i] = p.r; this.flags[i] = p.flags;
      this.mass.x.set([p.x, p.y, p.z], i * 3);
      this.mass.v.set([p.vx, p.vy, p.vz], i * 3);
    });
    const m = tests.length;
    this.tids = new Int32Array(m); this.tr = new Float64Array(m);
    this.test.resize(m);
    tests.forEach((p, i) => {
      this.tids[i] = p.id; this.tr[i] = p.r;
      this.test.x.set([p.x, p.y, p.z], i * 3);
      this.test.v.set([p.vx, p.vy, p.vz], i * 3);
    });
    this.mass.dt = this.initialStep();
    this.test.dt = Math.max(this.mass.dt, 3600);
    this.dir = 0;
  }

  /** oblateness per massive body (same order as ids) */
  private j2: ({ j2: number; req: number; px: number; py: number; pz: number } | null)[] = [];
  private indexOblate(): void {
    this.oblate = [];
    this.j2.forEach((o, i) => { if (o) this.oblate.push(i, o.j2 * o.req * o.req, o.px, o.py, o.pz); });
  }

  getState(): { t: number; massive: PState[]; tests: PState[] } {
    const out = (ids: Int32Array, R: Radau, gm: Float64Array | null, r: Float64Array, flags: Int32Array | null): PState[] =>
      Array.from(ids, (id, i) => ({
        id, gm: gm ? gm[i] : 0, r: r[i], flags: flags ? flags[i] : 0,
        x: R.x[i * 3], y: R.x[i * 3 + 1], z: R.x[i * 3 + 2], vx: R.v[i * 3], vy: R.v[i * 3 + 1], vz: R.v[i * 3 + 2],
      }));
    const massive = out(this.ids, this.mass, this.gm, this.r, this.flags);
    massive.forEach((p, i) => { const o = this.j2[i]; if (o) Object.assign(p, o); });
    return { t: this.t, massive, tests: out(this.tids, this.test, null, this.tr, null) };
  }

  /** A safe first step: a small fraction of the shortest dynamical time between any two bodies. */
  private initialStep(): number {
    let tMin = 86400 * 365;
    const x = this.mass.x, v = this.mass.v;
    for (let i = 0; i < this.n; i++) for (let j = i + 1; j < this.n; j++) {
      const dx = x[j * 3] - x[i * 3], dy = x[j * 3 + 1] - x[i * 3 + 1], dz = x[j * 3 + 2] - x[i * 3 + 2];
      const d = Math.hypot(dx, dy, dz);
      const mu = this.gm[i] + this.gm[j];
      if (mu > 0) tMin = Math.min(tMin, Math.sqrt((d * d * d) / mu));
      const dv = Math.hypot(v[j * 3] - v[i * 3], v[j * 3 + 1] - v[i * 3 + 1], v[j * 3 + 2] - v[i * 3 + 2]);
      if (dv > 0) tMin = Math.min(tMin, d / dv);
    }
    return Math.max(1e-3, tMin * 1e-3);
  }

  private gravity(x: Float64Array, out: Float64Array): void {
    const n = this.n, gm = this.gm, r = this.r;
    out.fill(0, 0, n * 3);
    for (let i = 0; i < n; i++) {
      const xi = x[i * 3], yi = x[i * 3 + 1], zi = x[i * 3 + 2];
      let ax = 0, ay = 0, az = 0;
      const gi = gm[i], ri = r[i];
      for (let j = i + 1; j < n; j++) {
        const dx = x[j * 3] - xi, dy = x[j * 3 + 1] - yi, dz = x[j * 3 + 2] - zi;
        let d2 = dx * dx + dy * dy + dz * dz;
        // overlapping bodies merge at the end of the step; until then no singular forces
        const s = 0.25 * (ri + r[j]);
        if (d2 < s * s) d2 = s * s;
        const inv = 1 / (d2 * Math.sqrt(d2));
        const fj = gm[j] * inv, fi = gi * inv;
        ax += fj * dx; ay += fj * dy; az += fj * dz;
        out[j * 3] -= fi * dx; out[j * 3 + 1] -= fi * dy; out[j * 3 + 2] -= fi * dz;
      }
      out[i * 3] += ax; out[i * 3 + 1] += ay; out[i * 3 + 2] += az;
    }
    // oblate planets (J2): moons close in feel the bulge, and the planet the reaction
    const ob = this.oblate;
    for (let k = 0; k < ob.length; k += 5) {
      const p = ob[k], j2r2 = ob[k + 1], kx = ob[k + 2], ky = ob[k + 3], kz = ob[k + 4];
      const gp = gm[p];
      if (gp <= 0) continue;
      const lim = 1.5e10 * j2r2; // beyond this the bulge adds less than 1e-10 of the pull
      for (let i = 0; i < n; i++) {
        if (i === p) continue;
        const dx = x[i * 3] - x[p * 3], dy = x[i * 3 + 1] - x[p * 3 + 1], dz = x[i * 3 + 2] - x[p * 3 + 2];
        const r2 = dx * dx + dy * dy + dz * dz;
        if (r2 > lim || r2 < r[p] * r[p]) continue;
        const zz = dx * kx + dy * ky + dz * kz;
        const ir2 = 1 / r2;
        const f = (-1.5 * gp * j2r2 * ir2 * ir2) / Math.sqrt(r2);
        const c1 = f * (1 - 5 * zz * zz * ir2), c2 = 2 * f * zz;
        const ax = c1 * dx + c2 * kx, ay = c1 * dy + c2 * ky, az = c1 * dz + c2 * kz;
        out[i * 3] += ax; out[i * 3 + 1] += ay; out[i * 3 + 2] += az;
        const back = gm[i] / gp;
        out[p * 3] -= back * ax; out[p * 3 + 1] -= back * ay; out[p * 3 + 2] -= back * az;
      }
    }
  }

  private record(t0: number, dt: number, x0: Float64Array, v0: Float64Array, a0: Float64Array, b: Float64Array[]): void {
    if (this.test.n === 0) return;
    const n3 = this.n * 3;
    let rec = this.log[this.logN];
    if (!rec || rec.x.length !== n3) {
      rec = { t: 0, dt: 0, n: 0, x: new Float64Array(n3), v: new Float64Array(n3), a: new Float64Array(n3), b: Array.from({ length: 7 }, () => new Float64Array(n3)), gm: this.gm, r: this.r, flags: this.flags, ids: this.ids };
      this.log[this.logN] = rec;
    }
    rec.t = t0; rec.dt = dt; rec.n = this.n;
    rec.x.set(x0); rec.v.set(v0); rec.a.set(a0);
    for (let k = 0; k < 7; k++) rec.b[k].set(b[k]);
    rec.gm = this.gm; rec.r = this.r; rec.flags = this.flags; rec.ids = this.ids;
    this.logN++;
  }

  /** The massive step record covering time t (the log runs in the direction of integration). */
  private recordAt(t: number): StepRecord | null {
    if (this.logN === 0) return null;
    let k = Math.min(this.logCursor, this.logN - 1);
    const inside = (r: StepRecord) => (r.dt >= 0 ? t >= r.t - 1e-9 && t <= r.t + r.dt + 1e-9 : t <= r.t + 1e-9 && t >= r.t + r.dt - 1e-9);
    if (inside(this.log[k])) return this.log[k];
    for (k = 0; k < this.logN; k++) if (inside(this.log[k])) { this.logCursor = k; return this.log[k]; }
    // outside (rounding at the ends): the nearest end
    const first = this.log[0], last = this.log[this.logN - 1];
    return Math.abs(t - first.t) < Math.abs(t - (last.t + last.dt)) ? first : last;
  }

  /** massive positions at time t (from the step log, or the current state) */
  private massiveAt(t: number): { pos: Float64Array; n: number; gm: Float64Array; r: Float64Array; flags: Int32Array; ids: Int32Array } {
    const rec = this.recordAt(t);
    if (!rec) return { pos: this.mass.x, n: this.n, gm: this.gm, r: this.r, flags: this.flags, ids: this.ids };
    const n3 = rec.n * 3;
    if (this.scratch.length < n3) this.scratch = new Float64Array(n3);
    Radau.positionAt(rec, rec.dt === 0 ? 0 : (t - rec.t) / rec.dt, this.scratch, n3);
    return { pos: this.scratch, n: rec.n, gm: rec.gm, r: rec.r, flags: rec.flags, ids: rec.ids };
  }

  private testGravity(x: Float64Array, t: number, out: Float64Array): void {
    const m = this.test.n;
    const { pos, n, gm } = this.massiveAt(t);
    out.fill(0, 0, m * 3);
    for (let j = 0; j < n; j++) {
      const g = gm[j];
      if (g <= 0) continue;
      const xj = pos[j * 3], yj = pos[j * 3 + 1], zj = pos[j * 3 + 2];
      for (let i = 0; i < m; i++) {
        const dx = xj - x[i * 3], dy = yj - x[i * 3 + 1], dz = zj - x[i * 3 + 2];
        let d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 1e6) d2 = 1e6;
        const f = g / (d2 * Math.sqrt(d2));
        out[i * 3] += f * dx; out[i * 3 + 1] += f * dy; out[i * 3 + 2] += f * dz;
      }
    }
  }

  /**
   * Advance to `goal` (either direction), landing on it exactly. Stops early (returning false)
   * after `maxMs` of work; the state is then consistent at `this.t`.
   */
  advance(goal: number, maxMs = Infinity): boolean {
    if (goal === this.t) return true;
    const dir = Math.sign(goal - this.t);
    if (dir !== this.dir) {
      // direction changed: the predictors look the wrong way
      this.mass.reset(); this.test.reset();
      this.mass.dt = dir * Math.abs(this.mass.dt); this.test.dt = dir * Math.abs(this.test.dt);
      this.dir = dir;
    }
    const t0 = performance.now();
    while (this.t !== goal) {
      // massive bodies: a chunk of steps up to the goal
      this.logN = 0; this.logCursor = 0;
      const tStart = this.t;
      let target = goal;
      // keep the step log small: the test particles follow every ~64 massive steps
      for (let s = 0; s < 64 && this.t !== target; s++) {
        const rem = target - this.t;
        const natural = this.mass.dt;
        const clamped = Math.abs(natural) >= Math.abs(rem);
        const done = this.mass.step(this.t, clamped ? rem : natural);
        this.t = clamped && done === rem ? target : this.t + done;
        if (clamped && done === rem && Math.abs(this.mass.dt) >= Math.abs(rem) * 0.999) this.mass.dt = dir * Math.max(Math.abs(this.mass.dt), Math.abs(natural));
        if (this.n === 0) { this.t = target; break; }
        if (this.collisions && this.n > 1 && this.handleEncounters()) { target = this.t; break; }
      }
      // test particles follow over the same interval
      if (this.test.n > 0) this.advanceTests(this.t, dir);
      else this.tt = this.t;
      if (this.n === 0 && this.t !== goal) { // nothing massive: tests drift (the log is empty)
        this.t = goal;
      }
      if (this.t === tStart && this.t !== goal) break;
      if (performance.now() - t0 > maxMs) return this.t === goal;
    }
    return true;
  }

  private advanceTests(goal: number, dir: number): void {
    const T = this.test;
    if (Math.sign(T.dt) !== dir) T.dt = dir * Math.abs(T.dt);
    if (this.logN === 0) {
      // no massive steps were logged (nothing massive): straight lines
      for (let i = 0; i < T.n * 3; i++) T.x[i] += T.v[i] * (goal - this.tt);
      T.reset();
      this.tt = goal;
      return;
    }
    let guard = 0;
    while (this.tt !== goal && guard++ < 100000) {
      const rem = goal - this.tt;
      const natural = T.dt;
      const clamped = Math.abs(natural) >= Math.abs(rem);
      const done = T.step(this.tt, clamped ? rem : natural);
      this.tt = clamped && done === rem ? goal : this.tt + done;
      if (clamped && done === rem && Math.abs(T.dt) >= Math.abs(rem) * 0.999) T.dt = dir * Math.max(Math.abs(T.dt), Math.abs(natural));
      if (this.collisions) this.testImpacts();
    }
  }

  /** Test particles that hit a massive body are removed. */
  private testImpacts(): void {
    const T = this.test;
    const { pos, n, r, flags, ids } = this.massiveAt(this.tt);
    let removed: number[] | null = null;
    for (let i = 0; i < T.n; i++) {
      for (let j = 0; j < n; j++) {
        const dx = pos[j * 3] - T.x[i * 3], dy = pos[j * 3 + 1] - T.x[i * 3 + 1], dz = pos[j * 3 + 2] - T.x[i * 3 + 2];
        const R = flags[j] & FLAG_BLACK_HOLE ? captureRadius(this.gmOf(ids[j])) : r[j];
        if (dx * dx + dy * dy + dz * dz < R * R) {
          (removed ??= []).push(i);
          this.events.push({ kind: 'impact', t: this.tt, survivor: ids[j], victim: this.tids[i], x: T.x[i * 3], y: T.x[i * 3 + 1], z: T.x[i * 3 + 2], vx: 0, vy: 0, vz: 0, speed: 0, gm: 0 });
          break;
        }
      }
    }
    if (removed) this.removeTests(removed);
  }

  private gmOf(id: number): number {
    const i = this.ids.indexOf(id);
    return i >= 0 ? this.gm[i] : 0;
  }

  private removeTests(idx: number[]): void {
    const keep: number[] = [];
    const drop = new Set(idx);
    for (let i = 0; i < this.test.n; i++) if (!drop.has(i)) keep.push(i);
    const x = this.test.x, v = this.test.v, ids = this.tids, tr = this.tr;
    const dt = this.test.dt;
    this.test.resize(keep.length);
    this.tids = new Int32Array(keep.length); this.tr = new Float64Array(keep.length);
    keep.forEach((k, i) => {
      this.tids[i] = ids[k]; this.tr[i] = tr[k];
      for (let c = 0; c < 3; c++) { this.test.x[i * 3 + c] = x[k * 3 + c]; this.test.v[i * 3 + c] = v[k * 3 + c]; }
    });
    this.test.dt = dt;
  }

  /**
   * Collisions, tidal break-up and black-hole captures at the end of a step. Returns true when the
   * set of bodies changed.
   */
  private handleEncounters(): boolean {
    const n = this.n, x = this.mass.x, v = this.mass.v, gm = this.gm, r = this.r, fl = this.flags;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = x[j * 3] - x[i * 3], dy = x[j * 3 + 1] - x[i * 3 + 1], dz = x[j * 3 + 2] - x[i * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        // the bigger one is the primary
        const p = gm[i] >= gm[j] ? i : j, s = p === i ? j : i;
        const pBH = (fl[p] & FLAG_BLACK_HOLE) !== 0, sBH = (fl[s] & FLAG_BLACK_HOLE) !== 0;
        const touch = (pBH ? captureRadius(gm[p]) : r[p]) + (sBH ? captureRadius(gm[s]) : r[s]);
        if (d2 < touch * touch) {
          this.merge(p, s, pBH ? 'swallow' : 'merge', Math.sqrt(d2));
          return true;
        }
        // tides: a body much lighter than its neighbour, inside its Roche limit, comes apart
        // (d^3 < roche^3 = 2.44^3 r^3 gmP / gm, without roots)
        if (!sBH && !(fl[s] & FLAG_RIGID) && gm[s] > 0 && gm[p] > 10 * gm[s] && d2 * Math.sqrt(d2) * gm[s] < 14.526784 * r[s] * r[s] * r[s] * gm[p]) {
          const d = Math.sqrt(d2);
          {
            // plunging straight in: no ring, it hits
            const rvx = v[s * 3] - v[p * 3], rvy = v[s * 3 + 1] - v[p * 3 + 1], rvz = v[s * 3 + 2] - v[p * 3 + 2];
            const sx = x[s * 3] - x[p * 3], sy = x[s * 3 + 1] - x[p * 3 + 1], sz = x[s * 3 + 2] - x[p * 3 + 2];
            const hx = sy * rvz - sz * rvy, hy = sz * rvx - sx * rvz, hz = sx * rvy - sy * rvx;
            const h2 = hx * hx + hy * hy + hz * hz;
            const mu = gm[p] + gm[s];
            const v2 = rvx * rvx + rvy * rvy + rvz * rvz;
            const energy = v2 / 2 - mu / d;
            const ecc = Math.sqrt(Math.max(0, 1 + (2 * energy * h2) / (mu * mu)));
            const peri = h2 / mu / (1 + ecc);
            const inner = pBH ? captureRadius(gm[p]) : r[p];
            if (peri < inner + r[s]) continue; // it will hit: the collision handles it
            const hn = Math.sqrt(h2) || 1;
            this.merge(p, s, 'roche', d, { ringR: d, nx: hx / hn, ny: hy / hn, nz: hz / hn });
            return true;
          }
        }
      }
    }
    return false;
  }

  /** Merge body `s` into `p` (mass and momentum conserved, volumes added). */
  private merge(p: number, s: number, kind: SimEventKind, d: number, ring?: { ringR: number; nx: number; ny: number; nz: number }): void {
    const x = this.mass.x, v = this.mass.v, gm = this.gm;
    const M = gm[p] + gm[s];
    const rel = Math.hypot(v[s * 3] - v[p * 3], v[s * 3 + 1] - v[p * 3 + 1], v[s * 3 + 2] - v[p * 3 + 2]);
    const ev: SimEvent = { kind, t: this.t, survivor: this.ids[p], victim: this.ids[s], x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, speed: rel, gm: gm[s], ...ring };
    // where it happened: the victim's position for a ring or a capture, the contact point otherwise
    const at = kind === 'merge' ? (this.r[p] / Math.max(d, 1)) : 1;
    const f = Math.min(1, at);
    ev.x = x[p * 3] + (x[s * 3] - x[p * 3]) * f;
    ev.y = x[p * 3 + 1] + (x[s * 3 + 1] - x[p * 3 + 1]) * f;
    ev.z = x[p * 3 + 2] + (x[s * 3 + 2] - x[p * 3 + 2]) * f;
    if (M > 0) {
      for (let c = 0; c < 3; c++) {
        x[p * 3 + c] = (gm[p] * x[p * 3 + c] + gm[s] * x[s * 3 + c]) / M;
        v[p * 3 + c] = (gm[p] * v[p * 3 + c] + gm[s] * v[s * 3 + c]) / M;
      }
    }
    ev.vx = v[p * 3]; ev.vy = v[p * 3 + 1]; ev.vz = v[p * 3 + 2];
    if (!(this.flags[p] & FLAG_BLACK_HOLE) && kind === 'merge') this.r[p] = Math.cbrt(this.r[p] ** 3 + this.r[s] ** 3);
    gm[p] = M;
    this.events.push(ev);
    this.removeMassive(s);
  }

  private removeMassive(s: number): void {
    const n = this.n;
    const keep: number[] = [];
    for (let i = 0; i < n; i++) if (i !== s) keep.push(i);
    const x = this.mass.x, v = this.mass.v, ids = this.ids, gm = this.gm, r = this.r, fl = this.flags;
    const dt = this.mass.dt;
    this.mass.resize(keep.length);
    this.ids = new Int32Array(keep.length); this.gm = new Float64Array(keep.length); this.r = new Float64Array(keep.length); this.flags = new Int32Array(keep.length);
    this.j2 = keep.map((k) => this.j2[k] ?? null);
    this.indexOblate();
    keep.forEach((k, i) => {
      this.ids[i] = ids[k]; this.gm[i] = gm[k]; this.r[i] = r[k]; this.flags[i] = fl[k];
      for (let c = 0; c < 3; c++) { this.mass.x[i * 3 + c] = x[k * 3 + c]; this.mass.v[i * 3 + c] = v[k * 3 + c]; }
    });
    this.mass.dt = dt;
  }

  /** Total energy (per G; kinetic with masses gm) and momentum (gm-weighted) of the massive bodies. */
  invariants(): { energy: number; px: number; py: number; pz: number } {
    const n = this.n, x = this.mass.x, v = this.mass.v, gm = this.gm;
    let ke = 0, pe = 0, px = 0, py = 0, pz = 0;
    for (let i = 0; i < n; i++) {
      const vx = v[i * 3], vy = v[i * 3 + 1], vz = v[i * 3 + 2];
      ke += 0.5 * gm[i] * (vx * vx + vy * vy + vz * vz);
      px += gm[i] * vx; py += gm[i] * vy; pz += gm[i] * vz;
      for (let j = i + 1; j < n; j++) {
        const d = Math.hypot(x[j * 3] - x[i * 3], x[j * 3 + 1] - x[i * 3 + 1], x[j * 3 + 2] - x[i * 3 + 2]);
        pe -= (gm[i] * gm[j]) / d;
      }
    }
    return { energy: ke + pe, px, py, pz };
  }
}
