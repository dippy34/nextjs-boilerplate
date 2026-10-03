import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Group, Matrix4, Mesh, PlaneGeometry, Points, Quaternion, ShaderMaterial, Vector3 } from 'three';
import type { UPos } from '../core/upos';
import type { Galaxy, GalaxyShape } from '../universe/Galaxies';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, POINT_CLIP, PROJECT_PARS } from './shaders/xr';

const VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
uniform float uClipScale;
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
  // one factor for the whole quad: keeps clip coordinates of objects megaparsecs away far from
  // float overflow in clipping, without changing the projection or perspective interpolation
  gl_Position *= uClipScale;
}`;

/** A face-on galaxy disc in the quad's plane (units: the catalogued radius). */
const DISC_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uGain;
uniform float uSeed;
uniform float uArms;      // number of arms (0 = none)
uniform float uPitch;     // arm pitch angle (rad)
uniform float uBar;       // bar strength
uniform float uBulge;     // bulge-to-disk weight
uniform float uClumpy;    // irregular: patchy star-forming regions instead of arms
uniform float uDust;
uniform float uLite;
varying vec2 vP;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; int n = uLite > 0.5 ? 3 : 5; for (int i = 0; i < 5; i++) { if (i >= n) break; s += a * n2(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
void main() {
  vec2 p = vP * 1.3;                       // quad spans 1.3 radii
  float r = length(p);
  if (r > 1.3) discard;
  float th = atan(p.y, p.x);
  float disk = exp(-r / 0.24);
  float warp = fbm(p * 2.5 + uSeed * 9.0) - 0.5;
  // logarithmic spiral arms, broken up into star clouds; weaker secondary arms in between
  float arms = 0.0, phase = 0.0;
  if (uArms > 0.5) {
    phase = th - log(max(r, 0.02)) / tan(uPitch) + uSeed * 6.283 + warp * 1.8;
    float a = 0.5 + 0.5 * cos(uArms * phase);
    float a2 = 0.5 + 0.5 * cos(2.0 * uArms * phase + 1.3);
    float clouds = 0.35 + 0.9 * fbm(p * 7.0 + uSeed * 4.0);
    arms = (pow(a, 4.0) + 0.3 * pow(a2, 6.0)) * clouds * smoothstep(0.06, 0.22, r);
  }
  // irregulars: knots of star formation
  float knots = uClumpy * smoothstep(0.5, 0.85, fbm(p * 4.0 + uSeed * 13.0));
  float bar = uBar * exp(-pow(abs(p.x) / 0.3, 2.0) - pow(abs(p.y) / 0.07, 2.0));
  float bulge = uBulge * exp(-pow(r / 0.05, 0.55) * 2.0);
  float grain = 0.7 + 0.6 * fbm(p * 16.0 + uSeed * 5.0);
  vec3 old = vec3(1.0, 0.86, 0.68), young = vec3(0.6, 0.73, 1.0), hii = vec3(1.0, 0.42, 0.58);
  vec3 c = old * (disk * (0.4 + 0.3 * grain) + bar * 0.9) + vec3(1.0, 0.82, 0.58) * bulge * 1.8;
  c += young * disk * (arms * 1.7 + knots * 1.4) * grain;
  // bright knots: young clusters and nebulae along the arms
  float spots = smoothstep(0.78, 0.92, fbm(p * 22.0 + uSeed * 3.0));
  c += hii * disk * spots * (arms + knots) * 1.6;
  c += young * disk * smoothstep(0.9, 0.97, n2(p * 120.0 + uSeed * 31.0)) * (arms + 0.2) * 1.2;
  // dust lanes along the inner edges of the arms, patchy
  if (uArms > 0.5 && uDust > 0.0) {
    float lane = pow(0.5 + 0.5 * cos(uArms * (phase + 0.32)), 6.0) * smoothstep(0.08, 0.28, r);
    c *= 1.0 - uDust * 0.65 * lane * (0.5 + 0.8 * fbm(p * 9.0 + uSeed * 2.0));
  }
  c *= 1.0 - smoothstep(0.95, 1.3, r);
  gl_FragColor = vec4(c * uGain, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/** Spheroids (bulges, ellipticals, dwarf spheroidals): a soft glow facing the viewer. */
const BLOB_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uGain;
uniform float uSersic;   // profile sharpness: 0.25 (de Vaucouleurs) .. 1 (exponential)
uniform vec3 uTint;
varying vec2 vP;
void main() {
  float r = length(vP);
  if (r > 1.0) discard;
  float I = exp(-7.0 * (pow(r / 0.35, uSersic) - 0.0)) ;
  I *= 1.0 - smoothstep(0.7, 1.0, r);
  gl_FragColor = vec4(uTint * I * uGain, 1.0);
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
varying vec3 vCol;
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
  vCol = aFlux * sb * uGain * uWeight * big;
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
  const fDisc = disc ? 0.22 : 0, fArms = look.arms > 0 ? 0.2 : look.clumpy > 0 ? 0.14 : 0;
  const fBulge = disc ? 0.02 + 0.05 * look.bulge + 0.03 * look.bar : 0.25 * (g.shape === 'dwarf' ? 0.3 : 1);
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

interface Look { arms: number; pitchDeg: number; bar: number; bulge: number; clumpy: number; dust: number; blob: number; sersic: number }

function lookFor(g: Galaxy): Look {
  const m = g.data.morph;
  const stage = /S[AB_()s]*[ab]?([abcdm])/.exec(m)?.[1] ?? (g.shape === 'spiral' || g.shape === 'barred' ? 'b' : '');
  const pitch = { a: 9, b: 14, c: 20, d: 25, m: 28 }[stage] ?? 14;
  const bulge = { a: 1.0, b: 0.6, c: 0.3, d: 0.15, m: 0.1 }[stage] ?? 0.5;
  const looks: Record<GalaxyShape, Look> = {
    spiral: { arms: 2, pitchDeg: pitch, bar: 0, bulge, clumpy: 0.25, dust: 0.8, blob: 0.25 + 0.2 * bulge, sersic: 0.35 },
    barred: { arms: 2, pitchDeg: pitch, bar: 0.9, bulge, clumpy: 0.25, dust: 0.8, blob: 0.22 + 0.2 * bulge, sersic: 0.35 },
    lenticular: { arms: 0, pitchDeg: 14, bar: 0, bulge: 1.2, clumpy: 0, dust: 0, blob: 0.45, sersic: 0.3 },
    irregular: { arms: 0, pitchDeg: 14, bar: 0.25, bulge: 0.1, clumpy: 1, dust: 0, blob: 0, sersic: 1 },
    elliptical: { arms: 0, pitchDeg: 0, bar: 0, bulge: 0, clumpy: 0, dust: 0, blob: 1, sersic: 0.28 },
    dwarf: { arms: 0, pitchDeg: 0, bar: 0, bulge: 0, clumpy: 0, dust: 0, blob: 1, sersic: 0.9 },
  };
  const l = looks[g.shape];
  // Sombrero-like: a big bulge and a dark lane
  if (/Sombrero/.test(g.name)) return { ...l, bulge: 1.4, blob: 0.7, dust: 1 };
  return l;
}

export interface GalaxyView { galaxy: Galaxy; rel: Vector3; dist: number; pixelRadius: number }

/**
 * Other galaxies: a procedural disc (spiral arms, bar, dust, star-forming knots) in each catalogued
 * disc plane plus a bulge, or a spheroid glow for ellipticals and dwarfs. Brightness follows the
 * eye's adaptation like the Milky Way's glow; near the Sun they are hidden (the sky photo has them).
 */
export class GalaxiesLayer {
  readonly group = new Group();
  views: GalaxyView[] = [];
  private discs = new Map<Galaxy, Mesh>();
  private blobs = new Map<Galaxy, Mesh>();
  private quad = new PlaneGeometry(2, 2);
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
        uMaxPx: { value: vr ? 48 : 160 }, uClipScale: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
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
      const common = { uGain: this.gain, uClipScale: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK, uLite: LITE.uLite };
      if (look.arms > 0 || look.bar > 0 || look.clumpy > 0 || g.shape === 'lenticular') {
        const m = new Mesh(this.quad, new ShaderMaterial({
          name: 'galaxy-disc', vertexShader: VERT, fragmentShader: DISC_FRAG, side: DoubleSide,
          uniforms: { ...common, uClipScale: { value: 1 }, uSeed: { value: g.seed }, uArms: { value: look.arms }, uPitch: { value: (look.pitchDeg * Math.PI) / 180 },
            uBar: { value: look.bar }, uBulge: { value: look.bulge }, uClumpy: { value: look.clumpy }, uDust: { value: look.dust } },
          transparent: true, depthWrite: false, blending: AdditiveBlending,
        }));
        m.matrixAutoUpdate = false;
        m.frustumCulled = false;
        m.renderOrder = -1;
        m.name = g.name;
        this.group.add(m);
        this.discs.set(g, m);
      }
      if (look.blob > 0) {
        const tint = g.shape === 'dwarf' ? new Vector3(0.95, 0.9, 0.85) : new Vector3(1.0, 0.86, 0.68);
        const b = new Mesh(this.quad, new ShaderMaterial({
          name: 'galaxy-bulge', vertexShader: VERT, fragmentShader: BLOB_FRAG,
          uniforms: { ...common, uClipScale: { value: 1 }, uSersic: { value: look.sersic }, uTint: { value: tint.multiplyScalar(g.shape === 'dwarf' ? 0.35 : 1.2) } },
          transparent: true, depthWrite: false, blending: AdditiveBlending,
        }));
        b.matrixAutoUpdate = false;
        b.frustumCulled = false;
        b.renderOrder = -1;
        b.userData.size = look.blob;
        this.group.add(b);
        this.blobs.set(g, b);
      }
    }
  }

  /** The galaxy cloud, for compiling its shader ahead of time. */
  warmupObjects(): Points[] {
    return [this.cloud];
  }

  /**
   * `adapt`: the eye's dark adaptation (1 = dark-adapted); `fade`: 0 near the Sun (the sky photo
   * shows these galaxies), 1 once the photo has faded out. `viewQuat`: view orientation (for the glows).
   */
  update(cam: UPos, pixelAngle: number, adapt: number, fade: number, viewQuat: Quaternion): void {
    this.views = [];
    this.gain.value = 0.9 * Math.pow(Math.max(adapt, 0), 0.55) * fade;
    this.group.visible = fade > 0.001;
    const rel = new Vector3();
    const m = new Matrix4();
    const right = new Vector3(1, 0, 0).applyQuaternion(viewQuat), up = new Vector3(0, 1, 0).applyQuaternion(viewQuat);
    // the nearest galaxy (in its radii) becomes a 3D cloud from 40 radii in
    let near: Galaxy | null = null, nearK = Infinity;
    for (const g of this.galaxies) {
      const k = g.upos.sub(cam, rel).length() / g.radius;
      if (k < nearK) { nearK = k; near = g; }
    }
    const wCloud = fade > 0.001 && near ? Math.min(1, Math.max(0, (40 - nearK) / 15)) : 0;
    this.cloud.visible = wCloud > 0.001;
    if (near && this.cloud.visible) {
      if (this.cloudOf !== near) {
        const geo = this.cloud.geometry;
        const cnt = fillCloud(near, this.looks.get(near)!, geo.attributes.aStar.array as Float32Array, geo.attributes.aFlux.array as Float32Array, this.nClouds, this.nStars);
        geo.setDrawRange(0, cnt);
        geo.attributes.aStar.needsUpdate = true;
        geo.attributes.aFlux.needsUpdate = true;
        this.cloudOf = near;
      }
      near.upos.sub(cam, rel);
      const R = near.radius;
      this.cloud.matrix.makeBasis(near.major.clone().multiplyScalar(R), near.minor.clone().multiplyScalar(R), near.normal.clone().multiplyScalar(R)).setPosition(rel);
      this.cloud.matrixWorldNeedsUpdate = true;
      const u = (this.cloud.material as ShaderMaterial).uniforms;
      u.uRadius.value = R;
      u.uWeight.value = wCloud;
      u.uClipScale.value = 1 / Math.max(rel.length(), R);
    }
    for (const g of this.galaxies) {
      g.upos.sub(cam, rel);
      const dist = rel.length();
      const pr = Math.atan2(g.radius, dist) / pixelAngle;
      if (fade > 0.001) this.views.push({ galaxy: g, rel: rel.clone(), dist, pixelRadius: pr });
      const visible = fade > 0.001 && pr > 0.7;
      const clip = 1 / Math.max(dist, 1);
      // the picture gives way to the cloud
      const pic = g === near ? 1 - wCloud : 1;
      const disc = this.discs.get(g);
      if (disc) {
        disc.visible = visible;
        const du = (disc.material as ShaderMaterial).uniforms;
        if (pic < 1) { if (du.uGain === this.gain) du.uGain = { value: 0 }; du.uGain.value = this.gain.value * pic; }
        else if (du.uGain !== this.gain) du.uGain = this.gain;
        if (visible) {
          const R = g.radius;
          m.makeBasis(g.major.clone().multiplyScalar(R), g.minor.clone().multiplyScalar(R), g.normal.clone().multiplyScalar(R)).setPosition(rel);
          disc.matrix.copy(m);
          disc.matrixWorldNeedsUpdate = true;
          (disc.material as ShaderMaterial).uniforms.uClipScale.value = clip;
        }
      }
      const blob = this.blobs.get(g);
      if (blob) {
        blob.visible = visible;
        const bu = (blob.material as ShaderMaterial).uniforms;
        if (pic < 1) { if (bu.uGain === this.gain) bu.uGain = { value: 0 }; bu.uGain.value = this.gain.value * pic; }
        else if (bu.uGain !== this.gain) bu.uGain = this.gain;
        if (visible) {
          // spheroid: elongated along the projected major axis by the catalogued axis ratio
          const s = g.radius * (blob.userData.size as number);
          const ax = g.major.clone().sub(rel.clone().normalize().multiplyScalar(g.major.dot(rel.clone().normalize()))).normalize();
          const view = rel.clone().normalize();
          const ay = new Vector3().crossVectors(view, ax).normalize();
          const ratio = g.shape === 'elliptical' || g.shape === 'dwarf' ? Math.max(g.ratio, 0.3) : 0.75;
          if (!Number.isFinite(ax.x)) ax.copy(right), ay.copy(up);
          m.makeBasis(ax.multiplyScalar(s), ay.multiplyScalar(s * ratio), view.clone().multiplyScalar(s)).setPosition(rel);
          blob.matrix.copy(m);
          blob.matrixWorldNeedsUpdate = true;
          (blob.material as ShaderMaterial).uniforms.uClipScale.value = clip;
        }
      }
    }
  }
}
