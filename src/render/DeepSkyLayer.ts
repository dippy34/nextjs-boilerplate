import {
  AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, DataTexture, Group, Matrix3, Mesh, PlaneGeometry, Points, ShaderMaterial, SphereGeometry, Vector3, Vector4,
} from 'three';
import { teffToLut } from '../astro/photometry';
import { raDecToVector } from '../core/frames';
import type { UPos } from '../core/upos';
import type { DeepSkyObject } from '../universe/DeepSky';
import { noise3D } from './Noise3D';
import { STAR_FRAG, STAR_VERT } from './StarField';
import { VOLUMES } from './Renderer';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

const BILL_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
uniform float uClipScale;
varying vec2 vP;
void main() {
  vP = position.xy;
  // camera-facing quad around the object's centre, sized by the model's scale
  vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float s = length(vec3(modelMatrix[0]));
  c.xy += position.xy * s;
  gl_Position = projectView(c);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
  gl_Position *= uClipScale;
}`;

/** An unresolved globular cluster: a soft yellowish ball of light (gives way to its stars). */
const GLOW_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uGain;
varying vec2 vP;
void main() {
  float r = length(vP);
  if (r > 1.0) discard;
  vec3 c = vec3(1.0, 0.9, 0.72) * exp(-pow(r / 0.22, 1.1) * 2.3) * (1.0 - smoothstep(0.7, 1.0, r));
  gl_FragColor = vec4(c * uGain, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/**
 * A nebula too small to resolve: a soft glow of its colour that keeps the nebula's light (its
 * integrated flux) down to below a pixel, as the volume fades out.
 */
const FAR_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uCol;
uniform float uGain;
uniform float uAmp;
varying vec2 vP;
void main() {
  float r2 = dot(vP, vP);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(uCol * uAmp * uGain * exp(-4.0 * r2), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

function rnd(seed: number): () => number {
  let a = Math.floor(seed * 4294967296) >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Stars of a globular cluster: Plummer-like density, an old population's luminosity mix. */
function clusterStars(o: DeepSkyObject, n: number): { pos: Float32Array; mt: Float32Array } {
  const r = rnd(o.seed + 0.123);
  const Rt = o.radius / 3.0856775814913673e16; // tidal radius, pc
  const a = Rt * 0.07;
  const pos = new Float32Array(n * 3), mt = new Float32Array(n);
  const ABS_MIN = -12, ABS_STEP = 0.125;
  for (let i = 0; i < n; i++) {
    let rr = a / Math.sqrt(Math.pow(Math.max(r(), 1e-6), -2 / 3) - 1);
    if (!Number.isFinite(rr) || rr > Rt) rr = Rt * r();
    const z = 2 * r() - 1, ph = 2 * Math.PI * r(), s = Math.sqrt(1 - z * z);
    pos.set([rr * s * Math.cos(ph), rr * s * Math.sin(ph), rr * z], i * 3);
    const u = r();
    let M: number, T: number;
    if (u < 0.5) { M = 3.8 + 3 * r(); T = 6000 - 1400 * (M - 3.8) / 3; }          // main sequence below the turn-off
    else if (u < 0.72) { M = 2.6 + 1.2 * r(); T = 5300 + 300 * r(); }              // subgiants
    else if (u < 0.93) { M = 2.5 - 5 * Math.pow(r(), 2.2); T = 5000 - 1100 * (2.5 - M) / 5; } // red giant branch
    else if (u < 0.985) { M = 0.4 + 0.5 * r(); T = r() < 0.5 ? 9000 + 3000 * r() : 5200 + 600 * r(); } // horizontal branch
    else { M = 1.6 + 1.4 * r(); T = 7000 + 1500 * r(); }                          // blue stragglers
    const idx = Math.max(0, Math.min(255, Math.round((M - ABS_MIN) / ABS_STEP)));
    mt[i] = idx + 256 * Math.round(teffToLut(T) * 255);
  }
  return { pos, mt };
}

export interface DeepSkyView { obj: DeepSkyObject; rel: Vector3; dist: number; pixelRadius: number }

const VOL_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
uniform float uClipScale;
varying vec3 vPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
  gl_Position *= uClipScale;
}`;

/**
 * A nebula as a volume, at any distance (no flat pictures): the view ray is marched through the
 * nebula's bounding sphere in the nebula's own frame (z along our line of sight, x towards the
 * catalogued position angle on the sky), adding glowing gas and dimming it behind dust. All noise
 * comes from the shared 3D noise texture, read at the mip level of the pixel's footprint.
 *
 * Emission nebulae (H II regions): gas around a young cluster, ionised and lit by it (inverse
 * square), as clumps and as filaments and sheets (ridged noise); [O III] teal near the stars,
 * H-alpha red beyond; dust lanes and pillars (noise of the direction only: columns pointing at the
 * stars, with lit rims). Shapes: a cavity, a thick shell (Rosette), a blister on the far wall of
 * its cloud (Orion), a nest of loops (Tarantula).
 * Planetary nebulae: barrel (a ring seen end-on: Ring, Helix with cometary knots), bipolar
 * (Dumbbell), round with two cavities (Owl), nested bubbles in concentric rings (Cat's Eye).
 * Supernova remnants: a filled filament web over blue synchrotron light (Crab), a thin wispy shell
 * (Veil), a shell of bright knots (Cassiopeia A).
 */
const VOL_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler3D uNoise;
uniform vec3 uCenter;   // camera-relative (m)
uniform float uRadius;  // m
uniform mat3 uRot;      // world -> nebula frame
uniform float uType;    // 0 emission, 1 planetary, 2 supernova remnant, 3 reflection
uniform float uShape;
uniform float uSeed;
uniform float uGain;
uniform float uBright;
uniform float uFade;    // gives way to the far glow when a few pixels small
uniform float uLite;
uniform float uPixAng;
uniform vec3 uAxes;     // envelope axes (nebula frame, radii)
uniform vec3 uAxis;     // symmetry axis (nebula frame)
uniform vec4 uP;        // emission: cavity radius, pillars, lanes, [O III] extent
uniform vec4 uQ;        // emission: filaments, pillar angular scale, ionisation-front bar, reflection
varying vec3 vPos;
float sq(float x) { return x * x; }
vec4 nz(vec3 p, float lod) { return textureLod(uNoise, p, max(lod, 0.0)); }
float ridge(float n) { return 1.0 - abs(2.0 * n - 1.0); }
// smoothstep(a, b, n) of noise read at mip level l: blurred noise sits near 0.5, so as it blurs the
// threshold eases to its mean over sharp noise (features fade into an even glow, not to nothing)
float thr(float n, float a, float b, float l) { return mix(smoothstep(a, b, n), 1.0 - b + 0.5 * (b - a), clamp(l * 0.5, 0.0, 1.0)); }
vec3 sd;
bool hi;

void emission(vec3 p, float lod, out vec3 e, out float dust) {
  vec3 q = p / uAxes;
  float r = length(q), rp = length(p);
  vec4 n0 = nz(p * 0.35 + sd, lod - 1.5);
  vec3 w = (n0.xyz - 0.5) * 0.45;
  vec4 n1 = nz((p + w) * 0.9 + sd * 1.3, lod - 0.15);
  vec4 n2 = hi ? nz((p + w) * 2.6 + sd * 1.7, lod + 1.38) : vec4(0.5);
  float env, wall = 0.0;
  if (uShape < 0.5) {
    // a cavity blown by the cluster, its walls thick and broken
    env = smoothstep(uP.x * 0.4, uP.x * 1.6, r + 0.3 * (n0.a - 0.5)) * (1.0 - smoothstep(0.55, 1.0, r + 0.25 * (n1.r - 0.5)));
  } else if (uShape < 1.5) {
    // a thick shell around an empty middle (Rosette)
    env = exp(-sq((r - 0.62 - 0.18 * (n0.a - 0.5)) / 0.2)) * smoothstep(uP.x * 0.6, uP.x * 1.3, r);
  } else if (uShape < 2.5) {
    // a blister: the cluster sits in front of the far wall of its cloud, which it lights (Orion)
    float bowl = p.z - 0.15 - 0.7 * dot(p.xy, p.xy) - 0.25 * (n0.a - 0.5);
    wall = exp(-sq(bowl / 0.12));
    env = (wall + 0.35 * smoothstep(0.0, 0.3, bowl)) * (1.0 - smoothstep(0.6, 1.0, r + 0.25 * (n1.r - 0.5)));
  } else {
    // a nest of loops and bubbles (Tarantula)
    env = (1.0 - smoothstep(0.45, 1.0, r + 0.2 * (n1.r - 0.5))) * (0.3 + 1.4 * pow(ridge(n0.b), 3.0));
  }
  float fil = pow(ridge(n1.b), 5.0) * (hi ? 0.5 + 1.0 * pow(ridge(n2.g), 3.0) : 1.0);
  float dens = env * (0.3 * n1.r * (hi ? 0.6 + 0.8 * n2.r : 1.0) + uQ.x * fil);
  // lit by the cluster at the centre: inverse square, softened
  float ion = 1.0 / (0.2 + rp * rp * 3.0);
  float oiii = 1.0 - smoothstep(uP.w * 0.5, uP.w * 1.4, rp + 0.3 * (n1.a - 0.5));
  vec3 tint = mix(mix(vec3(1.0, 0.16, 0.26), vec3(1.0, 0.32, 0.38), n0.r), vec3(0.32, 0.95, 0.82), oiii * 0.8);
  e = tint * dens * ion * 6.0;
  if (uQ.z > 0.0) {
    // an ionisation front seen edge-on: a bright straight ridge beside the cluster (Orion's Bright Bar)
    vec3 bc = vec3(0.1, -0.16, 0.12), bn = normalize(vec3(0.55, 0.85, 0.0)), ba = normalize(vec3(0.85, -0.55, 0.0));
    vec3 dq = p - bc;
    float bar = exp(-sq(dot(dq, bn) / 0.025) - sq(dq.z / 0.12)) * smoothstep(0.24, 0.1, abs(dot(dq, ba)));
    e += mix(vec3(1.0, 0.35, 0.35), vec3(0.9, 0.85, 0.6), 0.4) * bar * uQ.z * (0.6 + 0.8 * n1.g) * ion * 3.0;
  }
  dust = 0.0;
  if (uP.y > 0.0) {
    // pillars: a few short columns of dense dust in the walls, pointing at the stars (noise of the
    // direction only), widening to their base; the tips facing the stars are lit, the sides a little
    vec3 u = p / max(rp, 1e-3);
    vec4 np = nz(u * uQ.y + sd * 0.7, lod + log2(uQ.y / max(rp, 0.1)));
    // (mostly where they stand side-on to us, silhouetted against the lit gas, as in the famous
    // pictures; seen end-on they would only be dark spots)
    float site = smoothstep(0.5, 0.7, n0.g) * smoothstep(0.05, 0.3, env) * (1.0 - smoothstep(0.35, 0.7, abs(u.z)));
    float tip = uP.x * 1.1 + 0.3 * np.g;
    float len = 0.08 + 0.14 * np.b;
    float x = (rp - tip) / len;                         // 0 at the tip, 1 at the base
    float width = 0.9 - 0.05 * clamp(x, 0.0, 1.0) - 0.06 * clamp(uP.y - 1.0, 0.0, 1.0);   // strong pillars are broad
    float inCol = thr(np.r, width, width + 0.025, lod + log2(uQ.y / max(rp, 0.1))) * site;
    float along = smoothstep(0.0, 0.05, x) * (1.0 - smoothstep(0.7, 1.1, x));
    dust += inCol * along * uP.y * 90.0 * (0.6 + 0.8 * n1.g);
    float rim = inCol * exp(-sq(x / 0.07)) + 0.25 * (smoothstep(width - 0.02, width, np.r) * site - inCol) * along;
    e += vec3(1.0, 0.5, 0.42) * max(rim, 0.0) * ion * uP.y * 3.0;
  }
  if (uP.z > 0.0) {
    // dark lanes and clouds, mostly in front and around
    float lane = thr(n0.b * 0.6 + n1.g * 0.4, 0.58, 0.7, lod - 0.15) * smoothstep(0.1, 0.4, r) * (1.0 - smoothstep(0.85, 1.0, r));
    dust += lane * uP.z * 14.0 * (hi ? 0.5 + n2.b : 1.0);
    // starlight scattered by dust near the stars (reflection nebula, blue)
    e += vec3(0.35, 0.5, 1.0) * lane * ion * uQ.w * 0.25;
  }
}

void planetary(vec3 p, float lod, out vec3 e) {
  float ca = dot(p, uAxis);
  vec3 perp = p - uAxis * ca;
  float rp = length(perp), r = length(p);
  vec4 n1 = nz(p * 2.0 + sd, lod + 1.0);
  vec4 n2 = hi ? nz(p * 5.0 + sd * 1.3, lod + 2.32) : vec4(0.5);
  float wob = 0.07 * (n1.r - 0.5);
  float re, dens;
  vec3 u = p / max(r, 1e-3);
  if (uShape < 0.5 || (uShape > 2.5 && uShape < 3.5)) {
    // barrel (a ring when seen end-on): prolate, open towards its axis
    re = length(vec2(rp, ca / 1.5));
    dens = exp(-sq((re - 0.48 - wob) / 0.065)) * smoothstep(0.1, 0.6, rp / max(re, 1e-3)) * 2.2;
    dens += 0.12 * smoothstep(0.5, 0.25, re) * smoothstep(0.05, 0.3, re);   // fainter gas filling it
    if (uShape > 2.5) {
      // Helix: a second, tilted ring and cometary knots with tails pointing away from the star
      vec3 ax2 = normalize(uAxis + vec3(0.5, 0.2, 0.0));
      float ca2 = dot(p, ax2);
      float re2 = length(vec2(length(p - ax2 * ca2), ca2 / 1.5));
      dens += exp(-sq((re2 - 0.68 - wob) / 0.09)) * 0.7;
      vec4 nk = nz(u * 9.0 + sd, lod + log2(9.0 / max(r, 0.1)));
      float knot = thr(nk.r, 0.8, 0.9, lod + log2(9.0 / max(r, 0.1))) * smoothstep(0.3, 0.38, r) * (1.0 - smoothstep(0.38, 0.62, r));
      dens += knot * 2.5;
    }
  } else if (uShape < 1.5) {
    // bipolar: an hourglass, its walls brightest, pinched by a dense waist, inside a fainter
    // ellipsoid of gas (the Dumbbell's apple core and its 'ears')
    float wHg = 0.14 + 0.75 * abs(ca);                 // radius of the hourglass at height ca
    float inside = smoothstep(0.85, 0.65, length(vec2(rp / 0.8, ca / 0.9)) + wob);
    float lobes = (smoothstep(wHg + 0.05, wHg - 0.1, rp + wob) * 0.6 + exp(-sq((rp - wHg - wob) / 0.07))) * inside;
    float waist = exp(-sq((rp - 0.22) / 0.07) - ca * ca / 0.008);
    float halo = 0.25 * smoothstep(0.98, 0.7, length(vec2(rp / 0.85, ca / 0.95)));
    dens = lobes + waist * 1.2 + halo;
    re = length(vec2(rp, ca * 0.6)) + 0.1;
  } else if (uShape < 2.5) {
    // round shell with two dark cavities (the Owl)
    // (the eyes: two cylinders along our line of sight, the ends of a barrel seen nearly end-on)
    re = r;
    vec3 side = normalize(cross(vec3(0.0, 0.0, 1.0), vec3(0.95, 0.31, 0.12)));
    vec3 q1 = p - side * 0.24, q2 = p + side * 0.24;
    float e1 = smoothstep(0.1, 0.17, length(q1.xy)), e2 = smoothstep(0.1, 0.17, length(q2.xy));
    dens = smoothstep(0.78, 0.6, r + wob) * (0.6 + 0.4 * n1.g) * (0.12 + 0.88 * e1 * e2);
  } else {
    // Cat's Eye: two tilted elliptical bubbles inside, rings of a faint halo outside
    vec3 a1 = normalize(uAxis + vec3(0.3, 0.0, 0.0)), a2 = normalize(uAxis - vec3(0.25, 0.15, 0.0));
    float b1 = length(vec2(length(p - a1 * dot(p, a1)) / 0.2, dot(p, a1) / 0.36));
    float b2 = length(vec2(length(p - a2 * dot(p, a2)) / 0.24, dot(p, a2) / 0.3));
    dens = exp(-sq((b1 - 1.0 - wob * 2.0) / 0.07)) * 1.6 + exp(-sq((b2 - 1.0 - wob * 2.0) / 0.07)) * 1.3;
    dens += 0.15 * pow(0.5 + 0.5 * cos(r * 60.0 + n1.b * 1.5), 4.0) * smoothstep(0.32, 0.45, r) * (1.0 - smoothstep(0.75, 1.0, r));
    re = r * 0.9;
  }
  // knots and radial spokes
  float spokes = 0.8 + 0.4 * pow(nz(u * 8.0 + sd, lod + log2(8.0 / max(r, 0.1)) + 0.5).g, 2.0);
  float knots = 0.65 + 0.9 * thr(n2.r, 0.5, 0.85, lod + 2.32);
  dens *= spokes * knots;
  vec3 tint = mix(vec3(0.25, 0.95, 0.85), vec3(1.0, 0.22, 0.3), smoothstep(0.42, 0.56, re));
  float halo = 0.08 * exp(-sq((r - 0.86) / 0.08)) * (0.3 + 1.4 * ridge(n1.a));
  e = (tint * dens + vec3(1.0, 0.3, 0.35) * halo) * 1.4;
}

void remnant(vec3 p, float lod, out vec3 e) {
  vec4 n0 = nz(p * 0.5 + sd, lod - 1.0);
  vec3 w = (n0.xyz - 0.5) * 0.3;
  vec4 n1 = nz((p + w) * 1.6 + sd * 1.3, lod + 0.68);
  vec4 n2 = hi ? nz((p + w) * 4.0 + sd * 1.7, lod + 2.0) : vec4(0.5);
  float r = length(p);
  if (uShape < 0.5) {
    // the Crab: an ellipsoid filled with a web of filaments, glowing blue inside (synchrotron light
    // of the pulsar wind)
    float ca = dot(p, uAxis);
    vec3 pq = p - uAxis * ca * 0.45;               // an ellipsoid stretched along the axis
    float rq = length(pq);
    float body = smoothstep(0.95, 0.7, rq + 0.15 * (n0.a - 0.5));
    // a cage of filaments, densest in the outer half
    // filaments: sheets a few hundredths of a radius thick (resolved by the steps), brightest
    // where seen edge-on; two scales
    float web = smoothstep(0.72, 0.95, ridge(n1.b)) * (0.15 + 1.1 * smoothstep(0.4, 0.75, n0.g))
      + (hi ? 0.6 * smoothstep(0.78, 0.97, ridge(n2.g)) : 0.0);
    web *= smoothstep(0.15, 0.6, rq);
    // red (hydrogen, sulphur) and yellow-green (neutral oxygen) filaments
    vec3 fil = mix(vec3(1.0, 0.3, 0.16), vec3(0.78, 0.92, 0.38), smoothstep(0.4, 0.7, n0.r));
    vec3 sync = vec3(0.48, 0.64, 1.0) * smoothstep(0.85, 0.05, rq) * (0.5 + 0.6 * n1.a);
    e = fil * web * body * 5.0 + sync * 0.75;
  } else if (uShape < 1.5) {
    // the Veil: a thin, wispy shell, bright only along some arcs
    float shell = exp(-sq((r - 0.88 - 0.1 * (n0.r - 0.5)) / 0.035));
    float arcs = smoothstep(0.5, 0.8, nz(p / max(r, 1e-3) * 0.5 + sd, lod).g);
    float web = pow(ridge(n1.b), 9.0) + (hi ? 0.8 * pow(ridge(n2.g), 12.0) : 0.0);
    vec3 col = mix(vec3(1.0, 0.25, 0.3), vec3(0.3, 0.75, 1.0), smoothstep(0.35, 0.65, n0.b));
    e = col * shell * (0.1 + arcs) * web * 5.0;
  } else {
    // Cassiopeia A: a shell of bright knots of ejecta (sulphur, oxygen, neon) and a faint shock outside
    float shell = exp(-sq((r - 0.72 - 0.1 * (n0.r - 0.5)) / 0.08));
    float kn = (hi ? thr(n2.r, 0.72, 0.92, lod + 2.0) : thr(n1.r, 0.72, 0.92, lod + 0.68)) * (0.3 + pow(ridge(n1.b), 3.0)) * smoothstep(0.35, 0.6, n0.a);
    vec3 col = mix(mix(vec3(0.45, 1.0, 0.55), vec3(1.0, 0.3, 0.25), smoothstep(0.3, 0.6, n1.g)), vec3(0.5, 0.6, 1.0), smoothstep(0.7, 0.9, n0.g));
    e = col * shell * kn * 9.0 + vec3(0.45, 0.6, 1.0) * exp(-sq((r - 0.95) / 0.04)) * 0.25 * (0.5 + n1.a);
  }
}

// a reflection nebula: dust lit by the cluster's hot stars, blue, in fine parallel striations
// (the Pleiades' nebulosity is a cloud the cluster is passing through, combed by its light)
void reflection(vec3 p, float lod, out vec3 e) {
  float r = length(p);
  vec3 q = p * vec3(1.0, 4.0, 1.0);                 // striations along x
  vec4 n0 = nz(p * 0.5 + sd, lod - 1.0);
  vec4 n1 = nz(q * 0.9 + sd * 1.3 + (n0.xyz - 0.5) * 0.5, lod + 1.85);
  vec4 n2 = hi ? nz(q * 2.4 + sd * 1.7, lod + 3.26) : vec4(0.5);
  float dens = thr(n0.r, 0.3, 0.75, lod - 1.0) * (0.3 + 1.4 * n1.g * (0.5 + n2.b)) * (1.0 - smoothstep(0.55, 1.0, r));
  // lit by the bright stars near the middle
  float lit = 0.0;
  for (int k = 0; k < 5; k++) {
    vec3 sp = (vec3(fract(sin(float(k) * 12.9898 + uSeed * 78.233) * 43758.5453), fract(sin(float(k) * 39.346 + uSeed * 11.135) * 43758.5453),
      fract(sin(float(k) * 73.156 + uSeed * 52.235) * 43758.5453)) - 0.5) * 0.5;
    vec3 d = p - sp;
    lit += 1.0 / (0.01 + dot(d, d) * 12.0);
  }
  e = vec3(0.42, 0.58, 1.0) * dens * lit * 0.08;
}

void main() {
  vec3 dir = uRot * normalize(vPos);
  vec3 oc = uRot * (-uCenter / uRadius);
  float b = dot(oc, dir);
  float c = dot(oc, oc) - 1.0;
  float disc = b * b - c;
  if (disc <= 0.0) discard;
  float sq_ = sqrt(disc);
  float t0 = max(-b - sq_, 0.0), t1 = -b + sq_;
  if (t1 <= t0) discard;
  hi = uLite < 0.5;
  // steps of a fixed length: NMAX across the whole diameter (thin shells and filaments of planetary
  // nebulae and remnants get more), so a shorter ray (from inside the nebula, or near its edge)
  // takes fewer steps of the same length, not more of finer ones
  float NMAX = hi ? (uType > 0.5 ? 96.0 : 64.0) : 24.0;
  int N = int(clamp(ceil((t1 - t0) * 0.5 * NMAX), 6.0, NMAX));
  float dt = (t1 - t0) / float(N);
  // interleaved gradient noise: an even jitter of the samples (no banding, no blotches)
  float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  sd = vec3(uSeed * 17.31, uSeed * 29.17, uSeed * 7.73);
  vec3 col = vec3(0.0);
  float T = 1.0;
  for (int i = 0; i < 96; i++) {
    if (i >= N || T < 0.01) break;
    float t = t0 + (float(i) + jit) * dt;
    vec3 p = oc + dir * t;
    float lod = log2(max(t * uPixAng * 64.0, 1e-6));
    vec3 e;
    float dust = 0.0;
    if (uType < 0.5) emission(p, lod, e, dust);
    else if (uType < 1.5) planetary(p, lod, e);
    else if (uType < 2.5) remnant(p, lod, e);
    else reflection(p, lod, e);
    col += T * e * dt;
    T *= exp(-dust * dt);
  }
  // the young cluster lighting an emission nebula: blue-white stars with soft halos
  if (uType < 0.5) {
    for (int k = 0; k < 8; k++) {
      vec3 sp = (vec3(fract(sin(float(k) * 12.9898 + uSeed * 78.233) * 43758.5453), fract(sin(float(k) * 39.346 + uSeed * 11.135) * 43758.5453),
        fract(sin(float(k) * 73.156 + uSeed * 52.235) * 43758.5453)) - 0.5) * 0.16;
      float ts = dot(sp - oc, dir);
      if (ts <= 0.0) continue;
      float d = length(oc + dir * ts - sp) / max(ts, 1e-3);   // angle from the star (rad)
      float L = (0.4 + fract(sin(float(k) * 4.1 + uSeed) * 9631.7)) * (k == 0 ? 2.5 : 1.0);
      col += vec3(0.72, 0.84, 1.0) * L * (exp(-sq(d / 0.0025)) * 6.0 + 0.03 / (1.0 + sq(d / 0.012))) * T;
    }
  }
  // the dying star at a planetary nebula's centre, the pulsar in the Crab
  if (uType > 0.5 && uType < 1.5 || uType > 1.5 && uType < 2.5 && uShape < 0.5) {
    float ts = dot(-oc, dir);
    if (ts > 0.0) {
      float d = length(oc + dir * ts) / max(ts, 1e-3);
      col += vec3(0.8, 0.88, 1.0) * (exp(-sq(d / max(0.0015, uPixAng * 0.8))) * 25.0 + 0.04 / (1.0 + sq(d / 0.008)));
    }
  }
  gl_FragColor = vec4(col * 0.7 * uGain * uBright * uFade, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/** How a nebula's volume is built (see VOL_FRAG). */
interface NebLook {
  shape: number;
  axes?: [number, number, number];
  /** emission: cavity radius, pillars, lanes, [O III] extent */
  p?: [number, number, number, number];
  /** emission: filaments, pillar angular scale, -, reflection */
  q?: [number, number, number, number];
  bright?: number;
  /** a reflection nebula around a cluster */
  reflection?: boolean;
  /** planetary / remnant: tilt of the symmetry axis from our line of sight (degrees) */
  tilt?: number;
}

/**
 * The famous nebulae as they look from Earth; others from their kind and seed. Emission-nebula
 * shapes: 0 cavity, 1 shell, 2 blister, 3 loops. Planetary: 0 barrel, 1 bipolar, 2 Owl, 3 Helix,
 * 4 Cat's Eye. Remnants: 0 filled (Crab), 1 thin shell (Veil), 2 knotty shell (Cas A).
 */
const LOOKS: Record<string, NebLook> = {
  'Orion Nebula': { shape: 2, axes: [1, 1, 0.7], p: [0.15, 0, 0.8, 0.3], q: [1.2, 3, 1.0, 0.4], bright: 1.6 },
  'Eagle Nebula': { shape: 0, axes: [1, 1.1, 0.85], p: [0.3, 2.0, 0.3, 0.3], q: [1.0, 1.1, 0, 0] },
  'Lagoon Nebula': { shape: 0, axes: [1, 0.6, 0.7], p: [0.2, 0.3, 1.1, 0.2], q: [1.0, 3, 0, 0.2] },
  'Carina Nebula': { shape: 0, axes: [1, 0.85, 0.8], p: [0.25, 0.8, 1.1, 0.35], q: [1.1, 2.6, 0, 0.1], bright: 2.2 },
  'Rosette Nebula': { shape: 1, axes: [1, 1, 1], p: [0.35, 0.35, 0.3, 0.45], q: [0.9, 5, 0, 0] },
  'Tarantula Nebula': { shape: 3, axes: [1, 0.9, 0.8], p: [0.15, 0.3, 0.4, 0.3], q: [1.8, 3, 0, 0], bright: 4 },
  'Trifid Nebula': { shape: 0, axes: [1, 1, 0.9], p: [0.2, 1.4, 0.2, 0.2], q: [0.9, 1.2, 0, 1.2] },
  'North America Nebula': { shape: 0, axes: [1, 0.9, 0.6], p: [0.3, 0.2, 1.4, 0.15], q: [1.0, 3, 0, 0] },
  'Omega Nebula': { shape: 0, axes: [1, 0.7, 0.7], p: [0.2, 0.3, 0.6, 0.3], q: [1.2, 3, 0, 0], bright: 1.3 },
  'California Nebula': { shape: 0, axes: [1, 0.3, 0.4], p: [0.2, 0.2, 0.4, 0.1], q: [1.4, 3, 0, 0] },
  'Heart Nebula': { shape: 1, axes: [1, 0.9, 0.9], p: [0.4, 0.6, 0.4, 0.2], q: [1.0, 3, 0, 0] },
  Pleiades: { shape: 0, reflection: true, bright: 1.6 },
  'Ring Nebula': { shape: 0, tilt: 25 },
  'Helix Nebula': { shape: 3, tilt: 18 },
  'Southern Ring Nebula': { shape: 0, tilt: 45 },
  'Eskimo Nebula': { shape: 0, tilt: 10 },
  'Dumbbell Nebula': { shape: 1, tilt: 80 },
  "Cat's Eye Nebula": { shape: 4, tilt: 50 },
  'Owl Nebula': { shape: 2, tilt: 0 },
  'Crab Nebula': { shape: 0, tilt: 70 },
  'Veil Nebula (Cygnus Loop)': { shape: 1, tilt: 0 },
  'Cassiopeia A': { shape: 2, tilt: 0 },
};

function lookOf(o: DeepSkyObject): NebLook {
  const known = LOOKS[o.name];
  if (known) return known;
  const r = rnd(o.seed + 0.5);
  if (o.data.kind === 'emission') return { shape: r() < 0.7 ? 0 : 1, axes: [1, 0.7 + 0.3 * r(), 0.7 + 0.3 * r()], p: [0.2 + 0.15 * r(), 0.6 * r(), 0.3 + 0.7 * r(), 0.3], q: [1, 2 + 2 * r(), 0, 0] };
  if (o.data.kind === 'planetary') return { shape: r() < 0.5 ? 0 : 1, tilt: 90 * r() };
  return { shape: r() < 0.5 ? 1 : 2, tilt: 0 };
}

/**
 * Nebulae and star clusters. Nebulae are volumes at every distance (VOL_FRAG), framed as seen
 * from Earth; globular clusters are generated stars (drawn exactly like catalogue stars) plus a
 * glow while they are unresolved. Open clusters need nothing: their stars are in the catalogues.
 */
export class DeepSkyLayer {
  readonly group = new Group();
  views: DeepSkyView[] = [];
  private glows = new Map<DeepSkyObject, Mesh>();
  private volumes = new Map<DeepSkyObject, Mesh>();
  private far = new Map<DeepSkyObject, Mesh>();
  private stars = new Map<DeepSkyObject, Points>();
  readonly gain = { value: 0.6 };
  private pixAng = { value: 1e-3 };

  constructor(readonly objects: DeepSkyObject[], psf: Record<string, { value: number }>, colorLut: DataTexture, vr = false) {
    this.group.name = 'deep-sky';
    const sphere = new SphereGeometry(1, 32, 16);
    const quad = new PlaneGeometry(2, 2);
    const noise = noise3D().tex;
    for (const o of objects) {
      const k = o.data.kind;
      if (k === 'open' && !LOOKS[o.name]?.reflection) continue;
      if (k === 'globular') {
        const m = new Mesh(quad, new ShaderMaterial({
          name: 'cluster-glow', vertexShader: BILL_VERT, fragmentShader: GLOW_FRAG,
          uniforms: { uGain: { value: 0 }, uClipScale: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
          transparent: true, depthWrite: false, blending: AdditiveBlending,
        }));
        m.matrixAutoUpdate = false;
        m.frustumCulled = false;
        m.renderOrder = -1;
        this.group.add(m);
        this.glows.set(o, m);
        const { pos, mt } = clusterStars(o, vr ? 8000 : 24000);
        const g = new BufferGeometry();
        g.setAttribute('aPos', new BufferAttribute(pos, 3));
        g.setAttribute('aMT', new BufferAttribute(mt, 1));
        g.setAttribute('position', new BufferAttribute(pos, 3));
        const mat = new ShaderMaterial({
          name: 'cluster-stars', vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
          uniforms: { ...psf, uOffset: { value: new Vector3() }, uScale: { value: 1 }, uAbsMin: { value: -12 }, uAbsStep: { value: 0.125 },
            uHideRadius: { value: 0 }, uExtinction: { value: 0 }, uColorLut: { value: colorLut } },
          transparent: true, depthWrite: false, depthTest: true, blending: AdditiveBlending,
        });
        const pts = new Points(g, mat);
        pts.frustumCulled = false;
        pts.matrixAutoUpdate = false;
        this.group.add(pts);
        this.stars.set(o, pts);
        continue;
      }
      // nebula frame: z along our line of sight (away from Earth), x towards the position angle
      const look = lookOf(o);
      const L = raDecToVector(o.data.ra, o.data.dec);
      const a = (o.data.ra * Math.PI) / 180, d = (o.data.dec * Math.PI) / 180, pa = (o.data.paDeg * Math.PI) / 180;
      const E = new Vector3(-Math.sin(a), Math.cos(a), 0);
      const N = new Vector3(-Math.sin(d) * Math.cos(a), -Math.sin(d) * Math.sin(a), Math.cos(d));
      const ex = N.clone().multiplyScalar(Math.cos(pa)).addScaledVector(E, Math.sin(pa)).normalize();
      const ey = new Vector3().crossVectors(L, ex).normalize();
      const rot = new Matrix3().set(ex.x, ex.y, ex.z, ey.x, ey.y, ey.z, L.x, L.y, L.z);
      const tilt = ((look.tilt ?? 0) * Math.PI) / 180;
      const type = look.reflection ? 3 : k === 'emission' ? 0 : k === 'planetary' ? 1 : 2;
      const m = new Mesh(sphere, new ShaderMaterial({
        name: 'nebula-volume', vertexShader: VOL_VERT, fragmentShader: VOL_FRAG,
        uniforms: {
          uNoise: { value: noise }, uCenter: { value: new Vector3() }, uRadius: { value: o.radius }, uRot: { value: rot },
          uType: { value: type }, uShape: { value: look.shape }, uSeed: { value: o.seed }, uGain: this.gain, uBright: { value: look.bright ?? 1 }, uFade: { value: 1 },
          uLite: LITE.uLite, uPixAng: this.pixAng, uAxes: { value: new Vector3(...(look.axes ?? [1, 1, 1])) },
          uAxis: { value: new Vector3(Math.sin(tilt), 0, Math.cos(tilt)) },
          uP: { value: new Vector4(...(look.p ?? [0.2, 0, 0, 0.3])) }, uQ: { value: new Vector4(...(look.q ?? [1, 3, 0, 0])) },
          uClipScale: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
        },
        transparent: true, depthWrite: false, blending: AdditiveBlending, side: BackSide,
      }));
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      m.renderOrder = -1;
      m.name = o.name;
      // drawn in the renderer's reduced-resolution volume pass
      m.layers.set(VOLUMES.layer);
      VOLUMES.meshes.add(m);
      this.group.add(m);
      this.volumes.set(o, m);
      // its far glow (about the volume's light when a few pixels across)
      const col: [number, number, number] = type === 3 ? [0.45, 0.6, 1.0] : type === 0 ? [1.0, 0.32, 0.4] : type === 1 ? [0.45, 0.9, 0.85] : [1.0, 0.55, 0.4];
      const amp = (type === 3 ? 0.3 : type === 0 ? 2.0 : type === 1 ? 1.5 : 1.0) * (look.bright ?? 1);
      const far = new Mesh(quad, new ShaderMaterial({
        name: 'nebula-far', vertexShader: BILL_VERT, fragmentShader: FAR_FRAG,
        uniforms: { uCol: { value: new Vector3(...col) }, uGain: this.gain, uAmp: { value: 0 }, uClipScale: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
        transparent: true, depthWrite: false, blending: AdditiveBlending,
      }));
      far.matrixAutoUpdate = false;
      far.frustumCulled = false;
      far.renderOrder = -1;
      far.userData.amp = amp;
      this.group.add(far);
      this.far.set(o, far);
    }
  }

  /** One nebula volume, for compiling its shader ahead of time. */
  warmupObjects(): Mesh[] {
    const v = this.volumes.values().next().value;
    return v ? [v] : [];
  }

  /** `camPc`: camera position (pc); `adapt`: dark adaptation (1 = dark-adapted). */
  update(cam: UPos, camPc: Vector3, pixelAngle: number, adapt: number): void {
    this.views = [];
    // (a pixel of the volume pass, which runs at reduced resolution: the noise's level of detail)
    this.pixAng.value = pixelAngle / Math.min(1, LITE.uLite.value > 0.5 ? VOLUMES.scaleXr : VOLUMES.scale);
    const rel = new Vector3();
    // inside a bright nebula the eye adapts to the glowing gas all around (no wash-out to white)
    let inside = 0;
    for (const o of this.volumes.keys()) {
      const k = o.upos.sub(cam, rel).length() / o.radius;
      if (k < 1.3) inside = Math.max(inside, (1.3 - Math.max(k, 0.3)) / 1.0 * (o.data.kind === 'emission' ? 1 : 0.5));
    }
    this.gain.value = 0.55 * Math.pow(Math.max(adapt, 0), 0.55) / (1 + 1.5 * inside);
    for (const o of this.objects) {
      o.upos.sub(cam, rel);
      const dist = rel.length();
      const pr = Math.atan2(o.radius, dist) / pixelAngle;
      this.views.push({ obj: o, rel: rel.clone(), dist, pixelRadius: pr });
      const vol = this.volumes.get(o);
      if (vol) {
        // below a few pixels the volume hands over to a glow that keeps its light
        const wFar = 1 - Math.min(1, Math.max(0, (pr - 3) / 6));
        const far = this.far.get(o)!;
        far.visible = wFar > 0.01 && pr > 0.01;
        if (far.visible) {
          const sPx = Math.max(pr, 1.5);
          const s = (sPx * pixelAngle) * dist;
          far.matrix.makeScale(s, s, s).setPosition(rel);
          far.matrixWorldNeedsUpdate = true;
          const fu = (far.material as ShaderMaterial).uniforms;
          fu.uAmp.value = far.userData.amp * (pr / sPx) ** 2 * wFar;
          fu.uClipScale.value = 1 / Math.max(dist, 1);
        }
        vol.visible = pr > 3 && wFar < 0.99;
        if (vol.visible) {
          const u = (vol.material as ShaderMaterial).uniforms;
          u.uFade.value = 1 - wFar;
          (u.uCenter.value as Vector3).copy(rel);
          u.uClipScale.value = 1 / Math.max(dist, o.radius);
          vol.matrix.makeScale(o.radius, o.radius, o.radius).setPosition(rel);
          vol.matrixWorldNeedsUpdate = true;
        }
      }
      const glow = this.glows.get(o);
      if (glow) {
        // the glow gives way to the cluster's stars as they resolve
        const fade = Math.min(1, Math.max(0, (dist / o.radius - 1.5) / 6));
        glow.visible = pr > 0.8 && fade > 0.01;
        if (glow.visible) {
          const s = o.radius * 0.8;
          glow.matrix.makeScale(s, s, s).setPosition(rel);
          glow.matrixWorldNeedsUpdate = true;
          const u = (glow.material as ShaderMaterial).uniforms;
          u.uClipScale.value = 1 / Math.max(dist, 1);
          u.uGain.value = this.gain.value * fade * 1.4;
        }
      }
      const pts = this.stars.get(o);
      if (pts) {
        (pts.material as ShaderMaterial).uniforms.uOffset.value.copy(o.posPc).sub(camPc);
        pts.visible = dist < o.radius * 400;
      }
    }
  }

  /**
   * [catalog] Add a nebula or cluster after construction (a catalogue destination), built like the
   * others (with the same psf / colour table / VR flag as the constructor got).
   */
  add(o: DeepSkyObject, psf: Record<string, { value: number }>, colorLut: DataTexture, vr = false): void {
    if (this.objects.includes(o)) return;
    const t = new DeepSkyLayer([o], psf, colorLut, vr);
    for (const c of [...t.group.children]) {
      const u = ((c as Mesh).material as ShaderMaterial | undefined)?.uniforms;
      if (u?.uGain === t.gain) u.uGain = this.gain;
      if (u?.uPixAng === t.pixAng) u.uPixAng = this.pixAng;
      this.group.add(c);
    }
    t.glows.forEach((v, k) => this.glows.set(k, v));
    t.volumes.forEach((v, k) => this.volumes.set(k, v));
    t.far.forEach((v, k) => this.far.set(k, v));
    t.stars.forEach((v, k) => this.stars.set(k, v));
    this.objects.push(o);
  }
}
