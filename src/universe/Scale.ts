/**
 * Size and scale arithmetic for the "how big is this" cues (src/render/ScaleCues.ts, the rumble in
 * src/game/Rumble.ts, the info card): true angular sizes, the shadow of a black hole, Earth
 * comparisons, and how slowly the autopilot should settle in next to something huge.
 */

export const R_EARTH_M = 6.371e6;
export const M_EARTH_KG = 5.9722e24;
export const M_SUN_KG = 1.98847e30;

/** Angular diameter (radians) of a sphere of radius `r` whose centre is `d` away (both metres). */
export function angularDiameter(r: number, d: number): number {
  if (!(r > 0)) return 0;
  if (d <= r) return Math.PI * 2; // inside: it fills everything
  return 2 * Math.asin(r / d);
}

/**
 * Angular diameter (radians) of a Schwarzschild black hole's shadow seen by a static observer at
 * `d` from the centre (metres), `rs` the Schwarzschild radius: sin(a) = (3 sqrt 3 / 2)(rs/d) sqrt(1 - rs/d)
 * (Synge 1966). The photon sphere bends light, so the shadow is 2.6 times wider than the horizon
 * seen from far away; inside the photon sphere (d < 1.5 rs) it covers more than half the sky.
 */
export function shadowDiameter(rs: number, d: number): number {
  if (!(rs > 0)) return 0;
  if (d <= rs) return Math.PI * 2;
  const s = ((3 * Math.sqrt(3)) / 2) * (rs / d) * Math.sqrt(1 - rs / d);
  const a = Math.asin(Math.min(1, s));
  return 2 * (d < 1.5 * rs ? Math.PI - a : a);
}

/** Fraction of the view's height that an angular diameter fills, for a vertical field of view (degrees). */
export function viewFraction(angDiam: number, fovYDeg: number): number {
  const half = Math.min(angDiam / 2, Math.PI / 2 - 1e-6);
  return Math.tan(half) / Math.tan((fovYDeg * Math.PI) / 360);
}

/** How many Earths fit inside a sphere of radius `r` (by volume). */
export function earthsInside(r: number): number {
  return (r / R_EARTH_M) ** 3;
}

/** Group digits of a count for display ("1,321"; "1.3 million"; "4.6e+15"). */
export function formatCount(n: number): string {
  if (n < 1e6) return Math.round(n).toLocaleString('en-US');
  if (n < 1e9) return `${(n / 1e6).toFixed(1)} million`;
  if (n < 1e12) return `${(n / 1e9).toFixed(1)} billion`;
  if (n < 1e15) return `${(n / 1e12).toFixed(1)} trillion`;
  return n.toExponential(1);
}

/** Display an angle in radians: degrees above 1 degree, else arc minutes / seconds. */
export function formatAngle(a: number): string {
  const deg = (a * 180) / Math.PI;
  if (deg >= 359.5) return 'the whole sky';
  if (deg >= 1) return `${deg.toFixed(deg < 10 ? 2 : 1)}°`;
  const min = deg * 60;
  if (min >= 1) return `${min.toFixed(1)}′`;
  return `${(min * 60).toFixed(min * 60 < 10 ? 2 : 1)}″`;
}

/**
 * Info-card rows that put a body's size in human terms: its angular size from here (and how much of
 * the view that is) and how many Earths would fit. `blackHole` makes `radius` the Schwarzschild radius.
 */
export function scaleRows(radius: number, dist: number, fovYDeg: number, blackHole = false): [string, string][] {
  if (!(radius > 0) || !(dist > 0)) return [];
  const rows: [string, string][] = [];
  const a = blackHole ? shadowDiameter(radius, dist) : angularDiameter(radius, dist);
  const f = viewFraction(a, fovYDeg);
  const view = a >= Math.PI ? ' (all around you)' : f >= 0.02 ? ` (${f >= 1 ? 'wider than' : `${Math.round(f * 100)}% of`} the view)` : '';
  rows.push([blackHole ? 'Shadow from here' : 'Angular size', `${formatAngle(a)}${view}`]);
  if (blackHole) {
    rows.push(['Shadow diameter', formatLength(radius * 3 * Math.sqrt(3))]);
    rows.push(['Scale', `${formatCount(earthsInside(radius))} Earths would fit inside the horizon`]);
  } else if (radius > 1.5 * R_EARTH_M) {
    rows.push(['Scale', `${formatCount(earthsInside(radius))} Earths would fit inside`]);
  } else if (radius > 0.02 * R_EARTH_M) {
    rows.push(['Scale', `${(radius / R_EARTH_M).toFixed(radius < 0.1 * R_EARTH_M ? 3 : 2)} × Earth's radius`]);
  }
  return rows;
}

function formatLength(m: number): string {
  if (m < 1e9) return `${Math.round(m / 1e3).toLocaleString('en-US')} km`;
  const au = m / 1.495978707e11;
  return au < 0.1 ? `${(m / 1e9).toFixed(1)} million km` : `${au.toFixed(au < 10 ? 2 : 0)} AU`;
}

/**
 * Autopilot weight: how much longer the final, visible approach takes for a target of radius `r`
 * (metres). 1 for Earth-sized and smaller; Neptune ~1.5; Jupiter ~1.75; the Sun and black holes 2
 * (the cap). The heavy, slow arrival is what makes a giant feel like a giant.
 */
export function approachWeight(r: number): number {
  const k = Math.log10(Math.max(r, 1) / (2 * R_EARTH_M));
  return k <= 0 ? 1 : 1 + Math.min(1, 0.3 * Math.min(1, 4 * k) + 0.6 * k);
}

/**
 * Rumble level 0..1 from the angular diameter (radians) and mass (kg) of the dominant nearby body:
 * silent below a few degrees, full when it fills most of the view; heavier bodies are louder.
 */
export function rumbleLevel(angDiam: number, massKg: number): number {
  const s = smooth(0.05, 1.6, angDiam);
  const m = Math.max(0, Math.min(1, (Math.log10(Math.max(massKg, 1) / M_EARTH_KG) + 3) / 9)); // Moon ~0.1, Earth 0.33, Jupiter 0.6, Sun 0.94
  return s * (0.25 + 0.75 * m);
}

/** Rumble pitch (Hz): lower for heavier bodies, 46 Hz for the Moon down to 27 Hz for black holes. */
export function rumblePitch(massKg: number): number {
  const m = Math.max(0, Math.min(1, (Math.log10(Math.max(massKg, 1) / M_EARTH_KG) + 2) / 12));
  return 46 - 19 * m;
}

function smooth(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
