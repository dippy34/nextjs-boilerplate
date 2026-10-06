// Physical constants and unit conversions. All engine positions are in metres.

export const KM = 1e3;
export const AU = 149_597_870_700; // IAU 2012 exact, m
export const LY = 9.460_730_472_580_8e15; // m
export const PC = 3.085_677_581_491_367e16; // m (IAU 2015)
export const KPC = 1e3 * PC;
export const MPC = 1e6 * PC;
export const C_LIGHT = 299_792_458; // m/s

export const DAY = 86_400; // s
export const JULIAN_YEAR = 365.25 * DAY;
export const J2000_JD = 2_451_545.0;

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

/** Gaussian gravitational constant expressed as mean motion in deg/day for a = 1 AU. */
export const GAUSS_K_DEG_PER_DAY = 0.01720209895 * RAD;
/** GM of the Sun in m^3/s^2 (IAU 2015 nominal). */
export const GM_SUN = 1.327_124_4e20;

/** Apparent V magnitude of the Sun at 1 AU (AT-HYG "Sol" entry). */
export const SUN_APPARENT_MAG = -26.74;
/** Absolute V magnitude of the Sun (AT-HYG "Sol" entry). */
export const SUN_ABS_MAG = 4.831;
export const SUN_TEFF = 5772; // K, IAU 2015 nominal
export const SUN_RADIUS = 695_700e3; // m, IAU 2015 nominal

/** Human readable distance with automatic units. */
export function formatDistance(m: number): string {
  const a = Math.abs(m);
  if (a < 1e3) return `${m.toFixed(1)} m`;
  if (a < 1e7) return `${(m / 1e3).toFixed(a < 1e5 ? 2 : 0)} km`;
  if (a < 0.1 * AU) return `${(m / 1e3).toExponential(3).replace('e+', '×10^')} km`;
  if (a < 0.05 * LY) return `${(m / AU).toFixed(a < 10 * AU ? 4 : 2)} AU`;
  if (a < 1e3 * LY) return `${(m / LY).toFixed(a < 10 * LY ? 3 : 1)} ly`;
  if (a < 1e6 * PC) return `${(m / KPC).toFixed(2)} kpc`;
  return `${(m / MPC).toFixed(2)} Mpc`;
}

export function formatSpeed(mps: number): string {
  const a = Math.abs(mps);
  if (a < 1e3) return `${mps.toFixed(1)} m/s`;
  if (a < 0.01 * C_LIGHT) return `${(mps / 1e3).toFixed(a < 1e5 ? 2 : 0)} km/s`;
  if (a < 100 * C_LIGHT) return `${(mps / C_LIGHT).toFixed(3)} c`;
  if (a < 1e3 * LY) return `${(mps / LY).toFixed(3)} ly/s`;
  if (a < 1e6 * PC) return `${(mps / PC).toFixed(1)} pc/s`;
  return `${(mps / MPC).toFixed(3)} Mpc/s`;
}
