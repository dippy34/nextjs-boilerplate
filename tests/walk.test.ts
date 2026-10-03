import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  EYE_STAND, G_NEWTON, JUMP_SPEED, SLOPE_LIMIT, WALK_SPEED, WalkBody, cannotWalkReason, escapeSpeed, gravityAt, jumpSpeed, runSpeed,
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
