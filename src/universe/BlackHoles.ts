import { Vector3 } from 'three';
import { PC, SUN_ABS_MAG, SUN_RADIUS, SUN_TEFF } from '../core/units';
import { UPos } from '../core/upos';
import type { SpaceObject } from './Body';
import { CatalogStar } from './Stars';

const G = 6.674e-11;
const MSUN = 1.98892e30;
const C = 299_792_458;
const DAY = 86_400;

interface CompanionData { spType: string; teff: number; massSun: number; radiusM: number; periodDays: number; sepM: number; incDeg: number }
interface BlackHoleData {
  name: string; aliases: string[]; kind: 'stellar' | 'supermassive'; raDeg: number; decDeg: number; distPc: number;
  massSun: number; companion?: CompanionData; diskOuterM?: number; ref: string;
}

/**
 * A real black hole (pipeline/build_blackholes.py: BlackCAT, SIMBAD, published masses).
 * `radius` is the Schwarzschild radius, so flight speed, picking and arrival scale with it.
 */
export class BlackHole implements SpaceObject {
  readonly kind = 'black hole';
  readonly key: string;
  readonly name: string;
  readonly upos: UPos;
  readonly radius: number;
  readonly parentObject = null;
  readonly massSun: number;
  readonly supermassive: boolean;
  /** unit normal of the accretion disk / binary orbit plane (world frame) */
  readonly diskNormal: Vector3;
  /** accretion disk outer radius (m); 0 = no disk (dormant) */
  readonly diskOuter: number;
  readonly companion: CatalogStar | null = null;
  readonly data: BlackHoleData;
  private orbitE1 = new Vector3();
  private orbitE2 = new Vector3();
  private sepCompanion = 0; // companion distance from the BH (m)

  constructor(index: number, d: BlackHoleData) {
    this.data = d;
    this.key = `bh:${index}`;
    this.name = d.name;
    this.massSun = d.massSun;
    this.supermassive = d.kind === 'supermassive';
    this.radius = (2 * G * d.massSun * MSUN) / (C * C);
    const ra = (d.raDeg * Math.PI) / 180, dec = (d.decDeg * Math.PI) / 180;
    const dir = new Vector3(Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec));
    const posPc = dir.clone().multiplyScalar(d.distPc);
    this.upos = UPos.from(posPc.x * PC, posPc.y * PC, posPc.z * PC);
    // Orbit / disk plane: inclined by i to the line of sight from the Sun (node unknown: fixed by name)
    const inc = ((d.companion?.incDeg ?? (this.supermassive ? (d.name.startsWith('M87') ? 17 : 30) : 60)) * Math.PI) / 180;
    const los = dir.clone();
    const ref = Math.abs(los.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0);
    const u = new Vector3().crossVectors(los, ref).normalize();
    const node = hash(d.name) * Math.PI * 2;
    u.applyAxisAngle(los, node);
    this.diskNormal = los.clone().multiplyScalar(Math.cos(inc)).addScaledVector(u, Math.sin(inc)).normalize();
    this.orbitE1.crossVectors(this.diskNormal, los).normalize();
    this.orbitE2.crossVectors(this.diskNormal, this.orbitE1).normalize();
    this.diskOuter = d.diskOuterM ?? (this.supermassive ? this.radius * 600 : 0);
    if (d.companion) {
      const c = d.companion;
      // V absolute magnitude consistent with the engine's radius estimate: R = Rsun (Tsun/T)^2 10^(-0.2 (M - Msun))
      const absMag = SUN_ABS_MAG - 5 * Math.log10((c.radiusM / SUN_RADIUS) * (c.teff / SUN_TEFF) ** 2);
      const name = `${d.name} companion`;
      this.companion = new CatalogStar(`${this.key}:c`, posPc.clone(), absMag, c.teff, c.spType, [name, ...d.aliases], null);
      this.companion.exact = true;
      // the BH and its companion orbit their barycentre; the BH is kept at the catalogue position
      this.sepCompanion = c.sepM;
    }
  }

  /** Place the companion on its circular orbit for Julian date `jd`. */
  update(jd: number): void {
    const c = this.data.companion;
    if (!c || !this.companion) return;
    const phase = (((jd - 2451545.0) * DAY) / (c.periodDays * DAY)) * Math.PI * 2 + hash(this.name + 'p') * Math.PI * 2;
    const off = this.orbitE1.clone().multiplyScalar(Math.cos(phase) * this.sepCompanion).addScaledVector(this.orbitE2, Math.sin(phase) * this.sepCompanion);
    this.companion.upos.copy(this.upos).addVec(off);
  }

  info(): [string, string][] {
    const d = this.data;
    const rows: [string, string][] = [
      ['Type', this.supermassive ? 'Supermassive black hole' : d.companion ? 'Stellar black hole (binary)' : 'Stellar black hole'],
      ['Mass', this.massSun >= 1e5 ? `${(this.massSun / 1e6).toLocaleString(undefined, { maximumFractionDigits: 3 })} million Suns` : `${this.massSun.toFixed(1)} Suns`],
      ['Event horizon', `${(this.radius / 1e3).toLocaleString(undefined, { maximumSignificantDigits: 4 })} km radius`],
      ['Distance from Sun', d.distPc > 1e5 ? `${(d.distPc / 1e6).toFixed(1)} Mpc` : `${Math.round(d.distPc * 3.2616).toLocaleString()} light years`],
    ];
    if (d.companion) {
      rows.push(['Companion', `${d.companion.spType || 'star'}, ${d.companion.massSun.toFixed(2)} Suns`]);
      rows.push(['Orbital period', d.companion.periodDays < 100 ? `${d.companion.periodDays.toFixed(2)} days` : `${(d.companion.periodDays / 365.25).toFixed(2)} years`]);
    }
    if (d.aliases.length) rows.push(['Also known as', d.aliases.join(', ')]);
    rows.push(['Data', d.ref]);
    return rows;
  }
}

export async function loadBlackHoles(base: string): Promise<BlackHole[]> {
  const j = await fetch(`${base}/blackholes.json`).then((r) => r.json()) as { blackholes: BlackHoleData[] };
  return j.blackholes.map((d, i) => new BlackHole(i, d));
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}
