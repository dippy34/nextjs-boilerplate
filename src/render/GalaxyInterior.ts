import { Matrix3, Vector3 } from 'three';
import { PC } from '../core/units';
import type { Galaxy } from '../universe/Galaxies';
import { BANDS, cellSize, type StarCell } from '../universe/ProceduralStars';
import { type GalaxyModel, sersicB, smooth } from './GalaxiesLayer';
import { INTERIOR } from './interiorState';
export { F_LOG0, F_N, F_STEP, INTERIOR } from './interiorState';

/**
 * Stars inside other galaxies, generated like the Milky Way's procedural stars
 * (universe/ProceduralStars.ts): per magnitude band, cubic cells sized so that a band's stars more
 * than ~2.5 cells away are fainter than the limiting magnitude; every random choice comes from a
 * hash of the galaxy, band and cell, so a star is always the same star.
 *
 * Here the cells are laid out in the galaxy's disc frame (parsecs from its centre) and their stars
 * follow the galaxy's own model (GalaxyModel: the light of its spheroid, old and thick discs and
 * young arms, the same model the volume is drawn from). Counts: the galaxy's luminosity (from its
 * catalogued magnitude and distance) times the share of its light in the cell, divided by the light
 * per star of the local luminosity function; young (arm) stars take the bright blue bands.
 */

/** mean luminosity (L☉, V) of a star in each band */
const LBAR = BANDS.map((b) => 10 ** (-0.4 * (b.M + 0.5 - 4.83)));
const RHO_Y = BANDS.reduce((s, b, k) => s + b.phi * b.young * LBAR[k], 0);
const RHO_O = BANDS.reduce((s, b, k) => s + b.phi * (1 - b.young) * LBAR[k], 0);
/** share of all light in each band (young and old together, weighted like a typical disc) */
export const BAND_LIGHT = (() => {
  const w = BANDS.map((b, k) => 0.2 * (b.phi * b.young * LBAR[k]) / RHO_Y + 0.8 * (b.phi * (1 - b.young) * LBAR[k]) / RHO_O);
  const t = w.reduce((a, b) => a + b, 0);
  return w.map((v) => v / t);
})();

const CELL_CAP = 12000;

/** V luminosity of a galaxy (L☉) from its catalogued magnitude and distance */
export function galaxyLuminosity(g: Galaxy): number {
  const dm = 5 * Math.log10(g.data.distPc / 10);
  const M = g.data.vmag !== null ? g.data.vmag - dm : g.shape === 'dwarf' ? -11 : -16;
  return 10 ** (-0.4 * (M - 4.83));
}

/** galaxy-specific constants for generation */
export class InteriorFrame {
  /** galaxy centre, ICRF heliocentric pc */
  readonly centre: Vector3;
  /** disc frame (radii) -> ICRF directions */
  readonly discToIcrf = new Matrix3();
  /** ICRF -> disc frame */
  readonly icrfToDisc = new Matrix3();
  readonly rpc: number;
  readonly lum: number;

  constructor(readonly model: GalaxyModel, readonly index: number) {
    const g = model.g;
    this.centre = g.upos.toVector3().multiplyScalar(1 / PC);
    this.rpc = g.radius / PC;
    this.lum = galaxyLuminosity(g);
    const basis = new Matrix3().set(g.major.x, g.minor.x, g.normal.x, g.major.y, g.minor.y, g.normal.y, g.major.z, g.minor.z, g.normal.z);
    this.discToIcrf.multiplyMatrices(basis, model.rotT);
    this.icrfToDisc.copy(this.discToIcrf).transpose();
  }

  /** ICRF heliocentric pc -> disc frame (radii) */
  toDisc(pc: Vector3, out = new Vector3()): Vector3 {
    return out.copy(pc).sub(this.centre).applyMatrix3(this.icrfToDisc).multiplyScalar(1 / this.rpc);
  }
}

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

function cellSeed(gi: number, k: number, ix: number, iy: number, iz: number): number {
  let h = 2166136261 ^ (k * 374761393) ^ Math.imul(gi + 1, 668265263);
  for (const v of [ix, iy, iz]) {
    h = Math.imul(h ^ (v & 0xffff), 16777619);
    h = Math.imul(h ^ ((v >>> 16) & 0xffff), 16777619);
  }
  return h >>> 0;
}

function poisson(mu: number, r: () => number): number {
  if (mu > 40) return Math.max(0, Math.round(mu + Math.sqrt(mu) * Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r())));
  const L = Math.exp(-mu);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L);
  return k - 1;
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

/**
 * Horizontal (face-on) light of the disc parts at disc-frame (x, y) (radii): old, thick and young
 * (incl. knots), each per unit of its normalised vertical profile; plus their scale heights.
 */
function discLight(m: GalaxyModel, x: number, y: number, young: boolean) {
  const l = m.look, c = m.coef;
  const r = Math.hypot(x, y);
  const tr = 1 - smooth(l.trunc * 0.8, l.trunc, r);
  const hz = l.hz * (1 + 0.8 * r);
  const d = m.disc(x, y, 0);
  const am = smooth(0.04, 0.16, r) * (1 - smooth(1.0, 1.3, r));
  const wave = l.arms > 0 ? 0.5 + 0.5 * Math.cos(l.arms * d.psi) : 0.5;
  const old = c.old * Math.exp(-r / l.hr) * (1 + 0.5 * (wave - 0.5) * am) * (0.8 + 0.4 * m.dA[1]) * tr;
  const thick = c.thick * Math.exp(-r / (1.3 * l.hr)) * 10 * tr;
  let yng = 0;
  if (young && c.young + c.knots > 0) {
    m.streaks(x, y, 0, r, d.psi);
    const armY = l.arms > 0 ? Math.pow(wave, 4 * (0.5 + 1.1 * d.wid)) * 3.66 * am * (0.2 + 2.4 * m.dS[1] * m.dS[1]) : am;
    const ring = Math.exp(-(((r - l.ring[0]) / l.ring[1]) ** 2));
    const ym = armY * (1 - l.clumpy) + smooth(0.35, 0.85, m.dA[2]) * 2.8 * (0.5 + m.dI[1]) * l.clumpy + l.ring[2] * ring;
    yng = (c.young + 1.5 * c.knots) * Math.exp(-r / (1.5 * l.hr)) * ym * tr;
  }
  return { old, thick, young: yng, hz, hy: 0.45 * hz };
}

/** light of the spheroid at disc-frame p (radii) */
function bulgeLight(m: GalaxyModel, p: Vector3, tmp: Vector3): number {
  const l = m.look, c = m.coef;
  if (c.bulge <= 0) return 0;
  const ax = l.axes ?? [1, 1, l.bulgeQ];
  tmp.copy(p).applyMatrix3(m.rotT);
  const s = Math.hypot(tmp.x / ax[0], tmp.y / ax[1], tmp.z / ax[2]) / l.bulgeRe;
  const e = m.ext;
  const w = 1 - smooth(0.7, 1.0, Math.hypot(tmp.x / e.x, tmp.y / e.y, tmp.z / e.z));
  return c.bulge * Math.exp(-sersicB(l.bulgeN) * (Math.pow(Math.max(s, 1e-5), 1 / l.bulgeN) - 1)) * w;
}

/**
 * Optical depth (V) of the galaxy's dust between disc-frame points a and b (radii): the smooth dust
 * layer's vertical profile integrated along the segment, its face-on depth taken where it crosses
 * the plane (as the cloud sprites do in the shader, without the lanes' fine structure).
 */
export function dustBetween(m: GalaxyModel, a: Vector3, b: Vector3): number {
  const l = m.look;
  if (l.dust <= 0) return 0;
  const L = a.distanceTo(b);
  if (L <= 0) return 0;
  const dz = b.z - a.z;
  const f = Math.abs(dz) > 1e-9 ? Math.min(1, Math.max(0, -a.z / dz)) : 0.5;
  const r = Math.hypot(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
  const h = 0.4 * l.hz * (1 + 0.8 * r);
  const K = l.dust * Math.exp(-r / l.dustHr) * smooth(0.02, 0.1, r) * (0.3 + 0.9 + l.ring[3] * Math.exp(-(((r - l.ring[0]) / l.ring[1]) ** 2))) * (1 - smooth(l.trunc * 0.8, l.trunc, r));
  const F = (z: number) => (z < 0 ? 0.5 * Math.exp(z / h) : 1 - 0.5 * Math.exp(-z / h));
  return Math.abs(dz) > 1e-4 * h ? (K * L * Math.abs(F(b.z) - F(a.z))) / Math.abs(dz) : (K * L * Math.exp(-Math.abs(a.z) / h)) / (2 * h);
}

/** Generate the stars of one cell of galaxy `fr` (deterministic). */
export function generateGalaxyCell(fr: InteriorFrame, k: number, ix: number, iy: number, iz: number): StarCell {
  const m = fr.model;
  const band = BANDS[k];
  const S = cellSize(k);
  const s = S / fr.rpc;                       // cell size in radii
  const x0 = ix * s, y0 = iy * s, z0 = iz * s, z1 = z0 + s;
  const r = rng(cellSeed(fr.index, k, ix, iy, iz));
  const cc = new Vector3(x0 + s / 2, y0 + s / 2, z0 + s / 2);
  const centre = cc.clone().multiplyScalar(fr.rpc).applyMatrix3(fr.discToIcrf).add(fr.centre);
  const key = `g${fr.index}:${k}:${ix}:${iy}:${iz}`;
  const empty = (): StarCell => ({ key, band: k, ix, iy, iz, centre, size: S, count: 0, pos: new Float32Array(0), absMag: new Float32Array(0), teff: new Float32Array(0), cls: new Uint8Array(0) });
  // light of each part in the cell (model units x radii³): a grid in x, y, exact in z for the discs
  const N = 6, NZ = 6;
  const dA = (s / N) ** 2;
  const I = { old: 0, thick: 0, young: 0, bulge: 0 };
  const mx = { old: 0, thick: 0, young: 0, bulge: 0 };
  const p = new Vector3(), tmp = new Vector3();
  const wantYoung = band.young > 0;
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    const x = x0 + ((a + 0.5) / N) * s, y = y0 + ((b + 0.5) / N) * s;
    const dl = discLight(m, x, y, wantYoung);
    I.old += (dl.old * zInt(z0, z1, dl.hz)) / (2 * dl.hz) * dA; mx.old = Math.max(mx.old, dl.old);
    I.thick += dl.thick * zInt(z0, z1, 0.05) * dA; mx.thick = Math.max(mx.thick, dl.thick);
    I.young += (dl.young * zInt(z0, z1, dl.hy)) / (2 * dl.hy) * dA; mx.young = Math.max(mx.young, dl.young);
    for (let c = 0; c < NZ; c++) {
      p.set(x, y, z0 + ((c + 0.5) / NZ) * s);
      const bl = bulgeLight(m, p, tmp);
      I.bulge += bl * dA * (s / NZ);
      mx.bulge = Math.max(mx.bulge, bl);
    }
  }
  // light (L☉) -> expected stars of this band, young from the young light, the rest from the old
  const toLsun = fr.lum / m.bright;
  const muY = (band.phi * band.young * I.young * toLsun) / RHO_Y;
  const oldL = I.old + I.thick + I.bulge;
  const muO = (band.phi * (1 - band.young) * oldL * toLsun) / RHO_O;
  const mu = muY + muO;
  if (!(mu > 0)) return empty();
  const n = Math.min(CELL_CAP, poisson(mu, r));
  if (n === 0) return empty();
  const cell: StarCell = { key, band: k, ix, iy, iz, centre, size: S, count: 0,
    pos: new Float32Array(n * 3), absMag: new Float32Array(n), teff: new Float32Array(n), cls: new Uint8Array(n) };
  const q = new Vector3();
  let cnt = 0;
  for (let i = 0; i < n; i++) {
    const young = r() * mu < muY;
    let comp: 'young' | 'old' | 'thick' | 'bulge' = 'young';
    if (!young) {
      const u = r() * oldL;
      comp = u < I.old ? 'old' : u < I.old + I.thick ? 'thick' : 'bulge';
    }
    let ok = false;
    for (let tries = 0; tries < 30 && !ok; tries++) {
      if (comp === 'bulge') {
        q.set(x0 + r() * s, y0 + r() * s, z0 + r() * s);
        ok = r() * mx.bulge * 1.5 < bulgeLight(m, q, tmp);
      } else {
        q.set(x0 + r() * s, y0 + r() * s, 0);
        const dl = discLight(m, q.x, q.y, comp === 'young');
        const f = comp === 'young' ? dl.young : comp === 'old' ? dl.old : dl.thick;
        const fm = comp === 'young' ? mx.young : comp === 'old' ? mx.old : mx.thick;
        ok = r() * fm * 1.3 < f;
        if (ok) q.z = zSample(z0, z1, comp === 'young' ? dl.hy : comp === 'old' ? dl.hz : 0.05, r());
      }
    }
    if (!ok) continue;
    // spectral class consistent with the population (young: hot stars and supergiants)
    const choices = band.classes.filter((c) => c.young === young);
    const list = choices.length ? choices : band.classes;
    const tot = list.reduce((s2, c) => s2 + c.f, 0);
    let pick = r() * tot;
    let ci = 0;
    while (ci < list.length - 1 && (pick -= list[ci].f) > 0) ci++;
    const c = list[ci];
    // position relative to the cell centre, in ICRF pc
    tmp.copy(q).sub(cc).multiplyScalar(fr.rpc).applyMatrix3(fr.discToIcrf);
    cell.pos[cnt * 3] = tmp.x; cell.pos[cnt * 3 + 1] = tmp.y; cell.pos[cnt * 3 + 2] = tmp.z;
    cell.absMag[cnt] = band.M + r();
    cell.teff[cnt] = c.t0 * (c.t1 / c.t0) ** r();
    cell.cls[cnt] = band.classes.indexOf(c);
    cnt++;
  }
  cell.count = cnt;
  return cell;
}

/** the main-thread frame of galaxy `gi` (lazily built) */
export function interiorFrame(gi: number): InteriorFrame | null {
  let fr = INTERIOR.frames.get(gi);
  if (fr) return fr;
  const g = INTERIOR.galaxies[gi];
  const m = g && INTERIOR.models?.get(g);
  if (!m) return null;
  fr = new InteriorFrame(m, gi);
  INTERIOR.frames.set(gi, fr);
  return fr;
}
