import { Vector3 } from 'three';
import { craterField, type Ground, vnoise } from './Terrain';
import type { ExoPlanet } from './Planets';

// ------------------------------------------------------------------ CPU copy of shaders/planet.ts
// The generated planets are coloured on the GPU by `terrain()` in EXO_FRAG; the landing terrain
// raises the ground by the same function, so mountains, coasts and seas match their colours.
// value noise on an integer lattice hash: exact in both (a float hash differs between float32 and
// float64 wherever its fract() wraps)
function lh(x: number, y: number, z: number): number {
  let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791);
  h = Math.imul(h ^ (h >>> 16), 73244475);
  h = Math.imul(h ^ (h >>> 16), 73244475);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function pn(x: number, y: number, z: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const m = (a: number, b: number, t: number) => a + (b - a) * t;
  return m(
    m(m(lh(ix, iy, iz), lh(ix + 1, iy, iz), fx), m(lh(ix, iy + 1, iz), lh(ix + 1, iy + 1, iz), fx), fy),
    m(m(lh(ix, iy, iz + 1), lh(ix + 1, iy, iz + 1), fx), m(lh(ix, iy + 1, iz + 1), lh(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}
function fbmN(x: number, y: number, z: number, n: number): number {
  let s = 0, a = 0.5;
  for (let i = 0; i < n; i++) {
    s += a * pn(x, y, z);
    x = x * 2.03 + 1.7; y = y * 2.03 + 1.7; z = z * 2.03 + 1.7;
    a *= 0.5;
  }
  return s;
}
function ridgedN(x: number, y: number, z: number, n: number): number {
  let s = 0, a = 0.5, w = 1;
  for (let i = 0; i < n; i++) {
    let r = 1 - Math.abs(pn(x, y, z) * 2 - 1);
    r *= r;
    s += a * r * w;
    w = Math.min(1, Math.max(0, r * 1.6));
    x = x * 2.1 + 3.1; y = y * 2.1 + 3.1; z = z * 2.1 + 3.1;
    a *= 0.5;
  }
  return s;
}
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** `terrain(n)` of EXO_FRAG (0..~1); `lite` = the headset variant (LITE.uLite) */
export function exoTerrain(n: Vector3, seed: number, lite: boolean): number {
  const qx = n.x * 2.2 + seed, qy = n.y * 2.2 + seed, qz = n.z * 2.2 + seed;
  const hx = qx * 0.5, hy = qy * 0.5, hz = qz * 0.5;
  let wx: number, wy: number, wz: number;
  if (lite) {
    wx = pn(hx + 1.3, hy + 1.3, hz + 1.3) - 0.5;
    wy = pn(hx + 7.9, hy + 7.9, hz + 7.9) - 0.5;
    wz = pn(hx + 4.1, hy + 4.1, hz + 4.1) - 0.5;
  } else {
    wx = fbmN(hx + 1.3, hy + 1.3, hz + 1.3, 4) - 0.5;
    wy = fbmN(hx + 7.9, hy + 7.9, hz + 7.9, 4) - 0.5;
    wz = fbmN(hx + 4.1, hy + 4.1, hz + 4.1, 4) - 0.5;
  }
  const cx = qx * 0.7 + wx * 2, cy = qy * 0.7 + wy * 2, cz = qz * 0.7 + wz * 2;
  let cont = fbmN(cx, cy, cz, lite ? 4 : 6);
  // finer octaves (fractal coasts, islands)
  if (!lite) cont += 0.045 * (fbmN(cx * 41 + wx * 3 + 5.3, cy * 41 + wy * 3 + 5.3, cz * 41 + wz * 3 + 5.3, 3) - 0.4375);
  const plate = pn(qx * 0.55 + wx * 1.4 + 11, qy * 0.55 + wy * 1.4 + 11, qz * 0.55 + wz * 1.4 + 11);
  const belt = 1 - smooth(0, 0.14, Math.abs(plate - 0.5));
  const mount = ridgedN(qx * 2 + wx, qy * 2 + wy, qz * 2 + wz, lite ? 3 : 5);
  const land = smooth(0.38, 0.6, cont);
  return 0.7 * cont + 0.3 * mount * (0.3 + 0.7 * belt) * (0.35 + 0.65 * land);
}

/** Heights of the terrain function at several quantiles of the surface. */
export function exoQuantiles(seed: number, qs: number[], samples = 600): number[] {
  const v: number[] = [];
  const n = new Vector3();
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < samples; i++) {
    const z = 1 - (2 * (i + 0.5)) / samples, r = Math.sqrt(1 - z * z), th = ga * i;
    v.push(exoTerrain(n.set(r * Math.cos(th), r * Math.sin(th), z), seed, false));
  }
  v.sort((a, b) => a - b);
  return qs.map((q) => v[Math.min(samples - 1, Math.max(0, Math.round(q * (samples - 1))))]);
}

/** Height of the terrain function at `quantile` of the surface (for a sea covering that fraction). */
export function exoQuantile(seed: number, quantile: number, samples = 600): number {
  const v: number[] = [];
  const n = new Vector3();
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < samples; i++) {
    const z = 1 - (2 * (i + 0.5)) / samples, r = Math.sqrt(1 - z * z), th = ga * i;
    v.push(exoTerrain(n.set(r * Math.cos(th), r * Math.sin(th), z), seed, false));
  }
  v.sort((a, b) => a - b);
  return v[Math.min(samples - 1, Math.max(0, Math.round(quantile * (samples - 1))))];
}

/**
 * Crater fields of generated planets, largest first: cell size (m), density and depth (x crater
 * radius). EXO_FRAG shades the first three from orbit (`craters()`), the landing ground has them all.
 */
export const EXO_CRATER_CELLS: [number, number, number][] = [[846400, 0.5, 0.04], [184000, 0.5, 0.06], [40000, 0.4, 0.18]];

/** Crater seed of a generated planet (cells of EXO_FRAG's uCSeed and the landing ground). */
export function exoCraterSeed(name: string): number {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 100003;
}

/** Planet types (EXO_FRAG uType) with a solid surface to land on. */
export const ROCKY_TYPES = new Set([0, 1, 2, 3, 4, 5]);

/**
 * The landing ground of a generated rocky planet: the shader's terrain function scaled to metres
 * (seas flat at sea level), with finer fractal relief below its smallest features and crater fields
 * on airless types.
 */
export class ExoGround implements Ground {
  readonly name: string;
  readonly radius: number;
  readonly radii: number[];
  readonly amplitude: number;
  /** headset variant of the colour noise in use (the heights follow it) */
  lite = false;
  private readonly relief: number;
  private readonly seedN: number;

  /** `craters`: crater density (EXO_FRAG uCraters; 0 = none) */
  /** `hMid`, `hSpan`: median and 10-90 % spread of the terrain function (EXO_FRAG uHMid, uHSpan) */
  constructor(readonly owner: ExoPlanet, private type: number, private seed: number, private seaLevel: number, private craters = 0,
    private hMid = 0.4, private hSpan = 0.15) {
    this.name = owner.name;
    this.radius = owner.radius;
    this.radii = [owner.radius, owner.radius, owner.radius];
    this.relief = Math.min(20e3, owner.radius * 0.002);
    this.amplitude = this.relief * 0.5;
    this.seedN = exoCraterSeed(owner.name);
  }

  ready(): boolean { return true; }

  height(n: Vector3, spacing: number): number {
    const t = exoTerrain(n, this.seed, this.lite);
    const seas = this.type === 3 || this.type === 4;
    // land fraction: 0 at the shore, 1 a little inland (seas stay flat)
    const land = seas ? Math.min(1, Math.max(0, (t - this.seaLevel) / 0.02)) : 1;
    let h = seas ? Math.max(0, t - this.seaLevel) * this.relief : (t - 0.4) * this.relief;
    if (land <= 0) return 0;
    const R = this.radius;
    const px = n.x * R, py = n.y * R, pz = n.z * R;
    const minL = Math.max(spacing * 2.5, 6);
    // the colour noise's finest octave is about R / 300 across: generated relief below that, as
    // EXO_FRAG's detail(): ridged crests in rough country (mountains, highlands), gentle rolling
    // ground on plains and lowlands
    const rough = seas ? 0.25 + 0.75 * smooth(this.seaLevel + 0.01, this.seaLevel + 0.2, t) : 0.5 + 0.5 * smooth(-0.2, 0.45, (t - this.hMid) / this.hSpan);
    const amp = (0.008 + 0.03 * rough * rough) * 2 * land;
    let o = 0;
    for (let L = R / 300; L > minL && o < 16; L *= 0.5, o++) {
      const v = vnoise(px / L, py / L, pz / L, this.seedN + o * 7);
      const r = 1 - Math.abs(2 * v - 1);
      h += ((r * r - 0.45) * rough + (v - 0.5) * (1 - rough)) * amp * L;
    }
    // crater fields (airless and thin-aired worlds): the large ones are also drawn from orbit
    if (this.craters > 0) {
      let i = 0;
      for (const [cell, dens, depth] of EXO_CRATER_CELLS) {
        if (!(i === 0 && R < 1.5e6) && cell * 0.4 >= minL) h += craterField(px, py, pz, cell, this.seedN + 100 * i, dens * this.craters, depth);
        i++;
      }
      for (let cell = EXO_CRATER_CELLS[2][0] / 4.6; cell >= 30; cell /= 4.6, i++) {
        if (cell * 0.4 < minL) break;
        h += craterField(px, py, pz, cell, this.seedN + 100 * i, 0.4 * Math.min(1, this.craters * 1.5), cell > 5000 ? 0.18 : 0.32);
      }
    }
    return Number.isFinite(h) ? h : 0;
  }
}
