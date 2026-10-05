import { NBody, type PState, type SimEvent } from './NBody';

/** Messages to the simulation (worker or inline). */
export type SimRequest =
  | { type: 'state'; gen: number; t: number; massive: PState[]; tests: PState[] }
  | { type: 'goal'; gen: number; goal: number; every: number };

/** A state of the sandbox at time t (positions and velocities interleaved: x y z vx vy vz). */
export interface Snapshot {
  type: 'snap';
  gen: number;
  t: number;
  ids: Int32Array;
  gm: Float64Array;
  r: Float64Array;
  xv: Float64Array;
  tids: Int32Array;
  txv: Float64Array;
  events: SimEvent[];
  /** massive steps taken since the last snapshot (statistics) */
  steps: number;
}

/** What will happen: the first collisions, swallows and tidal break-ups ahead of an edited state. */
export interface Forecast {
  type: 'forecast';
  gen: number;
  /** the state's time, and how far the look-ahead got (s) */
  t0: number;
  tEnd: number;
  /** the first events (empty: nothing happens before tEnd) */
  events: SimEvent[];
}

/** how far ahead the forecast looks (s of simulated time) and how much work it may cost (ms) */
export const FORECAST_HORIZON = 3 * 365.25 * 86400;
export const FORECAST_BUDGET_MS = 6000;

/**
 * Runs a copy of the massive bodies ahead of the display (in the worker's spare time) to find
 * the first event after an edit, so God mode can say "the Moon hits the Earth in 4 h" and
 * time-lapse to it.
 */
export class Forecaster {
  readonly sim = new NBody();
  gen = -1;
  t0 = 0;
  active = false;
  private cpu = 0;

  start(gen: number, t: number, massive: PState[]): void {
    this.gen = gen;
    this.t0 = t;
    this.cpu = 0;
    this.sim.setState(t, massive, []);
    this.sim.events = [];
    this.active = massive.length > 1;
  }

  /** Work for up to `ms`; returns the forecast once it is known. */
  pump(ms: number): Forecast | null {
    if (!this.active) return null;
    const a = performance.now();
    const reached = this.sim.advance(this.t0 + FORECAST_HORIZON, ms);
    this.cpu += performance.now() - a;
    const ev = this.sim.events;
    if (!ev.length && !reached && this.cpu < FORECAST_BUDGET_MS) return null;
    this.active = false;
    // the first event and whatever follows it within a day (a cascade)
    const first = ev.length ? ev[0].t : 0;
    return { type: 'forecast', gen: this.gen, t0: this.t0, tEnd: this.sim.t, events: ev.filter((e) => e.t - first < 86400).slice(0, 6) };
  }
}

/**
 * Drives an `NBody` towards the goal it is given, cutting the way into snapshots `every` seconds
 * of simulated time apart (one per displayed frame or so). Used by the worker and, where workers
 * are unavailable, on the main thread within a per-frame budget.
 */
export class SimRunner {
  readonly sim = new NBody();
  readonly ahead = new Forecaster();
  gen = -1;
  goal = 0;
  every = 1;
  private lastSteps = 0;

  handle(m: SimRequest): void {
    if (m.type === 'state') {
      this.gen = m.gen;
      this.sim.setState(m.t, m.massive, m.tests);
      this.sim.events = [];
      this.goal = m.t;
      this.ahead.start(m.gen, m.t, m.massive);
    } else if (m.gen === this.gen) {
      this.goal = m.goal;
      this.every = Math.max(1e-3, Math.abs(m.every));
    }
  }

  get done(): boolean { return this.gen < 0 || this.sim.t === this.goal; }

  /** Work for up to `budgetMs`; returns the snapshots reached. */
  pump(budgetMs: number): Snapshot[] {
    const out: Snapshot[] = [];
    if (this.gen < 0) return out;
    const t0 = performance.now();
    while (this.sim.t !== this.goal) {
      const dir = Math.sign(this.goal - this.sim.t);
      const next = Math.abs(this.goal - this.sim.t) <= this.every * 1.0001 ? this.goal : this.sim.t + dir * this.every;
      const left = budgetMs - (performance.now() - t0);
      if (left <= 0) break;
      const reached = this.sim.advance(next, left);
      if (reached || this.sim.events.length) out.push(this.snapshot());
      if (!reached) break;
    }
    return out;
  }

  snapshot(): Snapshot {
    const s = this.sim;
    const n = s.n, m = s.nTest;
    const xv = new Float64Array(n * 6), txv = new Float64Array(m * 6);
    for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) { xv[i * 6 + c] = s.mass.x[i * 3 + c]; xv[i * 6 + 3 + c] = s.mass.v[i * 3 + c]; }
    for (let i = 0; i < m; i++) for (let c = 0; c < 3; c++) { txv[i * 6 + c] = s.test.x[i * 3 + c]; txv[i * 6 + 3 + c] = s.test.v[i * 3 + c]; }
    const snap: Snapshot = {
      type: 'snap', gen: this.gen, t: s.t, ids: s.ids.slice(), gm: s.gm.slice(), r: s.r.slice(), xv, tids: s.tids.slice(), txv,
      events: s.events, steps: s.mass.steps - this.lastSteps,
    };
    this.lastSteps = s.mass.steps;
    s.events = [];
    return snap;
  }
}
