import { Vector2, type WebGLRenderer, type WebXRManager } from 'three';
import { QUALITY } from './Quality';

/**
 * Headset GPU settings: the standard mobile-VR savings, each switchable from the URL so a
 * benchmark can compare before and after.
 *
 * - Fixed foveation (?foveation=0..1, default 1): the compositor renders the edges of each eye
 *   at a lower resolution. three applies it to the projection layer when the session starts;
 *   `report()` reads back what the layer actually holds.
 * - Framebuffer scale (?xrscale=0.5..1.2): the eye buffers' size relative to the runtime's
 *   recommendation. It is fixed for a session, so it follows the quality level the previous
 *   session settled at (XR_FB_SCALE), remembered in localStorage.
 * - Viewport scale (?xrvs=0 off): within a session the governor shrinks the part of each eye
 *   buffer drawn into (XRView.requestViewportScale, where the browser has it) per level.
 * - Frame rate (?hz=72|80|90|120, default 72): the lowest rate gives each frame the most time.
 */
export const XR_FB_SCALE = [0.85, 0.8, 0.75, 0.7];
/** in-session viewport scale per quality level (on top of the framebuffer scale) */
export const XR_VIEWPORT_SCALE = [1, 0.92, 0.85, 0.78];
const LEVEL_KEY = 'xrQualityLevel';

export interface XrGpuOptions {
  foveation: number;
  /** framebuffer scale factor, or null to leave the runtime's default */
  fbScale: number | null;
  viewportScale: boolean;
  /** target frame rate, or null to leave the runtime's */
  hz: number | null;
}

/** The settings for a session from the page's query string and the last session's level. */
export function xrGpuOptions(search: string, lastLevel: number | null): XrGpuOptions {
  const q = new URLSearchParams(search);
  const num = (k: string): number | null => {
    const v = q.get(k);
    if (v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const fov = num('foveation');
  const scale = num('xrscale');
  const level = lastLevel !== null && lastLevel >= 0 && lastLevel < XR_FB_SCALE.length ? Math.floor(lastLevel) : 0;
  const hz = q.get('hz');
  return {
    foveation: fov === null ? 1 : Math.min(1, Math.max(0, fov)),
    fbScale: q.get('xrscale') === 'native' ? null : scale === null ? XR_FB_SCALE[level] : Math.min(1.2, Math.max(0.5, scale)),
    viewportScale: q.get('xrvs') !== '0',
    hz: hz === 'native' ? null : num('hz') ?? 72,
  };
}

/** What the session ended up with, for the log, the perf HUD and benchmarks (window.__xrGpu). */
export interface XrGpuReport {
  options: XrGpuOptions;
  /** eye buffer size (both eyes) */
  width: number;
  height: number;
  /** fixed foveation the layer reports (undefined: the browser has none) */
  layerFoveation: number | undefined;
  frameRate: number | undefined;
  viewportScaleSupported: boolean;
  viewportScale: number;
}

function storedLevel(): number | null {
  try {
    const v = localStorage.getItem(LEVEL_KEY);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

let current: XrGpuOptions | null = null;
let report: XrGpuReport | null = null;
let patched = false;

/** The viewport scale for the current quality level (1 when off). */
export function viewportScaleFor(opts: XrGpuOptions | null, level: number): number {
  if (!opts?.viewportScale) return 1;
  return XR_VIEWPORT_SCALE[Math.max(0, Math.min(XR_VIEWPORT_SCALE.length - 1, level))];
}

/**
 * Ask for each view's viewport scale as three reads the views (three calls getViewerPose once per
 * frame, then the layer's viewport for each view, which is when the request takes effect).
 */
function patchViewerPose(): void {
  const F = (globalThis as { XRFrame?: { prototype: XRFrame } }).XRFrame;
  if (patched || !F?.prototype?.getViewerPose) return;
  patched = true;
  const orig = F.prototype.getViewerPose;
  F.prototype.getViewerPose = function (this: XRFrame, space: XRReferenceSpace) {
    const pose = orig.call(this, space);
    if (pose && current) {
      const s = viewportScaleFor(current, QUALITY.level);
      let ok = false;
      for (const v of pose.views) {
        const view = v as XRView & { requestViewportScale?: (s: number | null) => void };
        if (typeof view.requestViewportScale === 'function') { view.requestViewportScale(s); ok = true; }
      }
      if (report) { report.viewportScaleSupported = ok; report.viewportScale = ok ? s : 1; }
    }
    return pose;
  };
}

/** Before xr.setSession: framebuffer scale and foveation (three applies both to the new layer). */
export function beforeSession(xr: WebXRManager): XrGpuOptions {
  const opts = xrGpuOptions(typeof location === 'undefined' ? '' : location.search, storedLevel());
  current = opts;
  if (opts.fbScale !== null) xr.setFramebufferScaleFactor(opts.fbScale);
  xr.setFoveation(opts.foveation);
  if (opts.viewportScale) patchViewerPose();
  return opts;
}

/** After xr.setSession: frame rate, then read back what the layer holds and log it. */
export async function afterSession(gl: WebGLRenderer, session: XRSession): Promise<XrGpuReport> {
  const opts = current ?? xrGpuOptions('', null);
  const s = session as XRSession & {
    updateTargetFrameRate?: (r: number) => Promise<void>; supportedFrameRates?: Float32Array; frameRate?: number;
  };
  if (opts.hz !== null && s.updateTargetFrameRate && s.supportedFrameRates?.length) {
    // the supported rate closest to the one asked for
    let best = s.supportedFrameRates[0];
    for (const r of s.supportedFrameRates) if (Math.abs(r - opts.hz) < Math.abs(best - opts.hz)) best = r;
    if (best !== s.frameRate) await s.updateTargetFrameRate(best).catch(() => undefined);
  }
  const rs = session.renderState as XRRenderState & { layers?: { fixedFoveation?: number }[] };
  const layer = (rs.layers?.[0] ?? rs.baseLayer) as { fixedFoveation?: number } | undefined;
  // (three sizes the renderer to the layer's texture when the session starts)
  const size = gl.getDrawingBufferSize(new Vector2());
  report = {
    options: opts,
    width: size.x,
    height: size.y,
    layerFoveation: layer?.fixedFoveation ?? undefined,
    frameRate: s.frameRate,
    viewportScaleSupported: false,
    viewportScale: 1,
  };
  console.info(`XR GPU: eye buffers ${report.width}x${report.height} (scale ${opts.fbScale ?? 'native'}), `
    + `foveation ${opts.foveation} (layer: ${report.layerFoveation ?? 'unsupported'}), ${report.frameRate ?? '?'} Hz`);
  (globalThis as { __xrGpu?: XrGpuReport }).__xrGpu = report;
  return report;
}

/** Session ended: remember the level it settled at for the next session's framebuffer scale. */
export function endSession(): void {
  current = null;
  try { localStorage.setItem(LEVEL_KEY, String(QUALITY.level)); } catch { /* private mode */ }
}

export function xrGpuReport(): XrGpuReport | null {
  return report;
}
