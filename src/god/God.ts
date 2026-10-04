import { Vector3 } from 'three';
import { SUN_ABS_MAG, SUN_TEFF } from '../core/units';
import type { App } from '../app/App';
import { Body, type SpaceObject } from '../universe/Body';
import { BlackHole } from '../universe/BlackHoles';
import { ALBEDO, ExoPlanet, type PlanetSpec, PlanetarySystem, type PlanetType, REARTH } from '../universe/Planets';
import { CatalogStar } from '../universe/Stars';
import { GodAudio } from './GodAudio';
import { GodLayer } from './GodLayer';
import { GodPanel } from './GodPanel';
import { GodVR } from './GodVR';
import { mainSequence as physicsMainSequence } from './physics';
import { FLAG_BLACK_HOLE, FLAG_RIGID, FLAG_STAR } from './NBody';
import { type Entity, Sandbox, type SpawnSpec } from './Sandbox';

export const G = 6.6743e-11;
export const M_SUN = 1.98892e30;
export const M_EARTH = 5.9722e24;
export const GM_EARTH = 3.986004418e14;
export const GM_SUN = 1.32712440041e20;
/** a throw is capped at this many times the local escape speed */
const MAX_THROW = 3;

/** Spawnable things, with their default mass and look. */
export type SpawnType = SpawnSpec['type'];
export const SPAWN_TYPES: { type: SpawnType; label: string; unit: 'earth' | 'sun'; mass: number }[] = [
  { type: 'rocky', label: 'Rocky planet', unit: 'earth', mass: 0.5 },
  { type: 'terran', label: 'Earth-like planet', unit: 'earth', mass: 1 },
  { type: 'ocean', label: 'Ocean world', unit: 'earth', mass: 2 },
  { type: 'ice', label: 'Ice world', unit: 'earth', mass: 0.3 },
  { type: 'lava', label: 'Lava world', unit: 'earth', mass: 1.5 },
  { type: 'giant', label: 'Gas giant', unit: 'earth', mass: 318 },
  { type: 'moon', label: 'Moon', unit: 'earth', mass: 0.0123 },
  { type: 'star', label: 'Star', unit: 'sun', mass: 1 },
  { type: 'hole', label: 'Black hole', unit: 'sun', mass: 10 },
  { type: 'swarm', label: 'Asteroid swarm', unit: 'earth', mass: 0 },
];

/** Radius (m) of a planet of `massEarth` Earth masses and a type (rough mass-radius relations). */
export function planetRadius(type: SpawnType, massEarth: number): number {
  if (type === 'giant') return REARTH * Math.min(11.2 * Math.pow(Math.max(massEarth, 1) / 318, 0.06), 13) * (massEarth < 50 ? Math.pow(massEarth / 50, 0.5) * 0.9 + 0.1 : 1);
  if (type === 'ice' || type === 'ocean') return REARTH * 1.1 * Math.pow(massEarth, 0.28);
  return REARTH * Math.pow(massEarth, 0.27);
}

/** Main-sequence star from its mass (Suns): luminosity (Suns), radius (m), Teff (K) (src/god/physics.ts). */
export function mainSequence(massSun: number): { lum: number; radius: number; teff: number } {
  const ms = physicsMainSequence(massSun);
  return { lum: ms.lum.value, radius: ms.radius.value, teff: ms.teff.value };
}

const TYPE_LOOK: Record<string, { type: PlanetType; teq: number }> = {
  rocky: { type: 'hot', teq: 420 }, terran: { type: 'terran', teq: 260 }, ocean: { type: 'ocean', teq: 265 }, ice: { type: 'ice', teq: 110 },
  lava: { type: 'lava', teq: 1300 }, giant: { type: 'giant', teq: 120 }, moon: { type: 'hot', teq: 400 },
};

/** A spawned planet drawn by the exoplanet layer: its own one-planet system lit by the brightest star. */
class SandboxSystem extends PlanetarySystem {
  constructor(host: CatalogStar, spec: PlanetSpec, readonly entity: Entity) {
    super(host, [spec], false, entity.spin.axis);
    (this as unknown as { planets: ExoPlanet[] }).planets = [new SandboxPlanet(spec, this, 0, entity)];
  }
  /** positions come from the sandbox */
  override update(): void { /* set by God.writeProxies */ }
  override position(_s: PlanetSpec, _jd: number, out: Vector3): Vector3 { return out.copy(this.planets[0].rel); }
}

class SandboxPlanet extends ExoPlanet {
  constructor(spec: PlanetSpec, system: SandboxSystem, i: number, readonly entity: Entity) { super(spec, system, i); }
  override info(): [string, string][] {
    const e = this.entity;
    const me = e.gm / GM_EARTH;
    return [
      ['Type', `Created in God mode: ${SPAWN_TYPES.find((t) => t.type === e.spawn?.type)?.label ?? 'planet'}`],
      ['Mass', me > 100 ? `${(me / 317.8).toFixed(2)} Jupiter masses` : `${me.toPrecision(3)} Earth masses`],
      ['Radius', `${(e.radius / 1e3).toLocaleString(undefined, { maximumFractionDigits: 0 })} km`],
    ];
  }
}

interface Proxy { system?: SandboxSystem; star?: CatalogStar; hole?: BlackHole }

/**
 * God mode: the N-body sandbox (src/god/Sandbox.ts) wired into the app: drawables for spawned
 * planets, stars and black holes, the overlays (GodLayer), the desktop panel (GodPanel), sounds,
 * and the mouse tools (velocity handle, moving bodies, placing new ones).
 */
export class God {
  readonly sandbox: Sandbox;
  readonly layer: GodLayer;
  readonly panel: GodPanel;
  readonly audio = new GodAudio();
  /** headset: grip grab-and-throw, laser placement */
  readonly vr: GodVR;
  private proxies = new Map<number, Proxy>();
  private lights = new Map<number, CatalogStar>();
  /** desktop tool in use */
  tool: 'none' | 'move' | 'place' = 'none';
  placeType: SpawnType = 'terran';
  placeMass = 1;
  private drag: { kind: 'arrow' | 'move' | 'place'; id: number; start: Vector3; plane: Vector3; at: Vector3; startX: number; startY: number; t0: number } | null = null;

  constructor(readonly app: App) {
    this.sandbox = new Sandbox(app.system);
    this.layer = new GodLayer(this.sandbox);
    this.sandbox.hooks = {
      create: (e) => this.createProxy(e),
      destroy: (e) => this.destroyProxy(e),
      changed: (e) => this.changedProxy(e),
    };
    this.panel = new GodPanel(this);
    this.vr = new GodVR(this);
    this.bindPointer();
  }

  get active(): boolean { return this.sandbox.active; }

  // ---------------------------------------------------------------- frame

  /** Time step: returns the JD to show (the simulation's when the sandbox runs). */
  frameTime(jd: number, rawDt: number): number {
    const c = this.app.clock;
    const shown = this.sandbox.update(jd, c.rate, c.paused, rawDt);
    // spawned drawables move with their bodies before the camera follows them
    if (this.sandbox.active) this.writeProxies();
    return shown;
  }

  /** After the frame's objects moved: proxies, overlays, effects, panel. */
  update(dt: number): void {
    const sb = this.sandbox;
    if (sb.active) {
      this.app.orbits.group.visible = false;
      for (const fx of sb.effects) {
        this.layer.addEffect(fx);
        if (fx.event.kind !== 'impact') {
          this.audio.boom(fx.event.kind === 'swallow' ? 0.9 : Math.min(1, 0.4 + Math.log10(1 + fx.event.gm / 1e12) / 6), fx.event.kind === 'swallow');
          const n = (e: Entity | null) => e?.name ?? 'something';
          const msg = fx.event.kind === 'merge' ? `${n(fx.victim)} hit ${n(fx.survivor)}` : fx.event.kind === 'swallow' ? `${n(fx.survivor)} swallowed ${n(fx.victim)}`
            : `${n(fx.victim)} was torn apart by ${n(fx.survivor)}'s tides`;
          this.app.hud.toast(msg, 3);
        }
      }
      sb.effects = [];
      const sel = this.entityOf(this.app.selection);
      this.layer.selected = sel;
      const anchor = this.entityOf(this.app.rig.anchor);
      this.layer.focusPrimary = anchor ? (anchor.mode === 'massive' && anchor.kind === 'body' && anchor.body?.kind !== 'moon' ? anchor : sb.primaryOf(anchor)) : null;
    } else {
      this.app.orbits.group.visible = true;
    }
    const cam = this.app.rig.upos;
    const camV = cam.toVector3();
    this.layer.update(cam, (p) => p.distanceTo(camV));
    this.panel.update(dt);
  }

  // ---------------------------------------------------------------- selection

  /** The sandbox entity behind a selectable object (a Body, a spawned planet/star/hole). */
  entityOf(obj: SpaceObject | null): Entity | null {
    if (!obj || !this.sandbox.active) return null;
    const id = this.idOf(obj);
    return id === null ? null : this.sandbox.entityOf(id);
  }

  /** Id of an object God mode can change (Solar System bodies even before the sandbox starts). */
  idOf(obj: SpaceObject | null): number | null {
    if (!obj) return null;
    if (obj instanceof Body) return obj.valid ? obj.id : null;
    if (obj instanceof SandboxPlanet) return obj.entity.id;
    for (const [id, p] of this.proxies) if (p.star === obj || p.hole === obj) return id;
    return null;
  }

  /** The object to select for an entity (its drawable). */
  objectOf(e: Entity): SpaceObject | null {
    const p = this.proxies.get(e.id);
    return p?.system?.planets[0] ?? p?.star ?? p?.hole ?? e.body;
  }

  isGodStar(obj: SpaceObject | null): boolean {
    for (const p of this.proxies.values()) if (p.star === obj) return true;
    return false;
  }

  /** Planet systems to draw (spawned planets). */
  systems(): PlanetarySystem[] {
    const out: PlanetarySystem[] = [];
    for (const p of this.proxies.values()) if (p.system) out.push(p.system);
    return out;
  }

  /** Spawned stars, for the near-star layer. */
  stars(): CatalogStar[] {
    const out: CatalogStar[] = [];
    for (const p of this.proxies.values()) if (p.star) out.push(p.star);
    return out;
  }

  // ---------------------------------------------------------------- proxies

  private createProxy(e: Entity): void {
    const spec = e.spawn;
    if (!spec) return;
    if (e.kind === 'planet') {
      const look = TYPE_LOOK[spec.type] ?? TYPE_LOOK.rocky;
      let type = look.type;
      if (spec.type === 'moon') type = spec.seed % 2 < 1 ? 'ice' : 'hot';
      const host = new CatalogStar(`god:${e.id}`, new Vector3(), SUN_ABS_MAG, SUN_TEFF, 'G2V', ['Sun'], null);
      host.exact = true;
      this.lights.set(e.id, host);
      const ps: PlanetSpec = {
        name: e.name, real: false, est: [], aM: 1.5e11, e: 0, inc: 0, node: 0, omega: 0, M0: 0, periodS: 3e7,
        radiusM: e.radius, massKg: e.gm / G, teqK: look.teq, type, albedo: ALBEDO[type], rings: !!spec.rings, seed: spec.seed,
        rotS: e.spin.rate !== 0 ? (2 * Math.PI) / e.spin.rate : Infinity,
      };
      this.proxies.set(e.id, { system: new SandboxSystem(host, ps, e) });
      if (e.body) { e.body.albedo = ALBEDO[type]; e.body.color = [0.6, 0.6, 0.6]; }
    } else if (e.kind === 'star') {
      const st = this.makeStar(e);
      this.proxies.set(e.id, { star: st });
      if (e.body) { e.body.teff = st.teff; e.body.absMag = st.absMag; }
    } else if (e.kind === 'hole') {
      const hole = this.makeHole(e);
      this.proxies.set(e.id, { hole });
      this.app.blackHoles.push(hole);
    }
  }

  private makeStar(e: Entity): CatalogStar {
    const ms = mainSequence(e.gm / GM_SUN);
    const absMag = SUN_ABS_MAG - 2.5 * Math.log10(ms.lum);
    const spect = ms.teff > 30000 ? 'O' : ms.teff > 10000 ? 'B' : ms.teff > 7500 ? 'A' : ms.teff > 6000 ? 'F' : ms.teff > 5200 ? 'G' : ms.teff > 3700 ? 'K' : 'M';
    const st = new CatalogStar(`god:${e.id}`, new Vector3(), absMag, ms.teff, `${spect}V`, [e.name], null);
    st.exact = true;
    e.radius = st.radius;
    return st;
  }

  private makeHole(e: Entity): BlackHole {
    const massSun = e.gm / GM_SUN;
    const rs = (2 * e.gm) / (299_792_458 ** 2);
    const h = new BlackHole(this.app.blackHoles.length, {
      name: e.name, aliases: [], kind: massSun > 1e5 ? 'supermassive' : 'stellar', raDeg: 0, decDeg: 0, distPc: 1e-6,
      massSun, diskOuterM: rs * 300, ref: 'created in God mode',
    });
    (h as unknown as { key: string }).key = `god:${e.id}`;
    return h;
  }

  private destroyProxy(e: Entity): void {
    const p = this.proxies.get(e.id);
    if (!p) return;
    if (p.hole) {
      const i = this.app.blackHoles.indexOf(p.hole);
      if (i >= 0) this.app.blackHoles.splice(i, 1);
    }
    if (this.app.selection && (this.app.selection === p.star || this.app.selection === p.hole || this.app.selection === p.system?.planets[0])) this.app.select(null);
    if (this.app.rig.anchor && (this.app.rig.anchor === p.system?.planets[0] || this.app.rig.anchor === p.star)) this.app.rig.setAnchor(null);
    this.proxies.delete(e.id);
    this.lights.delete(e.id);
  }

  /** Mass or size changed: rebuild what depends on it. */
  private changedProxy(e: Entity): void {
    const p = this.proxies.get(e.id);
    if (!p) return;
    const sel = this.app.selection;
    const wasSel = sel === p.star || sel === p.hole || sel === p.system?.planets[0];
    if (p.system && Math.abs(p.system.planets[0].radius - e.radius) > 1e-3 * e.radius) { this.destroyProxy(e); this.createProxy(e); }
    else if (p.star && Math.abs(mainSequence(e.gm / GM_SUN).lum - 10 ** (-0.4 * (p.star.absMag - SUN_ABS_MAG))) > 1e-3) { this.destroyProxy(e); this.createProxy(e); }
    else if (p.hole && Math.abs(p.hole.massSun - e.gm / GM_SUN) > 1e-6 * p.hole.massSun) { this.destroyProxy(e); this.createProxy(e); }
    else return;
    if (wasSel) { const o = this.objectOf(e); if (o) this.app.select(o); }
  }

  /** Place the drawables where the simulation has them; light each planet by its brightest star. */
  private writeProxies(): void {
    const stars: { e: Entity; lum: number; teff: number; absMag: number }[] = [];
    for (const e of this.sandbox.entities.values()) {
      if (e.flags & FLAG_STAR && e.body) stars.push({ e, lum: 10 ** (-0.4 * (e.body.absMag - SUN_ABS_MAG)), teff: e.body.teff, absMag: e.body.absMag });
    }
    for (const [id, p] of this.proxies) {
      const e = this.sandbox.entityOf(id);
      if (!e) continue;
      if (p.star) p.star.upos.set(e.pos.x, e.pos.y, e.pos.z);
      if (p.hole) p.hole.upos.set(e.pos.x, e.pos.y, e.pos.z);
      if (p.system) {
        const host = this.lights.get(id)!;
        let best = stars[0], bestE = -1;
        for (const s of stars) { const E = s.lum / Math.max(s.e.pos.distanceToSquared(e.pos), 1); if (E > bestE) { bestE = E; best = s; } }
        if (best) {
          host.upos.set(best.e.pos.x, best.e.pos.y, best.e.pos.z);
          (host as unknown as { absMag: number; teff: number }).absMag = best.absMag;
          (host as unknown as { absMag: number; teff: number }).teff = best.teff;
        } else host.upos.set(e.pos.x + 1e20, e.pos.y, e.pos.z);
        const pl = p.system.planets[0];
        pl.upos.set(e.pos.x, e.pos.y, e.pos.z);
        pl.rel.copy(e.pos).sub(host.upos.toVector3());
        p.system.n.copy(e.spin.axis);
        pl.spec.rotS = e.spin.rate !== 0 ? (2 * Math.PI) / e.spin.rate : 1e30;
      }
    }
  }

  // ---------------------------------------------------------------- actions (desktop panel and VR menu)

  /** The selected thing's id (Solar System bodies count before the sandbox starts). */
  selectedId(): number | null { return this.idOf(this.app.selection); }

  ensureActive(): void {
    if (!this.sandbox.active) {
      this.sandbox.start(this.app.clock.jdTdb);
      this.app.hud.toast('Sandbox: the universe is now simulated (Reset returns to the real one)', 3);
    }
  }

  scaleMass(id: number, k: number): void {
    this.ensureActive();
    const e = this.sandbox.entityOf(id);
    if (e) this.sandbox.setMass(id, e.gm * k);
  }
  setMass(id: number, gm: number): void { this.setPhysical(id, { massKg: gm / G }); }

  /** Create panel: orbit radius of a new thing, and its unit */
  placeA = 1;
  placeAUnit: 'AU' | 'km' = 'AU';

  /** N-body simulation on (from the universe as it is) or off (everything continues on Kepler orbits). */
  setSimulation(on: boolean): void {
    this.ensureActive();
    this.sandbox.setMode(on ? 'nbody' : 'kepler');
    this.app.hud.toast(on ? 'Simulating gravity: every body pulls on every other' : 'Kepler orbits: each body on its exact two-body orbit', 2.5);
  }

  /** Create something on a circular orbit of radius `a` (m) about the selection (or the Sun), at a random place on it. */
  spawnOnOrbit(type: SpawnType, mass: number, a: number): number | null {
    this.ensureActive();
    const app = this.app;
    const selE = this.entityOf(app.selection);
    const center = selE ?? this.sandbox.entityOf(10);
    if (!center) return null;
    // in the plane of the centre's own orbit (the ecliptic for the Sun)
    const pp = this.sandbox.primaryOf(center);
    let n = new Vector3(0, -0.3977771559, 0.9174820621);
    if (pp && center !== pp) { const h = center.pos.clone().sub(pp.pos).cross(center.vel.clone().sub(pp.vel)); if (h.lengthSq() > 0) n = h.normalize(); }
    const u = new Vector3(1, 0, 0).cross(n).normalize();
    const w = n.clone().cross(u);
    const th = Math.random() * Math.PI * 2;
    const pos = center.pos.clone().addScaledVector(u, a * Math.cos(th)).addScaledVector(w, a * Math.sin(th));
    const gm = type === 'star' || type === 'hole' ? mass * GM_SUN : mass * GM_EARTH;
    const vc = Math.sqrt((center.gm + gm) / a);
    const vel = center.vel.clone().addScaledVector(n.clone().cross(pos.clone().sub(center.pos)).normalize(), vc);
    const id = this.spawn(type, mass, pos, vel, center.id);
    if (id !== null) this.selectEntity(id);
    return id;
  }

  /** Which of mass, radius and density follows when one of the others is changed. */
  derive: 'density' | 'mass' | 'radius' = 'density';

  /** Current mass (kg), mean radius, polar radius (m) of a selectable thing (before the sandbox starts too). */
  bulk(id: number): { massKg: number; radius: number; rpol: number; req: number } | null {
    const e = this.sandbox.entityOf(id);
    const b = e?.body ?? this.app.system.byId.get(id) ?? null;
    const gm = e?.gm ?? b?.gm ?? 0;
    const R = e?.radius ?? b?.radius ?? 0;
    if (!R) return null;
    const req = b ? (b.radii[0] + b.radii[1]) / 2 : R;
    const rpol = b ? b.radii[2] : R;
    return { massKg: gm / G, radius: R, rpol, req };
  }

  /**
   * Linked mass / radius / density: change one (or the polar radius) and the one chosen in
   * `derive` follows, the other stays.
   */
  setPhysical(id: number, ch: { massKg?: number; radius?: number; densityKgM3?: number; rpol?: number }): void {
    const cur = this.bulk(id);
    if (!cur) return;
    let M = cur.massKg, R = cur.radius;
    const rho = M / ((4 / 3) * Math.PI * R ** 3);
    if (ch.massKg !== undefined) { M = ch.massKg; if (this.derive === 'radius') R = Math.cbrt((3 * M) / (4 * Math.PI * rho)); }
    if (ch.radius !== undefined) { R = ch.radius; if (this.derive === 'mass') M = rho * (4 / 3) * Math.PI * R ** 3; }
    if (ch.densityKgM3 !== undefined) {
      if (this.derive === 'radius') R = Math.cbrt((3 * M) / (4 * Math.PI * ch.densityKgM3));
      else M = ch.densityKgM3 * (4 / 3) * Math.PI * R ** 3;
    }
    this.ensureActive();
    this.sandbox.setMass(id, M * G, R, ch.rpol);
  }

  /** Rotation: sidereal period (s, > 0) and direction. */
  setRotation(id: number, periodS: number, retrograde: boolean): void {
    this.ensureActive();
    if (periodS > 0) this.sandbox.setSpin(id, ((retrograde ? -1 : 1) * 2 * Math.PI) / periodS, null);
  }

  /** Orbital elements (Kepler mode; in the N-body mode the body is put on that orbit's state). */
  setOrbit(id: number, ch: Parameters<Sandbox['setOrbit']>[1]): void {
    this.ensureActive();
    this.sandbox.setOrbit(id, ch);
  }
  scaleRadius(id: number, k: number): void {
    this.ensureActive();
    const e = this.sandbox.entityOf(id);
    if (e) this.sandbox.setRadius(id, e.radius * k);
  }
  setRadius(id: number, r: number): void { this.ensureActive(); this.sandbox.setRadius(id, r); }
  preset(id: number, what: Parameters<Sandbox['preset']>[1]): void { this.ensureActive(); this.sandbox.preset(id, what); }
  remove(id: number): void {
    this.ensureActive();
    const e = this.sandbox.entityOf(id);
    if (!e) return;
    const name = e.name;
    if (this.app.selection && this.idOf(this.app.selection) === id) this.app.select(null);
    if (this.app.rig.anchor && this.idOf(this.app.rig.anchor) === id) this.app.rig.setAnchor(null);
    this.sandbox.remove(id);
    this.audio.poof();
    this.app.hud.toast(`${name} deleted`, 2);
  }
  /** Spin: multiply the rate, reverse it, or tilt the axis to `tiltDeg` from the orbit normal. */
  spin(id: number, op: 'faster' | 'slower' | 'reverse' | 'stop' | { tiltDeg: number }): void {
    this.ensureActive();
    const e = this.sandbox.entityOf(id);
    if (!e) return;
    const rate = e.spin.locked ? null : e.spin.rate;
    if (op === 'faster' || op === 'slower' || op === 'reverse' || op === 'stop') {
      const base = rate ?? this.orbitalRate(e);
      const nr = op === 'faster' ? base * 2 : op === 'slower' ? base / 2 : op === 'reverse' ? -base : 0;
      this.sandbox.setSpin(id, nr, null);
    } else {
      const { r, v } = this.sandbox.relative(e);
      const n = r.clone().cross(v).normalize();
      if (n.lengthSq() < 0.5) n.set(0, 0, 1);
      const cur = e.spin.axis.clone();
      // tilt within the plane of the orbit normal and the current axis (or towards the primary)
      let side = cur.clone().addScaledVector(n, -cur.dot(n));
      if (side.lengthSq() < 1e-6) side = r.clone().normalize();
      side.normalize();
      const a = (op.tiltDeg * Math.PI) / 180;
      this.sandbox.setSpin(id, null, n.multiplyScalar(Math.cos(a)).addScaledVector(side, Math.sin(a)).normalize());
    }
  }
  private orbitalRate(e: Entity): number {
    const { r, v } = this.sandbox.relative(e);
    return r.lengthSq() > 0 ? r.clone().cross(v).length() / r.lengthSq() : 0;
  }
  setVelocity(id: number, v: Vector3): void { this.ensureActive(); this.sandbox.setVelocity(id, v); }
  setPosition(id: number, p: Vector3, v?: Vector3): void { this.ensureActive(); this.sandbox.setPosition(id, p, v); }

  undo(): void {
    if (this.sandbox.undo()) this.app.hud.toast('Undone', 1.2);
    else this.app.hud.toast('Nothing to undo', 1.2);
  }
  reset(): void {
    if (!this.sandbox.active) return;
    this.app.select(this.app.selection instanceof Body && this.app.selection.hidden ? null : this.app.selection);
    this.sandbox.reset();
    this.layer.clear();
    this.proxies.clear();
    this.lights.clear();
    for (const h of [...this.app.blackHoles]) if (h.key.startsWith('god:')) this.app.blackHoles.splice(this.app.blackHoles.indexOf(h), 1);
    this.app.hud.toast('Back to the real universe (JPL ephemeris)', 2.5);
  }

  /**
   * Create something at `pos` (barycentric m): moving `vel` if given, else on a circular orbit
   * about the dominant body there. Returns the new entity's id.
   */
  spawn(type: SpawnType, massValue: number, pos: Vector3, vel?: Vector3, parentId?: number): number | null {
    this.ensureActive();
    const sb = this.sandbox;
    const info = SPAWN_TYPES.find((t) => t.type === type)!;
    const seed = Math.floor(Math.random() * 1e6);
    const count = [...sb.entities.values()].filter((e) => e.spawn?.type === type).length + 1;
    if (type === 'swarm') {
      // an asteroid swarm: test particles in a little cloud on (roughly) the same orbit
      const v0 = vel ?? sb.circularVelocity(pos);
      const p = sb.primaryAt(pos);
      const spread = Math.max(pos.distanceTo(p?.pos ?? new Vector3()) * 0.01, 2e6);
      const dv = v0.clone().sub(p?.vel ?? new Vector3()).length() * 0.01;
      let first: number | null = null;
      sb.edit(() => undefined); // one undo step for the whole swarm
      const st = sb.capture();
      for (let i = 0; i < 60; i++) {
        const id = (sb as unknown as { nextId: number }).nextId++;
        first ??= id;
        const rnd = () => new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        const pp = pos.clone().addScaledVector(rnd(), spread);
        const vv = v0.clone().addScaledVector(rnd(), dv);
        st.entities.push({ id, kind: 'swarm', name: `Swarm ${count} #${i + 1}`, mode: 'test', gm: 0, radius: 5e3, flags: 0,
          x: pp.x, y: pp.y, z: pp.z, vx: vv.x, vy: vv.y, vz: vv.z,
          spin: { ax: 0, ay: 0, az: 1, rate: 0, locked: false, base: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }, spawn: { type: 'swarm', seed: seed + i } });
      }
      st.nextId = (sb as unknown as { nextId: number }).nextId;
      for (const r of st.entities) if (r.kind === 'swarm' && !r.orbit) sb.fitOrbit(r, p?.id ?? null);
      sb.applyState(st);
      this.audio.whoosh();
      return first;
    }
    const gm = type === 'star' || type === 'hole' ? massValue * GM_SUN : massValue * GM_EARTH;
    const v = vel ?? sb.circularVelocity(pos, gm);
    let radius: number, kind: Entity['kind'], flags = 0;
    if (type === 'star') { radius = mainSequence(massValue).radius; kind = 'star'; flags = FLAG_STAR; }
    else if (type === 'hole') { radius = (2 * gm) / (299_792_458 ** 2); kind = 'hole'; flags = FLAG_BLACK_HOLE | FLAG_RIGID; }
    else { radius = planetRadius(type, massValue); kind = 'planet'; }
    const name = `${type === 'hole' ? 'Black hole' : type === 'star' ? 'Star' : info.label} ${count}`;
    const spec: SpawnSpec = { type, seed, rings: type === 'giant' && Math.random() < 0.5 };
    if (type === 'star') { const ms = mainSequence(massValue); spec.teff = ms.teff; spec.lum = ms.lum; }
    const id = sb.spawn(kind, name, spec, gm, radius, pos, v, flags, parentId);
    this.audio.whoosh();
    return id;
  }

  /** Point on the plane through the dominant body (its orbital plane) under the screen point. */
  placeAt(x: number, y: number): Vector3 | null {
    return this.placeOnRay(this.app.rig.upos.toVector3(), this.screenRay(x, y));
  }

  /** Point on the plane of the selection's orbit along a ray (absolute origin, unit direction). */
  placeOnRay(cam: Vector3, dir: Vector3): Vector3 | null {
    const app = this.app;
    const sel = this.entityOf(app.selection) ?? this.entityOf(app.rig.anchor);
    const ref = sel ? (sel.kind === 'body' && sel.body?.kind === 'star' ? sel : this.sandbox.primaryOf(sel) ?? sel) : null;
    const center = ref?.pos ?? (app.selection ? app.selection.upos.toVector3() : app.system.sun.pos.clone());
    // the plane: the reference body's orbit plane (the ecliptic for the Sun)
    const n = new Vector3(0, -0.3977771559, 0.9174820621);
    if (ref) {
      const pp = this.sandbox.primaryOf(ref);
      if (pp) { const h = ref.pos.clone().sub(pp.pos).cross(ref.vel.clone().sub(pp.vel)); if (h.lengthSq() > 0) n.copy(h.normalize()); }
    }
    const denom = dir.dot(n);
    const toC = center.clone().sub(cam);
    if (Math.abs(denom) > 0.08) {
      const t = toC.dot(n) / denom;
      if (t > 0) return cam.clone().addScaledVector(dir, t);
    }
    // looking along the plane: at the reference body's distance
    return cam.clone().addScaledVector(dir, toC.length());
  }

  screenRay(x: number, y: number): Vector3 {
    const v = this.app.view;
    const t = Math.tan((v.fovY * Math.PI) / 360);
    const nx = (x / v.width) * 2 - 1, ny = -((y / v.height) * 2 - 1);
    return new Vector3(nx * t * v.aspect, ny * t, -1).normalize().applyQuaternion(v.quat);
  }

  /** Select an entity's drawable. */
  selectEntity(id: number): void {
    const ent = this.sandbox.entityOf(id);
    if (ent && ent.kind !== 'swarm') { const o = this.objectOf(ent); if (o) this.app.select(o); }
  }

  /**
   * Drop a grabbed body at `at` moving with `shown` (m/s of what is seen, real time): divided by
   * the time rate and kept below a few times the local escape speed.
   */
  drop(id: number, at: Vector3, shown: Vector3): void {
    const e = this.sandbox.entityOf(id);
    if (!e) return;
    const c = this.app.clock;
    const rate = c.paused ? 1 : Math.max(1, Math.abs(c.rate));
    const p = this.sandbox.primaryAt(at, e.gm);
    const rel = shown.clone().divideScalar(rate);
    const vEsc = p ? Math.sqrt((2 * p.gm) / Math.max(at.distanceTo(p.pos), 1)) : 3e4;
    if (rel.length() > MAX_THROW * vEsc) rel.setLength(MAX_THROW * vEsc);
    // a gentle drop keeps it on a circular orbit there; a throw adds the hand's speed to the primary's
    const vel = rel.length() < 0.05 * vEsc ? this.sandbox.circularVelocity(at, e.gm) : rel.add(p?.vel ?? new Vector3());
    this.setPosition(id, at, vel);
    this.audio.whoosh();
  }

  /** Create the chosen thing a little way from the selection, on a circular orbit about it. */
  spawnNearSelection(type: SpawnType, mass: number): number | null {
    const app = this.app;
    const sel = app.selection;
    const center = sel ? sel.upos.toVector3() : app.system.sun.pos.clone();
    // around a planet: well outside it (a moon); a star or hole: a third of an AU away
    const r = sel ? Math.max((sel.radius || 1e6) * 8, type === 'star' || type === 'hole' ? 0.3 * 1.496e11 : 0) : 1.496e11;
    let dir = this.screenRay(app.view.width * 0.65, app.view.height * 0.5).sub(this.screenRay(app.view.width * 0.5, app.view.height * 0.5));
    if (dir.lengthSq() === 0) dir = new Vector3(1, 0, 0);
    const id = this.spawn(type, mass, center.addScaledVector(dir.normalize(), r));
    if (id !== null) this.selectEntity(id);
    return id;
  }

  // ---------------------------------------------------------------- mouse tools

  private bindPointer(): void {
    const el = this.app.input.element;
    el.addEventListener('pointerdown', (e) => this.pointerDown(e), { capture: true });
    el.addEventListener('pointermove', (e) => this.pointerMove(e), { capture: true });
    el.addEventListener('pointerup', (e) => this.pointerUp(e), { capture: true });
  }

  private pointerDown(e: PointerEvent): void {
    if (e.button !== 0 || this.app.vr?.active) return;
    const app = this.app;
    const cam = app.rig.upos.toVector3();
    const viewDir = new Vector3(0, 0, -1).applyQuaternion(app.view.quat);
    if (this.tool === 'place') {
      const at = this.placeAt(e.clientX, e.clientY);
      if (!at) return;
      this.drag = { kind: 'place', id: -1, start: at, plane: viewDir, at: at.clone(), startX: e.clientX, startY: e.clientY, t0: performance.now() };
      e.stopImmediatePropagation();
      return;
    }
    const sel = this.entityOf(app.selection);
    // the velocity handle's tip
    if (sel && this.layer.tipVisible) {
      const p = app.project(this.layer.tip);
      if (p && Math.hypot(p.x - e.clientX, p.y - e.clientY) < 14) {
        this.drag = { kind: 'arrow', id: sel.id, start: this.layer.tip.clone().add(cam), plane: viewDir, at: this.layer.tip.clone().add(cam), startX: e.clientX, startY: e.clientY, t0: performance.now() };
        e.stopImmediatePropagation();
        return;
      }
    }
    if (this.tool === 'move') {
      const id = this.idOf(app.selection);
      if (id === null) return;
      this.ensureActive();
      const ent = this.sandbox.entityOf(id);
      if (!ent) return;
      const p = app.project(ent.pos.clone().sub(cam));
      if (!p || Math.hypot(p.x - e.clientX, p.y - e.clientY) > 60) return;
      this.drag = { kind: 'move', id, start: ent.pos.clone(), plane: viewDir, at: ent.pos.clone(), startX: e.clientX, startY: e.clientY, t0: performance.now() };
      e.stopImmediatePropagation();
    }
  }

  /** Point under the cursor on the plane through `through` facing the view. */
  private onPlane(x: number, y: number, through: Vector3, normal: Vector3): Vector3 {
    const cam = this.app.rig.upos.toVector3();
    const dir = this.screenRay(x, y);
    const t = through.clone().sub(cam).dot(normal) / Math.max(dir.dot(normal), 1e-6);
    return cam.addScaledVector(dir, t);
  }

  private pointerMove(e: PointerEvent): void {
    const d = this.drag;
    if (!d) return;
    e.stopImmediatePropagation();
    d.at = this.onPlane(e.clientX, e.clientY, d.start, d.plane);
    if (d.kind === 'arrow') {
      const ent = this.sandbox.entityOf(d.id);
      if (!ent) return;
      this.layer.previewVel = this.arrowVelocity(ent, d.at);
    } else if (d.kind === 'move') {
      const ent = this.sandbox.entityOf(d.id);
      if (ent) this.layer.movePreview = { e: ent, at: d.at.clone() };
    } else if (d.kind === 'place') {
      this.layer.placePreview = { from: d.start.clone(), to: d.at.clone() };
    }
  }

  private arrowVelocity(ent: Entity, tipWorld: Vector3): Vector3 {
    const p = this.sandbox.primaryOf(ent);
    const vc = p ? Math.sqrt((p.gm + ent.gm) / Math.max(ent.pos.distanceTo(p.pos), 1)) : 1;
    const camDist = ent.pos.distanceTo(this.app.rig.upos.toVector3());
    const len = (this.layer.arrowScale * camDist) / vc;
    return tipWorld.clone().sub(ent.pos).divideScalar(len).add(p?.vel ?? new Vector3());
  }

  private pointerUp(e: PointerEvent): void {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    e.stopImmediatePropagation();
    this.layer.previewVel = null;
    this.layer.movePreview = null;
    this.layer.placePreview = null;
    const moved = Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 4;
    if (d.kind === 'arrow' && moved) {
      const ent = this.sandbox.entityOf(d.id);
      if (ent) this.setVelocity(d.id, this.arrowVelocity(ent, d.at));
    } else if (d.kind === 'move' && moved) {
      const ent = this.sandbox.entityOf(d.id);
      // dropped where it is, keeping its velocity relative to its new surroundings' primary
      if (ent) {
        const pOld = this.sandbox.primaryOf(ent);
        const relV = ent.vel.clone().sub(pOld?.vel ?? new Vector3());
        const pNew = this.sandbox.primaryAt(d.at, ent.gm);
        this.setPosition(d.id, d.at, relV.add(pNew?.vel ?? new Vector3()));
      }
    } else if (d.kind === 'place') {
      let vel: Vector3 | undefined;
      if (moved) {
        // thrown: the drag sets the speed relative to the local circular speed (drag length = view distance x 0.25 -> circular)
        const p = this.sandbox.primaryAt(d.start);
        const vc = p ? Math.sqrt(p.gm / Math.max(d.start.distanceTo(p.pos), 1)) : 1e4;
        const camDist = d.start.distanceTo(this.app.rig.upos.toVector3());
        vel = d.at.clone().sub(d.start).multiplyScalar(vc / (this.layer.arrowScale * camDist)).add(p?.vel ?? new Vector3());
      }
      const id = this.spawn(this.placeType, this.placeMass, d.start, vel);
      if (id !== null) {
        const ent = this.sandbox.entityOf(id);
        if (ent && ent.kind !== 'swarm') { const o = this.objectOf(ent); if (o) this.app.select(o); }
      }
      this.tool = 'none';
      this.panel.refresh();
    }
  }

  // ---------------------------------------------------------------- keys

  /** Keys while God mode's panel is open (true when handled). */
  onKey(e: KeyboardEvent): boolean {
    if (e.code === 'KeyY') { this.panel.toggle(); return true; }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { this.undo(); e.preventDefault(); return true; }
    if (!this.panel.open) return false;
    const id = this.selectedId();
    if ((e.code === 'Delete' || (e.code === 'Backspace' && e.shiftKey)) && id !== null) { this.remove(id); e.preventDefault(); return true; }
    return false;
  }

  /** Debug and test helpers. */
  debugState(): Record<string, unknown> {
    const sb = this.sandbox;
    return {
      active: sb.active, jd: sb.jd, entities: sb.entities.size, lagging: sb.lagging, stepsPerSecond: Math.round(sb.stepsPerSecond),
      holes: this.app.blackHoles.filter((h) => h.key.startsWith('god:')).length, canUndo: sb.canUndo,
    };
  }
}
