import { describe, expect, it } from 'vitest';
import { BlackHole, clockRate, dread, shadowAngle, tidalStretch } from '../src/universe/BlackHoles';

const deg = (a: number) => (a * 180) / Math.PI;
const sgrA = new BlackHole(0, { name: 'Sagittarius A*', aliases: [], kind: 'supermassive', raDeg: 266.4, decDeg: -29, distPc: 8277, massSun: 4.297e6, ref: '' });

describe('black hole sizes', () => {
  it('Schwarzschild radius of Sgr A* is about 12.7 million km', () => {
    expect(sgrA.radius / 1e9).toBeCloseTo(12.69, 1);
  });
  it('shadow angular radius at given distances', () => {
    // far away: b_c / D = 2.598 rs / D
    expect(shadowAngle(1e4)).toBeCloseTo(2.598e-4, 6);
    expect(deg(shadowAngle(30))).toBeCloseTo(4.88, 1);
    expect(deg(shadowAngle(10))).toBeCloseTo(14.27, 1);
    // at 3 rs the shadow is 90 degrees across
    expect(deg(shadowAngle(3))).toBeCloseTo(45, 0);
    // at the photon sphere it is exactly half the sky, more inside it
    expect(deg(shadowAngle(1.5))).toBeCloseTo(90, 3);
    expect(deg(shadowAngle(1.1))).toBeGreaterThan(120);
    expect(deg(shadowAngle(1))).toBeCloseTo(180, 3);
  });
  it("Sgr A*'s shadow from Earth is about 50 microarcseconds across", () => {
    const D = 8277 * 3.0857e16;
    const uas = (2 * shadowAngle(D / sgrA.radius) * 180 * 3600e6) / Math.PI;
    expect(uas).toBeGreaterThan(45);
    expect(uas).toBeLessThan(60);
  });
  it('the accretion disk of a supermassive hole spans the sky from close in', () => {
    // disk outer edge 600 rs seen from 10 rs: nearly a full hemisphere of disk
    expect(sgrA.diskOuter / sgrA.radius).toBeCloseTo(600, 0);
    expect(deg(Math.atan(sgrA.diskOuter / (10 * sgrA.radius)))).toBeGreaterThan(89);
  });
  it('clock rate and tides', () => {
    expect(clockRate(1e9)).toBeCloseTo(1, 6);
    expect(clockRate(3)).toBeCloseTo(0.8165, 3);
    expect(clockRate(1.01)).toBeLessThan(0.1);
    expect(clockRate(0.5)).toBe(0);
    // a 10-solar-mass hole at 1000 km stretches a 2 m body by ~5,300 m/s^2; Sgr A* at its horizon only ~1e-3
    expect(tidalStretch(10, 1e6, 2)).toBeCloseTo(5309, -2);
    expect(tidalStretch(4.297e6, sgrA.radius, 2)).toBeLessThan(2e-3);
  });
  it('dread grows towards the horizon', () => {
    expect(dread(1e4)).toBeLessThan(0.02);
    expect(dread(30)).toBeLessThan(dread(10));
    expect(dread(3)).toBeGreaterThan(0.45);
    expect(dread(1)).toBe(1);
  });
});
