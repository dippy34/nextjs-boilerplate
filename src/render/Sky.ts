import { BackSide, type CubeTexture, LinearFilter, LinearMipmapLinearFilter, Mesh, RepeatWrapping, ShaderMaterial, SphereGeometry, SRGBColorSpace, TextureLoader, type Vector3 } from 'three';
import { MilkyWayVolume } from './MilkyWayVolume';
import { noise3D } from './Noise3D';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

/**
 * The unresolved Milky Way behind the catalogue stars: NASA SVS "Deep Star Maps
 * 2020" milkyway layer (Gaia DR2 stars fainter than the Hipparcos/Tycho stars the
 * engine draws itself), in ICRF equatorial coordinates = the engine's world frame.
 *
 * The map is display-referred (see pipeline/build_milkyway.py), so its brightness
 * is an artistic gain that follows the star exposure; the map supplies structure
 * and colour. It is an Earth-centred view and fades out beyond ~1 kpc from the Sun.
 */
const VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vDir;
void main() {
  vDir = position;
  // far away (no stereo parallax); drawn first without depth test
  gl_Position = projectView(viewMatrix * vec4(position * 1.0e7, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

const FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uMap;
uniform float uGain;
uniform samplerCube uGalaxy;
uniform float uMix;       // 0: the NASA map only, 1: the galaxy model only
uniform float uModelK;    // display value of a model column of uModelRef
uniform float uModelRef;
uniform float uModelExp;
uniform sampler3D uNoise;
uniform float uDetail;    // strength of the synthesised fine structure
varying vec3 vDir;
float ridge(float n) { return 1.0 - abs(2.0 * n - 1.0); }
void main() {
  vec3 d = normalize(vDir);
  float ra = atan(d.y, d.x);
  float dec = asin(clamp(d.z, -1.0, 1.0));
  // RA 0h at the map centre, RA increasing to the left; north at the top
  float u = 0.5 - ra / (2.0 * PI);
  float v = 0.5 + dec / PI;
  // Seam-safe derivatives (Tarini): use whichever of u, u+0.5 is continuous here
  float u2 = fract(u + 0.5) - 0.5;
  vec2 g1x = vec2(dFdx(u), dFdx(v)), g1y = vec2(dFdy(u), dFdy(v));
  vec2 g2x = vec2(dFdx(u2), dFdx(v)), g2y = vec2(dFdy(u2), dFdy(v));
  bool alt = abs(g2x.x) + abs(g2y.x) < abs(g1x.x) + abs(g1y.x);
  vec3 c = textureGrad(uMap, vec2(fract(u), v), alt ? g2x : g1x, alt ? g2y : g1y).rgb;
  if (uDetail > 0.0) {
    // Fine structure below the map's resolution (a map pixel is ~5', several headset pixels): star
    // clouds and thin dust filaments, synthesised at the eye's resolution and laid only on the band
    // (strongest where it is bright), so the Milky Way is not a smooth smear up close. Each octave
    // fades out as it shrinks below a pixel (no shimmer).
    float Ym = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float band = smoothstep(0.015, 0.12, Ym) * uDetail;
    float fw = max(length(fwidth(d)), 1e-6);
    float l1 = log2(fw * 24.0 * 64.0), l2 = l1 + 1.44;
    float w1 = 1.0 - smoothstep(1.5, 3.0, l1), w2 = 1.0 - smoothstep(1.5, 3.0, l2);
    if (band * w1 > 0.0) {
      vec4 a = textureLod(uNoise, d * 24.0, max(l1, 0.0));
      vec4 b = w2 > 0.0 ? textureLod(uNoise, d * 65.0 + 0.37, max(l2, 0.0)) : vec4(0.5);
      // mottled star clouds, brighter knots and darker gaps
      float clouds = (a.r - 0.5) * 0.7 * w1 + (b.g - 0.5) * 0.5 * w2;
      // dark filaments (ridges of the noise), stronger where the map already shows dust (reddish, dim)
      float dustF = smoothstep(0.82, 0.97, ridge(a.b)) * w1 * 0.5 + smoothstep(0.86, 0.98, ridge(b.a)) * w2 * 0.35;
      float dusty = 0.6 + 0.8 * smoothstep(0.0, 0.25, c.r / max(c.b, 1e-4) - 1.1);
      c *= max(1.0 + band * (clouds - dustF * dusty + 0.06), 0.15);
    }
  }
  c *= uGain;
  if (uMix > 0.0) {
    // galaxy model: V-band column luminosity, mapped like the map (its pixels go as flux^1.65)
    vec3 L = textureCube(uGalaxy, d).rgb;
    float Y = max(dot(L, vec3(0.2126, 0.7152, 0.0722)), 1e-9);
    // above the calibration point grow only logarithmically (C1 at x = 1), so the much brighter
    // sky of the inner galaxy is bright without washing everything out
    float x = Y / uModelRef;
    float fx = x < 1.0 ? pow(x, uModelExp) : 1.0 + uModelExp * log(x);
    c = mix(c, uModelK * fx * (L / Y), uMix);
  }
  gl_FragColor = vec4(c, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

export class SkyLayer {
  readonly mesh: Mesh;
  readonly gain = { value: 0 };
  /** user brightness multiplier (settings) */
  brightness = 1;
  /** current display mapping of the galaxy model (for MilkyWayVolume) */
  modelK = 0;
  modelExp = 1.65;
  /** at full dark adaptation, the display-linear value of a map pixel of value 1 */
  static readonly GAIN = 0.45;
  /**
   * Calibration of the galaxy model against the map (tests/galaxy.test.ts): seen from the Sun, the
   * model's mean column at galactic latitudes 2-5 degrees (L☉/pc², starlight beyond 300 pc) and
   * the map's mean linear pixel value there.
   */
  static readonly MODEL_REF = 81.3;
  static readonly MAP_AT_REF = 0.125;

  constructor(url: string) {
    const tex = new TextureLoader().load(url);
    tex.colorSpace = SRGBColorSpace;
    tex.wrapS = RepeatWrapping;
    tex.minFilter = LinearMipmapLinearFilter;
    tex.magFilter = LinearFilter;
    tex.anisotropy = 4;
    const mat = new ShaderMaterial({
      name: 'sky', vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        uMap: { value: tex }, uGain: this.gain, uGalaxy: { value: null }, uMix: { value: 0 }, uModelK: { value: 0 },
        uModelRef: { value: SkyLayer.MODEL_REF }, uModelExp: { value: 1.65 }, uNoise: { value: noise3D().tex }, uDetail: { value: 1 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      side: BackSide, depthTest: false, depthWrite: false,
    });
    this.mesh = new Mesh(new SphereGeometry(1, 64, 32), mat);
    this.mesh.name = 'milky-way';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
  }

  /**
   * `adapt` = star exposure / dark-adapted exposure (0..1); `sunDistPc` fades the
   * Earth-centred map out as the observer leaves the solar neighbourhood.
   */
  update(adapt: number, sunDistPc: number): void {
    this.updateWith(adapt, sunDistPc, null, null);
  }

  /**
   * As update(), blending to the galaxy model (`galaxy` cube rendered from galactocentric `camGal`)
   * as the explorer leaves the Sun's neighbourhood, where the Earth-centred map stops being valid.
   */
  updateWith(adapt: number, sunDistPc: number, galaxy: CubeTexture | null, camGal: Vector3 | null): void {
    const base = SkyLayer.GAIN * this.brightness * Math.pow(Math.max(adapt, 0), 0.55);
    const u = (this.mesh.material as ShaderMaterial).uniforms;
    const mix = galaxy && camGal ? smoothstep(120, 700, sunDistPc) : 0;
    this.gain.value = base * (galaxy ? 1 : 1 - smoothstep(300, 1500, sunDistPc));
    u.uMix.value = mix;
    u.uGalaxy.value = galaxy;
    if (camGal) {
      // from outside the galaxy a gentler curve (and more gain) keeps the spiral arms visible
      const outside = Math.max(0, Math.abs(camGal.z) - 4000, Math.hypot(camGal.x, camGal.y) - 22000);
      const o = smoothstep(500, 6000, outside);
      u.uModelExp.value = 1.65 + (0.6 - 1.65) * o;
      u.uModelK.value = base * SkyLayer.MAP_AT_REF * (1 + 5 * o);
      this.modelK = u.uModelK.value as number;
      this.modelExp = u.uModelExp.value as number;
      // further out the galaxy is drawn per pixel (render/MilkyWayVolume.ts): the cube gives way
      u.uModelK.value = this.modelK * (1 - MilkyWayVolume.weight(camGal));
    }
    this.mesh.visible = base > 1e-5;
  }
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
