import {
  AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, Group, InterleavedBuffer, InterleavedBufferAttribute,
  Matrix3, Points, ShaderMaterial, Vector3,
} from 'three';
import { OBLIQUITY_J2000 } from '../core/frames';
import { AU } from '../core/units';
import { UPos } from '../core/upos';
import type { SpaceObject } from '../universe/Body';
import type { SolarSystem } from '../universe/SolarSystem';
import { PSF_FRAGMENT, PSF_UNIFORMS, PSF_VERTEX } from './shaders/psf';
import { FIX_LOGDEPTH, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

const ASTEROID_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
${PSF_UNIFORMS}
attribute vec4 aOrb0;   // a (AU), e, i (deg), node (deg)
attribute vec4 aOrb1;   // peri (deg), M at reference epoch (deg), H, class
uniform float uDt;      // days since reference epoch
uniform vec3 uSunRel;   // camera-relative Sun position (m)
uniform mat3 uEclToEqu;
uniform float uBoost;
varying vec3 vColor; varying float vEnergy; varying float vRadius;
${PSF_VERTEX}
const float AU_M = 149597870700.0;
void main() {
  float a = aOrb0.x, e = aOrb0.y;
  float inc = radians(aOrb0.z), node = radians(aOrb0.w), peri = radians(aOrb1.x);
  float n = 0.98560766 / (a * sqrt(a));                  // deg/day (Gauss)
  float M = radians(mod(aOrb1.y + n * uDt, 360.0));
  if (M > PI) M -= 2.0 * PI;
  float E = M + e * sin(M);
  for (int k = 0; k < 6; k++) E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
  vec2 pf = vec2(a * (cos(E) - e), a * sqrt(1.0 - e * e) * sin(E));
  float cO = cos(node), sO = sin(node), ci = cos(inc), si = sin(inc), cw = cos(peri), sw = sin(peri);
  vec3 ecl = vec3(
    (cO * cw - sO * sw * ci) * pf.x + (-cO * sw - sO * cw * ci) * pf.y,
    (sO * cw + cO * sw * ci) * pf.x + (-sO * sw + cO * cw * ci) * pf.y,
    (sw * si) * pf.x + (cw * si) * pf.y);
  vec3 helio = uEclToEqu * ecl;                           // AU
  vec3 rel = uSunRel + helio * AU_M;
  float r = length(helio);
  float delta = length(rel) / AU_M;
  float cosA = dot(helio, rel / AU_M) / max(r * delta, 1e-12);
  float alpha = acos(clamp(cosA, -1.0, 1.0));
  // IAU H,G magnitude system (G = 0.15)
  float t = tan(alpha * 0.5);
  float phi = 0.85 * exp(-3.33 * pow(t, 0.63)) + 0.15 * exp(-1.87 * pow(t, 1.22));
  float V = aOrb1.z + 5.0 * log2(r * max(delta, 1e-9)) * 0.30103 - 2.5 * log2(max(phi, 1e-6)) * 0.30103;
  float energy;
  // Artistic boost only for distant asteroids (belt structure); physical within ~0.05 AU.
  float boost = mix(1.0, uBoost, smoothstep(0.05, 0.5, delta));
  float radius = psfSetup(magToIrradiance(V) * boost, energy);
  if (radius <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  gl_Position = projectView(viewMatrix * vec4(rel, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
  gl_PointSize = 2.0 * radius * uDpr;
  vRadius = radius; vEnergy = energy;
  vColor = aOrb1.w > 9.5 ? vec3(0.95, 0.9, 1.0) : vec3(1.0, 0.93, 0.82);
}`;

const COMET_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
${PSF_UNIFORMS}
attribute float aMag;
uniform vec3 uSunRel;
uniform float uBoost;
varying vec3 vColor; varying float vEnergy; varying float vRadius;
${PSF_VERTEX}
const float AU_M = 149597870700.0;
void main() {
  vec3 rel = uSunRel + position * AU_M;
  float energy;
  float radius = aMag > 90.0 ? 0.0 : psfSetup(magToIrradiance(aMag) * uBoost, energy);
  if (radius <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  gl_Position = projectView(viewMatrix * vec4(rel, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
  gl_PointSize = 2.0 * radius * uDpr;
  vRadius = radius; vEnergy = energy; vColor = vec3(0.75, 0.95, 1.0);
}`;

const FRAG = /* glsl */ `
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

type CometRow = [string, string, number, number, number, number, number, number, number | null, number | null, number | null, number];

/** A comet as a selectable object (position from the latest worker result). */
export class Comet implements SpaceObject {
  readonly kind = 'comet';
  readonly upos = new UPos();
  readonly radius: number;
  readonly parentObject = null;
  apparentMag = 99;
  constructor(readonly key: string, readonly name: string, readonly row: CometRow) {
    this.radius = row[10] ? (row[10] * 1e3) / 2 : 0;
  }
  info(): [string, string][] {
    const [, prefix, e, q, i] = this.row;
    const kinds: Record<string, string> = { P: 'Periodic comet', C: 'Non-periodic comet', D: 'Defunct comet', I: 'Interstellar object', X: 'Comet (uncertain orbit)', A: 'Comet-like asteroid' };
    const rows: [string, string][] = [['Type', kinds[prefix] ?? 'Comet']];
    rows.push(['Perihelion distance', `${q.toFixed(4)} AU`], ['Eccentricity', e.toFixed(6)], ['Inclination', `${i.toFixed(3)}°`]);
    if (e < 1) rows.push(['Period', `${(Math.pow(q / (1 - e), 1.5)).toFixed(2)} yr`]);
    if (this.row[10]) rows.push(['Nucleus diameter', `${this.row[10]} km`]);
    if (this.apparentMag < 90) rows.push(['Total magnitude (est.)', this.apparentMag.toFixed(1)]);
    return rows;
  }
}

export class SmallBodiesLayer {
  readonly group = new Group();
  asteroids: Points | null = null;
  comets: Points | null = null;
  readonly cometObjects: Comet[] = [];
  /** artistic brightness multiplier for distant asteroids so belts read like SpaceEngine (1 = physical) */
  boost = 3e5;
  private refEpoch = 0;
  private worker: Worker | null = null;
  private busy = false;
  private cometPos: Float32Array | null = null;
  private cometMag: Float32Array | null = null;
  private eclToEqu = new Matrix3().set(1, 0, 0, 0, Math.cos(OBLIQUITY_J2000), -Math.sin(OBLIQUITY_J2000), 0, Math.sin(OBLIQUITY_J2000), Math.cos(OBLIQUITY_J2000));

  constructor(private system: SolarSystem, private psf: Record<string, { value: number }>) {
    this.group.name = 'small-bodies';
  }

  async load(base: string): Promise<void> {
    const [meta, bin, comets] = await Promise.all([
      fetch(`${base}/solar/asteroids.json`).then((r) => r.json()),
      fetch(`${base}/solar/asteroids.bin`).then((r) => r.arrayBuffer()),
      fetch(`${base}/solar/comets.json`).then((r) => r.json()),
    ]);
    this.refEpoch = meta.refEpochJd;
    const data = new Float32Array(bin);
    const ib = new InterleavedBuffer(data, 8);
    const geo = new BufferGeometry();
    geo.setAttribute('aOrb0', new InterleavedBufferAttribute(ib, 4, 0));
    geo.setAttribute('aOrb1', new InterleavedBufferAttribute(ib, 4, 4));
    geo.setAttribute('position', new InterleavedBufferAttribute(ib, 3, 0));
    const mat = new ShaderMaterial({
      vertexShader: ASTEROID_VERT, fragmentShader: FRAG,
      uniforms: { ...this.psf, uHalo: { value: 0.2 }, uDt: { value: 0 }, uSunRel: { value: new Vector3() }, uEclToEqu: { value: this.eclToEqu }, uBoost: { value: this.boost } },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    this.asteroids = new Points(geo, mat);
    this.asteroids.frustumCulled = false;
    this.asteroids.renderOrder = 9;
    this.asteroids.name = 'asteroids';
    this.group.add(this.asteroids);

    const rows = comets.comets as CometRow[];
    rows.forEach((r) => this.cometObjects.push(new Comet(`comet:${r[11]}`, r[0], r)));
    const cgeo = new BufferGeometry();
    cgeo.setAttribute('position', new BufferAttribute(new Float32Array(rows.length * 3), 3).setUsage(DynamicDrawUsage));
    cgeo.setAttribute('aMag', new BufferAttribute(new Float32Array(rows.length).fill(99), 1).setUsage(DynamicDrawUsage));
    const cmat = new ShaderMaterial({
      vertexShader: COMET_VERT, fragmentShader: FRAG,
      uniforms: { ...this.psf, uHalo: { value: 0.2 }, uSunRel: { value: new Vector3() }, uBoost: { value: 1 } },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    this.comets = new Points(cgeo, cmat);
    this.comets.frustumCulled = false;
    this.comets.renderOrder = 9;
    this.comets.name = 'comets';
    this.group.add(this.comets);

    this.worker = new Worker(new URL('../workers/comets.worker.ts', import.meta.url), { type: 'module' });
    this.worker.postMessage({ type: 'init', comets: rows });
    this.worker.onmessage = (ev) => {
      if (ev.data.type !== 'result') return;
      this.busy = false;
      this.cometPos = ev.data.pos;
      this.cometMag = ev.data.mag;
      const g = this.comets!.geometry;
      (g.attributes.position as BufferAttribute).copyArray(this.cometPos!);
      (g.attributes.aMag as BufferAttribute).copyArray(this.cometMag!);
      g.attributes.position.needsUpdate = true;
      g.attributes.aMag.needsUpdate = true;
      this.syncCometObjects();
    };
  }

  private syncCometObjects(): void {
    const sun = this.system.sun;
    const p = this.cometPos!, m = this.cometMag!;
    for (let i = 0; i < this.cometObjects.length; i++) {
      const c = this.cometObjects[i];
      c.upos.copy(sun.upos).addXYZ(p[i * 3] * AU, p[i * 3 + 1] * AU, p[i * 3 + 2] * AU);
      c.apparentMag = m[i];
    }
  }

  update(cam: UPos, jd: number): void {
    const sunRel = this.system.sun.upos.sub(cam, new Vector3());
    if (this.asteroids) {
      const u = (this.asteroids.material as ShaderMaterial).uniforms;
      u.uDt.value = jd - this.refEpoch;
      u.uSunRel.value.copy(sunRel);
      u.uBoost.value = this.boost;
    }
    if (this.comets) {
      const u = (this.comets.material as ShaderMaterial).uniforms;
      u.uSunRel.value.copy(sunRel);
    }
    if (this.worker && !this.busy) {
      this.busy = true;
      const obs = sunRel.clone().negate();
      this.worker.postMessage({ type: 'compute', jd, observer: [obs.x, obs.y, obs.z] });
    }
  }
}
