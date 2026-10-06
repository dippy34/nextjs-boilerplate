import {
  AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, DynamicDrawUsage, Group, HalfFloatType, LinearFilter, LinearMipmapLinearFilter,
  Line, LineBasicMaterial, Matrix3, Matrix4, Mesh, OrthographicCamera, PlaneGeometry, Points, Quaternion, RingGeometry, Scene, ShaderMaterial,
  SphereGeometry, Vector3, WebGLCubeRenderTarget, type WebGLRenderer,
} from 'three';
import { blackbodyRGB, luminance, magToIrradiance } from '../astro/photometry';
import { PC } from '../core/units';
import type { UPos } from '../core/upos';
import { type ExoPlanet, hashKey, type PlanetarySystem, type PlanetType, rng } from '../universe/Planets';
import { SPRITE_FRAG, SPRITE_VERT } from './NearStars';
import { BODY_VERT } from './shaders/body';
import { EXO_BAKE_FRAG, EXO_FRAG, RING_GLSL } from './shaders/planet';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';
import { ExoPlanet as ExoPlanetClass, PlanetarySystem as SystemClass } from '../universe/Planets';
import { CatalogStar } from '../universe/Stars';
import { ExoGround, exoCraterSeed, exoQuantile, exoQuantiles, ROCKY_TYPES } from '../universe/ExoTerrain';
import { MATERIALS } from './Materials';
import { earthLikeAtmosphere, type AtmosphereSpec, type ExoAtmosphere } from './Atmospheres';
import { TerrainPatch, type TerrainCandidate } from './TerrainPatch';

const TYPE_ID: Record<PlanetType, number> = { lava: 0, hot: 1, desert: 2, terran: 3, ocean: 4, ice: 5, subneptune: 6, icegiant: 7, giant: 8, hotgiant: 9 };
type V3 = [number, number, number];

const lum = (c: V3) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/**
 * A planet's palette and surface parameters, varied by its seed within its type and chosen by its
 * temperature where that changes what it is made of. Colours are linear albedos (what fraction of
 * the starlight the surface reflects), so `albedo` (the disk's mean, for the eye's adaptation)
 * follows from them: lava and hot Jupiters are dark, ice worlds and water-cloud giants bright.
 */
function paletteFor(p: ExoPlanet): Record<string, number | V3> {
  const t = p.spec.type;
  const T = p.spec.teqK;
  const r = rng(hashKey(p.key + '/look'));
  const jit = (c: V3, k = 0.14): V3 => { const m = 1 + k * (r() - 0.5); return [c[0] * m * (1 + 0.5 * k * (r() - 0.5)), c[1] * m * (1 + 0.5 * k * (r() - 0.5)), c[2] * m * (1 + 0.5 * k * (r() - 0.5))]; };
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  const base = {
    uSeaLevel: 0, uIceLat: 1.2, uClouds: 0, uAtmo: 0, uBands: 10, uTurb: 0.6, uStorms: 0, uGlow: 0, uCraters: 0,
    uSea: [0.02, 0.06, 0.15] as V3, uAtmoColor: [0.4, 0.6, 1.0] as V3, uC4: [0.5, 0.5, 0.5] as V3,
  };
  const giantLook = (pal: V3[], o: Record<string, number | V3>) => {
    const [c1, c2, c3, c4] = pal.map((c) => jit(c));
    return { ...base, uC1: c1, uC2: c2, uC3: c3, uC4: c4, albedo: 0.5 * (lum(c1) + lum(c2)), ...o };
  };
  switch (t) {
    case 'lava': {
      const c1 = jit([0.035, 0.03, 0.03]);
      return { ...base, uC1: c1, uC2: jit([0.08, 0.065, 0.055]), uC3: [0.12, 0.1, 0.09], uC4: [0.2, 0.18, 0.15], uGlow: Math.min(1.6, Math.max(0.4, (T - 700) / 700)) * (0.8 + 0.4 * r()), albedo: 0.06 };
    }
    case 'hot': {
      const pal = pick<V3[]>([
        [[0.07, 0.065, 0.06], [0.12, 0.11, 0.1], [0.16, 0.15, 0.14]],      // grey, Mercury-like
        [[0.08, 0.06, 0.045], [0.15, 0.12, 0.09], [0.2, 0.17, 0.13]],     // brown
        [[0.09, 0.05, 0.035], [0.17, 0.1, 0.07], [0.22, 0.15, 0.11]],     // iron-red
      ]).map((c) => jit(c));
      return { ...base, uC1: pal[0], uC2: pal[1], uC3: pal[2], uC4: [0.26, 0.25, 0.24], uCraters: 0.6 + 0.4 * r(), uAtmo: r() < 0.2 ? 0.4 : 0, uAtmoColor: [1, 0.8, 0.5], albedo: 0.5 * (lum(pal[0]) + lum(pal[1])) };
    }
    case 'desert': {
      const pal = pick<V3[]>([
        [[0.1, 0.06, 0.04], [0.33, 0.18, 0.09], [0.25, 0.17, 0.12]],     // rust (Mars-like)
        [[0.18, 0.14, 0.1], [0.45, 0.36, 0.24], [0.35, 0.3, 0.24]],      // pale sand
        [[0.15, 0.11, 0.05], [0.42, 0.3, 0.13], [0.3, 0.24, 0.16]],      // ochre
        [[0.1, 0.09, 0.08], [0.28, 0.24, 0.2], [0.22, 0.2, 0.18]],       // grey-brown
      ]).map((c) => jit(c));
      return {
        ...base, uC1: pal[0], uC2: pal[1], uC3: pal[2], uC4: jit([0.5, 0.47, 0.42]), uCraters: 0.3 + 0.5 * r(),
        uAtmo: 0.35, uAtmoColor: [1, 0.78, 0.6], uIceLat: T < 250 ? 0.8 + 0.12 * r() : 1.2, albedo: 0.65 * lum(pal[1]) + 0.35 * lum(pal[0]),
      };
    }
    case 'terran': case 'ocean': {
      // vegetation of other worlds needn't be green, but it stays dark (it absorbs starlight)
      const veg = jit(pick<V3>([
        [0.035, 0.06, 0.025], [0.035, 0.06, 0.025], [0.03, 0.055, 0.025], [0.045, 0.065, 0.03],   // green
        [0.055, 0.06, 0.03], [0.025, 0.05, 0.04],                                                   // olive, teal
        [0.06, 0.032, 0.025], [0.05, 0.032, 0.045], [0.07, 0.06, 0.025],                            // red, purple, ochre
      ]));
      const soil = jit(pick<V3>([[0.42, 0.31, 0.18], [0.36, 0.3, 0.22], [0.45, 0.26, 0.14], [0.4, 0.36, 0.28]]));
      const clouds = t === 'ocean' ? 0.55 + 0.35 * r() : 0.4 + 0.4 * r();
      return {
        ...base, uC1: veg, uC2: soil, uC3: jit([0.17, 0.15, 0.13]), uC4: [0.6, 0.6, 0.6], uSea: jit(pick<V3>([[0.006, 0.018, 0.045], [0.007, 0.022, 0.04], [0.005, 0.015, 0.05]]), 0.3),
        uClouds: clouds, uAtmo: 0.9, uAtmoColor: [0.35, 0.55, 1.0], albedo: 0.07 + 0.3 * clouds,
      };
    }
    case 'ice': {
      const [pal, craters] = pick<[V3[], number]>([
        [[[0.42, 0.3, 0.2], [0.75, 0.72, 0.66], [0.85, 0.85, 0.85], [0.9, 0.92, 0.95]], 0.1],     // Europa-like
        [[[0.6, 0.66, 0.72], [0.88, 0.9, 0.92], [0.95, 0.96, 0.97], [0.95, 0.97, 1]], 0.3],     // fresh ice
        [[[0.12, 0.1, 0.09], [0.35, 0.32, 0.3], [0.55, 0.55, 0.55], [0.7, 0.72, 0.75]], 1],      // old, dirty, cratered
        [[[0.22, 0.11, 0.06], [0.7, 0.62, 0.52], [0.8, 0.78, 0.75], [0.9, 0.88, 0.85]], 0.3],    // tholins
      ]);
      const c = pal.map((x) => jit(x));
      return { ...base, uC1: c[0], uC2: c[1], uC3: c[2], uC4: c[3], uCraters: craters * (0.6 + 0.6 * r()), uAtmo: r() < 0.3 ? 0.3 : 0, uAtmoColor: [0.6, 0.7, 1], albedo: 0.7 * lum(c[1]) + 0.3 * lum(c[0]) };
    }
    case 'subneptune': {
      const pal = T < 250 ? [[0.42, 0.6, 0.68], [0.5, 0.68, 0.74], [0.7, 0.82, 0.86], [0.45, 0.6, 0.7]]
        : T < 600 ? pick<V3[]>([[[0.5, 0.55, 0.62], [0.62, 0.66, 0.7], [0.8, 0.82, 0.85], [0.55, 0.58, 0.62]], [[0.4, 0.5, 0.6], [0.52, 0.6, 0.68], [0.75, 0.8, 0.84], [0.5, 0.55, 0.6]]])
        : pick<V3[]>([[[0.45, 0.36, 0.26], [0.58, 0.48, 0.36], [0.72, 0.64, 0.52], [0.55, 0.4, 0.28]], [[0.36, 0.4, 0.34], [0.48, 0.52, 0.45], [0.66, 0.68, 0.62], [0.45, 0.45, 0.38]]]);
      return giantLook(pal as V3[], { uBands: 4 + 5 * r(), uTurb: 0.15 + 0.15 * r(), uStorms: Math.floor(3 * r()), uAtmo: 0.5, uAtmoColor: [0.6, 0.8, 1.0] });
    }
    case 'icegiant': {
      const pal = T < 120 ? pick<V3[]>([
        [[0.1, 0.22, 0.5], [0.16, 0.32, 0.62], [0.7, 0.8, 0.9], [0.12, 0.25, 0.55]],      // Neptune-like
        [[0.36, 0.56, 0.62], [0.42, 0.64, 0.68], [0.6, 0.78, 0.8], [0.4, 0.6, 0.65]],     // Uranus-like
      ]) : T < 500 ? [[0.25, 0.4, 0.48], [0.32, 0.48, 0.55], [0.65, 0.75, 0.8], [0.3, 0.42, 0.5]]
        : [[0.3, 0.28, 0.27], [0.4, 0.38, 0.36], [0.6, 0.58, 0.55], [0.35, 0.3, 0.28]];   // too warm for methane
      return giantLook(pal as V3[], { uBands: 4 + 4 * r(), uTurb: 0.3 + 0.25 * r(), uStorms: 1 + Math.floor(3 * r()), uAtmo: 0.4, uAtmoColor: [0.5, 0.7, 1.0] });
    }
    case 'giant': {
      // ammonia clouds when cold (Jupiter, Saturn), water clouds when temperate (bright white),
      // cloudless and blue when warmer still
      const JUPITER: V3[] = [[0.36, 0.24, 0.15], [0.66, 0.6, 0.5], [0.8, 0.77, 0.7], [0.6, 0.3, 0.17]];
      const SATURN: V3[] = [[0.5, 0.4, 0.26], [0.66, 0.57, 0.4], [0.75, 0.68, 0.52], [0.62, 0.48, 0.3]];
      const RUDDY: V3[] = [[0.42, 0.3, 0.24], [0.6, 0.5, 0.42], [0.75, 0.7, 0.62], [0.55, 0.28, 0.2]];
      const pal = T < 150 ? pick([JUPITER, JUPITER, SATURN, RUDDY])
        : T < 350 ? [[0.6, 0.6, 0.6], [0.78, 0.78, 0.76], [0.88, 0.88, 0.87], [0.7, 0.65, 0.6]]
        : [[0.12, 0.18, 0.35], [0.18, 0.26, 0.45], [0.35, 0.42, 0.6], [0.2, 0.2, 0.35]];
      const saturn = pal === SATURN;
      return giantLook(pal as V3[], {
        uBands: saturn ? 12 + 6 * r() : 7 + 5 * r(), uTurb: saturn ? 0.25 + 0.15 * r() : T < 150 ? 0.6 + 0.5 * r() : 0.3 + 0.3 * r(),
        uStorms: saturn ? 1 + Math.floor(2 * r()) : 3 + Math.floor(6 * r()), uAtmo: 0.25, uAtmoColor: [0.9, 0.85, 0.8],
      });
    }
    case 'hotgiant': {
      const pal = T > 1800 ? [[0.2, 0.17, 0.15], [0.32, 0.28, 0.24], [0.45, 0.4, 0.35], [0.3, 0.18, 0.12]]   // silicate clouds
        : pick<V3[]>([[[0.03, 0.03, 0.045], [0.06, 0.055, 0.075], [0.12, 0.11, 0.13], [0.1, 0.05, 0.04]], [[0.02, 0.04, 0.09], [0.035, 0.06, 0.13], [0.08, 0.11, 0.2], [0.05, 0.06, 0.12]]]);
      return giantLook(pal as V3[], { uBands: 5 + 5 * r(), uTurb: 0.6 + 0.4 * r(), uStorms: Math.floor(3 * r()), uGlow: Math.min(1.5, Math.max(0.2, (T - 900) / 800)), uAtmo: 0.04, uAtmoColor: [0.6, 0.5, 0.9] });
    }
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
uniform float uIn;
uniform float uOut;
uniform float uLight;   // reflected radiance x exposure for a white ring particle
uniform vec3 uSunL;     // star direction in the ring frame
uniform vec3 uCamL;     // camera position in the ring frame (planet radii)
varying vec2 vXY;
${RING_GLSL}
void main() {
  float r = length(vXY);
  float fw = fwidth(r) / (uOut - uIn);
  float dens = ringDensity(r, uSeed, uIn, uOut, fw);
  if (dens <= 0.0) discard;
  float t = (r - uIn) / (uOut - uIn);
  // colour: a little redder and darker inwards, ringlets of slightly different tint
  vec3 col = uColor * mix(vec3(0.82, 0.76, 0.7), vec3(1.0), smoothstep(0.0, 0.6, t)) * (0.85 + 0.3 * ringNoise(t * 57.0, uSeed + 21.0));
  // the planet's shadow (sphere of radius 1 between this point and the star)
  vec3 P = vec3(vXY, 0.0);
  float b = dot(P, uSunL);
  float sh = b < 0.0 ? smoothstep(0.97, 1.03, sqrt(max(dot(P, P) - b * b, 0.0))) : 1.0;
  // lit face, or light diffusing through to the unlit face
  float lit = sign(uSunL.z) == sign(uCamL.z) ? 1.0 : 0.25 * (1.0 - dens);
  float mu0 = abs(uSunL.z);
  float tau = dens * 1.8;
  float refl = (1.0 - exp(-tau / max(mu0, 0.05))) * lit;
  gl_FragColor = vec4(col * uLight * refl * sh, dens * 0.92);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

interface PlanetDraw { mesh: Mesh; ring: Mesh | null; orbit: Line; orient: Matrix4; ground: ExoGround | null; air: AtmosphereSpec | null; albedo: number }

/** texels per cube face of a baked height field (EXO_BAKE_FRAG) */
const BAKE_SIZE = 512;
/** planets whose height field stays baked at once (the least recently used one is released) */
const BAKE_KEEP = 2;
/** baked once the planet's radius on screen exceeds this many pixels (smaller disks are cheap anyway) */
const BAKE_MIN_PX = 24;

const BAKE_VERT = /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/** A planet's height field baked into a cube map, one face per frame. */
interface Bake { rt: WebGLCubeRenderTarget; mat: ShaderMaterial; faces: number; used: number }

const G = 6.674e-11;

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
  private ringGeo = new RingGeometry(1.15, 3.0, 256, 1);
  private sprites: Points;
  private sp = { pos: new Float32Array(64 * 3), irr: new Float32Array(64), col: new Float32Array(64 * 3) };
  /** the renderer, for baking height fields in the headset (set by the app) */
  gl: WebGLRenderer | null = null;
  private bakes = new Map<ExoPlanet, Bake>();
  private bakeScene = new Scene();
  private bakeQuad = new Mesh(new PlaneGeometry(2, 2));
  private bakeCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private frameNo = 0;

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
    const seed = p.spec.seed % 97;
    {
      // climate and seas: the sea covers the planet's own fraction of the surface
      const rc = rng(hashKey(p.key + '/climate'));
      const t = p.spec.type;
      if (t === 'terran' || t === 'ocean') pal.uSeaLevel = exoQuantile(seed, t === 'ocean' ? 0.85 + 0.11 * rc() : 0.4 + 0.35 * rc());
      const [q10, q50, q90] = ROCKY_TYPES.has(TYPE_ID[t]) ? exoQuantiles(seed, [0.1, 0.5, 0.9]) : [0.3, 0.4, 0.5];
      pal.uHMid = q50;
      pal.uHSpan = Math.max(0.02, q90 - q10);
      pal.uTeq = p.spec.teqK;
      pal.uDry = t === 'ocean' ? 0.1 * rc() : t === 'terran' ? 0.1 + 0.5 * rc() : 1;
      pal.uRelief = Math.min(20e3, p.radius * 0.002) / p.radius;
      pal.uRadius = p.radius;
      pal.uRing = p.spec.rings ? 1 : 0;
      pal.uRingSeed = p.spec.seed % 13;
      pal.uRingIn = 1.2 + 0.4 * rc();
      pal.uRingOut = Math.min(2.95, pal.uRingIn + 0.7 + 0.9 * rc());
    }
    const albedo = Number(pal.albedo);
    delete pal.albedo;
    const u: Record<string, { value: unknown }> = {
      uType: { value: TYPE_ID[p.spec.type] }, uSeed: { value: seed }, uLumpy: { value: 0 },
      uSunDir: { value: new Vector3(1, 0, 0) }, uSunColor: { value: new Vector3(1, 1, 1) }, uSunIrr: { value: Math.PI },
      uExposure: this.exposure, uTime: { value: 0 }, uBodyToWorld: { value: new Matrix3() },
      uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK, uLite: LITE.uLite, uCSeed: { value: exoCraterSeed(p.name) },
      uTerrain: { value: 0 }, uHScale: { value: 0 }, uCamAlt: { value: 1e9 }, uHoleDir: { value: new Vector3(0, 0, 1) }, uHoleCos: { value: 2 },
      uTerrCube: { value: null }, uBaked: { value: 0 },
      ...MATERIALS, uTanE: { value: new Vector3(1, 0, 0) }, uTanN: { value: new Vector3(0, 1, 0) },
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
      // icy rings when cold, dark dusty ones otherwise
      const icy = p.spec.teqK < 150;
      const c3 = pal.uC3 as V3;
      const c: V3 = icy ? [0.62 + 0.15 * c3[0], 0.57 + 0.15 * c3[1], 0.5 + 0.15 * c3[2]] : [0.22, 0.2, 0.19];
      ring = new Mesh(this.ringGeo, new ShaderMaterial({
        name: 'exoplanet-ring', vertexShader: RING_VERT, fragmentShader: RING_FRAG,
        uniforms: { uColor: { value: new Vector3(...c) }, uSeed: { value: pal.uRingSeed }, uIn: { value: pal.uRingIn }, uOut: { value: pal.uRingOut },
          uLight: { value: 1 }, uSunL: { value: new Vector3(0, 0, 1) }, uCamL: { value: new Vector3(0, 0, 1) },
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
    og.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    const orbit = new Line(og, new LineBasicMaterial({ color: 0x6f8fd0, transparent: true, opacity: 0.35, depthWrite: false }));
    orbit.frustumCulled = false;
    // (points relative to the star, filled once: the ellipse is fixed; the line is moved with the star)
    orbit.matrixAutoUpdate = false;
    orbit.userData.filled = false;
    orbit.renderOrder = 5;
    this.group.add(orbit);
    const type = TYPE_ID[p.spec.type];
    const ground = ROCKY_TYPES.has(type)
      ? new ExoGround(p, type, p.spec.seed % 97, Number(pal.uSeaLevel ?? 0), Number(pal.uCraters ?? 0), Number(pal.uHMid), Number(pal.uHSpan)) : null;
    // temperate and ocean worlds get an Earth-like atmosphere (pressure varies from planet to planet)
    let air: AtmosphereSpec | null = null;
    if (type === 3 || type === 4) {
      const ra = rng(hashKey(p.key + '/air'));
      const g = (G * p.spec.massKg) / (p.radius * p.radius);
      air = earthLikeAtmosphere(0.6 + 1.2 * ra(), Math.min(400, Math.max(180, p.spec.teqK)), Math.max(2, g));
      // the shell draws the limb glow: keep only a little of the surface shader's own haze
      u.uAtmo.value = Number(u.uAtmo.value) * 0.3;
    }
    d = { mesh, ring, orbit, orient: new Matrix4(), ground, air, albedo };
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

  /** Atmospheres of the resolved planets that have one, placed for this frame. */
  atmospheres(): ExoAtmosphere[] {
    const out: ExoAtmosphere[] = [];
    for (const v of this.views) {
      const d = this.draws.get(v.planet);
      if (!d?.air || !d.mesh.visible || v.pixelRadius < 2.5) continue;
      const u = (d.mesh.material as ShaderMaterial).uniforms;
      out.push({ key: v.planet, name: v.planet.name, radius: v.planet.radius, spec: d.air, rel: v.rel, orient: d.orient,
        sunDir: u.uSunDir.value as Vector3, sunIrr: u.uSunIrr.value as number, sunColor: u.uSunColor.value as Vector3 });
    }
    return out;
  }

  /** The nearest generated rocky planet that could have landing terrain, if one is close. */
  terrainCandidate(): TerrainCandidate | null {
    let best: ExoView | null = null;
    for (const v of this.views) {
      const d = this.draws.get(v.planet);
      if (!d?.ground || !d.mesh.visible) continue;
      const alt = v.dist - v.planet.radius;
      if (alt < TerrainPatch.threshold(v.planet) * 1.2 && (!best || alt < best.dist - best.planet.radius)) best = v;
    }
    if (!best) return null;
    const d = this.draws.get(best.planet)!;
    const material = d.mesh.material as ShaderMaterial;
    d.ground!.lite = LITE.uLite.value > 0.5;
    const sunBF = (material.uniforms.uSunDir.value as Vector3).clone().applyMatrix3(new Matrix3().setFromMatrix4(d.orient).transpose());
    return { ground: d.ground!, material, upos: best.planet.upos, rel: best.rel.clone(), orient: d.orient, lonLeft: -180, sunBF, alt: best.dist - best.planet.radius };
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
      this.unbake(p);
    }
  }

  private unbake(p: ExoPlanet): void {
    const b = this.bakes.get(p);
    if (!b) return;
    b.rt.dispose();
    b.mat.dispose();
    this.bakes.delete(p);
    const d = this.draws.get(p);
    if (d) { const u = (d.mesh.material as ShaderMaterial).uniforms; u.uBaked.value = 0; u.uTerrCube.value = null; }
  }

  /**
   * Headset only: bake the height field of the rocky planet largest on screen (one cube face per
   * frame; used once all six are done), so its sphere samples a texture instead of the noise.
   * The desktop's height field has finer octaves and is always evaluated per pixel.
   */
  private updateBakes(): void {
    this.frameNo++;
    const lite = LITE.uLite.value > 0.5;
    for (const [p, b] of this.bakes) {
      const d = this.draws.get(p);
      if (d) (d.mesh.material as ShaderMaterial).uniforms.uBaked.value = lite && b.faces >= 6 ? 1 : 0;
    }
    const gl = this.gl;
    if (!lite || !gl) return;
    let best: ExoView | null = null;
    for (const v of this.views) {
      const d = this.draws.get(v.planet);
      if (!d?.ground || !d.mesh.visible || v.pixelRadius < BAKE_MIN_PX) continue;
      if (!best || v.pixelRadius > best.pixelRadius) best = v;
    }
    if (!best) return;
    const p = best.planet;
    const d = this.draws.get(p)!;
    let b = this.bakes.get(p);
    if (!b) {
      while (this.bakes.size >= BAKE_KEEP) {
        let old: ExoPlanet | null = null, t = Infinity;
        for (const [q, x] of this.bakes) if (x.used < t) { t = x.used; old = q; }
        this.unbake(old!);
      }
      const rt = new WebGLCubeRenderTarget(BAKE_SIZE, {
        // (allocated with mipmap levels; they are built once, after the last face)
        type: HalfFloatType, generateMipmaps: true, minFilter: LinearMipmapLinearFilter, magFilter: LinearFilter, depthBuffer: false,
      });
      const mu = (d.mesh.material as ShaderMaterial).uniforms;
      const mat = new ShaderMaterial({
        name: 'exoplanet-bake', vertexShader: BAKE_VERT, fragmentShader: EXO_BAKE_FRAG,
        uniforms: { ...mu, uLite: { value: 1 }, uTerrCube: { value: null }, uFace: { value: 0 }, uSize: { value: BAKE_SIZE } },
        depthTest: false, depthWrite: false,
      });
      b = { rt, mat, faces: 0, used: 0 };
      this.bakes.set(p, b);
    }
    b.used = this.frameNo;
    if (b.faces >= 6) return;
    const face = b.faces++;
    b.mat.uniforms.uFace.value = face;
    b.rt.texture.generateMipmaps = face === 5;   // (three builds the mipmaps after the last face)
    this.bakeQuad.material = b.mat;
    if (this.bakeQuad.parent !== this.bakeScene) this.bakeScene.add(this.bakeQuad);
    const prevTarget = gl.getRenderTarget(), prevFace = gl.getActiveCubeFace(), prevMip = gl.getActiveMipmapLevel();
    const xrWas = gl.xr.enabled;
    gl.xr.enabled = false;
    gl.setRenderTarget(b.rt, face);
    gl.render(this.bakeScene, this.bakeCam);
    gl.xr.enabled = xrWas;
    gl.setRenderTarget(prevTarget, prevFace, prevMip);
    if (face === 5) {
      const u = (d.mesh.material as ShaderMaterial).uniforms;
      u.uTerrCube.value = b.rt.texture;
      u.uBaked.value = 1;
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
        // the eye adapts to the disk as it is drawn (like Solar System bodies: 1.5 x the mean albedo,
        // dark worlds kept darker than mid-grey)
        const radiance = (Math.min(1, 1.5 * Math.max(d.albedo, 0.15)) * E) / Math.PI;
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
          d.orient.makeRotationFromQuaternion(q);
          d.mesh.matrixWorldNeedsUpdate = true;
          const u = (d.mesh.material as ShaderMaterial).uniforms;
          (u.uSunDir.value as Vector3).copy(toStar).divideScalar(ds);
          (u.uSunColor.value as Vector3).set(sc[0] / sl, sc[1] / sl, sc[2] / sl);
          u.uSunIrr.value = E;
          u.uTime.value = time;
          u.uCamAlt.value = dist - p.radius;
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
            const ru = (d.ring.material as ShaderMaterial).uniforms;
            ru.uLight.value = (E / Math.PI) * this.exposure.value;
            const qi = qr.clone().invert();
            (ru.uSunL.value as Vector3).copy(toStar).divideScalar(ds).applyQuaternion(qi);
            (ru.uCamL.value as Vector3).copy(rel).negate().divideScalar(p.radius).applyQuaternion(qi);
          }
        }
        // orbit line relative to the camera
        d.orbit.visible = this.showOrbits;
        if (this.showOrbits) {
          if (!d.orbit.userData.filled) {
            const a = d.orbit.geometry.attributes.position as BufferAttribute;
            const per = p.spec.periodS / 86400;
            for (let i = 0; i < a.count; i++) {
              sys.position(p.spec, jd + (per * i) / (a.count - 1), tmp);
              a.setXYZ(i, tmp.x, tmp.y, tmp.z);
            }
            a.needsUpdate = true;
            d.orbit.userData.filled = true;
          }
          d.orbit.matrix.makeTranslation(starRel.x, starRel.y, starRel.z);
          d.orbit.matrixWorldNeedsUpdate = true;
        }
      }
    }
    this.sprites.geometry.setDrawRange(0, ns);
    for (const k of ['position', 'aIrr', 'aColor']) this.sprites.geometry.attributes[k].needsUpdate = true;
    this.prune(active);
    this.updateBakes();
  }
}
