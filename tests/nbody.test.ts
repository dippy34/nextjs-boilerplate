import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { AU, DAY } from '../src/core/units';
import { FLAG_BLACK_HOLE, NBody, type PState } from '../src/god/NBody';
import { bodiesFromParticles, solarInitialState } from '../src/god/initial';
import { SolarSystem } from '../src/universe/SolarSystem';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUB = join(ROOT, 'public');
globalThis.fetch = (async (input: string | URL) => new Response(readFileSync(join(PUB, String(input).replace(/^\//, ''))))) as typeof fetch;

const GM_SUN = 1.32712440041e20;
const p = (id: number, gm: number, r: number, x: number[], v: number[], flags = 0): PState =>
  ({ id, gm, r, flags, x: x[0], y: x[1], z: x[2], vx: v[0], vy: v[1], vz: v[2] });

describe('N-body sandbox vs DE442S', () => {
  let sys: SolarSystem;
  const jd0 = 2461300.5; // 2026-09-20
  beforeAll(async () => {
    sys = await SolarSystem.load('/data');
    await sys.ephemeris.request(jd0);
    await sys.ephemeris.request(jd0 + 366);
  });

  it('the simulated Solar System stays on the ephemeris for a year', () => {
    sys.update(jd0);
    const init = solarInitialState(sys, jd0);
    expect(init.massive.length).toBeGreaterThan(20);
    const sim = new NBody();
    sim.setState(0, init.massive, init.tests);
    const t0 = performance.now();
    sim.advance(365.25 * DAY);
    const ms = performance.now() - t0;
    const st = sim.getState();
    const bodies = new Map<number, { x: number; y: number; z: number; vx: number; vy: number; vz: number }>();
    bodiesFromParticles(new Map(st.massive.map((q) => [q.id, q])), init.riders, jd0 + 365.25, bodies);
    const at = (id: number) => bodies.get(id)!;
    sys.update(jd0 + 365.25);
    const err = (id: number) => { const b = sys.byId.get(id)!; const s = at(id); return Math.hypot(s.x - b.pos.x, s.y - b.pos.y, s.z - b.pos.z); };
    const rows: Record<string, number> = {};
    for (const id of [199, 299, 399, 499, 599, 699, 799, 899, 301, 501, 502, 601, 701]) rows[sys.byId.get(id)!.name] = Math.round(err(id) / 1e3);
    // Earth-Moon distance (what the eye sees) and the Moon around Earth
    const e = at(399), m = at(301), E = sys.byId.get(399)!, M = sys.byId.get(301)!;
    const dSim = Math.hypot(m.x - e.x, m.y - e.y, m.z - e.z), dEph = M.pos.distanceTo(E.pos);
    const moonRel = Math.hypot(m.x - e.x - (M.pos.x - E.pos.x), m.y - e.y - (M.pos.y - E.pos.y), m.z - e.z - (M.pos.z - E.pos.z));
    console.log(`1 yr: ${sim.mass.steps} massive steps, ${sim.test.steps} test steps, ${ms.toFixed(0)} ms; errors (km)`, rows,
      `Earth-Moon distance ${((dSim - dEph) / 1e3).toFixed(1)} km, Moon about Earth ${(moonRel / 1e3).toFixed(1)} km`);
    // no GR, no asteroid masses, no figures: planets within a few hundred km, the Moon within ~100 km
    expect(err(399)).toBeLessThan(200e3);
    expect(err(499)).toBeLessThan(500e3);
    expect(err(599)).toBeLessThan(2000e3);
    expect(err(199)).toBeLessThan(1500e3);
    expect(Math.abs(dSim - dEph)).toBeLessThan(50e3);
    expect(moonRel).toBeLessThan(200e3);
    // every test particle is still somewhere sensible
    for (const q of st.tests) expect(Math.hypot(q.x, q.y, q.z)).toBeLessThan(1e4 * AU);
  }, 120000);
});

describe('N-body invariants', () => {
  const sun = () => p(1, GM_SUN, 7e8, [0, 0, 0], [0, 0, 0]);
  const planet = (id: number, a: number, gm: number, e = 0, inc = 0) => {
    const vp = Math.sqrt((GM_SUN * (1 + e)) / (a * (1 - e)));
    return p(id, gm, 6e6, [a * (1 - e), 0, 0], [0, vp * Math.cos(inc), vp * Math.sin(inc)]);
  };

  it('conserves energy and momentum over 20 years', () => {
    const sim = new NBody();
    sim.collisions = false;
    sim.setState(0, [sun(), planet(2, AU, 3.986e14, 0.0167), planet(3, 5.2 * AU, 1.267e17, 0.048, 0.02), planet(4, 9.5 * AU, 3.79e16, 0.05, 0.04),
      planet(5, 0.39 * AU, 2.2e13, 0.2056, 0.12)]);
    const i0 = sim.invariants();
    sim.advance(20 * 365.25 * DAY);
    const i1 = sim.invariants();
    const pScale = Math.hypot(...[1, 2, 3, 4, 5].map((k) => { const s = sim.getState().massive.find((q) => q.id === k)!; return s.gm * Math.hypot(s.vx, s.vy, s.vz); }));
    expect(Math.abs((i1.energy - i0.energy) / i0.energy)).toBeLessThan(1e-11);
    expect(Math.hypot(i1.px - i0.px, i1.py - i0.py, i1.pz - i0.pz) / pScale).toBeLessThan(1e-12);
  });

  it('running time backwards returns to the start', () => {
    const sim = new NBody();
    sim.collisions = false;
    const start = [sun(), planet(2, AU, 3.986e14, 0.0167), planet(3, 5.2 * AU, 1.267e17, 0.048, 0.02),
      // a moon around planet 2
      p(6, 4.9e12, 1.7e6, [AU * (1 - 0.0167) + 3.844e8, 0, 0], [0, Math.sqrt((GM_SUN * 1.0167) / (AU * (1 - 0.0167))) + 1022, 0])];
    sim.setState(0, start, [p(100, 0, 1e3, [2.7 * AU, 0, 0], [0, 18100, 300])]);
    sim.advance(3 * 365.25 * DAY);
    sim.advance(0);
    const st = sim.getState();
    for (const s of start) {
      const q = st.massive.find((x) => x.id === s.id)!;
      expect(Math.hypot(q.x - s.x, q.y - s.y, q.z - s.z)).toBeLessThan(1e3); // m
    }
    const tp = st.tests[0];
    expect(Math.hypot(tp.x - 2.7 * AU, tp.y, tp.z)).toBeLessThan(1e4);
  });

  it('a merge conserves mass and momentum', () => {
    const sim = new NBody();
    // two planets on a collision course well away from the Sun
    const a = p(10, 4e14, 6.4e6, [0, 0, 0], [3000, 0, 0]);
    const b = p(11, 1e14, 4e6, [2e8, 1e6, 0], [-9000, 0, 500]);
    sim.setState(0, [a, b]);
    const before = sim.invariants();
    sim.advance(2 * DAY);
    expect(sim.n).toBe(1);
    expect(sim.events.some((e) => e.kind === 'merge' && e.survivor === 10 && e.victim === 11)).toBe(true);
    const after = sim.invariants();
    expect(sim.gm[0]).toBeCloseTo(5e14, 0);
    const P = Math.hypot(before.px, before.py, before.pz);
    expect(Math.hypot(after.px - before.px, after.py - before.py, after.pz - before.pz) / P).toBeLessThan(1e-9);
    // volumes add
    expect(sim.r[0]).toBeCloseTo(Math.cbrt(6.4e6 ** 3 + 4e6 ** 3), -2);
  });

  it('a black hole swallows what reaches it, and tides tear an orbiting moon into a ring', () => {
    const sim = new NBody();
    const bh = p(20, 10 * GM_SUN, 1e6, [0, 0, 0], [0, 0, 0], FLAG_BLACK_HOLE);
    const faller = p(21, 4e14, 6.4e6, [1e10, 0, 0], [-2e5, 0, 0]);
    sim.setState(0, [bh, faller]);
    sim.advance(DAY);
    expect(sim.n).toBe(1);
    expect(sim.events.some((e) => (e.kind === 'swallow' || e.kind === 'roche') && e.survivor === 20)).toBe(true);
    // a moon spiralled (placed) just inside a planet's Roche limit, on a circular orbit
    const sim2 = new NBody();
    const gmP = 1.267e17, rM = 1.5e6, gmM = 1e12;
    const roche = 2.44 * rM * Math.cbrt(gmP / gmM);
    const d = roche * 0.95;
    sim2.setState(0, [p(30, gmP, 7e7, [0, 0, 0], [0, 0, 0]), p(31, gmM, rM, [d, 0, 0], [0, Math.sqrt(gmP / d), 0])]);
    sim2.advance(3600);
    const ev = sim2.events.find((e) => e.kind === 'roche');
    expect(ev?.survivor).toBe(30);
    expect(ev?.ringR).toBeGreaterThan(7e7);
    expect(sim2.gm[0]).toBeCloseTo(gmP + gmM, -3);
  });
});
