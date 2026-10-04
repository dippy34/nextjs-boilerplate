/// <reference lib="webworker" />
import { ElevationStore } from '../universe/Elevation';
import { heightFromSpec, type HeightSpec } from '../universe/TerrainHeights';
import { buildTile, ellipsoidRadius, faceDir, type HeightFn, tileRect, type TileRequest } from '../universe/TerrainTiles';
import { Vector3 } from 'three';

/**
 * Builds planet-terrain tiles off the main thread (render/PlanetTerrain.ts). Messages:
 *   { type: 'spec', id, spec }       a world's height function (sent again when its heights change)
 *   { type: 'drop', id }             forget a world
 *   { type: 'tile', job, id, req }   build a tile -> { job, data } (arrays transferred)
 * Replies { type: 'elev', id, version } when sharper global elevation tiles stream in, so the main
 * thread rebuilds the affected tiles with them.
 */
interface Fn { fn: HeightFn; bodyKey: string | null; refR: number; radii: number[]; sphere: boolean; elevVer: number }
const fns = new Map<number, Fn>();
const store = new ElevationStore();
let elevConfigured = false;

/** Sharper elevation reconciled to the tile source's reference (m above the ellipsoid base), or null. */
function makeElevSample(bodyKey: string, radii: number[]): (n: Vector3, spacing: number) => { h: number; mpp: number } | null {
  const man = () => store.manifest(bodyKey);
  const d = { x: 0, y: 0, z: 0 };
  return (n, spacing) => {
    const m = man();
    if (!m) return null;
    const refR = (m as { referenceRadius?: number }).referenceRadius ?? radii[0];
    d.x = n.x; d.y = n.y; d.z = n.z;
    const v = store.sample(bodyKey, d, spacing);
    if (v === null) return null;
    // place the ground at refR + v (absolute), expressed above this body's ellipsoid base
    return { h: v - (ellipsoidRadius(radii, n.x, n.y, n.z) - refR), mpp: store.lastMetresPerSample || spacing };
  };
}

self.onmessage = (ev: MessageEvent) => {
  const m = ev.data as { type: string; id: number; spec?: HeightSpec; job?: number; req?: TileRequest };
  if (m.type === 'spec') {
    const spec = m.spec!;
    let elevSample: ((n: Vector3, spacing: number) => { h: number; mpp: number } | null) | undefined;
    let bodyKey: string | null = null;
    let refR = 0;
    let sphere = false;
    const radii = spec.kind === 'body' ? spec.radii : [spec.radius, spec.radius, spec.radius];
    if (spec.kind === 'body' && spec.elevation) {
      bodyKey = spec.elevation.bodyKey;
      if (!elevConfigured) { store.configure({ base: spec.elevation.base }); elevConfigured = true; }
      void store.load(bodyKey);
      // activate only on near-spherical bodies, where "metres above the reference radius" lines up
      // exactly with the ellipsoid base (no geoid/areoid or oblateness mismatch); others keep the
      // coarse global map until that reconciliation is in place.
      const rmin = Math.min(...radii), rmax = Math.max(...radii);
      sphere = rmax - rmin < rmax * 1e-3;
      if (sphere) elevSample = makeElevSample(bodyKey, radii);
    }
    fns.set(m.id, { fn: heightFromSpec(spec, elevSample), bodyKey, refR, radii, sphere, elevVer: 0 });
    return;
  }
  if (m.type === 'drop') { fns.delete(m.id); return; }
  if (m.type === 'tile') {
    const f = fns.get(m.id);
    if (!f) { (self as unknown as Worker).postMessage({ job: m.job, data: null }); return; }
    const req = m.req!;
    // make sure the elevation tiles for this tile's area are being fetched (for this and later builds)
    if (f.sphere && f.bodyKey) {
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
