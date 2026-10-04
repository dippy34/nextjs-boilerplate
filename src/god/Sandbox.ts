import { Matrix4, Quaternion, Vector3 } from 'three';
import { keplerState, type OrbitalElements, stateToElements } from '../astro/kepler';
import { eclToEqu, equToEcl } from '../core/frames';
import { DAY } from '../core/units';
import { Body } from '../universe/Body';
import type { SolarSystem } from '../universe/SolarSystem';
import { bodiesFromParticles, OBLATENESS, type Rider, riderMuScale, scaleMeanMotion, type SimMode, simMode } from './initial';
import { captureRadius, FLAG_BLACK_HOLE, FLAG_STAR, type PState, type SimEvent } from './NBody';
import { SimRunner, type SimRequest, type Snapshot } from './runner';

/** What an entity is drawn as. */
export type EntityKind = 'body' | 'planet' | 'star' | 'hole' | 'swarm';

/** How a spawned thing looks (and was made). */
export interface SpawnSpec {
  type: 'rocky' | 'terran' | 'ocean' | 'ice' | 'lava' | 'giant' | 'moon' | 'star' | 'hole' | 'swarm';
  seed: number;
  /** stars: effective temperature (K) and luminosity (Suns) */
  teff?: number;
  lum?: number;
  rings?: boolean;
}

export interface SpinState { ax: number; ay: number; az: number; rate: number; locked: boolean; base: number[] }

/** One thing in the sandbox, as plain data (undo, save files). */
export interface EntityRecord {
  id: number;
  kind: EntityKind;
  name: string;
  mode: SimMode;
  gm: number;
  radius: number;
  flags: number;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  parent?: number;
  /** riders: factor on the Kepler G·M that keeps the ephemeris' mean motion */
  muScale?: number;
  spin: SpinState;
  spawn?: SpawnSpec;
  /** Kepler mode: an orbit of its own about `parent` (elements in the ecliptic J2000 frame) */
  orbit?: KeplerOrbit;
  /** the spin was edited (Kepler mode otherwise keeps the real rotation) */
  customSpin?: boolean;
  phys?: PhysProps;
}

/** An analytic orbit: elements about a parent entity, ecliptic J2000 frame. */
export interface KeplerOrbit { parent: number; el: OrbitalElements }

/** Editable physical properties beyond mass and radius. */
export interface PhysProps {
  /** polar radius (m); the equatorial one is `radius` scaled by the shape */
  rpol?: number;
  albedo?: number;
  /** greenhouse warming (K) */
  greenhouse?: number;
  /** surface pressure (bar) and mean molar mass (kg/mol) of the atmosphere */
  pressure?: number;
  molar?: number;
  /** black holes: dimensionless spin */
  spin?: number;
}

export type SimKind = 'kepler' | 'nbody';

export interface WorldState {
  format: 'space-explorer-god';
  version: 1;
  jd: number;
  nextId: number;
  /** analytic Kepler orbits (default) or the N-body simulation */
  mode?: SimKind;
  entities: EntityRecord[];
}

/** A thing in the running sandbox. */
export interface Entity {
  id: number;
  kind: EntityKind;
  name: string;
  mode: SimMode;
  gm: number;
  radius: number;
  flags: number;
  body: Body | null;
  spawn?: SpawnSpec;
  rider?: Rider;
  muScale?: number;
  orbit?: KeplerOrbit;
  customSpin?: boolean;
  phys?: PhysProps;
  /** current state (barycentric, m and m/s), written every frame */
  pos: Vector3;
  vel: Vector3;
  spin: { axis: Vector3; rate: number; locked: boolean; base: Matrix4; jdBase: number };
}

/** Effects for the renderer, from the simulation's events. */
export interface SandboxEffect { event: SimEvent; jd: number; survivor: Entity | null; victim: Entity | null; victimRadius: number }

/** Bodies the renderers draw: they read Body.pos/vel/upos/orientation, which the sandbox writes. */
export interface SandboxHooks {
  /** a spawned entity needs its drawable (planet, star, hole) */
  create?(e: Entity): void;
  /** a spawned entity is gone */
  destroy?(e: Entity): void;
  /** an entity's look changed (mass, radius) */
  changed?(e: Entity): void;
}

interface Baseline { gm: number; systemGm: number; radii: [number, number, number]; radius: number; valid: boolean; albedo: number }

const ECLIPTIC_POLE = new Vector3(0, -Math.sin((23.4392911 * Math.PI) / 180), Math.cos((23.4392911 * Math.PI) / 180));
const UNDO_DEPTH = 40;
const SAVE_KEY = 'space-explorer-god-universe';
/** first id given to spawned things (Solar System bodies keep their NAIF ids) */
const SPAWN_ID0 = 50_000_000;

/**
 * God mode: the universe follows the real ephemeris until something is changed; from then on an
 * N-body simulation (src/god/NBody.ts, in a Web Worker) started from the ephemeris' state moves
 * everything. Edits (mass, velocity, spin, delete, spawn) go through `edit()`, which records an
 * undo snapshot and restarts the simulation from the edited state. The display interpolates
 * (cubic Hermite) between the worker's snapshots, about one per displayed frame.
 *
 * Every frame the sandbox writes Body.pos/vel/upos/orientation (and gm, radius, valid), so the
 * renderers, the camera and the ship's gravity see the simulated universe; spawned bodies are
 * appended to `system.bodies` (deleted ones are `valid = false` with `gm = 0`).
 */
export class Sandbox {
  active = false;
  /** Kepler orbits (each edited body on its own exact two-body orbit; the rest on the ephemeris) or N-body */
  mode: SimKind = 'kepler';
  readonly entities = new Map<number, Entity>();
  /** sandbox epoch: simulation time 0 is this JD */
  jd0 = 0;
  /** JD shown this frame */
  jd = 0;
  /** the simulation can't keep up with the requested rate */
  lagging = false;
  /** effects waiting for the renderer */
  effects: SandboxEffect[] = [];
  /** massive steps per second of real time (statistics) */
  stepsPerSecond = 0;
  hooks: SandboxHooks = {};
  private nextId = SPAWN_ID0;
  private gen = 0;
  private queue: Snapshot[] = [];
  private worker: Worker | null = null;
  private inline: SimRunner | null = null;
  private undoStack: WorldState[] = [];
  private baseline = new Map<Body, Baseline>();
  private dir = 1;
  private particles = new Map<number, { gm: number; x: number; y: number; z: number; vx: number; vy: number; vz: number }>();
  private states = new Map<number, { x: number; y: number; z: number; vx: number; vy: number; vz: number }>();
  private riders: Rider[] = [];
  private stepCount = 0;
  private stepClock = 0;
  private needReseed = false;
  private primaryCache: Map<Entity, Entity | null> | null = null;

  constructor(readonly system: SolarSystem, useWorker = typeof Worker !== 'undefined') {
    if (useWorker) {
      try {
        this.worker = new Worker(new URL('./nbody.worker.ts', import.meta.url), { type: 'module', name: 'god-nbody' });
        this.worker.onmessage = (e: MessageEvent<Snapshot>) => this.receive(e.data);
        this.worker.onerror = (e) => { console.warn('god worker failed, simulating on the main thread', e.message); this.worker = null; this.inline = new SimRunner(); this.reseed(); };
      } catch { this.worker = null; }
    }
    if (!this.worker) this.inline = new SimRunner();
  }

  // ---------------------------------------------------------------- lifecycle

  /** Switch from the ephemeris to the simulation (the bodies must hold the ephemeris' state for `jd`). */
  start(jd: number): void {
    if (this.active) return;
    this.active = true;
    this.mode = 'kepler';
    this.jd = jd;
    this.entities.clear();
    this.baseline.clear();
    for (const b of this.system.bodies) {
      this.baseline.set(b, { gm: b.gm, systemGm: b.systemGm, radii: [...b.radii], radius: b.radius, valid: b.valid, albedo: b.albedo });
      if (!b.valid) continue;
      const e: Entity = {
        id: b.id, kind: 'body', name: b.name, mode: simMode(b), gm: b.gm, radius: b.radius, flags: b.kind === 'star' ? FLAG_STAR : 0,
        body: b, pos: b.pos.clone(), vel: b.vel.clone(), spin: this.initialSpin(b, jd),
      };
      if (e.mode === 'rider' && b.parent) {
        const el = stateToElements(b.pos.clone().sub(b.parent.pos), b.vel.clone().sub(b.parent.vel), b.parent.gm + b.gm, jd);
        e.muScale = riderMuScale(this.system, b, el, jd);
      }
      this.entities.set(b.id, e);
    }
    this.undoStack = [];
    this.applyState(this.capture());
  }

  /** Back to the real universe: the ephemeris moves everything again. */
  reset(): void {
    if (!this.active) return;
    for (const e of [...this.entities.values()]) if (e.kind !== 'body') this.destroyEntity(e);
    for (const [b, base] of this.baseline) {
      b.gm = base.gm; b.systemGm = base.systemGm; b.radii = [...base.radii]; b.radius = base.radius; b.valid = base.valid; b.albedo = base.albedo;
    }
    // spawned bodies leave the system
    for (let i = this.system.bodies.length - 1; i >= 0; i--) if (!this.baseline.has(this.system.bodies[i])) this.system.bodies.splice(i, 1);
    this.entities.clear();
    this.queue = [];
    this.undoStack = [];
    this.active = false;
    this.mode = 'kepler';
    this.order = null;
    this.gen++;
  }

  dispose(): void {
    this.worker?.terminate();
  }

  // ---------------------------------------------------------------- per frame

  /**
   * Move everything to (as near as the simulation has reached) `jd`. `rate` is simulated seconds
   * per real second (negative backwards), `paused` stops time. Returns the JD shown.
   */
  update(jdWanted: number, rate: number, paused: boolean, dtReal: number): number {
    if (!this.active) { this.jd = jdWanted; return jdWanted; }
    this.primaryCache = null;
    this.lagging = false;
    if (this.mode === 'kepler') {
      this.keplerUpdate(jdWanted, paused ? 0 : rate < 0 ? -1 : 1);
      return jdWanted;
    }
    if (this.inline) for (const s of this.inline.pump(paused ? 2 : 6)) this.receive(s);
    if (this.needReseed) { this.needReseed = false; this.reseed(); }
    const dir = rate < 0 ? -1 : 1;
    if (!paused && dir !== this.dir && this.queue.length) {
      // time turned round: continue from what is shown, the other way
      this.dir = dir;
      this.reseed();
    }
    this.dir = dir;
    let t = (jdWanted - this.jd0) * DAY;
    const q = this.queue;
    this.lagging = false;
    if (q.length) {
      const first = q[0].t, last = q[q.length - 1].t;
      const ahead = (a: number, b: number) => (a - b) * this.dir > 0;
      if (ahead(t, last)) { t = last; this.lagging = !paused && Math.abs(rate) > 0; }
      if (ahead(first, t)) t = first;
      // drop what is behind (keep one snapshot at or before t)
      while (q.length > 2 && !ahead(q[1].t, t)) q.shift();
      this.interpolate(t);
    }
    this.jd = this.jd0 + t / DAY;
    this.writeBodies();
    // ask for the next stretch: a little ahead of the clock, a snapshot per frame or so
    const look = paused ? 0 : rate * 0.35;
    const msg: SimRequest = { type: 'goal', gen: this.gen, goal: t + look, every: Math.max(Math.abs(rate) / 60, 1e-3) };
    this.post(msg);
    this.stepClock += dtReal;
    if (this.stepClock > 1) { this.stepsPerSecond = this.stepCount / this.stepClock; this.stepCount = 0; this.stepClock = 0; }
    return this.jd;
  }

  private order: Entity[] | null = null;
  private ephP = new Map<Entity, Vector3>();
  private ephV = new Map<Entity, Vector3>();
  private kp = new Vector3();
  private kv = new Vector3();

  /** The parent an entity's orbit is about in Kepler mode. */
  parentId(e: Entity): number | null {
    if (e.orbit) return e.orbit.parent;
    const bp = e.body?.parent;
    if (bp && this.entities.has(bp.id)) return bp.id;
    return this.primaryOf(e)?.id ?? null;
  }

  /** Parents before children. */
  private hierarchy(): Entity[] {
    const depth = new Map<Entity, number>();
    const d = (e: Entity, guard = 0): number => {
      const k = depth.get(e);
      if (k !== undefined) return k;
      const pid = e.orbit?.parent ?? e.body?.parent?.id;
      const p = pid !== undefined ? this.entities.get(pid) : undefined;
      const v = p && p !== e && guard < 20 ? d(p, guard + 1) + 1 : 0;
      depth.set(e, v);
      return v;
    };
    return [...this.entities.values()].sort((a, b) => d(a) - d(b));
  }

  /**
   * Kepler mode: the ephemeris for what was not changed, exact two-body orbits for what was.
   * A body that was not changed rides along with its parent's change of place (the Moon stays
   * with a moved Earth).
   */
  private keplerUpdate(jd: number, dir: number): void {
    this.jd = jd;
    this.system.update(jd, dir);
    this.order ??= this.hierarchy();
    const { kp, kv } = this;
    for (const e of this.order) {
      const b = e.body;
      if (b) {
        let ep = this.ephP.get(e), ev = this.ephV.get(e);
        if (!ep || !ev) { ep = new Vector3(); ev = new Vector3(); this.ephP.set(e, ep); this.ephV.set(e, ev); }
        ep.copy(b.pos); ev.copy(b.vel);
      }
      if (e.orbit) {
        const p = this.entities.get(e.orbit.parent);
        keplerState(e.orbit.el, jd, kp, kv);
        eclToEqu(kp); eclToEqu(kv);
        e.pos.copy(kp); e.vel.copy(kv);
        if (p) { e.pos.add(p.pos); e.vel.add(p.vel); }
      } else if (b) {
        e.pos.copy(b.pos); e.vel.copy(b.vel);
        const pe = b.parent ? this.entities.get(b.parent.id) : undefined;
        const pp = pe && this.ephP.get(pe), pv = pe && this.ephV.get(pe);
        if (pe && pp && pv) { e.pos.add(pe.pos).sub(pp); e.vel.add(pe.vel).sub(pv); }
      }
      if (b) {
        b.pos.copy(e.pos); b.vel.copy(e.vel); b.upos.set(e.pos.x, e.pos.y, e.pos.z);
        if (e.orbit) b.valid = true;
        if (e.customSpin || !b.rotation && e.kind !== 'body') this.orient(e, b.orientation);
      }
    }
    // deleted bodies stay deleted (the ephemeris would bring them back)
    for (const [b] of this.baseline) if (!this.entities.has(b.id)) { b.valid = false; b.gm = 0; }
  }

  /** Osculating elements (ecliptic) of a state about a parent entity. */
  osculating(pos: Vector3, vel: Vector3, gm: number, parent: Entity | null, jd = this.jd): KeplerOrbit | null {
    if (!parent) return null;
    const r = equToEcl(pos.clone().sub(parent.pos)), v = equToEcl(vel.clone().sub(parent.vel));
    if (r.lengthSq() === 0) return null;
    // a body with no sideways speed has no orbit plane: give it a whisker of one
    const h = r.clone().cross(v);
    if (h.lengthSq() < 1e-12 * r.lengthSq() * v.lengthSq() + 1e-30) {
      const side = new Vector3(0, 0, 1).cross(r).normalize();
      if (side.lengthSq() < 0.5) side.set(1, 0, 0);
      v.addScaledVector(side, 1e-3 * Math.sqrt((parent.gm + gm) / r.length()));
    }
    return { parent: parent.id, el: stateToElements(r, v, parent.gm + gm, jd) };
  }

  /** Current orbit of an entity (its own, or the osculating one about its parent). */
  orbitOf(e: Entity): KeplerOrbit | null {
    if (e.orbit) return { parent: e.orbit.parent, el: { ...e.orbit.el } };
    const pid = this.parentId(e);
    return this.osculating(e.pos, e.vel, e.gm, pid !== null ? this.entities.get(pid) ?? null : null);
  }

  private post(m: SimRequest): void {
    if (this.worker) this.worker.postMessage(m);
    else this.inline?.handle(m);
  }

  private receive(s: Snapshot): void {
    if (s.gen !== this.gen || !this.active) return;
    this.stepCount += s.steps;
    if (s.events.length) this.applyEvents(s);
    const q = this.queue;
    // (a snapshot for the same time replaces the local copy)
    if (q.length && q[q.length - 1].t === s.t) q[q.length - 1] = s;
    else q.push(s);
    if (q.length > 240) q.splice(0, q.length - 240);
  }

  /** Hermite interpolation of the particles between the two snapshots around t. */
  private interpolate(t: number): void {
    const q = this.queue;
    let a = q[0], b = q[0];
    for (let i = 0; i + 1 < q.length; i++) {
      if ((q[i + 1].t - t) * this.dir >= 0) { a = q[i]; b = q[i + 1]; break; }
      a = b = q[i + 1];
    }
    const h = b.t - a.t;
    const s = h !== 0 ? (t - a.t) / h : 0;
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    // derivatives (per unit s)
    const d00 = 6 * s2 - 6 * s, d10 = 3 * s2 - 4 * s + 1, d01 = -6 * s2 + 6 * s, d11 = 3 * s2 - 2 * s;
    const bIndex = new Map<number, number>();
    b.ids.forEach((id, i) => bIndex.set(id, i));
    this.particles.clear();
    const put = (id: number, gm: number, A: Float64Array, ia: number, B: Float64Array | null, ib: number) => {
      const o = { gm, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
      if (!B || h === 0) {
        // no partner: extrapolate along the velocity
        const dt = t - (B === null ? a.t : a.t);
        o.x = A[ia] + A[ia + 3] * dt; o.y = A[ia + 1] + A[ia + 4] * dt; o.z = A[ia + 2] + A[ia + 5] * dt;
        o.vx = A[ia + 3]; o.vy = A[ia + 4]; o.vz = A[ia + 5];
      } else {
        for (let c = 0; c < 3; c++) {
          const p0 = A[ia + c], v0 = A[ia + 3 + c], p1 = B[ib + c], v1 = B[ib + 3 + c];
          const p = h00 * p0 + h10 * h * v0 + h01 * p1 + h11 * h * v1;
          const v = (d00 * p0 + d10 * h * v0 + d01 * p1 + d11 * h * v1) / h;
          if (c === 0) { o.x = p; o.vx = v; } else if (c === 1) { o.y = p; o.vy = v; } else { o.z = p; o.vz = v; }
        }
      }
      this.particles.set(id, o);
    };
    a.ids.forEach((id, i) => {
      const j = bIndex.get(id);
      put(id, j !== undefined ? b.gm[j] : a.gm[i], a.xv, i * 6, j !== undefined ? b.xv : null, (j ?? 0) * 6);
    });
    const tb = new Map<number, number>();
    b.tids.forEach((id, i) => tb.set(id, i));
    a.tids.forEach((id, i) => {
      const j = tb.get(id);
      put(id, 0, a.txv, i * 6, j !== undefined ? b.txv : null, (j ?? 0) * 6);
    });
  }

  /** Write the interpolated state into the entities and their bodies. */
  private writeBodies(): void {
    bodiesFromParticles(this.particles, this.riders, this.jd, this.states);
    for (const e of this.entities.values()) {
      const s = this.states.get(e.id);
      if (s) { e.pos.set(s.x, s.y, s.z); e.vel.set(s.vx, s.vy, s.vz); }
      const b = e.body;
      if (!b) continue;
      b.pos.copy(e.pos);
      b.vel.copy(e.vel);
      b.upos.set(e.pos.x, e.pos.y, e.pos.z);
      this.orient(e, b.orientation);
    }
  }

  /** Orientation (body-fixed -> ICRF) of an entity now. */
  orient(e: Entity, out: Matrix4): Matrix4 {
    const sp = e.spin;
    const p = this.primaryOf(e);
    if (sp.locked && p) {
      // synchronous rotation: prime meridian towards the primary, pole along the orbit normal
      const r = new Vector3().subVectors(p.pos, e.pos).normalize();
      const rv = new Vector3().subVectors(e.vel, p.vel);
      const n = new Vector3().crossVectors(r, rv).normalize().negate();
      if (n.lengthSq() < 0.5) n.copy(sp.axis);
      const y = new Vector3().crossVectors(n, r).normalize();
      const x = new Vector3().crossVectors(y, n);
      return out.makeBasis(x, y, n);
    }
    const ang = sp.rate * (this.jd - sp.jdBase) * DAY;
    return out.makeRotationAxis(sp.axis, ang % (2 * Math.PI)).multiply(sp.base);
  }

  private initialSpin(b: Body, jd: number): Entity['spin'] {
    const base = b.orientation.clone();
    const e = base.elements;
    const axis = new Vector3(e[8], e[9], e[10]).normalize();
    if (b.rotation) return { axis, rate: (b.rotation.pm[1] * Math.PI) / 180 / DAY, locked: false, base, jdBase: jd };
    if (b.kind === 'moon' && b.parent) return { axis, rate: 0, locked: true, base, jdBase: jd };
    // uniform spin about the ecliptic pole (SolarSystem.updateOrientation)
    const hours = b.meta.rotPeriodHours as number | undefined;
    const periodDays = hours ? hours / 24 : 1;
    return { axis: ECLIPTIC_POLE.clone(), rate: (2 * Math.PI) / (periodDays * DAY), locked: false, base, jdBase: jd };
  }

  // ---------------------------------------------------------------- hierarchy

  /** The body an entity orbits: the lightest heavier body whose sphere of influence holds it. */
  primaryOf(e: Entity): Entity | null {
    if (!this.primaryCache) this.primaryCache = this.computePrimaries();
    if (this.primaryCache.has(e)) return this.primaryCache.get(e) ?? null;
    const p = this.findPrimary(e, this.massiveList(), this.primaryCache);
    this.primaryCache.set(e, p);
    return p;
  }

  private massiveList(): Entity[] {
    return [...this.entities.values()].filter((x) => x.mode === 'massive' && x.gm > 0).sort((a, b) => b.gm - a.gm);
  }

  private soi = new Map<Entity, number>();
  private computePrimaries(): Map<Entity, Entity | null> {
    const out = new Map<Entity, Entity | null>();
    const list = this.massiveList();
    this.soi.clear();
    for (const e of list) {
      const p = this.findPrimary(e, list, out);
      out.set(e, p);
      this.soi.set(e, p ? e.pos.distanceTo(p.pos) * Math.pow(e.gm / p.gm, 0.4) : Infinity);
    }
    return out;
  }

  private findPrimary(e: Entity, list: Entity[], known: Map<Entity, Entity | null>): Entity | null {
    let best: Entity | null = null, bestSoi = Infinity;
    for (const k of list) {
      if (k === e || k.gm <= e.gm) continue;
      if (!known.has(k) && k !== list[0]) continue;
      const soi = this.soi.get(k) ?? Infinity;
      if (e.pos.distanceTo(k.pos) < soi && soi <= bestSoi) { best = k; bestSoi = soi; }
    }
    return best ?? (list[0] && list[0] !== e && list[0].gm > e.gm ? list[0] : null);
  }

  // ---------------------------------------------------------------- state

  /** The current universe as plain data. */
  capture(): WorldState {
    const ents: EntityRecord[] = [];
    for (const e of this.entities.values()) {
      const base = this.orient(e, new Matrix4());
      ents.push({
        id: e.id, kind: e.kind, name: e.name, mode: e.mode, gm: e.gm, radius: e.radius, flags: e.flags,
        x: e.pos.x, y: e.pos.y, z: e.pos.z, vx: e.vel.x, vy: e.vel.y, vz: e.vel.z,
        parent: e.mode === 'rider' ? e.rider?.parent ?? e.body?.parent?.id : undefined, muScale: e.muScale,
        spin: { ax: e.spin.axis.x, ay: e.spin.axis.y, az: e.spin.axis.z, rate: e.spin.rate, locked: e.spin.locked, base: [...base.elements] },
        spawn: e.spawn ? { ...e.spawn } : undefined,
        orbit: e.orbit ? { parent: e.orbit.parent, el: { ...e.orbit.el } } : undefined,
        customSpin: e.customSpin, phys: e.phys ? { ...e.phys } : undefined,
      });
    }
    return { format: 'space-explorer-god', version: 1, jd: this.jd, nextId: this.nextId, mode: this.mode, entities: ents };
  }

  /**
   * Make `st` the running universe: entities created/removed to match, bodies updated, the
   * simulation restarted from it.
   */
  applyState(st: WorldState): void {
    this.jd = st.jd;
    this.jd0 = st.jd;
    this.nextId = Math.max(this.nextId, st.nextId);
    const want = new Map(st.entities.map((r) => [r.id, r]));
    // remove what is gone
    for (const e of [...this.entities.values()]) {
      if (want.has(e.id)) continue;
      if (e.kind === 'body') this.killBody(e);
      else this.destroyEntity(e);
      this.entities.delete(e.id);
    }
    // Solar System bodies missing from the state (a save made after deleting them)
    for (const [b] of this.baseline) if (!want.has(b.id) && b.valid) { b.valid = false; b.gm = 0; }
    for (const r of st.entities) {
      let e = this.entities.get(r.id);
      if (!e) {
        const body = r.kind === 'body' ? this.system.byId.get(r.id) ?? null : null;
        if (r.kind === 'body' && !body) continue;
        e = { id: r.id, kind: r.kind, name: r.name, mode: r.mode, gm: r.gm, radius: r.radius, flags: r.flags, body, spawn: r.spawn,
          pos: new Vector3(), vel: new Vector3(), spin: { axis: new Vector3(0, 0, 1), rate: 0, locked: false, base: new Matrix4(), jdBase: st.jd } };
        this.entities.set(r.id, e);
        if (r.kind !== 'body') this.createEntity(e);
      }
      e.mode = r.mode; e.gm = r.gm; e.radius = r.radius; e.flags = r.flags; e.name = r.name;
      e.orbit = r.orbit ? { parent: r.orbit.parent, el: { ...r.orbit.el } } : undefined;
      e.customSpin = r.customSpin; e.phys = r.phys ? { ...r.phys } : undefined;
      e.pos.set(r.x, r.y, r.z); e.vel.set(r.vx, r.vy, r.vz);
      e.spin.axis.set(r.spin.ax, r.spin.ay, r.spin.az).normalize();
      e.spin.rate = r.spin.rate; e.spin.locked = r.spin.locked; e.spin.base.fromArray(r.spin.base); e.spin.jdBase = st.jd;
      if (e.body) {
        const b = e.body;
        b.valid = true;
        const base = this.baseline.get(b);
        b.gm = r.gm;
        if (base) b.systemGm = base.systemGm * (base.gm > 0 ? r.gm / base.gm : 1);
        if (base) {
          // shape: the original axes scaled to the radius, the polar one as edited
          const k = r.radius / base.radius;
          const rp = r.phys?.rpol;
          b.radii = rp ? [base.radii[0] * k, base.radii[1] * k, rp] : [base.radii[0] * k, base.radii[1] * k, base.radii[2] * k];
          if (rp) { const s = r.radius / Math.cbrt(b.radii[0] * b.radii[1] * rp); b.radii = [b.radii[0] * s, b.radii[1] * s, rp * s]; }
          b.radius = r.radius;
          b.albedo = r.phys?.albedo ?? b.albedo;
        } else if (Math.abs(b.radius - r.radius) > 1e-6 * r.radius) {
          const k = r.radius / b.radius;
          b.radii = [b.radii[0] * k, b.radii[1] * k, b.radii[2] * k];
          b.radius = r.radius;
        }
      }
      e.rider = undefined;
      if (r.mode === 'rider' && r.parent !== undefined) {
        const p = want.get(r.parent);
        if (p && p.mode !== 'rider') {
          const el = stateToElements(new Vector3(r.x - p.x, r.y - p.y, r.z - p.z), new Vector3(r.vx - p.vx, r.vy - p.vy, r.vz - p.vz), p.gm + r.gm, st.jd);
          // the ephemeris' mean motion, while it still orbits the planet it started with
          e.muScale = r.muScale;
          if (r.muScale && e.body?.parent?.id === r.parent) scaleMeanMotion(el, r.muScale, st.jd);
          e.rider = { id: r.id, parent: r.parent, gm: r.gm, el };
        } else e.mode = 'test';
      }
      this.hooks.changed?.(e);
    }
    this.mode = st.mode ?? 'kepler';
    this.order = null;
    this.primaryCache = null;
    if (this.mode === 'nbody') this.sendState();
    else { this.gen++; this.queue = []; this.keplerUpdate(this.jd, 0); }
  }

  /** Restart the simulation from the entities as they are (no undo step). */
  reseed(): void {
    if (!this.active) return;
    this.applyState(this.capture());
  }

  private sendState(): void {
    const massive: PState[] = [], tests: PState[] = [];
    const byId = new Map<number, PState>();
    this.riders = [];
    for (const e of this.entities.values()) {
      if (e.mode === 'rider') continue;
      const s: PState = { id: e.id, gm: e.mode === 'massive' ? e.gm : 0, r: e.flags & FLAG_BLACK_HOLE ? captureRadius(e.gm) : e.radius, flags: e.flags,
        x: e.pos.x, y: e.pos.y, z: e.pos.z, vx: e.vel.x, vy: e.vel.y, vz: e.vel.z };
      const ob = OBLATENESS[e.id];
      if (ob && e.kind === 'body' && e.mode === 'massive') Object.assign(s, { j2: ob[0], req: ob[1] * (e.radius / (this.baseline.get(e.body!)?.radius || e.radius)), px: e.spin.axis.x, py: e.spin.axis.y, pz: e.spin.axis.z });
      (e.mode === 'massive' ? massive : tests).push(s);
      byId.set(e.id, s);
    }
    // riders: their mass joins their planet's particle, which sits at the barycentre
    for (const e of this.entities.values()) {
      if (e.mode !== 'rider' || !e.rider) continue;
      this.riders.push(e.rider);
      const s = byId.get(e.rider.parent);
      if (!s || s.gm <= 0) continue;
      const M = s.gm + e.gm;
      s.x = (s.gm * s.x + e.gm * e.pos.x) / M; s.y = (s.gm * s.y + e.gm * e.pos.y) / M; s.z = (s.gm * s.z + e.gm * e.pos.z) / M;
      s.vx = (s.gm * s.vx + e.gm * e.vel.x) / M; s.vy = (s.gm * s.vy + e.gm * e.vel.y) / M; s.vz = (s.gm * s.vz + e.gm * e.vel.z) / M;
      s.gm = M;
    }
    this.gen++;
    this.queue = [];
    const msg: SimRequest = { type: 'state', gen: this.gen, t: 0, massive, tests };
    // shown at once (the worker's own copy replaces it)
    this.queue.push(localSnapshot(this.gen, massive, tests));
    this.post(msg);
    this.particles.clear();
    this.interpolate(0);
    this.writeBodies();
  }

  // ---------------------------------------------------------------- events

  private applyEvents(s: Snapshot): void {
    for (const ev of s.events) {
      const surv = this.entities.get(ev.survivor) ?? null, vic = this.entities.get(ev.victim) ?? null;
      const victimRadius = vic?.radius ?? 0;
      if (surv && ev.kind !== 'impact') {
        // the particle's mass includes its riders
        const i = s.ids.indexOf(ev.survivor);
        const riderGm = this.riders.filter((r) => r.parent === surv.id).reduce((a, r) => a + r.gm, 0);
        if (i >= 0) {
          surv.gm = s.gm[i] - riderGm;
          if (!(surv.flags & FLAG_BLACK_HOLE) && ev.kind === 'merge') surv.radius = s.r[i];
        }
        if (surv.body) {
          surv.body.gm = surv.gm;
          if (Math.abs(surv.body.radius - surv.radius) > 1) {
            const k = surv.radius / surv.body.radius;
            surv.body.radii = [surv.body.radii[0] * k, surv.body.radii[1] * k, surv.body.radii[2] * k];
            surv.body.radius = surv.radius;
          }
        }
        this.hooks.changed?.(surv);
      }
      if (vic) {
        if (this.riders.some((r) => r.parent === vic.id)) {
          // its moons now follow the survivor (or fly free)
          for (const e of this.entities.values()) if (e.rider?.parent === vic.id) { e.mode = surv ? 'rider' : 'test'; if (e.body && surv?.body) e.body.parent = surv.body; e.rider.parent = surv?.id ?? -1; }
          this.needReseed = true;
        }
        if (vic.kind === 'body') this.killBody(vic);
        else this.destroyEntity(vic);
        this.entities.delete(vic.id);
      }
      this.effects.push({ event: ev, jd: this.jd0 + ev.t / DAY, survivor: surv, victim: vic, victimRadius });
    }
    if (this.needReseed) {
      // riders re-derive their orbits about their new primary from their last positions
      for (const e of this.entities.values()) if (e.mode === 'rider' && e.rider && e.rider.parent >= 0) e.rider = { ...e.rider };
    }
  }

  private killBody(e: Entity): void {
    if (e.body) { e.body.valid = false; e.body.gm = 0; }
  }

  private createEntity(e: Entity): void {
    if (e.kind === 'planet' || e.kind === 'star') {
      const kind = e.kind === 'star' ? 'star' : e.spawn?.type === 'moon' ? 'moon' : 'planet';
      e.body = makeSpawnBody(e.id, e.name, kind, e.gm, e.radius);
      if (e.kind === 'star') e.body.teff = e.spawn?.teff ?? 5772;
      this.system.bodies.push(e.body);
      this.system.byId.set(e.id, e.body);
    }
    this.hooks.create?.(e);
  }

  private destroyEntity(e: Entity): void {
    this.hooks.destroy?.(e);
    if (e.body) {
      const i = this.system.bodies.indexOf(e.body);
      if (i >= 0) this.system.bodies.splice(i, 1);
      if (this.system.byId.get(e.id) === e.body) this.system.byId.delete(e.id);
      e.body.valid = false;
      e.body.gm = 0;
    }
  }

  // ---------------------------------------------------------------- edits

  /** Apply a change: undo snapshot, change, restart the simulation from it. */
  private batchDepth = 0;
  private batchPushed = false;
  /** Several edits as one undo step (a console loop). */
  batch(fn: () => void): void {
    this.batchDepth++;
    try { fn(); } finally { if (--this.batchDepth === 0) this.batchPushed = false; }
  }

  edit(fn: (st: WorldState) => void, jdNow?: number): void {
    if (!this.active) this.start(jdNow ?? this.jd);
    const before = this.capture();
    if (!(this.batchDepth > 0 && this.batchPushed)) {
      this.undoStack.push(before);
      if (this.undoStack.length > UNDO_DEPTH) this.undoStack.shift();
      if (this.batchDepth > 0) this.batchPushed = true;
    }
    const st = structuredClone(before);
    fn(st);
    this.applyState(st);
  }

  get canUndo(): boolean { return this.undoStack.length > 0; }

  undo(): boolean {
    const st = this.undoStack.pop();
    if (!st) return false;
    this.applyState(st);
    return true;
  }

  entityOf(id: number): Entity | null { return this.entities.get(id) ?? null; }

  /** A Solar System body's real mass (G·M) and radius, before any edit. */
  baselineOf(b: Body): { gm: number; radius: number } | null {
    const x = this.baseline.get(b);
    return x ? { gm: x.gm, radius: x.radius } : null;
  }

  /** Make a test particle or rider a full N-body participant (it is being edited). */
  static promote(r: EntityRecord): void {
    if (r.mode !== 'massive') { r.mode = 'massive'; r.parent = undefined; }
  }

  /** Kepler mode: give a record the orbit its current state has about `parentId` (or its usual parent). */
  fitOrbit(r: EntityRecord, parentId?: number | null, always = false): void {
    if (this.mode !== 'kepler' && !always) return;
    const e = this.entities.get(r.id);
    const pid = parentId ?? r.orbit?.parent ?? (e ? this.parentId(e) : null);
    const p = pid !== null && pid !== undefined ? this.entities.get(pid) ?? null : null;
    const o = this.osculating(new Vector3(r.x, r.y, r.z), new Vector3(r.vx, r.vy, r.vz), r.gm, p);
    r.orbit = o ?? undefined;
  }

  /** Mass (and, in the same step, radius and polar radius). */
  setMass(id: number, gm: number, radius?: number, rpol?: number): void {
    this.edit((st) => {
      const r = st.entities.find((x) => x.id === id);
      if (!r) return;
      if (radius !== undefined) {
        // the shape scales with the size unless the polar radius is given
        const k = radius / r.radius;
        if (r.phys?.rpol && rpol === undefined) r.phys.rpol *= k;
        r.radius = Math.max(1, radius);
      }
      if (rpol !== undefined) r.phys = { ...r.phys, rpol };
      if (Math.abs(gm - r.gm) <= 1e-12 * r.gm) return;
      Sandbox.promote(r);
      const old = r.gm;
      r.gm = Math.max(gm, 1);
      if (this.mode !== 'kepler') return;
      // Kepler III: everything orbiting it keeps its orbit's shape and goes round at the new rate
      for (const c of st.entities) {
        const e = this.entities.get(c.id);
        if (!e || c.id === id || (c.orbit?.parent ?? (e ? this.parentId(e) : null)) !== id) continue;
        if (!c.orbit) this.fitOrbit(c, id);
        if (!c.orbit) continue;
        const muOld = old + c.gm, muNew = r.gm + c.gm;
        scaleMeanMotion(c.orbit.el, muNew / muOld, st.jd);
      }
      // its own orbit about its parent includes its own mass too
      if (r.orbit) { const pg = this.entities.get(r.orbit.parent)?.gm ?? 0; scaleMeanMotion(r.orbit.el, (pg + r.gm) / (pg + old), st.jd); }
    });
  }

  /** Kepler mode: change orbital elements (a in m, angles in degrees, M = mean anomaly now). */
  setOrbit(id: number, ch: { a?: number; e?: number; i?: number; node?: number; peri?: number; M?: number; parent?: number }): void {
    this.edit((st) => {
      const r = st.entities.find((x) => x.id === id);
      if (!r) return;
      if (ch.parent !== undefined || !r.orbit) this.fitOrbit(r, ch.parent, true);
      if (!r.orbit) return;
      if (r.mode === 'rider') Sandbox.promote(r);
      const el = r.orbit.el;
      const a0 = el.e < 1 ? el.q / (1 - el.e) : el.q / (1 - el.e);
      const n0 = Math.sqrt(el.mu / Math.abs(a0) ** 3);
      let M = ((st.jd - el.tp) * DAY) * n0;
      if (ch.M !== undefined) M = (ch.M * Math.PI) / 180;
      const e = Math.min(0.99, Math.max(0, ch.e ?? el.e));
      const a = ch.a ?? (el.e < 1 ? a0 : el.q / Math.max(1e-3, 1 - e));
      el.e = e;
      el.q = a * (1 - e);
      if (ch.i !== undefined) el.i = ch.i;
      if (ch.node !== undefined) el.node = ch.node;
      if (ch.peri !== undefined) el.peri = ch.peri;
      const n = Math.sqrt(el.mu / a ** 3);
      el.tp = st.jd - M / n / DAY;
      this.stateFromOrbit(r, st.jd);
      // (the N-body simulation starts it from that state)
      if (this.mode !== 'kepler') r.orbit = undefined;
    });
  }

  /** Update a record's position and velocity from its orbit. */
  private stateFromOrbit(r: EntityRecord, jd: number): void {
    if (!r.orbit) return;
    const p = this.entities.get(r.orbit.parent);
    keplerState(r.orbit.el, jd, this.kp, this.kv);
    eclToEqu(this.kp); eclToEqu(this.kv);
    r.x = this.kp.x + (p?.pos.x ?? 0); r.y = this.kp.y + (p?.pos.y ?? 0); r.z = this.kp.z + (p?.pos.z ?? 0);
    r.vx = this.kv.x + (p?.vel.x ?? 0); r.vy = this.kv.y + (p?.vel.y ?? 0); r.vz = this.kv.z + (p?.vel.z ?? 0);
  }

  /** Climate, shape and other physical properties. */
  setPhys(id: number, ch: PhysProps): void {
    this.edit((st) => {
      const r = st.entities.find((x) => x.id === id);
      if (r) r.phys = { ...r.phys, ...ch };
    });
  }

  /** Analytic Kepler orbits or the N-body simulation, from the universe as it is now. */
  setMode(mode: SimKind): void {
    if (mode === this.mode && this.active) return;
    this.edit((st) => {
      st.mode = mode;
      if (mode === 'kepler') {
        // everything continues on the orbit it has now (osculating about its primary)
        for (const r of st.entities) {
          const e = this.entities.get(r.id);
          if (!e) continue;
          const p = this.primaryOf(e);
          r.orbit = p ? this.osculating(e.pos, e.vel, e.gm, p) ?? undefined : undefined;
        }
      } else {
        for (const r of st.entities) r.orbit = undefined;
      }
    });
  }

  setRadius(id: number, radius: number): void {
    this.edit((st) => { const r = st.entities.find((x) => x.id === id); if (r) r.radius = Math.max(1, radius); });
  }

  setVelocity(id: number, v: Vector3): void {
    this.edit((st) => {
      const r = st.entities.find((x) => x.id === id);
      if (!r) return;
      if (r.mode === 'rider') Sandbox.promote(r);
      r.vx = v.x; r.vy = v.y; r.vz = v.z;
      this.fitOrbit(r);
    });
  }

  setPosition(id: number, p: Vector3, v?: Vector3): void {
    this.edit((st) => {
      const r = st.entities.find((x) => x.id === id);
      if (!r) return;
      if (r.mode === 'rider') Sandbox.promote(r);
      r.x = p.x; r.y = p.y; r.z = p.z;
      if (v) { r.vx = v.x; r.vy = v.y; r.vz = v.z; }
      if (this.mode === 'kepler') {
        // about whatever it now sits near (it rides along with it otherwise)
        const e = this.entities.get(id)!;
        const near = this.primaryAt(p, r.gm);
        this.fitOrbit(r, near && near !== e ? near.id : null);
        return; // (moons follow by themselves)
      }
      // its moons come along
      for (const m of st.entities) if (m.mode === 'rider' && m.parent === id) {
        const e = this.entities.get(id)!;
        m.x += p.x - e.pos.x; m.y += p.y - e.pos.y; m.z += p.z - e.pos.z;
        if (v) { m.vx += v.x - e.vel.x; m.vy += v.y - e.vel.y; m.vz += v.z - e.vel.z; }
      }
    });
  }

  remove(id: number): void {
    this.edit((st) => {
      const gone = this.entities.get(id);
      const grand = gone ? this.parentId(gone) : null;
      // in Kepler mode its moons go on about its own parent, from where they are
      if (this.mode === 'kepler') for (const m of st.entities) {
        const e = this.entities.get(m.id);
        if (e && m.id !== id && (m.orbit?.parent ?? this.parentId(e)) === id) this.fitOrbit(m, grand);
      }
      st.entities = st.entities.filter((x) => x.id !== id);
      for (const m of st.entities) if (m.parent === id) { m.mode = 'test'; m.parent = undefined; }
    });
  }

  /** Spin: rate (rad/s, negative = retrograde) and/or a new axis (world unit vector). */
  setSpin(id: number, rate: number | null, axis: Vector3 | null): void {
    this.edit((st) => {
      const r = st.entities.find((x) => x.id === id);
      if (!r) return;
      const old = new Vector3(r.spin.ax, r.spin.ay, r.spin.az);
      if (r.spin.locked) {
        // leaving tidal lock: spin at the current orbital rate about the current pole
        const e = this.entities.get(id)!;
        const m = this.orient(e, new Matrix4()).elements;
        old.set(m[8], m[9], m[10]).normalize();
        r.spin.ax = old.x; r.spin.ay = old.y; r.spin.az = old.z;
        const p = this.primaryOf(e);
        r.spin.rate = p ? new Vector3().subVectors(e.vel, p.vel).cross(new Vector3().subVectors(e.pos, p.pos)).length() / e.pos.distanceToSquared(p.pos) : 0;
        r.spin.locked = false;
      }
      r.customSpin = true;
      if (rate !== null) r.spin.rate = rate;
      if (axis) {
        const q = new Quaternion().setFromUnitVectors(old, axis.clone().normalize());
        const base = new Matrix4().fromArray(r.spin.base);
        base.premultiply(new Matrix4().makeRotationFromQuaternion(q));
        r.spin.base = [...base.elements];
        r.spin.ax = axis.x; r.spin.ay = axis.y; r.spin.az = axis.z;
      }
    });
  }

  /** Add something new; returns its id. */
  spawn(kind: EntityKind, name: string, spec: SpawnSpec, gm: number, radius: number, pos: Vector3, vel: Vector3, flags = 0, parentId?: number): number {
    const id = this.nextId++;
    this.edit((st) => {
      st.nextId = this.nextId;
      const axis = new Vector3().crossVectors(pos.clone().sub(this.primaryAt(pos, gm)?.pos ?? new Vector3()), vel).normalize();
      if (axis.lengthSq() < 0.5) axis.copy(ECLIPTIC_POLE);
      const base = new Matrix4().makeBasis(new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1));
      base.premultiply(new Matrix4().makeRotationFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), axis)));
      const rotHours = kind === 'star' ? 600 : spec.type === 'giant' ? 10 : 24;
      st.entities.push({
        id, kind, name, mode: kind === 'swarm' ? 'test' : 'massive', gm, radius, flags,
        x: pos.x, y: pos.y, z: pos.z, vx: vel.x, vy: vel.y, vz: vel.z,
        spin: { ax: axis.x, ay: axis.y, az: axis.z, rate: kind === 'hole' ? 0 : (2 * Math.PI) / (rotHours * 3600), locked: false, base: [...base.elements] },
        spawn: spec, customSpin: true,
      });
      const rec = st.entities[st.entities.length - 1];
      const p = parentId !== undefined ? this.entities.get(parentId) ?? null : this.primaryAt(pos, gm);
      this.fitOrbit(rec, p?.id ?? null);
    });
    return id;
  }

  /** The body whose sphere of influence holds a point (for placing new things). */
  primaryAt(pos: Vector3, gm = 0): Entity | null {
    const probe = { pos, gm } as Entity;
    if (!this.primaryCache) this.primaryCache = this.computePrimaries();
    return this.findPrimary(probe, this.massiveList(), this.primaryCache);
  }

  /** Velocity of a circular orbit about the dominant body at `pos` (in the primary's orbital plane, prograde). */
  circularVelocity(pos: Vector3, gm = 0, normal?: Vector3): Vector3 {
    const p = this.primaryAt(pos, gm);
    if (!p) return new Vector3();
    const r = pos.clone().sub(p.pos);
    let n = normal?.clone();
    if (!n) {
      // the primary's own orbit normal (or the ecliptic's)
      const pp = this.primaryOf(p);
      n = pp ? new Vector3().subVectors(p.pos, pp.pos).cross(new Vector3().subVectors(p.vel, pp.vel)).normalize() : ECLIPTIC_POLE.clone();
      if (n.lengthSq() < 0.5) n = ECLIPTIC_POLE.clone();
    }
    let t = new Vector3().crossVectors(n, r).normalize();
    if (t.lengthSq() < 0.5) t = new Vector3().crossVectors(ECLIPTIC_POLE, r).normalize();
    return t.multiplyScalar(Math.sqrt((p.gm + gm) / r.length())).add(p.vel);
  }

  // ---------------------------------------------------------------- velocity presets

  /** Velocity of `e` relative to its primary (and the primary). */
  relative(e: Entity): { p: Entity | null; r: Vector3; v: Vector3 } {
    const p = this.primaryOf(e);
    return { p, r: p ? e.pos.clone().sub(p.pos) : e.pos.clone(), v: p ? e.vel.clone().sub(p.vel) : e.vel.clone() };
  }

  preset(id: number, what: 'reverse' | 'stop' | 'circular' | 'escape' | 'push' | 'brake'): void {
    const e = this.entities.get(id);
    if (!e) return;
    const { p, r, v } = this.relative(e);
    const mu = (p?.gm ?? 0) + e.gm;
    let nv: Vector3;
    switch (what) {
      case 'reverse': nv = v.clone().negate(); break;
      case 'stop': nv = new Vector3(); break;
      case 'push': nv = v.clone().multiplyScalar(1.15); break;
      case 'brake': nv = v.clone().multiplyScalar(0.85); break;
      case 'escape': nv = v.clone().normalize().multiplyScalar(1.08 * Math.sqrt((2 * mu) / r.length())); break;
      case 'circular': {
        const n = r.clone().cross(v);
        if (n.lengthSq() === 0) n.copy(ECLIPTIC_POLE);
        nv = n.normalize().cross(r).normalize().multiplyScalar(Math.sqrt(mu / r.length()));
        break;
      }
    }
    this.setVelocity(id, nv.add(p?.vel ?? new Vector3()));
  }

  // ---------------------------------------------------------------- save / load

  save(): boolean {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.capture())); return true; } catch { return false; }
  }

  load(): boolean {
    let st: WorldState | null = null;
    try { const s = localStorage.getItem(SAVE_KEY); st = s ? JSON.parse(s) as WorldState : null; } catch { st = null; }
    return st ? this.loadState(st) : false;
  }

  hasSave(): boolean {
    try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
  }

  exportJson(): string {
    return JSON.stringify(this.capture());
  }

  /** Load a saved universe (JSON text or object); false when it isn't one. */
  loadState(st: WorldState | string, jdNow?: number): boolean {
    let s: WorldState;
    try { s = typeof st === 'string' ? JSON.parse(st) as WorldState : st; } catch { return false; }
    if (!s || s.format !== 'space-explorer-god' || !Array.isArray(s.entities)) return false;
    if (!this.active) this.start(jdNow ?? s.jd);
    this.undoStack.push(this.capture());
    this.applyState(s);
    return true;
  }
}

function localSnapshot(gen: number, massive: PState[], tests: PState[]): Snapshot {
  const pack = (l: PState[]) => {
    const xv = new Float64Array(l.length * 6);
    l.forEach((p, i) => xv.set([p.x, p.y, p.z, p.vx, p.vy, p.vz], i * 6));
    return xv;
  };
  return {
    type: 'snap', gen, t: 0, ids: Int32Array.from(massive.map((p) => p.id)), gm: Float64Array.from(massive.map((p) => p.gm)),
    r: Float64Array.from(massive.map((p) => p.r)), xv: pack(massive), tids: Int32Array.from(tests.map((p) => p.id)), txv: pack(tests), events: [], steps: 0,
  };
}

/** Spawned bodies get a Body so selection, search and the ship's gravity see them. */
export function makeSpawnBody(id: number, name: string, kind: Body['kind'], gm: number, radius: number): Body {
  const b = new Body(id, name, kind);
  b.gm = gm;
  b.systemGm = gm;
  b.radii = [radius, radius, radius];
  b.radius = radius;
  b.hidden = true;
  b.meta = { spawned: true };
  return b;
}
