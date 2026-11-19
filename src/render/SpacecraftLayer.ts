import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CylinderGeometry, DoubleSide, DynamicDrawUsage, Euler, Group, Matrix3, Matrix4, Mesh,
  Points, Quaternion, ShaderMaterial, SphereGeometry, Vector3, type BufferGeometry as BG,
} from 'three';
import { AU } from '../core/units';
import type { UPos } from '../core/upos';
import type { Body } from '../universe/Body';
import type { Spacecraft } from '../universe/Spacecraft';
import { SPRITE_FRAG, SPRITE_VERT } from './NearStars';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from './shaders/xr';

const HULL_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute vec3 aLoc;   // position in the part's own frame (surface detail follows the part)
attribute vec3 aNl;    // normal in the part's own frame
varying vec3 vN;
varying vec3 vPos;
varying vec3 vLoc;
varying vec3 vNl;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vLoc = aLoc;
  vNl = aNl;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;
const HULL_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uSpec;       // 0 matte .. 1 mirror-like foil
uniform float uKind;       // surface detail: 0 plain, 1 crinkled foil, 2 solar cells, 3 quilted blankets, 4 open truss
uniform float uAmp;        // how crinkled the foil is
uniform vec3 uSunDir;
uniform float uSunIrr;
uniform float uExposure;
uniform vec3 uEarthDir;
uniform float uEarthshine;
varying vec3 vN;
varying vec3 vPos;
varying vec3 vLoc;
varying vec3 vNl;
float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float n3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// the two coordinates across a face (the axis of its normal dropped)
vec2 across(vec3 p, vec3 nl) { vec3 a = abs(nl); return a.x > a.y && a.x > a.z ? p.yz : a.y > a.z ? p.xz : p.xy; }
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(-vPos);
  if (dot(n, V) < 0.0) n = -n;      // thin panels: light both faces
  vec3 col = uColor;
  float sp = uSpec;
  if (uKind > 3.5) {
    // truss: an open lattice of members (bays of 3 local units, X-braced); solid once too fine to resolve
    vec2 f = across(vLoc + 1.5, vNl) / 3.0;
    vec2 w = fwidth(f);
    vec2 g = abs(fract(f + 0.5) - 0.5);
    float d1 = abs(fract(f.x) - fract(f.y)), d2 = abs(fract(f.x) + fract(f.y) - 1.0);
    float bar = 0.045 + w.x;
    float on = max(max(step(g.x, bar), step(g.y, bar)), max(step(d1, bar * 1.4), step(d2, bar * 1.4)));
    if (on < 0.5 && max(w.x, w.y) < 0.15) discard;
  } else if (uKind > 2.5) {
    // quilted micrometeoroid blankets: panels with darker seams, each a slightly different white
    vec3 c = vLoc / 1.1;
    vec3 g = abs(fract(c) - 0.5);
    float fw = max(fwidth(c.x), max(fwidth(c.y), fwidth(c.z)));
    float seam = smoothstep(0.455, 0.49, max(g.x, max(g.y, g.z))) * (1.0 - smoothstep(0.1, 0.3, fw));
    float t = h31(floor(c) + 7.0);
    col *= (0.88 + 0.14 * t) * (1.0 - 0.45 * seam);
    n = normalize(n + 0.12 * (vec3(h31(floor(c) + 1.0), h31(floor(c) + 2.0), h31(floor(c) + 3.0)) - 0.5));
  } else if (uKind > 1.5) {
    // solar cells: a grid with bright gaps, every cell tilted a little (the array glints cell by cell)
    vec2 c = across(vLoc, vNl) / 0.42;
    vec2 g = abs(fract(c) - 0.5);
    vec2 fw = fwidth(c);
    float gap = smoothstep(0.42, 0.47, max(g.x, g.y)) * (1.0 - smoothstep(0.2, 0.45, max(fw.x, fw.y)));
    vec3 id = vec3(floor(c), 0.0);
    col *= mix(0.8 + 0.4 * h31(id + 5.0), 3.0, gap);
    n = normalize(n + 0.05 * (vec3(h31(id + 1.0), h31(id + 2.0), h31(id + 3.0)) - 0.5));
    sp = mix(sp, 0.3, gap);
  } else if (uKind > 0.5) {
    // crinkled foil: a wrinkled normal and a mottled sheen
    vec3 q = vLoc * mix(10.0, 4.0, uAmp);
    n = normalize(n + 0.45 * uAmp * (vec3(n3(q), n3(q + 7.1), n3(q + 13.7)) - 0.5));
    col *= 1.0 + uAmp * (0.44 * n3(vLoc * 1.7 + 3.0) - 0.22);
  }
  float mu0 = max(dot(n, uSunDir), 0.0);
  vec3 H = normalize(uSunDir + V);
  float spec = sp * pow(max(dot(n, H), 0.0), mix(8.0, 90.0, sp)) * 2.5;
  float earth = uEarthshine * max(dot(n, uEarthDir), 0.0);
  // a little fill light (as a photographer would add) keeps shaded parts readable
  vec3 rad = (col * (mu0 + 0.1 + earth) + spec * mix(vec3(1.0), col, 0.6) * step(0.0, dot(vN, uSunDir) + 0.3)) * (uSunIrr / 3.14159265);
  gl_FragColor = vec4(min(rad * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

type Finish = 'gold' | 'white' | 'silver' | 'panel' | 'array' | 'dark' | 'shield' | 'mirror' | 'rtg' | 'truss';
/** colour, specular, surface detail (see HULL_FRAG uKind), foil crinkle */
const FINISH: Record<Finish, [number, number, number, number, number, number]> = {
  gold: [0.85, 0.6, 0.18, 0.55, 1, 1], white: [0.82, 0.82, 0.8, 0.15, 3, 0], silver: [0.62, 0.64, 0.67, 0.7, 1, 0.3], panel: [0.06, 0.09, 0.2, 0.6, 2, 0],
  array: [0.55, 0.3, 0.1, 0.55, 2, 0], dark: [0.1, 0.1, 0.11, 0.2, 0, 0], shield: [0.72, 0.62, 0.78, 0.45, 1, 0.25], mirror: [1.0, 0.72, 0.28, 0.95, 0, 0],
  rtg: [0.22, 0.22, 0.24, 0.3, 0, 0], truss: [0.7, 0.7, 0.68, 0.3, 4, 0],
};

type V3 = [number, number, number];
/** A piece of a model: geometry, finish, placement; `s` scales the surface detail; `track` parts turn to the Sun. */
interface Part { g: BG; f: Finish; m: Matrix4; s?: number; track?: boolean }

const ONE = new Vector3(1, 1, 1);
const box = (x: number, y: number, z: number) => new BoxGeometry(x, y, z);
const cyl = (r: number, h: number, seg = 16, r2 = r) => new CylinderGeometry(r2, r, h, seg);
/** shallow dish opening towards +y */
const dish = (d: number) => new SphereGeometry(d * 0.75, 24, 6, 0, Math.PI * 2, Math.PI - 0.73, 0.73).translate(0, d * 0.75 * 0.75, 0);
const at = (g: BG, f: Finish, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s?: number): Part =>
  ({ g, f, m: new Matrix4().compose(new Vector3(...p), new Quaternion().setFromEuler(new Euler(...r)), ONE), s });
/** a geometry built along +y, centred at `c` and turned to point along `dir` */
const along = (g: BG, f: Finish, c: V3, dir: V3, s?: number): Part =>
  ({ g, f, m: new Matrix4().compose(new Vector3(...c), new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...dir).normalize()), ONE), s });
/** a rod from a to b */
function strut(a: V3, b: V3, r: number, f: Finish, seg = 6): Part {
  const A = new Vector3(...a), B = new Vector3(...b);
  const d = B.clone().sub(A);
  return along(cyl(r, d.length(), seg), f, A.add(B).multiplyScalar(0.5).toArray() as V3, d.toArray() as V3);
}
/** pressurised module or tank along an axis, from u0 to u1 at the given offsets */
const tubeX = (r: number, x0: number, x1: number, y: number, z: number, f: Finish = 'white', seg = 20) => at(cyl(r, x1 - x0, seg), f, [(x0 + x1) / 2, y, z], [0, 0, Math.PI / 2]);
const tubeY = (r: number, y0: number, y1: number, x: number, z: number, f: Finish = 'white', seg = 20) => at(cyl(r, y1 - y0, seg), f, [x, (y0 + y1) / 2, z]);
const tubeZ = (r: number, z0: number, z1: number, x: number, y: number, f: Finish = 'white', seg = 20) => at(cyl(r, z1 - z0, seg), f, [x, y, (z0 + z1) / 2], [Math.PI / 2, 0, 0]);
/** a radioisotope generator: finned cylinder from c along dir */
function rtg(c: V3, dir: V3, r: number, len: number, fins = 6): Part[] {
  const D = new Vector3(...dir).normalize();
  const u = new Vector3(0, 1, 0).cross(D);
  if (u.lengthSq() < 1e-6) u.set(1, 0, 0);
  u.normalize();
  const w = D.clone().cross(u);
  const out = [along(cyl(r, len, 12), 'rtg', c, dir)];
  for (let i = 0; i < fins; i++) {
    const a = (i / fins) * Math.PI * 2;
    const rad = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(w, Math.sin(a));
    const tan = D.clone().cross(rad);
    const m = new Matrix4().makeBasis(tan, D, rad).setPosition(new Vector3(...c).addScaledVector(rad, r + r * 0.45));
    out.push({ g: box(0.015, len * 0.95, r * 0.9), f: 'rtg', m });
  }
  return out;
}

/** Hand-built models at true size (metres). Forward/"front" axes per kind are noted. */
function parts(kind: string): Part[] {
  switch (kind) {
    case 'voyager': { // +y: high-gain antenna towards Earth
      const out: Part[] = [
        at(cyl(0.89, 0.47, 10), 'silver'), at(cyl(0.86, 0.02, 10), 'dark', [0, 0.245, 0]), at(cyl(0.86, 0.02, 10), 'dark', [0, -0.245, 0]),
        // the Golden Record on the side of the bus
        along(cyl(0.155, 0.02, 24), 'mirror', [0.27, 0, 0.83], [0.309, 0, 0.951]),
        // high-gain antenna (3.66 m), its feed and subreflector on a tripod
        at(dish(3.66), 'white', [0, 0.3, 0]), at(cyl(0.12, 0.5, 12, 0.06), 'silver', [0, 0.85, 0]), at(cyl(0.27, 0.06, 20), 'white', [0, 1.55, 0]),
        ...[0, 2.09, 4.19].map((a) => strut([Math.cos(a) * 1.25, 0.95, Math.sin(a) * 1.25], [0, 1.52, 0], 0.015, 'silver')),
        // science boom with the scan platform (cameras, spectrometers)
        strut([-0.8, -0.1, -0.2], [-2.5, -0.15, -0.55], 0.05, 'silver'),
        at(box(0.25, 0.25, 0.3), 'gold', [-1.5, -0.05, -0.4]), at(box(0.3, 0.2, 0.25), 'gold', [-2.0, -0.05, -0.5]),
        at(box(0.45, 0.4, 0.55), 'silver', [-2.65, -0.15, -0.6]),
        at(cyl(0.12, 0.95, 16), 'dark', [-2.7, 0.05, -0.15], [Math.PI / 2, 0, 0]), at(cyl(0.07, 0.5, 12), 'dark', [-2.45, 0.05, -0.25], [Math.PI / 2, 0, 0]),
        at(cyl(0.25, 0.55, 20), 'silver', [-2.95, 0.1, -0.2], [Math.PI / 2, 0, 0]),
        // 13 m magnetometer boom (a thin triangular mast) with its sensors
        along(box(0.22, 13, 0.22), 'truss', [-3.6, -0.6, 5.5], [-0.42, -0.06, 0.9], 14),
        along(cyl(0.09, 0.3, 10), 'silver', [-1.6, -0.27, 2.8], [-0.42, -0.06, 0.9]), along(cyl(0.09, 0.3, 10), 'silver', [-6.3, -0.95, 11.6], [-0.42, -0.06, 0.9]),
        // the two 10 m radio antennas
        strut([-0.4, -0.2, -0.8], [-1.8, -9.6, -2.4], 0.012, 'silver', 4), strut([-0.2, -0.2, -0.85], [1.4, -9.5, -2.9], 0.012, 'silver', 4),
        // RTG boom with three generators end to end
        strut([0.85, -0.1, 0.1], [3.3, -0.3, 0.75], 0.04, 'silver'),
      ];
      const d: V3 = [2.45, -0.2, 0.65];
      for (const k of [0.45, 0.65, 0.85]) out.push(...rtg([0.85 + d[0] * k, -0.1 + d[1] * k, 0.1 + d[2] * k], d, 0.2, 0.5));
      return out;
    }
    case 'newhorizons': { // +y: antenna towards Earth
      const out: Part[] = [
        at(cyl(1.2, 0.7, 3), 'gold'), at(cyl(1.17, 0.02, 3), 'dark', [0, 0.36, 0]),
        at(dish(2.1), 'white', [0, 0.37, 0]), at(cyl(0.17, 0.05, 16), 'white', [0, 0.98, 0]), at(cyl(0.15, 0.2, 16, 0.12), 'white', [0, 1.1, 0]),
        ...[0.5, 2.6, 4.7].map((a) => strut([Math.cos(a) * 0.75, 0.55, Math.sin(a) * 0.75], [0, 0.96, 0], 0.012, 'silver')),
        // the generator, cantilevered from one corner
        strut([0.95, -0.1, -0.55], [1.35, -0.1, -0.78], 0.06, 'silver'),
        ...rtg([1.85, -0.1, -1.07], [0.866, 0, -0.5], 0.21, 1.1, 8),
        // instruments: LORRI's telescope, Ralph, Alice, SWAP, PEPSSI; star trackers; the student dust counter underneath
        at(cyl(0.11, 0.6, 16), 'silver', [-0.55, -0.05, 0.75], [0, 0, Math.PI / 2]), at(box(0.38, 0.3, 0.4), 'gold', [-0.35, 0.05, 0.25]),
        at(box(0.25, 0.2, 0.35), 'dark', [0.2, 0.05, 0.7]), at(cyl(0.16, 0.2, 14), 'silver', [-0.75, 0.0, -0.35], [Math.PI / 2, 0, 0]),
        at(box(0.15, 0.12, 0.15), 'gold', [0.55, 0.15, 0.3]), at(cyl(0.05, 0.12, 8), 'dark', [-0.2, 0.42, -0.55]), at(cyl(0.05, 0.12, 8), 'dark', [0.1, 0.42, -0.6]),
        at(box(0.46, 0.02, 0.3), 'white', [0, -0.37, 0.1]),
      ];
      return out;
    }
    case 'parker': // +y: heat shield towards the Sun
      return [
        at(cyl(1.15, 0.115, 32), 'white', [0, 0.6, 0]), at(cyl(0.55, 1.0, 6), 'gold', [0, -0.2, 0]),
        at(box(1.6, 0.04, 0.5), 'panel', [1.1, -0.1, 0]), at(box(1.6, 0.04, 0.5), 'panel', [-1.1, -0.1, 0]),
        strut([0, -0.5, 0.4], [0, 0.55, 0.4], 0.04, 'silver'), strut([0, -0.5, -0.4], [0, 0.55, -0.4], 0.04, 'silver'),
        strut([0.4, -0.5, 0], [0.4, 0.55, 0], 0.03, 'silver'), strut([-0.4, -0.5, 0], [-0.4, 0.55, 0], 0.03, 'silver'),
      ];
    case 'lucy': // +y: solar arrays towards the Sun
      return [
        at(box(1.8, 1.8, 2.2), 'gold'), at(dish(2), 'white', [0, 0, 1.3], [Math.PI / 2, 0, 0]),
        at(cyl(3.65, 0.06, 32), 'panel', [5.3, 0, 0]), at(cyl(3.65, 0.06, 32), 'panel', [-5.3, 0, 0]),
        strut([0.9, 0, 0], [1.7, 0, 0], 0.05, 'silver'), strut([-0.9, 0, 0], [-1.7, 0, 0], 0.05, 'silver'),
      ];
    case 'jwst': { // -y: towards the Sun (sunshield), mirror above it facing +z
      const out: Part[] = [];
      // the sunshield: five kite-shaped layers, 21.2 x 14.2 m, further apart towards the edges
      for (let l = 0; l < 5; l++) {
        const y = 0.05 + l * 0.1, e = 0.05 + l * 0.22, k = 1 - l * 0.012;
        const P = [[0, y, 0], [-10.6 * k, y + e, 0], [-4.4 * k, y + e, 7.1 * k], [4.4 * k, y + e, 7.1 * k], [10.6 * k, y + e, 0], [4.4 * k, y + e, -7.1 * k], [-4.4 * k, y + e, -7.1 * k]];
        const v: number[] = [];
        for (let i = 1; i <= 6; i++) v.push(...P[0], ...P[i], ...P[i === 6 ? 1 : i + 1]);
        const g = new BufferGeometry();
        g.setAttribute('position', new BufferAttribute(new Float32Array(v), 3));
        g.computeVertexNormals();
        out.push({ g, f: l === 0 ? 'silver' : 'shield', m: new Matrix4() });
      }
      // booms holding it out, the trim flap at the aft end
      out.push(strut([-10.4, 1.0, 0], [10.4, 1.0, 0], 0.07, 'dark'), strut([0, 0.3, -7.0], [0, 0.3, 7.0], 0.09, 'dark'));
      out.push(at(box(2.6, 0.03, 1.6), 'shield', [0, 0.5, -8.0], [0.3, 0, 0]));
      // spacecraft bus on the Sun side: solar panel, antenna, tower up to the telescope
      out.push(at(box(3.0, 1.2, 3.0), 'dark', [0, -0.7, 0]), at(box(3.02, 0.3, 3.02), 'gold', [0, -0.2, 0]));
      out.push(at(box(2.4, 0.04, 5.6), 'panel', [0, -1.35, -4.6]), at(dish(0.6), 'white', [1.1, -1.5, 1.0], [Math.PI, 0, 0]));
      out.push(at(cyl(0.35, 2.4, 12), 'dark', [0, 1.6, 0.3]));
      // the telescope: 18 gold hexagons (1.32 m across flats) on a backplane, the instrument module behind
      const seg = cyl(0.755, 0.06, 6);
      for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
        const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
        if (ring === 0 || ring > 2) continue;
        const x = 1.32 * (q + r / 2), y = 1.32 * 0.866 * r;
        out.push(at(seg, 'mirror', [x, 3.8 + y, 1.2 + 0.012 * (x * x + y * y)], [Math.PI / 2, 0, Math.PI / 6]));
      }
      out.push(at(box(6.4, 5.8, 0.4), 'dark', [0, 3.8, 0.85]), at(box(2.4, 2.4, 2.2), 'silver', [0, 3.8, -0.5]));
      out.push(at(cyl(0.32, 1.3, 12, 0.22), 'dark', [0, 3.8, 1.85], [Math.PI / 2, 0, 0]));
      // secondary mirror on three struts, 7 m in front of the primary
      for (const [x, y] of [[0, 3.3], [-2.86, -1.65], [2.86, -1.65]]) out.push(strut([x, 3.8 + y, 1.3], [x * 0.08, 3.8 + y * 0.08, 7.9], 0.05, 'dark'));
      out.push(at(cyl(0.37, 0.1, 6), 'mirror', [0, 3.8, 8.0], [Math.PI / 2, 0, 0]), at(box(0.9, 0.9, 0.2), 'dark', [0, 3.8, 8.15]));
      return out;
    }
    case 'iss': { // x: flight direction, y: truss across the orbit, z: towards Earth
      const out: Part[] = [];
      // integrated truss (the open lattice), its core and equipment; rotary joints
      out.push(at(box(3, 106, 3), 'truss'), at(box(1.0, 106, 1.0), 'dark'), at(box(3.4, 13, 2.8), 'white', [0, 0, 0.2]));
      for (const y of [-21, -14, 14, 21]) out.push(at(box(2.2, 3.6, 1.0), 'white', [0.2, y, -1.8]));
      for (const y of [-29, 29]) out.push(tubeY(1.9, y - 0.7, y + 0.7, 0, 0, 'silver', 24));
      // eight solar array wings, 35 m long: two blankets either side of a mast; they turn to the Sun
      for (const y of [-49.5, -37.5, 37.5, 49.5]) for (const sx of [-1, 1]) {
        const xc = sx * 20.5;
        out.push({ ...at(box(34, 4.6, 0.05), 'array', [xc, y - 2.75, 0]), track: true }, { ...at(box(34, 4.6, 0.05), 'array', [xc, y + 2.75, 0]), track: true });
        out.push({ ...tubeX(0.12, sx > 0 ? 3.2 : -37.8, sx > 0 ? 37.8 : -3.2, y, 0, 'silver', 6), track: true });
        out.push({ ...at(box(0.6, 10.6, 0.5), 'dark', [sx * 3.2, y, 0]), track: true }, { ...at(box(0.4, 10.6, 0.3), 'dark', [sx * 37.8, y, 0]), track: true });
        out.push(at(box(1.4, 1.4, 1.4), 'white', [sx * 2.1, y, 0]));
      }
      // radiators: the big ones aft of the middle truss, smaller ones by the arrays
      for (const sy of [-1, 1]) {
        for (const k of [0, 1, 2]) out.push(at(box(22, 3.3, 0.08), 'white', [-13, sy * (15.5 + k * 3.5), 0.4 + k * 0.5]));
        for (const k of [0, 1, 2]) out.push(at(box(3.3, 0.08, 12), 'white', [-2.5 - k * 3.5, sy * 31, 6.5]));
      }
      const z0 = 3.9;   // the US segment's axis, under the truss
      // US segment: Unity, Destiny, Harmony, with Columbus and Kibo either side of Harmony
      out.push(tubeX(2.3, -7.6, -2.1, 0, z0), tubeX(2.15, -2.1, 6.4, 0, z0), tubeX(2.2, 6.4, 13.6, 0, z0));
      out.push(tubeY(2.25, 2.2, 9.2, 10, z0), tubeY(2.2, -13.4, -2.2, 10, z0), tubeZ(2.1, -2.4, 1.7, 10, -8));
      out.push(at(box(5.0, 5.6, 1.0), 'white', [10, -16.2, z0]), at(box(1.0, 1.4, 1.0), 'gold', [11.6, -15.0, z0 - 1.0]), at(box(1.2, 1.6, 0.8), 'white', [8.5, -17.3, z0 - 0.9]), at(box(0.9, 1.0, 0.9), 'gold', [10.2, -18.3, z0 - 0.95]));
      // Tranquility with the Cupola, Quest airlock, Leonardo
      out.push(tubeY(2.2, -9.0, -2.3, -4.8, z0), at(cyl(1.47, 1.5, 7), 'white', [-4.8, -6.0, z0 + 2.9], [Math.PI / 2, 0, 0]), at(cyl(0.42, 0.04, 16), 'dark', [-4.8, -6.0, z0 + 3.66], [Math.PI / 2, 0, 0]));
      out.push(tubeY(2.0, 2.3, 7.8, -4.8, z0), tubeZ(2.2, z0 + 2.3, z0 + 8.7, -4.8, 0));
      // Russian segment: Zarya, Rassvet with a Soyuz, Zvezda with Poisk, Nauka and a Progress at the back
      out.push(tubeX(2.05, -20.4, -7.8, 0, z0), tubeZ(1.17, z0 + 2.05, z0 + 8.05, -14, 0));
      out.push(at(new SphereGeometry(1.13, 16, 12), 'white', [-14, 0, z0 + 9.2]), at(cyl(1.1, 2.1, 20, 0.6), 'dark', [-14, 0, z0 + 11.3], [-Math.PI / 2, 0, 0]), tubeZ(1.36, z0 + 12.4, z0 + 15.0, -14, 0));
      for (const sy of [-1, 1]) out.push(at(box(1.6, 4.2, 0.04), 'panel', [-14, sy * 3.6, z0 + 14]));
      out.push(tubeX(2.05, -33.5, -20.4, 0, z0), at(new SphereGeometry(1.4, 16, 12), 'white', [-21.2, 0, z0]));
      for (const sy of [-1, 1]) out.push(at(box(2.6, 10.7, 0.04), 'panel', [-30.5, sy * 8.0, z0]), tubeY(0.08, sy > 0 ? 2.0 : -13.4, sy > 0 ? 13.4 : -2.0, -30.5, z0, 'silver', 6));
      out.push(tubeZ(1.3, z0 - 6.0, z0 - 1.4, -21.2, 0), tubeZ(2.1, z0 + 1.4, z0 + 14.4, -21.2, 0), at(new SphereGeometry(1.2, 16, 12), 'white', [-21.2, 0, z0 + 15.6]));
      out.push(tubeX(1.35, -37.0, -33.5, 0, z0), tubeX(1.36, -40.5, -37.0, 0, z0));
      for (const sy of [-1, 1]) out.push(at(box(1.4, 4.0, 0.04), 'panel', [-38.8, sy * 3.4, z0]));
      // Dragon at the front port
      out.push(at(cyl(0.9, 3.0, 24, 1.85), 'white', [15.1, 0, z0], [0, 0, -Math.PI / 2]), tubeX(1.85, 16.6, 19.4, 0, z0, 'white', 24));
      // Canadarm2, reaching over the truss
      out.push(at(box(1.6, 1.6, 1.0), 'white', [0, 6, -2.0]), strut([0, 6, -2.4], [4.5, 9, -9.0], 0.19, 'white', 10), strut([4.5, 9, -9.0], [11, 11, -5.5], 0.19, 'white', 10));
      out.push(at(box(0.9, 0.9, 0.9), 'white', [4.5, 9, -9.0]), at(cyl(0.3, 1.2, 10), 'white', [11.6, 11.2, -5.2], [0, 0, Math.PI / 2]));
      return out;
    }
    case 'hubble': { // z: telescope axis (aperture at +z), y: towards the Sun, x: solar array masts
      const out: Part[] = [
        tubeZ(2.13, -6.6, -3.1, 0, 0, 'silver', 24), tubeZ(2.13, -3.1, -0.6, 0, 0, 'silver', 12),
        at(cyl(2.13, 0.3, 32, 1.55), 'silver', [0, 0, -0.45], [Math.PI / 2, 0, 0]),
        tubeZ(1.55, -0.6, 6.4, 0, 0, 'silver', 32), at(cyl(1.5, 0.02, 32), 'dark', [0, 0, 6.41], [Math.PI / 2, 0, 0]),
        // the aperture door, open
        at(cyl(1.55, 0.1, 32), 'silver', [0, 1.95, 7.9], [-0.2618, 0, 0]),
        // fine-guidance and instrument bay doors, handrail-ish bands
        ...[0.9, 2.5, 4.1, 5.7].map((z) => tubeZ(1.58, z - 0.06, z + 0.06, 0, 0, 'white', 32)),
        at(box(0.9, 1.6, 0.06), 'white', [1.6, 0, -4.8], [0, Math.PI / 2, 0]), at(box(0.9, 1.6, 0.06), 'white', [-1.6, 0, -4.8], [0, Math.PI / 2, 0]),
        // high-gain antennas on masts
        strut([0, 2.1, -1.8], [0, 4.2, -1.8], 0.05, 'silver'), strut([0, -2.1, -1.8], [0, -4.2, -1.8], 0.05, 'silver'),
        at(dish(1.3), 'white', [0, 4.2, -1.8]), at(dish(1.3), 'white', [0, -4.2, -1.8], [Math.PI, 0, 0]),
      ];
      // the two solar array wings, parallel to the tube, turned to face the Sun
      for (const sx of [-1, 1]) {
        out.push(strut([sx * 2.1, 0, -1.6], [sx * 3.6, 0, -1.6], 0.09, 'silver'));
        for (const dz of [-1.33, 1.33]) out.push(at(box(2.5, 0.04, 2.6), 'panel', [sx * 4.95, 0, -1.6 + dz * 1.0]));
        out.push(at(box(2.5, 0.05, 0.12), 'silver', [sx * 4.95, 0, -1.6]));
        out.push(at(box(0.08, 0.06, 7.1), 'silver', [sx * 3.65, 0, -1.6]));
      }
      return out;
    }
    default: { // large solar-powered probe (Europa Clipper, Juice, Psyche): +y arrays towards the Sun
      return [
        at(cyl(0.9, 3.0, 12), 'gold'), at(dish(3), 'white', [0, 1.6, 0]),
        at(box(12.5, 0.06, 4.1), 'panel', [7.6, 0, 0]), at(box(12.5, 0.06, 4.1), 'panel', [-7.6, 0, 0]),
        strut([0.9, 0, 0], [1.4, 0, 0], 0.06, 'silver'), strut([-0.9, 0, 0], [-1.4, 0, 0], 0.06, 'silver'),
        strut([0, -1.2, 0], [0, -1.2, 8], 0.03, 'silver'),
      ];
    }
  }
}

/** Bakes a model's parts into one geometry per finish (and per Sun-tracking group). */
function bake(list: Part[]): { f: Finish; track: boolean; g: BufferGeometry }[] {
  const groups = new Map<string, Part[]>();
  for (const p of list) {
    const k = `${p.f}|${p.track ? 1 : 0}`;
    const l = groups.get(k);
    if (l) l.push(p);
    else groups.set(k, [p]);
  }
  const out: { f: Finish; track: boolean; g: BufferGeometry }[] = [];
  const v = new Vector3(), nm = new Matrix3();
  for (const [k, ps] of groups) {
    const flat = ps.map((p) => ({ g: p.g.index ? p.g.toNonIndexed() : p.g, m: p.m, s: p.s ?? 1 }));
    const n = flat.reduce((a, x) => a + x.g.attributes.position.count, 0);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), loc = new Float32Array(n * 3), nl = new Float32Array(n * 3);
    let o = 0;
    for (const { g, m, s } of flat) {
      nm.getNormalMatrix(m);
      const P = g.attributes.position, N = g.attributes.normal;
      for (let i = 0; i < P.count; i++, o += 3) {
        v.fromBufferAttribute(P, i);
        loc[o] = v.x * s; loc[o + 1] = v.y * s; loc[o + 2] = v.z * s;
        v.applyMatrix4(m);
        pos[o] = v.x; pos[o + 1] = v.y; pos[o + 2] = v.z;
        v.fromBufferAttribute(N, i);
        nl[o] = v.x; nl[o + 1] = v.y; nl[o + 2] = v.z;
        v.applyMatrix3(nm).normalize();
        nor[o] = v.x; nor[o + 1] = v.y; nor[o + 2] = v.z;
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('normal', new BufferAttribute(nor, 3));
    g.setAttribute('aLoc', new BufferAttribute(loc, 3));
    g.setAttribute('aNl', new BufferAttribute(nl, 3));
    g.computeBoundingSphere();
    const [f, t] = k.split('|');
    out.push({ f: f as Finish, track: t === '1', g });
  }
  return out;
}

export interface CraftView { craft: Spacecraft; rel: Vector3; dist: number; pixelRadius: number }

/**
 * Real spacecraft: a true-size model once it spans a pixel, and a sunlit point before that
 * (bright enough to see when close: the ISS seen from near Earth is a brilliant moving star).
 */
export class SpacecraftLayer {
  readonly group = new Group();
  views: CraftView[] = [];
  private models = new Map<Spacecraft, Group>();
  private uniforms = {
    uSunDir: { value: new Vector3(1, 0, 0) }, uSunIrr: { value: Math.PI }, uEarthDir: { value: new Vector3(0, 1, 0) }, uEarthshine: { value: 0 },
  };
  private mats = new Map<Finish, ShaderMaterial>();
  private sprites: Points;
  private sp = { pos: new Float32Array(32 * 3), irr: new Float32Array(32), col: new Float32Array(32 * 3) };

  constructor(readonly craft: Spacecraft[], private exposure: { value: number }, psf: Record<string, { value: number }>) {
    this.group.name = 'spacecraft';
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(this.sp.pos, 3).setUsage(DynamicDrawUsage));
    g.setAttribute('aIrr', new BufferAttribute(this.sp.irr, 1).setUsage(DynamicDrawUsage));
    g.setAttribute('aColor', new BufferAttribute(this.sp.col, 3).setUsage(DynamicDrawUsage));
    this.sprites = new Points(g, new ShaderMaterial({
      name: 'spacecraft-sprites', vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, uniforms: { ...psf, uHalo: { value: 0.4 } },
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    }));
    this.sprites.frustumCulled = false;
    this.sprites.renderOrder = 10;
    this.group.add(this.sprites);
  }

  private mat(f: Finish): ShaderMaterial {
    let m = this.mats.get(f);
    if (!m) {
      const [r, g, b, s, k, amp] = FINISH[f];
      m = new ShaderMaterial({
        name: 'spacecraft', vertexShader: HULL_VERT, fragmentShader: HULL_FRAG, side: DoubleSide,
        uniforms: { uColor: { value: new Vector3(r, g, b) }, uSpec: { value: s }, uKind: { value: k }, uAmp: { value: amp }, uExposure: this.exposure, ...this.uniforms, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
      });
      this.mats.set(f, m);
    }
    return m;
  }

  private model(c: Spacecraft): Group {
    let grp = this.models.get(c);
    if (grp) return grp;
    grp = new Group();
    grp.name = c.name;
    // parts that turn to face the Sun (the station's arrays) hang in their own group
    const track = new Group();
    for (const b of bake(parts(c.model))) {
      const m = new Mesh(b.g, this.mat(b.f));
      m.frustumCulled = false;
      (b.track ? track : grp).add(m);
    }
    if (track.children.length) { grp.add(track); grp.userData.track = track; }
    grp.matrixAutoUpdate = false;
    this.group.add(grp);
    this.models.set(c, grp);
    return grp;
  }

  /** One hidden model, so its shader is compiled before the first approach. */
  warmupObjects(): Group[] {
    const c = this.craft[0];
    return c ? [this.model(c)] : [];
  }

  update(cam: UPos, pixelAngle: number, jd: number, sun: Body, earth: Body): void {
    this.views = [];
    let ns = 0;
    const rel = new Vector3(), toSun = new Vector3(), toEarth = new Vector3();
    void jd;
    for (const c of this.craft) {
      const grp = this.models.get(c);
      if (!c.valid) { if (grp) grp.visible = false; continue; }
      c.upos.sub(cam, rel);
      const dist = rel.length();
      const pr = Math.atan2(c.radius, dist) / pixelAngle;
      this.views.push({ craft: c, rel: rel.clone(), dist, pixelRadius: pr });
      sun.upos.sub(c.upos, toSun);
      const dSun = toSun.length();
      toSun.divideScalar(dSun);
      const E = Math.PI * (AU / dSun) ** 2;
      if (pr > 0.6) {
        const g = this.model(c);
        g.visible = true;
        earth.upos.sub(c.upos, toEarth);
        const dEarth = toEarth.length();
        toEarth.divideScalar(dEarth);
        const q = this.attitude(c, toSun, toEarth);
        g.matrix.compose(rel, q, new Vector3(1, 1, 1));
        const track = g.userData.track as Group | undefined;
        if (track) {
          // the arrays turn about the truss (y) to face the Sun
          const sb = toSun.clone().applyQuaternion(q.clone().invert());
          track.rotation.set(0, Math.atan2(sb.x, sb.z), 0);
        }
        g.matrixWorldNeedsUpdate = true;
        this.uniforms.uSunDir.value.copy(toSun);
        this.uniforms.uSunIrr.value = E;
        this.uniforms.uEarthDir.value.copy(toEarth);
        // earthshine for spacecraft in low orbit: the lit Earth fills half the sky
        this.uniforms.uEarthshine.value = dEarth < 5e7 ? 0.3 * Math.max(0, 0.5 + 0.5 * toEarth.dot(toSun) * -1) * Math.min(1, (earth.radius / dEarth) ** 2 * 4) : 0;
      } else {
        if (grp) grp.visible = false;
        if (ns < 32) {
          // reflected sunlight from ~a third of its size squared, Lambert phase
          const area = 0.3 * (2 * c.radius) ** 2;
          const phase = 0.5 * (1 + toSun.dot(rel.clone().negate().normalize()));
          this.sp.pos.set([rel.x, rel.y, rel.z], ns * 3);
          this.sp.irr[ns] = (0.5 * area * E * phase) / (Math.PI * dist * dist);
          this.sp.col.set([1, 0.97, 0.92], ns * 3);
          ns++;
        }
      }
    }
    this.sprites.geometry.setDrawRange(0, ns);
    for (const k of ['position', 'aIrr', 'aColor']) this.sprites.geometry.attributes[k].needsUpdate = true;
  }

  /** How each craft points: antennas at Earth, heat shields and solar arrays at the Sun. */
  private attitude(c: Spacecraft, toSun: Vector3, toEarth: Vector3): Quaternion {
    const q = new Quaternion();
    const y = new Vector3(0, 1, 0);
    switch (c.model) {
      case 'voyager': case 'newhorizons': return q.setFromUnitVectors(y, toEarth);
      case 'jwst': return q.setFromUnitVectors(new Vector3(0, -1, 0), toSun);
      case 'iss': {
        // modules along the velocity, truss across the orbit plane
        const x = c.vel.clone().normalize();
        const yy = toEarth.clone().cross(x).normalize();
        return fromBasis(x, yy, x.clone().cross(yy));
      }
      case 'hubble': {
        // telescope across the sunlight, arrays square to it, door on the Sun side
        const x = toSun.clone().cross(Math.abs(toSun.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0)).normalize();
        return fromBasis(x, toSun.clone(), x.clone().cross(toSun));
      }
      default: return q.setFromUnitVectors(y, toSun);
    }
  }
}

function fromBasis(x: Vector3, y: Vector3, z: Vector3): Quaternion {
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}
