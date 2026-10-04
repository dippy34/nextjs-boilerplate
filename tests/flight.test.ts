import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { UPos } from '../src/core/upos';
import { C, G, GravityField, MSUN, makeSource, gravity, gravityAt, type GravitySource } from '../src/sim/Gravity';
import { conicOf, propagateKepler, timeToRadius } from '../src/sim/Kepler';
import { Predictor } from '../src/sim/Predict';
import { FlightCore, SHIP_SPEC } from '../src/sim/ShipPhysics';

const GM_EARTH = 3.986004418e14;
const R_EARTH = 6.371e6;

function earthField(): { field: GravityField; earth: GravitySource } {
  const field = new GravityField();
  const earth = makeSource({ name: 'Earth', gm: GM_EARTH, radius: R_EARTH, upos: UPos.from(1.2e11, -8e10, 3e10) });
  field.sources = [earth];
  return { field, earth };
}

function holeField(massSun: number): { field: GravityField; hole: GravitySource } {
  const field = new GravityField();
  const gm = G * massSun * MSUN;
  const hole = makeSource({ name: 'BH', gm, rs: (2 * gm) / (C * C), upos: UPos.from(4e19, 1e19, -2e19) });
  field.sources = [hole];
  return { field, hole };
}

/** Fly the core for `T` seconds in frames of `dt`; returns the core. */
function fly(core: FlightCore, T: number, dt: number, onFrame?: (t: number) => boolean | void): FlightCore {
  let t = 0;
  while (t < T - 1e-9) {
    const h = Math.min(dt, T - t);
    core.chooseFrame();
    core.step(h);
    core.place();
    t += h;
    if (core.event && core.event.kind !== 'land') break;
    if (onFrame?.(t)) break;
  }
  return core;
}

function relPos(core: FlightCore, src: GravitySource): Vector3 {
  return core.ship.upos.sub(src.upos, new Vector3());
}
function relVel(core: FlightCore, src: GravitySource): Vector3 {
  return core.ship.vel.clone().sub(src.vel);
}

describe('gravity field', () => {
  it('sums the live sources and follows them when they move', () => {
    const { earth } = earthField();
    gravity.sources = [earth];
    const p = earth.upos.clone().addXYZ(R_EARTH, 0, 0);
    const g = gravityAt(p);
    expect(g.length()).toBeCloseTo(GM_EARTH / R_EARTH ** 2, 6);
    expect(g.x).toBeLessThan(0);
    // the god-mode contract: move or re-weigh a body and the field follows
    earth.upos.addXYZ(2 * R_EARTH, 0, 0);
    earth.gm *= 2;
    const g2 = gravityAt(p);
    expect(g2.x).toBeGreaterThan(0);
    expect(g2.length()).toBeCloseTo((2 * GM_EARTH) / R_EARTH ** 2, 6);
    gravity.sources = [];
  });

  it('uses the Paczyński–Wiita pull for black holes', () => {
    const { field, hole } = holeField(10);
    const p = hole.upos.clone().addXYZ(4 * hole.rs, 0, 0);
    const g = field.gravityAt(p);
    expect(g.length()).toBeCloseTo(hole.gm / (3 * hole.rs) ** 2, 0);
  });
});

describe('Kepler propagation', () => {
  it('agrees with itself over many orbits (ellipse and hyperbola)', () => {
    const r = new Vector3(7e6, 0, 0), v = new Vector3(0, 9000, 1000);
    const c = conicOf(r, v, GM_EARTH);
    expect(c.e).toBeLessThan(1);
    const r1 = r.clone(), v1 = v.clone();
    propagateKepler(r1, v1, GM_EARTH, c.period * 7);
    expect(r1.distanceTo(r)).toBeLessThan(1e-3 * 7e6 * 1e-3);
    const rh = new Vector3(7e6, 0, 0), vh = new Vector3(0, 13000, 0);
    const rb = rh.clone(), vb = vh.clone();
    propagateKepler(rb, vb, GM_EARTH, 50000);
    propagateKepler(rb, vb, GM_EARTH, -50000);
    expect(rb.distanceTo(rh)).toBeLessThan(1);
  });

  it('times an impact', () => {
    const r = new Vector3(R_EARTH + 100e3, 0, 0), v = new Vector3(-200, 5000, 0);
    const t = timeToRadius(r, v, GM_EARTH, R_EARTH);
    expect(t).toBeGreaterThan(0);
    const r1 = r.clone(), v1 = v.clone();
    propagateKepler(r1, v1, GM_EARTH, t);
    expect(r1.length()).toBeCloseTo(R_EARTH, -1);
  });
});

describe('ship flight', () => {
  it('a circular LEO orbit closes after one period to within metres', () => {
    const { field, earth } = earthField();
    const core = new FlightCore(field);
    const r0 = R_EARTH + 400e3;
    core.setCircularOrbit(earth, r0, new Vector3(1, 0, 0), new Vector3(0.2, 0.3, 1).normalize());
    const p0 = relPos(core, earth);
    const T = 2 * Math.PI * Math.sqrt(r0 ** 3 / GM_EARTH);
    fly(core, T, 1 / 60 * 100); // physics warp: 100x frames
    expect(core.event).toBeNull();
    const err = relPos(core, earth).distanceTo(p0);
    expect(err).toBeLessThan(5);
  });

  it('the same orbit at 1x (60 frames a second) and on rails closes too', () => {
    const { field, earth } = earthField();
    const r0 = R_EARTH + 400e3;
    const T = 2 * Math.PI * Math.sqrt(r0 ** 3 / GM_EARTH);
    const core = new FlightCore(field);
    core.setCircularOrbit(earth, r0, new Vector3(0, 1, 0), new Vector3(0, 0, 1));
    const p0 = relPos(core, earth);
    fly(core, T / 10, 1 / 60);
    const rails = new FlightCore(field);
    rails.setCircularOrbit(earth, r0, new Vector3(0, 1, 0), new Vector3(0, 0, 1));
    for (let i = 0; i < 10; i++) { rails.chooseFrame(); rails.stepRails(T / 10 / 10); rails.place(); }
    // after a tenth of an orbit both are at the same place
    expect(relPos(core, earth).distanceTo(relPos(rails, earth))).toBeLessThan(2);
    for (let i = 0; i < 90; i++) { rails.chooseFrame(); rails.stepRails(T / 100); rails.place(); }
    expect(relPos(rails, earth).distanceTo(p0)).toBeLessThan(1);
  });

  it('escape velocity escapes, and a little less comes back', () => {
    for (const [k, escapes] of [[1.02, true], [0.97, false]] as const) {
      const { field, earth } = earthField();
      earth.soi = Infinity;
      const core = new FlightCore(field);
      const r0 = R_EARTH + 300e3;
      core.setCircularOrbit(earth, r0, new Vector3(1, 0, 0), new Vector3(0, 0, 1));
      const v = relVel(core, earth);
      core.ship.vel.copy(earth.vel).addScaledVector(v.normalize(), Math.sqrt((2 * GM_EARTH) / r0) * k);
      let maxR = 0;
      fly(core, 3e6, 60, () => { maxR = Math.max(maxR, relPos(core, earth).length()); });
      const r = relPos(core, earth), vv = relVel(core, earth);
      const energy = vv.lengthSq() / 2 - GM_EARTH / r.length();
      if (escapes) {
        expect(energy).toBeGreaterThan(0);
        expect(r.length()).toBeGreaterThan(50 * r0);
        expect(r.dot(vv)).toBeGreaterThan(0);
      } else {
        expect(energy).toBeLessThan(0);
        expect(maxR).toBeLessThan(200 * r0);
        expect(maxR).toBeGreaterThan(10 * r0);
      }
    }
  });

  it('burning prograde raises the orbit, and burns fuel', () => {
    const { field, earth } = earthField();
    const core = new FlightCore(field);
    const r0 = R_EARTH + 400e3;
    core.setCircularOrbit(earth, r0, new Vector3(1, 0, 0), new Vector3(0, 0, 1));
    // point the nose (−z) along the velocity
    const v = relVel(core, earth).normalize();
    core.ship.quat.setFromUnitVectors(new Vector3(0, 0, -1), v);
    core.ship.throttle = 1;
    const f0 = core.ship.fuel;
    fly(core, 60, 1 / 60);
    core.ship.throttle = 0;
    const c = conicOf(relPos(core, earth), relVel(core, earth), GM_EARTH);
    expect(c.ra - R_EARTH).toBeGreaterThan(1500e3);
    expect(core.ship.fuel).toBeLessThan(f0);
    expect(core.ship.gForce).toBeGreaterThan(0);
  });

  it('touches down gently but crashes when fast', () => {
    for (const [speed, kind] of [[3, 'land'], [80, 'crash']] as const) {
      const { field, earth } = earthField();
      const core = new FlightCore(field);
      core.groundR = R_EARTH;
      core.ship.upos.copy(earth.upos).addXYZ(R_EARTH + 5, 0, 0);
      core.ship.vel.set(-speed, 0, 0);
      fly(core, 30, 1 / 60, () => !!core.event);
      expect(core.event?.kind).toBe(kind);
      if (kind === 'land') {
        expect(core.landed).not.toBeNull();
        // sits there feeling 1 g
        fly(core, 1, 1 / 60);
        expect(relPos(core, earth).length()).toBeCloseTo(R_EARTH, 0);
        expect(core.ship.gForce).toBeCloseTo(GM_EARTH / R_EARTH ** 2 / 9.80665, 1);
      }
    }
  });

  it('air drag slows the ship and heats it', () => {
    const { field, earth } = earthField();
    const core = new FlightCore(field);
    core.atmosphere = { rho0: 1.225, H: 8500, R0: R_EARTH, top: 140e3 };
    const r0 = R_EARTH + 70e3;
    core.setCircularOrbit(earth, r0, new Vector3(1, 0, 0), new Vector3(0, 0, 1));
    const v0 = relVel(core, earth).length();
    fly(core, 20, 1 / 60);
    expect(relVel(core, earth).length()).toBeLessThan(v0 - 1);
    expect(core.ship.heatFlux).toBeGreaterThan(1e4);
    expect(core.ship.hullTemp).toBeGreaterThan(400);
  });
});

describe('black holes', () => {
  /** Angles (rad, in the orbit plane) of successive periapses. */
  function periapses(rStart: number, vk: number, orbits: number) {
    const { field, hole } = holeField(10);
    const core = new FlightCore(field);
    // (a stellar hole tears a ship apart long before this deep; here only the orbit is tested)
    core.spec = { ...SHIP_SPEC, tidalLimit: Infinity };
    core.setCircularOrbit(hole, rStart * hole.rs, new Vector3(1, 0, 0), new Vector3(0, 0, 1));
    const v = relVel(core, hole);
    core.ship.vel.copy(hole.vel).addScaledVector(v, vk);
    const T = 2 * Math.PI * Math.sqrt((rStart * hole.rs) ** 3 / hole.gm);
    const angles: number[] = [];
    let lastRv = 0;
    fly(core, T * orbits, T / 50, () => {
      const r = relPos(core, hole), vv = relVel(core, hole);
      const rv = r.dot(vv);
      if (lastRv < 0 && rv >= 0) angles.push(Math.atan2(r.y, r.x));
      lastRv = rv;
    });
    return { core, angles, hole };
  }

  it('an orbit at 4 rs is stable and its periapsis precesses strongly', () => {
    const { core, angles, hole } = periapses(4, 1.01, 6);
    expect(core.event?.kind ?? null).not.toBe('horizon');
    expect(angles.length).toBeGreaterThanOrEqual(2);
    let d = angles[1] - angles[0];
    d = ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    // Newtonian orbits do not precess; Paczyński–Wiita (like Schwarzschild) does, by a lot this deep
    expect(d).toBeGreaterThan(0.5);
    const r = relPos(core, hole).length();
    expect(r).toBeGreaterThan(3 * hole.rs);
  });

  it('an orbit at 2.9 rs (inside the ISCO) plunges', () => {
    const { core } = periapses(2.9, 0.995, 10);
    expect(core.event?.kind).toBe('horizon');
  });

  it('the tidal limit trips at the right distance for a 10 solar-mass hole', () => {
    const { field, hole } = holeField(10);
    const rLim = Math.cbrt((2 * hole.gm * SHIP_SPEC.length) / SHIP_SPEC.tidalLimit);
    expect(rLim / 1e3).toBeGreaterThan(3000);
    expect(rLim / 1e3).toBeLessThan(5000);
    for (const [k, dies] of [[1.05, false], [0.95, true]] as const) {
      const core = new FlightCore(field);
      core.setCircularOrbit(hole, rLim * k, new Vector3(0, 1, 0), new Vector3(0, 0, 1));
      core.chooseFrame();
      core.step(1e-4);
      expect(core.event?.kind === 'spaghetti').toBe(dies);
    }
  });

  it('a supermassive hole lets you reach its horizon in one piece, with time slowing', () => {
    const { field, hole } = holeField(4.3e6);
    const core = new FlightCore(field);
    core.ship.upos.copy(hole.upos).addXYZ(1.6 * hole.rs, 0, 0);
    core.ship.vel.set(0, 0, 0);
    core.chooseFrame();
    core.step(0.01);
    expect(core.event).toBeNull();
    expect(core.ship.tidal).toBeLessThan(SHIP_SPEC.tidalLimit);
    expect(core.ship.dilation).toBeLessThan(0.65);
    fly(core, 3600, 1);
    expect(core.event?.kind).toBe('horizon');
    expect(relVel(core, hole).length()).toBeLessThan(C);
  });
});

describe('trajectory prediction', () => {
  it('finds periapsis and apoapsis of an elliptic orbit', () => {
    const { field, earth } = earthField();
    const rel = new Vector3(R_EARTH + 300e3, 0, 0);
    const relVel = new Vector3(0, 8400, 0);
    const c = conicOf(rel, relVel, GM_EARTH);
    const p = new Predictor();
    p.start({ frame: earth, rel, relVel, sources: field.sources, groundR: R_EARTH, atmosphere: null, spin: new Vector3(), cdA: 9, mass: 40000, orbits: 2, maxTime: 1e7, maxPoints: 3000 });
    let guard = 0;
    while (!p.done && guard++ < 1000) p.advance(100);
    const ap = p.events.find((e) => e.kind === 'ap')!;
    expect(ap).toBeDefined();
    expect(Math.abs(ap.r - c.ra) / c.ra).toBeLessThan(1e-3);
    expect(Math.abs(ap.t - c.tAp) / c.period).toBeLessThan(0.01);
    expect(p.events.filter((e) => e.kind === 'pe').length).toBeGreaterThanOrEqual(1);
  });

  it('predicts the impact point of a suborbital hop', () => {
    const { field, earth } = earthField();
    const rel = new Vector3(R_EARTH + 100e3, 0, 0);
    const relVel = new Vector3(-100, 3000, 0);
    const tImp = timeToRadius(rel, relVel, GM_EARTH, R_EARTH);
    const p = new Predictor();
    p.start({ frame: earth, rel, relVel, sources: field.sources, groundR: R_EARTH, atmosphere: null, spin: new Vector3(), cdA: 9, mass: 40000, orbits: 2, maxTime: 1e7, maxPoints: 3000 });
    while (!p.done) p.advance(50);
    const imp = p.events.find((e) => e.kind === 'impact')!;
    expect(imp).toBeDefined();
    expect(Math.abs(imp.t - tImp)).toBeLessThan(5);
  });
});
