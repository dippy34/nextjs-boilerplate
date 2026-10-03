import { AdditiveBlending, DoubleSide, Group, Matrix4, Mesh, PlaneGeometry, Quaternion, ShaderMaterial, Vector3 } from 'three';
import type { UPos } from '../core/upos';
import type { Galaxy, GalaxyShape } from '../universe/Galaxies';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

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

  constructor(readonly galaxies: Galaxy[]) {
    this.group.name = 'galaxies';
    for (const g of galaxies) {
      const look = lookFor(g);
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
    for (const g of this.galaxies) {
      g.upos.sub(cam, rel);
      const dist = rel.length();
      const pr = Math.atan2(g.radius, dist) / pixelAngle;
      if (fade > 0.001) this.views.push({ galaxy: g, rel: rel.clone(), dist, pixelRadius: pr });
      const visible = fade > 0.001 && pr > 0.7;
      const clip = 1 / Math.max(dist, 1);
      const disc = this.discs.get(g);
      if (disc) {
        disc.visible = visible;
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
