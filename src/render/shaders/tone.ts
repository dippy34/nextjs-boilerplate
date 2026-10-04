import { ShaderChunk } from 'three';

/**
 * Display tone curve, shared by the desktop composite and the in-material path in the headset.
 *
 * The brightness response is the ACES filmic fit (Stephen Hill, BakingLab, MIT licence) applied to
 * the luminance only, so colours keep their hue and saturation: the per-channel ACES curve and its
 * RRT matrices bleached mid-tones (Saturn's pale gold came out off-white, Mars's red as salmon).
 * Bright light still goes white, as on film and in the eye: above ~60% of display white the colour
 * is blended towards a grey of the same luminance, and a channel that would exceed the display is
 * brought in by moving towards white (keeping the luminance).
 */
export const TONE_GLSL = /* glsl */ `
float spToneCurve(float y) {
  float a = y * (y + 0.0245786) - 0.000090537;
  float b = y * (0.983729 * y + 0.4329510) + 0.238081;
  return clamp(a / b, 0.0, 1.0);
}
vec3 spTone(vec3 c) {
  // (an overflowed (infinite) value is white, not NaN: additive layers on a disk shown far above
  // white, while the eye has yet to adapt, can exceed half-float range)
  c = min(max(c, vec3(0.0)), vec3(1.0e4));
  float Y = dot(c, vec3(0.2126, 0.7152, 0.0722));
  if (Y < 1e-7) return vec3(0.0);
  float Yt = spToneCurve(Y);
  vec3 o = c * (Yt / Y);
  o = mix(o, vec3(Yt), smoothstep(0.6, 1.0, Yt) * 0.6);
  float p = max(o.r, max(o.g, o.b));
  if (p > 1.0) o = mix(o, vec3(Yt), (p - 1.0) / max(p - Yt, 1e-4));
  return clamp(o, 0.0, 1.0);
}
`;

let installed = false;
/** Make three's CustomToneMapping (used in materials while presenting to a headset) this curve. */
export function installToneMapping(): void {
  if (installed) return;
  installed = true;
  const stub = 'vec3 CustomToneMapping( vec3 color ) { return color; }';
  if (!ShaderChunk.tonemapping_pars_fragment.includes(stub)) throw new Error('tone mapping: three chunk changed');
  ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(stub,
    `${TONE_GLSL}\nvec3 CustomToneMapping( vec3 color ) { return spTone( color * toneMappingExposure ); }`);
}
