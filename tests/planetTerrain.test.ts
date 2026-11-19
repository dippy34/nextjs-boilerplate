import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { ExoGround } from '../src/universe/ExoTerrain';
import type { ExoPlanet } from '../src/universe/Planets';
import type { Body } from '../src/universe/Body';
import { tileFragment } from '../src/render/PlanetTerrain';
import { Renderer } from '../src/render/Renderer';
import { BODY_FRAG } from '../src/render/shaders/body';
import { EXO_FRAG } from '../src/render/shaders/planet';
import { DEPRESSIONS, earthWaterLevel, TerrainSource } from '../src/universe/Terrain';
import { heightFromSpec, heightSpec } from '../src/universe/TerrainHeights';
import {
  buildTile, childToward, dirFace, skirtMasks, ellipsoidRadius, faceDir, TILE_N, TILE_V, tileGroundRadius, tileIndices, tileRect, type TileRequest, tileSpacing, tileValue,
} from '../src/universe/TerrainTiles';

const R = 1737e3;
const radii = [R, R, R];
const hills = (n: Vector3) => 3000 * Math.sin(n.x * 40) * Math.cos(n.y * 31) + 800 * Math.sin(n.z * 300);
const req = (face: number, level: number, x: number, y: number, extra: Partial<TileRequest> = {}): TileRequest =>
  ({ face, level, x, y, radii, radius: R, sun: null, lonLeft: -Math.PI, hTop: 4000, ...extra });

describe('planet terrain tiles', () => {
  it('face parameters round-trip', () => {
    for (let f = 0; f < 6; f++) {
      for (const [s, t] of [[0, 0], [0.3, -0.7], [-0.99, 0.99], [0.5, 0.5]]) {
        const d = faceDir(f, s, t);
        const b = dirFace(d);
        expect(b.face).toBe(f);
        expect(b.s).toBeCloseTo(s, 9);
        expect(b.t).toBeCloseTo(t, 9);
      }
    }
  });

  it('triangles face outwards', () => {
    const t = buildTile(req(2, 3, 2, 5), hills);
    const idx = tileIndices();
    let out = 0;
    for (let k = 0; k < TILE_N * TILE_N * 2; k++) {
      const [a, b, c] = [idx[k * 3], idx[k * 3 + 1], idx[k * 3 + 2]];
      const p = (v: number) => new Vector3(t.pos[v * 3], t.pos[v * 3 + 1], t.pos[v * 3 + 2]);
      const nrm = p(b).sub(p(a)).cross(p(c).sub(p(a)));
      const dir = new Vector3(t.n[a * 3], t.n[a * 3 + 1], t.n[a * 3 + 2]);
      if (nrm.dot(dir) > 0) out++;
    }
    expect(out).toBe(TILE_N * TILE_N * 2);
  });

  it('neighbouring tiles share their edge vertices (no cracks at the same level), also across faces', () => {
    const abs = (t: ReturnType<typeof buildTile>, v: number) => new Vector3(t.pos[v * 3] + t.centre[0], t.pos[v * 3 + 1] + t.centre[1], t.pos[v * 3 + 2] + t.centre[2]);
    const a = buildTile(req(0, 2, 1, 1), hills), b = buildTile(req(0, 2, 2, 1), hills);
    for (let j = 0; j < TILE_V; j++) {
      const pa = abs(a, j * TILE_V + TILE_N), pb = abs(b, j * TILE_V);
      expect(pa.distanceTo(pb)).toBeLessThan(0.1);   // float32 offsets from centres ~700 km away
      // normals agree too (computed from a border beyond the tile)
      const na = new Vector3(a.tn[(j * TILE_V + TILE_N) * 3], a.tn[(j * TILE_V + TILE_N) * 3 + 1], a.tn[(j * TILE_V + TILE_N) * 3 + 2]);
      const nb = new Vector3(b.tn[j * TILE_V * 3], b.tn[j * TILE_V * 3 + 1], b.tn[j * TILE_V * 3 + 2]);
      expect(na.angleTo(nb)).toBeLessThan(1e-3);
    }
    // the +X face's s = 1 edge meets the +Y face
    const e = buildTile(req(0, 0, 0, 0), hills);
    for (let j = 0; j <= TILE_N; j += 4) {
      const p = abs(e, j * TILE_V + TILE_N);
      const f = dirFace(p);
      expect([0, 2]).toContain(f.face);
    }
  });

  it('a child starts as exactly its parent\'s shape (geomorph) and the drawn ground is found', () => {
    const par = buildTile(req(4, 3, 3, 4), hills);
    for (let q = 0; q < 4; q++) {
      const qx = q & 1, qy = q >> 1;
      const kid = buildTile(req(4, 4, 6 + qx, 8 + qy, { parent: { pos: par.pos, tn: par.tn, centre: par.centre, qx, qy } }), hills);
      const [s0, t0, w] = tileRect(4, 6 + qx, 8 + qy);
      for (const [fs, ft] of [[0.13, 0.41], [0.77, 0.52], [0.5, 0.5], [0.031, 0.97]]) {
        const d = faceDir(4, s0 + fs * w, t0 + ft * w);
        const rp = tileGroundRadius({ face: 4, level: 3, x: 3, y: 4 }, par, 1, d);
        const rk0 = tileGroundRadius({ face: 4, level: 4, x: 6 + qx, y: 8 + qy }, kid, 0, d);
        expect(Math.abs(rp - rk0)).toBeLessThan(0.05);
        // fully morphed: close to the height function (linear between vertices)
        const rk1 = tileGroundRadius({ face: 4, level: 4, x: 6 + qx, y: 8 + qy }, kid, 1, d);
        expect(Math.abs(rk1 - (R + hills(d)))).toBeLessThan(60);
      }
    }
  });

  it('the column under a direction: each child holds it', () => {
    const d = faceDir(3, 0.4321, -0.777);
    let t = { face: 3, level: 0, x: 0, y: 0 };
    for (let l = 0; l < 12; l++) {
      const c = childToward(t, d);
      t = { face: 3, level: l + 1, x: c.x, y: c.y };
      const [s0, t0, w] = tileRect(t.level, t.x, t.y);
      const f = dirFace(d);
      expect(f.s).toBeGreaterThanOrEqual(s0 - 1e-12);
      expect(f.s).toBeLessThanOrEqual(s0 + w + 1e-12);
      expect(f.t).toBeGreaterThanOrEqual(t0 - 1e-12);
      expect(f.t).toBeLessThanOrEqual(t0 + w + 1e-12);
    }
  });

  it('ground radius matches the vertices exactly', () => {
    const t = buildTile(req(1, 6, 20, 41), hills);
    for (const v of [0, 17, TILE_V * 5 + 3, TILE_V * TILE_V - 1]) {
      const d = new Vector3(t.n[v * 3], t.n[v * 3 + 1], t.n[v * 3 + 2]);
      const r = tileGroundRadius({ face: 1, level: 6, x: 20, y: 41 }, t, 1, d);
      expect(Math.abs(r - (ellipsoidRadius(radii, d.x, d.y, d.z) + t.h[v]))).toBeLessThan(0.05);
      expect(Math.abs(tileValue({ face: 1, level: 6, x: 20, y: 41 }, t.h, d) - t.h[v])).toBeLessThan(0.05);
    }
  });

  it('relief shadows: a low sun behind a ridge shades the ground in front of it', () => {
    // a north-south ridge at s = 0.5 of a tile; the sun low in the east (+s side)
    const [s0, t0, w] = tileRect(10, 600, 600);
    const ridge = (n: Vector3) => {
      const f = dirFace(n);
      const u = (f.s - s0) / w;
      return 400 * Math.exp(-(((u - 0.6) / 0.03) ** 2));
    };
    const c = faceDir(4, s0 + w / 2, t0 + w / 2);
    const east = faceDir(4, s0 + w, t0 + w / 2).sub(c).normalize();
    const sun = c.clone().multiplyScalar(Math.sin(0.08)).addScaledVector(east, Math.cos(0.08)).normalize();
    const t = buildTile(req(4, 10, 600, 600, { sun: [sun.x, sun.y, sun.z] }), ridge);
    const at = (fs: number) => tileValue({ face: 4, level: 10, x: 600, y: 600 }, t.sun, faceDir(4, s0 + fs * w, t0 + 0.5 * w));
    expect(at(0.5)).toBeLessThan(-0.5);     // in the ridge's shadow
    expect(at(0.75)).toBeGreaterThan(0);    // on the sunward side
  });

  it('relief shadows: a ridge just beyond the tile, or a narrow one far away, still shades it', () => {
    // the sun low in the east (+s side); ridges outside the tile (u > 1), narrow (a few cells wide)
    const [s0, t0, w] = tileRect(10, 600, 600);
    const c = faceDir(4, s0 + w / 2, t0 + w / 2);
    const east = faceDir(4, s0 + w, t0 + w / 2).sub(c).normalize();
    const elev = 0.08;
    const sun = c.clone().multiplyScalar(Math.sin(elev)).addScaledVector(east, Math.cos(elev)).normalize();
    const tileM = tileSpacing(R, 10) * TILE_N;
    const shadeWith = (u0: number, reach: number, width = 0.06) => {
      // tall enough to shade `reach` tile widths west of the ridge
      const H = Math.tan(elev) * reach * tileM;
      const ridge = (n: Vector3) => { const f = dirFace(n); const u = (f.s - s0) / w; return H * Math.exp(-(((u - u0) / width) ** 2)); };
      const t = buildTile(req(4, 10, 600, 600, { sun: [sun.x, sun.y, sun.z], hTop: H + 100 }), ridge);
      return (fs: number) => tileValue({ face: 4, level: 10, x: 600, y: 600 }, t.sun, faceDir(4, s0 + fs * w, t0 + 0.5 * w));
    };
    // just beyond the east edge: shades the eastern half of the tile
    const near = shadeWith(1.08, 0.6);
    for (const fs of [0.6, 0.75, 0.9, 0.97]) expect(near(fs), `ridge just beyond the edge, at ${fs}`).toBeLessThan(-0.5);
    expect(near(0.2)).toBeGreaterThan(0);
    // a massif three tiles away (heights that far are smoothed over a sixth of the distance, so
    // narrower crests are broadened to about this): shades the whole tile
    const far = shadeWith(4, 5.5, 0.5);
    for (const fs of [0.05, 0.3, 0.6, 0.95]) expect(far(fs), `narrow ridge far away, at ${fs}`).toBeLessThan(-0.5);
  });

  it('worker specs rebuild the same heights (generated planets and Solar System bodies)', () => {
    const exo = new ExoGround({ name: 'Test b', radius: 5e6 } as ExoPlanet, 3, 41, 0.45, 0);
    const fe = heightFromSpec(heightSpec(exo, null)!);
    const src = new TerrainSource('http://localhost/none');
    (src as unknown as { manifest: unknown }).manifest = { maps: {} };
    const body = { name: 'Callisto', radius: 2410e3, radii: [2410e3, 2410e3, 2410e3] } as unknown as Body;
    const g = src.ground(body);
    const fb = heightFromSpec(heightSpec(g, src)!);
    for (let i = 0; i < 50; i++) {
      const d = new Vector3(Math.sin(i), Math.cos(i * 1.7), Math.sin(i * 0.3)).normalize();
      expect(fe(d, 30)).toBe(exo.height(d, 30));
      expect(fb(d, 30)).toBe(g.height(d, 30));
    }
  });
});

describe('elevation hookup', () => {
  const R = 1737.4e3;
  const spec = {
    kind: 'body' as const, name: 'Moon', radius: R, radii: [R, R, R], craters: 0.8,
    key: null, manifestMap: null, map: null, patches: [], elevation: null,
  };
  it('sharper elevation replaces the base; generated relief only fills in below its spacing', () => {
    const plain = heightFromSpec(spec);
    const withE = heightFromSpec(spec, () => ({ h: 1234, mpp: 60 }));
    let eLo = Infinity, eHi = -Infinity, pLo = Infinity, pHi = -Infinity;
    for (let i = 0; i < 60; i++) {
      const n = new Vector3(Math.sin(i), Math.cos(i * 1.7), Math.sin(i * 0.3)).normalize();
      const he = withE(n, 10);
      // dominated by the elevation value, with only metre-scale generated relief on top
      expect(Math.abs(he - 1234)).toBeLessThan(120);
      eLo = Math.min(eLo, he); eHi = Math.max(eHi, he);
      const hp = plain(n, 10); pLo = Math.min(pLo, hp); pHi = Math.max(pHi, hp);
    }
    // elevation pins the base (small spread); the generated-only base roams over hundreds of metres
    expect(eHi - eLo).toBeLessThan(240);
    expect(pHi - pLo).toBeGreaterThan(500);
  });
  it('falls back to generated relief where no elevation tile covers the point (sampler returns null)', () => {
    const plain = heightFromSpec(spec);
    const withE = heightFromSpec(spec, () => null);
    for (let i = 0; i < 20; i++) {
      const n = new Vector3(Math.cos(i), Math.sin(i * 2.1), Math.cos(i * 0.7)).normalize();
      expect(withE(n, 10)).toBe(plain(n, 10));
    }
  });
});

describe('tile shaders', () => {
  it('the surface shaders run per tile without discard (early depth rejection) and read the close-up weight per vertex', () => {
    for (const frag of [BODY_FRAG, EXO_FRAG]) {
      const f = tileFragment(frag);
      expect(f.slice(f.indexOf('void main()')).includes('discard')).toBe(false);
      expect(f).toContain('#define uHScale vHScale');
      expect(f).not.toMatch(/uniform float uHScale;/);
    }
  });
});

describe('skirts and warm-up', () => {
  it('skirts both sides of a level boundary, never between tiles of one level, always on face borders', () => {
    // face 0 at level 1, its tile (0, 0) split into four level-2 tiles
    const t = (level: number, x: number, y: number) => ({ face: 0, level, x, y });
    const tiles = [t(2, 0, 0), t(2, 1, 0), t(2, 0, 1), t(2, 1, 1), t(1, 1, 0), t(1, 0, 1), t(1, 1, 1)];
    const m = skirtMasks(tiles);
    // edge bits: 0 = y-1, 1 = x+1, 2 = y+1, 3 = x-1
    expect(m[0]).toBe(0b1001); // two face borders; its siblings get none
    expect(m[3]).toBe(0b0110); // against the coarser (1, 0) and (0, 1)
    expect(m[4]).toBe(0b1011); // face borders, and against the finer tiles at x-1
    expect(m[5]).toBe(0b1101); // face borders, and against the finer tiles at y-1
    expect(m[6]).toBe(0b0110); // face borders only: its neighbours are of its own level
    // one level everywhere: face borders only
    expect(skirtMasks([t(1, 0, 0), t(1, 1, 0), t(1, 0, 1), t(1, 1, 1)])).toEqual([0b1001, 0b0011, 0b1100, 0b0110]);
  });

  it('warm-up compiles with the scene target bound, then restores the one bound before', () => {
    const hdr = { name: 'hdr' }, was = { name: 'before' };
    let bound: unknown = was, seen: unknown = null;
    const fake = { presenting: false, hdr, gl: { getRenderTarget: () => bound, setRenderTarget: (t: unknown) => { bound = t; } } };
    const r = Renderer.prototype.withSceneTarget.call(fake as never, () => { seen = bound; return 7; });
    expect(r).toBe(7);
    expect(seen).toBe(hdr);
    expect(bound).toBe(was);
    // in a headset the XR target three binds is left alone
    bound = was;
    Renderer.prototype.withSceneTarget.call({ ...fake, presenting: true } as never, () => { seen = bound; });
    expect(seen).toBe(was);
  });
});

describe('water on Earth', () => {
  const at = (lat: number, lon: number) => {
    const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
    return new Vector3(Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la));
  };
  it('dry depressions are land with a floor, lakes below sea level keep their own level, open sea stays at 0', () => {
    const w = (lat: number, lon: number) => earthWaterLevel(at(lat, lon), 0);
    expect(w(36.25, -116.85)).toMatchObject({ level: -80, water: false });   // Death Valley
    expect(w(29.6, 27.0)).toMatchObject({ water: false });                   // Qattara
    expect(w(31.5, 35.5)).toMatchObject({ level: -199, water: true });       // Dead Sea (the data stops at -200 m)
    expect(w(32.82, 35.59)).toMatchObject({ water: true });                  // Sea of Galilee, not the dry rift around it
    expect(w(37.0, 51.5)).toMatchObject({ level: -28, water: true });        // southern Caspian
    expect(w(46.8, 50.5)).toMatchObject({ level: -28, water: true });        // northern Caspian
    expect(w(43.4, 51.4)).toMatchObject({ water: false });                   // Karagiye, a dry basin by the Caspian
    expect(w(30, -40)).toMatchObject({ level: 0, water: true });             // mid-Atlantic
  });
  it('no depression circle reaches the open sea next to it', () => {
    const sea: [string, number, number][] = [
      ['Mediterranean off Tel Aviv', 32.1, 34.7], ['Mediterranean off Haifa', 32.85, 34.95], ['Mediterranean off Gaza', 31.5, 34.35],
      ['Mediterranean off El Alamein', 30.95, 28.9], ['Mediterranean off Marsa Matruh', 31.45, 27.2], ['Gulf of Gabes', 33.9, 10.4],
      ['Red Sea off Thio', 14.75, 41.0], ['Gulf of Zula', 15.3, 39.75], ['Gulf of Tadjoura', 11.6, 43.0], ['Ghoubbet', 11.55, 42.6],
      ['Black Sea off Batumi', 41.65, 41.5], ['Persian Gulf', 29.9, 48.6], ['Gulf of California', 31.6, -114.6],
      ['Pacific off Los Angeles', 33.7, -118.5], ['Atlantic off Tarfaya', 27.9, -13.1], ['Caribbean off Barahona', 18.15, -71.05],
      ['Atlantic off Patagonia', -49.6, -67.6], ['Spencer Gulf', -33.0, 137.6], ['Gulf of Suez', 29.5, 32.6],
    ];
    for (const [name, lat, lon] of sea) expect(earthWaterLevel(at(lat, lon), 0), name).toMatchObject({ level: 0, water: true });
    expect(DEPRESSIONS.length).toBeGreaterThan(10);
  });
});
