import { describe, expect, it } from 'vitest';
import {
  apsides, AU, breakupPeriod, circularSpeed, DAY, density, equilibriumTemp, escapeVelocity, flattening, G, habitableZone, hillRadius, isco,
  L_SUN, luminosity, M_EARTH, M_SUN, mainSequence, massFromDensity, num, orbitalPeriod, photonSphere, R_EARTH, R_SUN, radiusFromDensity,
  rocheLimit, scaleHeight, schwarzschildRadius, semiMajorFromPeriod, surfaceGravity, surfaceTemp, T_SUN, waterState, YEAR,
} from '../src/god/physics';

const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe("God mode's physics (textbook values)", () => {
  it('Earth: g, escape velocity, density, flattening', () => {
    expect(surfaceGravity(M_EARTH, R_EARTH).value).toBeCloseTo(9.82, 2);
    expect(escapeVelocity(M_EARTH, R_EARTH).value).toBeCloseTo(11.19, 2);
    expect(density(M_EARTH, R_EARTH).value).toBeCloseTo(5.51, 2);
    expect(1 / flattening(6378.137e3, 6356.752e3).value).toBeCloseTo(298.26, 1);
    // linked mass / radius / density
    const rho = density(M_EARTH, R_EARTH).value * 1000;
    expect(rel(massFromDensity(rho, R_EARTH), M_EARTH)).toBeLessThan(1e-12);
    expect(rel(radiusFromDensity(M_EARTH, rho), R_EARTH)).toBeLessThan(1e-12);
    // the Earth would fly apart spinning in ~1.4 h
    expect(breakupPeriod(M_EARTH, R_EARTH).value / 3600).toBeCloseTo(1.41, 1);
  });

  it("Earth's atmosphere: scale height ~8.4 km at 288 K", () => {
    const H = scaleHeight(288, 0.028964, 9.80665).value;
    expect(H).toBeGreaterThan(8.3);
    expect(H).toBeLessThan(8.5);
  });

  it("Earth's equilibrium temperature ~255 K at albedo 0.3, ~288 K with the greenhouse", () => {
    const T = equilibriumTemp(L_SUN, AU, 0.3).value;
    expect(T).toBeGreaterThan(253);
    expect(T).toBeLessThan(256);
    expect(surfaceTemp(T, 33).value).toBeCloseTo(T + 33, 6);
    expect(waterState(288, 1)).toMatch(/liquid/);
    expect(waterState(250, 1)).toBe('ice');
    expect(waterState(400, 1)).toMatch(/boils/);
    expect(waterState(288, 0.001)).toMatch(/triple/);
  });

  it("Kepler's third law gives the planets' periods", () => {
    const planets: [string, number, number][] = [ // a (AU), sidereal period (days)
      ['Mercury', 0.387098, 87.969], ['Venus', 0.723332, 224.701], ['Earth', 1.000001, 365.256], ['Mars', 1.523679, 686.98],
      ['Jupiter', 5.2044, 4332.59], ['Saturn', 9.5826, 10759.22], ['Uranus', 19.2184, 30688.5], ['Neptune', 30.11, 60182],
    ];
    // (mean elements: Neptune's a and P are averaged differently, hence ~1 %)
    for (const [, a, P] of planets) expect(rel(orbitalPeriod(a * AU, M_SUN).value / DAY, P)).toBeLessThan(0.01);
    expect(rel(orbitalPeriod(AU, M_SUN, M_EARTH).value / DAY, 365.25)).toBeLessThan(1e-3);
    expect(rel(semiMajorFromPeriod(YEAR, M_SUN, M_EARTH), AU)).toBeLessThan(1e-4);
    // the Moon: 27.3 days at 384,400 km
    expect(orbitalPeriod(384_400e3, M_EARTH, 7.342e22).value / DAY).toBeCloseTo(27.3, 0);
    expect(circularSpeed(AU, M_SUN).value).toBeCloseTo(29.78, 1);
    const { peri, apo } = apsides(AU, 0.0167);
    expect(peri.value / AU).toBeCloseTo(0.9833, 4);
    expect(apo.value / AU).toBeCloseTo(1.0167, 4);
    // Earth's Hill sphere ~1.5 million km
    expect(hillRadius(AU, 0.0167, M_EARTH, M_SUN).value / 1e9).toBeCloseTo(1.47, 1);
  });

  it('Roche limit of Saturn for ice', () => {
    // fluid Roche limit of Saturn (60,268 km, 0.687 g/cm3) for an icy moon (0.9 g/cm3): ~134,000 km
    expect(rocheLimit(60268e3, 0.687, 0.9).value / 1e6).toBeCloseTo(134, -1);
  });

  it('the Sun from the main-sequence relations; L = 4πR²σT⁴', () => {
    const s = mainSequence(1);
    expect(s.lum.value).toBeCloseTo(1, 6);
    expect(s.radius.value / R_SUN).toBeCloseTo(1, 6);
    expect(s.teff.value).toBeCloseTo(T_SUN, 0);
    expect(s.life.value).toBeCloseTo(1e10, -6);
    expect(luminosity(R_SUN, T_SUN).value).toBeCloseTo(1, 2);
    // heavier stars are hotter and brighter
    const b = mainSequence(10);
    expect(b.lum.value).toBeGreaterThan(1000);
    expect(b.teff.value).toBeGreaterThan(15000);
    expect(mainSequence(0.2).teff.value).toBeLessThan(4000);
    const hz = habitableZone(L_SUN);
    expect(hz.inner.value / AU).toBeCloseTo(0.95, 2);
    expect(hz.outer.value / AU).toBeCloseTo(1.37, 2);
  });

  it('a 10-solar-mass black hole: r_s = 29.5 km, ISCO 88.6 km, photon sphere 44.3 km', () => {
    const M = 10 * M_SUN;
    expect(schwarzschildRadius(M).value / 1e3).toBeCloseTo(29.53, 1);
    expect(isco(M).value / 1e3).toBeCloseTo(88.6, 0);
    expect(photonSphere(M).value / 1e3).toBeCloseTo(44.3, 0);
    // a maximally spinning hole's prograde ISCO approaches GM/c²
    expect(isco(M, 0.998).value / ((G * M) / 299792458 ** 2)).toBeLessThan(1.3);
  });

  it('shows its working', () => {
    const P = orbitalPeriod(AU, M_SUN);
    expect(P.math).toMatch(/^P = 2π√\(a³ \/ G\(M \+ m\)\) = 2π√\(\(1\.496e11 m\)³ \/ .* = 365\.\d+ d$/);
    expect(num(1.32712440041e20)).toBe('1.327e20');
    expect(num(9.8196)).toBe('9.82');
  });
});
