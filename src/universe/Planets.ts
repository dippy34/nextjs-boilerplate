import { Vector3 } from 'three';
import { solveKeplerElliptic } from '../astro/kepler';
import { AU, DAY, J2000_JD, PC, SUN_ABS_MAG, SUN_RADIUS, SUN_TEFF } from '../core/units';
import { UPos } from '../core/upos';
import type { SpaceObject } from './Body';
import type { CatalogStar } from './Stars';

/**
 * Planetary systems around other stars: the confirmed exoplanets (NASA Exoplanet Archive, see
 * pipeline/build_exoplanets.py) and, for every other star, a system generated from the star's own
 * seed with planet occurrence rates in the spirit of the Kepler/radial-velocity statistics:
 * small planets are common (most Sun-like and M dwarf stars have several within ~1 AU), giants
 * rarer and mostly beyond the snow line, hot Jupiters about 1 %. A star always gets the same planets.
 */
const G = 6.674e-11;
const MSUN = 1.98892e30;
const MEARTH = 5.9722e24;
export const REARTH = 6.371e6;

export type PlanetType = 'lava' | 'hot' | 'desert' | 'terran' | 'ocean' | 'ice' | 'subneptune' | 'icegiant' | 'giant' | 'hotgiant';

export interface PlanetSpec {
  name: string;
  /** confirmed exoplanet (true) or generated */
  real: boolean;
  /** fields estimated rather than measured (real planets) */
  est: string[];
  aM: number;
  e: number;
  /** orbit orientation relative to the system frame (rad) */
  inc: number;
  node: number;
  omega: number;
  /** mean anomaly at J2000 (rad) */
  M0: number;
  periodS: number;
  radiusM: number;
  massKg: number;
  teqK: number;
  type: PlanetType;
  albedo: number;
  rings: boolean;
  seed: number;
  /** rotation period (s); equal to the orbital period when tidally locked */
  rotS: number;
  method?: string;
  year?: number;
}

/** small deterministic RNG */
export function rng(seed: number): () => number {
  let a = (seed * 4294967296) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashKey(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Equilibrium temperature (K) of a planet at `aM` from a star of luminosity `lumSun`, Bond albedo `A`. */
export function eqTemp(lumSun: number, aM: number, A = 0.3): number {
  return 278.6 * lumSun ** 0.25 * (1 - A) ** 0.25 / Math.sqrt(aM / AU);
}

/** Surface type from size and temperature. */
export function classify(radiusEarth: number, teq: number, r: () => number): PlanetType {
  if (radiusEarth > 8) return teq > 1000 ? 'hotgiant' : 'giant';
  if (radiusEarth > 3.6) return 'icegiant';
  if (radiusEarth > 1.75) return 'subneptune';
  if (teq > 900) return 'lava';
  if (teq > 380) return 'hot';
  // with an Earth-like greenhouse (+33 K) the surface is temperate for Teq ~225-285 K (Earth: 255 K)
  if (teq > 285) return r() < 0.55 ? 'desert' : 'ocean';
  if (teq > 225) { const u = r(); return u < 0.4 ? 'ocean' : u < 0.85 ? 'terran' : 'desert'; }
  if (teq > 190) { const u = r(); return u < 0.3 ? 'terran' : u < 0.6 ? 'desert' : 'ice'; }
  return 'ice';
}

export const ALBEDO: Record<PlanetType, number> = {
  lava: 0.1, hot: 0.12, desert: 0.3, terran: 0.3, ocean: 0.3, ice: 0.65, subneptune: 0.4, icegiant: 0.45, giant: 0.5, hotgiant: 0.08,
};

/** Rough mass from radius (Chen & Kipping 2017 mean relation), Earth units. */
export function massFromRadius(r: number): number {
  if (r < 1.23) return r ** (1 / 0.279);
  if (r < 11) return (r / (1.008 * 2.04 ** (0.279 - 0.589))) ** (1 / 0.589);
  return 318 * (0.5 + Math.min(r / 11, 3));
}

/** Star properties the generator needs, from what a catalogue star carries. */
export function starProps(s: { absMag: number; teff: number; radius: number }): { lum: number; mass: number; kind: 'dwarf' | 'giant' | 'wd' } {
  const lum = 10 ** (-0.4 * (s.absMag - SUN_ABS_MAG)) * (s.teff > 9000 || s.teff < 3800 ? 1.6 : 1); // rough bolometric correction
  const R = s.radius / SUN_RADIUS;
  if (R < 0.05) return { lum, mass: 0.6, kind: 'wd' };
  if (R > 4) return { lum, mass: 1.3, kind: 'giant' };
  return { lum, mass: Math.min(20, Math.max(0.08, (s.teff / SUN_TEFF) ** 1.7)), kind: 'dwarf' };
}

/** A deterministic system for a star without known planets. */
export function generatePlanets(star: { key: string; name: string; absMag: number; teff: number; radius: number }): PlanetSpec[] {
  const r = rng(hashKey(star.key + '/planets'));
  const { lum, mass, kind } = starProps(star);
  const T = star.teff;
  // mean number of (detectable-size) planets: compact multi-planet systems are common around
  // Sun-like and M dwarfs; hot, massive stars have fewer close-in small planets
  const mean = kind === 'wd' ? 0.3 : kind === 'giant' ? 1.6 : T > 10000 ? 1.4 : T > 7300 ? 2.6 : T < 3900 ? 3.2 : 4.4;
  if (r() < (kind === 'dwarf' ? 0.1 : 0.3)) return [];
  let n = 0;
  for (let p = Math.exp(-mean), u = r(), c = p; u > c && n < 10; ) { n++; p *= mean / n; c += p; }
  n = Math.max(1, Math.min(n, 8));
  const snow = 2.7 * Math.sqrt(lum) * AU;
  // innermost orbit: near the dust-sublimation radius (scales with the star's luminosity), and
  // outside an evolved star's envelope
  let a = Math.max(star.radius * (kind === 'giant' ? 8 : 3), (0.02 + 0.07 * r()) * lum ** 0.35 * AU);
  const giantRate = T < 3900 ? 0.08 : T > 7300 ? 0.25 : 0.2;
  const specs: { a: number; rad: number }[] = [];
  for (let i = 0; i < n; i++) {
    let rad: number;
    const beyond = a > snow;
    const u = r();
    if (!beyond && i === 0 && r() < (T > 5000 && T < 6500 ? 0.012 : 0.004)) rad = 11 + 7 * r(); // hot Jupiter
    else if (beyond && u < giantRate) rad = 9 + 4 * r();
    else if (beyond && u < giantRate + 0.25) rad = 3.6 + 2.5 * r();
    else rad = r() < 0.55 ? 0.5 + 1.2 * r() : 1.75 + 2 * r();
    specs.push({ a, rad });
    a *= 1.35 + 0.85 * r();
    if (a > 60 * AU * Math.sqrt(Math.max(mass, 0.2))) break;
  }
  // cold giants beyond the snow line (about one Sun-like star in five has one, fewer M dwarfs)
  const coldRate = kind === 'wd' ? 0.05 : T < 3900 ? 0.07 : T > 7300 ? 0.35 : 0.22;
  if (r() < coldRate) {
    let ag = Math.max(a, snow * (1 + 2.5 * r()));
    const count = 1 + (r() < 0.4 ? 1 : 0) + (r() < 0.25 ? 1 : 0);
    for (let k = 0; k < count && specs.length < 10; k++) {
      specs.push({ a: ag, rad: r() < 0.7 ? 9 + 4 * r() : 3.6 + 2.5 * r() });
      ag *= 1.6 + 1.4 * r();
    }
  }
  const out: PlanetSpec[] = [];
  const letters = 'bcdefghijk';
  specs.forEach(({ a: aM, rad }, i) => {
    const typeR = rng(hashKey(`${star.key}/${i}`));
    const teq = eqTemp(lum, aM, 0.3);
    const type = classify(rad, teq, typeR);
    const M = massFromRadius(rad);
    const P = 2 * Math.PI * Math.sqrt(aM ** 3 / (G * mass * MSUN));
    const e = Math.min(0.6, Math.abs((rad > 8 ? 0.15 : 0.04) * Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(2 * Math.PI * r())));
    const locked = aM < 0.12 * AU * Math.cbrt(mass);
    out.push({
      name: `${star.name} ${letters[i]}`, real: false, est: [],
      aM, e, inc: ((r() - 0.5) * 4 * Math.PI) / 180, node: r() * 2 * Math.PI, omega: r() * 2 * Math.PI, M0: r() * 2 * Math.PI,
      periodS: P, radiusM: rad * REARTH, massKg: M * MEARTH, teqK: teq, type, albedo: ALBEDO[type],
      rings: (type === 'giant' || type === 'icegiant') && r() < 0.35, seed: r() * 1000,
      rotS: locked ? P : (8 + 40 * r()) * 3600,
    });
  });
  return out;
}

/** One planet as a selectable, flyable object. */
export class ExoPlanet implements SpaceObject {
  readonly kind = 'planet';
  readonly key: string;
  readonly upos = new UPos();
  readonly radius: number;
  /** position relative to the host star (m), updated with the system */
  readonly rel = new Vector3();

  constructor(readonly spec: PlanetSpec, readonly system: PlanetarySystem, index: number) {
    this.key = `exo:${system.host.key}:${index}`;
    this.radius = spec.radiusM;
  }

  get name(): string { return this.spec.name; }
  get parentObject(): SpaceObject { return this.system.host; }

  /** Hill-sphere radius (m), at least 20 planet radii: inside it the camera rides along with the planet */
  get hill(): number {
    const M = starProps(this.system.host).mass * MSUN;
    return Math.max(this.spec.aM * Math.cbrt(this.spec.massKg / (3 * M)), this.radius * 20);
  }

  info(): [string, string][] {
    const s = this.spec;
    const re = s.radiusM / REARTH, me = s.massKg / MEARTH;
    const typeName: Record<PlanetType, string> = {
      lava: 'lava world', hot: 'hot rocky planet', desert: 'desert world', terran: 'temperate rocky planet', ocean: 'ocean world',
      ice: 'frozen world', subneptune: 'sub-Neptune', icegiant: 'ice giant', giant: 'gas giant', hotgiant: 'hot Jupiter',
    };
    const est = (f: string) => (s.est.includes(f) ? ' (estimated)' : '');
    const rows: [string, string][] = [
      ['Type', s.real ? `Exoplanet: ${typeName[s.type]}${s.year ? `, found ${s.year} (${s.method})` : ''}` : `Generated planet: ${typeName[s.type]}`],
      ['Star', this.system.host.name],
      ['Radius', `${re.toFixed(re < 3 ? 2 : 1)} Earth radii${est('radius')}`],
      ['Mass', me > 100 ? `${(me / 317.8).toFixed(2)} Jupiter masses${est('mass')}` : `${me.toFixed(me < 3 ? 2 : 1)} Earth masses${est('mass')}`],
      ['Orbit', `${(s.aM / AU).toPrecision(3)} AU${est('a')}, ${s.periodS / DAY < 400 ? `${(s.periodS / DAY).toFixed(s.periodS / DAY < 10 ? 2 : 1)} days` : `${(s.periodS / DAY / 365.25).toFixed(1)} years`}`],
      ['Eccentricity', `${s.e.toFixed(2)}${est('e')}`],
      ['Temperature', `~${Math.round(s.teqK)} K (equilibrium)`],
    ];
    if (s.rotS === s.periodS) rows.push(['Rotation', 'tidally locked (one side always faces the star)']);
    if (!s.real) rows.push(['Origin', 'procedural: generated from the star, not observed']);
    return rows;
  }
}

/** A star's planets; positions follow Kepler orbits in the system's own plane. */
export class PlanetarySystem {
  readonly planets: ExoPlanet[];
  /** orbital plane basis (world): e1, e2 in the plane, n the normal */
  readonly e1 = new Vector3();
  readonly e2 = new Vector3();
  readonly n = new Vector3();

  constructor(readonly host: CatalogStar, specs: PlanetSpec[], readonly real: boolean, normal: Vector3) {
    this.n.copy(normal).normalize();
    const ref = Math.abs(this.n.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0);
    this.e1.crossVectors(this.n, ref).normalize();
    this.e2.crossVectors(this.n, this.e1);
    this.planets = specs.map((s, i) => new ExoPlanet(s, this, i));
  }

  /** Planet position relative to the star (m) at Julian date `jd`. */
  position(s: PlanetSpec, jd: number, out: Vector3): Vector3 {
    const M = s.M0 + ((2 * Math.PI) / s.periodS) * (jd - J2000_JD) * DAY;
    const E = solveKeplerElliptic(M, s.e);
    const x = s.aM * (Math.cos(E) - s.e), y = s.aM * Math.sqrt(1 - s.e * s.e) * Math.sin(E);
    // perifocal -> plane frame (argument of periapsis, node, small inclination about the node line)
    const cw = Math.cos(s.omega), sw = Math.sin(s.omega);
    const xp = x * cw - y * sw, yp = x * sw + y * cw;
    const cn = Math.cos(s.node), sn = Math.sin(s.node), ci = Math.cos(s.inc), si = Math.sin(s.inc);
    const px = xp * cn - yp * ci * sn, py = xp * sn + yp * ci * cn, pz = yp * si;
    return out.copy(this.e1).multiplyScalar(px).addScaledVector(this.e2, py).addScaledVector(this.n, pz);
  }

  update(jd: number): void {
    for (const p of this.planets) {
      this.position(p.spec, jd, p.rel);
      p.upos.copy(this.host.upos).addVec(p.rel);
    }
  }
}

/** Light from the host at distance d (m): irradiance in engine units (Sun at 1 AU = π). */
export function hostIrradiance(absMag: number, dM: number): number {
  return Math.PI * 10 ** (-0.4 * (absMag - SUN_ABS_MAG)) * (AU / dM) ** 2;
}

export const PC_M = PC;
