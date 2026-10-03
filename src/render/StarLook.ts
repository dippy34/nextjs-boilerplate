import { Vector3 } from 'three';

/**
 * How a particular star's surface looks up close, derived from its temperature, size and brightness
 * plus a per-star seed — so no two stars look alike, and each type looks like its kind:
 *  - convective (cool) stars show granulation whose cell size follows the pressure scale height
 *    (∝ T / g): the Sun's surface is covered in ~a million small granules, a red supergiant like
 *    Betelgeuse in a handful of giant convection cells;
 *  - hot stars (radiative envelopes, T ≳ 7,500 K) are smooth; many spin fast, which flattens them
 *    and darkens their equators (gravity darkening, as interferometry shows for Vega and Altair);
 *  - magnetic activity (spots, bright faculae, flares, prominences) is strongest in cool dwarfs and
 *    varies from star to star;
 *  - limb darkening is stronger for cooler stars (quadratic law, roughly following Claret's V-band
 *    coefficients).
 */
export interface StarLook {
  seed: number;
  /** granulation cells per radian on the surface */
  granFreq: number;
  /** granulation brightness contrast */
  granAmp: number;
  /** fraction of the surface covered by spots */
  spots: number;
  /** typical spot latitude (sine) */
  spotLat: number;
  /** bright facular network strength */
  faculae: number;
  /** quadratic limb-darkening coefficients */
  limbA: number;
  limbB: number;
  /** visible rotation of surface features (rad/s, sped up so they can be seen move) */
  rotRate: number;
  /** polar flattening (0 = sphere) and equatorial gravity darkening */
  flattening: number;
  gravDark: number;
  /** rotation axis (unit, world) */
  axis: Vector3;
  /** corona/glow strength and prominence activity */
  corona: number;
  prominences: number;
  /** chance of a flare being under way at any moment */
  flares: number;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * `key` identifies the star (stable seed); `teff` K; `radiusSun` in solar radii; `absMag` V.
 * `sun` gives the Sun its measured look (moderate activity, slow rotation).
 */
export function starLook(key: string, teff: number, radiusSun: number, absMag: number, sun = false): StarLook {
  const r1 = hashString(key), r2 = hashString(key + '#2'), r3 = hashString(key + '#3'), r4 = hashString(key + '#4');
  const T = Math.max(teff || 5800, 1500);
  const R = Math.max(radiusSun, 1e-3);
  const whiteDwarf = R < 0.05;
  const supergiant = R > 80 || absMag < -4.5;
  const giant = !supergiant && R > 3.5;
  // mass: main sequence from temperature, typical values for evolved stars
  const mass = whiteDwarf ? 0.6 : supergiant ? 10 + 15 * r2 : giant ? 1 + 1.5 * r2 : Math.min(25, Math.max(0.08, (T / 5772) ** 1.7));
  const convective = T < 7200 && !whiteDwarf;
  // granulation cells around the circumference ∝ R g / T (Sun ~4400)
  const cells = (4400 * mass) / (R * (T / 5772));
  const granFreq = Math.min(260, Math.max(2.2, cells / 25));
  const granAmp = whiteDwarf ? 0.01 : convective ? 0.16 + 0.14 * smooth(3, 200, R) + 0.05 * r3 : 0.025 + 0.02 * r3;
  // activity: cool dwarfs most active, fast-rotating M dwarfs above all
  let activity: number;
  if (whiteDwarf || T > 7200) activity = 0;
  else if (supergiant) activity = 0.3 * r1;
  else if (giant) activity = 0.25 * r1 * r1;
  else if (T < 3900) activity = 0.15 + 0.85 * r1 * r1;
  else if (T < 5300) activity = 0.6 * r1 * r1;
  else activity = 0.4 * r1 ** 3;
  if (sun) activity = 0.12;
  const spots = activity * (T < 3900 ? 0.35 : 0.18);
  const fast = !sun && (T < 3900 ? r4 > 0.5 : r4 > 0.85);
  const limbA = Math.min(0.78, Math.max(0.22, 0.44 + ((5772 - T) / 2228) * 0.16));
  const limbB = 0.2;
  const hotRotator = T > 7400 && !whiteDwarf;
  const flattening = hotRotator ? 0.22 * r2 * r2 : 0;
  // a random spin axis
  const u = 2 * r3 - 1, phi = 2 * Math.PI * r4;
  const axis = new Vector3(Math.sqrt(1 - u * u) * Math.cos(phi), Math.sqrt(1 - u * u) * Math.sin(phi), u);
  return {
    seed: r1 * 1000,
    granFreq, granAmp, spots, spotLat: fast ? 0.75 : 0.25 + 0.15 * r2, faculae: Math.min(1, activity * 1.6),
    limbA, limbB,
    rotRate: (fast ? 0.05 : 0.012) * (supergiant ? 0.2 : giant ? 0.4 : 1) * (0.6 + 0.8 * r2),
    flattening, gravDark: flattening * 1.4,
    axis,
    corona: whiteDwarf ? 0.2 : supergiant ? 0.9 : 0.5 + 0.5 * activity + (T > 15000 ? 0.4 : 0),
    prominences: convective && !supergiant ? Math.min(1, activity * 1.4) : 0,
    flares: T < 3900 && !giant && !supergiant ? activity * 0.25 : 0,
  };
}

/** Shader uniforms for a star surface (STAR_LOOK_UNIFORMS). `axisBF`: spin axis in the mesh's own frame. */
export function starLookUniforms(look: StarLook, axisBF = new Vector3(0, 0, 1)): Record<string, { value: unknown }> {
  return {
    uSeed: { value: look.seed }, uGranFreq: { value: look.granFreq }, uGranAmp: { value: look.granAmp },
    uSpots: { value: look.spots }, uSpotLat: { value: look.spotLat }, uFaculae: { value: look.faculae },
    uLimbA: { value: look.limbA }, uLimbB: { value: look.limbB }, uRotRate: { value: look.rotRate },
    uGravDark: { value: look.gravDark }, uAxis: { value: axisBF.clone() }, uFlares: { value: look.flares },
  };
}

/** Copy a look into existing uniforms (one material reused for different stars). */
export function applyStarLook(u: Record<string, { value: unknown }>, look: StarLook): void {
  u.uSeed.value = look.seed; u.uGranFreq.value = look.granFreq; u.uGranAmp.value = look.granAmp;
  u.uSpots.value = look.spots; u.uSpotLat.value = look.spotLat; u.uFaculae.value = look.faculae;
  u.uLimbA.value = look.limbA; u.uLimbB.value = look.limbB; u.uRotRate.value = look.rotRate;
  u.uGravDark.value = look.gravDark; u.uFlares.value = look.flares;
}
