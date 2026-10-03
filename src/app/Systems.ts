import { Vector3 } from 'three';
import { AU, DAY, PC, SUN_ABS_MAG, SUN_RADIUS } from '../core/units';
import { raDecToVector } from '../core/frames';
import { ALBEDO, classify, eqTemp, generatePlanets, hashKey, massFromRadius, PlanetarySystem, type PlanetSpec, REARTH, rng, starProps } from '../universe/Planets';
import { CatalogStar } from '../universe/Stars';

/** One system from public/data/exoplanets.json (pipeline/build_exoplanets.py). */
interface ArchiveSystem {
  host: string; ids: string[]; ra: number; dec: number; distPc: number;
  teff: number | null; radSun: number | null; massSun: number | null; spType: string; vmag: number | null; stars: number;
  planets: {
    name: string; aAU: number; periodDays: number; e: number; incDeg: number; omegaDeg: number | null; tTransit: number | null;
    radiusEarth: number; massEarth: number | null; eqTempK: number | null; insol: number | null; method: string; year: number; est: string[];
  }[];
}

const norm = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '').replace(/^gliese/, 'gj').replace(/centauri$/, 'cen');

/**
 * Planetary systems of the stars the explorer visits: real ones from the NASA Exoplanet Archive
 * (matched to catalogue stars by name/designation, or placed at the archive's position when the
 * catalogues lack the star), and a generated system for every other star.
 */
export class Systems {
  private archive: ArchiveSystem[] = [];
  private byName = new Map<string, number>();
  private systems = new Map<string, PlanetarySystem | null>();
  private hosts = new Map<number, CatalogStar>();
  loaded = false;

  async load(base: string): Promise<void> {
    const j = await fetch(`${base}/exoplanets.json`).then((r) => r.json()) as { systems: ArchiveSystem[] };
    this.archive = j.systems;
    this.archive.forEach((s, i) => {
      for (const n of [s.host, ...s.ids]) this.byName.set(norm(n), i);
    });
    this.loaded = true;
  }

  /** The archive system for a catalogue star, by any of its designations. */
  private archiveFor(star: CatalogStar): number | null {
    for (const d of star.designations) {
      const i = this.byName.get(norm(d));
      if (i !== undefined) return i;
    }
    return null;
  }

  /** The star of an archive system: catalogue copy if given, else a star built from archive data. */
  hostStar(i: number): CatalogStar {
    let h = this.hosts.get(i);
    if (h) return h;
    const s = this.archive[i];
    const pos = raDecToVector(s.ra, s.dec).multiplyScalar(s.distPc);
    const teff = s.teff ?? 5500;
    // absolute magnitude from V and distance, or from the radius and temperature
    const absMag = s.vmag !== null ? s.vmag - 5 * Math.log10(s.distPc) + 5
      : SUN_ABS_MAG - 5 * Math.log10((s.radSun ?? 1) * (teff / 5772) ** 2);
    h = new CatalogStar(`exohost:${i}`, pos, absMag, teff, s.spType, [s.host, ...s.ids], null);
    h.exact = true;
    this.hosts.set(i, h);
    return h;
  }

  private build(star: CatalogStar, ai: number | null): PlanetarySystem | null {
    if (ai !== null) {
      const s = this.archive[ai];
      const { mass } = starProps(star);
      const mstar = s.massSun ?? mass;
      const lum = 10 ** (-0.4 * (star.absMag - SUN_ABS_MAG));
      const los = star.upos.toVector3().normalize();
      const r = rng(hashKey(s.host));
      // node on the sky unknown: fixed per system; planets share it (near-coplanar systems)
      const node = r() * Math.PI * 2;
      const ref = Math.abs(los.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0);
      const u = new Vector3().crossVectors(los, ref).normalize().applyAxisAngle(los, node);
      const i0 = ((s.planets[0]?.incDeg ?? 90) * Math.PI) / 180;
      const normal = los.clone().multiplyScalar(Math.cos(i0)).addScaledVector(u, Math.sin(i0)).normalize();
      const specs: PlanetSpec[] = s.planets.map((p) => {
        const a = p.aAU * AU;
        const teq = p.eqTempK ?? eqTemp(lum, a);
        const type = classify(p.radiusEarth, teq, rng(hashKey(p.name)));
        const P = p.periodDays * DAY;
        const locked = a < 0.12 * AU * Math.cbrt(mstar);
        const rr = rng(hashKey(p.name + '/o'));
        // transit timing fixes the phase: at mid-transit the planet is between its star and the Sun
        let M0 = rr() * Math.PI * 2;
        if (p.tTransit) M0 = Math.PI / 2 - (2 * Math.PI * (p.tTransit - 2451545.0)) / p.periodDays;
        return {
          name: p.name, real: true, est: p.est, aM: a, e: p.e, inc: (((p.incDeg ?? 90) - (s.planets[0]?.incDeg ?? 90)) * Math.PI) / 180,
          node: 0, omega: ((p.omegaDeg ?? 90) * Math.PI) / 180, M0, periodS: P, radiusM: p.radiusEarth * REARTH,
          massKg: (p.massEarth ?? massFromRadius(p.radiusEarth)) * 5.9722e24, teqK: teq, type, albedo: ALBEDO[type],
          rings: (type === 'giant' || type === 'icegiant') && rr() < 0.25, seed: rr() * 1000, rotS: locked ? P : (8 + 40 * rr()) * 3600,
          method: p.method, year: p.year,
        } satisfies PlanetSpec;
      });
      return new PlanetarySystem(star, specs, true, normal);
    }
    const specs = generatePlanets(star);
    if (!specs.length) return null;
    const r = rng(hashKey(star.key + '/plane'));
    const z = 2 * r() - 1, ph = 2 * Math.PI * r();
    return new PlanetarySystem(star, specs, false, new Vector3(Math.sqrt(1 - z * z) * Math.cos(ph), Math.sqrt(1 - z * z) * Math.sin(ph), z));
  }

  /** The planetary system of `star` (cached; null if it has no planets). */
  of(star: CatalogStar): PlanetarySystem | null {
    if (this.systems.has(star.key)) return this.systems.get(star.key)!;
    if (star.radius < 0.02 * SUN_RADIUS && !this.loaded) return null;
    const ai = this.loaded ? this.archiveFor(star) : null;
    const sys = this.build(star, ai);
    if (this.systems.size > 300) this.systems.clear();
    this.systems.set(star.key, sys);
    return sys;
  }

  /** The archive system for an exoplanet host index. */
  archiveSystem(i: number): PlanetarySystem | null {
    return this.of(this.hostStar(i));
  }

  /** Search the confirmed exoplanets and their hosts. */
  search(q: string, score: (name: string) => number): { label: string; detail: string; id: string; score: number }[] {
    const out: { label: string; detail: string; id: string; score: number }[] = [];
    if (!this.loaded || q.length < 2) return out;
    this.archive.forEach((s, i) => {
      s.planets.forEach((p, k) => {
        const sc = score(p.name);
        if (sc >= 0) out.push({ label: p.name, detail: `exoplanet · ${(s.distPc * 3.2616).toFixed(0)} ly`, id: `xp:${i}:${k}`, score: sc + 0.15 });
      });
      const sh = score(s.host);
      if (sh >= 0) out.push({ label: s.host, detail: `star with ${s.planets.length} known planet${s.planets.length > 1 ? 's' : ''}`, id: `xh:${i}`, score: sh + 0.1 });
    });
    return out;
  }

  get archiveCount(): { systems: number; planets: number } {
    return { systems: this.archive.length, planets: this.archive.reduce((n, s) => n + s.planets.length, 0) };
  }

  /** Archive hosts within `rPc` of `camPc` (heliocentric pc). */
  hostsNear(camPc: Vector3, rPc: number): number[] {
    const out: number[] = [];
    const p = new Vector3();
    this.archive.forEach((s, i) => {
      if (Math.abs(s.distPc - camPc.length()) > rPc + 1) return;
      raDecToVector(s.ra, s.dec, p).multiplyScalar(s.distPc);
      if (p.distanceTo(camPc) < rPc) out.push(i);
    });
    return out;
  }
}

export const PCM = PC;
