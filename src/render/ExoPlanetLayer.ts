import {
  AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, DynamicDrawUsage, Group, Line, LineBasicMaterial, Matrix3,
  Mesh, Points, Quaternion, RingGeometry, ShaderMaterial, SphereGeometry, Vector3,
} from 'three';
import { blackbodyRGB, luminance, magToIrradiance } from '../astro/photometry';
import { PC } from '../core/units';
import type { UPos } from '../core/upos';
import { type ExoPlanet, hashKey, type PlanetarySystem, type PlanetType, rng } from '../universe/Planets';
import { SPRITE_FRAG, SPRITE_VERT } from './NearStars';
import { BODY_VERT } from './shaders/body';
import { EXO_FRAG } from './shaders/planet';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';
import { ExoPlanet as ExoPlanetClass, PlanetarySystem as SystemClass } from '../universe/Planets';
import { CatalogStar } from '../universe/Stars';

const TYPE_ID: Record<PlanetType, number> = { lava: 0, hot: 1, desert: 2, terran: 3, ocean: 4, ice: 5, subneptune: 6, icegiant: 7, giant: 8, hotgiant: 9 };
type V3 = [number, number, number];

/** A planet's palette and surface parameters, varied by its seed within its type. */
function paletteFor(p: ExoPlanet): Record<string, number | V3> {
  const t = p.spec.type;
  const r = rng(hashKey(p.key + '/look'));
  const jit = (c: V3, k = 0.18): V3 => [c[0] * (1 + k * (r() - 0.5)), c[1] * (1 + k * (r() - 0.5)), c[2] * (1 + k * (r() - 0.5))];
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  const base = { uSeaLevel: 0, uIceLat: 1.2, uClouds: 0, uAtmo: 0, uBands: 10, uTurb: 0.6, uGlow: 0, uSea: [0.02, 0.06, 0.15] as V3, uAtmoColor: [0.4, 0.6, 1.0] as V3 };
  switch (t) {
    case 'lava': return { ...base, uC1: jit([0.06, 0.05, 0.05]), uC2: jit([0.2, 0.15, 0.12]), uC3: [0.3, 0.25, 0.2], uGlow: 0.7 + 0.6 * r() };
    case 'hot': return { ...base, uC1: jit([0.3, 0.27, 0.25]), uC2: jit([0.5, 0.45, 0.4]), uC3: jit([0.7, 0.65, 0.6]), uAtmo: r() < 0.3 ? 0.5 : 0, uAtmoColor: [1, 0.8, 0.5] };
    case 'desert': {
      const c = pick<V3>([[0.6, 0.38, 0.2], [0.7, 0.55, 0.35], [0.55, 0.3, 0.22], [0.75, 0.68, 0.55]]);
      return { ...base, uC1: jit(c), uC2: jit([c[0] * 1.2, c[1] * 1.2, c[2] * 1.15]), uC3: jit([0.85, 0.78, 0.65]), uAtmo: 0.5, uAtmoColor: [1, 0.8, 0.6], uIceLat: r() < 0.5 ? 0.85 : 1.2 };
    }
    case 'terran': case 'ocean': {
      // vegetation of other worlds needn't be green
      const veg = pick<V3>([[0.1, 0.24, 0.07], [0.22, 0.25, 0.1], [0.3, 0.15, 0.1], [0.2, 0.1, 0.22], [0.35, 0.3, 0.18]]);
      return {
        ...base, uC1: jit(veg), uC2: jit([0.4, 0.33, 0.24]), uC3: jit([0.62, 0.6, 0.58]), uSea: jit([0.015, 0.05, 0.13], 0.4),
        uSeaLevel: t === 'ocean' ? 0.62 + 0.08 * r() : 0.4 + 0.15 * r(), uIceLat: 0.7 + 0.25 * r(), uClouds: 0.35 + 0.5 * r(),
        uAtmo: 0.9, uAtmoColor: [0.35, 0.55, 1.0],
      };
    }
    case 'ice': return { ...base, uC1: jit([0.6, 0.65, 0.7]), uC2: jit([0.75, 0.8, 0.86]), uC3: [0.95, 0.97, 1.0], uIceLat: 1.2, uAtmo: r() < 0.3 ? 0.4 : 0 };
    case 'subneptune': {
      const c = pick<V3>([[0.45, 0.62, 0.72], [0.55, 0.65, 0.6], [0.6, 0.6, 0.7], [0.5, 0.7, 0.75]]);
      return { ...base, uC1: jit(c), uC2: jit([c[0] * 1.15, c[1] * 1.12, c[2] * 1.1]), uC3: jit([0.82, 0.88, 0.92]), uBands: 5 + 6 * r(), uTurb: 0.25, uAtmo: 1.0, uAtmoColor: [0.6, 0.8, 1.0] };
    }
    case 'icegiant': {
      const c = pick<V3>([[0.25, 0.45, 0.85], [0.45, 0.75, 0.85], [0.3, 0.55, 0.7]]);
      return { ...base, uC1: jit(c), uC2: jit([c[0] * 1.2, c[1] * 1.15, c[2] * 1.05]), uC3: jit([0.75, 0.85, 0.95]), uBands: 4 + 5 * r(), uTurb: 0.35, uAtmo: 0.8, uAtmoColor: [0.5, 0.7, 1.0] };
    }
    case 'giant': {
      const pal = pick<[V3, V3, V3]>([
        [[0.55, 0.4, 0.28], [0.85, 0.75, 0.6], [0.95, 0.9, 0.82]], // Jupiter-like
        [[0.75, 0.62, 0.42], [0.88, 0.8, 0.62], [0.95, 0.9, 0.78]], // Saturn-like
        [[0.45, 0.42, 0.5], [0.7, 0.68, 0.75], [0.9, 0.88, 0.92]], // cold, pale
        [[0.6, 0.35, 0.25], [0.8, 0.6, 0.45], [0.9, 0.8, 0.7]],    // ruddy
      ]);
      return { ...base, uC1: jit(pal[0]), uC2: jit(pal[1]), uC3: jit(pal[2]), uBands: 8 + 10 * r(), uTurb: 0.5 + 0.7 * r(), uAtmo: 0.5, uAtmoColor: [0.9, 0.85, 0.8] };
    }
    case 'hotgiant': return { ...base, uC1: jit([0.06, 0.06, 0.09]), uC2: jit([0.14, 0.12, 0.18]), uC3: jit([0.3, 0.25, 0.3]), uBands: 6 + 6 * r(), uTurb: 0.8, uGlow: 0.6 + 0.5 * r(), uAtmo: 0.4, uAtmoColor: [0.6, 0.5, 0.9] };
  }
}

const RING_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec2 vXY;
void main() {
  vXY = position.xy;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;
const RING_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uSeed;
uniform float uLight;   // reflected radiance x exposure for a white ring particle
varying vec2 vXY;
float h1(float n) { return fract(sin(n) * 43758.5453123); }
float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i + uSeed), h1(i + 1.0 + uSeed), f); }
void main() {
  float r = length(vXY);          // 1.4 .. 2.6 planet radii
  float t = (r - 1.4) / 1.2;
  float dens = 0.25 + 0.75 * n1(t * 23.0) * (0.6 + 0.4 * n1(t * 90.0 + 3.0));
  dens *= smoothstep(0.0, 0.05, t) * smoothstep(1.0, 0.9, t);
  dens *= step(0.06, abs(t - 0.62 - 0.1 * h1(uSeed))); // a gap
  gl_FragColor = vec4(uColor * uLight * dens, dens * 0.85);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

interface PlanetDraw { mesh: Mesh; ring: Mesh | null; orbit: Line }

export interface ExoView { planet: ExoPlanet; rel: Vector3; dist: number; pixelRadius: number; radiance: number }

/**
 * Draws the planets of the planetary systems near the explorer: a procedurally textured sphere once
 * a planet spans a pixel, a star-lit point before that, rings for some giants, and faint orbits.
 */
export class ExoPlanetLayer {
  readonly group = new Group();
  views: ExoView[] = [];
  showOrbits = true;
  private draws = new Map<ExoPlanet, PlanetDraw>();
  private sphere = new SphereGeometry(1, 128, 64);
  private ringGeo = new RingGeometry(1.4, 2.6, 128, 1);
  private sprites: Points;
  private sp = { pos: new Float32Array(64 * 3), irr: new Float32Array(64), col: new Float32Array(64 * 3) };

  constructor(psf: Record<string, { value: number }>, private exposure: { value: number }) {
    this.group.name = 'exoplanets';
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(this.sp.pos, 3).setUsage(DynamicDrawUsage));
    g.setAttribute('aIrr', new BufferAttribute(this.sp.irr, 1).setUsage(DynamicDrawUsage));
    g.setAttribute('aColor', new BufferAttribute(this.sp.col, 3).setUsage(DynamicDrawUsage));
    this.sprites = new Points(g, new ShaderMaterial({
      name: 'exoplanet-sprites', vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, uniforms: { ...psf, uHalo: { value: 0.3 } },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    }));
    this.sprites.frustumCulled = false;
    this.sprites.renderOrder = 10;
    this.group.add(this.sprites);
  }

  private draw(p: ExoPlanet): PlanetDraw {
    let d = this.draws.get(p);
    if (d) return d;
    const pal = paletteFor(p);
    const u: Record<string, { value: unknown }> = {
      uType: { value: TYPE_ID[p.spec.type] }, uSeed: { value: p.spec.seed % 97 }, uLumpy: { value: 0 },
      uSunDir: { value: new Vector3(1, 0, 0) }, uSunColor: { value: new Vector3(1, 1, 1) }, uSunIrr: { value: Math.PI },
      uExposure: this.exposure, uTime: { value: 0 }, uBodyToWorld: { value: new Matrix3() },
      uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK, uLite: LITE.uLite,
    };
    for (const [k, v] of Object.entries(pal)) u[k] = { value: Array.isArray(v) ? new Vector3(...v) : v };
    const mesh = new Mesh(this.sphere, new ShaderMaterial({ name: 'exoplanet', vertexShader: BODY_VERT, fragmentShader: EXO_FRAG, uniforms: u }));
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    mesh.name = p.name;
    this.group.add(mesh);
    let ring: Mesh | null = null;
    if (p.spec.rings) {
      const c = (pal.uC3 as V3);
      ring = new Mesh(this.ringGeo, new ShaderMaterial({
        name: 'exoplanet-ring', vertexShader: RING_VERT, fragmentShader: RING_FRAG,
        uniforms: { uColor: { value: new Vector3(c[0] * 0.9, c[1] * 0.88, c[2] * 0.85) }, uSeed: { value: p.spec.seed % 13 }, uLight: { value: 1 },
          uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
        transparent: true, depthWrite: false, side: DoubleSide,
      }));
      ring.matrixAutoUpdate = false;
      ring.frustumCulled = false;
      ring.renderOrder = 3;
      this.group.add(ring);
    }
    const n = 160;
    const og = new BufferGeometry();
    og.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3).setUsage(DynamicDrawUsage));
    const orbit = new Line(og, new LineBasicMaterial({ color: 0x6f8fd0, transparent: true, opacity: 0.35, depthWrite: false }));
    orbit.frustumCulled = false;
    orbit.renderOrder = 5;
    this.group.add(orbit);
    d = { mesh, ring, orbit };
    this.draws.set(p, d);
    return d;
  }

  private dummy: PlanetDraw | null = null;
  /** A hidden planet (with rings) whose materials the app compiles ahead of first use. */
  warmupObjects(): Mesh[] {
    if (!this.dummy) {
      const host = new CatalogStar('warmup', new Vector3(1e6, 0, 0), 5, 5800, 'G2V', ['warmup'], null);
      const sys = new SystemClass(host, [{
        name: 'warmup b', real: false, est: [], aM: 1.5e11, e: 0, inc: 0, node: 0, omega: 0, M0: 0, periodS: 3e7, radiusM: 7e7,
        massKg: 1e27, teqK: 120, type: 'giant', albedo: 0.5, rings: true, seed: 1, rotS: 4e4,
      }], false, new Vector3(0, 0, 1));
      this.dummy = this.draw(sys.planets[0] as ExoPlanetClass);
      this.draws.delete(sys.planets[0]);
      for (const o of [this.dummy.mesh, this.dummy.ring, this.dummy.orbit]) if (o) o.visible = false;
    }
    return [this.dummy.mesh, ...(this.dummy.ring ? [this.dummy.ring] : [])];
  }

  /** Release drawables of planets no longer in `systems`. */
  private prune(active: Set<ExoPlanet>): void {
    for (const [p, d] of this.draws) {
      if (active.has(p)) continue;
      for (const o of [d.mesh, d.ring, d.orbit]) {
        if (!o) continue;
        this.group.remove(o);
        (o.material as ShaderMaterial).dispose();
        if (o === d.orbit) o.geometry.dispose();
      }
      this.draws.delete(p);
    }
  }

  update(cam: UPos, pixelAngle: number, systems: PlanetarySystem[], jd: number, time: number): void {
    this.views = [];
    const active = new Set<ExoPlanet>();
    let ns = 0;
    const rel = new Vector3(), starRel = new Vector3(), toStar = new Vector3(), tmp = new Vector3();
    for (const sys of systems) {
      sys.update(jd);
      const host = sys.host;
      host.upos.sub(cam, starRel);
      const sc = blackbodyRGB(host.teff);
      const sl = luminance(sc);
      for (const p of sys.planets) {
        active.add(p);
        const d = this.draw(p);
        p.upos.sub(cam, rel);
        const dist = rel.length();
        const pr = Math.asin(Math.min(1, p.radius / Math.max(dist, p.radius * 1.0001))) / pixelAngle;
        toStar.copy(starRel).sub(rel);
        const ds = toStar.length();
        const E = magToIrradiance(host.absMag + 5 * Math.log10(ds / PC) - 5);
        const radiance = (p.spec.albedo * E) / Math.PI;
        this.views.push({ planet: p, rel: rel.clone(), dist, pixelRadius: pr, radiance });
        const resolved = pr > 0.8;
        d.mesh.visible = resolved;
        if (resolved) {
          // spin: tidally locked planets keep one face to the star
          const turns = (jd * 86400) / p.spec.rotS;
          const spin = (turns - Math.floor(turns)) * Math.PI * 2;
          const q = new Quaternion().setFromAxisAngle(sys.n, spin);
          const basis = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), sys.n);
          q.multiply(basis);
          d.mesh.matrix.compose(rel, q, new Vector3(p.radius, p.radius, p.radius));
          d.mesh.matrixWorldNeedsUpdate = true;
          const u = (d.mesh.material as ShaderMaterial).uniforms;
          (u.uSunDir.value as Vector3).copy(toStar).divideScalar(ds);
          (u.uSunColor.value as Vector3).set(sc[0] / sl, sc[1] / sl, sc[2] / sl);
          u.uSunIrr.value = E;
          u.uTime.value = time;
          (u.uBodyToWorld.value as Matrix3).setFromMatrix4(d.mesh.matrix.clone().makeRotationFromQuaternion(q));
        } else if (ns < 64) {
          // reflected light as a point: albedo * E * (R / d)^2 * phase
          const phase = 0.5 * (1 + tmp.copy(rel).negate().normalize().dot(toStar.clone().normalize()));
          this.sp.pos.set([rel.x, rel.y, rel.z], ns * 3);
          this.sp.irr[ns] = p.spec.albedo * E * (p.radius / dist) ** 2 * phase;
          this.sp.col.set([sc[0] / sl, sc[1] / sl, sc[2] / sl], ns * 3);
          ns++;
        }
        if (d.ring) {
          d.ring.visible = resolved;
          if (resolved) {
            const qr = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), sys.n);
            d.ring.matrix.compose(rel, qr, new Vector3(p.radius, p.radius, p.radius));
            d.ring.matrixWorldNeedsUpdate = true;
            (d.ring.material as ShaderMaterial).uniforms.uLight.value = (E / Math.PI) * 0.5 * this.exposure.value;
          }
        }
        // orbit line relative to the camera
        d.orbit.visible = this.showOrbits;
        if (this.showOrbits) {
          const a = d.orbit.geometry.attributes.position as BufferAttribute;
          const per = p.spec.periodS / 86400;
          for (let i = 0; i < a.count; i++) {
            sys.position(p.spec, jd + (per * i) / (a.count - 1), tmp);
            a.setXYZ(i, starRel.x + tmp.x, starRel.y + tmp.y, starRel.z + tmp.z);
          }
          a.needsUpdate = true;
        }
      }
    }
    this.sprites.geometry.setDrawRange(0, ns);
    for (const k of ['position', 'aIrr', 'aColor']) this.sprites.geometry.attributes[k].needsUpdate = true;
    this.prune(active);
  }
}
