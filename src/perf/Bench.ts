import { Vector3 } from 'three';
import type { App } from '../app/App';
import { QUALITY } from '../render/Quality';
import type { Body } from '../universe/Body';
import type { Galaxy } from '../universe/Galaxies';
import { droppedFrames, encode, estimateHz, median, onePercentLow, type BenchResult, type SceneResult } from './benchCode';
import { LAYERS, PERF, type FrameSample } from './Perf';

/**
 * Benchmark mode: a fixed route of scenes, each set up from scratch (no flight between them, so
 * every run sees the same views), given a few seconds to settle (streaming, shader compiles), then
 * held for `hold` seconds while every frame is recorded. Works on a desktop and in a headset (the
 * camera dolly is placed; the head pose stays the player's).
 *
 * Start: the title screen's "Run benchmark", the VR menu (Settings), or ?bench=1 (?benchhold=s for a
 * shorter hold, used by the tests). The result: a panel and a short code (benchCode.ts).
 */

export interface Scene {
  id: string;
  label: string;
  /** put the explorer there (the clock is paused before unless `live`) */
  setup(app: App): void;
  /** the clock runs during this scene */
  live?: boolean;
  /** undo anything special when leaving */
  leave?(app: App): void;
}

const GOD_SAVE = 'space-explorer-god-universe';
/** the sandbox was already running when the benchmark started (then it is left alone) */
let godBefore = false;

function body(app: App, id: number): Body {
  return app.system.byId.get(id)!;
}

/** direction from `a` to `b` (unit) */
function dirTo(a: { upos: App['rig']['upos'] }, b: { upos: App['rig']['upos'] }): Vector3 {
  const d = b.upos.sub(a.upos, new Vector3());
  return d.lengthSq() > 0 ? d.normalize() : d.set(1, 0, 0);
}

export const SCENES: Scene[] = [
  {
    id: 'orbit', label: 'Earth from orbit',
    setup: (app) => { const e = body(app, 399); app.select(e); app.placeNear(e, 3 * e.radius, 35, 12); },
  },
  {
    id: 'surface', label: "Earth's surface",
    setup: (app) => {
      const e = body(app, 399);
      app.select(e);
      // a sunlit spot (mid-morning), 1.5 km up, looking along the ground towards the horizon
      const sun = dirTo(e, app.system.sun);
      const north = new Vector3(0, 0, 1);
      const east = new Vector3().crossVectors(north, sun).normalize();
      const up = sun.clone().multiplyScalar(0.8).addScaledVector(east, -0.45).addScaledVector(north, 0.35).normalize();
      app.placeNear(e, 3 * e.radius);
      app.rig.upos.copy(e.upos).addVec(up, e.radius + 1500);
      const side = new Vector3().crossVectors(up, north).normalize();
      app.rig.lookAt(side.addScaledVector(up, -0.12).normalize(), up);
    },
  },
  {
    id: 'rings', label: "Saturn's rings, inside",
    setup: (app) => {
      const sat = body(app, 699);
      const spot = app.findByName("Saturn's rings");
      app.placeNear(sat, 4 * sat.radius);
      if (!spot) return;
      app.select(spot);
      const pole = new Vector3().setFromMatrixColumn(sat.orientation, 2).normalize();
      const off = spot.upos.sub(sat.upos, new Vector3());
      if (off.dot(pole) < 0) pole.negate();
      app.rig.upos.copy(spot.upos).addVec(pole, -35);
      const outward = off.normalize();
      const along = pole.clone().cross(outward).normalize();
      app.rig.lookAt(along.addScaledVector(pole, 0.02).normalize(), pole);
    },
  },
  {
    id: 'jupiter', label: 'Jupiter close',
    setup: (app) => { const j = body(app, 599); app.select(j); app.placeNear(j, 1.6 * j.radius, 30, 10); },
  },
  {
    id: 'orion', label: 'Orion Nebula, inside',
    setup: (app) => {
      const o = app.findByName('Orion Nebula') as (ReturnType<App['findByName']> & { insideDir?(f: Vector3): Vector3 }) | null;
      if (!o) return;
      app.select(o);
      app.rig.setAnchor(null);
      const from = app.rig.upos.sub(o.upos, new Vector3());
      const v = o.insideDir ? o.insideDir(from) : from.normalize();
      app.rig.upos.copy(o.upos).addVec(v, o.radius * 0.4);
      app.rig.lookAt(v.clone().negate());
    },
  },
  {
    id: 'cygx1', label: 'Cygnus X-1 at 30 rs',
    setup: (app) => {
      const h = app.blackHoles.find((b) => b.name === 'Cygnus X-1');
      if (!h) return;
      app.select(h);
      app.rig.setAnchor(null);
      const dir = h.approachDir(app.rig.upos.sub(h.upos, new Vector3()));
      app.rig.upos.copy(h.upos).addVec(dir, 30 * h.radius);
      app.rig.lookAt(dir.clone().negate(), h.diskNormal);
    },
  },
  {
    id: 'm31', label: 'Inside Andromeda',
    setup: (app) => {
      const g = app.findByName('Andromeda Galaxy') as Galaxy | null;
      if (!g) return;
      app.select(g);
      app.rig.setAnchor(null);
      // in the disc, a quarter of the way out, looking across the centre
      const v = g.normal.clone().multiplyScalar(0.05).addScaledVector(g.major, 1).normalize();
      app.rig.upos.copy(g.upos).addVec(v, g.radius * 0.25);
      app.rig.lookAt(v.clone().negate(), g.normal);
    },
  },
  {
    id: 'mw', label: 'Milky Way from outside',
    setup: (app) => {
      const mw = app.milkyWay;
      app.select(mw);
      app.rig.setAnchor(null);
      const dir = mw.viewDir();
      app.rig.upos.copy(mw.upos).addVec(dir, mw.radius * 2.4);
      app.rig.lookAt(dir.clone().negate());
    },
  },
  {
    id: 'god', label: 'God mode, N-body running', live: true,
    setup: (app) => {
      const sun = app.system.sun;
      app.select(sun);
      app.placeNear(sun, 4.5e11, 30, 35);
      app.clock.rate = 86400 * 2;
      app.god.setSimulation(true);
    },
    leave: (app) => { if (!godBefore) app.god.reset(); },
  },
  {
    id: 'cockpit', label: 'Ship cockpit in flight', live: true,
    setup: (app) => {
      const e = body(app, 399);
      app.select(e);
      app.placeNear(e, 1.15 * e.radius, 60, 8);
      app.clock.rate = 1;
      app.game.setMode('cockpit');
    },
    leave: (app) => app.game.setMode('off'),
  },
];

export interface BenchProgress {
  index: number;
  total: number;
  scene: Scene;
  phase: 'settle' | 'hold';
  /** seconds left in this phase */
  left: number;
}

export class Bench {
  running = false;
  hold = 8;
  settle = 2.5;
  last: { result: BenchResult; code: string } | null = null;
  onProgress: (p: BenchProgress) => void = () => undefined;
  onDone: (r: { result: BenchResult; code: string }) => void = () => undefined;

  private idx = 0;
  private phase: 'settle' | 'hold' = 'settle';
  private phaseStart = 0;
  private dts: number[] = [];
  private frames: FrameSample[] = [];
  private maxQ = 0;
  private results: SceneResult[] = [];
  /** each finished scene's frame times (drops are counted at the end, against the refresh rate) */
  private sceneDts: number[][] = [];
  private saved: (() => void) | null = null;
  private listener = (s: FrameSample) => this.frame(s);

  constructor(private app: App) {
    const q = new URLSearchParams(location.search);
    const h = Number(q.get('benchhold'));
    if (h > 0) { this.hold = h; this.settle = Math.min(this.settle, h / 2); }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.results = [];
    this.sceneDts = [];
    this.idx = 0;
    this.saved = this.snapshot();
    this.enter(performance.now());
    PERF.listeners.add(this.listener);
  }

  cancel(): void {
    if (!this.running) return;
    this.finish(false);
  }

  /** What the run changes, to put back afterwards. */
  private snapshot(): () => void {
    const app = this.app, c = app.clock;
    const paused = c.paused, rate = c.rate, jd = c.jdTdb;
    const upos = app.rig.upos.clone(), quat = app.rig.quat.clone(), sel = app.selection, anchor = app.rig.anchor;
    const godActive = godBefore = app.god.active;
    let godSave: string | null = null;
    try { godSave = localStorage.getItem(GOD_SAVE); } catch { /* no storage */ }
    const gameMode = app.game.mode;
    return () => {
      if (!godActive && app.god.active) app.god.reset();
      try { if (godSave === null) localStorage.removeItem(GOD_SAVE); else localStorage.setItem(GOD_SAVE, godSave); } catch { /* no storage */ }
      if (app.game.mode !== gameMode) app.game.setMode(gameMode);
      c.jdTdb = jd; c.rate = rate; c.paused = paused;
      app.system.update(jd);
      app.rig.stop();
      app.rig.upos.copy(upos);
      app.rig.quat.copy(quat);
      app.rig.setAnchor(anchor);
      app.select(sel);
    };
  }

  private enter(now: number): void {
    const app = this.app, sc = SCENES[this.idx];
    app.rig.stop();
    app.clock.paused = !sc.live;
    try { sc.setup(app); } catch (e) { console.warn(`benchmark scene ${sc.id}:`, e); }
    this.phase = 'settle';
    this.phaseStart = now;
    this.dts = [];
    this.frames = [];
    this.maxQ = QUALITY.level;
  }

  private frame(s: FrameSample): void {
    if (!this.running) return;
    const sc = SCENES[this.idx];
    const span = this.phase === 'settle' ? this.settle : this.hold;
    const el = (s.t - this.phaseStart) / 1000;
    if (this.phase === 'hold') {
      // (the first frame of the hold carries the gap since the last settle frame: still a real frame)
      if (s.dt > 0) this.dts.push(s.dt);
      this.frames.push(s);
      this.maxQ = Math.max(this.maxQ, QUALITY.level);
    }
    this.onProgress({ index: this.idx, total: SCENES.length, scene: sc, phase: this.phase, left: Math.max(0, span - el) });
    if (el < span) return;
    if (this.phase === 'settle') { this.phase = 'hold'; this.phaseStart = s.t; return; }
    this.results.push(this.summarize(sc));
    this.sceneDts.push(this.dts);
    try { sc.leave?.(this.app); } catch (e) { console.warn(e); }
    if (++this.idx >= SCENES.length) { this.finish(true); return; }
    this.enter(s.t);
  }

  private summarize(sc: Scene): SceneResult {
    const f = this.frames;
    const lapMed = LAYERS.map((k) => [k, median(f.map((x) => x.laps[k] ?? 0))] as [string, number]);
    lapMed.sort((a, b) => b[1] - a[1]);
    const gpus = f.map((x) => x.gpu).filter((g) => g >= 0);
    const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    const q = this.maxQ !== QUALITY.level ? `${QUALITY.level}-${this.maxQ}` : String(QUALITY.level);
    return {
      id: sc.id,
      n: this.dts.length,
      med: median(this.dts),
      low: onePercentLow(this.dts),
      drop: 0,
      dc: median(f.map((x) => x.calls)),
      tri: median(f.map((x) => x.tris)) / 1000,
      gpu: gpus.length ? median(gpus) : -1,
      cpu: median(f.map((x) => x.cpu)),
      heap: mem ? mem.usedJSHeapSize / 1048576 : -1,
      q,
      top: lapMed.slice(0, 4),
    };
  }

  private xrSession(): (XRSession & { frameRate?: number }) | null {
    return this.app.renderer.gl.xr.isPresenting ? this.app.renderer.gl.xr.getSession() as XRSession & { frameRate?: number } : null;
  }

  /** the headset session's frame rate, else estimated from the run's fastest frames */
  private refreshHz(): number {
    const fr = this.xrSession()?.frameRate;
    return fr && fr > 0 ? Math.round(fr) : estimateHz(this.sceneDts.flat());
  }

  private finish(done: boolean): void {
    PERF.listeners.delete(this.listener);
    this.running = false;
    try { SCENES[this.idx]?.leave?.(this.app); } catch { /* */ }
    this.saved?.();
    this.saved = null;
    if (!done) { this.onProgress({ index: -1, total: SCENES.length, scene: SCENES[0], phase: 'settle', left: 0 }); return; }
    const result = this.makeResult();
    void encode(result).then((code) => {
      this.last = { result, code };
      try { localStorage.setItem('space-explorer-bench', JSON.stringify({ code, at: result.at })); } catch { /* */ }
      console.info(`benchmark code: ${code}`);
      this.onDone(this.last);
    });
  }

  private makeResult(): BenchResult {
    const gl = this.app.renderer.gl;
    const ctx = gl.getContext();
    let glName = '';
    try {
      const dbg = ctx.getExtension('WEBGL_debug_renderer_info');
      glName = String(ctx.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : ctx.RENDERER));
    } catch { glName = '?'; }
    let xr: [number, number] | 0 = 0;
    if (gl.xr.isPresenting) {
      const layer = gl.xr.getBaseLayer() as (XRWebGLLayer & XRProjectionLayer) | null;
      // per eye: a projection layer has one texture per eye; a WebGL layer has both side by side
      if (layer?.textureWidth) xr = [layer.textureWidth, layer.textureHeight];
      else if (layer?.framebufferWidth) xr = [Math.round(layer.framebufferWidth / 2), layer.framebufferHeight];
    }
    const cv = gl.domElement;
    const hz = this.refreshHz();
    return {
      v: 1,
      at: new Date().toISOString().slice(0, 16),
      ua: navigator.userAgent.replace(/Mozilla\/5\.0 /, '').replace(/ ?\(KHTML, like Gecko\)/, ''),
      gl: glName.slice(0, 120),
      xr,
      px: [cv.width, cv.height],
      hz,
      gq: PERF.gpuAvailable ? 1 : 0,
      hold: this.hold,
      s: this.results.map((r, i) => ({ ...r, drop: droppedFrames(this.sceneDts[i], 1000 / hz) })),
    };
  }
}
