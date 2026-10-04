import {
  BufferGeometry, CircleGeometry, Color, CustomBlending, DoubleSide, Group, HalfFloatType, IcosahedronGeometry, InstancedBufferAttribute, InstancedMesh,
  Matrix4, NearestFilter, MaxEquation, NoBlending, OneFactor, OrthographicCamera, Quaternion, RGFormat, Scene, ShaderMaterial, Vector3, Vector4,
  WebGLRenderTarget, type WebGLRenderer,
} from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { UPos } from '../core/upos';
import { baseRadius, vnoise } from '../universe/Terrain';
import { adaptMaterials, MAT, MATERIALS, ROCK_SHADOW_GLSL } from './Materials';
import { FIX_LOGDEPTH, GLOBALS, LITE, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';
import type { TerrainPatch } from './TerrainPatch';

const ROCK_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute vec4 aRock;   // map u, v of the rock's place; the Sun's clearance over the relief there; brightness
varying vec3 vN;
varying vec3 vObj;
varying vec3 vPosView;
varying vec4 vRock;
varying vec3 vNo;
varying vec3 vR0;
varying vec3 vR1;
varying vec3 vR2;
void main() {
  vObj = position;
  vRock = aRock;
  vNo = normal;
  mat4 im = instanceMatrix;
  // normals: object -> world is the inverse transpose (rotation times inverse scale)
  mat3 nm = mat3(modelMatrix) * mat3(im) * mat3(1.0 / dot(im[0].xyz, im[0].xyz), 0.0, 0.0, 0.0, 1.0 / dot(im[1].xyz, im[1].xyz), 0.0, 0.0, 0.0, 1.0 / dot(im[2].xyz, im[2].xyz));
  vR0 = nm[0]; vR1 = nm[1]; vR2 = nm[2];
  vN = normalize(nm * normal);
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
uniform sampler2D uMap;
uniform float uHasMap;
uniform float uMapGray;
uniform float uAlbedoScale;
uniform vec3 uRockColor;     // without a map: the rock's colour; with one: tint of the map's colour
uniform vec2 uRockSat;       // saturation kept from the map, brightness relative to the ground
uniform vec4 uRockHue;       // the ground's hue up close where it differs from the map's (rgb), how much (w)
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIrr;
uniform float uExposure;
uniform float uAirless;
uniform vec3 uSky;      // skylight on a horizontal surface (relative to the Sun's light above the air)
uniform vec3 uSunT;     // sunlight transmitted by the air
uniform float uFade;
uniform float uLite;
${ROCK_SHADOW_GLSL}
varying vec3 vN;
varying vec3 vObj;
varying vec3 vPosView;
varying vec4 vRock;
varying vec3 vNo;
varying vec3 vR0;
varying vec3 vR1;
varying vec3 vR2;
vec3 srgbToLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(-vPosView);
  vec3 col = uRockColor;
  if (uHasMap > 0.5) {
    // the ground's own colour where the rock lies (rocks are made of the same stuff), desaturated
    // towards rock grey on worlds with soil or plants
    vec3 t = textureLod(uMap, vRock.xy, 4.0).rgb;
    if (uMapGray > 0.5) t = vec3(t.r);
    vec3 g = srgbToLinear(t) * uAlbedoScale;
    float l = dot(g, vec3(0.2126, 0.7152, 0.0722));
    g = mix(g, uRockHue.rgb * l / dot(uRockHue.rgb, vec3(0.2126, 0.7152, 0.0722)), uRockHue.w);
    col = mix(vec3(l) * uRockColor, g, uRockSat.x) * uRockSat.y;
  }
  col *= vRock.w;
  if (uMatOn > 0.5) {
    // triplanar scan texture on the rock (object space, about two repeats across a rock)
    vec3 w = pow(abs(normalize(vObj)), vec3(4.0));
    w /= w.x + w.y + w.z;
    vec3 p = vObj * 0.9;
    vec3 c = texture(uMatCol, vec3(p.yz, uLayer)).rgb * w.x + texture(uMatCol, vec3(p.xz, uLayer)).rgb * w.y + texture(uMatCol, vec3(p.xy, uLayer)).rgb * w.z;
    // the scan's colour as contrast only (its own hue would tint every world's rocks alike)
    float cl = dot(c, vec3(0.2126, 0.7152, 0.0722)) * 2.0;
    col *= mix(vec3(cl), c * 2.0, 0.35);
    vec2 nx = texture(uMatNrm, vec3(p.yz, uLayer)).rg * 2.0 - 1.0, ny = texture(uMatNrm, vec3(p.xz, uLayer)).rg * 2.0 - 1.0, nz = texture(uMatNrm, vec3(p.xy, uLayer)).rg * 2.0 - 1.0;
    // (object space is the rock's own frame, scaled per instance: close enough for the grain's direction)
    vec3 bend = vec3(0.0, nx.x, nx.y) * w.x + vec3(ny.x, 0.0, ny.y) * w.y + vec3(nz.x, nz.y, 0.0) * w.z;
    n = normalize(mat3(vR0, vR1, vR2) * (normalize(vNo) + bend * 0.6));
  }
  // dust settles on the tops of rocks on worlds with wind (and regolith fillets bury the base)
  float up = vObj.y;
  float mu0 = dot(n, uSunDir);
  float mu = max(dot(n, V), 0.0);
  // rough rock: between Lommel-Seeliger (regolith) and Lambert, no light past the terminator
  float ls = mu0 > 0.0 ? 2.0 * mu0 / (mu0 + mu + 1e-4) : 0.0;
  float light = uAirless > 0.5 ? mix(ls * 0.5, max(mu0, 0.0), 0.55) * 1.25 : max(mu0, 0.0);
  // shadows: the relief's (per rock) and the rocks' own (shadow map)
  float ao;
  float bias = 0.02 + 0.03 * (1.0 - max(mu0, 0.0));
  light *= clamp(0.5 + vRock.z, 0.0, 1.0) * rockShadow(vPosView, bias, uLite, ao);
  // dark where the rock meets the ground; a little sky light on worlds with air
  float aoBase = smoothstep(-0.35, 0.45, up);
  vec3 L = uSunColor * (uSunIrr / 3.14159265);
  vec3 upW = normalize(vR1);
  vec3 rad = col * L * (uSunT * light * (0.7 + 0.3 * aoBase) + uSky * (0.25 + 0.75 * aoBase) * (0.55 + 0.45 * dot(n, upW)));
  gl_FragColor = vec4(min(rad * uExposure * uFade, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/** Shadow pass: the rocks' depth towards the Sun (largest wins), in R. */
const SHADOW_VERT = /* glsl */ `
uniform mat4 uM;
uniform float uLo;
varying float vT;
varying float vU;
void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vec3 s = (uM * wp).xyz;
  vT = s.z;
  gl_Position = vec4(s.xy * 2.0 - 1.0, 0.5, 1.0);
  vU = s.x;
}`;
const SHADOW_FRAG = /* glsl */ `
uniform float uLo;
varying float vT;
varying float vU;
void main() {
  if (vU < uLo || vU > uLo + 0.5) discard;   // (each cascade stays in its half)
  gl_FragColor = vec4(exp(vT / 16.0), 0.0, 0.0, 0.0);   // (positive, so a clear to 0 means no rock)
}`;
/** Contact pass: a soft disc around each rock's base seen from above, in G. */
const AO_VERT = /* glsl */ `
uniform mat4 uM;
varying float vR;
varying float vU;
void main() {
  vR = length(position.xz);
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vec3 s = (uM * wp).xyz;
  vU = s.x;
  gl_Position = vec4(s.xy * 2.0 - 1.0, 0.5, 1.0);
}`;
const AO_FRAG = /* glsl */ `
uniform float uLo;
varying float vR;
varying float vU;
void main() {
  if (vU < uLo || vU > uLo + 0.5) discard;
  float a = 1.0 - smoothstep(0.7, 1.5, vR);
  gl_FragColor = vec4(0.0, a * a, 0.0, 0.0);
}`;

/** Unit rock shapes: broken blocks (a lumpy body cut by fracture planes, softened), resting on y = 0. */
function rockGeometry(seed: number, detail: number): BufferGeometry {
  const g0 = new IcosahedronGeometry(1, detail);
  g0.deleteAttribute('normal');
  g0.deleteAttribute('uv');
  const g = mergeVertices(g0);
  g0.dispose();
  const p = g.attributes.position;
  const v = new Vector3();
  // fracture planes: some steep (the sides), one or two shallow (the top)
  const planes: { n: Vector3; d: number }[] = [];
  const rnd = (k: number) => vnoise(seed * 3.1 + k * 1.37, seed * 0.7 + k * 2.11, k * 0.53, 777) * 1.6 - 0.3;
  const np = 6 + (seed % 3);
  for (let k = 0; k < np; k++) {
    const a = (k / np) * Math.PI * 2 + rnd(k) * 1.2;
    const el = k < 2 ? 0.9 + 0.5 * Math.abs(rnd(k + 20)) : (rnd(k + 40) - 0.2) * 0.6;
    planes.push({ n: new Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).normalize(), d: 0.62 + 0.25 * Math.abs(rnd(k + 60)) });
  }
  // soft minimum (rounded edges, as weathered rock)
  const smin = (a: number, b: number, k: number) => { const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k)); return b + (a - b) * h - k * h * (1 - h); };
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let r = 1 + 0.22 * (vnoise(v.x * 1.5 + seed, v.y * 1.5, v.z * 1.5, seed) - 0.5);
    for (const pl of planes) {
      const c = v.dot(pl.n);
      if (c > 0.05) r = smin(r, pl.d / c, 0.07);
    }
    r *= 1 + 0.05 * (vnoise(v.x * 6 + seed, v.y * 6, v.z * 6, seed + 3) - 0.5) + 0.025 * (vnoise(v.x * 15, v.y * 15 + seed, v.z * 15, seed + 7) - 0.5);
    v.multiplyScalar(r);
    v.y *= 0.7;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const hash = (x: number, y: number, z: number, s: number) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440662683) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

interface Tier {
  cell: number; reach: number; reachVr: number;
  /** rocks per cell (mean, at density 1) */
  perCell: number;
  /** sizes (m): smallest, largest; cumulative count ~ size^-slope */
  min: number; max: number; slope: number;
  seed: number;
}
const TIERS: Tier[] = [
  { cell: 2, reach: 24, reachVr: 14, perCell: 7, min: 0.04, max: 0.3, slope: 2.2, seed: 11 },
  { cell: 9, reach: 110, reachVr: 70, perCell: 2.4, min: 0.25, max: 1.6, slope: 2.4, seed: 29 },
  { cell: 40, reach: 320, reachVr: 220, perCell: 0.5, min: 1.2, max: 7, slope: 2.6, seed: 53 },
];
const SHAPES = 6;
/** rocks larger than this (m) use the detailed shapes; smaller than SMALL, the simplest */
const BIG = 0.7;
const SMALL = 0.15;

interface RockCell { key: string; serial: number; pos: Float64Array; data: Float32Array; n: number; reach: number }
// per rock in RockCell.data: size, turn, stretch, height, shape, tilt x, tilt y, tilt z (up), brightness, sun clearance, map u, map v,
// depth of its lowest side below the ground at its centre (m)
const D = 13;

/**
 * Rocks on the ground around the explorer: deterministic per cell of the body-fixed lattice
 * (the same place always has the same rocks), in three tiers (pebbles, rocks, boulders) with sizes
 * from power laws and patchy density (strewn fields and bare ground). Each is set on the terrain
 * actually drawn (TerrainPatch.groundRadius), tilted to the slope and sunk in at its lowest
 * side, and re-placed whenever a new patch replaces the old. Coloured from the world's map where
 * it lies, textured with the rock scans, shadowed by the relief (TerrainPatch.sunClearance), and
 * casting shadows on the ground and on each other through a small shadow map (with a contact
 * darkening around their bases), which the terrain shader samples (ROCK_SHADOW_GLSL).
 */
export class Rocks {
  readonly group = new Group();
  private meshes: InstancedMesh[] = [];
  private mat: ShaderMaterial;
  private cells = new Map<string, RockCell>();
  private origin = new Vector3();
  private body: object | null = null;
  private dirty = true;
  /** every wanted cell is built for the explorer's last position (lastCam, body-fixed) and the ground's serial */
  private settled = false;
  private lastCam = new Vector3();
  private fillCam = new Vector3();
  private lastSerial = -1;
  private cap: number;
  private vr: boolean;
  budgetMs = 4;
  // shadow map
  private target: WebGLRenderTarget;
  private shScene = new Scene();
  private shGroup = new Group();
  private shMat: ShaderMaterial;
  private aoMat: ShaderMaterial;
  private shMeshes: InstancedMesh[] = [];
  private aoMeshes: InstancedMesh[] = [];
  private shCam = new OrthographicCamera();
  /** half-sizes (m) of the areas the shadow map's two cascades cover around the explorer */
  shadowReach: [number, number];
  /** what the shadow map holds: its body-fixed centre, Sun and vertical, and the rocks it was drawn with */
  private shadowState = { valid: false, centre: new Vector3(), sun: new Vector3(), up: new Vector3(), fills: -1 };
  /** counts the rebuilds of the instances */
  private fills = 0;
  shadows = true;

  constructor(private terrain: TerrainPatch, vr = false) {
    this.vr = vr;
    this.group.name = 'rocks';
    this.group.matrixAutoUpdate = false;
    this.cap = vr ? 1400 : 5000;
    this.mat = new ShaderMaterial({
      name: 'rocks', vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG,
      uniforms: {
        ...MATERIALS, uLayer: { value: MAT.cliff }, uRockColor: { value: new Color(0.2, 0.2, 0.2) }, uRockSat: { value: { x: 1, y: 1 } }, uRockHue: { value: new Vector4(1, 1, 1, 0) },
        uMap: { value: null }, uHasMap: { value: 0 }, uMapGray: { value: 0 }, uAlbedoScale: { value: 1 },
        uSunDir: { value: new Vector3(1, 0, 0) }, uSunColor: { value: new Vector3(1, 1, 1) }, uSunIrr: { value: Math.PI }, uExposure: { value: 1 },
        uAirless: { value: 1 }, uSky: { value: new Vector3() }, uSunT: { value: new Vector3(1, 1, 1) }, uFade: { value: 1 }, uLite: LITE.uLite, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      // opaque, but in the transparent pass like the terrain (after the atmosphere shell)
      transparent: true, blending: NoBlending,
    });
    const size = vr ? 512 : 1024;
    this.shadowReach = vr ? [10, 60] : [13, 100];
    MATERIALS.uRockTexel.value.set(1 / (2 * size), 1 / size);
    this.target = new WebGLRenderTarget(2 * size, size, { type: HalfFloatType, format: RGFormat, depthBuffer: false, minFilter: NearestFilter, magFilter: NearestFilter, generateMipmaps: false });
    const blend = { blending: CustomBlending, blendEquation: MaxEquation, blendSrc: OneFactor, blendDst: OneFactor, depthTest: false, depthWrite: false, side: DoubleSide };
    this.shMat = new ShaderMaterial({ name: 'rock-shadow', vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, uniforms: { uM: { value: new Matrix4() }, uLo: { value: 0 } }, ...blend });
    this.aoMat = new ShaderMaterial({ name: 'rock-contact', vertexShader: AO_VERT, fragmentShader: AO_FRAG, uniforms: { uM: { value: new Matrix4() }, uLo: { value: 0 } }, ...blend });
    const disc = new CircleGeometry(1.5, 20).rotateX(-Math.PI / 2);
    this.shGroup.matrixAutoUpdate = false;
    this.shScene.add(this.shGroup);
    this.shScene.matrixWorldAutoUpdate = true;
    // three levels of detail: pebbles (80 triangles), stones, boulders
    for (const lod of [0, 1, 2]) {
      for (let k = 0; k < SHAPES; k++) {
        const n = Math.ceil((this.cap * [0.75, 0.35, 0.06][lod]) / SHAPES) + 8;
        const detail = [[1, 2, 4], [1, 1, 3]][vr ? 1 : 0][lod];
        const m = new InstancedMesh(rockGeometry(k * 17 + 2, detail), this.mat, n);
        m.geometry.setAttribute('aRock', new InstancedBufferAttribute(new Float32Array(n * 4), 4));
        m.count = 0;
        m.frustumCulled = false;
        m.renderOrder = 19.92;   // after the terrain (19.9), before its haze (19.95)
        this.meshes.push(m);
        this.group.add(m);
        const s = new InstancedMesh(m.geometry, this.shMat, n);
        s.instanceMatrix = m.instanceMatrix;
        s.frustumCulled = false;
        const a = new InstancedMesh(disc, this.aoMat, n);
        a.instanceMatrix = m.instanceMatrix;
        a.frustumCulled = false;
        this.shMeshes.push(s);
        this.aoMeshes.push(a);
        this.shGroup.add(s, a);
      }
    }
    this.group.visible = false;
  }

  /** Per frame, after the terrain patch. `cam`: the explorer's position; `gl` renders the shadow map. */
  update(cam: UPos, gl?: WebGLRenderer): void {
    if (gl) adaptMaterials(gl);
    const t = this.terrain;
    const c = t.current;
    const below = t.below(cam);
    const hide = () => { this.group.visible = false; MATERIALS.uRockOn.value = 0; this.shadowState.valid = false; };
    if (!c || !below || t.hScale < 0.99 || below.dist - below.ground > 700) { hide(); return; }
    const g = c.ground;
    const density = this.density(c);
    if (density <= 0) { hide(); return; }
    if (g.owner !== this.body) { this.cells.clear(); this.body = g.owner; this.dirty = true; this.settled = false; }
    const R = below.ground;
    const camBF = below.dir.clone().multiplyScalar(below.dist);
    // rebase when the explorer has moved far from the instances' origin
    if (this.origin.distanceTo(camBF) > 120 || this.dirty) { this.origin.copy(below.dir).multiplyScalar(R); this.dirty = true; }
    // a new patch (or new shadows): every rock is placed again, nearest first, within the budget
    const serial = t.serial;
    const t0 = performance.now();
    const want = new Set<string>();
    const hAbove = below.dist - below.ground;
    // the cells around stay the same while the explorer hovers: nothing to do until it moves, the
    // ground changes or cells are still waiting to be built
    const still = this.settled && serial === this.lastSerial && camBF.distanceTo(this.lastCam) < 0.5;
    this.lastSerial = serial;
    if (!still) this.lastCam.copy(camBF);
    let pending = false;
    for (const tier of (still ? [] : TIERS)) {
      const s = tier.cell;
      // tiers that would be under a pixel are left out from high up
      const reach = Math.min(this.vr ? tier.reachVr : tier.reach, (this.vr ? tier.reachVr : tier.reach) * (tier.max * 400) / Math.max(hAbove, 1));
      if (reach < s) continue;
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
        const old = this.cells.get(e.k);
        if (old && old.serial === serial) continue;
        if (performance.now() - t0 > this.budgetMs) { pending = true; continue; }
        this.cells.set(e.k, this.makeCell(e.k, e.x, e.y, e.z, tier, density, c.lonLeft, serial));
        this.dirty = true;
      }
    }
    if (!still) {
      for (const k of [...this.cells.keys()]) if (!want.has(k)) { this.cells.delete(k); this.dirty = true; }
      this.settled = !pending;
    }
    // (sizes near the reach's edge follow the explorer)
    if (camBF.distanceTo(this.fillCam) > 3) this.dirty = true;
    if (this.dirty) { this.fill(); this.fillCam.copy(camBF); }
    // place the group: body-fixed origin -> camera-relative world
    const q = new Quaternion().setFromRotationMatrix(c.orient);
    const rel = c.upos.sub(cam, new Vector3());
    const o = this.origin.clone().applyQuaternion(q).add(rel);
    this.group.matrix.compose(o, q, new Vector3(1, 1, 1));
    this.group.matrixWorldNeedsUpdate = true;
    // light and colour from the world's own material
    const u = c.material.uniforms, m = this.mat.uniforms;
    (m.uSunDir.value as Vector3).copy(u.uSunDir.value as Vector3);
    (m.uSunColor.value as Vector3).copy(u.uSunColor.value as Vector3);
    m.uSunIrr.value = u.uSunIrr.value;
    m.uExposure.value = (u.uExposure.value as number);
    m.uAirless.value = u.uAirless ? u.uAirless.value : 0;
    this.skyLight(u, below.dir.clone().applyQuaternion(q), m.uSunT.value as Vector3, m.uSky.value as Vector3);
    m.uMap.value = u.uMap?.value ?? null;
    m.uHasMap.value = u.uHasMap?.value ?? 0;
    m.uMapGray.value = u.uMapGray?.value ?? 0;
    m.uAlbedoScale.value = u.uAlbedoScale?.value ?? 1;
    this.rockColour(c, m.uRockColor.value as Color, m.uRockSat.value as { x: number; y: number });
    (m.uRockHue.value as Vector4).set(1, 0.62, 0.38, u.uMatMode?.value === 2 ? 1 : 0);
    m.uLayer.value = u.uMatSel ? (u.uMatMode?.value === 3 ? MAT.snow : MAT.cliff) : MAT.cliff;
    this.group.visible = true;
    // shadow map around the ground below the explorer
    if (gl && this.shadows) this.renderShadows(gl, c, below.dir.clone().multiplyScalar(R), below.dir.clone(), cam);
    else MATERIALS.uRockOn.value = 0;
  }

  /** Sunlight through the air and the skylight at the rocks (as BODY_FRAG computes them for the ground). */
  private skyLight(u: Record<string, { value: unknown }>, up: Vector3, sunT: Vector3, sky: Vector3): void {
    sunT.set(1, 1, 1);
    sky.set(0, 0, 0);
    if (u.uAtmoColor && !u.uAtmo?.value) { sky.setScalar(0.08); return; }   // generated planets
    if (!u.uAtmo || (u.uAtmo.value as number) < 0.5) return;
    const mu = (u.uSunDir.value as Vector3).dot(up);
    const Rp = u.uRp.value as number;
    const column = (H: number) => {
      const c = Math.sqrt((1.5707963 * Rp) / H);
      if (mu >= 0) return (H * c) / ((c - 1) * mu + 1);
      const r0 = Rp * Math.sqrt(Math.max(0, 1 - mu * mu));
      return r0 < Rp ? 1e12 : H * 2 * c;
    };
    const cR = Math.min(column(u.uHR.value as number), 1e9), cM = Math.min(column(u.uHM.value as number), 1e9);
    const bR = u.uBetaR.value as Vector3, bM = u.uBetaMe.value as Vector3;
    const mars = u.uMatMode?.value === 2;
    const omega = mars ? [0.95, 0.85, 0.62] : [1, 1, 1];
    const m0 = Math.max(mu, 0) + 0.03 * Math.min(1, Math.max(0, (mu + 0.12) / 0.12));
    const day = Math.min(1, Math.max(0, (mu + 0.12) / 0.14));
    const out = [0, 0, 0], tr = [0, 0, 0];
    (['x', 'y', 'z'] as const).forEach((k, i) => {
      const tR = bR[k] * cR, tM = bM[k] * cM;
      const T = mu < -0.05 ? 0 : Math.exp(-(tR + tM));
      const wM = tM / Math.max(tR + tM, 1e-9);
      tr[i] = T;
      out[i] = (1 - T) * (0.5 + (0.8 * omega[i] - 0.5) * wM) * m0 * day;
    });
    sunT.set(tr[0], tr[1], tr[2]);
    sky.set(out[0], out[1], out[2]);
  }

  /**
   * The shadow map is laid out in the body-fixed frame (around the ground below the explorer, across
   * the sunlight and from above) and drawn again only when the explorer has moved, the Sun has
   * turned or the rocks have changed; each frame only the receivers' matrices follow the camera.
   */
  private renderShadows(gl: WebGLRenderer, c: NonNullable<TerrainPatch['current']>, centreBF: Vector3, upBF: Vector3, cam: UPos): void {
    const sunBF = c.sunBF;
    if (sunBF.dot(upBF) < -0.05) { MATERIALS.uRockOn.value = 0; return; }
    const st = this.shadowState;
    const redraw = !st.valid || st.fills !== this.fills || st.centre.distanceTo(centreBF) > 0.2 || st.sun.angleTo(sunBF) > 0.002;
    if (redraw) { st.centre.copy(centreBF); st.sun.copy(sunBF); st.up.copy(upBF); st.fills = this.fills; st.valid = true; }
    // body-fixed (u, v, depth) of a cascade covering +-E metres in one half of the target ...
    const projBF = (z: Vector3, out: Matrix4, depth: boolean, E: number, half: number) => {
      const x = new Vector3().crossVectors(Math.abs(z.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0), z).normalize();
      const y = new Vector3().crossVectors(z, x);
      const k = 1 / (2 * E);
      const o = st.centre;
      out.set(
        x.x * k * 0.5, x.y * k * 0.5, x.z * k * 0.5, (0.5 - o.dot(x) * k) * 0.5 + half * 0.5,
        y.x * k, y.y * k, y.z * k, 0.5 - o.dot(y) * k,
        depth ? z.x : 0, depth ? z.y : 0, depth ? z.z : 0, depth ? -o.dot(z) : 0,
        0, 0, 0, 1);
    };
    // ... applied to camera-relative world positions: world -> body-fixed first
    const toBF = new Matrix4().extractRotation(c.orient).transpose();
    const rel = c.upos.sub(cam, new Vector3());
    toBF.multiply(new Matrix4().makeTranslation(-rel.x, -rel.y, -rel.z));
    const [nearE, farE] = this.shadowReach;
    const M = MATERIALS;
    const set = (out: Matrix4, z: Vector3, depth: boolean, E: number, half: number) => { projBF(z, out, depth, E, half); out.multiply(toBF); };
    set(M.uRockShM.value, st.sun, true, nearE, 0);
    set(M.uRockShM1.value, st.sun, true, farE, 1);
    set(M.uRockAOM.value, st.up, false, nearE, 0);
    set(M.uRockAOM1.value, st.up, false, farE, 1);
    M.uRockMap.value = this.target.texture;
    M.uRockOn.value = 1;
    if (!redraw) return;
    this.shGroup.matrix.copy(this.group.matrix);
    this.shGroup.matrixWorldNeedsUpdate = true;
    this.shMeshes.forEach((s, i) => { s.count = this.meshes[i].count; });
    this.aoMeshes.forEach((s, i) => { s.count = this.meshes[i].count; });
    const prev = gl.getRenderTarget();
    const xr = gl.xr.enabled;
    const clear = new Color(), ca = gl.getClearAlpha();
    gl.getClearColor(clear);
    gl.xr.enabled = false;
    gl.setRenderTarget(this.target);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, false, false);
    // both passes in one target: R keeps the largest depth, G the strongest contact shading
    // (each cascade's matrices already map into its half of the target)
    for (const [mat, M0, M1, off] of [[this.shMat, M.uRockShM.value, M.uRockShM1.value, this.aoMeshes], [this.aoMat, M.uRockAOM.value, M.uRockAOM1.value, this.shMeshes]] as const) {
      for (const m of off) m.visible = false;
      const on = off === this.aoMeshes ? this.shMeshes : this.aoMeshes;
      for (const [k, Mk] of [M0, M1].entries()) {
        mat.uniforms.uM.value.copy(Mk);
        mat.uniforms.uLo.value = k * 0.5;
        // the far cascade only needs the large rocks (pebbles' shadows are under a pixel out there)
        if (k === 1) on.forEach((m, i) => { m.visible = i >= 2 * SHAPES; });
        gl.render(this.shScene, this.shCam);
      }
      for (const m of on) m.visible = true;
      for (const m of off) m.visible = true;
    }
    gl.setRenderTarget(prev);
    gl.setClearColor(clear, ca);
    gl.xr.enabled = xr;
  }

  /** Rocks per cell relative to the lunar maria (1): fewer on worlds with soil and plants. */
  private density(c: NonNullable<TerrainPatch['current']>): number {
    const u = c.material.uniforms;
    if (u.uType) {
      const t = u.uType.value as number;   // generated planet: 0 lava, 1 hot, 2 desert, 3 temperate, 4 ocean, 5 ice
      return t >= 6 ? 0 : [0.7, 1.0, 0.45, 0.2, 0.15, 0.25][t] ?? 0;
    }
    const mode = (u.uMatMode?.value as number) ?? 0;
    return mode === 1 ? 0.25 : mode === 2 ? 1.3 : mode === 3 ? 0.4 : 1.0;
  }

  /** Rock colour: `out` is the colour without a map, or a tint of the map's grey; `sat`: saturation kept, brightness. */
  private rockColour(c: NonNullable<TerrainPatch['current']>, out: Color, sat: { x: number; y: number }): void {
    const u = c.material.uniforms;
    if (u.uC3) { const v = u.uC3.value as Vector3; out.setRGB(v.x * 0.8, v.y * 0.8, v.z * 0.8); sat.x = 1; sat.y = 1; return; }
    const mode = (u.uMatMode?.value as number) ?? 0;
    const a = (u.uAlbedoScale?.value as number) ?? 0.12;
    // Earth: grey-brown rock whatever grows around it; Mars: dark basalt under a little dust;
    // ice worlds: blocks of the surface's ice; airless rock: the regolith's own colour, a little brighter
    if (mode === 1) { out.setRGB(1.25, 1.12, 0.98); sat.x = 0.15; sat.y = 1.1; }
    else if (mode === 2) { out.setRGB(0.95, 0.85, 0.75); sat.x = 0.5; sat.y = 0.75; }
    else if (mode === 3) { out.setRGB(1, 1, 1); sat.x = 1; sat.y = 0.95; }
    else { out.setRGB(1, 1, 1); sat.x = 1; sat.y = 1.08; }
    if (!u.uHasMap?.value) {
      if (mode === 1) out.setRGB(0.22, 0.2, 0.18);
      else if (mode === 2) out.setRGB(0.2, 0.13, 0.09);
      else if (mode === 3) out.setRGB(0.6, 0.62, 0.65);
      else {
        const col = u.uColor?.value as Vector3 | Color | undefined;
        const g = Math.min(0.3, Math.max(0.06, a * 1.1));
        if (col && 'x' in col) out.setRGB(col.x * a, col.y * a, col.z * a);
        else if (col) out.setRGB(col.r * a, col.g * a, col.b * a);
        else out.setRGB(g, g * 0.97, g * 0.94);
      }
    }
  }

  /** how far out a tier's rocks are drawn (m) */
  private reachOf(tier: Tier): number {
    return Math.max(tier.cell, this.vr ? tier.reachVr : tier.reach);
  }

  private makeCell(key: string, x: number, y: number, z: number, tier: Tier, density: number, lonLeftDeg: number, serial: number): RockCell {
    const s = tier.cell, seed = tier.seed;
    // patchy: strewn fields (around fresh craters, below outcrops) and nearly bare ground
    const cx = (x + 0.5) * s, cy = (y + 0.5) * s, cz = (z + 0.5) * s;
    const f = vnoise(cx / 70, cy / 70, cz / 70, 5) * 0.65 + vnoise(cx / 260, cy / 260, cz / 260, 9) * 0.35;
    const clump = 0.3 + 2.6 * Math.pow(Math.max(0, f - 0.4) / 0.6, 1.8);
    const mean = tier.perCell * density * clump;
    // Poisson count from the cell's hash
    let n = 0;
    for (let p = Math.exp(-mean), u = hash(x, y, z, seed), cum = p; u > cum && n < 40; ) { n++; p *= mean / n; cum += p; }
    const pos = new Float64Array(n * 3), data = new Float32Array(n * D);
    const t = this.terrain;
    const dir = new Vector3(), up = new Vector3(), e1 = new Vector3(), e2 = new Vector3(), tmp = new Vector3();
    const lon0 = (lonLeftDeg * Math.PI) / 180;
    const seaWorld = t.current?.material.uniforms.uMatMode?.value === 1;
    let m = 0;
    for (let i = 0; i < n; i++) {
      const hs = (j: number) => hash(x, y, z, seed + 13 * i + j);
      dir.set((x + hs(1)) * s, (y + hs(2)) * s, (z + hs(3)) * s).normalize();
      const gr = t.groundRadius(dir);
      if (!(gr > 0)) continue;
      // none on a sea (flat at the reference surface on a world with oceans)
      if (seaWorld && gr - baseRadius(t.current!.ground, dir) < 0.02) continue;
      // truncated power law: most small, a few large
      const lo = Math.pow(tier.min, -tier.slope), hi = Math.pow(tier.max, -tier.slope);
      const size = Math.pow(lo + (hi - lo) * hs(4), -1 / tier.slope);
      const stretch = 0.7 + 0.7 * hs(6);
      const height = (0.6 + 0.55 * hs(8)) * (size > 2 ? 0.8 : 1);
      // resting on the slope: the ground at the rock's edges gives the tilt and the lowest point
      up.copy(dir);
      let base = gr;
      if (size > 0.25) {
        e1.crossVectors(Math.abs(dir.z) < 0.9 ? tmp.set(0, 0, 1) : tmp.set(1, 0, 0), dir).normalize();
        e2.crossVectors(dir, e1);
        const r = 0.6 * size / gr;
        const h = [e1, e2].map((ax) => [1, -1].map((sg) => t.groundRadius(tmp.copy(dir).addScaledVector(ax, sg * r).normalize())));
        if (h.every((p) => p.every((v) => v > 0))) {
          base = Math.min(gr, h[0][0], h[0][1], h[1][0], h[1][1]);
          const dx = (h[0][0] - h[0][1]) / (2 * 0.6 * size), dy = (h[1][0] - h[1][1]) / (2 * 0.6 * size);
          // rocks do not stay on cliffs (they gather below them)
          const sl = Math.hypot(dx, dy);
          if (sl > 1.0 || (sl > 0.6 && hs(11) < (sl - 0.6) / 0.4)) continue;
          up.addScaledVector(e1, -dx).addScaledVector(e2, -dy).normalize();
        }
      }
      const rad = base;
      pos[m * 3] = dir.x * rad; pos[m * 3 + 1] = dir.y * rad; pos[m * 3 + 2] = dir.z * rad;
      const o = m * D;
      data[o] = size;
      data[o + 1] = hs(5) * Math.PI * 2;           // turn about the vertical
      data[o + 2] = stretch;
      data[o + 3] = height;
      data[o + 4] = Math.floor(hs(9) * SHAPES);    // shape
      data[o + 5] = up.x; data[o + 6] = up.y; data[o + 7] = up.z;
      data[o + 8] = 0.8 + 0.4 * hs(10);             // brightness
      data[o + 9] = t.sunClearance(tmp.copy(dir).multiplyScalar(rad).addScaledVector(up, size * height * 0.4).normalize());
      const lon = Math.atan2(dir.y, dir.x), lat = Math.asin(Math.max(-1, Math.min(1, dir.z)));
      let uu = (lon - lon0) / (2 * Math.PI);
      uu -= Math.floor(uu);
      data[o + 10] = uu; data[o + 11] = 0.5 + lat / Math.PI;
      data[o + 12] = gr - base;
      m++;
    }
    return { key, serial, pos, data, n: m, reach: this.reachOf(tier) };
  }

  /** Rebuild the instance matrices relative to the current origin. */
  private fill(): void {
    this.dirty = false;
    this.fills++;
    const counts = this.meshes.map(() => 0);
    const mtx = new Matrix4(), q = new Quaternion(), q2 = new Quaternion(), sc = new Vector3(), p = new Vector3(), up = new Vector3();
    const Y = new Vector3(0, 1, 0);
    const v4 = new Vector4();
    for (const c of this.cells.values()) {
      for (let i = 0; i < c.n; i++) {
        const o = i * D;
        // rocks near the edge of their tier's reach grow in (no popping as cells come and go)
        p.set(c.pos[i * 3], c.pos[i * 3 + 1], c.pos[i * 3 + 2]);
        const fd = p.distanceTo(this.lastCam) / c.reach;
        const grow = fd < 0.8 ? 1 : Math.max(0, 1 - (fd - 0.8) / 0.2);
        if (grow <= 0.02) continue;
        const size = c.data[o] * grow;
        const k = c.data[o + 4] + (c.data[o] > BIG ? 2 * SHAPES : c.data[o] > SMALL ? SHAPES : 0);
        const mesh = this.meshes[k];
        if (counts[k] >= mesh.instanceMatrix.count) continue;
        up.set(c.data[o + 5], c.data[o + 6], c.data[o + 7]);
        q.setFromUnitVectors(Y, up).multiply(q2.setFromAxisAngle(Y, c.data[o + 1]));
        sc.set(size * c.data[o + 2], size * c.data[o + 3], size);
        // sunk into the ground: a third of its (half-)height, more for small stones
        const sink = (size < 0.15 ? 0.45 : 0.3) * sc.y * 0.7;
        // (a rock growing in rests nearer the ground at its centre, its footprint being smaller)
        p.multiplyScalar(1 + (c.data[o + 12] * (1 - grow)) / p.length());
        p.sub(this.origin).addScaledVector(up, -sink);
        mtx.compose(p, q, sc);
        const j = counts[k]++;
        mesh.setMatrixAt(j, mtx);
        v4.set(c.data[o + 10], c.data[o + 11], c.data[o + 9], c.data[o + 8]);
        (mesh.geometry.attributes.aRock as InstancedBufferAttribute).setXYZW(j, v4.x, v4.y, v4.z, v4.w);
      }
    }
    this.meshes.forEach((m, k) => {
      m.count = counts[k];
      m.instanceMatrix.needsUpdate = true;
      m.geometry.attributes.aRock.needsUpdate = true;
    });
  }

  /** Rock material and a mesh, for compiling the shader up front. */
  warmupObjects(): InstancedMesh[] {
    return [this.meshes[0]];
  }
}
