import { BufferAttribute, IcosahedronGeometry, InstancedMesh, Matrix3, Matrix4, Quaternion, ShaderMaterial, Vector3 } from 'three';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

const VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
uniform float uRange;        // particles shrink away towards this distance (m)
varying vec3 vN;
varying vec3 vPos;
varying float vTone;
void main() {
  vec4 centre = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float fade = 1.0 - smoothstep(uRange * 0.7, uRange, length(centre.xyz));
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vec4 wp = modelMatrix * instanceMatrix * vec4(position * fade, 1.0);
  vPos = wp.xyz;
  // per-particle tone from its (deterministic) size and rotation
  vTone = fract(instanceMatrix[3].x * 0.37 + instanceMatrix[3].y * 0.61);
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

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
varying vec3 vN;
varying vec3 vPos;
varying float vTone;
void main() {
  vec3 n = normalize(vN);
  // the planet's shadow: does the ray towards the Sun hit it?
  vec3 oc = vPos - uPlanet;
  float b = dot(oc, uSunDir);
  float c = dot(oc, oc) - uPlanetR * uPlanetR;
  float disc = b * b - c;
  float lit = (disc > 0.0 && -b - sqrt(disc) > 0.0) ? 0.0 : 1.0;
  float mu0 = max(dot(n, uSunDir), 0.0);
  float shine = uShine * max(dot(n, uPlanetDir), 0.0);
  vec3 alb = uColor * (0.75 + 0.5 * vTone);
  vec3 rad = alb * (mu0 * lit + shine + 0.02) * (uSunIrr / 3.14159265);
  gl_FragColor = vec4(min(rad * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

const CELL = 40;          // m: particles are generated per cell of the ring plane
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
  private mat: ShaderMaterial;
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
    if (!rel || !this.tau) { this.mesh.visible = false; return; }
    const toBody = new Matrix3().setFromMatrix4(orient).transpose();
    const cam = rel.clone().negate().applyMatrix3(toBody);      // camera in the ring frame
    const r = Math.hypot(cam.x, cam.y);
    if (Math.abs(cam.z) > RANGE * 1.5 || r < this.inner - RANGE || r > this.outer + RANGE) { this.mesh.visible = false; this.cellX = NaN; return; }
    const cx = Math.floor(cam.x / CELL), cy = Math.floor(cam.y / CELL);
    const lite = LITE.uLite.value > 0.5;
    if (cx !== this.cellX || cy !== this.cellY || lite !== this.lite) { this.lite = lite; this.rebuild(cx, cy); }
    // place: the instances are relative to `origin` in the ring frame
    const m = this.mesh.matrix.copy(orient);
    m.setPosition(this.origin.clone().sub(cam).applyMatrix4(new Matrix4().extractRotation(orient)));
    this.mesh.matrixWorldNeedsUpdate = true;
    this.mesh.visible = this.mesh.count > 0;
    const u = this.mat.uniforms;
    (u.uSunDir.value as Vector3).copy(sunDir);
    u.uSunIrr.value = sunIrr;
    (u.uPlanet.value as Vector3).copy(rel);
    u.uPlanetR.value = radius;
    (u.uPlanetDir.value as Vector3).copy(rel).normalize();
    // light reflected by the planet's day side, as seen from the rings (rough)
    u.uShine.value = 0.04 * Math.max(0, -sunDir.dot(rel.clone().normalize()) * 0.5 + 0.5);
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
