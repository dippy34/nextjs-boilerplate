/**
 * God mode's simple verbs and the one-line physics captions that explain what each did
 * ("2× mass → the Moon's month is 29% shorter"). Pure functions of plain numbers, so they are
 * tested without a scene (src/god/verbs.test.ts); src/god/God.ts applies them to the sandbox.
 */

export type Verb = 'heavier' | 'lighter' | 'bigger' | 'smaller' | 'push' | 'reverse' | 'delete' | 'create';
export type PushDir = 'forward' | 'back' | 'out' | 'in' | 'up' | 'down';

/** Mass and radius steps of the big buttons. */
export const MASS_STEP = 2;
export const SIZE_STEP = 2;
/** A push adds this fraction of the local circular speed. */
export const PUSH_FRACTION = 0.2;

type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.sqrt(dot(a, a));
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

const AU = 1.495978707e11;
const YEAR = 365.25 * 86400;

/** "29% shorter", "41% longer", "about the same" for a ratio new/old of a duration. */
export function changeWord(ratio: number, longer = 'longer', shorter = 'shorter'): string {
  if (!Number.isFinite(ratio)) return 'gone';
  const pct = Math.round(Math.abs(ratio - 1) * 100);
  if (pct < 1) return 'about the same';
  if (ratio >= 2) return `${fmtK(ratio)}× ${longer}`;
  return `${pct}% ${ratio > 1 ? longer : shorter}`;
}

/** "2", "1.5", "0.25" */
export function fmtK(k: number): string {
  if (k >= 100) return Number(k.toPrecision(3)).toLocaleString('en-US');
  return String(Number(k.toPrecision(k >= 10 ? 3 : 2)));
}

/** "×2", "½", "¼", "⅛" for a factor. */
export function factor(k: number): string {
  const frac: [number, string][] = [[1 / 2, '½'], [1 / 4, '¼'], [1 / 8, '⅛'], [1 / 3, '⅓']];
  for (const [v, s] of frac) if (Math.abs(k - v) < 1e-9) return s;
  if (k < 1) return `1/${fmtK(1 / k)}`;
  return `${fmtK(k)}×`;
}

export function fmtDuration(s: number): string {
  if (!Number.isFinite(s)) return '∞';
  const d = s / 86400;
  if (d >= 2 * 365.25) return `${fmtK(s / YEAR)} years`;
  if (d >= 2) return `${fmtK(d)} days`;
  return `${fmtK(s / 3600)} hours`;
}

export function fmtDist(m: number): string {
  if (m >= 0.01 * AU) return `${fmtK(m / AU)} AU`;
  return `${Math.round(m / 1e3).toLocaleString('en-US')} km`;
}

/** What the caption needs to know about the edited body. */
export interface CaptionCtx {
  name: string;
  kind: 'star' | 'planet' | 'moon' | 'hole' | 'other';
  /** G·M of the body (m³/s²) */
  gm: number;
  /** G·M of what it orbits, and its name (none: free) */
  parentGm?: number;
  parentName?: string;
  /** its satellites, biggest first */
  satellites?: string[];
}

/** Mass ×k: what changes for its satellites (Kepler III), or for its own surface. */
export function massCaption(c: CaptionCtx, k: number): string {
  const head = `${factor(k)} mass`;
  if (c.kind === 'hole') return `${head} → its event horizon is ${factor(k)} as wide (r = 2GM/c²) and it pulls ${factor(k)} as hard`;
  const sats = c.satellites ?? [];
  // P ∝ 1/√(M + m): the satellites go round faster about a heavier body
  const satRatio = 1 / Math.sqrt(k);
  if (sats.length) {
    const who = c.kind === 'star' ? (sats.length > 1 ? 'its planets\' years are' : `${sats[0]}'s year is`)
      : sats.length > 1 ? `${sats[0]} and its other moons go round faster: the month is` : `${sats[0]}'s month is`;
    return `${head} → ${who} ${changeWord(satRatio)} (Kepler III: P ∝ 1/√M)`;
  }
  // its own orbit: P ∝ 1/√(M_parent + m)
  if (c.parentGm) {
    const own = Math.sqrt((c.parentGm + c.gm) / (c.parentGm + k * c.gm));
    const heavier = c.parentGm / Math.max(c.gm, 1e-30);
    if (Math.abs(own - 1) >= 0.01) return `${head} → its own year is ${changeWord(own)}: it now tugs ${c.parentName} round too`;
    return `${head} → surface gravity ${factor(k)} (g = GM/R²); its year barely changes: ${c.parentName} is ${fmtK(heavier)}× heavier`;
  }
  return `${head} → surface gravity ${factor(k)} (g = GM/R²), and it pulls everything nearby ${factor(k)} as hard`;
}

/** Radius ×k, mass kept. */
export function sizeCaption(c: CaptionCtx, k: number): string {
  if (c.kind === 'hole') return 'A black hole\'s size is set by its mass: make it heavier instead';
  return `${factor(k)} radius, same mass → surface gravity ${factor(1 / (k * k))}, density ${factor(1 / (k * k * k))}. Orbits don't change: outside, only the mass counts`;
}

/** Orbit shape from a relative state (vis-viva). */
export function orbitOf(r: V3, v: V3, mu: number): { bound: boolean; a: number; e: number; period: number; apo: number; peri: number; vEsc: number } {
  const rn = len(r), vn = len(v);
  const energy = (vn * vn) / 2 - mu / rn;
  const vEsc = Math.sqrt((2 * mu) / rn);
  const h = len(cross(r, v));
  if (energy >= 0) return { bound: false, a: Infinity, e: 1, period: Infinity, apo: Infinity, peri: (h * h) / mu / 2, vEsc };
  const a = -mu / (2 * energy);
  const e = Math.sqrt(Math.max(0, 1 - (h * h) / (mu * a)));
  return { bound: true, a, e, period: 2 * Math.PI * Math.sqrt(a ** 3 / mu), apo: a * (1 + e), peri: a * (1 - e), vEsc };
}

/** A push: velocity v0 → v1 relative to the parent at r. */
export function pushCaption(c: CaptionCtx, r: V3, v0: V3, v1: V3, dirWord: string): string {
  const mu = (c.parentGm ?? 0) + c.gm;
  if (!c.parentGm || mu <= 0) return `Pushed ${dirWord}: it drifts off in a straight line (nothing pulls it)`;
  const o0 = orbitOf(r, v0, mu), o1 = orbitOf(r, v1, mu);
  const sp = (x: number) => `${fmtK(x / 1e3)} km/s`;
  if (!o1.bound) return `Pushed ${dirWord} to ${sp(len(v1))}, past escape speed ${sp(o1.vEsc)} → it leaves ${c.parentName} forever`;
  if (o1.peri < 0.1 * len(r) && o1.e > 0.9) return `Pushed ${dirWord} → it now falls almost straight at ${c.parentName}`;
  const year = c.kind === 'moon' ? 'month' : 'year';
  const per = o0.bound ? `its ${year} is ${changeWord(o1.period / o0.period)}` : `its ${year} is now ${fmtDuration(o1.period)}`;
  const shape = o1.apo > (o0.bound ? o0.apo : 0) * 1.01 ? `swings out to ${fmtDist(o1.apo)}` : `dips in to ${fmtDist(o1.peri)}`;
  return `Pushed ${dirWord} → the orbit stretches: it ${shape}, and ${per}`;
}

export function reverseCaption(c: CaptionCtx): string {
  return `Same speed, opposite way → ${c.name} now goes round ${c.parentName ?? 'its centre'} backwards (retrograde). Same size orbit, same ${c.kind === 'moon' ? 'month' : 'year'}`;
}

export function deleteCaption(c: CaptionCtx): string {
  const sats = c.satellites ?? [];
  if (!sats.length) return `${c.name} is gone`;
  if (c.kind === 'star' && !c.parentName) return `${c.name} is gone → nothing holds its planets: they fly off in straight lines`;
  const who = sats.length > 1 ? `${sats[0]} and ${sats.length - 1} other${sats.length > 2 ? 's' : ''}` : sats[0];
  return `${c.name} is gone → ${who} now ${sats.length > 1 ? 'orbit' : 'orbits'} ${c.parentName ?? 'nothing: off in a straight line'}`;
}

export function createCaption(label: string, near: string, dist: number): string {
  const what = label.toLowerCase();
  if (what.includes('black hole')) return `A ${what} ${fmtDist(dist)} from ${near} → watch it pull orbits apart (gravity is on)`;
  if (what.includes('star')) return `A new ${what} ${fmtDist(dist)} from ${near}: two suns now pull on everything`;
  return `A new ${what} on a circular orbit ${fmtDist(dist)} from ${near}`;
}

/** Push direction in the frame of the orbit: forward = along the motion, out = away from the parent, up = orbit normal. */
export function pushVector(dir: PushDir, r: V3, v: V3): V3 {
  const n = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const neg = (a: V3): V3 => [-a[0], -a[1], -a[2]];
  const h = cross(r, v);
  const fwd = len(v) > 0 ? n(v) : n(cross(len(h) ? h : [0, 0, 1], r));
  const out = n(r), up = len(h) ? n(h) : [0, 0, 1] as V3;
  switch (dir) {
    case 'forward': return fwd;
    case 'back': return neg(fwd);
    case 'out': return out;
    case 'in': return neg(out);
    case 'up': return up;
    case 'down': return neg(up);
  }
}

// ---------------------------------------------------------------- first-time guide

export interface HintStep { id: string; text: string; done: (ev: HintEvent) => boolean }
export interface HintEvent { verb: Verb | 'undo' | 'reset' | 'grab' | 'select'; name?: string; kind?: string }

export const HINT_STEPS: HintStep[] = [
  { id: 'heavier', text: 'Select Earth and press Heavier: watch the Moon speed up', done: (e) => e.verb === 'heavier' },
  { id: 'reverse', text: 'Reverse a planet\'s orbit', done: (e) => e.verb === 'reverse' },
  { id: 'hole', text: 'Drop a black hole into the Solar System', done: (e) => e.verb === 'create' && e.kind === 'hole' },
  { id: 'undo', text: 'Undo, or Reset to get the real Solar System back', done: (e) => e.verb === 'undo' || e.verb === 'reset' },
];

const HINT_KEY = 'space-explorer-god-hints';

/** The "Try:" guide: steps tick off as they are done; skippable; remembered in the browser. */
export class Hints {
  done = new Set<string>();
  skipped = false;
  constructor(private store: Pick<Storage, 'getItem' | 'setItem'> | null = safeStorage()) {
    try {
      const s = this.store?.getItem(HINT_KEY);
      if (s) { const o = JSON.parse(s) as { done?: string[]; skipped?: boolean }; this.done = new Set(o.done ?? []); this.skipped = !!o.skipped; }
    } catch { /* fresh */ }
  }
  get visible(): boolean { return !this.skipped && this.done.size < HINT_STEPS.length; }
  /** the step to show next */
  get next(): HintStep | null { return HINT_STEPS.find((s) => !this.done.has(s.id)) ?? null; }
  /** True when this event completed a step. */
  note(ev: HintEvent): boolean {
    let hit = false;
    for (const s of HINT_STEPS) if (!this.done.has(s.id) && s.done(ev)) { this.done.add(s.id); hit = true; }
    if (hit) this.save();
    return hit;
  }
  skip(): void { this.skipped = true; this.save(); }
  restart(): void { this.done.clear(); this.skipped = false; this.save(); }
  private save(): void {
    try { this.store?.setItem(HINT_KEY, JSON.stringify({ done: [...this.done], skipped: this.skipped })); } catch { /* no storage */ }
  }
}

function safeStorage(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}
