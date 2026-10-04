import { Matrix3, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  EYE_STAND, G_NEWTON, GroundMarks, STEP_UP, airDrag, JUMP_SPEED, SLOPE_LIMIT, WALK_SPEED, WalkBody, cannotWalkReason, escapeSpeed, gravityAt, jumpSpeed, runSpeed,
  type GroundFn, type WalkIntent,
} from '../src/app/Walk';

const MOON = { gm: 4.9028e12, r: 1737.4e3 };
const MARS = { gm: 4.282837e13, r: 3389.5e3 };
const EARTH = { gm: 3.986004418e14, r: 6371.0e3 };
const MIMAS = { gm: 2.503e9, r: 198.2e3 };

const sphere = (R: number): GroundFn => () => R;

function intent(over: Partial<WalkIntent> = {}): WalkIntent {
  return { wish: new Vector3(), run: false, crouch: false, jump: false, ...over };
}

function walker(w: { gm: number; r: number }, ground: GroundFn = sphere(w.r)): WalkBody {
  const b = new WalkBody();
  b.gm = w.gm;
  b.placeOn(new Vector3(0, 0, 1), ground);
  return b;
}

/** Jump straight up and return the flight time and apex. */
function jump(w: { gm: number; r: number }, dt = 1 / 90): { t: number; apex: number; steps: number } {
  const ground = sphere(w.r);
  const b = walker(w, ground);
  b.step(dt, intent({ jump: true }), ground);
  let t = dt, steps = 1;
  while (!b.onGround && steps < 1e6) { b.step(dt, intent(), ground); t += dt; steps++; }
  return { t, apex: b.apex, steps };
}

describe('gravity', () => {
  it('matches the surface gravity of the Moon, Mars and Earth', () => {
    expect(gravityAt(MOON.gm, MOON.r)).toBeCloseTo(1.62, 2);
    expect(gravityAt(MARS.gm, MARS.r)).toBeCloseTo(3.73, 1);
    expect(gravityAt(EARTH.gm, EARTH.r)).toBeCloseTo(9.82, 1);
  });
  it('follows GM/r² for a generated planet from its mass', () => {
    const m = 2 * 5.972e24, r = 1.3 * 6371e3;
    expect(gravityAt(G_NEWTON * m, r)).toBeCloseTo((9.82 * 2) / 1.69, 1);
  });
});

describe('jumps', () => {
  it('a 2.5 m/s jump on the Moon rises ~1.9 m and lasts ~3 s', () => {
    const { t, apex } = jump(MOON);
    expect(apex).toBeGreaterThan(1.85);
    expect(apex).toBeLessThan(1.98);
    expect(t).toBeGreaterThan(3.0);
    expect(t).toBeLessThan(3.15);
  });
  it('is a true ballistic arc (apex = v²/2g, time = 2v/g) on Mars and Earth', () => {
    for (const w of [MARS, EARTH]) {
      const g = gravityAt(w.gm, w.r);
      const { t, apex } = jump(w);
      expect(apex).toBeCloseTo((JUMP_SPEED * JUMP_SPEED) / (2 * g), 2);
      expect(Math.abs(t - (2 * JUMP_SPEED) / g)).toBeLessThan(0.025);
    }
  });
  it('never launches anyone into orbit, even on a small moon', () => {
    const g = gravityAt(MIMAS.gm, MIMAS.r);
    expect(jumpSpeed(g)).toBeLessThan(0.05 * escapeSpeed(MIMAS.gm, MIMAS.r));
    const { apex } = jump(MIMAS, 1 / 30);
    expect(apex).toBeLessThan(26);
  });
  it('is independent of the frame rate', () => {
    const a = jump(MOON, 1 / 120), b = jump(MOON, 1 / 30);
    expect(Math.abs(a.apex - b.apex)).toBeLessThan(0.02);
    expect(Math.abs(a.t - b.t)).toBeLessThan(1 / 30 + 1e-9);
  });
});

describe('walking', () => {
  it('reaches walking and running speed and stays on the ground', () => {
    const ground = sphere(EARTH.r);
    const b = walker(EARTH, ground);
    b.lope = false;
    const wish = new Vector3(1, 0, 0);
    for (let i = 0; i < 180; i++) b.step(1 / 60, intent({ wish }), ground);
    expect(b.groundSpeed).toBeCloseTo(WALK_SPEED, 3);
    expect(b.onGround).toBe(true);
    expect(Math.abs(b.height(ground))).toBeLessThan(1e-6);
    for (let i = 0; i < 180; i++) b.step(1 / 60, intent({ wish, run: true }), ground);
    expect(b.groundSpeed).toBeCloseTo(runSpeed(9.82), 1);
    expect(b.groundSpeed).toBeGreaterThan(3);
    expect(b.groundSpeed).toBeLessThanOrEqual(4);
  });
  it('accelerates more slowly in low gravity (less traction)', () => {
    const speedAfter = (w: { gm: number; r: number }) => {
      const ground = sphere(w.r);
      const b = walker(w, ground);
      for (let i = 0; i < 15; i++) b.step(1 / 60, intent({ wish: new Vector3(1, 0, 0) }), ground);
      return b.groundSpeed;
    };
    expect(speedAfter(MOON)).toBeLessThan(speedAfter(EARTH));
  });
  it('running on the Moon becomes a bounding lope', () => {
    const ground = sphere(MOON.r);
    const b = walker(MOON, ground);
    let air = 0, hops = 0;
    for (let i = 0; i < 60 * 10; i++) {
      const was = b.onGround;
      b.step(1 / 60, intent({ wish: new Vector3(0, 1, 0), run: true }), ground);
      if (!b.onGround) air += 1 / 60;
      if (was && !b.onGround) hops++;
    }
    expect(hops).toBeGreaterThan(4);
    expect(air).toBeGreaterThan(4);
    expect(b.groundSpeed).toBeGreaterThan(2.5);
  });
  it('follows rolling ground without leaving it at walking speed', () => {
    const R = MOON.r;
    // gentle hills: 3 m high, 60 m apart
    const hills: GroundFn = (n) => R + 3 * Math.sin((Math.atan2(n.y, n.x) * R) / 60 * 2 * Math.PI);
    const b = new WalkBody();
    b.gm = MOON.gm;
    b.placeOn(new Vector3(1, 0, 0), hills);
    const wish = new Vector3(0, 1, 0);
    let maxH = 0;
    for (let i = 0; i < 60 * 30; i++) {
      b.step(1 / 60, intent({ wish: wish.copy(b.pos).normalize().cross(new Vector3(0, 0, 1)).negate() }), hills);
      maxH = Math.max(maxH, Math.abs(b.height(hills)));
      expect(Number.isFinite(b.pos.x)).toBe(true);
    }
    expect(maxH).toBeLessThan(0.05);
    expect(b.groundSpeed).toBeGreaterThan(1);
  });
});

describe('slopes', () => {
  /** a plane tilted by `deg` along x near the point (R, 0, 0): ground radius rises with y */
  const tilted = (R: number, deg: number): GroundFn => (n) => R + Math.tan((deg * Math.PI) / 180) * (Math.atan2(n.y, n.x) * R);
  it('walks up a 25° slope', () => {
    const g = tilted(EARTH.r, 25);
    const b = new WalkBody();
    b.gm = EARTH.gm;
    b.placeOn(new Vector3(1, 0, 0), g);
    const r0 = b.radius;
    for (let i = 0; i < 300; i++) b.step(1 / 60, intent({ wish: new Vector3(0, 1, 0) }), g);
    expect((b.slope * 180) / Math.PI).toBeCloseTo(25, 0);
    expect(b.radius - r0).toBeGreaterThan(2);
  });
  it('slides down ground steeper than the limit and cannot climb it', () => {
    const g = tilted(EARTH.r, 45);
    const b = new WalkBody();
    b.gm = EARTH.gm;
    b.placeOn(new Vector3(1, 0, 0), g);
    const r0 = b.radius;
    for (let i = 0; i < 120; i++) b.step(1 / 60, intent({ wish: new Vector3(0, 1, 0) }), g);
    expect(b.slope).toBeGreaterThan(SLOPE_LIMIT);
    expect(b.radius).toBeLessThan(r0 - 1);
  });
});

describe('robustness', () => {
  it('lands on ground that rises under it and absorbs the impact', () => {
    let R = MOON.r;
    const ground: GroundFn = () => R;
    const b = walker(MOON, ground);
    b.step(1 / 60, intent({ jump: true }), ground);
    for (let i = 0; i < 30; i++) b.step(1 / 60, intent(), ground);
    R += 5; // a terrain rebuild puts the ground above the feet
    b.step(1 / 60, intent(), ground);
    expect(b.onGround).toBe(true);
    expect(Math.abs(b.height(ground))).toBeLessThan(1e-6);
  });
  it('recovers from bad numbers', () => {
    const ground = sphere(MOON.r);
    const b = walker(MOON, ground);
    b.vel.set(NaN, 0, 0);
    expect(b.sanitize(new Vector3(0, 0, 1), ground)).toBe(false);
    expect(b.height(ground)).toBeCloseTo(0, 6);
  });
  it('eye height constant is a standing adult', () => {
    expect(EYE_STAND).toBeCloseTo(1.7, 5);
  });
  it('explains why gas giants and stars cannot be walked on', () => {
    expect(cannotWalkReason(null)).toMatch(/Nothing to stand on/);
  });
});

describe('bootprints and dust', () => {
  it('dust kicked up on the Moon flies ballistically and settles', () => {
    const marks = new GroundMarks();
    const R = MOON.r, g = gravityAt(MOON.gm, R);
    const up = new Vector3(0, 0, 1);
    const feet = up.clone().multiplyScalar(R);
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    marks.kick(feet, up, 40, 1.5, new Vector3(), rnd);
    expect(marks.dustCount).toBe(40);
    const cam = feet.clone().addScaledVector(up, 1.7);
    let t = 0;
    // a grain thrown up at <= 1.5 * 1.2 m/s is back on the ground within 2 * 1.8 / 1.62 s
    while (t < 2.4) { marks.update(1 / 60, g, airDrag(null), up, R, new Matrix3(), cam, true); t += 1 / 60; }
    expect(marks.dustCount).toBeGreaterThan(0); // settled grains fade for a moment
    for (let i = 0; i < 60; i++) marks.update(1 / 60, g, 0, up, R, new Matrix3(), cam, true);
    expect(marks.dustCount).toBe(0);
  });
  it('keeps a bounded number of prints', () => {
    const marks = new GroundMarks();
    const up = new Vector3(0, 0, 1);
    for (let i = 0; i < 2000; i++) marks.addPrint(new Vector3(i * 0.7, 0, MOON.r), new Vector3(1, 0, 0), up);
    expect(marks.printCount).toBe(500);
  });
});

describe('rocks', () => {
  const R = MOON.r;
  const flat = sphere(R);
  /** a rock whose sphere has radius `r`, centred `ahead` metres along +y from the walker and `h` above the ground */
  const rock = (ahead: number, r: number, h: number) => ({ centre: new Vector3(0, ahead, R + h), radius: r });
  function walkInto(rocks: { centre: Vector3; radius: number }[], wish: Vector3, seconds: number, gm = MOON.gm) {
    const b = new WalkBody();
    b.gm = gm;
    b.lope = false;
    b.rocks = rocks;
    b.placeOn(new Vector3(0, 0, 1), flat);
    let maxRise = 0, blocked = false;
    for (let i = 0; i < seconds * 60; i++) {
      b.step(1 / 60, intent({ wish: wish.clone() }), flat);
      blocked ||= b.blocked;
      maxRise = Math.max(maxRise, b.radius - R);
      expect(Number.isFinite(b.pos.x)).toBe(true);
    }
    return { b, maxRise, blocked };
  }
  it('a boulder blocks the way: you stop at it, not inside it or on top of it', () => {
    const boulder = rock(3, 1.2, 0.4); // 1.6 m high, its face 1.8 m ahead
    const { b, maxRise, blocked } = walkInto([boulder], new Vector3(0, 1, 0), 6);
    const toCentre = Math.hypot(b.pos.x - boulder.centre.x, b.pos.y - boulder.centre.y);
    expect(toCentre).toBeGreaterThan(boulder.radius * 0.6);
    expect(b.pos.y).toBeLessThan(boulder.centre.y);
    expect(maxRise).toBeLessThan(STEP_UP + 0.1);
    expect(blocked).toBe(true);
  });
  it('walking at a boulder at an angle slides you along it and past', () => {
    const boulder = rock(3, 1.2, 0.4);
    const dir = new Vector3(0.35, 1, 0).normalize();
    const { b, maxRise } = walkInto([boulder], dir, 10);
    expect(b.pos.y).toBeGreaterThan(boulder.centre.y + 1); // got round it
    expect(maxRise).toBeLessThan(STEP_UP + 0.1);
  });
  it('a low rock is stepped onto and off again', () => {
    const low = rock(2, 0.35, -0.1); // its top 0.25 m above the ground
    let onTop = 0;
    const b = new WalkBody();
    b.gm = MOON.gm; b.lope = false; b.rocks = [low];
    b.placeOn(new Vector3(0, 0, 1), flat);
    for (let i = 0; i < 6 * 60; i++) {
      b.step(1 / 60, intent({ wish: new Vector3(0, 1, 0) }), flat);
      onTop = Math.max(onTop, b.radius - R);
    }
    expect(onTop).toBeGreaterThan(0.15);
    expect(onTop).toBeLessThan(0.3);
    expect(b.pos.y).toBeGreaterThan(low.centre.y + 1);
    expect(Math.abs(b.radius - R)).toBeLessThan(0.02);
  });
  it('a jump lands on top of a boulder; standing there you are on the rock', () => {
    const boulder = rock(1.2, 0.8, 0.1); // 0.9 m high, right ahead
    const b = new WalkBody();
    b.gm = MOON.gm; b.lope = false; b.rocks = [boulder];
    b.placeOn(new Vector3(0, -0.3, R).normalize(), flat);
    b.vel.set(0, 0.5, 0); // a slow walking start: the arc carries over the rock and comes down on it
    b.step(1 / 60, intent({ jump: true, wish: new Vector3(0, 1, 0) }), flat);
    let landedHigh = false;
    for (let i = 0; i < 6 * 60; i++) {
      b.step(1 / 60, intent(), flat);
      if (b.landed && b.radius - R > 0.6) landedHigh = true;
    }
    expect(landedHigh).toBe(true);
    expect(b.onGround).toBe(true);
    expect(Math.abs(b.height(flat))).toBeLessThan(1e-6);
  });
});
