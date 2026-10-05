import { describe, expect, it } from 'vitest';
import { depthlessInit, keepDepthFromCompositor } from '../src/vr/xrDepth';

describe('headset layer depth', () => {
  it('asks for no depth texture and keeps the rest of three\'s init', () => {
    expect(depthlessInit({ colorFormat: 0x8058, depthFormat: 0x81a6, scaleFactor: 1.2 })).toEqual({ colorFormat: 0x8058, depthFormat: 0, scaleFactor: 1.2 });
    expect(depthlessInit(undefined)).toEqual({ depthFormat: 0 });
  });

  it('patches the binding once: the layer is made without depth and says the runtime ignores depth', () => {
    const seen: Record<string, unknown>[] = [];
    class Binding {
      createProjectionLayer(init: Record<string, unknown>) {
        seen.push(init);
        // like an emulator: claims the compositor reads depth, and sets it again later
        const layer = { ignoreDepthValues: false };
        return layer;
      }
    }
    (globalThis as Record<string, unknown>).XRWebGLBinding = Binding;
    try {
      expect(keepDepthFromCompositor()).toBe(true);
      expect(keepDepthFromCompositor()).toBe(true); // idempotent: not wrapped twice
      const layer = new Binding().createProjectionLayer({ colorFormat: 1, depthFormat: 0x81a6 }) as { ignoreDepthValues: boolean };
      expect(seen).toEqual([{ colorFormat: 1, depthFormat: 0 }]);
      expect(layer.ignoreDepthValues).toBe(true);
      layer.ignoreDepthValues = false; // the runtime's own initialisation cannot turn it back on
      expect(layer.ignoreDepthValues).toBe(true);
    } finally {
      delete (globalThis as Record<string, unknown>).XRWebGLBinding;
    }
  });
});
