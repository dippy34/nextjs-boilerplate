import { AdditiveBlending, BackSide, BoxGeometry, Matrix4, Mesh, ShaderMaterial, Vector3 } from 'three';
import { PC } from '../core/units';
import { UPos } from '../core/upos';
import { DUST_NORM, GALAXY, LUM } from '../universe/Galaxy';
import { GALAXY_GLSL } from './shaders/galaxy';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

const f = (x: number) => (Number.isInteger(x) ? `${x}.0` : `${x}`);

/** Half extents of the galaxy's box (pc), as in Galaxy.galaxyBounds. */
const EXT = new Vector3(22000, 22000, 4000);

const VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
uniform float uClipScale;
varying vec3 vBox;
void main() {
  vBox = position;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
  gl_Position *= uClipScale;
}`;

/**
 * The same starlight integral as the glow cube (shaders/galaxy.ts glowFrag), evaluated per pixel
 * from outside the galaxy, with the step following the height above the plane so the thin young
 * disc and its dust are resolved from any angle; mapped to display values like the sky does.
 */
const FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
#define PI 3.141592653589793
const float DUST_NORM = ${f(DUST_NORM)};
${GALAXY_GLSL}
uniform vec3 uCam;        // galactocentric camera position (pc)
uniform vec3 uExt;
uniform float uWeight;
uniform float uModelK;
uniform float uModelRef;
uniform float uModelExp;
uniform float uLite;
varying vec3 vBox;
void main() {
  vec3 pf = vBox * uExt;
  vec3 d = normalize(pf - uCam);
  vec3 inv = 1.0 / (sign(d) * max(abs(d), vec3(1e-6)));
  vec3 ta = (-uExt - uCam) * inv, tb = (uExt - uCam) * inv;
  vec3 tlo = min(ta, tb), thi = max(ta, tb);
  float t0 = max(max(tlo.x, tlo.y), max(tlo.z, 0.0));
  float t1 = min(min(thi.x, thi.y), thi.z);
  // the disc's outer edge: a cylinder of 22 kpc
  float A = dot(d.xy, d.xy), B = 2.0 * dot(uCam.xy, d.xy), C = dot(uCam.xy, uCam.xy) - uExt.x * uExt.x;
  float disc = B * B - 4.0 * A * C;
  if (A > 1e-12 && disc > 0.0) { float q = sqrt(disc); t0 = max(t0, (-B - q) / (2.0 * A)); t1 = min(t1, (-B + q) / (2.0 * A)); }
  if (t1 <= t0) discard;
  int N = uLite > 0.5 ? 60 : 160;
  float dsMax = uLite > 0.5 ? 900.0 : 400.0;
  float adz = max(abs(d.z), 0.02);
  float jit = gHash(vec3(gl_FragCoord.xy, 3.7));
  vec3 L = vec3(0.0);
  vec3 T = vec3(1.0);
  float t = t0;
  float first = 1.0;
  vec4 pop; float dust; float arms;
  for (int i = 0; i < 160; i++) {
    if (i >= N || t >= t1 || T.g < 1e-3) break;
    vec3 p0 = uCam + d * t;
    float ds = clamp(max(abs(p0.z) * 0.5, 25.0) / adz, 25.0, dsMax);
    ds = min(ds, t1 - t);
    vec3 p = uCam + d * (t + ds * (first > 0.5 ? jit : 0.5));
    first = 0.0;
    populations(p, pop, dust, arms);
    float cl = gNoise(p / 140.0) * 0.65 + gNoise(p / 47.0) * 0.35;
    dust *= 0.15 + 3.0 * cl * cl;
    float big = gNoise(p / vec3(700.0, 700.0, 300.0) + 5.0);
    pop.y *= 0.3 + 1.4 * big;
    dust *= 0.4 + 1.2 * big;
    float knots = pow(gNoise(p / 70.0 + 17.0), 6.0) * 9.0;
    vec3 j = ${f(LUM.thin)} * pop.x * (0.8 + 0.35 * arms) * C_OLD + ${f(LUM.young)} * pop.y * C_YOUNG * (0.6 + 0.8 * cl)
           + ${f(LUM.thick)} * pop.z * C_OLD + ${f(LUM.bulge)} * pop.w * C_BULGE
           + 0.012 * pop.y * knots * C_HII;
    vec3 dt = 0.921 * AV_PC * dust * EXT * ds;
    L += T * j * ds * exp(-0.5 * dt);
    T *= exp(-dt);
    t += ds;
  }
  // display mapping as for the sky (SkyLayer: the glow cube)
  float Y = max(dot(L, vec3(0.2126, 0.7152, 0.0722)), 1e-9);
  float x = Y / uModelRef;
  float fx = x < 1.0 ? pow(x, uModelExp) : 1.0 + uModelExp * log(x);
  gl_FragColor = vec4(uModelK * fx * (L / Y) * uWeight, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/**
 * The Milky Way seen from outside, per pixel: the glow cube (render/GalaxyLayer.ts) is a 512-px
 * map around the eye, sharp enough inside the galaxy but soft when the whole spiral spans the
 * view. From a few kiloparsecs outside the disc this volume takes over (the sky's copy fades out).
 */
export class MilkyWayVolume {
  readonly mesh: Mesh;
  private centre: UPos;
  private mat: ShaderMaterial;

  constructor() {
    this.mat = new ShaderMaterial({
      name: 'milky-way-volume', vertexShader: VERT, fragmentShader: FRAG, side: BackSide,
      uniforms: {
        uCam: { value: new Vector3() }, uExt: { value: EXT.clone() }, uWeight: { value: 0 },
        uModelK: { value: 0 }, uModelRef: { value: 81.3 }, uModelExp: { value: 0.6 }, uLite: LITE.uLite,
        uClipScale: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    this.mesh = new Mesh(new BoxGeometry(2, 2, 2), this.mat);
    this.mesh.name = 'milky way volume';
    this.mesh.matrixAutoUpdate = false;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -999;
    this.mesh.visible = false;
    const c = GALAXY.centre;
    this.centre = UPos.from(c.x * PC, c.y * PC, c.z * PC);
  }

  /** Weight (0..1) the volume takes over from the sky's glow, for galactocentric camera `camGal` (pc). */
  static weight(camGal: Vector3): number {
    const outside = Math.max(0, Math.abs(camGal.z) - EXT.z, Math.hypot(camGal.x, camGal.y) - EXT.x);
    const t = Math.min(1, Math.max(0, (outside - 1500) / 4500));
    return t * t * (3 - 2 * t);
  }

  /** `k`, `ref`, `exp`: the sky's current model mapping (SkyLayer). */
  update(cam: UPos, camGal: Vector3, k: number, ref: number, exp: number): void {
    const w = MilkyWayVolume.weight(camGal);
    this.mesh.visible = w > 0.001 && k > 0;
    if (!this.mesh.visible) return;
    const rel = this.centre.sub(cam, new Vector3());
    const a = GALAXY.axes.elements;   // columns: galactocentric x, y, z in ICRF
    const m = new Matrix4().makeBasis(
      new Vector3(a[0], a[1], a[2]).multiplyScalar(EXT.x * PC),
      new Vector3(a[3], a[4], a[5]).multiplyScalar(EXT.y * PC),
      new Vector3(a[6], a[7], a[8]).multiplyScalar(EXT.z * PC),
    ).setPosition(rel);
    this.mesh.matrix.copy(m);
    this.mesh.matrixWorldNeedsUpdate = true;
    const u = this.mat.uniforms;
    (u.uCam.value as Vector3).copy(camGal);
    u.uWeight.value = w;
    u.uModelK.value = k;
    u.uModelRef.value = ref;
    u.uModelExp.value = exp;
    u.uClipScale.value = 1 / Math.max(rel.length(), EXT.x * PC);
  }
}
