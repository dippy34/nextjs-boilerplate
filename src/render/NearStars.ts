import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, Group, Matrix3, Matrix4, Mesh, Points, ShaderMaterial, SphereGeometry, Vector3 } from 'three';
import { blackbodyRGB, luminance, magToIrradiance } from '../astro/photometry';
import { PC } from '../core/units';
import type { UPos } from '../core/upos';
import type { CatalogStar } from '../universe/Stars';
import { BODY_VERT, STAR_FRAG } from './shaders/body';
import { PSF_FRAGMENT, PSF_UNIFORMS, PSF_VERTEX } from './shaders/psf';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

const SPRITE_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
${PSF_UNIFORMS}
attribute float aIrr;
attribute vec3 aColor;
varying vec3 vColor; varying float vEnergy; varying float vRadius;
${PSF_VERTEX}
void main() {
  float energy;
  float radius = psfSetup(aIrr, energy);
  if (radius <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  gl_Position = projectView(viewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
  gl_PointSize = 2.0 * radius * uDpr;
  vRadius = radius; vEnergy = energy; vColor = aColor;
}`;
const SPRITE_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
${PSF_UNIFORMS}
varying vec3 vColor; varying float vEnergy; varying float vRadius;
${PSF_FRAGMENT}
void main() {
  gl_FragColor = vec4(psfShade(gl_PointCoord, vRadius, vEnergy, vColor), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

const MAX = 32;

/**
 * Catalogue stars closer than the star-field hide radius are drawn here
 * individually in double precision: a point sprite while unresolved and a
 * limb-darkened sphere (estimated radius) once the disk spans pixels.
 */
export class NearStarsLayer {
  readonly group = new Group();
  private sprites: Points;
  private pos = new Float32Array(MAX * 3);
  private irr = new Float32Array(MAX);
  private col = new Float32Array(MAX * 3);
  private meshes: Mesh[] = [];
  private sphere = new SphereGeometry(1, 96, 48);
  stars: CatalogStar[] = [];

  constructor(psf: Record<string, { value: number }>, private surfaceExposure: { value: number }) {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(this.pos, 3).setUsage(DynamicDrawUsage));
    g.setAttribute('aIrr', new BufferAttribute(this.irr, 1).setUsage(DynamicDrawUsage));
    g.setAttribute('aColor', new BufferAttribute(this.col, 3).setUsage(DynamicDrawUsage));
    this.sprites = new Points(g, new ShaderMaterial({
      vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, uniforms: { ...psf },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    }));
    this.sprites.frustumCulled = false;
    this.sprites.renderOrder = 40; // after black holes, so a star in front of one stays visible
    this.group.add(this.sprites);
  }

  private mesh(i: number): Mesh {
    while (this.meshes.length <= i) {
      const m = new Mesh(this.sphere, new ShaderMaterial({
        vertexShader: BODY_VERT, fragmentShader: STAR_FRAG,
        uniforms: { uColor: { value: new Vector3() }, uRadiance: { value: 1 }, uExposure: this.surfaceExposure, uTime: { value: 0 }, uBodyToWorld: { value: new Matrix3() }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
      }));
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      this.group.add(m);
      this.meshes.push(m);
    }
    return this.meshes[i];
  }

  update(cam: UPos, pixelAngle: number, time: number): void {
    let n = 0;
    const rel = new Vector3();
    for (const m of this.meshes) m.visible = false;
    for (const s of this.stars.slice(0, MAX)) {
      s.upos.sub(cam, rel);
      const d = rel.length();
      const dPc = d / PC;
      const E = magToIrradiance(s.absMag + 5 * Math.log10(Math.max(dPc, 1e-12)) - 5);
      const c = blackbodyRGB(s.teff);
      const L = luminance(c);
      const pxR = Math.asin(Math.min(1, s.radius / Math.max(d, s.radius * 1.0001))) / pixelAngle;
      const fade = 1 - Math.min(1, Math.max(0, (pxR - 0.6) / 1.2));
      this.pos.set([rel.x, rel.y, rel.z], n * 3);
      this.irr[n] = E * fade;
      this.col.set([c[0] / L, c[1] / L, c[2] / L], n * 3);
      if (pxR > 0.6) {
        const m = this.mesh(n);
        m.visible = true;
        m.matrix.copy(new Matrix4().makeScale(s.radius, s.radius, s.radius)).setPosition(rel);
        m.matrixWorldNeedsUpdate = true;
        const u = (m.material as ShaderMaterial).uniforms;
        u.uColor.value.set(c[0] / L, c[1] / L, c[2] / L);
        // mean disk radiance = irradiance * d^2 / (pi R^2), independent of distance
        u.uRadiance.value = (E * d * d) / (Math.PI * s.radius * s.radius);
        u.uTime.value = time;
      }
      n++;
    }
    this.sprites.geometry.setDrawRange(0, n);
    for (const a of ['position', 'aIrr', 'aColor']) this.sprites.geometry.attributes[a].needsUpdate = true;
  }
}
