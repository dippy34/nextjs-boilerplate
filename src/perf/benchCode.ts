/**
 * The benchmark result as a short copyable code: compact JSON, deflated where the browser has
 * CompressionStream, base64url. `SB1z.` = deflate-raw, `SB1.` = plain JSON. Decoded by
 * scripts/bench-decode.mjs (keep the two in step; tests/bench.test.ts round-trips them).
 */

/** One scene's numbers. Times in ms (one decimal). */
export interface SceneResult {
  /** scene id (Bench.ts SCENES) */
  id: string;
  /** frames recorded */
  n: number;
  /** median frame time */
  med: number;
  /** 1% low: mean of the slowest 1% of frame times */
  low: number;
  /** frames the display wanted but we missed */
  drop: number;
  /** median draw calls */
  dc: number;
  /** median triangles (thousands) */
  tri: number;
  /** median GPU time, -1 unknown */
  gpu: number;
  /** median CPU time of App.frame */
  cpu: number;
  /** JS heap at the end (MB), -1 unknown */
  heap: number;
  /** quality-governor level at the end (and the highest it reached, if different: "1-3") */
  q: string;
  /** the costliest lap timers: [layer, median ms] */
  top: [string, number][];
}

export interface BenchResult {
  v: 1;
  /** when (ISO, minutes) */
  at: string;
  ua: string;
  /** WebGL renderer string (unmasked where allowed) */
  gl: string;
  /** XR framebuffer [w, h] (both eyes), or 0 on a desktop */
  xr: [number, number] | 0;
  /** canvas drawing buffer [w, h] on a desktop */
  px: [number, number];
  /** refresh rate (Hz): the session's frameRate in a headset, else estimated */
  hz: number;
  /** GPU timer queries available */
  gq: 0 | 1;
  /** seconds held per scene */
  hold: number;
  s: SceneResult[];
}

const r1 = (x: number) => Math.round(x * 10) / 10;

/** Compact array form: keys dropped, numbers rounded. */
export function pack(r: BenchResult): unknown {
  return [r.v, r.at, r.ua, r.gl, r.xr, r.px, r.hz, r.gq, r.hold,
    r.s.map((s) => [s.id, s.n, r1(s.med), r1(s.low), s.drop, Math.round(s.dc), r1(s.tri), r1(s.gpu), r1(s.cpu), Math.round(s.heap), s.q,
      s.top.map(([k, v]) => [k, r1(v)])])];
}

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function deflate(data: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const cs = new CompressionStream('deflate-raw');
    const out = new Blob([data as BlobPart]).stream().pipeThrough(cs);
    return new Uint8Array(await new Response(out).arrayBuffer());
  } catch { return null; }
}

export async function encode(r: BenchResult): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(pack(r)));
  const z = await deflate(json);
  return z ? `SB1z.${b64url(z)}` : `SB1.${b64url(json)}`;
}

/** median of a list (0 for none) */
export function median(xs: ArrayLike<number>): number {
  const a = Array.from(xs).sort((p, q) => p - q);
  if (!a.length) return 0;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** mean of the slowest 1% (at least one) of frame times */
export function onePercentLow(xs: ArrayLike<number>): number {
  const a = Array.from(xs).sort((p, q) => q - p);
  if (!a.length) return 0;
  const k = Math.max(1, Math.ceil(a.length * 0.01));
  let s = 0;
  for (let i = 0; i < k; i++) s += a[i];
  return s / k;
}

/** frames the display would have shown that we missed, for a refresh period of `period` ms */
export function droppedFrames(xs: ArrayLike<number>, period: number): number {
  let d = 0;
  for (let i = 0; i < xs.length; i++) d += Math.max(0, Math.round(xs[i] / period) - 1);
  return d;
}

const RATES = [60, 72, 75, 80, 90, 100, 120, 144, 165, 240];

/** refresh rate (Hz) from frame times: the fast end of the distribution, snapped to a common rate */
export function estimateHz(xs: ArrayLike<number>): number {
  const a = Array.from(xs).filter((x) => x > 0).sort((p, q) => p - q);
  if (a.length < 10) return 60;
  const fast = a[Math.floor(a.length * 0.1)];
  const hz = 1000 / fast;
  let best = RATES[0];
  for (const r of RATES) if (Math.abs(r - hz) < Math.abs(best - hz)) best = r;
  return Math.abs(best - hz) / hz < 0.08 ? best : Math.round(hz);
}
