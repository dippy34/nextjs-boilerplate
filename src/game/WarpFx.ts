import { AdditiveBlending, BufferAttribute, BufferGeometry, LineSegments, ShaderMaterial } from 'three';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from '../render/shaders/xr';

const VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute vec4 aStreak;   // x, y offset (m), phase 0..1, end (0 tail, 1 head)
uniform float uTime;
uniform float uLevel;
varying float vA;
void main() {
  float len = 6.0 + 60.0 * uLevel;
  float z = -mod(aStreak.z * 260.0 - uTime * (80.0 + 900.0 * uLevel), 260.0);
  z += aStreak.w * len;
  vec3 p = vec3(aStreak.xy, z);
  vA = (1.0 - aStreak.w * 0.85) * smoothstep(-260.0, -150.0, z) * smoothstep(5.0, -10.0, z);
  gl_Position = projectView(modelViewMatrix * vec4(p, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;
const FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uLevel;
varying float vA;
void main() {
  gl_FragColor = vec4(vec3(0.65, 0.8, 1.0) * vA * uLevel * 1.4, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/** Streaks of light rushing past the ship while the warp drive is engaged (rig-local, around the eye). */
export class WarpFx {
  readonly lines: LineSegments;
  private mat: ShaderMaterial;
  level = 0;

  constructor(n = 420) {
    const a = new Float32Array(n * 2 * 4);
    for (let i = 0; i < n; i++) {
      // a hollow cylinder of streaks around the line of flight (nothing right in front of the eyes)
      const ang = Math.random() * Math.PI * 2, r = 4 + Math.pow(Math.random(), 0.6) * 40, ph = Math.random();
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      a.set([x, y, ph, 0, x, y, ph, 1], i * 8);
    }
    const g = new BufferGeometry();
    g.setAttribute('aStreak', new BufferAttribute(a, 4));
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 2 * 3), 3));
    this.mat = new ShaderMaterial({
      name: 'warp', vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uTime: { value: 0 }, uLevel: { value: 0 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
      transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending,
    });
    this.lines = new LineSegments(g, this.mat);
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 15;
    this.lines.visible = false;
  }

  update(time: number, target: number, dt: number): void {
    this.level += (target - this.level) * (1 - Math.exp(-dt * (target > this.level ? 2 : 4)));
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uLevel.value = this.level;
    this.lines.visible = this.level > 0.01;
  }
}
