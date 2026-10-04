import { Matrix4, Quaternion, Vector3 } from 'three';
import type { App } from '../app/App';
import { AU, DAY } from '../core/units';
import { UPos } from '../core/upos';
import type { AtmosphereData } from '../render/Atmospheres';
import { G, gravity, type GravitySource, MSUN, makeSource } from '../sim/Gravity';
import { conicOf, timeToRadius, type Conic } from '../sim/Kepler';
import { Predictor } from '../sim/Predict';
import { type Atmosphere, FlightCore, type FlightEvent, G0, SHIP_SPEC } from '../sim/ShipPhysics';
import { Body } from '../universe/Body';
import { ExoPlanet, starProps } from '../universe/Planets';
import type { CatalogStar } from '../universe/Stars';

export type SasMode = 'off' | 'stability' | 'prograde' | 'retrograde' | 'normal' | 'antinormal' | 'radial-out' | 'radial-in' | 'target' | 'anti-target';
const SAS_ORDER: SasMode[] = ['off', 'stability', 'prograde', 'retrograde', 'normal', 'antinormal', 'radial-out', 'radial-in', 'target', 'anti-target'];

/** Fastest physics time warp; above RAILS_RATE a coasting ship goes "on rails" (analytic Kepler). */
export const MAX_RATE = 100_000;
export const RAILS_RATE = 1000;
/** gravity (m/s^2) above which the warp drive is mass-locked */
export const MASS_LOCK_G = 0.5;
const L_SUN = 3.828e26;

/** What the HUD and cockpit show (refreshed every frame). */
export interface FlightReadout {
  frame: string;
  altitude: number;
  vertSpeed: number;
  orbitSpeed: number;
  surfSpeed: number;
  conic: Conic | null;
  /** from the numerical prediction (s from now; NaN = none) */
  tImpact: number;
  tAp: number;
  tPe: number;
  ap: number;
  pe: number;
  escape: boolean;
  encounter: string;
  gForce: number;
  tidal: number;
  throttle: number;
  fuel: number;
  dv: number;
  sas: SasMode;
  rails: boolean;
  rate: number;
  limited: boolean;
  dilation: number;
  shipTime: number;
  universeTime: number;
  heat: number;
  hullTemp: number;
  boosted: boolean;
  landed: string;
  massLock: string;
  warning: string;
  warnLevel: 0 | 1 | 2;
}

/**
 * Real-physics flight for the ship (default whenever you are in it): the live gravity of every
 * body, star and black hole, engines and RCS with real mass, reaction wheels and SAS, drag and
 * re-entry heat, landings and crashes, tides and time dilation near black holes, physics time warp
 * with an "on rails" mode, and the predicted path ahead.
 */
export class Flight {
  on = false;
  readonly core = new FlightCore(gravity);
  readonly predictor = new Predictor();
  sas: SasMode = 'stability';
  rails = false;
  limited = false;
  /** universe seconds this frame */
  simDt = 0;
  readonly readout: FlightReadout = {
    frame: '', altitude: 0, vertSpeed: 0, orbitSpeed: 0, surfSpeed: 0, conic: null, tImpact: NaN, tAp: NaN, tPe: NaN, ap: NaN, pe: NaN,
    escape: false, encounter: '', gForce: 0, tidal: 0, throttle: 0, fuel: 1, dv: 0, sas: 'stability', rails: false, rate: 1, limited: false,
    dilation: 1, shipTime: 0, universeTime: 0, heat: 0, hullTemp: 290, boosted: false, landed: '', massLock: '', warning: '', warnLevel: 0,
  };
  /** end of the flight in progress (crash, horizon...): seconds left, then respawn */
  ending: { ev: FlightEvent; t: number; total: number; title: string; text: string } | null = null;
  /** seconds since the end sequence started (for the effects) */
  endingT = 0;
  onEvent: ((ev: FlightEvent) => void) | null = null;
  /** shake amplitude (rad) for the view this frame */
  shake = 0;
  universeTime = 0;
  private atmoData: AtmosphereData = {};
  private cache = new Map<object, GravitySource>();
  private exoPrev = new Map<GravitySource, UPos>();
  private predictTimer = 0;
  private lastThrottle = 0;
  private predictedFrom: GravitySource | null = null;
  private mouseRot = new Vector3();
  private warnedReverse = false;
  private lastJd = 0;
  private tmp = new Vector3();

  constructor(private app: App) {
    gravity.provider = () => this.collectSources();
  }

  setAtmospheres(d: AtmosphereData): void {
    this.atmoData = d;
  }

  get ship() {
    return this.core.ship;
  }

  // ------------------------------------------------------------------ sources
  private src(obj: object, make: () => GravitySource): GravitySource {
    let s = this.cache.get(obj);
    if (!s) { s = make(); this.cache.set(obj, s); }
    return s;
  }

  /** Every gravitating thing near enough to matter, read live (god mode moves and re-weighs them). */
  private collectSources(): GravitySource[] {
    const app = this.app;
    const out: GravitySource[] = [];
    const sys = app.system;
    for (const b of sys.bodies) {
      if (!b.valid || !(b.gm > 0)) continue;
      const s = this.src(b, () => makeSource({ obj: b, name: b.name, gm: b.gm, upos: b.upos, vel: b.vel, moving: true, group: 'sol', orient: b.orientation }));
      s.gm = b.gm;
      s.radius = b.radius;
      s.name = b.name;
      out.push(s);
    }
    // hierarchy after all sources exist
    for (const s of out) {
      const b = s.obj as Body;
      s.parent = b.parent && b.parent.gm > 0 ? this.cache.get(b.parent) ?? null : null;
      s.soi = s.parent ? b.soiRadius() : Infinity;
    }
    // black holes (Paczyński–Wiita) and their companions, when within a few light years
    const cam = this.ship.upos;
    for (const h of app.blackHoles) {
      const d = h.upos.sub(cam, this.tmp).length();
      const gm = G * h.massSun * MSUN;
      if (gm / (d * d) < 1e-14) continue;
      const s = this.src(h, () => makeSource({ obj: h, name: h.name, gm, rs: h.radius, upos: h.upos, group: h.key }));
      s.gm = gm;
      out.push(s);
      if (h.companion && h.data.companion) {
        const c = h.companion, cm = G * h.data.companion.massSun * MSUN;
        const cs = this.src(c, () => makeSource({ obj: c, name: c.name, gm: cm, upos: c.upos, radius: c.radius, group: h.key }));
        cs.parent = null;
        out.push(cs);
      }
    }
    // nearby catalogue stars (masses from their luminosity class) and generated/known planets
    for (const st of app.near.stars) {
      const d = st.upos.sub(cam, this.tmp).length();
      if (d > 5e14) continue;
      out.push(this.starSource(st));
    }
    for (const ps of app.activeSystems) {
      const host = this.starSource(ps.host);
      if (!out.includes(host)) out.push(host);
      for (const p of ps.planets) {
        const gm = G * p.spec.massKg;
        const s = this.src(p, () => makeSource({ obj: p, name: p.name, gm, upos: p.upos, radius: p.radius, moving: true, group: ps.host.key }));
        s.parent = host;
        s.soi = p.hill;
        out.push(s);
      }
    }
    return out;
  }

  private starSource(st: CatalogStar): GravitySource {
    return this.src(st, () => makeSource({ obj: st, name: st.name, gm: G * starProps(st).mass * MSUN, upos: st.upos, radius: st.radius, group: st.key }));
  }

  /** Exoplanet velocities by finite differences (their orbits are drawn, not integrated). */
  private exoVelocities(dt: number): void {
    for (const s of gravity.sources) {
      if (!(s.obj instanceof ExoPlanet)) continue;
      const prev = this.exoPrev.get(s);
      if (prev && dt > 0) s.upos.sub(prev, s.vel).divideScalar(dt);
      this.exoPrev.set(s, s.upos.clone());
    }
  }

  // ------------------------------------------------------------------ frame body environment
  private frameEnv(): void {
    const core = this.core, D = core.frame;
    core.atmosphere = null;
    core.groundR = 0;
    core.spin.set(0, 0, 0);
    core.radiantFlux = 0;
    // starlight (heats the hull near a star)
    const sun = this.app.system.sun;
    const dSun = sun.upos.sub(this.ship.upos, this.tmp).length();
    core.radiantFlux = L_SUN / (4 * Math.PI * Math.max(dSun, sun.radius) ** 2);
    if (!D) return;
    // the frame body's spin (the ground and the air turn with it)
    if (D.obj instanceof Body) spinOf(D.obj, core.spin);
    if (D.rs > 0) return;
    const obj = D.obj;
    const app = this.app;
    let R = D.radius;
    const below = app.terrain.owner === obj ? app.terrain.below(this.ship.upos) : null;
    if (below) R = below.ground;
    if (obj instanceof Body) {
      const a = this.atmoData[obj.name];
      if (a) {
        const H = a.scaleHeightKm * 1e3;
        const rho0 = (a.surfacePressureBar * 1e5 * (a.meanMolecularWeight / 1000)) / (8.314462 * a.temperatureK);
        core.atmosphere = { rho0, H, R0: D.radius, top: H * 15 } satisfies Atmosphere;
        // gas giants: no surface; the hull gives way at ~100 bar
        if (obj.isGasGiant) R = D.radius - H * Math.log(100 / a.surfacePressureBar);
      }
    }
    core.groundR = R;
  }

  // ------------------------------------------------------------------ enter / leave
  /** Board: physics takes over from where the explorer is. */
  enable(): void {
    if (this.on) return;
    this.on = true;
    const app = this.app, rig = app.rig, ship = this.ship;
    gravity.refresh();
    ship.upos.copy(rig.upos);
    ship.quat.copy(rig.quat);
    ship.angVel.set(0, 0, 0);
    ship.throttle = 0;
    ship.rcs.set(0, 0, 0);
    ship.hullTemp = 290;
    this.ending = null;
    this.universeTime = 0;
    ship.shipTime = 0;
    this.lastJd = app.clock.jdTdb;
    this.core.landed = null;
    this.core.chooseFrame();
    this.frameEnv();
    this.dropIntoOrbit(false);
    this.predictor.done = true;
    this.predictedFrom = null;
  }

  disable(): void {
    this.on = false;
    this.ending = null;
    this.app.rig.stop();
  }

  /**
   * Leaving the warp drive (or boarding): matched to the local frame. Low over a solid world you are
   * set down (or hover in free fall if `orbit` is false); otherwise on a circular orbit of the dominant body.
   */
  dropIntoOrbit(announce: boolean): void {
    const core = this.core, ship = this.ship;
    gravity.refresh();
    const D = core.chooseFrame();
    this.frameEnv();
    if (!D) { ship.vel.set(0, 0, 0); return; }
    const rel = ship.upos.sub(D.upos, new Vector3());
    const r = rel.length();
    const ground = core.groundR;
    const top = core.atmosphere ? core.atmosphere.R0 + core.atmosphere.top : 0;
    if (ground > 0 && r - ground < 60 && !(D.obj instanceof Body && D.obj.isGasGiant) && !(D.obj instanceof Body && D.obj.kind === 'star')) {
      // on (or just above) the ground: landed, turning with the world
      core.landed = null;
      ship.vel.copy(D.vel).add(new Vector3().crossVectors(core.spin, rel));
      ship.upos.copy(D.upos).addVec(rel, Math.max(ground, r - 0.0) / r);
      const dir = rel.clone().normalize();
      const bf = D.orient ? dir.clone().transformDirection(D.orient.clone().invert()) : dir;
      core.landed = { dir: bf, src: D };
      if (announce) this.app.hud.toast(`Landed on ${D.name}`);
      return;
    }
    // circular orbit, prograde with the body's spin (or the ecliptic), through the current position
    const minR = Math.max(ground * 1.02, top + 20e3, D.rs * 6);
    if (r < minR && D.rs === 0 && ground > 0) {
      // too low for an orbit: hanging still over the ground, and starting to fall
      ship.vel.copy(D.vel).add(new Vector3().crossVectors(core.spin, rel));
      core.landed = null;
      if (announce) this.app.hud.toast(`Over ${D.name} with no orbital speed: you are falling! W throttles up`, 3.5);
      return;
    }
    const rr = Math.max(r, minR);
    let n = core.spin.lengthSq() > 0 ? core.spin.clone().normalize() : new Vector3(0, -0.3978, 0.9175);
    if (Math.abs(n.dot(rel) / r) > 0.98) n = new Vector3(1, 0, 0);
    // tides of a stellar black hole: never drop below the survivable radius
    let safe = rr;
    if (D.rs > 0) safe = Math.max(rr, 1.3 * Math.cbrt((2 * D.gm * SHIP_SPEC.length) / SHIP_SPEC.tidalLimit));
    core.setCircularOrbit(D, safe, rel, n);
    if (announce) this.app.hud.toast(`Matched orbit about ${D.name}`);
  }

  /** Warp drive check: mass-locked by strong gravity. Returns the reason, or '' when free. */
  massLock(): string {
    if (!this.on) return '';
    const g = gravity.gravityAt(this.ship.upos, new Vector3()).length();
    if (g < MASS_LOCK_G) return '';
    const D = this.core.frame;
    let need = '';
    if (D) {
      const r = Math.sqrt(D.gm / MASS_LOCK_G) - (D.rs > 0 ? 0 : 0);
      need = ` Climb beyond ${fmtDist(r - D.radius)} from ${D.name}.`;
    }
    return `Mass-locked: gravity ${g.toFixed(g < 10 ? 2 : 0)} m/s² (limit ${MASS_LOCK_G}).${need}`;
  }

  /** true while something else flies the ship: the warp drive, the VR travel, the docking computer */
  get external(): boolean {
    const app = this.app;
    return app.rig.autopilot || app.vr.traveling || !!app.game?.docked || !!app.game?.isDocking;
  }

  // ------------------------------------------------------------------ per frame
  /** Controls, frame body and the universe time step (before the bodies move). Returns the clock step (s). */
  before(rawDt: number, dt: number): number {
    const app = this.app, clock = app.clock, ship = this.ship, core = this.core;
    const rig = () => app.rig;
    this.limited = false;
    gravity.refresh();
    if (this.external) {
      // the warp drive (or docking computer) carries the ship: physics resumes at drop-out
      this.simDt = clock.paused ? 0 : Math.max(0, Math.min(rawDt, 1) * clock.rate);
      app.rig.updateExternal();
      return this.simDt;
    }
    // the explorer was moved (a tour stop, a search pick, a script): the ship goes with it
    if (rig().upos.sub(ship.upos, this.tmp).length() > 1e-3 && !this.ending) {
      ship.upos.copy(rig().upos);
      ship.quat.copy(rig().quat);
      ship.angVel.set(0, 0, 0);
      this.dropIntoOrbit(true);
    }
    core.chooseFrame();
    this.frameEnv();
    if (this.ending) {
      this.simDt = Math.min(rawDt, 1);
      return this.simDt;
    }
    this.controls(dt);
    app.rig.updateExternal();
    let rate = clock.paused ? 0 : clock.rate;
    if (rate < 0) {
      rate = 0;
      if (!this.warnedReverse) { app.hud.toast('Time cannot run backwards while you fly: the ship holds still'); this.warnedReverse = true; }
    } else this.warnedReverse = false;
    rate = Math.min(rate, MAX_RATE);
    // the universe clock runs fast when the ship's clock is slow (gravity, speed); shown, capped at 50x
    let want = Math.min(rawDt, 1) * rate / Math.max(ship.dilation, 0.02);
    // on rails: coasting, no air, no black hole, periapsis well clear of the ground
    const D = core.frame;
    this.rails = false;
    if (want > 0 && rate >= RAILS_RATE && D && D.rs === 0 && !core.landed && ship.throttle === 0 && ship.rcs.lengthSq() === 0) {
      const rel = ship.upos.sub(D.upos, new Vector3()), vel = ship.vel.clone().sub(D.vel);
      const c = conicOf(rel, vel, D.gm);
      const top = core.atmosphere ? core.atmosphere.R0 + core.atmosphere.top : core.groundR;
      const pertOk = this.perturbationRatio(rel) < 2e-3;
      if (c.rp > Math.max(top, core.groundR) * 1.001 && pertOk && (c.ra < D.soi * 0.98 || rel.length() + vel.length() * want < D.soi * 0.9)) this.rails = true;
    }
    if (want > 0 && !this.rails) {
      // physics warp: at most `budget` substeps a frame (the warp slows down near anything fast)
      const h = core.estimateStep();
      const budget = app.vr.active ? 200 : 900;
      if (want / h > budget) { want = budget * h; this.limited = rate > 1; }
      core.maxSubsteps = Math.ceil(budget * 1.5);
    }
    this.simDt = want;
    return want;
  }

  /** How strongly the other bodies perturb the ship relative to the frame body's pull. */
  private perturbationRatio(rel: Vector3): number {
    const D = this.core.frame!;
    const g = gravity.gravityAt(this.ship.upos, new Vector3());
    const own = rel.clone().multiplyScalar(-D.gm / rel.length() ** 3);
    // the frame body's own acceleration (its group pulling on it) cancels in its frame
    const gD = new Vector3();
    if (D.moving) {
      for (const s of gravity.sources) {
        if (s === D || !s.moving || s.group !== D.group) continue;
        const d = D.upos.sub(s.upos, this.tmp);
        gD.addScaledVector(d, -s.gm / d.length() ** 3);
      }
    }
    return g.sub(own).sub(gD).length() / own.length();
  }

  /** Integrate the ship over the frame (the bodies are still at the old time). */
  step(): void {
    const core = this.core;
    if (this.external || this.ending) return;
    const dt = this.simDt;
    if (dt <= 0) { core.step(0); return; }
    if (!(this.rails && core.stepRails(dt))) { this.rails = false; core.step(dt); }
  }

  /** After the bodies moved: place the ship, drive the camera, handle events and readouts. */
  after(dt: number): void {
    const app = this.app, rig = app.rig, ship = this.ship, core = this.core;
    this.universeTime += this.simDt;
    this.exoVelocities((app.clock.jdTdb - this.lastJd) * DAY);
    if (this.external) {
      // in warp the ship is where the drive puts it
      ship.upos.copy(rig.upos);
      ship.quat.copy(rig.quat);
      this.wasWarping = true;
      this.lastJd = app.clock.jdTdb;
      return;
    }
    if (this.wasWarping) {
      this.wasWarping = false;
      ship.upos.copy(rig.upos);
      ship.quat.copy(rig.quat);
      this.dropIntoOrbit(true);
    }
    if (this.ending) {
      this.updateEnding(dt);
    } else {
      core.place();
      const ev = core.event;
      if (ev) this.handleEvent(ev);
    }
    this.lastJd = app.clock.jdTdb;
    rig.upos.copy(ship.upos);
    // view shake from heating, thrust and tides (lighter in VR)
    const heat = Math.min(1, ship.heatFlux / 2e6);
    const tidal = Math.min(1, ship.tidal / SHIP_SPEC.tidalLimit);
    let shake = heat * 0.004 + tidal * 0.006 + (ship.throttle > 0 ? ship.throttle * 0.0006 : 0) + (this.ending && this.ending.ev.kind !== 'horizon' ? 0.01 * Math.max(0, 1 - this.endingT) : 0);
    if (app.vr.active) shake *= 0.15;
    this.shake = shake;
    rig.quat.copy(ship.quat);
    if (shake > 0) {
      const t = performance.now() / 1000;
      rig.quat.multiply(_q.setFromAxisAngle(_v.set(Math.sin(t * 53), Math.sin(t * 71 + 1), Math.sin(t * 37 + 2)).normalize(), shake * Math.sin(t * 97)));
    }
    rig.speed = ship.vel.clone().sub(core.frame ? core.frame.vel : _zero).length();
    this.updatePrediction();
    this.fillReadout();
  }
  private wasWarping = false;

  // ------------------------------------------------------------------ controls
  /** Throttle, RCS, reaction wheels and SAS from the keyboard, mouse and VR controllers (real time). */
  private controls(dt: number): void {
    const app = this.app, k = app.input.keys, ship = this.ship, rig = app.rig;
    const shift = k.has('ShiftLeft') || k.has('ShiftRight');
    if (!app.walk.walking) {
      // throttle (W/S, Z full, X cut); with Shift, W/S are RCS fore/aft
      if (!shift) {
        if (k.has('KeyW')) ship.throttle = Math.min(1, ship.throttle + dt * 0.7);
        if (k.has('KeyS')) ship.throttle = Math.max(0, ship.throttle - dt * 0.7);
      }
      if (k.has('KeyZ')) ship.throttle = 1;
      if (k.has('KeyX')) ship.throttle = 0;
      ship.rcs.set(
        (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0),
        (k.has('KeyR') ? 1 : 0) - (k.has('KeyF') ? 1 : 0),
        shift ? (k.has('KeyS') ? 1 : 0) - (k.has('KeyW') ? 1 : 0) : 0,
      );
    }
    // VR: left grip is the throttle, left stick RCS (in the ship's axes)
    const ext = rig.ext;
    if (ext.throttle >= 0) ship.throttle = ext.throttle;
    if (ext.move.lengthSq() > 1e-6) {
      const m = ext.move.clone().applyQuaternion(ship.quat.clone().invert());
      ship.rcs.add(m).clampScalar(-1, 1);
    }
    // rotation command, ship axes (pitch about x, yaw about y, roll about z)
    const cmd = new Vector3(
      (k.has('ArrowDown') ? 1 : 0) - (k.has('ArrowUp') ? 1 : 0),
      (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0),
      (k.has('KeyQ') ? 1 : 0) - (k.has('KeyE') ? 1 : 0),
    );
    const drag = app.input.consume();
    // mouse: drag to turn (a rate command that decays when the mouse stops)
    this.mouseRot.x = this.mouseRot.x * Math.exp(-dt * 10) - drag.left.dy * 0.04;
    this.mouseRot.y = this.mouseRot.y * Math.exp(-dt * 10) - drag.left.dx * 0.04;
    cmd.add(this.mouseRot).add(ext.rot);
    cmd.clampScalar(-1, 1);
    // zoom out/in the chase camera / field of view is the wheel's job; nothing else consumes input here
    if (drag.wheel && app.game.mode === 'cockpit') rig.fov = Math.max(20, Math.min(100, rig.fov * Math.pow(1.08, drag.wheel)));
    this.attitude(dt, cmd);
  }

  cycleSas(back = false): void {
    const i = SAS_ORDER.indexOf(this.sas);
    this.sas = SAS_ORDER[(i + (back ? SAS_ORDER.length - 1 : 1)) % SAS_ORDER.length];
    if ((this.sas === 'target' || this.sas === 'anti-target') && !this.app.selection) this.sas = back ? 'antinormal' : 'off';
    const label = SAS_LABEL[this.sas];
    this.app.hud.toast(`SAS: ${label}`);
    if (this.app.vr.active) this.app.vr.flash(`SAS: ${label}`);
  }

  toggleBoost(): void {
    this.ship.boosted = !this.ship.boosted;
    const say = this.ship.boosted ? 'Boosted drive: 25x thrust, infinite propellant, inertial dampers' : 'Realistic drive: real thrust and propellant';
    this.app.hud.toast(say, 3);
    if (this.app.vr.active) this.app.vr.flash(say);
  }

  /** Reaction wheels: the command sets an angular acceleration; SAS steers when the pilot does not. */
  private attitude(dt: number, cmd: Vector3): void {
    const ship = this.ship, spec = SHIP_SPEC, core = this.core;
    if (core.landed) { ship.angVel.set(0, 0, 0); return; }
    const inv = ship.quat.clone().invert();
    const wBody = ship.angVel.clone().applyQuaternion(inv);
    const manual = cmd.lengthSq() > 1e-4;
    let want: Vector3 | null = null; // wanted body rates
    if (manual) {
      want = cmd.clone().multiplyScalar(spec.maxRate * 0.6);
    } else if (this.sas !== 'off') {
      want = new Vector3();
      const dir = this.sasDirection();
      if (dir) {
        // turn the nose (-z) onto `dir`: rate proportional to the error, gentle near it
        const dB = dir.clone().applyQuaternion(inv);
        const axis = new Vector3(0, 0, -1).cross(dB);
        const s = axis.length(), c = -dB.z;
        const ang = Math.atan2(s, c);
        if (s > 1e-9) axis.divideScalar(s);
        else if (c < 0) axis.set(0, 1, 0);
        want.copy(axis).multiplyScalar(Math.min(spec.maxRate * 0.5, ang * 1.6));
        want.z = 0;
      }
    }
    if (want) {
      // wheels accelerate towards the wanted rates
      const err = want.sub(wBody);
      const maxDw = spec.wheelAccel * dt;
      const L = err.length();
      if (L > maxDw) err.multiplyScalar(maxDw / L);
      wBody.add(err);
    }
    if (wBody.length() > spec.maxRate) wBody.setLength(spec.maxRate);
    ship.angVel.copy(wBody).applyQuaternion(ship.quat);
    const ang = ship.angVel.length() * dt;
    if (ang > 0) {
      ship.quat.premultiply(_q.setFromAxisAngle(_v.copy(ship.angVel).normalize(), ang));
      ship.quat.normalize();
    }
  }

  /** World direction the SAS holds, or null (stability: just kill rotation). */
  private sasDirection(): Vector3 | null {
    const D = this.core.frame, ship = this.ship;
    const mode = this.sas;
    if (mode === 'stability' || mode === 'off') return null;
    if (mode === 'target' || mode === 'anti-target') {
      const sel = this.app.selection;
      if (!sel) return null;
      const d = sel.upos.sub(ship.upos, new Vector3()).normalize();
      return mode === 'target' ? d : d.negate();
    }
    if (!D) return null;
    const r = ship.upos.sub(D.upos, new Vector3());
    const v = ship.vel.clone().sub(D.vel);
    // near the ground prograde/retrograde follow the surface velocity (landing, take-off)
    if (this.readout.altitude < 30e3 && this.core.spin.lengthSq() > 0) v.sub(new Vector3().crossVectors(this.core.spin, r));
    if (v.lengthSq() < 1e-6) return null;
    const pro = v.clone().normalize();
    const nrm = new Vector3().crossVectors(r, v).normalize();
    const rad = new Vector3().crossVectors(nrm, pro).normalize(); // radial out, perpendicular to velocity
    switch (mode) {
      case 'prograde': return pro;
      case 'retrograde': return pro.negate();
      case 'normal': return nrm;
      case 'antinormal': return nrm.negate();
      case 'radial-out': return rad;
      case 'radial-in': return rad.negate();
    }
    return null;
  }

  // ------------------------------------------------------------------ events
  private handleEvent(ev: FlightEvent): void {
    const app = this.app;
    const name = ev.src?.name ?? 'the ground';
    const spd = fmtSpeed(ev.speed);
    if (ev.kind === 'land') {
      app.hud.toast(`Touchdown on ${name} at ${spd}`, 3);
      if (app.vr.active) app.vr.flash(`Touchdown on ${name}`);
      app.game.audio.chime();
      this.ship.throttle = 0;
      this.onEvent?.(ev);
      return;
    }
    const msgs: Record<string, [string, string]> = {
      crash: ['CRASHED', `You hit ${name} at ${spd}. Touch down slower than ${SHIP_SPEC.crashSpeed} m/s.`],
      burnup: ['BURNED UP', `The hull passed ${SHIP_SPEC.maxHullTemp} K. Enter the air more shallowly, or slow down first.`],
      spaghetti: ['TORN APART', `The tide of ${name} stretched the ship by more than 100 g across its ${SHIP_SPEC.length} m. A stellar black hole kills you long before its horizon.`],
      horizon: ['NO RETURN', `You crossed the event horizon of ${name}. Every path now leads inward; the universe you knew is behind you for ever.`],
    };
    const [title, text] = msgs[ev.kind];
    this.ending = { ev, t: ev.kind === 'horizon' ? 7 : 4.5, total: ev.kind === 'horizon' ? 7 : 4.5, title, text };
    this.endingT = 0;
    this.ship.throttle = 0;
    if (app.vr.active) app.vr.flash(title);
    app.game.audio.update(0, 0, false);
    this.onEvent?.(ev);
  }

  private updateEnding(dt: number): void {
    const e = this.ending!;
    this.endingT += dt;
    e.t -= dt;
    const ship = this.ship;
    if (e.ev.kind === 'horizon' && e.ev.src) {
      // inside: drawn on towards the centre, the view tumbling slowly
      const rel = ship.upos.sub(e.ev.src.upos, new Vector3());
      ship.upos.copy(e.ev.src.upos).addVec(rel, Math.max(0.2, 1 - dt * 0.15));
      ship.quat.premultiply(_q.setFromAxisAngle(_v.set(0.3, 1, 0.2).normalize(), dt * 0.2));
    }
    if (e.t <= 0) this.respawn();
  }

  /** Back in one piece: a safe circular orbit about the body that ended the flight. */
  respawn(): void {
    const e = this.ending;
    this.ending = null;
    const core = this.core, ship = this.ship;
    const src = e?.ev.src ?? core.frame;
    ship.fuel = SHIP_SPEC.fuelMax;
    ship.hullTemp = 290;
    ship.heatFlux = 0;
    ship.throttle = 0;
    ship.angVel.set(0, 0, 0);
    core.landed = null;
    core.event = null;
    if (src) {
      core.frame = src;
      this.frameEnv();
      const top = core.atmosphere ? core.atmosphere.R0 + core.atmosphere.top : src.radius;
      let r = Math.max(src.radius * 1.15, top + 100e3, src.radius + 300e3);
      if (src.rs > 0) r = Math.max(30 * src.rs, 1.6 * Math.cbrt((2 * src.gm * SHIP_SPEC.length) / SHIP_SPEC.tidalLimit));
      if (src.obj instanceof Body && src.obj.kind === 'star') r = src.radius * 8;
      const rel = ship.upos.sub(src.upos, new Vector3());
      const n = core.spin.lengthSq() > 0 ? core.spin.clone().normalize() : new Vector3(0, -0.3978, 0.9175);
      core.setCircularOrbit(src, r, rel.lengthSq() > 0 ? rel : new Vector3(1, 0, 0), n);
      const vel = ship.vel.clone().sub(src.vel).normalize();
      ship.quat.setFromRotationMatrix(new Matrix4().lookAt(new Vector3(), vel, rel.clone().normalize()));
    }
    this.sas = 'stability';
    this.predictor.done = true;
    this.predictedFrom = null;
    const say = `Respawned in a safe orbit${src ? ` about ${src.name}` : ''}`;
    this.app.hud.toast(say, 3);
    if (this.app.vr.active) this.app.vr.flash(say);
  }

  // ------------------------------------------------------------------ prediction
  private updatePrediction(): void {
    const core = this.core, ship = this.ship, D = core.frame;
    if (!D || this.ending) { this.predictor.done = true; this.predictor.count = 0; this.pending = null; return; }
    const thrusting = ship.throttle > 0 || ship.rcs.lengthSq() > 0;
    this.predictTimer -= 1;
    const changed = D !== this.predictedFrom || (this.lastThrottle > 0 && ship.throttle === 0);
    this.lastThrottle = ship.throttle;
    const vr = this.app.vr.active;
    // a fresh prediction: when the situation changed, often while burning, now and then when coasting
    if (changed || (!this.pending && this.predictTimer <= 0) || (thrusting && this.predictTimer <= 0)) {
      const rel = ship.upos.sub(D.upos, new Vector3()), relVel = ship.vel.clone().sub(D.vel);
      this.pending = new Predictor();
      this.pending.start({
        frame: D, rel, relVel, sources: gravity.sources, groundR: core.groundR, atmosphere: core.atmosphere, spin: core.spin.clone(),
        cdA: SHIP_SPEC.cdA, mass: ship.mass, orbits: thrusting ? 1 : 3, maxTime: 2 * 365.25 * DAY, maxPoints: vr ? 900 : 2400,
      });
      this.predictedFrom = D;
      this.predictTimer = thrusting ? 4 : this.rails ? 3 : 45;
    }
    const p = this.pending;
    if (p) {
      // capped work per frame (Quest: ~0.2 ms)
      p.advance(vr ? 60 : 300);
      // shown once finished, or at once when the old path belongs to another body
      if (p.done || this.predictor.frame !== D) (this as { predictor: Predictor }).predictor = p;
      if (p.done) this.pending = null;
    }
  }
  private pending: Predictor | null = null;

  /** Live numbers for the HUD and the cockpit screens. */
  private fillReadout(): void {
    const r = this.readout, core = this.core, ship = this.ship, D = core.frame;
    r.frame = D?.name ?? 'deep space';
    r.gForce = ship.gForce / (ship.boosted ? SHIP_SPEC.boost : 1);
    r.tidal = ship.tidal;
    r.throttle = ship.throttle;
    r.fuel = ship.fuel / SHIP_SPEC.fuelMax;
    r.boosted = ship.boosted;
    r.dv = ship.boosted ? Infinity : SHIP_SPEC.isp * G0 * Math.log(ship.mass / SHIP_SPEC.dryMass);
    r.sas = this.sas;
    r.rails = this.rails;
    r.limited = this.limited;
    r.rate = this.app.clock.paused ? 0 : Math.min(Math.max(this.app.clock.rate, 0), MAX_RATE);
    r.dilation = ship.dilation;
    r.shipTime = ship.shipTime;
    r.universeTime = this.universeTime;
    r.heat = ship.heatFlux;
    r.hullTemp = ship.hullTemp;
    r.landed = core.landed ? core.landed.src.name : '';
    r.massLock = this.massLock();
    r.conic = null;
    r.tImpact = r.tAp = r.tPe = r.ap = r.pe = NaN;
    r.escape = false;
    r.encounter = '';
    if (D) {
      const rel = ship.upos.sub(D.upos, new Vector3()), vel = ship.vel.clone().sub(D.vel);
      const rl = rel.length();
      r.altitude = rl - (core.groundR || D.radius);
      r.orbitSpeed = vel.length();
      r.vertSpeed = vel.dot(rel) / rl;
      r.surfSpeed = vel.clone().sub(new Vector3().crossVectors(core.spin, rel)).length();
      if (D.rs === 0) {
        r.conic = conicOf(rel, vel, D.gm);
        r.ap = r.conic.ra - (core.groundR || D.radius);
        r.pe = r.conic.rp - (core.groundR || D.radius);
        r.tAp = r.conic.tAp; r.tPe = r.conic.tPe;
        if (core.groundR > 0) r.tImpact = timeToRadius(rel, vel, D.gm, core.groundR);
      }
      // the numerical prediction knows better (black holes, several bodies, air)
      const p = this.predictor;
      if (p.frame === D && p.events.length) {
        const pe = p.events.find((e) => e.kind === 'pe'), ap = p.events.find((e) => e.kind === 'ap');
        const imp = p.events.find((e) => e.kind === 'impact' || e.kind === 'horizon');
        if (D.rs > 0) {
          if (pe) { r.pe = pe.r; r.tPe = pe.t; }
          if (ap) { r.ap = ap.r; r.tAp = ap.t; }
        }
        if (imp && (D.rs > 0 || core.atmosphere)) r.tImpact = imp.t;
        r.escape = p.events.some((e) => e.kind === 'escape');
        r.encounter = p.events.find((e) => e.kind === 'encounter')?.body?.name ?? '';
      }
      if (core.landed) r.tImpact = NaN;
    } else {
      r.altitude = Infinity;
      r.orbitSpeed = r.surfSpeed = ship.vel.length();
      r.vertSpeed = 0;
    }
    // warnings, most urgent first
    const lim = SHIP_SPEC.tidalLimit;
    r.warning = ''; r.warnLevel = 0;
    if (this.ending) { r.warning = this.ending.title; r.warnLevel = 2; }
    else if (ship.tidal > lim * 0.3) { r.warning = `TIDAL STRESS ${(ship.tidal / G0).toFixed(0)} g`; r.warnLevel = 2; }
    else if (D && D.rs > 0 && r.altitude < D.rs * 2) { r.warning = 'EVENT HORIZON CLOSE'; r.warnLevel = 2; }
    else if (ship.hullTemp > SHIP_SPEC.maxHullTemp * 0.75) { r.warning = `HULL ${Math.round(ship.hullTemp)} K`; r.warnLevel = 2; }
    else if (Number.isFinite(r.tImpact) && r.tImpact < 60 && !core.landed && r.surfSpeed > SHIP_SPEC.crashSpeed && (D?.rs ?? 0) === 0) { r.warning = `IMPACT IN ${Math.ceil(r.tImpact)} s — SLOW DOWN`; r.warnLevel = 2; }
    else if (ship.tidal > lim * 0.05) { r.warning = `TIDES ${(ship.tidal / G0).toFixed(1)} g`; r.warnLevel = 1; }
    else if (ship.hullTemp > 1200) { r.warning = 'RE-ENTRY HEATING'; r.warnLevel = 1; }
    else if (r.gForce > 6) { r.warning = `HIGH G ${r.gForce.toFixed(1)}`; r.warnLevel = 1; }
    else if (!ship.boosted && ship.fuel <= 0) { r.warning = 'PROPELLANT EXHAUSTED (I: boosted drive)'; r.warnLevel = 1; }
  }
}

/**
 * Angular velocity (rad/s, world) of a Solar System body: its IAU rotation rate about its pole, the
 * orbital rate for a tidally locked moon, or its catalogued period.
 */
export function spinOf(b: Body, out: Vector3): Vector3 {
  const e = b.orientation.elements;
  const pole = _p.set(e[8], e[9], e[10]).normalize();
  if (b.rotation) return out.copy(pole).multiplyScalar((b.rotation.pm[1] ?? 0) * (Math.PI / 180) / DAY);
  if (b.kind === 'moon' && b.parent) {
    const r = _r.copy(b.pos).sub(b.parent.pos), v = _w.copy(b.vel).sub(b.parent.vel);
    return out.crossVectors(r, v).divideScalar(r.lengthSq());
  }
  const h = b.meta.rotPeriodHours as number | undefined;
  return h ? out.copy(pole).multiplyScalar((2 * Math.PI) / (h * 3600)) : out.set(0, 0, 0);
}
const _p = new Vector3();
const _r = new Vector3();
const _w = new Vector3();

const SAS_LABEL: Record<SasMode, string> = {
  off: 'off', stability: 'hold attitude', prograde: 'prograde', retrograde: 'retrograde', normal: 'normal', antinormal: 'anti-normal',
  'radial-out': 'radial out', 'radial-in': 'radial in', target: 'target', 'anti-target': 'anti-target',
};
export function sasLabel(m: SasMode): string {
  return SAS_LABEL[m];
}

export function fmtSpeed(v: number): string {
  const a = Math.abs(v);
  if (a < 1000) return `${v.toFixed(a < 100 ? 1 : 0)} m/s`;
  if (a < 0.01 * 299792458) return `${(v / 1000).toFixed(a < 1e5 ? 2 : 0)} km/s`;
  return `${(v / 299792458).toFixed(3)} c`;
}

export function fmtDist(m: number): string {
  const a = Math.abs(m);
  if (!Number.isFinite(m)) return '∞';
  if (a < 1e4) return `${m.toFixed(0)} m`;
  if (a < 1e9) return `${(m / 1e3).toLocaleString(undefined, { maximumFractionDigits: a < 1e6 ? 1 : 0 })} km`;
  if (a < 0.05 * AU) return `${(m / 1e9).toFixed(2)} Gm`;
  return `${(m / AU).toFixed(3)} AU`;
}

export function fmtTime(s: number): string {
  if (!Number.isFinite(s)) return '—';
  const neg = s < 0; s = Math.abs(s);
  let out: string;
  if (s < 60) out = `${s.toFixed(s < 10 ? 1 : 0)} s`;
  else if (s < 3600) out = `${Math.floor(s / 60)} min ${Math.floor(s % 60)} s`;
  else if (s < 86400) out = `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min`;
  else if (s < 86400 * 400) out = `${Math.floor(s / 86400)} d ${Math.floor((s % 86400) / 3600)} h`;
  else out = `${(s / 3.15576e7).toFixed(2)} yr`;
  return neg ? `-${out}` : out;
}

export function fmtClock(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d > 0 ? `${d}d ` : ''}${p(h)}:${p(m)}:${p(sec)}`;
}

const _q = new Quaternion();
const _v = new Vector3();
const _zero = new Vector3();
