import { Vector3 } from 'three';
import { formatRaDec } from '../core/frames';
import { UPos } from '../core/upos';
import { LY, PC, SUN_ABS_MAG, SUN_RADIUS, SUN_TEFF } from '../core/units';
import type { SpaceObject } from './Body';
import type { StarRef } from './StarCatalog';

/** Notable stars (proper names, Bayer/Flamsteed, HR, Gliese) used for labels, search and the info panel. */
export interface NamedStar {
  index: number;
  names: string[];
  pos: Vector3; // pc
  absMag: number;
  teff: number;
  spect: string;
  node: number;
  slot: number;
  /** has an IAU proper name (first designation) */
  proper: boolean;
}

export class NamedStars {
  readonly list: NamedStar[] = [];
  readonly byNodeSlot = new Map<string, NamedStar>();

  static async load(base: string): Promise<NamedStars> {
    const res = await fetch(`${base}/named.json`);
    if (!res.ok) throw new Error(`named stars: HTTP ${res.status}`);
    const js = await res.json();
    const ns = new NamedStars();
    js.stars.forEach((s: [string[], number, number, number, number, number, string, number, number, number], i: number) => {
      const [names, x, y, z, absMag, teff, spect, node, slot, proper] = s;
      const star: NamedStar = { index: i, names, pos: new Vector3(x, y, z), absMag, teff, spect, node, slot, proper: proper === 1 };
      ns.list.push(star);
      ns.byNodeSlot.set(`${node}:${slot}`, star);
    });
    return ns;
  }
}

/** Radius estimate from V absolute magnitude and Teff (Stefan–Boltzmann, no bolometric correction). */
export function estimateStarRadius(absMag: number, teff: number): number {
  return SUN_RADIUS * (SUN_TEFF / teff) ** 2 * Math.pow(10, -0.2 * (absMag - SUN_ABS_MAG));
}

/** A star from the catalogue presented as a selectable object. */
export class CatalogStar implements SpaceObject {
  readonly kind = 'star';
  readonly upos: UPos;
  /** true once the position comes from the decoded catalogue tile (exact) */
  exact = false;
  readonly radius: number;
  readonly parentObject = null;
  name: string;
  designations: string[];
  /** filled asynchronously for stars without a classical designation */
  private resolving = false;

  constructor(
    readonly key: string,
    readonly posPc: Vector3,
    readonly absMag: number,
    readonly teff: number,
    readonly spect: string,
    names: string[],
    readonly ref: StarRef | null,
  ) {
    this.upos = UPos.from(posPc.x * PC, posPc.y * PC, posPc.z * PC);
    this.radius = estimateStarRadius(absMag, teff);
    this.name = names[0] ?? 'Unnamed star';
    this.designations = names;
  }

  /** Adopt the exact catalogue position (pc). */
  setPosition(pc: Vector3): void {
    this.posPc.copy(pc);
    this.upos.set(pc.x * PC, pc.y * PC, pc.z * PC);
  }

  /** Resolve the designation of an anonymous catalogue star (HIP/HD/TYC/Gaia). */
  resolve(named: NamedStars, onDone: () => void): void {
    if (!this.ref || this.resolving || this.designations.length) return;
    this.resolving = true;
    this.ref.catalog.designation(this.ref).then((d) => {
      if (d.notable !== null) {
        const s = named.list[d.notable];
        this.designations = s.names;
      } else if (d.text) {
        this.designations = [d.text];
      }
      this.name = this.designations[0] ?? this.name;
      onDone();
    }).catch(() => undefined);
  }

  info(): [string, string][] {
    const rows: [string, string][] = [['Type', 'Star']];
    if (this.spect) rows.push(['Spectral type', this.spect]);
    rows.push(['Temperature', `${Math.round(this.teff).toLocaleString()} K`]);
    rows.push(['Absolute mag (V)', this.absMag.toFixed(2)]);
    rows.push(['Luminosity (V)', `${Math.pow(10, -0.4 * (this.absMag - SUN_ABS_MAG)).toPrecision(3)} L☉`]);
    rows.push(['Radius', `${(this.radius / SUN_RADIUS).toPrecision(3)} R☉ (estimated)`]);
    const d = this.posPc.length();
    rows.push(['Distance from Sun', `${d.toPrecision(4)} pc (${((d * PC) / LY).toPrecision(4)} ly)`]);
    rows.push(['RA / Dec (from Sun)', formatRaDec(this.posPc)]);
    if (this.designations.length > 1) rows.push(['Designations', this.designations.slice(1, 6).join(', ')]);
    if (this.ref) rows.push(['Catalogue', `${this.ref.catalog.source.split(' (')[0]} — ${this.ref.catalog.license}`]);
    return rows;
  }
}
