import { Matrix3, Vector3 } from 'three';
import { GAL_TO_EQU, raDecToVector } from '../core/frames';

/**
 * Parametric model of the Milky Way, used for the galaxy's glow, its dust and the procedural stars
 * that fill the galaxy beyond the star catalogues. All lengths in parsecs.
 *
 * Galactocentric frame: origin at Sgr A* (SIMBAD position, GRAVITY 2022 distance R0 = 8277 pc),
 * z towards the north Galactic pole, x along the Sun -> centre direction projected on the plane,
 * y = z × x (towards Galactic longitude 90°, the direction of the Sun's orbital motion: the disk
 * turns clockwise seen from the north pole).
 *
 * Components (densities relative to the old thin disk at the Sun):
 *  - thin disk: exponential, scale length 2.6 kpc, scale height 260 pc (Bland-Hawthorn & Gerhard
 *    2016 review values), with a central hole where the bar takes over;
 *  - young disk: scale height 90 pc, concentrated in the spiral arms (OB stars, gas, dust);
 *  - thick disk: scale length 2.0 kpc, height 900 pc, 12 % of the thin disk locally;
 *  - bar/bulge: the boxy "G2" model of Dwek et al. 1995 (ApJ 445, 716) with half-lengths
 *    1.7 / 0.64 / 0.44 kpc, near end at positive longitude, 27° from the Sun–centre line
 *    (Wegg & Gerhard 2013);
 *  - nuclear star cluster around Sgr A*: ~2.5e7 solar masses within a few parsecs (Schödel et al. 2014);
 *  - spiral arms: four logarithmic arms, pitch 12°, crossing the Sun–centre line at 4.9 (Scutum),
 *    6.9 (Sagittarius), 9.6 (Perseus) and 13.5 kpc (Outer), roughly as in Reid et al. 2019
 *    (ApJ 885, 131), plus the local (Orion) spur through the Sun;
 *  - dust: exponential, scale height 110 pc, following the arms, normalised to ~0.8 mag of visual
 *    extinction per kpc in the plane near the Sun.
 * The arm positions are a smooth idealisation; the clumpy structure (clouds, star-forming knots)
 * is procedural noise added in the renderer.
 */
export const R0 = 8277;
const SGR_A_RA = 266.41683708;
const SGR_A_DEC = -29.00781056;

export const ARM_PITCH = (12 * Math.PI) / 180;
export const ARM_R_SUN = 6900;  // radius where the first (Sagittarius) arm crosses the Sun's azimuth
export const ARM_STRENGTH = [0.6, 1.0, 0.6, 1.0]; // Sagittarius, Perseus, Outer, Scutum–Centaurus
export const ARM_WIDTH = 350;
export const BAR_ANGLE = (27 * Math.PI) / 180;

/** ICRF heliocentric (pc) <-> galactocentric (pc). */
export class GalaxyFrame {
  /** galactocentric axes as columns, in ICRF */
  readonly axes: Matrix3;
  readonly toGalM: Matrix3;
  /** position of the Galactic centre (Sgr A*) in ICRF heliocentric pc */
  readonly centre: Vector3;
  /** the Sun in galactocentric coordinates */
  readonly sun: Vector3;

  constructor() {
    this.centre = raDecToVector(SGR_A_RA, SGR_A_DEC).multiplyScalar(R0);
    const e = GAL_TO_EQU.elements;
    const z = new Vector3(e[6], e[7], e[8]).normalize(); // third column: galactic north pole
    const x = this.centre.clone().addScaledVector(z, -this.centre.dot(z)).normalize();
    const y = new Vector3().crossVectors(z, x);
    this.axes = new Matrix3().set(x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z);
    this.toGalM = this.axes.clone().transpose();
    this.sun = this.toGal(new Vector3(0, 0, 0));
  }

  toGal(icrfPc: Vector3, out = new Vector3()): Vector3 {
    return out.copy(icrfPc).sub(this.centre).applyMatrix3(this.toGalM);
  }

  toIcrf(galPc: Vector3, out = new Vector3()): Vector3 {
    return out.copy(galPc).applyMatrix3(this.axes).add(this.centre);
  }

  /** direction ICRF -> galactocentric axes (no translation) */
  dirToGal(d: Vector3, out = new Vector3()): Vector3 {
    return out.copy(d).applyMatrix3(this.toGalM);
  }
}

export const GALAXY = new GalaxyFrame();

/** Spiral-arm and local-spur enhancement at galactocentric (x, y). */
export function armFactor(x: number, y: number): number {
  const R = Math.hypot(x, y);
  if (R < 1) return 0;
  const th = Math.atan2(y, x);
  const base = Math.PI + Math.log(R / ARM_R_SUN) / Math.tan(ARM_PITCH);
  let a = 0;
  for (let j = 0; j < 4; j++) {
    let d = th - (base - (j * Math.PI) / 2);
    d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
    const perp = R * d * Math.sin(ARM_PITCH);
    a += ARM_STRENGTH[j] * Math.exp(-(perp * perp) / (2 * ARM_WIDTH * ARM_WIDTH));
  }
  // arms start at the ends of the bar and fade in the far outer disk
  a *= smoothstep(2800, 4200, R) * (1 - smoothstep(14000, 17000, R));
  // the local (Orion) spur: a short arm segment through the Sun's neighbourhood
  const sx = x + R0, sy = y;
  const along = sx * Math.sin(ARM_PITCH) + sy * Math.cos(ARM_PITCH);
  const across = sx * Math.cos(ARM_PITCH) - sy * Math.sin(ARM_PITCH);
  a += 0.55 * Math.exp(-(across * across) / (2 * 300 * 300)) * Math.exp(-(along * along) / (2 * 2500 * 2500));
  return a;
}

export interface Populations {
  /** old thin disk */
  thin: number;
  /** young disk (follows the arms) */
  young: number;
  thick: number;
  bulge: number;
  /** nuclear star cluster */
  nsc: number;
  /** dust, relative to the mean in-plane value at the Sun */
  dust: number;
}

/** Densities at galactocentric p (pc), relative to the old thin disk at the Sun. */
export function populations(p: Vector3, out?: Populations): Populations {
  const o = out ?? { thin: 0, young: 0, thick: 0, bulge: 0, nsc: 0, dust: 0 };
  const R = Math.hypot(p.x, p.y);
  const az = Math.abs(p.z);
  const hole = 1 - Math.exp(-((R / 3000) ** 3));
  const outer = R > 15000 ? Math.exp(-(R - 15000) / 1200) : 1;
  const arms = armFactor(p.x, p.y);
  o.thin = Math.exp(-(R - R0) / 2600) * Math.exp(-az / 260) * hole * outer;
  o.young = Math.exp(-(R - R0) / 3500) * Math.exp(-az / 90) * hole * outer * (0.12 + 1.4 * arms);
  o.thick = 0.12 * Math.exp(-(R - R0) / 2000) * Math.exp(-az / 900) * outer;
  const c = Math.cos(BAR_ANGLE), s = Math.sin(BAR_ANGLE);
  const xb = p.x * c - p.y * s, yb = p.x * s + p.y * c;
  const rs = Math.pow(((xb / 1700) ** 2 + (yb / 640) ** 2) ** 2 + (p.z / 440) ** 4, 0.25);
  o.bulge = 50 * Math.exp(-0.5 * rs * rs);
  const r = Math.hypot(R, p.z);
  o.nsc = (1.2e6 / (1 + (r / 1.5) ** 1.8)) * Math.exp(-((r / 40) ** 2));
  o.dust = (Math.exp(-(R - R0) / 3200) * Math.exp(-az / 110) * hole * outer * (0.3 + 1.1 * arms)) / DUST_NORM;
  return o;
}

/** mean of (0.3 + 1.1 arms) * hole over the Sun's 1-kpc neighbourhood in the plane (computed once) */
export const DUST_NORM = (() => {
  let s = 0, n = 0;
  for (let i = -5; i <= 5; i++) {
    for (let j = -5; j <= 5; j++) {
      const x = -R0 + i * 100, y = j * 100;
      const R = Math.hypot(x, y);
      s += (0.3 + 1.1 * armFactor(x, y)) * Math.exp(-(R - R0) / 3200);
      n++;
    }
  }
  return s / n;
})();

/** visual extinction per parsec for unit relative dust density (0.8 mag/kpc near the Sun) */
export const AV_PER_PC = 0.8e-3;

/**
 * Visual extinction (mag) along the straight path between two galactocentric points, by
 * midpoint integration with `steps` samples (skips the first `skip` pc around `a`).
 */
export function extinction(a: Vector3, b: Vector3, steps = 24): number {
  const d = b.clone().sub(a);
  const L = d.length();
  if (L < 1) return 0;
  const p = new Vector3();
  const pop = { thin: 0, young: 0, thick: 0, bulge: 0, nsc: 0, dust: 0 };
  let s = 0;
  for (let i = 0; i < steps; i++) {
    p.copy(a).addScaledVector(d, (i + 0.5) / steps);
    s += populations(p, pop).dust;
  }
  return (s / steps) * L * AV_PER_PC;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Visual (V) luminosity density, solar luminosities per pc³, of each population at relative
 * density 1: the old disk ~0.03 near the Sun, OB stars of the young disk ~0.02, the bulge with the
 * old disk's mass-to-light ratio (centre ~1.5 L☉/pc³).
 */
export const LUM = { thin: 0.03, young: 0.025, thick: 0.03, bulge: 0.03, nsc: 0.03 };
/** colour temperatures used to tint each population's light */
export const POP_TEFF = { old: 4800, young: 11000, bulge: 4300 };
/** extinction relative to V at the red, green and blue primaries (Cardelli et al. 1989 at 610/550/465 nm) */
export const EXT_RGB: [number, number, number] = [0.83, 1.0, 1.25];

/**
 * Integrated V luminosity per unit area (L☉/pc², i.e. ∫ j ds) seen from galactocentric `o` along unit
 * direction `d`, with dust extinction, ignoring the first `near` pc. CPU reference of the renderer's
 * glow (without its procedural clumps), used for calibration and tests.
 */
export function glowColumn(o: Vector3, d: Vector3, steps = 400, near = 20): number {
  const [t0, t1] = galaxyBounds(o, d);
  if (t1 <= Math.max(t0, near)) return 0;
  // log-spaced samples from 1 pc (dust in front always counts); light only beyond `near`
  const a = Math.max(t0, 1), b = t1;
  const k = Math.log(b / a);
  const p = new Vector3();
  const pop = { thin: 0, young: 0, thick: 0, bulge: 0, nsc: 0, dust: 0 };
  let L = 0, tauV = 0;
  for (let i = 0; i < steps; i++) {
    const t = a * Math.exp((k * (i + 0.5)) / steps);
    const ds = (t * k) / steps;
    p.copy(o).addScaledVector(d, t);
    populations(p, pop);
    const j = LUM.thin * pop.thin + LUM.young * pop.young + LUM.thick * pop.thick + LUM.bulge * pop.bulge + LUM.nsc * pop.nsc;
    const dt = 0.921 * AV_PER_PC * pop.dust * ds;
    L += j * ds * Math.exp(-tauV - dt / 2) * nearWeight(t, near);
    tauV += dt;
  }
  return L;
}

/** fraction of the light at distance t that belongs to the glow (the rest is drawn as stars) */
export function nearWeight(t: number, near: number): number {
  return smoothstep(near * 0.5, near * 1.5, t);
}

/** Parameter range [t0, t1] where the ray o + t d is inside the galaxy's volume (R < 22 kpc, |z| < 4 kpc). */
export function galaxyBounds(o: Vector3, d: Vector3): [number, number] {
  const RMAX = 22000, ZMAX = 4000;
  let t0 = 0, t1 = 1e9;
  if (Math.abs(d.z) > 1e-12) {
    const a = (-ZMAX - o.z) / d.z, b = (ZMAX - o.z) / d.z;
    t0 = Math.max(t0, Math.min(a, b));
    t1 = Math.min(t1, Math.max(a, b));
  } else if (Math.abs(o.z) > ZMAX) return [0, 0];
  const A = d.x * d.x + d.y * d.y;
  const B = 2 * (o.x * d.x + o.y * d.y);
  const C = o.x * o.x + o.y * o.y - RMAX * RMAX;
  if (A > 1e-12) {
    const disc = B * B - 4 * A * C;
    if (disc < 0) return [0, 0];
    const q = Math.sqrt(disc);
    t0 = Math.max(t0, (-B - q) / (2 * A));
    t1 = Math.min(t1, (-B + q) / (2 * A));
  } else if (C > 0) return [0, 0];
  return t1 > t0 ? [t0, t1] : [0, 0];
}
