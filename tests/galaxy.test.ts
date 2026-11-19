import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { extinction, GALAXY, glowColumn, R0 } from '../src/universe/Galaxy';
import { BANDS, cellIndex, cellSize, generateCell } from '../src/universe/ProceduralStars';

const bandOf = (M: number) => BANDS.findIndex((b) => b.M === M);

describe('galaxy model', () => {
  it('puts the Sun 8.28 kpc from the centre, just above the plane', () => {
    expect(GALAXY.sun.x).toBeCloseTo(-R0, 0);
    expect(Math.abs(GALAXY.sun.y)).toBeLessThan(1e-6);
    expect(GALAXY.sun.z).toBeGreaterThan(0);
    expect(GALAXY.sun.z).toBeLessThan(25);
  });

  it('glow from the Sun: brightest a few degrees off the dusty plane, much fainter at the poles', () => {
    const at = (bDeg: number) => {
      let s = 0;
      for (let l = 0; l < 360; l += 10) {
        const b = (bDeg * Math.PI) / 180, lr = (l * Math.PI) / 180;
        s += glowColumn(GALAXY.sun, new Vector3(Math.cos(b) * Math.cos(lr), Math.cos(b) * Math.sin(lr), Math.sin(b)), 300, 300);
      }
      return s / 36;
    };
    const b3 = at(3), b0 = at(0.5), b60 = at(60);
    expect(b3).toBeGreaterThan(b0); // dust lane
    expect(b3 / b60).toBeGreaterThan(6);
  });
});

describe('procedural stars', () => {
  it('are deterministic', () => {
    const k = bandOf(0);
    const a = generateCell(k, 30, -2, 0), b = generateCell(k, 30, -2, 0);
    expect(a.count).toBeGreaterThan(0);
    expect(Array.from(a.pos)).toEqual(Array.from(b.pos));
    expect(Array.from(a.absMag)).toEqual(Array.from(b.absMag));
  });

  it('match the local density on the far side of the galaxy (same radius as the Sun)', () => {
    const k = bandOf(5);
    const S = cellSize(k);
    const [ix, iy, iz] = cellIndex(k, new Vector3(R0, 0, 0));
    let n = 0, cells = 0;
    for (let dx = 0; dx < 4; dx++) for (let dy = 0; dy < 4; dy++) { n += generateCell(k, ix + dx, iy + dy, iz).count; cells++; }
    // G dwarfs, 1.2e-3 per pc³ per mag near the Sun, slightly below the mid-plane cell's mean
    const perCell = n / cells;
    const expected = 1.2e-3 * S ** 3;
    expect(perCell).toBeGreaterThan(expected * 0.3);
    expect(perCell).toBeLessThan(expected * 1.5);
  });

  it('form a thin disk: old giants within a few hundred parsecs of the plane', () => {
    const k = bandOf(-1);
    const [ix, iy, iz] = cellIndex(k, new Vector3(-4000, 6000, 0));
    const zs: number[] = [];
    for (let dz = -1; dz <= 0; dz++) for (let dx = 0; dx < 3; dx++) {
      const c = generateCell(k, ix + dx, iy, iz + dz);
      const g = new Vector3();
      for (let i = 0; i < c.count; i++) {
        GALAXY.toGal(new Vector3(c.pos[i * 3], c.pos[i * 3 + 1], c.pos[i * 3 + 2]).add(c.centre), g);
        zs.push(Math.abs(g.z));
      }
    }
    expect(zs.length).toBeGreaterThan(50);
    const meanZ = zs.reduce((s, z) => s + z, 0) / zs.length;
    expect(meanZ).toBeGreaterThan(80);
    expect(meanZ).toBeLessThan(450);
  });

  it('never duplicate catalogue stars: none within 100 pc of the Sun or brighter than V = 11 from it', () => {
    for (const M of [-5, 0, 5]) {
      const k = bandOf(M);
      const [ix, iy, iz] = cellIndex(k, GALAXY.sun);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const c = generateCell(k, ix + dx, iy + dy, iz);
        const aSun = extinction(GALAXY.sun, GALAXY.toGal(c.centre), 12);
        for (let i = 0; i < c.count; i++) {
          const d = new Vector3(c.pos[i * 3], c.pos[i * 3 + 1], c.pos[i * 3 + 2]).add(c.centre).length();
          expect(d).toBeGreaterThanOrEqual(100);
          expect(c.absMag[i] + 5 * Math.log10(d) - 5 + aSun).toBeGreaterThanOrEqual(11);
        }
      }
    }
  });

  it('fill the galaxy with tens of billions of stars', () => {
    let total = 0;
    for (const b of BANDS) {
      // thin + thick disk + bulge volume integrals (pc³, relative to the local density) by quadrature
      let I = 0;
      for (let R = 50; R < 20000; R += 100) {
        const ring = 2 * Math.PI * R * 100;
        const hole = 1 - Math.exp(-((R / 3000) ** 3));
        I += ring * (Math.exp(-(R - R0) / 2600) * 520 * hole + 0.12 * Math.exp(-(R - R0) / 2000) * 1800);
      }
      total += b.phi * I;
    }
    expect(total).toBeGreaterThan(1e10);
  });
});

describe('nuclear star cluster', () => {
  it('packs giants within a few parsecs of Sgr A*', () => {
    const k = BANDS.findIndex((b) => b.M === 0);
    const [ix, iy, iz] = cellIndex(k, new Vector3(0, 0, 0));
    const c = generateCell(k, ix, iy, iz);
    let within5 = 0;
    const g = new Vector3();
    for (let i = 0; i < c.count; i++) {
      GALAXY.toGal(new Vector3(c.pos[i * 3], c.pos[i * 3 + 1], c.pos[i * 3 + 2]).add(c.centre), g);
      if (g.length() < 5) within5++;
    }
    expect(within5).toBeGreaterThan(20);
  });
});
