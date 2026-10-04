import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { AU, DAY, SUN_RADIUS } from '../src/core/units';
import { classify, eqTemp, generatePlanets, massFromRadius, PlanetarySystem } from '../src/universe/Planets';
import { CatalogStar } from '../src/universe/Stars';

const sunLike = (key: string) => new CatalogStar(key, new Vector3(10, 0, 0), 4.83, 5772, 'G2V', [key], null);

describe('planetary systems', () => {
  it('a star always gets the same planets', () => {
    const a = generatePlanets(sunLike('star:test:1:2'));
    const b = generatePlanets(sunLike('star:test:1:2'));
    expect(a.map((p) => [p.name, p.aM, p.radiusM, p.type])).toEqual(b.map((p) => [p.name, p.aM, p.radiusM, p.type]));
  });

  it('most Sun-like stars have planets, and systems differ from star to star', () => {
    let withPlanets = 0;
    const firstOrbits = new Set<number>();
    for (let i = 0; i < 400; i++) {
      const ps = generatePlanets(sunLike(`star:test:${i}:0`));
      if (ps.length) { withPlanets++; firstOrbits.add(Math.round(ps[0].aM / 1e6)); }
    }
    expect(withPlanets / 400).toBeGreaterThan(0.75);
    expect(firstOrbits.size).toBeGreaterThan(200);
  });

  it('orbits widen outwards, periods follow Kepler, planets are flagged as generated', () => {
    for (let i = 0; i < 50; i++) {
      const ps = generatePlanets(sunLike(`star:k:${i}:0`));
      for (let k = 1; k < ps.length; k++) expect(ps[k].aM).toBeGreaterThan(ps[k - 1].aM);
      for (const p of ps) {
        expect(p.real).toBe(false);
        // P^2 / a^3 ~ 4 pi^2 / (G M) for a ~1 solar mass star (1 AU <-> ~1 yr, within the mass estimate)
        const yr = p.periodS / (365.25 * DAY), au = p.aM / AU;
        expect(yr * yr / au ** 3).toBeGreaterThan(0.6);
        expect(yr * yr / au ** 3).toBeLessThan(1.6);
      }
    }
  });

  it('no planets inside a giant star', () => {
    const giant = new CatalogStar('star:giant:0:0', new Vector3(50, 0, 0), -0.5, 4300, 'K1III', ['giant'], null);
    expect(giant.radius).toBeGreaterThan(10 * SUN_RADIUS);
    for (let i = 0; i < 20; i++) {
      const g = new CatalogStar(`star:giant:${i}:0`, new Vector3(50, 0, 0), -0.5, 4300, 'K1III', ['giant'], null);
      for (const p of generatePlanets(g)) expect(p.aM).toBeGreaterThan(g.radius * 4);
    }
  });

  it('surface types follow size and temperature', () => {
    const r = () => 0.5;
    expect(classify(11, 1500, r)).toBe('hotgiant');
    expect(classify(11, 150, r)).toBe('giant');
    expect(classify(4, 300, r)).toBe('icegiant');
    expect(classify(1, 1200, r)).toBe('lava');
    expect(classify(1, 120, r)).toBe('ice');
    // Earth: ~255 K equilibrium temperature at 1 AU from the Sun
    expect(eqTemp(1, AU, 0.3)).toBeGreaterThan(250);
    expect(eqTemp(1, AU, 0.3)).toBeLessThan(260);
    expect(massFromRadius(1)).toBeCloseTo(1, 1);
  });

  it('planets move on closed Kepler orbits around their star', () => {
    const star = sunLike('star:orbit:0:0');
    const sys = new PlanetarySystem(star, [{
      name: 'x b', real: false, est: [], aM: AU, e: 0.3, inc: 0.1, node: 0.4, omega: 1.1, M0: 0.2, periodS: 365.25 * DAY,
      radiusM: 6.4e6, massKg: 6e24, teqK: 255, type: 'terran', albedo: 0.3, rings: false, seed: 1, rotS: 86400,
    }], false, new Vector3(0.2, 0.1, 1));
    const p = sys.planets[0];
    const a = sys.position(p.spec, 2451545, new Vector3());
    const b = sys.position(p.spec, 2451545 + 365.25, new Vector3());
    const c = sys.position(p.spec, 2451545 + 100, new Vector3());
    expect(a.distanceTo(b)).toBeLessThan(1e3);
    expect(a.distanceTo(c)).toBeGreaterThan(0.1 * AU);
    expect(a.length()).toBeGreaterThan(0.69 * AU);
    expect(a.length()).toBeLessThan(1.31 * AU);
    // the orbit lies in the system plane (small inclination)
    expect(Math.abs(c.clone().normalize().dot(sys.n))).toBeLessThan(0.15);
    sys.update(2451545);
    expect(p.upos.sub(star.upos, new Vector3()).distanceTo(a)).toBeLessThan(1e3);
  });
});

describe('generated planet variety', () => {
  it('Sun-like stars get temperate worlds and giants, not only hot rocks', () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 400; i++) for (const p of generatePlanets(sunLike(`star:var:${i}:0`))) counts[p.type] = (counts[p.type] ?? 0) + 1;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const share = (...t: string[]) => t.reduce((a, k) => a + (counts[k] ?? 0), 0) / total;
    expect(share('terran', 'ocean', 'desert')).toBeGreaterThan(0.05);
    expect(share('giant', 'icegiant')).toBeGreaterThan(0.05);
    expect(share('lava', 'hot')).toBeLessThan(0.6);
  });
});
