import { describe, expect, it } from 'vitest';
import { Quaternion, Vector3 } from 'three';
import { ViewCone } from '../src/render/Cull';

describe('view cone culling', () => {
  const cone = new ViewCone();
  // looking down -z, 60° vertical field, 16:9, no margin: corner half-angle ≈ 41.6°
  cone.set(new Quaternion(), 60, 16 / 9, 0);

  it('keeps what is ahead and drops what is behind or well to the side', () => {
    expect(cone.sees(0, 0, -10, 1)).toBe(true);
    expect(cone.sees(0, 0, 10, 1)).toBe(false);
    expect(cone.sees(10, 0, 0, 1)).toBe(false);
    // just inside the corner
    const corner = new Vector3(Math.tan(Math.PI / 6) * 16 / 9, Math.tan(Math.PI / 6), -1).normalize().multiplyScalar(100);
    expect(cone.sees(corner.x, corner.y, corner.z, 0.01)).toBe(true);
  });

  it('keeps a sphere that reaches into the view or holds the eye', () => {
    // centre 60° off-axis, but large enough to reach in
    const off = new Vector3(Math.sin(Math.PI / 3), 0, -Math.cos(Math.PI / 3)).multiplyScalar(10);
    expect(cone.sees(off.x, off.y, off.z, 0.5)).toBe(false);
    expect(cone.sees(off.x, off.y, off.z, 4)).toBe(true);
    expect(cone.sees(0, 0, 5, 6)).toBe(true);
  });

  it('follows the view direction, and sees everything when off', () => {
    const c = new ViewCone();
    expect(c.sees(0, 0, 10, 1)).toBe(true);
    c.set(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI), 60, 1, 0);
    expect(c.sees(0, 0, 10, 1)).toBe(true);
    expect(c.sees(0, 0, -10, 1)).toBe(false);
  });
});
