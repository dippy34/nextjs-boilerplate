import { Matrix4, Vector3 } from 'three';
import type { RotationModel } from '../astro/rotation';
import { UPos } from '../core/upos';

export type BodyType = 'star' | 'planet' | 'dwarf' | 'moon' | 'asteroid' | 'tno' | 'comet';

/** Anything the camera can select, label and fly to. */
export interface SpaceObject {
  readonly key: string;
  readonly name: string;
  readonly kind: string;
  /** absolute position (updated every frame for moving objects) */
  readonly upos: UPos;
  /** mean radius in metres (0 if point-like / unknown) */
  readonly radius: number;
  /** body this object moves with (for co-moving camera), or null */
  readonly parentObject: SpaceObject | null;
  /** key/value rows for the info panel */
  info(): [string, string][];
}

export interface RingInfo {
  innerKm: number;
  outerKm: number;
  texture: string;
}

export class Body implements SpaceObject {
  readonly key: string;
  readonly kind: BodyType;
  parent: Body | null = null;
  children: Body[] = [];

  /** semi-axes (m): a (towards prime meridian), b, c (polar) */
  radii: [number, number, number] = [0, 0, 0];
  radius = 0;
  /** true when the radius is a procedural estimate (no measurement in the sources) */
  radiusEstimated = false;
  gm = 0; // m^3/s^2
  /** GM of the whole planetary system (planet + moons) when known */
  systemGm = 0;
  albedo = 0.3;
  texture: string | null = null;
  color: [number, number, number] = [0.6, 0.6, 0.6];
  rotation: RotationModel | null = null;
  rings: RingInfo | null = null;
  /** effective temperature for stars */
  teff = 0;
  absMag = 0;

  /** position relative to the Solar System barycentre (m, ICRF) */
  readonly pos = new Vector3();
  readonly vel = new Vector3(); // m/s
  readonly upos = new UPos();
  /** body-fixed -> ICRF rotation */
  readonly orientation = new Matrix4();
  /** set by the solar system each frame: false when the position could not be computed */
  valid = true;
  /** drawn by another layer (God mode's spawned planets and stars), not by the bodies layer */
  hidden = false;

  /** raw description from system.json (for the info panel) */
  meta: Record<string, unknown> = {};

  constructor(readonly id: number, readonly name: string, kind: BodyType) {
    this.kind = kind;
    this.key = `sol:${id}`;
  }

  get parentObject(): SpaceObject | null {
    return this.parent;
  }

  get isAirless(): boolean {
    return !['Earth', 'Venus', 'Mars', 'Titan', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Sun'].includes(this.name);
  }

  get isGasGiant(): boolean {
    return ['Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(this.name);
  }

  /** Sphere of influence radius (Laplace), used to decide which body the camera co-moves with. */
  soiRadius(): number {
    if (this.kind === 'star') return 1e14; // ~670 AU
    const p = this.parent;
    if (!p || !p.gm || !this.gm) return Math.max(this.radius * 20, 1e6);
    const d = this.pos.distanceTo(p.pos);
    return Math.max(d * Math.pow(this.gm / p.gm, 0.4), this.radius * 6);
  }

  info(): [string, string][] {
    const rows: [string, string][] = [];
    const typeNames: Record<BodyType, string> = {
      star: 'Star', planet: 'Planet', dwarf: 'Dwarf planet', moon: 'Moon', asteroid: 'Asteroid', tno: 'Trans-Neptunian object', comet: 'Comet',
    };
    rows.push(['Type', typeNames[this.kind] + (this.meta.orbitClass ? ` (${this.meta.orbitClass})` : '')]);
    if (this.parent && this.kind !== 'planet' && this.kind !== 'dwarf' && this.kind !== 'asteroid' && this.kind !== 'tno')
      rows.push(['Orbits', this.parent.name]);
    if (this.radius > 0) {
      const [a, b, c] = this.radii.map((r) => r / 1e3);
      const tri = Math.abs(a - c) / a > 0.002 ? ` (${a.toFixed(1)} × ${b.toFixed(1)} × ${c.toFixed(1)})` : '';
      rows.push(['Radius', `${(this.radius / 1e3).toLocaleString(undefined, { maximumFractionDigits: 1 })} km${tri}${this.radiusEstimated ? ' (estimated)' : ''}`]);
    }
    if (this.gm > 0) {
      const mass = this.gm / 6.6743e-11;
      rows.push(['Mass', `${mass.toExponential(4)} kg`]);
      if (this.radius > 0) {
        const g = this.gm / (this.radius * this.radius);
        rows.push(['Surface gravity', `${g.toPrecision(3)} m/s²`]);
        const vol = (4 / 3) * Math.PI * this.radii[0] * this.radii[1] * this.radii[2];
        rows.push(['Mean density', `${(mass / vol / 1000).toFixed(3)} g/cm³`]);
      }
    }
    if (this.teff) rows.push(['Temperature', `${this.teff.toLocaleString()} K`]);
    if (this.meta.spectralType) rows.push(['Spectral type', String(this.meta.spectralType)]);
    if (this.meta.albedo !== undefined) rows.push(['Geometric albedo', String(this.meta.albedo)]);
    if (this.meta.rotPeriodDays) rows.push(['Sidereal rotation', `${Number(this.meta.rotPeriodDays).toFixed(4)} d`]);
    if (this.meta.rotPeriodHours) rows.push(['Rotation period', `${Number(this.meta.rotPeriodHours).toFixed(3)} h`]);
    return rows;
  }
}
