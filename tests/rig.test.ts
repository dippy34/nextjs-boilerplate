import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { CameraRig } from '../src/app/CameraRig';
import type { Input } from '../src/app/Input';
import { UPos } from '../src/core/upos';
import type { SpaceObject } from '../src/universe/Body';

const idle = {
  keys: new Set<string>(),
  consume: () => ({ left: { dx: 0, dy: 0 }, right: { dx: 0, dy: 0 }, wheel: 0 }),
} as unknown as Input;

function target(radius: number): SpaceObject {
  return { key: 't', name: 'T', kind: 'planet', radius, upos: new UPos(), parentObject: null, info: () => [] } as unknown as SpaceObject;
}

/** Fly from `d0` to `d1` (metres) and record the distance every 1/72 s. */
function fly(d0: number, d1: number, radius: number): number[] {
  const rig = new CameraRig();
  rig.upos.set(d0, 0, 0);
  rig.flyTo(target(radius), d1, undefined, false);
  const ds: number[] = [];
  for (let i = 0; i < 72 * 20 && rig.autopilot; i++) {
    rig.update(1 / 72, idle);
    ds.push(rig.upos.toVector3().length());
  }
  return ds;
}

describe('autopilot approach', () => {
  for (const [name, d0, R] of [['Earth to Saturn', 1.3e12, 5.8e7], ['Earth to Moon', 3.8e8, 1.74e6], ['across the Saturn system', 1.2e9, 2.5e6]] as const) {
    it(`${name}: monotone, no change of pace, time spent where the target is visible`, () => {
      const d1 = R * 2.5;
      const ds = fly(d0, d1, R);
      expect(ds[ds.length - 1]).toBeCloseTo(d1, -Math.floor(Math.log10(d1)) + 2);
      const L = ds.map(Math.log);
      const steps = L.slice(1).map((x, i) => x - L[i]);
      expect(Math.max(...steps)).toBeLessThanOrEqual(1e-12); // never moves away
      // pace changes smoothly: the zoom speed (log distance per frame) never jumps between
      // frames by more than 3 % of its peak (a cut or a second motion would)
      const peak = Math.max(...steps.map(Math.abs));
      let jerk = 0;
      for (let i = 1; i < steps.length; i++) jerk = Math.max(jerk, Math.abs(steps[i] - steps[i - 1]) / peak);
      expect(jerk).toBeLessThan(0.03);
      const dotFrames = ds.filter((d) => d > R * 300).length;
      expect(dotFrames / ds.length).toBeLessThan(0.45);
      expect(ds.length / 72).toBeLessThan(9);
    });
  }
});

describe('autopilot arrival direction', () => {
  it('swings round to the requested side during the visible approach, distance still monotone, target kept in view', () => {
    const rig = new CameraRig();
    const rs = 62e3;
    const t = target(rs);
    rig.upos.set(7e19, 0, 0);
    const arrive = new Vector3(0, Math.cos(0.17), Math.sin(0.17)); // 90 degrees away, just above a plane
    rig.flyTo(t, rs * 22, undefined, true, arrive);
    let prev = Infinity;
    let worstAim = 0;
    let swungAt = Infinity;
    for (let i = 0; i < 72 * 20 && rig.autopilot; i++) {
      rig.update(1 / 72, idle);
      const p = rig.upos.toVector3();
      const d = p.length();
      expect(d).toBeLessThanOrEqual(prev * (1 + 1e-12));
      prev = d;
      if (swungAt === Infinity && p.clone().normalize().angleTo(new Vector3(1, 0, 0)) > 0.01) swungAt = d;
      // once the initial turn is done (35 % of the trip), the camera keeps looking at the target
      if (rig.autopilot && rig.gotoProgress >= 0.36) worstAim = Math.max(worstAim, rig.forward().angleTo(p.clone().negate().normalize()));
    }
    const end = rig.upos.toVector3();
    expect(end.length()).toBeCloseTo(rs * 22, -3);
    expect(end.clone().normalize().angleTo(arrive)).toBeLessThan(1e-3);
    expect(swungAt).toBeLessThan(rs * 300 * Math.E ** 2 * 1.01); // only once the target is visible
    expect(worstAim).toBeLessThan(1e-3);
  });

  it('also swings when flying outwards (leaving the galaxy)', () => {
    const rig = new CameraRig();
    const R = 4.6e20;
    rig.upos.set(2.55e20, 0, 0); // the Sun, 8.3 kpc from the centre
    const arrive = new Vector3(-0.57, 0, 0.82);
    rig.flyTo(target(R), R * 2.6, undefined, true, arrive);
    let prev = 0;
    for (let i = 0; i < 72 * 20 && rig.autopilot; i++) {
      rig.update(1 / 72, idle);
      const d = rig.upos.toVector3().length();
      expect(d).toBeGreaterThanOrEqual(prev * (1 - 1e-12));
      prev = d;
    }
    const end = rig.upos.toVector3();
    expect(end.length()).toBeCloseTo(R * 2.6, -18);
    expect(end.normalize().angleTo(arrive)).toBeLessThan(1e-3);
  });
});
