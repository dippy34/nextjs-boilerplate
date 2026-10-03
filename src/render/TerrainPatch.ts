import { BufferAttribute, BufferGeometry, Group, Matrix3, Matrix4, Mesh, NoBlending, ShaderMaterial, Vector3 } from 'three';
import type { UPos } from '../core/upos';
import { baseRadius, type Ground } from '../universe/Terrain';
import { ATMO_HAZE_FRAG } from './shaders/atmosphere';
import { FIX_LOGDEPTH, PROJECT_PARS } from './shaders/xr';

/** A world near the explorer that could get terrain this frame (offered by the body layers). */
export interface TerrainCandidate {
  ground: Ground;
  /** the world's surface material (its uniforms are shared with the terrain's) */
  material: ShaderMaterial;
  upos: UPos;
  /** centre relative to the camera (m) */
  rel: Vector3;
  /** body-fixed -> world rotation */
  orient: Matrix4;
  /** longitude of the map's left edge (degrees), for map coordinates */
  lonLeft: number;
  /** body-fixed direction of the star */
  sunBF: Vector3;
  /** altitude above the reference surface (m) */
  alt: number;
  /** the material of the world's atmosphere shell, if it has one (render/Atmospheres.ts) */
  air?: ShaderMaterial | null;
}

/**
 * Draw order: the atmosphere shell (19.8, render/Atmospheres.ts), then the terrain over it, then the
 * terrain's own haze, then cockpits and HUDs (20+). The terrain is in the transparent pass (drawn
 * opaque) only so that it can come after the shell.
 */
const ORDER_TERRAIN = 19.9;
const ORDER_HAZE = 19.95;

/**
 * Vertex shader of the landing terrain: vertices are stored relative to the patch origin on the
 * reference surface, and raised along their direction by the height (scaled in on approach).
 */
export const TERRAIN_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute vec3 aN;      // body-fixed unit direction
attribute vec3 aTN;     // body-fixed normal of the full-height terrain
attribute float aH;     // height above the reference surface (m)
attribute vec2 aUv;     // map coordinates
attribute float aSun;   // clearance of the Sun over the surrounding relief, in penumbra widths (lit above -0.5)
uniform float uHScale;
varying vec3 vNormalBF;
varying vec3 vTerrN;
varying float vSun;
varying vec3 vLocal;
varying vec3 vPosView;
varying vec2 vUv;
void main() {
  vNormalBF = aN;
  vLocal = position;
  vTerrN = aTN;
  vSun = aSun;
  vUv = aUv;
  vec3 pos = position + aN * (aH * uHScale);
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vPosView = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

const RINGS = 150;
const SEGS = 96;
/** cell sizes (m) of the shader's fine crater lattices (body.ts uOI0..3 / uOF0..3) */
const FINE_CELLS = [400, 90, 20, 4.5];

/** One built patch: a polar grid centred under the explorer. */
interface Built {
  mesh: Mesh;
  ground: Ground | null;
  up: Vector3;        // body-fixed unit direction of the centre
  origin: Vector3;    // body-fixed position of the centre on the reference surface (m)
  outer: number;      // radius of the patch (m along the surface)
  inner: number;      // radius of the first ring (m)
  q: number;          // ratio of successive ring radii
  e: Vector3;         // body-fixed tangent axes at the centre (phi = 0 and 90 degrees)
  nrt: Vector3;
  full: Float64Array; // full-height vertex positions relative to the origin (for shadows)
  sunBF: Vector3;     // body-fixed Sun direction the shadows were computed for
  version: number;    // the ground's height version it was built with
}

function makeGeometry(): BufferGeometry {
  const nv = 1 + RINGS * SEGS;
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('aN', new BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('aTN', new BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('aH', new BufferAttribute(new Float32Array(nv), 1));
  g.setAttribute('aUv', new BufferAttribute(new Float32Array(nv * 2), 2));
  g.setAttribute('aSun', new BufferAttribute(new Float32Array(nv).fill(1), 1));
  const idx: number[] = [];
  const v = (k: number, s: number) => 1 + k * SEGS + (s % SEGS);
  for (let s = 0; s < SEGS; s++) idx.push(0, v(0, s), v(0, s + 1));
  for (let k = 0; k < RINGS - 1; k++) {
    for (let s = 0; s < SEGS; s++) {
      idx.push(v(k, s), v(k + 1, s), v(k + 1, s + 1), v(k, s), v(k + 1, s + 1), v(k, s + 1));
    }
  }
  g.setIndex(idx);
  return g;
}

/**
 * Real 3D ground under the explorer near a solid world: a polar grid (rings from tens of
 * centimetres out past the horizon) on the body's reference surface, raised by TerrainSource
 * heights (elevation models + generated relief) and drawn with the body's own material, so maps,
 * close-up tiles and lighting match. The body's sphere is cut away under it (uHoleDir/uHoleCos).
 *
 * Building a patch takes tens of milliseconds, so it is done a few rings per frame into a
 * second mesh, which replaces the visible one when complete.
 */
export class TerrainPatch {
  readonly group = new Group();
  private front: Built;
  private back: Built;
  private job: Generator<void, void, void> | null = null;
  /** the running job builds the back patch (swap when done) rather than re-shading the front */
  private jobSwaps = false;
  private materials = new Map<ShaderMaterial, ShaderMaterial>();
  private hazeMaterials = new Map<ShaderMaterial, ShaderMaterial>();
  /** the atmosphere over the visible patch (its geometry, the haze material) */
  private haze = new Mesh();
  /** the material whose sphere has the hole cut in it */
  private holed: ShaderMaterial | null = null;
  /** the world being drawn, with this frame's placement */
  current: TerrainCandidate | null = null;
  /** height scale (0 = smooth sphere, 1 = full relief): fades the relief in on descent */
  hScale = 0;
  /** milliseconds of building per frame (desktop, headset) */
  budgetMs = 4;
  budgetVrMs = 2;
  /** presenting to a headset (smaller per-frame budget) */
  vr = false;

  constructor() {
    const mk = (): Built => {
      const mesh = new Mesh(makeGeometry());
      mesh.matrixAutoUpdate = false;
      mesh.frustumCulled = false;
      mesh.visible = false;
      mesh.renderOrder = ORDER_TERRAIN;
      mesh.name = 'terrain';
      return { mesh, ground: null, up: new Vector3(), origin: new Vector3(), outer: 0, inner: 0, q: 1, e: new Vector3(), nrt: new Vector3(),
        full: new Float64Array((1 + RINGS * SEGS) * 3), sunBF: new Vector3(), version: 0 };
    };
    this.front = mk();
    this.back = mk();
    this.group.name = 'terrain';
    this.haze.matrixAutoUpdate = false;
    this.haze.frustumCulled = false;
    this.haze.visible = false;
    this.haze.renderOrder = ORDER_HAZE;
    this.haze.name = 'terrain haze';
    this.group.add(this.front.mesh, this.back.mesh, this.haze);
  }

  /** The world (Body or ExoPlanet) the visible patch belongs to. */
  get owner(): object | null {
    return this.front.mesh.visible ? this.front.ground?.owner ?? null : null;
  }

  /** altitude (m above the reference surface) below which a world gets terrain */
  static threshold(g: { radius: number }): number {
    return Math.max(40e3, g.radius * 0.03);
  }

  /**
   * Material for the patch: the world's own uniforms, plus the terrain switches. One per world,
   * kept (not disposed) so the shader program stays compiled.
   */
  private materialFor(bodyMat: ShaderMaterial): ShaderMaterial {
    let m = this.materials.get(bodyMat);
    if (!m) {
      m = new ShaderMaterial({
        name: 'terrain',
        vertexShader: TERRAIN_VERT,
        fragmentShader: bodyMat.fragmentShader,
        uniforms: {
          ...bodyMat.uniforms, uTerrain: { value: 1 }, uHScale: { value: 0 }, uHoleDir: { value: new Vector3() }, uHoleCos: { value: 2 },
          ...Object.fromEntries(FINE_CELLS.flatMap((_, k) => [[`uOI${k}`, { value: new Vector3() }], [`uOF${k}`, { value: new Vector3() }]])),
        },
        // opaque, but in the transparent pass so it is drawn after the atmosphere shell
        transparent: true, blending: NoBlending,
      });
      this.materials.set(bodyMat, m);
    }
    return m;
  }

  /** Haze material for an atmosphere shell: its uniforms, over the terrain's geometry (heights scaled as drawn). */
  private hazeFor(air: ShaderMaterial, terrainMat: ShaderMaterial): ShaderMaterial {
    let m = this.hazeMaterials.get(air);
    if (!m) {
      m = new ShaderMaterial({
        name: 'terrain-haze',
        vertexShader: TERRAIN_VERT,
        fragmentShader: ATMO_HAZE_FRAG,
        uniforms: { ...air.uniforms, uHScale: terrainMat.uniforms.uHScale },
        transparent: true, depthWrite: false,
        blending: air.blending, blendSrc: air.blendSrc, blendDst: air.blendDst,
      });
      this.hazeMaterials.set(air, m);
    }
    m.uniforms.uHScale = terrainMat.uniforms.uHScale;
    return m;
  }

  /** A hidden mesh with the haze shader, for compiling it ahead of time (any shell will do). */
  warmupHaze(air: ShaderMaterial): Mesh {
    const m = new Mesh(this.back.mesh.geometry, this.hazeFor(air, new ShaderMaterial({ uniforms: { uHScale: { value: 0 } } })));
    m.visible = false;
    m.frustumCulled = false;
    this.group.add(m);
    return m;
  }

  /** A hidden mesh with the terrain shader of `bodyMat`'s kind, for compiling it ahead of time. */
  warmupMesh(bodyMat: ShaderMaterial): Mesh {
    const mat = this.materialFor(bodyMat);
    let m = this.group.children.find((o) => o !== this.front.mesh && o !== this.back.mesh && (o as Mesh).material === mat) as Mesh | undefined;
    if (!m) {
      m = new Mesh(this.back.mesh.geometry, mat);
      m.visible = false;
      m.frustumCulled = false;
      this.group.add(m);
    }
    return m;
  }

  /**
   * Per frame, with the nearest world that could have terrain (or null). Builds and places the
   * patch and cuts the hole in that world's sphere.
   */
  update(c: TerrainCandidate | null): void {
    const hole = c ? this.place(c) : (this.hide(), null);
    this.current = hole ? c : null;
    const mat = hole ? c!.material : null;
    if (this.holed && this.holed !== mat) this.holed.uniforms.uHoleCos.value = 2;
    this.holed = mat;
    if (hole && mat) {
      (mat.uniforms.uHoleDir.value as Vector3).copy(hole.dir);
      mat.uniforms.uHoleCos.value = hole.cos;
    }
  }

  private place(c: TerrainCandidate): { dir: Vector3; cos: number } | null {
    const b = c.ground;
    const camBF = cameraBodyFixed(c.rel, c.orient);
    const up = camBF.clone().normalize();
    const alt = camBF.length() - baseRadius(b, up);
    const th = TerrainPatch.threshold(b);
    if (alt > th || !b.ready()) { this.hide(); return null; }
    b.prepare?.(up);
    const mat = this.materialFor(c.material);
    this.hScale = Math.min(1, Math.max(0, (th - alt) / (th * 0.35)));
    mat.uniforms.uHScale.value = this.hScale;

    // patch size: past the horizon over the highest relief, but well short of a hemisphere
    const outer = Math.min(b.radius * 0.45, 500e3, Math.max(20e3, 1.3 * Math.sqrt(2 * b.radius * (Math.max(alt, 0) + 2 * b.amplitude))));
    const inner = Math.max(0.25, Math.max(alt, 0) * 0.025);

    // start a new patch when this one is off-centre, the wrong size or for another world
    const f = this.front;
    const need = f.ground !== b || !f.mesh.visible || f.version !== (b.version?.() ?? 0)
      || f.up.angleTo(up) * b.radius > Math.max(2 * Math.max(alt, 0), 25)
      || outer > f.outer * 1.3 || outer < f.outer * 0.6 || inner > f.inner * 4 || inner < f.inner * 0.25;
    if (need && (!this.job || !this.jobSwaps)) {
      this.job = this.build(this.back, b, up, outer, inner, c.lonLeft, c.sunBF.clone());
      this.jobSwaps = true;
    } else if (!this.job && f.ground === b && f.mesh.visible && f.sunBF.angleTo(c.sunBF) > 0.004) {
      // the star has moved (the world turns): shadows again
      this.job = this.shadows(f, b, c.sunBF.clone());
      this.jobSwaps = false;
    }
    if (this.job) {
      const t0 = performance.now();
      const budget = this.vr ? this.budgetVrMs : this.budgetMs;
      while (performance.now() - t0 < budget) {
        if (this.job.next().done) {
          this.job = null;
          if (!this.jobSwaps) break;
          const old = this.front;
          this.front = this.back;
          this.back = old;
          this.back.mesh.visible = false;
          this.front.mesh.visible = true;
          break;
        }
      }
    }
    const fr = this.front;
    if (!fr.mesh.visible || fr.ground !== b) return null;
    fr.mesh.material = mat;
    // fine crater lattices at this patch's origin: integer cells + fraction (computed in double)
    const seed = Number(mat.uniforms.uSeed?.value ?? 0);
    FINE_CELLS.forEach((L, k) => {
      const off = seed * 7.31 * (k + 1);
      const v = [fr.origin.x / L + off, fr.origin.y / L + off * 1.7, fr.origin.z / L + off * 2.3];
      const iv = v.map(Math.floor);
      (mat.uniforms[`uOI${k}`].value as Vector3).set(iv[0], iv[1], iv[2]);
      (mat.uniforms[`uOF${k}`].value as Vector3).set(v[0] - iv[0], v[1] - iv[1], v[2] - iv[2]);
    });
    const m4 = fr.mesh.matrix.copy(c.orient);
    const o = fr.origin.clone().applyMatrix4(new Matrix4().extractRotation(c.orient)).add(c.rel);
    m4.setPosition(o);
    fr.mesh.matrixWorldNeedsUpdate = true;
    // the atmosphere over it, marched to the ground actually there
    this.haze.visible = !!c.air;
    if (c.air) {
      this.haze.geometry = fr.mesh.geometry;
      this.haze.material = this.hazeFor(c.air, mat);
      this.haze.matrix.copy(m4);
      this.haze.matrixWorldNeedsUpdate = true;
    }
    // the sphere is cut away inside 96 % of the patch (the patch fades to the reference surface)
    return { dir: fr.up, cos: Math.cos((fr.outer * 0.96) / b.radius) };
  }

  hide(): void {
    this.front.mesh.visible = false;
    this.back.mesh.visible = false;
    this.haze.visible = false;
    this.job = null;
    this.front.ground = null;
  }

  /** Ground radius (m from the centre of the current world) below body-fixed direction `n`, as drawn. */
  groundRadius(n: Vector3): number {
    const f = this.front;
    const b = f.ground;
    if (!b) return 0;
    const base = baseRadius(b, n);
    if (!f.mesh.visible) return base;
    // the mesh only carries features larger than its local vertex spacing
    const spacing = Math.max(f.inner, f.up.angleTo(n) * b.radius * Math.max(f.q - 1, (2 * Math.PI) / SEGS));
    return base + b.height(n, spacing) * this.hScale * this.fade(b, n);
  }

  /**
   * The camera relative to the current world's drawn ground: body-fixed unit direction from the
   * centre, distance from the centre and the ground's radius there (m); null without terrain.
   */
  below(cam: UPos): { dir: Vector3; dist: number; ground: number; centre: UPos } | null {
    const c = this.current;
    if (!c) return null;
    const camBF = cameraBodyFixed(c.upos.sub(cam, new Vector3()), c.orient);
    const dist = camBF.length();
    const dir = camBF.divideScalar(dist);
    return { dir, dist, ground: this.groundRadius(dir), centre: c.upos };
  }

  /** relief fades out over the outer part of the patch, reaching the reference surface at 94 % */
  private fade(b: Ground, n: Vector3): number {
    const d = this.front.up.angleTo(n) * b.radius / this.front.outer;
    const t = Math.min(1, Math.max(0, (d - 0.82) / 0.12));
    return 1 - t * t * (3 - 2 * t);
  }

  private *build(t: Built, b: Ground, up: Vector3, outer: number, inner: number, lonLeftDeg: number, sunBF: Vector3): Generator<void, void, void> {
    t.mesh.visible = false;
    t.ground = b;
    t.version = b.version?.() ?? 0;
    t.up.copy(up);
    t.outer = outer;
    t.inner = inner;
    const R = b.radius;
    t.origin.copy(up).multiplyScalar(baseRadius(b, up));
    const e = t.e.crossVectors(new Vector3(0, 0, 1), up);
    if (e.lengthSq() < 1e-10) e.set(1, 0, 0);
    e.normalize();
    const nrt = t.nrt.crossVectors(up, e);
    const g = t.mesh.geometry;
    const pos = g.attributes.position as BufferAttribute;
    const aN = g.attributes.aN as BufferAttribute;
    const aTN = g.attributes.aTN as BufferAttribute;
    const aH = g.attributes.aH as BufferAttribute;
    const aUv = g.attributes.aUv as BufferAttribute;
    const nv = 1 + RINGS * SEGS;
    const full = t.full;
    const q = Math.pow(outer / inner, 1 / (RINGS - 1));
    t.q = q;
    const lon0 = (lonLeftDeg * Math.PI) / 180;
    const dir = new Vector3();
    const put = (i: number, rho: number, phi: number, spacing: number) => {
      const a = rho / R;
      const c = Math.cos(phi), s = Math.sin(phi);
      dir.set(e.x * c + nrt.x * s, e.y * c + nrt.y * s, e.z * c + nrt.z * s).multiplyScalar(Math.sin(a)).addScaledVector(up, Math.cos(a)).normalize();
      const base = baseRadius(b, dir);
      const d = rho / outer;
      const ft = Math.min(1, Math.max(0, (d - 0.82) / 0.12));
      const h = b.height(dir, spacing) * (1 - ft * ft * (3 - 2 * ft));
      pos.setXYZ(i, dir.x * base - t.origin.x, dir.y * base - t.origin.y, dir.z * base - t.origin.z);
      full[i * 3] = dir.x * (base + h) - t.origin.x;
      full[i * 3 + 1] = dir.y * (base + h) - t.origin.y;
      full[i * 3 + 2] = dir.z * (base + h) - t.origin.z;
      aN.setXYZ(i, dir.x, dir.y, dir.z);
      aH.setX(i, h);
      const lon = Math.atan2(dir.y, dir.x), lat = Math.asin(Math.max(-1, Math.min(1, dir.z)));
      let u = (lon - lon0) / (2 * Math.PI);
      u -= Math.floor(u);
      aUv.setXY(i, u, 0.5 + lat / Math.PI);
    };
    put(0, 0, 0, inner);
    for (let k = 0; k < RINGS; k++) {
      const rho = inner * Math.pow(q, k);
      const spacing = Math.max(rho * (q - 1), (2 * Math.PI * rho) / SEGS);
      for (let s = 0; s < SEGS; s++) put(1 + k * SEGS + s, rho, (s / SEGS) * 2 * Math.PI, spacing);
      if (k % 4 === 3) yield;
    }
    // map coordinate continuous across the map's seam within the patch
    const u0 = aUv.getX(0);
    for (let i = 0; i < nv; i++) {
      const u = aUv.getX(i);
      if (u - u0 > 0.5) aUv.setX(i, u - 1);
      else if (u0 - u > 0.5) aUv.setX(i, u + 1);
    }
    // normals of the full-height surface from neighbouring vertices
    const P = (i: number) => new Vector3(full[i * 3], full[i * 3 + 1], full[i * 3 + 2]);
    const vi = (k: number, s: number) => (k < 0 ? 0 : 1 + k * SEGS + (((s % SEGS) + SEGS) % SEGS));
    const n = new Vector3();
    for (let k = 0; k < RINGS; k++) {
      for (let s = 0; s < SEGS; s++) {
        const i = vi(k, s);
        const radial = P(vi(Math.min(k + 1, RINGS - 1), s)).sub(P(vi(k - 1, s)));
        const tang = P(vi(k, s + 1)).sub(P(vi(k, s - 1)));
        n.crossVectors(radial, tang).normalize();
        const d = new Vector3(aN.getX(i), aN.getY(i), aN.getZ(i));
        if (n.dot(d) < 0) n.negate();
        aTN.setXYZ(i, n.x, n.y, n.z);
      }
      if (k % 16 === 15) yield;
    }
    // centre: average of the first ring
    n.set(0, 0, 0);
    for (let s = 0; s < SEGS; s++) n.add(new Vector3(aTN.getX(1 + s), aTN.getY(1 + s), aTN.getZ(1 + s)));
    n.normalize();
    aTN.setXYZ(0, n.x, n.y, n.z);
    for (const a of [pos, aN, aTN, aH, aUv]) a.needsUpdate = true;
    yield* this.shadows(t, b, sunBF);
  }

  /**
   * Shadows cast by the relief: from each vertex, march towards the Sun over the patch's own
   * heights and keep the fraction of the Sun's disk that clears the terrain (soft at the edges).
   */
  private *shadows(t: Built, b: Ground, sunBF: Vector3): Generator<void, void, void> {
    t.sunBF.copy(sunBF);
    const g = t.mesh.geometry;
    const aSun = g.attributes.aSun as BufferAttribute;
    const aH = g.attributes.aH as BufferAttribute;
    const H = aH.array as Float32Array;
    const full = t.full;
    const R = b.radius;
    const lnq = Math.log(t.q);
    const up = t.up, e = t.e, nrt = t.nrt, o = t.origin;
    const sx = sunBF.x, sy = sunBF.y, sz = sunBF.z;
    const ring = (k: number, sf: number): number => {
      const s0 = Math.floor(sf), fs = sf - s0;
      const a = H[1 + k * SEGS + (((s0 % SEGS) + SEGS) % SEGS)], c = H[1 + k * SEGS + (((s0 + 1) % SEGS + SEGS) % SEGS)];
      return a + (c - a) * fs;
    };
    const dq = new Vector3();
    // height of the ground (m from the centre) in direction dq; NaN outside the patch
    const ground = (): number => {
      const cu = dq.x * up.x + dq.y * up.y + dq.z * up.z;
      const cx = dq.y * up.z - dq.z * up.y, cy = dq.z * up.x - dq.x * up.z, cz = dq.x * up.y - dq.y * up.x;
      const rho = Math.atan2(Math.sqrt(cx * cx + cy * cy + cz * cz), cu) * R;
      if (rho >= t.outer * 0.94) return NaN;
      const sf = ((Math.atan2(dq.dot(nrt), dq.dot(e)) / (2 * Math.PI)) * SEGS + SEGS) % SEGS;
      let h: number;
      if (rho < t.inner) h = H[0] + (ring(0, sf) - H[0]) * (rho / t.inner);
      else {
        const kf = Math.log(rho / t.inner) / lnq;
        const k0 = Math.min(RINGS - 1, Math.floor(kf)), k1 = Math.min(RINGS - 1, k0 + 1);
        const fk = Math.min(1, kf - k0);
        h = ring(k0, sf) + (ring(k1, sf) - ring(k0, sf)) * fk;
      }
      return baseR + h;
    };
    let baseR = 0;
    let hMax = -Infinity;
    for (let i = 0; i < H.length; i++) if (H[i] > hMax) hMax = H[i];
    const nv = 1 + RINGS * SEGS;
    const vis_ = new Float32Array(nv);
    const PEN = 0.016;      // angular width of the penumbra (rad): the Sun's disk, softened
    const CLEAR = 2;        // clearance kept (penumbra widths): enough to place the edge
    for (let i = 0; i < nv; i++) {
      const px = o.x + full[i * 3], py = o.y + full[i * 3 + 1], pz = o.z + full[i * 3 + 2];
      const rP = Math.sqrt(px * px + py * py + pz * pz);
      // Sun below the local horizon: the shading is dark already
      if ((px * sx + py * sy + pz * sz) / rP < -0.05) { vis_[i] = CLEAR; continue; }
      const k = i === 0 ? 0 : Math.floor((i - 1) / SEGS);
      const rho = i === 0 ? 0 : t.inner * Math.pow(t.q, k);
      const spacing = Math.max(t.inner, rho * Math.max(t.q - 1, (2 * Math.PI) / SEGS));
      // the smallest clearance angle of the ray towards the Sun over the ground, in penumbra
      // widths and clamped: a signed distance to the shadow edge, interpolated across the
      // triangles and thresholded per pixel (sharper, straighter edges than a 0..1 visibility)
      let vis = CLEAR;
      for (let d = spacing * 2; d < t.outer * 2; d *= 1.45) {
        const qx = px + sx * d, qy = py + sy * d, qz = pz + sz * d;
        const rQ = Math.sqrt(qx * qx + qy * qy + qz * qz);
        dq.set(qx / rQ, qy / rQ, qz / rQ);
        baseR = baseRadius(b, dq);
        if (rQ - baseR > hMax) break;            // above the highest ground in the patch
        const gr = ground();
        if (Number.isNaN(gr)) break;
        vis = Math.min(vis, ((rQ - gr) / d + 0.003) / PEN);
        if (vis <= -CLEAR) { vis = -CLEAR; break; }
      }
      vis_[i] = vis;
      if (i % 700 === 699) yield;
    }
    // soften: each vertex with its ring and spoke neighbours (ray-march noise)
    const at = (k: number, sIdx: number) => vis_[1 + k * SEGS + (((sIdx % SEGS) + SEGS) % SEGS)];
    aSun.setX(0, vis_[0]);
    for (let k = 0; k < RINGS; k++) {
      for (let sIdx = 0; sIdx < SEGS; sIdx++) {
        const inward = k === 0 ? vis_[0] : at(k - 1, sIdx);
        const outward = k === RINGS - 1 ? at(k, sIdx) : at(k + 1, sIdx);
        aSun.setX(1 + k * SEGS + sIdx, (2 * at(k, sIdx) + inward + outward + at(k, sIdx - 1) + at(k, sIdx + 1)) / 6);
      }
    }
    aSun.needsUpdate = true;
  }
}

/** Body-fixed camera position for a body: camera relative to the centre, rotated into the body frame. */
export function cameraBodyFixed(bodyRel: Vector3, orient: Matrix4): Vector3 {
  const inv = new Matrix3().setFromMatrix4(orient).transpose();
  return bodyRel.clone().negate().applyMatrix3(inv);
}
