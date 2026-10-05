import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { embeddedStars } from '../src/render/DeepSkyLayer';
import { TWINKLE, twinkleStrength, updateTwinkle } from '../src/render/StarField';
import { starLook } from '../src/render/StarLook';

describe('twinkling', () => {
  // Earth: Rayleigh optical depth ~0.1 in green, scale height 8.5 km
  const tauE = 0.1, H = 8500;
  it('is full on the ground under Earth-like air and fades with altitude', () => {
    expect(twinkleStrength(tauE, H, 0)).toBeCloseTo(1, 5);
    expect(twinkleStrength(tauE, H, 20e3)).toBeLessThan(0.1);
    expect(twinkleStrength(0.003, 11e3, 0)).toBeLessThan(0.05);   // Mars: barely
  });
  it('is off in space and on airless bodies, on when standing under an atmosphere', () => {
    const spec = { betaR: [0, tauE / H, 0], HR: H, top: 100e3 };
    const earth = { body: { radius: 6.371e6 }, rel: new Vector3(0, 0, -6.371e6 - 2), dist: 6.371e6 + 2, resolved: true, air: true };
    const moon = { body: { radius: 1.737e6 }, rel: new Vector3(0, -1.737e6 - 2, 0), dist: 1.737e6 + 2, resolved: true, air: false };
    updateTwinkle([moon], (v) => (v.air ? spec : null), 1);
    expect(TWINKLE.uTwinkle.value).toBe(0);
    updateTwinkle([moon, earth], (v) => (v.air ? spec : null), 1);
    expect(TWINKLE.uTwinkle.value).toBeGreaterThan(0.9);
    expect(TWINKLE.uTwUp.value.z).toBeCloseTo(1, 5);   // zenith: away from the planet's centre
    updateTwinkle([{ ...earth, dist: 6.371e6 + 400e3 }], () => spec, 1);   // in orbit
    expect(TWINKLE.uTwinkle.value).toBe(0);
  });
});

describe('nebula embedded stars', () => {
  it('lie inside the nebula, away from its centre, with modest luminosities', () => {
    const s = embeddedStars(0.42, [1, 0.8, 0.7]);
    expect(s.length).toBe(6);
    for (const v of s) {
      const r = Math.hypot(v.x, v.y / 0.8, v.z / 0.7);
      expect(r).toBeGreaterThan(0.17);
      expect(r).toBeLessThan(0.6);
      expect(v.w).toBeGreaterThan(0.01);
      expect(v.w).toBeLessThan(0.07);
    }
    expect(embeddedStars(0.1, [1, 1, 1], 0).every((v) => v.w === 0)).toBe(true);
  });
});

describe('the Sun up close', () => {
  it('shows a few spot groups, faculae and prominences (near solar maximum)', () => {
    const l = starLook('sun', 5772, 1, 4.83, true);
    expect(l.spots).toBeGreaterThan(0.04);
    expect(l.faculae).toBeGreaterThan(0.3);
    expect(l.prominences).toBeGreaterThan(0.3);
  });
});
