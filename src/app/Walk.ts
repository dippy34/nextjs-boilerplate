import {
  CustomBlending, DstColorFactor, Group, InstancedBufferAttribute, InstancedMesh, Matrix3, Matrix4, OneFactor, PlaneGeometry, Quaternion,
  ShaderMaterial, Vector3, ZeroFactor,
} from 'three';
import { FIX_LOGDEPTH, GLOBALS, PROJECT_PARS } from '../render/shaders/xr';
import { UPos } from '../core/upos';
import { Body, type SpaceObject } from '../universe/Body';
import { Landmark } from '../universe/Landmarks';
import { ExoPlanet, type PlanetType } from '../universe/Planets';
import type { App } from './App';

/**
 * Walking on the surface of a solid world: a first-person character controller in the world's
 * body-fixed frame (so the ground does not slide away as the world turns), with gravity from the
 * world's GM, ballistic jumps, a slope limit and the low-gravity lope.
 *
 * The physics (`WalkBody`) is independent of the app: the ground is a function returning the
 * ground radius below a body-fixed unit direction. `Walk` connects it to the app: the drawn
 * landing terrain (`TerrainPatch.below` / `groundRadius`), the camera rig, desktop keys and
 * mouse, VR controllers, a HUD line.
 */

export const G_NEWTON = 6.6743e-11;
/** eye height above the feet (m), standing and crouching */
export const EYE_STAND = 1.7;
export const EYE_CROUCH = 1.05;
export const WALK_SPEED = 1.4;
export const CROUCH_SPEED = 0.7;
/** steeper ground cannot be walked up: you slide down it */
export const SLOPE_LIMIT = (35 * Math.PI) / 180;
/** take-off speed of a standing jump (m/s): the legs push the same on any world */
export const JUMP_SPEED = 2.5;
/** a jump never rises higher than this (m) or faster than a small fraction of the escape velocity */
export const MAX_JUMP_HEIGHT = 25;
/** highest step (a rock, a ledge) walked up without jumping (m) */
export const STEP_UP = 0.4;
/** the walker's body radius for bumping into rocks (m) */
export const BODY_RADIUS = 0.25;
/** gravity below which running becomes a bounding lope (m/s²) */
export const LOPE_G = 5;
/** offered within this height of the ground (m); higher up, walking first flies down to land */
export const WALK_REACH = 100;

/** Surface gravity (m/s²) at distance r (m) from the centre of a world of gravitational parameter gm (m³/s²). */
export function gravityAt(gm: number, r: number): number {
  return r > 0 ? gm / (r * r) : 0;
}

/** Running speed (m/s): ~3.8 on Earth and Mars, ~2.9 on the Moon (traction limits it in low gravity). */
export function runSpeed(g: number): number {
  return Math.min(3.8, Math.max(2.6, 2.2 + 0.45 * g));
}

/** Horizontal acceleration the feet can give (m/s²): friction, so less in low gravity. */
export function traction(g: number): number {
  return Math.min(10, Math.max(1.5, 1.0 + 1.2 * g));
}

/** Take-off speed of a jump (m/s), limited so it never goes too high on a small world. */
export function jumpSpeed(g: number): number {
  return Math.min(JUMP_SPEED, Math.sqrt(2 * Math.max(g, 1e-6) * MAX_JUMP_HEIGHT));
}

/**
 * Take-off speed of a lope hop while running in low gravity (m/s). On the Moon this gives hops
 * about 0.6 s long and strides near 1.8 m, the gait of the Apollo films.
 */
export function hopSpeed(g: number): number {
  return Math.min(0.6, 0.3 * g);
}

/** Escape velocity (m/s). */
export function escapeSpeed(gm: number, r: number): number {
  return Math.sqrt((2 * gm) / Math.max(r, 1));
}

/** What the player asks for this step. */
export interface WalkIntent {
  /** wanted direction of motion: body-fixed, tangent to the ground, length 0..1 */
  wish: Vector3;
  run: boolean;
  crouch: boolean;
  /** a jump was asked for (kept for a short moment so a press just before landing counts) */
  jump: boolean;
}

/** Ground radius (m from the world's centre) below a body-fixed unit direction. */
export type GroundFn = (n: Vector3) => number;

const _t1 = new Vector3(), _t2 = new Vector3(), _n = new Vector3(), _up = new Vector3(), _vt = new Vector3(), _a = new Vector3(), _g = new Vector3();

/** Unit tangents t1, t2 at unit vertical `up` (any right-handed pair). */
function tangents(up: Vector3, t1: Vector3, t2: Vector3): void {
  if (Math.abs(up.z) < 0.9) t1.set(0, 0, 1); else t1.set(1, 0, 0);
  t1.cross(up).normalize();
  t2.crossVectors(up, t1);
}

/**
 * The walker's body: feet position and velocity in the world's body-fixed frame (m, m/s).
 * Integrates gravity exactly per step (constant over a step), so jump arcs are true parabolas.
 */
export class WalkBody {
  readonly pos = new Vector3();
  readonly vel = new Vector3();
  onGround = true;
  /** gravitational parameter of the world (m³/s²) */
  gm = 0;
  /** bound in low gravity while running */
  lope = true;
  /** slope of the ground under the feet (radians) and its uphill direction (body-fixed tangent) */
  slope = 0;
  readonly uphill = new Vector3();
  /** events of the last step */
  landed = false;
  jumped = false;
  /** downward speed when the feet last touched down (m/s) */
  impact = 0;
  /** seconds in the air so far (0 on the ground) */
  airTime = 0;
  /** highest point of the current flight above the take-off ground (m) */
  apex = 0;
  private takeoffR = 0;
  private hopWait = 0;
  /** rocks near the walker this step (body-fixed centres, bounding radii): walked on, stepped up, bumped into */
  rocks: { centre: Vector3; radius: number }[] = [];
  /** the last step was stopped or deflected by a wall (a boulder, a ledge) */
  blocked = false;
  private terrainFn: GroundFn | null = null;
  /** open water at a body-fixed unit direction (oceans, lakes): not walked into; null on dry worlds */
  water: ((n: Vector3) => boolean) | null = null;

  /** Horizontal unit direction from the feet towards the water nearby (body-fixed tangent). */
  private shoreNormal(fallback: Vector3): Vector3 {
    const up = this.pos.clone().normalize();
    const t1 = new Vector3(), t2 = new Vector3(), sum = new Vector3(), q = new Vector3();
    tangents(up, t1, t2);
    const R = this.pos.length();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const dir = t1.clone().multiplyScalar(Math.cos(a)).addScaledVector(t2, Math.sin(a));
      if (this.water!(q.copy(this.pos).addScaledVector(dir, 0.75).divideScalar(R).normalize())) sum.add(dir);
    }
    if (sum.lengthSq() < 1e-9) sum.copy(fallback);
    sum.addScaledVector(up, -sum.dot(up));
    return sum.lengthSq() > 1e-12 ? sum.normalize() : sum.set(0, 0, 0);
  }

  /** Radius of what the feet stand on along unit direction `n`: the ground, or the top of a rock there. */
  surface(n: Vector3, ground: GroundFn): number {
    let r = ground(n);
    for (const k of this.rocks) {
      // where the ray from the world's centre along n leaves the rock's sphere (if it meets it)
      const along = n.dot(k.centre);
      const px = k.centre.x - n.x * along, py = k.centre.y - n.y * along, pz = k.centre.z - n.z * along;
      const disc = k.radius * k.radius - (px * px + py * py + pz * pz);
      if (disc > 0) r = Math.max(r, along + Math.sqrt(disc));
    }
    return r;
  }

  /**
   * A rock taller than a step that the body at feet position `p` would be inside (its slice at
   * the height of the feet, plus the body radius), unless the feet are already up near its top
   * (standing on it after a jump). Returns the rock's horizontal direction from `p` (unit, tangent), or null.
   */
  private rockWall(p: Vector3, terrain: GroundFn): Vector3 | null {
    const feetR = p.length();
    const up = p.clone().divideScalar(feetR);
    for (const k of this.rocks) {
      const cR = k.centre.length();
      const top = cR + k.radius;
      if (feetR > top - STEP_UP) continue;               // up on it (or above it)
      if (top - terrain(k.centre.clone().divideScalar(cR)) <= STEP_UP) continue; // low: stepped onto
      const dz = feetR - cR;
      const slice = Math.abs(dz) < k.radius ? Math.sqrt(k.radius * k.radius - dz * dz) : 0;
      const h = k.centre.clone().sub(p);
      h.addScaledVector(up, -h.dot(up));
      const dist = h.length();
      if (dist < slice + BODY_RADIUS) return dist > 1e-9 ? h.divideScalar(dist) : h.set(0, 0, 0);
    }
    return null;
  }

  /** The walked-on surface as a ground function (just the ground when no rocks are near). */
  private surfaceFn(ground: GroundFn): GroundFn {
    return this.rocks.length ? (n) => this.surface(n, ground) : ground;
  }

  /** Stand on the ground below body-fixed direction `n`. */
  placeOn(n: Vector3, ground: GroundFn): void {
    const u = _n.copy(n).normalize();
    this.pos.copy(u).multiplyScalar(this.surface(u, ground));
    this.vel.set(0, 0, 0);
    this.onGround = true;
    this.airTime = 0;
  }

  get radius(): number {
    return this.pos.length();
  }

  get gravity(): number {
    return gravityAt(this.gm, this.pos.length());
  }

  /** speed along the ground (m/s) */
  get groundSpeed(): number {
    const up = _up.copy(this.pos).normalize();
    return _vt.copy(this.vel).addScaledVector(up, -this.vel.dot(up)).length();
  }

  /** Height of the feet above what they stand on (the ground or a rock) (m). */
  height(ground: GroundFn): number {
    const up = _up.copy(this.pos).normalize();
    return this.pos.length() - this.surface(up, ground);
  }

  /** Uphill gradient (rise per metre, body-fixed tangent) of `ground` at unit direction `up`, into `out`. */
  private gradient(up: Vector3, ground: GroundFn, out: Vector3, eps = 0.5): Vector3 {
    const r0 = ground(up);
    const t1 = new Vector3(), t2 = new Vector3(), q = new Vector3();
    tangents(up, t1, t2);
    const h1 = ground(q.copy(up).multiplyScalar(r0).addScaledVector(t1, eps).normalize()) - r0;
    const h2 = ground(q.copy(up).multiplyScalar(r0).addScaledVector(t2, eps).normalize()) - r0;
    return out.copy(t1).multiplyScalar(h1 / eps).addScaledVector(t2, h2 / eps);
  }

  /**
   * Horizontal unit direction into a wall met at unit direction `n` (body-fixed tangent): away from
   * the rock's centre when a rock stands there, else uphill on the terrain.
   */
  private wallNormal(n: Vector3, terrain: GroundFn, ground: GroundFn): Vector3 {
    const out = new Vector3();
    const t = terrain(n);
    let best: { centre: Vector3; radius: number } | null = null, top = t;
    for (const k of this.rocks) {
      const along = n.dot(k.centre);
      const perp2 = k.centre.lengthSq() - along * along;
      const disc = k.radius * k.radius - perp2;
      if (disc > 0 && along + Math.sqrt(disc) > top) { top = along + Math.sqrt(disc); best = k; }
    }
    if (best) out.copy(best.centre).sub(this.pos);
    else this.gradient(n, ground, out, 0.15);
    out.addScaledVector(n, -out.dot(n));
    return out.lengthSq() > 1e-12 ? out.normalize() : out.set(0, 0, 0);
  }

  /** Slope of the ground at unit direction `up` (sets `slope`, `uphill`); returns the ground radius there. */
  private sampleSlope(up: Vector3, ground: GroundFn): number {
    const r0 = ground(up);
    this.gradient(up, ground, _g);
    const grad = _g.length();
    this.slope = Math.atan(grad);
    if (grad > 1e-9) this.uphill.copy(_g).divideScalar(grad); else this.uphill.set(0, 0, 0);
    return r0;
  }

  step(dt: number, intent: WalkIntent, terrain: GroundFn): void {
    this.landed = false;
    this.jumped = false;
    this.blocked = false;
    this.terrainFn = terrain;
    const ground = this.surfaceFn(terrain);
    if (dt <= 0) return;
    const r = this.pos.length();
    const up = _up.copy(this.pos).divideScalar(r);
    const g = gravityAt(this.gm, r);
    const vmaxAll = 0.3 * escapeSpeed(this.gm, r);
    const speed = intent.crouch ? CROUCH_SPEED : intent.run ? runSpeed(g) : WALK_SPEED;
    const want = _a.copy(intent.wish).addScaledVector(up, -intent.wish.dot(up));
    if (want.lengthSq() > 1) want.normalize();
    want.multiplyScalar(speed);
    this.hopWait = Math.max(0, this.hopWait - dt);

    if (this.onGround) {
      this.airTime = 0;
      const gR = this.sampleSlope(up, ground);
      const vt = _vt.copy(this.vel).addScaledVector(up, -this.vel.dot(up));
      const acc = traction(g);
      if (this.slope > SLOPE_LIMIT) {
        // too steep: no push uphill; slide down, held back a little by friction
        const into = want.dot(this.uphill);
        if (into > 0) want.addScaledVector(this.uphill, -into);
        const s = this.slope;
        vt.addScaledVector(this.uphill, -g * Math.sin(s) * Math.cos(s) * 0.85 * dt);
        approach(vt, vt.clone().add(want), acc * 0.25 * dt);
      } else {
        approach(vt, want, (want.lengthSq() > 0 ? acc : acc * 1.4) * dt);
      }
      let vUp = 0;
      if (intent.jump) {
        vUp = jumpSpeed(g);
        this.jumped = true;
      } else if (this.lope && intent.run && g < LOPE_G && this.hopWait <= 0 && vt.length() > 0.6 * runSpeed(g) && this.slope <= SLOPE_LIMIT) {
        // the low-gravity gait: running becomes a series of low bounds
        vUp = hopSpeed(g);
      }
      if (vUp > 0) {
        this.onGround = false;
        this.takeoffR = r;
        this.apex = 0;
        this.vel.copy(vt).addScaledVector(up, vUp);
        if (this.vel.length() > vmaxAll) this.vel.setLength(vmaxAll);
        this.integrateAir(dt, up, g, ground, want);
        return;
      }
      // move along the ground and stay on it, unless it falls away like a cliff edge
      let d = vt.length() * dt;
      let nUp = _n.copy(this.pos).addScaledVector(vt, dt).normalize().clone();
      let nR = ground(nUp);
      const wallAt = (u: Vector3, rr: number) => this.rockWall(u.clone().multiplyScalar(rr), terrain);
      const tooHigh = (rr: number, dd: number) => rr - gR > STEP_UP + dd * Math.tan(SLOPE_LIMIT);
      // the shoreline: no walking from land into open water (once in it, you may walk out)
      const dry = !this.water || !this.water(up);
      const wet = (u: Vector3) => dry && !!this.water && this.water(u);
      let rockHit = wallAt(nUp, Math.min(nR, r));
      let shore = wet(nUp);
      if (rockHit || shore || tooHigh(nR, d)) {
        // a wall (a boulder, a ledge, the water's edge): not crossed; slide along it instead
        this.blocked = true;
        const wall = rockHit ?? (shore ? this.shoreNormal(vt.clone().normalize()) : this.wallNormal(nUp, terrain, ground));
        const into = vt.dot(wall);
        if (into > 0) vt.addScaledVector(wall, -into);
        d = vt.length() * dt;
        // along the wall, kept a hair off it (a curved face would otherwise be met again)
        nUp = _n.copy(this.pos).addScaledVector(vt, dt).addScaledVector(wall, -(0.5 * d + 1e-3)).normalize().clone();
        nR = ground(nUp);
        rockHit = wallAt(nUp, Math.min(nR, r));
        shore = wet(nUp);
        if (rockHit || shore || tooHigh(nR, d)) {
          // still into it: stop here
          vt.set(0, 0, 0);
          d = 0;
          nUp = up.clone();
          nR = gR;
        }
      }
      const drop = gR - nR;
      if (d > 1e-6 && drop > Math.max(0.05, d * Math.tan((62 * Math.PI) / 180))) {
        this.onGround = false;
        this.takeoffR = r;
        this.apex = 0;
        this.pos.copy(nUp).multiplyScalar(r);
        this.vel.copy(vt).addScaledVector(nUp, -vt.dot(nUp));
        return;
      }
      this.pos.copy(nUp).multiplyScalar(nR);
      // carry the velocity over to the new tangent plane, keeping its size
      const sp = vt.length();
      this.vel.copy(vt).addScaledVector(nUp, -vt.dot(nUp));
      if (this.vel.lengthSq() > 0) this.vel.setLength(sp);
      return;
    }
    this.integrateAir(dt, up, g, ground, want);
    if (this.vel.length() > vmaxAll) this.vel.setLength(vmaxAll);
  }

  private integrateAir(dt: number, up: Vector3, g: number, ground: GroundFn, want: Vector3): void {
    // limited air control: nudge the horizontal velocity towards the wanted one
    const vt = _vt.copy(this.vel).addScaledVector(up, -this.vel.dot(up));
    const ctl = new Vector3();
    if (want.lengthSq() > 0) {
      ctl.copy(want).sub(vt);
      const lim = 0.6 * Math.min(1, traction(g) / 4);
      if (ctl.length() > lim) ctl.setLength(lim);
    }
    const a = ctl.addScaledVector(up, -g);
    const prevUp = this.pos.clone().normalize();
    this.pos.addScaledVector(this.vel, dt).addScaledVector(a, 0.5 * dt * dt);
    this.vel.addScaledVector(a, dt);
    this.airTime += dt;
    const r = this.pos.length();
    this.apex = Math.max(this.apex, r - this.takeoffR);
    const nUp = _n.copy(this.pos).divideScalar(r);
    let gR = ground(nUp);
    // crossing the shoreline from land, even in the air: the water's edge is a wall
    const intoWater = !!this.water && this.water(nUp) && !this.water(prevUp);
    if ((r <= gR && gR - r > STEP_UP) || this.rockWall(this.pos, this.terrainFn ?? ground) || intoWater) {
      // flew into the side of something (a boulder): back out sideways, keep falling
      this.blocked = true;
      this.pos.copy(prevUp).multiplyScalar(r);
      const vUp = this.vel.dot(prevUp);
      this.vel.copy(prevUp).multiplyScalar(vUp);
      nUp.copy(prevUp);
      gR = ground(nUp);
    }
    if (r <= gR) {
      // touch down: the downward speed is absorbed by the legs, the horizontal speed kept
      this.impact = Math.max(0, -this.vel.dot(nUp));
      this.pos.copy(nUp).multiplyScalar(gR);
      this.vel.addScaledVector(nUp, -this.vel.dot(nUp));
      this.onGround = true;
      this.landed = true;
      this.hopWait = 0.1;
    }
  }

  /** Recover from bad numbers (never expected): back on the ground, at rest. */
  sanitize(fallback: Vector3, ground: GroundFn): boolean {
    const ok = Number.isFinite(this.pos.x + this.pos.y + this.pos.z + this.vel.x + this.vel.y + this.vel.z) && this.pos.lengthSq() > 1;
    if (!ok) this.placeOn(fallback, ground);
    return ok;
  }
}

/** Move `v` towards `target` by at most `maxDelta`. */
function approach(v: Vector3, target: Vector3, maxDelta: number): void {
  const dx = target.x - v.x, dy = target.y - v.y, dz = target.z - v.z;
  const d = Math.hypot(dx, dy, dz);
  if (d <= maxDelta || d < 1e-9) { v.copy(target); return; }
  const k = maxDelta / d;
  v.x += dx * k; v.y += dy * k; v.z += dz * k;
}

const GAS_TYPES = new Set<PlanetType>(['subneptune', 'icegiant', 'giant', 'hotgiant']);

/** Gravitational parameter of a world (m³/s²); estimated from its size for a body without a measured mass. */
export function worldGM(owner: object): number {
  if (owner instanceof Body) {
    if (owner.gm > 0) return owner.gm;
    return G_NEWTON * 2000 * (4 / 3) * Math.PI * owner.radius ** 3;
  }
  if (owner instanceof ExoPlanet) return G_NEWTON * owner.spec.massKg;
  const r = (owner as { radius?: number }).radius ?? 1e6;
  return G_NEWTON * 3000 * (4 / 3) * Math.PI * r ** 3;
}

/** Why nobody can walk on this (null if it is a solid world). */
export function cannotWalkReason(o: SpaceObject | null): string | null {
  if (!o) return 'Nothing to stand on here: fly to a planet or a moon first';
  if (o instanceof Body) {
    if (o.kind === 'star') return `${o.name} is a star: a ball of hot plasma, nothing to stand on`;
    if (o.isGasGiant) return `${o.name} is a giant planet with no solid surface: its gases just get denser and hotter with depth`;
    if (o.name === 'Venus' || o.name === 'Titan') return `${o.name}'s thick atmosphere hides its ground: no landing terrain here yet`;
    return null;
  }
  if (o instanceof ExoPlanet) {
    if (GAS_TYPES.has(o.spec.type)) return `${o.name} is a gas planet: no solid surface to stand on`;
    return null;
  }
  if (o instanceof Landmark) return null;
  if (o.kind === 'star' || o.kind === 'blackhole') return `Nothing to stand on at ${o.name}`;
  return `Can't walk on ${o.name}: fly to a planet or a moon first`;
}

/** Worlds with a dusty regolith that keeps bootprints (not Earth's grass and water, not lava or ocean worlds). */
export function leavesPrints(o: object | null): boolean {
  if (o instanceof Body) return o.name !== 'Earth';
  if (o instanceof ExoPlanet) return !['ocean', 'lava', 'terran'].includes(o.spec.type);
  return false;
}

/** Drag on dust (1/s): none in vacuum; Mars' thin air keeps fine dust up longer. */
export function airDrag(o: object | null): number {
  const n = (o as { name?: string } | null)?.name;
  if (n === 'Earth') return 3;
  if (n === 'Mars') return 0.8;
  if (o instanceof ExoPlanet && ['terran', 'ocean', 'desert'].includes(o.spec.type)) return 2;
  return 0;
}

/** Why walking stops at open water. */
export function waterReason(o: object | null): string {
  const n = (o as { name?: string } | null)?.name ?? 'this world';
  return `That's open water on ${n === 'Earth' ? 'Earth' : n}: fly to dry land to walk`;
}

/** How much air carries the sound of footsteps (0: vacuum, only the thump through the suit). */
export function airCarry(o: object | null): number {
  const n = (o as { name?: string } | null)?.name;
  if (n === 'Earth') return 1;
  if (n === 'Mars') return 0.25; // under 1% of Earth's pressure: faint and dull
  if (o instanceof ExoPlanet && ['terran', 'ocean', 'desert'].includes(o.spec.type)) return 1;
  return 0;
}

export type WalkState = 'off' | 'approach' | 'descend' | 'walk';

export interface WalkSettings {
  /** VR: darken the edges of the view while moving */
  vignette: boolean;
  /** VR: 'standing' uses the headset's real height; 'seated' lifts the view to a standing eye height */
  height: 'standing' | 'seated';
  /** desktop: a gentle footstep bob of the view (never in VR) */
  bob: boolean;
  /** bound when running in low gravity */
  lope: boolean;
}

/**
 * Walking mode: B on the desktop, the Walk button in VR. Owns the camera while walking (App
 * skips the free-flight rig and the ground clamp then).
 */
export class Walk {
  state: WalkState = 'off';
  readonly body = new WalkBody();
  readonly settings: WalkSettings = { vignette: true, height: 'standing', bob: true, lope: true };
  /** the world walked on (Body or ExoPlanet) and its name */
  world: SpaceObject | null = null;
  /** body-fixed -> world rotation of the walked-on world, updated every frame */
  readonly R = new Matrix3();
  private centre = new UPos();
  /** heading: body-fixed unit tangent */
  private fwd = new Vector3(1, 0, 0);
  private pitch = 0;
  private eye = EYE_STAND;
  /** smoothed feet radius (hides small jumps of the ground when the terrain is rebuilt) */
  private visR = 0;
  private dip = 0;
  private dipVel = 0;
  private bobPhase = 0;
  private jumpBuffer = 0;
  private crouchToggle = false;
  private lastGround = 0;
  /** seconds the drawn terrain under the walker has been missing */
  private lostFrame = 0;
  private approachTarget: SpaceObject | null = null;
  private approachWait = 0;
  private descend = { h0: 1, pitch0: 0 };
  /** body-fixed direction of the place being landed at (walking at a landmark), or null: straight down */
  private descendTo: Vector3 | null = null;
  /** VR controller inputs for the next update */
  private vr = { x: 0, y: 0, run: false, turn: 0 };
  private hudEl: HTMLDivElement | null = null;
  private hudTimer = 0;
  /** short status for the HUD and the VR wrist */
  status = '';
  /** the last thing walking said (a toast may be replaced by another; tests read this) */
  said = '';
  /** bootprints and dust */
  readonly marks = new GroundMarks();
  private stepIndex = 0;
  /** orbit lines are hidden while walking (they cross the sky and the ground) */
  private orbitsBefore: boolean | null = null;
  private foot = 1;

  constructor(private app: App) {
    if (typeof document !== 'undefined' && app.hud?.root) {
      const el = document.createElement('div');
      el.className = 'walk-hud';
      el.style.cssText = 'position:absolute;left:50%;bottom:44px;transform:translateX(-50%);padding:6px 14px;border-radius:14px;'
        + 'background:rgba(8,12,22,0.72);border:1px solid rgba(127,178,255,0.45);color:#d8e2f0;font:13px Inter,system-ui,sans-serif;'
        + 'white-space:nowrap;pointer-events:none;display:none;text-align:center;';
      app.hud.root.appendChild(el);
      this.hudEl = el;
    }
    this.marks.group.visible = false;
    app.renderer?.scene.add(this.marks.group);
  }

  /** walking or about to (flying down to land) */
  get active(): boolean {
    return this.state !== 'off';
  }

  /** feet on (or jumping above) the ground: the walker owns the camera */
  get walking(): boolean {
    return this.state === 'walk';
  }

  get gravity(): number {
    return this.body.gravity;
  }

  // ------------------------------------------------------------------ entering and leaving
  /** B / the VR Walk button. */
  toggle(): void {
    if (this.active) this.exit();
    else this.start();
  }

  /** Start walking here: on the ground below, flying down first if needed. Returns false (with a message) if impossible. */
  start(target?: SpaceObject): boolean {
    const app = this.app;
    // footsteps (src/game/Audio.ts): audio may only start from a gesture, like this key press
    if (!app.game.active) { app.game.audio.start(); app.game.audio.update(0, 0, false); }
    if (app.game.active) {
      app.game.setMode('off');
      this.say('You climb out of the ship');
    }
    const below = app.terrain.below(app.rig.upos);
    const owner = app.terrain.owner as SpaceObject | null;
    if (!target && below && owner) {
      const why = cannotWalkReason(owner);
      if (why) { this.say(why); return false; }
      if (this.isWater(below.dir)) { this.say(waterReason(owner)); return false; }
      this.bindWorld(owner);
      app.rig.cancelGoto();
      const h = below.dist - below.ground;
      if (h <= EYE_STAND + 1.5) this.beginWalk();
      else this.beginDescend(h);
      return true;
    }
    // no ground drawn here: fly to the world (or the place) first
    const cand = target ?? this.nearbyWorld();
    const world = cand instanceof Landmark ? cand.world : cand;
    const why = cannotWalkReason(world);
    if (why) { this.say(why); return false; }
    this.approachTarget = cand!;
    this.approachWait = 0;
    this.state = 'approach';
    if (cand instanceof Landmark && app.vr.active) {
      // the headset's own travel (blink, re-aim, vignette), then down from the viewpoint
      app.vr.travelTo(cand);
    } else if (cand instanceof Landmark) {
      app.select(cand);
      app.rig.flyTo(cand, 1500, undefined, true, cand.up());
    } else {
      const w = cand as SpaceObject;
      const th = Math.max(40e3, w.radius * 0.03);
      app.rig.flyTo(w, w.radius + th * 0.4);
    }
    this.say(`Landing on ${(world as SpaceObject).name}…`);
    return true;
  }

  /** Walk at a place (tour): fly there, land, walk. */
  walkAt(place: SpaceObject): void {
    if (this.walking) this.exit(true);
    this.start(place);
  }

  /** Back to free flight. */
  exit(quiet = false): void {
    const app = this.app;
    const was = this.state;
    this.state = 'off';
    this.approachTarget = null;
    this.descendTo = null;
    this.lostFrame = 0;
    app.vr.comfort = 0;
    this.marks.group.visible = false;
    if (this.orbitsBefore !== null) { app.orbits.enabled = this.orbitsBefore; this.orbitsBefore = null; }
    if (this.hudEl) this.hudEl.style.display = 'none';
    if (typeof document !== 'undefined' && document.pointerLockElement) document.exitPointerLock?.();
    if (was === 'walk' || was === 'descend') {
      app.rig.stop();
      if (this.world) app.rig.setAnchor(this.world);
      // the free-flight view: no pitch limit, same direction
    }
    if (was === 'approach') app.rig.cancelGoto();
    if (!quiet) this.say('Free flight');
  }

  private say(msg: string): void {
    this.said = msg;
    this.app.hud.toast(msg, 3);
    if (this.app.vr.active) this.app.vr.flash(msg);
  }

  /** The world the explorer is near (or has selected), for "land and walk". */
  private nearbyWorld(): SpaceObject | null {
    const app = this.app;
    const sel = app.selection;
    const a = app.rig.anchor;
    const near = (o: SpaceObject | null) => !!o && o.upos.sub(app.rig.upos, new Vector3()).length() < Math.max(o.radius * 20, 5e6);
    if (sel instanceof Landmark && near(sel.world)) return sel;
    if (a && (a instanceof Body || a instanceof ExoPlanet) && near(a)) return a;
    if (sel && (sel instanceof Body || sel instanceof ExoPlanet)) return sel;
    return a ?? sel ?? null;
  }

  private bindWorld(owner: SpaceObject): void {
    if (this.marks.owner !== owner) this.marks.clear(owner);
    this.world = owner;
    this.body.gm = worldGM(owner);
    this.body.lope = this.settings.lope;
    this.updateFrame();
  }

  /** Find the world's centre and orientation from the terrain's body-fixed queries. Returns false without terrain. */
  private updateFrame(): boolean {
    const t = this.app.terrain;
    if (!this.world || t.owner !== this.world) return false;
    const b = t.below(this.app.rig.upos);
    if (!b) return false;
    this.centre.copy(b.centre);
    // probe the three world axes: below() gives them in the body-fixed frame = the rows of R
    const D = Math.max(b.dist, 1);
    const rows: Vector3[] = [];
    for (const e of [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)]) {
      const p = t.below(b.centre.clone().addVec(e, D));
      if (!p) return false;
      rows.push(p.dir);
    }
    this.R.set(rows[0].x, rows[0].y, rows[0].z, rows[1].x, rows[1].y, rows[1].z, rows[2].x, rows[2].y, rows[2].z);
    return true;
  }

  private ground: GroundFn = (n) => {
    const t = this.app.terrain;
    if (this.world && t.owner === this.world) {
      const r = t.groundRadius(n);
      if (r > 0) { this.lastGround = r; return r; }
    }
    return this.lastGround || this.body.radius;
  };

  /** body-fixed direction of the camera now */
  private camBF(): Vector3 {
    const rel = this.app.rig.upos.sub(this.centre, new Vector3());
    return rel.applyMatrix3(this.R.clone().transpose()).normalize();
  }

  /** Open water below body-fixed direction `n` on the world walked on (the terrain's sea test). */
  private isWater(n: Vector3): boolean {
    const t = this.app.terrain as { isSea?: (n: Vector3) => boolean };
    return !!t.isSea && t.isSea(n);
  }

  private beginWalk(): void {
    const app = this.app;
    this.descendTo = null;
    if (this.isWater(this.camBF())) {
      // came down over water after all (the ground under the descent changed): stay in the air
      this.say(waterReason(this.world));
      this.exit(true);
      return;
    }
    this.updateFrame();
    const n = this.camBF();
    this.body.placeOn(n, this.ground);
    this.visR = this.body.radius;
    this.dip = this.dipVel = 0;
    this.eye = EYE_STAND;
    this.jumpBuffer = 0;
    this.crouchToggle = false;
    // heading: where the view looked, along the ground
    const RT = this.R.clone().transpose();
    const up = n.clone();
    const f = app.rig.forward(new Vector3()).applyMatrix3(RT);
    const pitch = Math.asin(Math.max(-1, Math.min(1, f.dot(up))));
    f.addScaledVector(up, -f.dot(up));
    if (f.lengthSq() < 1e-6) f.copy(app.rig.up(new Vector3()).applyMatrix3(RT)).addScaledVector(up, -app.rig.up(new Vector3()).applyMatrix3(RT).dot(up));
    if (f.lengthSq() < 1e-6) tangents(up, f, new Vector3());
    this.fwd.copy(f.normalize());
    this.pitch = Math.max(-1.2, Math.min(1.2, pitch));
    this.state = 'walk';
    if (this.orbitsBefore === null) { this.orbitsBefore = app.orbits.enabled; app.orbits.enabled = false; }
    app.rig.cancelGoto();
    app.rig.stop();
    if (!app.vr.active) {
      try {
        const p = (app.input.element.requestPointerLock as () => Promise<void> | void)?.call(app.input.element);
        if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => undefined);
      } catch { /* drag to look instead */ }
    }
    const g = this.body.gravity;
    this.say(`Walking on ${this.worldName()} · gravity ${g.toFixed(2)} m/s² (${(g / 9.80665).toFixed(2)} g)`);
    this.place(0);
  }

  private beginDescend(h: number): void {
    this.state = 'descend';
    if (h > WALK_REACH) this.say(`Coming down to walk on ${this.worldName()}…`);
    this.descend = { h0: h, pitch0: Math.asin(Math.max(-1, Math.min(1, this.app.rig.forward(new Vector3()).dot(this.app.rig.upos.sub(this.centre, new Vector3()).normalize())))) };
  }

  worldName(): string {
    const n = this.world?.name ?? '';
    return ['Moon', 'Sun'].includes(n) ? `the ${n}` : n;
  }

  // ------------------------------------------------------------------ input
  /** Desktop keys; true if the key was used. */
  onKey(e: KeyboardEvent): boolean {
    if (e.code === 'KeyB') { if (!e.repeat) this.toggle(); return true; }
    if (!this.walking) {
      if (this.state !== 'off' && e.code === 'Escape') { this.exit(); return true; }
      return false;
    }
    switch (e.code) {
      case 'Space': if (!e.repeat) this.jump(); e.preventDefault(); return true;
      case 'KeyC': if (!e.repeat) this.crouchToggle = !this.crouchToggle; return true;
      case 'KeyQ': case 'KeyE': case 'KeyR': case 'KeyF': return true;
      // flying somewhere else, or into the ship: stop walking first
      case 'KeyG': case 'KeyJ': case 'KeyV': this.exit(true); return false;
      default:
        if (/^Digit\d$/.test(e.code)) this.exit(true);
        return false;
    }
  }

  /** Desktop click while walking: grab the mouse for looking around (true: used). */
  onClick(): boolean {
    if (!this.walking || this.app.vr.active) return false;
    if (typeof document !== 'undefined' && document.pointerLockElement === this.app.input.element) return true;
    try {
      const p = (this.app.input.element.requestPointerLock as () => Promise<void> | void)?.call(this.app.input.element);
      if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => undefined);
    } catch { /* ignore */ }
    return true;
  }

  jump(): void {
    this.jumpBuffer = 0.18;
  }

  /** Turn about the local vertical (VR snap / smooth turn), radians, positive = left. */
  turn(angle: number): void {
    const up = this.body.pos.clone().normalize();
    this.fwd.applyAxisAngle(up, angle).normalize();
  }

  /** VR left stick (x right, y down as the gamepad reports it) and grip (run). */
  vrMove(x: number, y: number, run: boolean): void {
    this.vr.x = x;
    this.vr.y = y;
    this.vr.run = run;
  }

  /** VR smooth turning this frame (for the comfort vignette). */
  vrTurning(rate: number): void {
    this.vr.turn = Math.max(this.vr.turn, Math.abs(rate));
  }

  // ------------------------------------------------------------------ per frame
  /** Called every frame instead of the free-flight rig while walking. Returns true if it moved the camera. */
  update(dt: number): boolean {
    const app = this.app;
    if (this.state === 'off') return false;
    if (this.state === 'approach') {
      app.vr.comfort = this.settings.vignette ? 0.45 : 0;
      if (app.rig.autopilot || app.vr.traveling) return false;
      const below = app.terrain.below(app.rig.upos);
      const owner = app.terrain.owner as SpaceObject | null;
      const target = this.approachTarget;
      if (below && owner) {
        const why = cannotWalkReason(owner);
        if (why) { this.say(why); this.exit(true); return false; }
        this.bindWorld(owner);
        // a place: glide down onto it, not straight down from the viewpoint the travel arrived at
        const to = target instanceof Landmark && target.world === owner ? target.up().applyMatrix3(this.R.clone().transpose()).normalize() : below.dir;
        if (this.isWater(to)) { this.say(waterReason(owner)); this.exit(true); return false; }
        this.beginDescend(below.dist - below.ground);
        if (target instanceof Landmark && target.world === owner) this.descendTo = to;
        return false;
      }
      // the ground is still being built (or loaded): wait a little
      this.approachWait += dt;
      if (this.approachWait > 25 || !target) { this.say('No ground to land on here'); this.exit(true); }
      return false;
    }
    // something else took over the camera: a flight, a VR travel
    if (app.rig.autopilot || app.vr.traveling) { this.exit(true); return false; }
    if (this.updateFrame()) this.lostFrame = 0;
    else {
      // the terrain went away (it is being rebuilt, or another world came closer): walk on with the
      // frame we had, but give up after a moment rather than stand on nothing
      this.lostFrame += dt;
      if (this.state === 'descend' || this.lostFrame > 3) {
        this.say(`No ground under you any more: back to free flight`);
        this.exit(true);
        return false;
      }
    }
    if (this.state === 'descend') return this.updateDescend(dt);
    this.updateWalk(dt);
    return true;
  }

  private updateDescend(dt: number): boolean {
    const app = this.app;
    app.input.consume();
    app.input.look.dx = app.input.look.dy = 0;
    let n = this.camBF();
    const gR = this.ground(n);
    const r = app.rig.upos.sub(this.centre, new Vector3()).length();
    const h = r - gR;
    const hEye = EYE_STAND;
    let nh = hEye + (h - hEye) * Math.exp(-1.5 * dt);
    nh = Math.min(nh, Math.max(hEye, h - 2 * dt));
    if (this.descendTo) {
      // glide over to the place at the same pace as the height comes down
      const ang = n.angleTo(this.descendTo);
      const k = h - hEye > 1e-3 ? 1 - (nh - hEye) / (h - hEye) : 1;
      if (ang > 1e-12) {
        const axis = new Vector3().crossVectors(n, this.descendTo).normalize();
        n = n.clone().applyAxisAngle(axis, ang * Math.min(1, k)).normalize();
      }
    }
    const up = n.clone().applyMatrix3(this.R);
    // the eye nh above the ground under its (new) place, as an absolute position
    app.rig.upos.copy(this.centre).addVec(up.clone().multiplyScalar(this.ground(n) + nh));
    // level the view on the way down
    const s = Math.max(0, Math.min(1, Math.log(Math.max(nh, 1)) / Math.log(Math.max(this.descend.h0, 2))));
    const fw = app.rig.forward(new Vector3());
    let flat = fw.clone().addScaledVector(up, -fw.dot(up));
    if (flat.lengthSq() < 1e-4) { const u = app.rig.up(new Vector3()); flat = u.addScaledVector(up, -u.dot(up)); }
    flat.normalize();
    const pitch = app.vr.active ? 0 : this.descend.pitch0 * s + (1 - s) * Math.max(-0.15, Math.min(0.15, this.descend.pitch0));
    const dir = flat.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(up, Math.sin(pitch));
    const want = new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(new Vector3(), dir, up));
    app.rig.quat.slerp(want, 1 - Math.exp(-dt * 3));
    app.rig.speed = (h - nh) / Math.max(dt, 1e-6);
    app.vr.comfort = this.settings.vignette && app.vr.active ? 0.35 : 0;
    if (nh - hEye < 0.3) this.beginWalk();
    return true;
  }

  private updateWalk(dt: number): void {
    const app = this.app;
    const b = this.body;
    const vrOn = app.vr.active;
    const up = b.pos.clone().normalize();
    // keep the heading tangent (parallel transport as we move over the curved ground)
    this.fwd.addScaledVector(up, -this.fwd.dot(up));
    if (this.fwd.lengthSq() < 1e-8) tangents(up, this.fwd, new Vector3());
    this.fwd.normalize();
    const right = new Vector3().crossVectors(this.fwd, up).normalize();

    // look (desktop): pointer lock motion or left drag
    const consumed = app.input.consume();
    const look = app.input.look;
    const dx = look.dx + consumed.left.dx, dy = look.dy + consumed.left.dy;
    look.dx = look.dy = 0;
    if (!vrOn && (dx || dy)) {
      const k = (app.rig.fov / 50) * 0.0022;
      this.turn(-dx * k);
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - dy * k));
    }
    right.crossVectors(this.fwd, up).normalize();

    // movement wish in body-fixed axes
    const keys = app.input.keys;
    const wish = new Vector3();
    let run = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const crouch = this.crouchToggle || keys.has('ControlLeft') || keys.has('ControlRight');
    const kf = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const kr = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    if (kf || kr) wish.addScaledVector(this.fwd, kf).addScaledVector(right, kr).normalize();
    if (vrOn && (this.vr.x || this.vr.y)) {
      // relative to where the head looks, along the ground
      const RT = this.R.clone().transpose();
      const headQ = app.renderer.camera.getWorldQuaternion(new Quaternion());
      const hf = new Vector3(0, 0, -1).applyQuaternion(headQ).applyMatrix3(RT);
      hf.addScaledVector(up, -hf.dot(up));
      if (hf.lengthSq() < 1e-6) hf.copy(this.fwd);
      hf.normalize();
      const hr = new Vector3().crossVectors(hf, up).normalize();
      const mag = Math.min(1, Math.hypot(this.vr.x, this.vr.y));
      wish.copy(hf).multiplyScalar(-this.vr.y).addScaledVector(hr, this.vr.x);
      if (wish.lengthSq() > 0) wish.setLength(mag * mag);
      run = run || this.vr.run;
    }
    this.vr.x = this.vr.y = 0;
    const vrRunning = this.vr.run;
    this.vr.run = false;

    // physics, in small steps
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    // holding Space keeps asking for a jump (a press shorter than a frame still counts via the buffer)
    if (keys.has('Space') && !vrOn) this.jumpBuffer = Math.max(this.jumpBuffer, dt + 1e-3);
    b.lope = this.settings.lope && !(vrOn && !vrRunning);
    // rocks near the feet are walked on and bumped into (only the ones drawn on this world)
    const rocks = app.rocks;
    b.rocks = rocks && rocks.group.visible && app.terrain.owner === this.world
      ? rocks.rocksNear(b.pos, 3 + b.vel.length() * dt * 2, 0.2) : [];
    const t = app.terrain as { isSea?: (n: Vector3) => boolean };
    b.water = t.isSea && app.terrain.owner === this.world ? (nn) => t.isSea!(nn) : null;
    const n = Math.max(1, Math.ceil(dt / (1 / 90)));
    let landed = false, impact = 0, jumped = false;
    for (let i = 0; i < n; i++) {
      const wantJump = this.jumpBuffer > 0 && b.onGround;
      b.step(dt / n, { wish, run, crouch, jump: wantJump }, this.ground);
      if (b.jumped) { jumped = true; this.jumpBuffer = 0; }
      if (b.landed) { landed = true; impact = Math.max(impact, b.impact); }
    }
    b.sanitize(up, this.ground);
    if (jumped && vrOn) this.app.vr.pulse(0.3, 15);
    if (landed && vrOn && impact > 0.6) this.app.vr.pulse(Math.min(0.6, impact * 0.25), 25);

    // eye: crouch, landing dip (desktop), footstep bob (desktop, optional)
    const eyeWant = crouch ? EYE_CROUCH : EYE_STAND;
    this.eye += (eyeWant - this.eye) * (1 - Math.exp(-dt * 10));
    if (landed && !vrOn) this.dipVel -= Math.min(2.5, impact * 0.5);
    // spring back (critically damped)
    const w = 14;
    this.dipVel += (-w * w * this.dip - 2 * w * this.dipVel) * dt;
    this.dip += this.dipVel * dt;
    this.dip = Math.max(-0.45, Math.min(0.1, this.dip));
    const gs = b.groundSpeed;
    let bob = 0;
    if (b.onGround && gs > 0.2) {
      this.bobPhase += dt * gs * 2.2;
      if (!vrOn && this.settings.bob) bob = Math.sin(this.bobPhase * Math.PI) ** 2 * -0.035 * Math.min(1, gs / 1.4);
    }
    // smoothed feet radius: hides sudden ground changes (terrain rebuilds), but not jumps
    const pr = b.radius;
    if (b.onGround) {
      this.visR += (pr - this.visR) * (1 - Math.exp(-dt / 0.06));
      if (Math.abs(pr - this.visR) > 0.4) this.visR = pr + Math.sign(this.visR - pr) * 0.4;
    } else {
      this.visR += (pr - this.visR) * (1 - Math.exp(-dt / 0.03));
    }
    this.place(bob + this.dip);
    this.updateMarks(dt, landed, impact, up);

    // comfort vignette while moving or turning (VR)
    if (vrOn) {
      const moving = Math.min(1, gs / 2.5) * 0.45 + (b.onGround ? 0 : Math.min(0.2, Math.abs(b.vel.dot(up)) * 0.08));
      const turning = Math.min(1, this.vr.turn) * 0.4;
      app.vr.comfort = this.settings.vignette ? Math.max(moving, turning) : 0;
    }
    this.vr.turn = 0;
    app.rig.speed = b.vel.length();

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) { this.hudTimer = 0.2; this.updateHud(); }
  }

  /** Bootprints at each step (and both feet on landing), dust from landings and running. */
  private updateMarks(dt: number, landed: boolean, impact: number, upOld: Vector3): void {
    const b = this.body;
    const up = b.pos.clone().normalize();
    const g = b.gravity;
    const prints = leavesPrints(this.world);
    const drag = airDrag(this.world);
    const vt = b.vel.clone().addScaledVector(up, -b.vel.dot(up));
    const heading = vt.lengthSq() > 0.04 ? vt.clone().normalize() : this.fwd.clone();
    const side = new Vector3().crossVectors(heading, up).normalize();
    const footAt = (sgn: number) => b.pos.clone().addScaledVector(side, 0.11 * sgn);
    const air = airCarry(this.world);
    if (landed) {
      this.app.game.audio.step(Math.min(1, 0.25 + impact / 3), air);
      if (prints) { this.marks.addPrint(footAt(1), heading, up); this.marks.addPrint(footAt(-1), heading, up); }
      const n = Math.round(Math.min(90, 10 + impact * 22 + vt.length() * 6));
      if (impact > 0.4 || vt.length() > 1.5) this.marks.kick(b.pos, up, n, Math.min(2.2, 0.35 + impact * 0.45 + vt.length() * 0.15), vt.clone().multiplyScalar(0.25));
    } else if (b.onGround) {
      const step = Math.floor(this.bobPhase);
      if (step !== this.stepIndex) {
        this.stepIndex = step;
        this.foot = -this.foot;
        if (prints) this.marks.addPrint(footAt(this.foot), heading, up);
        this.app.game.audio.step(vt.length() > 2 ? 0.55 : 0.3, air);
        if (vt.length() > 2) this.marks.kick(footAt(this.foot), up, 6, 0.5, vt.clone().multiplyScalar(0.2));
      }
    }
    void upOld;
    const camRel = this.app.rig.upos.sub(this.centre, new Vector3());
    this.marks.update(dt, g, drag, up, b.onGround ? b.radius : this.ground(up), this.R, camRel, true);
  }

  /** Put the camera rig where the walker's eyes are (VR: the dolly at the feet; the headset adds its height). */
  private place(eyeExtra: number): void {
    const app = this.app;
    const b = this.body;
    const up = b.pos.clone().normalize();
    const upW = up.clone().applyMatrix3(this.R).normalize();
    const fW = this.fwd.clone().applyMatrix3(this.R);
    fW.addScaledVector(upW, -fW.dot(upW)).normalize();
    const rW = new Vector3().crossVectors(fW, upW).normalize();
    const feet = up.clone().multiplyScalar(this.visR || b.radius).applyMatrix3(this.R);
    let lift: number;
    if (app.vr.active) {
      // the dolly stands on the ground; seated (or no floor-level tracking): lift to a standing eye
      // a headset that tracks the floor puts its own height on top (the dolly stands on the ground);
      // seated, or a pose with no floor height (3-DoF, or a runtime whose origin is at the eyes),
      // is lifted to a standing eye instead
      const headY = app.renderer.camera.position.y;
      lift = this.settings.height === 'seated' || headY < 0.5 ? this.eye - Math.max(0, Math.min(this.eye, headY)) : this.eye - EYE_STAND;
    } else {
      lift = this.eye + eyeExtra;
    }
    app.rig.upos.copy(this.centre).addVec(feet).addVec(upW, lift);
    const m = new Matrix4().makeBasis(rW, upW, fW.clone().negate());
    app.rig.quat.setFromRotationMatrix(m);
    if (!app.vr.active) app.rig.quat.multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), this.pitch));
    app.rig.altitude = Math.max(0.1, lift);
  }

  private updateHud(): void {
    const b = this.body;
    const g = b.gravity;
    const motion = !b.onGround ? `in the air ${b.airTime.toFixed(1)} s` : b.slope > SLOPE_LIMIT ? 'too steep: sliding' : `${b.groundSpeed.toFixed(1)} m/s`;
    this.status = `Walking on ${this.worldName()} · gravity ${g.toFixed(2)} m/s² · ${motion}`;
    if (!this.hudEl) return;
    const vr = this.app.vr.active;
    this.hudEl.style.display = this.state === 'walk' && !vr && !this.app.photoMode ? 'block' : 'none';
    this.hudEl.innerHTML = `<b>Walking on ${escapeHtml(this.worldName())}</b>, gravity ${g.toFixed(2)} m/s² (${(g / 9.80665).toFixed(2)} g) · ${motion}`
      + `<br><span style="opacity:.65">W A S D move · mouse look · Shift run · Space jump · C/Ctrl crouch · B fly</span>`;
  }

  /** For tests and the console. */
  debug() {
    const b = this.body;
    const up = b.pos.clone().normalize();
    const g = b.surface(up, this.ground);
    const eyeR = this.app.rig.upos.sub(this.centre, new Vector3()).length();
    return {
      state: this.state, world: this.world?.name ?? null, gravity: b.gravity, onGround: b.onGround, slope: (b.slope * 180) / Math.PI,
      feetH: b.radius - g, eyeH: eyeR - g, speed: b.groundSpeed, vUp: b.vel.dot(up), airTime: b.airTime, apex: b.apex,
      finite: Number.isFinite(eyeR) && Number.isFinite(b.pos.x), rocks: b.rocks.length, onRock: b.surface(up, this.ground) > this.ground(up) + 0.02, blocked: b.blocked,
      // the view stays upright: its right axis is horizontal (no roll)
      roll: new Vector3(1, 0, 0).applyQuaternion(this.app.rig.quat).dot(up.clone().applyMatrix3(this.R).normalize()),
      pos: b.pos.toArray(),
    };
  }
}


function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

// ------------------------------------------------------------------ bootprints and dust
const MARK_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute float aA;
uniform float uBillboard;
varying vec2 vUv;
varying float vA;
void main() {
  vUv = uv;
  vA = aA;
  vec4 mv;
  if (uBillboard > 0.5) {
    // camera-facing quad of the instance's size
    mat4 im = instanceMatrix;
    float s = length(im[0].xyz);
    mv = viewMatrix * modelMatrix * vec4(im[3].xyz, 1.0);
    mv.xy += position.xy * s;
  } else {
    mv = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  }
  gl_Position = projectView(mv);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

/** Bootprint: darkens the ground below it (dst x factor), tread stripes inside a sole outline. */
const PRINT_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
varying vec2 vUv;
varying float vA;
void main() {
  #include <logdepthbuf_fragment>
  vec2 p = vUv * 2.0 - 1.0;               // x across, y along the foot (toe at +1)
  float w = mix(0.62, 0.95, smoothstep(-0.9, 0.3, p.y));   // narrower heel
  float waist = 1.0 - 0.18 * exp(-pow((p.y + 0.15) * 4.0, 2.0));
  float e = length(vec2(p.x / (w * waist), p.y));
  float m = 1.0 - smoothstep(0.86, 1.0, e);
  float rim = smoothstep(0.78, 0.92, e) * (1.0 - smoothstep(0.92, 1.0, e));
  float tread = step(0.5, fract(p.y * 7.0 + 0.25));
  float f = 1.0 - m * vA * (0.42 + 0.16 * tread) + rim * vA * 0.16;
  gl_FragColor = vec4(vec3(f), 1.0);
}`;

/** Dust grain: brightens what is behind it (dst x (1 + a)), sunlit regolith over the ground. */
const DUST_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
varying vec2 vUv;
varying float vA;
void main() {
  #include <logdepthbuf_fragment>
  float r = length(vUv * 2.0 - 1.0);
  float a = vA * (1.0 - smoothstep(0.3, 1.0, r));
  if (a < 0.003) discard;
  gl_FragColor = vec4(vec3(a * 0.9), 1.0);
}`;

const MAX_PRINTS = 500;
const MAX_DUST = 600;

interface Grain { p: Vector3; v: Vector3; life: number; settled: number; size: number }

/**
 * Bootprints in the regolith behind the walker and dust kicked up by landings and running.
 * Body-fixed positions (they stay on the turning world), drawn camera-relative each frame.
 * Dust flies ballistically (no air on the Moon; a little drag where there is air).
 */
export class GroundMarks {
  readonly group = new Group();
  private prints: InstancedMesh;
  private dust: InstancedMesh;
  private printPos: { p: Vector3; f: Vector3; up: Vector3; a: number }[] = [];
  private grains: Grain[] = [];
  private printA: InstancedBufferAttribute;
  private dustA: InstancedBufferAttribute;
  private next = 0;
  owner: object | null = null;

  constructor() {
    this.group.name = 'walk-marks';
    this.group.matrixAutoUpdate = false;
    const common = { vertexShader: MARK_VERT, transparent: true, depthWrite: false, depthTest: true, blending: CustomBlending };
    const pg = new PlaneGeometry(0.16, 0.34);
    this.printA = new InstancedBufferAttribute(new Float32Array(MAX_PRINTS), 1);
    pg.setAttribute('aA', this.printA);
    this.prints = new InstancedMesh(pg, new ShaderMaterial({
      name: 'bootprints', fragmentShader: PRINT_FRAG, ...common, blendSrc: DstColorFactor, blendDst: ZeroFactor,
      uniforms: { uBillboard: { value: 0 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
    }), MAX_PRINTS);
    const dg = new PlaneGeometry(1, 1);
    this.dustA = new InstancedBufferAttribute(new Float32Array(MAX_DUST), 1);
    dg.setAttribute('aA', this.dustA);
    this.dust = new InstancedMesh(dg, new ShaderMaterial({
      name: 'walk-dust', fragmentShader: DUST_FRAG, ...common, blendSrc: DstColorFactor, blendDst: OneFactor,
      uniforms: { uBillboard: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
    }), MAX_DUST);
    for (const m of [this.prints, this.dust]) {
      m.frustumCulled = false;
      m.count = 0;
      m.matrixAutoUpdate = false;
      this.group.add(m);
    }
    this.prints.renderOrder = 19.93; // after the terrain and rocks, before the terrain haze
    this.dust.renderOrder = 19.94;
    this.prints.name = 'bootprints';
    this.dust.name = 'walk-dust';
  }

  /** Forget everything (another world). */
  clear(owner: object | null): void {
    this.owner = owner;
    this.printPos = [];
    this.grains = [];
    this.next = 0;
  }

  get printCount(): number { return this.printPos.length; }
  get dustCount(): number { return this.grains.length; }

  /** A print at body-fixed feet position `p` (on the ground), heading `f`, local vertical `up`. */
  addPrint(p: Vector3, f: Vector3, up: Vector3): void {
    const e = { p: p.clone().addScaledVector(up, 0.03), f: f.clone(), up: up.clone(), a: 1 };
    if (this.printPos.length < MAX_PRINTS) this.printPos.push(e);
    else { this.printPos[this.next] = e; this.next = (this.next + 1) % MAX_PRINTS; }
  }

  /** Kick up `n` grains at body-fixed `p` with up to `speed` m/s, biased along `dir` (tangent, may be zero). */
  kick(p: Vector3, up: Vector3, n: number, speed: number, dir: Vector3, rnd: () => number = Math.random): void {
    tangents(up, _t1, _t2);
    for (let i = 0; i < n && this.grains.length < MAX_DUST; i++) {
      const a = rnd() * Math.PI * 2;
      const s = speed * (0.25 + 0.75 * rnd());
      const v = _t1.clone().multiplyScalar(Math.cos(a) * s).addScaledVector(_t2, Math.sin(a) * s)
        .addScaledVector(up, speed * (0.3 + 0.9 * rnd())).addScaledVector(dir, 0.6);
      const q = p.clone().addScaledVector(_t1, (rnd() - 0.5) * 0.3).addScaledVector(_t2, (rnd() - 0.5) * 0.3).addScaledVector(up, 0.03);
      this.grains.push({ p: q, v, life: 0, settled: 0, size: 0.012 + 0.03 * rnd() });
    }
  }

  /**
   * Advance the dust (gravity `g` towards the centre, drag `drag` 1/s; `groundR` the ground
   * radius near the walker, `feet` its body-fixed feet) and place everything relative to the
   * camera: `camRel` = camera - world centre (world axes), `R` body-fixed -> world.
   */
  update(dt: number, g: number, drag: number, feetUp: Vector3, groundR: number, R: Matrix3, camRel: Vector3, visible: boolean): void {
    this.group.visible = visible;
    if (!visible) return;
    const m = new Matrix4(), q = new Quaternion(), s = new Vector3(), pos = new Vector3();
    // dust
    let k = 0;
    const keep: Grain[] = [];
    for (const gr of this.grains) {
      gr.life += dt;
      if (gr.settled > 0) gr.settled += dt;
      else {
        const up = _up.copy(gr.p).normalize();
        gr.v.addScaledVector(up, -g * dt).multiplyScalar(Math.exp(-drag * dt));
        gr.p.addScaledVector(gr.v, dt);
        // the ground near the walker is close to the plane through its feet
        if (gr.p.dot(feetUp) < groundR) { gr.p.addScaledVector(feetUp, groundR - gr.p.dot(feetUp)); gr.settled = 1e-6; }
      }
      const alpha = gr.settled > 0 ? Math.max(0, 0.5 * (1 - gr.settled / 0.6)) : Math.min(0.5, gr.life * 6) * (drag > 0 ? Math.exp(-gr.life * 0.3) : 1);
      if (alpha <= 0.002 || gr.life > 12) continue;
      keep.push(gr);
      if (k >= MAX_DUST) continue;
      pos.copy(gr.p).applyMatrix3(R).sub(camRel);
      s.setScalar(gr.size);
      m.compose(pos, q.identity(), s);
      this.dust.setMatrixAt(k, m);
      this.dustA.setX(k, alpha);
      k++;
    }
    this.grains = keep;
    this.dust.count = k;
    this.dust.instanceMatrix.needsUpdate = true;
    this.dustA.needsUpdate = true;
    // prints (only the ones near the camera are worth drawing)
    let j = 0;
    const basis = new Matrix4();
    const right = new Vector3();
    for (const pr of this.printPos) {
      pos.copy(pr.p).applyMatrix3(R).sub(camRel);
      if (pos.lengthSq() > 250 * 250) continue;
      const upW = pr.up.clone().applyMatrix3(R).normalize();
      const fW = pr.f.clone().applyMatrix3(R).normalize();
      right.crossVectors(fW, upW).normalize();
      basis.makeBasis(right, fW, upW).setPosition(pos);
      this.prints.setMatrixAt(j, basis);
      this.printA.setX(j, pr.a);
      j++;
    }
    this.prints.count = j;
    this.prints.instanceMatrix.needsUpdate = true;
    this.printA.needsUpdate = true;
  }
}
