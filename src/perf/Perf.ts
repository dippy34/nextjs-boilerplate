import type { WebGLRenderer } from 'three';

/**
 * Cheap frame instrumentation, always on (a few performance.now() calls per frame):
 *
 * - frame-to-frame time (the display's or headset's pacing), and the CPU time of App.frame;
 * - lap timers: App.frame calls `PERF.lap('bodies')` after each stage, which charges the time since
 *   the previous lap to that name (CPU time: updating a layer, or submitting the draw calls);
 * - draw calls and triangles over the whole frame (renderer.info, reset once per frame instead of at
 *   every gl.render, so the volume pass, the black-hole capture and bloom all count);
 * - GPU time where EXT_disjoint_timer_query_webgl2 exists: a TIME_ELAPSED query around the frame's
 *   drawing, read back a few frames later (results arrive late; a disjoint event drops them).
 *
 * The perf HUD (PerfHud.ts) shows the rolling history; the benchmark (Bench.ts) samples it.
 */

export const HISTORY = 240;

/** short names for the lap timers (the benchmark code carries these) */
export const LAYERS = ['sim', 'cam', 'bodies', 'atmo', 'exo', 'terrain', 'craft', 'holes', 'sky', 'stars', 'orbits', 'game', 'god', 'capture', 'render', 'overlay'] as const;
export type LayerName = typeof LAYERS[number];

interface TimerExt { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number }

class GpuTimer {
  private gl: WebGL2RenderingContext;
  private ext: TimerExt;
  private pending: WebGLQuery[] = [];
  private free: WebGLQuery[] = [];
  private open: WebGLQuery | null = null;
  /** latest GPU time (ms), -1 until one arrives */
  last = -1;

  constructor(gl: WebGL2RenderingContext, ext: TimerExt) {
    this.gl = gl;
    this.ext = ext;
  }

  begin(): void {
    // (a query still open, e.g. a frame that threw: leave it; never nest)
    if (this.open || this.pending.length > 6) return;
    const q = this.free.pop() ?? this.gl.createQuery();
    if (!q) return;
    this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, q);
    this.open = q;
  }

  end(): void {
    if (!this.open) return;
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    this.pending.push(this.open);
    this.open = null;
  }

  /** Collect finished queries; returns the newest result (ms) or -1. */
  poll(): number {
    const gl = this.gl;
    const disjoint = gl.getParameter(this.ext.GPU_DISJOINT_EXT);
    let got = -1;
    while (this.pending.length) {
      const q = this.pending[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      const ns = gl.getQueryParameter(q, gl.QUERY_RESULT) as number;
      this.pending.shift();
      this.free.push(q);
      if (!disjoint) got = ns / 1e6;
    }
    if (got >= 0) this.last = got;
    return got;
  }
}

export class Perf {
  /** frame-to-frame times (ms), ring buffer */
  readonly frameMs = new Float32Array(HISTORY);
  /** CPU time of App.frame (ms) */
  readonly cpuMs = new Float32Array(HISTORY);
  readonly drawCalls = new Float32Array(HISTORY);
  readonly gpuMs = new Float32Array(HISTORY).fill(-1);
  /** index of the newest entry */
  head = 0;
  /** latest laps (ms), by layer */
  readonly laps = new Map<LayerName, number>();
  /** smoothed laps (ms) for display */
  readonly lapsAvg = new Map<LayerName, number>();
  triangles = 0;
  calls = 0;
  gpuAvailable = false;
  /** hooks called once per frame with this frame's numbers (the benchmark's sampler) */
  readonly listeners = new Set<(s: FrameSample) => void>();

  private renderer: WebGLRenderer | null = null;
  private gpu: GpuTimer | null = null;
  private t0 = 0;
  private lastLap = 0;
  private lastStart = 0;
  private frameLaps: Partial<Record<LayerName, number>> = {};

  /** Hook up the renderer (renderer.info counted per frame; GPU timer if the extension exists). */
  attach(renderer: WebGLRenderer): void {
    this.renderer = renderer;
    renderer.info.autoReset = false;
    const gl = renderer.getContext() as WebGL2RenderingContext;
    try {
      const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as TimerExt | null;
      if (ext) { this.gpu = new GpuTimer(gl, ext); this.gpuAvailable = true; }
    } catch { /* no timer queries */ }
  }

  /** Start of App.frame. */
  frameStart(now = performance.now()): void {
    this.t0 = now;
    this.lastLap = now;
    this.frameLaps = {};
    this.gpu?.poll();
    this.renderer?.info.reset();
  }

  /** Charge the time since the previous lap to `name`. */
  lap(name: LayerName): void {
    const now = performance.now();
    this.frameLaps[name] = (this.frameLaps[name] ?? 0) + (now - this.lastLap);
    this.lastLap = now;
  }

  /** Around the frame's drawing (GPU time). */
  gpuBegin(): void { this.gpu?.begin(); }
  gpuEnd(): void { this.gpu?.end(); }

  /** End of App.frame. */
  frameEnd(): void {
    const now = performance.now();
    const dt = this.lastStart > 0 ? this.t0 - this.lastStart : 0;
    this.lastStart = this.t0;
    const i = this.head = (this.head + 1) % HISTORY;
    const info = this.renderer?.info.render;
    this.calls = info?.calls ?? 0;
    this.triangles = info?.triangles ?? 0;
    this.frameMs[i] = dt;
    this.cpuMs[i] = now - this.t0;
    this.drawCalls[i] = this.calls;
    this.gpuMs[i] = this.gpu ? this.gpu.last : -1;
    for (const name of LAYERS) {
      const v = this.frameLaps[name] ?? 0;
      this.laps.set(name, v);
      this.lapsAvg.set(name, (this.lapsAvg.get(name) ?? v) * 0.95 + v * 0.05);
    }
    if (this.listeners.size) {
      const s: FrameSample = { t: this.t0, dt, cpu: this.cpuMs[i], calls: this.calls, tris: this.triangles, gpu: this.gpuMs[i], laps: this.frameLaps };
      for (const f of this.listeners) f(s);
    }
  }
}

export interface FrameSample {
  /** frame start (ms, performance.now) */
  t: number;
  /** time since the previous frame start (ms; 0 for the first) */
  dt: number;
  cpu: number;
  calls: number;
  tris: number;
  /** latest GPU time (ms) or -1 */
  gpu: number;
  laps: Partial<Record<LayerName, number>>;
}

export const PERF = new Perf();
