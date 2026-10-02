import {
  AlwaysDepth, BackSide, NeverDepth, ClampToEdgeWrapping, CubeCamera, DataTexture, DataUtils, FrontSide, Group, HalfFloatType,
  LessEqualDepth, LinearFilter, LinearMipmapLinearFilter, Mesh, NoBlending, type Object3D, type PerspectiveCamera,
  RGBAFormat, type Scene, ShaderMaterial, SphereGeometry, Vector3, WebGLCubeRenderTarget, type WebGLRenderer,
} from 'three';
import { blackbodySurface } from '../astro/photometry';
import { AU, SUN_RADIUS } from '../core/units';
import type { UPos } from '../core/upos';
import type { BlackHole } from '../universe/BlackHoles';
import { BH_FRAG, BH_VERT } from './shaders/blackhole';
import { GLOBALS } from './shaders/xr';

/** Radiance of the Sun's disk in the engine's units (white Lambertian at 1 AU = 1). */
const SUN_DISK = (AU / SUN_RADIUS) ** 2;
const LUT_LOG_MIN = 2.5;
const LUT_LOG_SPAN = 5.5;
const MAX_ACTIVE = 2;
/** radius (m) of the camera-centred sphere used when the eye is inside a lensing region */
const INSIDE_SPHERE = 1e7;

export interface BlackHoleView {
  bh: BlackHole;
  rel: Vector3;
  dist: number;
  /** radius (m) of the region drawn with lensing */
  region: number;
  /** eye inside that region (drawn full screen) */
  inside: boolean;
  /** angular radius of the shadow and of the bright inner disk, in pixels */
  shadowPx: number;
  innerDiskPx: number;
  /** typical radiance of the inner disk (engine units, before exposure); 0 without a disk */
  diskRadiance: number;
}

/**
 * Draws black holes: each nearby hole gets a sphere around the region it visibly distorts (or
 * a full-screen sphere when the eye is inside that region) whose shader traces light past it
 * (shaders/blackhole.ts). The undistorted scene behind it comes from a cube map captured at
 * the eye with the holes hidden, one face per frame.
 */
export class BlackHoleLayer {
  readonly group = new Group();
  views: BlackHoleView[] = [];
  /** headset quality: fewer integration steps and a smaller environment map */
  vr = false;
  private meshes: Mesh[] = [];
  private geo = new SphereGeometry(1, 64, 32);
  private env: WebGLCubeRenderTarget;
  private cubeCam: CubeCamera;
  private lut: DataTexture;
  private face = 0;
  private fullCapture = true;
  private relY = new Map<number, number>();

  /**
   * `reversedDepth`: three maps depth functions for a reversed-Z buffer (Always <-> Never too),
   * so "always pass" has to be requested as Never there.
   */
  constructor(readonly holes: BlackHole[], private exposure: { value: number }, private reversedDepth = false) {
    this.group.name = 'black-holes';
    this.lut = makeLut();
    this.env = makeEnv(1024);
    this.cubeCam = new CubeCamera(1e3, 1e30, this.env);
  }

  private material(): ShaderMaterial {
    return new ShaderMaterial({
      vertexShader: BH_VERT, fragmentShader: BH_FRAG,
      uniforms: {
        uEnv: { value: this.env.texture }, uLut: { value: this.lut },
        uO: { value: new Vector3() }, uRs: { value: 1 },
        uN: { value: new Vector3(0, 0, 1) }, uE1: { value: new Vector3(1, 0, 0) }, uE2: { value: new Vector3(0, 1, 0) },
        uRin: { value: 3 }, uRout: { value: 0 }, uTmax: { value: 1e4 }, uSunDisk: { value: SUN_DISK }, uExposure: this.exposure, uTime: { value: 0 },
        uMaxSteps: { value: 220 }, uStepK: { value: 1 },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      // drawn after the stars and point sources it replaces, before nearby sprites that may be in front
      transparent: true, blending: NoBlending, depthTest: true, depthWrite: true,
    });
  }

  private mesh(i: number): Mesh {
    while (this.meshes.length <= i) {
      const m = new Mesh(this.geo, this.material());
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      m.renderOrder = 30;
      m.name = `black-hole-${this.meshes.length}`;
      this.group.add(m);
      this.meshes.push(m);
    }
    return this.meshes[i];
  }

  /** A mesh to compile the shader with before it is first needed. */
  warmupObjects(): Mesh[] {
    return [this.mesh(0)];
  }

  /** Radiance of a blackbody at T relative to the Sun's disk temperature (visual luminance). */
  private relLuminance(T: number): number {
    const k = Math.round(Math.log10(T) * 50);
    let v = this.relY.get(k);
    if (v === undefined) {
      v = blackbodySurface(10 ** (k / 50)).relY;
      this.relY.set(k, v);
    }
    return v;
  }

  /** Choose the holes worth drawing from `cam` and set up their meshes. */
  update(cam: UPos, pixelAngle: number, time: number): void {
    const cands: BlackHoleView[] = [];
    const rel = new Vector3();
    for (const bh of this.holes) {
      bh.upos.sub(cam, rel);
      const dist = rel.length();
      const rs = bh.radius;
      // beyond ~4/pixelAngle rs the bending (2 rs / b) is under half a pixel
      const regionRs = Math.max(Math.min(Math.max(4 / pixelAngle, 60), 4e5), (bh.diskOuter / rs) * 1.05);
      const region = regionRs * rs;
      const inside = dist < region * 1.05;
      const regionPx = inside ? Infinity : Math.asin(region / dist) / pixelAngle;
      if (regionPx < 1.5) continue;
      const ang = (r: number) => Math.asin(Math.min(1, r / Math.max(dist, r * 1.0001))) / pixelAngle;
      cands.push({
        bh, rel: rel.clone(), dist, region, inside,
        shadowPx: ang(2.6 * rs), innerDiskPx: bh.diskOuter > 0 ? ang(Math.min(20 * rs, bh.diskOuter)) : 0,
        diskRadiance: bh.diskOuter > 0 ? SUN_DISK * this.relLuminance(bh.diskTmax) : 0,
      });
    }
    cands.sort((a, b) => a.dist / a.bh.radius - b.dist / b.bh.radius);
    this.views = cands.slice(0, MAX_ACTIVE);
    for (const m of this.meshes) m.visible = false;
    this.views.forEach((v, i) => {
      const m = this.mesh(i);
      const mat = m.material as ShaderMaterial;
      const u = mat.uniforms;
      const bh = v.bh;
      const rs = bh.radius;
      const region = v.region;
      if (v.inside) {
        m.matrix.makeScale(INSIDE_SPHERE, INSIDE_SPHERE, INSIDE_SPHERE);
        if (mat.side !== BackSide) { mat.side = BackSide; mat.depthFunc = this.reversedDepth ? NeverDepth : AlwaysDepth; mat.needsUpdate = true; }
      } else {
        m.matrix.makeScale(region, region, region).setPosition(v.rel);
        if (mat.side !== FrontSide) { mat.side = FrontSide; mat.depthFunc = LessEqualDepth; mat.needsUpdate = true; }
      }
      m.matrixWorldNeedsUpdate = true;
      m.visible = true;
      (u.uO.value as Vector3).copy(v.rel).multiplyScalar(-1 / rs);
      u.uRs.value = rs;
      const n = bh.diskNormal;
      (u.uN.value as Vector3).copy(n);
      const e1 = new Vector3().crossVectors(n, Math.abs(n.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0)).normalize();
      (u.uE1.value as Vector3).copy(e1);
      (u.uE2.value as Vector3).crossVectors(n, e1);
      u.uRin.value = bh.diskInner / rs;
      u.uRout.value = bh.diskOuter / rs;
      u.uTmax.value = bh.diskTmax;
      u.uTime.value = time;
      u.uMaxSteps.value = this.vr ? 90 : 220;
      u.uStepK.value = this.vr ? 1.5 : 1;
      u.uEnv.value = this.env.texture;
    });
  }

  /**
   * Refresh the environment the holes lens: the scene from the eye without the holes, the
   * explorer's rig (controllers, panels) or `hide`. One face per call; all six when a hole
   * first comes into view. `psf` is adjusted so point sprites are sized for the cube's pixels.
   */
  capture(gl: WebGLRenderer, scene: Scene, hide: Object3D[], psf: Record<string, { value: number }>): void {
    if (!this.views.length) {
      this.fullCapture = true;
      return;
    }
    const size = this.vr ? 512 : 1024;
    if (this.env.width !== size) {
      this.env.dispose();
      this.env = makeEnv(size);
      this.cubeCam.renderTarget = this.env;
      this.fullCapture = true;
    }
    if (this.cubeCam.coordinateSystem !== gl.coordinateSystem) {
      this.cubeCam.coordinateSystem = gl.coordinateSystem;
      this.cubeCam.updateCoordinateSystem();
    }
    this.cubeCam.updateMatrixWorld(true);
    const faces = this.fullCapture ? [0, 1, 2, 3, 4, 5] : [this.face];
    this.fullCapture = false;
    this.face = (this.face + 1) % 6;

    const prevTarget = gl.getRenderTarget();
    const prevFace = gl.getActiveCubeFace();
    const prevMip = gl.getActiveMipmapLevel();
    const xrWas = gl.xr.enabled;
    const saved = { sa: psf.uPixelSA.value, dpr: psf.uDpr.value, pull: GLOBALS.uPullIn.value, dk: GLOBALS.uDepthK.value };
    const hidden = [this.group, ...hide];
    const vis = hidden.map((o) => o.visible);
    for (const o of hidden) o.visible = false;
    gl.xr.enabled = false;
    psf.uPixelSA.value = (2 / size) ** 2;
    psf.uDpr.value = 1;
    GLOBALS.uPullIn.value = 0;
    GLOBALS.uDepthK.value = 1;
    for (const f of faces) {
      this.env.texture.generateMipmaps = f === faces[faces.length - 1];
      gl.setRenderTarget(this.env, f);
      gl.clear(true, true, true);
      gl.render(scene, this.cubeCam.children[f] as PerspectiveCamera);
    }
    psf.uPixelSA.value = saved.sa;
    psf.uDpr.value = saved.dpr;
    GLOBALS.uPullIn.value = saved.pull;
    GLOBALS.uDepthK.value = saved.dk;
    hidden.forEach((o, i) => { o.visible = vis[i]; });
    gl.xr.enabled = xrWas;
    gl.setRenderTarget(prevTarget, prevFace, prevMip);
  }
}

function makeEnv(size: number): WebGLCubeRenderTarget {
  return new WebGLCubeRenderTarget(size, {
    type: HalfFloatType, generateMipmaps: true, minFilter: LinearMipmapLinearFilter, magFilter: LinearFilter, depthBuffer: true,
  });
}

/** Blackbody lookup over log10 T in [2.5, 8]: rgb with luminance 1, a = log10 of the luminance relative to 5772 K. */
function makeLut(): DataTexture {
  const n = 256;
  const data = new Uint16Array(n * 4);
  for (let i = 0; i < n; i++) {
    const T = 10 ** (LUT_LOG_MIN + (LUT_LOG_SPAN * i) / (n - 1));
    const { rgb, relY } = blackbodySurface(T);
    data[i * 4] = DataUtils.toHalfFloat(rgb[0]);
    data[i * 4 + 1] = DataUtils.toHalfFloat(rgb[1]);
    data[i * 4 + 2] = DataUtils.toHalfFloat(rgb[2]);
    data[i * 4 + 3] = DataUtils.toHalfFloat(Math.log10(Math.max(relY, 1e-30)));
  }
  const t = new DataTexture(data, n, 1, RGBAFormat, HalfFloatType);
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  t.wrapS = t.wrapT = ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}
