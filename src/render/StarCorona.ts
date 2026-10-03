import { AdditiveBlending, Mesh, PlaneGeometry, type Quaternion, ShaderMaterial, Vector3 } from 'three';
import { CORONA_FRAG, CORONA_VERT } from './shaders/body';
import type { StarLook } from './StarLook';
import { GLOBALS } from './shaders/xr';

/** Quad half-size, in star radii. */
const QUAD = 4;
const geo = new PlaneGeometry(2, 2);

/**
 * The glow around a resolved star (inner corona, streamers, prominences) as a camera-facing quad.
 * Artistic in strength — a real corona is a millionth of the disk's brightness — like the glow
 * SpaceEngine and photographs show; its shape and activity follow the star's look.
 */
export class StarCorona {
  readonly mesh: Mesh;
  private mat: ShaderMaterial;

  constructor() {
    this.mat = new ShaderMaterial({
      name: 'star-corona', vertexShader: CORONA_VERT, fragmentShader: CORONA_FRAG,
      uniforms: {
        uColor: { value: new Vector3(1, 1, 1) }, uIntensity: { value: 1 }, uQuad: { value: QUAD },
        uCorona: { value: 0.6 }, uProm: { value: 0 }, uSeed: { value: 0 }, uTime: { value: 0 },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    this.mesh = new Mesh(geo, this.mat);
    this.mesh.matrixAutoUpdate = false;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 12;
    this.mesh.visible = false;
  }

  /**
   * Place around a star at camera-relative `rel` (m) of radius `radius`, facing `viewQuat`.
   * `display`: the disk's displayed (pre-tonemap) brightness, which the glow follows.
   */
  update(rel: Vector3, radius: number, viewQuat: Quaternion, color: [number, number, number], display: number, look: StarLook, time: number): void {
    const u = this.mat.uniforms;
    (u.uColor.value as Vector3).set(...color);
    // a fixed display-level glow once the disk is bright enough to see (not dimmed by adaptation)
    u.uIntensity.value = 0.85 * Math.min(1, display * 3);
    u.uCorona.value = look.corona;
    u.uProm.value = look.prominences;
    u.uSeed.value = look.seed;
    u.uTime.value = time;
    const s = radius * QUAD;
    this.mesh.matrix.compose(rel, viewQuat, new Vector3(s, s, s));
    this.mesh.matrixWorldNeedsUpdate = true;
    this.mesh.visible = display > 1e-4;
  }

  hide(): void {
    this.mesh.visible = false;
  }
}
