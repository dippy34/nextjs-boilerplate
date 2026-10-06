import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Body } from '../src/universe/Body';
import { SolarSystem } from '../src/universe/SolarSystem';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUB = join(ROOT, 'public');
globalThis.fetch = (async (input: string | URL) => new Response(readFileSync(join(PUB, String(input).replace(/^\//, ''))))) as typeof fetch;

describe('Solar System update scaled to the focus', () => {
  let a: SolarSystem, b: SolarSystem;
  const jd0 = 2461300.5;
  beforeAll(async () => {
    a = await SolarSystem.load('/data');
    b = await SolarSystem.load('/data');
    for (const s of [a, b]) await s.ephemeris.request(jd0);
  });

  it('is exact for the focus and its moons, and close for the rest', () => {
    const jupiter = b.bodies.find((x) => x.name === 'Jupiter')!;
    const focus = new Set<Body>([jupiter]);
    b.update(jd0);              // (a full update first, as at start)
    // a minute of frames at real time
    for (let i = 1; i <= 60 * 72; i += 72) {
      const jd = jd0 + i / 72 / 86400;
      a.update(jd);
      b.update(jd, 0, focus);
    }
    let maxOff = 0;
    for (let i = 0; i < a.bodies.length; i++) {
      const x = a.bodies[i], y = b.bodies[i];
      if (!x.valid) continue;
      const d = x.pos.distanceTo(y.pos);
      if (y === jupiter || y.parent === jupiter || x.kind === 'star') expect(d, x.name).toBeLessThan(1);
      else if (x.kind === 'planet') expect(d, x.name).toBeLessThan(1e4);   // (barycentre shift by stale moons; exact once in focus)
      else if (x.parent) {
        // at most 1° of the orbit stale
        const r = x.pos.distanceTo(x.parent.pos);
        expect(d, x.name).toBeLessThanOrEqual(r * 0.0175 + 1);
        maxOff = Math.max(maxOff, d / r);
      }
    }
    expect(maxOff).toBeLessThan(0.0175);
  });

  it('a full update (no focus) after a jump is exact everywhere', () => {
    const jd = jd0 + 0.37;
    a.update(jd);
    b.update(jd);
    for (let i = 0; i < a.bodies.length; i++) expect(b.bodies[i].pos.distanceTo(a.bodies[i].pos), a.bodies[i].name).toBeLessThan(1e-3);
  });
});
