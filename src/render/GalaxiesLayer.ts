import { AdditiveBlending, BackSide, BoxGeometry, BufferAttribute, BufferGeometry, Group, Matrix3, Matrix4, Mesh, Points, Quaternion, ShaderMaterial, Vector2, Vector3, Vector4 } from 'three';
import type { UPos } from '../core/upos';
import { discFrame, type Galaxy, type GalaxyShape } from '../universe/Galaxies';
import { noise3D, sampleNoise } from './Noise3D';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, POINT_CLIP, PROJECT_PARS } from './shaders/xr';

/**
 * Shared GLSL: a galaxy's light and dust in its own frame (units: the catalogued radius). Two
 * parts: a spheroid (bulge, or all of an elliptical: a Sérsic profile) in the galaxy frame, and a
 * disc in its own frame (`uDiscRot`; the identity except for discs tilted against their galaxy,
 * like Centaurus A's dusty disc). The disc is an exponential disc of old stars (flaring), a thick
 * disc, a thinner young disc in spiral arms, star-forming knots, a bar, and a still thinner dust
 * layer. The arms are logarithmic spirals whose phase is bent by large-scale noise, and the young
 * stars and dust are modulated by noise sampled in spiral coordinates (streaks along the arms: the
 * feathers and spurs of real spirals). Emission coefficients already carry each part's share of the
 * galaxy's light (normalised on the CPU) times its catalogued brightness. Mirrored in TypeScript by
 * `GalaxyModel` (keep the two in step).
 */
const GAL_MODEL = /* glsl */ `
uniform sampler3D uNoise;
uniform float uSeed;
uniform vec4 uArmP;    // arms, 1/tan(pitch), irregularity, phase
uniform vec4 uDiscW;   // emission coefficients: old disc, thick disc, young disc, knots
uniform vec4 uDiscS;   // scale length, scale height, clumpiness, bar coefficient
uniform vec4 uRing;    // ring radius, width, young boost, dust boost
uniform vec4 uBulgeW;  // coefficient, 1/Re, b_n, 1/n
uniform vec3 uBulgeAx; // 1 / spheroid axes (galaxy frame)
uniform vec4 uDustP;   // face-on optical depth, 1/dust scale length, extraplanar dust, disc truncation radius
uniform vec4 uBarP;    // bar half-length, warp, scale of the spiral-coordinate noise along the arms, -
uniform vec4 uSpot;    // a giant star-forming region (disc frame xyz, coefficient)
uniform mat3 uDiscRot; // galaxy frame -> disc frame
const vec3 C_OLD = vec3(1.0, 0.84, 0.67);
const vec3 C_BULGE = vec3(1.0, 0.79, 0.57);
const vec3 C_YOUNG = vec3(0.58, 0.73, 1.0);
const vec3 C_HII = vec3(1.0, 0.38, 0.55);
// extinction relative to V at the red, green and blue primaries
const vec3 EXT = vec3(0.83, 1.0, 1.25);
float sq(float x) { return x * x; }
vec4 nz(vec3 p, float lod) { return textureLod(uNoise, p, max(lod, 0.0)); }
float armMaskF(float r) { return smoothstep(0.04, 0.16, r) * (1.0 - smoothstep(1.0, 1.3, r)); }
// warp of the disc plane (Centaurus A)
vec3 warpD(vec3 p) {
  if (uBarP.y == 0.0) return p;
  float r = length(p.xy);
  return vec3(p.xy, p.z - uBarP.y * r * r * sin(atan(p.y, p.x) + uSeed * 6.2832));
}
// disc-frame point: large-scale noise, the spiral phase (bent by that noise) and the noise sampled
// in spiral coordinates; lod: mip level of the noise for the pixel footprint at a frequency of 1
float gr, gpsi, glodS, gwid;
vec4 gA, gS, gI;
vec3 gsc;
void discNoise(vec3 p, float lod) {
  gr = length(p.xy);
  gA = nz(p * 0.9 + uSeed * 0.71, lod - 0.15);
  vec4 nB = nz(p * 0.3 + uSeed * 0.53, lod - 1.7);
  gwid = nB.g;
  float lr = log(max(gr, 0.03));
  gpsi = atan(p.y, p.x) - lr * uArmP.y + uArmP.w + uArmP.z * ((nB.r - 0.5) * 3.0 + (gA.r - 0.5) * 0.8);
  gsc = vec3(cos(gpsi) * 0.45, sin(gpsi) * 0.45, lr * uBarP.z + p.z * 1.2) + uSeed * 0.37;
  glodS = lod + log2(0.45 * (1.0 + uArmP.y) / max(gr, 0.05));
  // in the middle, where the spiral winds ever tighter, plain 3D noise instead of spiral streaks
  float sw = smoothstep(0.08, 0.25, gr);
  gI = nz(p * 2.6 + uSeed * 0.29, lod + 1.38);
  gS = sw > 0.0 ? mix(gI, nz(gsc, glodS), sw) : gI;
}
// width of the arms: varies slowly along them (exponent of the arm profile)
float armPow(float k) { return k * mix(0.5, 1.6, gwid); }
// horizontal factor of the dust layer (its face-on optical depth / uDustP.x), after discNoise()
float dustSheet(float fil) {
  float m = uArmP.x;
  float lane = m > 0.5 ? pow(0.5 + 0.5 * cos(m * gpsi + 0.5), armPow(6.0)) * smoothstep(0.1, 0.3, gr) * (1.0 - smoothstep(1.0, 1.3, gr)) : 0.0;
  float ring = exp(-sq((gr - uRing.x) / uRing.y));
  return exp(-gr * uDustP.y) * smoothstep(0.02, 0.1, gr) * (0.3 + 4.5 * lane + uRing.w * ring) * (0.2 + 1.6 * fil)
    * (1.0 - smoothstep(uDustP.w * 0.8, uDustP.w, gr));
}
float hzF(float r) { return uDiscS.y * (1.0 + 0.8 * r); }
`;

const VOL_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
uniform float uClipScale;
varying vec3 vBox;
void main() {
  vBox = position;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
  // one factor for the whole mesh: keeps clip coordinates of objects megaparsecs away far from
  // float overflow in clipping, without changing the projection or perspective interpolation
  gl_Position *= uClipScale;
}`;

/**
 * A galaxy as a volume, ray-marched in its own frame. Steps are short near the disc plane and the
 * centre and long elsewhere (always reaching the far side of the box), so thin discs and bright
 * cusps are resolved from any angle; light emitted in a step is absorbed within it. The noise is
 * read at the mip level of the pixel's footprint: no sparkle when far, full detail up close.
 */
const VOL_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uCam;        // camera in the galaxy frame (radii)
uniform vec3 uExt;        // half extents of the box (radii)
uniform float uGain;
uniform float uWeight;
uniform float uYoungW;    // share of the young stars' light left to the volume (the cloud has the rest)
uniform float uLite;
uniform float uPixAng;    // radians per pixel
varying vec3 vBox;
${GAL_MODEL}
void main() {
  vec3 pf = vBox * uExt;
  vec3 dir = normalize(pf - uCam);
  vec3 inv = 1.0 / (sign(dir) * max(abs(dir), vec3(1e-6)));
  vec3 ta = (-uExt - uCam) * inv, tb = (uExt - uCam) * inv;
  vec3 tlo = min(ta, tb), thi = max(ta, tb);
  float t0 = max(max(tlo.x, tlo.y), max(tlo.z, 0.0));
  float t1 = min(min(thi.x, thi.y), thi.z);
  if (t1 <= t0) discard;
  // interleaved gradient noise: a fine, even jitter of the samples (no banding, no blotches)
  float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  bool hi = uLite < 0.5;
  bool disc = uDiscW.x + uDiscW.y + uDiscW.z + uDustP.x + uSpot.w > 0.0;
  vec3 dirD = uDiscRot * dir, camD = uDiscRot * uCam;
  float adz = max(abs(dirD.z), 0.015);
  int N = hi ? 96 : 40;
  float dsMax = hi ? 0.05 : 0.1;
  vec3 L = vec3(0.0);
  vec3 T = vec3(1.0);
  float t = t0;
  for (int i = 0; i < 96; i++) {
    if (i >= N || t >= t1 || T.g < 0.004) break;
    vec3 pg0 = uCam + dir * t;
    vec3 pd0 = camD + dirD * t;
    // near the disc plane: a fraction of the height (at most dsMax); elsewhere the smooth spheroid
    // sets it (a fraction of the distance from the centre)
    float ds = disc ? max(abs(pd0.z) * 0.5, 0.0035) / adz : 1.0;
    if (disc && abs(pd0.z) < 0.15) ds = min(ds, dsMax);
    if (uBulgeW.x > 0.0) ds = min(ds, 0.3 * length(pg0 * uBulgeAx) + 0.003);
    ds = clamp(ds, 0.002, 0.3);
    ds = min(max(ds, (t1 - t) / float(N - i)), t1 - t);
    float tt = t + ds * jit;
    vec3 pg = uCam + dir * tt;
    float lod = log2(max(tt * uPixAng * 64.0, 1e-6));
    vec3 j = vec3(0.0);
    float k = 0.0;
    vec3 pe = pg / uExt;
    if (uBulgeW.x > 0.0) {
      float s = length(pg * uBulgeAx) * uBulgeW.y;
      j += C_BULGE * uBulgeW.x * exp(-uBulgeW.z * (pow(max(s, 1e-5), uBulgeW.w) - 1.0)) * (1.0 - smoothstep(0.7, 1.0, length(pe)));
    }
    if (disc) {
      vec3 pd = warpD(camD + dirD * tt);
      discNoise(pd, lod);
      float r = gr, az = abs(pd.z);
      float win = (1.0 - smoothstep(uDustP.w * 0.8, uDustP.w, r)) * (1.0 - smoothstep(0.75, 1.0, az / uExt.z));
      float hz = hzF(r), hr = uDiscS.x, m = uArmP.x;
      float wave = m > 0.5 ? 0.5 + 0.5 * cos(m * gpsi) : 0.5;
      float am = armMaskF(r);
      float ring = exp(-sq((r - uRing.x) / uRing.y));
      float old = exp(-r / hr) * exp(-az / hz) / (2.0 * hz) * (1.0 + 0.5 * (wave - 0.5) * am) * (0.8 + 0.4 * gA.g);
      float thick = exp(-r / (1.3 * hr) - az / 0.05) * 10.0;
      float hy = 0.45 * hz;
      float yv = exp(-r / (1.5 * hr) - az / hy) / (2.0 * hy);
      float armY = m > 0.5 ? pow(wave, armPow(4.0)) * 3.66 * am * (0.2 + 2.4 * gS.g * gS.g) : am;
      float ym = mix(armY, smoothstep(0.35, 0.85, gA.b) * 2.8 * (0.5 + gI.g), uDiscS.z) + uRing.z * ring;
      float kn = hi ? nz(pd * 7.0 + uSeed * 5.3, lod + 2.8).a : gS.a;
      float knots = smoothstep(0.75, 0.95, kn) * 10.0;
      float bar = uDiscS.w > 0.0 ? exp(-sq(pd.x / uBarP.x) - sq(pd.y / (0.25 * uBarP.x)) - sq(pd.z / 0.04)) : 0.0;
      j += win * (C_OLD * (uDiscW.x * old + uDiscW.y * thick + uDiscS.w * bar) + yv * ym * (C_YOUNG * uDiscW.z + C_HII * uDiscW.w * knots) * uYoungW);
      if (uSpot.w > 0.0) {
        vec3 dq = pd - uSpot.xyz;
        j += C_HII * uSpot.w * exp(-dot(dq, dq) / 0.0016) * (0.4 + 1.2 * gS.a) * uYoungW;
      }
      if (uDustP.x > 0.0) {
        // dust texture: isotropic clumps and filaments mixed with the streaks along the arms
        float fil = hi ? smoothstep(0.15, 0.85, 0.5 * gI.b + 0.5 * gS.b) : 0.5 * (gI.b + gS.b);
        float hd = 0.4 * hz;
        k = uDustP.x * dustSheet(fil) * (exp(-az / hd) / (2.0 * hd) + uDustP.z * exp(-az / 0.03) * 16.7 * smoothstep(0.55, 0.85, gA.a) * 3.0) * win;
      }
    }
    vec3 a = exp(-k * EXT * ds);
    L += T * j * ds * (k > 1e-4 ? (1.0 - a) / max(k * EXT * ds, 1e-6) : vec3(1.0));
    T *= a;
    t += ds;
  }
  // highlights roll off logarithmically (like a photograph's stretch): a bright core keeps its
  // gradient instead of a flat white disc; faint light is unchanged
  vec3 c = L * uGain * uWeight;
  float Y = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c *= Y > 1e-5 ? 0.25 * log(1.0 + Y / 0.25) / Y : 1.0;
  gl_FragColor = vec4(c, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/**
 * The nearest galaxy as a 3D cloud: star clouds (soft sprites of a fixed size in space, so their
 * surface brightness stays the same from any distance) and single stars, drawn from the same model
 * as the volume. Flying in, they spread apart with parallax. Each is dimmed by the dust layer
 * between the eye and it (its column taken where the sight line crosses the disc plane).
 */
const CLOUD_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute vec4 aStar;     // position (galaxy radii), sprite radius (galaxy radii)
attribute vec3 aFlux;     // colour x share of the galaxy's light
uniform float uRadius;    // galaxy radius (m)
uniform float uPixelSA;   // solid angle of one CSS pixel
uniform float uDpr;
uniform float uGain;
uniform vec2 uWeight;      // weights of the star clouds and of the single stars
uniform float uMaxPx;
uniform float uClipScale;
uniform vec3 uCamG;       // camera in the galaxy frame (radii)
varying vec3 vCol;
${GAL_MODEL}
// optical depth (V) of the dust layer between the eye and p: its vertical profile integrated
// exactly along the segment, its horizontal factor taken where the segment crosses the plane
float dustTau(vec3 ag, vec3 bg) {
  if (uDustP.x <= 0.0) return 0.0;
  vec3 a = warpD(uDiscRot * ag), b = warpD(uDiscRot * bg);
  float L = length(b - a);
  if (L <= 0.0) return 0.0;
  float dz = b.z - a.z;
  float f = abs(dz) > 1e-6 ? clamp(-a.z / dz, 0.0, 1.0) : 0.5;
  vec3 c = mix(a, b, f);
  discNoise(vec3(c.xy, 0.0), 0.0);
  float h = 0.4 * hzF(gr);
  float K = uDustP.x * dustSheet(smoothstep(0.15, 0.85, 0.5 * gI.b + 0.5 * gS.b));
  // Laplace cumulative distribution of the layer between the two heights
  float Fa = a.z < 0.0 ? 0.5 * exp(a.z / h) : 1.0 - 0.5 * exp(-a.z / h);
  float Fb = b.z < 0.0 ? 0.5 * exp(b.z / h) : 1.0 - 0.5 * exp(-b.z / h);
  return abs(dz) > 1e-4 * h ? K * L * abs(Fb - Fa) / abs(dz) : K * L * exp(-abs(a.z) / h) / (2.0 * h);
}
void main() {
  vec4 mv = modelViewMatrix * vec4(aStar.xyz, 1.0);
  // distance in galaxy radii (in metres its square would overflow 32-bit floats)
  float d = length(mv.xyz * (1.0 / uRadius));
  float px = aStar.w / max(d, 1e-12) / sqrt(uPixelSA);   // sprite radius (CSS px)
  float pxd = max(px, 1.0);
  // surface brightness of the cloud; below a pixel its light is spread over the smallest sprite
  float sb = 1.0 / (0.77 * aStar.w * aStar.w) * (px / pxd) * (px / pxd);
  // the largest sprites (clouds right around the explorer) fade out: their light is the background glow
  float big = 1.0 - smoothstep(uMaxPx * 0.4, uMaxPx, px);
  if (big <= 0.0 || mv.z > 0.0) { vCol = vec3(0.0); gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; return; }
  float w = aStar.w < 1e-4 ? uWeight.y : uWeight.x;
  if (w <= 0.0) { vCol = vec3(0.0); gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; return; }
  vCol = aFlux * sb * uGain * w * big * exp(-dustTau(uCamG, aStar.xyz) * EXT);
  gl_Position = projectView(mv);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
${POINT_CLIP}
  gl_PointSize = 2.0 * pxd * uDpr;
}`;
const CLOUD_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
varying vec3 vCol;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(vCol * exp(-4.0 * r2), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

function mulberry(seed: number): () => number {
  let a = Math.floor(seed * 4294967295) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How a galaxy is built: light shares of its parts (any scale; normalised) and their shapes. */
interface Look {
  arms: number; pitchDeg: number; irreg: number;
  bulge: number; bulgeRe: number; bulgeN: number; bulgeQ: number;
  old: number; thick: number; young: number; knots: number; bar: number; barLen: number;
  hr: number; hz: number; clumpy: number;
  dust: number; dustHr: number; extra: number; trunc: number; warp: number;
  /** ring: radius, width, young boost, dust boost */
  ring: [number, number, number, number];
  /** spheroid axes (galaxy frame), when not a round-ish bulge */
  axes?: [number, number, number];
  /** a dusty disc in its own orientation (sky position angle, inclination; degrees) */
  disc?: { pa: number; incl: number };
  /** phase of the arms (rad; default from the seed) */
  armPhase?: number;
  /** a giant star-forming region (disc frame) and its share of the light */
  spot?: [number, number, number, number];
}

const C_OLD = [1.0, 0.84, 0.67], C_BULGE = [1.0, 0.79, 0.57], C_YOUNG = [0.58, 0.73, 1.0], C_HII = [1.0, 0.38, 0.55];

function lookFor(g: Galaxy, all: Galaxy[] = []): Look {
  const m = g.data.morph;
  const stage = /S[AB_()s]*[ab]?([abcdm])/.exec(m)?.[1] ?? (g.shape === 'spiral' || g.shape === 'barred' ? 'b' : '');
  const base: Look = {
    arms: 2, pitchDeg: 14, irreg: 0.5, bulge: 0.25, bulgeRe: 0.06, bulgeN: 2.5, bulgeQ: 0.7,
    old: 0.5, thick: 0.08, young: 0.13, knots: 0.03, bar: 0, barLen: 0.25, hr: 0.24, hz: 0.012, clumpy: 0,
    dust: 1.0, dustHr: 0.4, extra: 0, trunc: 1.35, warp: 0, ring: [0.5, 0.1, 0, 0],
  };
  const st: Record<string, Partial<Look>> = {
    a: { bulge: 0.4, old: 0.45, thick: 0.07, young: 0.06, knots: 0.01, pitchDeg: 9, hr: 0.22, dust: 0.8, bulgeRe: 0.08, bulgeN: 3.5 },
    b: {},
    c: { bulge: 0.1, old: 0.52, young: 0.24, knots: 0.05, pitchDeg: 20, hr: 0.26, dust: 0.9, bulgeRe: 0.04, bulgeN: 1.5, irreg: 0.7 },
    d: { bulge: 0.04, old: 0.5, young: 0.3, knots: 0.07, pitchDeg: 25, hr: 0.28, dust: 0.6, bulgeRe: 0.03, bulgeN: 1.2, irreg: 0.9, clumpy: 0.3 },
    m: { arms: 1, bulge: 0.02, old: 0.45, thick: 0.1, young: 0.33, knots: 0.09, pitchDeg: 25, hr: 0.3, hz: 0.025, dust: 0.3, bulgeRe: 0.04, bulgeN: 1, irreg: 1.1, clumpy: 0.6, bar: 0.08, barLen: 0.3 },
  };
  let l: Look;
  switch (g.shape) {
    case 'spiral': case 'barred':
      l = { ...base, ...(st[stage] ?? {}) };
      if (g.shape === 'barred') l.bar = Math.max(l.bar, 0.08);
      break;
    case 'lenticular':
      l = { ...base, arms: 0, bulge: 0.5, old: 0.42, thick: 0.08, young: 0, knots: 0, dust: 0.15, bulgeRe: 0.07, bulgeN: 3.5 };
      break;
    case 'irregular':
      l = { ...base, arms: 0, bulge: 0.03, old: 0.4, thick: 0.12, young: 0.33, knots: 0.08, clumpy: 1, bar: 0.04, barLen: 0.35, hz: 0.04, dust: 0.3, bulgeRe: 0.05, bulgeN: 1, hr: 0.3 };
      break;
    case 'elliptical':
      l = { ...base, arms: 0, bulge: 1, old: 0, thick: 0, young: 0, knots: 0, dust: 0, bulgeRe: 0.3, bulgeN: 4, axes: [1, g.ratio, g.ratio] };
      break;
    default: // dwarf spheroidal / elliptical
      l = { ...base, arms: 0, bulge: 1, old: 0, thick: 0, young: 0, knots: 0, dust: 0, bulgeRe: 0.35, bulgeN: 0.9, axes: [1, Math.max(g.ratio, 0.4), Math.max(g.ratio, 0.4)] };
  }
  const named: Record<string, Partial<Look>> = {
    // a tightly wound, ring-like spiral: the 10 kpc ring of young stars and dust dominates
    'Andromeda Galaxy': { pitchDeg: 7, irreg: 0.9, ring: [0.47, 0.07, 2.2, 3.0], dust: 1.3, dustHr: 0.6, bulge: 0.3, bulgeRe: 0.05, bulgeN: 2.2, bulgeQ: 0.75, young: 0.1, knots: 0.012 },
    // flocculent, patchy, with the giant H II region NGC 604
    'Triangulum Galaxy': { pitchDeg: 28, irreg: 1.3, clumpy: 0.35, spot: [0.28, 0.33, 0, 0.012] },
    // the grand-design spiral
    'Whirlpool Galaxy': { pitchDeg: 19, irreg: 0.4, young: 0.25, knots: 0.07, dust: 1.4, bulge: 0.12, bulgeRe: 0.04 },
    // edge-on discs: a dark lane, with dust filaments rising out of NGC 891's plane
    'NGC 891': { dust: 2.2, extra: 0.6, hz: 0.014 },
    'Needle Galaxy': { dust: 1.6, extra: 0.2, bulge: 0.22, bulgeRe: 0.05, bulgeQ: 0.6 },
    // a giant bulge girdled by a ring of dust
    'Sombrero Galaxy': { arms: 0, bulge: 0.8, bulgeRe: 0.12, bulgeN: 4, bulgeQ: 0.72, old: 0.14, thick: 0.02, young: 0.03, knots: 0.004, hr: 0.45, trunc: 0.85, ring: [0.62, 0.05, 3, 8], dust: 1.0, dustHr: 1.5 },
    // a giant elliptical crossed by a warped dusty disc with young stars
    'Centaurus A': { arms: 0, bulge: 0.94, bulgeRe: 0.22, bulgeN: 4, axes: [1, 0.78, 0.78], old: 0, thick: 0, young: 0.035, knots: 0.025, hr: 0.2, clumpy: 0.6, dust: 2.4, dustHr: 0.6, trunc: 0.4, warp: 0.35, disc: { pa: 115, incl: 73 }, ring: [0.2, 0.08, 0.5, 0.5] },
    M87: { bulgeRe: 0.33, bulgeN: 4, axes: [1, 0.93, 0.93] },
    // the Whirlpool's companion: amorphous, crossed by dust
    'NGC 5195': { dust: 0.9, dustHr: 0.5, bulge: 0.6, bulgeRe: 0.1, old: 0.35, irreg: 1.5, clumpy: 0.5 },
    // the LMC: an off-centre bar, one arm, the Tarantula
    'Large Magellanic Cloud': { bar: 0.12, barLen: 0.2, spot: [0.18, 0.2, 0, 0.02], knots: 0.08, young: 0.25, clumpy: 0.45 },
    'Small Magellanic Cloud': { bar: 0.1, barLen: 0.35, hz: 0.08, clumpy: 1 },
  };
  const look: Look = { ...l, ...(named[g.name] ?? {}) };
  // the Whirlpool's arm reaches out to its companion: an arm crest at r = 1 in its direction
  const companion = g.name === 'Whirlpool Galaxy' ? all.find((o) => o.name === 'NGC 5195') : undefined;
  if (companion) {
    const rel = companion.upos.sub(g.upos);
    look.armPhase = -Math.atan2(rel.dot(g.minor), rel.dot(g.major)) + 0.35;
  }
  return look;
}

/** Mean surface brightness (V mag/arcsec²) within the catalogued ellipse; a typical one if unknown. */
function meanSB(g: Galaxy): number {
  const a = g.data.majArcmin * 30, b = g.data.minArcmin * 30;   // semi-axes, arcsec
  const sb = g.data.vmag !== null ? g.data.vmag + 2.5 * Math.log10(Math.PI * a * b) : g.shape === 'dwarf' ? 25 : 23;
  return Math.min(25, Math.max(20, sb));
}

const sersicB = (n: number) => 2 * n - 1 / 3 + 0.009876 / n;

/** Uniforms + CPU mirror of one galaxy's model. */
class GalaxyModel {
  readonly u: Record<string, { value: unknown }>;
  readonly ext: Vector3;
  /** light shares (sum 1) of bulge, old, thick, young, knots, bar, spot */
  readonly frac: number[];
  /** galaxy frame <-> disc frame */
  readonly rot = new Matrix3();
  readonly rotT = new Matrix3();
  private readonly coef: { bulge: number; old: number; thick: number; young: number; knots: number; bar: number; spot: number };
  private readonly bulgeCdf: Float64Array;
  private readonly bulgeSMax: number;
  private readonly nzv = new Float32Array(4);
  private readonly noise: Uint8Array;

  constructor(readonly g: Galaxy, readonly look: Look, noise: Uint8Array) {
    const l = look;
    this.noise = noise;
    const axes = l.axes ?? [1, 1, l.bulgeQ];
    const hasDisc = l.old + l.thick + l.young + l.knots + l.bar > 0 || l.dust > 0;
    const rx = Math.max(axes[0], hasDisc ? Math.min(1.35, l.trunc * 1.05) : 0);
    // spheroids reach beyond the catalogued radius (their outer halo fades into the window)
    const sph = l.bulge > 0.5 ? 1.8 : 1;
    this.ext = new Vector3(rx * sph, Math.max(axes[1] * sph, hasDisc ? rx : 0), Math.max(axes[2] * (l.bulge > 0.5 ? sph : 1) * (l.bulge > 0.3 ? 1 : 0.6), hasDisc ? 0.3 : 0));
    if (hasDisc && l.bulge > 0.3) this.ext.z = Math.max(this.ext.z, l.bulgeRe * 6);
    // disc frame
    if (l.disc) {
      const f = discFrame(g.data.ra, g.data.dec, l.disc.pa, l.disc.incl);
      const gm = [g.major, g.minor, g.normal], dm = [f.major, f.minor, f.normal];
      const e: number[] = [];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) e.push(dm[i].dot(gm[j]));
      this.rot.set(e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8]);
    }
    this.rotT.copy(this.rot).transpose();
    // light shares, and each part's integral to turn them into emission coefficients
    const sum = l.bulge + l.old + l.thick + l.young + l.knots + l.bar + (l.spot?.[3] ?? 0);
    this.frac = [l.bulge, l.old, l.thick, l.young, l.knots, l.bar, l.spot?.[3] ?? 0].map((v) => v / sum);
    const trunc = (r: number) => 1 - smooth(l.trunc * 0.8, l.trunc, r);
    const radial = (f: (r: number) => number) => { let s = 0; const n = 600, R = 1.6; for (let i = 0; i < n; i++) { const r = ((i + 0.5) / n) * R; s += f(r) * trunc(r) * 2 * Math.PI * r * (R / n); } return s; };
    const am = (r: number) => smooth(0.04, 0.16, r) * (1 - smooth(1.0, 1.3, r));
    const ring = (r: number) => Math.exp(-(((r - l.ring[0]) / l.ring[1]) ** 2));
    const iOld = radial((r) => Math.exp(-r / l.hr));
    const iThick = radial((r) => Math.exp(-r / (1.3 * l.hr))) ;
    const ymMean = (r: number) => (l.arms > 0 ? am(r) : am(r)) * (1 - l.clumpy) + 1.12 * l.clumpy + l.ring[2] * ring(r);
    const iYoung = radial((r) => Math.exp(-r / (1.5 * l.hr)) * ymMean(r));
    const iKnots = iYoung * 1.5;
    const iBar = Math.PI ** 1.5 * l.barLen * 0.25 * l.barLen * 0.04;
    const iSpot = Math.PI ** 1.5 * 0.04 ** 3;
    // Sérsic spheroid: tabulated radial distribution (also for sampling)
    const bn = sersicB(l.bulgeN), Re = l.bulgeRe;
    const sMax = Math.min(3, Math.max(this.ext.x, this.ext.y, this.ext.z) / Math.min(...axes));
    const nB = 2048, cdf = new Float64Array(nB + 1);
    for (let i = 0; i < nB; i++) {
      const s = ((i + 0.5) / nB) * sMax;
      cdf[i + 1] = cdf[i] + Math.exp(-bn * (Math.pow(s / Re, 1 / l.bulgeN) - 1)) * 4 * Math.PI * s * s * (sMax / nB);
    }
    const iBulge = cdf[nB] * axes[0] * axes[1] * axes[2];
    this.bulgeCdf = cdf; this.bulgeSMax = sMax;
    // overall brightness from the catalogue: the model's mean over the catalogued ellipse matches
    // the galaxy's mean surface brightness (M31, 22.4 mag/arcsec², as the reference look)
    const bright = 0.4 * Math.pow(10, -0.4 * (meanSB(g) - 22.4)) * Math.PI * g.ratio / 0.85;
    const [fB, fO, fT, fY, fK, fBar, fS] = this.frac;
    // (the thick disc is exp(-r/1.3hr - |z|/0.05) * 10 in the shader: unit vertical integral)
    this.coef = {
      bulge: (fB * bright) / iBulge, old: (fO * bright) / iOld, thick: (fT * bright) / iThick, young: fY > 0 ? (fY * bright) / iYoung : 0,
      knots: fK > 0 ? (fK * bright) / iKnots : 0, bar: (fBar * bright) / iBar, spot: (fS * bright) / iSpot,
    };
    this.bright = bright;
    const c = this.coef;
    this.phase = l.armPhase ?? g.seed * 6.2832;
    const tanP = Math.tan(((l.pitchDeg || 14) * Math.PI) / 180);
    // spiral-coordinate noise: cells about 2.5 times longer along the arms than across them
    const P = Math.atan(tanP);
    this.alongScale = 0.45 / (Math.sin(P) * Math.cos(P) * 2.5);
    this.u = {
      uNoise: { value: noise3D().tex }, uSeed: { value: g.seed },
      uArmP: { value: new Vector4(l.arms, 1 / tanP, l.irreg, this.phase) },
      uDiscW: { value: new Vector4(c.old, c.thick, c.young, c.knots) },
      uDiscS: { value: new Vector4(l.hr, l.hz, l.clumpy, c.bar) },
      uRing: { value: new Vector4(...l.ring) },
      uBulgeW: { value: new Vector4(c.bulge, 1 / Re, bn, 1 / l.bulgeN) },
      uBulgeAx: { value: new Vector3(1 / axes[0], 1 / axes[1], 1 / axes[2]) },
      uDustP: { value: new Vector4(l.dust, 1 / l.dustHr, l.extra, l.trunc) },
      uBarP: { value: new Vector4(l.barLen, l.warp, this.alongScale, 0) },
      uSpot: { value: new Vector4(...(l.spot ? [l.spot[0], l.spot[1], l.spot[2], c.spot] : [0, 0, 0, 0])) },
      uDiscRot: { value: this.rot },
    };
  }
  readonly bright: number;
  readonly alongScale: number;
  readonly phase: number;

  /**
   * Smooth radiance (the model without its noise and dust, in its emission units) along a ray from
   * `o` in direction `d` (galaxy frame, radii): the spheroid marched, the disc as its surface density
   * where the ray crosses the plane, over the cosine of the crossing angle.
   */
  radiance(o: Vector3, d: Vector3): number {
    const e = this.ext, c = this.coef, l = this.look;
    let t0 = 0, t1 = Infinity;
    for (const k of ['x', 'y', 'z'] as const) {
      const inv = 1 / (Math.abs(d[k]) > 1e-9 ? d[k] : 1e-9);
      let a = (-e[k] - o[k]) * inv, b = (e[k] - o[k]) * inv;
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    }
    if (t1 <= t0) return 0;
    let L = 0;
    if (c.bulge > 0) {
      const ax = l.axes ?? [1, 1, l.bulgeQ], bn = sersicB(l.bulgeN), N = 48;
      // samples spaced evenly in the angle seen from the centre's closest approach (dense near the cusp)
      const tc = Math.min(Math.max(-o.dot(d), t0), t1);
      const pc = o.clone().addScaledVector(d, tc);
      const b = Math.max(Math.hypot(pc.x / ax[0], pc.y / ax[1], pc.z / ax[2]), 0.2 * l.bulgeRe);
      const a0 = Math.atan((t0 - tc) / b), a1 = Math.atan((t1 - tc) / b);
      for (let i = 0; i < N; i++) {
        const an = a0 + ((i + 0.5) / N) * (a1 - a0);
        const t = tc + b * Math.tan(an), dt = (b / Math.cos(an) ** 2) * ((a1 - a0) / N);
        const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
        const s = Math.hypot(x / ax[0], y / ax[1], z / ax[2]);
        L += c.bulge * Math.exp(-bn * (Math.pow(Math.max(s / l.bulgeRe, 1e-5), 1 / l.bulgeN) - 1)) * dt;
      }
    }
    const od = o.clone().applyMatrix3(this.rot), dd = d.clone().applyMatrix3(this.rot);
    if (Math.abs(dd.z) > 1e-6) {
      const t = -od.z / dd.z;
      if (t > t0 && t < t1) {
        const r = Math.hypot(od.x + dd.x * t, od.y + dd.y * t);
        const sig = (c.old * Math.exp(-r / l.hr) + c.thick * Math.exp(-r / (1.3 * l.hr)) + (c.young + 1.5 * c.knots) * Math.exp(-r / (1.5 * l.hr))) * (1 - smooth(l.trunc * 0.8, l.trunc, r));
        L += sig / Math.max(Math.abs(dd.z), 0.04);
      }
    }
    return L;
  }

  /** the noise at texture coordinates */
  private nz(x: number, y: number, z: number): Float32Array { return sampleNoise(this.noise, x, y, z, this.nzv); }

  /**
   * Disc-frame quantities at p (as discNoise() in GAL_MODEL): radius, spiral phase, the big-scale
   * noise (rgba) and the spiral-coordinate noise (rgba).
   */
  disc(px: number, py: number, pz: number): { r: number; psi: number; A: number[]; S: number[]; I: number[]; wid: number } {
    const l = this.look, s = this.g.seed;
    const r = Math.hypot(px, py);
    const A = Array.from(this.nz(px * 0.9 + s * 0.71, py * 0.9 + s * 0.71, pz * 0.9 + s * 0.71));
    const B = Array.from(this.nz(px * 0.3 + s * 0.53, py * 0.3 + s * 0.53, pz * 0.3 + s * 0.53));
    const lr = Math.log(Math.max(r, 0.03));
    const tanP = Math.tan(((l.pitchDeg || 14) * Math.PI) / 180);
    const psi = Math.atan2(py, px) - lr / tanP + this.phase + l.irreg * ((B[0] - 0.5) * 3 + (A[0] - 0.5) * 0.8);
    const sw = smooth(0.08, 0.25, r);
    const I = Array.from(this.nz(px * 2.6 + s * 0.29, py * 2.6 + s * 0.29, pz * 2.6 + s * 0.29));
    let S = I;
    if (sw > 0) {
      const Sp = this.nz(Math.cos(psi) * 0.45 + s * 0.37, Math.sin(psi) * 0.45 + s * 0.37, lr * this.alongScale + pz * 1.2 + s * 0.37);
      S = I.map((v, i) => v + (Sp[i] - v) * sw);
    }
    return { r, psi, A, S, I, wid: B[1] };
  }

  /**
   * Draws `n` points from the model's light (component chosen by its share, position from its smooth
   * profile, kept with the probability of the model's modulation there). Calls `put` with the
   * galaxy-frame position, the component index (0 bulge, 1 old, 2 thick, 3 young, 4 knots, 5 bar,
   * 6 spot) and the local disc scale height.
   */
  sample(n: number, rnd: () => number, put: (x: number, y: number, z: number, comp: number, hz: number) => void, only?: number[]): void {
    const l = this.look;
    const cum: number[] = [];
    let acc = 0;
    this.frac.forEach((f, i) => { acc += !only || only.includes(i) ? f : 0; cum.push(acc); });
    const lap = () => (rnd() < 0.5 ? 1 : -1) * Math.log(rnd() + 1e-12);
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(6.2832 * rnd());
    const v = new Vector3();
    const hzF = (r: number) => l.hz * (1 + 0.8 * r);
    const am = (r: number) => smooth(0.04, 0.16, r) * (1 - smooth(1.0, 1.3, r));
    const ymMax = (l.arms > 0 ? 3.66 * 2.6 : 1) * (1 - l.clumpy) + 4.2 * l.clumpy + l.ring[2];
    const ext = this.ext;
    let tries = 0;
    for (let i = 0; i < n && tries < n * 200; tries++) {
      const u = rnd() * acc;
      let comp = 0;
      while (comp < cum.length - 1 && u >= cum[comp]) comp++;
      if (comp === 0) {
        // spheroid: radius from the table, direction uniform, stretched by the axes
        const target = rnd() * this.bulgeCdf[this.bulgeCdf.length - 1];
        let lo = 0, hi = this.bulgeCdf.length - 1;
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (this.bulgeCdf[mid] < target) lo = mid; else hi = mid; }
        const s = ((lo + rnd()) / (this.bulgeCdf.length - 1)) * this.bulgeSMax;
        const z = rnd() * 2 - 1, ph = rnd() * 6.2832, q = Math.sqrt(1 - z * z);
        const ax = l.axes ?? [1, 1, l.bulgeQ];
        v.set(s * q * Math.cos(ph) * ax[0], s * q * Math.sin(ph) * ax[1], s * z * ax[2]);
        const w = 1 - smooth(0.7, 1.0, Math.hypot(v.x / ext.x, v.y / ext.y, v.z / ext.z));
        if (rnd() > w) continue;
        put(v.x, v.y, v.z, 0, 0.05);
        i++;
        continue;
      }
      // disc parts: radius from a gamma(2) distribution, height from a Laplace one
      let px: number, py: number, pz: number;
      if (comp === 5) { px = gauss() * l.barLen / Math.SQRT2; py = gauss() * 0.25 * l.barLen / Math.SQRT2; pz = gauss() * 0.04 / Math.SQRT2; }
      else if (comp === 6 && l.spot) { px = l.spot[0] + gauss() * 0.028; py = l.spot[1] + gauss() * 0.028; pz = l.spot[2] + gauss() * 0.028; }
      else {
        const hr = comp === 2 ? 1.3 * l.hr : comp >= 3 ? 1.5 * l.hr : l.hr;
        const r = -hr * Math.log(rnd() * rnd() + 1e-12);
        if (r > 1.4) continue;
        const th = rnd() * 6.2832;
        px = r * Math.cos(th); py = r * Math.sin(th);
        pz = lap() * (comp === 2 ? 0.05 : comp >= 3 ? 0.45 * hzF(r) : hzF(r));
      }
      const d = this.disc(px, py, pz);
      const r = d.r;
      const win = (1 - smooth(l.trunc * 0.8, l.trunc, r)) * (1 - smooth(0.75, 1.0, Math.abs(pz) / ext.z));
      let p = win;
      if (comp === 1) {
        const wave = l.arms > 0 ? 0.5 + 0.5 * Math.cos(l.arms * d.psi) : 0.5;
        p *= (1 + 0.5 * (wave - 0.5) * am(r)) * (0.8 + 0.4 * d.A[1]) / 1.5;
      } else if (comp === 3 || comp === 4) {
        const wave = l.arms > 0 ? 0.5 + 0.5 * Math.cos(l.arms * d.psi) : 0.5;
        const armY = l.arms > 0 ? Math.pow(wave, 4 * (0.5 + 1.1 * d.wid)) * 3.66 * am(r) * (0.2 + 2.4 * d.S[1] * d.S[1]) : am(r);
        const ring = Math.exp(-(((r - l.ring[0]) / l.ring[1]) ** 2));
        const ym = armY * (1 - l.clumpy) + smooth(0.35, 0.85, d.A[2]) * 2.8 * (0.5 + d.I[1]) * l.clumpy + l.ring[2] * ring;
        p *= ym / ymMax;
        if (comp === 4) {
          const s = this.g.seed * 5.3;
          const kn = this.nz(px * 7 + s, py * 7 + s, pz * 7 + s)[3];
          p *= smooth(0.75, 0.95, kn);
        }
      }
      if (rnd() > p) continue;
      v.set(px, py, pz).applyMatrix3(this.rotT);
      put(v.x, v.y, v.z, comp, comp === 2 ? 0.05 : comp >= 3 ? 0.45 * hzF(r) : hzF(r));
      i++;
    }
  }
}

function smooth(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Share of a galaxy's light carried by the cloud up close: star clouds (of the young, clumpy parts
 * only: the old disc and the bulge are smooth and stay in the volume), single stars (of all of it).
 */
const CLOUD_SHARE = 0.4, STAR_SHARE = 0.04;

/** Fills `star` (x, y, z, size) and `flux` (rgb) for a galaxy from its model; returns the count used. */
function fillCloud(model: GalaxyModel, star: Float32Array, flux: Float32Array, nClouds: number, nStars: number): number {
  const r = mulberry(model.g.seed + 0.123);
  const red = [1.0, 0.66, 0.42];
  const cols = [C_BULGE, C_OLD, C_OLD, C_YOUNG, C_HII, C_OLD, C_HII];
  let n = 0;
  const B = model.bright;
  const fy = model.frac[3] + model.frac[4] + model.frac[6];
  if (fy > 0) model.sample(nClouds, r, (x, y, z, comp, hz) => {
    // young star clouds, a few thousandths to a hundredth of a radius, and smaller H II knots
    const size = comp === 4 || comp === 6 ? 0.002 + 0.005 * r() : Math.min(0.004 + 0.012 * r(), 2 * hz + 0.002);
    const c = cols[comp];
    const f = (CLOUD_SHARE * fy * B) / nClouds;
    star[n * 4] = x; star[n * 4 + 1] = y; star[n * 4 + 2] = z; star[n * 4 + 3] = size;
    flux[n * 3] = c[0] * f; flux[n * 3 + 1] = c[1] * f; flux[n * 3 + 2] = c[2] * f;
    n++;
  }, [3, 4, 6]);
  // single stars: blue supergiants where stars are young, red giants everywhere; a steep
  // luminosity function (most faint, a few brilliant)
  model.sample(nStars, r, (x, y, z, comp) => {
    const young = comp >= 3 && comp !== 5;
    const c = young ? (r() < 0.75 ? C_YOUNG : red) : r() < 0.6 ? red : C_OLD;
    const L = (Math.pow(r(), 6) * 40 + 0.2) / 6.9;
    const f = ((STAR_SHARE * B) / nStars) * L;
    star[n * 4] = x; star[n * 4 + 1] = y; star[n * 4 + 2] = z; star[n * 4 + 3] = 2e-5;
    flux[n * 3] = c[0] * f; flux[n * 3 + 1] = c[1] * f; flux[n * 3 + 2] = c[2] * f;
    n++;
  });
  return n;
}

export interface GalaxyView { galaxy: Galaxy; rel: Vector3; dist: number; pixelRadius: number }

/**
 * Other galaxies as 3D volumes (VOL_FRAG): a box around each galaxy in its catalogued orientation,
 * ray-marched per pixel, so a galaxy has thickness and dust lanes from every side and can be flown
 * into. Each is as bright as its catalogued magnitude and size say (mean surface brightness). The
 * nearest one also becomes a cloud of star clouds and single stars (parallax, resolved stars),
 * dimmed by the dust between the eye and each of them. Brightness follows the eye's adaptation like
 * the Milky Way's glow; near the Sun they are hidden (the sky photo has them).
 */
export class GalaxiesLayer {
  readonly group = new Group();
  views: GalaxyView[] = [];
  private volumes = new Map<Galaxy, Mesh>();
  private models = new Map<Galaxy, GalaxyModel>();
  private box = new BoxGeometry(2, 2, 2);
  readonly gain = { value: 0 };
  /** the nearest galaxy as a 3D cloud of star clouds and stars */
  private cloud: Points;
  private cloudOf: Galaxy | null = null;
  private nClouds: number;
  private nStars: number;
  private pixAng = { value: 1e-3 };

  constructor(readonly galaxies: Galaxy[], psf?: Record<string, { value: number }>, vr = false) {
    this.group.name = 'galaxies';
    this.nClouds = vr ? 30000 : 90000;
    this.nStars = vr ? 15000 : 50000;
    const n = this.nClouds + this.nStars;
    const noise = noise3D();
    const cg = new BufferGeometry();
    cg.setAttribute('aStar', new BufferAttribute(new Float32Array(n * 4), 4));
    cg.setAttribute('aFlux', new BufferAttribute(new Float32Array(n * 3), 3));
    cg.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    cg.setDrawRange(0, 0);
    for (const g of galaxies) this.models.set(g, new GalaxyModel(g, lookFor(g, galaxies), noise.data));
    const first = this.models.values().next().value as GalaxyModel | undefined;
    const modelU = () => first ? Object.fromEntries(Object.entries(first.u).map(([k, v]) => [k, { value: v.value instanceof Vector4 || v.value instanceof Vector3 || v.value instanceof Matrix3 ? v.value.clone() : v.value }])) : {};
    this.cloud = new Points(cg, new ShaderMaterial({
      name: 'galaxy-cloud', vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG,
      uniforms: { ...modelU(), uRadius: { value: 1 }, uPixelSA: psf?.uPixelSA ?? { value: 1e-6 }, uDpr: psf?.uDpr ?? { value: 1 }, uGain: this.gain, uWeight: { value: new Vector2() },
        uMaxPx: { value: vr ? 48 : 160 }, uClipScale: { value: 1 }, uCamG: { value: new Vector3() },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    }));
    this.cloud.matrixAutoUpdate = false;
    this.cloud.frustumCulled = false;
    this.cloud.visible = false;
    this.cloud.renderOrder = -1;
    this.cloud.name = 'galaxy cloud';
    this.group.add(this.cloud);
    for (const g of galaxies) {
      const model = this.models.get(g)!;
      const m = new Mesh(this.box, new ShaderMaterial({
        name: 'galaxy-volume', vertexShader: VOL_VERT, fragmentShader: VOL_FRAG, side: BackSide,
        uniforms: {
          ...model.u, uCam: { value: new Vector3() }, uExt: { value: model.ext }, uPixAng: this.pixAng,
          uGain: this.gain, uWeight: { value: 1 }, uYoungW: { value: 1 }, uLite: LITE.uLite, uClipScale: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
        },
        transparent: true, depthWrite: false, blending: AdditiveBlending,
      }));
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      m.renderOrder = -1;
      m.name = g.name;
      this.group.add(m);
      this.volumes.set(g, m);
    }
  }

  private expo = 1;
  /** the last metered radiance (diagnostics) */
  metered = 0;
  /**
   * The eye adapting to a galaxy that fills the view: the log-mean of the galaxies' radiance over a
   * cone of 25° around the view direction (centre-weighted, like a camera's metering) sets an
   * exposure factor (at most 1: faint galaxies are not brightened), eased over a few frames.
   */
  private adaptGalaxy(cam: UPos, q?: Quaternion): number {
    if (!q) return this.expo;
    const fwd = new Vector3(0, 0, -1).applyQuaternion(q), up = new Vector3(0, 1, 0).applyQuaternion(q);
    const right = new Vector3().crossVectors(fwd, up);
    const rel = new Vector3(), o = new Vector3(), d = new Vector3(), dir = new Vector3();
    // the galaxies large on the sky
    const big: Galaxy[] = [];
    for (const g of this.galaxies) {
      const k = g.upos.sub(cam, rel).length() / g.radius;
      if (k < 25) big.push(g);
    }
    let target = 1;
    if (big.length) {
      let sumW = 0, sumLog = 0;
      const rings = [[0, 1, 2], [0.12, 6, 1], [0.25, 8, 0.7], [0.42, 8, 0.4]];
      for (const [ang, cnt, wt] of rings) for (let i = 0; i < cnt; i++) {
        const ph = (i / cnt) * Math.PI * 2 + ang * 3;
        dir.copy(fwd).addScaledVector(right, Math.tan(ang) * Math.cos(ph)).addScaledVector(up, Math.tan(ang) * Math.sin(ph)).normalize();
        let Lr = 0;
        for (const g of big) {
          g.upos.sub(cam, rel);
          const R = g.radius;
          o.set(-rel.dot(g.major) / R, -rel.dot(g.minor) / R, -rel.dot(g.normal) / R);
          d.set(dir.dot(g.major), dir.dot(g.minor), dir.dot(g.normal));
          Lr += this.models.get(g)!.radiance(o, d);
        }
        sumLog += wt * Math.log(Lr * 0.9 + 0.02);
        sumW += wt;
      }
      const La = Math.exp(sumLog / sumW);
      this.metered = La;
      target = Math.min(1, Math.pow(La / 0.3, -0.85));
    }
    this.expo += (target - this.expo) * 0.3;
    return this.expo;
  }

  /** The galaxy cloud and one volume, for compiling their shaders ahead of time. */
  warmupObjects(): (Points | Mesh)[] {
    const v = this.volumes.values().next().value;
    return v ? [this.cloud, v] : [this.cloud];
  }

  /**
   * `adapt`: the eye's dark adaptation (1 = dark-adapted); `fade`: 0 near the Sun (the sky photo
   * shows these galaxies), 1 once the photo has faded out.
   */
  update(cam: UPos, pixelAngle: number, adapt: number, fade: number, viewQuat?: Quaternion): void {
    this.views = [];
    this.gain.value = 0.9 * Math.pow(Math.max(adapt, 0), 0.55) * fade * this.adaptGalaxy(cam, viewQuat);
    this.pixAng.value = pixelAngle;
    this.group.visible = fade > 0.001;
    const rel = new Vector3();
    const m = new Matrix4();
    // the nearest galaxy (in its radii) also becomes a 3D cloud from 40 radii in
    let near: Galaxy | null = null, nearK = Infinity;
    for (const g of this.galaxies) {
      const k = g.upos.sub(cam, rel).length() / g.radius;
      if (k < nearK) { nearK = k; near = g; }
    }
    // single stars from 30 radii in; the young star clouds only up close (from 5 radii), where the
    // volume's noise runs out of detail
    const wStars = fade > 0.001 && near ? smooth(30, 12, nearK) : 0;
    const wClouds = fade > 0.001 && near ? smooth(5, 2, nearK) : 0;
    this.cloud.visible = wStars > 0.001;
    if (near && this.cloud.visible) {
      const u = (this.cloud.material as ShaderMaterial).uniforms;
      const model = this.models.get(near)!;
      if (this.cloudOf !== near) {
        const geo = this.cloud.geometry;
        const cnt = fillCloud(model, geo.attributes.aStar.array as Float32Array, geo.attributes.aFlux.array as Float32Array, this.nClouds, this.nStars);
        geo.setDrawRange(0, cnt);
        geo.attributes.aStar.needsUpdate = true;
        geo.attributes.aFlux.needsUpdate = true;
        for (const [k, v] of Object.entries(model.u)) {
          const dst = u[k];
          if (v.value instanceof Vector4 || v.value instanceof Vector3 || v.value instanceof Matrix3) (dst.value as Vector4).copy(v.value as Vector4);
          else dst.value = v.value;
        }
        this.cloudOf = near;
      }
      near.upos.sub(cam, rel);
      const R = near.radius;
      this.cloud.matrix.makeBasis(near.major.clone().multiplyScalar(R), near.minor.clone().multiplyScalar(R), near.normal.clone().multiplyScalar(R)).setPosition(rel);
      this.cloud.matrixWorldNeedsUpdate = true;
      u.uRadius.value = R;
      (u.uWeight.value as Vector2).set(wClouds, wStars);
      u.uClipScale.value = 1 / Math.max(rel.length(), R);
      (u.uCamG.value as Vector3).set(-rel.dot(near.major) / R, -rel.dot(near.minor) / R, -rel.dot(near.normal) / R);
    }
    for (const g of this.galaxies) {
      g.upos.sub(cam, rel);
      const dist = rel.length();
      const pr = Math.atan2(g.radius, dist) / pixelAngle;
      if (fade > 0.001) this.views.push({ galaxy: g, rel: rel.clone(), dist, pixelRadius: pr });
      const vol = this.volumes.get(g)!;
      vol.visible = fade > 0.001 && pr > 0.5;
      if (!vol.visible) continue;
      const R = g.radius;
      const ext = this.models.get(g)!.ext;
      m.makeBasis(g.major.clone().multiplyScalar(R * ext.x), g.minor.clone().multiplyScalar(R * ext.y), g.normal.clone().multiplyScalar(R * ext.z)).setPosition(rel);
      vol.matrix.copy(m);
      vol.matrixWorldNeedsUpdate = true;
      const u = (vol.material as ShaderMaterial).uniforms;
      u.uClipScale.value = 1 / Math.max(dist, R);
      (u.uCam.value as Vector3).set(-rel.dot(g.major) / R, -rel.dot(g.minor) / R, -rel.dot(g.normal) / R);
      // up close the cloud carries part of the light (as star clouds and single stars)
      const ws = g === near ? wStars : 0, wc = g === near ? wClouds : 0;
      u.uWeight.value = 1 - STAR_SHARE * ws;
      u.uYoungW.value = (1 - STAR_SHARE * ws - CLOUD_SHARE * wc) / (1 - STAR_SHARE * ws);
    }
  }
}

export type { GalaxyShape };
