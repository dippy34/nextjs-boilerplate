import { DataTexture, Layers, type Mesh, type ShaderMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { DeepSkyLayer } from '../src/render/DeepSkyLayer';
import { VOLUMES } from '../src/render/Renderer';
import { DeepSkyObject } from '../src/universe/DeepSky';

const obj = (name: string, kind: 'emission' | 'planetary', i: number) => new DeepSkyObject({
  name, simbad: name, kind, otype: '', ra: 83.8 + i, dec: -5.4, distPc: 412, nDist: 1, notes: [], majArcmin: 60, minArcmin: 60, paDeg: 0, vmag: 4,
}, i);

describe('nebula volumes', () => {
  it('are drawn in the reduced-resolution volume pass: on its layer only, registered with it', () => {
    const layer = new DeepSkyLayer([obj('Test Nebula', 'emission', 0), obj('Test Ring', 'planetary', 1)], {}, new DataTexture(new Uint8Array(4), 1, 1));
    const vols = layer.group.children.filter((m) => (m as Mesh).material && ((m as Mesh).material as ShaderMaterial).name === 'nebula-volume');
    expect(vols.length).toBe(2);
    const main = new Layers();   // a camera's default layers: what the main pass sees
    for (const v of vols) {
      expect(v.layers.mask).toBe(1 << VOLUMES.layer);
      expect(v.layers.test(main)).toBe(false);
      expect(VOLUMES.meshes.has(v)).toBe(true);
    }
    // their far glows stay in the main pass
    const far = layer.group.children.filter((m) => ((m as Mesh).material as ShaderMaterial)?.name === 'nebula-far');
    expect(far.length).toBe(2);
    for (const f of far) expect(f.layers.test(main)).toBe(true);
  });
});
