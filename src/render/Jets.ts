import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, Quaternion, ShaderMaterial, Vector3 } from 'three';
import type { UPos } from '../core/upos';
import { PC } from '../core/units';
import type { BlackHole } from '../universe/BlackHoles';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

const VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute float aAlong;
uniform float uClipScale;
varying float vAlong;
varying vec3 vNormalW;
varying vec3 vPosView;
void main() {
  vAlong = aAlong;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosView = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
  // clip coordinates of a kiloparsec jet overflow 32-bit floats in clipping: one factor per mesh
  gl_Position *= uClipScale;
}`;

const FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
uniform float uSeed;
varying float vAlong;   // 0 at the base, 1 at the tip (logarithmic in distance)
varying vec3 vNormalW;
varying vec3 vPosView;
float h1(float n) { return fract(sin(n) * 43758.5453123); }
float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
void main() {
  vec3 V = normalize(-vPosView);
  // a glowing gas column: the line of sight through this surface point passes the axis at a
  // fraction sqrt(1 - facing^2) of the radius; emission falls off smoothly towards the edges
  float facing = abs(dot(normalize(vNormalW), V));
  float b2 = 1.0 - facing * facing;
  float limb = 1.4 * exp(-3.5 * b2) * facing;
  // knots travelling outwards, and a slow fade along the jet
  float knots = 0.45 + 0.55 * pow(n1(vAlong * 38.0 - uTime * 0.25 + uSeed), 2.0);
  float fade = smoothstep(0.0, 0.04, vAlong) * (1.0 - smoothstep(0.75, 1.0, vAlong));
  vec3 c = uColor * uIntensity * 0.22 * limb * knots * fade;
  gl_FragColor = vec4(c, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/**
 * Jet along +y in units of the Schwarzschild radius: rings logarithmically spaced from 3 rs to
 * `lengthRs`; radius 1.5 z^0.58 (parabolic collimation, as measured for M87 by Asada & Nakamura
 * 2012) out to 1e5 rs, then a narrow cone (half-angle `coneDeg`).
 */
function jetGeometry(lengthRs: number, coneDeg: number): BufferGeometry {
  const rings = 110, seg = 28;
  const zb = Math.min(1e5, lengthRs * 0.1);
  const rb = 1.5 * zb ** 0.58;
  const tan = Math.tan((coneDeg * Math.PI) / 180);
  const pos: number[] = [], nrm: number[] = [], along: number[] = [], idx: number[] = [];
  const z0 = 3, k = Math.log(lengthRs / z0);
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const z = z0 * Math.exp(k * t);
    const r = z < zb ? 1.5 * z ** 0.58 : rb + (z - zb) * tan;
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      pos.push(Math.cos(a) * r, z, Math.sin(a) * r);
      nrm.push(Math.cos(a), 0, Math.sin(a));
      along.push(t);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = i * (seg + 1) + j, b = a + seg + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nrm), 3));
  g.setAttribute('aAlong', new BufferAttribute(new Float32Array(along), 1));
  g.setIndex(idx);
  return g;
}

interface JetPair { bh: BlackHole; meshes: [Mesh, Mesh]; length: number; width: number }

/**
 * Relativistic jets of the black holes that have them, along the spin axis (taken as the disk
 * normal). The jet pointing towards the Sun is Doppler-boosted, the counter-jet faint. These are
 * ordinary scene objects, so near a hole the lensing pass sees (and bends) them like the stars.
 */
export class JetsLayer {
  readonly group = new Group();
  private pairs: JetPair[] = [];

  constructor(holes: BlackHole[]) {
    this.group.name = 'jets';
    for (const bh of holes) {
      if (!bh.jet) continue;
      const optical = bh.jet === 'optical';
      // M87: ~1.5 kpc; microquasar radio jets: ~0.05 pc
      const length = optical ? 1500 * PC : 0.05 * PC;
      const geo = jetGeometry(length / bh.radius, optical ? 1.5 : 1.0);
      const width = bh.radius;
      const toSun = bh.upos.toVector3().normalize().negate();
      const make = (sign: number) => {
        const towards = sign * bh.diskNormal.dot(toSun) > 0;
        const mat = new ShaderMaterial({
          name: 'jet', vertexShader: VERT, fragmentShader: FRAG,
          uniforms: {
            uColor: { value: optical ? new Vector3(0.62, 0.8, 1.0) : new Vector3(0.75, 0.6, 1.0) },
            uIntensity: { value: (optical ? 1.0 : 0.35) * (towards ? 1 : 0.06) },
            uTime: { value: 0 }, uClipScale: { value: 1 }, uSeed: { value: sign * 13.7 + bh.diskLook.seed },
            uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
          },
          transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
        });
        const m = new Mesh(geo, mat);
        m.userData.scale = bh.radius;
        m.matrixAutoUpdate = false;
        m.frustumCulled = false;
        m.renderOrder = 11;
        m.name = `${bh.name} jet`;
        m.userData.sign = sign;
        this.group.add(m);
        return m;
      };
      this.pairs.push({ bh, meshes: [make(1), make(-1)], length, width });
    }
  }

  /** A jet to compile the shader with before one is first needed. */
  warmupObjects(): Mesh[] {
    return this.pairs.length ? [this.pairs[0].meshes[0]] : [];
  }

  update(cam: UPos, pixelAngle: number, time: number): void {
    const rel = new Vector3();
    const q = new Quaternion();
    for (const p of this.pairs) {
      p.bh.upos.sub(cam, rel);
      // only worth drawing once the jet spans a few pixels
      const visible = Math.atan2(p.length, rel.length()) / pixelAngle > 3;
      for (const m of p.meshes) {
        m.visible = visible;
        if (!visible) continue;
        const sign = m.userData.sign as number;
        q.setFromUnitVectors(new Vector3(0, 1, 0), p.bh.diskNormal.clone().multiplyScalar(sign));
        const k = p.width; // geometry is in units of rs
        m.matrix.compose(rel, q, new Vector3(k, k, k));
        m.matrixWorldNeedsUpdate = true;
        (m.material as ShaderMaterial).uniforms.uTime.value = time;
        (m.material as ShaderMaterial).uniforms.uClipScale.value = 1 / Math.max(rel.length(), p.length);
      }
    }
  }
}
