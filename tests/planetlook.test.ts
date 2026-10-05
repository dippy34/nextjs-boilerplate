import { describe, expect, it } from 'vitest';
import { planetLook } from '../src/render/PlanetLook';

const lum = (c: [number, number, number]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

describe('planet looks', () => {
  it('grades keep the luminance (the albedo stays as measured)', () => {
    for (const n of ['Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Venus', 'Titan', 'Ceres']) {
      expect(lum(planetLook(n).grade)).toBeCloseTo(1, 6);
    }
  });
  it('turns the maps towards the photographs', () => {
    // Viking's pinkish-grey Mars map mean (linear) becomes butterscotch: red well above blue
    const m = planetLook('Mars');
    const mars = [0.196, 0.12, 0.116].map((v, i) => v * m.grade[i]);
    expect(mars[0] / mars[2]).toBeGreaterThan(4);
    // Neptune bluer than its map
    const n = planetLook('Neptune').grade;
    expect(n[2] / n[0]).toBeGreaterThan(2);
    // giants get a limb haze and limb darkening; Earth aurorae
    expect(planetLook('Jupiter').minnaert).toBeGreaterThan(1);
    expect(planetLook('Neptune').haze[2]).toBeGreaterThan(0);
    expect(planetLook('Earth').aurora).toBeGreaterThan(0);
  });
  it('leaves other bodies alone', () => {
    const c = planetLook('Ceres');
    expect(c.grade).toEqual([1, 1, 1]);
    expect(c.sat).toBe(1);
    expect(c.haze).toEqual([0, 0, 0]);
    expect(c.minnaert).toBe(1);
  });
});
