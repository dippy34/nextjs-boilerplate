import { AdditiveBlending, BufferAttribute, BufferGeometry, Matrix3, Points, ShaderMaterial, Vector3, Vector4 } from 'three';
import type { Galaxy } from '../universe/Galaxies';
import { DUST_TAU, GAL_MODEL, type GalaxyModel, smooth } from './GalaxiesLayer';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, POINT_CLIP, PROJECT_PARS } from './shaders/xr';

/**
 * The star clusters and nebulae of the galaxy the explorer is near or inside, as soft sprites of a
 * fixed size in space (parallax, growing as you fly up to them):
 *  - globular clusters: a halo swarm (metal-poor, round, extended) and a concentrated, flattened
 *    metal-rich bulge/thick-disc group; counts from the galaxy's luminosity and type (specific
 *    frequency), magnitudes from the globular luminosity function (M_V -7.4 ± 1.2), concentrated
 *    King-like profiles a few parsecs across;
 *  - open clusters: compact blue-white knots of young stars in the arms;
 *  - H II regions: pink emission nebulae tens of parsecs across, irregular (3D noise), along the arms.
 * Their light is tiny next to the galaxy's (a few thousandths), so the volume keeps all of its own.
 * Every choice is a hash of the galaxy's seed: the same clusters each visit.
 */

export const KIND_GLOBULAR = 0, KIND_OPEN = 1, KIND_HII = 2;
const PC_M = 3.0856775814913673e16;

/** Globular clusters per 10^(-0.4 (M_V + 15)) of galaxy light, by type (Harris & van den Bergh). */
const SPECIFIC_FREQ: Record<Galaxy['shape'], number> = { elliptical: 4, lenticular: 2, spiral: 1, barred: 1, irregular: 0.5, dwarf: 2 };
export const MAX_GLOBULARS = 2500, MAX_OPEN = 3000, MAX_HII = 1200;

export interface ClusterSystem {
  /** x, y, z (galaxy frame, radii), sprite radius (radii) */
  pos: Float32Array;
  /** colour x share of the galaxy's light (the volume's units: x model.bright) */
  flux: Float32Array;
  /** kind, per-sprite seed */
  kind: Float32Array;
  count: number;
  globulars: number;
}

function rng(seed: number): () => number {
  let a = Math.floor(seed * 4294967295) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** absolute V magnitude of a galaxy from its catalogue entry */
export function galaxyAbsMag(g: Galaxy): number {
  const dm = 5 * Math.log10(g.data.distPc / 10);
  return g.data.vmag !== null ? g.data.vmag - dm : g.shape === 'dwarf' ? -11 : -16;
}

/** Expected number of globular clusters of a galaxy (specific frequency x luminosity), capped. */
export function globularCount(g: Galaxy): number {
  const n = SPECIFIC_FREQ[g.shape] * 10 ** (-0.4 * (galaxyAbsMag(g) + 15));
  return Math.max(g.shape === 'irregular' ? 0 : 3, Math.min(MAX_GLOBULARS, Math.round(n)));
}

/** Build the cluster system of a galaxy (deterministic). `vr`: fewer open clusters and nebulae. */
export function buildClusters(model: GalaxyModel, vr = false): ClusterSystem {
  const it = clusterGen(model, vr);
  let v = it.next();
  while (!v.done) v = it.next();
  return v.value;
}

/** buildClusters spread over frames: yields every few hundred tries (`count` grows as it goes). */
export function* clusterGen(model: GalaxyModel, vr = false): Generator<void, ClusterSystem> {
  const g = model.g;
  const r = rng((g.seed * 7.31 + 0.417) % 1);
  const rpc = g.radius / PC_M;
  const Mg = galaxyAbsMag(g);
  const share = (M: number) => 10 ** (-0.4 * (M - Mg));      // a cluster's share of the galaxy's light
  const B = model.bright;
  const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(6.2832 * r());
  const nG = globularCount(g);
  const fy = model.frac[3] + model.frac[4] + model.frac[6];
  const lumK = Math.sqrt(10 ** (-0.4 * (Mg + 21.5)));        // ~1 for an M31-like galaxy
  const nO = fy > 0.01 ? Math.min(vr ? MAX_OPEN / 3 : MAX_OPEN, Math.round(9000 * fy * lumK)) : 0;
  const nH = fy > 0.01 ? Math.min(vr ? MAX_HII / 2 : MAX_HII, Math.round(3500 * fy * lumK)) : 0;
  const nucleus = model.frac[0] > 0.05 ? 1 : 0;
  const n = nG + nO + nH + nucleus;
  const pos = new Float32Array(n * 4), flux = new Float32Array(n * 3), kind = new Float32Array(n * 2);
  let k = 0;
  const put = (x: number, y: number, z: number, size: number, c: number[], f: number, kd: number) => {
    pos[k * 4] = x; pos[k * 4 + 1] = y; pos[k * 4 + 2] = z; pos[k * 4 + 3] = size;
    flux[k * 3] = c[0] * f * B; flux[k * 3 + 1] = c[1] * f * B; flux[k * 3 + 2] = c[2] * f * B;
    kind[k * 2] = kd; kind[k * 2 + 1] = r();
    k++;
  };
  // globulars: Hernquist radial profiles (N(<r) = (r / (r + a))²), sizes ~ the galaxy's
  const reach = Math.max(model.ext.x, model.ext.y) * 3;
  for (let i = 0; i < nG; i++) {
    const rich = r() < 0.3;
    const a = rich ? 0.07 : 0.3;
    let rr = 0;
    for (let t = 0; t < 8; t++) { const u = Math.sqrt(r()); rr = (a * u) / Math.max(1 - u, 1e-6); if (rr < reach) break; }
    rr = Math.min(rr, reach);
    const z = r() * 2 - 1, ph = r() * 6.2832, q = Math.sqrt(1 - z * z);
    const flat = rich ? 0.45 : 0.85;
    const M = Math.min(-4.5, Math.max(-10.5, -7.4 + 1.2 * gauss()));
    // half-light radius ~3 pc (log-normal), larger far out in the halo; the sprite is ~2.4x that
    const rh = 3 * Math.exp(0.35 * gauss()) * (1 + 0.6 * Math.min(rr, 2));
    const c = rich ? [1.0, 0.8, 0.6] : [1.0, 0.9, 0.78];
    put(rr * q * Math.cos(ph), rr * q * Math.sin(ph), rr * z * flat, (2.4 * rh) / rpc, c, share(M), KIND_GLOBULAR);
  }
  // the nuclear star cluster around the central black hole: the brightest, densest cluster of all
  if (nucleus) put(0, 0, 0, 12 / rpc, [1.0, 0.85, 0.66], share(Math.min(-10, Mg + 9)), KIND_GLOBULAR);
  const globulars = k;
  const sys: ClusterSystem = { pos, flux, kind, count: k, globulars };
  yield;
  if (nO + nH > 0) {
    const C_YOUNG = [0.72, 0.84, 1.0], C_HII = [1.0, 0.38, 0.55];
    const it = model.sample(nO, r, (x, y, z) => {
      const M = -2.5 - 5 * Math.pow(r(), 3);                  // most faint, a few as bright as h and χ Persei
      const size = (1 + 3 * r()) / rpc;
      put(x, y, z, size, C_YOUNG, share(M), KIND_OPEN);
      sys.count = k;
    }, [3]);
    while (!it.next().done) yield;
    const hiiComp = model.frac[4] > 0 ? [4] : [3];
    const it2 = model.sample(nH, r, (x, y, z) => {
      // sizes from a power law (most small, a few giant complexes like NGC 604); Hα-bright, a few x
      // the light of an open cluster per parsec of radius
      const R = 8 * Math.pow(1 - 0.97 * r(), -0.9);
      const M = -4 - 2.5 * Math.log10(R / 8) * 1.6;
      put(x, y, z, Math.min(R, 250) / rpc, C_HII, share(M), KIND_HII);
      sys.count = k;
    }, hiiComp);
    while (!it2.next().done) yield;
  }
  sys.count = k;
  return sys;
}

// (built on first use: GalaxiesLayer imports this module, so its shader parts are not ready at load)
const vert = () => /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute vec4 aStar;     // position (galaxy radii), sprite radius (galaxy radii)
attribute vec3 aFlux;     // colour x share of the galaxy's light
attribute vec2 aKind;     // kind, seed
uniform float uRadius;    // galaxy radius (m)
uniform float uPixelSA;
uniform float uDpr;
uniform float uGain;
uniform float uWeight;
uniform float uMaxPx;
uniform float uClipScale;
uniform vec3 uCamG;
varying vec3 vCol;
varying vec3 vSeed;
${GAL_MODEL}
${DUST_TAU}
void main() {
  vec4 mv = modelViewMatrix * vec4(aStar.xyz, 1.0);
  float d = length(mv.xyz * (1.0 / uRadius));
  float px = aStar.w / max(d, 1e-12) / sqrt(uPixelSA);
  float pxd = max(px, 1.0);
  // light spread over the sprite (profile integral ~0.43 for the clusters, ~0.5 for the nebulae)
  float norm = aKind.x > 1.5 ? 0.5 : 0.43;
  float sb = 1.0 / (norm * aStar.w * aStar.w) * (px / pxd) * (px / pxd);
  // sprites too big for a point fade out (their light is the volume's), and so do nebulae the eye is inside
  float big = (1.0 - smoothstep(uMaxPx * 0.55, uMaxPx, px)) * smoothstep(0.6, 1.4, d / max(aStar.w, 1e-9));
  if (big <= 0.0 || mv.z > 0.0 || uWeight <= 0.0) { vCol = vec3(0.0); gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; return; }
  vCol = aFlux * sb * uGain * uWeight * big * exp(-dustTau(uCamG, aStar.xyz) * EXT);
  vSeed = vec3(aKind.x, aKind.y, px);
  gl_Position = projectView(mv);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
${POINT_CLIP}
  gl_PointSize = 2.0 * pxd * uDpr;
}`;

const FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler3D uNoise;
varying vec3 vCol;
varying vec3 vSeed;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float a;
  if (vSeed.x > 1.5) {
    // emission nebula: a lumpy, irregular cloud (noise), with dark dusty bays; detail fades in with size
    float lod = max(0.0, 4.0 - log2(max(vSeed.z, 1.0)));
    vec4 n = textureLod(uNoise, vec3(q * 0.32, vSeed.y * 13.7), lod);
    vec4 m = textureLod(uNoise, vec3(q * 0.9 + 3.1, vSeed.y * 7.3), lod + 1.0);
    float edge = 1.0 - smoothstep(0.25 + 0.5 * n.r, 1.0, sqrt(r2));
    a = edge * (0.25 + 1.6 * n.g * m.b) * (1.0 - 0.7 * smoothstep(0.55, 0.8, m.a)) * 1.6;
    gl_FragColor = vec4(vCol * a + vec3(0.0, 0.25, 0.2) * vCol.r * a * exp(-6.0 * r2), 1.0);
  } else {
    // a star cluster: a bright core in an extended halo (King-like)
    a = 0.6 * exp(-16.0 * r2) + 0.4 * exp(-4.0 * r2);
    gl_FragColor = vec4(vCol * a, 1.0);
  }
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/**
 * The clusters and nebulae of the nearest galaxy (rebuilt when that changes). Visible from 40
 * radii in (the globulars first appear as a swarm of faint points around the galaxy), and inside.
 */
export class GalaxyClusters {
  readonly points: Points;
  private of: Galaxy | null = null;
  private mat: ShaderMaterial;
  private building: Generator<void, ClusterSystem> | null = null;
  system: ClusterSystem | null = null;

  constructor(gain: { value: number }, psf: Record<string, { value: number }> | undefined, private vr = false) {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
    this.mat = new ShaderMaterial({
      name: 'galaxy-clusters', vertexShader: vert(), fragmentShader: FRAG,
      uniforms: {
        uNoise: { value: null }, uSeed: { value: 0 }, uArmP: { value: new Vector4() }, uDiscW: { value: new Vector4() },
        uDiscS: { value: new Vector4() }, uRing: { value: new Vector4() }, uBulgeW: { value: new Vector4() }, uBulgeAx: { value: new Vector3() },
        uDustP: { value: new Vector4() }, uBarP: { value: new Vector4() }, uSpot: { value: new Vector4() }, uSpotW: { value: 0 }, uDiscRot: { value: new Matrix3() },
        uRadius: { value: 1 }, uPixelSA: psf?.uPixelSA ?? { value: 1e-6 }, uDpr: psf?.uDpr ?? { value: 1 }, uGain: gain, uWeight: { value: 0 },
        uMaxPx: { value: vr ? 96 : 240 }, uClipScale: { value: 1 }, uCamG: { value: new Vector3() },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    this.points = new Points(geo, this.mat);
    this.points.name = 'galaxy clusters';
    this.points.matrixAutoUpdate = false;
    this.points.frustumCulled = false;
    this.points.visible = false;
    this.points.renderOrder = -1;
  }

  /** `near`: the nearest galaxy and its model; `rel`: its centre from the eye (m); `k`: distance in its radii. */
  update(near: Galaxy | null, model: GalaxyModel | null, rel: Vector3, k: number, fade: number): void {
    const w = near && model && fade > 0.001 ? smooth(40, 25, k) : 0;
    this.points.visible = w > 0.001;
    if (!this.points.visible || !near || !model) return;
    const u = this.mat.uniforms;
    const geo = this.points.geometry;
    if (this.of !== near) {
      // built a few milliseconds per frame (sampling the arms takes a while on a headset)
      this.building = clusterGen(model, this.vr);
      this.building.next();
      geo.setDrawRange(0, 0);
      for (const [key, v] of Object.entries(model.u)) {
        const dst = u[key];
        if (!dst) continue;
        if (v.value instanceof Vector4 || v.value instanceof Vector3 || v.value instanceof Matrix3) (dst.value as Vector4).copy(v.value as Vector4);
        else dst.value = v.value;
      }
      this.system = null;
      this.of = near;
    }
    if (this.building) {
      const t0 = performance.now();
      let v = this.building.next();
      while (!v.done && performance.now() - t0 < 2) v = this.building.next();
      if (v.done) {
        const s = v.value;
        geo.setAttribute('aStar', new BufferAttribute(s.pos, 4));
        geo.setAttribute('aFlux', new BufferAttribute(s.flux, 3));
        geo.setAttribute('aKind', new BufferAttribute(s.kind, 2));
        geo.setAttribute('position', new BufferAttribute(new Float32Array(Math.max(s.count, 1) * 3), 3));
        geo.setDrawRange(0, s.count);
        this.system = s;
        this.building = null;
      }
    }
    if (!this.system) { this.points.visible = false; return; }
    const R = near.radius;
    this.points.matrix.makeBasis(near.major.clone().multiplyScalar(R), near.minor.clone().multiplyScalar(R), near.normal.clone().multiplyScalar(R)).setPosition(rel);
    this.points.matrixWorldNeedsUpdate = true;
    u.uRadius.value = R;
    u.uWeight.value = w;
    u.uClipScale.value = 1 / Math.max(rel.length(), R);
    (u.uCamG.value as Vector3).set(-rel.dot(near.major) / R, -rel.dot(near.minor) / R, -rel.dot(near.normal) / R);
  }
}
