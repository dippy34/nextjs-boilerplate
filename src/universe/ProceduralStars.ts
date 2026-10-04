import { Vector3 } from 'three';
import { GALAXY, extinction, populations } from './Galaxy';

/**
 * Procedural stars filling the Milky Way beyond the star catalogues.
 *
 * Stars are generated per (magnitude band, cell): band k holds absolute V magnitudes
 * [M_k, M_k + 1) and uses cubic cells (galactocentric grid) sized so that a band-k star in a cell
 * farther than ~2.5 cells away is fainter than GEN_MAG — the cells needed around the explorer
 * are then a small, constant number per band, and the brightest stars are generated first.
 * Expected counts come from a local luminosity function times the galaxy model's density; every
 * random choice comes from a hash of the cell's coordinates, so a star is always the same star.
 *
 * Stars that a catalogue already contains are not generated: anything within 100 pc of the Sun
 * (Gaia DR3 supplement) or brighter than V = 11 as seen from the Sun (AT-HYG: Tycho-2/Hipparcos
 * completeness), allowing for dust on the way.
 */
export const GEN_MAG = 10;
const CAT_MAG = 11;
const CAT_RADIUS = 100;
/** stars per cell beyond this are left to the glow */
const CELL_CAP = 12000;

interface StarClass { f: number; t0: number; t1: number; sp: string; young: boolean }
interface Band { M: number; phi: number; young: number; classes: StarClass[] }

const cls = (f: number, t0: number, t1: number, sp: string, young = false): StarClass => ({ f, t0, t1, sp, young });

/**
 * Local luminosity function, stars per pc³ per magnitude in V, with the fraction belonging to the
 * young (arm-tracing) population and the spectral mix. Rounded values of the usual local
 * luminosity function (e.g. Bahcall & Soneira 1980; Reid, Gizis & Hawley 2002 for the faint end).
 */
export const BANDS: Band[] = [
  { M: -9, phi: 6e-11, young: 0.9, classes: [cls(0.6, 18000, 35000, 'B Ia', true), cls(0.25, 3500, 4200, 'M Ia'), cls(0.15, 6000, 9000, 'F Ia', true)] },
  { M: -8, phi: 3e-10, young: 0.9, classes: [cls(0.6, 16000, 35000, 'B Ia', true), cls(0.25, 3500, 4200, 'M Ia'), cls(0.15, 6000, 9000, 'A Ia', true)] },
  { M: -7, phi: 1.5e-9, young: 0.85, classes: [cls(0.65, 15000, 40000, 'O/B', true), cls(0.25, 3500, 4300, 'M I'), cls(0.1, 6000, 9000, 'F I', true)] },
  { M: -6, phi: 5e-9, young: 0.85, classes: [cls(0.7, 15000, 40000, 'O/B', true), cls(0.25, 3600, 4400, 'K/M I'), cls(0.05, 6000, 9000, 'F I', true)] },
  { M: -5, phi: 1.5e-8, young: 0.8, classes: [cls(0.7, 14000, 30000, 'B', true), cls(0.3, 3700, 4500, 'K/M II')] },
  { M: -4, phi: 5e-8, young: 0.75, classes: [cls(0.7, 13000, 25000, 'B', true), cls(0.3, 3800, 4500, 'K/M III')] },
  { M: -3, phi: 1.5e-7, young: 0.65, classes: [cls(0.65, 12000, 22000, 'B', true), cls(0.35, 3800, 4500, 'M III')] },
  { M: -2, phi: 5e-7, young: 0.5, classes: [cls(0.55, 11000, 18000, 'B', true), cls(0.45, 3900, 4600, 'K/M III')] },
  { M: -1, phi: 2e-6, young: 0.4, classes: [cls(0.45, 10000, 14000, 'B', true), cls(0.55, 4000, 4700, 'K III')] },
  { M: 0, phi: 1.5e-5, young: 0.25, classes: [cls(0.3, 8500, 11000, 'A', true), cls(0.7, 4500, 4950, 'K III (clump)')] },
  { M: 1, phi: 4e-5, young: 0.3, classes: [cls(0.5, 7500, 9500, 'A', true), cls(0.5, 4600, 5100, 'G/K III')] },
  { M: 2, phi: 1e-4, young: 0.25, classes: [cls(0.65, 6800, 8500, 'A/F', true), cls(0.35, 5000, 5800, 'G IV')] },
  { M: 3, phi: 2.5e-4, young: 0.15, classes: [cls(1, 6200, 7000, 'F V')] },
  { M: 4, phi: 6e-4, young: 0.1, classes: [cls(1, 5800, 6400, 'F/G V')] },
  { M: 5, phi: 1.2e-3, young: 0.05, classes: [cls(1, 5300, 5900, 'G V')] },
  { M: 6, phi: 1.8e-3, young: 0.05, classes: [cls(1, 4800, 5400, 'K V')] },
  { M: 7, phi: 2.3e-3, young: 0.05, classes: [cls(1, 4300, 4900, 'K V')] },
  { M: 8, phi: 3e-3, young: 0.05, classes: [cls(1, 3900, 4400, 'K/M V')] },
  { M: 9, phi: 4e-3, young: 0.05, classes: [cls(1, 3600, 3950, 'M V')] },
  { M: 10, phi: 5e-3, young: 0.05, classes: [cls(1, 3300, 3650, 'M V')] },
  { M: 11, phi: 6e-3, young: 0.05, classes: [cls(1, 3100, 3400, 'M V')] },
  { M: 12, phi: 7e-3, young: 0.05, classes: [cls(1, 2900, 3200, 'M V')] },
];

/** distance (pc) at which a band-k star of the band's brightest magnitude has apparent magnitude m */
export const reach = (M: number, m: number) => 10 ** ((m - M + 5) / 5);
export const cellSize = (k: number) => reach(BANDS[k].M, GEN_MAG) / 2.5;

export interface StarCell {
  key: string;
  band: number;
  ix: number; iy: number; iz: number;
  /** cell centre, ICRF heliocentric pc */
  centre: Vector3;
  size: number;
  count: number;
  /** ICRF pc relative to the centre */
  pos: Float32Array;
  absMag: Float32Array;
  teff: Float32Array;
  cls: Uint8Array;
}

const SUN_POP = populations(GALAXY.sun.clone());
const YOUNG_SUN = SUN_POP.young;
const OLD_SUN = SUN_POP.thin + SUN_POP.thick + SUN_POP.bulge + SUN_POP.nsc;

/** small fast deterministic RNG (mulberry32) seeded from the cell */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cellSeed(k: number, ix: number, iy: number, iz: number): number {
  let h = 2166136261 ^ (k * 374761393);
  for (const v of [ix, iy, iz]) {
    h = Math.imul(h ^ (v & 0xffff), 16777619);
    h = Math.imul(h ^ ((v >>> 16) & 0xffff), 16777619);
  }
  return h >>> 0;
}

function poisson(mu: number, r: () => number): number {
  if (mu > 40) return Math.max(0, Math.round(mu + Math.sqrt(mu) * gauss(r)));
  const L = Math.exp(-mu);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L);
  return k - 1;
}
function gauss(r: () => number): number {
  return Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
}

/** ∫ exp(-|z|/h) dz over [z0, z1] */
function zInt(z0: number, z1: number, h: number): number {
  if (z0 >= 0) return h * (Math.exp(-z0 / h) - Math.exp(-z1 / h));
  if (z1 <= 0) return h * (Math.exp(z1 / h) - Math.exp(z0 / h));
  return h * (2 - Math.exp(z0 / h) - Math.exp(-z1 / h));
}

/** z in [z0, z1] drawn from the density exp(-|z|/h) */
function zSample(z0: number, z1: number, h: number, u: number): number {
  let x = u * zInt(z0, z1, h);
  if (z0 < 0) {
    const neg = zInt(z0, Math.min(z1, 0), h);
    if (x < neg) return Math.min(h * Math.log(x / h + Math.exp(z0 / h)), 0);
    x -= neg;
  }
  const a = Math.max(z0, 0);
  return Math.min(-h * Math.log(Math.max(Math.exp(-a / h) - x / h, 1e-300)), z1);
}

const H = { thin: 260, young: 90, thick: 900 };
type Comp = 'young' | 'thin' | 'thick' | 'bulge' | 'nsc';

/**
 * The nuclear star cluster is far smaller than the cells of most bands: it is sampled from its own
 * radial profile (table of the cumulative ∫ρ 4πr² dr, relative units) in the cell holding Sgr A*.
 */
const NSC_SMALL_CELL = 100;
const NSC_TABLE = (() => {
  const rs: number[] = [0], cum: number[] = [0];
  const pop = { thin: 0, young: 0, thick: 0, bulge: 0, nsc: 0, dust: 0 };
  const p = new Vector3();
  let acc = 0;
  for (let i = 1; i <= 400; i++) {
    const r0 = 0.01 * 1.025 ** (i - 1), r1 = 0.01 * 1.025 ** i;
    const rm = 0.5 * (r0 + r1);
    populations(p.set(rm, 0, 0), pop);
    acc += pop.nsc * 4 * Math.PI * rm * rm * (r1 - r0);
    rs.push(r1);
    cum.push(acc);
  }
  return { rs, cum, total: acc };
})();

function nscRadius(u: number): number {
  const x = u * NSC_TABLE.total;
  const c = NSC_TABLE.cum;
  let i = 1;
  while (i < c.length - 1 && c[i] < x) i++;
  const f = (x - c[i - 1]) / Math.max(c[i] - c[i - 1], 1e-30);
  return NSC_TABLE.rs[i - 1] + f * (NSC_TABLE.rs[i] - NSC_TABLE.rs[i - 1]);
}

/** Generate the stars of one cell (deterministic). */
export function generateCell(k: number, ix: number, iy: number, iz: number): StarCell {
  const band = BANDS[k];
  const S = cellSize(k);
  const lo = new Vector3(ix * S, iy * S, iz * S);
  const z0 = lo.z, z1 = lo.z + S;
  const centreGal = lo.clone().addScalar(S / 2);
  const r = rng(cellSeed(k, ix, iy, iz));
  // Integrals of each component over the cell: exact in z for the exponential disks, a 5x5 grid in
  // x, y (and 6 levels in z for the bulge and nucleus).
  const N = 5, NZ = 6;
  const p = new Vector3();
  const pop = { thin: 0, young: 0, thick: 0, bulge: 0, nsc: 0, dust: 0 };
  const I = { young: 0, thin: 0, thick: 0, bulge: 0 };
  const fmax = { young: 0, thin: 0, thick: 0, bulge: 0 };
  const zy = zInt(z0, z1, H.young), zt = zInt(z0, z1, H.thin), zk = zInt(z0, z1, H.thick);
  const dA = (S / N) ** 2;
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    p.set(lo.x + ((a + 0.5) / N) * S, lo.y + ((b + 0.5) / N) * S, 0);
    populations(p, pop);
    I.young += pop.young * zy * dA; fmax.young = Math.max(fmax.young, pop.young);
    I.thin += pop.thin * zt * dA; fmax.thin = Math.max(fmax.thin, pop.thin);
    I.thick += pop.thick * zk * dA; fmax.thick = Math.max(fmax.thick, pop.thick);
    for (let c = 0; c < NZ; c++) {
      p.z = z0 + ((c + 0.5) / NZ) * S;
      populations(p, pop);
      const bn = pop.bulge + (S < NSC_SMALL_CELL ? pop.nsc : 0);
      I.bulge += bn * dA * (S / NZ);
      fmax.bulge = Math.max(fmax.bulge, bn);
    }
  }
  // expected stars per component, then the count
  const holdsCentre = S >= NSC_SMALL_CELL && lo.x <= 0 && lo.y <= 0 && lo.z <= 0 && lo.x + S > 0 && lo.y + S > 0 && lo.z + S > 0;
  const w: Record<Comp, number> = {
    young: band.phi * band.young * (I.young / YOUNG_SUN),
    thin: band.phi * (1 - band.young) * (I.thin / OLD_SUN),
    thick: band.phi * (1 - band.young) * (I.thick / OLD_SUN),
    bulge: band.phi * (1 - band.young) * (I.bulge / OLD_SUN),
    nsc: holdsCentre ? band.phi * (1 - band.young) * (NSC_TABLE.total / OLD_SUN) : 0,
  };
  const mu = w.young + w.thin + w.thick + w.bulge + w.nsc;
  const n = Math.min(CELL_CAP, poisson(mu, r));
  const centre = GALAXY.toIcrf(centreGal);
  const cell: StarCell = {
    key: `${k}:${ix}:${iy}:${iz}`, band: k, ix, iy, iz, centre, size: S, count: 0,
    pos: new Float32Array(n * 3), absMag: new Float32Array(n), teff: new Float32Array(n), cls: new Uint8Array(n),
  };
  if (n === 0) return cell;
  const aSun = extinction(GALAXY.sun, centreGal, 12);
  const q = new Vector3();
  const icrf = new Vector3();
  let m = 0;
  for (let i = 0; i < n; i++) {
    // component, then position by rejection in x, y (exact profile in z for the disks)
    let u = r() * mu;
    let comp: Comp = 'young';
    for (const c of ['young', 'thin', 'thick', 'bulge', 'nsc'] as Comp[]) { comp = c; if ((u -= w[c]) <= 0) break; }
    for (let tries = 0; ; tries++) {
      if (comp === 'nsc') {
        const rr = nscRadius(r()), ct = 2 * r() - 1, ph = 2 * Math.PI * r(), st = Math.sqrt(1 - ct * ct);
        q.set(rr * st * Math.cos(ph), rr * st * Math.sin(ph), rr * ct);
        break;
      }
      q.set(lo.x + r() * S, lo.y + r() * S, 0);
      if (comp === 'bulge') {
        q.z = z0 + r() * S;
        populations(q, pop);
        if (tries > 30 || r() * fmax.bulge * 1.5 < pop.bulge + (S < NSC_SMALL_CELL ? pop.nsc : 0)) break;
      } else {
        populations(q, pop);
        const f = comp === 'young' ? pop.young : comp === 'thin' ? pop.thin : pop.thick;
        const c3 = comp as 'young' | 'thin' | 'thick';
        if (tries > 30 || r() * fmax[c3] * 1.3 < f) { q.z = zSample(z0, z1, H[c3], r()); break; }
      }
    }
    const M = band.M + r();
    GALAXY.toIcrf(q, icrf);
    const dSun = icrf.length();
    if (dSun < CAT_RADIUS || M + 5 * Math.log10(dSun) - 5 + aSun < CAT_MAG) continue;
    // spectral class consistent with the population (young: hot stars and supergiants)
    const young = comp === 'young';
    const choices = band.classes.filter((c) => c.young === young);
    const list = choices.length ? choices : band.classes;
    const tot = list.reduce((s2, c) => s2 + c.f, 0);
    let pick = r() * tot;
    let ci = 0;
    while (ci < list.length - 1 && (pick -= list[ci].f) > 0) ci++;
    const c = list[ci];
    cell.pos[m * 3] = icrf.x - centre.x;
    cell.pos[m * 3 + 1] = icrf.y - centre.y;
    cell.pos[m * 3 + 2] = icrf.z - centre.z;
    cell.absMag[m] = M;
    cell.teff[m] = c.t0 * (c.t1 / c.t0) ** r();
    cell.cls[m] = band.classes.indexOf(c);
    m++;
  }
  cell.count = m;
  return cell;
}

/** Spectral class label of star `i` of `cell`. */
export function spectralLabel(cell: StarCell, i: number): string {
  return BANDS[cell.band].classes[cell.cls[i]]?.sp ?? '';
}

/** Galactocentric grid indices of the cell of band k containing galactocentric point p. */
export function cellIndex(k: number, p: Vector3): [number, number, number] {
  const S = cellSize(k);
  return [Math.floor(p.x / S), Math.floor(p.y / S), Math.floor(p.z / S)];
}
