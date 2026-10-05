// God mode scenarios: what the user sets up happens, quickly and physically right
// (src/god/Sandbox.ts with the simulation inline, the real Solar System from the ephemeris).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Vector3 } from 'three';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AU, DAY } from '../src/core/units';
import { FLAG_BLACK_HOLE, FLAG_RIGID } from '../src/god/NBody';
import { lapseRate, Sandbox } from '../src/god/Sandbox';
import { SolarSystem } from '../src/universe/SolarSystem';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
globalThis.fetch = (async (input: string | URL) => new Response(readFileSync(join(ROOT, 'public', String(input).replace(/^\//, ''))))) as typeof fetch;

const GM_SUN = 1.32712440041e20;
const C = 299_792_458;
const EARTH = 399, MOON = 301, JUPITER = 599, SUN = 10;
const jd0 = 2461300.5;

type Inner = { inline: { pump(ms: number): unknown[]; ahead: { pump(ms: number): unknown; active: boolean } }; receive(s: unknown): void; receiveForecast(f: unknown): void };

/** Let the inline simulation catch up with what was asked, and finish its forecast. */
function work(sb: Sandbox, maxMs = 20000): void {
  const s = sb as unknown as Inner;
  const t0 = performance.now();
  while (performance.now() - t0 < maxMs) {
    const snaps = s.inline.pump(200);
    for (const q of snaps) s.receive(q);
    const f = s.inline.ahead.pump(200);
    if (f) s.receiveForecast(f);
    if (!snaps.length && !s.inline.ahead.active) break;
  }
}

/** Show `days` of time in frames (the display follows the simulation), returning the effects seen. */
function play(sb: Sandbox, days: number, frames = 120) {
  const rate = (days * DAY) / frames * 60;
  const start = sb.jd;
  const fx = [];
  for (let f = 1; f <= frames; f++) {
    sb.update(start + (days * f) / frames, rate, false, 1 / 60);
    work(sb);
    sb.update(start + (days * f) / frames, rate, false, 0);
    fx.push(...sb.effects);
    sb.effects = [];
  }
  return fx;
}

function finite(sb: Sandbox): boolean {
  for (const e of sb.entities.values()) if (![e.pos.x, e.pos.y, e.pos.z, e.vel.x, e.vel.y, e.vel.z, e.gm].every(Number.isFinite)) return false;
  return true;
}

describe('God mode scenarios', () => {
  let sys: SolarSystem;
  let sb: Sandbox;
  beforeAll(async () => {
    sys = await SolarSystem.load('/data');
    await sys.ephemeris.request(jd0);
    await sys.ephemeris.request(jd0 + 400);
  });
  beforeEach(() => {
    sys.update(jd0);
    sb?.reset();
    sb = new Sandbox(sys, false);
    sb.start(jd0);
  });
  const ent = (id: number) => sb.entityOf(id)!;

  it('a harmless edit keeps exact Kepler orbits', () => {
    sb.setMass(EARTH, ent(EARTH).gm * 1.2);
    expect(sb.mode).toBe('kepler');
    sb.setOrbit(499, { e: 0.12 });
    expect(sb.mode).toBe('kepler');
  });

  it('throw the Moon at the Earth: it switches to gravity, forecasts the impact, and they merge', () => {
    const e = ent(EARTH), m = ent(MOON);
    const gmBoth = e.gm + m.gm;
    const toward = e.pos.clone().sub(m.pos).normalize();
    sb.setVelocity(MOON, e.vel.clone().addScaledVector(toward, 1000));
    expect(sb.mode).toBe('nbody');
    expect(sb.autoNbody).toMatch(/hit/);
    work(sb);
    const f = sb.forecast!;
    expect(f.event?.kind).toBe('merge');
    expect(f.victim).toBe('Moon');
    expect(f.survivor).toBe('Earth');
    const days = f.jd - jd0;
    expect(days).toBeGreaterThan(0.2);
    expect(days).toBeLessThan(4);
    const fx = play(sb, days + 0.05, 60);
    const hit = fx.find((x) => x.event.kind === 'merge');
    expect(hit?.victim?.id).toBe(MOON);
    expect(sb.entityOf(MOON)).toBeNull();
    expect(ent(EARTH).gm).toBeCloseTo(gmBoth, -8);
    expect(Math.abs(hit!.jd - f.jd) * DAY).toBeLessThan(600); // as forecast (to 10 minutes)
    expect(finite(sb)).toBe(true);
  }, 60000);

  it('a Moon put inside the Roche limit is torn into a ring', () => {
    const e = ent(EARTH);
    const at = e.pos.clone().add(new Vector3(2 * 6.371e6, 0, 0));
    const v = e.vel.clone().add(new Vector3(0, Math.sqrt(e.gm / (2 * 6.371e6)), 0));
    sb.setPosition(MOON, at, v);
    expect(sb.mode).toBe('nbody');
    work(sb);
    expect(sb.forecast?.event?.kind).toBe('roche');
    const fx = play(sb, 0.05, 20);
    expect(fx.some((x) => x.event.kind === 'roche' && x.victim?.id === MOON)).toBe(true);
  }, 60000);

  it('drop a black hole next to the Earth: Earth is torn up or swallowed within weeks', () => {
    const e = ent(EARTH);
    const gm = 10 * GM_SUN;
    const at = e.pos.clone().add(new Vector3(0.02 * AU, 0, 0));
    sb.spawn('hole', 'Black hole 1', { type: 'hole', seed: 1 }, gm, (2 * gm) / C ** 2, at, e.vel.clone(), FLAG_BLACK_HOLE | FLAG_RIGID);
    expect(sb.mode).toBe('nbody');
    work(sb);
    const f = sb.forecast!;
    expect(['roche', 'swallow']).toContain(f.event?.kind);
    expect(['Earth', 'Moon']).toContain(f.victim);
    expect(f.jd - jd0).toBeLessThan(30);
    const fx = play(sb, f.jd - jd0 + 0.1, 60);
    expect(fx.some((x) => x.event.kind === 'roche' || x.event.kind === 'swallow')).toBe(true);
    expect(finite(sb)).toBe(true);
  }, 90000);

  it('Jupiter made 1000 times heavier: gravity on, nothing explodes over a year', () => {
    sb.setMass(JUPITER, ent(JUPITER).gm * 1000);
    expect(sb.mode).toBe('nbody');
    play(sb, 365, 40);
    expect(finite(sb)).toBe(true);
    expect(ent(SUN)).toBeTruthy();
    for (const x of sb.entities.values()) if (x.mode === 'massive') expect(x.pos.length()).toBeLessThan(1e4 * AU);
  }, 120000);

  it('a black hole 0.1 AU across in the inner Solar System: stable, swallows and tears', () => {
    const rs = 0.1 * AU, gm = (rs * C * C) / 2;
    const sun = ent(SUN);
    sb.spawn('hole', 'Black hole 1', { type: 'hole', seed: 2 }, gm, rs, sun.pos.clone().add(new Vector3(2 * AU, 0, 0)), sun.vel.clone(), FLAG_BLACK_HOLE | FLAG_RIGID);
    expect(sb.mode).toBe('nbody');
    const t0 = performance.now();
    const fx = play(sb, 120, 40);
    expect(performance.now() - t0).toBeLessThan(90000);
    expect(finite(sb)).toBe(true);
    expect(fx.filter((x) => x.event.kind === 'swallow' || x.event.kind === 'roche').length).toBeGreaterThan(3);
  }, 120000);

  it('the show-me time-lapse arrives in a few seconds and eases in', () => {
    for (const total of [3600, 86400 * 3, 86400 * 365]) {
      let rem = total, t = 0;
      const dt = 1 / 72;
      while (rem > 0 && t < 60) { rem -= lapseRate(rem, total) * dt; t += dt; }
      expect(t).toBeGreaterThan(2);
      expect(t).toBeLessThan(8);
      // the last second covers a small part of the way
      expect(lapseRate(total / 20, total)).toBeLessThan(total / 5);
    }
  });
});
