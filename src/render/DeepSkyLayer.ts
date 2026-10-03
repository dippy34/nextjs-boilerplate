import {
  AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, DataTexture, Group, Mesh, PlaneGeometry, Points, ShaderMaterial, SphereGeometry, Vector3,
} from 'three';
import { teffToLut } from '../astro/photometry';
import type { UPos } from '../core/upos';
import type { DeepSkyObject } from '../universe/DeepSky';
import { STAR_FRAG, STAR_VERT } from './StarField';
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

const NEB_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uType;    // 0 emission cloud, 1 planetary shell, 2 supernova filaments, 3 cluster glow
uniform float uSeed;
uniform float uGain;
uniform float uLite;
uniform float uFilled;  // supernova remnant filled with filaments (Crab-like pulsar wind nebula) instead of a shell
varying vec2 vP;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; int n = uLite > 0.5 ? 3 : 6; for (int i = 0; i < 6; i++) { if (i >= n) break; s += a * n2(p); p = p * 2.07 + 5.3; a *= 0.5; } return s; }
void main() {
  vec2 p = vP;
  float r = length(p);
  if (r > 1.0) discard;
  vec2 q = p * 2.2 + uSeed * 17.0;
  vec3 c = vec3(0.0);
  if (uType < 0.5) {
    // emission nebula: glowing hydrogen (red) with oxygen (teal) near the hot stars, dark dust lanes
    vec2 w = vec2(fbm(q + 3.1), fbm(q + 8.7)) - 0.5;
    float cloud = fbm(q + w * 2.2);
    float dens = smoothstep(0.35, 0.8, cloud) * (1.0 - smoothstep(0.45, 1.0, r));
    float core = exp(-r * r * 6.0) * smoothstep(0.3, 0.7, fbm(q * 1.7 + 1.0));
    float dust = smoothstep(0.55, 0.7, fbm(q * 2.3 + 9.0)) * smoothstep(1.0, 0.3, r);
    c = vec3(1.0, 0.22, 0.32) * dens * 1.3 + vec3(0.35, 0.95, 0.85) * core * 0.9 + vec3(0.6, 0.65, 1.0) * dens * core * 0.6;
    c *= 1.0 - 0.85 * dust;
  } else if (uType < 1.5) {
    // planetary nebula: a bright shell, teal inside, red at the rim
    float a = atan(p.y, p.x);
    float wob = 0.06 * (fbm(vec2(a * 2.0, uSeed * 9.0)) - 0.5);
    float shell = exp(-pow((r - 0.55 - wob) / 0.14, 2.0));
    float inner = exp(-pow(r / 0.42, 2.0)) * 0.7;
    float rim = exp(-pow((r - 0.75 - wob) / 0.12, 2.0));
    float grain = 0.75 + 0.5 * fbm(p * 9.0 + uSeed * 4.0);
    c = (vec3(0.3, 0.95, 0.9) * (inner + shell * 0.6) + vec3(1.0, 0.3, 0.35) * rim * 1.2) * grain;
    c += vec3(1.0) * exp(-r * r * 900.0) * 2.0; // the white dwarf
  } else if (uType < 2.5) {
    // supernova remnant: tangled filaments in an expanding shell
    float fil = 1.0 - abs(fbm(q * 1.6) * 2.0 - 1.0);
    fil = pow(fil, 6.0);
    float shell = mix(smoothstep(0.4, 0.85, r), 1.0, uFilled) * (1.0 - smoothstep(0.9, 1.0, r));
    c = mix(vec3(0.4, 0.75, 1.0), vec3(1.0, 0.35, 0.3), smoothstep(0.4, 0.7, fbm(q * 0.8 + 2.0))) * fil * shell * 2.0;
    c += vec3(0.55, 0.65, 1.0) * exp(-r * r * 5.0) * 0.6 * uFilled; // synchrotron glow around the pulsar
  } else {
    // an unresolved globular cluster: a soft yellowish ball of light
    c = vec3(1.0, 0.9, 0.72) * exp(-pow(r / 0.22, 1.1) * 2.3) * (1.0 - smoothstep(0.7, 1.0, r));
  }
  gl_FragColor = vec4(c * uGain, 1.0);
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

/**
 * Nebulae and star clusters: procedural emission clouds, planetary-nebula shells and supernova
 * filaments at their catalogued size; generated stars for globular clusters (drawn exactly like
 * catalogue stars) plus a glow while they are unresolved. Open clusters need nothing: their stars
 * are in the catalogues.
 */
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
 * Inside (or near) a nebula: the same procedural cloud as the billboards, as a volume. The view
 * ray is marched through the nebula's sphere, adding glowing gas and dimming it behind dark dust,
 * so flying in gives depth and parallax instead of a flat picture.
 */
const VOL_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uCenter;   // camera-relative (m)
uniform float uRadius;  // m
uniform float uType;    // 0 emission, 1 planetary shell, 2 supernova remnant
uniform float uSeed;
uniform float uGain;
uniform float uFade;
uniform float uLite;
uniform float uFilled;
uniform vec3 uAxis;     // symmetry axis (world)
uniform float uShape;   // planetary: 0 barrel/ring, 1 bipolar, 2 round with cavities
varying vec3 vPos;
float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float n3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p) { float s = 0.0, a = 0.5; int n = uLite > 0.5 ? 3 : 4; for (int i = 0; i < 4; i++) { if (i >= n) break; s += a * n3(p); p = p * 2.07 + 5.3; a *= 0.5; } return s / (1.0 - pow(0.5, float(n))); }
float ridge(vec3 p) { return 1.0 - abs(2.0 * n3(p) - 1.0); }
// cellular noise: distances to the nearest and second-nearest feature points (thin sheets where they meet)
vec2 vor3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 o = vec3(h31(i + g), h31(i + g + 17.13), h31(i + g + 43.71));
    vec3 r = g + o - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return vec2(sqrt(d1), sqrt(d2));
}
void main() {
  vec3 dir = normalize(vPos);
  // the ray from the eye through the nebula's sphere (unit radius around its centre)
  vec3 oc = -uCenter / uRadius;
  float b = dot(oc, dir);
  float c = dot(oc, oc) - 1.0;
  float disc = b * b - c;
  if (disc <= 0.0) discard;
  float sq = sqrt(disc);
  float t0 = max(-b - sq, 0.0), t1 = -b + sq;
  if (t1 <= t0) discard;
  int N = uLite > 0.5 ? 16 : 40;
  float dt = (t1 - t0) / float(N);
  // per-pixel jitter of the sample positions: no banding from the few steps
  float jit = h31(vec3(gl_FragCoord.xy, uSeed * 3.1));
  vec3 col = vec3(0.0);
  float T = 1.0;
  vec3 sd = vec3(uSeed * 17.0, uSeed * 29.0, uSeed * 7.0);
  for (int i = 0; i < 40; i++) {
    if (i >= N || T < 0.02) break;
    vec3 p = oc + dir * (t0 + (float(i) + jit) * dt);
    float r = length(p);
    vec3 e = vec3(0.0);
    float dust = 0.0;
    if (uType < 0.5) {
      // an H II region: a cavity blown out by the young hot stars at its heart, its walls broken
      // into glowing filaments and sheets, with dark dust pillars pointing at the stars
      vec3 q = p * 2.3 + sd;
      float big = fbm3(q * 0.7);
      float walls = smoothstep(0.12, 0.4, r + 0.25 * (big - 0.5)) * (1.0 - smoothstep(0.7, 1.0, r));
      float fil = pow(ridge(q * 1.6 + big), 6.0) + 0.7 * pow(ridge(q * 3.7 + 4.0), 9.0);
      float dens = walls * (0.06 * smoothstep(0.4, 0.85, fbm3(q)) + 2.2 * fil * smoothstep(0.2, 0.55, big));
      // lit from the centre: brighter walls facing the stars; teal (oxygen) near them, red (hydrogen) beyond
      float ion = 0.12 / (0.06 + r * r);
      vec3 tint = mix(vec3(0.25, 1.0, 0.8), mix(vec3(1.0, 0.16, 0.28), vec3(1.0, 0.38, 0.5), big), smoothstep(0.1, 0.4, r));
      e = tint * dens * ion * 7.0;
      // dust: lanes and pillars (dense, with lit rims)
      vec3 u = normalize(p + 1e-4);
      float pillar = smoothstep(0.66, 0.8, n3(u * 5.0 + sd)) * smoothstep(0.35, 0.55, r) * (1.0 - smoothstep(0.75, 0.95, r));
      float lane = smoothstep(0.6, 0.78, fbm3(q * 1.3 + 9.0)) * smoothstep(0.3, 0.6, r);
      dust = (pillar * 9.0 + lane * 3.5) * (0.6 + 0.8 * n3(q * 4.0));
      e += vec3(1.0, 0.55, 0.35) * pillar * ion * 0.35;   // bright rims of the pillars
    } else if (uType < 1.5) {
      // planetary nebula: a shell of gas thrown off by the dying star, lit by its hot core: teal
      // [O III] inside, red [N II]/H-alpha outside, knots and radial spokes at the edge, a faint halo
      float ca = dot(p, uAxis);
      vec3 perp = p - uAxis * ca;
      float rp = length(perp);
      float re, dens;
      float wob = 0.06 * (fbm3(p * 4.0 + sd) - 0.5);
      if (uShape < 0.5) {
        // barrel (a ring when seen end-on): prolate, thinner towards the axis
        re = length(vec2(rp, ca / 1.45));
        dens = exp(-pow((re - 0.5 - wob) / 0.1, 2.0)) * smoothstep(0.12, 0.6, rp / max(re, 1e-3)) * 1.6;
        dens += 0.12 * smoothstep(0.5, 0.2, re);    // fainter gas filling the cavity
      } else if (uShape < 1.5) {
        // bipolar: two lobes along the axis, pinched by a dense waist
        vec3 c1 = uAxis * 0.4;
        float d1 = length(p - c1), d2 = length(p + c1);
        float lobes = exp(-pow((d1 - 0.38 - wob) / 0.07, 2.0)) + exp(-pow((d2 - 0.38 - wob) / 0.07, 2.0));
        lobes += 0.25 * (smoothstep(0.38, 0.1, d1) + smoothstep(0.38, 0.1, d2));
        float waist = exp(-pow((rp - 0.22) / 0.06, 2.0) - ca * ca / 0.004);
        dens = lobes * 1.3 + waist * 2.0;
        re = min(d1, d2) + 0.15;
      } else {
        // round shell with two dark cavities (the Owl)
        re = length(p);
        vec3 side = normalize(cross(uAxis, vec3(0.31, 0.95, 0.12)));
        float e1 = smoothstep(0.1, 0.2, length(p - side * 0.2)), e2 = smoothstep(0.1, 0.2, length(p + side * 0.2));
        dens = smoothstep(0.75, 0.55, re + wob) * (0.6 + 0.4 * fbm3(p * 6.0 + sd)) * e1 * e2;
      }
      // knots and radial spokes
      vec3 u = normalize(p + 1e-4);
      float spokes = 0.55 + 0.9 * pow(n3(u * 26.0 + sd), 3.0);
      float knots = 0.7 + 0.8 * smoothstep(0.55, 0.85, n3(p * 22.0 + sd * 2.0));
      dens *= spokes * knots;
      vec3 tint = mix(vec3(0.25, 0.95, 0.85), vec3(1.0, 0.22, 0.3), smoothstep(0.4, 0.62, re));
      float halo = 0.1 * exp(-pow((length(p) - 0.88) / 0.07, 2.0)) * (0.3 + 1.4 * ridge(p * 5.0 + sd));
      e = (tint * dens + vec3(1.0, 0.3, 0.35) * halo) * 1.4;
    } else {
      // supernova remnant: a web of thin filaments (cell walls of the shock), over a blue
      // synchrotron glow when a pulsar fills it (the Crab), or on a thin shell (Veil, Cas A)
      float ca = dot(p, uAxis);
      vec3 q = p - uAxis * ca * 0.3;     // a little elongated along the axis
      float r = length(q);
      vec2 v1 = uLite > 0.5 ? vec2(0.0, 1.0) : vor3(p * 3.2 + sd);
      float web1 = uLite > 0.5 ? pow(ridge(p * 3.2 + sd), 6.0) : 1.0 - smoothstep(0.0, 0.07, v1.y - v1.x);
      vec2 v2 = uLite > 0.5 ? vec2(0.0, 1.0) : vor3(p * 7.5 + sd * 1.7);
      float web2 = uLite > 0.5 ? 0.0 : 1.0 - smoothstep(0.0, 0.1, v2.y - v2.x);
      float web = web1 * 0.8 + web2 * 0.45;
      float region = fbm3(p * 1.5 + sd + 2.0);
      if (uFilled > 0.5) {
        float body = smoothstep(0.95, 0.65, r + 0.1 * (fbm3(p * 3.0 + sd) - 0.5));
        vec3 fil = mix(vec3(1.0, 0.45, 0.22), vec3(1.0, 0.75, 0.5), smoothstep(0.4, 0.8, region));
        vec3 sync = vec3(0.55, 0.72, 1.0) * smoothstep(0.85, 0.1, r) * (0.35 + 0.5 * fbm3(p * 9.0 + sd));
        e = (fil * web * body * 2.6 + sync * 0.9);
      } else {
        float shell = exp(-pow((r - 0.82 - 0.1 * (fbm3(p * 2.0 + sd) - 0.5)) / 0.09, 2.0));
        vec3 fil = mix(vec3(1.0, 0.3, 0.32), vec3(0.35, 0.8, 1.0), smoothstep(0.35, 0.65, region));
        e = fil * shell * (0.15 + 2.6 * web);
      }
    }
    col += T * e * dt;
    T *= exp(-dust * dt);
  }
  // the young star cluster at the heart of an emission nebula: bright blue-white stars with halos
  if (uType < 0.5) {
    for (int k = 0; k < 6; k++) {
      vec3 sp = (vec3(h31(sd + float(k)), h31(sd + float(k) + 11.0), h31(sd + float(k) + 23.0)) - 0.5) * 0.16;
      float ts = dot(sp - oc, dir);
      if (ts <= 0.0) continue;
      float d = length(oc + dir * ts - sp) / max(ts, 1e-3);   // angular distance from the star (rad)
      float L = 0.5 + h31(sd + float(k) * 3.7);
      col += vec3(0.7, 0.82, 1.0) * L * (exp(-pow(d / 0.003, 2.0)) * 8.0 + 0.06 / (1.0 + pow(d / 0.015, 2.0)));
    }
  }
  // the dying star at a planetary nebula's centre, the pulsar in a filled remnant
  if (uType > 0.5 && (uType < 1.5 || uFilled > 0.5)) {
    float ts = dot(-oc, dir);
    if (ts > 0.0) {
      float d = length(oc + dir * ts) / max(ts, 1e-3);
      col += vec3(0.8, 0.88, 1.0) * (exp(-pow(d / 0.002, 2.0)) * 10.0 + 0.04 / (1.0 + pow(d / 0.01, 2.0)));
    }
  }
  // a chord through the middle (length 2) gives about the billboards' brightness
  gl_FragColor = vec4(col * 0.7 * uGain * uFade, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/**
 * Shape and symmetry axis of a nebula's volume: the well-known planetary nebulae as they are seen
 * from Earth (the Ring and the Helix are barrels seen nearly end-on, the Dumbbell a bipolar nebula
 * seen side-on, the Owl a round shell with two cavities); others from their seed.
 */
function nebulaShape(o: DeepSkyObject): { shape: number; axis: Vector3 } {
  const los = o.posPc.clone().normalize();
  const known: Record<string, [number, number]> = {
    'Ring Nebula': [0, 25], 'Helix Nebula': [0, 18], 'Southern Ring Nebula': [0, 45], 'Eskimo Nebula': [0, 10],
    'Dumbbell Nebula': [1, 80], "Cat's Eye Nebula": [1, 50], 'Owl Nebula': [2, 0], 'Crab Nebula': [0, 70],
  };
  const r = rnd(o.seed + 0.5);
  const [shape, tiltDeg] = known[o.name] ?? [r() < 0.5 ? 0 : 1, 90 * r()];
  const ref = Math.abs(los.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0);
  const perp = new Vector3().crossVectors(los, ref).normalize().applyAxisAngle(los, r() * Math.PI * 2);
  const t = (tiltDeg * Math.PI) / 180;
  return { shape, axis: los.multiplyScalar(Math.cos(t)).addScaledVector(perp, Math.sin(t)).normalize() };
}

export class DeepSkyLayer {
  readonly group = new Group();
  views: DeepSkyView[] = [];
  private quads = new Map<DeepSkyObject, Mesh[]>();
  private stars = new Map<DeepSkyObject, Points>();
  private quad = new PlaneGeometry(2, 2);
  readonly gain = { value: 0.6 };
  /** the nebula volume shown when the explorer is close to (or inside) a nebula */
  private volume: Mesh;

  constructor(readonly objects: DeepSkyObject[], psf: Record<string, { value: number }>, colorLut: DataTexture, vr = false) {
    this.group.name = 'deep-sky';
    this.volume = new Mesh(new SphereGeometry(1, 32, 16), new ShaderMaterial({
      name: 'nebula-volume', vertexShader: VOL_VERT, fragmentShader: VOL_FRAG,
      uniforms: { uCenter: { value: new Vector3() }, uRadius: { value: 1 }, uType: { value: 0 }, uSeed: { value: 0 }, uGain: this.gain,
        uFade: { value: 0 }, uLite: LITE.uLite, uFilled: { value: 0 }, uAxis: { value: new Vector3(0, 0, 1) }, uShape: { value: 0 },
        uClipScale: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
      transparent: true, depthWrite: false, blending: AdditiveBlending, side: BackSide,
    }));
    this.volume.matrixAutoUpdate = false;
    this.volume.frustumCulled = false;
    this.volume.visible = false;
    this.volume.renderOrder = -1;
    this.group.add(this.volume);
    for (const o of objects) {
      const k = o.data.kind;
      if (k === 'open') continue;
      const meshes: Mesh[] = [];
      const make = (type: number, size: number, offset: Vector3, seed: number) => {
        const m = new Mesh(this.quad, new ShaderMaterial({
          name: 'nebula', vertexShader: BILL_VERT, fragmentShader: NEB_FRAG,
          uniforms: { uType: { value: type }, uSeed: { value: seed }, uGain: type === 3 ? { value: 0 } : this.gain, uClipScale: { value: 1 }, uLite: LITE.uLite,
            uFilled: { value: /Crab/.test(o.name) ? 1 : 0 },
            uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
          transparent: true, depthWrite: false, blending: AdditiveBlending,
        }));
        m.matrixAutoUpdate = false;
        m.frustumCulled = false;
        m.renderOrder = -1;
        m.userData = { size, offset };
        this.group.add(m);
        meshes.push(m);
      };
      const r = rnd(o.seed);
      if (k === 'emission') {
        // a few overlapping cloud layers at different depths: parallax when flying through
        for (let i = 0; i < 5; i++) make(0, 0.55 + 0.5 * r(), new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.7), r());
      } else if (k === 'planetary') make(1, 1.0, new Vector3(), o.seed);
      else if (k === 'snr') { make(2, 1.0, new Vector3(), o.seed); make(2, 0.9, new Vector3(0, 0, 0.1), (o.seed + 0.37) % 1); }
      else if (k === 'globular') {
        make(3, 0.8, new Vector3(), o.seed);
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
      }
      this.quads.set(o, meshes);
    }
  }

  /** The nebula volume, for compiling its shader ahead of time. */
  warmupObjects(): Mesh[] {
    return [this.volume];
  }

  /** `camPc`: camera position (pc); `adapt`: dark adaptation (1 = dark-adapted). */
  update(cam: UPos, camPc: Vector3, pixelAngle: number, adapt: number): void {
    this.views = [];
    this.gain.value = 0.55 * Math.pow(Math.max(adapt, 0), 0.55);
    const rel = new Vector3();
    // the nearest nebula (in its radii) gets the volume when the explorer is close
    let near: DeepSkyObject | null = null, nearK = Infinity;
    for (const o of this.objects) {
      if (o.data.kind === 'open' || o.data.kind === 'globular') continue;
      const k = o.upos.sub(cam, rel).length() / o.radius;
      if (k < nearK) { nearK = k; near = o; }
    }
    const volW = near ? Math.min(1, Math.max(0, (8 - nearK) / 3)) : 0;   // fades in from 8 to 5 radii
    this.volume.visible = volW > 0.01;
    if (near && this.volume.visible) {
      near.upos.sub(cam, rel);
      const u = (this.volume.material as ShaderMaterial).uniforms;
      (u.uCenter.value as Vector3).copy(rel);
      u.uRadius.value = near.radius;
      u.uType.value = near.data.kind === 'emission' ? 0 : near.data.kind === 'planetary' ? 1 : 2;
      u.uSeed.value = near.seed;
      u.uFilled.value = /Crab/.test(near.name) ? 1 : 0;
      const sh = nebulaShape(near);
      u.uShape.value = sh.shape;
      (u.uAxis.value as Vector3).copy(sh.axis);
      u.uFade.value = volW;
      u.uClipScale.value = 1 / Math.max(rel.length(), near.radius);
      this.volume.matrix.makeScale(near.radius, near.radius, near.radius).setPosition(rel);
      this.volume.matrixWorldNeedsUpdate = true;
    }
    for (const o of this.objects) {
      o.upos.sub(cam, rel);
      const dist = rel.length();
      const pr = Math.atan2(o.radius, dist) / pixelAngle;
      this.views.push({ obj: o, rel: rel.clone(), dist, pixelRadius: pr });
      const meshes = this.quads.get(o);
      if (meshes) {
        // a globular cluster's glow gives way to its stars as they resolve
        const fade = o.data.kind === 'globular' ? Math.min(1, Math.max(0, (dist / o.radius - 1.5) / 6)) : 1;
        for (const m of meshes) {
          const { size, offset } = m.userData as { size: number; offset: Vector3 };
          // (the billboards give way to the volume up close)
          const billW = o === near ? 1 - volW : 1;
          m.visible = pr > 0.8 && fade > 0.01 && billW > 0.01;
          if (!m.visible) continue;
          const p = rel.clone().addScaledVector(offset, o.radius);
          const s = o.radius * size;
          m.matrix.makeScale(s, s, s).setPosition(p);
          m.matrixWorldNeedsUpdate = true;
          const u = (m.material as ShaderMaterial).uniforms;
          u.uClipScale.value = 1 / Math.max(p.length(), 1);
          if (o.data.kind === 'globular') u.uGain.value = this.gain.value * fade * 1.4;
          else if (o === near && billW < 1) {
            if (u.uGain === this.gain) u.uGain = { value: 0 };
            u.uGain.value = this.gain.value * billW;
          } else if (u.uGain !== this.gain) u.uGain = this.gain;
        }
      }
      const pts = this.stars.get(o);
      if (pts) {
        (pts.material as ShaderMaterial).uniforms.uOffset.value.copy(o.posPc).sub(camPc);
        pts.visible = dist < o.radius * 400;
      }
    }
  }
}
