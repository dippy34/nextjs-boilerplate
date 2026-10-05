/**
 * Hitch detector: a lap timer over the main loop's subsystems.
 *
 * App.frame calls `HITCH.begin()` first, `HITCH.lap('name')` after each subsystem and
 * `HITCH.end(programs, textures)` last. When the gap between two frames is more than `factor`
 * times the budget (the session's refresh in a headset, 60 Hz on a desktop), the frame that just
 * ran is recorded as a hitch with what each subsystem cost, whether shader programs were compiled
 * or textures created in it, and how much of the gap the JS did not account for (GPU, GC or the
 * browser). Running per-subsystem averages and maxima feed the perf HUD (`summary()`).
 *
 * Nothing here allocates per frame unless a hitch is recorded. `?hitch=log` also logs each hitch
 * to the console (throttled to one a second); `window.app.hitch` exposes the monitor.
 */
export interface HitchRecord {
  /** time of the late frame's start (ms, performance.now) */
  t: number;
  /** gap between the starts of the two frames (ms) */
  frameMs: number;
  budgetMs: number;
  /** main-loop JS of the frame that ran in the gap (ms) */
  jsMs: number;
  /** the subsystems that ran, costliest first: [name, ms] */
  sections: [string, number][];
  /** shader programs compiled / textures created during that frame */
  programs: number;
  textures: number;
  /** names of the shader programs compiled in that frame (material names) */
  compiled: string[];
}

export interface SectionStat { name: string; avg: number; max: number }

const MAX_SECTIONS = 64;

export class HitchMonitor {
  budgetMs = 1000 / 60;
  /** a frame gap above factor × budget is a hitch */
  factor = 2;
  /** log hitches to the console */
  log = false;
  readonly records: HitchRecord[] = [];
  /** how many records are kept */
  keep = 60;
  /** hitches since the start */
  count = 0;
  frames = 0;

  private names: string[] = [];
  private index = new Map<string, number>();
  private cur = new Float64Array(MAX_SECTIONS);
  private avg = new Float64Array(MAX_SECTIONS);
  private max = new Float64Array(MAX_SECTIONS);
  private ran = new Uint8Array(MAX_SECTIONS);
  private frameStart = -1;
  private lastLap = 0;
  private jsMs = 0;
  private lastPrograms = -1;
  private lastTextures = -1;
  private dPrograms = 0;
  private dTextures = 0;
  private lastLog = -Infinity;
  private seenPrograms = new WeakSet<object>();
  private newPrograms: string[] = [];
  /** every program compiled after `markWarm()`, with the frame number (each is a mid-flight compile) */
  readonly lateCompiles: { frame: number; name: string }[] = [];
  private warm = false;
  private listeners: ((r: HitchRecord) => void)[] = [];

  constructor(private readonly now: () => number = () => performance.now()) {}

  /** Start of a frame: judges the gap since the previous frame's start. */
  begin(): void {
    const t = this.now();
    if (this.frameStart >= 0) {
      const gap = t - this.frameStart;
      if (gap > this.factor * this.budgetMs) this.record(t, gap);
    }
    this.frameStart = t;
    this.lastLap = t;
    this.cur.fill(0);
    this.ran.fill(0);
    this.frames++;
  }

  /** The named subsystem just finished (its time is since the previous lap or begin). */
  lap(name: string): void {
    const t = this.now();
    if (this.frameStart < 0) { this.lastLap = t; return; }
    let i = this.index.get(name);
    if (i === undefined) {
      if (this.names.length >= MAX_SECTIONS) { this.lastLap = t; return; }
      i = this.names.length;
      this.names.push(name);
      this.index.set(name, i);
    }
    this.cur[i] += t - this.lastLap;
    this.ran[i] = 1;
    this.lastLap = t;
  }

  /**
   * End of the frame's JS, with the renderer's programs (`renderer.info.programs`, or their count)
   * and its running count of textures.
   */
  end(programs: number | readonly { name?: string }[] = 0, textures = 0): void {
    const t = this.now();
    this.jsMs = t - this.frameStart;
    if (typeof programs !== 'number') programs = this.scanPrograms(programs);
    else this.newPrograms = [];
    this.dPrograms = this.lastPrograms < 0 ? 0 : Math.max(0, programs - this.lastPrograms);
    this.dTextures = this.lastTextures < 0 ? 0 : Math.max(0, textures - this.lastTextures);
    this.lastPrograms = programs;
    this.lastTextures = textures;
    for (let i = 0; i < this.names.length; i++) {
      const v = this.cur[i];
      this.avg[i] += (v - this.avg[i]) * 0.02;
      this.max[i] = Math.max(v, this.max[i] * 0.995);
    }
  }

  /** Warm-up is done: from now on each newly compiled program is a mid-flight compile. */
  markWarm(on = true): void {
    this.warm = on;
  }

  private scanPrograms(list: readonly { name?: string }[]): number {
    if (list.length === this.lastPrograms) { if (this.newPrograms.length) this.newPrograms = []; return list.length; }
    const fresh: string[] = [];
    for (const p of list) {
      if (this.seenPrograms.has(p)) continue;
      this.seenPrograms.add(p);
      if (this.lastPrograms >= 0) fresh.push(p.name || '?');
    }
    this.newPrograms = fresh;
    if (this.warm) for (const name of fresh) this.lateCompiles.push({ frame: this.frames, name });
    return list.length;
  }

  /** Called with each hitch as it is recorded (the perf HUD). */
  onHitch(fn: (r: HitchRecord) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((f) => f !== fn); };
  }

  /** Per-subsystem running average and decaying maximum (ms), costliest average first. */
  summary(): SectionStat[] {
    return this.names.map((name, i) => ({ name, avg: this.avg[i], max: this.max[i] })).sort((a, b) => b.avg - a.avg);
  }

  /** How often each subsystem was the costliest in the recorded hitches, most often first. */
  offenders(): [string, number][] {
    const n = new Map<string, number>();
    for (const r of this.records) {
      const top = r.sections[0]?.[0];
      if (top) n.set(top, (n.get(top) ?? 0) + 1);
    }
    return [...n].sort((a, b) => b[1] - a[1]);
  }

  reset(): void {
    this.records.length = 0;
    this.count = 0;
    this.avg.fill(0);
    this.max.fill(0);
  }

  private record(t: number, gap: number): void {
    const sections: [string, number][] = [];
    let accounted = 0;
    for (let i = 0; i < this.names.length; i++) {
      if (!this.ran[i]) continue;
      sections.push([this.names[i], round(this.cur[i])]);
      accounted += this.cur[i];
    }
    // the part of the gap no lap covers: rendering submission, GPU wait, GC, the browser
    sections.push(['(outside JS)', round(Math.max(0, gap - this.jsMs))]);
    if (this.jsMs - accounted > 0.05) sections.push(['(unlapped JS)', round(this.jsMs - accounted)]);
    sections.sort((a, b) => b[1] - a[1]);
    const r: HitchRecord = { t, frameMs: round(gap), budgetMs: round(this.budgetMs), jsMs: round(this.jsMs), sections, programs: this.dPrograms, textures: this.dTextures, compiled: this.newPrograms };
    this.records.push(r);
    if (this.records.length > this.keep) this.records.shift();
    this.count++;
    for (const fn of this.listeners) fn(r);
    if (this.log && t - this.lastLog > 1000) {
      this.lastLog = t;
      const top = sections.slice(0, 4).map(([n, ms]) => `${n} ${ms}`).join(', ');
      console.warn(`hitch ${r.frameMs} ms (budget ${r.budgetMs}): ${top}${r.programs ? `, compiled ${r.compiled.join(' ') || r.programs}` : ''}${r.textures ? `, ${r.textures} textures created` : ''}`);
    }
  }
}

function round(ms: number): number {
  return Math.round(ms * 100) / 100;
}

/** The app's monitor. */
export const HITCH = new HitchMonitor();
if (typeof location !== 'undefined') HITCH.log = new URLSearchParams(location.search).get('hitch') === 'log';
