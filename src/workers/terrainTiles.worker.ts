/// <reference lib="webworker" />
import { heightFromSpec, type HeightSpec } from '../universe/TerrainHeights';
import { buildTile, type HeightFn, type TileRequest } from '../universe/TerrainTiles';

/**
 * Builds planet-terrain tiles off the main thread (render/PlanetTerrain.ts). Messages:
 *   { type: 'spec', id, spec }       a world's height function (sent again when its heights change)
 *   { type: 'drop', id }             forget a world
 *   { type: 'tile', job, id, req }   build a tile -> { job, data } (arrays transferred)
 */
const fns = new Map<number, HeightFn>();

self.onmessage = (ev: MessageEvent) => {
  const m = ev.data as { type: string; id: number; spec?: HeightSpec; job?: number; req?: TileRequest };
  if (m.type === 'spec') { fns.set(m.id, heightFromSpec(m.spec!)); return; }
  if (m.type === 'drop') { fns.delete(m.id); return; }
  if (m.type === 'tile') {
    const fn = fns.get(m.id);
    if (!fn) { (self as unknown as Worker).postMessage({ job: m.job, data: null }); return; }
    const data = buildTile(m.req!, fn);
    (self as unknown as Worker).postMessage({ job: m.job, data },
      [data.pos.buffer, data.morph.buffer, data.n.buffer, data.tn.buffer, data.tnc.buffer, data.uv.buffer, data.sun.buffer, data.h.buffer]);
  }
};
