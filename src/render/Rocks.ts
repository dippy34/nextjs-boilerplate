import { BufferGeometry, Color, Group, IcosahedronGeometry, InstancedMesh, Matrix4, NoBlending, Quaternion, ShaderMaterial, Vector3 } from 'three';
import type { UPos } from '../core/upos';
import { vnoise } from '../universe/Terrain';
import { MAT, MATERIALS } from './Materials';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';
import type { TerrainPatch } from './TerrainPatch';

const ROCK_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vN;
varying vec3 vObj;
varying vec3 vPosView;
void main() {
  vObj = position;
  mat4 im = instanceMatrix;
  vN = normalize(mat3(modelMatrix) * mat3(im) * normal);
  vec4 wp = modelMatrix * im * vec4(position, 1.0);
  vPosView = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

const ROCK_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform highp sampler2DArray uMatCol;
uniform highp sampler2DArray uMatNrm;
uniform float uMatOn;
uniform float uLayer;
uniform vec3 uRockColor;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIrr;
uniform float uExposure;
uniform float uAirless;
uniform float uSky;
uniform float uFade;
varying vec3 vN;
varying vec3 vObj;
varying vec3 vPosView;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(-vPosView);
  vec3 col = uRockColor;
  if (uMatOn > 0.5) {
    // triplanar scan texture on the rock (object space, about two repeats across a rock)
    vec3 w = pow(abs(normalize(vObj)), vec3(4.0));
    w /= w.x + w.y + w.z;
    vec3 p = vObj * 0.9;
    vec3 c = texture(uMatCol, vec3(p.yz, uLayer)).rgb * w.x + texture(uMatCol, vec3(p.xz, uLayer)).rgb * w.y + texture(uMatCol, vec3(p.xy, uLayer)).rgb * w.z;
    col *= c * 2.0;
    vec2 nx = texture(uMatNrm, vec3(p.yz, uLayer)).rg * 2.0 - 1.0, ny = texture(uMatNrm, vec3(p.xz, uLayer)).rg * 2.0 - 1.0, nz = texture(uMatNrm, vec3(p.xy, uLayer)).rg * 2.0 - 1.0;
    n = normalize(n + (vec3(0.0, nx) * w.x + vec3(ny.x, 0.0, ny.y) * w.y + vec3(nz, 0.0) * w.z) * 0.6);
  }
  float mu0 = max(dot(n, uSunDir), 0.0);
  float mu = max(dot(n, V), 0.0);
  float light = uAirless > 0.5 ? (mu0 > 0.0 ? 2.0 * mu0 / (mu0 + mu + 1e-4) : 0.0) : mu0;
  // dark where the rock meets the ground; a little sky light on worlds with air
  float ao = smoothstep(-0.55, 0.35, vObj.y);
  vec3 L = uSunColor * (uSunIrr / 3.14159265);
  vec3 rad = col * L * (light * (0.55 + 0.45 * ao) + uSky * (0.4 + 0.6 * ao) * (0.5 + 0.5 * n.y));
  gl_FragColor = vec4(min(rad * uExposure * uFade, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/** A lumpy rock shape (unit size, resting on y = 0 with a little below it). */
function rockGeometry(seed: number): BufferGeometry {
  const g = new IcosahedronGeometry(1, 3);
  const p = g.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    const r = 1 + 0.32 * (vnoise(n.x * 1.6 + seed, n.y * 1.6, n.z * 1.6, seed) - 0.5) + 0.14 * (vnoise(n.x * 4.1, n.y * 4.1 + seed, n.z * 4.1, seed + 3) - 0.5)
      + 0.06 * (vnoise(n.x * 9.0, n.y * 9.0, n.z * 9.0 + seed, seed + 7) - 0.5);
    // flattened, and with flat-ish facets like broken rock
    v.copy(n).multiplyScalar(r);
    v.y *= 0.62;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

interface RockCell { key: string; pos: Float64Array; data: Float32Array; n: number }

const hash = (x: number, y: number, z: number, s: number) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440662683) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const TIERS = [
  // cell size (m), reach (m), rocks per cell (mean, at density 1), size range (m)
  { cell: 3, reach: 28, perCell: 5, min: 0.05, max: 0.35 },
  { cell: 12, reach: 170, perCell: 1.6, min: 0.3, max: 3.5 },
];

/**
 * Rocks on the ground around the explorer: deterministic per cell of the body-fixed lattice
 * (so the same place always has the same rocks), sizes from a steep power law, set on the terrain
 * actually drawn (TerrainPatch.groundRadius) and sunk a little into it, textured with the rock
 * scans (render/Materials.ts) and lit like the ground. Only near the surface, once the terrain is
 * at full height.
 */
export class Rocks {
  readonly group = new Group();
  private meshes: InstancedMesh[] = [];
  private mat: ShaderMaterial;
  private cells = new Map<string, RockCell>();
  private origin = new Vector3();
  private body: object | null = null;
  private dirty = true;
  private max: number;
  budgetMs = 4;

  constructor(private terrain: TerrainPatch, vr = false) {
    this.group.name = 'rocks';
    this.group.matrixAutoUpdate = false;
    this.max = vr ? 900 : 3000;
    this.mat = new ShaderMaterial({
      name: 'rocks', vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG,
      uniforms: {
        ...MATERIALS, uLayer: { value: MAT.cliff }, uRockColor: { value: new Color(0.2, 0.2, 0.2) },
        uSunDir: { value: new Vector3(1, 0, 0) }, uSunColor: { value: new Vector3(1, 1, 1) }, uSunIrr: { value: Math.PI }, uExposure: { value: 1 },
        uAirless: { value: 1 }, uSky: { value: 0 }, uFade: { value: 1 }, uLite: LITE.uLite, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      // opaque, but in the transparent pass like the terrain (after the atmosphere shell)
      transparent: true, blending: NoBlending,
    });
    for (let k = 0; k < 4; k++) {
      const m = new InstancedMesh(rockGeometry(k * 17.3 + 2), this.mat, Math.ceil(this.max / 4));
      m.count = 0;
      m.frustumCulled = false;
      m.renderOrder = 19.92;   // after the terrain (19.9), before its haze (19.95)
      this.meshes.push(m);
      this.group.add(m);
    }
    this.group.visible = false;
  }

  /** Per frame, after the terrain patch. `cam`: the explorer's position. */
  update(cam: UPos): void {
    const t = this.terrain;
    const c = t.current;
    const below = t.below(cam);
    if (!c || !below || t.hScale < 0.99 || below.dist - below.ground > 600) { this.group.visible = false; return; }
    const g = c.ground;
    const density = this.density(c);
    if (density <= 0) { this.group.visible = false; return; }
    if (g.owner !== this.body) { this.cells.clear(); this.body = g.owner; this.dirty = true; }
    const R = below.ground;
    const camBF = below.dir.clone().multiplyScalar(below.dist);
    // rebase when the explorer has moved far from the instances' origin
    if (this.origin.distanceTo(camBF) > 120 || this.dirty) { this.origin.copy(below.dir).multiplyScalar(R); this.dirty = true; }
    // cells wanted, generated within the time budget (nearest first)
    const t0 = performance.now();
    const want = new Set<string>();
    for (const tier of TIERS) {
      const s = tier.cell, reach = tier.reach;
      const ground = below.dir.clone().multiplyScalar(R);
      const lo = ground.clone().subScalar(reach).divideScalar(s).floor(), hi = ground.clone().addScalar(reach).divideScalar(s).floor();
      const list: { k: string; d: number; x: number; y: number; z: number }[] = [];
      for (let x = lo.x; x <= hi.x; x++) for (let y = lo.y; y <= hi.y; y++) for (let z = lo.z; z <= hi.z; z++) {
        const cx = (x + 0.5) * s, cy = (y + 0.5) * s, cz = (z + 0.5) * s;
        const r = Math.hypot(cx, cy, cz);
        if (Math.abs(r - R) > s * 0.9) continue;           // cells crossing the surface only
        const d = Math.hypot(cx - ground.x, cy - ground.y, cz - ground.z);
        if (d > reach) continue;
        list.push({ k: `${s}:${x}:${y}:${z}`, d, x, y, z });
      }
      list.sort((a, b) => a.d - b.d);
      for (const e of list) {
        want.add(e.k);
        if (this.cells.has(e.k)) continue;
        if (performance.now() - t0 > this.budgetMs) continue;
        this.cells.set(e.k, this.makeCell(e.k, e.x, e.y, e.z, tier, density));
        this.dirty = true;
      }
    }
    for (const k of [...this.cells.keys()]) if (!want.has(k)) { this.cells.delete(k); this.dirty = true; }
    if (this.dirty) this.fill();
    // place the group: body-fixed origin -> camera-relative world
    const q = new Quaternion().setFromRotationMatrix(c.orient);
    const o = this.origin.clone().applyQuaternion(q).add(c.upos.sub(cam, new Vector3()));
    this.group.matrix.compose(o, q, new Vector3(1, 1, 1));
    this.group.matrixWorldNeedsUpdate = true;
    // light and colour from the world's own material
    const u = c.material.uniforms, m = this.mat.uniforms;
    (m.uSunDir.value as Vector3).copy(u.uSunDir.value as Vector3);
    (m.uSunColor.value as Vector3).copy(u.uSunColor.value as Vector3);
    m.uSunIrr.value = u.uSunIrr.value;
    m.uExposure.value = (u.uExposure.value as number);
    m.uAirless.value = u.uAirless ? u.uAirless.value : 0;
    m.uSky.value = u.uAtmo && (u.uAtmo.value as number) > 0.5 ? 0.12 : u.uAtmoColor ? 0.08 : 0;
    this.rockColour(c, m.uRockColor.value as Color);
    m.uLayer.value = u.uMatSel ? (u.uMatMode?.value === 3 ? MAT.snow : MAT.cliff) : MAT.cliff;
    this.group.visible = true;
  }

  /** Rocks per cell relative to the lunar maria (1): fewer on worlds with soil and plants. */
  private density(c: NonNullable<TerrainPatch['current']>): number {
    const u = c.material.uniforms;
    if (u.uType) {
      const t = u.uType.value as number;   // generated planet: 0 lava, 1 hot, 2 desert, 3 temperate, 4 ocean, 5 ice
      return t >= 6 ? 0 : [0.7, 1.0, 0.45, 0.2, 0.15, 0.25][t] ?? 0;
    }
    const mode = (u.uMatMode?.value as number) ?? 0;
    return mode === 1 ? 0.12 : mode === 2 ? 0.8 : mode === 3 ? 0.3 : 1.0;
  }

  private rockColour(c: NonNullable<TerrainPatch['current']>, out: Color): void {
    const u = c.material.uniforms;
    if (u.uC3) { const v = u.uC3.value as Vector3; out.setRGB(v.x * 0.8, v.y * 0.8, v.z * 0.8); return; }
    const mode = (u.uMatMode?.value as number) ?? 0;
    const a = (u.uAlbedoScale?.value as number) ?? 0.12;
    if (mode === 1) out.setRGB(0.22, 0.2, 0.18);
    else if (mode === 2) out.setRGB(0.26, 0.15, 0.09);
    else if (mode === 3) out.setRGB(0.6, 0.62, 0.65);
    else { const g = Math.min(0.3, Math.max(0.08, a * 1.1)); out.setRGB(g, g * 0.97, g * 0.94); }
  }

  private makeCell(key: string, x: number, y: number, z: number, tier: (typeof TIERS)[number], density: number): RockCell {
    const s = tier.cell;
    const seed = s === 3 ? 11 : 29;
    const mean = tier.perCell * density;
    // Poisson count from the cell's hash
    let n = 0;
    for (let p = Math.exp(-mean), u = hash(x, y, z, seed), cum = p; u > cum && n < 30; ) { n++; p *= mean / n; cum += p; }
    const pos = new Float64Array(n * 3), data = new Float32Array(n * 5);
    const t = this.terrain;
    const dir = new Vector3();
    let m = 0;
    for (let i = 0; i < n; i++) {
      const hx = hash(x, y, z, seed + 7 * i + 1), hy = hash(x, y, z, seed + 7 * i + 2), hz = hash(x, y, z, seed + 7 * i + 3);
      dir.set((x + hx) * s, (y + hy) * s, (z + hz) * s).normalize();
      const gr = t.groundRadius(dir);
      if (!(gr > 0)) continue;
      // steep power law: most small, a few large
      const u = hash(x, y, z, seed + 7 * i + 4);
      const size = Math.min(tier.max, tier.min / Math.pow(Math.max(u, 1e-3), 0.55));
      if (size > tier.max * 0.999 && hash(x, y, z, seed + 7 * i + 6) > 0.3) continue;
      pos[m * 3] = dir.x * gr; pos[m * 3 + 1] = dir.y * gr; pos[m * 3 + 2] = dir.z * gr;
      data[m * 5] = size;
      data[m * 5 + 1] = hash(x, y, z, seed + 7 * i + 5) * Math.PI * 2;   // turn about the vertical
      data[m * 5 + 2] = 0.75 + 0.6 * hash(x, y, z, seed + 7 * i + 6);    // stretch
      data[m * 5 + 3] = 0.55 + 0.6 * hash(x, y, z, seed + 7 * i + 8);    // height
      data[m * 5 + 4] = Math.floor(hash(x, y, z, seed + 7 * i + 9) * 4); // shape
      m++;
    }
    return { key, pos, data, n: m };
  }

  /** Rebuild the instance matrices relative to the current origin. */
  private fill(): void {
    this.dirty = false;
    const counts = [0, 0, 0, 0];
    const cap = this.meshes[0].instanceMatrix.count;
    const mtx = new Matrix4(), q = new Quaternion(), q2 = new Quaternion(), sc = new Vector3(), p = new Vector3(), up = new Vector3();
    const Y = new Vector3(0, 1, 0);
    for (const c of this.cells.values()) {
      for (let i = 0; i < c.n; i++) {
        const k = c.data[i * 5 + 4];
        if (counts[k] >= cap) continue;
        p.set(c.pos[i * 3], c.pos[i * 3 + 1], c.pos[i * 3 + 2]);
        up.copy(p).normalize();
        const size = c.data[i * 5];
        q.setFromUnitVectors(Y, up).multiply(q2.setFromAxisAngle(Y, c.data[i * 5 + 1]));
        sc.set(size * c.data[i * 5 + 2], size * c.data[i * 5 + 3], size);
        // sunk by a quarter of its height
        p.sub(this.origin).addScaledVector(up, -0.25 * sc.y * 0.62);
        mtx.compose(p, q, sc);
        this.meshes[k].setMatrixAt(counts[k]++, mtx);
      }
    }
    this.meshes.forEach((m, k) => { m.count = counts[k]; m.instanceMatrix.needsUpdate = true; });
  }

  /** Rock material and a mesh, for compiling the shader up front. */
  warmupObjects(): InstancedMesh[] {
    return [this.meshes[0]];
  }
}
