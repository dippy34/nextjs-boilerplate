import { Matrix4, type Mesh, Quaternion, ShaderMaterial, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { UPos } from '../src/core/upos';
import { Rocks } from '../src/render/Rocks';
import { TerrainPatch } from '../src/render/TerrainPatch';
import type { Body } from '../src/universe/Body';
import { EXO_CRATER_CELLS, ExoGround, exoQuantile, exoQuantiles, exoTerrain } from '../src/universe/ExoTerrain';
import { EXO_FRAG } from '../src/render/shaders/planet';
import type { ExoPlanet } from '../src/universe/Planets';
import { TerrainSource } from '../src/universe/Terrain';
import { ATMO_FRAG, ATMO_HAZE_FRAG } from '../src/render/shaders/atmosphere';

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

  it('a coarse mesh samples the elevation model averaged over its spacing (no aliasing)', () => {
    const b = world('Moonlet', 1737.4e3);
    const w = 2048, hgt = 1024;
    // a checkerboard of +-1000 m at the map's own resolution: pure detail, zero mean
    const data = new Uint16Array(w * hgt).map((_, i) => (((i % w) + Math.floor(i / w)) % 2 ? 2000 : 0));
    const s2 = new TerrainSource('http://localhost/none') as unknown as { manifest: unknown; maps: Map<string, unknown>; craters: Map<Body, number> };
    s2.manifest = { maps: { moonlet: { file: 'x.png', width: w, height: hgt, lonLeft: -180, offset: -1000, scale: 1, credit: '' } } };
    s2.maps.set('moonlet', { width: w, height: hgt, lonLeft: -180, data, offset: -1000, scale: 1, pixelM: (2 * Math.PI * b.radius) / w });
    s2.craters.set(b, 0);
    const t = s2 as unknown as TerrainSource;
    let fineMax = 0, coarseMax = 0;
    for (let i = 0; i < 300; i++) {
      const n = dir(i * 13);
      fineMax = Math.max(fineMax, Math.abs(t.height(b, n, 50)));
      coarseMax = Math.max(coarseMax, Math.abs(t.height(b, n, 40e3)));
    }
    expect(fineMax).toBeGreaterThan(300);      // close up the detail is there
    expect(coarseMax).toBeLessThan(150);       // far away it averages out instead of aliasing
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
  (src as unknown as { manifest: unknown; elevationBodies: Set<string> }).manifest = { maps: {} };   // no elevation models: generated relief only
  (src as unknown as { elevationBodies: Set<string> }).elevationBodies = new Set();

  const run = (sunBF: Vector3) => {
    const patch = new TerrainPatch();
    patch.budgetMs = 1e9;
    const b = world('Callisto', 2410e3);
    const up = new Vector3(0.3, -0.5, 0.8).normalize();
    const camBF = up.clone().multiplyScalar(b.radius + 800);
    const mat = new ShaderMaterial({ uniforms: { uExposure: { value: 1 }, uSeed: { value: 3 }, uHoleDir: { value: new Vector3() }, uHoleCos: { value: 2 } } });
    const c = { ground: src.ground(b), material: mat, upos: UPos.from(0, 0, 0), rel: camBF.clone().negate(), orient: new Matrix4(), lonLeft: -180, sunBF, alt: 800 };
    // tiles refine one level per frame (built on the main thread here: no workers in tests)
    for (let i = 0; i < 40; i++) patch.update(c);
    const meshes = patch.group.children.filter((m) => m.visible) as Mesh[];
    return { patch, b, up, mat, meshes };
  };

  it('covers the world with terrain under the explorer and cuts the whole sphere', () => {
    const { patch, b, up, mat, meshes } = run(new Vector3(0, 0, 1));
    expect(patch.owner).toBe(b);
    expect(mat.uniforms.uHoleCos.value).toBe(-2);
    expect(meshes.length).toBeGreaterThan(6);
    for (const m of meshes) {
      for (const name of ['position', 'aMorph', 'aTN', 'aSun']) {
        const a = m.geometry.attributes[name].array as Float32Array;
        expect(a.every((v) => Number.isFinite(v))).toBe(true);
      }
    }
    // refined under the explorer: cells of metres to tens of metres at 800 m up
    expect(patch.stats.level).toBeGreaterThan(9);
    // the ground below the explorer is near the reference surface, within the relief
    const below = patch.below(UPos.from(up.x * (b.radius + 800), up.y * (b.radius + 800), up.z * (b.radius + 800)))!;
    expect(Math.abs(below.ground - b.radius)).toBeLessThan(12e3);
    expect(below.dist).toBeCloseTo(b.radius + 800, 3);
    // and exactly the height function there, at the drawn tile's resolution
    expect(Math.abs(below.ground - (b.radius + src.height(b, up, 2)))).toBeLessThan(15);
  });

  it('casts shadows with a low Sun, none with the Sun overhead', () => {
    const up = new Vector3(0.3, -0.5, 0.8).normalize();
    const side = new Vector3(0, 0, 1).cross(up).normalize();
    const low = up.clone().multiplyScalar(Math.sin(0.05)).addScaledVector(side, Math.cos(0.05)).normalize();   // 3 degrees up
    const lit = (sun: Vector3) => {
      let n = 0, dark = 0;
      for (const m of run(sun).meshes) {
        const a = m.geometry.attributes.aSun.array as Float32Array;
        for (const v of a) { n++; if (v < 0) dark++; }   // less than half the Sun's disk
      }
      return dark / n;
    };
    const shadowedLow = lit(low);
    const shadowedHigh = lit(up);
    console.log(`shadowed: Sun 3 deg up ${(shadowedLow * 100).toFixed(1)} %, overhead ${(shadowedHigh * 100).toFixed(1)} %`);
    expect(shadowedLow).toBeGreaterThan(0.03);
    expect(shadowedHigh).toBeLessThan(0.01);
  });
});

describe('rocks', () => {
  const src = new TerrainSource('http://localhost/none');
  (src as unknown as { manifest: unknown }).manifest = { maps: {} };
  (src as unknown as { elevationBodies: Set<string> }).elevationBodies = new Set();

  it('rest on the ground actually drawn, also after a new patch replaces the old', () => {
    const patch = new TerrainPatch();
    patch.budgetMs = 1e9;
    const b = world('Callisto', 2410e3);
    src.craters.set(b, 0.8);
    const mat = new ShaderMaterial({ uniforms: { uExposure: { value: 1 }, uSeed: { value: 3 }, uHoleDir: { value: new Vector3() }, uHoleCos: { value: 2 },
      uSunDir: { value: new Vector3(0, 0, 1) }, uSunColor: { value: new Vector3(1, 1, 1) }, uSunIrr: { value: Math.PI }, uAirless: { value: 1 } } });
    const rocks = new Rocks(patch);
    rocks.budgetMs = 1e9;
    const at = (up: Vector3) => {
      const g = src.ground(b);
      const c = { ground: g, material: mat, upos: UPos.from(0, 0, 0), rel: new Vector3(), orient: new Matrix4(), lonLeft: -180, sunBF: new Vector3(0, 0, 1), alt: 2 };
      for (let i = 0; i < 40; i++) {
        // two metres above the ground drawn below (the terrain refines under the explorer)
        const R = patch.owner ? patch.groundRadius(up) : b.radius + src.height(b, up, 1);
        const cam = up.clone().multiplyScalar(R + 2);
        c.rel.copy(cam).negate();
        c.alt = cam.length() - b.radius;
        patch.update(c);
        rocks.update(UPos.from(cam.x, cam.y, cam.z));
      }
      const r = rocks as unknown as { meshes: { count: number; getMatrixAt(i: number, m: Matrix4): void }[]; origin: Vector3 };
      let n = 0, worst = 0;
      const m = new Matrix4(), p = new Vector3(), q = new Quaternion(), sc = new Vector3();
      for (const mesh of r.meshes) {
        for (let i = 0; i < mesh.count; i++) {
          mesh.getMatrixAt(i, m);
          m.decompose(p, q, sc);
          p.add(r.origin);
          const gr = patch.groundRadius(p.clone().normalize());
          // the rock's centre sits a little below the ground (sunk in), never above it or deep under
          const below = gr - p.length();
          if (below < -0.01) worst = Infinity;   // floating
          // sunk by part of its height, more on a slope (its lowest side), never far under
          else if (sc.y > 0.05) worst = Math.max(worst, below / Math.max(sc.x, sc.z));
          n++;
        }
      }
      return { n, worst };
    };
    const up = new Vector3(0.3, -0.5, 0.8).normalize();
    const first = at(up);
    expect(first.n).toBeGreaterThan(50);
    expect(first.worst).toBeLessThan(1);
    // 200 m away: new tiles under the explorer, and the rocks placed on them
    const next = at(up.clone().add(new Vector3(1, 0.4, 0).multiplyScalar(200 / b.radius)).normalize());
    expect(next.n).toBeGreaterThan(50);
    expect(next.worst).toBeLessThan(1);
  });
});

describe('atmosphere over the terrain', () => {
  it('the haze shader is the shell shader marching to the ground point', () => {
    expect(ATMO_HAZE_FRAG).not.toBe(ATMO_FRAG);
    expect(ATMO_HAZE_FRAG).toContain('varying vec3 vPosView;');
    expect(ATMO_HAZE_FRAG).not.toContain('vWorld');
    expect(ATMO_HAZE_FRAG).toContain('float t1 = min(ta.y, te);');
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
    const sea = exoQuantile(41, 0.5);
    const g = new ExoGround(planet, 3, 41, sea);
    let wet = 0, land = 0, maxH = 0;
    for (let i = 0; i < 2000; i++) {
      const n = dir(i);
      const h = g.height(n, 50);
      if (exoTerrain(n, 41, false) < sea) { wet++; expect(h).toBe(0); } else { land++; maxH = Math.max(maxH, h); }
    }
    expect(wet).toBeGreaterThan(700);
    expect(land).toBeGreaterThan(700);
    expect(maxH).toBeGreaterThan(500);
    expect(maxH).toBeLessThan(20e3);
  });

  it('quantiles of the height field rise with the fraction', () => {
    const q = exoQuantiles(41, [0.1, 0.5, 0.9]);
    expect(q[0]).toBeLessThan(q[1]);
    expect(q[1]).toBeLessThan(q[2]);
    expect(Math.abs(q[1] - exoQuantile(41, 0.5))).toBeLessThan(1e-12);
  });

  it('cratered worlds have craters on the ground, others none', () => {
    const planet = { name: 'Test c', radius: 2.4e6 } as unknown as ExoPlanet;
    const smooth = new ExoGround(planet, 1, 7, 0, 0);
    const pitted = new ExoGround(planet, 1, 7, 0, 1);
    let diff = 0;
    for (let i = 0; i < 400; i++) diff = Math.max(diff, Math.abs(pitted.height(dir(i), 500) - smooth.height(dir(i), 500)));
    expect(diff).toBeGreaterThan(200);
  });

  it('the shader mirrors the CPU noise and crater cells (see scripts/exoterrain-gpu.mjs for the numbers)', () => {
    for (const k of ['73856093u', '19349663u', '83492791u', '73244475u']) expect(EXO_FRAG).toContain(k);
    expect(EXO_FRAG).toContain(`float cellS[3] = float[3](${EXO_CRATER_CELLS.map((c) => c[0].toFixed(1)).join(', ')});`);
    expect(EXO_FRAG).toContain(`float densS[3] = float[3](${EXO_CRATER_CELLS.map((c) => String(c[1])).join(', ')});`);
    expect(EXO_FRAG).toContain(`float depS[3] = float[3](${EXO_CRATER_CELLS.map((c) => String(c[2])).join(', ')});`);
  });
});
