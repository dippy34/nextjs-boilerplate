/**
 * Shared shader plumbing for desktop + WebXR.
 *
 * Pull-in projection: a headset runtime may clamp the far plane, but the scene
 * spans 1e-1 .. 1e27 m. When uPullIn > 0 (VR), view-space positions farther than
 * uPullIn are scaled towards the eye along their own line of sight. Direction
 * and angular size are unchanged for each eye, and the logarithmic depth is
 * still computed from the true distance, so occlusion stays correct. three
 * scales log depth by the camera's far plane; uDepthK (< 1 only when that far
 * plane is finite) compresses log(1 + distance) up to MAX_DEPTH into it.
 *
 * Output: materials include three's tone-mapping and colour-space chunks. When
 * rendering into the desktop HDR target these are no-ops (the composite pass
 * tone-maps); when rendering straight into the XR framebuffer three applies
 * ACES + sRGB per fragment.
 */
export const GLOBALS = { uPullIn: { value: 0 }, uDepthK: { value: 1 } };

/** Headset quality tier: 1 while presenting in VR (heavy procedural shaders do less per pixel). */
export const LITE = { uLite: { value: 0 } };

/** Adaptive quality level (0 full .. 3 lowest), set by the governor (render/Quality.ts): a uniform for shaders, `.value` for layers. */
export const QUALITY_LEVEL = { uQuality: { value: 0 } };

/** Largest distance (m) the depth buffer has to order: well beyond the observable universe. */
export const MAX_DEPTH = 1e30;

/** Log-depth compression for a camera far plane: log2(far + 1) / log2(MAX_DEPTH + 1), at most 1. */
export function depthK(far: number): number {
  return Number.isFinite(far) && far < MAX_DEPTH ? Math.log2(far + 1) / Math.log2(MAX_DEPTH + 1) : 1;
}

/**
 * Point sprites only: rescale clip coordinates so |w| <= 1. A positive factor changes neither
 * the projected position nor the clip test, but keeps the clipper's arithmetic far from float
 * overflow: positions are in metres, so a star at kiloparsecs has clip coordinates ~1e20 and the
 * products a clipper forms (~1e40) overflow 32-bit floats (seen to crash software rasterisers).
 * Not for triangles: per-vertex scaling would break perspective-correct interpolation.
 */
export const POINT_CLIP = /* glsl */ `  gl_Position /= max(abs(gl_Position.w), 1.0);`;

export const PROJECT_PARS = /* glsl */ `
uniform float uPullIn;
uniform float uDepthK;
float gTrueDepth;
vec4 projectView(vec4 mv) {
  gTrueDepth = -mv.z;
  if (uPullIn > 0.0 && gTrueDepth > uPullIn) mv.xyz *= uPullIn / gTrueDepth;
  return projectionMatrix * mv;
}
`;

export const FIX_LOGDEPTH = /* glsl */ `
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  vFragDepth = uDepthK < 1.0 ? exp2(log2(1.0 + max(gTrueDepth, 0.0)) * uDepthK) : 1.0 + max(gTrueDepth, 0.0);
#endif
`;

export const OUTPUT_FRAGMENT = /* glsl */ `
#include <tonemapping_fragment>
#include <colorspace_fragment>
`;
