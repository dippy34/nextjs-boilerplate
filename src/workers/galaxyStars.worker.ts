/// <reference lib="webworker" />
import { GalaxyModel, lookFor } from '../render/GalaxiesLayer';
import { generateGalaxyCell, InteriorFrame } from '../render/GalaxyInterior';
import { noise3D } from '../render/Noise3D';
import { Galaxy, type GalaxyData } from '../universe/Galaxies';

/**
 * Generates the stars of cells inside other galaxies off the main thread. First message:
 * { galaxies } (the catalogue, to rebuild the same galaxies and models); then requests
 * { gi, k, ix, iy, iz }, each answered with the cell, its arrays transferred.
 */
let galaxies: Galaxy[] = [];
const frames = new Map<number, InteriorFrame>();

self.onmessage = (ev: MessageEvent) => {
  const d = ev.data as { galaxies?: GalaxyData[]; add?: { gi: number; data: GalaxyData }[]; gi: number; k: number; ix: number; iy: number; iz: number };
  if (d.galaxies) {
    galaxies = d.galaxies.map((g, i) => new Galaxy(g, i));
    return;
  }
  if (d.add) {
    // galaxies added later (catalogue destinations), at their index in the main thread's list
    for (const a of d.add) galaxies[a.gi] = new Galaxy(a.data, a.gi);
    return;
  }
  let fr = frames.get(d.gi);
  if (!fr) {
    const g = galaxies[d.gi];
    fr = new InteriorFrame(new GalaxyModel(g, lookFor(g, galaxies), noise3D().data), d.gi);
    frames.set(d.gi, fr);
  }
  const c = generateGalaxyCell(fr, d.k, d.ix, d.iy, d.iz);
  const msg = {
    key: c.key, band: c.band, ix: c.ix, iy: c.iy, iz: c.iz, size: c.size, count: c.count,
    centre: [c.centre.x, c.centre.y, c.centre.z], gi: d.gi,
    pos: c.pos, absMag: c.absMag, teff: c.teff, cls: c.cls,
  };
  (self as unknown as Worker).postMessage(msg, [c.pos.buffer, c.absMag.buffer, c.teff.buffer, c.cls.buffer]);
};
