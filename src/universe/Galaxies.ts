import { Vector3 } from 'three';
import { raDecToVector } from '../core/frames';
import { LY, PC } from '../core/units';
import { UPos } from '../core/upos';
import type { SpaceObject } from './Body';

/** public/data/galaxies.json (pipeline/build_galaxies.py, SIMBAD). */
interface GalaxyData {
  name: string; simbad: string; ra: number; dec: number; distPc: number; nDist: number;
  majArcmin: number; minArcmin: number; paDeg: number; morph: string; otype: string; vmag: number | null;
}

export type GalaxyShape = 'spiral' | 'barred' | 'lenticular' | 'elliptical' | 'irregular' | 'dwarf';

/** Coarse class from the morphological type (de Vaucouleurs/Hubble notation as given by SIMBAD). */
export function shapeOf(morph: string, otype: string): GalaxyShape {
  const m = morph.trim();
  if (/^dSph|^dE|^dS|^dG/.test(m) || /dSph/i.test(otype)) return 'dwarf';
  if (/^(c?E|E-)/.test(m) || /^E\d/.test(m)) return 'elliptical';
  if (/^S0|^SA0|^SB0/.test(m)) return 'lenticular';
  if (/^d?I|^Irr|^IB|^IA|^dIrr|^dI/.test(m)) return 'irregular';
  if (/^SB|^SAB|^S_AB|^SA_B/.test(m)) return 'barred';
  if (/^S/.test(m) || /^\d/.test(m)) return 'spiral';
  return 'elliptical';
}

/** Another galaxy as a destination, sized and oriented as catalogued. */
export class Galaxy implements SpaceObject {
  readonly kind = 'galaxy';
  readonly key: string;
  readonly upos: UPos;
  readonly radius: number;
  readonly parentObject = null;
  readonly shape: GalaxyShape;
  /** disk frame (ICRF): major axis, second in-plane axis, disk normal */
  readonly major = new Vector3();
  readonly minor = new Vector3();
  readonly normal = new Vector3();
  /** axis ratio as seen from Earth (b/a) */
  readonly ratio: number;
  /** seed for the procedural look */
  readonly seed: number;

  constructor(readonly data: GalaxyData, index: number) {
    this.key = `gx:${index}`;
    const L = raDecToVector(data.ra, data.dec);
    this.upos = UPos.from(L.x * data.distPc * PC, L.y * data.distPc * PC, L.z * data.distPc * PC);
    const majRad = (data.majArcmin / 60) * (Math.PI / 180);
    this.radius = Math.tan(majRad / 2) * data.distPc * PC;
    this.ratio = Math.min(1, Math.max(0.08, data.minArcmin / data.majArcmin));
    this.shape = shapeOf(data.morph, data.otype);
    // sky basis at the galaxy: east and north
    const a = (data.ra * Math.PI) / 180, d = (data.dec * Math.PI) / 180;
    const E = new Vector3(-Math.sin(a), Math.cos(a), 0);
    const N = new Vector3(-Math.sin(d) * Math.cos(a), -Math.sin(d) * Math.sin(a), Math.cos(d));
    const pa = (data.paDeg * Math.PI) / 180;
    this.major.copy(N).multiplyScalar(Math.cos(pa)).addScaledVector(E, Math.sin(pa)).normalize();
    const B = N.clone().multiplyScalar(-Math.sin(pa)).addScaledVector(E, Math.cos(pa)).normalize();
    // a thin disk seen at inclination i has b/a = cos i (thickness ~0.12 keeps edge-on discs from vanishing)
    const cosI = Math.sqrt(Math.max(0, (this.ratio ** 2 - 0.12 ** 2) / (1 - 0.12 ** 2)));
    const sinI = Math.sqrt(1 - cosI * cosI);
    this.normal.copy(L).multiplyScalar(cosI).addScaledVector(B, sinI).normalize();
    this.minor.crossVectors(this.normal, this.major).normalize();
    let h = 0;
    for (const c of data.name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    this.seed = (h % 997) / 997;
  }

  get name(): string { return this.data.name; }

  /** Direction (from the centre) to arrive from: 35° off the disc axis, on the side facing `from`. */
  viewDir(from?: Vector3): Vector3 {
    const n = this.normal.clone();
    if (from && from.dot(n) < 0) n.negate();
    const side = this.minor.clone();
    if (from && from.dot(side) < 0) side.negate();
    const a = (35 * Math.PI) / 180;
    return n.multiplyScalar(Math.cos(a)).addScaledVector(side, Math.sin(a)).normalize();
  }

  info(): [string, string][] {
    const d = this.data;
    const mly = (d.distPc * PC) / LY / 1e6;
    const typeName: Record<GalaxyShape, string> = {
      spiral: 'Spiral galaxy', barred: 'Barred spiral galaxy', lenticular: 'Lenticular galaxy', elliptical: 'Elliptical galaxy',
      irregular: 'Irregular galaxy', dwarf: 'Dwarf galaxy',
    };
    return [
      ['Type', `${typeName[this.shape]}${d.morph ? ` (${d.morph})` : ''}`],
      ['Distance from Sun', mly < 1 ? `${Math.round(mly * 1000).toLocaleString()} thousand light years` : `${mly.toFixed(mly < 10 ? 2 : 1)} million light years`],
      ['Size', `about ${Math.round((2 * this.radius) / LY).toLocaleString()} light years across`],
      ['Size seen from Earth', `${d.majArcmin.toFixed(1)}′ × ${d.minArcmin.toFixed(1)}′`],
      ...(d.vmag !== null ? [['Magnitude (V)', d.vmag.toFixed(1)] as [string, string]] : []),
      ['Catalogue', `${d.simbad}; distance: median of ${d.nDist} measurements (SIMBAD)`],
      ['Look', 'procedural, from the catalogued type, size and orientation'],
    ];
  }
}

export async function loadGalaxies(base: string): Promise<Galaxy[]> {
  const j = await fetch(`${base}/galaxies.json`).then((r) => r.json()) as { galaxies: GalaxyData[] };
  return j.galaxies.map((g, i) => new Galaxy(g, i));
}
