/**
 * The physics behind God mode's editor, one formula per function. Each returns the value and the
 * working ("show the math"): the formula, then the same with the numbers in, then the result.
 * SI units throughout. Tested against textbook values in tests/physics.test.ts.
 */

export const G = 6.6743e-11;          // m^3 kg^-1 s^-2 (CODATA 2018)
export const C = 299_792_458;         // m/s
export const SIGMA = 5.670374419e-8;  // W m^-2 K^-4 (Stefan-Boltzmann)
export const R_GAS = 8.314462618;     // J mol^-1 K^-1
export const AU = 149_597_870_700;    // m
export const DAY = 86_400;            // s
export const YEAR = 365.25 * DAY;     // s
export const L_SUN = 3.828e26;        // W (IAU 2015 nominal)
export const M_SUN = 1.98847e30;      // kg
export const R_SUN = 695_700e3;       // m
export const T_SUN = 5772;            // K
export const M_EARTH = 5.9722e24;     // kg
export const R_EARTH = 6.371e6;       // m
export const M_JUPITER = 1.89813e27;  // kg

export interface Derived {
  value: number;
  /** display unit of `text` */
  unit: string;
  /** the formula in symbols */
  formula: string;
  /** the working: formula = numbers = result */
  math: string;
  /** the result, formatted */
  text: string;
}

/** A number for the working: 3 significant figures, exponent form outside 0.01..1e5. */
export function num(x: number, sig = 4): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e5 || a < 1e-2) {
    const [m, e] = x.toExponential(sig - 1).split('e');
    return `${m.replace(/\.?0+$/, '')}e${Number(e)}`;
  }
  return Number(x.toPrecision(sig)).toString();
}

function derived(value: number, unit: string, formula: string, plugged: string, text?: string): Derived {
  const t = text ?? `${num(value)} ${unit}`.trim();
  return { value, unit, formula, math: `${formula} = ${plugged} = ${t}`, text: t };
}

// ---------------------------------------------------------------- formatting results

export function fmtDuration(s: number): string {
  const a = Math.abs(s);
  if (!Number.isFinite(a)) return '∞';
  if (a < 120) return `${num(s)} s`;
  if (a < 2 * 3600) return `${num(s / 60)} min`;
  if (a < 2 * DAY) return `${num(s / 3600)} h`;
  if (a < 2 * YEAR) return `${num(s / DAY)} d`;
  return `${num(s / YEAR)} yr`;
}
export function fmtLength(m: number): string {
  const a = Math.abs(m);
  if (a >= 0.01 * AU) return `${num(m / AU)} AU`;
  if (a >= 1e3) return `${num(m / 1e3)} km`;
  return `${num(m)} m`;
}
export function fmtMass(kg: number): string {
  if (kg >= 0.01 * M_SUN) return `${num(kg / M_SUN)} M☉`;
  if (kg >= 30 * M_EARTH) return `${num(kg / M_JUPITER)} M♃`;
  if (kg >= 1e-4 * M_EARTH) return `${num(kg / M_EARTH)} M⊕`;
  return `${num(kg)} kg`;
}

// ---------------------------------------------------------------- bulk properties

/** Mean density ρ = M / (4/3 π a b c) (kg/m³) of an ellipsoid (radii in m). */
export function density(massKg: number, a: number, b = a, c = a): Derived {
  const v = (4 / 3) * Math.PI * a * b * c;
  const rho = massKg / v;
  const R = Math.cbrt(a * b * c);
  return derived(rho / 1000, 'g/cm³', 'ρ = 3M / (4πR³)', `3·${num(massKg)} kg / (4π·(${num(R)} m)³)`);
}
/** Mass from density (kg/m³) and mean radius. */
export function massFromDensity(rhoKgM3: number, R: number): number { return rhoKgM3 * (4 / 3) * Math.PI * R ** 3; }
/** Mean radius from mass and density (kg/m³). */
export function radiusFromDensity(massKg: number, rhoKgM3: number): number { return Math.cbrt((3 * massKg) / (4 * Math.PI * rhoKgM3)); }

/** Surface gravity g = GM/R² at the mean radius. */
export function surfaceGravity(massKg: number, R: number): Derived {
  const g = (G * massKg) / (R * R);
  return derived(g, 'm/s²', 'g = GM / R²', `${num(G)}·${num(massKg)} kg / (${num(R)} m)²`);
}

/** Escape velocity v = √(2GM/R). */
export function escapeVelocity(massKg: number, R: number): Derived {
  const v = Math.sqrt((2 * G * massKg) / R);
  return derived(v / 1000, 'km/s', 'v_esc = √(2GM / R)', `√(2·${num(G)}·${num(massKg)} kg / ${num(R)} m)`);
}

/** Flattening f = (a − c)/a from the equatorial and polar radii. */
export function flattening(req: number, rpol: number): Derived {
  const f = (req - rpol) / req;
  return derived(f, '', 'f = (R_eq − R_pol) / R_eq', `(${num(req)} − ${num(rpol)}) m / ${num(req)} m`, f === 0 ? '0 (a sphere)' : `${num(f)} (1/${num(1 / f)})`);
}

/** Speed of the equator v = 2πR/P for a rotation period P (s). */
export function equatorSpeed(R: number, periodS: number): Derived {
  const v = (2 * Math.PI * R) / Math.abs(periodS);
  return derived(v, 'm/s', 'v = 2πR / P', `2π·${num(R)} m / ${num(Math.abs(periodS))} s`);
}

/** Rotation period at which the equator would fly off: P = 2π√(R³/GM). */
export function breakupPeriod(massKg: number, R: number): Derived {
  const P = 2 * Math.PI * Math.sqrt(R ** 3 / (G * massKg));
  return derived(P, 's', 'P_min = 2π√(R³ / GM)', `2π√((${num(R)} m)³ / (${num(G)}·${num(massKg)} kg))`, fmtDuration(P));
}

// ---------------------------------------------------------------- orbits

/** Kepler's third law: P = 2π√(a³ / G(M + m)). */
export function orbitalPeriod(aM: number, primaryKg: number, bodyKg = 0): Derived {
  const mu = G * (primaryKg + bodyKg);
  const P = aM > 0 ? 2 * Math.PI * Math.sqrt(aM ** 3 / mu) : Infinity;
  return derived(P, 's', 'P = 2π√(a³ / G(M + m))', `2π√((${num(aM)} m)³ / (${num(G)}·${num(primaryKg + bodyKg)} kg))`, aM > 0 ? fmtDuration(P) : '∞ (unbound)');
}

/** Semi-major axis for a period (inverse of Kepler III). */
export function semiMajorFromPeriod(periodS: number, primaryKg: number, bodyKg = 0): number {
  return Math.cbrt((G * (primaryKg + bodyKg) * periodS * periodS) / (4 * Math.PI * Math.PI));
}

/** Circular orbital speed v = √(GM/r). */
export function circularSpeed(r: number, primaryKg: number): Derived {
  const v = Math.sqrt((G * primaryKg) / r);
  return derived(v / 1000, 'km/s', 'v_c = √(GM / r)', `√(${num(G)}·${num(primaryKg)} kg / ${num(r)} m)`);
}

/** Periapsis and apoapsis q = a(1 − e), Q = a(1 + e). */
export function apsides(aM: number, e: number): { peri: Derived; apo: Derived } {
  return {
    peri: derived(aM * (1 - e), 'm', 'q = a(1 − e)', `${num(aM)} m·(1 − ${num(e)})`, fmtLength(aM * (1 - e))),
    apo: derived(aM * (1 + e), 'm', 'Q = a(1 + e)', `${num(aM)} m·(1 + ${num(e)})`, e < 1 ? fmtLength(aM * (1 + e)) : '∞'),
  };
}

/** Hill sphere r_H = a(1 − e)∛(m / 3M). */
export function hillRadius(aM: number, e: number, bodyKg: number, primaryKg: number): Derived {
  const r = aM * (1 - e) * Math.cbrt(bodyKg / (3 * primaryKg));
  return derived(r, 'm', 'r_H = a(1 − e)∛(m / 3M)', `${num(aM)} m·(1 − ${num(e)})·∛(${num(bodyKg)} / (3·${num(primaryKg)}))`, fmtLength(r));
}

/** Fluid Roche limit d = 2.44 R_M (ρ_M / ρ_m)^(1/3) (densities in any common unit). */
export function rocheLimit(primaryR: number, primaryRho: number, satRho: number): Derived {
  const d = 2.44 * primaryR * Math.cbrt(primaryRho / satRho);
  return derived(d, 'm', 'd = 2.44 R (ρ_M / ρ_m)^⅓', `2.44·${num(primaryR)} m·(${num(primaryRho)} / ${num(satRho)})^⅓`, fmtLength(d));
}

// ---------------------------------------------------------------- climate

/** Luminosity (W) of a star from its radius and temperature: L = 4πR²σT⁴. */
export function luminosity(R: number, teff: number): Derived {
  const L = 4 * Math.PI * R * R * SIGMA * teff ** 4;
  return derived(L / L_SUN, 'L☉', 'L = 4πR²σT⁴', `4π·(${num(R)} m)²·${num(SIGMA)}·(${num(teff)} K)⁴`);
}

/** Equilibrium temperature of a fast rotator: T = (L(1 − A) / (16πσd²))^¼. */
export function equilibriumTemp(lumW: number, dM: number, albedo: number): Derived {
  const T = Math.pow((lumW * (1 - albedo)) / (16 * Math.PI * SIGMA * dM * dM), 0.25);
  return derived(T, 'K', 'T_eq = (L(1 − A) / (16πσd²))^¼', `(${num(lumW)} W·(1 − ${num(albedo)}) / (16π·${num(SIGMA)}·(${num(dM)} m)²))^¼`);
}

/** Surface temperature with a greenhouse warming ΔT (K): T_s = T_eq + ΔT. */
export function surfaceTemp(teq: number, greenhouseK: number): Derived {
  const T = teq + greenhouseK;
  return derived(T, 'K', 'T_s = T_eq + ΔT_greenhouse', `${num(teq)} K + ${num(greenhouseK)} K`, `${num(T)} K (${num(T - 273.15)} °C)`);
}

/** Atmospheric scale height H = RT / (Mg) (molar mass in kg/mol). */
export function scaleHeight(tempK: number, molarKgMol: number, g: number): Derived {
  const H = (R_GAS * tempK) / (molarKgMol * g);
  return derived(H / 1000, 'km', 'H = RT / (Mg)', `${num(R_GAS)}·${num(tempK)} K / (${num(molarKgMol)} kg/mol·${num(g)} m/s²)`);
}

/** What water does at a surface temperature (no pressure dependence beyond the triple point). */
export function waterState(tempK: number, pressureBar: number): string {
  if (pressureBar < 0.006) return 'no liquid water (pressure below the triple point)';
  if (tempK < 273.15) return 'ice';
  // boiling point from Clausius-Clapeyron about 1 bar / 373 K
  const boil = 1 / (1 / 373.15 - (R_GAS / 40660) * Math.log(Math.max(pressureBar, 1e-6) / 1.01325));
  return tempK < boil ? 'liquid oceans possible' : 'water boils off (steam)';
}

/** Conservative habitable zone (Kopparapu-like fluxes 1.1 and 0.53 of the Earth's): d = √(L / S). */
export function habitableZone(lumW: number): { inner: Derived; outer: Derived } {
  const L = lumW / L_SUN;
  const d = (s: number) => Math.sqrt(L / s) * AU;
  return {
    inner: derived(d(1.1), 'm', 'd_in = √(L / 1.1 L☉) AU', `√(${num(L)} / 1.1) AU`, fmtLength(d(1.1))),
    outer: derived(d(0.53), 'm', 'd_out = √(L / 0.53 L☉) AU', `√(${num(L)} / 0.53) AU`, fmtLength(d(0.53))),
  };
}

// ---------------------------------------------------------------- stars

/**
 * Main-sequence star from its mass (Suns): luminosity (piecewise mass-luminosity relation),
 * radius (R ∝ M^0.8 below a Sun, M^0.57 above), effective temperature from L = 4πR²σT⁴.
 */
export function mainSequence(massSun: number): { lum: Derived; radius: Derived; teff: Derived; life: Derived } {
  const m = Math.max(0.08, massSun);
  let k: number, p: number;
  if (m < 0.43) { k = 0.23; p = 2.3; } else if (m < 2) { k = 1; p = 4; } else if (m < 55) { k = 1.4; p = 3.5; } else { k = 32000; p = 1; }
  const L = k * m ** p;
  const rp = m < 1 ? 0.8 : 0.57;
  const R = m ** rp;
  const T = T_SUN * Math.pow(L / (R * R), 0.25);
  const life = 1e10 * m / L; // years
  return {
    lum: derived(L, 'L☉', `L = ${k === 1 ? '' : `${k}·`}M^${p}`, `${k === 1 ? '' : `${k}·`}${num(m)}^${p}`),
    radius: derived(R * R_SUN, 'm', `R = M^${rp} R☉`, `${num(m)}^${rp} R☉`, `${num(R)} R☉ (${num(R * R_SUN / 1e3)} km)`),
    teff: derived(T, 'K', 'T = T☉ (L / R²)^¼', `${T_SUN} K·(${num(L)} / ${num(R)}²)^¼`),
    life: derived(life, 'yr', 't = 10¹⁰ yr · M / L', `10¹⁰ yr·${num(m)} / ${num(L)}`, `${num(life)} years`),
  };
}

// ---------------------------------------------------------------- black holes

export function schwarzschildRadius(massKg: number): Derived {
  const r = (2 * G * massKg) / (C * C);
  return derived(r, 'm', 'r_s = 2GM / c²', `2·${num(G)}·${num(massKg)} kg / (${num(C)} m/s)²`, fmtLength(r));
}
/** Innermost stable circular orbit of a Kerr hole of dimensionless spin a (prograde): Bardeen et al. 1972. */
export function isco(massKg: number, spin = 0): Derived {
  const a = Math.max(-0.998, Math.min(0.998, spin));
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  const rg = (G * massKg) / (C * C);
  const r = rg * (3 + z2 - Math.sign(a) * Math.sqrt((3 - z1) * (3 + z1 + 2 * z2)));
  return a === 0
    ? derived(r, 'm', 'r_ISCO = 6GM / c² = 3 r_s', `6·${num(G)}·${num(massKg)} kg / (${num(C)} m/s)²`, fmtLength(r))
    : derived(r, 'm', 'r_ISCO = (GM/c²)(3 + Z₂ − √((3 − Z₁)(3 + Z₁ + 2Z₂)))', `${num(rg)} m·${num(r / rg)}`, fmtLength(r));
}
export function photonSphere(massKg: number): Derived {
  const r = (3 * G * massKg) / (C * C);
  return derived(r, 'm', 'r_ph = 3GM / c² = 1.5 r_s', `3·${num(G)}·${num(massKg)} kg / (${num(C)} m/s)²`, fmtLength(r));
}
/** Hawking temperature T = ħc³ / (8πGMk). */
export function hawkingTemp(massKg: number): Derived {
  const T = (1.054571817e-34 * C ** 3) / (8 * Math.PI * G * massKg * 1.380649e-23);
  return derived(T, 'K', 'T_H = ħc³ / (8πGMk_B)', `ħc³ / (8π·${num(G)}·${num(massKg)} kg·k_B)`);
}
