import { Vector3 } from 'three';
import { eclToEqu } from '../core/frames';
import { AU, DEG } from '../core/units';
import { solveKeplerElliptic } from './kepler';

/**
 * Streaming evaluator for JPL DE442S (converted by pipeline/build_ephemeris.py).
 * 10-year chunks are fetched on demand; while a chunk is missing, or outside
 * 1849–2150, planets fall back to JPL's approximate Keplerian elements
 * (Standish, valid 3000 BC – 3000 AD).
 */
interface SegmentInfo { center: number; target: number; init: number; intlen: number; ncoef: number }
interface ChunkInfo { file: string; jd0: number; jd1: number; seg: [number, number, number, number][] }
export interface EphemerisIndex {
  jdStart: number; jdEnd: number; chunkDays: number;
  segments: SegmentInfo[]; chunks: ChunkInfo[]; maxErrorKm: Record<string, number>;
}

interface LoadedChunk { f64: Float64Array; f32: Float32Array }

export interface ApproxElements { el0: number[]; rate: number[]; bcsf?: number[] }

export class Ephemeris {
  private segKey = new Map<string, number>();
  private loaded = new Map<number, LoadedChunk>();
  private pending = new Map<number, Promise<void>>();
  onChunkLoaded: (() => void) | null = null;

  constructor(readonly index: EphemerisIndex, private baseUrl: string, private approx: Record<string, ApproxElements>) {
    index.segments.forEach((s, i) => this.segKey.set(`${s.center}:${s.target}`, i));
  }

  static async load(baseUrl: string, approx: Record<string, ApproxElements>): Promise<Ephemeris> {
    const res = await fetch(`${baseUrl}/index.json`);
    if (!res.ok) throw new Error(`ephemeris index: HTTP ${res.status}`);
    return new Ephemeris(await res.json(), baseUrl, approx);
  }

  inRange(jd: number): boolean {
    return jd >= this.index.jdStart && jd < this.index.jdEnd;
  }

  private chunkIndex(jd: number): number {
    if (!this.inRange(jd)) return -1;
    const k = Math.floor((jd - this.index.jdStart) / this.index.chunkDays);
    return Math.min(k, this.index.chunks.length - 1);
  }

  /** Make sure data for `jd` (and the chunk we are heading into) is loaded. */
  request(jd: number, direction = 0): Promise<void> | null {
    const k = this.chunkIndex(jd);
    if (k < 0) return null;
    const p = this.fetchChunk(k);
    if (direction !== 0) {
      const c = this.index.chunks[k];
      const frac = (jd - c.jd0) / (c.jd1 - c.jd0);
      if (direction > 0 && frac > 0.7 && k + 1 < this.index.chunks.length) this.fetchChunk(k + 1);
      if (direction < 0 && frac < 0.3 && k > 0) this.fetchChunk(k - 1);
    }
    return p;
  }

  isLoaded(jd: number): boolean {
    const k = this.chunkIndex(jd);
    return k >= 0 && this.loaded.has(k);
  }

  private fetchChunk(k: number): Promise<void> {
    if (this.loaded.has(k)) return Promise.resolve();
    const existing = this.pending.get(k);
    if (existing) return existing;
    const c = this.index.chunks[k];
    const p = fetch(`${this.baseUrl}/${c.file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${c.file}: HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((buf) => {
        this.loaded.set(k, { f64: new Float64Array(buf), f32: new Float32Array(buf) });
        this.pending.delete(k);
        // Keep memory bounded: drop chunks far from the one just loaded.
        for (const key of [...this.loaded.keys()]) if (Math.abs(key - k) > 3) this.loaded.delete(key);
        this.onChunkLoaded?.();
      })
      .catch((err) => {
        this.pending.delete(k);
        console.error('ephemeris chunk failed', err);
      });
    this.pending.set(k, p);
    return p;
  }

  /**
   * Position (km, ICRF) of `target` relative to `center` at TDB Julian date `jd`.
   * Optionally also velocity in km/day. Returns false if the data is not available.
   */
  evaluate(center: number, target: number, jd: number, out: Vector3, vel?: Vector3): boolean {
    const k = this.chunkIndex(jd);
    if (k < 0) return false;
    const chunk = this.loaded.get(k);
    if (!chunk) return false;
    const si = this.segKey.get(`${center}:${target}`);
    if (si === undefined) return false;
    const seg = this.index.segments[si];
    const [recStart, nrec, off64, off32] = this.index.chunks[k].seg[si];
    let rec = Math.floor((jd - seg.init) / seg.intlen);
    let local = rec - recStart;
    if (local < 0) local = 0;
    if (local >= nrec) local = nrec - 1;
    rec = recStart + local;
    const t0 = seg.init + rec * seg.intlen;
    const x = (2 * (jd - t0)) / seg.intlen - 1;
    const nc = seg.ncoef - 1;
    const base64 = off64 / 8 + local * 3;
    const base32 = off32 / 4 + local * 3 * nc;
    const res = [0, 0, 0];
    const vres = [0, 0, 0];
    for (let comp = 0; comp < 3; comp++) {
      let tPrev = 1, t = x;
      let dPrev = 0, d = 1; // derivatives of T_k
      let p = chunk.f64[base64 + comp];
      let v = 0;
      const cb = base32 + comp * nc;
      for (let i = 0; i < nc; i++) {
        const c = chunk.f32[cb + i];
        p += c * t;
        v += c * d;
        const tn = 2 * x * t - tPrev;
        const dn = 2 * t + 2 * x * d - dPrev;
        tPrev = t; t = tn;
        dPrev = d; d = dn;
      }
      res[comp] = p;
      vres[comp] = (v * 2) / seg.intlen;
    }
    out.set(res[0], res[1], res[2]);
    if (vel) vel.set(vres[0], vres[1], vres[2]);
    return true;
  }

  /**
   * Heliocentric ICRF position (m) of a planet (or the Earth–Moon barycentre,
   * name 'EMB') from JPL's approximate Keplerian elements, Table 2a/2b.
   */
  approxHeliocentric(name: string, jd: number, out: Vector3): boolean {
    const el = this.approx[name];
    if (!el) return false;
    const T = (jd - 2451545.0) / 36525;
    const v = (k: number) => el.el0[k] + (el.rate?.[k] ?? 0) * T;
    const a = v(0), e = v(1), I = v(2), L = v(3), varpi = v(4), node = v(5);
    let M = L - varpi;
    if (el.bcsf) {
      const [b, c, s, f] = el.bcsf;
      M += b * T * T + c * Math.cos(f * T * DEG) + s * Math.sin(f * T * DEG);
    }
    const w = varpi - node;
    const E = solveKeplerElliptic(M * DEG, e);
    const xp = a * (Math.cos(E) - e);
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cw = Math.cos(w * DEG), sw = Math.sin(w * DEG);
    const cO = Math.cos(node * DEG), sO = Math.sin(node * DEG);
    const ci = Math.cos(I * DEG), si = Math.sin(I * DEG);
    const x = (cw * cO - sw * sO * ci) * xp + (-sw * cO - cw * sO * ci) * yp;
    const y = (cw * sO + sw * cO * ci) * xp + (-sw * sO + cw * cO * ci) * yp;
    const z = sw * si * xp + cw * si * yp;
    eclToEqu(out.set(x * AU, y * AU, z * AU));
    return true;
  }
}
