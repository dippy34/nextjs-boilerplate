import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodePng16, dirToFace, ElevationStore, faceToDir, TILE, tileOf, type ElevationManifest, type Vec3Like } from '../src/universe/Elevation';

const ROOT = join(__dirname, '..', 'public', 'data', 'elevation');
const POINTS = join(__dirname, 'fixtures', 'elevation_points.json');

/** fetch from public/data/elevation on disk */
const diskFetch = async (url: string) => {
  const p = join(ROOT, url.replace(/^disk:\/\/elevation\//, ''));
  if (!existsSync(p)) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0), json: async () => null };
  const b = readFileSync(p);
  return {
    ok: true, status: 200,
    arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer,
    json: async () => JSON.parse(b.toString('utf8')) as unknown,
  };
};

const norm = (v: Vec3Like): Vec3Like => { const l = Math.hypot(v.x, v.y, v.z); return { x: v.x / l, y: v.y / l, z: v.z / l }; };
const spiral = (i: number, n: number): Vec3Like => {
  const z = 1 - (2 * (i + 0.5)) / n, a = i * 2.399963, s = Math.sqrt(1 - z * z);
  return { x: s * Math.cos(a), y: s * Math.sin(a), z };
};

describe('cube face mapping', () => {
  it('direction -> face point -> direction round-trips', () => {
    for (let i = 0; i < 2000; i++) {
      const d = spiral(i, 2000);
      const p = dirToFace(d);
      expect(p.u).toBeGreaterThanOrEqual(0); expect(p.u).toBeLessThanOrEqual(1);
      expect(p.v).toBeGreaterThanOrEqual(0); expect(p.v).toBeLessThanOrEqual(1);
      const e = faceToDir(p.face, p.u, p.v);
      expect(Math.hypot(e.x - d.x, e.y - d.y, e.z - d.z)).toBeLessThan(1e-12);
    }
  });

  it('face point -> direction -> face point round-trips on every face', () => {
    for (let f = 0; f < 6; f++) for (let k = 0; k < 50; k++) {
      const u = 0.01 + 0.98 * ((k * 0.618) % 1), v = 0.01 + 0.98 * ((k * 0.414) % 1);
      const p = dirToFace(faceToDir(f, u, v));
      expect(p.face).toBe(f);
      expect(p.u).toBeCloseTo(u, 12); expect(p.v).toBeCloseTo(v, 12);
    }
  });

  it('follows the documented axes (face centres, north up on the equatorial faces)', () => {
    const c = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    for (let f = 0; f < 6; f++) {
      const d = faceToDir(f, 0.5, 0.5);
      expect([d.x, d.y, d.z].map((x) => Math.round(x))).toEqual(c[f]);
      if (f < 4) expect(faceToDir(f, 0.5, 0.2).z).toBeGreaterThan(0);
    }
    // +X face: east to the right; +Z face's bottom edge meets +X's top edge
    expect(faceToDir(0, 0.8, 0.5).y).toBeGreaterThan(0);
    const a = faceToDir(0, 0.3, 0), b = faceToDir(4, 0.3, 1);
    expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)).toBeLessThan(1e-12);
  });

  it('edges of neighbouring faces are the same great-circle arcs', () => {
    // walk each face's border; the point just outside it must land on a neighbour's border
    for (let f = 0; f < 6; f++) for (let k = 1; k < 20; k++) {
      const s = k / 20;
      for (const [u, v] of [[s, -1e-9], [s, 1 + 1e-9], [-1e-9, s], [1 + 1e-9, s]]) {
        const p = dirToFace(faceToDir(f, u, v));
        expect(p.face).not.toBe(f);
        expect(Math.min(p.u, 1 - p.u, p.v, 1 - p.v)).toBeLessThan(1e-6);
      }
    }
  });

  it('tileOf finds the tile containing a direction', () => {
    const d = norm({ x: 0.3, y: -0.8, z: 0.2 });
    const t = tileOf(d, 4);
    const p = dirToFace(d);
    expect(t.face).toBe(p.face);
    expect(p.u * 16).toBeGreaterThanOrEqual(t.x); expect(p.u * 16).toBeLessThan(t.x + 1);
    expect(p.v * 16).toBeGreaterThanOrEqual(t.y); expect(p.v * 16).toBeLessThan(t.y + 1);
  });
});

const bodies = existsSync(ROOT) ? ['moon', 'mars', 'earth', 'mercury', 'ceres', 'vesta'].filter((b) => existsSync(join(ROOT, b, 'manifest.json'))) : [];
const points = existsSync(POINTS) ? (JSON.parse(readFileSync(POINTS, 'utf8')) as Record<string, { level: number; dir: number[]; h: number; exact: boolean }[]>) : {};

describe.skipIf(!bodies.length)('elevation tiles', () => {
  const store = new ElevationStore({ base: 'disk://elevation', fetch: diskFetch, maxBytes: 512 * 2 ** 20 });

  it('decodes a tile', async () => {
    const b = readFileSync(join(ROOT, bodies[0], '0', '0-0-0.png'));
    const t = await decodePng16(b);
    expect(t.width).toBe(TILE + 3);
    expect(t.height).toBe(TILE + 3);
  });

  for (const body of bodies) {
    it(`${body}: samples match the source model`, async () => {
      const man = (await store.load(body)) as ElevationManifest;
      expect(man.levels[0].level).toBe(0);
      const pts = points[body] ?? [];
      expect(pts.length).toBeGreaterThan(0);
      let worst = 0;
      for (const p of pts) {
        const d = { x: p.dir[0], y: p.dir[1], z: p.dir[2] };
        const t = tileOf(d, p.level);
        await store.request(body, t.face, t.level, t.x, t.y);
        const mps = man.levels[p.level].metresPerSample;
        const h = store.sample(body, d, mps);
        expect(h).not.toBeNull();
        expect(store.lastLevel).toBe(p.level);
        // at sample positions: the stored value (quantised to `step`); between: bicubic of the
        // samples against bicubic of the (prefiltered) source, which differ by a little of the
        // relief over one sample spacing
        const tol = p.exact ? man.step * 0.51 + 1e-6 : 10 + 0.04 * mps;
        worst = Math.max(worst, Math.abs(h! - p.h) / tol);
        expect(Math.abs(h! - p.h)).toBeLessThanOrEqual(tol);
      }
      expect(worst).toBeLessThanOrEqual(1);
    });

    it(`${body}: tiles agree along shared edges (between tiles and across faces)`, async () => {
      const man = (await store.load(body)) as ElevationManifest;
      // the deepest complete level, at most 2
      const L = Math.min(2, Math.max(...man.levels.filter((l) => !l.bitmap).map((l) => l.level)));
      const n = 1 << L;
      for (let f = 0; f < 6; f++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) await store.request(body, f, L, x, y);
      const mps = man.levels[L].metresPerSample;
      let worst = 0;
      for (let f = 0; f < 6; f++) {
        for (let k = 1; k < 64; k++) {
          const s = k / 64;
          // just inside and just outside each tile boundary of this face (and the face's own edges)
          for (let e = 0; e <= n; e++) {
            for (const [u0, v0] of [[e / n, s], [s, e / n]]) {
              const du = u0 === e / n ? 1e-7 : 0, dv = v0 === e / n ? 1e-7 : 0;
              const a = store.sample(body, faceToDir(f, u0 - du, v0 - dv), mps);
              const b = store.sample(body, faceToDir(f, u0 + du, v0 + dv), mps);
              expect(a).not.toBeNull(); expect(b).not.toBeNull();
              worst = Math.max(worst, Math.abs(a! - b!));
            }
          }
        }
      }
      // identical shared samples within a face; across faces the edge samples are taken twice
      // from the source and may round to neighbouring steps
      expect(worst).toBeLessThanOrEqual(man.step * 1.01 + 0.05);
    });

    it(`${body}: falls back to coarser tiles and blends levels smoothly`, async () => {
      const man = (await store.load(body)) as ElevationManifest;
      const d = norm({ x: 0.2, y: 0.5, z: -0.4 });
      const fresh = new ElevationStore({ base: 'disk://elevation', fetch: diskFetch });
      expect(fresh.sample(body, d, 100)).toBeNull();
      expect(fresh.maxLevelAt(body, d)).toBe(-1);
      await fresh.load(body);
      const top = fresh.maxLevelAt(body, d);
      expect(top).toBeGreaterThanOrEqual(man.levels.filter((l) => !l.bitmap).length - 1);
      const t = tileOf(d, top);
      expect(fresh.exists(body, t.face, top, t.x, t.y)).toBe(true);
      await fresh.prefetch(body, d, man.levels[1].metresPerSample);
      const coarse = fresh.sample(body, d, 1);           // asks for more than is loaded
      expect(coarse).not.toBeNull();
      expect(fresh.lastLevel).toBe(1);
      // between two level spacings the height moves continuously
      const m1 = man.levels[1].metresPerSample;
      const h1 = fresh.sample(body, d, m1)!, h0 = fresh.sample(body, d, m1 * 2)!;
      const hm = fresh.sample(body, d, m1 * Math.SQRT2)!;
      expect(hm).toBeGreaterThanOrEqual(Math.min(h0, h1) - 1e-6);
      expect(hm).toBeLessThanOrEqual(Math.max(h0, h1) + 1e-6);
    });
  }
});
