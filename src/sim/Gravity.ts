import { type Matrix4, Vector3 } from 'three';
import { UPos } from '../core/upos';

export const G = 6.6743e-11;
export const C = 299_792_458;
export const MSUN = 1.98892e30;

/**
 * One point mass of the gravity field. Read live every step: whoever owns the object (the
 * ephemeris today, the god-mode N-body sandbox tomorrow) moves it, and the ship feels it.
 */
export interface GravitySource {
  /** the object this source stands for (Body, BlackHole, CatalogStar...) */
  readonly obj: object | null;
  name: string;
  /** absolute position (live) */
  readonly upos: UPos;
  /** m^3/s^2 */
  gm: number;
  /** physical radius (m): the gravity is that of a uniform sphere inside it (no singularity) */
  radius: number;
  /** Schwarzschild radius (m) for black holes: Paczyński–Wiita potential; 0 = Newtonian */
  rs: number;
  /** velocity (m/s, world axes); zero for fixed sources */
  readonly vel: Vector3;
  /** true when the source is itself accelerated by the other moving sources of its group (ephemeris / N-body) */
  moving: boolean;
  /** sources of one group pull on each other (the Solar System, one star's planets...) */
  group: string;
  /** primary it orbits (for spheres of influence), or null for roots */
  parent: GravitySource | null;
  /** sphere of influence radius (m); Infinity for roots */
  soi: number;
  /** body-fixed -> world rotation (live), for landing on a spinning world; null if none */
  orient: Matrix4 | null;
}

export function makeSource(p: Partial<GravitySource> & { name: string; gm: number }): GravitySource {
  return {
    obj: p.obj ?? null, name: p.name, upos: p.upos ?? new UPos(), gm: p.gm, radius: p.radius ?? 0, rs: p.rs ?? 0,
    vel: p.vel ?? new Vector3(), moving: p.moving ?? false, group: p.group ?? '', parent: p.parent ?? null, soi: p.soi ?? Infinity, orient: p.orient ?? null,
  };
}

/**
 * Acceleration at offset (dx, dy, dz) from a point mass (offset = field point - source), added to `out`.
 * Paczyński–Wiita for black holes, a = GM/(r - rs)^2: the innermost stable circular orbit falls at
 * 3 rs and the marginally bound one at 2 rs, as in Schwarzschild. Inside a body's radius, a uniform sphere.
 */
export function addPointAccel(dx: number, dy: number, dz: number, gm: number, rs: number, radius: number, out: Vector3): Vector3 {
  const r2 = dx * dx + dy * dy + dz * dz;
  const r = Math.sqrt(r2);
  if (r === 0) return out;
  let a: number;
  if (rs > 0) {
    const d = Math.max(r - rs, rs * 1e-3);
    a = gm / (d * d);
  } else if (r < radius) {
    a = (gm * r) / (radius * radius * radius);
  } else {
    a = gm / r2;
  }
  const k = -a / r;
  out.x += dx * k; out.y += dy * k; out.z += dz * k;
  return out;
}

/**
 * Radial tidal stretch (m/s^2 per metre of length) at distance r: 2GM/r^3. For a black hole this is
 * also the exact Schwarzschild value in a freely falling frame (finite at the horizon), so it is used
 * there too rather than the pseudo-potential's derivative, which diverges at rs.
 */
export function tidalGradient(gm: number, r: number): number {
  return (2 * gm) / (r * r * r);
}

/** Specific potential (J/kg, negative) of a point mass at distance r. */
export function potential(gm: number, rs: number, r: number): number {
  if (rs > 0) return -gm / Math.max(r - rs, rs * 1e-3);
  return -gm / Math.max(r, 1);
}

/**
 * The gravity field felt by the ship: every source the providers list, read live. `refresh()`
 * rebuilds the list (once a frame); `gravityAt()` sums them.
 */
export class GravityField {
  sources: GravitySource[] = [];
  /** called by refresh(): returns every candidate source this frame */
  provider: (() => GravitySource[]) | null = null;

  refresh(): void {
    if (this.provider) this.sources = this.provider();
  }

  /** Total gravitational acceleration (m/s^2, world axes) at absolute position `upos`. */
  gravityAt(upos: UPos, out = new Vector3()): Vector3 {
    out.set(0, 0, 0);
    const d = _d;
    for (const s of this.sources) {
      upos.sub(s.upos, d);
      addPointAccel(d.x, d.y, d.z, s.gm, s.rs, s.radius, out);
    }
    return out;
  }

  /**
   * The dominant body: the root source (no parent) pulling hardest, then down through the
   * children whose sphere of influence holds the point (the smallest wins).
   */
  dominantAt(upos: UPos): GravitySource | null {
    let root: GravitySource | null = null, best = 0;
    for (const s of this.sources) {
      if (s.parent) continue;
      const r2 = upos.sub(s.upos, _d).lengthSq();
      const a = s.gm / Math.max(r2, 1);
      if (a > best) { best = a; root = s; }
    }
    if (!root) return null;
    let cur = root;
    for (let depth = 0; depth < 4; depth++) {
      let next: GravitySource | null = null;
      for (const s of this.sources) {
        if (s.parent !== cur) continue;
        if (upos.sub(s.upos, _d).length() < s.soi && (!next || s.soi < next.soi)) next = s;
      }
      if (!next) break;
      cur = next;
    }
    return cur;
  }
}

const _d = new Vector3();

/** The shared field the app fills (src/game/Flight.ts) and the ship reads. */
export const gravity = new GravityField();

/** Total gravitational acceleration at `upos` from the live bodies, holes and stars. */
export function gravityAt(upos: UPos, out = new Vector3()): Vector3 {
  return gravity.gravityAt(upos, out);
}

/** Sphere-of-influence radius (Laplace) of a body of `gm` orbiting a primary of `gmPrimary` at distance `a`. */
export function laplaceSoi(a: number, gm: number, gmPrimary: number): number {
  return a * Math.pow(gm / gmPrimary, 0.4);
}
