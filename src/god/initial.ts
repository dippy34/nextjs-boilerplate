import { Vector3 } from 'three';
import { keplerState, type OrbitalElements, stateToElements } from '../astro/kepler';
import type { Body } from '../universe/Body';
import type { SolarSystem } from '../universe/SolarSystem';
import { FLAG_STAR, type PState } from './NBody';

/** G·M (m^3/s^2) above which a body attracts the others in the sandbox (Mimas: 2.5e9) */
export const MASSIVE_GM = 1e9;
/**
 * Moons faster than this (days) ride a Kepler orbit about their planet instead of setting the
 * step (Io, Tethys, Dione, Ariel and the small inner moons; Europa, at 3.55 days, sets it).
 * Editing one makes it a full N-body participant (Sandbox.promote).
 */
export const MIN_MASSIVE_PERIOD_DAYS = 3;

export type SimMode = 'massive' | 'test' | 'rider';

/** How a Solar System body takes part in the sandbox. */
export function simMode(b: Body): SimMode {
  if (b.kind === 'star' || b.kind === 'planet') return 'massive';
  // asteroids (even Vesta) are test particles until edited; dwarf planets attract
  if (b.kind === 'asteroid' || b.kind === 'comet') return 'test';
  if (b.kind === 'moon') {
    if (!b.parent) return 'test';
    if (b.gm < MASSIVE_GM) return 'rider';
    const p = b.parent;
    const mu = p.gm + b.gm;
    const r = b.pos.distanceTo(p.pos);
    const v2 = b.vel.distanceToSquared(p.vel);
    const a = 1 / (2 / r - v2 / mu);
    const periodDays = a > 0 ? (2 * Math.PI * Math.sqrt((a * a * a) / mu)) / 86400 : Infinity;
    return periodDays < MIN_MASSIVE_PERIOD_DAYS ? 'rider' : 'massive';
  }
  return b.gm >= MASSIVE_GM ? 'massive' : 'test';
}

/** J2 and its reference radius (m) of the planets whose bulge matters to their moons */
export const OBLATENESS: Record<number, [number, number]> = {
  399: [1.08263e-3, 6378137], 599: [1.4736e-2, 71492e3], 699: [1.6298e-2, 60330e3], 799: [3.343e-3, 25559e3], 899: [3.411e-3, 24764e3],
};

export function bodyState(b: Body): PState {
  const s: PState = {
    id: b.id, gm: b.gm, r: b.radius, flags: b.kind === 'star' ? FLAG_STAR : 0,
    x: b.pos.x, y: b.pos.y, z: b.pos.z, vx: b.vel.x, vy: b.vel.y, vz: b.vel.z,
  };
  const ob = OBLATENESS[b.id];
  if (ob) {
    const e = b.orientation.elements; // column 2: the body's pole in ICRF
    Object.assign(s, { j2: ob[0], req: ob[1], px: e[8], py: e[9], pz: e[10] });
  }
  return s;
}

/** A moon riding a Kepler orbit about its planet (massless in the integrator: its mass is in the planet's particle). */
export interface Rider { id: number; parent: number; gm: number; el: OrbitalElements }

/**
 * The sandbox's starting point: the Solar System as the ephemeris has it right now (call
 * `system.update(jd)` first). A planet's particle carries its riders' mass and sits at the
 * barycentre of the planet and its riders (`bodiesFromParticles` takes it apart again).
 */
export function solarInitialState(system: SolarSystem, jd: number): { massive: PState[]; tests: PState[]; riders: Rider[] } {
  const massive: PState[] = [], tests: PState[] = [], riders: Rider[] = [];
  const byId = new Map<number, PState>();
  const ridersOf = new Map<number, Body[]>();
  for (const b of system.bodies) {
    if (!b.valid) continue;
    const m = simMode(b);
    if (m === 'massive') { const s = bodyState(b); massive.push(s); byId.set(b.id, s); }
    else if (m === 'test') { const s = { ...bodyState(b), gm: 0 }; tests.push(s); byId.set(b.id, s); }
    else {
      const p = b.parent!;
      const el = stateToElements(b.pos.clone().sub(p.pos), b.vel.clone().sub(p.vel), p.gm + b.gm, jd);
      // keep the ephemeris' mean motion (the planet's oblateness speeds inner moons up, which a
      // point-mass Kepler orbit lacks): same shape, the mean rate of longitude
      scaleMeanMotion(el, riderMuScale(system, b, el, jd), jd);
      riders.push({ id: b.id, parent: p.id, gm: b.gm, el });
      const list = ridersOf.get(p.id) ?? [];
      list.push(b);
      ridersOf.set(p.id, list);
    }
  }
  for (const [pid, list] of ridersOf) {
    const s = byId.get(pid);
    if (!s || s.gm <= 0) continue;
    let gm = s.gm, x = s.gm * s.x, y = s.gm * s.y, z = s.gm * s.z, vx = s.gm * s.vx, vy = s.gm * s.vy, vz = s.gm * s.vz;
    for (const b of list) {
      gm += b.gm;
      x += b.gm * b.pos.x; y += b.gm * b.pos.y; z += b.gm * b.pos.z;
      vx += b.gm * b.vel.x; vy += b.gm * b.vel.y; vz += b.gm * b.vel.z;
    }
    Object.assign(s, { gm, x: x / gm, y: y / gm, z: z / gm, vx: vx / gm, vy: vy / gm, vz: vz / gm });
  }
  return { massive, tests, riders };
}

/**
 * Factor on a rider's Kepler G·M that gives it the ephemeris' mean motion (1 when unknown).
 */
export function riderMuScale(system: SolarSystem, b: Body, el: OrbitalElements, jd: number): number {
  const n = meanAngularRate(system, b, jd);
  if (!(n > 0) || el.e >= 1) return 1;
  const a = el.q / (1 - el.e);
  return (n * n * a * a * a) / el.mu;
}

/** Change an orbit's G·M by `scale` keeping the body where it is at `jd` (mean motion x sqrt(scale)). */
export function scaleMeanMotion(el: OrbitalElements, scale: number, jd: number): void {
  if (scale === 1 || !(scale > 0) || el.e >= 1) return;
  el.tp += (jd - el.tp) * (1 - 1 / Math.sqrt(scale));
  el.mu *= scale;
}

/** Mean angular rate (rad/s) of a moon about its planet in the ephemeris, over ~20 orbits. */
function meanAngularRate(system: SolarSystem, b: Body, jd: number): number {
  const first = system.satelliteElements(b, jd);
  if (!first) return 0;
  const pos = new Vector3(), vel = new Vector3();
  keplerState(first.el, jd, pos, vel);
  pos.applyMatrix3(first.frame); vel.applyMatrix3(first.frame);
  const nrm = new Vector3().crossVectors(pos, vel).normalize();
  const e1 = pos.clone().normalize(), e2 = new Vector3().crossVectors(nrm, e1);
  const periodDays = (2 * Math.PI * Math.sqrt((pos.length() ** 3) / first.el.mu)) / 86400;
  const span = 20 * periodDays, steps = 400;
  let angle = 0, prev = 0;
  for (let k = 1; k <= steps; k++) {
    const s = system.satelliteElements(b, jd + (span * k) / steps);
    if (!s) return 0;
    keplerState(s.el, jd + (span * k) / steps, pos);
    pos.applyMatrix3(s.frame);
    const a = Math.atan2(pos.dot(e2), pos.dot(e1));
    let d = a - prev;
    d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
    angle += d;
    prev = a;
  }
  return angle / (span * 86400);
}

const _p = new Vector3(), _v = new Vector3();
/**
 * Positions and velocities of the bodies at `jd` from the particles (by id) and the riders: a
 * planet with riders is its particle (the barycentre) minus the riders' mass-weighted offsets.
 * `out` gets an entry for every particle and rider whose parent is known.
 */
export function bodiesFromParticles(particles: Map<number, { gm: number; x: number; y: number; z: number; vx: number; vy: number; vz: number }>,
  riders: Rider[], jd: number, out: Map<number, { x: number; y: number; z: number; vx: number; vy: number; vz: number }>): void {
  for (const [id, s] of particles) {
    const o = out.get(id) ?? { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
    o.x = s.x; o.y = s.y; o.z = s.z; o.vx = s.vx; o.vy = s.vy; o.vz = s.vz;
    out.set(id, o);
  }
  const rel = new Map<Rider, number[]>();
  for (const r of riders) {
    const p = particles.get(r.parent);
    if (!p) continue;
    keplerState(r.el, jd, _p, _v);
    rel.set(r, [_p.x, _p.y, _p.z, _v.x, _v.y, _v.z]);
    // the planet's particle holds the rider's mass: shift the planet back
    if (p.gm > 0) {
      const o = out.get(r.parent)!;
      const f = r.gm / p.gm;
      o.x -= f * _p.x; o.y -= f * _p.y; o.z -= f * _p.z; o.vx -= f * _v.x; o.vy -= f * _v.y; o.vz -= f * _v.z;
    }
  }
  for (const [r, q] of rel) {
    const pb = out.get(r.parent)!;
    const o = out.get(r.id) ?? { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
    o.x = pb.x + q[0]; o.y = pb.y + q[1]; o.z = pb.z + q[2]; o.vx = pb.vx + q[3]; o.vy = pb.vy + q[4]; o.vz = pb.vz + q[5];
    out.set(r.id, o);
  }
}
