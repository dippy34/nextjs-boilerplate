import { Vector3 } from 'three';
import { addPointAccel, type GravitySource } from './Gravity';
import { propagateKepler } from './Kepler';
import type { Atmosphere } from './ShipPhysics';

export type PredictEventKind = 'pe' | 'ap' | 'impact' | 'horizon' | 'escape' | 'encounter';
export interface PredictEvent {
  kind: PredictEventKind;
  /** seconds from the start of the prediction */
  t: number;
  /** position relative to the frame body at that time (m) */
  pos: Vector3;
  /** distance from the frame body's centre (m) */
  r: number;
  /** speed relative to the frame body (m/s) */
  speed: number;
  /** body entered (encounter) */
  body?: GravitySource;
}

interface PSrc {
  s: GravitySource;
  /** index of the source it orbits in this list, -1 for a root (moves in a straight line) */
  parent: number;
  mu: number;
  /** state relative to the parent (or absolute offset for roots), advanced step by step */
  r: Vector3;
  v: Vector3;
  /** absolute position (root frame) at the current step start, velocity and acceleration */
  P: Vector3;
  V: Vector3;
  A: Vector3;
}

const MAX_SRC = 10;
const W1 = 1 / (2 - Math.cbrt(2));
const W0 = -Math.cbrt(2) / (2 - Math.cbrt(2));
const YC = [W1 / 2, (W0 + W1) / 2, (W0 + W1) / 2, W1 / 2];
const YD = [W1, W0, W1];

export interface PredictInput {
  frame: GravitySource;
  /** ship state relative to the frame body (m, m/s) */
  rel: Vector3;
  relVel: Vector3;
  sources: GravitySource[];
  groundR: number;
  atmosphere: Atmosphere | null;
  spin: Vector3;
  cdA: number;
  mass: number;
  /** how many orbits ahead (bound orbits) */
  orbits: number;
  /** longest prediction (s) */
  maxTime: number;
  maxPoints: number;
}

/**
 * Numerical trajectory prediction, run a slice at a time (`advance(steps)`), so its cost is capped
 * per frame. The ship is integrated in the inertial frame of the hierarchy's root; the bodies that
 * matter move on two-body orbits about their primaries (so a Moon encounter days ahead is placed
 * right), black holes and stars are fixed, and the path is recorded relative to the frame body.
 */
export class Predictor {
  done = true;
  /** recorded points relative to the frame body (x, y, z per point) */
  points = new Float64Array(0);
  count = 0;
  events: PredictEvent[] = [];
  /** time covered so far (s) */
  t = 0;
  frame: GravitySource | null = null;
  private src: PSrc[] = [];
  private fi = 0; // index of the frame body
  private x = new Vector3();
  private v = new Vector3();
  private a = new Vector3();
  private inp!: PredictInput;
  private lastRv = 0;
  private tEnd = 0;
  private eta = (2 * Math.PI) / 220;
  private inside = new Set<GravitySource>();
  private tmp = new Vector3();

  start(inp: PredictInput): void {
    this.inp = inp;
    this.frame = inp.frame;
    this.done = false;
    this.count = 0;
    this.events = [];
    this.t = 0;
    if (this.points.length < inp.maxPoints * 3) this.points = new Float64Array(inp.maxPoints * 3);
    // sources: the frame body, its primaries, its moons and siblings, and strong roots
    const D = inp.frame;
    const want: GravitySource[] = [D];
    for (let p = D.parent; p && want.length < MAX_SRC; p = p.parent) want.push(p);
    const shipAbs = (s: GravitySource) => s.upos.sub(D.upos, this.tmp).sub(inp.rel).length();
    const pullD = D.gm / Math.max(inp.rel.lengthSq(), 1);
    const extra = inp.sources
      .filter((s) => !want.includes(s))
      .map((s) => ({ s, a: s.gm / Math.max(shipAbs(s) ** 2, 1), near: s.parent === D || s.parent === D.parent }))
      .filter((c) => c.near ? c.a > pullD * 1e-7 : c.a > pullD * 1e-5)
      .sort((p, q) => q.a - p.a);
    for (const c of extra) { if (want.length >= MAX_SRC) break; want.push(c.s); }
    // primaries before their satellites
    const depth = (s: GravitySource) => { let d = 0; for (let p = s.parent; p; p = p.parent) d++; return d; };
    want.sort((p, q) => depth(p) - depth(q));
    this.src = want.map((s) => ({ s, parent: -1, mu: 0, r: new Vector3(), v: new Vector3(), P: new Vector3(), V: new Vector3(), A: new Vector3() }));
    const root = this.src[0].s;
    for (const p of this.src) {
      const pi = p.s.parent ? want.indexOf(p.s.parent) : -1;
      p.parent = p.s.moving ? pi : -1;
      if (p.parent >= 0) {
        const q = this.src[p.parent].s;
        p.mu = q.gm + p.s.gm;
        p.s.upos.sub(q.upos, p.r);
        p.v.copy(p.s.vel).sub(q.vel);
      } else {
        p.s.upos.sub(root.upos, p.r);
        p.v.copy(p.s.vel).sub(root.vel);
      }
    }
    this.fi = want.indexOf(D);
    this.compose();
    const F = this.src[this.fi];
    this.x.copy(F.P).add(inp.rel);
    this.v.copy(F.V).add(inp.relVel);
    this.record();
    this.lastRv = inp.rel.dot(inp.relVel);
    // how far ahead: a few orbits if bound, otherwise until it leaves (capped)
    const r = inp.rel.length(), v2 = inp.relVel.lengthSq();
    const en = v2 / 2 - D.gm / r;
    let T = inp.maxTime;
    if (en < 0 && D.rs === 0) {
      const a = -D.gm / (2 * en);
      T = Math.min(T, inp.orbits * 2 * Math.PI * Math.sqrt((a * a * a) / D.gm));
    } else if (D.rs > 0 && en < 0) {
      T = Math.min(T, inp.orbits * 2 * Math.PI * Math.sqrt(((r * 2) ** 3) / D.gm));
    }
    this.tEnd = T;
    this.inside.clear();
    for (const p of this.src) if (p.s.parent === D && r < p.s.soi && shipAbs(p.s) < p.s.soi) this.inside.add(p.s);
  }

  /** Absolute (root-frame) positions/velocities/accelerations of the sources from their relative states. */
  private compose(): void {
    for (const p of this.src) {
      if (p.parent < 0) { p.P.copy(p.r); p.V.copy(p.v); p.A.set(0, 0, 0); continue; }
      const q = this.src[p.parent];
      p.P.copy(q.P).add(p.r);
      p.V.copy(q.V).add(p.v);
      const rl = p.r.length();
      p.A.copy(q.A).addScaledVector(p.r, -p.mu / (rl * rl * rl));
    }
  }

  private accel(x: Vector3, v: Vector3, tau: number, out: Vector3): Vector3 {
    out.set(0, 0, 0);
    const h2 = 0.5 * tau * tau;
    for (const p of this.src) {
      const px = p.P.x + p.V.x * tau + p.A.x * h2, py = p.P.y + p.V.y * tau + p.A.y * h2, pz = p.P.z + p.V.z * tau + p.A.z * h2;
      addPointAccel(x.x - px, x.y - py, x.z - pz, p.s.gm, p.s.rs, p.s.radius, out);
    }
    const atm = this.inp.atmosphere;
    if (atm) {
      const F = this.src[this.fi];
      const rx = x.x - (F.P.x + F.V.x * tau), ry = x.y - (F.P.y + F.V.y * tau), rz = x.z - (F.P.z + F.V.z * tau);
      const h = Math.hypot(rx, ry, rz) - atm.R0;
      if (h < atm.top) {
        const rho = atm.rho0 * Math.exp(-Math.max(h, -atm.H * 5) / atm.H);
        const s = this.inp.spin;
        const wx = v.x - F.V.x - (s.y * rz - s.z * ry), wy = v.y - F.V.y - (s.z * rx - s.x * rz), wz = v.z - F.V.z - (s.x * ry - s.y * rx);
        const w = Math.hypot(wx, wy, wz);
        const k = (-0.5 * rho * w * this.inp.cdA) / this.inp.mass;
        out.x += wx * k; out.y += wy * k; out.z += wz * k;
      }
    }
    return out;
  }

  private record(): void {
    if (this.count >= this.inp.maxPoints) return;
    const F = this.src[this.fi];
    const i = this.count * 3;
    this.points[i] = this.x.x - F.P.x;
    this.points[i + 1] = this.x.y - F.P.y;
    this.points[i + 2] = this.x.z - F.P.z;
    this.count++;
  }

  private event(kind: PredictEventKind, body?: GravitySource): void {
    const F = this.src[this.fi];
    const pos = this.x.clone().sub(F.P);
    this.events.push({ kind, t: this.t, pos, r: pos.length(), speed: this.v.clone().sub(F.V).length(), body });
  }

  /** Run up to `steps` integration steps. */
  advance(steps: number): void {
    if (this.done) return;
    const inp = this.inp;
    const D = inp.frame;
    const F = this.src[this.fi];
    for (let k = 0; k < steps && !this.done; k++) {
      // step size from the nearest source's dynamical time
      let h = Infinity;
      for (const p of this.src) {
        let d = this.tmp.copy(this.x).sub(p.P).length();
        d = p.s.rs > 0 ? Math.max(d - p.s.rs, p.s.rs * 0.05) : Math.max(d, p.s.radius * 0.5);
        h = Math.min(h, Math.sqrt((d * d * d) / p.s.gm));
      }
      h *= this.eta;
      const rel = this.tmp.copy(this.x).sub(F.P);
      const rl = rel.length();
      if (inp.groundR > 0) {
        const alt = rl - inp.groundR;
        const vs = this.v.clone().sub(F.V).length();
        if (vs > 0) h = Math.min(h, Math.max(0.5, alt / vs));
      }
      if (inp.atmosphere && rl - inp.atmosphere.R0 < inp.atmosphere.top) h = Math.min(h, 2);
      h = Math.min(h, this.tEnd - this.t);
      if (h <= 0) { this.done = true; break; }
      let tau = 0;
      for (let s = 0; s < 4; s++) {
        this.x.addScaledVector(this.v, YC[s] * h);
        tau += YC[s] * h;
        if (s < 3) {
          this.accel(this.x, this.v, tau, this.a);
          this.v.addScaledVector(this.a, YD[s] * h);
        }
      }
      // the bodies move on along their orbits
      for (const p of this.src) {
        if (p.parent >= 0) propagateKepler(p.r, p.v, p.mu, h);
        else p.r.addScaledVector(p.v, h);
      }
      this.compose();
      this.t += h;
      this.record();
      // events relative to the frame body
      const r = this.x.clone().sub(F.P);
      const vr = this.v.clone().sub(F.V);
      const rv = r.dot(vr);
      const rlen = r.length();
      if (this.lastRv < 0 && rv >= 0) this.event('pe');
      else if (this.lastRv > 0 && rv <= 0) this.event('ap');
      this.lastRv = rv;
      if (D.rs > 0 && rlen < D.rs) { this.event('horizon'); this.done = true; break; }
      if (inp.groundR > 0 && rlen < inp.groundR) { this.event('impact'); this.done = true; break; }
      if (rlen > D.soi) { this.event('escape'); this.done = true; break; }
      for (const p of this.src) {
        if (p.s.parent !== D) continue;
        const d = this.tmp.copy(this.x).sub(p.P).length();
        const inS = d < p.s.soi;
        if (inS && !this.inside.has(p.s)) { this.inside.add(p.s); this.event('encounter', p.s); }
        else if (!inS) this.inside.delete(p.s);
        if (d < p.s.radius) { this.event('impact', p.s); this.done = true; break; }
      }
      if (this.count >= inp.maxPoints || this.t >= this.tEnd) this.done = true;
    }
  }
}
