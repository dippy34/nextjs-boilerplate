import { describe, expect, it } from 'vitest';
import { ktx2Wanted } from '../src/render/Ktx2';
import { viewportScaleFor, XR_FB_SCALE, XR_VIEWPORT_SCALE, xrGpuOptions } from '../src/render/XrGpu';

describe('headset GPU settings', () => {
  it('defaults: full foveation, 72 Hz, the level-0 framebuffer scale, viewport scaling on', () => {
    const o = xrGpuOptions('', null);
    expect(o).toEqual({ foveation: 1, fbScale: XR_FB_SCALE[0], viewportScale: true, hz: 72 });
  });

  it('the framebuffer scale follows the level the last session settled at', () => {
    expect(xrGpuOptions('', 2).fbScale).toBe(XR_FB_SCALE[2]);
    expect(xrGpuOptions('', 9).fbScale).toBe(XR_FB_SCALE[0]);
    expect(xrGpuOptions('', NaN).fbScale).toBe(XR_FB_SCALE[0]);
    for (let i = 1; i < XR_FB_SCALE.length; i++) expect(XR_FB_SCALE[i]).toBeLessThan(XR_FB_SCALE[i - 1]);
  });

  it('URL overrides, clamped, for before/after benchmarks', () => {
    const o = xrGpuOptions('?foveation=0&xrscale=2&xrvs=0&hz=90', 3);
    expect(o).toEqual({ foveation: 0, fbScale: 1.2, viewportScale: false, hz: 90 });
    expect(xrGpuOptions('?xrscale=native&hz=native', 0)).toMatchObject({ fbScale: null, hz: null });
    expect(xrGpuOptions('?foveation=0.5&xrscale=0.1', 0)).toMatchObject({ foveation: 0.5, fbScale: 0.5 });
  });

  it('viewport scale per governor level, 1 when off', () => {
    const on = xrGpuOptions('', null), off = xrGpuOptions('?xrvs=0', null);
    expect(viewportScaleFor(on, 0)).toBe(1);
    expect(viewportScaleFor(on, 3)).toBe(XR_VIEWPORT_SCALE[3]);
    expect(viewportScaleFor(on, 7)).toBe(XR_VIEWPORT_SCALE[3]);
    expect(viewportScaleFor(off, 3)).toBe(1);
    expect(viewportScaleFor(null, 3)).toBe(1);
  });
});

describe('KTX2 maps', () => {
  it('on where a headset can be used, switchable from the URL', () => {
    expect(ktx2Wanted('', true)).toBe(true);
    expect(ktx2Wanted('', false)).toBe(false);
    expect(ktx2Wanted('?ktx2=1', false)).toBe(true);
    expect(ktx2Wanted('?ktx2=0', true)).toBe(false);
  });

  it('every colour map has a compressed copy with its mean luminance; data maps do not', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const m = JSON.parse(readFileSync('public/data/textures/manifest.json', 'utf8')).maps as Record<string, { file: string; ktx2?: { file: string; meanLum: number } }>;
    for (const [k, v] of Object.entries(m)) {
      if (k.endsWith('_relief')) { expect(v.ktx2).toBeUndefined(); continue; }
      expect(v.ktx2, k).toBeDefined();
      expect(existsSync(`public/data/textures/${v.ktx2!.file}`), k).toBe(true);
      expect(v.ktx2!.meanLum).toBeGreaterThan(0);
      expect(v.ktx2!.meanLum).toBeLessThan(1);
    }
    expect(existsSync('public/data/sky/milkyway_4k.ktx2')).toBe(true);
    expect(existsSync('public/basis/basis_transcoder.wasm')).toBe(true);
  });
});
