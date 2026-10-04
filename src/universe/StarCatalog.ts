import { Vector3 } from 'three';
import { lutToTeff } from '../astro/photometry';
import { PC } from '../core/units';

/**
 * Streaming star catalogue (AT-HYG v4.0 + Gaia DR3 100 pc) stored as a
 * brightest-first octree (see pipeline/build_stars.py). Each frame the
 * camera position and the current limiting magnitude decide which nodes are
 * needed; a node is needed exactly when one of its stars could be brighter
 * than the limit as seen from the camera.
 */
export interface StarNode {
  id: number;
  parent: number;
  depth: number;
  center: [number, number, number]; // pc
  half: number; // pc
  count: number;
  magMin: number;
  magMax: number;
  subMag: number;
  enc: 'u' | 'f';
  children: number[];
  // runtime
  state: 'none' | 'loading' | 'ready' | 'error';
  /** u16: normalised in node cube; f32: pc relative to centre */
  pos: Uint16Array | Float32Array | null;
  /** absMag code | teff code << 8 */
  mt: Uint16Array | null;
  absMag: Float32Array | null;
  lastNeeded: number;
  /** stars to draw this frame (prefix of the brightness-sorted list) */
  drawCount: number;
  /** min distance camera -> node cube (pc) this frame */
  dmin: number;
  cpuPos: Float64Array | null;
  ids: Uint32Array | null;
  idsState: 'none' | 'loading' | 'ready';
}

interface StarIndex {
  source?: string; license?: string;
  nodeCapacity: number; rootHalf: number;
  absMag: { min: number; step: number };
  teff: { min: number; max: number };
  idCode: { notableCount: number };
  stars: number;
  nodes: [number, number, number, number, number, number, number, number, number, number, number, 'u' | 'f', number[]][];
}

export interface StarRef { catalog: StarCatalog; node: StarNode; slot: number }

export class StarCatalog {
  readonly nodes: StarNode[];
  readonly totalStars: number;
  readonly notableCount: number;
  private absMin: number;
  private absStep: number;
  private frame = 0;
  private inflight = 0;
  private queue: StarNode[] = [];
  /** nodes needed in the current frame */
  readonly needed: StarNode[] = [];
  loadedStars = 0;
  onNodeLoaded: ((n: StarNode) => void) | null = null;
  onNodeEvicted: ((n: StarNode) => void) | null = null;
  maxLoadedStars = 4_000_000;
  private extraIds: string[] | null = null;
  private extraPromise: Promise<string[]> | null = null;

  readonly license: string;
  readonly source: string;

  constructor(readonly id: string, private base: string, index: StarIndex) {
    this.license = index.license ?? '';
    this.source = index.source ?? '';
    this.absMin = index.absMag.min;
    this.absStep = index.absMag.step;
    this.totalStars = index.stars;
    this.notableCount = index.idCode.notableCount;
    this.nodes = index.nodes.map((n) => ({
      id: n[0], parent: n[1], depth: n[2], center: [n[3], n[4], n[5]], half: n[6], count: n[7],
      magMin: n[8], magMax: n[9], subMag: n[10], enc: n[11], children: n[12],
      state: 'none', pos: null, mt: null, absMag: null, lastNeeded: -1, drawCount: 0, dmin: 0,
      cpuPos: null, ids: null, idsState: 'none',
    }));
  }

  static async load(id: string, base: string): Promise<StarCatalog> {
    const res = await fetch(`${base}/index.json`);
    if (!res.ok) throw new Error(`star index: HTTP ${res.status}`);
    return new StarCatalog(id, base, await res.json());
  }

  decodeAbsMag(code: number): number {
    return this.absMin + code * this.absStep;
  }

  /**
   * Select needed nodes for a camera at `cam` (pc) with limiting apparent magnitude `mLim`.
   * `minDistPc` is a lower bound on the distance of any star drawn by the field (the nearest star
   * outside the near-star layer); it keeps tiles around the camera from drawing every faint star.
   * Fills `this.needed` with ready nodes and queues loads (brightest first).
   */
  update(cam: Vector3, mLim: number, minDistPc = 0): void {
    this.frame++;
    this.needed.length = 0;
    const want: { node: StarNode; m: number }[] = [];
    const stack = [0];
    while (stack.length) {
      const n = this.nodes[stack.pop()!];
      // no star can be closer than the nearest star (outside the near-star layer)
      const d = Math.max(aabbDistance(cam, n.center, n.half), minDistPc);
      n.dmin = d;
      const distMod = 5 * Math.log10(Math.max(d, 1e-9) / 10);
      if (n.subMag + distMod > mLim) continue;
      if (n.count > 0 && n.magMin + distMod <= mLim) {
        n.lastNeeded = this.frame;
        if (n.state === 'ready') {
          n.drawCount = this.countBrighter(n, mLim - distMod);
          this.needed.push(n);
        } else if (n.state === 'none') {
          want.push({ node: n, m: n.magMin + distMod });
        }
      }
      for (const c of n.children) stack.push(c);
    }
    want.sort((a, b) => a.m - b.m);
    this.queue = want.map((w) => w.node);
    this.pump();
    if (this.frame % 60 === 0) this.evict();
  }

  /** Number of leading (brightest) stars in the node with absMag <= limit. */
  private countBrighter(n: StarNode, absLimit: number): number {
    const a = n.absMag!;
    if (absLimit >= n.magMax) return a.length;
    let lo = 0, hi = a.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (a[mid] <= absLimit) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  get pending(): number {
    return this.queue.length + this.inflight;
  }

  private pump(): void {
    while (this.inflight < 6 && this.queue.length) {
      const n = this.queue.shift()!;
      if (n.state !== 'none') continue;
      n.state = 'loading';
      this.inflight++;
      fetch(`${this.base}/n/${n.id}.bin`)
        .then((r) => {
          if (!r.ok) throw new Error(`star node ${n.id}: HTTP ${r.status}`);
          return r.arrayBuffer();
        })
        .then((buf) => {
          this.decode(n, buf);
          n.state = 'ready';
          this.loadedStars += n.count;
          this.onNodeLoaded?.(n);
        })
        .catch((e) => {
          console.error(e);
          n.state = 'error';
        })
        .finally(() => {
          this.inflight--;
          this.pump();
        });
    }
  }

  private decode(n: StarNode, buf: ArrayBuffer): void {
    const count = n.count;
    const mt = new Uint16Array(count);
    const absMag = new Float32Array(count);
    const bytes = new Uint8Array(buf);
    if (n.enc === 'u') {
      const src = new Uint16Array(buf);
      const pos = new Uint16Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = src[i * 4];
        pos[i * 3 + 1] = src[i * 4 + 1];
        pos[i * 3 + 2] = src[i * 4 + 2];
        const m = bytes[i * 8 + 6], t = bytes[i * 8 + 7];
        mt[i] = m | (t << 8);
        absMag[i] = this.absMin + m * this.absStep;
      }
      n.pos = pos;
    } else {
      const src = new Float32Array(buf);
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = src[i * 4];
        pos[i * 3 + 1] = src[i * 4 + 1];
        pos[i * 3 + 2] = src[i * 4 + 2];
        const m = bytes[i * 16 + 12], t = bytes[i * 16 + 13];
        mt[i] = m | (t << 8);
        absMag[i] = this.absMin + m * this.absStep;
      }
      n.pos = pos;
    }
    n.mt = mt;
    n.absMag = absMag;
  }

  private evict(): void {
    if (this.loadedStars < this.maxLoadedStars) return;
    const candidates = this.nodes.filter((n) => n.state === 'ready' && n.lastNeeded < this.frame - 120 && n.id !== 0);
    candidates.sort((a, b) => a.lastNeeded - b.lastNeeded);
    for (const n of candidates) {
      if (this.loadedStars < this.maxLoadedStars * 0.8) break;
      this.onNodeEvicted?.(n);
      n.state = 'none';
      n.pos = null; n.mt = null; n.absMag = null; n.cpuPos = null;
      this.loadedStars -= n.count;
    }
  }

  /** Origin used for rendering a node: min corner (u16) or centre (f32), and the scale factor (pc). */
  nodeFrame(n: StarNode): { origin: [number, number, number]; scale: number } {
    if (n.enc === 'u') return { origin: [n.center[0] - n.half, n.center[1] - n.half, n.center[2] - n.half], scale: 2 * n.half };
    return { origin: n.center, scale: 1 };
  }

  /** Star positions (pc, heliocentric) decoded to doubles, cached per node. */
  cpuPositions(n: StarNode): Float64Array | null {
    if (n.cpuPos) return n.cpuPos;
    if (!n.pos) return null;
    const { origin, scale } = this.nodeFrame(n);
    const out = new Float64Array(n.count * 3);
    const norm = n.enc === 'u' ? 1 / 65535 : 1;
    for (let i = 0; i < n.count * 3; i++) out[i] = origin[i % 3] + n.pos[i] * norm * scale;
    n.cpuPos = out;
    return out;
  }

  starPosition(ref: StarRef, out = new Vector3()): Vector3 {
    const p = this.cpuPositions(ref.node)!;
    return out.set(p[ref.slot * 3], p[ref.slot * 3 + 1], p[ref.slot * 3 + 2]);
  }

  starAbsMag(ref: StarRef): number {
    return ref.node.absMag![ref.slot];
  }

  starTeff(ref: StarRef): number {
    return lutToTeff((ref.node.mt![ref.slot] >> 8) / 255);
  }

  /** Nearest loaded catalogue stars to `cam` (pc) within `radius` pc. */
  nearest(cam: Vector3, radius: number, max = 8): { ref: StarRef; dist: number }[] {
    const out: { ref: StarRef; dist: number }[] = [];
    for (const n of this.nodes) {
      if (n.state !== 'ready') continue;
      if (aabbDistance(cam, n.center, n.half) > radius) continue;
      const p = this.cpuPositions(n)!;
      for (let i = 0; i < n.count; i++) {
        const dx = p[i * 3] - cam.x, dy = p[i * 3 + 1] - cam.y, dz = p[i * 3 + 2] - cam.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < radius * radius) out.push({ ref: { catalog: this, node: n, slot: i }, dist: Math.sqrt(d2) });
      }
    }
    out.sort((a, b) => a.dist - b.dist);
    return out.slice(0, max);
  }

  // ------------------------------------------------------------------ designations
  async designation(ref: StarRef): Promise<{ code: number; text: string | null; notable: number | null }> {
    const n = ref.node;
    if (n.idsState !== 'ready') {
      const r = await fetch(`${this.base}/n/${n.id}.ids`);
      n.ids = new Uint32Array(await r.arrayBuffer());
      n.idsState = 'ready';
    }
    const code = n.ids![ref.slot];
    const kind = code >>> 30;
    const payload = code & 0x3fffffff;
    if (kind === 1) return { code, text: `HIP ${payload}`, notable: null };
    if (kind === 2) return { code, text: `HD ${payload}`, notable: null };
    if (kind === 3) return { code, text: `TYC ${payload >>> 16}-${(payload >>> 2) & 0x3fff}-${(payload & 3) + 1}`, notable: null };
    if (payload < this.notableCount) return { code, text: null, notable: payload };
    const extra = await this.loadExtra();
    const s = extra[payload - this.notableCount] ?? '';
    return { code, text: /^\d+$/.test(s) ? `Gaia DR3 ${s}` : s, notable: null };
  }

  private loadExtra(): Promise<string[]> {
    if (this.extraIds) return Promise.resolve(this.extraIds);
    if (!this.extraPromise) {
      this.extraPromise = fetch(`${this.base}/extra_ids.txt`).then((r) => r.text()).then((t) => (this.extraIds = t.split('\n')));
    }
    return this.extraPromise;
  }
}

export function aabbDistance(p: Vector3, c: [number, number, number], h: number): number {
  const dx = Math.max(Math.abs(p.x - c[0]) - h, 0);
  const dy = Math.max(Math.abs(p.y - c[1]) - h, 0);
  const dz = Math.max(Math.abs(p.z - c[2]) - h, 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export const pcToMeters = (pc: number) => pc * PC;
