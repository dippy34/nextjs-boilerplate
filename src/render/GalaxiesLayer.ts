import { AdditiveBlending, BackSide, BoxGeometry, BufferAttribute, BufferGeometry, Group, Matrix4, Mesh, Points, Quaternion, ShaderMaterial, Vector3 } from 'three';
import type { UPos } from '../core/upos';
import type { Galaxy, GalaxyShape } from '../universe/Galaxies';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, POINT_CLIP, PROJECT_PARS } from './shaders/xr';

/** Shared GLSL: a galaxy's light and dust in its own frame (units: the catalogued radius; disc in xy). */
const GAL_MODEL = /* glsl */ `
uniform float uSeed;
uniform float uArms;      // number of arms (0 = none)
uniform float uPitch;     // arm pitch angle (rad)
uniform float uBar;       // bar strength
uniform float uBulge;     // bulge weight
uniform float uBulgeR;    // bulge scale (radii)
uniform float uClumpy;    // irregular: patchy star-forming regions instead of arms
uniform float uDust;
const vec3 C_OLD = vec3(1.0, 0.86, 0.68);
const vec3 C_YOUNG = vec3(0.6, 0.73, 1.0);
const vec3 C_HII = vec3(1.0, 0.42, 0.58);
const vec3 C_BULGE = vec3(1.0, 0.82, 0.58);
// extinction relative to V at the red, green and blue primaries
const vec3 EXT = vec3(0.83, 1.0, 1.25);
float armPhase(vec3 p, float r) { return atan(p.y, p.x) - log(max(r, 0.02)) / tan(uPitch) + uSeed * 6.2832; }
// smooth dust (no clumps): radial and arm factor of the dust layer, and its scale height
float dustPlane(vec3 p, float r) {
  float lane = uArms > 0.5 ? pow(0.5 + 0.5 * cos(uArms * (armPhase(p, r) + 0.32)), 6.0) * smoothstep(0.06, 0.25, r) : 0.3;
  return uDust * 1.3 * exp(-r / 0.3) * (0.2 + 1.8 * lane) * smoothstep(0.02, 0.1, r);
}
float dustH(float r) { return 0.005 + 0.005 * r; }
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
 * A galaxy as a volume, ray-marched in its own frame: an exponential disc of old stars with a
 * flaring thickness, a thinner young disc concentrated in clumpy spiral arms with H II knots, a
 * bulge and bar, and a still thinner dust layer that absorbs (more in blue), strongest on the
 * inner edges of the arms. Seen edge-on the dust is a dark lane between bright starlight; face-on it
 * is a lacework. Ellipticals and dwarf spheroidals are smooth Sérsic spheroids. The step length
 * follows the height above the mid-plane, so thin discs are resolved at any viewing angle.
 */
const VOL_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uCam;        // camera in the galaxy frame (radii)
uniform vec3 uExt;        // half extents of the box (radii)
uniform float uType;      // 0 disc galaxy, 1 spheroid
uniform float uSersic;
uniform float uAe;        // spheroid normalisation (same light as the old picture)
uniform float uRatio;
uniform vec3 uTint;
uniform float uGain;
uniform float uWeight;
uniform float uLite;
varying vec3 vBox;
${GAL_MODEL}
float gh(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float gn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(gh(i), gh(i + vec3(1,0,0)), f.x), mix(gh(i + vec3(0,1,0)), gh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(gh(i + vec3(0,0,1)), gh(i + vec3(1,0,1)), f.x), mix(gh(i + vec3(0,1,1)), gh(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 pf = vBox * uExt;
  vec3 dir = normalize(pf - uCam);
  vec3 inv = 1.0 / (sign(dir) * max(abs(dir), vec3(1e-6)));
  vec3 ta = (-uExt - uCam) * inv, tb = (uExt - uCam) * inv;
  vec3 tlo = min(ta, tb), thi = max(ta, tb);
  float t0 = max(max(tlo.x, tlo.y), max(tlo.z, 0.0));
  float t1 = min(min(thi.x, thi.y), thi.z);
  if (t1 <= t0) discard;
  float jit = gh(vec3(gl_FragCoord.xy, uSeed * 7.0));
  vec3 L = vec3(0.0);
  vec3 T = vec3(1.0);
  if (uType > 0.5) {
    // spheroid: emission only
    int N = uLite > 0.5 ? 14 : 28;
    float ds = (t1 - t0) / float(N);
    for (int i = 0; i < 28; i++) {
      if (i >= N) break;
      vec3 p = uCam + dir * (t0 + (float(i) + jit) * ds);
      float rr = length(vec3(p.x, p.y / uRatio, p.z / uRatio));
      L += uTint * uAe / uRatio * exp(-7.0 * pow(rr / 0.35, uSersic)) * ds;
    }
  } else {
    int N = uLite > 0.5 ? 40 : 90;
    float dsMax = uLite > 0.5 ? 0.09 : 0.045;
    float adz = max(abs(dir.z), 0.02);
    float t = t0;
    float first = 1.0;
    for (int i = 0; i < 90; i++) {
      if (i >= N || t >= t1 || T.g < 0.01) break;
      vec3 p0 = uCam + dir * t;
      float ds = clamp(max(abs(p0.z) * 0.55, 0.004) / adz, 0.004, dsMax);
      ds = min(ds, t1 - t);
      float tt = t + ds * (first > 0.5 ? jit : 0.5);
      first = 0.0;
      vec3 p = uCam + dir * tt;
      float r = length(p.xy);
      float az = abs(p.z);
      // clumps (star clouds) and fine structure for the dust and the knots
      float nc = gn(p * 11.0 + uSeed * 13.0);
      float nd = uLite > 0.5 ? nc : gn(p * 26.0 + uSeed * 5.0 + 3.0);
      float arm = 0.0;
      if (uArms > 0.5) arm = pow(0.5 + 0.5 * cos(uArms * (armPhase(p, r) + (nc - 0.5) * 0.9)), 4.0) * smoothstep(0.05, 0.2, r);
      // old disc (flaring), young disc in the arms, bulge, bar
      float hz = 0.016 + 0.012 * r;
      float old = exp(-r / 0.24) * exp(-az / hz) / (2.0 * hz) * 0.55 * (0.75 + 0.5 * nc);
      float hy = 0.007 + 0.005 * r;
      float ey = exp(-r / 0.32) * exp(-az / hy) / (2.0 * hy);
      float young = ey * (arm * 1.7 * (0.3 + 1.4 * nc) + uClumpy * smoothstep(0.45, 0.8, nc) * 1.4);
      float knot = smoothstep(0.78, 0.95, nd) * (arm + uClumpy) * ey * 2.0;
      float rb = length(vec3(p.xy, p.z / 0.6)) / uBulgeR;
      float bulge = uBulge * 8.42 * exp(-2.0 * pow(rb, 0.55));
      float bar = uBar * 10.16 * exp(-pow(p.x / 0.3, 2.0) - pow(p.y / 0.07, 2.0) - pow(p.z / 0.05, 2.0));
      vec3 j = C_OLD * (old + bar) + C_BULGE * bulge + C_YOUNG * young + C_HII * knot;
      // dust, clumpy, thinner than the stars
      float hd = dustH(r);
      float k = uDust > 0.0 ? dustPlane(p, r) * exp(-az / hd) / (2.0 * hd) * (0.3 + 1.4 * nd) * (1.0 + 0.8 * arm) : 0.0;
      vec3 a = exp(-k * EXT * ds);
      // light emitted along the step, absorbed within it
      L += T * j * ds * (k > 1e-4 ? (1.0 - a) / max(k * EXT * ds, 1e-6) : vec3(1.0));
      T *= a;
      t += ds;
    }
  }
  gl_FragColor = vec4(L * uGain * uWeight, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/**
 * The nearest galaxy as a 3D cloud: star clouds (soft sprites of a fixed size in space, so their
 * surface brightness stays the same from any distance) and single stars, laid out like the disc
 * picture (exponential disc with thickness, arms, bar, bulge). Flying in, they spread apart with parallax.
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
uniform float uWeight;
uniform float uMaxPx;
uniform float uClipScale;
uniform vec3 uCamG;       // camera in the galaxy frame (radii)
varying vec3 vCol;
${GAL_MODEL}
// optical depth (V) of the smooth dust layer between the eye and p: the layer's vertical profile
// integrated exactly along the segment, its radial and arm factor taken where it crosses the plane
float dustTau(vec3 a, vec3 b) {
  float L = length(b - a);
  if (uDust <= 0.0 || L <= 0.0) return 0.0;
  float dz = b.z - a.z;
  float f = abs(dz) > 1e-6 ? clamp(-a.z / dz, 0.0, 1.0) : 0.5;
  vec3 c = mix(a, b, f);
  float r = length(c.xy);
  float h = dustH(r);
  float K = dustPlane(c, r);
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
  vCol = aFlux * sb * uGain * uWeight * big * exp(-dustTau(uCamG, aStar.xyz) * EXT);
  if (big <= 0.0 || mv.z > 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; return; }
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

/** Fills `star` (x, y, z, size) and `flux` (rgb) for a galaxy; returns the count used. */
function fillCloud(g: Galaxy, look: Look, star: Float32Array, flux: Float32Array, nClouds: number, nStars: number): number {
  const r = mulberry(g.seed + 0.123);
  const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(6.2832 * r());
  const lap = () => (r() < 0.5 ? 1 : -1) * Math.log(r() + 1e-9);
  const old = [1.0, 0.86, 0.68], young = [0.6, 0.73, 1.0], hii = [1.0, 0.42, 0.58], red = [1.0, 0.7, 0.45];
  const disc = look.arms > 0 || look.bar > 0 || look.clumpy > 0 || g.shape === 'lenticular';
  const tanP = Math.tan((look.pitchDeg * Math.PI) / 180) || 1;
  let n = 0;
  const put = (x: number, y: number, z: number, size: number, c: number[], f: number) => {
    star[n * 4] = x; star[n * 4 + 1] = y; star[n * 4 + 2] = z; star[n * 4 + 3] = size;
    flux[n * 3] = c[0] * f; flux[n * 3 + 1] = c[1] * f; flux[n * 3 + 2] = c[2] * f;
    n++;
  };
  const total = nClouds + nStars;
  // light shares, roughly as in the disc picture (its integrated brightness)
  const fDisc = disc ? 0.11 : 0, fArms = look.arms > 0 ? 0.1 : look.clumpy > 0 ? 0.07 : 0;
  const fBulge = (disc ? 0.02 + 0.05 * look.bulge + 0.03 * look.bar : 0.25 * (g.shape === 'dwarf' ? 0.3 : 1)) * 0.5;
  const wDisc = disc ? 0.45 : 0, wArms = fArms > 0 ? 0.35 : 0;
  const nD = Math.round(nClouds * wDisc), nA = Math.round(nClouds * wArms), nB = nClouds - nD - nA;
  const armAngle = (rad: number) => {
    const k = Math.floor(r() * Math.max(look.arms, 1));
    return (6.2832 * k + gauss() * 0.55) / Math.max(look.arms, 1) + Math.log(Math.max(rad, 0.02)) / tanP - g.seed * 6.2832;
  };
  const lane = (x: number, y: number, rad: number) => {
    if (look.arms <= 0 || look.dust <= 0) return 1;
    const ph = Math.atan2(y, x) - Math.log(Math.max(rad, 0.02)) / tanP + g.seed * 6.2832;
    const l = Math.pow(0.5 + 0.5 * Math.cos(look.arms * (ph + 0.32)), 6) * Math.min(1, Math.max(0, (rad - 0.08) / 0.2));
    return 1 - look.dust * 0.65 * l;
  };
  // the smooth disc of older stars, a few hundredths of a radius thick
  for (let i = 0; i < nD; i++) {
    const rad = -0.24 * Math.log(r() * r() + 1e-9);
    if (rad > 1.3) { i--; continue; }
    const th = r() * 6.2832, x = rad * Math.cos(th), y = rad * Math.sin(th);
    put(x, y, lap() * 0.02 * (0.6 + rad), 0.012 + 0.03 * r(), old, (fDisc / nD) * lane(x, y, rad));
  }
  // arms (or an irregular's knots): younger, bluer, thinner, with pink star-forming regions
  for (let i = 0; i < nA; i++) {
    const rad = Math.min(1.25, 0.06 + -0.3 * Math.log(r() * r() + 1e-9) * 0.75);
    let x: number, y: number;
    if (look.arms > 0) {
      // star-cloud complexes strung along the arms like beads
      const c = Math.floor(r() * 1200), cr = mulberry(g.seed + c * 0.000731);
      const crad = Math.min(1.25, 0.08 - 0.22 * Math.log(cr() * cr() + 1e-9));
      const k = Math.floor(cr() * look.arms);
      const th = (6.2832 * k + (cr() - 0.5) * 1.2) / look.arms + Math.log(crad) / tanP - g.seed * 6.2832;
      const spread = 0.012 + 0.03 * cr();
      x = crad * Math.cos(th) + gauss() * spread; y = crad * Math.sin(th) + gauss() * spread;
      if (r() < 0.35) { const t2 = armAngle(rad); x = rad * Math.cos(t2); y = rad * Math.sin(t2); }
    } else {
      // knots: clumps around a few dozen centres
      const c = Math.floor(r() * 40), cr = mulberry(g.seed + c * 0.0137);
      const cx = (cr() - 0.5) * 1.4, cy = (cr() - 0.5) * 1.4;
      x = cx + gauss() * 0.06; y = cy + gauss() * 0.06;
    }
    const knot = r() < 0.08;
    put(x, y, lap() * 0.008, knot ? 0.004 + 0.008 * r() : 0.008 + 0.02 * r(), knot ? hii : young, (fArms / nA) * (knot ? 2.5 : 0.9) * lane(x, y, rad));
  }
  // bulge and bar (or the whole of an elliptical): a spheroid of old stars
  const ratio = disc ? 0.7 : Math.max(g.ratio, 0.3);
  const sers = disc ? 0.35 : look.sersic;
  const scale = disc ? 0.06 + 0.05 * look.bulge : 0.35;
  for (let i = 0; i < nB; i++) {
    const G = -Math.log(r() * r() * r() + 1e-12);
    let rad = scale * Math.pow(G / 7, 1 / Math.max(sers, 0.25)) * (disc ? 1.6 : 1);
    if (rad > 1) rad = r();
    const u = r() * 2 - 1, ph = r() * 6.2832, s = Math.sqrt(1 - u * u);
    let x = rad * s * Math.cos(ph), y = rad * s * Math.sin(ph) * ratio, z = rad * u * (disc ? 0.6 : ratio);
    if (disc && look.bar > 0 && r() < 0.4) { x = gauss() * 0.3; y = gauss() * 0.06; z = gauss() * 0.04; }
    put(x, y, z, 0.006 + 0.02 * r() * (0.3 + rad), old, fBulge / nB);
  }
  // single stars: supergiants along the arms, giants everywhere; points with parallax
  const fStars = 0.06;
  for (let i = 0; i < nStars && n < total; i++) {
    let x: number, y: number, z: number, c: number[];
    if (disc && r() < 0.75) {
      const rad = -0.28 * Math.log(r() * r() + 1e-9);
      if (rad > 1.3) { i--; continue; }
      const th = look.arms > 0 && r() < 0.6 ? armAngle(rad) : r() * 6.2832;
      x = rad * Math.cos(th); y = rad * Math.sin(th); z = lap() * 0.012;
      c = r() < 0.5 ? young : r() < 0.6 ? red : old;
    } else {
      const rad = scale * 1.5 * -Math.log(r() * r() + 1e-9);
      if (rad > 1.2) { i--; continue; }
      const u = r() * 2 - 1, ph = r() * 6.2832, s = Math.sqrt(1 - u * u);
      x = rad * s * Math.cos(ph); y = rad * s * Math.sin(ph) * ratio; z = rad * u * (disc ? 0.6 : ratio);
      c = r() < 0.6 ? red : old;
    }
    // a steep luminosity function: most faint, a few brilliant
    const L = Math.pow(r(), 6) * 40 + 0.2;
    put(x, y, z, 2e-5, c, (fStars / nStars) * L / 6.9);
  }
  return n;
}

interface Look { arms: number; pitchDeg: number; bar: number; bulge: number; clumpy: number; dust: number; blob: number; sersic: number; bulgeR?: number }

function lookFor(g: Galaxy): Look {
  const m = g.data.morph;
  const stage = /S[AB_()s]*[ab]?([abcdm])/.exec(m)?.[1] ?? (g.shape === 'spiral' || g.shape === 'barred' ? 'b' : '');
  const pitch = { a: 9, b: 14, c: 20, d: 25, m: 28 }[stage] ?? 14;
  const bulge = { a: 1.0, b: 0.6, c: 0.3, d: 0.15, m: 0.1 }[stage] ?? 0.5;
  const looks: Record<GalaxyShape, Look> = {
    spiral: { arms: 2, pitchDeg: pitch, bar: 0, bulge, clumpy: 0.25, dust: 0.8, blob: 0.25 + 0.2 * bulge, sersic: 0.35 },
    barred: { arms: 2, pitchDeg: pitch, bar: 0.9, bulge, clumpy: 0.25, dust: 0.8, blob: 0.22 + 0.2 * bulge, sersic: 0.35 },
    lenticular: { arms: 0, pitchDeg: 14, bar: 0, bulge: 1.2, clumpy: 0, dust: 0, blob: 0.45, sersic: 0.3 },
    irregular: { arms: 0, pitchDeg: 14, bar: 0.25, bulge: 0.1, clumpy: 1, dust: 0.3, blob: 0, sersic: 1 },
    elliptical: { arms: 0, pitchDeg: 0, bar: 0, bulge: 0, clumpy: 0, dust: 0, blob: 1, sersic: 0.28 },
    dwarf: { arms: 0, pitchDeg: 0, bar: 0, bulge: 0, clumpy: 0, dust: 0, blob: 1, sersic: 0.9 },
  };
  const l = looks[g.shape];
  // Magellanic types (Sm, SBm): a bar and one stubby arm, patchy
  if (stage === 'm' && l.arms > 0) return { ...l, arms: 1, clumpy: 0.6, dust: 0.3 };
  // Sombrero-like: a big bulge and a dark lane
  if (/Sombrero/.test(g.name)) return { ...l, bulge: 1.0, bulgeR: 0.13, blob: 0.7, dust: 1.4 };
  // Centaurus A: a giant elliptical crossed by a dusty disc
  if (/Centaurus A/.test(g.name)) return { ...l, arms: 0, bulge: 1.2, bulgeR: 0.16, dust: 1.6 };
  return l;
}

export interface GalaxyView { galaxy: Galaxy; rel: Vector3; dist: number; pixelRadius: number }

/**
 * Other galaxies: a procedural disc (spiral arms, bar, dust, star-forming knots) in each catalogued
 * disc plane plus a bulge, or a spheroid glow for ellipticals and dwarfs. Brightness follows the
 * eye's adaptation like the Milky Way's glow; near the Sun they are hidden (the sky photo has them).
 */
/** ∫ exp(-7 (r/0.35)^n) 2πr dr ÷ ∫ exp(-7 (r/0.35)^n) 4πr² dr: the spheroid volume emits the old picture's light. */
function sersicNorm(n: number): number {
  let a = 0, b = 0;
  for (let i = 0; i < 4000; i++) {
    const r = (i + 0.5) / 4000 * 2, f = Math.exp(-7 * Math.pow(r / 0.35, n));
    a += f * 2 * Math.PI * r; b += f * 4 * Math.PI * r * r;
  }
  return a / b;
}

const isDisc = (g: Galaxy, look: Look) => look.arms > 0 || look.bar > 0 || look.clumpy > 0 || g.shape === 'lenticular' || !!look.bulgeR;

/** Uniform values of a galaxy's model (GAL_MODEL). */
function modelUniforms(g: Galaxy, look: Look): Record<string, { value: number }> {
  return {
    uSeed: { value: g.seed }, uArms: { value: look.arms }, uPitch: { value: ((look.pitchDeg || 14) * Math.PI) / 180 },
    uBar: { value: look.bar }, uBulge: { value: isDisc(g, look) ? look.bulge : 0 }, uBulgeR: { value: look.bulgeR ?? 0.05 },
    uClumpy: { value: look.clumpy }, uDust: { value: isDisc(g, look) ? look.dust : 0 },
  };
}

/**
 * Other galaxies as 3D volumes (VOL_FRAG): a box around each galaxy in its catalogued orientation,
 * ray-marched per pixel, so a galaxy has thickness and dust lanes from every side and can be flown
 * into. The nearest one also becomes a cloud of star clouds and single stars (parallax, resolved
 * stars), dimmed by the dust between the eye and each of them. Brightness follows the eye's
 * adaptation like the Milky Way's glow; near the Sun they are hidden (the sky photo has them).
 */
export class GalaxiesLayer {
  readonly group = new Group();
  views: GalaxyView[] = [];
  private volumes = new Map<Galaxy, Mesh>();
  private box = new BoxGeometry(2, 2, 2);
  readonly gain = { value: 0 };
  /** the nearest galaxy as a 3D cloud of star clouds and stars */
  private cloud: Points;
  private cloudOf: Galaxy | null = null;
  private looks = new Map<Galaxy, Look>();
  private nClouds: number;
  private nStars: number;

  constructor(readonly galaxies: Galaxy[], psf?: Record<string, { value: number }>, vr = false) {
    this.group.name = 'galaxies';
    this.nClouds = vr ? 30000 : 90000;
    this.nStars = vr ? 15000 : 50000;
    const n = this.nClouds + this.nStars;
    const cg = new BufferGeometry();
    cg.setAttribute('aStar', new BufferAttribute(new Float32Array(n * 4), 4));
    cg.setAttribute('aFlux', new BufferAttribute(new Float32Array(n * 3), 3));
    cg.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    cg.setDrawRange(0, 0);
    this.cloud = new Points(cg, new ShaderMaterial({
      name: 'galaxy-cloud', vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG,
      uniforms: { uRadius: { value: 1 }, uPixelSA: psf?.uPixelSA ?? { value: 1e-6 }, uDpr: psf?.uDpr ?? { value: 1 }, uGain: this.gain, uWeight: { value: 0 },
        uMaxPx: { value: vr ? 48 : 160 }, uClipScale: { value: 1 }, uCamG: { value: new Vector3() },
        uSeed: { value: 0 }, uArms: { value: 0 }, uPitch: { value: 0.25 }, uBar: { value: 0 }, uBulge: { value: 0 }, uBulgeR: { value: 0.05 }, uClumpy: { value: 0 }, uDust: { value: 0 },
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
      const look = lookFor(g);
      this.looks.set(g, look);
      const disc = isDisc(g, look);
      const ratio = Math.max(g.ratio, 0.3);
      const tint = g.shape === 'dwarf' ? new Vector3(0.95, 0.9, 0.85).multiplyScalar(0.35) : new Vector3(1.0, 0.86, 0.68).multiplyScalar(1.2);
      const ext = disc ? new Vector3(1.35, 1.35, look.bulgeR ? 0.6 : 0.4) : new Vector3(1.05, 1.05 * ratio, 1.05 * ratio);
      const m = new Mesh(this.box, new ShaderMaterial({
        name: 'galaxy-volume', vertexShader: VOL_VERT, fragmentShader: VOL_FRAG, side: BackSide,
        uniforms: {
          ...modelUniforms(g, look), uCam: { value: new Vector3() }, uExt: { value: ext }, uType: { value: disc ? 0 : 1 },
          uSersic: { value: look.sersic }, uAe: { value: sersicNorm(look.sersic) }, uRatio: { value: ratio }, uTint: { value: tint },
          uGain: this.gain, uWeight: { value: 1 }, uLite: LITE.uLite, uClipScale: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
        },
        transparent: true, depthWrite: false, blending: AdditiveBlending,
      }));
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      m.renderOrder = -1;
      m.name = g.name;
      m.userData.ext = ext;
      this.group.add(m);
      this.volumes.set(g, m);
    }
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
  update(cam: UPos, pixelAngle: number, adapt: number, fade: number, _viewQuat?: Quaternion): void {
    this.views = [];
    this.gain.value = 0.9 * Math.pow(Math.max(adapt, 0), 0.55) * fade;
    this.group.visible = fade > 0.001;
    const rel = new Vector3();
    const m = new Matrix4();
    // the nearest galaxy (in its radii) also becomes a 3D cloud from 40 radii in
    let near: Galaxy | null = null, nearK = Infinity;
    for (const g of this.galaxies) {
      const k = g.upos.sub(cam, rel).length() / g.radius;
      if (k < nearK) { nearK = k; near = g; }
    }
    const wCloud = fade > 0.001 && near ? Math.min(1, Math.max(0, (40 - nearK) / 15)) : 0;
    this.cloud.visible = wCloud > 0.001;
    if (near && this.cloud.visible) {
      const u = (this.cloud.material as ShaderMaterial).uniforms;
      if (this.cloudOf !== near) {
        const geo = this.cloud.geometry;
        const look = this.looks.get(near)!;
        const cnt = fillCloud(near, look, geo.attributes.aStar.array as Float32Array, geo.attributes.aFlux.array as Float32Array, this.nClouds, this.nStars);
        geo.setDrawRange(0, cnt);
        geo.attributes.aStar.needsUpdate = true;
        geo.attributes.aFlux.needsUpdate = true;
        for (const [k, v] of Object.entries(modelUniforms(near, look))) u[k].value = v.value;
        this.cloudOf = near;
      }
      near.upos.sub(cam, rel);
      const R = near.radius;
      this.cloud.matrix.makeBasis(near.major.clone().multiplyScalar(R), near.minor.clone().multiplyScalar(R), near.normal.clone().multiplyScalar(R)).setPosition(rel);
      this.cloud.matrixWorldNeedsUpdate = true;
      u.uRadius.value = R;
      u.uWeight.value = wCloud;
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
      const ext = vol.userData.ext as Vector3;
      m.makeBasis(g.major.clone().multiplyScalar(R * ext.x), g.minor.clone().multiplyScalar(R * ext.y), g.normal.clone().multiplyScalar(R * ext.z)).setPosition(rel);
      vol.matrix.copy(m);
      vol.matrixWorldNeedsUpdate = true;
      const u = (vol.material as ShaderMaterial).uniforms;
      u.uClipScale.value = 1 / Math.max(dist, R);
      (u.uCam.value as Vector3).set(-rel.dot(g.major) / R, -rel.dot(g.minor) / R, -rel.dot(g.normal) / R);
      // up close the cloud carries half of the light (as star clouds and single stars)
      u.uWeight.value = g === near ? 1 - 0.5 * wCloud : 1;
    }
  }
}
