import { AdditiveBlending, Mesh, PlaneGeometry, type Quaternion, ShaderMaterial, Vector2, Vector3 } from 'three';
import { CORONA_FRAG, CORONA_VERT } from './shaders/body';
import type { StarLook } from './StarLook';
import { GLOBALS } from './shaders/xr';

/** Quad half-size, in star radii. */
const QUAD = 4;
/** Distance (m) at which the quad is drawn when the star is farther */
const NEAR = 1e7;
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
        uAxis2: { value: new Vector2(0, 1) }, uMinor: { value: 1 },
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
    // (close to a star the eye is adapted to the surface filling the view: the corona, a millionth
    // of its brightness, fades from sight)
    const near = Math.min(1, Math.max(0, (rel.length() / radius - 1.4) / 4.6));
    u.uIntensity.value = 0.85 * Math.min(1, display * 3) * (0.12 + 0.88 * near * near * (3 - 2 * near));
    u.uCorona.value = look.corona;
    u.uProm.value = look.prominences;
    u.uSeed.value = look.seed;
    u.uTime.value = time;
    // the flattened disk's outline: the spin axis seen in the quad's frame
    const ax = look.axis.clone().applyQuaternion(viewQuat.clone().invert());
    const sin2 = ax.x * ax.x + ax.y * ax.y;
    (u.uAxis2.value as Vector2).set(ax.x, ax.y).normalize();
    if (sin2 < 1e-8) (u.uAxis2.value as Vector2).set(0, 1);
    u.uMinor.value = Math.sqrt(ax.z * ax.z + (1 - look.flattening) ** 2 * sin2);
    // Drawn on a scaled-down copy nearer the eye (same directions, same angular size): a quad
    // around a giant star is ~1e12 m across, and triangles that size come out garbled (seen in
    // software rasterisers: one triangle missing, the glow smeared into a slab). The disk itself
    // is left clear by the shader, so the glow need not lie behind the star.
    const k = Math.min(1, NEAR / Math.max(rel.length(), 1));
    const s = radius * QUAD * k;
    this.mesh.matrix.compose(rel.clone().multiplyScalar(k), viewQuat, new Vector3(s, s, s));
    this.mesh.matrixWorldNeedsUpdate = true;
    this.mesh.visible = display > 1e-4;
  }

  hide(): void {
    this.mesh.visible = false;
  }
}
