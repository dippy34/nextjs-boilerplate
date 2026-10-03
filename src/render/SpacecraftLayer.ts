import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CylinderGeometry, DoubleSide, DynamicDrawUsage, Group, Matrix4, Mesh,
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
varying vec3 vN;
varying vec3 vPos;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
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
uniform vec3 uSunDir;
uniform float uSunIrr;
uniform float uExposure;
uniform vec3 uEarthDir;
uniform float uEarthshine;
varying vec3 vN;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(-vPos);
  if (dot(n, V) < 0.0) n = -n;      // thin panels: light both faces
  float mu0 = max(dot(n, uSunDir), 0.0);
  vec3 H = normalize(uSunDir + V);
  float spec = uSpec * pow(max(dot(n, H), 0.0), mix(8.0, 90.0, uSpec)) * 2.5;
  float earth = uEarthshine * max(dot(n, uEarthDir), 0.0);
  // a little fill light (as a photographer would add) keeps shaded parts readable
  vec3 rad = (uColor * (mu0 + 0.1 + earth) + spec * mix(vec3(1.0), uColor, 0.6) * step(0.0, dot(vN, uSunDir) + 0.3)) * (uSunIrr / 3.14159265);
  gl_FragColor = vec4(min(rad * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

type Finish = 'gold' | 'white' | 'silver' | 'panel' | 'dark' | 'shield' | 'mirror' | 'rtg';
const FINISH: Record<Finish, [number, number, number, number]> = {
  gold: [0.85, 0.6, 0.18, 0.55], white: [0.82, 0.82, 0.8, 0.15], silver: [0.62, 0.64, 0.67, 0.7], panel: [0.06, 0.09, 0.2, 0.6],
  dark: [0.1, 0.1, 0.11, 0.2], shield: [0.72, 0.62, 0.78, 0.45], mirror: [1.0, 0.72, 0.28, 0.95], rtg: [0.3, 0.3, 0.32, 0.3],
};

interface Part { g: BG; f: Finish; p?: [number, number, number]; r?: [number, number, number] }

const box = (x: number, y: number, z: number) => new BoxGeometry(x, y, z);
const cyl = (r: number, h: number, seg = 16, r2 = r) => new CylinderGeometry(r2, r, h, seg);
/** shallow dish opening towards +y */
const dish = (d: number) => new SphereGeometry(d * 0.75, 24, 6, 0, Math.PI * 2, Math.PI - 0.73, 0.73).translate(0, d * 0.75 * 0.75, 0);
const rod = (len: number, r = 0.03) => cyl(r, len, 6);

/** Hand-built models at true size (metres). Forward/"front" axes per kind are noted. */
function parts(kind: string): Part[] {
  switch (kind) {
    case 'voyager': // +y: high-gain antenna towards Earth
      return [
        { g: cyl(0.9, 0.47, 10), f: 'dark' }, { g: dish(3.66), f: 'white', p: [0, 0.3, 0] },
        { g: rod(13), f: 'silver', r: [0, 0, Math.PI / 2], p: [-6.5, -0.2, 0] },
        { g: rod(2.3, 0.05), f: 'silver', r: [0, 0, Math.PI / 2], p: [1.6, -0.2, 0.3] },
        ...[0, 1, 2].map((i) => ({ g: cyl(0.2, 0.5, 8), f: 'rtg' as Finish, r: [0, 0, Math.PI / 2] as [number, number, number], p: [2.0 + i * 0.55, -0.2, 0.3] as [number, number, number] })),
        { g: rod(2.5, 0.05), f: 'silver', r: [Math.PI / 2, 0, 0], p: [0, -0.2, -1.6] }, { g: box(0.5, 0.5, 0.7), f: 'gold', p: [0, -0.2, -2.9] },
      ];
    case 'newhorizons': // +y: antenna towards Earth
      return [
        { g: cyl(1.2, 0.7, 3), f: 'gold' }, { g: dish(2.1), f: 'white', p: [0, 0.35, 0] },
        { g: cyl(0.2, 1.1, 10), f: 'rtg', r: [0, 0, Math.PI / 2], p: [1.4, 0, 0] },
      ];
    case 'parker': // +y: heat shield towards the Sun
      return [
        { g: cyl(1.15, 0.115, 32), f: 'white', p: [0, 0.6, 0] }, { g: cyl(0.55, 1.0, 6), f: 'gold', p: [0, -0.2, 0] },
        { g: box(1.6, 0.04, 0.5), f: 'panel', p: [1.1, -0.1, 0] }, { g: box(1.6, 0.04, 0.5), f: 'panel', p: [-1.1, -0.1, 0] },
        { g: rod(1.2, 0.04), f: 'silver', p: [0, 0.1, 0.4] }, { g: rod(1.2, 0.04), f: 'silver', p: [0, 0.1, -0.4] },
      ];
    case 'lucy': // +y: solar arrays towards the Sun
      return [
        { g: box(1.8, 1.8, 2.2), f: 'gold' }, { g: dish(2), f: 'white', p: [0, 0, 1.3], r: [Math.PI / 2, 0, 0] },
        { g: cyl(3.65, 0.06, 32), f: 'panel', p: [5.3, 0, 0] }, { g: cyl(3.65, 0.06, 32), f: 'panel', p: [-5.3, 0, 0] },
        { g: rod(1.6, 0.05), f: 'silver', r: [0, 0, Math.PI / 2], p: [1.6, 0, 0] }, { g: rod(1.6, 0.05), f: 'silver', r: [0, 0, Math.PI / 2], p: [-1.6, 0, 0] },
      ];
    case 'jwst': { // -y: towards the Sun (sunshield), mirror above it facing +z
      const out: Part[] = [];
      // kite-shaped sunshield, 21.2 x 14.2 m, five layers
      for (let l = 0; l < 5; l++) {
        const y = l * 0.12;
        const v = new Float32Array([-10.6, y, 0, 0, y, 7.1, 10.6, y, 0, -10.6, y, 0, 10.6, y, 0, 0, y, -7.1]);
        const g = new BufferGeometry();
        g.setAttribute('position', new BufferAttribute(v, 3));
        g.computeVertexNormals();
        out.push({ g, f: l === 0 ? 'silver' : 'shield' });
      }
      out.push({ g: box(2.0, 1.2, 2.0), f: 'dark', p: [0, -0.8, 0] });
      // primary mirror: 18 hexagonal gold segments (1.32 m flat to flat) on a backplane tilted up
      const seg = cyl(0.75, 0.06, 6);
      const mirror: [number, number][] = [];
      for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
        const s = -q - r;
        const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
        if (ring === 0 || ring > 2) continue;
        mirror.push([1.32 * (q + r / 2), 1.32 * 0.866 * r]);
      }
      for (const [x, z] of mirror) out.push({ g: seg, f: 'mirror', r: [Math.PI / 2, 0, Math.PI / 6], p: [x, 3.8 + z, 1.2] });
      out.push({ g: box(6.6, 6.0, 0.3), f: 'dark', p: [0, 3.8, 0.95] });
      for (const a of [0, 2.09, 4.19]) out.push({ g: rod(7.2, 0.04), f: 'silver', r: [Math.PI / 2 - 0.15, 0, 0], p: [Math.cos(a) * 2.2, 3.8 + Math.sin(a) * 2.2, 4.6] });
      out.push({ g: cyl(0.37, 0.1, 6), f: 'mirror', r: [Math.PI / 2, 0, 0], p: [0, 3.8, 8.1] });
      return out;
    }
    case 'iss': { // x: flight direction, y: truss across the orbit
      const out: Part[] = [{ g: box(1.6, 109, 1.6), f: 'white' }];
      // eight solar array wings (each 35 x 12 m), spread along the flight direction
      for (const y of [-48, -36, 36, 48]) for (const x of [-17.5, 17.5]) out.push({ g: box(33, 11.6, 0.08), f: 'gold', p: [x, y, 0] });
      for (const y of [-22, 22]) out.push({ g: box(13, 0.05, 3.2), f: 'white', p: [0, y, -4] });
      // modules along x
      out.push({ g: cyl(2.1, 50, 16), f: 'white', r: [0, 0, Math.PI / 2], p: [0, 0, 4.5] });
      out.push({ g: cyl(2.1, 9, 16), f: 'white', r: [Math.PI / 2, 0, 0], p: [-8, 0, 4.5] });
      out.push({ g: cyl(2.1, 9, 16), f: 'white', r: [Math.PI / 2, 0, 0], p: [12, 0, 4.5] });
      out.push({ g: box(9, 0.05, 2.5), f: 'panel', p: [-24, 0, 6] });
      return out;
    }
    case 'hubble': // z: telescope axis
      return [
        { g: cyl(2.1, 13.2, 24), f: 'silver', r: [Math.PI / 2, 0, 0] }, { g: cyl(2.12, 0.8, 24), f: 'dark', r: [Math.PI / 2, 0, 0], p: [0, 0, 6.3] },
        { g: box(7.1, 0.04, 2.6), f: 'panel', p: [6.0, 0, -1] }, { g: box(7.1, 0.04, 2.6), f: 'panel', p: [-6.0, 0, -1] },
        { g: rod(2.2, 0.08), f: 'silver', r: [0, 0, Math.PI / 2], p: [2.6, 0, -1] }, { g: rod(2.2, 0.08), f: 'silver', r: [0, 0, Math.PI / 2], p: [-2.6, 0, -1] },
      ];
    default: { // large solar-powered probe (Europa Clipper, Juice, Psyche): +y arrays towards the Sun
      return [
        { g: cyl(0.9, 3.0, 12), f: 'gold' }, { g: dish(3), f: 'white', p: [0, 1.6, 0] },
        { g: box(12.5, 0.06, 4.1), f: 'panel', p: [7.6, 0, 0] }, { g: box(12.5, 0.06, 4.1), f: 'panel', p: [-7.6, 0, 0] },
        { g: rod(1.5, 0.06), f: 'silver', r: [0, 0, Math.PI / 2], p: [1.3, 0, 0] }, { g: rod(1.5, 0.06), f: 'silver', r: [0, 0, Math.PI / 2], p: [-1.3, 0, 0] },
        { g: rod(8, 0.03), f: 'silver', r: [Math.PI / 2, 0, 0], p: [0, -1.2, 4] },
      ];
    }
  }
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
      const [r, g, b, s] = FINISH[f];
      m = new ShaderMaterial({
        name: 'spacecraft', vertexShader: HULL_VERT, fragmentShader: HULL_FRAG, side: DoubleSide,
        uniforms: { uColor: { value: new Vector3(r, g, b) }, uSpec: { value: s }, uExposure: this.exposure, ...this.uniforms, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
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
    for (const p of parts(c.model)) {
      const m = new Mesh(p.g, this.mat(p.f));
      if (p.r) m.rotation.set(...p.r);
      if (p.p) m.position.set(...p.p);
      m.frustumCulled = false;
      grp.add(m);
    }
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
        g.matrix.compose(rel, this.attitude(c, toSun, toEarth), new Vector3(1, 1, 1));
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
      case 'hubble': return fromBasis(new Vector3(1, 0, 0), toSun.clone().cross(new Vector3(1, 0, 0)).normalize(), toSun.clone().negate());
      default: return q.setFromUnitVectors(y, toSun);
    }
  }
}

function fromBasis(x: Vector3, y: Vector3, z: Vector3): Quaternion {
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}
