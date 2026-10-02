import { BackSide, LinearFilter, LinearMipmapLinearFilter, Mesh, RepeatWrapping, ShaderMaterial, SphereGeometry, SRGBColorSpace, TextureLoader } from 'three';
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
varying vec3 vDir;
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
  gl_FragColor = vec4(c * uGain, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

export class SkyLayer {
  readonly mesh: Mesh;
  readonly gain = { value: 0 };
  /** user brightness multiplier (settings) */
  brightness = 1;
  /** at full dark adaptation, the display-linear value of a map pixel of value 1 */
  static readonly GAIN = 0.45;

  constructor(url: string) {
    const tex = new TextureLoader().load(url);
    tex.colorSpace = SRGBColorSpace;
    tex.wrapS = RepeatWrapping;
    tex.minFilter = LinearMipmapLinearFilter;
    tex.magFilter = LinearFilter;
    tex.anisotropy = 4;
    const mat = new ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uMap: { value: tex }, uGain: this.gain, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
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
    const fade = 1 - smoothstep(300, 1500, sunDistPc);
    this.gain.value = SkyLayer.GAIN * this.brightness * Math.pow(Math.max(adapt, 0), 0.55) * fade;
    this.mesh.visible = this.gain.value > 1e-5;
  }
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
