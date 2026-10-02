/**
 * Shared GLSL for unresolved light sources (stars, distant planets, asteroids).
 *
 * Photometric units: radiance 1.0 = white Lambertian surface lit face-on by
 * the Sun at 1 AU, so solar irradiance at 1 AU = PI and a source of apparent
 * V magnitude m has irradiance PI * 10^(-0.4 (m + 26.74)).
 * A point source is drawn as a small sprite whose integrated (pre-exposed)
 * value equals exposure * irradiance / pixelSolidAngle, so a planet fading
 * from a disk into a dot keeps the same total brightness.
 *
 * Display mapping: the eye's response to point sources is far from linear;
 * like SpaceEngine/Celestia we compress point energies with a power law
 * (uPointGamma, ~0.55) around energy 1. Culling still uses the physical value,
 * so the limiting magnitude is unaffected.
 */
export const PSF_UNIFORMS = /* glsl */ `
uniform float uExposure;
uniform float uPixelSA;
uniform float uMinEnergy;
uniform float uMaxRadius;
uniform float uGlare;
uniform float uPointGamma;
uniform float uPointGain;
uniform float uDpr;
uniform float uMaxEnergy;
`;

export const PSF_VERTEX = /* glsl */ `
float magToIrradiance(float m) { return 3.14159265 * exp2(-1.3287712 * (clamp(m, -60.0, 60.0) + 26.74)); }
// Returns sprite radius in CSS pixels (0 => cull). uPixelSA is the solid angle of one CSS pixel;
// callers set gl_PointSize = 2 * radius * uDpr so sprites keep their size on HiDPI screens.
float psfSetup(float irradiance, out float energy) {
  float raw = uExposure * irradiance / uPixelSA;
  if (!(raw >= uMinEnergy)) { energy = 0.0; return 0.0; }
  // Displayed energy is capped: very bright points get a large but finite glare (bloom does the rest).
  energy = min(uPointGain * pow(raw, uPointGamma), uMaxEnergy);
  return min(uMaxRadius, 1.8 + 1.4 * log2(1.0 + energy) + 0.12 * sqrt(energy) * uGlare);
}
`;

export const PSF_FRAGMENT = /* glsl */ `
vec3 psfShade(vec2 pointCoord, float radius, float energy, vec3 color) {
  vec2 p = (pointCoord - 0.5) * 2.0 * radius;   // CSS pixels from centre
  float r2 = dot(p, p);
  // Gaussian core, sigma = 0.8 px, normalised to unit integral
  float core = exp(-r2 * 0.78125) * 0.24868;
  // Faint wide glare for bright sources (power-law wings, unit-ish integral scaled by uGlare)
  float glare = uGlare * 0.02 / pow(1.0 + 0.5 * r2, 1.5);
  float edge = 1.0 - smoothstep(0.75, 1.0, sqrt(r2) / radius);
  // energy is per CSS pixel; spread over uDpr^2 device pixels
  return min(color * energy * (core + glare) * edge / (uDpr * uDpr), vec3(6.0e4));
}
`;
