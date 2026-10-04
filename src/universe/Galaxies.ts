import { Vector3 } from 'three';
import { raDecToVector } from '../core/frames';
import { LY, PC } from '../core/units';
import { UPos } from '../core/upos';
import type { SpaceObject } from './Body';

/** public/data/galaxies.json (pipeline/build_galaxies.py, SIMBAD). */
export interface GalaxyData {
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

/**
 * Measured disc inclinations (degrees) where the axis ratio misleads (a big bulge, a thick or
 * warped disc) or the near side matters: negative flips the near side. M31: 77°, its north-west
 * side nearer (the dust lanes cross the bulge there); NGC 891 and the Needle are edge-on; the
 * Sombrero is 6° from edge-on with its bulge making it look rounder.
 */
const INCLINATION: Record<string, number> = {
  'Andromeda Galaxy': -77, 'Triangulum Galaxy': 54, 'Whirlpool Galaxy': 22, 'NGC 891': 89.5, 'Needle Galaxy': 86.5,
  'Sombrero Galaxy': 84, 'Sculptor Galaxy': 78, 'NGC 4631': 85, 'NGC 55': 80, 'Pinwheel Galaxy': 18, 'M106': 68,
  "Bode's Galaxy": 59, 'Black Eye Galaxy': 60, 'Sunflower Galaxy': 58, 'M65': 76, 'M66': 65, 'NGC 1300': 50,
  'Large Magellanic Cloud': 34, 'Southern Pinwheel': 24, 'M74': 7, 'M100': 30, 'M94': 35, 'NGC 300': 40, 'IC 342': 31,
};

/** Inclination (degrees) of a thin disc with relative thickness 0.12 seen with axis ratio b/a. */
function inclinationFromRatio(ratio: number): number {
  const cosI = Math.sqrt(Math.max(0, (ratio ** 2 - 0.12 ** 2) / (1 - 0.12 ** 2)));
  return (Math.acos(Math.min(1, cosI)) * 180) / Math.PI;
}

/**
 * A disc's frame (ICRF unit vectors) from its sky position, position angle of the major axis and
 * inclination (degrees; negative puts the other side of the minor axis nearer to us).
 */
export function discFrame(raDeg: number, decDeg: number, paDeg: number, inclDeg: number): { major: Vector3; minor: Vector3; normal: Vector3 } {
  const L = raDecToVector(raDeg, decDeg);
  // sky basis at the galaxy: east and north
  const a = (raDeg * Math.PI) / 180, d = (decDeg * Math.PI) / 180;
  const E = new Vector3(-Math.sin(a), Math.cos(a), 0);
  const N = new Vector3(-Math.sin(d) * Math.cos(a), -Math.sin(d) * Math.sin(a), Math.cos(d));
  const pa = (paDeg * Math.PI) / 180;
  const major = N.clone().multiplyScalar(Math.cos(pa)).addScaledVector(E, Math.sin(pa)).normalize();
  const B = N.clone().multiplyScalar(-Math.sin(pa)).addScaledVector(E, Math.cos(pa)).normalize();
  const i = (inclDeg * Math.PI) / 180;
  const normal = L.clone().multiplyScalar(Math.cos(i)).addScaledVector(B, Math.sin(i)).normalize();
  if (normal.dot(L) < 0) normal.negate();
  const minor = new Vector3().crossVectors(normal, major).normalize();
  return { major, minor, normal };
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
    const incl = INCLINATION[data.name];
    const fr = discFrame(data.ra, data.dec, data.paDeg, incl ?? inclinationFromRatio(this.ratio));
    this.major.copy(fr.major); this.minor.copy(fr.minor); this.normal.copy(fr.normal);
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
