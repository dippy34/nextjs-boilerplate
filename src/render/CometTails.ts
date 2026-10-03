import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, ShaderMaterial, Vector3 } from 'three';
import { magToIrradiance } from '../astro/photometry';
import { AU } from '../core/units';
import type { UPos } from '../core/upos';
import type { Comet } from './SmallBodies';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

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

const FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uRc;       // coma radius (m)
uniform float uLi;       // ion tail length scale (m)
uniform float uLd;       // dust tail length scale (m)
uniform float uBend;     // dust tail curvature across (-1..1)
uniform float uL0;       // peak coma brightness relative to the Milky Way's typical surface brightness
uniform float uGain;     // display gain of the sky (dark-adapted = 1), shared with the Milky Way
varying vec2 vST;
void main() {
  float s = vST.x, t = vST.y;
  float rho = length(vST);
  // coma: a broad glow and a bright inner part
  float coma = 0.7 * exp(-rho * rho / (2.0 * uRc * uRc)) + 0.3 * exp(-rho / (0.25 * uRc));
  // ion (plasma) tail: narrow, straight away from the Sun, bluish
  float wi = 0.12 * uRc + 0.012 * max(s, 0.0);
  float ion = s > 0.0 ? exp(-t * t / (2.0 * wi * wi)) * exp(-s / uLi) * smoothstep(0.0, uRc, s) : 0.0;
  // dust tail: broader, curving back along the orbit, yellowish
  float tc = uBend * s * s / uLd;
  float wd = 0.35 * uRc + 0.1 * max(s, 0.0);
  float dust = exp(-(t - tc) * (t - tc) / (2.0 * wd * wd)) * exp(-max(s, 0.0) / uLd) * smoothstep(-uRc, uRc, s);
  vec3 c = coma * vec3(1.0, 0.98, 0.92) + ion * 0.35 * vec3(0.45, 0.7, 1.4) + dust * 0.4 * vec3(1.1, 0.95, 0.75);
  gl_FragColor = vec4(min(c * uL0 * 0.1 * uGain, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

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
  private last = new Map<Comet, { p: Vector3; jd: number; v: Vector3 | null }>();

  /** display gain of the sky (xStar / xDark): comets are shown on the same scale as the Milky Way */
  readonly gain = { value: 1 };

  constructor() {
    this.group.name = 'comet-tails';
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(12), 3));
    g.setAttribute('aST', new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    for (let i = 0; i < MAX; i++) {
      const m = new Mesh(g, new ShaderMaterial({
        name: 'comet-tail', vertexShader: VERT, fragmentShader: FRAG,
        uniforms: {
          uNucleus: { value: new Vector3() }, uAxis: { value: new Vector3(1, 0, 0) }, uAcross: { value: new Vector3(0, 1, 0) },
          uExtent: { value: [0, 1, 1, 0] }, uRc: { value: 1 }, uLi: { value: 1 }, uLd: { value: 1 }, uBend: { value: 0 }, uL0: { value: 0 },
          uGain: this.gain, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
        },
        transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
      }));
      m.frustumCulled = false;
      m.visible = false;
      m.renderOrder = 8;
      this.meshes.push(m);
      this.group.add(m);
    }
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
      // motion: from the change of position over time (dust lags behind the nucleus)
      const pos = c.upos.sub(sun, new Vector3());
      const prev = this.last.get(c);
      let v = prev?.v ?? null;
      if (prev && jd !== prev.jd) v = pos.clone().sub(prev.p).divideScalar(jd - prev.jd).normalize();
      this.last.set(c, { p: pos, jd, v });
      const bend = v ? -0.25 * v.dot(across) : 0;
      const Li = Rc * 60 / Math.sqrt(Math.max(r, 0.1));
      const Ld = Rc * 30;
      // radiance: the catalogue magnitude's flux spread over the coma (intrinsic: E x distance^2),
      // relative to the Milky Way's typical surface brightness (~21.5 mag per square arcsecond)
      const E = magToIrradiance(c.apparentMag);
      const L0 = (0.6 * E * dist * dist) / (2 * Math.PI * Rc * Rc) / MW_RADIANCE;
      const u = (m.material as ShaderMaterial).uniforms;
      (u.uNucleus.value as Vector3).copy(nucleus);
      (u.uAxis.value as Vector3).copy(axis);
      (u.uAcross.value as Vector3).copy(across);
      u.uExtent.value = [-3 * Rc, Math.max(Li, Ld) * 3, Math.max(3 * Rc, 0.4 * Ld * 3), 0];
      u.uRc.value = Rc; u.uLi.value = Li; u.uLd.value = Ld; u.uBend.value = bend; u.uL0.value = L0;
      m.visible = L0 > 0;
    }
    if (this.last.size > 400) this.last.clear();
  }
}
