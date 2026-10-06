import { Matrix4, Quaternion, Vector3 } from 'three';
import { UPos } from '../core/upos';
import { addPointAccel, C, type GravityField, type GravitySource, potential, tidalGradient } from './Gravity';
import { propagateKepler } from './Kepler';

export const G0 = 9.80665;

/** The ship: a 40 t fusion-torch runabout (fictional engine, honest mechanics). */
export interface ShipSpec {
  dryMass: number;      // kg
  fuelMax: number;      // kg of propellant
  thrust: number;       // N, main engine
  isp: number;          // s
  rcsThrust: number;    // N per axis
  wheelAccel: number;   // rad/s^2 from the reaction wheels
  maxRate: number;      // rad/s the wheels can hold
  length: number;       // m (tidal stretch is taken across it)
  cdA: number;          // m^2, drag coefficient x reference area
  noseRadius: number;   // m (re-entry heating)
  /** touch down slower than this (m/s, relative to the ground) or it is a crash */
  crashSpeed: number;
  /** thrust multiplier in "boosted" mode (which also has infinite propellant) */
  boost: number;
  /** tidal acceleration across the ship (m/s^2) that tears it apart (100 g) */
  tidalLimit: number;
  /** hull temperature (K) at which it burns up */
  maxHullTemp: number;
}

export const SHIP_SPEC: ShipSpec = {
  dryMass: 18_000, fuelMax: 22_000, thrust: 520e3, isp: 3200, rcsThrust: 6_000, wheelAccel: 0.9, maxRate: 1.0,
  length: 22, cdA: 9, noseRadius: 1.6, crashSpeed: 12, boost: 25, tidalLimit: 100 * G0, maxHullTemp: 2900,
};

/** Exponential atmosphere of the frame body. */
export interface Atmosphere {
  /** density at the reference radius (kg/m^3) */
  rho0: number;
  /** scale height (m) */
  H: number;
  /** reference radius (m) */
  R0: number;
  /** height of the top (m above R0), where drag is ignored */
  top: number;
}

export type FlightEventKind = 'crash' | 'land' | 'horizon' | 'spaghetti' | 'burnup';
export interface FlightEvent { kind: FlightEventKind; speed: number; src: GravitySource | null }

/** The ship's state and controls. */
export class ShipState {
  readonly upos = new UPos();
  /** velocity (m/s, world axes, barycentric) */
  readonly vel = new Vector3();
  readonly quat = new Quaternion();
  /** angular velocity (rad/s, world axes) */
  readonly angVel = new Vector3();
  fuel = SHIP_SPEC.fuelMax;
  /** main engine 0..1 */
  throttle = 0;
  /** RCS translation command, ship axes (x right, y up, z aft), each -1..1 */
  readonly rcs = new Vector3();
  boosted = false;
  // ---- outputs
  /** non-gravitational acceleration (thrust, drag, ground), world axes; what the crew feels */
  readonly properAccel = new Vector3();
  gForce = 0;
  /** tidal acceleration across the ship's length (m/s^2) */
  tidal = 0;
  /** air density (kg/m^3) and stagnation heat flux (W/m^2) */
  rho = 0;
  heatFlux = 0;
  hullTemp = 290;
  /** dτ/dt: ship clock rate against the universe (coordinate) clock */
  dilation = 1;
  /** proper time elapsed on board (s) */
  shipTime = 0;

  get mass(): number {
    return SHIP_SPEC.dryMass + this.fuel;
  }
}

const MAX_SOURCES = 32;
const W1 = 1 / (2 - Math.cbrt(2));
const W0 = -Math.cbrt(2) / (2 - Math.cbrt(2));
/** Yoshida (1990) fourth-order symplectic drift/kick coefficients */
const YC = [W1 / 2, (W0 + W1) / 2, (W0 + W1) / 2, W1 / 2];
const YD = [W1, W0, W1];
const SIGMA = 5.670374419e-8;

/**
 * Translation of the ship through the live gravity field, integrated in the frame of the dominant
 * body (positions relative to it stay small, so doubles are exact to millimetres) with adaptive
 * substeps of a 4th-order symplectic integrator. The other sources move linearly across a frame,
 * and pull on the frame body too (their difference is the tidal perturbation).
 */
export class FlightCore {
  readonly ship = new ShipState();
  spec: ShipSpec = SHIP_SPEC;
  /** the dominant body: the integration frame (null = free space) */
  frame: GravitySource | null = null;
  atmosphere: Atmosphere | null = null;
  /** ground radius below the ship of the frame body (m), 0 = no surface (black hole) */
  groundR = 0;
  /** frame body's angular velocity (world, rad/s) */
  readonly spin = new Vector3();
  /** body-fixed direction while landed */
  landed: { dir: Vector3; src: GravitySource } | null = null;
  /** state relative to the frame body (valid after step(), until place()) */
  readonly rel = new Vector3();
  readonly relVel = new Vector3();
  event: FlightEvent | null = null;
  /** starlight falling on the ship (W/m^2): heats the hull near a star */
  radiantFlux = 0;
  /** substeps used by the last step */
  substeps = 0;
  /** step size factor: a substep is at most this fraction of the local dynamical time sqrt(r^3/GM) */
  eta = (2 * Math.PI) / 1000;
  maxSubsteps = 4000;
  private origin = new UPos();
  // local sources (relative to the frame body at the step's start)
  private n = 0;
  private sp = new Float64Array(MAX_SOURCES * 3);
  private sw = new Float64Array(MAX_SOURCES * 3);
  private sgm = new Float64Array(MAX_SOURCES);
  private srs = new Float64Array(MAX_SOURCES);
  private srad = new Float64Array(MAX_SOURCES);
  private sframe = new Uint8Array(MAX_SOURCES);
  private thrustW = new Vector3();
  private a = new Vector3();
  private tmp = new Vector3();
  private tmp2 = new Vector3();

  constructor(readonly field: GravityField) {}

  /** Re-pick the dominant body (sphere of influence), keeping the absolute state. */
  chooseFrame(): GravitySource | null {
    if (this.landed) { this.frame = this.landed.src; return this.frame; }
    this.frame = this.field.dominantAt(this.ship.upos);
    return this.frame;
  }

  /** Snapshot the sources relative to the frame body (call at the start of a frame, before they move). */
  private begin(): void {
    const D = this.frame;
    const ship = this.ship;
    if (D) {
      ship.upos.sub(D.upos, this.rel);
      this.relVel.copy(ship.vel).sub(D.vel);
      this.origin.copy(D.upos);
    } else {
      this.rel.set(0, 0, 0);
      this.relVel.copy(ship.vel);
      this.origin.copy(ship.upos);
    }
    // the strongest sources only (pull at the ship), D first
    const list = this.field.sources;
    const cand: { s: GravitySource; a: number }[] = [];
    for (const s of list) {
      const d = s.upos.sub(this.origin, this.tmp).sub(this.rel).length();
      cand.push({ s, a: s === D ? Infinity : s.gm / Math.max(d * d, 1) });
    }
    cand.sort((x, y) => y.a - x.a);
    const aMax = cand.length > 1 ? cand[1].a : 0;
    let n = 0;
    for (const c of cand) {
      if (n >= MAX_SOURCES) break;
      if (c.s !== D && c.a < aMax * 1e-9 && c.a < 1e-9) continue;
      const s = c.s;
      const p = s.upos.sub(this.origin, this.tmp);
      this.sp[n * 3] = p.x; this.sp[n * 3 + 1] = p.y; this.sp[n * 3 + 2] = p.z;
      const fv = D ? D.vel : _zero;
      this.sw[n * 3] = s.vel.x - fv.x; this.sw[n * 3 + 1] = s.vel.y - fv.y; this.sw[n * 3 + 2] = s.vel.z - fv.z;
      if (s === D) { this.sw[n * 3] = this.sw[n * 3 + 1] = this.sw[n * 3 + 2] = 0; }
      this.sgm[n] = s.gm; this.srs[n] = s.rs; this.srad[n] = s.radius;
      // the frame body is pulled by its own group's moving sources: their pull on it is subtracted
      this.sframe[n] = D && s !== D && D.moving && s.moving && s.group === D.group ? 1 : 0;
      n++;
    }
    this.n = n;
  }

  /** Gravity + thrust + drag at relative state (r, v), time t into the step. Proper (felt) part into `felt`. */
  private accel(r: Vector3, v: Vector3, t: number, out: Vector3, felt: Vector3 | null): Vector3 {
    out.set(0, 0, 0);
    for (let i = 0; i < this.n; i++) {
      const px = this.sp[i * 3] + this.sw[i * 3] * t, py = this.sp[i * 3 + 1] + this.sw[i * 3 + 1] * t, pz = this.sp[i * 3 + 2] + this.sw[i * 3 + 2] * t;
      addPointAccel(r.x - px, r.y - py, r.z - pz, this.sgm[i], this.srs[i], this.srad[i], out);
      if (this.sframe[i]) {
        // minus the same source's pull on the frame body (at the origin)
        this.tmp2.set(0, 0, 0);
        addPointAccel(-px, -py, -pz, this.sgm[i], this.srs[i], this.srad[i], this.tmp2);
        out.sub(this.tmp2);
      }
    }
    const fx = this.thrustW.x, fy = this.thrustW.y, fz = this.thrustW.z;
    let gx = fx, gy = fy, gz = fz;
    // relativistic: thrust along the motion is divided by gamma^3, across it by gamma
    const v2 = v.lengthSq();
    if (v2 > 1e14 && (fx || fy || fz)) {
      const g2 = 1 / Math.max(1e-12, 1 - v2 / (C * C));
      const gam = Math.sqrt(g2);
      const par = (fx * v.x + fy * v.y + fz * v.z) / v2;
      const k1 = 1 / (gam * g2), k2 = 1 / gam;
      gx = par * v.x * k1 + (fx - par * v.x) * k2;
      gy = par * v.y * k1 + (fy - par * v.y) * k2;
      gz = par * v.z * k1 + (fz - par * v.z) * k2;
    }
    out.x += gx; out.y += gy; out.z += gz;
    let dx = 0, dy = 0, dz = 0;
    const atm = this.atmosphere;
    if (atm) {
      const h = r.length() - atm.R0;
      if (h < atm.top) {
        const rho = atm.rho0 * Math.exp(-Math.max(h, -atm.H * 5) / atm.H);
        // air co-rotates with the body
        const wx = v.x - (this.spin.y * r.z - this.spin.z * r.y);
        const wy = v.y - (this.spin.z * r.x - this.spin.x * r.z);
        const wz = v.z - (this.spin.x * r.y - this.spin.y * r.x);
        const w = Math.hypot(wx, wy, wz);
        const k = (-0.5 * rho * w * this.spec.cdA) / this.ship.mass;
        dx = wx * k; dy = wy * k; dz = wz * k;
        out.x += dx; out.y += dy; out.z += dz;
      }
    }
    if (felt) felt.set(gx + dx, gy + dy, gz + dz);
    return out;
  }

  /** Air density, air-relative speed at the relative state */
  private air(r: Vector3, v: Vector3): { rho: number; w: number } {
    const atm = this.atmosphere;
    if (!atm) return { rho: 0, w: 0 };
    const h = r.length() - atm.R0;
    if (h >= atm.top) return { rho: 0, w: 0 };
    const rho = atm.rho0 * Math.exp(-Math.max(h, -atm.H * 5) / atm.H);
    const air = this.tmp2.crossVectors(this.spin, r);
    return { rho, w: air.sub(v).length() };
  }

  /** The substep (s) the integrator would take at relative state (r, v). */
  stepSize(r = this.rel, v = this.relVel): number {
    let h = Infinity;
    for (let i = 0; i < this.n; i++) {
      const dx = r.x - this.sp[i * 3], dy = r.y - this.sp[i * 3 + 1], dz = r.z - this.sp[i * 3 + 2];
      let d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (this.srs[i] > 0) d = Math.max(d - this.srs[i], this.srs[i] * 0.05);
      else d = Math.max(d, this.srad[i] * 0.5);
      const t = Math.sqrt((d * d * d) / this.sgm[i]);
      if (t < h) h = t;
    }
    h *= this.eta;
    const { rho, w } = this.air(r, v);
    if (rho > 0 && w > 0) h = Math.min(h, (0.03 * this.ship.mass) / (0.5 * rho * w * this.spec.cdA));
    // near the ground: no tunnelling through it in one substep
    if (this.groundR > 0) {
      const alt = r.length() - this.groundR;
      const vs = v.length();
      if (vs > 0 && alt < vs * 2) h = Math.min(h, Math.max(0.002, (alt * 0.25) / vs));
    }
    return Math.max(h, 1e-6);
  }

  /** Estimate of the substep at the ship's current absolute state (before step()). */
  estimateStep(): number {
    this.begin();
    return this.stepSize();
  }

  /**
   * Advance `dt` seconds of universe (coordinate) time, with the sources as they are now
   * (call before they are moved to the new time), then `place()` once they have been.
   */
  step(dt: number): void {
    this.event = null;
    this.begin();
    const ship = this.ship, spec = this.spec;
    const r = this.rel, v = this.relVel;
    this.substeps = 0;
    // engine and RCS force in world axes (constant over the frame)
    const boost = ship.boosted ? spec.boost : 1;
    const mainOn = ship.throttle > 0 && (ship.fuel > 0 || ship.boosted);
    const fB = this.tmp.set(ship.rcs.x * spec.rcsThrust * boost, ship.rcs.y * spec.rcsThrust * boost, ship.rcs.z * spec.rcsThrust * boost - (mainOn ? ship.throttle * spec.thrust * boost : 0));
    const forceW = fB.applyQuaternion(ship.quat);
    const felt = new Vector3(), feltSum = new Vector3();
    let feltT = 0;
    if (this.landed) {
      // resting on the ground: lift off only when the engines beat the local gravity
      const g = this.accel(r, v, 0, this.a.set(0, 0, 0), null);
      this.thrustW.copy(forceW).divideScalar(ship.mass);
      const up = r.clone().normalize();
      const gUp = -g.dot(up);
      if (this.thrustW.dot(up) > gUp * 1.01 && dt > 0) {
        this.landed = null;
        r.addScaledVector(up, 0.3);
      } else {
        this.thrustW.set(0, 0, 0);
        ship.properAccel.copy(up).multiplyScalar(gUp);
        ship.gForce = Math.abs(gUp) / G0;
        this.finish(dt);
        return;
      }
    }
    let t = 0;
    let guard = 0;
    while (t < dt && guard++ < this.maxSubsteps * 2) {
      let h = Math.min(dt - t, this.stepSize(r, v));
      if (this.substeps >= this.maxSubsteps) h = dt - t; // over budget: finish the frame in one go
      if (dt - t - h < h * 1e-3) h = dt - t;
      this.thrustW.copy(forceW).divideScalar(ship.mass);
      // Yoshida 4: drift, kick, drift, kick, drift, kick, drift
      let tt = t;
      for (let k = 0; k < 4; k++) {
        r.addScaledVector(v, YC[k] * h);
        tt += YC[k] * h;
        if (k < 3) {
          this.accel(r, v, tt, this.a, felt);
          v.addScaledVector(this.a, YD[k] * h);
          feltSum.addScaledVector(felt, Math.abs(YD[k]) * h);
          feltT += Math.abs(YD[k]) * h;
        }
      }
      t += h;
      this.substeps++;
      if (mainOn && !ship.boosted) ship.fuel = Math.max(0, ship.fuel - (ship.throttle * spec.thrust * h) / (spec.isp * G0));
      // speed limit: nothing reaches c
      const vl = v.length();
      if (vl > 0.995 * C) v.multiplyScalar((0.995 * C) / vl);
      if (this.contact(r, v)) break;
    }
    if (feltT > 0) ship.properAccel.copy(feltSum).divideScalar(feltT);
    else ship.properAccel.set(0, 0, 0);
    ship.gForce = ship.properAccel.length() / G0;
    this.finish(dt);
  }

  /**
   * Analytic two-body ("on rails") step about the frame body: exact and cheap for time warp.
   * Perturbations and engines are off. Returns false when the frame does not allow it.
   */
  stepRails(dt: number): boolean {
    this.event = null;
    const D = this.frame;
    if (!D || D.rs > 0 || this.landed) return false;
    this.begin();
    propagateKepler(this.rel, this.relVel, D.gm, dt);
    this.substeps = 1;
    this.ship.properAccel.set(0, 0, 0);
    this.ship.gForce = 0;
    this.contact(this.rel, this.relVel);
    this.finish(dt);
    return true;
  }

  /** Ground, horizon and tidal checks after a substep; true when the flight ended (an event). */
  private contact(r: Vector3, v: Vector3): boolean {
    const D = this.frame;
    if (!D) return false;
    const rl = r.length();
    if (D.rs > 0 && rl < D.rs) {
      this.event = { kind: 'horizon', speed: v.length(), src: D };
      return true;
    }
    if (this.groundR > 0 && rl < this.groundR) {
      const surfV = this.tmp2.crossVectors(this.spin, r).negate().add(v);
      const speed = surfV.length();
      if (speed <= this.spec.crashSpeed) {
        const dir = r.clone().normalize();
        r.copy(dir).multiplyScalar(this.groundR);
        v.crossVectors(this.spin, r);
        // remember the spot in the body's own frame (it turns with the world)
        const bf = D.orient ? dir.clone().applyMatrix4(_inv.copy(D.orient).invert()) : dir.clone();
        this.landed = { dir: bf.normalize(), src: D };
        this.event = { kind: 'land', speed, src: D };
      } else {
        this.event = { kind: 'crash', speed, src: D };
      }
      return true;
    }
    return false;
  }

  /** Tidal stretch, heating, clocks. */
  private finish(dt: number): void {
    const ship = this.ship, spec = this.spec;
    const r = this.rel, v = this.relVel;
    let tidal = 0, phi = 0, bh = 1;
    for (let i = 0; i < this.n; i++) {
      const px = this.sp[i * 3] + this.sw[i * 3] * dt, py = this.sp[i * 3 + 1] + this.sw[i * 3 + 1] * dt, pz = this.sp[i * 3 + 2] + this.sw[i * 3 + 2] * dt;
      const d = Math.max(1, Math.hypot(r.x - px, r.y - py, r.z - pz));
      tidal += tidalGradient(this.sgm[i], Math.max(d, this.srad[i])) * spec.length;
      if (this.srs[i] > 0) bh *= Math.sqrt(Math.max(0, 1 - this.srs[i] / Math.max(d, this.srs[i])));
      else phi += potential(this.sgm[i], 0, Math.max(d, this.srad[i]));
    }
    ship.tidal = tidal;
    const v2 = Math.min(v.lengthSq(), C * C * 0.99999);
    ship.dilation = bh * Math.sqrt(Math.max(0, 1 + (2 * phi) / (C * C))) * Math.sqrt(1 - v2 / (C * C));
    ship.shipTime += dt * ship.dilation;
    // re-entry: Sutton–Graves stagnation heating, hull at radiative equilibrium (lagging ~6 s)
    const { rho, w } = this.landed ? { rho: 0, w: 0 } : this.air(r, v);
    ship.rho = rho;
    ship.heatFlux = 1.7415e-4 * Math.sqrt(rho / spec.noseRadius) * w * w * w;
    // (sunlight on a sphere: absorbed over its cross-section, radiated from all of it)
    const tEq = Math.pow(ship.heatFlux / (0.85 * SIGMA) + this.radiantFlux / (4 * SIGMA) + 3 ** 4, 0.25);
    ship.hullTemp += (tEq - ship.hullTemp) * (1 - Math.exp(-Math.min(dt, 1) / 6));
    if (this.event) return;
    if (tidal > spec.tidalLimit) this.event = { kind: 'spaghetti', speed: v.length(), src: this.frame };
    else if (ship.hullTemp > spec.maxHullTemp) this.event = { kind: 'burnup', speed: v.length(), src: this.frame };
  }

  /** Put the ship back in absolute coordinates once the sources have moved to the new time. */
  place(): void {
    const D = this.frame, ship = this.ship;
    if (this.landed && D) {
      const dir = this.landed.dir.clone();
      if (D.orient) dir.applyMatrix4(_rot.extractRotation(D.orient));
      this.rel.copy(dir).multiplyScalar(this.groundR || this.rel.length());
      this.relVel.crossVectors(this.spin, this.rel);
    }
    if (D) {
      ship.upos.copy(D.upos).addVec(this.rel);
      ship.vel.copy(D.vel).add(this.relVel);
    } else {
      ship.upos.copy(this.origin).addVec(this.rel);
      ship.vel.copy(this.relVel);
    }
  }

  /** Set the ship on a circular orbit of radius `r` about `src` (relative position direction `dir`, orbit normal `normal`). */
  setCircularOrbit(src: GravitySource, r: number, dir: Vector3, normal: Vector3): void {
    const d = dir.clone().normalize();
    const t = new Vector3().crossVectors(normal, d).normalize();
    if (t.lengthSq() < 0.5) t.set(-d.y, d.x, 0).normalize();
    // circular speed in the (pseudo-Newtonian) potential: v^2 = r * a(r)
    const a = src.rs > 0 ? src.gm / ((r - src.rs) * (r - src.rs)) : src.gm / (r * r);
    const vc = Math.sqrt(r * a);
    this.ship.upos.copy(src.upos).addVec(d, r);
    this.ship.vel.copy(src.vel).addScaledVector(t, vc);
    this.landed = null;
    this.frame = src;
    this.syncRel();
  }

  /** After the ship's absolute state was set directly: the relative state that place() uses. */
  syncRel(): void {
    const D = this.frame, ship = this.ship;
    if (D) {
      ship.upos.sub(D.upos, this.rel);
      this.relVel.copy(ship.vel).sub(D.vel);
    } else {
      this.origin.copy(ship.upos);
      this.rel.set(0, 0, 0);
      this.relVel.copy(ship.vel);
    }
  }
}

const _zero = new Vector3();
const _inv = new Matrix4();
const _rot = new Matrix4();
