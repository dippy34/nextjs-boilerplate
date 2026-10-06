import { Vector3 } from 'three';
import { AU, DAY, formatDistance } from '../core/units';
import { UPos } from '../core/upos';
import type { Body, SpaceObject } from './Body';

/** public/data/spacecraft.json (pipeline/build_spacecraft.py, JPL Horizons). */
interface ProbeData { name: string; id: number; center: number; size: number; kind: string; about: string; jd: number[]; km: [number, number, number][] }
interface OrbiterData { name: string; id: number; size: number; kind: string; about: string; jd: number; e: number; i: number; node: number; w: number; M: number; a: number; nDegS: number }
export interface SpacecraftFile { probes: ProbeData[]; orbiters: OrbiterData[]; source: string }

const J2 = 1.08263e-3;
const RE_KM = 6378.137;
const DEG = Math.PI / 180;

/**
 * A real spacecraft at its real position: interpolated from JPL Horizons trajectories (probes),
 * or propagated from osculating elements with the Earth's J2 precession (ISS, Hubble).
 */
export class Spacecraft implements SpaceObject {
  readonly kind = 'spacecraft';
  readonly key: string;
  readonly upos = new UPos();
  /** velocity relative to the body it is reported around (m/s), world axes */
  readonly vel = new Vector3();
  readonly radius: number;
  /** false when the date is outside the trajectory's span */
  valid = false;
  private center: Body | null = null;

  constructor(readonly data: ProbeData | OrbiterData, readonly model: string, private sun: Body, private earth: Body) {
    this.key = `sc:${data.id}`;
    this.radius = data.size / 2;
  }

  get name(): string { return this.data.name; }
  get parentObject(): SpaceObject | null { return this.center; }
  get isOrbiter(): boolean { return !('km' in this.data); }

  update(jd: number): void {
    const d = this.data;
    if ('km' in d) {
      const n = d.jd.length;
      if (jd < d.jd[0] || jd > d.jd[n - 1]) { this.valid = false; return; }
      // cubic Hermite through the samples, with finite-difference tangents
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (d.jd[m] <= jd) lo = m; else hi = m; }
      const t0 = d.jd[lo], t1 = d.jd[hi], h = t1 - t0, s = (jd - t0) / h;
      const tan = (i: number, k: number) => {
        const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
        return ((d.km[b][k] - d.km[a][k]) / (d.jd[b] - d.jd[a])) * h;
      };
      const s2 = s * s, s3 = s2 * s;
      const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
      const p = [0, 0, 0], v = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        const m0 = tan(lo, k), m1 = tan(hi, k);
        p[k] = h00 * d.km[lo][k] + h10 * m0 + h01 * d.km[hi][k] + h11 * m1;
        v[k] = ((6 * s2 - 6 * s) * d.km[lo][k] + (3 * s2 - 4 * s + 1) * m0 + (-6 * s2 + 6 * s) * d.km[hi][k] + (3 * s2 - 2 * s) * m1) / (h * DAY);
      }
      this.vel.set(v[0] * 1e3, v[1] * 1e3, v[2] * 1e3);
      if (d.center === 399) {
        this.center = this.earth;
        this.upos.copy(this.earth.upos).addVec(new Vector3(p[0] * 1e3, p[1] * 1e3, p[2] * 1e3));
      } else {
        this.center = null;
        this.upos.set(p[0] * 1e3, p[1] * 1e3, p[2] * 1e3);
      }
      this.valid = true;
      return;
    }
    // Earth orbiter: Kepler orbit with secular J2 drift of the node and perigee
    const dt = (jd - d.jd) * DAY;
    const n = d.nDegS * DEG;
    const p = d.a * (1 - d.e * d.e);
    const k = 1.5 * n * J2 * (RE_KM / p) ** 2;
    const node = d.node * DEG - k * Math.cos(d.i * DEG) * dt;
    const w = d.w * DEG + 0.5 * k * (5 * Math.cos(d.i * DEG) ** 2 - 1) * dt;
    const M = d.M * DEG + n * dt;
    let E = M;
    for (let it = 0; it < 6; it++) E -= (E - d.e * Math.sin(E) - M) / (1 - d.e * Math.cos(E));
    const xo = d.a * (Math.cos(E) - d.e), yo = d.a * Math.sqrt(1 - d.e * d.e) * Math.sin(E);
    const r = Math.hypot(xo, yo);
    const vx = (-Math.sin(E) * n * d.a * d.a) / r, vy = (Math.sqrt(1 - d.e * d.e) * Math.cos(E) * n * d.a * d.a) / r;
    const rot = (x: number, y: number) => {
      const cw = Math.cos(w), sw = Math.sin(w), cn = Math.cos(node), sn = Math.sin(node), ci = Math.cos(d.i * DEG), si = Math.sin(d.i * DEG);
      const x1 = x * cw - y * sw, y1 = x * sw + y * cw;
      return new Vector3(x1 * cn - y1 * ci * sn, x1 * sn + y1 * ci * cn, y1 * si);
    };
    const pos = rot(xo, yo).multiplyScalar(1e3);
    this.vel.copy(rot(vx, vy)).multiplyScalar(1e3);
    this.center = this.earth;
    this.upos.copy(this.earth.upos).addVec(pos);
    this.valid = true;
  }

  info(): [string, string][] {
    const d = this.data;
    const rows: [string, string][] = [['Type', 'Spacecraft'], ['Mission', d.about]];
    if (!this.valid) {
      rows.push(['Position', 'no trajectory for this date']);
      return rows;
    }
    const rel = new Vector3();
    const dSun = this.upos.sub(this.sun.upos, rel).length();
    const dEarth = this.upos.sub(this.earth.upos, rel).length();
    if (this.center === this.earth) {
      rows.push(['Altitude', `${formatDistance(dEarth - this.earth.radius)} above Earth`]);
      rows.push(['Speed', `${(this.vel.length() / 1000).toFixed(2)} km/s (relative to Earth)`]);
    } else {
      rows.push(['From the Sun', `${(dSun / AU).toFixed(dSun > 10 * AU ? 1 : 3)} AU`]);
      rows.push(['From Earth', `${(dEarth / AU).toFixed(dEarth > 10 * AU ? 1 : 3)} AU (light takes ${formatLightTime(dEarth)})`]);
      rows.push(['Speed', `${(this.vel.length() / 1000).toFixed(1)} km/s (relative to the Solar System)`]);
    }
    rows.push(['Size', `${d.size} m across`]);
    rows.push(['Data', this.isOrbiter ? 'JPL Horizons orbital elements, propagated (approximate)' : 'JPL Horizons trajectory']);
    return rows;
  }
}

function formatLightTime(m: number): string {
  const s = m / 299792458;
  if (s < 120) return `${s.toFixed(1)} s`;
  if (s < 7200) return `${(s / 60).toFixed(1)} min`;
  return `${(s / 3600).toFixed(1)} h`;
}

export async function loadSpacecraft(base: string, sun: Body, earth: Body): Promise<Spacecraft[]> {
  const j = await fetch(`${base}/spacecraft.json`).then((r) => r.json()) as SpacecraftFile;
  return [...j.probes, ...j.orbiters].map((d) => new Spacecraft(d, d.kind, sun, earth));
}
