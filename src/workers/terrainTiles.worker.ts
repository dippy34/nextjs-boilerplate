/// <reference lib="webworker" />
import { ElevationStore } from '../universe/Elevation';
import { heightFromSpec, type HeightSpec } from '../universe/TerrainHeights';
import { buildTile, faceDir, type HeightFn, tileRect, type TileRequest } from '../universe/TerrainTiles';
import { Vector3 } from 'three';

/**
 * Builds planet-terrain tiles off the main thread (render/PlanetTerrain.ts). Messages:
 *   { type: 'spec', id, spec }       a world's height function (sent again when its heights change)
 *   { type: 'drop', id }             forget a world
 *   { type: 'tile', job, id, req }   build a tile -> { job, data } (arrays transferred)
 * Replies { type: 'elev', id, version } when sharper global elevation tiles stream in, so the main
 * thread rebuilds the affected tiles with them.
 */
interface Fn { fn: HeightFn; bodyKey: string | null; elev: boolean; elevVer: number }
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
    fns.set(m.id, { fn: heightFromSpec(spec, elevSample), bodyKey, elev, elevVer: 0 });
    return;
  }
  if (m.type === 'drop') { fns.delete(m.id); return; }
  if (m.type === 'tile') {
    const f = fns.get(m.id);
    if (!f) { (self as unknown as Worker).postMessage({ job: m.job, data: null }); return; }
    const req = m.req!;
    // make sure the elevation tiles for this tile's area are being fetched (for this and later builds)
    if (f.elev && f.bodyKey) {
      const [s0, t0, w] = tileRect(req.level, req.x, req.y);
      const c = faceDir(req.face, s0 + w / 2, t0 + w / 2);
      const spacing = Math.max(req.minSpacing ?? 0, (req.radius * Math.PI) / 2 / 2 ** req.level / 64);
      void store.prefetch(f.bodyKey, { x: c.x, y: c.y, z: c.z }, spacing, 1).then(() => {
        const v = store.version(f.bodyKey!);
        if (v !== f.elevVer) { f.elevVer = v; (self as unknown as Worker).postMessage({ type: 'elev', id: m.id, version: v }); }
      });
    }
    const data = buildTile(req, f.fn);
    (self as unknown as Worker).postMessage({ job: m.job, data },
      [data.pos.buffer, data.morph.buffer, data.n.buffer, data.tn.buffer, data.tnc.buffer, data.uv.buffer, data.sun.buffer, data.h.buffer]);
  }
};
