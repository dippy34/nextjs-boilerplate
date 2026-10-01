import { Matrix3, Matrix4, Vector3 } from 'three';
import { type ApproxElements, Ephemeris } from '../astro/ephemeris';
import { elementsFromMeanAnomaly, keplerState, type OrbitalElements } from '../astro/kepler';
import { evaluateRotation, type NutPrecAngles, orientationMatrix, type Orientation, type RotationModel } from '../astro/rotation';
import { eclToEqu, OBLIQUITY_J2000, poleFrame } from '../core/frames';
import { setLeapSeconds } from '../core/time';
import { AU, DAY, GM_SUN, J2000_JD, SUN_ABS_MAG, SUN_TEFF } from '../core/units';
import { Body, type BodyType } from './Body';

interface SatOrbit {
  frame: 'ecliptic' | 'equatorial' | 'laplace';
  epochJd: number; a: number; e: number; w: number; M: number; i: number; node: number; P: number;
  Pw?: number; Pnode?: number; poleRa?: number; poleDec?: number; ephemeris?: string;
}
interface KeplerEphem { kind: 'kepler'; frame: 'ecliptic'; center: number; epochJd: number; a: number; e: number; i: number; node: number; w: number; M: number }
interface SpkEphem { kind: 'spk'; chain: [number, number][]; barycenter?: number }
interface SatEphem { kind: 'satellite'; orbit: SatOrbit }

interface BodyJson {
  id: number; name: string; fullName?: string; type: BodyType; parent: number | null;
  ephem: SpkEphem | SatEphem | KeplerEphem;
  radii?: number[]; radiusSource?: string; gm?: number; systemGm?: number; rot?: RotationModel;
  albedo?: number; V10?: number; H?: number; texture?: string; color?: number[]; teff?: number; absMag?: number;
  spectralType?: string; rotPeriodDays?: number; rotPeriodHours?: number; orbitClass?: string;
}

export interface SystemJson {
  nutPrecAngles: NutPrecAngles;
  leapSeconds: [number, number, number, number][];
  approxElements: Record<string, ApproxElements>;
  bodies: BodyJson[];
}

const APPROX_NAME: Record<number, string> = { 199: 'Mercury', 299: 'Venus', 499: 'Mars', 599: 'Jupiter', 699: 'Saturn', 799: 'Uranus', 899: 'Neptune' };

/** Cheap deterministic hash in [0, 1). */
export function hash01(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

export class SolarSystem {
  readonly bodies: Body[] = [];
  readonly byId = new Map<number, Body>();
  readonly sun: Body;
  /** true when the current positions come from DE442S (false: approximate elements) */
  usingDE = false;
  jd = J2000_JD;

  private ephemOf = new Map<Body, BodyJson['ephem']>();
  private satFrames = new Map<Body, Matrix3>();
  private keplerEl = new Map<Body, OrbitalElements>();
  private angles: NutPrecAngles;
  private tmp = new Vector3();
  private tmp2 = new Vector3();
  private orient: Orientation = { ra: 0, dec: 0, w: 0 };

  constructor(readonly data: SystemJson, readonly ephemeris: Ephemeris) {
    this.angles = data.nutPrecAngles;
    setLeapSeconds(data.leapSeconds);
    for (const bj of data.bodies) {
      const b = new Body(bj.id, bj.name, bj.type);
      const r = (bj.radii ?? []).map((x) => x * 1e3);
      if (r.length === 3) {
        b.radii = [r[0], r[1], r[2]];
      } else {
        // No measured size in the sources: deterministic procedural estimate (flagged in the UI).
        const est = (1 + 3 * hash01(bj.id)) * 1e3;
        b.radii = [est, est, est];
        b.radiusEstimated = true;
      }
      b.radius = Math.cbrt(b.radii[0] * b.radii[1] * b.radii[2]);
      b.gm = (bj.gm ?? 0) * 1e9;
      b.systemGm = (bj.systemGm ?? bj.gm ?? 0) * 1e9;
      b.rotation = bj.rot ?? null;
      b.texture = bj.texture ?? null;
      if (bj.color) b.color = [bj.color[0], bj.color[1], bj.color[2]];
      if (bj.albedo !== undefined) b.albedo = bj.albedo;
      else if (bj.type === 'moon' || bj.type === 'asteroid' || bj.type === 'tno') b.albedo = 0.1 + 0.4 * hash01(bj.id + 7);
      if (bj.type === 'star') {
        b.teff = bj.teff ?? SUN_TEFF;
        b.absMag = bj.absMag ?? SUN_ABS_MAG;
      }
      b.meta = { ...bj, ephem: undefined };
      this.bodies.push(b);
      this.byId.set(bj.id, b);
      this.ephemOf.set(b, bj.ephem);
    }
    for (const bj of data.bodies) {
      const b = this.byId.get(bj.id)!;
      if (bj.parent !== null) {
        const p = this.byId.get(bj.parent) ?? null;
        b.parent = p;
        p?.children.push(b);
      }
    }
    this.sun = this.byId.get(10)!;
    // Precompute frames / elements.
    for (const b of this.bodies) {
      const e = this.ephemOf.get(b)!;
      if (e.kind === 'satellite') {
        const o = e.orbit;
        let frame: Matrix3;
        if (o.frame === 'laplace' && o.poleRa !== undefined && o.poleDec !== undefined) frame = poleFrame(o.poleRa, o.poleDec);
        else if (o.frame === 'equatorial' && b.parent?.rotation) {
          const pr = b.parent.rotation;
          frame = poleFrame(pr.ra[0], pr.dec[0]);
        } else {
          // ecliptic J2000 -> ICRF
          const c = Math.cos(OBLIQUITY_J2000), s = Math.sin(OBLIQUITY_J2000);
          frame = new Matrix3().set(1, 0, 0, 0, c, -s, 0, s, c);
        }
        this.satFrames.set(b, frame);
      } else if (e.kind === 'kepler') {
        this.keplerEl.set(b, elementsFromMeanAnomaly(e.a * 1e3, e.e, e.i, e.node, e.w, e.M, e.epochJd, GM_SUN + b.gm));
      }
    }
  }

  static async load(baseUrl: string): Promise<SolarSystem> {
    const res = await fetch(`${baseUrl}/solar/system.json`);
    if (!res.ok) throw new Error(`system.json: HTTP ${res.status}`);
    const data = (await res.json()) as SystemJson;
    const eph = await Ephemeris.load(`${baseUrl}/ephem`, data.approxElements);
    return new SolarSystem(data, eph);
  }

  /** Osculating-ish elements of a satellite's mean orbit at `jd` (in its own plane frame), with secular precession. */
  satelliteElements(b: Body, jd: number): { el: OrbitalElements; frame: Matrix3 } | null {
    const e = this.ephemOf.get(b);
    if (!e || e.kind !== 'satellite' || !b.parent) return null;
    const o = e.orbit;
    const dt = jd - o.epochJd;
    const years = dt / 365.25;
    const retro = Math.cos((o.i * Math.PI) / 180) < 0 ? -1 : 1;
    const w = o.w + (o.Pw ? (360 * years) / o.Pw : 0);
    const node = o.node - (o.Pnode ? (retro * 360 * years) / o.Pnode : 0);
    const M = o.M + (360 * dt) / o.P;
    const mu = (b.parent.gm || b.parent.systemGm) + b.gm;
    // Derive mu-consistent elements from the tabulated period to keep the mean motion exact.
    const n = (2 * Math.PI) / (o.P * DAY);
    const a = o.a * 1e3;
    const muEff = n * n * a * a * a;
    const el = elementsFromMeanAnomaly(a, o.e, o.i, node, w, M, jd, muEff || mu);
    return { el, frame: this.satFrames.get(b)! };
  }

  heliocentricElements(b: Body): OrbitalElements | null {
    return this.keplerEl.get(b) ?? null;
  }

  ephemerisKind(b: Body): string {
    return this.ephemOf.get(b)?.kind ?? 'none';
  }

  /** Update every body's position, velocity and orientation for TDB Julian date `jd`. */
  update(jd: number, timeDirection = 0): void {
    this.jd = jd;
    const eph = this.ephemeris;
    eph.request(jd, timeDirection);
    const de = eph.isLoaded(jd);
    this.usingDE = de;
    const v = this.tmp, v2 = this.tmp2;

    // 1) Sun and planet (barycentre) positions
    for (const b of this.bodies) {
      const e = this.ephemOf.get(b)!;
      if (e.kind !== 'spk') continue;
      b.valid = true;
      if (de) {
        b.pos.set(0, 0, 0);
        b.vel.set(0, 0, 0);
        for (const [c, t] of e.chain) {
          eph.evaluate(c, t, jd, v, v2);
          b.pos.addScaledVector(v, 1e3);
          b.vel.addScaledVector(v2, 1e3 / DAY);
        }
      } else if (b.id === 10) {
        b.pos.set(0, 0, 0);
        b.vel.set(0, 0, 0);
      } else if (b.id === 999) {
        // Pluto outside DE coverage: no approximate elements published; keep last known position.
        b.valid = b.pos.lengthSq() > 0;
      } else {
        const name = b.id === 399 ? 'EMB' : APPROX_NAME[b.id];
        eph.approxHeliocentric(name, jd, b.pos);
        eph.approxHeliocentric(name, jd + 0.01, v);
        b.vel.copy(v).sub(b.pos).divideScalar(0.01 * DAY);
      }
    }

    // 2) Moons relative to their planet (mean elements); fall back for the Moon outside DE.
    const moonRel = new Map<Body, Vector3>();
    for (const b of this.bodies) {
      const e = this.ephemOf.get(b)!;
      if (e.kind !== 'satellite') continue;
      if (b.id === 301 && de) {
        // DE442S: Moon relative to Earth = (EMB->Moon) - (EMB->Earth)
        const rel = new Vector3(), rv = new Vector3();
        eph.evaluate(3, 301, jd, rel, rv);
        eph.evaluate(3, 399, jd, v, v2);
        rel.sub(v).multiplyScalar(1e3);
        b.vel.copy(rv.sub(v2).multiplyScalar(1e3 / DAY));
        moonRel.set(b, rel);
        continue;
      }
      const s = this.satelliteElements(b, jd);
      if (!s) continue;
      const rel = new Vector3();
      const vel = new Vector3();
      keplerState(s.el, jd, rel, vel);
      rel.applyMatrix3(s.frame);
      vel.applyMatrix3(s.frame);
      moonRel.set(b, rel);
      b.vel.copy(vel);
    }

    // 3) Planet body = barycentre - sum(m_i/M) r_i ; then moons absolute
    for (const p of this.bodies) {
      const e = this.ephemOf.get(p)!;
      if (e.kind !== 'spk' || !e.barycenter || !p.systemGm) continue;
      for (const m of p.children) {
        const r = moonRel.get(m);
        if (r && m.gm > 0) p.pos.addScaledVector(r, -m.gm / p.systemGm);
      }
    }
    if (!de) {
      // Earth from EMB using the mean-element Moon
      const earth = this.byId.get(399)!;
      const moon = this.byId.get(301)!;
      const r = moonRel.get(moon);
      if (r) earth.pos.addScaledVector(r, -moon.gm / (earth.gm + moon.gm));
    }
    for (const [m, r] of moonRel) {
      const p = m.parent!;
      m.pos.copy(p.pos).add(r);
      m.vel.add(p.vel);
      m.valid = p.valid;
    }

    // 4) Minor bodies on heliocentric Kepler orbits
    for (const [b, el] of this.keplerEl) {
      keplerState(el, jd, v, v2);
      eclToEqu(v);
      eclToEqu(v2);
      b.pos.copy(this.sun.pos).add(v);
      b.vel.copy(this.sun.vel).add(v2);
    }

    // 5) Absolute positions and orientation
    for (const b of this.bodies) {
      b.upos.set(b.pos.x, b.pos.y, b.pos.z);
      this.updateOrientation(b, jd);
    }
  }

  private updateOrientation(b: Body, jd: number): void {
    if (b.rotation) {
      evaluateRotation(b.rotation, this.angles, jd, this.orient);
      orientationMatrix(this.orient, b.orientation);
      return;
    }
    const p = b.parent;
    const hours = (b.meta.rotPeriodHours as number | undefined) ?? null;
    if (b.kind === 'moon' && p) {
      // Synchronous rotation (tidal locking): prime meridian faces the planet, pole along the orbit normal.
      const r = this.tmp.copy(p.pos).sub(b.pos).normalize();
      const relVel = this.tmp2.copy(b.vel).sub(p.vel);
      const n = new Vector3().crossVectors(r, relVel).normalize().negate();
      if (n.lengthSq() < 0.5) n.set(0, 0, 1);
      const y = new Vector3().crossVectors(n, r).normalize();
      const x = new Vector3().crossVectors(y, n);
      b.orientation.makeBasis(x, y, n);
      return;
    }
    // Uniform spin about the ecliptic pole with the catalogued period (or a procedural one).
    const periodDays = hours ? hours / 24 : 0.2 + 1.5 * hash01(b.id + 3);
    const w = (((jd - J2000_JD) / periodDays) * 360 + 360 * hash01(b.id)) % 360;
    orientationMatrix({ ra: 270, dec: 66.560708, w }, b.orientation);
  }

  /** Bodies whose position is meaningful right now. */
  *visibleBodies(): Iterable<Body> {
    for (const b of this.bodies) if (b.valid) yield b;
  }

  sunDistanceAU(b: Body): number {
    return b.pos.distanceTo(this.sun.pos) / AU;
  }

  /** Matrix4 helper used by renderers (body-fixed -> ICRF, with ellipsoid scale). */
  bodyMatrix(b: Body, out = new Matrix4()): Matrix4 {
    return out.copy(b.orientation).scale(new Vector3(b.radii[0], b.radii[1], b.radii[2]));
  }
}
