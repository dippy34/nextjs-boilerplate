import { describe, expect, it } from 'vitest';
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
