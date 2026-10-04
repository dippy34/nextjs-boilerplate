import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CustomBlending, DoubleSide, DynamicDrawUsage, FrontSide, Group,
  ImageBitmapLoader, LinearFilter, LinearMipmapLinearFilter, Matrix3, Matrix4, Mesh, NoColorSpace, OneFactor,
  OneMinusSrcAlphaFactor, PlaneGeometry, Points, Quaternion, RepeatWrapping, ShaderMaterial, SRGBColorSpace, Texture, Vector4, type WebGLRenderer,
  TextureLoader, Vector3, ClampToEdgeWrapping,
} from 'three';
import { blackbodyRGB, lambertPhase, luminance, sunIrradianceAt } from '../astro/photometry';
import { AU, SUN_RADIUS } from '../core/units';
import type { UPos } from '../core/upos';
import type { Body } from '../universe/Body';
import type { SolarSystem } from '../universe/SolarSystem';
import type { AtmosphereSpec } from './Atmospheres';
import type { TileDetail } from './TileDetail';
import { BODY_FRAG, BODY_VERT, GLARE_FRAG, GLARE_VERT } from './shaders/body';
import { STAR_FRAG } from './shaders/star';
import { RING_FRAG, RING_VERT } from './shaders/rings';
import { StarCorona } from './StarCorona';
import { RingParticles } from './RingParticles';
import { ringFrame } from '../universe/RingSpot';
import { PlanetTerrain } from './PlanetTerrain';
import type { TerrainCandidate } from './PlanetTerrain';
import { CloudLayer } from './CloudLayer';
import { TerrainSource } from '../universe/Terrain';
import { hashString, starLook, starLookUniforms, type StarLook } from './StarLook';
import { PSF_FRAGMENT, PSF_UNIFORMS, PSF_VERTEX } from './shaders/psf';
import { MAT, MATERIALS } from './Materials';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS, POINT_CLIP } from './shaders/xr';

interface MapInfo {
  file: string; channels: string; lonLeft: number; credit: string; width: number; height: number;
  /** optional high-resolution tier, loaded only while the body fills a large part of the view */
  hi?: { file: string; width: number; height: number };
}
interface TextureManifest {
  maps: Record<string, MapInfo>;
}

/** pixel radius above which the high-resolution map is wanted, and below which it may be released */
const HI_WANT_PX = 260;
const HI_KEEP_PX = 140;
const HI_RELEASE_S = 20;
const RELIEF_WANT_PX = 40;

/** Unit sphere in body-fixed coordinates with the texture seam at `lonLeftDeg`. */
function makeSphere(lonLeftDeg: number, wSeg = 128, hSeg = 64): BufferGeometry {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const lon0 = (lonLeftDeg * Math.PI) / 180;
  for (let j = 0; j <= hSeg; j++) {
    const v = j / hSeg;
    const lat = Math.PI / 2 - v * Math.PI;
    for (let i = 0; i <= wSeg; i++) {
      const u = i / wSeg;
      const lon = lon0 + u * 2 * Math.PI;
      pos.push(Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat));
      uv.push(u, 1 - v);
    }
  }
  for (let j = 0; j < hSeg; j++) {
    for (let i = 0; i < wSeg; i++) {
      const a = j * (wSeg + 1) + i, b = a + wSeg + 1;
      if (j !== 0) idx.push(a, b, a + 1);
      if (j !== hSeg - 1) idx.push(a + 1, b, b + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  return g;
}

function makeRing(inner: number, outer: number, seg = 256): BufferGeometry {
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pos.push(inner * Math.cos(a), inner * Math.sin(a), 0, outer * Math.cos(a), outer * Math.sin(a), 0);
    if (i < seg) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  return g;
}

const SPRITE_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
${PSF_UNIFORMS}
attribute float aIrr;     // irradiance at the observer (photometric units)
attribute vec3 aColor;
varying vec3 vColor;
varying float vEnergy;
varying float vRadius;
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

/** Area of overlap of two discs of radii r1, r2 whose centres are d apart (as in the body shader). */
export function discOverlap(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a1 = Math.acos(Math.max(-1, Math.min(1, (d * d + r1 * r1 - r2 * r2) / (2 * d * r1))));
  const a2 = Math.acos(Math.max(-1, Math.min(1, (d * d + r2 * r2 - r1 * r1) / (2 * d * r2))));
  const k = (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2);
  return r1 * r1 * a1 + r2 * r2 * a2 - 0.5 * Math.sqrt(Math.max(k, 0));
}

/** Per-frame screen information about a body (used by labels, picking, exposure). */
export interface BodyView {
  body: Body;
  rel: Vector3;          // camera-relative position (m)
  dist: number;
  pixelRadius: number;
  irradiance: number;    // at the observer
  apparentMag: number;
  resolved: boolean;
}

export class BodiesLayer {
  readonly group = new Group();
  readonly views = new Map<Body, BodyView>();
  private meshes = new Map<Body, Mesh>();
  /** Earth's cloud layer for low flight (render/CloudLayer.ts) */
  clouds: CloudLayer | null = null;
  private rings = new Map<Body, Mesh>();
  private spheres = new Map<number, BufferGeometry>();
  private textures = new Map<string, Promise<{ tex: Texture; meanLum: number }>>();
  private loadedTex = new Map<string, { tex: Texture; meanLum: number }>();
  private loader = new TextureLoader();
  private bitmapLoader = new ImageBitmapLoader().setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });
  private hiTex = new Map<string, { tex: Texture | null; lastWanted: number }>();
  private glare: Mesh | null = null;
  /** the Sun's corona and surface look */
  private sunCorona: StarCorona | null = null;
  private sunLook: StarLook | null = null;
  /** camera-facing glare around the Sun (VR only: the desktop path has a bloom pass) */
  glareOn = false;
  /** allow the 8k map tier (off in VR: uploading an 8k texture stalls a headset frame) */
  allowHi = true;
  /** uploads a texture to the GPU now (set by the app: renderer.initTexture) */
  uploader: (tex: Texture) => void = () => undefined;
  /** atmosphere parameters per body (for sunlight transmitted to the surface) */
  atmosphere: (b: Body) => AtmosphereSpec | null = () => null;
  private sprites: Points;
  private spritePos: Float32Array;
  private spriteIrr: Float32Array;
  private spriteCol: Float32Array;
  private sunColor: [number, number, number];
  private ringTex: Texture | null = null;
  private time = 0;
  readonly maxSprites: number;
  /** exposure for resolved surfaces (point sprites use the shared PSF exposure) */
  readonly surfaceExposure = { value: 1 };
  /** the ice particles around the explorer inside Saturn's rings */
  ringParticles: RingParticles | null = null;
  private ringParticlesBody: Body | null = null;
  /** heights for the landing terrain of solid worlds */
  readonly terrainSource: TerrainSource;

  constructor(
    private system: SolarSystem,
    private manifest: TextureManifest,
    private texBase: string,
    psf: Record<string, { value: number }>,
    private rings_: Record<string, { innerKm: number; outerKm: number; texture: string }>,
  ) {
    this.group.name = 'bodies';
    this.terrainSource = new TerrainSource(texBase.replace(/\/textures$/, ''));
    const sc = blackbodyRGB(system.sun.teff);
    const L = luminance(sc);
    this.sunColor = [sc[0] / L, sc[1] / L, sc[2] / L];
    this.maxSprites = system.bodies.length + 64;
    const geo = new BufferGeometry();
    this.spritePos = new Float32Array(this.maxSprites * 3);
    this.spriteIrr = new Float32Array(this.maxSprites);
    this.spriteCol = new Float32Array(this.maxSprites * 3);
    geo.setAttribute('position', new BufferAttribute(this.spritePos, 3).setUsage(DynamicDrawUsage));
    geo.setAttribute('aIrr', new BufferAttribute(this.spriteIrr, 1).setUsage(DynamicDrawUsage));
    geo.setAttribute('aColor', new BufferAttribute(this.spriteCol, 3).setUsage(DynamicDrawUsage));
    this.sprites = new Points(geo, new ShaderMaterial({
      vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, uniforms: { ...psf },
      transparent: true, depthWrite: false, depthTest: true, blending: AdditiveBlending,
    }));
    this.sprites.frustumCulled = false;
    this.sprites.renderOrder = 10;
    this.group.add(this.sprites);
  }

  private sphere(lonLeft: number): BufferGeometry {
    let g = this.spheres.get(lonLeft);
    if (!g) {
      g = makeSphere(lonLeft);
      this.spheres.set(lonLeft, g);
    }
    return g;
  }

  private texture(key: string): Promise<{ tex: Texture; meanLum: number }> {
    let p = this.textures.get(key);
    if (!p) {
      const info = this.manifest.maps[key];
      const url = `${this.texBase}/${info ? info.file : key}`;
      p = this.loader.loadAsync(url).then((tex) => {
        tex.colorSpace = SRGBColorSpace;
        tex.wrapS = RepeatWrapping;
        tex.wrapT = ClampToEdgeWrapping;
        tex.minFilter = LinearMipmapLinearFilter;
        tex.magFilter = LinearFilter;
        tex.anisotropy = 8;
        // We decode sRGB ourselves in the shader to keep full control over albedo scaling.
        tex.colorSpace = '';
        const meanLum = meanLinearLuminance(tex.image as HTMLImageElement);
        const v = { tex, meanLum };
        this.loadedTex.set(key, v);
        return v;
      });
      this.textures.set(key, p);
    }
    return p;
  }

  /** map key for a body: its catalogue texture, or a map named after it (e.g. the OPAL giant-planet maps) */
  textureKey(b: Body): string | null {
    if (b.texture) return b.texture;
    const k = b.name.toLowerCase();
    return this.manifest.maps[k] ? k : null;
  }

  private reliefKey(b: Body): string | null {
    const k = `${b.name.toLowerCase()}_relief`;
    return this.manifest.maps[k] ? k : null;
  }

  private loadData(key: string): Promise<Texture> {
    const info = this.manifest.maps[key];
    return this.loader.loadAsync(`${this.texBase}/${info.file}`).then((tex) => {
      tex.colorSpace = NoColorSpace;
      tex.wrapS = RepeatWrapping;
      tex.wrapT = ClampToEdgeWrapping;
      tex.minFilter = LinearMipmapLinearFilter;
      tex.magFilter = LinearFilter;
      tex.anisotropy = 4;
      return tex;
    });
  }

  /** The high-resolution tier of `key` if loaded; starts loading it (decoded off the main thread). */
  private wantHi(key: string, now: number): Texture | null {
    const info = this.manifest.maps[key];
    if (!info?.hi) return null;
    let e = this.hiTex.get(key);
    if (!e) {
      e = { tex: null, lastWanted: now };
      this.hiTex.set(key, e);
      const entry = e;
      this.bitmapLoader.loadAsync(`${this.texBase}/${info.hi.file}`).then((bmp) => {
        if (this.hiTex.get(key) !== entry) { (bmp as ImageBitmap).close?.(); return; }
        const tex = new Texture(bmp as ImageBitmap);
        tex.flipY = false;
        tex.colorSpace = '';
        tex.wrapS = RepeatWrapping;
        tex.wrapT = ClampToEdgeWrapping;
        tex.minFilter = LinearMipmapLinearFilter;
        tex.magFilter = LinearFilter;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        entry.tex = tex;
      }).catch((err) => console.warn('high-resolution map failed', key, err));
    }
    e.lastWanted = now;
    return e.tex;
  }

  private releaseHi(now: number): void {
    for (const [key, e] of this.hiTex) {
      if (now - e.lastWanted < HI_RELEASE_S) continue;
      if (e.tex) {
        const img = e.tex.image as ImageBitmap | undefined;
        e.tex.dispose();
        img?.close?.();
      }
      this.hiTex.delete(key);
    }
  }

  /**
   * Get a body ready before the camera arrives: create its materials and load and upload its
   * maps now, so nothing stalls a frame when it fills the view.
   */
  prefetch(b: Body): void {
    if (!b.valid) return;
    const mesh = this.meshes.get(b) ?? this.createMesh(b);
    mesh.visible = false;
    const key = this.textureKey(b);
    const tasks: Promise<unknown>[] = [];
    if (key) tasks.push(this.texture(key));
    if (b.name === 'Earth') tasks.push(this.texture('earth_night'), this.texture('earth_clouds'));
    const rk = this.reliefKey(b);
    if (rk) this.requestRelief(rk, (mesh.material as ShaderMaterial).uniforms);
    for (const t of tasks) t.then((v) => this.uploader((v as { tex: Texture }).tex)).catch(() => undefined);
  }

  /** Create one of every kind of body material (planet, rings, star, glare) for shader warm-up. */
  warmupObjects(): Mesh[] {
    const out: Mesh[] = [];
    const sat = this.system.bodies.find((b) => b.name === 'Saturn');
    for (const b of [this.system.sun, sat]) {
      if (!b) continue;
      const m = this.meshes.get(b) ?? this.createMesh(b);
      out.push(m);
      const r = this.rings.get(b);
      if (r) out.push(r);
    }
    if (this.glare) out.push(this.glare);
    if (this.sunCorona) out.push(this.sunCorona.mesh);
    if (this.ringParticles) out.push(this.ringParticles.mesh, this.ringParticles.slab);
    return out;
  }

  private createMesh(b: Body): Mesh {
    const texKey = this.textureKey(b);
    const mapInfo = texKey ? this.manifest.maps[texKey] : undefined;
    const isStar = b.kind === 'star';
    const mat = new ShaderMaterial({
      name: isStar ? 'sun-surface' : 'body',
      vertexShader: BODY_VERT,
      fragmentShader: isStar ? STAR_FRAG : BODY_FRAG,
      // Earth's cloud code is compiled into Earth's program only (BODY_FRAG: #ifdef CLOUDS)
      defines: !isStar && b.name === 'Earth' ? { CLOUDS: 1 } : {},
      uniforms: {
        uMap: { value: null }, uHasMap: { value: 0 }, uMapGray: { value: mapInfo?.channels === 'L' ? 1 : 0 },
        uNight: { value: null }, uHasNight: { value: 0 },
        uClouds: { value: null }, uHasClouds: { value: 0 }, uCloudShift: { value: 0 }, uCloudVis: { value: 1 },
        uColor: { value: new Vector3(...b.color) },
        uAlbedoScale: { value: 1 },
        uAirless: { value: b.isAirless ? 1 : 0 },
        uBands: { value: !texKey && (b.isGasGiant || b.name === 'Venus') ? 1 : 0 },
        uRelief: { value: null }, uHasRelief: { value: 0 }, uWater: { value: 0 },
        uAtmo: { value: 0 }, uRp: { value: b.radii[0] }, uBetaR: { value: new Vector3() }, uHR: { value: 8000 },
        uBetaMe: { value: new Vector3() }, uHM: { value: 1200 },
        uSeed: { value: hashString(b.name) * 500 },
        uProc: { value: 0 }, uIcy: { value: 0 }, uTint: { value: new Vector3(1, 1, 1) }, uCraters: { value: 0 },
        uLumpy: { value: 0 }, uRadiusM: { value: b.radius }, uMapW: { value: 0 },
        uDetail: { value: null }, uDetailRect: { value: new Vector4(0, 0, 1, 1) }, uDetailOn: { value: 0 }, uLite: LITE.uLite,
        ...MATERIALS, uMatSel: { value: new Vector4(MAT.regolith, MAT.regolithPocked, MAT.cliff, MAT.snow) }, uMatMode: { value: 0 },
        uTanE: { value: new Vector3(1, 0, 0) }, uTanN: { value: new Vector3(0, 1, 0) },
        uTerrain: { value: 0 }, uHScale: { value: 0 }, uHoleDir: { value: new Vector3(0, 0, 1) }, uHoleCos: { value: 2 },
        uSunDir: { value: new Vector3(1, 0, 0) },
        uSunIrr: { value: Math.PI },
        uSunColor: { value: new Vector3(...this.sunColor) },
        uExposure: this.surfaceExposure,
        uBodyToWorld: { value: new Matrix3() },
        uBodyCenter: { value: new Vector3() },
        uOcc: { value: [new Vector4(), new Vector4(), new Vector4(), new Vector4()] }, uOccRed: { value: new Vector4() }, uOccN: { value: 0 },
        uSunRel: { value: new Vector3() }, uSunR: { value: SUN_RADIUS },
        uHasRings: { value: 0 }, uRingTex: { value: null }, uRingRadii: { value: new Vector3() },
        uRadiance: { value: 1 }, uTime: { value: 0 },
        ...(isStar ? starLookUniforms(this.sunLook = starLook('sun', b.teff, 1, 4.83, true)) : {}),
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      side: FrontSide,
    });
    const mesh = new Mesh(this.sphere(mapInfo?.lonLeft ?? -180), mat);
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    mesh.name = b.name;
    mesh.renderOrder = 1;
    this.group.add(mesh);
    this.meshes.set(b, mesh);

    const u = mat.uniforms;
    if (isStar) {
      const L = luminance(blackbodyRGB(b.teff));
      const c = blackbodyRGB(b.teff);
      u.uColor.value.set(c[0] / L, c[1] / L, c[2] / L);
      // Mean disk radiance: solar irradiance at 1 AU / solid angle of the solar disk at 1 AU.
      u.uRadiance.value = (AU / SUN_RADIUS) ** 2;
    } else {
      const geomAlbedo = b.meta.albedo as number | undefined;
      const known = geomAlbedo !== undefined;
      const lambertRho = Math.min(1, 1.5 * b.albedo);
      this.surfaceLook(b, u, texKey, mapInfo?.width ?? 0);
      if (texKey) {
        this.texture(texKey).then(({ tex, meanLum }) => {
          u.uMap.value = tex;
          u.uHasMap.value = 1;
          u.uAlbedoScale.value = known ? lambertRho / Math.max(meanLum, 1e-3) : 1;
        });
      } else {
        u.uAlbedoScale.value = lambertRho / Math.max(luminance(b.color), 1e-3);
      }
      if (b.name === 'Earth') {
        this.texture('earth_night').then(({ tex }) => { u.uNight.value = tex; u.uHasNight.value = 1; });
        this.texture('earth_clouds').then(({ tex }) => {
          u.uClouds.value = tex;
          u.uHasClouds.value = 1;
          this.clouds = new CloudLayer(tex, this.surfaceExposure);
          this.group.add(this.clouds.mesh);
        });
      }
      const ring = this.rings_[b.name.toLowerCase()];
      if (ring) this.createRings(b, ring, u);
      const atmo = this.atmosphere(b);
      if (atmo?.surfaceTransmittance) {
        u.uAtmo.value = 1;
        u.uBetaR.value.set(...atmo.betaR);
        u.uHR.value = atmo.HR;
        u.uBetaMe.value.set(...atmo.betaMe);
        u.uHM.value = atmo.HM;
      }
    }
    if (isStar) {
      this.createGlare(b);
      this.sunCorona = new StarCorona();
      this.group.add(this.sunCorona.mesh);
    }
    return mesh;
  }

  /**
   * Every solid body gets its own look: bodies without a map a seeded procedural surface (crater
   * fields at three scales, two-tone terrain, bright fresh ejecta, cracks on ices) coloured by type,
   * small ones an irregular shape, and mapped bodies fine crater detail below the map's resolution.
   */
  private surfaceLook(b: Body, u: Record<string, { value: unknown }>, texKey: string | null, mapWidth: number): void {
    const h = (k: string) => hashString(b.name + k);
    // ground materials up close (render/Materials.ts)
    const sel = u.uMatSel.value as Vector4;
    if (b.name === 'Earth') { sel.set(MAT.drySoil, MAT.forest, MAT.cliff, MAT.snow); u.uMatMode.value = 1; }
    else if (b.name === 'Mars') { sel.set(MAT.drySoil, MAT.sand, MAT.cliff, MAT.snow); u.uMatMode.value = 2; }
    else if (b.name === 'Venus' || b.name === 'Io') { sel.set(MAT.rockGround, MAT.drySoil, MAT.cliff, MAT.snow); u.uMatMode.value = 0; }
    else if (b.albedo > 0.45 || (b.kind !== 'planet' && b.pos.length() > 4.5 * AU && b.meta.albedo === undefined)) { sel.set(MAT.snow, MAT.snow, MAT.cliff, MAT.snow); u.uMatMode.value = 3; }
    else { sel.set(MAT.regolith, MAT.regolithPocked, MAT.cliff, MAT.snow); u.uMatMode.value = 0; }
    const solid = !b.isGasGiant && b.kind !== 'star' && !['Venus', 'Earth', 'Titan'].includes(b.name);
    if (!solid) return;
    const R = b.radius;
    u.uLumpy.value = (R < 20e3 ? 0.22 : R < 80e3 ? 0.14 : R < 200e3 ? 0.07 : 0) * (texKey ? 0.4 : 1) * (0.7 + 0.6 * h('l'));
    // geologically young surfaces have few craters
    const young = ['Io', 'Europa', 'Enceladus', 'Triton'].includes(b.name);
    // bright, frost-covered dwarf planets (Eris, Makemake) look smooth
    const frosty = (b.kind === 'tno' || b.kind === 'dwarf') && b.meta.albedo !== undefined && b.albedo > 0.6;
    u.uCraters.value = young ? 0.15 : frosty ? 0.2 : b.kind === 'tno' ? 0.55 : 0.85 + 0.15 * h('c');
    if (texKey) {
      u.uMapW.value = young ? 0 : mapWidth;
      return;
    }
    u.uProc.value = 1;
    // ice or rock: from the measured albedo when there is one, otherwise by distance from the Sun
    // (moons beyond Jupiter's orbit are icy)
    const measured = b.meta.albedo !== undefined;
    const outer = b.pos.length() > 4.5 * AU;
    const a = measured ? b.albedo : outer ? 0.6 : b.albedo;
    const icy = a > 0.45 ? 1 : a > 0.3 ? 0.5 : 0;
    u.uIcy.value = icy;
    // colour by kind of surface, with a per-body variation (the data has albedos, rarely colours)
    const vary = (c: [number, number, number], k: number): [number, number, number] =>
      [c[0] * (1 + k * (h('r') - 0.5)), c[1] * (1 + k * (h('g') - 0.5)), c[2] * (1 + k * (h('b') - 0.5))];
    const hasColour = b.color.some((v, i) => Math.abs(v - [0.6, 0.6, 0.6][i]) > 1e-3);
    let base: [number, number, number];
    let tint: [number, number, number];
    if (b.kind === 'tno') {
      // Kuiper-belt objects range from neutral grey to very red (tholins)
      const red = h('red');
      base = vary([1.0, 0.82 - 0.25 * red, 0.68 - 0.35 * red], 0.15);
      tint = [0.85 + 0.3 * h('t'), 0.75, 0.65];
    } else if (icy >= 1) {
      base = vary([0.93, 0.95, 0.98], 0.08);
      tint = [0.8, 0.86, 0.95];
    } else if (a < 0.1) {
      base = vary([0.42, 0.4, 0.38], 0.15); // carbonaceous
      tint = [0.75, 0.68, 0.6];
    } else {
      base = vary([0.85, 0.76, 0.66], 0.2); // stony
      tint = [0.9, 0.85, 0.8];
    }
    if (hasColour) base = [b.color[0], b.color[1], b.color[2]];
    (u.uColor.value as Vector3).set(...base);
    (u.uTint.value as Vector3).set(...tint);
    b.color = base;
  }

  private createGlare(b: Body): void {
    if (this.glare) return;
    const c = blackbodyRGB(b.teff);
    const L = luminance(c);
    const mat = new ShaderMaterial({
      vertexShader: GLARE_VERT, fragmentShader: GLARE_FRAG,
      uniforms: { uColor: { value: new Vector3(c[0] / L, c[1] / L, c[2] / L) }, uIntensity: { value: 1 }, uDiskFrac: { value: 0.1 },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    this.glare = new Mesh(new PlaneGeometry(2, 2), mat);
    this.glare.matrixAutoUpdate = false;
    this.glare.frustumCulled = false;
    this.glare.renderOrder = 15;
    this.glare.visible = false;
    this.group.add(this.glare);
  }

  private createRings(b: Body, ring: { innerKm: number; outerKm: number; texture: string }, planetUniforms: Record<string, { value: unknown }>): void {
    const req = b.radii[0];
    const inner = (ring.innerKm * 1e3) / req, outer = (ring.outerKm * 1e3) / req;
    if (!this.ringTex) {
      this.ringTex = this.loader.load(`${this.texBase}/${ring.texture}`);
      this.ringTex.minFilter = LinearMipmapLinearFilter;
      this.ringTex.magFilter = LinearFilter;
      this.ringTex.wrapS = ClampToEdgeWrapping;
    }
    planetUniforms.uHasRings.value = 1;
    planetUniforms.uRingTex.value = this.ringTex;
    (planetUniforms.uRingRadii.value as Vector3).set(inner, outer, 0);
    const mat = new ShaderMaterial({
      vertexShader: RING_VERT, fragmentShader: RING_FRAG,
      uniforms: {
        uRingTex: { value: this.ringTex }, uRingRadii: { value: new Vector3(inner, outer, 0) },
        uColor: { value: new Vector3(...b.color) }, uSunDirBF: { value: new Vector3() }, uViewDirBF: { value: new Vector3() },
        uSunIrr: { value: Math.PI }, uExposure: this.surfaceExposure, uPlanetRadius: { value: 1 }, uPolar: { value: b.radii[2] / b.radii[0] },
        uCamBF: { value: new Vector3() }, uReqKm: { value: req / 1e3 }, uShine: { value: 0.02 },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      transparent: true, depthWrite: false, side: DoubleSide,
      blending: CustomBlending, blendSrc: OneFactor, blendDst: OneMinusSrcAlphaFactor,
    });
    const mesh = new Mesh(makeRing(inner, outer), mat);
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    this.group.add(mesh);
    this.rings.set(b, mesh);
    if (!this.ringParticles) {
      this.ringParticles = new RingParticles(`${this.texBase}/${ring.texture}`, ring.innerKm * 1e3, ring.outerKm * 1e3, [0.75, 0.68, 0.58], this.surfaceExposure);
      this.ringParticlesBody = b;
      this.group.add(this.ringParticles.mesh, this.ringParticles.slab);
    }
  }

  /**
   * Update all body transforms for the camera at `cam`.
   * `pixelAngle`: radians per pixel; `exposure`: current pre-exposure.
   */
  update(cam: UPos, pixelAngle: number, dt: number, viewQuat?: Quaternion): void {
    this.time += dt;
    if (this.clouds) this.clouds.mesh.visible = false;   // shown again below while Earth is near
    const now = performance.now() / 1000;
    const sun = this.system.sun;
    const sunRel = sun.upos.sub(cam, new Vector3());
    let n = 0;
    const m4 = new Matrix4();
    const rot3 = new Matrix3();
    const tmp = new Vector3();
    for (const b of this.system.bodies) {
      if (!b.valid) {
        this.views.delete(b);
        continue;
      }
      const view = this.views.get(b) ?? { body: b, rel: new Vector3(), dist: 0, pixelRadius: 0, irradiance: 0, apparentMag: 99, resolved: false };
      b.upos.sub(cam, view.rel);
      const dist = view.rel.length();
      view.dist = dist;
      const ang = b.radius / Math.max(dist, b.radius * 1.0001);
      view.pixelRadius = Math.asin(Math.min(1, ang)) / pixelAngle;
      // Irradiance at the observer
      let irr: number;
      let color: [number, number, number];
      if (b.kind === 'star') {
        irr = sunIrradianceAt(Math.max(dist, b.radius));
        color = this.sunColor;
      } else {
        const toSun = tmp.copy(sunRel).sub(view.rel);
        const rSun = toSun.length();
        const cosPhase = toSun.dot(view.rel) / (rSun * dist) * -1;
        const phase = Math.acos(Math.max(-1, Math.min(1, cosPhase)));
        irr = sunIrradianceAt(rSun) * b.albedo * (b.radius / Math.max(dist, b.radius)) ** 2 * lambertPhase(phase);
        color = b.color;
      }
      view.irradiance = irr;
      view.apparentMag = -26.74 - 2.5 * Math.log10(irr / Math.PI);
      view.resolved = view.pixelRadius > 0.6;
      this.views.set(b, view);

      // Point sprite (fades out as the disk becomes resolved)
      const fade = 1 - smoothstep(0.6, 1.8, view.pixelRadius);
      if (fade > 0 && n < this.maxSprites) {
        this.spritePos[n * 3] = view.rel.x; this.spritePos[n * 3 + 1] = view.rel.y; this.spritePos[n * 3 + 2] = view.rel.z;
        this.spriteIrr[n] = irr * fade;
        this.spriteCol[n * 3] = color[0]; this.spriteCol[n * 3 + 1] = color[1]; this.spriteCol[n * 3 + 2] = color[2];
        n++;
      }

      // Resolved mesh
      let mesh = this.meshes.get(b);
      if (view.resolved) {
        mesh = mesh ?? this.createMesh(b);
        mesh.visible = true;
        m4.copy(b.orientation).scale(tmp.set(b.radii[0], b.radii[1], b.radii[2])).setPosition(view.rel);
        mesh.matrix.copy(m4);
        mesh.matrixWorldNeedsUpdate = true;
        const u = (mesh.material as ShaderMaterial).uniforms;
        this.updateMaps(b, u, view.pixelRadius, now);
        rot3.setFromMatrix4(b.orientation);
        u.uBodyToWorld.value.copy(rot3);
        u.uBodyCenter.value.copy(view.rel);
        u.uTime.value = this.time;
        if (b.kind !== 'star') {
          const toSun = tmp.copy(sunRel).sub(view.rel);
          const rSun = toSun.length();
          u.uSunDir.value.copy(toSun).divideScalar(rSun);
          u.uSunIrr.value = sunIrradianceAt(rSun);
        }
        // the cloud layer is painted on the surface: close up it would lie on the mountains, so it
        // fades out on descent, between 150 and 50 km up (no cloud layer to fly through yet)
        if (u.uHasClouds.value) {
          const t = Math.min(1, Math.max(0, (view.dist - b.radius - 50e3) / 100e3));
          u.uCloudVis.value = t * t * (3 - 2 * t);
          // ... and the cloud layer at cloud height takes over on the way down, clearing again below
          // 12-30 km so that mountains and canyons up close are not hidden under a blurry deck
          const camBF = view.rel.clone().negate().applyMatrix3(rot3.clone().transpose());
          const altE = camBF.length() - TerrainSource.baseRadius(b, camBF.normalize());   // above the ellipsoid
          const low = Math.min(1, Math.max(0, (altE - 12e3) / 18e3));
          this.clouds?.update(view.rel, b.orientation, b.radii[0], b.radii[2], u.uSunDir.value as Vector3, u.uSunIrr.value as number,
            u.uSunColor.value as Vector3, (1 - (u.uCloudVis.value as number)) * low * low * (3 - 2 * low), u.uCloudShift.value as number);
        }
        const ring = this.rings.get(b);
        if (ring) {
          ring.visible = true;
          ring.matrix.copy(b.orientation).scale(tmp.set(b.radii[0], b.radii[0], b.radii[0])).setPosition(view.rel);
          ring.matrixWorldNeedsUpdate = true;
          const ru = (ring.material as ShaderMaterial).uniforms;
          const inv = rot3.clone().transpose();
          ru.uSunDirBF.value.copy(u.uSunDir.value).applyMatrix3(inv);
          ru.uViewDirBF.value.copy(view.rel).negate().normalize().applyMatrix3(inv);
          ru.uCamBF.value.copy(view.rel).negate().applyMatrix3(inv).divideScalar(b.radii[0]);
          ru.uSunIrr.value = u.uSunIrr.value;
        }
        if (this.ringParticles && b === this.ringParticlesBody) {
          this.ringParticles.update(view.rel, ringFrame(b.orientation), b.radius, u.uSunDir.value as Vector3, u.uSunIrr.value as number);
          // within reach of the ring layer the slab draws the whole ring (as a medium)
          if (ring && this.ringParticles.slabActive) ring.visible = false;
        }
      } else if (mesh) {
        mesh.visible = false;
        const ring = this.rings.get(b);
        if (ring) ring.visible = false;
        if (this.ringParticles && b === this.ringParticlesBody) this.ringParticles.update(null, b.orientation, b.radius, new Vector3(), 0);
      }
      // Saturn's rings are much larger than the planet: keep them visible when they span pixels
      const ringMesh = this.rings.get(b);
      if (ringMesh && !view.resolved) ringMesh.visible = false;
    }
    this.updateEclipses(sunRel);
    this.updateGlare(viewQuat);
    this.releaseHi(now);
    this.sprites.geometry.setDrawRange(0, n);
    (this.sprites.geometry.attributes.position as BufferAttribute).needsUpdate = true;
    (this.sprites.geometry.attributes.aIrr as BufferAttribute).needsUpdate = true;
    (this.sprites.geometry.attributes.aColor as BufferAttribute).needsUpdate = true;
  }

  private occluders: Body[] | null = null;
  /** fraction of sunlight reaching each body's centre this frame (eclipses), with the reddened light in a planet's shadow */
  readonly sunlit = new Map<Body, number>();

  /** Does some body's shadow fall on `b` this frame? */
  eclipsed(b: Body): boolean {
    const m = this.meshes.get(b);
    return !!m && ((m.material as ShaderMaterial).uniforms.uOccN?.value as number) > 0;
  }
  /**
   * Eclipses: for each resolved body, up to four bodies that can stand between it and the Sun
   * this frame (moons on their planet, the planet on its moons, moons on each other).
   */
  private updateEclipses(sunRel: Vector3): void {
    this.occluders ??= this.system.bodies.filter((o) => o.kind !== 'star' && o.radius > 50e3);
    const toSun = new Vector3(), v = new Vector3();
    for (const view of this.views.values()) {
      const b = view.body;
      const mesh = this.meshes.get(b);
      if (!view.resolved || !mesh || b.kind === 'star') continue;
      const u = (mesh.material as ShaderMaterial).uniforms;
      if (!u.uOcc) continue;
      toSun.copy(sunRel).sub(view.rel);
      const dS = toSun.length();
      toSun.divideScalar(dS);
      const penumbra = SUN_RADIUS / dS;
      const occ = u.uOcc.value as Vector4[];
      const red = u.uOccRed.value as Vector4;
      let n = 0;
      let vis = 1, glow = 0;
      for (const o of this.occluders) {
        if (o === b || !o.valid) continue;
        const ov = this.views.get(o);
        if (!ov) continue;
        v.copy(ov.rel).sub(view.rel);                 // body -> occluder
        const along = v.dot(toSun);
        if (along <= 0 || along >= dS) continue;
        const perp = Math.sqrt(Math.max(0, v.lengthSq() - along * along));
        if (perp > o.radius + b.radius + along * penumbra * 1.05) continue;
        occ[n].set(ov.rel.x, ov.rel.y, ov.rel.z, o.radius);
        const reddens = this.atmosphere(o)?.surfaceTransmittance ? 1 : 0;
        red.setComponent(n, reddens);
        // as seen from the body's centre (for the eye's adaptation)
        const dO = v.length();
        const f = discOverlap(penumbra, o.radius / dO, Math.atan2(v.clone().cross(toSun).length(), along)) / (Math.PI * penumbra * penumbra);
        vis *= 1 - f;
        glow = Math.max(glow, f * reddens);
        if (++n === 4) break;
      }
      this.sunlit.set(b, Math.max(vis, glow * 0.004));
      u.uOccN.value = n;
      (u.uSunRel.value as Vector3).copy(sunRel);
    }
  }

  /** Can the body have landing terrain? Solid, round (not lumpy) and without a thick atmosphere. */
  private terrainOk(b: Body): boolean {
    if (b.kind === 'star' || b.isGasGiant || ['Venus', 'Titan'].includes(b.name) || b.radius < 150e3) return false;
    const m = this.meshes.get(b);
    return !!m && ((m.material as ShaderMaterial).uniforms.uLumpy.value as number) === 0;
  }

  /** The nearest solid world that could have landing terrain, if one is close. */
  terrainCandidate(): TerrainCandidate | null {
    let best: BodyView | null = null;
    let bestAlt = Infinity;
    for (const v of this.views.values()) {
      if (!v.resolved) continue;
      const alt = v.dist - v.body.radius;
      if (alt < bestAlt && alt < PlanetTerrain.reach(v.body) && this.terrainOk(v.body)) { bestAlt = alt; best = v; }
    }
    if (!best) return null;
    const b = best.body;
    const material = this.meshes.get(b)!.material as ShaderMaterial;
    this.terrainSource.craters.set(b, material.uniforms.uCraters.value as number);
    const key = this.textureKey(b);
    const sunBF = (material.uniforms.uSunDir.value as Vector3).clone().applyMatrix3(new Matrix3().setFromMatrix4(b.orientation).transpose());
    return { ground: this.terrainSource.ground(b), material, upos: b.upos, rel: best.rel.clone(), orient: b.orientation, lonLeft: key ? this.manifest.maps[key]?.lonLeft ?? -180 : -180, sunBF, alt: bestAlt };
  }

  private detailBody: Body | null = null;
  /**
   * Close-up tiles for the body that fills most of the view (if its map has a tile pyramid).
   * `viewDir`: world direction of the view's centre.
   */
  updateDetail(gl: WebGLRenderer, detail: TileDetail, pixelAngle: number, viewDir: Vector3): void {
    let best: BodyView | null = null;
    for (const v of this.views.values()) {
      if (!v.resolved || v.pixelRadius < 300) continue;
      const key = this.textureKey(v.body);
      if (!key || !detail.has(key)) continue;
      if (!best || v.pixelRadius > best.pixelRadius) best = v;
    }
    let on = false;
    if (best) {
      const b = best.body;
      const mesh = this.meshes.get(b);
      const u = mesh ? (mesh.material as ShaderMaterial).uniforms : null;
      const key = this.textureKey(b)!;
      if (u && u.uHasMap.value === 1) {
        const toBody = new Matrix3().copy(u.uBodyToWorld.value as Matrix3).transpose();
        const camBF = best.rel.clone().negate().applyMatrix3(toBody);
        const dirBF = viewDir.clone().applyMatrix3(toBody).normalize();
        on = detail.update(gl, key, u.uMap.value as Texture, b.radius, camBF, dirBF, pixelAngle, this.manifest.maps[key].lonLeft);
        if (on) {
          u.uDetail.value = detail.binding.texture;
          (u.uDetailRect.value as Vector4).copy(detail.binding.rect);
          u.uDetailOn.value = 1;
          if ((u.uMapW.value as number) > 0) u.uMapW.value = detail.binding.mapWidth;
        }
      }
    }
    const prev = this.detailBody;
    this.detailBody = on ? best!.body : null;
    if (prev && prev !== this.detailBody) {
      const m = this.meshes.get(prev);
      if (m) {
        const u = (m.material as ShaderMaterial).uniforms;
        u.uDetailOn.value = 0;
        const key = this.textureKey(prev);
        if (key && (u.uMapW.value as number) > 0) u.uMapW.value = this.hiTex.has(key) ? this.manifest.maps[key].hi?.width ?? this.manifest.maps[key].width : this.manifest.maps[key].width;
      }
    }
  }

  /** Swap in the high-resolution map and the relief map when the body is large on screen. */
  private updateMaps(b: Body, u: Record<string, { value: unknown }>, pixelRadius: number, now: number): void {
    const key = this.textureKey(b);
    if (key && this.manifest.maps[key]?.hi) {
      const entry = this.hiTex.get(key);
      const want = this.allowHi && (pixelRadius > HI_WANT_PX || (entry !== undefined && pixelRadius > HI_KEEP_PX));
      const hi = want ? this.wantHi(key, now) : null;
      const lo = this.loadedTex.get(key)?.tex ?? null;
      const tex = hi ?? lo;
      if (tex && u.uMap.value !== tex) {
        u.uMap.value = tex;
        // close-up detail is scaled to the map in use
        if ((u.uMapW.value as number) > 0) u.uMapW.value = hi ? this.manifest.maps[key].hi!.width : this.manifest.maps[key].width;
      }
    }
    const rk = this.reliefKey(b);
    if (rk && pixelRadius > RELIEF_WANT_PX) this.requestRelief(rk, u);
  }

  private requestRelief(rk: string, u: Record<string, { value: unknown }>): void {
    if (this.reliefRequested.has(rk)) return;
    this.reliefRequested.add(rk);
    const water = this.manifest.maps[rk].channels === 'relief+water';
    this.loadData(rk).then((tex) => {
      this.uploader(tex);
      u.uRelief.value = tex;
      u.uHasRelief.value = 1;
      u.uWater.value = water ? 1 : 0;
    }).catch((err) => console.warn('relief map failed', rk, err));
  }
  private reliefRequested = new Set<string>();

  /** VR: glare quad around the resolved Sun, facing the viewer; and the Sun's corona. */
  private updateGlare(viewQuat?: Quaternion): void {
    const sv = this.views.get(this.system.sun);
    if (this.sunCorona && this.sunLook) {
      if (sv && sv.resolved && sv.pixelRadius > 1.5 && viewQuat) {
        const c = blackbodyRGB(this.system.sun.teff);
        const L = luminance(c);
        this.sunCorona.update(sv.rel, this.system.sun.radius, viewQuat, [c[0] / L, c[1] / L, c[2] / L],
          this.surfaceExposure.value * (AU / SUN_RADIUS) ** 2, this.sunLook, this.time);
      } else this.sunCorona.hide();
    }
    const g = this.glare;
    if (!g) return;
    const sun = this.system.sun;
    const v = this.views.get(sun);
    g.visible = this.glareOn && !!v && v.resolved && !!viewQuat;
    if (!g.visible || !v || !viewQuat) return;
    const angR = Math.asin(Math.min(1, sun.radius / Math.max(v.dist, sun.radius * 1.0001)));
    const halfAng = Math.max(angR * 14, (10 * Math.PI) / 180);
    const half = Math.tan(Math.min(halfAng, 1.2)) * v.dist;
    const u = (g.material as ShaderMaterial).uniforms;
    u.uDiskFrac.value = Math.min(0.9, angR / Math.min(halfAng, 1.2));
    // the disk is shown at ~2.5 (eye adaptation caps it); scale the glare with it
    const diskDisplay = this.surfaceExposure.value * (AU / SUN_RADIUS) ** 2;
    u.uIntensity.value = 0.9 * Math.min(1, diskDisplay / 2.5);
    g.matrix.compose(v.rel, viewQuat, new Vector3(half, half, half));
    g.matrixWorldNeedsUpdate = true;
  }
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Mean linear luminance of an image (downsampled), used to normalise textures to catalogue albedos. */
function meanLinearLuminance(img: HTMLImageElement | ImageBitmap): number {
  try {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 32;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img as CanvasImageSource, 0, 0, 64, 32);
    const d = ctx.getImageData(0, 0, 64, 32).data;
    let sum = 0, wsum = 0;
    for (let y = 0; y < 32; y++) {
      const w = Math.cos(((y + 0.5) / 32 - 0.5) * Math.PI); // area weight
      for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4;
        const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        const l = 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
        if (l < 0.002) continue; // unimaged (no-data) areas, e.g. Pluto's southern hemisphere
        sum += w * l;
        wsum += w;
      }
    }
    return wsum > 0 ? sum / wsum : 0.3;
  } catch {
    return 0.3;
  }
}
