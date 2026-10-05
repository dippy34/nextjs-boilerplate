import { describe, expect, it } from 'vitest';
import { Galaxy } from '../src/universe/Galaxies';
import { GalaxyModel, lookFor } from '../src/render/GalaxiesLayer';
import { buildClusters, globularCount, KIND_GLOBULAR, KIND_HII, KIND_OPEN } from '../src/render/GalaxyClusters';
import { noise3D } from '../src/render/Noise3D';

const PC = 3.0856775814913673e16;
const m31 = { name: 'Andromeda Galaxy', simbad: 'M 31', ra: 10.68, dec: 41.27, distPc: 780000, nDist: 3, majArcmin: 190, minArcmin: 60, paDeg: 35, morph: 'SA(s)b', otype: 'G', vmag: 3.4 };
const m87 = { ...m31, name: 'M87', simbad: 'M 87', ra: 187.7, dec: 12.39, distPc: 16.4e6, majArcmin: 8.3, minArcmin: 6.6, morph: 'E+0-1 pec', vmag: 8.6 };
const model = (d: typeof m31, i = 0) => { const g = new Galaxy(d, i); return new GalaxyModel(g, lookFor(g), noise3D().data); };

describe('galaxy clusters and nebulae', () => {
  it('globular counts follow luminosity and type (M31 a few hundred, a giant elliptical thousands)', () => {
    const n31 = globularCount(new Galaxy(m31, 0));
    expect(n31).toBeGreaterThan(200);
    expect(n31).toBeLessThan(900);
    expect(globularCount(new Galaxy(m87, 1))).toBeGreaterThan(3 * n31);
  });

  it('are deterministic, and a spiral has all three kinds', () => {
    const a = buildClusters(model(m31)), b = buildClusters(model(m31));
    expect(a.count).toBe(b.count);
    expect(Array.from(a.pos.slice(0, 400))).toEqual(Array.from(b.pos.slice(0, 400)));
    const kinds = new Set(Array.from({ length: a.count }, (_, i) => a.kind[i * 2]));
    expect(kinds).toEqual(new Set([KIND_GLOBULAR, KIND_OPEN, KIND_HII]));
  });

  it('globulars: a halo around the galaxy, parsecs across, a small share of its light', () => {
    const m = model(m31);
    const s = buildClusters(m);
    const rpc = m.g.radius / PC;
    let outside = 0, light = 0;
    const sizes: number[] = [];
    for (let i = 0; i < s.globulars; i++) {
      const r = Math.hypot(s.pos[i * 4], s.pos[i * 4 + 1], s.pos[i * 4 + 2]);
      if (r > 0.3 && Math.abs(s.pos[i * 4 + 2]) > 0.1) outside++;
      sizes.push(s.pos[i * 4 + 3] * rpc);
      light += s.flux[i * 3 + 1] / m.bright;
    }
    expect(outside / s.globulars).toBeGreaterThan(0.25);   // many well out of the disc
    sizes.sort((x, y) => x - y);
    const med = sizes[sizes.length >> 1];
    expect(med).toBeGreaterThan(4);
    expect(med).toBeLessThan(30);
    expect(light).toBeGreaterThan(1e-4);
    expect(light).toBeLessThan(0.01);
  });

  it('an elliptical has globulars but no young clusters or nebulae', () => {
    const s = buildClusters(model(m87, 1));
    expect(s.globulars).toBe(s.count);
  });
});
