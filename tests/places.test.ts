import { Matrix4, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { UPos } from '../src/core/upos';
import { discOverlap } from '../src/render/Bodies';
import { CometTails } from '../src/render/CometTails';
import type { Body } from '../src/universe/Body';
import { Landmark, LANDMARKS } from '../src/universe/Landmarks';
import { ringFrame } from '../src/universe/RingSpot';

describe('eclipses', () => {
  it('disc overlap: apart, inside, and half way', () => {
    expect(discOverlap(1, 1, 2.5)).toBe(0);
    expect(discOverlap(1, 3, 0.5)).toBeCloseTo(Math.PI, 6);            // small disc wholly covered
    expect(discOverlap(1, 1, 0)).toBeCloseTo(Math.PI, 6);
    const half = discOverlap(1, 100, 100);                               // edge of a huge disc through the centre
    expect(half / Math.PI).toBeGreaterThan(0.45);
    expect(half / Math.PI).toBeLessThan(0.55);
  });
});

describe('places', () => {
  const moon = { name: 'Moon', radius: 1737.4e3, radii: [1737.4e3, 1737.4e3, 1737.4e3], upos: UPos.from(0, 0, 0), orientation: new Matrix4() } as unknown as Body;

  it('landmarks sit on their world at the catalogued coordinates', () => {
    const def = LANDMARKS.find((d) => d.name.startsWith('Apollo 11'))!;
    const l = new Landmark(def, moon);
    const p = l.upos.sub(moon.upos, new Vector3());
    expect(p.length()).toBeCloseTo(moon.radius + def.h, 0);
    expect((Math.asin(p.z / p.length()) * 180) / Math.PI).toBeCloseTo(0.674, 3);
    expect((Math.atan2(p.y, p.x) * 180) / Math.PI).toBeCloseTo(23.473, 3);
    // arriving from above, on the sunlit side
    const dir = l.approachDir(new Vector3(1, 0, 0));
    expect(dir.dot(l.up())).toBeGreaterThan(0.4);
  });

  it('mountains are seen from a low viewpoint, across the sunlight', () => {
    const def = LANDMARKS.find((d) => d.name === 'Mount Everest')!;
    const l = new Landmark(def, moon);
    const sun = new Vector3(0.3, -0.2, 1).normalize();
    const dir = l.approachDir(sun);
    expect((Math.asin(dir.dot(l.up())) * 180) / Math.PI).toBeCloseTo(def.elev!, 6);
    const side = sun.clone().addScaledVector(l.up(), -sun.dot(l.up())).normalize();
    expect(dir.dot(side)).toBeGreaterThan(0.3);   // still on the sunlit side
  });

  it('every landmark names a real body and lies on the map', () => {
    for (const d of LANDMARKS) {
      expect(['Moon', 'Mars', 'Mercury', 'Earth']).toContain(d.body);
      expect(Math.abs(d.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(d.lon)).toBeLessThanOrEqual(180);
    }
  });

  it('the ring frame is orthonormal with z along the pole, whatever the spin', () => {
    const tilt = new Matrix4().makeRotationX(0.47);
    for (const spin of [0, 1.3, 4.2]) {
      const o = tilt.clone().multiply(new Matrix4().makeRotationZ(spin));
      const f = ringFrame(o);
      const x = new Vector3().setFromMatrixColumn(f, 0), y = new Vector3().setFromMatrixColumn(f, 1), z = new Vector3().setFromMatrixColumn(f, 2);
      expect(x.dot(y)).toBeCloseTo(0, 9);
      expect(z.angleTo(new Vector3(0, 0, 1).applyMatrix4(tilt))).toBeLessThan(1e-9);
      // independent of the spin angle: particles do not turn with the planet
      expect(x.angleTo(new Vector3().setFromMatrixColumn(ringFrame(tilt), 0))).toBeLessThan(1e-9);
    }
  });
});

describe('comets', () => {
  it('coma size grows with activity and nearness to the Sun', () => {
    const bright = CometTails.comaRadius(6, 10, 1);
    const faint = CometTails.comaRadius(14, 10, 1);
    const far = CometTails.comaRadius(6, 10, 4);
    expect(bright).toBeGreaterThan(faint);
    expect(bright).toBeGreaterThan(far);
    expect(bright).toBeGreaterThan(1e7);   // tens of thousands of km for a bright comet at 1 AU
    expect(bright).toBeLessThan(1e9);
  });
});
