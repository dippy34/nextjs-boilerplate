import type { Vector3 } from 'three';
import { craterField, type Ground, vnoise } from './Terrain';
import type { ExoPlanet } from './Planets';

// ------------------------------------------------------------------ CPU copy of shaders/planet.ts
// The generated planets are coloured on the GPU by `terrain()` in EXO_FRAG; the landing terrain
// raises the ground by the same function, so mountains, coasts and seas match their colours.
const fract = (x: number) => x - Math.floor(x);
function ph(x: number, y: number, z: number): number {
  x = fract(x * 0.1031); y = fract(y * 0.1031); z = fract(z * 0.1031);
  const d = x * (z + 31.32) + y * (y + 31.32) + z * (x + 31.32);
  x += d; y += d; z += d;
  return fract((x + y) * z);
}
function pn(x: number, y: number, z: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const m = (a: number, b: number, t: number) => a + (b - a) * t;
  return m(
    m(m(ph(ix, iy, iz), ph(ix + 1, iy, iz), fx), m(ph(ix, iy + 1, iz), ph(ix + 1, iy + 1, iz), fx), fy),
    m(m(ph(ix, iy, iz + 1), ph(ix + 1, iy, iz + 1), fx), m(ph(ix, iy + 1, iz + 1), ph(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}
function fbm(x: number, y: number, z: number, lite: boolean): number {
  let s = 0, a = 0.5;
  const n = lite ? 4 : 6;
  for (let i = 0; i < n; i++) {
    s += a * pn(x, y, z);
    x = x * 2.03 + 1.7; y = y * 2.03 + 1.7; z = z * 2.03 + 1.7;
    a *= 0.5;
  }
  return s;
}
function ridged(x: number, y: number, z: number): number {
  let s = 0, a = 0.5;
  for (let i = 0; i < 5; i++) {
    const n = 1 - Math.abs(pn(x, y, z) * 2 - 1);
    s += a * n * n;
    x = x * 2.1 + 3.1; y = y * 2.1 + 3.1; z = z * 2.1 + 3.1;
    a *= 0.5;
  }
  return s;
}
/** `terrain(n)` of EXO_FRAG (0..~1); `lite` = the headset variant (LITE.uLite) */
export function exoTerrain(n: Vector3, seed: number, lite: boolean): number {
  const qx = n.x * 2.2 + seed, qy = n.y * 2.2 + seed, qz = n.z * 2.2 + seed;
  let wx: number, wy: number, wz: number;
  if (lite) {
    wx = pn(qx * 0.7 + 1.3, qy * 0.7 + 1.3, qz * 0.7 + 1.3) - 0.5;
    wy = pn(qx * 0.7 + 7.9, qy * 0.7 + 7.9, qz * 0.7 + 7.9) - 0.5;
    wz = pn(qx * 0.7 + 4.1, qy * 0.7 + 4.1, qz * 0.7 + 4.1) - 0.5;
  } else {
    wx = fbm(qx + 1.3, qy + 1.3, qz + 1.3, false) - 0.5;
    wy = fbm(qx + 7.9, qy + 7.9, qz + 7.9, false) - 0.5;
    wz = fbm(qx + 4.1, qy + 4.1, qz + 4.1, false) - 0.5;
  }
  return 0.65 * fbm(qx + wx * 1.6, qy + wy * 1.6, qz + wz * 1.6, lite) + 0.35 * ridged(qx * 1.7 + wx, qy * 1.7 + wy, qz * 1.7 + wz);
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

  constructor(readonly owner: ExoPlanet, private type: number, private seed: number, private seaLevel: number) {
    this.name = owner.name;
    this.radius = owner.radius;
    this.radii = [owner.radius, owner.radius, owner.radius];
    this.relief = Math.min(20e3, owner.radius * 0.002);
    this.amplitude = this.relief * 0.5;
    let h = 0;
    for (const c of owner.name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    this.seedN = h % 100003;
  }

  ready(): boolean { return true; }

  height(n: Vector3, spacing: number): number {
    const t = exoTerrain(n, this.seed, this.lite);
    const seas = this.type === 3 || this.type === 4;
    // land fraction: 0 at the shore, 1 a little inland (seas stay flat)
    const land = seas ? Math.min(1, Math.max(0, (t - this.seaLevel) / 0.02)) : 1;
    let h = seas ? Math.max(0, t - this.seaLevel) * this.relief : (t - 0.5) * this.relief;
    if (land <= 0) return 0;
    const R = this.radius;
    const px = n.x * R, py = n.y * R, pz = n.z * R;
    const minL = Math.max(spacing * 2.5, 6);
    // the colour noise's finest octave is about R / 75 across: generated hills below that
    let o = 0;
    for (let L = R / 75; L > minL && o < 16; L *= 0.5, o++) {
      h += (vnoise(px / L, py / L, pz / L, this.seedN + o * 7) - 0.5) * 2 * 0.012 * L * land;
    }
    // airless rocky worlds keep their craters
    if (this.type === 1 || this.type === 5) {
      let i = 0;
      for (let cell = 40e3; cell >= 30; cell /= 4.6, i++) {
        if (cell * 0.4 < minL) break;
        h += craterField(px, py, pz, cell, this.seedN + 100 * i, 0.4, cell > 5000 ? 0.18 : 0.32);
      }
    }
    return Number.isFinite(h) ? h : 0;
  }
}
