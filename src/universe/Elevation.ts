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
 * manifest's per-level bitmap (or tile list) says which exist; `sample` falls back to the finest
 * loaded coarser tile. The finest levels of Earth (Copernicus GLO-90) and the Moon (SLDEM2015) cover
 * only regions around mountains and landing sites.
 *
 * Heights are directly comparable with the older global maps of Terrain.ts: add them to the radius
 * of the body's ellipsoid (`radii`) along the direction. `referenceRadius` is only the mean radius
 * used for `metresPerSample`; it is not the surface the heights are measured from (except on the
 * Moon, a sphere).
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
  /** base64 bitmap (bit (face * n + y) * n + x, LSB first) of the tiles present; absent (with no list) = all */
  bitmap?: string;
  /** the tiles present as flat [face, x, y, face, x, y, ...] (deep, sparse levels) */
  list?: number[];
  /**
   * The level's tiles packed into files (fetched with HTTP range requests): each lists its tiles
   * as flat [face, x, y, byteLength, ...] in file order (offsets are the running sum).
   */
  packs?: { file: string; tiles: number[] }[];
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
  /** present tiles per level: null = complete level, a bitmap, or a set of indices */
  bits: (Uint8Array | Set<number> | null)[];
  /** key offset of each level */
  base: number[];
  /** where each tile is in the pack files (key -> file, offset, length) */
  loc: Map<number, { file: string; off: number; len: number }>;
  /** the tiles of each pack file, in file order */
  packs: Map<string, { key: number; level: number; off: number; len: number }[]>;
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
  /** memory cap of the decoded tiles above level 1 (bytes) */
  maxBytes?: number;
  /** fetch replacement (tests) */
  fetch?: (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status?: number; arrayBuffer(): Promise<ArrayBuffer>; json(): Promise<unknown> }>;
}

export class ElevationStore {
  private base = defaultBase();
  private maxBytes = 24 * 2 ** 20;
  private fetchFn: NonNullable<ElevationOptions['fetch']> = (u, init) => fetch(u, init);
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
      s = { man: null, loading: null, bits: [], base: [], loc: new Map(), packs: new Map(), maxLevel: -1, tiles: new Map(), pending: new Map(), failed: new Map(), version: 0 };
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
      const n = 1 << l;
      if (!e) s.bits[l] = new Set();
      else if (e.list) {
        const set = new Set<number>();
        for (let i = 0; i + 2 < e.list.length; i += 3) set.add((e.list[i] * n + e.list[i + 2]) * n + e.list[i + 1]);
        s.bits[l] = set;
      } else if (e.bitmap) s.bits[l] = Uint8Array.from(atob(e.bitmap), (c) => c.charCodeAt(0));
      else s.bits[l] = null;
      for (const pk of e?.packs ?? []) {
        let at = 0;
        for (let i = 0; i + 3 < pk.tiles.length; i += 4) {
          const [f, x, y, len] = [pk.tiles[i], pk.tiles[i + 1], pk.tiles[i + 2], pk.tiles[i + 3]];
          const key = s.base[l] + (f * n + y) * n + x;
          s.loc.set(key, { file: pk.file, off: at, len });
          let list = s.packs.get(pk.file);
          if (!list) s.packs.set(pk.file, (list = []));
          list.push({ key, level: l, off: at, len });
          at += len;
        }
      }
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
    if (bits instanceof Set) return bits.has(i);
    return ((bits[i >> 3] >> (i & 7)) & 1) === 1;
  }

  /**
   * Deepest level the pyramid has at direction d (-1 before the manifest loads): below its
   * spacing, relief has to be generated.
   */
  maxLevelAt(bodyKey: string, d: Vec3Like): number {
    const s = this.bodies.get(bodyKey);
    if (!s?.man) return -1;
    const p = dirToFace(d, this.fp);
    for (let l = s.maxLevel; l > 0; l--) {
      const n = 1 << l;
      if (this.exists(bodyKey, p.face, l, Math.min(n - 1, Math.floor(p.u * n)), Math.min(n - 1, Math.floor(p.v * n)))) return l;
    }
    return 0;
  }

  loaded(bodyKey: string, face: number, level: number, x: number, y: number): boolean {
    const s = this.bodies.get(bodyKey);
    return !!s?.man && level <= s.maxLevel && s.tiles.has(this.key(s, face, level, x, y));
  }

  /** whether the host honours HTTP range requests (null until the first packed tile arrives) */
  private ranges: boolean | null = null;
  /** whole-pack downloads (hosts without ranges), and first range requests per pack, by `body/file` */
  private packLoads = new Map<string, Promise<void>>();

  /**
   * Fetch and decode a tile (resolves at once if it is loaded or does not exist; rejects on a
   * network/decode error). Packed tiles are read with an HTTP range request; when the host ignores
   * ranges (it answers 200 with the whole pack, as Cloudflare Pages does), every tile of the pack
   * is kept (they are the neighbours needed next) and later tiles fetch whole packs directly.
   */
  async request(bodyKey: string, face: number, level: number, x: number, y: number): Promise<void> {
    const man = this.manifest(bodyKey) ?? (await this.load(bodyKey));
    if (!man || !this.exists(bodyKey, face, level, x, y)) return;
    const s = this.state(bodyKey);
    const k = this.key(s, face, level, x, y);
    if (s.tiles.has(k)) return;
    const failedAt = s.failed.get(k);
    if (failedAt !== undefined && Date.now() - failedAt < 30e3) throw new Error('tile failed recently');
    let p = s.pending.get(k);
    if (p) return p;
    const loc = s.loc.get(k);
    const packId = loc ? `${bodyKey}/${loc.file}` : '';
    if (loc && this.ranges === false) {
      p = this.loadPack(bodyKey, s, loc.file);
    } else if (loc && this.ranges === null && this.packLoads.has(packId)) {
      // the first answer for this pack is on its way: it may bring the whole pack
      p = this.packLoads.get(packId)!.catch(() => undefined)
        .then(() => {
          if (s.tiles.has(k)) return undefined;
          s.pending.delete(k);         // (else the request below would wait for this very promise)
          return this.request(bodyKey, face, level, x, y);
        });
    } else {
      const url = loc ? `${this.base}/${bodyKey}/${loc.file}`
        : `${this.base}/${bodyKey}/${man.path.replace('{level}', `${level}`).replace('{face}', `${face}`).replace('{x}', `${x}`).replace('{y}', `${y}`)}`;
      p = this.fetchFn(url, loc ? { headers: { Range: `bytes=${loc.off}-${loc.off + loc.len - 1}` } } : undefined)
        .then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status ?? '?'} for ${url}`);
          const b = await r.arrayBuffer();
          if (loc && r.status === 206) this.ranges = true;
          if (loc && r.status !== 206 && b.byteLength > loc.len) {
            this.ranges = false;
            await this.storePack(s, loc.file, b);
            return;
          }
          await this.storeTile(s, k, level, b);
        });
      if (loc && this.ranges === null) {
        const probe = p;
        this.packLoads.set(packId, probe);
        void probe.catch(() => undefined).finally(() => { if (this.packLoads.get(packId) === probe) this.packLoads.delete(packId); });
      }
    }
    p = p.catch((err) => { s.failed.set(k, Date.now()); throw err; }).finally(() => s.pending.delete(k));
    s.pending.set(k, p);
    return p;
  }

  /** Download a whole pack (once) and keep all its tiles. */
  private loadPack(bodyKey: string, s: BodyState, file: string): Promise<void> {
    const id = `${bodyKey}/${file}`;
    let p = this.packLoads.get(id);
    if (!p) {
      const url = `${this.base}/${bodyKey}/${file}`;
      p = this.fetchFn(url)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status ?? '?'} for ${url}`);
          return r.arrayBuffer();
        })
        .then((b) => this.storePack(s, file, b))
        .finally(() => this.packLoads.delete(id));
      this.packLoads.set(id, p);
    }
    return p;
  }

  /** Decode and keep the tiles of a whole pack file that are not loaded yet. */
  private async storePack(s: BodyState, file: string, buf: ArrayBuffer): Promise<void> {
    for (const t of s.packs.get(file) ?? []) {
      if (!s.tiles.has(t.key)) await this.storeTile(s, t.key, t.level, buf.slice(t.off, t.off + t.len));
    }
  }

  private async storeTile(s: BodyState, k: number, level: number, buf: ArrayBuffer): Promise<void> {
    const { width, height, data } = await decodePng16(buf);
    if (width !== PIX || height !== PIX) throw new Error(`bad tile size ${width}x${height}`);
    if (s.tiles.has(k)) return;
    s.tiles.set(k, { data, used: ++this.clock, level });
    this.bytes += data.byteLength;
    s.version++;
    s.failed.delete(k);
    this.evict();
  }

  /**
   * Drop the least recently used tiles once those above level 1 exceed the cap. Levels 0-1 (30
   * tiles, 4 MB a body) stay and do not count; the tile that just arrived is never dropped.
   */
  private evict(): void {
    if (this.bytes - this.pinned() <= this.maxBytes) return;
    const all: { s: BodyState; k: number; t: Tile }[] = [];
    for (const s of this.bodies.values()) for (const [k, t] of s.tiles) if (t.level > 1 && t.used !== this.clock) all.push({ s, k, t });
    all.sort((a, b) => a.t.used - b.t.used);
    let over = this.bytes - this.pinned() - this.maxBytes * 0.85;
    for (const { s, k, t } of all) {
      if (over <= 0) break;
      s.tiles.delete(k);
      this.bytes -= t.data.byteLength;
      over -= t.data.byteLength;
      s.version++;
    }
  }

  private pinned(): number {
    let b = 0;
    for (const s of this.bodies.values()) for (const t of s.tiles.values()) if (t.level <= 1) b += t.data.byteLength;
    return b;
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
    const l1 = Math.max(0, Math.ceil(lf - 1e-6));
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
   * Fetch the tiles around direction `dirBF` for `metresPerSample` (0: the finest there is): on
   * every level down to that resolution, the tile containing it and its neighbours (`ring` tiles
   * each way), where the pyramid has them. Resolves when all have loaded or failed.
   */
  async prefetch(bodyKey: string, dirBF: Vec3Like, metresPerSample: number, ring = 1): Promise<void> {
    const man = this.manifest(bodyKey) ?? (await this.load(bodyKey));
    if (!man) return;
    const target = Math.max(0, Math.ceil(this.levelFor(bodyKey, metresPerSample) - 1e-6));
    const ids = new Map<string, TileId>();
    const add = (t: TileId) => ids.set(`${t.face}/${t.level}/${t.x}/${t.y}`, t);
    for (let f = 0; f < 6; f++) add({ face: f, level: 0, x: 0, y: 0 });
    const p = dirToFace(dirBF);
    const d: Vec3Like = { x: 0, y: 0, z: 0 };
    for (let l = 1; l <= target; l++) {
      const n = 1 << l;
      const r = ring;
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
