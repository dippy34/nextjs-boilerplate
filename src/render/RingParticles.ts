import { BackSide, BoxGeometry, BufferAttribute, ClampToEdgeWrapping, CustomBlending, DataTexture, IcosahedronGeometry, InstancedMesh, LinearFilter, Matrix3, Matrix4, Mesh, OneFactor, OneMinusSrcAlphaFactor, Quaternion, RGBAFormat, ShaderMaterial, type Texture, Vector2, Vector3 } from 'three';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

/** Vertical structure of the ring layer: Gaussian density with this standard deviation (m). */
const SIGMA = 4.5;

/**
 * GLSL shared by the slab and the particles: the ring layer's optical depth along a ray (Gaussian
 * vertical profile).
 */
const LAYER_GLSL = /* glsl */ `
const float SIG = ${SIGMA.toFixed(1)};
// normal cumulative distribution (erf approximation, |error| < 1e-3)
float ncdf(float x) {
  float y = x * 0.70710678;
  float e = sqrt(1.0 - exp(-y * y * (1.2732395 + 0.147 * y * y) / (1.0 + 0.147 * y * y)));
  return 0.5 + 0.5 * sign(y) * e;
}
// optical depth of a layer of normal optical depth tau between heights z0 and z1 (m) along a path
// of length len
float layerDepth(float tau, float z0, float z1, float len) {
  float dz = z1 - z0;
  if (abs(dz) < 1e-3 * len + 1e-4) return tau * len * exp(-0.5 * z0 * z0 / (SIG * SIG)) / (2.5066283 * SIG);
  return tau * len / abs(dz) * abs(ncdf(z1 / SIG) - ncdf(z0 / SIG));
}
`;

const VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
uniform float uRange;        // particles shrink away towards this distance (m)
varying vec3 vN;
varying vec3 vPos;
varying vec3 vObj;           // position on the particle, its own frame (unit size)
varying vec3 vT;             // object frame axes in world, for bending the normal
varying vec3 vB;
varying float vTone;
varying float vSize;
void main() {
  vec4 centre = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float fade = 1.0 - smoothstep(uRange * 0.7, uRange, length(centre.xyz));
  mat3 m3 = mat3(modelMatrix) * mat3(instanceMatrix);
  vN = normalize(m3 * normal);
  vec4 wp = modelMatrix * instanceMatrix * vec4(position * fade, 1.0);
  vPos = wp.xyz;
  // per-particle tone from its (deterministic) size and rotation
  vTone = fract(instanceMatrix[3].x * 0.37 + instanceMatrix[3].y * 0.61);
  vObj = position + vec3(vTone * 37.0, vTone * 11.0, vTone * 23.0);
  vSize = length(instanceMatrix[0].xyz);
  vT = normalize(m3[0]);
  vB = normalize(m3[1]);
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

/**
 * Ring particles are loose aggregates of water ice coated in fine frost and a little dark dust
 * (Cassini: porous, "regolith-covered" chunks). Lighting: a bumpy, clumpy surface (3D noise on the
 * particle bending the normal), dirtier patches and clean bright frost, a sparkle of ice grains
 * facing the Sun, the planet's shadow, Saturnshine, and the glow of the sunlit ring around them.
 */
const FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;         // ring colour (linear)
uniform vec3 uSunDir;        // world
uniform float uSunIrr;
uniform float uExposure;
uniform vec3 uPlanet;        // planet centre relative to the camera (m)
uniform float uPlanetR;
uniform vec3 uPlanetDir;     // unit direction particle -> planet (for planetshine)
uniform float uShine;        // planetshine relative to sunlight
uniform float uRingShine;    // light from the surrounding sunlit ring particles, relative to sunlight
uniform vec3 uRingN;         // ring plane normal (world)
uniform float uCamZ;         // camera height above the ring mid-plane (m)
uniform float uTau;          // normal optical depth here
uniform vec3 uHaze;          // radiance of the layer per unit optical depth (display units)
varying vec3 vN;
varying vec3 vPos;
varying vec3 vObj;
varying vec3 vT;
varying vec3 vB;
varying float vTone;
varying float vSize;
float rh(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float rn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(rh(i), rh(i + vec3(1,0,0)), f.x), mix(rh(i + vec3(0,1,0)), rh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(rh(i + vec3(0,0,1)), rh(i + vec3(1,0,1)), f.x), mix(rh(i + vec3(0,1,1)), rh(i + vec3(1,1,1)), f.x), f.y), f.z);
}
${LAYER_GLSL}
float lumps(vec3 p) { return 0.55 * rn(p * 3.0) + 0.3 * rn(p * 7.0 + 3.1) + 0.15 * rn(p * 17.0 + 7.7); }
void main() {
  vec3 n = normalize(vN);
  // clumpy surface: the gradient of the lump field bends the normal (finite differences, object frame)
  float e = 0.03;
  float h0 = lumps(vObj);
  vec3 g = vec3(lumps(vObj + vec3(e, 0.0, 0.0)), lumps(vObj + vec3(0.0, e, 0.0)), lumps(vObj + vec3(0.0, 0.0, e))) - h0;
  vec3 W = normalize(cross(vT, vB));
  vec3 gw = (g.x * vT + g.y * vB + g.z * W) / e;
  float detailVis = smoothstep(6.0, 30.0, vSize / max(length(fwidth(vPos)), 1e-6));   // pixels per particle radius
  n = normalize(n - 0.35 * detailVis * (gw - n * dot(gw, n)));
  // the planet's shadow: does the ray towards the Sun hit it?
  vec3 oc = vPos - uPlanet;
  float b = dot(oc, uSunDir);
  float c = dot(oc, oc) - uPlanetR * uPlanetR;
  float disc = b * b - c;
  float lit = (disc > 0.0 && -b - sqrt(disc) > 0.0) ? 0.0 : 1.0;
  // frost and dust: clean bright frost on the lumps, dirtier ice in the hollows and patches
  float dirt = smoothstep(0.35, 0.75, rn(vObj * 2.3 + 19.0)) * 0.5 + (1.0 - smoothstep(0.35, 0.6, h0)) * 0.35;
  vec3 alb = uColor * (0.8 + 0.4 * vTone) * mix(vec3(1.12), vec3(0.62, 0.55, 0.5), dirt);
  // light: a rough, forward-and-back scattering frost (Lommel-Seeliger-like, flatter than Lambert)
  vec3 V = normalize(-vPos);
  float mu0 = max(dot(n, uSunDir), 0.0), mu = max(dot(n, V), 0.0);
  float ls = mu0 > 0.0 ? 2.0 * mu0 / (mu0 + mu + 0.05) : 0.0;
  float diffuse = mix(mu0, ls * 0.5, 0.45);
  // ice grains catching the Sun
  vec3 H = normalize(uSunDir + V);
  float spark = step(0.985, rh(floor(vObj * 60.0))) * pow(max(dot(n, H), 0.0), 40.0) * 6.0 * (1.0 - dirt);
  float shine = uShine * max(dot(n, uPlanetDir), 0.0);
  // the sunlit ring all around: light from the ring plane (both faces), softer in the shadow
  float ring = uRingShine * (0.5 + 0.5 * abs(dot(n, uRingN))) * (0.35 + 0.65 * lit);
  vec3 rad = alb * ((diffuse + spark) * lit + shine + ring + 0.004) * (uSunIrr / 3.14159265);
  // seen through the rest of the layer between the eye and the particle
  float len = length(vPos);
  float zp = uCamZ + dot(vPos, uRingN);
  float T = exp(-layerDepth(uTau, uCamZ, zp, len) * 0.6);
  vec3 col = rad * uExposure * T + uHaze * (1.0 - T);
  gl_FragColor = vec4(min(col, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

const SLAB_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vPos;           // camera-relative world position on the box
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

/**
 * The ring layer itself around the explorer: particles too small or too far to draw one by one,
 * as a medium. Along each ray the light is integrated through the layer (Gaussian in height, its
 * optical depth from the measured profile at each point's radius), each bit lit by sunlight dimmed
 * by the layer between it and the Sun, scattered by backscattering particles. The layer is clumped
 * into self-gravity wakes: elongated aggregates some tens of metres across, trailing at ~25 degrees
 * to the orbit (Cassini occultations), with metre-scale graininess. From inside it is a glowing
 * fog; from above a bright floor; along the plane a wall of light.
 */
const SLAB_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uProfile;  // normal optical depth profile (texture: 1 - exp(-tau))
uniform vec2 uRadii;         // ring inner / outer radius (m)
uniform mat3 uToRing;        // world -> ring frame (z: ring normal)
uniform vec3 uCamR;          // camera in the ring frame (m), relative to the planet centre
uniform vec2 uCamMod;        // camera's ring-plane position modulo 16384 m (keeps the clumps fixed in the ring)
uniform vec3 uSunR;          // Sun direction in the ring frame
uniform vec3 uColor;
uniform float uSunIrr;
uniform float uExposure;
uniform float uPlanetR;
uniform float uLite;
varying vec3 vPos;
${LAYER_GLSL}
float sh(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float sn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(sh(i), sh(i + vec3(1,0,0)), f.x), mix(sh(i + vec3(0,1,0)), sh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(sh(i + vec3(0,0,1)), sh(i + vec3(1,0,1)), f.x), mix(sh(i + vec3(0,1,1)), sh(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float tauAt(float r) {
  if (r < uRadii.x || r > uRadii.y) return 0.0;
  float a = texture2D(uProfile, vec2((r - uRadii.x) / (uRadii.y - uRadii.x), 0.5)).r;
  return -log(max(1.0 - a, 1e-3));
}
// clumping: wakes (stretched along a direction 25 degrees from the orbit) and grain, mean ~1.
// q: position relative to the explorer plus the explorer's position modulo 16 km (precise, and
// fixed in the ring apart from a jump each 16 km travelled).
float clumps(vec3 q, vec2 radial, float dist) {
  vec2 az = vec2(-radial.y, radial.x);
  vec2 w = cos(0.44) * az + sin(0.44) * radial;           // along the wake
  vec2 c = vec2(-w.y, w.x);                               // across
  vec2 u = vec2(dot(q.xy, w) / 160.0, dot(q.xy, c) / 28.0);
  float wake = sn(vec3(u, q.z / 12.0));
  float grain = sn(q / 1.6);
  float vis = 1.0 - smoothstep(300.0, 3000.0, dist);      // far away it averages out
  return mix(1.0, 0.25 + 1.5 * wake * wake + 0.5 * (grain - 0.5) * (1.0 - smoothstep(20.0, 80.0, dist)), vis);
}
void main() {
  vec3 d = normalize(uToRing * normalize(vPos));
  float zc = uCamR.z;
  // the part of the ray within 4 sigma of the mid-plane
  float H = 4.0 * SIG;
  float t0 = 0.0, t1 = 3.0e8;
  if (abs(d.z) > 1e-6) {
    float ta = (-H - zc) / d.z, tb = (H - zc) / d.z;
    t0 = max(min(ta, tb), 0.0); t1 = min(max(ta, tb), t1);
  } else if (abs(zc) > H) discard;
  if (t1 <= t0) discard;
  vec3 S = normalize(uSunR);
  float mu0 = max(abs(S.z), 0.02);
  float ph = acos(clamp(dot(S, -d), -1.0, 1.0));
  float P = (1.5 * exp(-1.1 * ph) + 0.3) * (1.0 + 0.7 * exp(-ph / 0.02));
  vec2 radial = normalize(uCamR.xy);
  // march: steps growing geometrically from the eye (fine near, coarse far)
  int N = uLite > 0.5 ? 14 : 30;
  float ta0 = max(t0, 0.3);
  float k = pow(max(t1, ta0 * 1.001) / ta0, 1.0 / float(N));
  float tPrev = t0;
  float tauV = 0.0;
  float L = 0.0;
  float jit = sh(vec3(gl_FragCoord.xy, 7.0));
  for (int i = 1; i <= 30; i++) {
    if (i > N) break;
    float tn = (i == N) ? t1 : ta0 * pow(k, float(i));
    float tm = mix(tPrev, tn, 0.25 + 0.5 * jit);
    vec3 q = d * tm;
    vec3 p = uCamR + q;
    float tau = tauAt(length(p.xy)) * clumps(vec3(q.xy + uCamMod, p.z), radial, tm);
    float dTau = layerDepth(tau, zc + d.z * tPrev, zc + d.z * tn, tn - tPrev);
    // sunlight reaching this height: dimmed by the layer between it and the Sun
    float sunT = exp(-tau * (1.0 - ncdf(p.z * sign(S.z) / SIG)) / mu0);
    // the planet's shadow
    float b = dot(p, S);
    float lit = b < 0.0 ? smoothstep(uPlanetR * 0.99, uPlanetR * 1.01, length(p - S * b)) : 1.0;
    L += exp(-tauV) * (1.0 - exp(-dTau)) * (sunT * lit * P + 0.08);
    tauV += dTau;
    tPrev = tn;
    if (tauV > 8.0) break;
  }
  vec3 rad = uColor * L * (uSunIrr / 3.14159265);
  float alpha = 1.0 - exp(-tauV);
  gl_FragColor = vec4(min(rad * uExposure, vec3(6.0e4)), alpha);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

const CELL = 40;          // m: particles are generated per cell of the ring plane
const SLAB_HEIGHT = 3000; // m: within this height of the mid-plane the layer is drawn as a medium
const RANGE = 500;        // m: drawn out to this distance
const MAX = 6000;

function hash(ix: number, iy: number, k: number): number {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(k | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Inside Saturn's rings: the ice particles around the explorer as real 3D chunks. Their number
 * per area follows the ring's normal optical depth at that radius (the Voyager 2 PPS occultation
 * profile the ring texture is built from), sizes follow a steep power law (most under a metre, a
 * few several metres), and they sit in a layer some ten metres thick. Generated deterministically
 * per 40 m cell of the ring plane, so the same place always holds the same particles; the planet's
 * shadow falls on them. Drawn co-moving with the explorer (their orbital speed is shared).
 */
export class RingParticles {
  readonly mesh: InstancedMesh;
  /** the layer as a medium around the explorer (drawn while within a few km of the plane) */
  readonly slab: Mesh;
  private mat: ShaderMaterial;
  private slabMat: ShaderMaterial;
  private profileTex: Texture | null = null;
  private tau: Float32Array | null = null;
  private cellX = NaN;
  private cellY = NaN;
  private origin = new Vector3();     // ring-frame position (m) the instance matrices are relative to
  /** headset: half as many particles */
  private lite = false;

  constructor(texUrl: string, private inner: number, private outer: number, color: [number, number, number], exposure: { value: number }) {
    const geo = new IcosahedronGeometry(1, 1);
    // lumpy, not spherical: displace each vertex a little (deterministically)
    const p = geo.attributes.position as BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const k = 0.75 + 0.5 * hash(Math.round(p.getX(i) * 1000), Math.round(p.getY(i) * 1000), Math.round(p.getZ(i) * 1000));
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    }
    geo.computeVertexNormals();
    this.mat = new ShaderMaterial({
      name: 'ring-particles', vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        uColor: { value: new Vector3(...color) }, uSunDir: { value: new Vector3(1, 0, 0) }, uSunIrr: { value: Math.PI }, uExposure: exposure,
        uPlanet: { value: new Vector3() }, uPlanetR: { value: 1 }, uPlanetDir: { value: new Vector3() }, uShine: { value: 0 }, uRange: { value: RANGE },
        uRingShine: { value: 0 }, uRingN: { value: new Vector3(0, 0, 1) }, uCamZ: { value: 0 }, uTau: { value: 0 }, uHaze: { value: new Vector3() },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
    });
    this.mesh = new InstancedMesh(geo, this.mat, MAX);
    this.mesh.count = 0;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.mesh.renderOrder = 2;
    this.mesh.name = 'ring-particles';
    this.slabMat = new ShaderMaterial({
      name: 'ring-slab', vertexShader: SLAB_VERT, fragmentShader: SLAB_FRAG,
      uniforms: {
        uProfile: { value: null }, uRadii: { value: new Vector2(inner, outer) }, uToRing: { value: new Matrix3() },
        uCamR: { value: new Vector3() }, uCamMod: { value: new Vector2() }, uSunR: { value: new Vector3(1, 0, 0) }, uColor: { value: new Vector3(...color) },
        uSunIrr: { value: Math.PI }, uExposure: exposure, uPlanetR: { value: 1 }, uLite: LITE.uLite,
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      transparent: true, depthWrite: false, side: BackSide,
      blending: CustomBlending, blendSrc: OneFactor, blendDst: OneMinusSrcAlphaFactor,
    });
    this.slab = new Mesh(new BoxGeometry(2, 2, 2), this.slabMat);
    this.slab.matrixAutoUpdate = false;
    this.slab.frustumCulled = false;
    this.slab.visible = false;
    this.slab.renderOrder = 3;
    this.slab.name = 'ring-slab';
    this.loadProfile(texUrl);
  }

  private loadProfile(url: string): void {
    fetch(url).then((r) => r.blob()).then((b) => createImageBitmap(b, { colorSpaceConversion: 'none' })).then((bmp) => {
      const c = document.createElement('canvas');
      c.width = bmp.width; c.height = 1;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      const px = ctx.getImageData(0, 0, c.width, 1).data;
      const tau = new Float32Array(c.width);
      for (let i = 0; i < c.width; i++) tau[i] = -Math.log(Math.max(1 - px[i * 4] / 255, 1e-3));
      this.tau = tau;
      const data = new Uint8Array(c.width * 4);
      for (let i = 0; i < c.width; i++) { data[i * 4] = px[i * 4]; data[i * 4 + 3] = 255; }
      const t = new DataTexture(data, c.width, 1, RGBAFormat);
      t.minFilter = LinearFilter; t.magFilter = LinearFilter; t.wrapS = ClampToEdgeWrapping;
      t.needsUpdate = true;
      this.profileTex = t;
      this.slabMat.uniforms.uProfile.value = t;
    }).catch((e) => console.warn('ring profile', e));
  }

  /** normal optical depth at ring radius r (m) */
  private tauAt(r: number): number {
    const t = this.tau;
    if (!t || r < this.inner || r > this.outer) return 0;
    const x = ((r - this.inner) / (this.outer - this.inner)) * (t.length - 1);
    const i = Math.floor(x);
    return t[i] + (t[Math.min(i + 1, t.length - 1)] - t[i]) * (x - i);
  }

  /**
   * `rel`: planet centre relative to the camera (m); `orient`: planet body-fixed -> world (ring
   * plane z = 0); `radius`: planet radius; `sunDir`: world direction to the Sun; `sunIrr`: irradiance.
   */
  update(rel: Vector3 | null, orient: Matrix4, radius: number, sunDir: Vector3, sunIrr: number): void {
    if (!rel || !this.tau) { this.mesh.visible = false; this.slab.visible = false; return; }
    const toBody = new Matrix3().setFromMatrix4(orient).transpose();
    const cam = rel.clone().negate().applyMatrix3(toBody);      // camera in the ring frame
    const r = Math.hypot(cam.x, cam.y);
    this.updateSlab(cam, r, toBody, orient, radius, sunDir, sunIrr);
    const u = this.mat.uniforms;
    u.uCamZ.value = cam.z;
    u.uTau.value = this.tauAt(r);
    if (Math.abs(cam.z) > RANGE * 1.5 || r < this.inner - RANGE || r > this.outer + RANGE) { this.mesh.visible = false; this.cellX = NaN; return; }
    const cx = Math.floor(cam.x / CELL), cy = Math.floor(cam.y / CELL);
    const lite = LITE.uLite.value > 0.5;
    if (cx !== this.cellX || cy !== this.cellY || lite !== this.lite) { this.lite = lite; this.rebuild(cx, cy); }
    // place: the instances are relative to `origin` in the ring frame
    const m = this.mesh.matrix.copy(orient);
    m.setPosition(this.origin.clone().sub(cam).applyMatrix4(new Matrix4().extractRotation(orient)));
    this.mesh.matrixWorldNeedsUpdate = true;
    this.mesh.visible = this.mesh.count > 0;
    (u.uSunDir.value as Vector3).copy(sunDir);
    u.uSunIrr.value = sunIrr;
    (u.uPlanet.value as Vector3).copy(rel);
    u.uPlanetR.value = radius;
    (u.uPlanetDir.value as Vector3).copy(rel).normalize();
    // light reflected by the planet's day side, as seen from the rings (rough)
    u.uShine.value = 0.04 * Math.max(0, -sunDir.dot(rel.clone().normalize()) * 0.5 + 0.5);
    // light scattered by the ring itself around the particle: a few per cent of sunlight where the
    // ring is dense (its reflectance times the fraction of the sky it fills, about half)
    const nRing = new Vector3(0, 0, 1).applyMatrix4(new Matrix4().extractRotation(orient)).normalize();
    (u.uRingN.value as Vector3).copy(nRing);
    u.uRingShine.value = 0.06 * Math.min(1, this.tauAt(r) / 1.5) * Math.abs(sunDir.dot(nRing)) ** 0.5;
    // the layer's own light per unit optical depth (for particles seen through it), as in the slab
    const c = this.slabMat.uniforms.uColor.value as Vector3;
    const hz = ((0.9 * sunIrr) / Math.PI) * (this.slabMat.uniforms.uExposure.value as number);
    (u.uHaze.value as Vector3).set(c.x * hz, c.y * hz, c.z * hz);
  }

  /** True while the explorer is within reach of the ring layer (the whole ring is then drawn by the slab). */
  get slabActive(): boolean { return this.slab.visible; }

  private updateSlab(cam: Vector3, r: number, toBody: Matrix3, orient: Matrix4, radius: number, sunDir: Vector3, sunIrr: number): void {
    const on = !!this.profileTex && Math.abs(cam.z) < SLAB_HEIGHT && r > this.inner - 2e3 && r < this.outer + 2e3;
    this.slab.visible = on;
    if (!on) return;
    // a box flat in the ring plane, centred under the explorer on the mid-plane, reaching past the
    // rings' outer edge in every direction
    const R = this.outer * 2.2;
    const rot = new Matrix4().extractRotation(orient);
    const z = new Vector3(0, 0, 1).applyMatrix4(rot);
    this.slab.matrix.copy(rot).scale(new Vector3(R, R, 4 * SIGMA)).setPosition(z.multiplyScalar(-cam.z));
    this.slab.matrixWorldNeedsUpdate = true;
    const u = this.slabMat.uniforms;
    (u.uToRing.value as Matrix3).copy(toBody);
    (u.uCamR.value as Vector3).copy(cam);
    const wrap = (x: number) => x - Math.floor(x / 16384) * 16384;
    (u.uCamMod.value as Vector2).set(wrap(cam.x), wrap(cam.y));
    (u.uSunR.value as Vector3).copy(sunDir).applyMatrix3(toBody);
    u.uSunIrr.value = sunIrr;
    u.uPlanetR.value = radius;
  }

  private rebuild(cx: number, cy: number): void {
    this.cellX = cx; this.cellY = cy;
    this.origin.set(cx * CELL, cy * CELL, 0);
    const n = Math.ceil(RANGE / CELL);
    const m4 = new Matrix4(), q = new Quaternion(), s = new Vector3(), p = new Vector3();
    const axis = new Vector3();
    let count = 0;
    for (let iy = -n; iy <= n && count < MAX; iy++) {
      for (let ix = -n; ix <= n && count < MAX; ix++) {
        if ((ix * ix + iy * iy) * CELL * CELL > (RANGE + CELL) ** 2) continue;
        const gx = cx + ix, gy = cy + iy;
        const r = Math.hypot((gx + 0.5) * CELL, (gy + 0.5) * CELL);
        const tau = this.tauAt(r);
        if (tau <= 0) continue;
        // particles per cell: proportional to the optical depth (a few in the faint C ring, a crowd in the B ring)
        const expected = Math.min(4, tau) * (this.lite ? 1 : 2);
        const k = Math.floor(expected) + (hash(gx, gy, 99) < expected % 1 ? 1 : 0);
        for (let j = 0; j < k && count < MAX; j++) {
          const h = (t: number) => hash(gx, gy, j * 16 + t);
          // radius: power law from 0.25 m to 7 m (exponent ~ -3)
          const size = 0.25 / Math.sqrt(1 - h(1) * (1 - (0.25 / 7) ** 2));
          p.set((ix + h(2)) * CELL, (iy + h(3)) * CELL, (h(4) + h(5) - 1) * 9);
          axis.set(h(6) - 0.5, h(7) - 0.5, h(8) - 0.5).normalize();
          q.setFromAxisAngle(axis, h(9) * Math.PI * 2);
          s.set(size * (0.7 + 0.6 * h(10)), size * (0.7 + 0.6 * h(11)), size * (0.7 + 0.6 * h(12)));
          m4.compose(p, q, s);
          this.mesh.setMatrixAt(count++, m4);
        }
      }
    }
    this.mesh.count = count;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
