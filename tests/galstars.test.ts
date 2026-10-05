import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { GalaxyModel, lookFor } from '../src/render/GalaxiesLayer';
import { generateGalaxyCell, InteriorFrame } from '../src/render/GalaxyInterior';
import { noise3D } from '../src/render/Noise3D';
import { CHUNK, POOL_VERT, StarPool } from '../src/render/StarPool';
import { Galaxy } from '../src/universe/Galaxies';
import { BANDS, cellSize, reach } from '../src/universe/ProceduralStars';

describe('star pool (one draw call for all procedural stars)', () => {
  it('stores cells in chunks, frees them and keeps the draw range tight', () => {
    const p = new StarPool(10 * CHUNK, 64);
    const pos = new Float32Array(300 * 3).fill(1), mt = new Uint16Array(300).fill(7);
    const a = p.add(pos, mt, 300)!;
    expect(a.chunks.length).toBe(3);
    expect(p.used).toBe(300);
    const b = p.add(pos, mt, 100)!;
    expect(p.geometry.drawRange.count).toBe(4 * CHUNK);
    // the unused tail of a cell's last chunk is on the hidden slot 0
    const cell = p.geometry.attributes.aCell.array as Uint16Array;
    expect(cell[a.chunks[2] * CHUNK + 299 - 2 * CHUNK]).toBe(a.slot);
    expect(cell[a.chunks[2] * CHUNK + 300 - 2 * CHUNK]).toBe(0);
    p.remove(b);
    expect(p.geometry.drawRange.count).toBe(3 * CHUNK);
    p.remove(a);
    expect(p.used).toBe(0);
    expect(p.geometry.drawRange.count).toBe(0);
  });

  it('refuses a cell when full, and reuses freed room', () => {
    const p = new StarPool(4 * CHUNK, 64);
    const n = 3 * CHUNK;
    const a = p.add(new Float32Array(n * 3), new Uint16Array(n), n)!;
    expect(p.add(new Float32Array(n * 3), new Uint16Array(n), n)).toBeNull();
    p.remove(a);
    expect(p.add(new Float32Array(n * 3), new Uint16Array(n), n)).not.toBeNull();
  });

  it('slot texture: shown cells carry offset, magnitudes and reach; hidden ones are culled', () => {
    const p = new StarPool(CHUNK, 64);
    p.show(5, 1, 2, 3, 0.5, 400);
    const d = p.slots.image.data as Float32Array;
    expect([...d.subarray(40, 45)]).toEqual([1, 2, 3, 0.5, 400]);
    p.hide(5);
    expect(d[43]).toBeGreaterThan(50);
    expect(d[3]).toBeGreaterThan(50);  // slot 0 is always hidden
  });

  it('the shader is the star shader fed from the slot texture, with the reach fade', () => {
    expect(POOL_VERT).toContain('texelFetch(uSlots');
    expect(POOL_VERT).toContain('reachFade');
    expect(POOL_VERT).not.toContain('uOffset + aPos');
  });
});

describe('stars inside other galaxies', () => {
  const j = JSON.parse(readFileSync('public/data/galaxies.json', 'utf8'));
  const gs: Galaxy[] = j.galaxies.map((g: never, i: number) => new Galaxy(g, i));
  const frame = (name: string) => {
    const g = gs.find((x) => x.name === name)!;
    return new InteriorFrame(new GalaxyModel(g, lookFor(g, gs), noise3D().data), gs.indexOf(g));
  };
  const m31 = frame('Andromeda Galaxy');

  it('are deterministic per galaxy and cell', () => {
    const a = generateGalaxyCell(m31, 9, 30, 0, 0), b = generateGalaxyCell(m31, 9, 30, 0, 0);
    expect(a.count).toBeGreaterThan(0);
    expect(b.count).toBe(a.count);
    expect([...b.pos.subarray(0, 30)]).toEqual([...a.pos.subarray(0, 30)]);
    const m33 = frame('Triangulum Galaxy');
    expect(generateGalaxyCell(m33, 9, 30, 0, 0).key).not.toBe(a.key);
  });

  it('follow the galaxy: denser towards the centre, thin above the disc', () => {
    const k = 12, S = cellSize(k) / m31.rpc;
    const at = (x: number, z: number) => generateGalaxyCell(m31, k, Math.floor(x / S), 0, Math.floor(z / S)).count;
    expect(at(0.2, 0)).toBeGreaterThan(at(0.6, 0));
    expect(at(0.4, 0)).toBeGreaterThan(5 * at(0.4, 0.15));
  });

  it('at 0.4 radii, a Quest-sized limit fits the headset budget', () => {
    const cam = new Vector3(0.4, 0, 0.005).multiplyScalar(m31.rpc);
    let stars = 0;
    for (let k = 0; k < BANDS.length; k++) {
      const R = reach(BANDS[k].M, 7.1), S = cellSize(k);
      for (let ix = Math.floor((cam.x - R) / S); ix <= Math.floor((cam.x + R) / S); ix++)
        for (let iy = Math.floor(-R / S); iy <= Math.floor(R / S); iy++)
          for (let iz = Math.floor((cam.z - R) / S); iz <= Math.floor((cam.z + R) / S); iz++) {
            const dx = Math.max(ix * S - cam.x, 0, cam.x - (ix + 1) * S), dy = Math.max(iy * S, 0, -(iy + 1) * S), dz = Math.max(iz * S - cam.z, 0, cam.z - (iz + 1) * S);
            if (Math.hypot(dx, dy, dz) <= R) stars += generateGalaxyCell(m31, k, ix, iy, iz).count;
          }
    }
    expect(stars).toBeGreaterThan(20000);
    expect(stars).toBeLessThan(150000);
  }, 60000);
});
