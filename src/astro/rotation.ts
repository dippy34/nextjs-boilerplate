import { Matrix4 } from 'three';
import { DEG, J2000_JD } from '../core/units';

/**
 * IAU WGCCRE rotation model as stored in NAIF PCK text kernels (pck00011):
 *   alpha0 = ra[0] + ra[1] T + ra[2] T^2 + sum(nutRa[k] sin(theta_k))
 *   delta0 = dec[0] + dec[1] T + dec[2] T^2 + sum(nutDec[k] cos(theta_k))
 *   W      = pm[0] + pm[1] d + pm[2] d^2 + sum(nutPm[k] sin(theta_k))
 * with T in Julian centuries and d in days since J2000 (TDB), and
 * theta_k = A_k + B_k T the planetary-system nutation/precession angles.
 */
export interface RotationModel {
  ra: number[];
  dec: number[];
  pm: number[];
  nutRa?: number[];
  nutDec?: number[];
  nutPm?: number[];
  system?: number;
}

export type NutPrecAngles = Record<string, number[][]>;

const poly = (c: number[], x: number) => (c[0] ?? 0) + (c[1] ?? 0) * x + (c[2] ?? 0) * x * x;

export interface Orientation {
  /** pole right ascension / declination (deg) and prime meridian angle (deg) */
  ra: number;
  dec: number;
  w: number;
}

export function evaluateRotation(model: RotationModel, angles: NutPrecAngles, jd: number, out: Orientation): Orientation {
  const d = jd - J2000_JD;
  const T = d / 36525;
  let ra = poly(model.ra, T);
  let dec = poly(model.dec, T);
  let w = poly(model.pm, d);
  if (model.system !== undefined && (model.nutRa || model.nutDec || model.nutPm)) {
    const sys = angles[String(model.system)];
    if (sys) {
      const n = Math.max(model.nutRa?.length ?? 0, model.nutDec?.length ?? 0, model.nutPm?.length ?? 0);
      for (let k = 0; k < n && k < sys.length; k++) {
        const th = (sys[k][0] + sys[k][1] * T) * DEG;
        const s = Math.sin(th), c = Math.cos(th);
        if (model.nutRa) ra += (model.nutRa[k] ?? 0) * s;
        if (model.nutDec) dec += (model.nutDec[k] ?? 0) * c;
        if (model.nutPm) w += (model.nutPm[k] ?? 0) * s;
      }
    }
  }
  out.ra = ra;
  out.dec = dec;
  out.w = ((w % 360) + 360) % 360;
  return out;
}

/** Body-fixed -> ICRF rotation: Rz(alpha0 + 90°) Rx(90° - delta0) Rz(W). */
export function orientationMatrix(o: Orientation, out = new Matrix4()): Matrix4 {
  const a = (o.ra + 90) * DEG;
  const b = (90 - o.dec) * DEG;
  const w = o.w * DEG;
  const ca = Math.cos(a), sa = Math.sin(a);
  const cb = Math.cos(b), sb = Math.sin(b);
  const cw = Math.cos(w), sw = Math.sin(w);
  // Rz(a) * Rx(b) * Rz(w)
  const m00 = ca * cw - sa * cb * sw;
  const m01 = -ca * sw - sa * cb * cw;
  const m02 = sa * sb;
  const m10 = sa * cw + ca * cb * sw;
  const m11 = -sa * sw + ca * cb * cw;
  const m12 = -ca * sb;
  const m20 = sb * sw;
  const m21 = sb * cw;
  const m22 = cb;
  return out.set(m00, m01, m02, 0, m10, m11, m12, 0, m20, m21, m22, 0, 0, 0, 0, 1);
}

/**
 * Simple uniform rotation for bodies without an IAU model: pole fixed (given
 * in ICRF), prime meridian advancing at 360/period deg/day from a phase w0.
 */
export function uniformRotation(poleRa: number, poleDec: number, periodDays: number, w0: number): RotationModel {
  return { ra: [poleRa, 0, 0], dec: [poleDec, 0, 0], pm: [w0, 360 / periodDays, 0] };
}
