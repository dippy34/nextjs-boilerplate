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
uniform float uSat;
uniform float uHalo;   // halo/spike strength (1 for stars; small bodies use less)
`;

/*
 * Appearance of a point source. `energy` E is the displayed energy (physical, pre-exposed
 * irradiance per pixel compressed by a perceptual power law); `g` = log2(raw / threshold) is how
 * many factors of two the source is above the visibility limit:
 *  - core: a sharp Gaussian (sigma 0.65 px) whose peak saturates softly at ~1, so a bright star
 *    stays a point instead of clipping into a white disc;
 *  - halo: a coloured glow whose size and strength grow with g (the eye reads a brighter star as
 *    a bigger glow, as in SpaceEngine/Celestia);
 *  - spikes: faint four-point diffraction spikes for the brightest sources (uGlare scales them).
 * Values are display-referred (~0..1.3), so hue survives the tone curve; uSat sets the colour
 * saturation (1 = blackbody chromaticity; stars are shown somewhat more saturated by default).
 */
export const PSF_VERTEX = /* glsl */ `
float magToIrradiance(float m) { return 3.14159265 * exp2(-1.3287712 * (clamp(m, -60.0, 60.0) + 26.74)); }
// Returns sprite radius in CSS pixels (0 => cull). uPixelSA is the solid angle of one CSS pixel;
// callers set gl_PointSize = 2 * radius * uDpr so sprites keep their size on HiDPI screens.
float psfSetup(float irradiance, out float energy) {
  float raw = uExposure * irradiance / uPixelSA;
  if (!(raw >= uMinEnergy)) { energy = 0.0; return 0.0; }
  energy = min(uPointGain * pow(raw, uPointGamma), uMaxEnergy);
  float g = max(0.0, log2(raw / uMinEnergy));
  float rh = 0.6 + 0.42 * g * uHalo;
  float spikes = g > 8.0 ? 4.0 * rh * uGlare * uHalo : 0.0;
  return min(uMaxRadius, max(2.5, max(rh * 3.5, spikes)));
}
`;

export const PSF_FRAGMENT = /* glsl */ `
vec3 psfShade(vec2 pointCoord, float radius, float energy, vec3 color) {
  vec2 p = (pointCoord - 0.5) * 2.0 * radius;   // CSS pixels from centre
  float r2 = dot(p, p);
  float raw = pow(max(energy, 1e-6) / uPointGain, 1.0 / uPointGamma);
  float g = max(0.0, log2(raw / uMinEnergy));
  float core = (1.0 - exp(-energy * 0.35)) * exp(-r2 * 1.1834);           // sigma 0.65 px
  float rh = 0.6 + 0.42 * g * uHalo;
  float halo = uHalo * (0.04 + 0.3 * smoothstep(3.0, 11.0, g)) * min(1.0, energy) / pow(1.0 + r2 / (rh * rh), 1.5);
  float spikes = 0.0;
  if (g > 8.0 && uGlare > 0.0) {
    float L = 4.0 * rh;
    vec2 a = abs(p);
    float s1 = exp(-a.y * 1.6) * (1.0 - smoothstep(0.0, L, a.x)) / (1.0 + 4.0 * a.x / L);
    float s2 = exp(-a.x * 1.6) * (1.0 - smoothstep(0.0, L, a.y)) / (1.0 + 4.0 * a.y / L);
    spikes = (s1 + s2) * 0.28 * smoothstep(8.0, 13.0, g) * uGlare * uHalo;
  }
  float edge = 1.0 - smoothstep(0.8, 1.0, sqrt(r2) / radius);
  float lum = (core + halo + spikes) * edge;
  vec3 c = max(mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, uSat), 0.0);
  return c * lum;
}
`;
