import { AU, SUN_APPARENT_MAG } from '../core/units';

/**
 * Photometric conventions.
 *
 * Radiance unit: 1.0 = radiance of a perfectly white Lambertian surface lit
 * face-on by the Sun at 1 AU. Hence solar irradiance at 1 AU = PI in these
 * units, and a point source of apparent V magnitude m has irradiance
 * PI * 10^(-0.4 (m - m_sun)).
 */
export const SOLAR_IRRADIANCE_1AU = Math.PI;

export function magToIrradiance(m: number): number {
  return SOLAR_IRRADIANCE_1AU * Math.pow(10, -0.4 * (m - SUN_APPARENT_MAG));
}

export function irradianceToMag(E: number): number {
  return SUN_APPARENT_MAG - 2.5 * Math.log10(E / SOLAR_IRRADIANCE_1AU);
}

/** Apparent magnitude from absolute magnitude and distance in parsecs. */
export const apparentMag = (absMag: number, distPc: number) => absMag + 5 * Math.log10(Math.max(distPc, 1e-12)) - 5;

/** Lambert sphere phase function (normalised to 1 at zero phase). */
export function lambertPhase(alpha: number): number {
  return (Math.sin(alpha) + (Math.PI - alpha) * Math.cos(alpha)) / Math.PI;
}

/** IAU H,G phase function (Bowell et al. 1989) for asteroids. */
export function hgPhase(alpha: number, G = 0.15): number {
  const t = Math.tan(alpha / 2);
  const phi1 = Math.exp(-3.33 * Math.pow(t, 0.63));
  const phi2 = Math.exp(-1.87 * Math.pow(t, 1.22));
  return Math.max(1e-6, (1 - G) * phi1 + G * phi2);
}

/** Irradiance at the observer from a sunlit sphere (geometric albedo p, radius R) — all lengths in metres. */
export function reflectedIrradiance(
  sunIrradianceAtBody: number, albedo: number, radius: number, distObserver: number, phaseAngle: number,
): number {
  const ratio = radius / Math.max(distObserver, radius);
  return sunIrradianceAtBody * albedo * ratio * ratio * lambertPhase(phaseAngle);
}

export const sunIrradianceAt = (distFromSunMeters: number, sunLuminosityRel = 1) =>
  (SOLAR_IRRADIANCE_1AU * sunLuminosityRel * AU * AU) / (distFromSunMeters * distFromSunMeters);

// ---------------------------------------------------------------------------- colour
/**
 * Blackbody colour: Planck spectrum integrated against the CIE 1931 2° colour
 * matching functions (multi-lobe analytic fit of Wyman, Sloan & Shirley 2013,
 * JCGT 2(2)), converted to linear sRGB (D65). Returns chromaticity normalised
 * so the largest channel is 1.
 */
function cieX(l: number) {
  const t1 = (l - 442.0) * (l < 442.0 ? 0.0624 : 0.0374);
  const t2 = (l - 599.8) * (l < 599.8 ? 0.0264 : 0.0323);
  const t3 = (l - 501.1) * (l < 501.1 ? 0.049 : 0.0382);
  return 0.362 * Math.exp(-0.5 * t1 * t1) + 1.056 * Math.exp(-0.5 * t2 * t2) - 0.065 * Math.exp(-0.5 * t3 * t3);
}
function cieY(l: number) {
  const t1 = (l - 568.8) * (l < 568.8 ? 0.0213 : 0.0247);
  const t2 = (l - 530.9) * (l < 530.9 ? 0.0613 : 0.0322);
  return 0.821 * Math.exp(-0.5 * t1 * t1) + 0.286 * Math.exp(-0.5 * t2 * t2);
}
function cieZ(l: number) {
  const t1 = (l - 437.0) * (l < 437.0 ? 0.0845 : 0.0278);
  const t2 = (l - 459.0) * (l < 459.0 ? 0.0385 : 0.0725);
  return 1.217 * Math.exp(-0.5 * t1 * t1) + 0.681 * Math.exp(-0.5 * t2 * t2);
}

/** Unnormalised CIE XYZ of a blackbody (relative units, consistent across temperatures). */
export function blackbodyXYZ(teff: number): [number, number, number] {
  const h = 6.62607015e-34, c = 2.99792458e8, k = 1.380649e-23;
  let X = 0, Y = 0, Z = 0;
  for (let l = 380; l <= 780; l += 5) {
    const lm = l * 1e-9;
    const B = 1 / (Math.pow(lm, 5) * Math.expm1((h * c) / (lm * k * teff)));
    X += B * cieX(l); Y += B * cieY(l); Z += B * cieZ(l);
  }
  return [X, Y, Z];
}

/** Linear sRGB of XYZ (negative components clipped). */
function xyzToRgb([X, Y, Z]: [number, number, number]): [number, number, number] {
  const r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  const g = -0.969266 * X + 1.8760108 * Y + 0.041556 * Z;
  const b = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
  return [Math.max(r, 0), Math.max(g, 0), Math.max(b, 0)];
}

export function blackbodyRGB(teff: number): [number, number, number] {
  const [r, g, b] = xyzToRgb(blackbodyXYZ(teff));
  const m = Math.max(r, g, b);
  return [r / m, g / m, b / m];
}

/**
 * Blackbody of temperature `teff` seen as a surface: linear sRGB chromaticity with luminance 1,
 * and its visual luminance relative to a blackbody at the Sun's temperature.
 */
export function blackbodySurface(teff: number, sunTeff = 5772): { rgb: [number, number, number]; relY: number } {
  const xyz = blackbodyXYZ(teff);
  const rgb = xyzToRgb(xyz);
  const L = luminance(rgb) || 1;
  return { rgb: [rgb[0] / L, rgb[1] / L, rgb[2] / L], relY: xyz[1] / blackbodyXYZ(sunTeff)[1] };
}

/** Luminance (Rec.709 weights) of a linear RGB triple. */
export const luminance = (c: [number, number, number]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/** Effective temperature from B-V colour index (Ballesteros 2012, EPL 97, 34008). */
export function bvToTeff(bv: number): number {
  const x = Math.min(Math.max(bv, -0.4), 2.0);
  return 4600 * (1 / (0.92 * x + 1.7) + 1 / (0.92 * x + 0.62));
}

/** 256-entry RGBA8 lookup table of star colours over log(Teff) in [TEFF_MIN, TEFF_MAX]. */
export const TEFF_MIN = 1000;
export const TEFF_MAX = 50000;
export function teffToLut(teff: number): number {
  const t = (Math.log(teff) - Math.log(TEFF_MIN)) / (Math.log(TEFF_MAX) - Math.log(TEFF_MIN));
  return Math.min(1, Math.max(0, t));
}
export function lutToTeff(u: number): number {
  return Math.exp(Math.log(TEFF_MIN) + u * (Math.log(TEFF_MAX) - Math.log(TEFF_MIN)));
}
export function buildStarColorLut(size = 256): Uint8Array {
  const data = new Uint8Array(size * 4);
  for (let i = 0; i < size; i++) {
    const rgb = blackbodyRGB(lutToTeff(i / (size - 1)));
    // Normalise by luminance (not max) so colour does not change perceived brightness, then clamp.
    const L = luminance(rgb);
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(Math.min(1, (rgb[c] / L) * 0.5) * 255);
    data[i * 4 + 3] = 255;
  }
  return data;
}
