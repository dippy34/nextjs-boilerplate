import { Matrix4, Vector3 } from 'three';
import { type OrbitalElements, stateToElements } from '../astro/kepler';
import { equToEcl } from '../core/frames';
import { Body } from '../universe/Body';
import type { God } from './God';
import { FLAG_BLACK_HOLE, FLAG_STAR } from './NBody';
import { G, L_SUN, mainSequence, M_SUN } from './physics';
import type { Entity } from './Sandbox';

/** Bond albedo, greenhouse warming (K), surface pressure (bar), mean molar mass (kg/mol) of the worlds that have them. */
export const CLIMATE: Record<number, { albedo: number; greenhouse: number; pressure: number; molar: number }> = {
  199: { albedo: 0.088, greenhouse: 0, pressure: 0, molar: 0 },
  299: { albedo: 0.76, greenhouse: 503, pressure: 92, molar: 0.0434 },
  399: { albedo: 0.306, greenhouse: 33, pressure: 1.013, molar: 0.02897 },
  301: { albedo: 0.11, greenhouse: 0, pressure: 0, molar: 0 },
  499: { albedo: 0.25, greenhouse: 5, pressure: 0.006, molar: 0.0434 },
  599: { albedo: 0.343, greenhouse: 0, pressure: 0, molar: 0.0023 },
  699: { albedo: 0.342, greenhouse: 0, pressure: 0, molar: 0.0021 },
  606: { albedo: 0.22, greenhouse: 12, pressure: 1.47, molar: 0.0280 },
  799: { albedo: 0.3, greenhouse: 0, pressure: 0, molar: 0.0026 },
  899: { albedo: 0.29, greenhouse: 0, pressure: 0, molar: 0.0026 },
  999: { albedo: 0.72, greenhouse: 0, pressure: 1e-5, molar: 0.028 },
};

/** Everything the editor shows about one selectable thing, whether the sandbox runs or not. */
export interface BodyView {
  id: number;
  name: string;
  kind: 'star' | 'hole' | 'planet' | 'moon' | 'small';
  massKg: number;
  radius: number;
  req: number;
  rpol: number;
  pos: Vector3;
  vel: Vector3;
  /** orbit about the parent (ecliptic elements), null for the root */
  orbit: { parentId: number; parentName: string; parentMassKg: number; parentRadius: number; el: OrbitalElements } | null;
  /** sidereal rotation period (s, signed: negative = retrograde), null when tidally locked */
  rotation: number | null;
  locked: boolean;
  /** angle between the spin axis and the orbit normal (deg) */
  obliquity: number;
  albedo: number;
  greenhouse: number;
  pressure: number;
  molar: number;
  bhSpin: number;
  /** the star that lights it most: luminosity (W), distance (m), name */
  light: { lum: number; d: number; name: string } | null;
}

/** Luminosity (W) of a star entity or body: the main-sequence relation scaled so the Sun is the Sun. */
export function starLuminosity(massKg: number): number {
  return L_SUN * (mainSequence(massKg / M_SUN).lum.value / mainSequence(1).lum.value);
}

const POLE_ECL = new Vector3(0, -0.3977771559, 0.9174820621);

export function bodyView(god: God, id: number): BodyView | null {
  const sb = god.sandbox;
  const e: Entity | null = sb.entityOf(id);
  const b: Body | null = e ? e.body : god.app.system.byId.get(id) ?? null;
  if (!e && (!b || !b.valid)) return null;
  const gm = e?.gm ?? b!.gm;
  const R = e?.radius ?? b!.radius;
  const req = b ? (b.radii[0] + b.radii[1]) / 2 : R;
  const rpol = b ? b.radii[2] : R;
  const pos = (e?.pos ?? b!.pos).clone(), vel = (e?.vel ?? b!.vel).clone();
  const flags = e?.flags ?? (b?.kind === 'star' ? FLAG_STAR : 0);
  const kind: BodyView['kind'] = flags & FLAG_BLACK_HOLE ? 'hole' : flags & FLAG_STAR ? 'star'
    : b?.kind === 'moon' || e?.spawn?.type === 'moon' ? 'moon' : b && (b.kind === 'asteroid' || b.kind === 'tno' || b.kind === 'comet') ? 'small' : 'planet';
  // orbit
  let orbit: BodyView['orbit'] = null;
  if (e) {
    const o = sb.orbitOf(e);
    const p = o ? sb.entityOf(o.parent) : null;
    if (o && p) orbit = { parentId: p.id, parentName: p.name, parentMassKg: p.gm / G, parentRadius: p.radius, el: o.el };
  } else if (b?.parent) {
    const p = b.parent;
    const r = equToEcl(b.pos.clone().sub(p.pos)), v = equToEcl(b.vel.clone().sub(p.vel));
    orbit = { parentId: p.id, parentName: p.name, parentMassKg: p.gm / G, parentRadius: p.radius, el: stateToElements(r, v, p.gm + b.gm, sb.jd) };
  }
  // rotation and obliquity
  let rotation: number | null = null, locked = false;
  const m = new Matrix4();
  if (e) {
    locked = e.spin.locked && !e.customSpin;
    rotation = locked ? null : e.spin.rate !== 0 ? (2 * Math.PI) / e.spin.rate : Infinity;
    sb.orient(e, m);
    if (!e.customSpin && b) m.copy(b.orientation);
  } else if (b) {
    if (b.rotation) rotation = (360 / b.rotation.pm[1]) * 86400;
    else if (b.kind === 'moon') locked = true;
    else { const h = b.meta.rotPeriodHours as number | undefined; rotation = h ? h * 3600 : null; }
    m.copy(b.orientation);
  }
  const axis = new Vector3(m.elements[8], m.elements[9], m.elements[10]).normalize();
  let normal = POLE_ECL.clone();
  if (orbit) {
    const pe = sb.entityOf(orbit.parentId);
    const pp = pe?.pos ?? god.app.system.byId.get(orbit.parentId)?.pos, pv = pe?.vel ?? god.app.system.byId.get(orbit.parentId)?.vel;
    if (pp && pv) { const h = pos.clone().sub(pp).cross(vel.clone().sub(pv)); if (h.lengthSq() > 0) normal = h.normalize(); }
  }
  const obliquity = (Math.acos(Math.max(-1, Math.min(1, axis.dot(normal)))) * 180) / Math.PI;
  // climate
  const cl = CLIMATE[id];
  const ph = e?.phys;
  // brightest star at its place
  let light: BodyView['light'] = null;
  if (kind !== 'star' && kind !== 'hole') {
    let best = -1;
    const consider = (name: string, massKg: number, p: Vector3) => {
      const L = starLuminosity(massKg), d = Math.max(p.distanceTo(pos), 1);
      if (L / (d * d) > best) { best = L / (d * d); light = { lum: L, d, name }; }
    };
    if (sb.active) { for (const s of sb.entities.values()) if (s.flags & FLAG_STAR) consider(s.name, s.gm / G, s.pos); }
    else { const sun = god.app.system.sun; consider(sun.name, sun.gm / G, sun.pos); }
  }
  return {
    id, name: e?.name ?? b!.name, kind, massKg: gm / G, radius: R, req, rpol, pos, vel, orbit, rotation, locked, obliquity,
    albedo: ph?.albedo ?? cl?.albedo ?? b?.albedo ?? 0.3,
    greenhouse: ph?.greenhouse ?? cl?.greenhouse ?? 0,
    pressure: ph?.pressure ?? cl?.pressure ?? 0,
    molar: ph?.molar ?? cl?.molar ?? 0.029,
    bhSpin: ph?.spin ?? 0,
    light,
  };
}
