import { CHAPMAN } from './atmosphere';
import { MATERIAL_GLSL } from '../Materials';
import { FIX_LOGDEPTH, OUTPUT_FRAGMENT, PROJECT_PARS } from './xr';
/** Shaders for resolved Solar System bodies (Phase 1: textured ellipsoids). */

export const BODY_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
uniform float uLumpy;     // irregular shape of small bodies (relative radius variation)
uniform float uSeed;
varying vec3 vNormalBF;   // body-fixed unit normal
varying vec3 vTerrN;      // body-fixed normal of the landing terrain (render/TerrainPatch.ts)
varying float vSun;       // terrain only: clearance of the Sun over the relief (penumbra widths)
varying vec3 vLocal;      // terrain only: body-fixed position relative to the patch origin (m)
varying vec3 vPosView;    // camera-relative world position (m)
varying vec2 vUv;
varying vec3 vGround;     // terrain only: body-fixed position of the ground relative to the patch origin (m)
float vh3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(vh3(i), vh3(i + vec3(1,0,0)), f.x), mix(vh3(i + vec3(0,1,0)), vh3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(vh3(i + vec3(0,0,1)), vh3(i + vec3(1,0,1)), f.x), mix(vh3(i + vec3(0,1,1)), vh3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vNormalBF = normalize(position);
  vTerrN = vNormalBF;
  vSun = 1.0;
  vLocal = vec3(0.0);
  vGround = vec3(0.0);
  vUv = uv;
  vec3 pos = position;
  if (uLumpy > 0.0) {
    vec3 n = normalize(position);
    float l = 0.6 * vn3(n * 1.3 + uSeed) + 0.3 * vn3(n * 2.9 + uSeed * 1.7) + 0.1 * vn3(n * 6.1 + uSeed * 2.3);
    pos *= 1.0 + uLumpy * (l - 0.5) * 2.0;
  }
  vec4 wp = modelMatrix * vec4(pos, 1.0);
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
uniform float uCloudVis;      // 1 from orbit, 0 below the clouds
uniform sampler2D uRelief;    // R,G = tangent-space normal (east, north); B = water mask
uniform float uHasRelief;
uniform float uWater;         // 1 if the relief map's B channel is a water mask
uniform vec3 uColor;          // base colour (linear) for map-less bodies
uniform float uAlbedoScale;   // multiplies texture (linear) to obtain reflectance
uniform float uAirless;       // 1 = Lommel-Seeliger, 0 = Lambert
uniform float uBands;         // 1 = procedural gas-giant banding
uniform float uSeed;
uniform float uProc;          // 1 = procedural surface (bodies without a map)
uniform float uIcy;           // 0 rock .. 1 ice (bright, cracked, fresh crater rays)
uniform vec3 uTint;           // secondary colour of the surface's variegation
uniform float uCraters;       // crater density 0..1
uniform float uLumpy;
uniform float uRadiusM;       // mean radius (m), for bump heights
uniform float uMapW;          // map width (texels) for close-up detail; 0 = none
uniform sampler2D uDetail;     // tiles of the map around the view (render/TileDetail.ts)
uniform vec4 uDetailRect;      // map-UV window of uDetail: u0, v0, du, dv (u wraps)
uniform float uDetailOn;
uniform float uLite;           // 1 in VR: fewer crater layers
uniform float uTerrain;        // 1 = drawing the landing terrain (render/TerrainPatch.ts)
uniform float uHScale;         // terrain relief scale (fades in on descent)
uniform vec3 uHoleDir;         // sphere only: body-fixed centre of the terrain patch
uniform float uHoleCos;        // ... and the cosine of its angular radius (2 = no hole)
// terrain only: fine crater lattices (cells of 400, 90, 20, 4.5 m) at the patch origin, split into
// integer and fractional cells so float32 keeps metre precision far from the body's centre
uniform vec3 uOI0; uniform vec3 uOF0; uniform vec3 uOI1; uniform vec3 uOF1;
uniform vec3 uOI2; uniform vec3 uOF2; uniform vec3 uOI3; uniform vec3 uOF3;
uniform vec3 uSunDir;         // world-space unit vector body -> Sun
uniform float uSunIrr;        // solar irradiance at the body (PI at 1 AU)
uniform vec3 uSunColor;
uniform float uExposure;
uniform mat3 uBodyToWorld;    // rotation part (unit) body-fixed -> world
uniform vec3 uBodyCenter;     // camera-relative centre (m)
// eclipses: up to four bodies that can stand between this one and the Sun
uniform vec4 uOcc[4];         // camera-relative centre (m), radius (m)
uniform vec4 uOccRed;         // 1 for an occluder whose atmosphere bends red light into its shadow
uniform float uOccN;
uniform vec3 uSunRel;         // camera-relative Sun centre (m)
uniform float uSunR;          // solar radius (m)
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
varying vec3 vTerrN;
varying float vSun;
varying vec3 vLocal;
varying vec3 vPosView;
varying vec2 vUv;
varying vec3 vGround;
uniform vec4 uMatSel;          // ground materials (render/Materials.ts): flat A, flat B, steep, snow
uniform float uMatMode;        // 0 airless regolith, 1 Earth (from the map's colour), 2 Mars, 3 ice
${MATERIAL_GLSL}
${CHAPMAN}
vec3 srgbToLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }

float hash1(float n) { return fract(sin(n) * 43758.5453123); }
float noise1(float x) { float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash1(i), hash1(i + 1.0), f); }
float bh3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 bh33(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}
float bn3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(bh3(i), bh3(i + vec3(1,0,0)), f.x), mix(bh3(i + vec3(0,1,0)), bh3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(bh3(i + vec3(0,0,1)), bh3(i + vec3(1,0,1)), f.x), mix(bh3(i + vec3(0,1,1)), bh3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float bfbm(vec3 p) { return 0.5 * bn3(p) + 0.3 * bn3(p * 2.03 + 3.1) + 0.2 * bn3(p * 4.1 + 7.7); }
// value noise on a lattice given as integer cells ci plus a local offset r (precise far from the origin)
float bnAt(vec3 ci, vec3 r) {
  vec3 i = ci + floor(r); vec3 f = fract(r); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(bh3(i), bh3(i + vec3(1,0,0)), f.x), mix(bh3(i + vec3(0,1,0)), bh3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(bh3(i + vec3(0,0,1)), bh3(i + vec3(1,0,1)), f.x), mix(bh3(i + vec3(0,1,1)), bh3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// One scale of craters on the unit sphere: height (radius units) and freshness (bright ejecta).
// Only the 2x2x2 block of cells nearest to the point is visited (crater influence stays within
// half a cell: radius <= 0.36, rim out to 1.35 radii), 8 cells instead of 27.
float craters(vec3 p, float freq, float seed, float density, out float fresh) {
  vec3 q = p * freq + seed;
  vec3 i = floor(q), f = fract(q);
  vec3 b = step(0.5, f) - 1.0;
  float h = 0.0;
  fresh = 0.0;
  for (int x = 0; x <= 1; x++) for (int y = 0; y <= 1; y++) for (int z = 0; z <= 1; z++) {
    vec3 g = b + vec3(float(x), float(y), float(z));
    vec3 c = i + g;
    if (bh3(c + 11.0) > density) continue;
    vec3 o = bh33(c) * 0.6 + 0.2;
    float rc = 0.14 + 0.22 * bh3(c + 5.0);
    float d = length(g + o - f) / rc;
    if (d > 1.35) continue;
    float bowl = d < 1.0 ? (d * d - 1.0) * 0.55 : 0.0;
    float rim = 0.22 * exp(-pow((d - 1.0) / 0.22, 2.0));
    h += (bowl + rim) * rc / freq;
    fresh = max(fresh, bh3(c + 23.0) * (1.0 - smoothstep(0.7, 1.5, d)));
  }
  return h;
}
// The same craters on a lattice given as integer cell ci plus a small offset r (cell units);
// returns height in cell units.
float cratersAt(vec3 ci, vec3 r, float density, out float fresh) {
  vec3 i = ci + floor(r), f = fract(r);
  vec3 b = step(0.5, f) - 1.0;
  float h = 0.0;
  fresh = 0.0;
  for (int x = 0; x <= 1; x++) for (int y = 0; y <= 1; y++) for (int z = 0; z <= 1; z++) {
    vec3 g = b + vec3(float(x), float(y), float(z));
    vec3 c = i + g;
    if (bh3(c + 11.0) > density) continue;
    vec3 o = bh33(mod(c, 4096.0)) * 0.6 + 0.2;
    float rc = 0.14 + 0.22 * bh3(c + 5.0);
    float d = length(g + o - f) / rc;
    if (d > 1.35) continue;
    float bowl = d < 1.0 ? (d * d - 1.0) * 0.55 : 0.0;
    float rim = 0.22 * exp(-pow((d - 1.0) / 0.22, 2.0));
    h += (bowl + rim) * rc;
    fresh = max(fresh, bh3(c + 23.0) * (1.0 - smoothstep(0.7, 1.5, d)));
  }
  return h;
}
// Area of overlap of two discs of radii r1, r2 whose centres are d apart.
float discOverlap(float r1, float r2, float d) {
  if (d >= r1 + r2) return 0.0;
  if (d <= abs(r1 - r2)) return 3.14159265 * min(r1, r2) * min(r1, r2);
  float a1 = acos(clamp((d * d + r1 * r1 - r2 * r2) / (2.0 * d * r1), -1.0, 1.0));
  float a2 = acos(clamp((d * d + r2 * r2 - r1 * r1) / (2.0 * d * r2), -1.0, 1.0));
  float k = (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2);
  return r1 * r1 * a1 + r2 * r2 * a2 - 0.5 * sqrt(max(k, 0.0));
}
// Fraction of the Sun's disk seen from p past the occluders (eclipses), and how much of the
// missing light comes back reddened through an occluder's atmosphere.
float sunVisible(vec3 p, out float red) {
  red = 0.0;
  if (uOccN < 0.5) return 1.0;
  vec3 toSun = uSunRel - p;
  float dS = length(toSun);
  vec3 sd = toSun / dS;
  float aS = uSunR / dS;
  float vis = 1.0;
  for (int i = 0; i < 4; i++) {
    if (float(i) >= uOccN) break;
    vec3 toO = uOcc[i].xyz - p;
    float dO = length(toO);
    vec3 od = toO / dO;
    if (dot(od, sd) <= 0.0 || dO >= dS) continue;
    float aO = uOcc[i].w / dO;
    float th = atan(length(cross(od, sd)), dot(od, sd));   // precise for small angles
    float f = discOverlap(aS, aO, th) / (3.14159265 * aS * aS);
    vis *= 1.0 - f;
    red = max(red, f * uOccRed[i]);
  }
  return vis;
}
// Normal of a surface displaced by height h (metres) along n, from screen-space derivatives
// (Mikkelsen 2010, "Bump Mapping Unparametrized Surfaces on the GPU").
vec3 bumpNormal(vec3 pos, vec3 n, float h) {
  vec3 dpdx = dFdx(pos), dpdy = dFdy(pos);
  float dhdx = dFdx(h), dhdy = dFdy(h);
  vec3 r1 = cross(dpdy, n), r2 = cross(n, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dhdx * r1 + dhdy * r2);
  return normalize(abs(det) * n - grad);
}

void main() {
  vec3 nB = normalize(vNormalBF);
  // the terrain patch replaces the sphere around the explorer
  if (uTerrain < 0.5 && dot(nB, uHoleDir) > uHoleCos) discard;
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
  // landing terrain: the normal of the real relief, blended in as the relief grows
  if (uTerrain > 0.5) nP = normalize(mix(nP, uBodyToWorld * normalize(vTerrN), uHScale));
  // irregular small bodies: the true (displaced) surface normal
  if (uLumpy > 0.0) {
    vec3 ng = normalize(cross(dFdx(vPosView), dFdy(vPosView)));
    if (dot(ng, vPosView - uBodyCenter) < 0.0) ng = -ng;
    nP = ng;
    mu0g = dot(nP, uSunDir);
  }
  // procedural surface (bodies without a map) or fine detail beyond a map's resolution
  float freshAll = 0.0;
  float hProc = 0.0;
  // Up close on the terrain the orbital-scale craters below (computed from the body-fixed direction,
  // good to only a few centimetres in float32) would turn into per-pixel noise: they fade out where a
  // pixel spans less than a couple of metres (and are not computed at all there), and the precise
  // local lattices further down take over.
  float mppT = length(fwidth(vPosView));
  float wT = uTerrain > 0.5 ? smoothstep(0.4, 2.5, mppT) : 1.0;
  float texPerPx = fwidth(vUv.x) * uMapW;   // (derivatives outside the branches below)
  if (uProc > 0.5 && wT > 0.0) {
    float f1, f2, f3;
    float f0;
    hProc = 1.6 * craters(nB, 1.4, uSeed + 3.0, 0.3 * uCraters, f0)
          + craters(nB, 3.0, uSeed, 0.55 * uCraters, f1) + craters(nB, 8.0, uSeed + 17.0, 0.7 * uCraters, f2)
          + (uLite > 0.5 ? 0.0 : craters(nB, 21.0, uSeed + 41.0, 0.85 * uCraters, f3)) + 0.015 * (bfbm(nB * 5.0 + uSeed) - 0.5);
    freshAll = max(f1, max(f2 * 0.8, f3 * 0.6));
  } else if (uMapW > 0.0 && wT > 0.0) {
    float w = smoothstep(0.7, 0.2, texPerPx);           // fades in when a texel covers > ~1.5 pixels
    if (w > 0.0) {
      float fd;
      float fq = uMapW / 25.0;
      // patchy, as on real surfaces: crater density varies from place to place
      float patchy = smoothstep(0.3, 0.75, bfbm(nB * 7.0 + uSeed * 0.3));
      hProc = w * 0.55 * (craters(nB, fq, uSeed, 0.12 + 0.45 * patchy, fd) + (uLite > 0.5 ? 0.0 : 0.5 * craters(nB, fq * 2.7, uSeed + 9.0, 0.2 + 0.45 * patchy, fd)));
    }
  }
  hProc *= wT;
  // relief fades towards the limb, where it would only alias into a ragged silhouette
  // (the terrain is seen at grazing angles all the time: only the very edge-on parts fade)
  float limbFade = uTerrain > 0.5 ? smoothstep(0.0, 0.12, dot(nP, V)) : smoothstep(0.05, 0.4, dot(nP, V));
  float hBump = hProc * uRadiusM * (uProc > 0.5 ? 1.0 : 0.6);
  if (uTerrain > 0.5 && uCraters > 0.05) {
    // landing terrain: small craters below the mesh's resolution, each scale faded in once its
    // craters span several pixels
    float mpp = mppT;
    float fr, frT = 0.0;
    float d = 0.45 * uCraters;
    float w0 = smoothstep(400.0 / 12.0, 400.0 / 30.0, mpp);
    // headset: at most two scales at a time (the coarsest drops out where the 20 m one is in full)
    if (uLite > 0.5) w0 *= 1.0 - smoothstep(20.0 / 12.0, 20.0 / 30.0, mpp);
    if (w0 > 0.0) { hBump += w0 * 400.0 * 0.5 * cratersAt(uOI0, uOF0 + vLocal / 400.0, d, fr); frT = max(frT, fr * w0); }
    float w1 = smoothstep(90.0 / 12.0, 90.0 / 30.0, mpp);
    if (w1 > 0.0) { hBump += w1 * 90.0 * 0.5 * cratersAt(uOI1, uOF1 + vLocal / 90.0, d, fr); frT = max(frT, fr * w1); }
    float w2 = smoothstep(20.0 / 12.0, 20.0 / 30.0, mpp);
    if (w2 > 0.0) { hBump += w2 * 20.0 * 0.5 * cratersAt(uOI2, uOF2 + vLocal / 20.0, d, fr); frT = max(frT, fr * w2); }
    float w3 = uLite > 0.5 ? 0.0 : smoothstep(4.5 / 12.0, 4.5 / 30.0, mpp);
    if (w3 > 0.0) { hBump += w3 * 4.5 * 0.5 * cratersAt(uOI3, uOF3 + vLocal / 4.5, d, fr); frT = max(frT, fr * w3); }
    freshAll = max(freshAll, frT * 0.6 * uHScale);
  }
  float groundVar = 0.0;
  if (uTerrain > 0.5 && uCraters < 0.05) {
    // ground without craters (Earth): uneven, rocky detail below the mesh and map resolution, on
    // land only, each scale faded in once its cells span many pixels
    float land = 1.0 - water;
    float n;
    float w0 = smoothstep(400.0 / 6.0, 400.0 / 20.0, mppT);
    if (w0 > 0.0) { n = bnAt(uOI0, uOF0 + vLocal / 400.0) - 0.5; hBump += w0 * land * 400.0 * 0.1 * n; groundVar += w0 * n; }
    float w1 = smoothstep(90.0 / 6.0, 90.0 / 20.0, mppT);
    if (w1 > 0.0) { n = bnAt(uOI1, uOF1 + vLocal / 90.0) - 0.5; hBump += w1 * land * 90.0 * 0.1 * n; groundVar += w1 * n * 0.7; }
    float w2 = uLite > 0.5 ? 0.0 : smoothstep(20.0 / 6.0, 20.0 / 20.0, mppT);
    if (w2 > 0.0) { n = bnAt(uOI2, uOF2 + vLocal / 20.0) - 0.5; hBump += w2 * land * 20.0 * 0.1 * n; groundVar += w2 * n * 0.5; }
    groundVar *= land * uHScale;
  }
  if (hBump != 0.0) nP = bumpNormal(vPosView, nP, hBump * limbFade);
  float mu0 = dot(nP, uSunDir);
  float mu = max(dot(nP, V), 0.0);

  vec3 albedo;
  if (uHasMap > 0.5) {
    vec3 t = texture2D(uMap, vUv).rgb;
    if (uDetailOn > 0.5) {
      // sharper tiles inside the detail window, blended out at its edges
      vec2 d = vec2(fract(vUv.x - uDetailRect.x) / uDetailRect.z, (vUv.y - uDetailRect.y) / uDetailRect.w);
      if (d.x < 1.0 && d.y > 0.0 && d.y < 1.0) {
        vec2 e = min(d, 1.0 - d);
        float wD = smoothstep(0.0, 0.06, min(e.x, e.y));
        vec2 gx = dFdx(vUv) / uDetailRect.zw, gy = dFdy(vUv) / uDetailRect.zw;
        t = mix(t, textureGrad(uDetail, d, gx, gy).rgb, wD);
      }
    }
    if (uMapGray > 0.5) t = vec3(t.r);
    albedo = srgbToLinear(t) * uAlbedoScale;
  } else {
    albedo = uColor * uAlbedoScale;
    if (uProc > 0.5) {
      // patchy terrain of two materials, darker or brighter crater floors, fresh bright ejecta
      float v = bfbm(nB * 2.2 + uSeed * 0.7);
      albedo *= mix(vec3(1.0), uTint, smoothstep(0.35, 0.75, v)) * (0.75 + 0.5 * bfbm(nB * 9.0 + uSeed));
      albedo *= 1.0 + freshAll * (0.35 + 0.6 * uIcy);
      if (uIcy > 0.5) albedo *= 0.92 + 0.16 * smoothstep(0.48, 0.5, abs(bn3(nB * 6.0 + uSeed) - 0.5) + 0.48); // cracks
    }
  }
  // fresh, bright ejecta around the terrain's small craters
  if (uTerrain > 0.5 && uProc < 0.5) albedo *= 1.0 + freshAll * 0.35;
  // patchy ground (rock, soil, plants) below the map's resolution
  albedo *= 1.0 + 0.45 * groundVar;
  if (uBands > 0.5) {
    float lat = asin(clamp(vNormalBF.z, -1.0, 1.0));
    float b = noise1(lat * 18.0 + uSeed) * 0.6 + noise1(lat * 45.0 + uSeed * 1.7) * 0.4;
    albedo *= 0.86 + 0.24 * b;
  }
  // close-up ground: scanned materials (regolith, rock, sand, soil, snow, forest floor) as detail
  // around the world's own colour, and their grain in the lighting
  if (uTerrain > 0.5 && uMatOn > 0.5 && uHScale > 0.01) {
    float mix2 = 0.0, snowW = 0.0;
    float lumA = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
    if (uMatMode < 0.5) {
      mix2 = smoothstep(0.45, 0.65, bn3(vGround / 260.0 + uSeed)) * 0.8 + freshAll * 0.5;
    } else if (uMatMode < 1.5) {
      // Earth: plants where the map is green, bare soil where it is brown, snow where it is white
      mix2 = smoothstep(0.0, 0.03, albedo.g - 0.85 * albedo.r) * (1.0 - water);
      snowW = smoothstep(0.32, 0.5, min(albedo.r, albedo.b) / max(uAlbedoScale, 1e-3));
    } else if (uMatMode < 2.5) {
      // Mars: dark basaltic sand in the dark regions, dusty soil elsewhere, frost on the polar caps
      mix2 = smoothstep(0.16, 0.1, lumA / max(uAlbedoScale, 1e-3)) * 0.8 + 0.2 * smoothstep(0.5, 0.7, bn3(vGround / 180.0 + uSeed));
      snowW = smoothstep(0.35, 0.5, albedo.b / max(albedo.r, 1e-3));
    } else {
      snowW = 1.0;
    }
    vec3 nPB = normalize(nP * uBodyToWorld);
    vec3 nG;
    vec3 det = groundDetail(vGround, nB, nPB, mppT, uMatSel, mix2, snowW, uLite, nG);
    albedo *= mix(vec3(1.0), det, uHScale);
    nP = normalize(mix(nP, uBodyToWorld * nG, uHScale * limbFade));
    mu0 = dot(nP, uSunDir);
    mu = max(dot(nP, V), 0.0);
  }
  float cloud = 0.0;
  float cloudShadow = 1.0;
  if (uHasClouds > 0.5) {
    cloud = texture2D(uClouds, vec2(vUv.x + uCloudShift, vUv.y)).r;
    // the map's clouds are ~20 km per texel: generated billows break up their edges up close
    float texC = fwidth(vUv.x) * 2048.0;
    float wc = smoothstep(0.9, 0.25, texC) * (uLite > 0.5 ? 0.6 : 1.0);
    if (wc > 0.0) {
      float ang = uCloudShift * 6.2831853;
      vec3 nc = vec3(cos(ang) * nB.x - sin(ang) * nB.y, sin(ang) * nB.x + cos(ang) * nB.y, nB.z);
      float bill = 0.6 * bn3(nc * 900.0) + 0.4 * (uLite > 0.5 ? 0.5 : bn3(nc * 2600.0 + 7.0));
      cloud += (bill - 0.5) * 0.55 * wc * smoothstep(0.02, 0.25, cloud);
    }
    cloud = smoothstep(0.08, 0.9, cloud) * uCloudVis;
    albedo = mix(albedo, vec3(0.75), cloud);
    // the clouds' shadows on the ground: the cloud (tops ~7 km up) between this point and the Sun
    vec3 sB = uSunDir * uBodyToWorld;
    float m0 = dot(nB, sB);
    if (m0 > 0.0) {
      vec3 eastB = normalize(vec3(-nB.y, nB.x, 0.0) + vec3(1e-6, 0.0, 0.0));
      vec3 northB = cross(nB, eastB);
      vec3 ts = sB - nB * m0;
      float k = 0.0011 / max(m0, 0.08);
      float dlon = dot(ts, eastB) * k / max(sqrt(1.0 - nB.z * nB.z), 0.05), dlat = dot(ts, northB) * k;
      float cs = texture2D(uClouds, vec2(vUv.x + uCloudShift + dlon / 6.2831853, vUv.y + dlat / 3.14159265)).r;
      cloudShadow = 1.0 - 0.55 * smoothstep(0.08, 0.9, cs) * uCloudVis * (1.0 - cloud);
    }
  }

  // Terrain shading only on the day side (no light leaking past the geometric terminator)
  float dayside = smoothstep(-0.04, 0.06, mu0g);
  float light;
  if (uAirless > 0.5) {
    light = mu0 > 0.0 ? 2.0 * mu0 / (mu0 + mu + 1e-4) : 0.0; // Lommel-Seeliger
  } else {
    light = max(mix(mu0, mu0g, cloud), 0.0);                // Lambert (clouds hide the relief)
  }
  light *= dayside * cloudShadow;
  if (uTerrain > 0.5) light *= mix(1.0, clamp(0.5 + vSun, 0.0, 1.0), uHScale);   // shadows of the relief
  // eclipses: shadows of moons and planets (with a coppery glow where sunlight is bent through an atmosphere)
  float eclRed = 0.0;
  float ecl = sunVisible(vPosView, eclRed);
  light *= ecl;

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
  // skylight: the sunlit sky lights the ground too and fills shadows (about the light scattered out
  // of the beam, half of it downwards), less on slopes facing away from the sky
  if (uAtmo > 0.5) {
    vec3 tau = uBetaR * uHR + uBetaMe * uHM;
    float day = smoothstep(-0.1, 0.25, mu0g) * (0.3 + 0.7 * max(mu0g, 0.0)) * ecl;
    radiance += albedo * uSunColor * (uSunIrr / 3.14159265) * (1.0 - exp(-tau)) * 0.5 * day * (0.5 + 0.5 * dot(nP, nW));
  }
  // in a planet's shadow, sunlight refracted through its atmosphere (the Moon turns copper in an eclipse)
  if (eclRed > 0.0) radiance += albedo * sunL * eclRed * 0.004 * vec3(1.0, 0.32, 0.1) * max(mu0g, 0.0);

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

/** Uniforms of a star's surface (see StarLook.ts). */
export const STAR_LOOK_UNIFORMS = /* glsl */ `
uniform float uSeed;
uniform float uGranFreq;
uniform float uGranAmp;
uniform float uSpots;
uniform float uSpotLat;
uniform float uFaculae;
uniform float uLimbA;
uniform float uLimbB;
uniform float uRotRate;
uniform float uGravDark;
uniform vec3 uAxis;
uniform float uFlares;
`;

/**
 * A star's photosphere: granulation (cellular, bright cells with dark lanes) at the star's own
 * scale, giant convection cells on supergiants, spots with umbra/penumbra in the star's active
 * latitudes, faculae brightening towards the limb, differential rotation, gravity darkening on fast
 * rotators, quadratic limb darkening, and occasional flares on active red dwarfs.
 */
export const STAR_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;        // luminance-normalised blackbody colour
uniform float uRadiance;    // mean disk radiance (photometric units)
uniform float uExposure;
uniform float uTime;
uniform mat3 uBodyToWorld;
${STAR_LOOK_UNIFORMS}
varying vec3 vNormalBF;
varying vec3 vPosView;
varying vec2 vUv;
float h3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 h33(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}
float n3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// cellular noise: x = distance to the nearest cell centre, y = to the second nearest
vec2 cells(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float d1 = 9.0, d2 = 9.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 o = h33(i + g);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return vec2(d1, d2);
}
float fbm3(vec3 p) { return 0.55 * n3(p) + 0.3 * n3(p * 2.1 + 7.0) + 0.15 * n3(p * 4.3 + 13.0); }
vec3 rotateAbout(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }

void main() {
  vec3 nW = normalize(uBodyToWorld * vNormalBF);
  vec3 V = normalize(-vPosView);
  float mu = clamp(dot(nW, V), 0.0, 1.0);
  // surface coordinates rotating with the star (equator faster: differential rotation)
  float lat = dot(vNormalBF, uAxis);
  vec3 q = rotateAbout(normalize(vNormalBF), uAxis, -uRotRate * uTime * (1.0 - 0.25 * lat * lat)) + uSeed;
  // granulation: bright cell centres, dark intergranular lanes, slowly evolving. Cells are warped
  // so they are irregular, and fade out once they are smaller than a pixel (no moiré).
  vec3 gp = q * uGranFreq;
  float cellPx = 1.0 / max(length(fwidth(gp)), 1e-6);           // pixels per cell
  float gVis = smoothstep(1.5, 5.0, cellPx);
  vec3 warp = vec3(n3(gp * 0.35 + 5.0), n3(gp * 0.35 + 17.0), n3(gp * 0.35 + 29.0)) - 0.5;
  vec2 c = cells(gp + warp * 0.9 + vec3(0.0, 0.0, uTime * 0.03));
  // few, huge cells (supergiants) have broad, soft lanes; many small cells (dwarfs) sharp ones
  float soft = smoothstep(60.0, 6.0, uGranFreq);
  float lanes = smoothstep(0.02, 0.28 + 0.2 * n3(gp * 0.5) + 0.5 * soft, c.y - c.x);
  float blob = 1.0 - smoothstep(0.0, 0.75 + 0.4 * soft, c.x);   // bright cell centres
  float gran = 1.0 + uGranAmp * gVis * (mix(lanes * 0.9 + blob * 0.5, lanes * 0.35 + blob * 1.1 + 0.6 * (fbm3(gp * 1.7) - 0.5), soft) - 0.8);
  // giant convection cells / supergranulation (large on supergiants), visible from farther
  float bigVis = smoothstep(1.5, 5.0, cellPx * 6.0);
  gran *= 1.0 + 0.9 * uGranAmp * bigVis * (fbm3(q * max(1.6, uGranFreq * 0.12)) - 0.5);
  // a faint large-scale mottling on every star, so a disk seen from afar is not a flat blob
  // (white-light pictures of the Sun show little of it; this is artistic, kept subtle)
  float mottVis = smoothstep(2.0, 8.0, cellPx * uGranFreq / 9.0);
  gran *= 1.0 + 0.18 * mottVis * (fbm3(q * 9.0 + 41.0) - 0.5) * (uGranAmp > 0.02 ? 1.0 : 0.3);
  // spots in the active latitudes: umbra and penumbra
  float band = exp(-pow((abs(lat) - uSpotLat) / 0.22, 2.0));
  float sf = fbm3(q * 7.0 + 31.0) * band;
  float thr = 1.0 - clamp(uSpots * 2.2, 0.0, 0.95);
  float pen = smoothstep(thr - 0.06, thr, sf);
  float umb = smoothstep(thr + 0.03, thr + 0.08, sf);
  float spot = pen * 0.45 + umb * 0.5;
  // faculae: bright network around active regions, visible towards the limb
  float fac = uFaculae * smoothstep(thr - 0.2, thr - 0.05, sf) * (1.0 - spot) * pow(1.0 - mu, 1.5) * 0.6;
  // limb darkening (quadratic law, normalised to unit mean) and gravity darkening
  float x = 1.0 - mu;
  float ld = (1.0 - uLimbA * x - uLimbB * x * x) / (1.0 - uLimbA / 3.0 - uLimbB / 6.0);
  float gd = 1.0 - uGravDark * (1.0 - lat * lat);
  vec3 col = uColor * ld * gd * gran * (1.0 - spot) * (1.0 + fac);
  // cooler (redder) spots, lanes and equator; hotter cell centres a little whiter; and a redder
  // limb (the light there comes from higher, cooler layers: limb darkening is stronger in blue)
  float cool = clamp(spot * 1.4 + uGravDark * (1.0 - lat * lat) + (1.0 - gran) * 1.5 + 0.7 * x * x, 0.0, 1.0);
  col *= mix(vec3(1.0), vec3(1.0, 0.78, 0.6), cool);
  // shown a little more saturated than the blackbody (bright disks otherwise wash out to white)
  col = max(mix(vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))), col, 1.6), 0.0);
  // flares on active red dwarfs: a bright patch that flashes up and fades
  if (uFlares > 0.0) {
    float epoch = floor(uTime / 23.0);
    if (h3(vec3(epoch, uSeed, 3.0)) < uFlares * 2.0) {
      vec3 fp = normalize(h33(vec3(epoch, uSeed, 7.0)) * 2.0 - 1.0);
      float age = fract(uTime / 23.0) * 23.0;
      float f = exp(-age / 3.0) * smoothstep(0.0, 0.5, age) * 4.0;
      col += vec3(0.9, 0.95, 1.0) * f * exp(-pow(length(normalize(vNormalBF) - fp) / 0.08, 2.0));
    }
  }
  gl_FragColor = vec4(min(col * uRadiance * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/** Camera-facing corona around a resolved star: inner glow, streamers, prominences. */
export const CORONA_VERT = /* glsl */ `
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
export const CORONA_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;  // display value of the glow at the limb
uniform float uQuad;       // quad half-size in star radii
uniform float uCorona;
uniform float uProm;
uniform float uSeed;
uniform float uTime;
uniform vec2 uAxis2;      // the star's spin axis projected on the quad (unit), and
uniform float uMinor;     // the disk's half-width along it (a flattened star's disk is an ellipse)
varying vec2 vXY;
float h2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec2 p = vXY * uQuad;                   // in star radii
  // distance from the centre in units of the disk's (elliptical) edge: the glow starts at the limb
  float r = length(vec2(dot(p, vec2(-uAxis2.y, uAxis2.x)), dot(p, uAxis2) / uMinor));
  if (r < 1.0) discard;                   // (drawn in front of the star: leave its disk alone)
  float a = atan(vXY.y, vXY.x);
  // streamers: angular structure that widens outwards (periodic in angle)
  float st = n2(vec2(cos(a) * 3.0 + uSeed, sin(a) * 3.0 + uTime * 0.01)) * 0.7 + n2(vec2(cos(a) * 9.0, sin(a) * 9.0 + uSeed)) * 0.3;
  float glow = uCorona * (0.55 * exp(-(r - 1.0) * 7.0) + (0.05 + 0.12 * st) / (r * r));
  glow *= (1.0 - smoothstep(0.7, 1.0, length(vXY))) * smoothstep(1.0, 1.025, r);
  // prominences: bright loops just above the limb
  float pn = n2(vec2(cos(a) * 14.0 + uSeed, sin(a) * 14.0 + r * 9.0 - uTime * 0.02));
  float prom = uProm * pow(pn, 7.0) * 6.0 * smoothstep(1.16, 1.0, r);
  vec3 c = uColor * glow + vec3(1.0, 0.32, 0.42) * prom;
  gl_FragColor = vec4(c * uIntensity, 1.0);
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
