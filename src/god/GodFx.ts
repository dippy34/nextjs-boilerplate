import {
  AdditiveBlending, BufferAttribute, FrontSide, Group, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, Quaternion,
  ShaderMaterial, SphereGeometry, Vector3,
} from 'three';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from '../render/shaders/xr';
import { VOLUMES } from '../render/Renderer';
import type { Entity } from './Sandbox';

/**
 * God mode's event effects, drawn on the GPU: every particle is one instance of a shared quad whose
 * whole motion (ballistic ejecta, a Keplerian debris stream shearing into a ring, a tidal stream
 * spiralling into a black hole, dust falling together into a new world) is a closed-form function
 * of time evaluated in the vertex shader. The CPU writes the instance data once when an effect
 * starts and then only a handful of uniforms per frame, so a few thousand particles cost the
 * Quest one draw call each and no buffer uploads. Big soft glows (the impact flash, the flare of
 * a swallow) go to the renderer's reduced-resolution volume pass.
 */

export const enum FxMode { Ejecta = 0, Ring = 1, Inspiral = 2, Form = 3, Glow = 4 }

const VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute vec4 aA;
attribute vec4 aB;
uniform int uMode;
uniform vec3 uOrigin;   // centre of the effect, camera-relative (m)
uniform float uT;       // real seconds since the start
uniform float uSimT;    // simulated seconds since the start
uniform float uR;       // length scale (m)
uniform float uLife;
uniform vec3 uN, uE1, uE2;
uniform vec4 uP;
uniform vec3 uColor, uHot;
uniform float uPixAng;  // radians per pixel
uniform float uFade;    // 0..1 overall
varying vec2 vUv;
varying vec4 vCol;
vec3 rotAxis(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }
void main() {
  vUv = position.xy;
  vec3 C = uOrigin;
  float size = 0.0, a = 0.0;
  vec3 col = uColor;
  float t = uT;
  if (uMode == 0) {
    // ejecta from the impact site uN*uR: a ballistic arc on the survivor; slow ones fall back
    // (re-accrete), fast ones (aB.x = 1) escape and coast
    float tt = max(t - aB.z, 0.0);
    vec3 v = aA.xyz * aA.w * uP.x;               // radii per second
    float vz = dot(v, uN);
    vec3 vl = v - uN * vz;
    float h = aB.x > 0.5 ? vz * tt / (1.0 + 0.2 * tt) : vz * tt - 0.5 * uP.y * tt * tt;
    vec3 lat = vl * (aB.x > 0.5 ? tt / (1.0 + 0.2 * tt) : tt);
    C += uR * (uN * (1.0 + max(h, 0.0)) + lat);
    float heat = exp(-tt * uP.z * (0.6 + aB.y));
    col = mix(uColor * 0.35, uHot, heat) * (0.3 + 4.0 * heat * heat);
    a = (h < 0.0 ? 0.0 : 1.0) * (1.0 - smoothstep(uLife * 0.55, uLife, t)) * step(aB.z, t);
    size = uR * uP.w * (0.4 + aB.y);
  } else if (uMode == 1) {
    // a disrupted body: a stream along its orbit that shears into a ring (Kepler: inner faster)
    float grow = smoothstep(0.0, 1.0, t / uP.x);
    float rr = mix(1.0 + (aA.y - 1.0) * 0.25, aA.y, grow);
    float ang = uP.z + aA.x * mix(0.06, PI, grow) + uP.y * pow(rr, -1.5) * uSimT;
    C += uR * (rr * (uE1 * cos(ang) + uE2 * sin(ang)) + uN * aA.z * mix(0.04, 0.012, grow));
    float hot = 1.0 - grow;
    col = mix(uColor, uHot * 3.0, hot * hot) * (0.6 + 0.4 * aA.w);
    a = (0.55 + 0.45 * hot) * uFade;
    size = uR * uP.w * (0.5 + aA.w);
  } else if (uMode == 2) {
    // swallowed: a tidal stream spiralling in, each particle in turn (aA.x is its delay)
    float tau = clamp((t - aA.x * uP.x * 0.6) / uP.x, 0.0, 1.0);
    float r = uR * pow(1.0 - tau, 0.7) * (1.0 + aA.y * 0.12 * (1.0 - tau)) + uP.y;
    float ang = aA.w * 0.25 + 7.0 * pow(tau, 1.6) * (1.0 + 0.2 * aA.y);
    C += r * (uE1 * cos(ang) + uE2 * sin(ang)) + uN * aA.z * uR * 0.03 * (1.0 - tau);
    col = mix(uColor, uHot, tau) * (0.6 + 6.0 * tau * tau);
    a = tau >= 1.0 ? 0.0 : (1.0 - smoothstep(uLife * 0.7, uLife, t));
    size = mix(uR * uP.w, uP.y * 0.4, tau) * (0.5 + aA.w);
  } else if (uMode == 3) {
    // a new world: dust falling together, swirling about uN
    float tau = clamp(t / uP.x, 0.0, 1.0);
    float k = (1.0 - tau) * (1.0 - tau);
    vec3 d = rotAxis(aA.xyz, uN, 2.5 * k * (1.0 + aA.w));
    C += d * uR * (1.0 + (2.5 + 4.0 * aA.w) * k);
    col = mix(uHot, uColor, tau) * (0.5 + 1.5 * tau);
    a = sin(PI * tau) * (tau < 1.0 ? 1.0 : 0.0);
    size = uR * uP.w * (0.5 + aA.w);
  } else {
    // a glow: grows and fades (uP: size, brightness, decay)
    float g = exp(-t * uP.z);
    size = uR * uP.x * (0.35 + 0.65 * (1.0 - exp(-t * 6.0)));
    col = uColor * uP.y * g;
    a = g * (1.0 - smoothstep(uLife * 0.6, uLife, t));
  }
  vec4 mv = viewMatrix * vec4(C, 1.0);
  // never smaller than ~1.6 pixels: the effect still reads from far away (dimmed to keep its flux)
  float depth = max(-mv.z, 1e-3);
  float minS = 1.6 * depth * uPixAng;
  if (size < minS) { a *= max(size / minS, 0.25); size = minS; }
  mv.xy += position.xy * size;
  vCol = vec4(col * a, a);
  gl_Position = projectView(mv);
  if (a <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

const FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform int uMode;
varying vec2 vUv;
varying vec4 vCol;
void main() {
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0) discard;
  float f = uMode == 4 ? exp(-5.0 * r2) + 0.18 * exp(-1.5 * r2) * (1.0 - r2) : exp(-3.5 * r2);
  gl_FragColor = vec4(vCol.rgb * f, vCol.a * f);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

const SCAR_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vN;
void main() {
  vN = normal;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;
const SCAR_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uN;
uniform float uCos;    // cosine of the scar's angular radius
uniform float uHeat;   // 1 molten .. 0 cold
uniform float uSeed;
varying vec3 vN;
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7)) + uSeed) * 43758.5453); }
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
void main() {
  vec3 n = normalize(vN);
  float c = dot(n, uN);
  float rim = (c - uCos) / (1.0 - uCos);        // 0 at the edge, 1 at the centre
  float cracks = vnoise(n * 18.0) * 0.6 + vnoise(n * 47.0) * 0.4;
  float m = smoothstep(0.0, 0.35, rim + (cracks - 0.5) * 0.5);
  // rays of splashed melt beyond the rim
  float rays = smoothstep(0.72, 0.95, vnoise(n * 9.0 + uN * 3.0)) * smoothstep(-1.2, 0.0, rim) * (1.0 - m);
  float glow = (m * (0.35 + 0.65 * cracks) + rays * 0.5) * uHeat;
  if (glow < 0.003) discard;
  // incandescence: white-yellow when molten, orange, then a dull red as it cools
  vec3 col = mix(vec3(0.5, 0.04, 0.0), mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.85, 0.55), smoothstep(0.55, 0.95, uHeat)), smoothstep(0.1, 0.6, uHeat));
  gl_FragColor = vec4(col * glow * (0.6 + 5.0 * uHeat * uHeat), glow);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/** One effect: a mesh of instanced quads (or the scar shell) following an entity or fixed in space. */
interface Effect {
  mesh: Mesh;
  mode: FxMode | 'scar';
  follow: Entity | null;
  /** effect centre relative to the followed entity (or absolute, m) */
  at: Vector3;
  t: number;
  life: number;
  jd0: number;
  /** effects that stay as long as their entity (debris rings) */
  persistent: boolean;
  scar?: { n0: Vector3; axis: Vector3; rate: number; cool: number };
  volume?: boolean;
}

/** The pieces of an effect another module can make: what the layer was told happened. */
export interface FxSpec {
  mode: FxMode;
  count: number;
  /** centre, absolute (m), and the entity it moves with */
  at: Vector3;
  follow: Entity | null;
  R: number;
  life: number;
  jd: number;
  n?: Vector3; e1?: Vector3; e2?: Vector3;
  p?: [number, number, number, number];
  color?: [number, number, number];
  hot?: [number, number, number];
  /** instance data: aA, aB per particle */
  fill?: (i: number, a: Float32Array, b: Float32Array) => void;
  persistent?: boolean;
}

const QUAD = (() => {
  const pos = new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3);
  const index = new BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1);
  return { pos, index };
})();

let scarGeo: SphereGeometry | null = null;

const MAX_EFFECTS = 32;

/** Unit vector uniformly on the sphere. */
function randDir(out: Float32Array | number[], o = 0): void {
  const u = Math.random() * 2 - 1, phi = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
  out[o] = s * Math.cos(phi); out[o + 1] = s * Math.sin(phi); out[o + 2] = u;
}

/** Roughly normal, mean 0, deviation 1. */
function gauss(): number { return (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.732; }

/** A frame (e1, e2) perpendicular to n. */
export function basis(n: Vector3): [Vector3, Vector3] {
  const e1 = Math.abs(n.x) < 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
  e1.addScaledVector(n, -e1.dot(n)).normalize();
  return [e1, new Vector3().crossVectors(n, e1)];
}

export class GodFx {
  readonly group = new Group();
  private effects: Effect[] = [];
  /** black holes whose disks flare after a swallow: base inner temperature and when it ends */
  private flares = new Map<object, { base: number; t: number; life: number; boost: number }>();
  private pixAng = { value: 1e-3 };
  private last = performance.now();

  constructor(private alive: (e: Entity) => boolean) {
    this.group.name = 'god fx';
  }

  /** Effects running now (tests). */
  get count(): number { return this.effects.length; }
  /** Running effects of one mode (tests). */
  countOf(mode: FxMode | 'scar'): number { return this.effects.filter((e) => e.mode === mode).length; }

  clear(): void {
    for (const e of this.effects) this.dispose(e);
    this.effects = [];
    for (const [bh, f] of this.flares) (bh as { diskTmax: number }).diskTmax = f.base;
    this.flares.clear();
  }

  /** Start an effect of instanced particles. */
  add(s: FxSpec): void {
    const geo = new InstancedBufferGeometry();
    geo.setAttribute('position', QUAD.pos);
    geo.setIndex(QUAD.index);
    const A = new Float32Array(s.count * 4), B = new Float32Array(s.count * 4);
    if (s.fill) {
      const a = new Float32Array(4), b = new Float32Array(4);
      for (let i = 0; i < s.count; i++) { a.fill(0); b.fill(0); s.fill(i, a, b); A.set(a, i * 4); B.set(b, i * 4); }
    }
    geo.setAttribute('aA', new InstancedBufferAttribute(A, 4));
    geo.setAttribute('aB', new InstancedBufferAttribute(B, 4));
    geo.instanceCount = s.count;
    const n = s.n ?? new Vector3(0, 0, 1);
    const [e1, e2] = s.e1 && s.e2 ? [s.e1, s.e2] : basis(n);
    const mat = new ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        uMode: { value: s.mode }, uOrigin: { value: new Vector3() }, uT: { value: 0 }, uSimT: { value: 0 }, uR: { value: s.R },
        uLife: { value: s.life }, uN: { value: n.clone() }, uE1: { value: e1.clone() }, uE2: { value: e2.clone() },
        uP: { value: s.p ?? [0, 0, 0, 0] }, uColor: { value: new Vector3(...(s.color ?? [1, 0.6, 0.3])) },
        uHot: { value: new Vector3(...(s.hot ?? [1, 0.9, 0.7])) }, uPixAng: this.pixAng, uFade: { value: 1 },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      transparent: true, depthWrite: false, depthTest: true, blending: AdditiveBlending,
    });
    const mesh = new Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.matrixAutoUpdate = false;
    mesh.renderOrder = 12;
    const volume = s.mode === FxMode.Glow;
    if (volume) { mesh.layers.set(VOLUMES.layer); VOLUMES.meshes.add(mesh); }
    const at = s.follow ? s.at.clone().sub(s.follow.pos) : s.at.clone();
    this.push({ mesh, mode: s.mode, follow: s.follow, at, t: 0, life: s.life, jd0: s.jd, persistent: !!s.persistent, volume });
  }

  private push(e: Effect): void {
    this.effects.push(e);
    this.group.add(e.mesh);
    // too many: drop the oldest that is not a ring
    while (this.effects.length > MAX_EFFECTS) {
      const i = Math.max(0, this.effects.findIndex((x) => !x.persistent));
      this.dispose(this.effects[i]);
      this.effects.splice(i, 1);
    }
  }

  private dispose(e: Effect): void {
    this.group.remove(e.mesh);
    if (e.volume) VOLUMES.meshes.delete(e.mesh);
    if (e.mode !== 'scar') e.mesh.geometry.dispose();
    (e.mesh.material as ShaderMaterial).dispose();
  }

  // ------------------------------------------------------------------ the events

  /**
   * A planet impact: a flash, a fan of ejecta from the site (most falls back, some escapes), a
   * molten scar that glows and cools, and for a giant impact a debris disk.
   */
  impact(at: Vector3, survivor: Entity | null, victimR: number, gmRatio: number, speed: number, jd: number): void {
    const R = Math.max(survivor?.radius ?? victimR, 1e3);
    const centre = survivor?.pos ?? at;
    const n = at.clone().sub(centre);
    if (n.lengthSq() < 1e-6 * R * R) { const d = [0, 0, 1]; randDir(d); n.fromArray(d); }
    n.normalize();
    // sizes from the bodies: a bigger impactor throws more, further
    const big = gmRatio > 1e-3 || victimR > 0.15 * R;
    const k = Math.min(1, Math.max(0.15, victimR / R));
    this.add({ mode: FxMode.Glow, count: 1, at: centre.clone().addScaledVector(n, R), follow: survivor, R, life: 2.2, jd,
      p: [big ? 3.2 : 1.6, big ? 30 : 12, 1.8, 0], color: [1, 0.78, 0.55] });
    const count = big ? 1400 : 500;
    const escFrac = Math.min(0.5, 0.15 + speed / 6e4);
    this.add({
      mode: FxMode.Ejecta, count, at: centre, follow: survivor, R, life: big ? 7 : 4.5, jd, n,
      // speed (radii/s), gravity (radii/s^2), cooling rate, particle size (radii)
      p: [0.5 + 1.2 * k, 0.55 + 0.4 * k, 0.9, 0.006 + 0.012 * k], color: [0.55, 0.42, 0.34], hot: [1, 0.7, 0.35],
      fill: (_i, a, b) => {
        // a cone about the normal: wide and low for most, a few steep jets
        const steep = Math.random() < 0.2;
        const th = (steep ? 0.35 : 1.2) * Math.sqrt(Math.random()), ph = Math.random() * Math.PI * 2;
        const [e1, e2] = basis(n);
        const d = n.clone().multiplyScalar(Math.cos(th)).addScaledVector(e1, Math.sin(th) * Math.cos(ph)).addScaledVector(e2, Math.sin(th) * Math.sin(ph));
        a[0] = d.x; a[1] = d.y; a[2] = d.z; a[3] = 0.25 + 0.75 * Math.random() ** 0.7;
        b[0] = Math.random() < escFrac ? 1 : 0; b[1] = Math.random(); b[2] = Math.random() * 0.25;
      },
    });
    if (survivor) this.scar(survivor, n, Math.min(1.3, Math.max(0.12, (1.6 * victimR) / R)), big ? 16 : 9, jd);
    // a giant impact leaves a disk of debris (a moon may form from it), which thins out
    if (survivor && gmRatio > 0.01) {
      const [e1, e2] = basis(n);
      const ringN = new Vector3().crossVectors(n, e1).normalize();
      this.ring(survivor, 2.6 * R, ringN, Math.sqrt(survivor.gm / (2.6 * R) ** 3), Math.atan2(n.dot(e2), n.dot(e1)), jd, 50, [0.6, 0.48, 0.38]);
    }
  }

  /** A glowing patch on `on` around direction n (body-fixed: it turns with the body), cooling over `cool` s. */
  scar(on: Entity, n: Vector3, angR: number, cool: number, jd: number): void {
    scarGeo ??= new SphereGeometry(1, 48, 24);
    const mat = new ShaderMaterial({
      vertexShader: SCAR_VERT, fragmentShader: SCAR_FRAG,
      uniforms: { uN: { value: n.clone() }, uCos: { value: Math.cos(angR) }, uHeat: { value: 1 }, uSeed: { value: Math.random() * 100 },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
      transparent: true, depthWrite: false, depthTest: true, blending: AdditiveBlending, side: FrontSide,
    });
    const mesh = new Mesh(scarGeo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 7;
    this.push({ mesh, mode: 'scar', follow: on, at: new Vector3(), t: 0, life: cool, jd0: jd, persistent: false,
      scar: { n0: n.clone(), axis: on.spin.axis.clone().normalize(), rate: on.spin.rate, cool } });
  }

  /** A stream of debris about `around` at radius r in the plane normal to n, shearing into a ring. */
  ring(around: Entity, r: number, n: Vector3, omega: number, theta0: number, jd: number, life = Infinity, color: [number, number, number] = [0.5, 0.42, 0.34]): void {
    const [e1, e2] = basis(n);
    this.add({
      mode: FxMode.Ring, count: 1600, at: around.pos, follow: around, R: r, life, jd, n, e1, e2, persistent: life === Infinity,
      p: [7, omega, theta0, 0.005], color, hot: [1, 0.6, 0.3],
      // soft (near-Gaussian) spreads: a clump with no corners
      fill: (_i, a) => { a[0] = Math.max(-1, Math.min(1, gauss() * 0.45)); a[1] = 1 + Math.max(-0.3, Math.min(0.3, gauss() * 0.11)); a[2] = gauss() * 0.5; a[3] = Math.random(); },
    });
  }

  /** Tides tore a body apart at `at`, inside `around`'s Roche limit: a stretched stream that becomes a ring. */
  disrupt(at: Vector3, around: Entity, ringR: number, n: Vector3, victimR: number, jd: number): void {
    const [e1, e2] = basis(n);
    const rel = at.clone().sub(around.pos);
    const theta0 = Math.atan2(rel.dot(e2), rel.dot(e1));
    this.ring(around, ringR, n, Math.sqrt(around.gm / ringR ** 3), theta0, jd);
    this.add({ mode: FxMode.Glow, count: 1, at, follow: around, R: Math.max(victimR, 1e3), life: 3, jd, p: [6, 10, 1.2, 0], color: [1, 0.7, 0.45] });
  }

  /**
   * A black hole swallowed something at `at`: a tidal stream spiralling in, a flash at the hole,
   * and its accretion disk brightening for a while (`hole` is the drawable with `diskTmax`).
   */
  swallow(at: Vector3, hole: Entity, victimR: number, gmRatio: number, jd: number, drawable: { diskTmax: number } | null): void {
    const rel = at.clone().sub(hole.pos);
    const r0 = Math.max(rel.length(), hole.radius * 4, victimR * 2);
    const e1 = rel.lengthSq() > 0 ? rel.clone().normalize() : new Vector3(1, 0, 0);
    const n = basis(e1)[0];
    const e2 = new Vector3().crossVectors(n, e1);
    this.add({
      mode: FxMode.Inspiral, count: 900, at: hole.pos, follow: hole, R: r0, life: 5, jd, n, e1, e2,
      p: [2.6, hole.radius * 1.2, 0, Math.max(0.01, (0.15 * victimR) / r0)], color: [1, 0.55, 0.25], hot: [0.75, 0.82, 1],
      fill: (_i, a) => { a[0] = Math.random() ** 1.3; a[1] = Math.random() * 2 - 1; a[2] = Math.random() * 2 - 1; a[3] = Math.random(); },
    });
    const flare = Math.min(4, 0.8 + Math.log10(1 + gmRatio * 1e4) * 0.6);
    this.add({ mode: FxMode.Glow, count: 1, at: hole.pos, follow: hole, R: Math.max(hole.radius, 1) * 30, life: 6, jd,
      p: [1, 18 * flare, 0.7, 0], color: [0.7, 0.75, 1] });
    if (drawable) {
      const f = this.flares.get(drawable);
      this.flares.set(drawable, { base: f?.base ?? drawable.diskTmax, t: 0, life: 8, boost: Math.max(f ? f.boost : 0, flare) });
    }
  }

  /** A new body forms: dust swirls in and settles where it appears. */
  form(e: Entity, color: [number, number, number], jd: number, size?: number): void {
    const R = Math.max(size ?? e.radius, 1e3);
    const n = e.spin.axis.lengthSq() > 0 ? e.spin.axis.clone().normalize() : new Vector3(0, 0, 1);
    this.add({
      mode: FxMode.Form, count: 700, at: e.pos, follow: e, R, life: 1.8, jd, n,
      p: [1.6, 0, 0, 0.03], color, hot: [1, 0.8, 0.6],
      fill: (_i, a) => { randDir(a); a[3] = Math.random(); },
    });
    this.add({ mode: FxMode.Glow, count: 1, at: e.pos, follow: e, R, life: 2, jd, p: [3, 6, 2.2, 0], color });
  }

  // ------------------------------------------------------------------ per frame

  update(camV: Vector3, jd: number, pixelAngle: number): void {
    const now = performance.now();
    const dt = Math.max(0, Math.min(0.1, (now - this.last) / 1000));
    this.last = now;
    this.pixAng.value = pixelAngle;
    const q = new Quaternion();
    this.effects = this.effects.filter((e) => {
      e.t += dt;
      const gone = e.follow && !this.alive(e.follow);
      if (gone || e.t >= e.life) { this.dispose(e); return false; }
      return true;
    });
    for (const e of this.effects) {
      const c = e.follow ? e.follow.pos : null;
      const x = (c ? c.x + e.at.x : e.at.x) - camV.x, y = (c ? c.y + e.at.y : e.at.y) - camV.y, z = (c ? c.z + e.at.z : e.at.z) - camV.z;
      const u = (e.mesh.material as ShaderMaterial).uniforms;
      if (e.mode === 'scar' && e.scar && e.follow) {
        // the patch turns with the body; it glows while it cools
        const spun = e.scar.rate * (jd - e.jd0) * 86400;
        q.setFromAxisAngle(e.scar.axis, spun % (Math.PI * 2));
        u.uN.value.copy(e.scar.n0).applyQuaternion(q);
        const f = e.t / e.scar.cool;
        u.uHeat.value = Math.exp(-3 * f) * (1 - f);
        e.mesh.position.set(x, y, z);
        e.mesh.scale.setScalar(e.follow.radius * 1.004);
        continue;
      }
      u.uOrigin.value.set(x, y, z);
      u.uT.value = e.t;
      u.uSimT.value = (jd - e.jd0) * 86400;
      // long-lived debris disks thin out over their last fifth
      u.uFade.value = Number.isFinite(e.life) ? Math.min(1, (1 - e.t / e.life) * 5) : 1;
    }
    for (const [bh, f] of this.flares) {
      f.t += dt;
      const k = f.t >= f.life ? 0 : Math.exp(-2.5 * (f.t / f.life)) * (1 - f.t / f.life);
      (bh as { diskTmax: number }).diskTmax = f.base * (1 + f.boost * Math.min(1, f.t * 4) * k);
      if (f.t >= f.life) this.flares.delete(bh);
    }
  }
}
