/**
 * Keep the scene's depth buffer away from the headset's compositor.
 *
 * With WebXR projection layers (the Quest Browser), three creates the layer with a depth texture
 * and, when the runtime reports `ignoreDepthValues === false`, draws straight into it so that the
 * compositor can reproject with depth (positional timewarp, which runs whenever a frame is late).
 * The compositor reads that depth as ordinary projective depth for the session's near plane, but
 * this renderer writes logarithmic depth (the scene spans 1e-1 .. 1e27 m): a planet 10 000 km away
 * stores about what 6 cm would, a galaxy about 17 cm. Reprojected frames then move everything
 * like an object within arm's reach, which reads as a tabletop model however big it is drawn.
 *
 * So the layer is created without depth (`depthFormat: 0`): the compositor reprojects by head
 * rotation alone, as for any layer without depth, and three keeps a depth buffer of its own,
 * which also lets it render multisampled straight into the layer again (three turns that off for
 * a depth texture shared with the runtime). What each eye draws is unchanged: far bodies keep
 * their true (vanishing) parallax and near things their true stereo either way.
 *
 * `?xrlayerdepth=1` keeps three's default (depth shared with the compositor), for comparison.
 */
let installed = false;

type Binding = { createProjectionLayer(init?: Record<string, unknown>): object };

/** The layer init three asks for, without a depth texture. */
export function depthlessInit(init: Record<string, unknown> | undefined): Record<string, unknown> {
  return { ...init, depthFormat: 0 };
}

/** Patch `XRWebGLBinding.createProjectionLayer` (once, before the session's layer is made). */
export function keepDepthFromCompositor(): boolean {
  if (installed) return true;
  if (new URLSearchParams(globalThis.location?.search ?? '').get('xrlayerdepth') === '1') return false;
  const B = (globalThis as { XRWebGLBinding?: { prototype: Binding } }).XRWebGLBinding;
  if (!B || typeof B.prototype.createProjectionLayer !== 'function') return false;
  const create = B.prototype.createProjectionLayer;
  B.prototype.createProjectionLayer = function (this: Binding, init?: Record<string, unknown>) {
    const made = depthlessInit(init);
    const layer = create.call(this, made);
    // the runtime has no depth to read; three must then allocate (and resolve into) its own buffer.
    // (a layer without depth reports this anyway; an emulator may not, so say it on the object)
    try {
      Object.defineProperty(layer, 'madeWith', { value: made }); // for the headset tests (scripts/vr.mjs)
      Object.defineProperty(layer, 'ignoreDepthValues', { configurable: true, get: () => true, set: () => { /* the runtime's own initialisation: there is still no depth */ } });
    } catch { /* a native layer that cannot be told: it reports true itself without a depth texture */ }
    return layer;
  };
  installed = true;
  return true;
}
