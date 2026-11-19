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

/**
 * Drives an `NBody` towards the goal it is given, cutting the way into snapshots `every` seconds
 * of simulated time apart (one per displayed frame or so). Used by the worker and, where workers
 * are unavailable, on the main thread within a per-frame budget.
 */
export class SimRunner {
  readonly sim = new NBody();
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
