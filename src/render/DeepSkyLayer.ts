import {
  AdditiveBlending, BufferAttribute, BufferGeometry, DataTexture, Group, Mesh, PlaneGeometry, Points, ShaderMaterial, Vector3,
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
export class DeepSkyLayer {
  readonly group = new Group();
  views: DeepSkyView[] = [];
  private quads = new Map<DeepSkyObject, Mesh[]>();
  private stars = new Map<DeepSkyObject, Points>();
  private quad = new PlaneGeometry(2, 2);
  readonly gain = { value: 0.6 };

  constructor(readonly objects: DeepSkyObject[], psf: Record<string, { value: number }>, colorLut: DataTexture, vr = false) {
    this.group.name = 'deep-sky';
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

  /** `camPc`: camera position (pc); `adapt`: dark adaptation (1 = dark-adapted). */
  update(cam: UPos, camPc: Vector3, pixelAngle: number, adapt: number): void {
    this.views = [];
    this.gain.value = 0.55 * Math.pow(Math.max(adapt, 0), 0.55);
    const rel = new Vector3();
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
          m.visible = pr > 0.8 && fade > 0.01;
          if (!m.visible) continue;
          const p = rel.clone().addScaledVector(offset, o.radius);
          const s = o.radius * size;
          m.matrix.makeScale(s, s, s).setPosition(p);
          m.matrixWorldNeedsUpdate = true;
          const u = (m.material as ShaderMaterial).uniforms;
          u.uClipScale.value = 1 / Math.max(p.length(), 1);
          if (o.data.kind === 'globular') u.uGain.value = this.gain.value * fade * 1.4;
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
