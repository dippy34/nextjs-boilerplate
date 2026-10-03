import { Vector3 } from 'three';
import type { Body } from './Body';
import { Elevation, tileOf } from './Elevation';

/** A world that can have landing terrain (render/TerrainPatch.ts). */
export interface Ground {
  /** the Body or ExoPlanet */
  readonly owner: object;
  readonly name: string;
  /** mean radius (m) */
  readonly radius: number;
  /** ellipsoid semi-axes (m): the reference surface heights are measured from */
  readonly radii: readonly number[];
  /** typical relief (m), for sizing the patch */
  readonly amplitude: number;
  /** true when the heights are final (elevation model loaded) */
  ready(): boolean;
  /** height (m) above the reference surface at body-fixed unit direction n; `spacing`: finest feature size worth computing (m) */
  height(n: Vector3, spacing: number): number;
  /** called each frame with the direction below the explorer (to fetch sharper data nearby) */
  prepare?(n: Vector3): void;
  /** changes when the heights change (sharper data arrived) */
  version?(): number;
}

/** reference-surface radius (m) along body-fixed unit direction n (the ellipsoid) */
export function baseRadius(g: { radii: readonly number[] }, n: Vector3): number {
  const [a, b, c] = g.radii;
  return 1 / Math.sqrt((n.x / a) ** 2 + (n.y / b) ** 2 + (n.z / c) ** 2);
}

/** A global elevation model (public/data/terrain, pipeline/build_terrain.py). */
interface HeightMap {
  width: number; height: number; lonLeft: number;
  data: Uint16Array; offset: number; scale: number;
  /** metres per pixel at the equator */
  pixelM: number;
  /** sea level (m) of a world with oceans: lower ground is drawn as flat water */
  sea?: number;
  /** filtered levels (0 = the map itself), built on first use */
  levels?: Level[];
}
interface TerrainManifest {
  maps: Record<string, { file: string; width: number; height: number; lonLeft: number; offset: number; scale: number; credit: string; sea?: number }>;
  /** sharper regional elevation around landmarks (pipeline/build_terrain_patches.py) */
  patches?: PatchInfo[];
}
interface PatchInfo {
  name: string; body: string; file: string; width: number; height: number; offset: number; scale: number;
  /** bounds (degrees, planetocentric, east longitude; lon0 may be outside -180..180) */
  lat0: number; lat1: number; lon0: number; lon1: number;
}
interface Patch extends PatchInfo { data: Uint16Array; pixelM: number; levels: Level[] }

/** Decode a 16-bit-in-RGB height PNG (R * 256 + G). */
async function loadHeights(url: string): Promise<{ w: number; h: number; data: Uint16Array }> {
  const blob = await fetch(url).then((r) => r.blob());
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const w = bmp.width, h = bmp.height;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const px = ctx.getImageData(0, 0, w, h).data;
  const data = new Uint16Array(w * h);
  for (let i = 0; i < data.length; i++) data[i] = px[i * 4] * 256 + px[i * 4 + 1];
  return { w, h, data };
}

const catmull = (t: number): [number, number, number, number] => [
  ((-t + 2) * t - 1) * t * 0.5, ((3 * t - 5) * t * t + 2) * 0.5, ((-3 * t + 4) * t + 1) * t * 0.5, (t - 1) * t * t * 0.5];

/** One level of a height grid: height (m) = data * scale + offset. */
interface Level { w: number; h: number; data: Uint16Array | Float32Array; scale: number; offset: number }

/**
 * Box-filtered half-size levels of a height grid (2x2 averages, down to ~16 samples), so that a
 * coarse mesh far from the explorer samples heights averaged over its own spacing instead of
 * point samples of a much sharper grid (which alias into false cliffs and pits).
 */
function buildLevels(base: Level): Level[] {
  const out: Level[] = [base];
  let cw = base.w, ch = base.h;
  let src = Float32Array.from(base.data, (v) => v * base.scale + base.offset);
  while (cw >= 32 && ch >= 32) {
    const nw = cw >> 1, nh = ch >> 1;
    const dst = new Float32Array(nw * nh);
    for (let y = 0; y < nh; y++) {
      const r0 = 2 * y * cw, r1 = (2 * y + 1) * cw;
      for (let x = 0; x < nw; x++) dst[y * nw + x] = 0.25 * (src[r0 + 2 * x] + src[r0 + 2 * x + 1] + src[r1 + 2 * x] + src[r1 + 2 * x + 1]);
    }
    out.push({ w: nw, h: nh, data: dst, scale: 1, offset: 0 });
    src = dst; cw = nw; ch = nh;
  }
  return out;
}

/** Bicubic (Catmull-Rom) sample of a level at fractional grid coordinates (u, v in 0..1 across it). */
function sampleLevel(l: Level, u: number, v: number, wrapX: boolean): number {
  const fx = u * l.w - 0.5, fy = v * l.h - 0.5;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const wx = catmull(fx - x0), wy = catmull(fy - y0);
  let h = 0;
  for (let j = 0; j < 4; j++) {
    const y = Math.max(0, Math.min(l.h - 1, y0 - 1 + j));
    let row = 0;
    for (let i = 0; i < 4; i++) {
      let x = x0 - 1 + i;
      x = wrapX ? ((x % l.w) + l.w) % l.w : Math.max(0, Math.min(l.w - 1, x));
      row += wx[i] * l.data[y * l.w + x];
    }
    h += wy[j] * row;
  }
  return h * l.scale + l.offset;
}

/** Sample of a level pyramid for features of `spacing` metres (base pixels `pixelM` metres): blends the two levels around it. */
function samplePyramid(levels: Level[], pixelM: number, spacing: number, u: number, v: number, wrapX: boolean): number {
  const lv = Math.min(levels.length - 1, Math.max(0, Math.log2(Math.max(spacing, 1e-6) / pixelM)));
  const l0 = Math.floor(lv), t = lv - l0;
  const a = sampleLevel(levels[l0], u, v, wrapX);
  return t > 1e-3 && l0 + 1 < levels.length ? a + (sampleLevel(levels[l0 + 1], u, v, wrapX) - a) * t : a;
}

// ---------------------------------------------------------------- deterministic noise
function hash3(x: number, y: number, z: number, s: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440662683) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function vnoise(x: number, y: number, z: number, s: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const a = hash3(xi, yi, zi, s), b = hash3(xi + 1, yi, zi, s), c = hash3(xi, yi + 1, zi, s), d = hash3(xi + 1, yi + 1, zi, s);
  const e = hash3(xi, yi, zi + 1, s), f = hash3(xi + 1, yi, zi + 1, s), g = hash3(xi, yi + 1, zi + 1, s), h = hash3(xi + 1, yi + 1, zi + 1, s);
  const ab = a + (b - a) * u, cd = c + (d - c) * u, ef = e + (f - e) * u, gh = g + (h - g) * u;
  const l0 = ab + (cd - ab) * v, l1 = ef + (gh - ef) * v;
  return l0 + (l1 - l0) * w;
}

/**
 * Crater field with cells of `cell` metres on a sphere of radius R: bowls with raised rims, depth
 * `depth` x crater radius. `p` is the point on the sphere in metres.
 */
export function craterField(px: number, py: number, pz: number, cell: number, s: number, density: number, depth: number): number {
  const x = px / cell, y = py / cell, z = pz / cell;
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let h = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
    const cx = xi + dx, cy = yi + dy, cz = zi + dz;
    if (hash3(cx, cy, cz, s + 11) > density) continue;
    const ox = cx + 0.2 + 0.6 * hash3(cx, cy, cz, s + 1);
    const oy = cy + 0.2 + 0.6 * hash3(cx, cy, cz, s + 2);
    const oz = cz + 0.2 + 0.6 * hash3(cx, cy, cz, s + 3);
    // many small craters, few large ones
    const t = hash3(cx, cy, cz, s + 5);
    const rc = 0.1 + 0.32 * t * t;
    const d = Math.sqrt((x - ox) ** 2 + (y - oy) ** 2 + (z - oz) ** 2) / rc;
    if (d > 1.7) continue;
    // bowl (parabolic floor), rim crest at d = 1 and an ejecta apron outside
    const bowl = d < 1 ? d * d - 1 : 0;
    const rim = 0.32 * Math.exp(-(((d - 1) / 0.28) ** 2));
    h += (bowl + rim) * depth * rc * cell;
  }
  return h;
}

function seedOf(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return (h >>> 0) % 100003;
}

/**
 * Heights of solid worlds for the landing terrain: real global elevation models where we have
 * them (Moon, Mars, Mercury; bicubic between samples), and generated relief below their resolution
 * and everywhere else (fractal hills, crater fields from kilometres down to tens of metres).
 * Deterministic: the same place always has the same ground.
 */
export class TerrainSource {
  private manifest: TerrainManifest | null = null;
  private maps = new Map<string, HeightMap>();
  private pending = new Map<string, Promise<HeightMap | null>>();
  private order: string[] = [];
  /** crater density (0..1) per body, from its surface look */
  craters = new Map<Body, number>();
  private grounds = new Map<Body, Ground>();
  private patches = new Map<string, Patch[]>();          // loaded, by body key
  private patchRequested = new Set<string>();
  private versions = new Map<string, number>();
  /** [elevation] the max-level tile each body was last prefetched around */
  private elevAt = new Map<string, string>();

  constructor(private base: string) {
    fetch(`${base}/terrain/terrain.json`).then((r) => (r.ok ? r.json() : null)).then((j) => { this.manifest = j; }).catch(() => undefined);
    // [elevation] global cube-face pyramids (public/data/elevation, src/universe/Elevation.ts)
    Elevation.configure({ base: `${base}/elevation` });
  }

  /** The landing-terrain view of a Solar System body. */
  ground(b: Body): Ground {
    let g = this.grounds.get(b);
    if (!g) {
      g = { owner: b, name: b.name, radius: b.radius, radii: b.radii, amplitude: TerrainSource.amplitude(b),
        ready: () => this.ready(b), height: (n, spacing) => this.height(b, n, spacing),
        prepare: (n) => { this.nearPatches(b, n); this.nearElevation(b, n); },
        version: () => (this.versions.get(b.name.toLowerCase()) ?? 0) + Elevation.version(b.name.toLowerCase()) };
      this.grounds.set(b, g);
    }
    return g;
  }

  keyOf(b: Body): string | null {
    const k = b.name.toLowerCase();
    return this.manifest?.maps[k] ? k : null;
  }

  /** True when the body's heights are final (no elevation model, or it has loaded). */
  ready(b: Body): boolean {
    if (!this.manifest) return false;
    const k = this.keyOf(b);
    if (!k) return true;
    if (this.maps.has(k)) return true;
    this.request(k, b.radius);
    return false;
  }

  credit(b: Body): string | null {
    const k = this.keyOf(b);
    return k ? this.manifest!.maps[k].credit : null;
  }

  /** Fetch the sharper patches whose area the explorer is over or near (body-fixed direction n). */
  private nearPatches(b: Body, n: Vector3): void {
    const k = this.keyOf(b);
    const list = k ? this.manifest?.patches?.filter((p) => p.body === k) : undefined;
    if (!k || !list?.length) return;
    const lat = (Math.asin(Math.max(-1, Math.min(1, n.z))) * 180) / Math.PI;
    const lon = (Math.atan2(n.y, n.x) * 180) / Math.PI;
    for (const p of list) {
      if (this.patchRequested.has(p.name)) continue;
      const clat = (p.lat0 + p.lat1) / 2, clon = (p.lon0 + p.lon1) / 2;
      const dlon = ((((lon - clon) % 360) + 540) % 360) - 180;
      const half = Math.max(p.lat1 - p.lat0, (p.lon1 - p.lon0) * Math.cos((clat * Math.PI) / 180)) / 2;
      if (Math.hypot(lat - clat, dlon * Math.cos((clat * Math.PI) / 180)) > half + 8) continue;   // degrees
      this.patchRequested.add(p.name);
      loadHeights(`${this.base}/terrain/${p.file}`).then(({ data }) => {
        const pixelM = (((p.lat1 - p.lat0) / p.height) * Math.PI * b.radius) / 180;
        const arr = this.patches.get(k) ?? [];
        arr.push({ ...p, data, pixelM, levels: buildLevels({ w: p.width, h: p.height, data, scale: p.scale, offset: p.offset }) });
        this.patches.set(k, arr);
        this.versions.set(k, (this.versions.get(k) ?? 0) + 1);
      }).catch((err) => console.warn('terrain patch failed', p.name, err));
    }
  }

  /** [elevation] fetch the elevation tiles around the explorer (all levels, finest available) when it moves to another tile */
  private nearElevation(b: Body, n: Vector3): void {
    const k = b.name.toLowerCase();
    if (!Elevation.levels(k)) return;
    const t = tileOf(n, Math.max(0, Elevation.maxLevelAt(k, n)));
    const id = `${t.face}/${t.level}/${t.x}/${t.y}`;
    if (this.elevAt.get(k) === id) return;
    this.elevAt.set(k, id);
    void Elevation.prefetch(k, n, 0, 1);
  }

  /** bicubic sample of a patch at (lat, lon) degrees for features of `spacing` m, with its blend weight (0 outside, 1 well inside) */
  private patchSample(p: Patch, lat: number, lon: number, spacing: number): { h: number; w: number } | null {
    const v = (p.lat1 - lat) / (p.lat1 - p.lat0);
    const u = ((((lon - p.lon0) % 360) + 360) % 360) / (p.lon1 - p.lon0);
    if (u <= 0 || u >= 1 || v <= 0 || v >= 1) return null;
    const e = Math.min(u, 1 - u, v, 1 - v);
    const t = Math.min(1, e / 0.12);
    const w = t * t * (3 - 2 * t);
    return { h: samplePyramid(p.levels, p.pixelM, spacing, u, v, false), w };
  }

  private request(k: string, radius: number): void {
    if (this.pending.has(k)) return;
    const m = this.manifest!.maps[k];
    const p = loadHeights(`${this.base}/terrain/${m.file}`)
      .then(({ w, h, data }) => {
        const hm: HeightMap = { width: w, height: h, lonLeft: m.lonLeft, data, offset: m.offset, scale: m.scale, pixelM: (2 * Math.PI * radius) / w, sea: m.sea };
        this.maps.set(k, hm);
        // keep at most two elevation models in memory
        this.order = this.order.filter((o) => o !== k).concat(k);
        while (this.order.length > 2) { const old = this.order.shift()!; this.maps.delete(old); this.pending.delete(old); }
        return hm;
      })
      .catch((err) => { console.warn('terrain map failed', k, err); return null; });
    this.pending.set(k, p);
  }

  /** bicubic (Catmull-Rom) sample of the elevation model at body-fixed unit direction n, for features of `spacing` m */
  private dem(m: HeightMap, n: Vector3, spacing: number): number {
    const lon = Math.atan2(n.y, n.x);
    const lat = Math.asin(Math.max(-1, Math.min(1, n.z)));
    let u = (lon - (m.lonLeft * Math.PI) / 180) / (2 * Math.PI);
    u -= Math.floor(u);
    m.levels ??= buildLevels({ w: m.width, h: m.height, data: m.data, scale: m.scale, offset: m.offset });
    return samplePyramid(m.levels, m.pixelM, spacing, u, 0.5 - lat / Math.PI, true);
  }

  /** relief amplitude (m) of a body without an elevation model */
  static amplitude(b: Body): number {
    return Math.min(4500, b.radius * 0.0024);
  }

  /**
   * Height (m) above the reference surface at body-fixed unit direction `n`. `spacing` is the
   * size (m) of the smallest feature worth computing (the local vertex spacing): finer layers are
   * left to the shader's bump detail.
   */
  height(b: Body, n: Vector3, spacing: number): number {
    const R = b.radius;
    const s = seedOf(b.name);
    const k = this.keyOf(b);
    const m = k ? this.maps.get(k) : undefined;
    let h = 0;
    // generated relief starts below this wavelength (m): the whole range without an elevation model
    let top: number;
    // a sharper regional patch takes over (blended in at its edges), and generated relief
    // between its resolution and the global map's fades out there
    let wP = 0, topP = Infinity;
    // [elevation] the global pyramid's heights where its tiles have loaded (sharper than the map)
    const e = Elevation.sample(b.name.toLowerCase(), n, spacing);
    if (e !== null && !m) {
      h = e;
      top = Elevation.lastMetresPerSample * 3;
    } else if (m) {
      h = e ?? this.dem(m, n, spacing);
      top = e !== null ? Elevation.lastMetresPerSample * 3 : m.pixelM * 3;
      const pl = this.patches.get(k!);
      if (pl) {
        const lat = (Math.asin(Math.max(-1, Math.min(1, n.z))) * 180) / Math.PI;
        const lon = (Math.atan2(n.y, n.x) * 180) / Math.PI;
        for (const p of pl) {
          const smp = this.patchSample(p, lat, lon, spacing);
          if (smp && smp.w > wP) { h += (smp.h - h) * smp.w; wP = smp.w; topP = p.pixelM * 3; }
        }
      }
    } else {
      top = R / 3;
    }
    const minL = Math.max(spacing * 2.5, 6);
    const px = n.x * R, py = n.y * R, pz = n.z * R;
    // fractal hills: amplitude proportional to wavelength (slopes of a few percent)
    let slope = m || e !== null ? 0.012 : Math.min(0.03, TerrainSource.amplitude(b) / (R / 3));
    // a world with oceans: no generated relief at sea, little on lowlands, the most in high mountains
    const sea = m?.sea;
    if (sea !== undefined) {
      const t = Math.min(1, Math.max(0, (h - sea) / 150));
      slope *= t * t * (3 - 2 * t) * Math.min(1, Math.max(0.08, (h - sea) / 2500));
    }
    let o = 0;
    for (let L = top; L > minL && o < 16; L *= 0.5, o++) {
      h += (vnoise(px / L, py / L, pz / L, s + o * 7) - 0.5) * 2 * slope * L * (L > topP ? 1 - wP : 1);
    }
    // a world with oceans: high ground gets mountain detail below the elevation model's resolution:
    // sharp ridges and steep valley sides (ridged noise, warped so the ridges wander), strongest in
    // the high ranges, so peaks seen up close are rock walls and arêtes rather than smooth domes
    if (sea !== undefined) {
      const t = Math.min(1, Math.max(0, (h - sea - 800) / 2600));
      const mtn = t * t * (3 - 2 * t);
      if (mtn > 0) {
        const L0 = Math.min(top, 2400);
        let a = 0.16;
        for (let L = L0, k = 0; L > minL && k < 10; L *= 0.5, k++) {
          const wx = (vnoise(px / L + 3.1, py / L, pz / L, s + 500 + k) - 0.5) * 0.9;
          const wy = (vnoise(px / L, py / L + 5.3, pz / L, s + 520 + k) - 0.5) * 0.9;
          const n = vnoise(px / L + wx, py / L + wy, pz / L, s + 540 + k);
          const r = 1 - Math.abs(2 * n - 1);
          h += (r * r - 0.42) * a * L * mtn * (L > topP ? 1 - wP : 1);
          // finer octaves a little gentler (scree and snow soften the smallest forms)
          if (L < 40) a = 0.1;
        }
      }
    }
    // crater fields: cells of 40 km down to 30 m, each a fifth the size of the one before
    const dens = this.craters.get(b) ?? 0.8;
    if (dens > 0.05) {
      // patchy coverage, as on real surfaces
      const patch = vnoise(px / 60e3, py / 60e3, pz / 60e3, s + 99);
      let i = 0;
      for (let cell = 40e3; cell >= 30; cell /= 4.6, i++) {
        if (cell * 0.4 < minL) break;          // too small to resolve here
        if (cell > top * 1.2) continue;        // the elevation model already has craters this size
        const d = dens * (0.35 + 0.35 * patch) * (cell < 1000 ? 1.15 : 1);
        // complex (large) craters are shallower relative to their size
        const depth = cell > 5000 ? 0.18 : 0.32;
        h += craterField(px, py, pz, cell, s + 100 * i, d, depth) * (cell > topP * 1.2 ? 1 - wP : 1);
      }
    }
    if (sea !== undefined) h = Math.max(h, sea);
    return Number.isFinite(h) ? h : 0;
  }

  /** reference-surface radius (m) of the body along direction n (its ellipsoid) */
  static baseRadius(b: { radii: readonly number[] }, n: Vector3): number {
    return baseRadius(b, n);
  }
}
