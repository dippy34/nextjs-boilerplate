import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, Group, Matrix3, Mesh, Points, Quaternion, type Quaternion as Q, ShaderMaterial, SphereGeometry, Vector3 } from 'three';
import { blackbodyRGB, luminance, magToIrradiance } from '../astro/photometry';
import { PC, SUN_RADIUS } from '../core/units';
import type { UPos } from '../core/upos';
import type { CatalogStar } from '../universe/Stars';
import { BODY_VERT } from './shaders/body';
import { STAR_FRAG } from './shaders/star';
import { StarCorona } from './StarCorona';
import { applyStarLook, starLook, starLookUniforms, type StarLook } from './StarLook';
import { PSF_FRAGMENT, PSF_UNIFORMS, PSF_VERTEX } from './shaders/psf';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS, POINT_CLIP } from './shaders/xr';

export const SPRITE_VERT = /* glsl */ `
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
  if (radius <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; return; }
  gl_Position = projectView(viewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
${POINT_CLIP}
  gl_PointSize = 2.0 * radius * uDpr;
  vRadius = radius; vEnergy = energy; vColor = aColor;
}`;
export const SPRITE_FRAG = /* glsl */ `
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
  private coronas: StarCorona[] = [];
  private sphere = new SphereGeometry(1, 128, 64);
  private looks = new Map<string, StarLook>();
  stars: CatalogStar[] = [];

  /** The surface look of a star (stable per star). */
  look(s: CatalogStar): StarLook {
    let l = this.looks.get(s.key);
    if (!l) {
      l = starLook(s.key, s.teff, s.radius / SUN_RADIUS, s.absMag);
      if (this.looks.size > 2000) this.looks.clear();
      this.looks.set(s.key, l);
    }
    return l;
  }

  constructor(psf: Record<string, { value: number }>, private surfaceExposure: { value: number }) {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(this.pos, 3).setUsage(DynamicDrawUsage));
    g.setAttribute('aIrr', new BufferAttribute(this.irr, 1).setUsage(DynamicDrawUsage));
    g.setAttribute('aColor', new BufferAttribute(this.col, 3).setUsage(DynamicDrawUsage));
    this.sprites = new Points(g, new ShaderMaterial({
      name: 'near-star-sprites', vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, uniforms: { ...psf },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    }));
    this.sprites.frustumCulled = false;
    this.sprites.renderOrder = 40; // after black holes, so a star in front of one stays visible
    this.group.add(this.sprites);
  }

  private mesh(i: number): Mesh {
    while (this.meshes.length <= i) {
      const m = new Mesh(this.sphere, new ShaderMaterial({
        name: 'near-star-surface', vertexShader: BODY_VERT, fragmentShader: STAR_FRAG,
        uniforms: {
          uColor: { value: new Vector3() }, uRadiance: { value: 1 }, uExposure: this.surfaceExposure, uTime: { value: 0 }, uBodyToWorld: { value: new Matrix3() },
          ...starLookUniforms(starLook('init', 5772, 1, 4.83)), uLite: LITE.uLite, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
        },
      }));
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      this.group.add(m);
      this.meshes.push(m);
      const c = new StarCorona();
      this.group.add(c.mesh);
      this.coronas.push(c);
    }
    return this.meshes[i];
  }

  /** A mesh to compile the star shader with before it is first needed. */
  warmupObjects(): Mesh[] {
    this.mesh(0);
    return [this.meshes[0], this.coronas[0].mesh];
  }

  update(cam: UPos, pixelAngle: number, time: number, viewQuat?: Q): void {
    let n = 0;
    const rel = new Vector3();
    for (const m of this.meshes) m.visible = false;
    for (const c of this.coronas) c.hide();
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
        const look = this.look(s);
        m.visible = true;
        // spin axis and polar flattening (fast-rotating hot stars)
        const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), look.axis);
        m.matrix.compose(rel, q, new Vector3(s.radius, s.radius, s.radius * (1 - look.flattening)));
        m.matrixWorldNeedsUpdate = true;
        const u = (m.material as ShaderMaterial).uniforms;
        u.uColor.value.set(c[0] / L, c[1] / L, c[2] / L);
        // mean disk radiance = irradiance * d^2 / (pi R^2), independent of distance
        const radiance = (E * d * d) / (Math.PI * s.radius * s.radius);
        u.uRadiance.value = radiance;
        u.uTime.value = time;
        (u.uBodyToWorld.value as Matrix3).setFromMatrix4(m.matrix.clone().makeRotationFromQuaternion(q));
        applyStarLook(u, look);
        if (viewQuat) this.coronas[n].update(rel, s.radius, viewQuat, [c[0] / L, c[1] / L, c[2] / L], radiance * this.surfaceExposure.value, look, time);
      }
      n++;
    }
    this.sprites.geometry.setDrawRange(0, n);
    for (const a of ['position', 'aIrr', 'aColor']) this.sprites.geometry.attributes[a].needsUpdate = true;
  }
}
