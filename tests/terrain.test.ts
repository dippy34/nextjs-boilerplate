import { Matrix4, type Mesh, ShaderMaterial, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { UPos } from '../src/core/upos';
import { TerrainPatch } from '../src/render/TerrainPatch';
import type { Body } from '../src/universe/Body';
import { ExoGround, exoTerrain } from '../src/universe/ExoTerrain';
import type { ExoPlanet } from '../src/universe/Planets';
import { TerrainSource } from '../src/universe/Terrain';

const world = (name: string, r: number, radii = [r, r, r]) => ({ name, radius: r, radii }) as unknown as Body;
const dir = (i: number) => {
  // well-spread directions (golden spiral)
  const z = 1 - (2 * (i + 0.5)) / 4000;
  const a = i * 2.399963;
  const s = Math.sqrt(1 - z * z);
  return new Vector3(s * Math.cos(a), s * Math.sin(a), z);
};

describe('landing terrain', () => {
  const src = new TerrainSource('http://localhost/none');

  it('the same place always has the same ground', () => {
    const b = world('Callisto', 2410e3);
    const n = dir(17);
    expect(src.height(b, n, 5)).toBe(src.height(b, n, 5));
  });

  it('relief has a sensible size for the body', () => {
    const big = world('Callisto', 2410e3);
    const small = world('Mimas', 198e3);
    for (const [b, maxKm] of [[big, 12], [small, 3]] as const) {
      let lo = Infinity, hi = -Infinity, sum2 = 0;
      for (let i = 0; i < 4000; i++) {
        const h = src.height(b, dir(i), 200);
        lo = Math.min(lo, h); hi = Math.max(hi, h); sum2 += h * h;
      }
      const rms = Math.sqrt(sum2 / 4000);
      console.log(`${b.name}: ${lo.toFixed(0)}..${hi.toFixed(0)} m, rms ${rms.toFixed(0)} m`);
      expect(hi - lo).toBeLessThan(maxKm * 2e3);
      expect(rms).toBeGreaterThan(maxKm * 10);   // not flat
    }
  });

  it('close up there are small craters: metre-scale relief over tens of metres', () => {
    const b = world('Callisto', 2410e3);
    const n0 = dir(123);
    const e = new Vector3(0, 0, 1).cross(n0).normalize();
    let maxStep = 0;
    let prev = src.height(b, n0, 1);
    for (let k = 1; k <= 400; k++) {
      const n = n0.clone().addScaledVector(e, (k * 2) / b.radius).normalize();   // 2 m steps along 800 m
      const h = src.height(b, n, 1);
      maxStep = Math.max(maxStep, Math.abs(h - prev));
      prev = h;
    }
    expect(maxStep).toBeGreaterThan(0.01);
    expect(maxStep).toBeLessThan(5);           // no cliffs from the generator over 2 m
  });

  it('a world with oceans: flat sea at sea level, generated hills only on land', () => {
    const earth = world('Earth', 6371e3);
    const w = 2048, hgt = 1024;   // the real map's size (~20 km per pixel)
    // west half sea (stored at -200 m), east half a 3 km high plateau
    const data = new Uint16Array(w * hgt).map((_, i) => ((i % w) < w / 2 ? 0 : 3200));
    const s2 = new TerrainSource('http://localhost/none') as unknown as { manifest: unknown; maps: Map<string, unknown>; craters: Map<Body, number> };
    s2.manifest = { maps: { earth: { file: 'earth.png', width: w, height: hgt, lonLeft: -180, offset: -200, scale: 1, sea: 0, credit: '' } } };
    s2.maps.set('earth', { width: w, height: hgt, lonLeft: -180, data, offset: -200, scale: 1, pixelM: (2 * Math.PI * 6371e3) / w, sea: 0 });
    s2.craters.set(earth, 0);
    const t = s2 as unknown as TerrainSource;
    const at = (lonDeg: number, latDeg: number) => {
      const la = (latDeg * Math.PI) / 180, lo = (lonDeg * Math.PI) / 180;
      return new Vector3(Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la));
    };
    const sea: number[] = [], land: number[] = [];
    for (let i = 0; i < 200; i++) {
      sea.push(t.height(earth, at(-150 + i * 0.5, -20 + (i % 40)), 100));
      land.push(t.height(earth, at(30 + i * 0.5, -20 + (i % 40)), 100));
    }
    expect(sea.every((h) => h === 0)).toBe(true);
    expect(Math.min(...land)).toBeGreaterThan(1500);
    expect(Math.max(...land) - Math.min(...land)).toBeGreaterThan(50);   // generated relief on land
  });

  it('coarse spacing leaves out the fine layers', () => {
    const b = world('Rhea', 763e3);
    let diff = 0;
    for (let i = 0; i < 500; i++) diff += Math.abs(src.height(b, dir(i), 1) - src.height(b, dir(i), 20e3));
    expect(diff / 500).toBeGreaterThan(0.1);
  });

  it('reference surface follows the ellipsoid', () => {
    const mars = world('Mars', 3389.5e3, [3396.19e3, 3396.19e3, 3376.2e3]);
    expect(TerrainSource.baseRadius(mars, new Vector3(1, 0, 0))).toBeCloseTo(3396.19e3, 0);
    expect(TerrainSource.baseRadius(mars, new Vector3(0, 0, 1))).toBeCloseTo(3376.2e3, 0);
  });

  it('is fast enough to build a patch in a few frames', () => {
    const b = world('Callisto', 2410e3);
    const t0 = performance.now();
    for (let i = 0; i < 14400; i++) src.height(b, dir(i % 4000), 1 + (i % 150) * 50);
    const ms = performance.now() - t0;
    console.log(`14400 heights: ${ms.toFixed(0)} ms`);
    expect(ms).toBeLessThan(1500);
  });
});

describe('terrain patch', () => {
  const src = new TerrainSource('http://localhost/none');
  (src as unknown as { manifest: unknown }).manifest = { maps: {} };   // no elevation models: generated relief only

  const run = (sunBF: Vector3) => {
    const patch = new TerrainPatch();
    patch.budgetMs = 1e9;
    const b = world('Callisto', 2410e3);
    const up = new Vector3(0.3, -0.5, 0.8).normalize();
    const camBF = up.clone().multiplyScalar(b.radius + 800);
    const mat = new ShaderMaterial({ uniforms: { uExposure: { value: 1 }, uSeed: { value: 3 }, uHoleDir: { value: new Vector3() }, uHoleCos: { value: 2 } } });
    const c = { ground: src.ground(b), material: mat, upos: UPos.from(0, 0, 0), rel: camBF.clone().negate(), orient: new Matrix4(), lonLeft: -180, sunBF, alt: 800 };
    for (let i = 0; i < 3 && !patch.owner; i++) patch.update(c);
    const g = (patch.group.children.find((m) => m.visible) as Mesh).geometry;
    return { patch, b, up, mat, g };
  };

  it('builds a finite patch under the explorer and cuts the sphere around it', () => {
    const { patch, b, up, mat, g } = run(new Vector3(0, 0, 1));
    expect(patch.owner).toBe(b);
    expect(mat.uniforms.uHoleCos.value).toBeGreaterThan(0.9);
    expect(mat.uniforms.uHoleCos.value).toBeLessThan(1);
    expect((mat.uniforms.uHoleDir.value as Vector3).angleTo(up)).toBeLessThan(1e-9);
    for (const name of ['position', 'aH', 'aTN', 'aSun']) {
      const a = g.attributes[name].array as Float32Array;
      expect(a.every((v) => Number.isFinite(v))).toBe(true);
    }
    // the ground below the explorer is near the reference surface, within the relief
    const below = patch.below(UPos.from(up.x * (b.radius + 800), up.y * (b.radius + 800), up.z * (b.radius + 800)))!;
    expect(Math.abs(below.ground - b.radius)).toBeLessThan(12e3);
    expect(below.dist).toBeCloseTo(b.radius + 800, 3);
  });

  it('casts shadows with a low Sun, none with the Sun overhead', () => {
    const up = new Vector3(0.3, -0.5, 0.8).normalize();
    const side = new Vector3(0, 0, 1).cross(up).normalize();
    const low = up.clone().multiplyScalar(Math.sin(0.05)).addScaledVector(side, Math.cos(0.05)).normalize();   // 3 degrees up
    const lit = (sun: Vector3) => {
      const a = run(sun).g.attributes.aSun.array as Float32Array;
      return a.filter((v) => v < 0).length / a.length;   // less than half the Sun's disk
    };
    const shadowedLow = lit(low);
    const shadowedHigh = lit(up);
    console.log(`shadowed: Sun 3 deg up ${(shadowedLow * 100).toFixed(1)} %, overhead ${(shadowedHigh * 100).toFixed(1)} %`);
    expect(shadowedLow).toBeGreaterThan(0.03);
    expect(shadowedHigh).toBeLessThan(0.01);
  });
});

describe('generated planets', () => {
  it('the CPU copy of the colour noise stays in its range and varies', () => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < 2000; i++) {
      const t = exoTerrain(dir(i), 41, false);
      lo = Math.min(lo, t); hi = Math.max(hi, t);
    }
    expect(lo).toBeGreaterThan(-0.1);
    expect(hi).toBeLessThan(1.2);
    expect(hi - lo).toBeGreaterThan(0.3);
  });

  it('seas are flat and land rises above them', () => {
    const planet = { name: 'Test b', radius: 6.4e6 } as unknown as ExoPlanet;
    const g = new ExoGround(planet, 3, 41, 0.5);
    let sea = 0, land = 0, maxH = 0;
    for (let i = 0; i < 2000; i++) {
      const n = dir(i);
      const h = g.height(n, 50);
      if (exoTerrain(n, 41, false) < 0.5) { sea++; expect(h).toBe(0); } else { land++; maxH = Math.max(maxH, h); }
    }
    expect(sea).toBeGreaterThan(100);
    expect(land).toBeGreaterThan(100);
    expect(maxH).toBeGreaterThan(500);
    expect(maxH).toBeLessThan(20e3);
  });
});
