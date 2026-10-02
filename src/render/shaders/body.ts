import { CHAPMAN } from './atmosphere';
import { FIX_LOGDEPTH, OUTPUT_FRAGMENT, PROJECT_PARS } from './xr';
/** Shaders for resolved Solar System bodies (Phase 1: textured ellipsoids). */

export const BODY_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vNormalBF;   // body-fixed unit normal
varying vec3 vPosView;    // camera-relative world position (m)
varying vec2 vUv;
void main() {
  vNormalBF = normalize(position);
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosView = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

export const BODY_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uMap;
uniform float uHasMap;
uniform float uMapGray;
uniform sampler2D uNight;
uniform float uHasNight;
uniform sampler2D uClouds;
uniform float uHasClouds;
uniform float uCloudShift;    // texture-space longitude offset of the cloud layer
uniform sampler2D uRelief;    // R,G = tangent-space normal (east, north); B = water mask
uniform float uHasRelief;
uniform float uWater;         // 1 if the relief map's B channel is a water mask
uniform vec3 uColor;          // base colour (linear) for map-less bodies
uniform float uAlbedoScale;   // multiplies texture (linear) to obtain reflectance
uniform float uAirless;       // 1 = Lommel-Seeliger, 0 = Lambert
uniform float uBands;         // 1 = procedural gas-giant banding
uniform float uSeed;
uniform vec3 uSunDir;         // world-space unit vector body -> Sun
uniform float uSunIrr;        // solar irradiance at the body (PI at 1 AU)
uniform vec3 uSunColor;
uniform float uExposure;
uniform mat3 uBodyToWorld;    // rotation part (unit) body-fixed -> world
uniform vec3 uBodyCenter;     // camera-relative centre (m)
// Ring shadow (Saturn)
uniform float uHasRings;
uniform sampler2D uRingTex;
uniform vec2 uRingRadii;      // inner, outer (in body radius units)
// Sunlight transmitted through the atmosphere (reddened at the terminator)
uniform float uAtmo;
uniform float uRp;
uniform vec3 uBetaR;
uniform float uHR;
uniform vec3 uBetaMe;
uniform float uHM;
varying vec3 vNormalBF;
varying vec3 vPosView;
varying vec2 vUv;
${CHAPMAN}
vec3 srgbToLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }

float hash1(float n) { return fract(sin(n) * 43758.5453123); }
float noise1(float x) { float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash1(i), hash1(i + 1.0), f); }

void main() {
  vec3 nB = normalize(vNormalBF);
  vec3 nW = normalize(uBodyToWorld * nB);
  vec3 V = normalize(-vPosView);
  float mu0g = dot(nW, uSunDir);   // geometric (smooth sphere)

  // Relief: perturb the normal in the local east/north frame
  vec3 nP = nW;
  float water = 0.0;
  if (uHasRelief > 0.5) {
    vec3 rel = texture2D(uRelief, vUv).rgb;
    vec2 sl = rel.xy * 2.0 - 1.0;
    vec3 east = normalize(vec3(-nB.y, nB.x, 0.0) + vec3(1e-6, 0.0, 0.0));
    vec3 north = cross(nB, east);
    vec3 pB = normalize(nB * sqrt(max(0.05, 1.0 - dot(sl, sl))) + east * sl.x + north * sl.y);
    nP = normalize(uBodyToWorld * pB);
    if (uWater > 0.5) water = smoothstep(0.35, 0.65, rel.b);
  }
  float mu0 = dot(nP, uSunDir);
  float mu = max(dot(nP, V), 0.0);

  vec3 albedo;
  if (uHasMap > 0.5) {
    vec3 t = texture2D(uMap, vUv).rgb;
    if (uMapGray > 0.5) t = vec3(t.r);
    albedo = srgbToLinear(t) * uAlbedoScale;
  } else {
    albedo = uColor * uAlbedoScale;
  }
  if (uBands > 0.5) {
    float lat = asin(clamp(vNormalBF.z, -1.0, 1.0));
    float b = noise1(lat * 18.0 + uSeed) * 0.6 + noise1(lat * 45.0 + uSeed * 1.7) * 0.4;
    albedo *= 0.86 + 0.24 * b;
  }
  float cloud = 0.0;
  if (uHasClouds > 0.5) {
    cloud = texture2D(uClouds, vec2(vUv.x + uCloudShift, vUv.y)).r;
    cloud = smoothstep(0.08, 0.9, cloud);
    albedo = mix(albedo, vec3(0.75), cloud);
  }

  // Terrain shading only on the day side (no light leaking past the geometric terminator)
  float dayside = smoothstep(-0.04, 0.06, mu0g);
  float light;
  if (uAirless > 0.5) {
    light = mu0 > 0.0 ? 2.0 * mu0 / (mu0 + mu + 1e-4) : 0.0; // Lommel-Seeliger
  } else {
    light = max(mix(mu0, mu0g, cloud), 0.0);                // Lambert (clouds hide the relief)
  }
  light *= dayside;

  // Shadow cast by rings onto the planet
  if (uHasRings > 0.5 && mu0g > 0.0) {
    vec3 sBF = transpose(uBodyToWorld) * uSunDir;
    vec3 p = vNormalBF;  // approx surface point in body radius units
    if (abs(sBF.z) > 1e-4) {
      float t = -p.z / sBF.z;
      if (t > 0.0) {
        vec3 hit = p + sBF * t;
        float r = length(hit.xy);
        if (r > uRingRadii.x && r < uRingRadii.y) {
          float a = texture2D(uRingTex, vec2((r - uRingRadii.x) / (uRingRadii.y - uRingRadii.x), 0.5)).r;
          float tau = -log(max(1.0 - a, 1e-3));
          light *= exp(-tau / abs(sBF.z));
        }
      }
    }
  }

  // Sunlight reaching the ground through the atmosphere
  vec3 sunT = vec3(1.0);
  if (uAtmo > 0.5) {
    float cR = sunColumn(uRp, mu0g, uHR, uRp);
    float cM = sunColumn(uRp, mu0g, uHM, uRp);
    sunT = cR > 1.0e11 ? vec3(0.0) : exp(-(uBetaR * cR + uBetaMe * cM));
  }
  vec3 sunL = uSunColor * sunT * (uSunIrr / 3.14159265);
  vec3 radiance = albedo * sunL * light;

  // Sun glint on open water (GGX, roughness of a wind-roughened sea seen from orbit)
  if (water > 0.0 && mu0g > 0.0) {
    vec3 Hh = normalize(uSunDir + V);
    float nh = max(dot(nW, Hh), 0.0);
    float a2 = 0.04;
    float dd = nh * nh * (a2 - 1.0) + 1.0;
    float D = a2 / (3.14159265 * dd * dd);
    float vh = max(dot(V, Hh), 0.0);
    float F = 0.02 + 0.98 * pow(1.0 - vh, 5.0);
    float spec = D * F / max(4.0 * vh * vh, 0.05);
    radiance += sunL * 3.14159265 * spec * max(mu0g, 0.0) * water * (1.0 - cloud) * 0.6;
  }

  if (uHasNight > 0.5) {
    float night = smoothstep(0.05, -0.15, mu0g);
    vec3 lights = srgbToLinear(texture2D(uNight, vUv).rgb);
    radiance += lights * lights * vec3(1.0, 0.8, 0.55) * 0.02 * night * (1.0 - cloud);
  }
  gl_FragColor = vec4(min(radiance * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

export const STAR_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;        // luminance-normalised blackbody colour
uniform float uRadiance;    // mean disk radiance (photometric units)
uniform float uExposure;
uniform float uTime;
uniform mat3 uBodyToWorld;
varying vec3 vNormalBF;
varying vec3 vPosView;
varying vec2 vUv;
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 nW = normalize(uBodyToWorld * vNormalBF);
  vec3 V = normalize(-vPosView);
  float mu = clamp(dot(nW, V), 0.0, 1.0);
  // Linear limb darkening, u = 0.6 (visible band); mean over the disk = 1 - u/3
  float ld = (1.0 - 0.6 * (1.0 - mu)) / 0.8;
  float gran = 0.92 + 0.16 * n3(vNormalBF * 180.0 + uTime * 0.02);
  vec3 c = uColor * uRadiance * ld * gran;
  gl_FragColor = vec4(min(c * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

export const RING_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vLocal;   // ring-plane coordinates in body radius units
varying vec3 vPosView;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosView = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

export const RING_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uRingTex;
uniform vec2 uRingRadii;
uniform vec3 uColor;
uniform vec3 uSunDirBF;     // Sun direction in body-fixed frame
uniform vec3 uViewDirBF;    // direction ring centre -> camera in body-fixed frame
uniform float uSunIrr;
uniform float uExposure;
uniform float uPlanetRadius; // equatorial radius in body radius units (=1) and polar flattening
uniform float uPolar;
varying vec3 vLocal;
varying vec3 vPosView;
void main() {
  float r = length(vLocal.xy);
  if (r < uRingRadii.x || r > uRingRadii.y) discard;
  float a = texture2D(uRingTex, vec2((r - uRingRadii.x) / (uRingRadii.y - uRingRadii.x), 0.5)).r;
  float tau = -log(max(1.0 - a, 1e-3));
  float mu0 = abs(uSunDirBF.z);
  float mu = max(abs(uViewDirBF.z), 1e-3);
  float alpha = 1.0 - exp(-tau / mu);
  bool sameSide = (uSunDirBF.z * uViewDirBF.z) > 0.0;
  // Single-scattering approximation: lit face reflects, unlit face shows forward-scattered light.
  float bright = sameSide ? (1.0 - exp(-tau * (1.0 / mu0 + 1.0 / mu))) * mu0 / (mu0 + mu) * 2.0
                          : (exp(-tau / mu) - exp(-tau / mu0)) / max(1.0 / mu0 - 1.0 / mu, 1e-3) / mu * 0.6;
  // Planet shadow on the rings
  vec3 p = vLocal;
  vec3 s = normalize(uSunDirBF);
  vec3 ps = vec3(p.xy, p.z / uPolar);
  vec3 ss = normalize(vec3(s.xy, s.z / uPolar));
  float b = dot(ps, ss);
  float c = dot(ps, ps) - 1.0;
  float disc = b * b - c;
  if (disc > 0.0 && -b - sqrt(disc) > 0.0) bright = 0.0;
  vec3 radiance = uColor * 0.5 * (uSunIrr / 3.14159265) * max(bright, 0.0);
  // Premultiplied alpha output
  gl_FragColor = vec4(min(radiance * uExposure, vec3(6.0e4)), alpha);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/** Camera-facing glare around the Sun's disk for VR (no bloom pass there). */
export const GLARE_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec2 vXY;
void main() {
  vXY = position.xy;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;
export const GLARE_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;  // display value of the glare at the limb
uniform float uDiskFrac;   // disk radius / quad half-size
varying vec2 vXY;
void main() {
  float r = length(vXY) / uDiskFrac;   // in disk radii
  if (r < 0.98 || r > 1.0 / uDiskFrac) discard;
  // eye/lens scatter: steep core plus a long 1/r^2 skirt, faded at the quad edge
  float g = 0.7 * exp(-(r - 1.0) * 3.0) + 0.3 / (r * r);
  g *= 1.0 - smoothstep(0.6, 1.0, length(vXY));
  gl_FragColor = vec4(uColor * uIntensity * g, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;
