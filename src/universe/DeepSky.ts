import { Vector3 } from 'three';
import { raDecToVector } from '../core/frames';
import { LY, PC } from '../core/units';
import { UPos } from '../core/upos';
import type { SpaceObject } from './Body';

export type DeepSkyKind = 'emission' | 'planetary' | 'snr' | 'open' | 'globular';

/** public/data/deepsky.json (pipeline/build_deepsky.py, SIMBAD + Sharpless/RCW sizes). */
interface DeepSkyData {
  name: string; simbad: string; kind: DeepSkyKind; otype: string; ra: number; dec: number; distPc: number; nDist: number;
  notes: string[]; majArcmin: number; minArcmin: number; paDeg: number; vmag: number | null;
}

const KIND_NAME: Record<DeepSkyKind, string> = {
  emission: 'Emission nebula (star-forming region)', planetary: 'Planetary nebula (the shed shell of a dying star)',
  snr: 'Supernova remnant', open: 'Open star cluster', globular: 'Globular star cluster',
};

/** A nebula or star cluster as a destination. */
export class DeepSkyObject implements SpaceObject {
  readonly kind: string;
  readonly key: string;
  readonly upos: UPos;
  readonly radius: number;
  readonly parentObject = null;
  readonly posPc: Vector3;
  readonly seed: number;

  constructor(readonly data: DeepSkyData, index: number) {
    this.kind = data.kind === 'open' || data.kind === 'globular' ? 'cluster' : 'nebula';
    this.key = `dso:${index}`;
    this.posPc = raDecToVector(data.ra, data.dec).multiplyScalar(data.distPc);
    this.upos = UPos.from(this.posPc.x * PC, this.posPc.y * PC, this.posPc.z * PC);
    this.radius = Math.tan(((data.majArcmin / 60) * Math.PI) / 360) * data.distPc * PC;
    let h = 0;
    for (const c of data.name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    this.seed = (h % 1000) / 1000;
  }

  get name(): string { return this.data.name; }

  info(): [string, string][] {
    const d = this.data;
    const ly = (d.distPc * PC) / LY;
    const rows: [string, string][] = [
      ['Type', KIND_NAME[d.kind]],
      ['Distance from Sun', ly < 1e5 ? `${Math.round(ly).toLocaleString()} light years` : `${(ly / 1e3).toFixed(0)} thousand light years`],
      ['Size', `about ${((2 * this.radius) / LY).toFixed(this.radius / LY < 5 ? 1 : 0)} light years across`],
      ['Size seen from Earth', `${d.majArcmin.toFixed(d.majArcmin < 2 ? 2 : 1)}′`],
    ];
    if (d.vmag !== null) rows.push(['Magnitude (V)', d.vmag.toFixed(1)]);
    rows.push(['Catalogue', `${d.simbad} (SIMBAD)${d.notes.length ? `; ${d.notes.join('; ')}` : ''}`]);
    if (d.kind === 'open') rows.push(['Stars', 'the real stars from the star catalogues']);
    else if (d.kind === 'globular') rows.push(['Stars', 'generated (King profile, old population); position and size from the catalogue']);
    else rows.push(['Look', 'procedural, from the catalogued type and size']);
    return rows;
  }
}

export async function loadDeepSky(base: string): Promise<DeepSkyObject[]> {
  const j = await fetch(`${base}/deepsky.json`).then((r) => r.json()) as { objects: DeepSkyData[] };
  return j.objects.map((o, i) => new DeepSkyObject(o, i));
}
