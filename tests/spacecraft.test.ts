import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { raDecToVector } from '../src/core/frames';
import { Body } from '../src/universe/Body';
import { Galaxy, shapeOf } from '../src/universe/Galaxies';
import { Spacecraft } from '../src/universe/Spacecraft';

const body = (name: string): Body => {
  const b = Object.create(Body.prototype) as Body;
  Object.assign(b, { name, radius: 6.371e6 });
  (b as unknown as { upos: { set: () => void } }).upos = new (class {
    xh = 0; yh = 0; zh = 0; xl = 0; yl = 0; zl = 0;
  })() as never;
  return b;
};

describe('spacecraft', () => {
  it('interpolation passes through the Horizons samples', async () => {
    const { UPos } = await import('../src/core/upos');
    const sun = body('Sun'), earth = body('Earth');
    (sun as unknown as { upos: unknown }).upos = new UPos();
    (earth as unknown as { upos: unknown }).upos = new UPos();
    const km: [number, number, number][] = [[1e9, 0, 0], [1.1e9, 2e7, 0], [1.2e9, 4e7, 1e6], [1.3e9, 6e7, 2e6]];
    const c = new Spacecraft({ name: 'Probe', id: -1, center: 0, size: 3, kind: 'voyager', about: '', jd: [2460000, 2460010, 2460020, 2460030], km }, 'voyager', sun, earth);
    c.update(2460010);
    expect(c.valid).toBe(true);
    expect(c.upos.toVector3().distanceTo(new Vector3(1.1e12, 2e10, 0))).toBeLessThan(1);
    c.update(2460015);
    const mid = c.upos.toVector3();
    expect(mid.x).toBeGreaterThan(1.1e12);
    expect(mid.x).toBeLessThan(1.2e12);
    c.update(2470000);
    expect(c.valid).toBe(false);
  });

  it('an Earth orbiter keeps its radius and comes back after one period', async () => {
    const { UPos } = await import('../src/core/upos');
    const sun = body('Sun'), earth = body('Earth');
    (sun as unknown as { upos: unknown }).upos = new UPos();
    (earth as unknown as { upos: unknown }).upos = new UPos();
    const a = 6793.5, nDegS = (Math.sqrt(398600.4418 / a ** 3) * 180) / Math.PI;
    const c = new Spacecraft({ name: 'ISS', id: -2, size: 109, kind: 'iss', about: '', jd: 2461314.5, e: 0.0004, i: 51.7, node: 30, w: 10, M: 0, a, nDegS }, 'iss', sun, earth);
    c.update(2461314.5);
    const p0 = c.upos.toVector3();
    expect(p0.length() / 1e3).toBeGreaterThan(a * 0.99);
    expect(p0.length() / 1e3).toBeLessThan(a * 1.01);
    const periodDays = 360 / nDegS / 86400;
    c.update(2461314.5 + periodDays);
    // J2 moves the node a little each orbit (~0.35 deg): back within ~100 km
    expect(c.upos.toVector3().distanceTo(p0) / 1e3).toBeLessThan(100);
    expect(c.vel.length() / 1e3).toBeGreaterThan(7.5);
    expect(c.vel.length() / 1e3).toBeLessThan(7.8);
  });
});

describe('galaxies', () => {
  const data = (minArcmin: number) => ({ name: 'Test', simbad: 'T 1', ra: 10.68, dec: 41.27, distPc: 780000, nDist: 3, majArcmin: 190, minArcmin, paDeg: 35, morph: 'SA(s)b', otype: 'G', vmag: 3.4 });

  it('a round galaxy is seen face-on, an elongated one nearly edge-on', () => {
    const los = raDecToVector(10.68, 41.27).normalize();
    const faceOn = new Galaxy(data(190), 0);
    expect(Math.abs(faceOn.normal.dot(los))).toBeGreaterThan(0.99);
    const edgeOn = new Galaxy(data(19), 1);
    expect(Math.abs(edgeOn.normal.dot(los))).toBeLessThan(0.15);
    for (const g of [faceOn, edgeOn]) {
      expect(Math.abs(g.major.dot(g.normal))).toBeLessThan(1e-9);
      expect(Math.abs(g.major.dot(los))).toBeLessThan(1e-9); // the major axis lies on the sky
    }
  });

  it('sizes and types', () => {
    const g = new Galaxy(data(70), 0);
    // 190 arcmin across at 780 kpc: about 43 kpc in diameter
    expect(g.radius / 3.0857e19).toBeGreaterThan(20);
    expect(g.radius / 3.0857e19).toBeLessThan(23);
    expect(shapeOf('SA(s)b', 'G')).toBe('spiral');
    expect(shapeOf('SB(s)m', 'G')).toBe('barred');
    expect(shapeOf('E-E/S0', 'G')).toBe('elliptical');
    expect(shapeOf('dSph', 'G')).toBe('dwarf');
    expect(shapeOf('IBm', 'G')).toBe('irregular');
    expect(shapeOf('S0pec', 'G')).toBe('lenticular');
  });
});
