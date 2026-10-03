import { OUTPUT_FRAGMENT } from './xr';

/**
 * Procedural surface of a planet around another star (types from universe/Planets.ts):
 *   0 lava, 1 hot rock, 2 desert, 3 temperate, 4 ocean, 5 ice, 6 sub-Neptune, 7 ice giant,
 *   8 gas giant, 9 hot Jupiter.
 * Rocky worlds: domain-warped fractal terrain with ridges, seas below a sea level, ice caps, clouds;
 * lava worlds glow through cracks on the night side. Giants: latitude bands torn by turbulence, with
 * storms; hot Jupiters are dark with a dull red thermal glow. Every planet's seed and palette differ.
 */
export const EXO_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform int uType;
uniform float uSeed;
uniform vec3 uC1;           // palette: low / deep
uniform vec3 uC2;           // mid
uniform vec3 uC3;           // high / bright bands
uniform vec3 uSea;          // ocean colour
uniform float uSeaLevel;    // 0..1 of the height range under water
uniform float uIceLat;      // sine of the ice-cap edge latitude (1 = none)
uniform float uClouds;      // cloud cover 0..1
uniform vec3 uAtmoColor;
uniform float uAtmo;        // limb haze strength
uniform float uBands;       // number of bands (giants)
uniform float uTurb;        // band turbulence
uniform float uGlow;        // thermal glow on the night side (lava, hot Jupiters)
uniform vec3 uSunDir;       // world unit vector planet -> star
uniform vec3 uSunColor;     // luminance-normalised star colour
uniform float uSunIrr;      // irradiance from the star (Sun at 1 AU = PI)
uniform float uExposure;
uniform float uTime;
uniform mat3 uBodyToWorld;
uniform float uLite;        // 1 in VR: fewer noise octaves, no domain warp
uniform float uTerrain;     // 1 = drawing the landing terrain (render/TerrainPatch.ts)
uniform float uHScale;      // terrain relief scale (fades in on descent)
uniform vec3 uHoleDir;      // sphere only: body-fixed centre of the terrain patch
uniform float uHoleCos;     // ... and the cosine of its angular radius (2 = no hole)
varying vec3 vTerrN;
varying float vSun;
varying vec3 vNormalBF;
varying vec3 vPosView;
varying vec2 vUv;

float ph(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float pn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ph(i), ph(i + vec3(1,0,0)), f.x), mix(ph(i + vec3(0,1,0)), ph(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(ph(i + vec3(0,0,1)), ph(i + vec3(1,0,1)), f.x), mix(ph(i + vec3(0,1,1)), ph(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float s = 0.0, a = 0.5; int n = uLite > 0.5 ? 4 : 6; for (int i = 0; i < 6; i++) { if (i >= n) break; s += a * pn(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
float ridged(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { float n = 1.0 - abs(pn(p) * 2.0 - 1.0); s += a * n * n; p = p * 2.1 + 3.1; a *= 0.5; } return s; }
float terrain(vec3 n) {
  vec3 q = n * 2.2 + uSeed;
  vec3 w = uLite > 0.5 ? vec3(pn(q * 0.7 + 1.3), pn(q * 0.7 + 7.9), pn(q * 0.7 + 4.1)) - 0.5 : vec3(fbm(q + 1.3), fbm(q + 7.9), fbm(q + 4.1)) - 0.5;
  return 0.65 * fbm(q + w * 1.6) + 0.35 * ridged(q * 1.7 + w);
}

void main() {
  vec3 nB = normalize(vNormalBF);
  if (uTerrain < 0.5 && dot(nB, uHoleDir) > uHoleCos) discard;
  vec3 nW = normalize(uBodyToWorld * nB);
  vec3 V = normalize(-vPosView);
  float mu0 = dot(nW, uSunDir);
  float lat = nB.z;
  vec3 albedo;
  float emit = 0.0;
  vec3 emitColor = vec3(1.0, 0.35, 0.08);
  float spec = 0.0;
  float cloud = 0.0;
  if (uType >= 6) {
    // banded atmosphere
    float t = lat * uBands + uTurb * (fbm(nB * vec3(2.5, 2.5, 9.0) + uSeed + vec3(uTime * 0.002, 0.0, 0.0)) - 0.5) * 3.0;
    float b = 0.5 + 0.5 * sin(t * 3.14159 + uSeed);
    float fine = fbm(nB * vec3(6.0, 6.0, 30.0) + uSeed * 1.3);
    albedo = mix(mix(uC1, uC2, smoothstep(0.2, 0.6, b)), uC3, smoothstep(0.65, 0.95, b * 0.7 + fine * 0.5));
    // storms: a few oval vortices
    for (int k = 0; k < 3; k++) {
      vec3 c = normalize(vec3(ph(vec3(uSeed, float(k), 1.0)) - 0.5, ph(vec3(uSeed, float(k), 2.0)) - 0.5, (ph(vec3(uSeed, float(k), 3.0)) - 0.5) * 0.9));
      vec3 dd = nB - c;
      float r = length(dd * vec3(1.0, 1.0, 2.2));
      float sz = 0.06 + 0.1 * ph(vec3(uSeed, float(k), 4.0));
      albedo = mix(albedo, uC3 * vec3(1.05, 0.85, 0.75), smoothstep(sz, sz * 0.5, r) * 0.8);
    }
    if (uType == 9) emit = uGlow * (0.6 + 0.4 * fine);
  } else {
    float h = terrain(nB);
    float sea = uSeaLevel;
    if (uType == 3 || uType == 4) {
      if (h < sea) {
        float depth = smoothstep(sea, sea - 0.15, h);
        albedo = mix(uSea * 1.6, uSea, depth);
        spec = 1.0;
      } else {
        float e = smoothstep(sea, sea + 0.35, h);
        albedo = mix(uC1, uC2, e);
        albedo = mix(albedo, uC3, smoothstep(0.55, 0.8, e + 0.25 * fbm(nB * 9.0 + uSeed)));
      }
      cloud = uClouds * smoothstep(0.5, 0.75, fbm(nB * vec3(3.0, 3.0, 5.0) + uSeed + vec3(uTime * 0.003, 0.0, 0.0)));
    } else if (uType == 0) {
      // lava: dark crust, glowing cracks and pools
      float cr = ridged(nB * 6.0 + uSeed);
      albedo = mix(uC1, uC2, smoothstep(0.3, 0.7, h));
      emit = uGlow * (smoothstep(0.82, 0.97, cr) + smoothstep(0.25, 0.15, h) * 0.8);
    } else if (uType == 5) {
      float cracks = smoothstep(0.47, 0.5, abs(pn(nB * 9.0 + uSeed) - 0.5) + 0.47);
      albedo = mix(uC2, uC3, smoothstep(0.3, 0.7, h)) * (0.85 + 0.15 * cracks);
    } else {
      albedo = mix(uC1, uC2, smoothstep(0.25, 0.75, h));
      albedo = mix(albedo, uC3, smoothstep(0.6, 0.9, fbm(nB * 12.0 + uSeed)) * 0.6);
    }
    // ice caps
    float cap = smoothstep(uIceLat, uIceLat + 0.06, abs(lat) + 0.08 * (fbm(nB * 6.0 + uSeed) - 0.5));
    albedo = mix(albedo, vec3(0.92, 0.95, 1.0), cap);
    spec *= 1.0 - cap;
    albedo = mix(albedo, vec3(0.95), cloud);
  }
  float light = max(mu0, 0.0);
  if (uTerrain > 0.5) {
    // landing terrain: the relief's own normal and shadows, inside the geometric day side
    vec3 nT = normalize(mix(nW, uBodyToWorld * normalize(vTerrN), uHScale));
    light = max(dot(nT, uSunDir), 0.0) * smoothstep(-0.04, 0.06, mu0) * mix(1.0, vSun, uHScale);
  }
  vec3 sunL = uSunColor * (uSunIrr / 3.14159265);
  vec3 radiance = albedo * sunL * light;
  // sea glint
  if (spec > 0.0 && mu0 > 0.0) {
    vec3 Hh = normalize(uSunDir + V);
    float nh = max(dot(nW, Hh), 0.0);
    radiance += sunL * pow(nh, 120.0) * 2.0 * spec * (1.0 - cloud);
  }
  // atmosphere: bright limb on the day side, a thin ring of scattered light at the terminator
  float mu = max(dot(nW, V), 0.0);
  float rim = pow(1.0 - mu, 3.0);
  radiance += uAtmoColor * sunL * uAtmo * rim * smoothstep(-0.25, 0.3, mu0) * 0.9;
  // thermal glow (night side mostly)
  // (scaled to the starlight so it shows at the exposure the lit planet sets)
  radiance += emitColor * emit * luminance(sunL) * 0.15 * (0.4 + 0.6 * smoothstep(0.2, -0.2, mu0));
  gl_FragColor = vec4(min(radiance * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;
