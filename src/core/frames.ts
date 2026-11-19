import { Matrix3, Vector3 } from 'three';
import { DEG } from './units';

/**
 * Reference frames. The engine's world axes are ICRF / J2000 equatorial
 * (x -> vernal equinox, z -> celestial north pole), the frame of JPL DE
 * ephemerides and of the star catalogs.
 */

/** Obliquity of the J2000 ecliptic used by SPICE's ECLIPJ2000 frame (IAU 1976 value, 84381.448"). */
export const OBLIQUITY_J2000 = (84381.448 / 3600) * DEG;
const ce = Math.cos(OBLIQUITY_J2000);
const se = Math.sin(OBLIQUITY_J2000);

/** Ecliptic J2000 -> ICRF equatorial (in place). */
export function eclToEqu(v: Vector3): Vector3 {
  const y = v.y * ce - v.z * se;
  const z = v.y * se + v.z * ce;
  v.y = y;
  v.z = z;
  return v;
}

export function equToEcl(v: Vector3): Vector3 {
  const y = v.y * ce + v.z * se;
  const z = -v.y * se + v.z * ce;
  v.y = y;
  v.z = z;
  return v;
}

/**
 * Galactic -> ICRF rotation. Defined by the Hipparcos/ICRS realisation of the
 * IAU 1958 Galactic system: north Galactic pole at RA 192.85948°, Dec 27.12825°,
 * and the north celestial pole at Galactic longitude 122.93192°.
 */
export const GAL_TO_EQU = (() => {
  const raP = 192.85948 * DEG;
  const decP = 27.12825 * DEG;
  const lNcp = 122.93192 * DEG;
  // Rows of the equatorial->galactic matrix are galactic x, y, z axes expressed in ICRF.
  const zg = new Vector3(Math.cos(decP) * Math.cos(raP), Math.cos(decP) * Math.sin(raP), Math.sin(decP));
  // x_g points to l = 0, b = 0. The NCP has longitude lNcp, so rotate within the galactic plane.
  const ncp = new Vector3(0, 0, 1);
  // Component of NCP in galactic plane points to l = lNcp: ncpPlane = cos(lNcp) xg + sin(lNcp) yg
  const ncpPlane = ncp.clone().sub(zg.clone().multiplyScalar(ncp.dot(zg))).normalize();
  const perp = new Vector3().crossVectors(zg, ncpPlane); // l = lNcp + 90°
  const xg = ncpPlane.clone().multiplyScalar(Math.cos(lNcp)).add(perp.clone().multiplyScalar(-Math.sin(lNcp)));
  const yg = new Vector3().crossVectors(zg, xg);
  // Columns = galactic axes in ICRF
  return new Matrix3().set(xg.x, yg.x, zg.x, xg.y, yg.y, zg.y, xg.z, yg.z, zg.z);
})();

export function raDecToVector(raDeg: number, decDeg: number, out = new Vector3()): Vector3 {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  return out.set(Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec));
}

export function vectorToRaDec(v: Vector3): { ra: number; dec: number } {
  const r = v.length();
  let ra = Math.atan2(v.y, v.x) / DEG;
  if (ra < 0) ra += 360;
  return { ra, dec: Math.asin(v.z / r) / DEG };
}

/**
 * Orthonormal frame whose z axis is the pole (RA, Dec) and whose x axis is the
 * ascending node of that plane on the ICRF equator (the convention used for
 * JPL satellite mean elements referred to Laplace / planet-equator planes).
 * Returns a matrix mapping plane-frame vectors to ICRF.
 */
export function poleFrame(poleRaDeg: number, poleDecDeg: number): Matrix3 {
  const z = raDecToVector(poleRaDeg, poleDecDeg);
  const x = new Vector3(0, 0, 1).cross(z);
  if (x.lengthSq() < 1e-20) x.set(1, 0, 0);
  x.normalize();
  const y = new Vector3().crossVectors(z, x);
  return new Matrix3().set(x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z);
}

export function formatRaDec(v: Vector3): string {
  const { ra, dec } = vectorToRaDec(v);
  const h = ra / 15;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = ((h - hh) * 60 - mm) * 60;
  const sgn = dec < 0 ? '−' : '+';
  const ad = Math.abs(dec);
  const dd = Math.floor(ad);
  const dm = Math.floor((ad - dd) * 60);
  const ds = ((ad - dd) * 60 - dm) * 60;
  return `${hh}h ${String(mm).padStart(2, '0')}m ${ss.toFixed(1).padStart(4, '0')}s  ${sgn}${dd}° ${String(dm).padStart(2, '0')}′ ${ds.toFixed(0).padStart(2, '0')}″`;
}
