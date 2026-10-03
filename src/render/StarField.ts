import {
  AdditiveBlending, BufferAttribute, BufferGeometry, DataTexture, Group, LinearFilter, Points, RGBAFormat,
  ShaderMaterial, Vector3,
} from 'three';
import { buildStarColorLut } from '../astro/photometry';
import type { StarCatalog, StarNode } from '../universe/StarCatalog';
import { PSF_FRAGMENT, PSF_UNIFORMS, PSF_VERTEX } from './shaders/psf';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

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
const float PC = 3.0856775814913673e16;
void main() {
  vec3 rel = uOffset + aPos * uScale;
  float d = length(rel);
  float absMag = uAbsMin + mod(aMT, 256.0) * uAbsStep;
  float m = absMag + 1.50515 * log2(max(d, 1e-9)) - 5.0 + uExtinction;  // 5 log10(d) = 1.50515 log2(d)
  float energy;
  float radius = psfSetup(magToIrradiance(m), energy);
  if (radius <= 0.0 || d < uHideRadius) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }
  gl_Position = projectView(viewMatrix * vec4(rel * PC, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
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
    uSat: { value: 1.7 },
    uHalo: { value: 1 },
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
      vertexShader: STAR_VERT,
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
    Object.assign(mat.uniforms, this.psf, { uColorLut: { value: this.colorLut } });
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
