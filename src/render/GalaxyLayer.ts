import {
  BackSide, CubeCamera, HalfFloatType, LinearFilter, LinearMipmapLinearFilter, Matrix3, Mesh, type PerspectiveCamera, Scene,
  ShaderMaterial, SphereGeometry, Vector3, WebGLCubeRenderTarget, type WebGLRenderer,
} from 'three';
import { DUST_NORM, GALAXY } from '../universe/Galaxy';
import { GLOW_VERT, glowFrag } from './shaders/galaxy';

/** Light closer than this (pc) is drawn as individual stars, not as glow. */
export const GLOW_NEAR = 300;

/**
 * The Milky Way's unresolved starlight from the explorer's position: the galaxy model ray-marched
 * into a cube map (shaders/galaxy.ts), refreshed a face at a time while the explorer moves, and
 * shown by the sky layer. From outside the galaxy the same map shows the whole spiral.
 */
export class GalaxyGlow {
  target: WebGLCubeRenderTarget;
  /** galactocentric position (pc) each face was last rendered from */
  private facePos: (Vector3 | null)[] = [null, null, null, null, null, null];
  private face = 0;
  private scene = new Scene();
  private cubeCam: CubeCamera;
  private mat: ShaderMaterial;
  private seed = 0;
  /** headset quality: smaller map, fewer samples */
  vr = false;
  /** last position the map was rendered from (galactocentric pc), for the sky's exposure curve */
  readonly cam = new Vector3();

  constructor() {
    this.target = make(512);
    this.cubeCam = new CubeCamera(0.1, 10, this.target);
    this.mat = new ShaderMaterial({
      vertexShader: GLOW_VERT, fragmentShader: glowFrag(DUST_NORM),
      uniforms: {
        uCam: { value: new Vector3() }, uToGal: { value: new Matrix3().copy(GALAXY.toGalM) },
        uNear: { value: GLOW_NEAR }, uSteps: { value: 128 }, uSeed: { value: 0 },
      },
      side: BackSide, depthTest: false, depthWrite: false,
    });
    const m = new Mesh(new SphereGeometry(1, 32, 16), this.mat);
    m.frustumCulled = false;
    this.scene.add(m);
  }

  /** true once every face has been rendered at least once */
  get ready(): boolean {
    return this.facePos.every((p) => p !== null);
  }

  /** Compile the ray-marching shader ahead of its first use. */
  compile(gl: WebGLRenderer): void {
    void gl.compileAsync(this.scene, this.cubeCam.children[0] as PerspectiveCamera).catch(() => undefined);
  }

  /** distance (pc) beyond which moving the eye visibly changes the glow */
  private threshold(p: Vector3): number {
    const outside = Math.max(0, Math.abs(p.z) - 4000, Math.hypot(p.x, p.y) - 22000);
    return 0.004 * Math.max(GLOW_NEAR, outside);
  }

  /**
   * Re-render up to `maxFaces` faces that are stale for galactocentric eye position `camGal` (pc).
   */
  update(gl: WebGLRenderer, camGal: Vector3, maxFaces = 1): void {
    const size = this.vr ? 256 : 512;
    if (this.target.width !== size) {
      this.target.dispose();
      this.target = make(size);
      this.cubeCam.renderTarget = this.target;
      this.facePos.fill(null);
    }
    const thr = this.threshold(camGal);
    const stale: number[] = [];
    for (let k = 0; k < 6; k++) {
      const f = (this.face + k) % 6;
      const p = this.facePos[f];
      if (!p || p.distanceTo(camGal) > thr) stale.push(f);
    }
    if (!stale.length) return;
    const faces = stale.slice(0, maxFaces);
    this.face = (faces[faces.length - 1] + 1) % 6;
    if (this.cubeCam.coordinateSystem !== gl.coordinateSystem) {
      this.cubeCam.coordinateSystem = gl.coordinateSystem;
      this.cubeCam.updateCoordinateSystem();
    }
    this.cubeCam.updateMatrixWorld(true);
    const u = this.mat.uniforms;
    (u.uCam.value as Vector3).copy(camGal);
    u.uSteps.value = this.vr ? 80 : 128;
    u.uSeed.value = this.seed = (this.seed + 1) % 64;
    this.cam.copy(camGal);
    const prevTarget = gl.getRenderTarget();
    const prevFace = gl.getActiveCubeFace();
    const prevMip = gl.getActiveMipmapLevel();
    const xrWas = gl.xr.enabled;
    gl.xr.enabled = false;
    for (const f of faces) {
      this.target.texture.generateMipmaps = f === faces[faces.length - 1];
      gl.setRenderTarget(this.target, f);
      gl.render(this.scene, this.cubeCam.children[f] as PerspectiveCamera);
      this.facePos[f] = camGal.clone();
    }
    gl.xr.enabled = xrWas;
    gl.setRenderTarget(prevTarget, prevFace, prevMip);
  }
}

function make(size: number): WebGLCubeRenderTarget {
  return new WebGLCubeRenderTarget(size, {
    type: HalfFloatType, generateMipmaps: true, minFilter: LinearMipmapLinearFilter, magFilter: LinearFilter, depthBuffer: false,
  });
}
