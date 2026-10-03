import { MATERIAL_GLSL } from '../Materials';
import { OUTPUT_FRAGMENT } from './xr';

/**
 * Opacity of a generated planet's ring at `r` planet radii (shared by the ring itself and the
 * shadow it casts on the planet): a faint inner ring, a dense middle one, a wide gap, a less dense
 * outer ring with a narrow gap near its edge, and ringlets at several scales (`fw` = the ring
 * fraction one pixel spans: finer ringlets fade out instead of shimmering).
 */
export const RING_GLSL = /* glsl */ `
float ringHash(float n) { return fract(sin(n) * 43758.5453123); }
float ringNoise(float x, float s) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(ringHash(i + s), ringHash(i + 1.0 + s), f); }
float ringDensity(float r, float s, float rin, float rout, float fw) {
  float t = (r - rin) / (rout - rin);
  if (t <= 0.0 || t >= 1.0) return 0.0;
  float inner = 0.12 + 0.18 * ringHash(s + 1.0);
  float d = mix(0.25, 1.0, smoothstep(inner, inner + 0.08, t));     // faint inner ring
  float gp = 0.52 + 0.16 * ringHash(s + 2.0);                       // the big gap
  float gw = 0.015 + 0.025 * ringHash(s + 4.0);
  d *= mix(0.05, 1.0, smoothstep(gw * 0.6, gw, abs(t - gp)));
  d *= mix(1.0, 0.55 + 0.2 * ringHash(s + 5.0), smoothstep(gp, gp + gw, t));   // outer ring: thinner
  float eg = gp + (1.0 - gp) * (0.65 + 0.25 * ringHash(s + 3.0));
  d *= mix(0.1, 1.0, smoothstep(0.003, 0.007, abs(t - eg)));       // narrow gap
  // ringlets: broad waves, then finer structure while it is resolved
  d *= 0.6 + 0.4 * ringNoise(t * 31.0, s);
  d *= mix(1.0, 0.72 + 0.28 * ringNoise(t * 137.0, s + 7.0), smoothstep(0.012, 0.004, fw));
  d *= mix(1.0, 0.8 + 0.2 * ringNoise(t * 590.0, s + 13.0), smoothstep(0.003, 0.001, fw));
  return clamp(d * smoothstep(0.0, 0.015, t) * smoothstep(1.0, 0.985, t), 0.0, 1.0);
}
`;

/**
 * Procedural surface of a planet around another star (types from universe/Planets.ts):
 *   0 lava, 1 hot rock, 2 desert, 3 temperate, 4 ocean, 5 ice, 6 sub-Neptune, 7 ice giant,
 *   8 gas giant, 9 hot Jupiter.
 *
 * Rocky worlds: continents from domain-warped noise with octaves continuing down to ~R/300 (fractal
 * coasts, islands), mountain belts along "plate boundaries" (ridged multifractal), seas below a sea
 * level chosen for the planet's land fraction. The height field shades the surface (relief normal
 * from finite differences of the same function), with detail added as the explorer comes closer,
 * down to the pixel; airless worlds get crater fields (the same cells as the landing ground).
 * Temperate and ocean worlds have a climate: surface temperature from the equilibrium temperature,
 * latitude and altitude (sea ice and snow where it is cold, no plants where it is too hot),
 * moisture from the circulation belts (wet tropics, dry subtropics, wet storm tracks), distance
 * from the sea and wind against the slopes; biomes from both. Oceans darken with depth, show their
 * shelves and a sun glint (microfacet lobe). Clouds follow the belts, wind into cyclones and cast
 * shadows; their tops are shaded by their own thickness.
 * Giants: zonal belts and zones with turbulent edges, filaments sheared along the latitude circles,
 * vortices that swirl the bands around them (a big oval, smaller ones, chains), polar haze, limb
 * darkening; hot Jupiters are dark and glow on the night side. A ring shadows the planet.
 *
 * `terrain()` is mirrored on the CPU in universe/ExoTerrain.ts (`exoTerrain`), and `craters()` in
 * `craterField` (universe/Terrain.ts): the landing ground uses them, so they must stay identical.
 */
export const EXO_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform int uType;
uniform float uSeed;
uniform vec3 uC1;           // palette: vegetation / dark plains / belts
uniform vec3 uC2;           // soil, sand / bright plains / zones
uniform vec3 uC3;           // rock, highlands / bright streaks
uniform vec3 uC4;           // giants: storm and chromophore tint; rocky: fresh ejecta, salt, frost
uniform vec3 uSea;          // ocean colour (deep)
uniform float uSeaLevel;    // height of the sea (0..1 of the terrain function)
uniform float uHMid;        // median of the terrain function over the planet
uniform float uHSpan;       // ... and the spread between its 10 % and 90 % quantiles
uniform float uIceLat;      // sine of the ice-cap edge latitude (1 = none; seas use the temperature)
uniform float uClouds;      // cloud cover 0..1
uniform vec3 uAtmoColor;
uniform float uAtmo;        // limb haze strength
uniform float uBands;       // number of bands (giants)
uniform float uTurb;        // band turbulence
uniform float uStorms;      // giants: number of vortices (0..8)
uniform float uGlow;        // thermal glow on the night side (lava, hot Jupiters)
uniform float uTeq;         // equilibrium temperature (K)
uniform float uRelief;      // relief range / planet radius (for the shading of the height field)
uniform float uRadius;      // planet radius (m)
uniform float uDry;         // 0 wet .. 1 dry climate
uniform float uCraters;     // crater density (0 = none)
uniform int uCSeed;         // crater cell seed (universe/ExoTerrain.ts)
uniform float uRing;        // 1 = a ring in the equatorial plane (its shadow)
uniform float uRingSeed;
uniform float uRingIn;      // ring edges (planet radii)
uniform float uRingOut;
uniform vec3 uSunDir;       // world unit vector planet -> star
uniform vec3 uSunColor;     // luminance-normalised star colour
uniform float uSunIrr;      // irradiance from the star (Sun at 1 AU = PI)
uniform float uExposure;
uniform float uTime;
uniform mat3 uBodyToWorld;
uniform float uLite;        // 1 in VR: fewer noise octaves, no domain warp
uniform float uTerrain;     // 1 = drawing the landing terrain (render/TerrainPatch.ts)
uniform float uHScale;      // terrain relief scale (fades in on descent)
uniform float uCamAlt;      // the explorer's altitude over the sphere (m): below the clouds they are not painted on the ground
uniform vec3 uHoleDir;      // sphere only: body-fixed centre of the terrain patch
uniform float uHoleCos;     // ... and the cosine of its angular radius (2 = no hole)
varying vec3 vTerrN;
varying float vSun;
varying vec3 vNormalBF;
varying vec3 vPosView;
varying vec2 vUv;
varying vec3 vGround;
${MATERIAL_GLSL}
${RING_GLSL}

float ph(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
// value noise on an integer lattice hash (exact on the CPU too, unlike a float hash)
float lh(ivec3 c) {
  uint h = (uint(c.x) * 73856093u) ^ (uint(c.y) * 19349663u) ^ (uint(c.z) * 83492791u);
  h = (h ^ (h >> 16u)) * 73244475u;
  h = (h ^ (h >> 16u)) * 73244475u;
  return float(h ^ (h >> 16u)) * (1.0 / 4294967296.0);
}
float pn(vec3 p) {
  vec3 fl = floor(p); vec3 f = p - fl; f = f * f * (3.0 - 2.0 * f);
  ivec3 i = ivec3(fl);
  return mix(mix(mix(lh(i), lh(i + ivec3(1,0,0)), f.x), mix(lh(i + ivec3(0,1,0)), lh(i + ivec3(1,1,0)), f.x), f.y),
             mix(mix(lh(i + ivec3(0,0,1)), lh(i + ivec3(1,0,1)), f.x), mix(lh(i + ivec3(0,1,1)), lh(i + ivec3(1,1,1)), f.x), f.y), f.z);
}
float fbmN(vec3 p, int n) { float s = 0.0, a = 0.5; for (int i = 0; i < 7; i++) { if (i >= n) break; s += a * pn(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
// ridged multifractal: each octave weighted by the ridge below it, so detail gathers on the crests
float ridgedN(vec3 p, int n) {
  float s = 0.0, a = 0.5, w = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= n) break;
    float r = 1.0 - abs(pn(p) * 2.0 - 1.0);
    r *= r;
    s += a * r * w;
    w = clamp(r * 1.6, 0.0, 1.0);
    p = p * 2.1 + 3.1; a *= 0.5;
  }
  return s;
}
// the height field (0..~1), shared with the CPU (universe/ExoTerrain.ts); 'low' = the continents'
// two broadest octaves (inland vs coast)
float terrainX(vec3 n, out float low) {
  bool lite = uLite > 0.5;
  vec3 q = n * 2.2 + uSeed;
  vec3 w = lite ? vec3(pn(q * 0.5 + 1.3), pn(q * 0.5 + 7.9), pn(q * 0.5 + 4.1)) - 0.5
                : vec3(fbmN(q * 0.5 + 1.3, 4), fbmN(q * 0.5 + 7.9, 4), fbmN(q * 0.5 + 4.1, 4)) - 0.5;
  vec3 cp = q * 0.7 + w * 2.0;
  low = fbmN(cp, 2);
  float cont = low + 0.25 * fbmN(cp * 4.1209 + 5.151, lite ? 2 : 4);   // = fbmN(cp, 6)
  // finer octaves (fractal coasts, islands), a little rougher than the continents' own spectrum
  if (!lite) cont += 0.045 * (fbmN(cp * 41.0 + w * 3.0 + 5.3, 3) - 0.4375);
  float plate = pn(q * 0.55 + w * 1.4 + 11.0);
  float belt = 1.0 - smoothstep(0.0, 0.14, abs(plate - 0.5));
  float mount = ridgedN(q * 2.0 + w, lite ? 3 : 5);
  float land = smoothstep(0.38, 0.6, cont);
  return 0.7 * cont + 0.3 * mount * (0.3 + 0.7 * belt) * (0.35 + 0.65 * land);
}
float terrain(vec3 n) { float l; return terrainX(n, l); }
// detail below the height field's finest octave, down to the pixel (shading only): ridged, so it
// reads as crests and valleys; octaves fade in as they grow past a few pixels
float detail(vec3 n, float fp) {
  float s = 0.0, a = 0.5, f = 520.0;
  for (int i = 0; i < 8; i++) {
    if (f * fp > 0.35 || (uLite > 0.5 && i >= 3)) break;
    float r = 1.0 - abs(pn(n * f + uSeed * 3.7) * 2.0 - 1.0);
    s += a * (r * r - 0.45) * smoothstep(0.35, 0.15, f * fp);
    f *= 2.07; a *= 0.55;
  }
  return s;
}

// landing terrain: hills below the patch's vertex spacing (frequencies above 'fmin'), shaped as the
// CPU ground's (ExoGround.height: ridged in rough country, rolling elsewhere); metres
float hills(vec3 n, float fp, float fmin, float rough) {
  float s = 0.0, f = 300.0;
  float amp = (0.008 + 0.03 * rough * rough) * 2.0;
  for (int i = 0; i < 9; i++) {
    if (f * fp > 0.35) break;
    if (f > fmin * 0.7) {
      float v = pn(n * f + uSeed * 5.3 + float(i) * 7.1);
      float r = 1.0 - abs(2.0 * v - 1.0);
      s += ((r * r - 0.45) * rough + (v - 0.5) * (1.0 - rough)) * amp * (uRadius / f) * smoothstep(fmin * 0.7, fmin * 1.4, f) * smoothstep(0.35, 0.15, f * fp);
    }
    f *= 2.0;
  }
  return s;
}

// crater fields: the CPU's craterField (universe/Terrain.ts) on cells of 'cell' metres; returns the
// gradient of the height (m/m, body frame) and the height in units of the crater depth
float hash3u(ivec3 c, int s) {
  uint h = (uint(c.x) * 374761393u) ^ (uint(c.y) * 668265263u) ^ (uint(c.z) * 1440662683u) ^ (uint(s) * 1274126177u);
  h = (h ^ (h >> 13u)) * 1274126177u;
  return float(h ^ (h >> 16u)) / 4294967296.0;
}
vec4 craters(vec3 p, float cell, int s, float density, float depth, inout float fresh) {
  vec3 x = p / cell;
  vec3 xi = floor(x);
  vec4 acc = vec4(0.0);
  for (int dz = -1; dz <= 1; dz++) for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
    vec3 c = xi + vec3(float(dx), float(dy), float(dz));
    ivec3 ci = ivec3(c);
    if (hash3u(ci, s + 11) > density) continue;
    vec3 o = c + 0.2 + 0.6 * vec3(hash3u(ci, s + 1), hash3u(ci, s + 2), hash3u(ci, s + 3));
    float t = hash3u(ci, s + 5);
    float rc = 0.1 + 0.32 * t * t;
    vec3 dv = (x - o) / rc;
    float d = length(dv);
    if (d > 1.7) continue;
    float e = exp(-((d - 1.0) / 0.28) * ((d - 1.0) / 0.28));
    float k = depth * rc * cell;
    acc.w += (d < 1.0 ? d * d - 1.0 : 0.0) + 0.32 * e;
    float dh = (d < 1.0 ? 2.0 * d : 0.0) - 0.32 * e * 2.0 * (d - 1.0) / 0.0784;
    acc.xyz += k * dh * dv / max(d, 1e-4) / (rc * cell);
    // young craters: bright rays and ejecta
    // young craters: bright floors and rays
    float young = step(0.9, hash3u(ci, s + 7));
    float rays = smoothstep(0.55, 0.85, pn(vec3(atan(dv.y, dv.x) * 5.0, d * 0.7, t * 9.0)));
    fresh += young * (smoothstep(1.0, 0.7, d) * 0.45 + rays * smoothstep(1.7, 1.05, d) * 0.6);
  }
  return acc;
}

// distance to the nearest border between Voronoi cells (crust plates); the headset tier uses the
// contour of a noise instead
float edgeDist(vec3 p, bool lite) {
  if (lite) return abs(pn(p) - 0.5) * 0.6;
  vec3 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 o = g + vec3(ph(i + g), ph(i + g + 17.3), ph(i + g + 41.9)) - f;
    float d = dot(o, o);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return sqrt(d2) - sqrt(d1);
}
float hh(float k, float j) { return ph(vec3(uSeed * 1.37 + 3.1, k * 7.13 + 1.9, j * 3.71 + 0.7)); }
float n1d(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(ph(vec3(i, uSeed, 5.0)), ph(vec3(i + 1.0, uSeed, 5.0)), f); }
// round (slightly east-west elongated) spots on a grid of cells, 'n' cells round the planet
float blobs(vec2 u, float n, float dens, float s) {
  vec2 i = floor(u), f = u - i;
  float m = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec3 hc = vec3(mod(i.x + g.x, n), i.y + g.y, s);
    if (ph(hc) > dens) continue;
    vec2 o = g + 0.1 + 0.8 * vec2(ph(hc + 3.1), ph(hc + 7.7)) - f;
    float rr = 0.12 + 0.2 * ph(hc + 11.3);
    m = max(m, smoothstep(rr, rr * 0.4, length(o * vec2(0.6, 1.0))));
  }
  return m;
}
vec3 rotAbout(vec3 p, vec3 c, float a) { float ca = cos(a), sa = sin(a); return p * ca + cross(c, p) * sa + c * dot(c, p) * (1.0 - ca); }
vec3 rotZ(vec3 p, float a) { float ca = cos(a), sa = sin(a); return vec3(ca * p.x - sa * p.y, sa * p.x + ca * p.y, p.z); }
vec3 dirLL(float la, float lo) { return vec3(cos(la) * cos(lo), cos(la) * sin(lo), sin(la)); }

// clouds: circulation belts, mid-latitude cyclones and a few tropical ones (vortices that wind the
// cloud field into spirals), zonal winds, fine convective texture; returns opacity 0..1
float clouds(vec3 nB, float t, float fp) {
  bool lite = uLite > 0.5;
  float la = asin(clamp(nB.z, -1.0, 1.0));
  float al = abs(la);
  // the cloud layer drifts round the planet as a whole (differential drift would shear it into
  // streaks as time goes on); the field itself evolves slowly
  vec3 p = rotZ(nB, t * 0.0012);
  float cyc = 0.0;
  for (int k = 0; k < 7; k++) {
    float fk = float(k);
    float hs = hh(fk, 1.0) < 0.5 ? -1.0 : 1.0;
    bool tropical = k >= 5;
    float clat = hs * (tropical ? 0.18 + 0.2 * hh(fk, 2.0) : 0.6 + 0.45 * hh(fk, 2.0));
    vec3 c = dirLL(clat, 6.2832 * hh(fk, 3.0) + t * (tropical ? -0.002 : 0.003));
    float r = tropical ? 0.06 + 0.05 * hh(fk, 4.0) : 0.16 + 0.14 * hh(fk, 4.0);
    float d = length(p - c);
    if (d > r * 3.0) continue;
    // low-pressure vortices turn with the planet's spin: counter-clockwise in the north
    float strength = (tropical ? 7.0 : 3.0) * (0.6 + 0.4 * hh(fk, 5.0));
    p = rotAbout(p, c, hs * strength * exp(-d * d / (r * r * 0.5)) * smoothstep(r * 2.5, r * 1.2, d));
    cyc = max(cyc, (tropical ? 1.2 : 0.6) * exp(-d * d / (r * r)) * (tropical ? smoothstep(0.08, 0.2, d / r) : 1.0));
  }
  // stretched along the latitude circles at mid-latitudes (fronts, jet-stream bands)
  vec3 q = p * vec3(3.2, 3.2, 3.2 + 3.0 * smoothstep(0.3, 0.9, al)) + uSeed * 1.7 + vec3(0.0, 0.0, t * 0.0003);
  vec3 w = lite ? vec3(pn(q * 0.6 + 3.1), pn(q * 0.6 + 8.3), pn(q * 0.6 + 1.7)) - 0.5
                : vec3(fbmN(q * 0.6 + 3.1, 3), fbmN(q * 0.6 + 8.3, 3), fbmN(q * 0.6 + 1.7, 3)) - 0.5;
  float c = fbmN(q + w * 2.2, lite ? 4 : 6);
  // fronts: long bands that wind into the cyclones (mid-latitudes)
  if (!lite) c += 0.3 * (ridgedN(q * 0.45 + w * 1.5 + 4.0, 3) - 0.3) * smoothstep(0.35, 0.7, al);
  c += 0.35 * (fbmN(q * 9.0 + w * 5.0, lite ? 1 : 3) - 0.44);
  // finer texture down to the pixel (convective cells, ragged edges)
  float fa = 0.14, ff = 31.0;
  for (int i = 0; i < 5; i++) {
    if (lite || ff * 3.2 * fp > 0.5) break;
    c += fa * (pn(q * ff + w * 9.0) - 0.5) * smoothstep(0.5, 0.25, ff * 3.2 * fp);
    ff *= 2.1; fa *= 0.62;
  }
  c = (c - 0.5) * 2.4 + 0.5;
  // circulation: the ITCZ, dry subtropical highs, the storm tracks, polar fog
  float zone = 0.5 + 0.35 * exp(-(la / 0.13) * (la / 0.13)) - 0.4 * exp(-((al - 0.45) / 0.15) * ((al - 0.45) / 0.15))
             + 0.3 * exp(-((al - 1.0) / 0.25) * ((al - 1.0) / 0.25));
  float cover = clamp(uClouds * zone + cyc * 0.5 * uClouds, 0.0, 1.0);
  float dense = smoothstep(1.0 - cover - 0.04, 1.0 - cover + 0.2, c);
  // thin cirrus streaks along the jet streams
  float ci = lite ? 0.0 : smoothstep(0.58, 0.8, fbmN(q * vec3(1.4, 1.4, 3.0) + w * 3.5 + 9.0, 4)) * smoothstep(0.3, 0.6, al) * 0.25 * uClouds;
  return max(dense, ci);
}

// surface temperature (K): equilibrium temperature warmed by an Earth-like greenhouse (33 K),
// warmer at the equator and colder towards the poles (Earth's profile) and with height (6.5 K/km)
float surfTemp(float lat, float altM) {
  float s2 = lat * lat;
  return uTeq + 45.0 - 22.0 * s2 - 24.0 * s2 * s2 - 0.0065 * altM;
}

vec3 biome(float h, float sea, float low, float lat, float slope, vec3 nB, float mtn, float windward, float T, out float veg, out float snowOut, out float rockOut) {
  bool lite = uLite > 0.5;
  float alt = max(h - sea, 0.0);
  float la = asin(clamp(lat, -1.0, 1.0));
  float al = abs(la);
  // circulation belts: wet tropics, dry subtropics (~25°), wet storm tracks (~50°), dry poles
  float zonal = 0.12 + 0.8 * exp(-(la / 0.2) * (la / 0.2)) + 0.55 * exp(-((al - 0.87) / 0.22) * ((al - 0.87) / 0.22));
  // far from the sea it is drier
  float inland = smoothstep(0.0, 0.11, 0.7 * low * 1.31 + 0.05 - sea);
  float mn = fbmN(nB * 5.0 + uSeed * 2.1, lite ? 2 : 4) - 0.5;
  float moist = clamp(zonal * 0.9 + 0.38 - 0.25 * inland + 1.1 * mn + windward - uDry * 0.4, 0.0, 1.0);
  float warm = smoothstep(272.0, 292.0, T);
  float tropic = smoothstep(290.0, 300.0, T);
  float scorch = smoothstep(318.0, 340.0, T);
  // vegetation: forest where it is wet, grass and scrub where drier; tropical forests darker,
  // boreal ones darker and bluer
  vec3 forest = uC1 * mix(vec3(0.85, 0.95, 1.1), vec3(0.75, 0.9, 0.8), tropic);
  vec3 grass = mix(uC1 * 2.2, uC2 * 0.55, 0.45);
  vec3 steppe = mix(uC2 * 0.75, grass, 0.35);
  // deserts: sand seas, gravel plains and bare rock in provinces
  float prov = smoothstep(0.42, 0.62, fbmN(nB * 3.0 + uSeed * 2.7, lite ? 2 : 4));
  vec3 sand = mix(uC2, mix(uC2 * 0.6, uC3, 0.5), prov * 0.8);
  vec3 c = mix(sand, steppe, smoothstep(0.12, 0.28, moist));
  c = mix(c, grass, smoothstep(0.28, 0.45, moist));
  c = mix(c, forest, smoothstep(0.45, 0.7, moist));
  float vegW = smoothstep(0.2, 0.6, moist) * warm * (1.0 - scorch);
  // cold: tundra (lichen, moss, bare soil)
  vec3 tundra = mix(uC3 * 0.8, uC1 * 1.6, 0.4);
  c = mix(tundra, c, smoothstep(262.0, 276.0, T));
  // too hot for plants: baked soil and dunes
  c = mix(c, mix(sand, uC3 * 0.8, 0.2), scorch);
  // variation at several scales
  float v1 = fbmN(nB * 23.0 + uSeed * 5.3, lite ? 1 : 3) - 0.44;
  c *= 1.0 + 0.6 * v1;
  c = mix(c, uC2 * 0.8, clamp(v1 * 0.8, 0.0, 0.3) * (1.0 - vegW));
  // bare rock on steep or high ground
  float rock = clamp(smoothstep(0.35, 0.75, slope) + smoothstep(0.14, 0.3, alt) * 0.6 + mtn * 0.35, 0.0, 1.0) * (1.0 - 0.5 * vegW);
  c = mix(c, uC3 * (0.85 + 0.3 * v1), rock * 0.85);
  // snow: cold places and high mountains (less on cliffs)
  float snow = smoothstep(271.0, 257.0, T + 5.0 * (pn(nB * 40.0 + uSeed) - 0.5) + 6.0 * (1.0 - moist)) * (1.0 - 0.6 * smoothstep(0.7, 0.95, slope));
  veg = vegW * (1.0 - rock);
  snowOut = snow;
  rockOut = rock;
  return mix(c, vec3(0.82, 0.85, 0.9), snow);
}

// giants: belts and zones, vortices, filaments; returns albedo (and 'storm' for the glow)
vec3 giant(vec3 nB, out float streakOut) {
  bool lite = uLite > 0.5;
  float la0 = asin(clamp(nB.z, -1.0, 1.0));
  // differential rotation: each latitude drifts at its own rate
  // (only slightly: drift that differs by latitude shears the vortices as time goes on)
  vec3 p = rotZ(nB, uTime * (0.002 + 0.00006 * sin(la0 * uBands * 0.9 + uSeed)));
  // vortices: the bands swirl around them (anticyclonic ovals: clockwise in the north)
  float oval = 0.0, ovalCore = 0.0, comp = 0.0, collar = 0.0;
  for (int k = 0; k < 8; k++) {
    float fk = float(k);
    if (fk >= uStorms) break;
    float hs = hh(fk, 11.0) < 0.5 ? -1.0 : 1.0;
    float clat = hs * (k == 0 ? 0.25 + 0.25 * hh(fk, 12.0) : 0.15 + 0.9 * hh(fk, 12.0));
    float clo = 6.2832 * hh(fk, 13.0) + uTime * 0.001 * (hh(fk, 15.0) - 0.5);
    vec3 c = dirLL(clat, clo);
    float r = k == 0 ? 0.07 + 0.07 * hh(fk, 14.0) : k < 3 ? 0.03 + 0.03 * hh(fk, 14.0) : 0.012 + 0.015 * hh(fk, 14.0);
    vec3 e = normalize(vec3(-c.y, c.x, 0.0));
    vec3 dlt = p - c;
    float x = dot(dlt, e) / (r * 1.8), y = dot(dlt, cross(c, e)) / r;
    float d2 = x * x + y * y;
    if (d2 > 9.0 || dot(p, c) < 0.0) continue;
    p = rotAbout(p, c, -hs * (k == 0 ? 3.5 : 2.5) * exp(-d2 * 0.8));
    float m = smoothstep(1.0, 0.55, sqrt(d2));
    // bright companion clouds on the poleward side (ice giants' dark spots)
    comp = max(comp, smoothstep(0.5, 0.0, abs(y * hs - 1.1) + abs(x) * 0.4) * step(0.5, hh(fk, 16.0)));
    if (k == 0) ovalCore = max(ovalCore, m); else oval = max(oval, m * (0.5 + 0.5 * hh(fk, 17.0)));
    // a darker collar of sheared cloud around each oval
    collar = max(collar, smoothstep(0.5, 0.0, abs(sqrt(d2) - 1.15)) * (k == 0 ? 0.8 : 0.6));
  }
  float la = asin(clamp(p.z, -1.0, 1.0));
  vec2 ring = p.xy / max(length(p.xy), 1e-3);
  float lon = atan(ring.y, ring.x);
  // large waves and eddies displace the latitude (turbulent band edges)
  float wave = fbmN(vec3(ring * 2.0, la * 10.0) + uSeed, lite ? 2 : 4) - 0.5;
  float eddy = fbmN(vec3(ring * 9.0 + wave * 3.0, la * 36.0) + uSeed * 0.7, lite ? 1 : 3) - 0.5;
  float lw0 = la + uTurb * (0.035 * wave + 0.012 * eddy);
  // band profile: belts and zones of irregular widths and strengths
  float x0 = lw0 * uBands * 1.2 + uSeed;
  float b0 = smoothstep(0.36, 0.64, 0.65 * n1d(x0) + 0.35 * n1d(x0 * 2.3 + 7.0));
  // Kelvin-Helmholtz waves where belt and zone shear past each other
  float lw = lw0 + 4.0 * b0 * (1.0 - b0) * uTurb * 0.008 * sin(lon * (14.0 + 12.0 * hh(2.0, 19.0)) + 7.0 * wave);
  float x = lw * uBands * 1.2 + uSeed;
  float b = smoothstep(0.36, 0.64, 0.65 * n1d(x) + 0.35 * n1d(x * 2.3 + 7.0));
  float edge = 4.0 * b * (1.0 - b);
  // filaments sheared along the latitude circles, and finer turbulence
  float streak = fbmN(vec3(ring * 5.0 + eddy * 1.5, lw * 45.0) + uSeed * 1.3, lite ? 3 : 5);
  float fine = lite ? 0.5 : fbmN(vec3(ring * 16.0 + eddy * 4.0, lw * 120.0) + uSeed * 2.1, 3);
  // colour: belts (C1, some tinted towards C4) and zones (C2, some brighter towards C3)
  vec3 beltCol = mix(uC1, uC4, n1d(x * 1.7 + 13.0) * 0.7);
  vec3 zoneCol = mix(uC2, uC3, n1d(x * 1.3 + 5.0) * 0.5);
  vec3 col = mix(beltCol, zoneCol, clamp(b + (streak - 0.5) * 0.7 * uTurb, 0.0, 1.0));
  col = mix(col, uC3, smoothstep(0.64, 0.82, streak) * 0.35 * b);
  col *= 1.0 - 0.3 * smoothstep(0.58, 0.78, 1.0 - streak) * (1.0 - b) * uTurb;
  col *= 0.86 + 0.28 * fine * (0.4 + uTurb);
  // small bright plumes and dark barges inside the belts
  if (!lite && uType >= 8) {
    vec2 u = vec2(lon, lw) * (48.0 / 6.2832) + vec2(eddy * 0.6, 0.0);
    col = mix(col, uC3, blobs(u, 48.0, 0.12, uSeed + 1.0) * (1.0 - b) * 0.45 * uTurb);
    col = mix(col, uC1 * 0.6, blobs(u * 0.75, 36.0, 0.1, uSeed + 2.0) * (1.0 - b) * 0.45 * uTurb);
  }
  // festoons and dark barges along the band edges
  col = mix(col, uC1 * vec3(0.7, 0.75, 0.85), edge * smoothstep(0.12, 0.3, eddy + (fine - 0.5) * 0.5) * 0.55 * uTurb);
  // vortices: a big oval (chromophore red; a dark spot on ice giants), smaller white ovals
  bool darkSpots = uType == 7;
  col = mix(col, darkSpots ? uC1 * 0.55 : mix(uC4, uC3, 0.25) * (0.9 + 0.2 * streak), ovalCore * 0.8);
  col = mix(col, uC3 * 1.05, oval * 0.8);
  col *= 1.0 - 0.3 * collar;
  if (darkSpots) col = mix(col, uC3 * 1.1, comp * 0.8);
  // chains of small white ovals on one latitude
  float chainLat = 0.35 + 0.3 * hh(1.0, 18.0);
  float ov = blobs(vec2(lon * (24.0 / 6.2832), (abs(la) - chainLat) * (24.0 / 6.2832) + 0.5), 24.0, 0.6, uSeed + 5.0);
  col = mix(col, uC3, ov * (1.0 - smoothstep(0.02, 0.04, abs(abs(la) - chainLat))) * 0.7 * step(1.0, uStorms));
  // polar regions: the bands break up into mottled, darker, bluer haze
  float pole = smoothstep(1.0, 1.3, abs(la) + 0.15 * wave);
  float mott = fbmN(p * 9.0 + uSeed, lite ? 2 : 4);
  col = mix(col, mix(uC1, uC2, mott) * vec3(0.8, 0.85, 0.95), pole * 0.8);
  streakOut = streak;
  return col;
}

void main() {
  vec3 nB = normalize(vNormalBF);
  if (uTerrain < 0.5 && dot(nB, uHoleDir) > uHoleCos) discard;
  bool lite = uLite > 0.5;
  vec3 nW = normalize(uBodyToWorld * nB);
  vec3 V = normalize(-vPosView);
  float mu0 = dot(nW, uSunDir);
  float lat = nB.z;
  vec3 sunB = uSunDir * uBodyToWorld;    // the star's direction in the body frame
  float fp = max(length(fwidth(nB)), 1e-7);   // radians per pixel
  vec3 albedo;
  float emit = 0.0;
  vec3 emitColor = vec3(1.0, 0.35, 0.08);
  float spec = 0.0;
  float cloud = 0.0;
  float shadow = 1.0;
  vec3 nShade = nW;       // shading normal (relief)
  float limb = 1.0;
  // ground materials up close (render/Materials.ts): flat A, flat B, steep, snow; shares of B and snow
  vec4 msel = vec4(2.0, 5.0, 3.0, 6.0);
  float veg = 0.0, snowG = 0.0;
  vec3 hillTilt = vec3(0.0);
  if (uType >= 6) {
    float streak;
    albedo = giant(nB, streak);
    // limb darkening (high haze over the clouds)
    limb = pow(max(dot(nW, V), 0.0), 0.2);
    if (uType == 9) emit = uGlow * (0.55 + 0.45 * streak);
    emitColor = vec3(1.0, 0.3, 0.1);
  } else {
    float low;
    float h = terrainX(nB, low);
    float sea = uSeaLevel;
    bool seas = uType == 3 || uType == 4;
    // relief normal from the height field (finite differences at the pixel's scale; none in VR)
    vec3 t1 = normalize(cross(abs(nB.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0), nB));
    vec3 t2 = cross(nB, t1);
    float eps = clamp(fp * 1.5, 2e-5, 0.01);
    float hn = (h - uHMid) / uHSpan;      // dry worlds: height by quantile (about -0.5 .. 0.5 for 10 .. 90 %)
    // rough mountains and highlands, smoother plains and lowlands
    float rough = seas ? 0.25 + 0.75 * smoothstep(sea + 0.01, sea + 0.2, h) : 0.5 + 0.5 * smoothstep(-0.2, 0.45, hn);
    float dd = detail(nB, fp) * rough;
    float hd = h + dd * 0.008;
    vec2 g = vec2(0.0);
    if (!lite) {
      vec3 n1 = normalize(nB + t1 * eps), n2 = normalize(nB + t2 * eps);
      float hx = terrain(n1) + detail(n1, fp) * rough * 0.008;
      float hy = terrain(n2) + detail(n2, fp) * rough * 0.008;
      g = vec2(hx - hd, hy - hd) / eps;
    }
    bool wet = seas && h < sea;
    if (uTerrain > 0.5 && !lite && !wet) {
      float fmin = uRadius / (2.5 * max(length(vPosView) * 0.065, 1.0));   // (the patch's vertex spacing there)
      vec3 m1 = normalize(nB + t1 * eps), m2 = normalize(nB + t2 * eps);
      float h0 = hills(nB, fp, fmin, rough);
      hillTilt = (t1 * (hills(m1, fp, fmin, rough) - h0) + t2 * (hills(m2, fp, fmin, rough) - h0)) / (eps * uRadius);
    }
    // slope of the ground (relief range over the radius); the shading exaggerates it so relief reads
    // from orbit (as it does at low sun on real planets, from slopes far below the pixel)
    vec2 gs = wet ? vec2(0.0) : g * uRelief * 2.5;
    float exag = 4.0;
    // craters (airless and thin-aired worlds), large ones first; skipped below a few pixels
    float fresh = 0.0, crat = 0.0;
    if (uCraters > 0.0 && !wet) {
      vec3 pm = nB * uRadius;
      float pxm = fp * uRadius;
      vec3 cg = vec3(0.0);
      float cellS[3] = float[3](846400.0, 184000.0, 40000.0);
      float densS[3] = float[3](0.5, 0.5, 0.4);
      float depS[3] = float[3](0.04, 0.06, 0.18);
      for (int i = 0; i < 3; i++) {
        if (lite && (i == 2 || (i == 1 && uRadius >= 1.5e6))) break;   // headset: one scale
        if (cellS[i] * 0.15 < pxm || (i == 0 && uRadius < 1.5e6)) continue;
        vec4 cr = craters(pm, cellS[i], uCSeed + 100 * i, densS[i] * uCraters, depS[i], fresh);
        float fade = smoothstep(pxm, pxm * 4.0, cellS[i] * 0.15);
        cg += cr.xyz * fade;
        crat += cr.w * fade;
      }
      // on the landing terrain the relief carries the craters itself
      cg *= 1.0 - uTerrain * uHScale;
      gs += vec2(dot(cg, t1), dot(cg, t2)) * 2.5 / exag;
      fresh = clamp(fresh, 0.0, 1.0);
    }
    float slope = clamp(length(gs) * 3.0, 0.0, 1.0);
    vec3 nBs = normalize(nB - (t1 * gs.x + t2 * gs.y) * exag);
    nShade = normalize(uBodyToWorld * nBs);
    float mtn = seas ? smoothstep(sea + 0.12, sea + 0.28, h) : smoothstep(0.25, 0.55, hn);
    float altM = max(h - sea, 0.0) * uRelief * uRadius;
    float T = surfTemp(lat, seas ? altM : 0.0);
    float var = fbmN(nB * 31.0 + uSeed * 4.1, lite ? 1 : 3) - 0.44;   // patchiness
    // and at the scale of kilometres (seen from low orbit and the ground), fading in as it resolves
    float var2 = lite ? 0.0 : (fbmN(nB * 420.0 + uSeed * 2.9, 3) - 0.44) * smoothstep(0.004, 0.0008, fp);
    if (seas) {
      if (wet) {
        // depth: shelves bright and turquoise where warm, greener where cold; sea ice where frozen
        float depth = sea - h;
        // (broad shelves along some coasts, steep drops along others)
        float shelf = 1.0 - smoothstep(0.0, 0.012 + 0.04 * pn(nB * 3.0 + uSeed * 1.9), depth);
        vec3 shallow = mix(vec3(0.02, 0.06, 0.06), vec3(0.035, 0.12, 0.13), smoothstep(280.0, 296.0, T));
        albedo = mix(uSea * mix(1.25, 0.8, smoothstep(0.04, 0.2, depth)), shallow, shelf * shelf);
        float seaIce = smoothstep(271.5, 263.0, T + 4.0 * (fbmN(nB * 14.0 + uSeed, lite ? 2 : 4) - 0.5));
        albedo = mix(albedo, vec3(0.62, 0.66, 0.7) * (0.85 + 0.3 * var), seaIce);
        spec = 1.0 - seaIce;
        snowG = seaIce;
      } else {
        // wind blowing up the slopes brings rain: easterly trades, westerlies further out
        vec3 east = normalize(vec3(-nB.y, nB.x, 0.0) + 1e-6);
        float la = asin(clamp(lat, -1.0, 1.0));
        vec3 wind = east * mix(-1.0, 1.0, smoothstep(0.4, 0.6, abs(la)));
        float up = dot(t1 * g.x + t2 * g.y, wind) * uRelief * 40.0;
        float rock;
        albedo = biome(h, sea, low, lat, slope, nB, mtn, clamp(up, -0.25, 0.25), T, veg, snowG, rock);
        albedo *= 1.0 + 0.8 * dd;
        // beaches and coastal flats
        albedo = mix(albedo, uC2 * 1.1, (1.0 - smoothstep(0.0, 0.006, h - sea)) * smoothstep(275.0, 290.0, T) * 0.6);
      }
      cloud = clouds(nB, uTime, fp);
      // cloud shadows on the ground (clouds ~0.15 % of the radius up), cloud tops shaded by their thickness
      float muB = dot(nB, sunB);
      vec3 sp = normalize(nB + (sunB - nB * muB) * 0.0025 / max(muB, 0.15));
      float cs = lite ? cloud : clouds(sp, uTime, fp * 2.0);
      shadow = 1.0 - 0.75 * cs * smoothstep(-0.05, 0.25, muB);
      cloud = clamp(cloud, 0.0, 1.0) * smoothstep(4000.0, 9000.0, uCamAlt);
      albedo = mix(albedo, vec3(mix(0.62, 0.92, cloud)) * clamp(1.0 - 1.6 * (cs - cloud), 0.55, 1.15), cloud);
      if (cloud > 0.0) nShade = normalize(mix(nShade, nW, cloud));
      shadow = mix(shadow, 1.0, cloud);
      msel = vec4(5.0, 7.0, 3.0, 6.0);            // dry soil / forest floor / cliff / snow
    } else if (uType == 0) {
      // lava: dark crust in plates, glowing cracks between them, molten lakes in the lowlands
      vec3 lw3 = vec3(pn(nB * 4.0 + uSeed), pn(nB * 4.0 + uSeed + 3.3), pn(nB * 4.0 + uSeed + 7.1)) - 0.5;
      float seam = edgeDist(nB * 9.0 + lw3 * 1.5 + uSeed, lite);
      float seam2 = lite ? 1.0 : edgeDist(nB * 37.0 + lw3 * 3.0 + uSeed * 1.9, false);
      float plate = smoothstep(-0.3, 0.3, hn + 0.6 * var);
      albedo = mix(uC1, uC2, plate) * (1.0 + 0.8 * dd);
      float lake = smoothstep(-0.4, -0.5, hn + 0.1 * var);
      albedo = mix(albedo, uC1 * 0.6, lake);
      // seams between crust plates glow (wider and hotter in the lowlands), small cracks inside them
      float live = smoothstep(0.5, 0.75, pn(nB * 3.5 + uSeed * 2.2) + 0.3 * smoothstep(0.1, -0.4, hn));
      float cracks = (smoothstep(0.05, 0.0, seam) * 0.8 + smoothstep(0.04, 0.0, seam2) * 0.3) * live;
      albedo *= 1.0 - 0.5 * cracks;
      emit = uGlow * (cracks + lake * (0.6 + 0.4 * pn(nB * 60.0 + uSeed)));
      msel = vec4(2.0, 0.0, 3.0, 6.0);           // lava fields: dark rocky ground
    } else if (uType == 5) {
      // ice: bright plains, darker older terrain, long crossing ridges and cracks (lineae, along
      // arcs of great circles), finer fractures
      float lines = 0.0;
      for (int k = 0; k < 18; k++) {
        float fk = float(k);
        if (lite && k >= 6) break;
        vec3 nrm = normalize(vec3(hh(fk, 21.0), hh(fk, 22.0), hh(fk, 23.0)) - 0.5);
        float d = dot(nB, nrm) + 0.012 * (pn(nB * 9.0 + fk * 3.3) - 0.5);
        float wl = 0.0025 + 0.006 * hh(fk, 24.0) * hh(fk, 29.0);
        vec3 mid = normalize(cross(nrm, vec3(hh(fk, 25.0), hh(fk, 26.0), hh(fk, 27.0)) - 0.5));
        float seg = smoothstep(-0.2, 0.3, dot(nB, mid) - 0.3 + 0.6 * hh(fk, 28.0));
        // a double ridge: two dark bands with a brighter crest between
        float ad = abs(d);
        lines = max(lines, (smoothstep(wl, wl * 0.4, ad) - 0.5 * smoothstep(wl * 0.3, 0.0, ad)) * seg * smoothstep(1.5 * wl, 4.0 * wl, fp * 2.0 + 0.004));
      }
      float l3 = abs(pn(nB * 23.0 + uSeed * 2.3) - 0.5);
      lines = max(lines, smoothstep(0.012, 0.0, l3) * 0.4);
      float old = smoothstep(-0.1, 0.15, hn + 0.7 * var);
      albedo = mix(uC2, uC1, old * 0.6);
      // chaos terrain: blocks of crust in darker, rougher matrix
      float chaos = smoothstep(0.62, 0.7, fbmN(nB * 4.0 + uSeed * 1.3, lite ? 2 : 4)) * (0.6 + 0.4 * pn(nB * 60.0 + uSeed));
      albedo = mix(albedo, uC1 * 0.9, chaos * 0.7);
      albedo = mix(albedo, uC1 * 0.8, lines * (lite ? 0.5 : 0.75));
      albedo = mix(albedo, uC3, smoothstep(0.4, 0.6, hn));
      albedo = mix(albedo, uC4, fresh * 0.7);
      albedo *= 1.0 + 0.5 * dd;
      msel = vec4(6.0, 6.0, 3.0, 6.0);
      snowG = 1.0;
    } else if (uType == 2) {
      // deserts (Mars-like): bright dust, dark basaltic regions, salt flats in the deepest basins,
      // dunes in the lowlands, rock on high and steep ground
      // albedo provinces with fairly crisp edges (dust deposits vs dark sand and rock), streaks
      vec3 rw = vec3(pn(nB * 3.0 + uSeed), pn(nB * 3.0 + uSeed + 5.2), pn(nB * 3.0 + uSeed + 9.7)) - 0.5;
      float region = fbmN(nB * 2.6 + rw * 1.2 + uSeed * 3.3, lite ? 3 : 5) + 0.2 * var;
      albedo = mix(uC2, uC1, smoothstep(0.52, 0.58, region));
      albedo = mix(albedo, mix(uC1, uC2, 0.5), smoothstep(0.47, 0.52, region) * (1.0 - smoothstep(0.52, 0.58, region)) * 0.6);
      albedo = mix(albedo, uC2 * 1.12, smoothstep(0.0, 0.4, hn) * 0.35);
      float dunes = 0.5 + 0.5 * sin(dot(nB, vec3(900.0, 380.0, 140.0)) + 9.0 * pn(nB * 40.0 + uSeed));
      albedo *= 1.0 - 0.12 * dunes * smoothstep(-0.1, -0.3, hn) * smoothstep(0.002, 0.0006, fp);
      // salt flats in the deepest basins
      albedo = mix(albedo, mix(uC2, uC4, 0.6), smoothstep(-0.62, -0.72, hn + 0.15 * var) * smoothstep(0.4, 0.6, pn(nB * 18.0 + uSeed)) * 0.8);
      albedo = mix(albedo, uC3, clamp(smoothstep(0.35, 0.75, slope) + mtn * 0.4, 0.0, 1.0) * 0.6);
      // craters: darker sandy floors, bright fresh ejecta
      albedo *= 1.0 + 0.18 * clamp(crat, -1.0, 0.3);
      albedo = mix(albedo, uC2 * 1.3, fresh * 0.5);
      albedo *= (1.0 + 0.8 * dd) * (1.0 + 0.4 * var);
      msel = vec4(4.0, 5.0, 3.0, 6.0);
      veg = 1.0 - smoothstep(-0.2, 0.05, hn);     // dunes in the lowlands
    } else {
      // hot rock (Mercury-like): dark smooth volcanic plains in the lowlands, lighter cratered
      // highlands, bright young craters
      float plains = smoothstep(-0.02, -0.15, hn + 0.12 * (fbmN(nB * 9.0 + uSeed * 1.7, lite ? 2 : 3) - 0.44) + 0.1 * var);
      albedo = mix(uC2, uC1, plains);
      albedo = mix(albedo, uC3, smoothstep(0.3, 0.55, hn) * 0.5);
      albedo = mix(albedo, uC4, fresh * 0.8);
      albedo *= (1.0 + 0.8 * dd) * (1.0 + 0.5 * var);
      msel = vec4(1.0, 2.0, 3.0, 6.0);           // hot rock: pocked regolith and stony ground
    }
    if (!wet) albedo *= 1.0 + 0.5 * var2 * (1.0 - cloud);
    // polar caps (dry worlds; seas freeze by temperature)
    if (!seas) {
      float cap = smoothstep(uIceLat, uIceLat + 0.06, abs(lat) + 0.08 * (fbmN(nB * 6.0 + uSeed, 3) - 0.5));
      albedo = mix(albedo, vec3(0.85, 0.87, 0.9), cap);
      snowG = max(snowG, cap);
    }
  }
  // the ring's shadow
  if (uRing > 0.5 && abs(sunB.z) > 1e-3) {
    float t = -nB.z / sunB.z;
    if (t > 0.0) shadow *= 1.0 - 0.9 * ringDensity(length((nB + sunB * t).xy), uRingSeed, uRingIn, uRingOut, 0.0);
  }
  float light = max(dot(nShade, uSunDir), 0.0) * smoothstep(-0.05, 0.08, mu0);
  if (uTerrain > 0.5) {
    // landing terrain: the relief's own normal and shadows, inside the geometric day side, with
    // the scanned ground materials' grain
    vec3 nTB = normalize(normalize(vTerrN) - hillTilt * uHScale);
    if (uMatOn > 0.5 && uType < 6 && uHScale > 0.01) {
      vec3 nG;
      vec3 det = groundDetail(vGround, nB, nTB, length(fwidth(vPosView)), msel, veg, snowG, uLite, nG);
      albedo *= mix(vec3(1.0), det, uHScale * (1.0 - cloud));
      nTB = normalize(mix(nTB, nG, uHScale));
    }
    vec3 nT = normalize(mix(nW, uBodyToWorld * nTB, uHScale));
    light = max(dot(nT, uSunDir), 0.0) * smoothstep(-0.04, 0.06, mu0) * mix(1.0, clamp(0.5 + vSun, 0.0, 1.0), uHScale);
  }
  vec3 sunL = uSunColor * (uSunIrr / 3.14159265);
  vec3 radiance = albedo * sunL * light * shadow * limb;
  // sea glint: a rough-water microfacet lobe (Beckmann, rms slope ~0.2) and sky reflection
  if (spec > 0.0 && mu0 > 0.0) {
    vec3 Hh = normalize(uSunDir + V);
    float nh = max(dot(nW, Hh), 1e-3);
    float nv = max(dot(nW, V), 0.02);
    float m2 = 0.04;
    float t2 = (1.0 - nh * nh) / (nh * nh);
    float D = exp(-t2 / m2) / (3.14159265 * m2 * nh * nh * nh * nh);
    float F = 0.02 + 0.98 * pow(1.0 - max(dot(V, Hh), 0.0), 5.0);
    float brdf = D * F / (4.0 * nv * max(mu0, 0.02));
    radiance += sunL * 3.14159265 * brdf * mu0 * spec * (1.0 - cloud) * shadow * smoothstep(0.0, 0.05, mu0);
    float fres = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
    radiance += uAtmoColor * sunL * fres * 0.05 * spec * (1.0 - cloud) * smoothstep(-0.1, 0.3, mu0);
  }
  // atmosphere: bright limb on the day side
  float mu = max(dot(nW, V), 0.0);
  float rim = pow(1.0 - mu, 3.0);
  radiance += uAtmoColor * sunL * uAtmo * rim * smoothstep(-0.25, 0.3, mu0) * 0.9 * (1.0 - uTerrain);   // (the sphere's limb only)
  // thermal glow (night side mostly)
  // (scaled to the starlight so it shows at the exposure the lit planet sets)
  radiance += emitColor * emit * luminance(sunL) * (0.012 + 0.4 * smoothstep(0.2, -0.2, mu0));
  gl_FragColor = vec4(min(radiance * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;
