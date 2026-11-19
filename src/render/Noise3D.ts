import { Data3DTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, UnsignedByteType } from 'three';

/**
 * A tileable 3D noise volume shared by the deep-space shaders: four independent channels of
 * gradient (Perlin) noise, 8 lattice cells across the 64-texel tile, each channel equalised to a
 * uniform distribution on [0, 1] (so thresholds read as fractions: smoothstep(0.8, …) keeps the top
 * 20 %). One texture fetch gives four noises; octaves are fetches at other scales. `sampleNoise`
 * reads the same data on the CPU (trilinear, repeating), so CPU-side models match the shaders.
 */
export const NOISE_N = 64;
const CELLS = 8;

let cache: { data: Uint8Array; tex: Data3DTexture } | null = null;

function build(): Uint8Array {
  const N = NOISE_N, P = CELLS, S = N / P;
  const out = new Uint8Array(N * N * N * 4);
  const vals = new Float32Array(N * N * N);
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  for (let ch = 0; ch < 4; ch++) {
    // gradients on the periodic lattice
    let s = 0x9e3779b9 ^ (ch * 0x85ebca6b);
    const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
    const g = new Float32Array(P * P * P * 3);
    for (let i = 0; i < P * P * P; i++) {
      const z = rnd() * 2 - 1, a = rnd() * 2 * Math.PI, r = Math.sqrt(1 - z * z);
      g[i * 3] = r * Math.cos(a); g[i * 3 + 1] = r * Math.sin(a); g[i * 3 + 2] = z;
    }
    const dotG = (ix: number, iy: number, iz: number, x: number, y: number, z: number) => {
      const k = (((iz % P) * P + (iy % P)) * P + (ix % P)) * 3;
      return g[k] * x + g[k + 1] * y + g[k + 2] * z;
    };
    for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = i / S, y = j / S, z = k / S;
      const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
      const fx = x - x0, fy = y - y0, fz = z - z0;
      const u = fade(fx), v = fade(fy), w = fade(fz);
      const l = (a: number, b: number, t: number) => a + (b - a) * t;
      const n = l(
        l(l(dotG(x0, y0, z0, fx, fy, fz), dotG(x0 + 1, y0, z0, fx - 1, fy, fz), u),
          l(dotG(x0, y0 + 1, z0, fx, fy - 1, fz), dotG(x0 + 1, y0 + 1, z0, fx - 1, fy - 1, fz), u), v),
        l(l(dotG(x0, y0, z0 + 1, fx, fy, fz - 1), dotG(x0 + 1, y0, z0 + 1, fx - 1, fy, fz - 1), u),
          l(dotG(x0, y0 + 1, z0 + 1, fx, fy - 1, fz - 1), dotG(x0 + 1, y0 + 1, z0 + 1, fx - 1, fy - 1, fz - 1), u), v), w);
      vals[(k * N + j) * N + i] = n;
    }
    // equalise through the histogram: value -> its quantile
    const B = 4096, hist = new Float64Array(B + 1);
    const bin = (v: number) => Math.min(B - 1, Math.max(0, Math.floor((v + 1) * 0.5 * B)));
    for (let i = 0; i < vals.length; i++) hist[bin(vals[i]) + 1]++;
    for (let b = 1; b <= B; b++) hist[b] += hist[b - 1];
    for (let i = 0; i < vals.length; i++) {
      const b = bin(vals[i]);
      const q = (hist[b] + 0.5 * (hist[b + 1] - hist[b])) / vals.length;
      out[i * 4 + ch] = Math.min(255, Math.floor(q * 256));
    }
  }
  return out;
}

export function noise3D(): { data: Uint8Array; tex: Data3DTexture } {
  if (cache) return cache;
  const data = build();
  const tex = new Data3DTexture(data, NOISE_N, NOISE_N, NOISE_N);
  tex.format = RGBAFormat;
  tex.type = UnsignedByteType;
  tex.wrapS = tex.wrapT = tex.wrapR = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  cache = { data, tex };
  return cache;
}

/** The noise volume at texture coordinates (x, y, z) (1 = one tile), trilinear, into `out` (rgba 0..1). */
export function sampleNoise(data: Uint8Array, x: number, y: number, z: number, out: Float32Array): Float32Array {
  const N = NOISE_N;
  // texel centres sit at (i + 0.5) / N, as on the GPU
  const fx = x * N - 0.5, fy = y * N - 0.5, fz = z * N - 0.5;
  const x0 = Math.floor(fx), y0 = Math.floor(fy), z0 = Math.floor(fz);
  const tx = fx - x0, ty = fy - y0, tz = fz - z0;
  const m = N - 1;
  const xa = x0 & m, xb = (x0 + 1) & m, ya = y0 & m, yb = (y0 + 1) & m, za = z0 & m, zb = (z0 + 1) & m;
  for (let c = 0; c < 4; c++) {
    const at = (i: number, j: number, k: number) => data[((k * N + j) * N + i) * 4 + c];
    const c00 = at(xa, ya, za) + (at(xb, ya, za) - at(xa, ya, za)) * tx;
    const c10 = at(xa, yb, za) + (at(xb, yb, za) - at(xa, yb, za)) * tx;
    const c01 = at(xa, ya, zb) + (at(xb, ya, zb) - at(xa, ya, zb)) * tx;
    const c11 = at(xa, yb, zb) + (at(xb, yb, zb) - at(xa, yb, zb)) * tx;
    const c0 = c00 + (c10 - c00) * ty, c1 = c01 + (c11 - c01) * ty;
    out[c] = (c0 + (c1 - c0) * tz) / 255;
  }
  return out;
}
