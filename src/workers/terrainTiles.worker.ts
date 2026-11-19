/// <reference lib="webworker" />
import { ElevationStore } from '../universe/Elevation';
import { heightFromSpec, type HeightSpec } from '../universe/TerrainHeights';
import { buildTile, childToward, dirFace, faceDir, type HeightFn, TILE_N, type TileData, tileRect, type TileRequest } from '../universe/TerrainTiles';
import { Vector3 } from 'three';

/**
 * Builds planet-terrain tiles off the main thread (render/PlanetTerrain.ts). Messages:
 *   { type: 'spec', id, spec }       a world's height function (sent again when its heights change)
 *   { type: 'drop', id }             forget a world
 *   { type: 'tile', job, id, req }   build a tile -> { job, data } (arrays transferred)
 * Bodies with a global elevation pyramid: the tiles a job samples are fetched before it is built.
 */
interface Fn { fn: HeightFn; bodyKey: string | null; elev: boolean }
const fns = new Map<number, Fn>();
const store = new ElevationStore();
let elevConfigured = false;

/**
 * Sharper elevation (m above the reference surface), or null where no loaded tile covers the
 * direction. The pyramids measure heights from the same reference as the coarse global maps they
 * refine (the areoid for Mars, the geoid for Earth, the mean sphere for the Moon, ...), and the
 * tile source adds both to the body's ellipsoid in the same way: no reconciliation needed, so the
 * coarse map (fallback while tiles load) and the pyramid line up.
 */
function makeElevSample(bodyKey: string): (n: Vector3, spacing: number) => { h: number; mpp: number } | null {
  const d = { x: 0, y: 0, z: 0 };
  return (n, spacing) => {
    d.x = n.x; d.y = n.y; d.z = n.z;
    const v = store.sample(bodyKey, d, spacing);
    return v === null ? null : { h: v, mpp: store.lastMetresPerSample || spacing };
  };
}

self.onmessage = (ev: MessageEvent) => {
  const m = ev.data as { type: string; id: number; spec?: HeightSpec; job?: number; req?: TileRequest };
  if (m.type === 'spec') {
    const spec = m.spec!;
    let elevSample: ((n: Vector3, spacing: number) => { h: number; mpp: number } | null) | undefined;
    let bodyKey: string | null = null;
    let elev = false;
    if (spec.kind === 'body' && spec.elevation) {
      bodyKey = spec.elevation.bodyKey;
      if (!elevConfigured) { store.configure({ base: spec.elevation.base }); elevConfigured = true; }
      void store.load(bodyKey);
      elev = true;
      elevSample = makeElevSample(bodyKey);
    }
    fns.set(m.id, { fn: heightFromSpec(spec, elevSample), bodyKey, elev });
    return;
  }
  if (m.type === 'drop') { fns.delete(m.id); return; }
  if (m.type === 'tile') {
    const f = fns.get(m.id);
    if (!f) { (self as unknown as Worker).postMessage({ job: m.job, data: null }); return; }
    void buildJob(m.job!, m.req!, f);
  }
};

/** a promise that settles after `ms` (so a slow fetch never holds a tile back for long) */
const later = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

async function buildJob(job: number, req: TileRequest, f: Fn): Promise<void> {
  // the elevation tiles this tile (and the column below it) samples, fetched first, so its heights
  // are final when it is drawn: the ground never changes under the explorer as data streams in
  if (f.elev && f.bodyKey) {
    const [s0, t0, w] = tileRect(req.level, req.x, req.y);
    const c = faceDir(req.face, s0 + w / 2, t0 + w / 2);
    const sp = (level: number) => Math.max(req.minSpacing ?? 0, (req.radius * Math.PI) / 2 / 2 ** level / TILE_N);
    const want = [store.prefetch(f.bodyKey, { x: c.x, y: c.y, z: c.z }, sp(req.level), 1)];
    if (req.chain) want.push(store.prefetch(f.bodyKey, { x: req.chain.dir[0], y: req.chain.dir[1], z: req.chain.dir[2] }, sp(req.chain.level), 1));
    await Promise.race([Promise.all(want).catch(() => undefined), later(4000)]);
  }
  const data = buildTile(req, f.fn);
  // the column under the explorer, each tile from its parent's shape
  const chain: { level: number; x: number; y: number; data: TileData }[] = [];
  if (req.chain && dirFace({ x: req.chain.dir[0], y: req.chain.dir[1], z: req.chain.dir[2] }).face === req.face) {
    const dir = { x: req.chain.dir[0], y: req.chain.dir[1], z: req.chain.dir[2] };
    // all four children at each level (a tile splits only when its four children are there),
    // continuing below the one that holds the direction
    let cur = { level: req.level, x: req.x, y: req.y, data };
    while (cur.level < req.chain.level) {
      const c = childToward({ face: req.face, ...cur }, dir);
      let next = cur;
      for (let q = 0; q < 4; q++) {
        const x = cur.x * 2 + (q & 1), y = cur.y * 2 + (q >> 1);
        const d = buildTile({ ...req, level: cur.level + 1, x, y, chain: null,
          parent: { pos: cur.data.pos, tn: cur.data.tn, centre: cur.data.centre, qx: q & 1, qy: q >> 1 } }, f.fn);
        const e = { level: cur.level + 1, x, y, data: d };
        chain.push(e);
        if (x === c.x && y === c.y) next = e;
      }
      cur = next;
    }
  }
  const bufs = (d: TileData) => [d.pos.buffer, d.morph.buffer, d.n.buffer, d.tn.buffer, d.tnc.buffer, d.uv.buffer, d.sun.buffer, d.h.buffer];
  (self as unknown as Worker).postMessage({ job, data, chain }, [...bufs(data), ...chain.flatMap((c) => bufs(c.data))]);
}
