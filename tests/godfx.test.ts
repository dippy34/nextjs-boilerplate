import { Matrix4, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { basis, FxMode, GodFx } from '../src/god/GodFx';
import { VOLUMES } from '../src/render/Renderer';
import type { Entity } from '../src/god/Sandbox';

function ent(id: number, radius: number, gm: number, pos = new Vector3()): Entity {
  return { id, kind: 'planet', name: `e${id}`, mode: 'massive', gm, radius, flags: 0, body: null, pos, vel: new Vector3(),
    spin: { axis: new Vector3(0, 0, 1), rate: 7e-5, locked: false, base: new Matrix4(), jdBase: 0 } };
}

let clock = performance.now() + 1e6;
/** advance the effects by `s` seconds of real time in 0.1 s frames */
function run(fx: GodFx, s: number, jd = 0): void {
  const p = performance as unknown as { now: () => number };
  const real = p.now.bind(performance);
  p.now = () => clock;
  try { for (let i = 0; i < s * 10; i++) { clock += 100; fx.update(new Vector3(), jd, 1e-3); } } finally { p.now = real; }
}

describe('GodFx', () => {
  it('basis is orthonormal and perpendicular to n', () => {
    for (const n of [new Vector3(0, 0, 1), new Vector3(1, 0, 0), new Vector3(1, 2, 3).normalize()]) {
      const [a, b] = basis(n);
      expect(a.length()).toBeCloseTo(1, 6); expect(b.length()).toBeCloseTo(1, 6);
      expect(a.dot(n)).toBeCloseTo(0, 6); expect(b.dot(n)).toBeCloseTo(0, 6); expect(a.dot(b)).toBeCloseTo(0, 6);
    }
  });

  it('an impact makes a flash, ejecta, a scar and (giant) a debris disk; short-lived ones expire', () => {
    const alive = new Set<Entity>();
    const fx = new GodFx((e) => alive.has(e));
    const mars = ent(1, 3.4e6, 4.28e13); alive.add(mars);
    fx.impact(new Vector3(3.4e6, 0, 0), mars, 1.7e6, 0.11, 9000, 0);
    expect(fx.countOf(FxMode.Glow)).toBe(1);
    expect(fx.countOf(FxMode.Ejecta)).toBe(1);
    expect(fx.countOf('scar')).toBe(1);
    expect(fx.countOf(FxMode.Ring)).toBe(1);
    // the flash goes to the reduced-resolution pass, and leaves it when done
    expect([...VOLUMES.meshes].some((m) => fx.group.children.includes(m))).toBe(true);
    run(fx, 20);
    expect(fx.countOf(FxMode.Glow) + fx.countOf(FxMode.Ejecta) + fx.countOf('scar')).toBe(0);
    expect([...VOLUMES.meshes].some((m) => fx.group.children.includes(m))).toBe(false);
    // the disk thins out and goes too
    run(fx, 40);
    expect(fx.count).toBe(0);
  });

  it('a small impact re-accretes: no disk', () => {
    const fx = new GodFx(() => true);
    fx.impact(new Vector3(6.4e6, 0, 0), ent(1, 6.4e6, 4e14), 1e5, 1e-6, 20000, 0);
    expect(fx.countOf(FxMode.Ring)).toBe(0);
  });

  it('a tidal ring lasts as long as its primary', () => {
    const alive = new Set<Entity>();
    const fx = new GodFx((e) => alive.has(e));
    const jup = ent(2, 7e7, 1.27e17); alive.add(jup);
    fx.disrupt(new Vector3(1e8, 0, 0), jup, 1e8, new Vector3(0, 0, 1), 1e6, 0);
    run(fx, 30);
    expect(fx.countOf(FxMode.Ring)).toBe(1);
    alive.delete(jup);
    run(fx, 0.2);
    expect(fx.count).toBe(0);
  });

  it('a swallow brightens the disk, which settles back', () => {
    const fx = new GodFx(() => true);
    const hole = ent(3, 3e4, 1.3e21);
    const drawable = { diskTmax: 9000 };
    fx.swallow(new Vector3(1e8, 0, 0), hole, 6.4e6, 1e-5, 0, drawable);
    expect(fx.countOf(FxMode.Inspiral)).toBe(1);
    run(fx, 1);
    expect(drawable.diskTmax).toBeGreaterThan(9000 * 1.2);
    run(fx, 10);
    expect(drawable.diskTmax).toBe(9000);
  });

  it('clear() restores flared disks and drops everything', () => {
    const fx = new GodFx(() => true);
    const d = { diskTmax: 5000 };
    fx.swallow(new Vector3(1e8, 0, 0), ent(3, 3e4, 1.3e21), 6.4e6, 1e-3, 0, d);
    fx.form(ent(4, 6e6, 4e14), [1, 1, 1], 0);
    run(fx, 0.5);
    fx.clear();
    expect(fx.count).toBe(0);
    expect(d.diskTmax).toBe(5000);
  });
});
