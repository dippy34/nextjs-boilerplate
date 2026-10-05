import {
  AdditiveBlending, BufferAttribute, BufferGeometry, DataTexture, Group, LinearFilter, Points, RGBAFormat,
  ShaderMaterial, Vector3,
} from 'three';
import { buildStarColorLut } from '../astro/photometry';
import type { StarCatalog, StarNode } from '../universe/StarCatalog';
import { PSF_FRAGMENT, PSF_UNIFORMS, PSF_VERTEX, TWINKLE_VERTEX } from './shaders/psf';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS, POINT_CLIP } from './shaders/xr';

export const STAR_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
${PSF_UNIFORMS}
attribute vec3 aPos;
attribute float aMT;
uniform vec3 uOffset;      // node origin minus camera (pc)
uniform float uScale;      // pc per position unit
uniform float uAbsMin;
uniform float uAbsStep;
uniform float uHideRadius; // pc: closer stars are drawn by the near-star renderer
uniform float uExtinction; // mag of dust between the eye and this group of stars
uniform sampler2D uColorLut;
varying vec3 vColor;
varying float vEnergy;
varying float vRadius;
${PSF_VERTEX}
${TWINKLE_VERTEX}
const float PC = 3.0856775814913673e16;
void main() {
  vec3 rel = uOffset + aPos * uScale;
  float d = length(rel);
  float absMag = uAbsMin + mod(aMT, 256.0) * uAbsStep;
  float m = absMag + 1.50515 * log2(max(d, 1e-9)) - 5.0 + uExtinction;  // 5 log10(d) = 1.50515 log2(d)
  float energy;
  float radius = psfSetup(magToIrradiance(m) * twinkle(rel / max(d, 1e-30), aPos.x * 73.1 + aPos.y * 19.7 + aPos.z * 41.3 + aMT * 0.37), energy);
  if (radius <= 0.0 || d < uHideRadius) {
    // culled: outside the clip volume. (A point size <= 0 is undefined in GLSL ES and crashes
    // some software rasterisers, so keep it at 1.)
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 1.0;
    return;
  }
  gl_Position = projectView(viewMatrix * vec4(rel * PC, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
${POINT_CLIP}
  gl_PointSize = 2.0 * radius * uDpr;
  vRadius = radius;
  vEnergy = energy;
  vColor = texture2D(uColorLut, vec2(floor(aMT / 256.0) / 255.0, 0.5)).rgb * 2.0;
}`;

export const STAR_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
${PSF_UNIFORMS}
varying vec3 vColor;
varying float vEnergy;
varying float vRadius;
${PSF_FRAGMENT}
void main() {
  gl_FragColor = vec4(psfShade(gl_PointCoord, vRadius, vEnergy, vColor), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/**
 * Scintillation: stars twinkle only when seen through an atmosphere (turbulent air bends their
 * light), more the closer they are to the horizon (more air on the way). Shared by every star layer.
 */
export const TWINKLE = {
  uTwinkle: { value: 0 },             // strength (1 = standing on Earth's surface)
  uTwUp: { value: new Vector3(0, 0, 1) }, // local zenith (world)
  uTwTime: { value: 0 },
};

/** Strength of twinkling for an observer `altitude` m up in an atmosphere of zenith optical depth `tau` and scale height `H` (m). */
export function twinkleStrength(tau: number, H: number, altitude: number): number {
  return Math.min(1.5, Math.max(0, (tau * Math.exp(-Math.max(altitude, 0) / H)) / 0.1));
}

interface TwinkleView { body: { radius: number }; rel: Vector3; dist: number; resolved: boolean }
/** Update TWINKLE from the bodies around the camera (`spec` gives a body's atmosphere, if any). */
export function updateTwinkle<V extends TwinkleView>(views: Iterable<V>, spec: (v: V) => { betaR: number[]; HR: number; top: number } | null, time: number): void {
  let best = 0;
  for (const v of views) {
    if (!v.resolved) continue;
    const a = spec(v);
    if (!a) continue;
    const alt = v.dist - v.body.radius;
    if (alt > a.top) continue;
    const k = twinkleStrength(a.betaR[1] * a.HR, a.HR, alt);
    if (k > best) { best = k; TWINKLE.uTwUp.value.copy(v.rel).negate().normalize(); }
  }
  TWINKLE.uTwinkle.value = best;
  TWINKLE.uTwTime.value = time % 1000;
}

export class StarFieldLayer {
  readonly group = new Group();
  private objects = new Map<number, Points>();
  readonly colorLut: DataTexture;
  private template: ShaderMaterial;
  /** shared PSF uniforms (also used by other point layers) */
  readonly psf: Record<string, { value: number }> = {
    uExposure: { value: 1 },
    uPixelSA: { value: 1e-6 },
    uMinEnergy: { value: 0.004 },
    uMaxRadius: { value: 64 },
    uGlare: { value: 1 },
    uPointGamma: { value: 0.55 },
    uPointGain: { value: 2.5 },
    uDpr: { value: 1 },
    uMaxEnergy: { value: 8000 },
    uSat: { value: 1.3 },
    uHalo: { value: 1 },
    uMinSigma: { value: 0.6 },
    uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
  };

  constructor(private catalog: StarCatalog, sharedPsf?: Record<string, { value: number }>) {
    if (sharedPsf) this.psf = sharedPsf;
    this.group.name = 'catalog-stars';
    this.colorLut = new DataTexture(buildStarColorLut(256), 256, 1, RGBAFormat);
    this.colorLut.magFilter = LinearFilter;
    this.colorLut.minFilter = LinearFilter;
    this.colorLut.needsUpdate = true;
    this.template = new ShaderMaterial({
      name: 'star-field', vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: {
        ...this.psf,
        uOffset: { value: new Vector3() },
        uScale: { value: 1 },
        uAbsMin: { value: -12 },
        uAbsStep: { value: 0.125 },
        uHideRadius: { value: 0.0 },
        uExtinction: { value: 0.0 },
        uColorLut: { value: this.colorLut },
        ...TWINKLE,
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: AdditiveBlending,
    });
    catalog.onNodeEvicted = (n) => this.release(n);
  }

  private create(n: StarNode): Points {
    const geo = new BufferGeometry();
    const posAttr = n.enc === 'u' ? new BufferAttribute(n.pos as Uint16Array, 3, true) : new BufferAttribute(n.pos as Float32Array, 3);
    geo.setAttribute('aPos', posAttr);
    geo.setAttribute('aMT', new BufferAttribute(n.mt!, 1, false));
    // three needs a `position` attribute to know the vertex count
    geo.setAttribute('position', posAttr);
    const mat = this.template.clone();
    // share the PSF uniform objects so one update reaches every node
    Object.assign(mat.uniforms, this.psf, TWINKLE, { uColorLut: { value: this.colorLut } });
    const pts = new Points(geo, mat);
    pts.frustumCulled = false;
    pts.matrixAutoUpdate = false;
    pts.name = `star-node-${n.id}`;
    this.objects.set(n.id, pts);
    this.group.add(pts);
    return pts;
  }

  private release(n: StarNode): void {
    const p = this.objects.get(n.id);
    if (!p) return;
    this.group.remove(p);
    p.geometry.dispose();
    (p.material as ShaderMaterial).dispose();
    this.objects.delete(n.id);
  }

  /** `camPc`: camera position in parsecs (double). */
  update(camPc: Vector3, hideRadiusPc: number): void {
    for (const p of this.objects.values()) p.visible = false;
    for (const n of this.catalog.needed) {
      if (n.drawCount === 0) continue;
      const pts = this.objects.get(n.id) ?? this.create(n);
      const { origin, scale } = this.catalog.nodeFrame(n);
      const u = (pts.material as ShaderMaterial).uniforms;
      u.uOffset.value.set(origin[0] - camPc.x, origin[1] - camPc.y, origin[2] - camPc.z);
      u.uScale.value = scale;
      u.uHideRadius.value = hideRadiusPc;
      pts.geometry.setDrawRange(0, n.drawCount);
      pts.visible = true;
    }
  }

  get drawnStars(): number {
    let s = 0;
    for (const n of this.catalog.needed) s += n.drawCount;
    return s;
  }
}
