import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, LineSegments, Matrix4, Mesh, Quaternion, ShaderMaterial, SphereGeometry, Vector3 } from 'three';
import { R_EARTH_M } from '../universe/Scale';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

/**
 * Scale cues that make size felt rather than read:
 *
 * * Dust: faint specks streaking past the eye while moving. They give motion parallax at every
 *   scale (the box they live in grows with speed, so they always pass at a readable rate) and fade
 *   in as the approach gets fast for the distance (speed / altitude).
 * * Earth for scale: Earth's silhouette, lit by the Sun, set against the selected giant at the
 *   same distance as the part of the giant behind it, so the two compare at their true sizes.
 *
 * Positions are camera-relative world axes in metres, like every other layer.
 */

const DUST_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute vec3 aBase;
attribute float aEnd;
uniform vec3 uOff;
uniform float uL;
uniform vec3 uStreak;
varying float vFade;
void main() {
  vec3 p = (fract(aBase + uOff) - 0.5) * uL;
  float r = length(p) / (0.5 * uL);
  // fade at the box's edge (no popping as specks wrap) and right at the eye (no lines through the head)
  vFade = (1.0 - smoothstep(0.55, 0.95, r)) * smoothstep(0.03, 0.12, r) * (aEnd > 0.5 ? 0.0 : 1.0);
  p -= uStreak * aEnd;
  gl_Position = projectView(viewMatrix * vec4(p, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

const DUST_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uAlpha;
varying float vFade;
void main() {
  gl_FragColor = vec4(vec3(0.75, 0.72, 0.66) * uAlpha * vFade, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

const EARTH_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vN;
varying vec3 vPos;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

const EARTH_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uSunDir;
uniform float uSunIrr;
uniform float uExposure;
uniform float uRim;
varying vec3 vN;
varying vec3 vPos;
void main() {
  vec3 N = normalize(vN), V = normalize(cameraPosition - vPos);
  float mu = max(dot(N, uSunDir), 0.0);
  float facing = max(dot(N, V), 0.0);
  // ocean-and-cloud blue day side; the night side stays a dark silhouette with a thin blue limb
  vec3 day = vec3(0.22, 0.30, 0.42) * (uSunIrr / 3.14159265) * mu * uExposure;
  vec3 rim = vec3(0.25, 0.5, 1.0) * uRim * pow(1.0 - facing, 4.0);
  gl_FragColor = vec4(min(day, vec3(6.0e4)) + rim + vec3(0.002, 0.003, 0.006), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

export interface EarthRefTarget {
  /** camera-relative centre of the body (m) */
  rel: Vector3;
  radius: number;
  /** camera-relative position of the Sun (m) */
  sunRel: Vector3;
}

export class ScaleCues {
  readonly group = new Group();
  /** dust streaks while moving */
  dustOn = true;
  /** Earth's silhouette next to large selected bodies (Comma) */
  earthOn = true;
  /** where the Earth silhouette was placed last frame (camera-relative), for tests; null when hidden */
  earthAt: Vector3 | null = null;
  earthScale = 0;
  private dust: LineSegments;
  private dustMat: ShaderMaterial;
  private earth: Mesh;
  private earthMat: ShaderMaterial;
  private off = new Vector3();
  private alpha = 0;

  constructor(exposure: { value: number }, count = 500) {
    this.group.name = 'scale cues';
    const base = new Float32Array(count * 6), end = new Float32Array(count * 2), pos = new Float32Array(count * 6);
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < count; i++) {
      const x = rnd(), y = rnd(), z = rnd();
      base.set([x, y, z, x, y, z], i * 6);
      end[i * 2 + 1] = 1;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aBase', new BufferAttribute(base, 3));
    g.setAttribute('aEnd', new BufferAttribute(end, 1));
    this.dustMat = new ShaderMaterial({
      name: 'dust', vertexShader: DUST_VERT, fragmentShader: DUST_FRAG,
      uniforms: { uOff: { value: new Vector3() }, uL: { value: 100 }, uStreak: { value: new Vector3() }, uAlpha: { value: 0 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    this.dust = new LineSegments(g, this.dustMat);
    this.dust.frustumCulled = false;
    this.dust.renderOrder = 12;
    this.dust.visible = false;
    this.earthMat = new ShaderMaterial({
      name: 'earth for scale', vertexShader: EARTH_VERT, fragmentShader: EARTH_FRAG,
      uniforms: { uSunDir: { value: new Vector3(1, 0, 0) }, uSunIrr: { value: Math.PI }, uExposure: exposure, uRim: { value: 0.12 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
    });
    this.earth = new Mesh(new SphereGeometry(1, 48, 24), this.earthMat);
    this.earth.matrixAutoUpdate = false;
    this.earth.frustumCulled = false;
    this.earth.visible = false;
    this.earth.name = 'Earth for scale';
    this.group.add(this.dust, this.earth);
  }

  warmupObjects(): (Mesh | LineSegments)[] {
    return [this.dust, this.earth];
  }

  /**
   * `vel` the camera's velocity relative to what it co-moves with (m/s, world axes), `altitude`
   * the distance to the nearest surface (m).
   */
  updateDust(vel: Vector3, dt: number, altitude: number): void {
    const speed = vel.length();
    const rate = speed / Math.max(altitude, 1);
    const want = this.dustOn && speed > 0.2 ? dustAlpha(rate) : 0;
    this.alpha += (want - this.alpha) * Math.min(1, dt * 3);
    this.dust.visible = this.alpha > 0.003;
    if (!this.dust.visible || dt <= 0) return;
    // the specks cross their box in ~3 s whatever the speed: parallax you can read
    const L = Math.max(speed * 3, 30);
    const u = this.dustMat.uniforms;
    this.off.addScaledVector(vel, -dt / L);
    this.off.set(this.off.x - Math.floor(this.off.x), this.off.y - Math.floor(this.off.y), this.off.z - Math.floor(this.off.z));
    (u.uOff.value as Vector3).copy(this.off);
    u.uL.value = L;
    (u.uStreak.value as Vector3).copy(vel).multiplyScalar(Math.min(0.08, 0.04 + 0.02 * Math.log10(1 + rate)));
    u.uAlpha.value = this.alpha;
  }

  get dustAlpha(): number {
    return this.dust.visible ? this.alpha : 0;
  }

  /**
   * Place Earth against `t` (null hides it). `fwd` the view direction, `pixelAngle` radians per pixel:
   * Earth only appears when it would be at least a couple of pixels across.
   */
  updateEarth(t: EarthRefTarget | null, fwd: Vector3, pixelAngle: number): void {
    this.earthAt = null;
    this.earth.visible = false;
    if (!this.earthOn || !t) return;
    const pl = earthPlacement(t.rel, t.radius, fwd);
    if (!pl) return;
    const k = pl.scale;
    if ((2 * R_EARTH_M * k) / pl.pos.length() < 2.5 * pixelAngle) return;
    this.earth.matrix.compose(pl.pos, IDENT, new Vector3(R_EARTH_M * k, R_EARTH_M * k, R_EARTH_M * k));
    this.earth.matrixWorldNeedsUpdate = true;
    const toSun = t.sunRel.clone().sub(pl.pos);
    const ds = toSun.length();
    (this.earthMat.uniforms.uSunDir.value as Vector3).copy(toSun).divideScalar(Math.max(ds, 1));
    this.earthMat.uniforms.uSunIrr.value = Math.PI * (AU_M / Math.max(ds, 1e6)) ** 2;
    this.earth.visible = true;
    this.earthAt = pl.pos.clone();
    this.earthScale = k;
  }
}

const IDENT = new Quaternion();
const AU_M = 1.495978707e11;

/**
 * Dust opacity from the approach rate (speed / altitude, 1/s): faint when drifting, clear when the
 * view is rushing in, capped so it never competes with the scene.
 */
export function dustAlpha(rate: number): number {
  const t = Math.max(0, Math.min(1, (Math.log10(Math.max(rate, 1e-9)) + 2.5) / 2.5)); // 0.003/s .. 1/s
  return 0.05 + 0.3 * t * t * (3 - 2 * t);
}

/**
 * Where Earth goes when compared with a body of radius `r` whose centre is at `rel` (camera-relative):
 * over the body's disc, near the view centre (or on the disc's side towards it), just in front of
 * the body's surface along that line of sight, scaled so its angular size is what a real Earth
 * would have sitting at that spot of the surface. null when the camera is inside the body.
 */
export function earthPlacement(rel: Vector3, r: number, fwd: Vector3): { pos: Vector3; scale: number } | null {
  const d = rel.length();
  if (d <= r * 1.001) return null;
  const toC = rel.clone().divideScalar(d);
  const angR = Math.asin(r / d);
  // aim 30% of the disc's radius off the view centre's nearest disc point, inside the limb
  const f = fwd.clone().normalize();
  let a = toC.angleTo(f);
  const maxA = 0.6 * angR;
  const axis = new Vector3().crossVectors(toC, f);
  if (axis.lengthSq() < 1e-12) axis.set(0, 1, 0).cross(toC);
  if (axis.lengthSq() < 1e-12) axis.set(1, 0, 0).cross(toC);
  axis.normalize();
  a = Math.min(a, maxA);
  if (a < 0.3 * angR) a = 0.3 * angR; // never dead centre: sit beside what you are looking at
  const dir = toC.clone().applyMatrix4(new Matrix4().makeRotationAxis(axis, a)).normalize();
  // ray-sphere: first surface hit along dir
  const b = dir.dot(rel);
  const disc = b * b - (d * d - r * r);
  if (disc <= 0) return null;
  const ts = b - Math.sqrt(disc);
  const t = Math.max(ts - 1.5 * R_EARTH_M, ts * 0.9);
  return { pos: dir.multiplyScalar(t), scale: t / ts };
}
