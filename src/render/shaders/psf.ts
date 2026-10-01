/**
 * Shared GLSL for unresolved light sources (stars, distant planets, asteroids).
 *
 * Photometric units: radiance 1.0 = white Lambertian surface lit face-on by
 * the Sun at 1 AU, so solar irradiance at 1 AU = PI and a source of apparent
 * V magnitude m has irradiance PI * 10^(-0.4 (m + 26.74)).
 * A point source is drawn as a small sprite whose integrated (pre-exposed)
 * value equals exposure * irradiance / pixelSolidAngle, so a planet fading
 * from a disk into a dot keeps the same total brightness.
 */
export const PSF_UNIFORMS = /* glsl */ `
uniform float uExposure;
uniform float uPixelSA;
uniform float uMinEnergy;
uniform float uMaxRadius;
uniform float uGlare;
`;

export const PSF_VERTEX = /* glsl */ `
float magToIrradiance(float m) { return 3.14159265 * exp2(-1.3287712 * (clamp(m, -60.0, 60.0) + 26.74)); }
// Returns sprite radius in pixels (0 => cull) and sets the varyings.
float psfSetup(float irradiance, out float energy) {
  energy = uExposure * irradiance / uPixelSA;
  if (!(energy >= uMinEnergy)) return 0.0;
  return min(uMaxRadius, 1.6 + 1.6 * log2(1.0 + energy) + 0.15 * sqrt(energy) * uGlare);
}
`;

export const PSF_FRAGMENT = /* glsl */ `
vec3 psfShade(vec2 pointCoord, float radius, float energy, vec3 color) {
  vec2 p = (pointCoord - 0.5) * 2.0 * radius;   // pixels from centre
  float r2 = dot(p, p);
  // Gaussian core, sigma = 0.65 px, normalised to unit integral
  float core = exp(-r2 * 1.1834) * 0.37672;
  // Faint wide glare for bright sources (power-law wings, unit-ish integral scaled by uGlare)
  float glare = uGlare * 0.02 / pow(1.0 + 0.5 * r2, 1.5);
  float edge = 1.0 - smoothstep(0.75, 1.0, sqrt(r2) / radius);
  return color * energy * (core + glare) * edge;
}
`;
