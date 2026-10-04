import { Vector3 } from 'three';
import { raDecToVector } from '../core/frames';
import { formatDistance, PC, SUN_ABS_MAG, SUN_RADIUS, SUN_TEFF } from '../core/units';
import { BlackHole } from './BlackHoles';
import type { SpaceObject } from './Body';
import { CatalogSearch, type CatalogHit, type CatalogRecord, type CatCode } from './CatalogSearch';
import { DeepSkyObject } from './DeepSky';
import { Galaxy } from './Galaxies';
import { CatalogStar } from './Stars';

/**
 * The catalogue of ~200,000 real objects (public/data/catalog, pipeline/build_catalog.py) as
 * destinations: search results, VR browsing lists and selectable objects with info cards. Each
 * record becomes the engine's own kind of object, so the existing layers draw it when near:
 * stars, white and brown dwarfs and planet hosts are CatalogStars; X-ray binaries with a black
 * hole and quasars are BlackHoles (handed to the black-hole layer); galaxies, clusters and nebulae
 * are Galaxy / DeepSkyObject (handed to their layers). Pulsars are points with an info card.
 * Ids: `cat:<category>:<row>`.
 */

type BlackHoleData = ConstructorParameters<typeof BlackHole>[1];
type GalaxyData = ConstructorParameters<typeof Galaxy>[0];
type DeepSkyData = ConstructorParameters<typeof DeepSkyObject>[0];

/** What the app provides: adding objects to its layers, and its own copy of an object if it has one. */
export interface CatalogHost {
  addBlackHole(d: BlackHoleData): BlackHole;
  addGalaxy(d: GalaxyData, make: (d: GalaxyData, index: number) => Galaxy): Galaxy;
  addDeepSky(d: DeepSkyData, make: (d: DeepSkyData, index: number) => DeepSkyObject): DeepSkyObject;
  /** an object the app already has under one of these names (curated galaxies, nebulae, holes, named stars) */
  existing(names: string[]): SpaceObject | null;
}

const KIND_LABEL: Record<CatCode, string> = {
  s: 'star', w: 'white dwarf', d: 'brown dwarf', p: 'pulsar', t: 'TESS planet host', x: 'X-ray binary', q: 'quasar',
  g: 'galaxy', c: 'star cluster', n: 'nebula',
};
const FLAG_NOTE: Record<string, string> = { m: '', e: ' (estimated)', z: ' (from redshift)' };

const num = (s: string | undefined): number | null => {
  if (s === undefined || s === '') return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
};
const names = (r: CatalogRecord): string[] => [r.name, ...(r.aliases ? r.aliases.split('|') : [])];
const fmt = (v: number, d = 3) => v.toPrecision(d);

/** Teff (K) for a spectral type letter (rough MK scale; used only where a catalogue gives no Teff) */
function teffOfType(sp: string): number {
  const m = /([OBAFGKMLTY])\s*(\d(\.\d)?)?/.exec(sp || '');
  if (!m) return 5000;
  const base: Record<string, [number, number]> = { O: [45000, 31000], B: [30000, 10500], A: [9800, 7400], F: [7200, 6000], G: [5900, 5300],
    K: [5200, 3900], M: [3800, 2400], L: [2300, 1350], T: [1300, 600], Y: [550, 300] };
  const [a, b] = base[m[1]];
  const sub = m[2] ? Number(m[2]) : 5;
  return a + ((b - a) * sub) / 10;
}
/** V absolute magnitude giving radius R (R☉) at Teff in the engine's radius estimate (no bolometric correction) */
const absMagFor = (rSun: number, teff: number) => SUN_ABS_MAG - 5 * Math.log10(rSun * (teff / SUN_TEFF) ** 2);

/** B-V colour index -> Teff (Ballesteros 2012), as the star pipeline does */
const teffOfBV = (bv: number) => {
  const x = Math.min(2, Math.max(-0.4, bv));
  return 4600 * (1 / (0.92 * x + 1.7) + 1 / (0.92 * x + 0.62));
};

/** A catalogue star with its own type and rows on the info card. */
class CatalogEntryStar extends CatalogStar {
  /** `own`: the card's rows instead of the star rows (pulsars) */
  constructor(key: string, posPc: Vector3, absMag: number, teff: number, spect: string, nm: string[],
              private type: string, private extra: [string, string][], private own = false) {
    super(key, posPc, absMag, teff, spect, nm, null);
    this.exact = true;
  }

  info(): [string, string][] {
    if (this.own) return [['Type', this.type], ...this.extra];
    const rows = super.info();
    rows[0] = ['Type', this.type];
    return [...rows, ...this.extra];
  }
}

export class Catalog {
  readonly search: CatalogSearch;
  /** called when results or browse lists that were loading are ready */
  onUpdate: (() => void) | null = null;
  private objects = new Map<string, SpaceObject>();
  /** star-like objects made so far (drawn by the near-star layer when close: see nearStars) */
  private stars: CatalogStar[] = [];
  private cache = new Map<string, { label: string; detail: string; id: string }[]>();
  private pending = new Set<string>();
  private lastQuery = '';

  constructor(base: string, private host: CatalogHost, fetchFn?: ConstructorParameters<typeof CatalogSearch>[1]) {
    this.search = new CatalogSearch(base, fetchFn);
  }

  /** count of objects (0 until the manifest loads) */
  get count(): number { return this.search.manifest?.objects ?? 0; }

  /**
   * Search results for `q` if ready (their records loaded, so picking is instant); otherwise
   * starts the search, returns nothing yet, and calls onUpdate when the results are in.
   */
  find(q: string): { label: string; detail: string; id: string }[] {
    const k = q.trim().toLowerCase();
    const r = this.cache.get(k);
    if (r) return r;
    this.lastQuery = k;
    if (!this.pending.has(k)) {
      this.pending.add(k);
      void this.search.query(k, 14).then(async (hits) => {
        await this.search.ensure(hits);
        this.cache.set(k, hits.map((h) => this.item(h)).filter((x): x is NonNullable<typeof x> => !!x));
        if (this.cache.size > 200) this.cache.delete(this.cache.keys().next().value!);
        this.pending.delete(k);
        if (k === this.lastQuery) this.onUpdate?.();
      }).catch(() => this.pending.delete(k));
    }
    return [];
  }

  private item(h: CatalogHit): { label: string; detail: string; id: string } | null {
    const r = this.search.record(h.code, h.row);
    if (!r) return null;
    const label = h.label;
    const other = label === r.name ? '' : ` · ${r.name}`;
    return { label, detail: `${this.detail(h.code, r)}${other}`, id: `cat:${h.code}:${h.row}` };
  }

  /** One-line description for lists. */
  detail(code: CatCode, r: CatalogRecord): string {
    const d = num(r.distPc) ?? 0;
    const dist = `${formatDistance(d * PC)}${FLAG_NOTE[r.distFlag] ?? ''}`;
    switch (code) {
      case 's': return `star${r.spect ? ` ${r.spect}` : ''} · ${dist}`;
      case 'w': return `white dwarf · ${dist}`;
      case 'd': return `brown dwarf${r.spt ? ` ${r.spt}` : ''} · ${dist}`;
      case 'p': return `pulsar · ${num(r.periodS) !== null ? `${fmt(num(r.periodS)!)} s period · ` : ''}${dist}`;
      case 't': return `star with ${r.planets.split(';').length} TESS planet candidate${r.planets.includes(';') ? 's' : ''} · ${dist}`;
      case 'x': return `${r.class} X-ray binary${r.blackHole === '2' ? ' with a black hole' : r.blackHole === '1' ? ' (black hole candidate)' : ''} · ${dist}`;
      case 'q': return `quasar, black hole ${fmt(10 ** (num(r.logMassSun) ?? 8) / 1e6, 2)} million Suns · z = ${r.z}`;
      case 'g': return `galaxy${r.morph ? ` (${r.morph})` : ''} · ${dist}`;
      case 'c': return `${r.type === 'g' ? 'globular cluster' : r.type === 'm' ? 'moving group' : 'open cluster'}${r.members ? ` · ${r.members} member stars` : ''} · ${dist}`;
      case 'n': return `${r.kind === 'planetary' ? 'planetary nebula' : r.kind === 'snr' ? 'supernova remnant' : 'H II region'} · ${dist}`;
    }
    return dist;
  }

  /** The object for a `cat:` id whose record has loaded (see find/featured), else null. */
  resolve(id: string): SpaceObject | null {
    const [, code, rowS] = id.split(':');
    const row = Number(rowS);
    const key = `cat:${code}:${row}`;
    const have = this.objects.get(key);
    if (have) return have;
    const r = this.search.record(code as CatCode, row);
    if (!r) return null;
    const o = this.host.existing(names(r)) ?? this.make(code as CatCode, row, r);
    if (o) this.objects.set(key, o);
    if (o instanceof CatalogEntryStar) this.stars.push(o);
    return o;
  }

  /** Catalogue stars made so far within `radiusPc` of `camPc` (pc), for the near-star layer. */
  nearStars(camPc: Vector3, radiusPc: number): CatalogStar[] {
    return this.stars.filter((s) => s.posPc.distanceTo(camPc) < radiusPc);
  }

  /**
   * Notable objects of a category for browsing (null while loading: onUpdate fires when ready).
   * `page` of `per` items.
   */
  featured(code: CatCode, page = 0, per = 12): SpaceObject[] | null {
    const c = this.search.manifest?.categories[code];
    if (!c) { void this.search.load().then(() => this.onUpdate?.()); return null; }
    const rows = c.featured.slice(page * per, page * per + per);
    const items = rows.map((row) => ({ code, row }));
    if (items.some((it) => !this.search.record(it.code, it.row))) {
      void this.search.ensure(items).then(() => this.onUpdate?.());
      return null;
    }
    return rows.map((row) => this.resolve(`cat:${code}:${row}`)).filter((o): o is SpaceObject => !!o);
  }

  // ------------------------------------------------------------------ objects
  private make(code: CatCode, row: number, r: CatalogRecord): SpaceObject | null {
    const key = `cat:${code}:${row}`;
    const ra = Number(r.ra), dec = Number(r.dec), dist = Number(r.distPc);
    const pos = raDecToVector(ra, dec).multiplyScalar(dist);
    const nm = names(r);
    const cat = this.search.manifest!.categories[code];
    const distRow: [string, string] = ['Distance', r.distFlag === 'm' ? 'measured' : r.distFlag === 'z' ? 'from the redshift (Planck 2018 cosmology, comoving)' : 'estimated (model-based, uncertain)'];
    const source: [string, string] = ['Catalogue', cat.credit];
    switch (code) {
      case 's': {
        const absMag = num(r.absMag) ?? 4.8;
        const ci = num(r.ci);
        const teff = ci !== null ? teffOfBV(ci) : teffOfType(r.spect);
        const v = num(r.vmag);
        return new CatalogEntryStar(key, pos, absMag, teff, r.spect, nm, 'Star', [
          ...(v !== null ? [['Apparent mag (V)', v.toFixed(2)] as [string, string]] : []), distRow, source]);
      }
      case 'w': {
        const teff = num(r.teff) ?? 8000;
        const m = num(r.massSun);
        // white-dwarf radius from its mass (Nauenberg 1972 mass-radius relation)
        const mu = (m ?? 0.6) / 1.44;
        const rSun = 0.0126 * Math.sqrt(Math.max(1e-4, mu ** (-2 / 3) - mu ** (2 / 3)));
        return new CatalogEntryStar(key, pos, absMagFor(rSun, teff), teff, 'D', nm, 'White dwarf (the exposed core of a dead Sun-like star)', [
          ...(m !== null ? [['Mass', `${m.toFixed(2)} M☉ (from Gaia photometry, hydrogen atmosphere)`] as [string, string]] : []),
          ['Radius', `${(rSun * SUN_RADIUS / 1e3).toFixed(0)} km (from the mass, Nauenberg 1972)`], distRow, source]);
      }
      case 'd': {
        const teff = num(r.teff) ?? teffOfType(r.spt);
        return new CatalogEntryStar(key, pos, absMagFor(0.1, teff), teff, r.spt, nm, `Brown dwarf (${r.spt || 'L/T/Y'}): too light to fuse hydrogen`, [
          ['Radius', 'about 0.1 R☉ (assumed, Jupiter-sized)'], distRow, source]);
      }
      case 't': {
        const teff = num(r.teff) ?? 5500;
        const rad = num(r.radSun) ?? 1;
        const pl = r.planets.split(';').map((p) => {
          const [n, per, rp, teq, disp] = p.split(':');
          const dispName: Record<string, string> = { PC: 'candidate', APC: 'ambiguous candidate', CP: 'confirmed', KP: 'known planet' };
          return `${n}: ${per ? `${Number(per).toFixed(2)} d` : '?'}, ${rp ? `${Number(rp).toFixed(1)} R⊕` : '?'}${teq ? `, ${teq} K` : ''} (${dispName[disp] ?? disp})`;
        });
        return new CatalogEntryStar(key, pos, absMagFor(rad, teff), teff, '', nm, 'Star with TESS planet candidates', [
          ['TESS objects of interest', pl.slice(0, 4).join('; ') + (pl.length > 4 ? ` and ${pl.length - 4} more` : '')], distRow, source]);
      }
      case 'x': {
        const bh = Number(r.blackHole) > 0;
        const hmxb = r.class === 'HMXB';
        if (bh) {
          const mx = num(r.massSun);
          const porb = num(r.porbDays);
          const m2 = hmxb ? 15 : 0.7;
          const m1 = mx ?? 8;
          let companion: BlackHoleData['companion'];
          let diskOuterM: number | undefined;
          if (porb) {
            // Kepler's third law for the separation; the donor fills its Roche lobe (Eggleton 1983)
            const a = Math.cbrt((6.674e-11 * (m1 + m2) * 1.98892e30 * (porb * 86400) ** 2) / (4 * Math.PI * Math.PI));
            const lobe = (q: number) => (0.49 * q ** (2 / 3)) / (0.6 * q ** (2 / 3) + Math.log(1 + q ** (1 / 3)));
            const teff = teffOfType(r.spType || (hmxb ? 'B0' : 'K5'));
            companion = { spType: r.spType || (hmxb ? 'O/B' : 'K/M'), teff, massSun: m2, radiusM: lobe(m2 / m1) * a, periodDays: porb, sepM: a, incDeg: 60 };
            diskOuterM = 0.7 * lobe(m1 / m2) * a;
          }
          return this.host.addBlackHole({
            name: r.name, aliases: nm.slice(1), kind: 'stellar', raDeg: ra, decDeg: dec, distPc: dist, massSun: m1, companion, diskOuterM,
            ref: `${cat.credit}${mx === null ? '; mass not measured: 8 M☉ assumed' : ''}${porb ? '; companion mass assumed, orbit from the period' : ''}; distance estimated`,
          });
        }
        const teff = teffOfType(r.spType || (hmxb ? 'B0' : 'K5'));
        return new CatalogEntryStar(key, pos, absMagFor(hmxb ? 8 : 0.7, teff), teff, r.spType, nm,
          `${hmxb ? 'High' : 'Low'}-mass X-ray binary: a neutron star or black hole feeding on this star`, [
            ['X-ray type', r.xrayType || '—'], ...(num(r.porbDays) !== null ? [['Orbital period', `${num(r.porbDays)!.toPrecision(3)} days`] as [string, string]] : []),
            ['Radius', 'assumed for the type (not measured)'], distRow, source]);
      }
      case 'q': {
        const mass = 10 ** (num(r.logMassSun) ?? 8);
        return this.host.addBlackHole({
          name: r.name, aliases: [`quasar, z = ${r.z}`], kind: 'supermassive', raDeg: ra, decDeg: dec, distPc: dist, massSun: mass,
          ref: `${cat.credit}: virial mass ±0.4 dex; comoving distance from z = ${r.z} (Planck 2018)`,
        });
      }
      case 'g': {
        const maj = num(r.majArcmin) ?? (Math.atan(15000 / dist) * 180 * 60) / Math.PI;
        const d: GalaxyData = {
          name: r.name, simbad: nm.find((n) => /^(NGC|IC|PGC|UGC) /.test(n)) ?? r.name, ra, dec, distPc: dist, nDist: 1,
          majArcmin: maj, minArcmin: num(r.minArcmin) ?? maj * 0.6, paDeg: num(r.paDeg) ?? 0, morph: r.morph || '', otype: 'G',
          vmag: num(r.bmag),
        };
        const note = `${cat.credit.split(';')[0]}; distance: ${r.method}${r.distFlag === 'z' ? ' (from the redshift)' : ''}${num(r.majArcmin) === null ? '; size assumed (30,000 ly)' : ''}`;
        return this.host.addGalaxy(d, (dd, i) => {
          const gx = new Galaxy(dd, i);
          const base = gx.info.bind(gx);
          gx.info = () => base().map(([k, v]) => (k === 'Catalogue' ? [k, `${nm.slice(0, 4).join(', ')} — ${note}`] : [k, v]) as [string, string]);
          return gx;
        });
      }
      case 'c': case 'n': {
        const kind: DeepSkyData['kind'] = code === 'c' ? (r.type === 'g' ? 'globular' : 'open')
          : r.kind === 'planetary' ? 'planetary' : r.kind === 'snr' ? 'snr' : 'emission';
        const maj = code === 'c' ? 2 * 60 * (num(r.r50Deg) ?? (Math.atan(5 / dist) * 180) / Math.PI)
          : num(r.majArcmin) ?? (kind === 'planetary' ? (Math.atan(0.3 / dist) * 180 * 60) / Math.PI : (Math.atan(10 / dist) * 180 * 60) / Math.PI);
        const d: DeepSkyData = {
          name: r.name, simbad: nm[1] ?? r.name, kind, otype: '', ra, dec, distPc: dist, nDist: 1, notes: [],
          majArcmin: maj, minArcmin: num(r.minArcmin) ?? maj, paDeg: 0, vmag: null,
        };
        const extra: [string, string][] = code === 'c'
          ? [['Member stars', r.members || '—'], ...(num(r.logAge) !== null ? [['Age', `${fmt(10 ** num(r.logAge)! / 1e6, 2)} million years`] as [string, string]] : [])]
          : r.note ? [['Class', r.note]] : [];
        return this.host.addDeepSky(d, (dd, i) => {
          const o = new DeepSkyObject(dd, i);
          const base = o.info.bind(o);
          o.info = () => [...base().map(([k, v]) => (k === 'Catalogue' ? [k, `${nm.slice(0, 4).join(', ')} — ${cat.credit.split(';')[0]}`] : [k, v]) as [string, string]),
            ...extra, distRow];
          return o;
        });
      }
      case 'p': {
        const p0 = num(r.periodS);
        // a neutron star: 12 km radius, surface ~500,000 K (typical; not measured for most)
        const teff = 5e5;
        return new CatalogEntryStar(key, pos, absMagFor(12e3 / SUN_RADIUS, teff), teff, '', nm, `Pulsar (a spinning neutron star)${r.type ? `, ${r.type}` : ''}`, [
          ...(p0 !== null ? [['Spin period', p0 < 0.1 ? `${(p0 * 1e3).toPrecision(4)} ms (${(1 / p0).toPrecision(4)} turns a second)` : `${p0.toPrecision(4)} s`] as [string, string]] : []),
          ...(r.dm ? [['Dispersion measure', `${r.dm} pc cm⁻³`] as [string, string]] : []),
          ...(r.binary ? [['Binary', `yes (${r.binary} orbit model)`] as [string, string]] : []),
          ...(r.assoc ? [['Associations', r.assoc.replace(/,/g, ', ')] as [string, string]] : []),
          ['Distance from Sun', `${formatDistance(dist * PC)}${FLAG_NOTE[r.distFlag] ?? ''}`],
          ...(nm.length > 1 ? [['Designations', nm.slice(1, 4).join(', ')] as [string, string]] : []),
          ['Look', 'a ball 24 km across at ~500,000 K (assumed; beams and magnetosphere not drawn)'], source], true);
      }
    }
    return null;
  }

  /** a short type label of a category (VR menu subtitles) */
  static kindLabel(code: CatCode): string { return KIND_LABEL[code]; }
}

