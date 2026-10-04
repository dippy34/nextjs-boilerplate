import { Vector3 } from 'three';

/**
 * Planet-wide terrain tiles (render/PlanetTerrain.ts): a quadtree on each of the six faces of a
 * cube projected onto the body's ellipsoid. Pure maths (no DOM), shared by the tile worker
 * (workers/terrainTiles.worker.ts), the main-thread fallback and the tests.
 *
 * Face parameters (s, t) run over [-1, 1]; the direction is normalize(n + tan(πs/4) u + tan(πt/4) v)
 * (equal-angle mapping: cells of nearly the same size everywhere). A tile at level L covers
 * 2 / 2^L of each parameter; its grid has TILE_N segments per side, with the vertices uniform in
 * the parameters, so a child's even vertices are exactly its parent's.
 */
export const TILE_N = 32;
export const TILE_V = TILE_N + 1;
/** grid vertices, then the skirt (four edges of TILE_V vertices, hanging below the edges) */
export const TILE_VERTS = TILE_V * TILE_V + 4 * TILE_V;

/** face axes: normal, u (s direction), v (t direction); u x v = normal (counter-clockwise outside) */
export const FACES: readonly (readonly [number, number, number])[][] = [
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
  [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  [[0, 0, -1], [0, 1, 0], [1, 0, 0]],
];

const Q = Math.PI / 4;

/** unit direction of face parameters (s, t) */
export function faceDir(face: number, s: number, t: number, out = new Vector3()): Vector3 {
  const [n, u, v] = FACES[face];
  const a = Math.tan(Q * s), b = Math.tan(Q * t);
  return out.set(n[0] + a * u[0] + b * v[0], n[1] + a * u[1] + b * v[1], n[2] + a * u[2] + b * v[2]).normalize();
}

/** face and parameters of a direction (not necessarily unit) */
export function dirFace(d: { x: number; y: number; z: number }): { face: number; s: number; t: number } {
  const ax = Math.abs(d.x), ay = Math.abs(d.y), az = Math.abs(d.z);
  const face = ax >= ay && ax >= az ? (d.x >= 0 ? 0 : 1) : ay >= az ? (d.y >= 0 ? 2 : 3) : d.z >= 0 ? 4 : 5;
  const [n, u, v] = FACES[face];
  const dn = d.x * n[0] + d.y * n[1] + d.z * n[2];
  const a = (d.x * u[0] + d.y * u[1] + d.z * u[2]) / dn, b = (d.x * v[0] + d.y * v[1] + d.z * v[2]) / dn;
  return { face, s: Math.atan(a) / Q, t: Math.atan(b) / Q };
}

/** parameter range of a tile: [s0, t0, size] */
export function tileRect(level: number, x: number, y: number): [number, number, number] {
  const w = 2 / 2 ** level;
  return [-1 + x * w, -1 + y * w, w];
}

/** approximate vertex spacing (m) of a tile at `level` on a world of radius R */
export function tileSpacing(R: number, level: number): number {
  return (R * Math.PI) / 2 / 2 ** level / TILE_N;
}

/** reference-surface radius (m) along unit direction n (the ellipsoid) */
export function ellipsoidRadius(radii: readonly number[], x: number, y: number, z: number): number {
  return 1 / Math.sqrt((x / radii[0]) ** 2 + (y / radii[1]) ** 2 + (z / radii[2]) ** 2);
}

/**
 * Shared index buffer of a tile: two triangles per cell (diagonal from (i, j) to (i+1, j+1),
 * the morph targets depend on it) and skirts, wound both ways, on the edges set in `skirts` (bit e:
 * edge e of `edgeLists`; a skirt is only needed against a coarser neighbour).
 */
export function tileIndices(skirts = 15): Uint16Array | Uint32Array {
  const idx: number[] = [];
  const g = (i: number, j: number) => j * TILE_V + i;
  for (let j = 0; j < TILE_N; j++) {
    for (let i = 0; i < TILE_N; i++) {
      const a = g(i, j), b = g(i + 1, j), c = g(i + 1, j + 1), d = g(i, j + 1);
      idx.push(a, b, c, a, c, d);
    }
  }
  const edges = edgeLists();
  for (let e = 0; e < 4; e++) {
    if (!(skirts & (1 << e))) continue;
    const base = TILE_V * TILE_V + e * TILE_V;
    for (let k = 0; k < TILE_N; k++) {
      const a = edges[e][k], b = edges[e][k + 1], a2 = base + k, b2 = base + k + 1;
      idx.push(a, a2, b2, a, b2, b, a, b2, a2, a, b, b2);
    }
  }
  return TILE_VERTS > 65535 ? new Uint32Array(idx) : new Uint16Array(idx);
}

/** grid vertex indices along the four edges (t = 0, s = 1, t = 1, s = 0) */
export function edgeLists(): number[][] {
  const g = (i: number, j: number) => j * TILE_V + i;
  const out: number[][] = [[], [], [], []];
  for (let k = 0; k < TILE_V; k++) {
    out[0].push(g(k, 0));
    out[1].push(g(TILE_N, k));
    out[2].push(g(k, TILE_N));
    out[3].push(g(0, k));
  }
  return out;
}

/** height (m above the reference surface) at a body-fixed unit direction, for features down to `spacing` m */
export type HeightFn = (n: Vector3, spacing: number) => number;

export interface TileRequest {
  face: number; level: number; x: number; y: number;
  /** ellipsoid semi-axes (m) */
  radii: number[];
  /** mean radius (m) */
  radius: number;
  /** body-fixed unit direction of the star (null: no shadows) */
  sun: number[] | null;
  /** longitude of the colour map's left edge (radians) */
  lonLeft: number;
  /** highest ground on the world (m above the reference surface): shadow rays stop above it */
  hTop: number;
  /** the parent's drawn shape (its fine positions and normals, relative to its centre), for the morph */
  parent?: { pos: Float32Array; tn: Float32Array; centre: number[]; qx: number; qy: number } | null;
  /** finest spacing (m) the heights are computed for */
  minSpacing?: number;
  /**
   * Also build the column of descendants holding body-fixed direction `dir`, down to `level`
   * (each from its parent's shape), so the ground under the explorer reaches its detail in one job.
   */
  chain?: { dir: number[]; level: number } | null;
}

export interface TileData {
  /** body-fixed position of the tile's middle vertex (m) */
  centre: number[];
  /** raised vertex positions relative to the centre (m) */
  pos: Float32Array;
  /** the parent's shape at the same vertices (morph start), relative to the centre */
  morph: Float32Array;
  /** body-fixed unit directions */
  n: Float32Array;
  /** surface normals (fine, coarse) */
  tn: Float32Array;
  tnc: Float32Array;
  /** colour-map coordinates */
  uv: Float32Array;
  /** clearance of the Sun over the relief (penumbra widths; lit above -0.5) */
  sun: Float32Array;
  /** heights of the grid vertices (m above the reference surface) */
  h: Float32Array;
  hMin: number; hMax: number;
  /** radius (m) of a sphere around the centre holding every vertex */
  bound: number;
  /** spacing (m) the heights were computed for */
  spacing: number;
}

/** penumbra width (rad) of the shadows and the clearance clamp (penumbra widths), as TerrainPatch */
export const SUN_PEN = 0.016;
export const SUN_CLEAR = 2;

/**
 * Build one tile: heights on a grid with a one-vertex border (normals continuous across tiles of
 * the same level), the parent's shape at the same vertices (geomorph start), map coordinates,
 * skirts and relief shadows.
 */
export function buildTile(req: TileRequest, height: HeightFn): TileData {
  const { face, level, x, y, radii } = req;
  const [s0, t0, w] = tileRect(level, x, y);
  const spacing = Math.max(req.minSpacing ?? 0, tileSpacing(req.radius, level));
  const E = TILE_N + 3;                       // extended grid: one vertex outside each edge
  const P = new Float64Array(E * E * 3);      // absolute body-fixed positions
  const D = new Float64Array(E * E * 3);      // directions
  const H = new Float64Array(E * E);
  const d = new Vector3();
  for (let j = 0; j < E; j++) {
    for (let i = 0; i < E; i++) {
      faceDir(face, s0 + ((i - 1) / TILE_N) * w, t0 + ((j - 1) / TILE_N) * w, d);
      const k = j * E + i;
      const h = height(d, spacing);
      const r = ellipsoidRadius(radii, d.x, d.y, d.z) + h;
      D[k * 3] = d.x; D[k * 3 + 1] = d.y; D[k * 3 + 2] = d.z;
      P[k * 3] = d.x * r; P[k * 3 + 1] = d.y * r; P[k * 3 + 2] = d.z * r;
      H[k] = h;
    }
  }
  // the centre: the middle grid vertex, on the ground (keeps the bounding sphere tight)
  faceDir(face, s0 + w / 2, t0 + w / 2, d);
  const mid = ((TILE_N >> 1) + 1) * E + (TILE_N >> 1) + 1;
  const C = [P[mid * 3], P[mid * 3 + 1], P[mid * 3 + 2]];
  const NV = TILE_VERTS;
  const pos = new Float32Array(NV * 3), morph = new Float32Array(NV * 3), n = new Float32Array(NV * 3);
  const tn = new Float32Array(NV * 3), tnc = new Float32Array(NV * 3), uv = new Float32Array(NV * 2);
  const sun = new Float32Array(NV).fill(SUN_CLEAR), hh = new Float32Array(TILE_V * TILE_V);
  let hMin = Infinity, hMax = -Infinity;
  const ext = (i: number, j: number) => (j + 1) * E + (i + 1);
  for (let j = 0; j < TILE_V; j++) {
    for (let i = 0; i < TILE_V; i++) {
      const v = j * TILE_V + i, k = ext(i, j);
      for (let c = 0; c < 3; c++) {
        pos[v * 3 + c] = P[k * 3 + c] - C[c];
        n[v * 3 + c] = D[k * 3 + c];
      }
      hh[v] = H[k];
      hMin = Math.min(hMin, H[k]); hMax = Math.max(hMax, H[k]);
      // normal from the neighbours (s and t differences): u x v points outwards
      const a = ext(i + 1, j), b = ext(i - 1, j), c2 = ext(i, j + 1), e2 = ext(i, j - 1);
      const ax = P[a * 3] - P[b * 3], ay = P[a * 3 + 1] - P[b * 3 + 1], az = P[a * 3 + 2] - P[b * 3 + 2];
      const bx = P[c2 * 3] - P[e2 * 3], by = P[c2 * 3 + 1] - P[e2 * 3 + 1], bz = P[c2 * 3 + 2] - P[e2 * 3 + 2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      if (nx * D[k * 3] + ny * D[k * 3 + 1] + nz * D[k * 3 + 2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
      tn[v * 3] = nx; tn[v * 3 + 1] = ny; tn[v * 3 + 2] = nz;
    }
  }
  // the parent's shape at these vertices: its own vertices at even positions, the midpoints of its
  // cell edges and diagonals (its triangulation) at odd ones
  const par = req.parent;
  const GV = TILE_V * TILE_V;
  if (par) {
    const off = [par.centre[0] - C[0], par.centre[1] - C[1], par.centre[2] - C[2]];
    const half = TILE_N / 2;
    const pv = (i: number, j: number) => (par.qy * half + j) * TILE_V + par.qx * half + i;
    for (let j = 0; j < TILE_V; j++) {
      for (let i = 0; i < TILE_V; i++) {
        const v = j * TILE_V + i;
        const i0 = i >> 1, j0 = j >> 1, i1 = (i + 1) >> 1, j1 = (j + 1) >> 1;
        const a = pv(i0, j0), b = pv(i1, j1);
        let nx = 0, ny = 0, nz = 0;
        for (let c = 0; c < 3; c++) {
          morph[v * 3 + c] = 0.5 * (par.pos[a * 3 + c] + par.pos[b * 3 + c]) + off[c];
        }
        nx = par.tn[a * 3] + par.tn[b * 3]; ny = par.tn[a * 3 + 1] + par.tn[b * 3 + 1]; nz = par.tn[a * 3 + 2] + par.tn[b * 3 + 2];
        const l = Math.hypot(nx, ny, nz) || 1;
        tnc[v * 3] = nx / l; tnc[v * 3 + 1] = ny / l; tnc[v * 3 + 2] = nz / l;
      }
    }
  } else {
    morph.set(pos.subarray(0, GV * 3));
    tnc.set(tn.subarray(0, GV * 3));
  }
  // map coordinates, continuous across the map's seam within the tile
  const lon0 = req.lonLeft;
  const uc = (() => { let u = (Math.atan2(d.y, d.x) - lon0) / (2 * Math.PI); return u - Math.floor(u); })();
  for (let v = 0; v < GV; v++) {
    const dx = n[v * 3], dy = n[v * 3 + 1], dz = n[v * 3 + 2];
    let u = (Math.atan2(dy, dx) - lon0) / (2 * Math.PI);
    u -= Math.floor(u);
    if (u - uc > 0.5) u -= 1; else if (uc - u > 0.5) u += 1;
    // at a pole the longitude is undefined: take the tile centre's
    if (Math.abs(dz) > 0.999999) u = uc;
    uv[v * 2] = u;
    uv[v * 2 + 1] = 0.5 + Math.asin(Math.max(-1, Math.min(1, dz))) / Math.PI;
  }
  // relief shadows
  if (req.sun) shadeTile(req, height, P, E, C, sun, spacing, hMax);
  // skirts: the edge vertices again, hanging down (hide cracks against coarser neighbours). A crack
  // is the step between this tile's edge and a coarser neighbour's straight segments: the parent's
  // shape along the edge (the morph start) measures it for one level; neighbours up to two levels
  // coarser and the morph in between are covered by a few times that. (Deep skirts are not free:
  // a software rasteriser shades every hidden fragment.)
  const edges = edgeLists();
  let edgeStep = 0;
  if (par) {
    for (let e = 0; e < 4; e++) {
      for (const v of edges[e]) {
        edgeStep = Math.max(edgeStep, Math.hypot(pos[v * 3] - morph[v * 3], pos[v * 3 + 1] - morph[v * 3 + 1], pos[v * 3 + 2] - morph[v * 3 + 2]));
      }
    }
  }
  const depth = 4 * edgeStep + 0.02 * spacing + 0.3;
  for (let e = 0; e < 4; e++) {
    for (let k = 0; k < TILE_V; k++) {
      const src = edges[e][k], dst = GV + e * TILE_V + k;
      for (let c = 0; c < 3; c++) {
        pos[dst * 3 + c] = pos[src * 3 + c] - n[src * 3 + c] * depth;
        morph[dst * 3 + c] = morph[src * 3 + c] - n[src * 3 + c] * depth;
        n[dst * 3 + c] = n[src * 3 + c];
        tn[dst * 3 + c] = tn[src * 3 + c];
        tnc[dst * 3 + c] = tnc[src * 3 + c];
      }
      uv[dst * 2] = uv[src * 2]; uv[dst * 2 + 1] = uv[src * 2 + 1];
      sun[dst] = sun[src];
    }
  }
  let bound = 0;
  for (let v = 0; v < NV; v++) {
    bound = Math.max(bound, Math.hypot(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]), Math.hypot(morph[v * 3], morph[v * 3 + 1], morph[v * 3 + 2]));
  }
  return { centre: C, pos, morph, n, tn, tnc, uv, sun, h: hh, hMin, hMax, bound, spacing };
}

/**
 * Relief shadows of a tile: from each vertex, march towards the star and keep the smallest
 * clearance angle of the ray over the ground, in penumbra widths (signed distance to the shadow
 * edge, thresholded per pixel by the shader). Steps inside the tile read its own grid (every
 * vertex); farther steps sample the height function on a coarser lattice of vertices, interpolated.
 * Only where the star is low: higher up, slopes alone shade the ground.
 */
function shadeTile(req: TileRequest, height: HeightFn, P: Float64Array, E: number, C: number[], sun: Float32Array, spacing: number, hMaxTile: number): void {
  const [sx, sy, sz] = req.sun!;
  const { face, level, x, y, radii } = req;
  const [s0, t0, w] = tileRect(level, x, y);
  const hTop = Math.max(req.hTop, hMaxTile);
  // star elevation above the reference horizon at the centre, and the tile's angular size
  const cl = Math.hypot(C[0], C[1], C[2]);
  const elevC = Math.asin(Math.max(-1, Math.min(1, (C[0] * sx + C[1] * sy + C[2] * sz) / cl)));
  const tileAng = (w * Math.PI) / 4 * 1.5;
  // steepest slope that could cast a shadow: relief within the tile gives the rest
  if (elevC - tileAng > 0.6 || elevC + tileAng < -0.08) return;
  const V = TILE_V;
  const dq = new Vector3();
  const inTile = (qx: number, qy: number, qz: number): number => {
    // ground radius at the direction of q from the tile's own grid (bilinear), NaN outside
    const f = dirFace({ x: qx, y: qy, z: qz });
    if (f.face !== face) return NaN;
    const gi = ((f.s - s0) / w) * TILE_N, gj = ((f.t - t0) / w) * TILE_N;
    if (gi < 0 || gj < 0 || gi > TILE_N || gj > TILE_N) return NaN;
    const i0 = Math.min(TILE_N - 1, Math.floor(gi)), j0 = Math.min(TILE_N - 1, Math.floor(gj));
    const fi = gi - i0, fj = gj - j0;
    const r = (i: number, j: number) => {
      const k = ((j + 1) * E + (i + 1)) * 3;
      return Math.hypot(P[k], P[k + 1], P[k + 2]);
    };
    return (r(i0, j0) * (1 - fi) + r(i0 + 1, j0) * fi) * (1 - fj) + (r(i0, j0 + 1) * (1 - fi) + r(i0 + 1, j0 + 1) * fi) * fj;
  };
  const vis = new Float32Array(V * V).fill(SUN_CLEAR);
  const tileSize = spacing * TILE_N;
  // far part of each ray (outside the tile), on a coarse lattice
  const CS = 8, CV = CS + 1;
  const far = new Float32Array(CV * CV).fill(SUN_CLEAR);
  for (let cj = 0; cj < CV; cj++) {
    for (let ci = 0; ci < CV; ci++) {
      const i = Math.round((ci * TILE_N) / CS), j = Math.round((cj * TILE_N) / CS);
      const k = ((j + 1) * E + (i + 1)) * 3;
      const px = P[k], py = P[k + 1], pz = P[k + 2];
      const rP = Math.hypot(px, py, pz);
      if ((px * sx + py * sy + pz * sz) / rP < -0.05) continue;
      let v = SUN_CLEAR;
      for (let dd = tileSize * 0.25; dd < tileSize * 400; dd *= 1.35) {
        const qx = px + sx * dd, qy = py + sy * dd, qz = pz + sz * dd;
        const rQ = Math.hypot(qx, qy, qz);
        dq.set(qx / rQ, qy / rQ, qz / rQ);
        const base = ellipsoidRadius(radii, dq.x, dq.y, dq.z);
        if (rQ - base > hTop) break;
        if (!Number.isNaN(inTile(qx, qy, qz))) continue;
        const gr = base + height(dq, Math.max(spacing, dd / 6));
        v = Math.min(v, ((rQ - gr) / dd + 0.003) / SUN_PEN);
        if (v <= -SUN_CLEAR) { v = -SUN_CLEAR; break; }
      }
      far[cj * CV + ci] = v;
    }
  }
  for (let j = 0; j < V; j++) {
    for (let i = 0; i < V; i++) {
      const k = ((j + 1) * E + (i + 1)) * 3;
      const px = P[k], py = P[k + 1], pz = P[k + 2];
      const rP = Math.hypot(px, py, pz);
      if ((px * sx + py * sy + pz * sz) / rP < -0.05) continue;
      // near part over the tile's own grid
      let v = SUN_CLEAR;
      for (let dd = spacing * 1.5; dd < tileSize * 1.5; dd *= 1.3) {
        const qx = px + sx * dd, qy = py + sy * dd, qz = pz + sz * dd;
        const rQ = Math.hypot(qx, qy, qz);
        const gr = inTile(qx, qy, qz);
        if (Number.isNaN(gr)) break;
        if (rQ - ellipsoidRadius(radii, qx / rQ, qy / rQ, qz / rQ) > hMaxTile) break;   // above everything in the tile
        v = Math.min(v, ((rQ - gr) / dd + 0.003) / SUN_PEN);
        if (v <= -SUN_CLEAR) { v = -SUN_CLEAR; break; }
      }
      // far part, interpolated from the lattice
      const fi = (i / TILE_N) * CS, fj = (j / TILE_N) * CS;
      const i0 = Math.min(CS - 1, Math.floor(fi)), j0 = Math.min(CS - 1, Math.floor(fj));
      const a = fi - i0, b = fj - j0;
      const fv = (far[j0 * CV + i0] * (1 - a) + far[j0 * CV + i0 + 1] * a) * (1 - b) + (far[(j0 + 1) * CV + i0] * (1 - a) + far[(j0 + 1) * CV + i0 + 1] * a) * b;
      vis[j * V + i] = Math.min(v, fv);
    }
  }
  // soften (ray-march noise): each vertex with its four neighbours
  for (let j = 0; j < V; j++) {
    for (let i = 0; i < V; i++) {
      const at = (a: number, b: number) => vis[Math.max(0, Math.min(V - 1, b)) * V + Math.max(0, Math.min(V - 1, a))];
      sun[j * V + i] = (2 * at(i, j) + at(i - 1, j) + at(i + 1, j) + at(i, j - 1) + at(i, j + 1)) / 6;
    }
  }
}

/**
 * Ground radius (m from the centre) where the ray from the centre along unit direction `dir`
 * meets a tile's drawn surface (positions `pos` relative to `centre`, morphed from `morph` by `m`):
 * the plane of the triangle of the grid cell that holds the direction. NaN if outside the tile.
 */
/** The child quadrant (x, y at level + 1) of a tile that holds direction `dir`. */
export function childToward(t: { face: number; level: number; x: number; y: number }, dir: { x: number; y: number; z: number }): { x: number; y: number } {
  const f = dirFace(dir);
  const [s0, t0, w] = tileRect(t.level, t.x, t.y);
  // (a direction on another face: the quadrant nearest to it in this face's parameters)
  const qx = f.face === t.face ? (f.s >= s0 + w / 2 ? 1 : 0) : 0, qy = f.face === t.face ? (f.t >= t0 + w / 2 ? 1 : 0) : 0;
  return { x: t.x * 2 + qx, y: t.y * 2 + qy };
}

export function tileGroundRadius(t: { face: number; level: number; x: number; y: number }, data: Pick<TileData, 'pos' | 'morph' | 'centre'>, m: number, dir: Vector3): number {
  const f = dirFace(dir);
  if (f.face !== t.face) return NaN;
  const [s0, t0, w] = tileRect(t.level, t.x, t.y);
  const gi = ((f.s - s0) / w) * TILE_N, gj = ((f.t - t0) / w) * TILE_N;
  if (gi < -0.01 || gj < -0.01 || gi > TILE_N + 0.01 || gj > TILE_N + 0.01) return NaN;
  const i0 = Math.max(0, Math.min(TILE_N - 1, Math.floor(gi))), j0 = Math.max(0, Math.min(TILE_N - 1, Math.floor(gj)));
  const fi = gi - i0, fj = gj - j0;
  const v00 = j0 * TILE_V + i0, v11 = v00 + TILE_V + 1;
  const vb = fi >= fj ? v00 + 1 : v00 + TILE_V;
  const p = (v: number, c: number) => data.centre[c] + data.morph[v * 3 + c] + (data.pos[v * 3 + c] - data.morph[v * 3 + c]) * m;
  const ax = p(v00, 0), ay = p(v00, 1), az = p(v00, 2);
  const bx = p(vb, 0) - ax, by = p(vb, 1) - ay, bz = p(vb, 2) - az;
  const cx = p(v11, 0) - ax, cy = p(v11, 1) - ay, cz = p(v11, 2) - az;
  const nx = by * cz - bz * cy, ny = bz * cx - bx * cz, nz = bx * cy - by * cx;
  const den = dir.x * nx + dir.y * ny + dir.z * nz;
  if (Math.abs(den) < 1e-12) return NaN;
  return (ax * nx + ay * ny + az * nz) / den;
}

/** barycentric interpolation of a per-vertex value of a tile at direction `dir` (NaN outside) */
export function tileValue(t: { face: number; level: number; x: number; y: number }, values: ArrayLike<number>, dir: Vector3): number {
  const f = dirFace(dir);
  if (f.face !== t.face) return NaN;
  const [s0, t0, w] = tileRect(t.level, t.x, t.y);
  const gi = ((f.s - s0) / w) * TILE_N, gj = ((f.t - t0) / w) * TILE_N;
  if (gi < -0.01 || gj < -0.01 || gi > TILE_N + 0.01 || gj > TILE_N + 0.01) return NaN;
  const i0 = Math.max(0, Math.min(TILE_N - 1, Math.floor(gi))), j0 = Math.max(0, Math.min(TILE_N - 1, Math.floor(gj)));
  const fi = gi - i0, fj = gj - j0;
  const v00 = j0 * TILE_V + i0, v11 = v00 + TILE_V + 1;
  // triangle (v00, v10, v11) when fi >= fj, else (v00, v11, v01)
  if (fi >= fj) return values[v00] * (1 - fi) + values[v00 + 1] * (fi - fj) + values[v11] * fj;
  return values[v00] * (1 - fj) + values[v00 + TILE_V] * (fj - fi) + values[v11] * fi;
}
