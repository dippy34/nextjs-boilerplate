/**
 * Real elevation of whole worlds: cube-face tile pyramids built by pipeline/build_elevation.py
 * (public/data/elevation/<body>/). No DOM: works in a Web Worker (call `Elevation.configure` with
 * an absolute `base` URL there, since relative URLs resolve against the worker script).
 *
 * CUBE FACE CONVENTION (the same in the pipeline): body-fixed frame, +X towards 0 deg E on the
 * equator, +Y towards 90 deg E, +Z the north pole.
 *
 *     face  normal N   image right U   image down V
 *      0      +X          +Y              -Z
 *      1      -X          -Y              -Z
 *      2      +Y          -X              -Z
 *      3      -Y          +X              -Z
 *      4      +Z          +Y              +X
 *      5      -Z          +Y              -X
 *
 * A face point (u, v) in [0, 1]^2 (u right, v down) is the direction
 * normalize(N + tan((2u - 1) pi/4) U + tan((2v - 1) pi/4) V): an equi-angular cube, samples evenly
 * spaced in angle along the face axes. Level L has 2^L x 2^L tiles per face; tile (x, y) covers
 * u in [x, x + 1] / 2^L and v in [y, y + 1] / 2^L with T + 1 = 257 vertex-registered samples a side
 * (sample i at u = (x + i/T) / 2^L; neighbours share edge samples) plus a one-sample apron, so the
 * 259 x 259 PNG pixel (i + 1, j + 1) is sample (i, j). Height (m) = offset + step * value, above the
 * body's reference surface (the engine's ellipsoid for Mercury, Ceres, Vesta; the areoid for Mars,
 * the geoid for Earth, the 1737.4 km sphere for the Moon; see the manifest).
 *
 * Deeper levels are sparse (the tiles that add the most detail, and those around landmarks): the
 * manifest's per-level bitmap says which exist; `sample` falls back to the finest loaded ancestor.
 */

export interface Vec3Like { x: number; y: number; z: number }

/** Normal, right and down axes of each face (see the table above). */
export const FACE_AXES: readonly (readonly [readonly number[], readonly number[], readonly number[]])[] = [
  [[1, 0, 0], [0, 1, 0], [0, 0, -1]],
  [[-1, 0, 0], [0, -1, 0], [0, 0, -1]],
  [[0, 1, 0], [-1, 0, 0], [0, 0, -1]],
  [[0, -1, 0], [1, 0, 0], [0, 0, -1]],
  [[0, 0, 1], [0, 1, 0], [1, 0, 0]],
  [[0, 0, -1], [0, 1, 0], [-1, 0, 0]],
];

/** sample intervals per tile edge (the manifest's tileSize) */
export const TILE = 256;
const PIX = TILE + 3;
const QPI = Math.PI / 4;

export interface FacePoint { face: number; u: number; v: number }

/** Unit direction of face point (u, v) (u, v may lie slightly outside 0..1: points beyond the edge). */
export function faceToDir(face: number, u: number, v: number, out: Vec3Like = { x: 0, y: 0, z: 0 }): Vec3Like {
  const [n, U, V] = FACE_AXES[face];
  const a = Math.tan((2 * u - 1) * QPI), b = Math.tan((2 * v - 1) * QPI);
  const x = n[0] + a * U[0] + b * V[0], y = n[1] + a * U[1] + b * V[1], z = n[2] + a * U[2] + b * V[2];
  const l = Math.hypot(x, y, z);
  out.x = x / l; out.y = y / l; out.z = z / l;
  return out;
}

/** Face and face point of a direction (need not be unit length). */
export function dirToFace(d: Vec3Like, out: FacePoint = { face: 0, u: 0, v: 0 }): FacePoint {
  const ax = Math.abs(d.x), ay = Math.abs(d.y), az = Math.abs(d.z);
  let face: number;
  if (ax >= ay && ax >= az) face = d.x > 0 ? 0 : 1;
  else if (ay >= az) face = d.y > 0 ? 2 : 3;
  else face = d.z > 0 ? 4 : 5;
  const [n, U, V] = FACE_AXES[face];
  const dn = d.x * n[0] + d.y * n[1] + d.z * n[2];
  const a = (d.x * U[0] + d.y * U[1] + d.z * U[2]) / dn;
  const b = (d.x * V[0] + d.y * V[1] + d.z * V[2]) / dn;
  out.face = face;
  out.u = (Math.atan(a) / QPI + 1) * 0.5;
  out.v = (Math.atan(b) / QPI + 1) * 0.5;
  return out;
}

export interface TileId { face: number; level: number; x: number; y: number }

/** The tile of `level` containing direction d. */
export function tileOf(d: Vec3Like, level: number): TileId {
  const p = dirToFace(d);
  const n = 1 << level;
  return { face: p.face, level, x: Math.min(n - 1, Math.floor(p.u * n)), y: Math.min(n - 1, Math.floor(p.v * n)) };
}

export interface ElevationLevel {
  level: number;
  /** tiles present at this level */
  tiles: number;
  /** sample spacing (m) on the reference radius */
  metresPerSample: number;
  /** base64 bitmap (bit (face * n + y) * n + x, LSB first) of the tiles present; absent = all */
  bitmap?: string;
}

export interface ElevationManifest {
  body: string;
  tileSize: number;
  border: number;
  format: 'png16';
  path: string;
  offset: number;
  step: number;
  referenceRadius: number;
  radii: number[];
  reference: string;
  min: number;
  max: number;
  levels: ElevationLevel[];
  bytes: number;
  credit: string;
  license: string;
  /** Earth: sea level; levels deeper than seaFloorMaxLevel store ocean as oceanFill */
  sea?: number;
  seaFloorMaxLevel?: number;
  oceanFill?: number;
}

// ---------------------------------------------------------------- PNG (16-bit greyscale) decoding
async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Decode a non-interlaced 16-bit greyscale PNG into its samples. */
export async function decodePng16(buf: ArrayBuffer | Uint8Array): Promise<{ width: number; height: number; data: Uint16Array }> {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (dv.getUint32(0) !== 0x89504e47 || dv.getUint32(4) !== 0x0d0a1a0a) throw new Error('not a PNG');
  let p = 8, w = 0, h = 0;
  const idat: Uint8Array[] = [];
  let total = 0;
  while (p + 8 <= b.length) {
    const len = dv.getUint32(p);
    const type = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]);
    const body = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      w = dv.getUint32(p + 8); h = dv.getUint32(p + 12);
      if (body[8] !== 16 || body[9] !== 0 || body[12] !== 0) throw new Error('needs a 16-bit greyscale, non-interlaced PNG');
    } else if (type === 'IDAT') { idat.push(body); total += len; } else if (type === 'IEND') break;
    p += 12 + len;
  }
  const z = new Uint8Array(total);
  let o = 0;
  for (const c of idat) { z.set(c, o); o += c.length; }
  const raw = await inflate(z);
  const stride = w * 2;
  if (raw.length < h * (stride + 1)) throw new Error('truncated PNG');
  const cur = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1, dst = y * stride, prev = dst - stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i];
      const a = i >= 2 ? cur[dst + i - 2] : 0;
      const up = y > 0 ? cur[prev + i] : 0;
      let v: number;
      switch (ft) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + up; break;
        case 3: v = x + ((a + up) >> 1); break;
        case 4: {
          const c = y > 0 && i >= 2 ? cur[prev + i - 2] : 0;
          const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? up : c);
          break;
        }
        default: throw new Error(`bad PNG filter ${ft}`);
      }
      cur[dst + i] = v & 255;
    }
  }
  const data = new Uint16Array(w * h);
  for (let i = 0; i < data.length; i++) data[i] = (cur[2 * i] << 8) | cur[2 * i + 1];
  return { width: w, height: h, data };
}

// ---------------------------------------------------------------- tile store
interface Tile { data: Uint16Array; used: number; level: number }

interface BodyState {
  man: ElevationManifest | null;
  loading: Promise<ElevationManifest | null> | null;
  /** present-tile bitmaps per level (null = complete level) */
  bits: (Uint8Array | null)[];
  /** key offset of each level */
  base: number[];
  maxLevel: number;
  tiles: Map<number, Tile>;
  pending: Map<number, Promise<void>>;
  failed: Map<number, number>;
  version: number;
}

const catmull = (t: number, w: Float64Array): void => {
  w[0] = ((-t + 2) * t - 1) * t * 0.5;
  w[1] = ((3 * t - 5) * t * t + 2) * 0.5;
  w[2] = ((-3 * t + 4) * t + 1) * t * 0.5;
  w[3] = (t - 1) * t * t * 0.5;
};

const defaultBase = (): string => {
  const env = (import.meta as unknown as { env?: { BASE_URL?: string } }).env;
  return `${env?.BASE_URL ?? './'}data/elevation`;
};

export interface ElevationOptions {
  /** URL of public/data/elevation (absolute inside a worker) */
  base?: string;
  /** memory cap of the decoded tiles (bytes) */
  maxBytes?: number;
  /** fetch replacement (tests) */
  fetch?: (url: string) => Promise<{ ok: boolean; status?: number; arrayBuffer(): Promise<ArrayBuffer>; json(): Promise<unknown> }>;
}

export class ElevationStore {
  private base = defaultBase();
  private maxBytes = 96 * 2 ** 20;
  private fetchFn: NonNullable<ElevationOptions['fetch']> = (u) => fetch(u);
  private bodies = new Map<string, BodyState>();
  private clock = 0;
  private bytes = 0;
  private fp: FacePoint = { face: 0, u: 0, v: 0 };
  private wx = new Float64Array(4);
  private wy = new Float64Array(4);
  /** sample spacing (m) of the finest level used by the last successful `sample` call */
  lastMetresPerSample = 0;
  /** level used by the last successful `sample` call */
  lastLevel = -1;

  constructor(opts: ElevationOptions = {}) { this.configure(opts); }

  configure(opts: ElevationOptions): void {
    if (opts.base !== undefined) this.base = opts.base.replace(/\/$/, '');
    if (opts.maxBytes !== undefined) this.maxBytes = opts.maxBytes;
    if (opts.fetch) this.fetchFn = opts.fetch;
  }

  private state(key: string): BodyState {
    let s = this.bodies.get(key);
    if (!s) {
      s = { man: null, loading: null, bits: [], base: [], maxLevel: -1, tiles: new Map(), pending: new Map(), failed: new Map(), version: 0 };
      this.bodies.set(key, s);
    }
    return s;
  }

  /** Load a body's manifest (null if the body has no elevation pyramid). */
  load(bodyKey: string): Promise<ElevationManifest | null> {
    const s = this.state(bodyKey);
    s.loading ??= this.fetchFn(`${this.base}/${bodyKey}/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<ElevationManifest>) : null))
      .then((m) => {
        if (m) this.setManifest(bodyKey, m);
        return m;
      })
      .catch(() => null);
    return s.loading;
  }

  /** Install a manifest directly (tests, or a manifest fetched elsewhere). */
  setManifest(bodyKey: string, m: ElevationManifest): void {
    const s = this.state(bodyKey);
    s.man = m;
    s.loading ??= Promise.resolve(m);
    s.maxLevel = m.levels[m.levels.length - 1].level;
    let off = 0;
    for (let l = 0; l <= s.maxLevel; l++) {
      s.base[l] = off;
      off += 6 * 4 ** l;
      const e = m.levels.find((x) => x.level === l);
      if (!e) s.bits[l] = new Uint8Array(Math.ceil((6 * 4 ** l) / 8));
      else if (e.bitmap) s.bits[l] = Uint8Array.from(atob(e.bitmap), (c) => c.charCodeAt(0));
      else s.bits[l] = null;
    }
  }

  manifest(bodyKey: string): ElevationManifest | null {
    return this.bodies.get(bodyKey)?.man ?? null;
  }

  /** The body's levels, coarse to fine (null until the manifest has loaded; starts loading it). */
  levels(bodyKey: string): ElevationLevel[] | null {
    const s = this.state(bodyKey);
    if (!s.man) { void this.load(bodyKey); return null; }
    return s.man.levels;
  }

  /** Changes whenever a tile of the body loads (or is evicted). */
  version(bodyKey: string): number {
    return this.bodies.get(bodyKey)?.version ?? 0;
  }

  /** decoded tile memory in use (bytes) */
  get memoryBytes(): number { return this.bytes; }

  private key(s: BodyState, face: number, level: number, x: number, y: number): number {
    const n = 1 << level;
    return s.base[level] + (face * n + y) * n + x;
  }

  /** True when the pyramid has this tile (per the manifest). */
  exists(bodyKey: string, face: number, level: number, x: number, y: number): boolean {
    const s = this.bodies.get(bodyKey);
    if (!s?.man || level < 0 || level > s.maxLevel) return false;
    const bits = s.bits[level];
    if (!bits) return true;
    const n = 1 << level, i = (face * n + y) * n + x;
    return ((bits[i >> 3] >> (i & 7)) & 1) === 1;
  }

  loaded(bodyKey: string, face: number, level: number, x: number, y: number): boolean {
    const s = this.bodies.get(bodyKey);
    return !!s?.man && level <= s.maxLevel && s.tiles.has(this.key(s, face, level, x, y));
  }

  /** Fetch and decode a tile (resolves at once if it is loaded or does not exist; rejects on a network/decode error). */
  async request(bodyKey: string, face: number, level: number, x: number, y: number): Promise<void> {
    const man = this.manifest(bodyKey) ?? (await this.load(bodyKey));
    if (!man || !this.exists(bodyKey, face, level, x, y)) return;
    const s = this.state(bodyKey);
    const k = this.key(s, face, level, x, y);
    if (s.tiles.has(k)) return;
    const failedAt = s.failed.get(k);
    if (failedAt !== undefined && Date.now() - failedAt < 30e3) throw new Error('tile failed recently');
    let p = s.pending.get(k);
    if (!p) {
      const url = `${this.base}/${bodyKey}/${man.path.replace('{level}', `${level}`).replace('{face}', `${face}`).replace('{x}', `${x}`).replace('{y}', `${y}`)}`;
      p = this.fetchFn(url)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status ?? '?'} for ${url}`);
          return r.arrayBuffer();
        })
        .then((b) => decodePng16(b))
        .then(({ width, height, data }) => {
          if (width !== PIX || height !== PIX) throw new Error(`bad tile size ${width}x${height}`);
          s.tiles.set(k, { data, used: ++this.clock, level });
          this.bytes += data.byteLength;
          s.version++;
          s.failed.delete(k);
          this.evict();
        })
        .catch((err) => { s.failed.set(k, Date.now()); throw err; })
        .finally(() => s.pending.delete(k));
      s.pending.set(k, p);
    }
    return p;
  }

  /** Drop the least recently sampled tiles above the memory cap (levels 0-1 stay). */
  private evict(): void {
    if (this.bytes <= this.maxBytes) return;
    const all: { s: BodyState; k: number; t: Tile }[] = [];
    for (const s of this.bodies.values()) for (const [k, t] of s.tiles) if (t.level > 1) all.push({ s, k, t });
    all.sort((a, b) => a.t.used - b.t.used);
    for (const { s, k, t } of all) {
      if (this.bytes <= this.maxBytes * 0.85) break;
      s.tiles.delete(k);
      this.bytes -= t.data.byteLength;
      s.version++;
    }
  }

  /** Level whose sample spacing is at or below `metresPerSample` (clamped to the pyramid), fractional. */
  levelFor(bodyKey: string, metresPerSample: number): number {
    const s = this.bodies.get(bodyKey);
    if (!s?.man) return 0;
    const m0 = s.man.levels[0].metresPerSample;
    return Math.min(s.maxLevel, Math.max(0, Math.log2(m0 / Math.max(metresPerSample, 1e-3))));
  }

  /** bicubic height (m) from the finest loaded tile at level <= `level` covering the face point; NaN if none */
  private sampleUpTo(s: BodyState, level: number, p: FacePoint): number {
    for (let l = level; l >= 0; l--) {
      const n = 1 << l;
      const fu = p.u * n, fv = p.v * n;
      const x = Math.min(n - 1, Math.max(0, Math.floor(fu))), y = Math.min(n - 1, Math.max(0, Math.floor(fv)));
      const t = s.tiles.get(this.key(s, p.face, l, x, y));
      if (!t) continue;
      t.used = ++this.clock;
      this.lastLevel = l;
      return this.bicubic(t.data, (fu - x) * TILE, (fv - y) * TILE) * s.man!.step + s.man!.offset;
    }
    return NaN;
  }

  /** Catmull-Rom of a tile at sample coordinates (0..TILE) */
  private bicubic(d: Uint16Array, sx: number, sy: number): number {
    const i0 = Math.min(TILE - 1, Math.max(0, Math.floor(sx))), j0 = Math.min(TILE - 1, Math.max(0, Math.floor(sy)));
    const wx = this.wx, wy = this.wy;
    catmull(sx - i0, wx);
    catmull(sy - j0, wy);
    let h = 0;
    // samples i0-1 .. i0+2 are pixels i0 .. i0+3
    for (let j = 0; j < 4; j++) {
      const r = (j0 + j) * PIX + i0;
      h += wy[j] * (wx[0] * d[r] + wx[1] * d[r + 1] + wx[2] * d[r + 2] + wx[3] * d[r + 3]);
    }
    return h;
  }

  /**
   * Height (m) above the body's reference surface at body-fixed direction `dirBF`, for features of
   * `metresPerSample` m: bicubic in the best loaded tile at or above that resolution (blended
   * with the next coarser level between level spacings, so heights change smoothly with the
   * spacing), or in the finest loaded coarser tile when that is all there is. Null when nothing
   * loaded covers the point (or the body has no pyramid). Sets `lastMetresPerSample`.
   */
  sample(bodyKey: string, dirBF: Vec3Like, metresPerSample: number): number | null {
    const s = this.bodies.get(bodyKey);
    if (!s?.man) return null;
    const p = dirToFace(dirBF, this.fp);
    const lf = this.levelFor(bodyKey, metresPerSample);
    const l1 = Math.max(0, Math.ceil(lf - 1e-9));
    const a = this.sampleUpTo(s, l1, p);
    if (Number.isNaN(a)) return null;
    const used = this.lastLevel;
    this.lastMetresPerSample = s.man.levels[0].metresPerSample / 2 ** used;
    const t = l1 - lf;                    // weight of the coarser level
    if (used === l1 && l1 > 0 && t > 1e-3) {
      const b = this.sampleUpTo(s, l1 - 1, p);
      this.lastLevel = used;
      if (!Number.isNaN(b)) return a + (b - a) * t;
    }
    return a;
  }

  /**
   * Fetch the tiles around direction `dirBF` for `metresPerSample`: the tile containing it on
   * every level down to that resolution, and its neighbours (`ring` tiles each way) on the target
   * level. Resolves when all have loaded or failed.
   */
  async prefetch(bodyKey: string, dirBF: Vec3Like, metresPerSample: number, ring = 1): Promise<void> {
    const man = this.manifest(bodyKey) ?? (await this.load(bodyKey));
    if (!man) return;
    const target = Math.max(0, Math.ceil(this.levelFor(bodyKey, metresPerSample) - 1e-9));
    const ids = new Map<string, TileId>();
    const add = (t: TileId) => ids.set(`${t.face}/${t.level}/${t.x}/${t.y}`, t);
    for (let f = 0; f < 6; f++) add({ face: f, level: 0, x: 0, y: 0 });
    const p = dirToFace(dirBF);
    const d: Vec3Like = { x: 0, y: 0, z: 0 };
    for (let l = 1; l <= target; l++) {
      const n = 1 << l;
      const r = l === target ? ring : 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          // one tile step on this face; beyond its edge the direction lands on the neighbouring face
          const u = Math.min(1.45, Math.max(-0.45, p.u + dx / n)), v = Math.min(1.45, Math.max(-0.45, p.v + dy / n));
          add(tileOf(faceToDir(p.face, u, v, d), l));
        }
      }
    }
    await Promise.all([...ids.values()].map((t) => this.request(bodyKey, t.face, t.level, t.x, t.y).catch(() => undefined)));
  }
}

/** The shared store (one per thread). */
export const Elevation = new ElevationStore();
