import { AdditiveBlending, BackSide, BoxGeometry, BufferAttribute, BufferGeometry, DoubleSide, Group, IcosahedronGeometry, Matrix3, Matrix4, Mesh, Quaternion, ShaderMaterial, Vector3 } from 'three';
import { keplerState, type OrbitalElements } from '../astro/kepler';
import { magToIrradiance } from '../astro/photometry';
import { eclToEqu } from '../core/frames';
import { AU, GM_SUN } from '../core/units';
import type { UPos } from '../core/upos';
import type { Comet } from './SmallBodies';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

const VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
uniform vec3 uNucleus;   // camera-relative (m)
uniform vec3 uAxis;      // anti-sunward unit vector
uniform vec3 uAcross;    // unit vector across the tail, perpendicular to the view
uniform vec4 uExtent;    // s from, s to, t half-width (m), unused
attribute vec2 aST;      // 0..1 corners
varying vec2 vST;        // metres along / across the tail
void main() {
  float s = mix(uExtent.x, uExtent.y, aST.x);
  float t = mix(-uExtent.z, uExtent.z, aST.y);
  vST = vec2(s, t);
  vec3 p = uNucleus + uAxis * s + uAcross * t;
  gl_Position = projectView(viewMatrix * vec4(p, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

/** Tails as a volume in the comet's own frame (x: away from the Sun, y: in the orbit plane behind the motion, z: orbit normal), in coma radii. */
const TAIL_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
uniform vec3 uBoxC;      // box centre in the comet frame (coma radii)
uniform vec3 uBoxE;      // box half extents (coma radii)
varying vec3 vP;         // point on the box, comet frame (coma radii)
void main() {
  vP = uBoxC + position * uBoxE;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

/**
 * The coma (integrated analytically along the ray) and the two tails ray-marched through the
 * volume: the ion tail a narrow tube straight away from the Sun, streaked by plasma rays; the
 * dust tail a broad, thin fan in the orbit plane, curving back along the orbit and striated
 * along the directions dust released at different times flies off in. Seen edge-on the fan is a
 * bright line; face-on a wide, faint wing. Densities are normalised so the columns through the
 * middle give the old picture's profiles (and so the catalogue brightness).
 */
const TAIL_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uCam;       // camera in the comet frame (coma radii)
uniform vec3 uBoxC;
uniform vec3 uBoxE;
uniform float uLi;       // ion tail length scale (coma radii)
uniform float uLd;       // dust tail length scale (coma radii)
uniform float uBend;     // dust tail curvature
uniform float uL0;
uniform float uGain;
uniform float uSeed;
uniform float uLite;
varying vec3 vP;
float th(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float tn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(th(i), th(i + vec3(1,0,0)), f.x), mix(th(i + vec3(0,1,0)), th(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(th(i + vec3(0,0,1)), th(i + vec3(1,0,1)), f.x), mix(th(i + vec3(0,1,1)), th(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 d = normalize(vP - uCam);
  // coma: column through the glow at the ray's closest approach to the nucleus
  float tc = max(-dot(uCam, d), 0.0);
  float b = length(uCam + d * tc);
  float coma = 0.7 * exp(-b * b * 0.5) + 0.3 * exp(-b / 0.25);
  // tails: march through the box, with steps that shrink near the ion tail's axis and the dust fan's plane
  vec3 inv = 1.0 / (sign(d) * max(abs(d), vec3(1e-6)));
  vec3 lo = uBoxC - uBoxE, hi = uBoxC + uBoxE;
  vec3 ta = (lo - uCam) * inv, tb = (hi - uCam) * inv;
  vec3 tl = min(ta, tb), tu = max(ta, tb);
  float t0 = max(max(tl.x, tl.y), max(tl.z, 0.0)), t1 = min(min(tu.x, tu.y), tu.z);
  float ion = 0.0, dust = 0.0;
  if (t1 > t0) {
    int N = uLite > 0.5 ? 32 : 96;
    float dsMax = (t1 - t0) / (uLite > 0.5 ? 12.0 : 28.0);
    float dyz = max(length(d.yz), 0.02), dz = max(abs(d.z), 0.02);
    float jit = th(vec3(gl_FragCoord.xy, uSeed));
    float t = t0;
    for (int i = 0; i < 96; i++) {
      if (i >= N || t >= t1) break;
      vec3 p0 = uCam + d * t;
      float x0 = max(p0.x, 0.0);
      float hI = max(length(p0.yz) - 0.12 - 0.012 * x0, 0.5 * (0.12 + 0.012 * x0)) / dyz;
      float hD = max(abs(p0.z) - 0.08 - 0.025 * x0, 0.5 * (0.08 + 0.025 * x0)) / dz;
      float ds = min(hI, hD);
      // inside the fan, also resolve its width (seen edge-on the ray runs along it)
      if (abs(p0.z) < 3.0 * (0.08 + 0.025 * x0)) ds = min(ds, 0.5 * (0.35 + 0.1 * x0) / max(abs(d.y), 0.05));
      ds = clamp(ds, 0.03, dsMax);
      ds = min(ds, t1 - t);
      vec3 p = uCam + d * (t + ds * jit);
      t += ds;
      float x = p.x;
      // ion tail: a tube along +x, streaked by plasma rays that run along the tail and kink
      if (x > 0.0) {
        float wi = 0.12 + 0.012 * x;
        float rr = length(p.yz);
        vec2 u = p.yz / max(rr, 1e-4);
        float rays = 0.35 + 1.4 * pow(tn(vec3(u * 3.0, x * 0.012 + uSeed)), 2.0);
        ion += ds * exp(-rr * rr / (2.0 * wi * wi)) / (2.5066 * wi) * exp(-x / uLi) * smoothstep(0.0, 1.0, x) * rays;
      }
      // dust tail: a thin fan in the orbit plane (z = 0), curving back along the orbit, striated along
      // lines from the nucleus (dust let go at one time drifts out along one line)
      float xd = max(x, 0.0);
      float yc = uBend * xd * xd / uLd;
      float wy = 0.35 + 0.1 * xd;
      float wz = 0.08 + 0.025 * xd;
      float fan = exp(-(p.y - yc) * (p.y - yc) / (2.0 * wy * wy)) * exp(-p.z * p.z / (2.0 * wz * wz)) / (2.5066 * wz);
      float stri = 0.6 + 0.8 * tn(vec3(atan(p.y, max(x, 0.5)) * 45.0, xd * 0.003, uSeed + 3.0));
      dust += ds * fan * exp(-xd / uLd) * smoothstep(-1.0, 1.0, x) * stri;
    }
  }
  vec3 c = coma * vec3(1.0, 0.98, 0.92) + ion * 0.35 * vec3(0.45, 0.7, 1.4) + dust * 0.4 * vec3(1.1, 0.95, 0.75);
  // glow, not a wall of white: soft ceiling on the displayed level (like the eye's response to the sky)
  vec3 xx = c * uL0 * 0.1 * uGain;
  gl_FragColor = vec4(1.2 * (1.0 - exp(-xx / 1.2)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

const NUC_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vN;
varying vec3 vPos;
varying vec3 vLocal;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;
const NUC_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uSunDir;
uniform float uSunIrr;
uniform float uExposure;
uniform mat3 uRot;        // local -> world rotation of the nucleus
varying vec3 vN;
varying vec3 vPos;
varying vec3 vLocal;
float nh(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float nn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(nh(i), nh(i + vec3(1,0,0)), f.x), mix(nh(i + vec3(0,1,0)), nh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(nh(i + vec3(0,0,1)), nh(i + vec3(1,0,1)), f.x), mix(nh(i + vec3(0,1,1)), nh(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float rough(vec3 p) { return 0.55 * nn(p * 6.0) + 0.3 * nn(p * 14.0 + 3.0) + 0.15 * nn(p * 31.0 + 7.0); }
void main() {
  // rough, pitted ground (generated): the normal tilted by the slope of a noise relief
  vec3 q = vLocal;
  float e = 0.01;
  float h0 = rough(q);
  vec3 g = vec3(rough(q + vec3(e, 0, 0)) - h0, rough(q + vec3(0, e, 0)) - h0, rough(q + vec3(0, 0, e)) - h0) / e;
  vec3 n = normalize(normalize(vN) - uRot * g * 0.035);
  float mu0 = max(dot(n, uSunDir), 0.0);
  // very dark, slightly reddish organic-rich dust (albedo ~0.05, as measured for 67P and others),
  // with smoother, slightly brighter dust-covered patches
  float patchy = 0.75 + 0.5 * smoothstep(0.45, 0.7, nn(q * 3.0 + 11.0));
  vec3 rad = vec3(0.055, 0.05, 0.045) * patchy * (mu0 + 0.03) * (uSunIrr / 3.14159265);
  gl_FragColor = vec4(min(rad * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;
const JET_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uRc;       // jet width at the base (m)
uniform float uLi;       // jet length (m)
uniform float uL0;
uniform float uGain;
varying vec2 vST;
void main() {
  float s = vST.x, t = vST.y;
  float w = uRc * (1.0 + 2.5 * max(s, 0.0) / uLi);
  float j = s > 0.0 ? exp(-t * t / (2.0 * w * w)) * exp(-s / uLi) * smoothstep(0.0, uRc * 0.5, s) : 0.0;
  vec3 x = vec3(0.95, 0.97, 1.0) * j * uL0 * 0.1 * uGain;
  gl_FragColor = vec4(1.0 - exp(-x), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/** A two-lobed nucleus (like 67P/Churyumov-Gerasimenko): union of two spheres, roughened. */
function nucleusGeometry(): BufferGeometry {
  const g = new IcosahedronGeometry(1, 4);
  const p = g.attributes.position as BufferAttribute;
  const lobes: [number, number, number][] = [[-0.42, 0, 0.72], [0.5, 0.08, 0.52]];   // centre x, centre y, radius
  const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i)).normalize();
    // farthest intersection of the ray from the origin with either lobe
    let r = 0;
    for (const [cx, cy, rr] of lobes) {
      const b = v.x * cx + v.y * cy;
      const c = cx * cx + cy * cy - rr * rr;
      const disc = b * b - c;
      if (disc >= 0) r = Math.max(r, b + Math.sqrt(disc));
    }
    // rough, terraced surface
    const h = Math.sin(v.x * 9.1 + v.y * 4.3) * Math.sin(v.y * 7.7 - v.z * 5.9) * Math.sin(v.z * 11.3 + v.x * 3.1);
    r *= 1 + 0.06 * h;
    p.setXYZ(i, v.x * r, v.y * r, v.z * r);
  }
  g.computeVertexNormals();
  return g;
}

const MAX = 12;
/** radiance of 21.5 mag per square arcsecond, photometric units */
const MW_RADIANCE = magToIrradiance(21.5) / 2.3504e-11;

/**
 * Comas and tails of the comets near the Sun: a glow around the nucleus sized from the comet's
 * catalogued activity (its total-magnitude parameters M1, K1 and distance from the Sun), a narrow
 * blue ion tail pointing straight away from the Sun and a broader, curved dust tail lagging along
 * the orbit. The integrated brightness follows the comet's catalogue magnitude. A model, not an
 * observation of the comet's current state.
 */
export class CometTails {
  readonly group = new Group();
  private meshes: Mesh[] = [];
  private elements = new WeakMap<Comet, OrbitalElements>();

  /** The comet's direction of motion (ICRF unit vector) at `jd`, from its orbital elements. */
  private motion(c: Comet, jd: number): Vector3 {
    let el = this.elements.get(c);
    if (!el) {
      const r = c.row;
      el = { q: r[3] * AU, e: r[2], i: r[4], node: r[5], peri: r[6], tp: r[7], mu: GM_SUN };
      this.elements.set(c, el);
    }
    const vel = new Vector3();
    keplerState(el, jd, new Vector3(), vel);
    return eclToEqu(vel).normalize();
  }

  /** display gain of the sky (xStar / xDark): comets are shown on the same scale as the Milky Way */
  readonly gain = { value: 1 };
  /** the nucleus of the comet the explorer is closest to (drawn only up close) */
  readonly nucleus: Mesh;
  private jets: Mesh[] = [];
  /** for the eye's adaptation: the drawn nucleus (camera-relative), its radius and radiance */
  nucleusView: { rel: Vector3; radius: number; radiance: number } | null = null;

  constructor(surfaceExposure: { value: number }) {
    this.group.name = 'comet-tails';
    this.nucleus = new Mesh(nucleusGeometry(), new ShaderMaterial({
      name: 'comet-nucleus', vertexShader: NUC_VERT, fragmentShader: NUC_FRAG,
      uniforms: { uSunDir: { value: new Vector3(1, 0, 0) }, uSunIrr: { value: Math.PI }, uExposure: surfaceExposure, uRot: { value: new Matrix3() },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
    }));
    this.nucleus.frustumCulled = false;
    this.nucleus.visible = false;
    this.nucleus.renderOrder = 1;
    this.group.add(this.nucleus);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(12), 3));
    g.setAttribute('aST', new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const box = new BoxGeometry(2, 2, 2);
    for (let i = 0; i < MAX; i++) {
      const m = new Mesh(box, new ShaderMaterial({
        name: 'comet-tail', vertexShader: TAIL_VERT, fragmentShader: TAIL_FRAG,
        uniforms: {
          uCam: { value: new Vector3() }, uBoxC: { value: new Vector3() }, uBoxE: { value: new Vector3(1, 1, 1) },
          uLi: { value: 1 }, uLd: { value: 1 }, uBend: { value: 0 }, uL0: { value: 0 }, uSeed: { value: i * 7.3 },
          uGain: this.gain, uLite: LITE.uLite, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
        },
        transparent: true, depthWrite: false, blending: AdditiveBlending, side: BackSide,
      }));
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      m.visible = false;
      m.renderOrder = 8;
      this.meshes.push(m);
      this.group.add(m);
    }
    for (let i = 0; i < 4; i++) {
      const m = new Mesh(g, new ShaderMaterial({
        name: 'comet-jet', vertexShader: VERT, fragmentShader: JET_FRAG,
        uniforms: {
          uNucleus: { value: new Vector3() }, uAxis: { value: new Vector3(1, 0, 0) }, uAcross: { value: new Vector3(0, 1, 0) },
          uExtent: { value: [0, 1, 1, 0] }, uRc: { value: 1 }, uLi: { value: 1 }, uL0: { value: 0 },
          uGain: this.gain, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
        },
        transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
      }));
      m.frustumCulled = false;
      m.visible = false;
      m.renderOrder = 9;
      this.jets.push(m);
      this.group.add(m);
    }
  }

  /** The nucleus and its jets, for the active comet `c` within reach of the camera. */
  private updateNucleus(c: Comet | null, cam: UPos, sun: UPos, sunIrr: number, jetL0: number): void {
    const show = !!c && c.upos.sub(cam, new Vector3()).length() < 3e7;
    this.nucleus.visible = show;
    for (const j of this.jets) j.visible = show;
    this.nucleusView = null;
    if (!show || !c) return;
    const R = c.radius > 0 ? c.radius : 2000;
    const rel = c.upos.sub(cam, new Vector3());
    const toSun = sun.sub(c.upos, new Vector3()).normalize();
    // a fixed, comet-specific orientation (the nucleus turns slowly; not modelled)
    let h = 0;
    for (const ch of c.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const q = new Quaternion().setFromAxisAngle(new Vector3(Math.sin(h), Math.cos(h * 0.7), Math.sin(h * 1.3)).normalize(), (h % 628) / 100);
    this.nucleus.position.copy(rel);
    this.nucleus.quaternion.copy(q);
    ((this.nucleus.material as ShaderMaterial).uniforms.uRot.value as Matrix3).setFromMatrix4(new Matrix4().makeRotationFromQuaternion(q));
    this.nucleus.scale.setScalar(R);
    const u = (this.nucleus.material as ShaderMaterial).uniforms;
    (u.uSunDir.value as Vector3).copy(toSun);
    u.uSunIrr.value = sunIrr;
    this.nucleusView = { rel, radius: R, radiance: (0.05 * sunIrr) / Math.PI };
    // jets from the sunlit side, fanning out a little; stronger near the Sun
    const viewDir = rel.clone().normalize();
    this.jets.forEach((j, i) => {
      const a = new Vector3(Math.sin(h * (i + 1) * 1.7), Math.cos(h * (i + 2) * 0.9), Math.sin(h * (i + 3) * 1.1)).normalize();
      const dir = toSun.clone().addScaledVector(a, 0.55).normalize();
      const across = new Vector3().crossVectors(dir, viewDir);
      if (across.lengthSq() < 1e-10) across.set(0, 0, 1).cross(dir);
      across.normalize();
      const ju = (j.material as ShaderMaterial).uniforms;
      (ju.uNucleus.value as Vector3).copy(rel).addScaledVector(dir, R * 0.6);
      (ju.uAxis.value as Vector3).copy(dir);
      (ju.uAcross.value as Vector3).copy(across);
      const L = R * 12;
      ju.uExtent.value = [-R, L * 3, R * 12, 0];
      ju.uRc.value = R * 0.25;
      ju.uLi.value = L;
      ju.uL0.value = jetL0 * (0.6 + 0.4 * Math.sin(h + i));
    });
  }

  private drawn: Comet[] = [];

  /** Is an active comet (one being drawn) within `dist` metres of `pos`? */
  near(pos: UPos, dist: number): boolean {
    return this.drawn.some((c) => c.upos.sub(pos, new Vector3()).length() < dist);
  }

  /** coma radius (m) of a comet at `r` AU from the Sun, from its total-magnitude parameters */
  static comaRadius(m1: number, k1: number, r: number): number {
    const mr = m1 + k1 * Math.log10(Math.max(r, 0.05));     // brightness "at 1 AU from the observer"
    return Math.min(8e8, Math.max(3e6, 1.2e8 * 10 ** (-0.2 * (mr - 8))));
  }

  update(cam: UPos, sunUpos: UPos, comets: Comet[], selection: unknown, jd: number): void {
    // the most interesting active comets: the selection, near ones, bright ones
    const sun = sunUpos;
    const scored: { c: Comet; r: number; score: number }[] = [];
    const tmp = new Vector3();
    for (const c of comets) {
      const m1 = c.row[8];
      // defunct (D), asteroid-like (A) and poorly known (X) objects show no activity
      if (m1 === null || c.apparentMag > 90 || c.row[1] === 'D' || c.row[1] === 'A' || c.row[1] === 'X') continue;
      const r = c.upos.sub(sun, tmp).length() / AU;
      if (r > 6) continue;
      const d = c.upos.sub(cam, tmp).length() / AU;
      const score = c === selection ? -100 : Math.min(c.apparentMag, 5 * Math.log10(Math.max(d, 1e-4)) + 4);
      if (c === selection || c.apparentMag < 9 || d < 0.3) scored.push({ c, r, score });
    }
    scored.sort((a, b) => a.score - b.score);
    this.drawn = scored.slice(0, MAX).map((e) => e.c);
    const viewDir = new Vector3();
    for (let i = 0; i < MAX; i++) {
      const m = this.meshes[i];
      const e = scored[i];
      if (!e) { m.visible = false; continue; }
      const { c, r } = e;
      const k1 = c.row[9] ?? 10;
      const Rc = CometTails.comaRadius(c.row[8]!, k1, r);
      const nucleus = c.upos.sub(cam, new Vector3());
      const dist = nucleus.length();
      const axis = c.upos.sub(sun, new Vector3()).normalize();
      viewDir.copy(nucleus).normalize();
      const across = new Vector3().crossVectors(axis, viewDir);
      if (across.lengthSq() < 1e-10) across.set(0, 0, 1).cross(axis);
      across.normalize();
      // motion along the orbit (the dust lags behind the nucleus, in the orbit plane)
      const v = this.motion(c, jd);
      const Li = Rc * 60 / Math.sqrt(Math.max(r, 0.1));
      const Ld = Rc * 30;
      // radiance: the catalogue magnitude's flux spread over the coma (intrinsic: E x distance^2),
      // relative to the Milky Way's typical surface brightness (~21.5 mag per square arcsecond)
      const E = magToIrradiance(c.apparentMag);
      const L0 = (0.6 * E * dist * dist) / (2 * Math.PI * Rc * Rc) / MW_RADIANCE;
      // the comet's frame: x away from the Sun, y in the orbit plane behind the motion, z the orbit normal
      const X = axis.clone();
      const Y = v.clone().addScaledVector(X, -v.dot(X)).negate();
      if (Y.lengthSq() < 1e-8) Y.copy(across);
      Y.normalize();
      const Z = new Vector3().crossVectors(X, Y);
      const bendV = 0.25;
      const li = Li / Rc, ld = Ld / Rc;
      const L = 3 * Math.max(li, ld);
      // the box (coma radii): the coma to 5, the ion tail along x to L, the dust fan to 4 lengths
      const xd = Math.min(L, 4 * ld);
      const wiL = 0.12 + 0.012 * L, wyD = 0.35 + 0.1 * xd, wzD = 0.08 + 0.025 * xd;
      const yLo = Math.max(5, 3 * wiL, 3 * wyD), yHi = Math.max(5, 3 * wiL, bendV * xd * xd / ld + 3 * wyD);
      const zMax = Math.max(5, 3 * wiL, 3 * wzD);
      const boxC = new Vector3((L - 5) / 2, (yHi - yLo) / 2, 0);
      const boxE = new Vector3((L + 5) / 2, (yHi + yLo) / 2, zMax);
      const u = (m.material as ShaderMaterial).uniforms;
      (u.uBoxC.value as Vector3).copy(boxC);
      (u.uBoxE.value as Vector3).copy(boxE);
      // camera in the comet frame (coma radii)
      const camL = nucleus.clone().negate().divideScalar(Rc);
      (u.uCam.value as Vector3).set(camL.dot(X), camL.dot(Y), camL.dot(Z));
      // mesh: unit box -> comet frame (metres, camera-relative)
      m.matrix.makeBasis(X.clone().multiplyScalar(boxE.x * Rc), Y.clone().multiplyScalar(boxE.y * Rc), Z.clone().multiplyScalar(boxE.z * Rc));
      m.matrix.setPosition(nucleus.clone().addScaledVector(X, boxC.x * Rc).addScaledVector(Y, boxC.y * Rc));
      m.matrixWorldNeedsUpdate = true;
      u.uLi.value = li; u.uLd.value = ld; u.uBend.value = bendV; u.uL0.value = L0;
      m.visible = L0 > 0;
    }
    // the nucleus of the nearest drawn comet
    let nearest: { c: Comet; r: number; score: number } | null = null;
    let nd = Infinity;
    for (const e of scored.slice(0, MAX)) {
      const d = e.c.upos.sub(cam, tmp).length();
      if (d < nd) { nd = d; nearest = e; }
    }
    const sunIrr = nearest ? Math.PI / Math.max(nearest.r, 0.05) ** 2 : 0;
    const nearestMesh = nearest ? this.meshes[scored.indexOf(nearest)] : null;
    const comaL0 = nearestMesh ? ((nearestMesh.material as ShaderMaterial).uniforms.uL0.value as number) : 0;
    this.updateNucleus(nearest?.c ?? null, cam, sun, sunIrr, comaL0 * 2);
  }
}
