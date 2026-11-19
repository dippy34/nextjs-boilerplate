import {
  AdditiveBlending, BoxGeometry, BufferGeometry, ConeGeometry, CylinderGeometry, DoubleSide, Group, Mesh, PlaneGeometry, ShaderMaterial,
  SphereGeometry, Vector3,
} from 'three';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from '../render/shaders/xr';

/**
 * Display-referred lighting for things right next to the viewer (cockpit, own ship, nearby traffic):
 * they are lit by the local star, but shown at a pleasant brightness whatever the eye's adaptation
 * to the sky, as a camera would expose a close-up.
 */
export const LIT_VERT = /* glsl */ `
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
export const LIT_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uSpec;
uniform float uEmit;        // self-lit fraction (screens, lamps)
uniform vec3 uSunDir;       // world direction to the local star
uniform float uSun;         // 0..1 strength of direct starlight (0 in deep space)
uniform vec3 uSunColor;
uniform float uFill;        // interior fill light
varying vec3 vN;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(-vPos);
  if (dot(n, V) < 0.0) n = -n;
  float mu0 = max(dot(n, uSunDir), 0.0);
  vec3 H = normalize(uSunDir + V);
  float spec = uSpec * pow(max(dot(n, H), 0.0), mix(10.0, 80.0, uSpec)) * 1.6;
  vec3 c = uColor * (uFill * (0.6 + 0.4 * max(dot(n, V), 0.0)) + uSun * mu0 * uSunColor * 1.4) + spec * uSun * uSunColor;
  c = mix(c, uColor * 1.6, uEmit);
  gl_FragColor = vec4(c, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

export const LIGHT = {
  uSunDir: { value: new Vector3(1, 0.4, 0.2).normalize() },
  uSun: { value: 1 },
  uSunColor: { value: new Vector3(1, 0.97, 0.92) },
};

const mats = new Map<string, ShaderMaterial>();
/** Shared lit material (one per colour/finish). */
export function litMaterial(color: [number, number, number], spec = 0.3, emit = 0, fill = 0.08): ShaderMaterial {
  const key = `${color.join(',')}|${spec}|${emit}|${fill}`;
  let m = mats.get(key);
  if (!m) {
    m = new ShaderMaterial({
      name: 'lit', vertexShader: LIT_VERT, fragmentShader: LIT_FRAG, side: DoubleSide,
      uniforms: { uColor: { value: new Vector3(...color) }, uSpec: { value: spec }, uEmit: { value: emit }, uFill: { value: fill },
        ...LIGHT, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
    });
    mats.set(key, m);
  }
  return m;
}

const GLOW_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uLevel;
varying vec2 vUv2;
void main() {
  vec2 p = vUv2 * 2.0 - 1.0;
  float r = length(p);
  float g = exp(-r * r * 5.0) * uLevel + exp(-r * r * 40.0) * uLevel * 2.0;
  gl_FragColor = vec4(uColor * g, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;
const GLOW_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec2 vUv2;
void main() {
  vUv2 = uv;
  // billboard: the quad faces the camera
  vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float s = length(vec3(modelMatrix[0]));
  c.xy += position.xy * s;
  gl_Position = projectView(c);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

export interface ShipLook { hull: [number, number, number]; trim: [number, number, number]; engine: [number, number, number]; scale: number }
export const PLAYER_LOOK: ShipLook = { hull: [0.78, 0.8, 0.84], trim: [0.85, 0.32, 0.12], engine: [0.45, 0.75, 1.0], scale: 1 };

/**
 * A small explorer ship (~14 m long, nose towards -z): fuselage, canopy, swept wings, twin engines
 * whose exhaust glows with the throttle.
 */
export class ShipModel {
  readonly group = new Group();
  private glows: ShaderMaterial[] = [];

  constructor(look: ShipLook = PLAYER_LOOK) {
    const hull = litMaterial(look.hull, 0.45);
    const trim = litMaterial(look.trim, 0.3);
    const dark = litMaterial([0.12, 0.13, 0.15], 0.6);
    const glass = litMaterial([0.15, 0.3, 0.45], 0.9);
    const add = (g: BufferGeometry, m: ShaderMaterial, p: [number, number, number], r: [number, number, number] = [0, 0, 0], s: [number, number, number] = [1, 1, 1]) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(...p);
      mesh.rotation.set(...r);
      mesh.scale.set(...s);
      mesh.frustumCulled = false;
      this.group.add(mesh);
      return mesh;
    };
    // fuselage: a stretched capsule tapering to the nose
    add(new CylinderGeometry(1.1, 1.4, 8, 12), hull, [0, 0, 0.5], [Math.PI / 2, 0, 0]);
    add(new ConeGeometry(1.1, 4.5, 12), hull, [0, 0, -5.75], [-Math.PI / 2, 0, 0]);
    add(new SphereGeometry(0.85, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass, [0, 0.75, -3.0], [0, 0, 0], [1, 0.7, 1.9]);
    add(new BoxGeometry(2.6, 0.5, 6), dark, [0, -0.9, 0.8]);
    // swept wings
    for (const sgn of [-1, 1]) {
      const wing = add(new BoxGeometry(5.5, 0.18, 3.2), hull, [sgn * 3.6, -0.2, 1.8], [0, sgn * 0.45, sgn * -0.08]);
      void wing;
      add(new BoxGeometry(0.25, 0.22, 2.2), trim, [sgn * 6.1, -0.35, 2.9], [0, sgn * 0.45, 0]);
      add(new BoxGeometry(0.15, 1.6, 1.4), hull, [sgn * 6.3, 0.45, 3.2], [0, 0, sgn * 0.25]);
      // engine nacelle and nozzle
      add(new CylinderGeometry(0.75, 0.85, 5.5, 14), hull, [sgn * 1.9, 0, 3.5], [Math.PI / 2, 0, 0]);
      add(new CylinderGeometry(0.9, 0.7, 0.8, 14), dark, [sgn * 1.9, 0, 6.6], [Math.PI / 2, 0, 0]);
      add(new BoxGeometry(0.3, 0.25, 4.5), trim, [sgn * 1.9, 0.78, 3.2]);
      const glow = new ShaderMaterial({
        name: 'engine-glow', vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG,
        uniforms: { uColor: { value: new Vector3(...look.engine) }, uLevel: { value: 0.2 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
        transparent: true, depthWrite: false, blending: AdditiveBlending,
      });
      this.glows.push(glow);
      add(new PlaneGeometry(2, 2), glow, [sgn * 1.9, 0, 7.15], [0, 0, 0], [0.9, 0.9, 0.9]).renderOrder = 12;
    }
    this.group.scale.setScalar(look.scale);
    this.group.name = 'ship';
  }

  /** Engine glow 0..1 (idle ~0.15). */
  setThrust(t: number): void {
    for (const g of this.glows) g.uniforms.uLevel.value = 0.12 + 0.9 * Math.max(0, Math.min(1, t));
  }
}
