/// <reference lib="webworker" />
import { generateCell } from '../universe/ProceduralStars';

/**
 * Generates procedural star cells off the main thread (a dense cell near the Galactic centre can
 * take ~0.1 s). Request: { k, ix, iy, iz }; reply: the cell with its arrays transferred.
 */
self.onmessage = (ev: MessageEvent) => {
  const { k, ix, iy, iz } = ev.data as { k: number; ix: number; iy: number; iz: number };
  const c = generateCell(k, ix, iy, iz);
  const msg = {
    key: c.key, band: c.band, ix: c.ix, iy: c.iy, iz: c.iz, size: c.size, count: c.count,
    centre: [c.centre.x, c.centre.y, c.centre.z],
    pos: c.pos, absMag: c.absMag, teff: c.teff, cls: c.cls,
  };
  (self as unknown as Worker).postMessage(msg, [c.pos.buffer, c.absMag.buffer, c.teff.buffer, c.cls.buffer]);
};
