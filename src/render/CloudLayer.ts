import { CustomBlending, DoubleSide, Matrix3, Matrix4, Mesh, OneFactor, OneMinusSrcAlphaFactor, ShaderMaterial, SphereGeometry, type Texture, Vector3 } from 'three';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

const CLOUD_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

const CLOUD_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uClouds;
uniform float uCloudShift;
uniform mat3 uToBody;        // world direction -> body-fixed
uniform vec3 uCenter;        // planet centre relative to the camera (m)
uniform float uRadius;       // radius of the cloud layer (m)
uniform vec3 uSunDir;        // world
uniform vec3 uSunColor;
uniform float uSunIrr;
uniform float uExposure;
uniform float uOpacity;
uniform float uLite;
uniform float uUnder;        // 1 when the explorer is below the layer
varying vec3 vWorld;
float ch(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float cn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ch(i), ch(i + vec3(1,0,0)), f.x), mix(ch(i + vec3(0,1,0)), ch(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(ch(i + vec3(0,0,1)), ch(i + vec3(1,0,1)), f.x), mix(ch(i + vec3(0,1,1)), ch(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 n = normalize(vWorld - uCenter);
  vec3 nB = uToBody * n;
  float lon = atan(nB.y, nB.x), lat = asin(clamp(nB.z, -1.0, 1.0));
  vec2 uv = vec2(lon / 6.2831853 + 0.5 + uCloudShift, 0.5 + lat / 3.14159265);
  float c = texture2D(uClouds, uv).r;
  // the map is ~5 km per texel: generated billows break up its blur (kilometre scales)
  vec3 q = nB * (uRadius / 6000.0);
  float d = 0.5 * cn(q) + 0.3 * cn(q * 2.7 + 5.1) + (uLite > 0.5 ? 0.1 : 0.2 * cn(q * 7.3 + 9.7));
  float cov = smoothstep(0.42, 0.85, c + (d - 0.5) * 0.45);
  float dist = length(vWorld);
  cov *= uOpacity * smoothstep(450e3, 120e3, dist);
  if (cov < 0.004) discard;
  // sunlit tops, greyer from below; dark on the night side
  float mu = dot(n, uSunDir);
  float day = smoothstep(-0.12, 0.08, mu);
  float under = mix(1.0, 0.55, uUnder);
  vec3 L = uSunColor * (uSunIrr / 3.14159265) * 0.8 * (0.35 + 0.65 * max(mu, 0.0)) * day * under * (0.85 + 0.3 * d);
  gl_FragColor = vec4(min(L * uExposure * cov, vec3(6.0e4)), cov);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/**
 * Earth's clouds as a layer at cloud height, for flying near the ground: the same cloud map that is
 * painted on the surface from orbit (which fades out on descent), with generated billows below its
 * resolution. Mountains above the layer show through; below it, the clouds are a ceiling.
 */
export class CloudLayer {
  readonly mesh: Mesh;
  private mat: ShaderMaterial;
  /** height of the layer above the reference radius (m) */
  static readonly HEIGHT = 7000;

  constructor(clouds: Texture, exposure: { value: number }) {
    this.mat = new ShaderMaterial({
      name: 'cloud-layer',
      vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG,
      uniforms: {
        uClouds: { value: clouds }, uCloudShift: { value: 0 }, uToBody: { value: new Matrix3() }, uCenter: { value: new Vector3() },
        uRadius: { value: 1 }, uSunDir: { value: new Vector3(1, 0, 0) }, uSunColor: { value: new Vector3(1, 1, 1) }, uSunIrr: { value: Math.PI },
        uExposure: exposure, uOpacity: { value: 0 }, uLite: LITE.uLite, uUnder: { value: 0 },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      transparent: true, depthWrite: false, side: DoubleSide,
      blending: CustomBlending, blendSrc: OneFactor, blendDst: OneMinusSrcAlphaFactor,
    });
    // three's sphere has its poles on y; the body frame has them on z
    this.mesh = new Mesh(new SphereGeometry(1, 384, 192).rotateX(Math.PI / 2), this.mat);
    this.mesh.matrixAutoUpdate = false;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.mesh.renderOrder = 19.97; // after the terrain and its haze (TerrainPatch)
    this.mesh.name = 'cloud layer';
  }

  /**
   * Per frame. `rel`: planet centre relative to the camera; `orient`: body-fixed -> world; `radius`:
   * equatorial radius; `opacity`: 0 hides the layer (from orbit the painted clouds are used).
   */
  update(rel: Vector3, orient: Matrix4, radius: number, polar: number, sunDir: Vector3, sunIrr: number, sunColor: Vector3, opacity: number, shift: number): void {
    this.mesh.visible = opacity > 0.002;
    if (!this.mesh.visible) return;
    const r = radius + CloudLayer.HEIGHT;
    const u = this.mat.uniforms;
    (u.uToBody.value as Matrix3).setFromMatrix4(orient).transpose();
    (u.uCenter.value as Vector3).copy(rel);
    u.uRadius.value = r;
    (u.uSunDir.value as Vector3).copy(sunDir);
    (u.uSunColor.value as Vector3).copy(sunColor);
    u.uSunIrr.value = sunIrr;
    u.uOpacity.value = opacity;
    u.uCloudShift.value = shift;
    // explorer below the layer? (altitude above the ellipsoid along its own direction)
    const camBF = rel.clone().negate().applyMatrix3(u.uToBody.value as Matrix3);
    const k = camBF.clone().normalize();
    const ell = 1 / Math.sqrt((k.x / radius) ** 2 + (k.y / radius) ** 2 + (k.z / polar) ** 2);
    u.uUnder.value = camBF.length() - ell < CloudLayer.HEIGHT ? 1 : 0;
    // the sphere's z is the body's pole: follow the planet's flattening
    this.mesh.matrix.copy(orient).scale(new Vector3(r, r, polar + CloudLayer.HEIGHT)).setPosition(rel);
    this.mesh.matrixWorldNeedsUpdate = true;
  }
}
