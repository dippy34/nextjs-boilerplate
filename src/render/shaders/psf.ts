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
uniform float uMinSigma; // core width of the faintest stars (px): wider in the headset, against shimmer
`;

/*
 * Appearance of a point source. `energy` E is the displayed energy (physical, pre-exposed
 * irradiance per pixel compressed by a perceptual power law); `g` = log2(raw / threshold) is how
 * many factors of two the source is above the visibility limit. Modelled on how stars look in a
 * good wide-field photograph (and to the eye): every star is a sharp point; brighter ones are
 * larger points (the core widens from ~0.6 to ~2.5 px as its peak saturates), and only the few
 * brightest get a soft glow and, the very brightest, faint diffraction spikes.
 *  - core: a Gaussian whose peak saturates softly at ~1 and whose width grows with g;
 *  - halo: a faint coloured glow from ~3 factors of two above the limit, growing with g;
 *  - spikes: four thin spikes from ~10 factors of two (uGlare scales them).
 * Values are display-referred (~0..1.3), so hue survives the tone curve; uSat sets the colour
 * saturation (1 = blackbody chromaticity).
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
  float sigma = uMinSigma + 0.16 * clamp(g - 2.0, 0.0, 12.0);
  float rh = 1.3 + 0.55 * max(g - 4.0, 0.0);
  float halo = g > 3.0 ? rh * 3.0 * uHalo : 0.0;
  float spikes = g > 10.0 ? 5.0 * rh * uGlare * uHalo : 0.0;
  return min(uMaxRadius, max(sigma * 3.2 + 0.5, max(halo, spikes)));
}
`;

export const PSF_FRAGMENT = /* glsl */ `
vec3 psfShade(vec2 pointCoord, float radius, float energy, vec3 color) {
  vec2 p = (pointCoord - 0.5) * 2.0 * radius;   // CSS pixels from centre
  float r2 = dot(p, p);
  float raw = pow(max(energy, 1e-6) / uPointGain, 1.0 / uPointGamma);
  float g = max(0.0, log2(raw / uMinEnergy));
  float sigma = uMinSigma + 0.16 * clamp(g - 2.0, 0.0, 12.0);
  // the core's peak saturates softly at ~1; brighter stars are wider points
  float core = (1.0 - exp(-energy * 0.35)) * exp(-r2 / (2.0 * sigma * sigma));
  float halo = 0.0, spikes = 0.0;
  if (g > 3.0) {
    float rh = 1.3 + 0.55 * max(g - 4.0, 0.0);
    halo = uHalo * (0.05 + 0.25 * smoothstep(7.0, 13.0, g)) * smoothstep(3.0, 5.5, g) * min(1.0, energy) / pow(1.0 + r2 / (rh * rh), 1.5);
    if (g > 10.0 && uGlare > 0.0) {
      float L = 5.0 * rh;
      vec2 a = abs(p);
      float s1 = exp(-a.y * 2.2) * (1.0 - smoothstep(0.0, L, a.x)) / (1.0 + 5.0 * a.x / L);
      float s2 = exp(-a.x * 2.2) * (1.0 - smoothstep(0.0, L, a.y)) / (1.0 + 5.0 * a.y / L);
      spikes = (s1 + s2) * 0.22 * smoothstep(10.0, 14.0, g) * uGlare * uHalo;
    }
  }
  float edge = 1.0 - smoothstep(0.8, 1.0, sqrt(r2) / radius);
  // the faintest stars drawn fade in over the last ~0.4 magnitudes above the cut-off instead of all
  // showing as equal specks (which read as a photograph's grain); the eye barely sees stars near
  // its limit, and their combined light is in the sky's glow already
  float lum = (core + halo + spikes) * edge * smoothstep(0.0, 0.55, g);
  // faint stars show little colour (the eye's colour vision fades with brightness); bright ones
  // their full (gently boosted) blackbody colour
  // (strongly coloured stars, blue OB stars above all, keep most of it: crowded fields of faint
  // blue points are what star-forming regions and galaxies seen from inside look like)
  float Yc = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float chroma = length(color - vec3(Yc)) / max(Yc, 1e-3);
  float sat = mix(mix(0.6, 0.95, smoothstep(0.15, 0.5, chroma)), uSat, smoothstep(2.0, 7.0, g));
  vec3 c = max(mix(vec3(Yc), color, sat), 0.0);
  return c * lum;
}
`;

/**
 * Twinkling (scintillation) of a star seen through an atmosphere: a multiplier on its light that
 * flickers a few times a second, by up to ~±40 % near the horizon and little overhead (it grows with
 * airmass). `dir`: direction to the star (world, unit); `seed`: per-star phase. 1 in space.
 */
export const TWINKLE_VERTEX = /* glsl */ `
uniform float uTwinkle;
uniform vec3 uTwUp;
uniform float uTwTime;
float twinkle(vec3 dir, float seed) {
  if (uTwinkle <= 0.0) return 1.0;
  float cz = dot(dir, uTwUp);
  if (cz < -0.05) return 1.0;
  float airmass = 1.0 / max(cz + 0.06, 0.08);
  float amp = uTwinkle * min(0.06 * airmass, 0.4);
  float ph = fract(seed) * 6.2832, t = uTwTime;
  float s = 0.5 * sin(t * 7.1 + ph) + 0.3 * sin(t * 12.7 + ph * 2.3) + 0.2 * sin(t * 19.3 + ph * 4.1);
  return max(1.0 + amp * 2.0 * s, 0.2);
}
`;
