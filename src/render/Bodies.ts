import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CustomBlending, DoubleSide, DynamicDrawUsage, FrontSide, Group,
  LinearFilter, LinearMipmapLinearFilter, Matrix3, Matrix4, Mesh, OneFactor, OneMinusSrcAlphaFactor, Points,
  RepeatWrapping, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader, Vector3, ClampToEdgeWrapping,
} from 'three';
import { blackbodyRGB, lambertPhase, luminance, sunIrradianceAt } from '../astro/photometry';
import { AU, SUN_RADIUS } from '../core/units';
import type { UPos } from '../core/upos';
import type { Body } from '../universe/Body';
import type { SolarSystem } from '../universe/SolarSystem';
import { BODY_FRAG, BODY_VERT, RING_FRAG, RING_VERT, STAR_FRAG } from './shaders/body';
import { PSF_FRAGMENT, PSF_UNIFORMS, PSF_VERTEX } from './shaders/psf';

interface TextureManifest {
  maps: Record<string, { file: string; channels: string; lonLeft: number; credit: string }>;
}

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
  if (radius <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  gl_Position = projectionMatrix * (viewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
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
  #include <logdepthbuf_fragment>
}`;

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
  private rings = new Map<Body, Mesh>();
  private spheres = new Map<number, BufferGeometry>();
  private textures = new Map<string, Promise<{ tex: Texture; meanLum: number }>>();
  private loadedTex = new Map<string, { tex: Texture; meanLum: number }>();
  private loader = new TextureLoader();
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

  constructor(
    private system: SolarSystem,
    private manifest: TextureManifest,
    private texBase: string,
    psf: Record<string, { value: number }>,
    private rings_: Record<string, { innerKm: number; outerKm: number; texture: string }>,
  ) {
    this.group.name = 'bodies';
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

  private createMesh(b: Body): Mesh {
    const mapInfo = b.texture ? this.manifest.maps[b.texture] : undefined;
    const isStar = b.kind === 'star';
    const mat = new ShaderMaterial({
      vertexShader: BODY_VERT,
      fragmentShader: isStar ? STAR_FRAG : BODY_FRAG,
      uniforms: {
        uMap: { value: null }, uHasMap: { value: 0 }, uMapGray: { value: mapInfo?.channels === 'L' ? 1 : 0 },
        uNight: { value: null }, uHasNight: { value: 0 },
        uClouds: { value: null }, uHasClouds: { value: 0 }, uCloudShift: { value: 0 },
        uColor: { value: new Vector3(...b.color) },
        uAlbedoScale: { value: 1 },
        uAirless: { value: b.isAirless ? 1 : 0 },
        uBands: { value: !b.texture && (b.isGasGiant || b.name === 'Venus') ? 1 : 0 },
        uSeed: { value: (b.id % 97) * 1.37 },
        uSunDir: { value: new Vector3(1, 0, 0) },
        uSunIrr: { value: Math.PI },
        uSunColor: { value: new Vector3(...this.sunColor) },
        uExposure: this.surfaceExposure,
        uBodyToWorld: { value: new Matrix3() },
        uBodyCenter: { value: new Vector3() },
        uHasRings: { value: 0 }, uRingTex: { value: null }, uRingRadii: { value: new Vector3() },
        uRadiance: { value: 1 }, uTime: { value: 0 },
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
      if (b.texture) {
        this.texture(b.texture).then(({ tex, meanLum }) => {
          u.uMap.value = tex;
          u.uHasMap.value = 1;
          u.uAlbedoScale.value = known ? lambertRho / Math.max(meanLum, 1e-3) : 1;
        });
      } else {
        u.uAlbedoScale.value = lambertRho / Math.max(luminance(b.color), 1e-3);
      }
      if (b.name === 'Earth') {
        this.texture('earth_night').then(({ tex }) => { u.uNight.value = tex; u.uHasNight.value = 1; });
        this.texture('earth_clouds').then(({ tex }) => { u.uClouds.value = tex; u.uHasClouds.value = 1; });
      }
      const ring = this.rings_[b.name.toLowerCase()];
      if (ring) this.createRings(b, ring, u);
    }
    return mesh;
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
  }

  /**
   * Update all body transforms for the camera at `cam`.
   * `pixelAngle`: radians per pixel; `exposure`: current pre-exposure.
   */
  update(cam: UPos, pixelAngle: number, dt: number): void {
    this.time += dt;
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
        const ring = this.rings.get(b);
        if (ring) {
          ring.visible = true;
          ring.matrix.copy(b.orientation).scale(tmp.set(b.radii[0], b.radii[0], b.radii[0])).setPosition(view.rel);
          ring.matrixWorldNeedsUpdate = true;
          const ru = (ring.material as ShaderMaterial).uniforms;
          const inv = rot3.clone().transpose();
          ru.uSunDirBF.value.copy(u.uSunDir.value).applyMatrix3(inv);
          ru.uViewDirBF.value.copy(view.rel).negate().normalize().applyMatrix3(inv);
          ru.uSunIrr.value = u.uSunIrr.value;
        }
      } else if (mesh) {
        mesh.visible = false;
        const ring = this.rings.get(b);
        if (ring) ring.visible = false;
      }
      // Saturn's rings are much larger than the planet: keep them visible when they span pixels
      const ringMesh = this.rings.get(b);
      if (ringMesh && !view.resolved) ringMesh.visible = false;
    }
    this.sprites.geometry.setDrawRange(0, n);
    (this.sprites.geometry.attributes.position as BufferAttribute).needsUpdate = true;
    (this.sprites.geometry.attributes.aIrr as BufferAttribute).needsUpdate = true;
    (this.sprites.geometry.attributes.aColor as BufferAttribute).needsUpdate = true;
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
