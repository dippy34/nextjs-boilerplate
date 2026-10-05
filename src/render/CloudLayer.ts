import { BufferAttribute, BufferGeometry, CustomBlending, DoubleSide, Matrix3, Matrix4, Mesh, OneFactor, OneMinusSrcAlphaFactor, ShaderMaterial, type Texture, Vector3 } from 'three';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

/**
 * GLSL shared by the clouds painted on Earth's surface (BODY_FRAG, seen from orbit) and the cloud
 * layer below: the same cover everywhere, so nothing changes shape on the way down. Needs
 * `uniform sampler2D uClouds` declared by the host shader.
 */
export const CLOUD_GLSL = /* glsl */ `
float clh3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float cln3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(clh3(i), clh3(i + vec3(1,0,0)), f.x), mix(clh3(i + vec3(0,1,0)), clh3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(clh3(i + vec3(0,0,1)), clh3(i + vec3(1,0,1)), f.x), mix(clh3(i + vec3(0,1,1)), clh3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// Earth's clouds: the cloud map (~20 km per texel) broken up below its resolution by warped fractal
// billows and scattered small cumulus, each octave only while it spans a few pixels (no flicker).
// nc: body-fixed direction rotated with the clouds' drift; pix: radians per pixel. Returns the
// cover (0..1); thick: optical thickness proxy (0..1) for shading.
float cloudField(vec3 nc, vec2 uv, float pix, float lite, out float thick) {
  float c = texture2D(uClouds, uv).r;
  thick = c;
  float oct = lite > 0.5 ? 2.0 : 5.0;
  // warp so the billows are not lattice-aligned blobs
  vec3 q = nc * 300.0;
  vec3 wq = vec3(cln3(q * 0.5 + 3.1), cln3(q * 0.5 + 7.7), cln3(q * 0.5 + 13.3)) - 0.5;
  q += wq * 1.6;
  float n = 0.0, a = 0.55, wsum = 0.0, f = 300.0;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= oct) break;
    float w = smoothstep(0.45, 0.15, f * pix);       // drawn while one billow spans > ~3 pixels
    n += a * w * (cln3(q) - 0.5);
    wsum += a * w;
    q = q * 2.7 + 5.3;
    f *= 2.7;
    a *= 0.55;
  }
  // edges eaten away, thin cloud broken into cells; thick decks stay closed
  float edge = 1.0 - smoothstep(0.55, 0.95, c);
  float cov = c + n * 1.25 * (0.3 + 0.7 * edge);
  // fair-weather cumulus where the map shows thin haze (cells of ~2-4 km)
  if (lite < 0.5) {
    float wc = smoothstep(0.35, 0.12, 2400.0 * pix);
    if (wc > 0.0) {
      float cu = cln3(nc * 2400.0 + wq * 3.0) * 0.7 + cln3(nc * 6100.0) * 0.3;
      cov = max(cov, smoothstep(0.62, 0.8, cu) * smoothstep(0.05, 0.3, c) * wc * 0.9);
    }
  }
  thick = clamp(c + n * 0.8, 0.0, 1.0);
  return smoothstep(0.2, 0.62, cov);
}
`;

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
${CLOUD_GLSL}
void main() {
  vec3 n = normalize(vWorld - uCenter);
  vec3 nB = uToBody * n;
  float lon = atan(nB.y, nB.x), lat = asin(clamp(nB.z, -1.0, 1.0));
  vec2 uv = vec2(lon / 6.2831853 + 0.5 + uCloudShift, 0.5 + lat / 3.14159265);
  // the same cover as the clouds painted on the surface (seen from orbit), drifting with them
  float ang = uCloudShift * 6.2831853;
  vec3 nc = vec3(cos(ang) * nB.x - sin(ang) * nB.y, sin(ang) * nB.x + cos(ang) * nB.y, nB.z);
  float pix = length(fwidth(nB));
  // beyond 450 km the layer has faded out: skip the noise there
  float fade = uOpacity * smoothstep(450e3, 120e3, length(vWorld));
  if (fade < 0.004) discard;
  float thick;
  float cov = cloudField(nc, uv, pix, uLite, thick) * fade;
  float d = thick;
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
  private capAngle = -1;

  constructor(clouds: Texture | null, exposure: { value: number }) {
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
    this.mesh = new Mesh(capGeometry(CAP_RINGS, CAP_SEGMENTS), this.mat);
    this.mesh.matrixAutoUpdate = false;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.mesh.renderOrder = 19.97; // after the terrain and its haze (TerrainPatch)
    this.mesh.name = 'cloud layer';
  }

  setMap(clouds: Texture): void {
    this.mat.uniforms.uClouds.value = clouds;
  }

  /** Spread the cap's rings over `ang` radians from its pole (only when the angle changes). */
  private setCap(ang: number): void {
    this.capAngle = ang;
    const pos = this.mesh.geometry.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const ring = Math.floor(i / (CAP_SEGMENTS + 1)), seg = i % (CAP_SEGMENTS + 1);
      const t = (ring / CAP_RINGS) * ang, ph = (seg / CAP_SEGMENTS) * 2 * Math.PI;
      pos.setXYZ(i, Math.sin(t) * Math.cos(ph), Math.sin(t) * Math.sin(ph), Math.cos(t));
    }
    pos.needsUpdate = true;
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
    // a cap of the layer under the explorer (the shader fades the clouds out 450 km away), turned
    // from +z to the explorer's direction, then stretched to the flattened layer
    const ang = Math.min(Math.PI, (CAP_REACH / r) * 1.1);
    const x = new Vector3(Math.abs(k.z) < 0.9 ? 0 : 1, 0, Math.abs(k.z) < 0.9 ? 1 : 0).cross(k).normalize();
    const turn = new Matrix4().makeBasis(x, new Vector3().crossVectors(k, x), k);
    this.mesh.matrix.copy(orient).scale(new Vector3(r, r, polar + CloudLayer.HEIGHT)).multiply(turn).setPosition(rel);
    if (this.capAngle !== ang) this.setCap(ang);
    this.mesh.matrixWorldNeedsUpdate = true;
  }
}

/** distance (m) out to which the layer is drawn around the explorer (the shader's fade ends at 450 km) */
const CAP_REACH = 450e3;
const CAP_RINGS = 64;
const CAP_SEGMENTS = 128;

/**
 * A polar grid: rings from the pole out, `segments` around (vertex i: ring i / (segments + 1),
 * segment i % (segments + 1)); `CloudLayer.setCap` places the vertices.
 */
function capGeometry(rings: number, segments: number): BufferGeometry {
  const n = (rings + 1) * (segments + 1);
  const idx: number[] = [];
  for (let i = 0; i < rings; i++) for (let j = 0; j < segments; j++) {
    const a = i * (segments + 1) + j, b = a + segments + 1;
    if (i > 0) idx.push(a, b, a + 1);
    idx.push(a + 1, b, b + 1);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
  g.setIndex(idx);
  return g;
}
