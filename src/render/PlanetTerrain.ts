import {
  BufferAttribute, BufferGeometry, Group, Matrix3, Matrix4, Mesh, NoBlending, Quaternion, ShaderMaterial, Sphere, Vector3,
} from 'three';
import type { UPos } from '../core/upos';
import type { Body } from '../universe/Body';
import { ExoGround } from '../universe/ExoTerrain';
import { baseRadius, type Ground, type TerrainSource } from '../universe/Terrain';
import { heightSpec, type HeightSpec } from '../universe/TerrainHeights';
import {
  buildTile, childToward, dirFace, faceDir, SUN_CLEAR, skirtMasks, TILE_N, TILE_VERTS, tileGroundRadius, tileIndices, tileRect, tileSpacing,
  type TileData, type TileRequest, tileValue,
} from '../universe/TerrainTiles';
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
 * terrain's own haze, then clouds, cockpits and HUDs. The terrain is in the transparent pass (drawn
 * opaque) only so that it can come after the shell.
 */
const ORDER_TERRAIN = 19.9;
const ORDER_HAZE = 19.95;
/** cell sizes (m) of the shader's fine crater lattices (body.ts uOI0..3 / uOF0..3) */
const FINE_CELLS = [400, 90, 20, 4.5];

/**
 * Vertex shader of the planet terrain tiles. Positions are relative to the tile's centre (placed
 * by the model matrix, camera-relative); `aMorph` is the parent tile's shape at the same vertices,
 * blended to the tile's own by `uMorph` as it appears (geomorphing: no popping). The close-up weight
 * `vHScale` (ground materials, relief normals and shadows of the surface shaders, which read it as
 * uHScale) falls off with the distance from the eye, so the far terrain is shaded like the globe.
 */
export const TILE_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute vec3 aMorph;  // the parent's shape at this vertex (relative to the tile centre)
attribute vec3 aN;      // body-fixed unit direction
attribute vec3 aTN;     // body-fixed surface normal (and the parent's, aTNc)
attribute vec3 aTNc;
attribute vec2 aUv;     // map coordinates
attribute float aSun;   // clearance of the Sun over the relief, in penumbra widths (lit above -0.5)
uniform float uMorph;
uniform mat3 uToBF;     // world -> body-fixed rotation
uniform vec3 uORel;     // camera-relative world position of the terrain origin (ground below the eye)
uniform float uNearT;   // distance (m) within which the close-up shading fades in
varying vec3 vNormalBF;
varying vec3 vTerrN;
varying float vSun;
varying vec3 vLocal;
varying vec3 vPosView;
varying vec2 vUv;
varying vec3 vGround;
varying float vHScale;
void main() {
  vec3 pos = mix(aMorph, position, uMorph);
  vNormalBF = aN;
  vTerrN = normalize(mix(aTNc, aTN, uMorph));
  vSun = aSun;
  vUv = aUv;
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vPosView = wp.xyz;
  vec3 g = uToBF * (wp.xyz - uORel);
  vLocal = g;
  vGround = g;
  vHScale = clamp((uNearT - length(wp.xyz)) / (0.35 * uNearT), 0.0, 1.0);
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

/** The surface shader of a world, reading the close-up weight per vertex instead of per draw. */
export function tileFragment(frag: string): string {
  return frag
    .replace(/uniform float uHScale;[^\n]*/, 'varying float vHScale;\n#define uHScale vHScale')
    // the sphere's hole test never applies to the terrain (uTerrain = 1), and a `discard` anywhere in
    // a shader turns off early depth rejection: every hidden hillside and skirt would be shaded in full
    .replace(/if \(uTerrain < 0\.5 && dot\(nB, uHoleDir\) > uHoleCos\) discard;/, '');
}

/** What the surface shaders need besides the world's own uniforms (shared by all tiles). */
const TILE_UNIFORMS = {
  uMorph: { value: 1 },
  uToBF: { value: new Matrix3() },
  uORel: { value: new Vector3() },
  uNearT: { value: 40e3 },
};

let workerSeq = 0;

class Node {
  kids: Node[] | null = null;
  data: TileData | null = null;
  mesh: Mesh | null = null;
  haze: Mesh | null = null;
  /** job in flight */
  job = 0;
  /** rebuild wanted (heights or the star moved); the old data stays drawn meanwhile */
  stale = false;
  /** geomorph: 0 = the parent's shape, 1 = the tile's own */
  m = 0;
  /** the children are drawn instead of this tile */
  split = false;
  /** frame it was last visited */
  used = 0;
  /** bumped each time the tile is (re)built (for the ground-under-explorer change signal) */
  build = 0;
  /** drawn this frame */
  drawn = false;
  readonly dir = new Vector3();
  /** angle (rad) from the centre direction to the farthest corner */
  readonly ang: number;
  /** body-fixed direction of the star its shadows were made for */
  readonly sunBF = new Vector3();
  shaded = false;
  constructor(readonly face: number, readonly level: number, readonly x: number, readonly y: number, readonly parent: Node | null) {
    const [s0, t0, w] = tileRect(level, x, y);
    faceDir(face, s0 + w / 2, t0 + w / 2, this.dir);
    let a = 0;
    const c = new Vector3();
    for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) a = Math.max(a, this.dir.angleTo(faceDir(face, s0 + i * w, t0 + j * w, c)));
    this.ang = a;
  }
}

interface World {
  ground: Ground;
  id: number;
  /** heights version (Ground.version and the headset variant) */
  version: string;
  roots: Node[];
  /** tiles with data */
  tiles: Set<Node>;
  /** highest ground (m above the reference surface) and the radius of a sphere inside all ground */
  hTop: number;
  rMin: number;
  rMax: number;
}

/**
 * Planet-wide level-of-detail terrain: on the nearest solid world, a quadtree on the six faces of a
 * cube projected onto it, refined where the eye is near (tiles of 32 x 32 cells, split when a cell
 * spans more than a few pixels), built in Web Workers from the same heights as the old landing
 * patch (TerrainSource / ExoGround: global elevation models, regional patches, generated relief).
 * From orbit the whole globe is real relief with mountains on the limb; on descent tiles split
 * and morph in from their parents' shapes, down to centimetre-scale cells at the explorer's feet.
 *
 * The tiles are drawn with the world's own surface material (maps, close-up tiles, eclipses), the
 * close-up ground materials fading in with distance; the world's sphere is cut away entirely
 * while the terrain covers it. Same API as the old TerrainPatch.
 */
export class PlanetTerrain {
  readonly group = new Group();
  /** the world being drawn, with this frame's placement */
  current: TerrainCandidate | null = null;
  /** close-up weight at the explorer (0 high up, 1 near the ground): things on the ground show at 1 */
  hScale = 0;
  /** presenting to a headset (fewer, coarser tiles) */
  vr = false;
  /** counts changes of the drawn ground near the explorer: things placed on it re-place themselves */
  serial = 0;
  /** the Solar System's heights (render/Bodies.ts terrainSource), for building tiles in workers */
  source: TerrainSource | null = null;
  /** the view (App.view): direction and pixel size, for refinement */
  view: { quat: Quaternion; pixelAngle: number; pixelRatio?: number; fovY?: number; aspect?: number } | null = null;
  /** pixels per grid cell before a tile splits (desktop, headset) */
  pixPerCell = 18;
  pixPerCellVr = 24;
  /** tiles in flight (and so finished + uploaded) per frame: bounds the per-frame refinement cost */
  inFlight = 8;
  inFlightVr = 4;
  /** tiles drawn at once, about (see lodScale): bounds the draw count at any altitude */
  drawCap = 96;
  drawCapVr = 72;
  /**
   * scale on the split threshold, raised while the selection runs into `drawCap` and eased back
   * when it is well under: the threshold rises evenly over the view, rather than the cap starving
   * whatever the walk reaches last (the far field, behind the deep column under the explorer)
   */
  lodScale = 1;
  /** most tiles kept (desktop, headset) */
  maxTiles = 420;
  maxTilesVr = 200;
  /** milliseconds of tile building per frame on the main thread (only without workers) */
  budgetMs = 4;
  budgetVrMs = 2;
  /** finest vertex spacing (m) */
  minSpacing = 2.0;
  /** statistics of the last frame */
  stats = { drawn: 0, tiles: 0, pending: 0, built: 0, level: 0 };

  private world: World | null = null;
  private materials = new Map<ShaderMaterial, ShaderMaterial>();
  private hazeMaterials = new Map<ShaderMaterial, ShaderMaterial>();
  private holed: ShaderMaterial | null = null;
  /** index buffers by skirt mask (bit e: a skirt on edge e, which borders a coarser drawn tile) */
  private indices = Array.from({ length: 16 }, (_, m) => new BufferAttribute(tileIndices(m), 1));
  private workers: Worker[] = [];
  private busy: number[] = [];
  private jobs = new Map<number, { node: Node; world: World; worker: number; serialAtStart: number }>();
  private jobSeq = 0;
  private frame = 0;
  /** this frame's column under the explorer: direction (body-fixed) and the level wanted there */
  private chainDir = new Vector3();
  private chainLevel = 0;
  private groundKey = '';
  private drawn: Node[] = [];
  private lastT = performance.now();
  private anchor = { ground: null as Ground | null, pos: new Vector3(), e: new Vector3(1, 0, 0), n: new Vector3(0, 1, 0), up: new Vector3(0, 0, 1) };
  private warm: Mesh | null = null;

  constructor() {
    this.group.name = 'planet terrain';
    if (typeof Worker !== 'undefined') {
      const hc = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
      const n = Math.max(1, Math.min(4, hc - 1));
      for (let i = 0; i < n; i++) {
        try {
          const w = new Worker(new URL('../workers/terrainTiles.worker.ts', import.meta.url), { type: 'module', name: `terrain-${workerSeq++}` });
          const k = i;
          w.onmessage = (ev) => this.receive(k, ev.data as Parameters<PlanetTerrain['receive']>[1]);
          this.workers.push(w);
          this.busy.push(0);
        } catch { /* no workers: built on the main thread */ }
      }
    }
  }

  /** The world (Body or ExoPlanet) the drawn terrain belongs to. */
  get owner(): object | null {
    return this.current ? this.current.ground.owner : null;
  }

  /** distance (m) within which the close-up ground shading and the rocks come in (the old landing threshold) */
  static threshold(g: { radius: number }): number {
    return Math.max(40e3, g.radius * 0.03);
  }

  /** altitude (m above the reference surface) below which a world is drawn as terrain */
  static reach(g: { radius: number }): number {
    return Math.max(2 * g.radius, 200e3);
  }

  // ------------------------------------------------------------------------------ materials

  private materialFor(bodyMat: ShaderMaterial): ShaderMaterial {
    let m = this.materials.get(bodyMat);
    if (!m) {
      m = new ShaderMaterial({
        name: 'terrain-tile',
        vertexShader: TILE_VERT,
        fragmentShader: tileFragment(bodyMat.fragmentShader),
        // the body shader compiles its terrain-only code (ground materials, relief, rocks' light)
        // under #ifdef TERRAIN (shaders/body.ts)
        defines: { ...bodyMat.defines, TERRAIN: 1 },
        uniforms: {
          ...bodyMat.uniforms, ...TILE_UNIFORMS, uTerrain: { value: 1 }, uHoleDir: { value: new Vector3() }, uHoleCos: { value: 2 },
          uTanE: { value: new Vector3(1, 0, 0) }, uTanN: { value: new Vector3(0, 1, 0) }, uMatO: { value: new Vector3() },
          ...Object.fromEntries(FINE_CELLS.flatMap((_, k) => [[`uOI${k}`, { value: new Vector3() }], [`uOF${k}`, { value: new Vector3() }]])),
        },
        // opaque, but in the transparent pass so it is drawn after the atmosphere shell
        transparent: true, blending: NoBlending,
      });
      this.materials.set(bodyMat, m);
    }
    return m;
  }

  private hazeFor(air: ShaderMaterial): ShaderMaterial {
    let m = this.hazeMaterials.get(air);
    if (!m) {
      m = new ShaderMaterial({
        name: 'terrain-tile-haze',
        vertexShader: TILE_VERT,
        fragmentShader: ATMO_HAZE_FRAG,
        uniforms: { ...air.uniforms, ...TILE_UNIFORMS },
        transparent: true, depthWrite: false,
        blending: air.blending, blendSrc: air.blendSrc, blendDst: air.blendDst,
      });
      this.hazeMaterials.set(air, m);
    }
    return m;
  }

  private warmGeometry(): BufferGeometry {
    if (!this.warm) {
      const z = (k: number) => new Float32Array(TILE_VERTS * k);
      const g = this.geometry({ centre: [0, 0, 0], pos: z(3), morph: z(3), n: z(3), tn: z(3), tnc: z(3), uv: z(2), sun: z(1), h: z(1), hMin: 0, hMax: 0, bound: 1, spacing: 1 });
      this.warm = new Mesh(g);
    }
    return this.warm.geometry;
  }

  /** A hidden mesh with the terrain shader of `bodyMat`'s kind, for compiling it ahead of time. */
  warmupMesh(bodyMat: ShaderMaterial): Mesh {
    const m = new Mesh(this.warmGeometry(), this.materialFor(bodyMat));
    m.visible = false;
    m.frustumCulled = false;
    this.group.add(m);
    return m;
  }

  /** A hidden mesh with the haze shader, for compiling it ahead of time (any shell will do). */
  warmupHaze(air: ShaderMaterial): Mesh {
    const m = new Mesh(this.warmGeometry(), this.hazeFor(air));
    m.visible = false;
    m.frustumCulled = false;
    this.group.add(m);
    return m;
  }

  // ------------------------------------------------------------------------------ per frame

  /** Per frame, with the nearest world that could have terrain (or null). */
  update(c: TerrainCandidate | null): void {
    const now = performance.now();
    const dt = Math.min(0.25, (now - this.lastT) / 1000);
    this.lastT = now;
    this.frame++;
    const ok = c ? this.place(c, dt) : false;
    if (!ok) this.hideAll();
    this.current = ok ? c : null;
    const mat = ok ? c!.material : null;
    if (this.holed && this.holed !== mat) this.holed.uniforms.uHoleCos.value = 2;
    this.holed = mat;
    // the terrain covers the whole world: its sphere is cut away entirely
    if (mat) mat.uniforms.uHoleCos.value = -2;
  }

  private hideAll(): void {
    for (const n of this.drawn) { n.drawn = false; if (n.mesh) n.mesh.visible = false; if (n.haze) n.haze.visible = false; }
    this.drawn = [];
    this.hScale = 0;
  }

  private worldFor(g: Ground): World | null {
    const version = `${g.version?.() ?? 0}:${(g as { lite?: boolean }).lite ? 1 : 0}`;
    let w = this.world;
    if (w && w.ground !== g) { this.dropWorld(w); w = this.world = null; }
    if (!g.ready()) return w;
    if (!w) {
      // (null: a kind of world the workers do not know; built on the main thread)
      const spec = heightSpec(g, this.source);
      const id = ++this.jobSeq;
      const roots: Node[] = [];
      for (let f = 0; f < 6; f++) roots.push(new Node(f, 0, 0, 0, null));
      const tops = topOf(g, spec);
      w = this.world = { ground: g, id, version, roots, tiles: new Set(), hTop: tops.hTop, rMin: tops.rMin, rMax: tops.rMax };
      (w as World & { spec: HeightSpec | null }).spec = spec;
      if (spec) for (const wk of this.workers) wk.postMessage({ type: 'spec', id, spec });
    } else if (w.version !== version) {
      // sharper heights arrived: rebuild every tile (the old ones stay drawn meanwhile)
      w.version = version;
      const spec = heightSpec(g, this.source);
      (w as World & { spec: HeightSpec | null }).spec = spec;
      if (spec) for (const wk of this.workers) wk.postMessage({ type: 'spec', id: w.id, spec });
      for (const n of w.tiles) n.stale = true;
    }
    return w;
  }

  private dropWorld(w: World): void {
    for (const n of w.tiles) this.freeNode(n);
    w.tiles.clear();
    for (const wk of this.workers) wk.postMessage({ type: 'drop', id: w.id });
    for (const [k, j] of this.jobs) if (j.world === w) this.jobs.delete(k);
    this.drawn = [];
  }

  private place(c: TerrainCandidate, dt: number): boolean {
    const g = c.ground;
    const camBF = cameraBodyFixed(c.rel, c.orient);
    const D = camBF.length();
    const up = camBF.clone().divideScalar(D);
    const alt = D - baseRadius(g, up);
    if (alt > PlanetTerrain.reach(g) * 1.05) return false;
    g.prepare?.(up);
    const w = this.worldFor(g);
    if (!w) return false;
    const th = PlanetTerrain.threshold(g);
    this.hScale = Math.min(1, Math.max(0, (th - alt) / (th * 0.35)));
    const mat = this.materialFor(c.material);

    // ---- refinement
    // pixel size in CSS pixels (device pixels would quadruple the tiles on a high-density screen)
    const pa = (this.view?.pixelAngle ?? 1e-3) * (this.vr ? 1 : this.view?.pixelRatio ?? 1);
    // height above the ground actually drawn (last frame's tiles)
    const altG = this.drawn.length ? D - this.groundRadius(up) : alt;
    const P = this.vr ? this.pixPerCellVr : this.pixPerCell;
    const rot = new Matrix3().setFromMatrix4(c.orient);
    const toBF = rot.clone().transpose();
    const viewW = new Vector3(0, 0, -1);
    if (this.view) viewW.applyQuaternion(this.view.quat);
    const viewBF = viewW.clone().applyMatrix3(toBF).normalize();
    const halfFov = this.vr ? 1.2 : Math.max(0.6, Math.atan(Math.tan(((this.view?.fovY ?? 50) * Math.PI) / 360) * Math.max(1, this.view?.aspect ?? 1.8)) + 0.1);
    const rOcc = this.occluder(w, up, D);
    const horEye = Math.acos(Math.min(1, rOcc / D));
    const want: { n: Node; p: number }[] = [];
    const sel: Node[] = [];
    const sunBF = c.sunBF;
    const R = g.radius;
    const tmp = new Vector3();
    const frame = this.frame;
    const minSp = this.minSpacing * (this.vr ? 1.6 : 1);
    const drawCap = this.vr ? this.drawCapVr : this.drawCap;
    let ready = true;
    // beyond the horizon of a sphere that lies under all ground near the eye (horizon culling)
    const visible = (n: Node) => D <= rOcc
      || n.dir.angleTo(up) - n.ang < horEye + Math.acos(Math.min(1, rOcc / (w.rMax + (n.data ? n.data.hMax : w.hTop))));
    const errorOf = (n: Node): { sse: number; inView: boolean } => {
      // distance from the eye to the tile's bounds
      let cx: number, cy: number, cz: number, rb: number;
      if (n.data) { [cx, cy, cz] = n.data.centre; rb = n.data.bound; }
      else { const r = baseRadius(g, n.dir); cx = n.dir.x * r; cy = n.dir.y * r; cz = n.dir.z * r; rb = n.ang * r * 1.05 + w.hTop; }
      tmp.set(cx - camBF.x, cy - camBF.y, cz - camBF.z);
      const dc = tmp.length();
      const d = Math.max(dc - rb, Math.max(altG, 0.2) * 0.5);
      const inView = dc < rb * 1.2 || tmp.dot(viewBF) / dc > Math.cos(Math.min(Math.PI, halfFov + Math.atan(rb / dc)));
      return { sse: tileSpacing(R, n.level) / d / pa, inView };
    };
    const walk = (n: Node, merging: boolean): void => {
      n.used = frame;
      if (!visible(n)) { n.m = n.level === 0 ? 1 : 0; this.mergeAway(n); return; }
      if (!n.data) { ready = false; return; }
      if (n.stale && !n.job) want.push({ n, p: 0.5 });
      const { sse, inView } = errorOf(n);
      const lim = (inView ? P : P * 3) * (n.split ? 0.8 : 1) * this.lodScale;
      // (the tile under the explorer always refines: the cap only trims the surroundings)
      // (`lodScale` keeps the count near `drawCap` evenly; this hard stop only bounds a runaway)
      const canSplit = tileSpacing(R, n.level) * 0.5 >= minSp && n.level < 24 && (sel.length < drawCap * 1.5 || this.holds(n, up));
      const wantSplit = !merging && canSplit && sse > lim;
      if (wantSplit) {
        if (!n.kids) n.kids = [0, 1, 2, 3].map((q) => new Node(n.face, n.level + 1, n.x * 2 + (q & 1), n.y * 2 + (q >> 1), n));
        let all = true;
        for (const k of n.kids) {
          k.used = frame;
          if (!k.data && visible(k)) {
            all = false;
            if (!k.job) want.push({ n: k, p: sse * (inView ? 4 : 1) });
          }
        }
        if (all) {
          if (!n.split) { n.split = true; for (const k of n.kids) k.m = 0; }
          // nearest first, so the draw budget goes to what is close
          for (const k of [...n.kids].sort((a, b) => a.dir.angleTo(up) - b.dir.angleTo(up))) walk(k, false);
          return;
        }
      } else if (n.split && n.kids) {
        // merging back: the children morph to this tile's shape first
        let done = true;
        for (const k of n.kids) if (k.data && visible(k) && (k.m > 0 || k.split)) done = false;
        if (!done) { for (const k of n.kids) walk(k, true); return; }
      }
      n.split = false;
      // draw this tile
      n.m = merging ? Math.max(0, n.m - dt / 0.35) : Math.min(1, n.m + dt / 0.45);
      sel.push(n);
    };
    for (const r of w.roots) {
      r.used = frame;
      if (!r.data) { ready = false; if (!r.job) want.push({ n: r, p: 1e9 }); }
    }
    // walk the face under the explorer first, so the detail budget (drawCap) goes to what is nearest
    const order = [...w.roots].sort((a, b) => a.dir.angleTo(up) - b.dir.angleTo(up));
    if (ready) for (const r of order) walk(r, false);
    if (ready) {
      if (sel.length > drawCap) this.lodScale = Math.min(16, this.lodScale * 1.05);
      else if (sel.length < drawCap * 0.8) this.lodScale = Math.max(1, this.lodScale / 1.03);
    }
    // the star has moved since a tile's shadows were made: rebuild it (near the terminator only)
    if (ready) {
      for (const n of sel) {
        if (n.stale || n.job || n.sunBF.angleTo(sunBF) < 0.006) continue;
        const elev = Math.asin(Math.max(-1, Math.min(1, n.dir.dot(sunBF))));
        if (n.shaded || (elev - n.ang * 1.5 < 0.6 && elev + n.ang * 1.5 > -0.08)) { n.stale = true; want.push({ n, p: 0.1 }); }
        else n.sunBF.copy(sunBF);
      }
    }
    // ---- requests
    want.sort((a, b) => b.p - a.p);
    // the column under the explorer is built down to the detail wanted there in one worker job
    {
      const target = Math.max(pa * P * Math.max(altG, 0.2) * 0.5, minSp);
      this.chainLevel = Math.max(0, Math.min(24, Math.ceil(Math.log2((R * Math.PI) / 2 / TILE_N / target))));
      this.chainDir.copy(up);
    }
    // the next missing tile of the column under the explorer goes first, with a reserved slot
    let column: Node | null = null;
    if (ready) {
      let node = w.roots[dirFace(up).face];
      while (node.data && node.level < this.chainLevel) {
        if (!node.kids) node.kids = [0, 1, 2, 3].map((q) => new Node(node.face, node.level + 1, node.x * 2 + (q & 1), node.y * 2 + (q >> 1), node));
        const ct = childToward(node, up);
        const k = node.kids.find((x) => x.x === ct.x && x.y === ct.y)!;
        k.used = frame;
        if (!k.data) { if (!k.job) column = k; break; }
        node = k;
      }
    }
    this.dispatch(w, want.map((x) => x.n), c, sunBF, column);
    this.stats.pending = this.jobs.size;
    if (!ready) return false;

    // ---- draw
    for (const n of this.drawn) n.drawn = false;
    for (const n of sel) n.drawn = true;
    for (const n of this.drawn) if (!n.drawn) { if (n.mesh) n.mesh.visible = false; if (n.haze) n.haze.visible = false; }
    this.drawn = sel;
    const rel = c.rel;
    // aerial perspective over the terrain matters within the atmosphere; from orbit the shell (drawn
    // behind, render/Atmospheres.ts) covers the limb, so no per-tile haze draws there
    const air = c.air && alt < 160e3 ? this.hazeFor(c.air) : null;
    let deepest = 0;
    // near tiles first: the terrain is in the transparent pass (after the atmosphere shell), which
    // three sorts back to front; drawn far first, every hillside hidden behind a nearer one would
    // be shaded in full and then overwritten. Ranked by the distance to each tile's bounds.
    const byNear = sel.map((n) => {
      const [x, y, z] = n.data!.centre;
      return { n, d: Math.hypot(x - camBF.x, y - camBF.y, z - camBF.z) - n.data!.bound };
    }).sort((a, b) => a.d - b.d);
    byNear.forEach((e, i) => { e.n.mesh!.renderOrder = ORDER_TERRAIN + i * 1e-5; });
    // skirts only where a tile borders one of another level (TerrainTiles.skirtMasks)
    const masks = skirtMasks(sel);
    for (let i = 0; i < sel.length; i++) {
      const n = sel[i], mask = masks[i];
      const g = n.mesh!.geometry;
      if (g.index !== this.indices[mask]) g.setIndex(this.indices[mask]);
    }
    for (const n of sel) {
      deepest = Math.max(deepest, n.level);
      const mesh = n.mesh!;
      mesh.material = mat;
      const [x, y, z] = n.data!.centre;
      tmp.set(x, y, z).applyMatrix3(rot).add(rel);
      // headset: a cone around the view (three's frustum test uses the runtime's finite far plane,
      // while the shaders pull far geometry in)
      let inCone = true;
      if (this.vr) {
        const dc = tmp.length(), rb = n.data!.bound;
        inCone = dc < rb * 1.5 || tmp.dot(viewW) / dc > Math.cos(Math.min(Math.PI, halfFov + Math.asin(Math.min(1, rb / dc))));
      }
      mesh.visible = inCone;
      if (!inCone) { if (n.haze) n.haze.visible = false; continue; }
      mesh.matrix.copy(c.orient).setPosition(tmp);
      mesh.matrixWorldNeedsUpdate = true;
      mesh.frustumCulled = !this.vr;
      if (air) {
        if (!n.haze) {
          n.haze = new Mesh(mesh.geometry, air);
          n.haze.matrixAutoUpdate = false;
          n.haze.renderOrder = ORDER_HAZE;
          n.haze.name = 'terrain haze';
          n.haze.onBeforeRender = mesh.onBeforeRender;
          this.group.add(n.haze);
        }
        n.haze.material = air;
        n.haze.visible = true;
        n.haze.matrix.copy(mesh.matrix);
        n.haze.matrixWorldNeedsUpdate = true;
        n.haze.frustumCulled = mesh.frustumCulled;
      } else if (n.haze) n.haze.visible = false;
    }
    this.stats.drawn = sel.length;
    this.stats.tiles = w.tiles.size;
    this.stats.level = deepest;

    // ---- shared uniforms: the terrain origin below the eye, material anchors
    const O = up.clone().multiplyScalar(baseRadius(g, up));
    TILE_UNIFORMS.uToBF.value.copy(toBF);
    TILE_UNIFORMS.uORel.value.copy(O).applyMatrix3(rot).add(rel);
    TILE_UNIFORMS.uNearT.value = PlanetTerrain.threshold(g);
    const seed = Number(mat.uniforms.uSeed?.value ?? 0);
    FINE_CELLS.forEach((L, k) => {
      const off = seed * 7.31 * (k + 1);
      const v = [O.x / L + off, O.y / L + off * 1.7, O.z / L + off * 2.3];
      const iv = v.map(Math.floor);
      (mat.uniforms[`uOI${k}`].value as Vector3).set(iv[0], iv[1], iv[2]);
      (mat.uniforms[`uOF${k}`].value as Vector3).set(v[0] - iv[0], v[1] - iv[1], v[2] - iv[2]);
    });
    // ground material axes: a fixed anchor near the explorer (moved only after travelling far), so
    // the textures stay put on the ground
    const an = this.anchor;
    if (an.ground !== g || an.pos.distanceTo(O) > 40e3) {
      an.ground = g; an.pos.copy(O); an.up.copy(up);
      an.e.crossVectors(new Vector3(0, 0, 1), up);
      if (an.e.lengthSq() < 1e-10) an.e.set(1, 0, 0);
      an.e.normalize();
      an.n.crossVectors(up, an.e);
    }
    (mat.uniforms.uTanE.value as Vector3).copy(an.e);
    (mat.uniforms.uTanN.value as Vector3).copy(an.n);
    const dO = O.clone().sub(an.pos);
    (mat.uniforms.uMatO.value as Vector3).set(dO.dot(an.e), dO.dot(an.n), dO.dot(an.up));
    // things scattered on the ground (render/Rocks.ts, within a few hundred metres) re-place when the
    // ground they stand on changes: the drawn tiles near the explorer are swapped or rebuilt, or one
    // of them finishes morphing in — not on every distant tile, nor on every frame of a morph
    let key = '';
    if (this.hScale > 0) {
      const reach = 400;
      for (const n of sel) {
        const [x, y, z] = n.data!.centre;
        if (Math.hypot(x - camBF.x, y - camBF.y, z - camBF.z) - n.data!.bound > reach + Math.max(altG, 0)) continue;
        key += `${n.face}:${n.level}:${n.x}:${n.y}:${n.build}:${Math.round(n.m * 4)},`;
      }
    }
    if (key !== this.groundKey) { this.groundKey = key; this.serial++; }
    if (this.hScale > 0) this.updateLocalAlbedo(g, c.material, up, c.lonLeft);
    this.evict(w);
    return true;
  }

  /**
   * Radius of a sphere below all ground around the eye, for horizon culling: a sight line that
   * dips into it does so within its tangent length of the eye, so it suffices that the sphere is
   * under the ground within that distance. The deepest built tile under the eye whose area holds
   * that disk gives its lowest ground (less a margin); else the lowest ground of the world.
   */
  private occluder(w: World, up: Vector3, D: number): number {
    const f = dirFace(up);
    let node: Node | null = w.roots[f.face];
    const chain: Node[] = [];
    while (node?.data) {
      chain.push(node);
      if (!node.kids) break;
      const [s0, t0, wd] = tileRect(node.level, node.x, node.y);
      node = node.kids[(f.t >= t0 + wd / 2 ? 2 : 0) + (f.s >= s0 + wd / 2 ? 1 : 0)];
    }
    const base = baseRadius(w.ground, up);
    for (let i = chain.length - 1; i >= 1; i--) {
      const n = chain[i];
      const sp = tileSpacing(w.ground.radius, n.level);
      const r = base + n.data!.hMin - (sp * 2 + 50);
      if (r >= D) continue;
      const [s0, t0, wd] = tileRect(n.level, n.x, n.y);
      const gi = (f.s - s0) / wd, gj = (f.t - t0) / wd;
      const room = Math.min(gi, 1 - gi, gj, 1 - gj) * sp * TILE_N * 0.8;
      if (Math.sqrt(D * D - r * r) < room) return r;
    }
    return w.rMin;
  }

  /** a tile no longer needed in view: its children are dropped from the drawn state */
  private mergeAway(n: Node): void {
    n.split = false;
  }

  // ------------------------------------------------------------------------------ building

  private reqOf(w: World, n: Node, sunBF: Vector3, lonLeftDeg: number): TileRequest {
    const p = n.parent;
    return {
      face: n.face, level: n.level, x: n.x, y: n.y, radii: [...w.ground.radii], radius: w.ground.radius,
      sun: [sunBF.x, sunBF.y, sunBF.z], lonLeft: (lonLeftDeg * Math.PI) / 180, hTop: w.hTop,
      parent: p?.data ? { pos: p.data.pos, tn: p.data.tn, centre: p.data.centre, qx: n.x & 1, qy: n.y & 1 } : null,
      minSpacing: 0,
    };
  }

  /**
   * Send this frame's most-wanted tiles to the workers, bounded by how many may be in flight at
   * once (also the cap on tiles finished — and uploaded — per frame, so a frame never hitches on a
   * flood of new geometry). Accepted immediately as each worker reports back, so a built tile is
   * never re-requested while it waits in a queue.
   */
  private dispatch(w: World, nodes: Node[], c: TerrainCandidate, sunBF: Vector3, column: Node | null = null): void {
    if (column) nodes = [column, ...nodes.filter((n) => n !== column)];
    const spec = (w as World & { spec: HeightSpec | null }).spec;
    if (!this.workers.length || !spec) {
      // no workers: build a few tiles on the main thread within a small time budget
      const t0 = performance.now();
      for (const n of nodes) {
        if (performance.now() - t0 > (this.vr ? this.budgetVrMs : this.budgetMs)) break;
        const data = buildTile(this.reqOf(w, n, sunBF, c.lonLeft), (d, sp) => w.ground.height(d, sp));
        n.sunBF.copy(sunBF);
        this.accept(w, n, data);
      }
      return;
    }
    const cap = this.vr ? this.inFlightVr : this.inFlight;
    // (one slot beyond the cap is kept for the column under the explorer)
    let free = cap - this.jobs.size + (column ? 1 : 0);
    for (const n of nodes) {
      if (free <= 0) break;
      if (n.job || (n.data && !n.stale)) continue;
      let k = -1;
      for (let i = 0; i < this.workers.length; i++) if (k < 0 || this.busy[i] < this.busy[k]) k = i;
      const job = ++this.jobSeq;
      n.job = job;
      n.sunBF.copy(sunBF);
      this.busy[k]++;
      free--;
      this.jobs.set(job, { node: n, world: w, worker: k, serialAtStart: 0 });
      const req = this.reqOf(w, n, sunBF, c.lonLeft);
      if (!n.data && this.chainLevel > n.level + 1 && this.holds(n, this.chainDir)) {
        req.chain = { dir: [this.chainDir.x, this.chainDir.y, this.chainDir.z], level: Math.min(this.chainLevel, n.level + 6) };
      }
      this.workers[k].postMessage({ type: 'tile', job, id: w.id, req });
    }
  }

  /** whether tile `n` holds body-fixed direction `d` */
  private holds(n: Node, d: Vector3): boolean {
    const f = dirFace(d);
    if (f.face !== n.face) return false;
    const [s0, t0, w] = tileRect(n.level, n.x, n.y);
    return f.s >= s0 && f.s <= s0 + w && f.t >= t0 && f.t <= t0 + w;
  }

  private receive(worker: number, msg: { job: number; data: TileData | null; chain?: { level: number; x: number; y: number; data: TileData }[] }): void {
    this.busy[worker] = Math.max(0, this.busy[worker] - 1);
    const j = this.jobs.get(msg.job);
    if (!j) return;
    this.jobs.delete(msg.job);
    const n = j.node;
    if (n.job !== msg.job) return;
    n.job = 0;
    if (!msg.data || j.world !== this.world) return;
    this.accept(j.world, n, msg.data);
    // the column below it, built in the same job
    // (entries come level by level, the four children of one tile each; descend into the parent's
    // child that has the next level's tiles)
    const byKey = new Map<string, Node>([[`${n.level}:${n.x}:${n.y}`, n]]);
    for (const c of msg.chain ?? []) {
      const parent = byKey.get(`${c.level - 1}:${c.x >> 1}:${c.y >> 1}`);
      if (!parent) continue;
      if (!parent.kids) parent.kids = [0, 1, 2, 3].map((q) => new Node(parent.face, parent.level + 1, parent.x * 2 + (q & 1), parent.y * 2 + (q >> 1), parent));
      const kid = parent.kids.find((k) => k.x === c.x && k.y === c.y);
      if (!kid) continue;
      kid.used = this.frame;
      if (!kid.data && !kid.job) { kid.sunBF.copy(n.sunBF); this.accept(j.world, kid, c.data); }
      byKey.set(`${c.level}:${c.x}:${c.y}`, kid);
    }
  }

  private accept(w: World, n: Node, data: TileData): void {
    const fresh = !n.data;
    // a drawn tile rebuilt (sharper heights, the star moved): morph from the shape it had, so the
    // ground never jumps under the explorer (walking follows groundRadius, which follows the morph)
    const old = n.data;
    if (old && n.drawn && old.pos.length === data.pos.length) {
      const dx = old.centre[0] - data.centre[0], dy = old.centre[1] - data.centre[1], dz = old.centre[2] - data.centre[2];
      const mo = data.morph, op = old.pos, oc = old.morph, m0 = n.m;
      for (let i = 0; i < mo.length; i += 3) {
        // the shape drawn this frame (old tile at its current morph), in the new tile's frame
        mo[i] = oc[i] + (op[i] - oc[i]) * m0 + dx;
        mo[i + 1] = oc[i + 1] + (op[i + 1] - oc[i + 1]) * m0 + dy;
        mo[i + 2] = oc[i + 2] + (op[i + 2] - oc[i + 2]) * m0 + dz;
      }
      data.tnc.set(old.tn);
      data.bound = Math.max(data.bound, old.bound + Math.hypot(dx, dy, dz));
      n.m = 0;
    }
    n.data = data;
    n.stale = false;
    let shaded = false;
    for (let i = 0; i < data.sun.length; i++) if (data.sun[i] < SUN_CLEAR) { shaded = true; break; }
    n.shaded = shaded;
    if (n.mesh) {
      this.fill(n.mesh.geometry, data);
    } else {
      const mesh = new Mesh(this.geometry(data));
      mesh.matrixAutoUpdate = false;
      mesh.visible = false;
      mesh.renderOrder = ORDER_TERRAIN;
      mesh.name = 'terrain tile';
      // the morph weight is the only per-tile uniform; flag a re-upload only when it actually
      // changes (three skips re-uploading a shared material's uniforms otherwise), so in the
      // steady state (every drawn tile fully morphed to 1) the heavy uniform set uploads once
      mesh.onBeforeRender = (_r, _s, _c, _g, material) => {
        const u = (material as ShaderMaterial).uniforms;
        if (u?.uMorph && u.uMorph.value !== n.m) {
          u.uMorph.value = n.m;
          (material as ShaderMaterial).uniformsNeedUpdate = true;
        }
      };
      n.mesh = mesh;
      this.group.add(mesh);
    }
    if (fresh) w.tiles.add(n);
    n.build++;
    this.stats.built++;
  }

  private geometry(d: TileData): BufferGeometry {
    const g = new BufferGeometry();
    g.setIndex(this.indices[15]);
    g.setAttribute('position', new BufferAttribute(d.pos, 3));
    g.setAttribute('aMorph', new BufferAttribute(d.morph, 3));
    g.setAttribute('aN', new BufferAttribute(d.n, 3));
    g.setAttribute('aTN', new BufferAttribute(d.tn, 3));
    g.setAttribute('aTNc', new BufferAttribute(d.tnc, 3));
    g.setAttribute('aUv', new BufferAttribute(d.uv, 2));
    g.setAttribute('aSun', new BufferAttribute(d.sun, 1));
    g.boundingSphere = new Sphere(new Vector3(), d.bound);
    return g;
  }

  /** Copy a built tile into an existing geometry's attributes in place (no buffer reallocation). */
  private fill(g: BufferGeometry, d: TileData): void {
    const set = (name: string, src: Float32Array) => {
      const a = g.attributes[name] as BufferAttribute;
      (a.array as Float32Array).set(src);
      a.needsUpdate = true;
    };
    set('position', d.pos); set('aMorph', d.morph); set('aN', d.n); set('aTN', d.tn);
    set('aTNc', d.tnc); set('aUv', d.uv); set('aSun', d.sun);
    (g.boundingSphere ??= new Sphere()).radius = d.bound;
    g.boundingSphere.center.set(0, 0, 0);
  }

  private freeNode(n: Node): void {
    if (n.mesh) { this.group.remove(n.mesh); n.mesh.geometry.dispose(); n.mesh = null; }
    if (n.haze) { this.group.remove(n.haze); n.haze = null; }
    n.data = null;
    n.split = false;
    n.m = 0;
    n.drawn = false;
    if (n.job) { this.jobs.delete(n.job); n.job = 0; }
  }

  /** Free tiles not visited for a while when over the budget (never the roots). */
  private evict(w: World): void {
    const cap = this.vr ? this.maxTilesVr : this.maxTiles;
    if (w.tiles.size <= cap) return;
    const old = [...w.tiles].filter((n) => n.level > 0 && n.used < this.frame - 30 && !n.drawn).sort((a, b) => a.used - b.used || b.level - a.level);
    for (const n of old) {
      if (w.tiles.size <= cap * 0.9) break;
      // a tile goes with all of its descendants
      const drop = (x: Node) => {
        if (x.kids) for (const k of x.kids) drop(k);
        x.kids = null;
        if (x.data) w.tiles.delete(x);
        this.freeNode(x);
      };
      drop(n);
      if (n.parent && n.parent.kids && n.parent.kids.every((k) => !k.data && !k.kids && !k.job)) { n.parent.kids = null; n.parent.split = false; }
    }
  }

  // ------------------------------------------------------------------------------ queries

  /** the finest drawn (or else built) tile holding body-fixed direction n */
  private leafAt(n: Vector3): Node | null {
    const w = this.world;
    if (!w) return null;
    const f = dirFace(n);
    let node = w.roots[f.face];
    if (!node.data) return null;
    while (node.split && node.kids) {
      const [s0, t0, wd] = tileRect(node.level, node.x, node.y);
      const k = node.kids[(f.t >= t0 + wd / 2 ? 2 : 0) + (f.s >= s0 + wd / 2 ? 1 : 0)];
      if (!k.data) break;
      node = k;
    }
    return node;
  }

  /** Ground radius (m from the centre of the current world) below body-fixed direction `n`, as drawn. */
  /**
   * The albedo the eye adapts to near the ground: the world's mean `mean`, moved most of the way
   * towards the map's own brightness under the explorer (bright fresh craters, snowfields, salt
   * flats are not shown blown out, nor dark plains too dark), as the close-up shading fades in.
   */
  exposureAlbedo(mean: number): number {
    const a = this.local.albedo;
    if (a === null || !this.current || !(a > 0) || !(mean > 0)) return mean;
    // (the map's brightness here relative to its average over the world, applied to the world's albedo)
    const ratio = Math.min(6, Math.max(0.2, a));
    return mean * Math.pow(ratio, 0.75 * this.hScale);
  }

  /** the map's brightness under the explorer relative to its world average (null: unknown) */
  private local = { albedo: null as number | null, ground: null as Ground | null, at: new Vector3(), frame: -1e9 };

  /** Read the colour map around body-fixed direction `up` (a small average) as a relative albedo, now and then. */
  private updateLocalAlbedo(g: Ground, mat: ShaderMaterial, up: Vector3, lonLeftDeg: number): void {
    const L = this.local;
    // again after moving a few km (or to another world), at most every 30 frames
    if (L.ground === g && (L.at.angleTo(up) * g.radius < 3000 || this.frame - L.frame < 30)) return;
    L.ground = g; L.at.copy(up); L.frame = this.frame; L.albedo = null;
    const u = mat.uniforms;
    const tex = u.uMap?.value as { image?: CanvasImageSource & { width: number; height: number }; flipY?: boolean } | null;
    const img = tex?.image;
    if (!img || !u.uHasMap?.value || !(img.width > 0) || typeof document === 'undefined') return;
    let uu = (Math.atan2(up.y, up.x) - (lonLeftDeg * Math.PI) / 180) / (2 * Math.PI);
    uu -= Math.floor(uu);
    const vv = 0.5 + Math.asin(Math.max(-1, Math.min(1, up.z))) / Math.PI;
    // (a texture uploaded without flipping holds an image already stored bottom row first)
    const x = uu, y = tex.flipY === false ? vv : 1 - vv;
    try {
      const c = PlanetTerrain.probe ??= document.createElement('canvas');
      c.width = c.height = 4;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      const n = Math.max(2, Math.round(img.width / 1024));   // ~0.1 % of the map across: a few km to tens of km
      ctx.drawImage(img, Math.floor(x * img.width) - n, Math.floor(y * img.height) - n, 2 * n, 2 * n, 0, 0, 4, 4);
      const d = ctx.getImageData(0, 0, 4, 4).data;
      const lin = (v: number) => { const a = v / 255; return a <= 0.04045 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4; };
      let here = 0;
      for (let k = 0; k < 16; k++) here += 0.2126 * lin(d[k * 4]) + 0.7152 * lin(d[k * 4 + 1]) + 0.0722 * lin(d[k * 4 + 2]);
      here /= 16;
      // the whole map's mean (once per map), weighted by area (cos latitude)
      let mean = PlanetTerrain.mapMeans.get(img);
      if (mean === undefined) {
        c.width = 64; c.height = 32;
        ctx.drawImage(img, 0, 0, 64, 32);
        const dm = ctx.getImageData(0, 0, 64, 32).data;
        let sum = 0, wsum = 0;
        for (let yy = 0; yy < 32; yy++) {
          const w = Math.cos(((yy + 0.5) / 32 - 0.5) * Math.PI);
          for (let xx = 0; xx < 64; xx++) { const k = yy * 64 + xx; sum += w * (0.2126 * lin(dm[k * 4]) + 0.7152 * lin(dm[k * 4 + 1]) + 0.0722 * lin(dm[k * 4 + 2])); wsum += w; }
        }
        mean = sum / wsum;
        PlanetTerrain.mapMeans.set(img, mean);
      }
      L.albedo = mean > 0 ? here / mean : null;
    } catch { /* tainted image or no canvas: keep the mean */ }
  }
  private static probe: HTMLCanvasElement | undefined;
  private static mapMeans = new WeakMap<object, number>();

  /**
   * Water level (m above the reference surface) of the current world at body-fixed unit direction
   * `n`, or null where it has no water: Earth's sea (and its lakes below sea level, but not its dry
   * depressions, Terrain.DEPRESSIONS), the seas of ocean and Earth-like generated planets (at 0).
   */
  waterLevel(n: Vector3): number | null {
    const w = this.world;
    if (!w) return null;
    const g = w.ground;
    if (g instanceof ExoGround) {
      const type = (g as unknown as { type: number }).type;
      return type === 3 || type === 4 ? 0 : null;
    }
    return this.source && g.owner ? this.source.waterLevel(g.owner as Body, n) : null;
  }

  /**
   * Whether the ground drawn at body-fixed unit direction `n` (of the current world) is open water:
   * the drawn ground lies flat at the local water level (heights below it are drawn as water).
   * False with no terrain, and on worlds without water.
   */
  isSea(n: Vector3): boolean {
    const w = this.world;
    if (!w || !this.current) return false;
    const lvl = this.waterLevel(n);
    if (lvl === null) return false;
    return this.groundRadius(n) - baseRadius(w.ground, n) <= lvl + 0.05;
  }

  groundRadius(n: Vector3): number {
    const w = this.world;
    if (!w || !this.current) return 0;
    const leaf = this.leafAt(n);
    if (leaf?.data) {
      const r = tileGroundRadius(leaf, leaf.data, leaf.m, n);
      if (Number.isFinite(r)) return r;
    }
    return baseRadius(w.ground, n) + w.ground.height(n, 100);
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

  /** The Sun's clearance over the relief (penumbra widths, lit above -0.5) at body-fixed direction `n`, as drawn. */
  sunClearance(n: Vector3): number {
    const leaf = this.current ? this.leafAt(n) : null;
    if (!leaf?.data) return SUN_CLEAR;
    const v = tileValue(leaf, leaf.data.sun, n);
    return Number.isFinite(v) ? v : SUN_CLEAR;
  }

  /** for tests and diagnostics: the drawn tiles */
  drawnTiles(): readonly { face: number; level: number; x: number; y: number; m: number }[] {
    return this.drawn;
  }

  dispose(): void {
    if (this.world) this.dropWorld(this.world);
    for (const wk of this.workers) wk.terminate();
    this.workers = [];
  }
}

/** highest and lowest ground of a world (for shadow rays and horizon culling) */
function topOf(g: Ground, spec: HeightSpec | null): { hTop: number; rMin: number; rMax: number } {
  const rMin0 = Math.min(...g.radii), rMax0 = Math.max(...g.radii);
  let hi = g.amplitude * 4, lo = -g.amplitude * 4;
  if (spec?.kind === 'body' && spec.map) {
    const m = spec.map as { data: Uint16Array; scale: number; offset: number };
    let a = 65535, b = 0;
    for (let i = 0; i < m.data.length; i += 7) { const v = m.data[i]; if (v < a) a = v; if (v > b) b = v; }
    hi = b * m.scale + m.offset + 3000;
    lo = a * m.scale + m.offset - 3000;
  }
  return { hTop: hi, rMin: Math.max(rMin0 * 0.9, rMin0 + Math.min(0, lo)), rMax: rMax0 };
}

/** Body-fixed camera position for a body: camera relative to the centre, rotated into the body frame. */
export function cameraBodyFixed(bodyRel: Vector3, orient: Matrix4): Vector3 {
  const inv = new Matrix3().setFromMatrix4(orient).transpose();
  return bodyRel.clone().negate().applyMatrix3(inv);
}

