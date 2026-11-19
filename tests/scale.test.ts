import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { CameraRig } from '../src/app/CameraRig';
import type { Input } from '../src/app/Input';
import { UPos } from '../src/core/upos';
import type { SpaceObject } from '../src/universe/Body';
import { dustAlpha, earthPlacement } from '../src/render/ScaleCues';
import { M_EARTH_KG, M_SUN_KG, R_EARTH_M, angularDiameter, approachWeight, earthsInside, formatAngle, rumbleLevel, rumblePitch, scaleRows, shadowDiameter, viewFraction } from '../src/universe/Scale';

const sys = JSON.parse(readFileSync('public/data/solar/system.json', 'utf8')) as { bodies: { id: number; name: string; radii: number[] }[] };
const holes = JSON.parse(readFileSync('public/data/blackholes.json', 'utf8')) as { blackholes: { name: string; massSun: number }[] };
/** mean radius (m) as the app computes it (Body: cube root of the three radii) */
const radius = (id: number) => {
  const r = sys.bodies.find((b) => b.id === id)!.radii;
  return Math.cbrt(r[0] * r[1] * r[2]) * 1e3;
};
const DEG = 180 / Math.PI;

describe('angular sizes against real values (from the app data)', () => {
  it('Earth from the ISS (420 km up) spans ~140°', () => {
    const R = radius(399);
    const a = angularDiameter(R, R + 420e3) * DEG;
    expect(a).toBeGreaterThan(138);
    expect(a).toBeLessThan(141);
  });
  it('Jupiter from Io spans ~19°', () => {
    const a = angularDiameter(radius(599), 421_700e3 - radius(501)) * DEG;
    expect(a).toBeGreaterThan(18.8);
    expect(a).toBeLessThan(19.6);
  });
  it('the Sun from Mercury (mean distance) spans ~1.38°, 2.6x what we see from Earth', () => {
    const a = angularDiameter(radius(10), 0.387098 * 1.495978707e11) * DEG;
    expect(a).toBeCloseTo(1.377, 2);
    const fromEarth = angularDiameter(radius(10), 1.495978707e11) * DEG;
    expect(fromEarth).toBeCloseTo(0.533, 2);
    expect(a / fromEarth).toBeCloseTo(2.58, 1);
  });
  it('Sgr A* shadow at 10 rs spans ~28.5° (Synge), wider than the bare horizon (11.5°)', () => {
    const m = holes.blackholes.find((h) => h.name === 'Sagittarius A*')!.massSun;
    const rs = (2 * 6.6743e-11 * m * M_SUN_KG) / 299792458 ** 2;
    expect(rs / 1e9).toBeCloseTo(12.7, 0); // ~0.085 AU
    const a = shadowDiameter(rs, 10 * rs) * DEG;
    expect(a).toBeGreaterThan(28.2);
    expect(a).toBeLessThan(28.8);
    expect(angularDiameter(rs, 10 * rs) * DEG).toBeCloseTo(11.48, 1);
    // far away the shadow tends to 3 sqrt 3 rs across
    expect(shadowDiameter(rs, 1e6 * rs) / ((3 * Math.sqrt(3) * rs) / (1e6 * rs))).toBeCloseTo(1, 3);
    // inside the photon sphere the shadow covers more than half the sky
    expect(shadowDiameter(rs, 1.2 * rs)).toBeGreaterThan(Math.PI);
  });
});

describe('field of view does not shrink bodies', () => {
  it('desktop default (50° vertical): Jupiter from Io fills a third of the screen height', () => {
    const f = viewFraction(angularDiameter(radius(599), 421_700e3), 50);
    expect(f).toBeGreaterThan(0.3);
    expect(f).toBeLessThan(0.4);
  });
  it('a narrower view makes the same body fill more of it, never less', () => {
    const a = angularDiameter(radius(599), 421_700e3);
    expect(viewFraction(a, 40)).toBeGreaterThan(viewFraction(a, 60));
  });
});

describe('scale readout', () => {
  it('Jupiter holds ~1,300 Earths; the card says so', () => {
    expect(earthsInside(radius(599))).toBeGreaterThan(1250);
    expect(earthsInside(radius(599))).toBeLessThan(1350);
    const rows = scaleRows(radius(599), 421_700e3, 50);
    expect(rows.find((r) => r[0] === 'Scale')![1]).toMatch(/^1,3\d\d Earths would fit inside$/);
    expect(rows[0][1]).toMatch(/^19\.\d° \(3\d% of the view\)$/);
  });
  it('black holes report the shadow and Earths inside the horizon', () => {
    const rows = scaleRows(1.27e10, 1.27e11, 50, true);
    expect(rows[0][0]).toBe('Shadow from here');
    expect(rows.some((r) => /Earths would fit inside the horizon/.test(r[1]))).toBe(true);
  });
  it('formats angles', () => {
    expect(formatAngle(Math.PI / 2)).toBe('90.0°');
    expect(formatAngle(1e-4)).toMatch(/″$/);
  });
});

describe('approach and rumble', () => {
  it('giants get a slower final approach; Earth-sized and smaller do not', () => {
    expect(approachWeight(R_EARTH_M)).toBe(1);
    expect(approachWeight(1.7e6)).toBe(1);
    expect(approachWeight(7e7)).toBeGreaterThan(1.6);
    expect(approachWeight(7e8)).toBeLessThanOrEqual(2);
    expect(approachWeight(1e13)).toBe(2);
  });
  it('rumble grows with angular size and mass, and is silent for small things', () => {
    expect(rumbleLevel(0.01, M_SUN_KG)).toBe(0);
    expect(rumbleLevel(1, M_SUN_KG)).toBeGreaterThan(rumbleLevel(0.3, M_SUN_KG));
    expect(rumbleLevel(1, 318 * M_EARTH_KG)).toBeGreaterThan(rumbleLevel(1, 0.012 * M_EARTH_KG));
    expect(rumbleLevel(3, 4e6 * M_SUN_KG)).toBeLessThanOrEqual(1);
    expect(rumblePitch(4e6 * M_SUN_KG)).toBeLessThan(rumblePitch(M_EARTH_KG));
  });
});

describe('scale cues', () => {
  it('Earth for scale sits over the body, in front of its surface, at its true relative size', () => {
    const R = radius(599), d = 421_700e3;
    const rel = new Vector3(0, 0, -d);
    const pl = earthPlacement(rel, R, new Vector3(0, 0, -1))!;
    // on the disc, off centre
    const off = pl.pos.clone().normalize().angleTo(rel.clone().normalize());
    expect(off).toBeGreaterThan(0.2 * Math.asin(R / d));
    expect(off).toBeLessThan(Math.asin(R / d));
    // in front of the surface along that line of sight
    expect(pl.pos.length()).toBeLessThan(d - R * 0.5);
    // angular size = a real Earth sitting on that spot of Jupiter's surface: ~ R_E / (d - R)
    const ang = (R_EARTH_M * pl.scale) / pl.pos.length();
    expect(ang * (d - R * 0.95)).toBeGreaterThan(R_EARTH_M * 0.9);
    expect(ang * (d - R * 0.95)).toBeLessThan(R_EARTH_M * 1.1);
    // Jupiter's disc is ~11x Earth's
    expect(Math.asin(R / d) / ang).toBeGreaterThan(8);
    expect(Math.asin(R / d) / ang).toBeLessThan(12);
    // looking away: Earth stays on the disc's edge nearest the view
    const side = earthPlacement(rel, R, new Vector3(1, 0, 0))!;
    expect(side.pos.x).toBeGreaterThan(0);
    expect(earthPlacement(rel, R, new Vector3(0, 0, -1))).not.toBeNull();
    expect(earthPlacement(new Vector3(0, 0, -R * 0.5), R, new Vector3(0, 0, -1))).toBeNull();
  });
  it('dust fades in with the approach rate and stays faint', () => {
    expect(dustAlpha(1e-6)).toBeCloseTo(0.05, 3);
    expect(dustAlpha(1)).toBeCloseTo(0.35, 3);
    expect(dustAlpha(0.1)).toBeGreaterThan(dustAlpha(0.01));
  });
});

describe('heavy arrival at giants', () => {
  const idle = { keys: new Set<string>(), consume: () => ({ left: { dx: 0, dy: 0 }, right: { dx: 0, dy: 0 }, wheel: 0 }) } as unknown as Input;
  /** seconds spent within 300 radii (where the body is a visible disc), flying in from 1e4 radii to 3 */
  const visibleTime = (R: number) => {
    const rig = new CameraRig();
    rig.upos.set(R * 1e4, 0, 0);
    rig.flyTo({ key: 't', name: 'T', kind: 'planet', radius: R, upos: new UPos(), parentObject: null, info: () => [] } as unknown as SpaceObject, R * 3, undefined, false);
    let t = 0;
    for (let i = 0; i < 72 * 30 && rig.autopilot; i++) {
      rig.update(1 / 72, idle);
      if (rig.upos.toVector3().length() < R * 300) t += 1 / 72;
    }
    return t;
  };
  it('the final approach to Jupiter takes ~1.7x as long as to the Moon', () => {
    const moon = visibleTime(1.737e6), jup = visibleTime(6.99e7);
    expect(moon).toBeGreaterThan(2);
    expect(jup / moon).toBeGreaterThan(1.5);
    expect(jup).toBeLessThan(10);
  });
});
