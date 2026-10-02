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
