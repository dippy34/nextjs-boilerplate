import {
  AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, Group, Line, Points, ShaderMaterial, Vector3,
} from 'three';
import { sampleOrbit, stateToElements } from '../astro/kepler';
import type { UPos } from '../core/upos';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, POINT_CLIP, PROJECT_PARS } from '../render/shaders/xr';
import type { Entity, Sandbox, SandboxEffect } from './Sandbox';
import { FxMode, GodFx } from './GodFx';

const LINE_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute float aAlpha;
varying float vAlpha;
void main() {
  vAlpha = aAlpha;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;
const LINE_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uAlpha;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(uColor, uAlpha * vAlpha);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;
const POINT_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute vec4 aColor;   // rgb, alpha
attribute float aSize;   // pixels
varying vec4 vColor;
void main() {
  vColor = aColor;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
${POINT_CLIP}
  gl_PointSize = aSize;
}`;
const POINT_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
varying vec4 vColor;
void main() {
  vec2 d = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(d, d);
  if (r2 > 1.0) discard;
  float a = exp(-3.0 * r2);
  gl_FragColor = vec4(vColor.rgb * a, vColor.a * a);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

function lineMaterial(color: [number, number, number], alpha: number): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: LINE_VERT, fragmentShader: LINE_FRAG,
    uniforms: { uColor: { value: new Vector3(...color) }, uAlpha: { value: alpha }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
    transparent: true, depthWrite: false, depthTest: true,
  });
}

class DynLine {
  readonly line: Line;
  readonly pos: Float32Array;
  readonly alpha: Float32Array;
  constructor(readonly max: number, color: [number, number, number], alpha: number) {
    this.pos = new Float32Array(max * 3);
    this.alpha = new Float32Array(max).fill(1);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(this.pos, 3).setUsage(DynamicDrawUsage));
    g.setAttribute('aAlpha', new BufferAttribute(this.alpha, 1).setUsage(DynamicDrawUsage));
    this.line = new Line(g, lineMaterial(color, alpha));
    this.line.frustumCulled = false;
    this.line.matrixAutoUpdate = false;
    this.line.renderOrder = 6;
  }
  commit(n: number): void {
    this.line.geometry.setDrawRange(0, n);
    this.line.geometry.attributes.position.needsUpdate = true;
    this.line.geometry.attributes.aAlpha.needsUpdate = true;
    this.line.visible = n > 1;
  }
}

class PointCloud {
  readonly points: Points;
  readonly pos: Float32Array;
  readonly col: Float32Array;
  readonly size: Float32Array;
  constructor(readonly max: number, additive = true) {
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(this.pos, 3).setUsage(DynamicDrawUsage));
    g.setAttribute('aColor', new BufferAttribute(this.col, 4).setUsage(DynamicDrawUsage));
    g.setAttribute('aSize', new BufferAttribute(this.size, 1).setUsage(DynamicDrawUsage));
    this.points = new Points(g, new ShaderMaterial({
      vertexShader: POINT_VERT, fragmentShader: POINT_FRAG,
      uniforms: { uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
      transparent: true, depthWrite: false, ...(additive ? { blending: AdditiveBlending } : {}),
    }));
    this.points.frustumCulled = false;
    this.points.renderOrder = 12;
  }
  commit(n: number): void {
    const g = this.points.geometry;
    g.setDrawRange(0, n);
    for (const k of ['position', 'aColor', 'aSize']) g.attributes[k].needsUpdate = true;
    this.points.visible = n > 0;
  }
}

interface Trail { primary: number; pts: Float64Array; n: number; head: number; line: DynLine; seen: number }

const TRAIL_POINTS = 360;
const ORBIT_POINTS = 180;
const MAX_ORBITS = 48;
/** seconds an edited orbit takes to ease into its new shape */
const MORPH_S = 0.7;

/**
 * God mode's overlays in the scene: orbit trails (where things have been), predicted orbits
 * (osculating conics about their primary, live while editing), the velocity handle of the
 * selection, collision flashes and debris, tidal debris rings and asteroid swarms.
 */
export class GodLayer {
  readonly group = new Group();
  /** entity whose velocity handle is shown */
  selected: Entity | null = null;
  /** velocity being dragged (absolute, m/s) in place of the selection's own */
  previewVel: Vector3 | null = null;
  /** a body being dragged to a new place */
  movePreview: { e: Entity; at: Vector3 } | null = null;
  /** something being placed (and thrown from `from` towards `to`) */
  placePreview: { from: Vector3; to: Vector3 } | null = null;
  private guide = new DynLine(2, [0.6, 1, 0.75], 0.9);
  /** handle length per (relative speed / circular speed), as a fraction of the eye's distance */
  arrowScale = 0.25;
  showTrails = true;
  showOrbits = true;
  private trails = new Map<number, Trail>();
  private orbitLines: DynLine[] = [];
  private arrow = new DynLine(2, [1, 0.85, 0.3], 0.95);
  private arrowTip: PointCloud;
  private preview = new DynLine(ORBIT_POINTS + 1, [1, 0.85, 0.3], 0.9);
  /** impacts, disruptions, swallows, formation (GPU particles) */
  readonly fx: GodFx;
  /** a black hole's drawable (its disk flares after a swallow) */
  holeOf: ((e: Entity) => { diskTmax: number } | null) | null = null;
  /** radians per pixel, for the effects' smallest size */
  pixelAngle = 1e-3;
  private marker: PointCloud;
  /** glows at the bodies' places on their predicted paths */
  private heads: PointCloud;
  private headN = 0;
  private swarm: PointCloud;
  private tmp = new Float64Array(ORBIT_POINTS * 3);
  /** where the arrow's tip was drawn (camera-relative, m), for dragging */
  readonly tip = new Vector3();
  tipVisible = false;

  constructor(private sandbox: Sandbox) {
    this.group.name = 'god';
    this.group.add(this.arrow.line, this.preview.line, this.guide.line);
    this.arrowTip = new PointCloud(1);
    this.marker = new PointCloud(1);
    this.heads = new PointCloud(MAX_ORBITS + 1);
    this.swarm = new PointCloud(2048, false);
    this.fx = new GodFx((e) => sandbox.entities.get(e.id) === e);
    this.group.add(this.arrowTip.points, this.marker.points, this.heads.points, this.swarm.points, this.fx.group);
    this.group.visible = false;
  }

  /** Forget trails, rings and effects (back to the real universe). */
  clear(): void {
    for (const t of this.trails.values()) this.group.remove(t.line.line);
    this.trails.clear();
    this.fx.clear();
  }

  /** Draw what the simulation reported: an impact, a tidal disruption, a swallow (src/god/GodFx.ts). */
  addEffect(fx: SandboxEffect): void {
    const ev = fx.event;
    const at = new Vector3(ev.x, ev.y, ev.z);
    const surv = fx.survivor;
    const ratio = surv && surv.gm > 0 ? ev.gm / surv.gm : 0;
    if (ev.kind === 'impact') {
      // a test particle (an asteroid of a swarm) hits: a small splash, no scar
      this.fx.add({ mode: FxMode.Glow, count: 1, at, follow: surv, R: Math.max(surv?.radius ?? 1e5, 1e5) * 0.15, life: 1.2, jd: fx.jd, p: [2, 8, 2.5, 0], color: [1, 0.8, 0.6] });
      return;
    }
    if (ev.kind === 'roche' && surv && ev.ringR) {
      this.fx.disrupt(at, surv, ev.ringR, new Vector3(ev.nx ?? 0, ev.ny ?? 0, ev.nz ?? 1).normalize(), fx.victimRadius, fx.jd);
      return;
    }
    if (ev.kind === 'swallow' && surv) {
      this.fx.swallow(at, surv, fx.victimRadius, ratio, fx.jd, this.holeOf?.(surv) ?? null);
      return;
    }
    this.fx.impact(at, surv, fx.victimRadius, ratio, ev.speed, fx.jd);
  }

  /** Is an entity's trail drawn: planets and dwarf planets, anything spawned, the selection. */
  private wantsTrail(e: Entity): boolean {
    if (e === this.selected) return true;
    if (e.kind === 'swarm') return false;
    if (e.kind !== 'body') return true;
    const k = e.body?.kind;
    return k === 'planet' || k === 'dwarf' || (k === 'moon' && e.mode === 'massive' && this.sandbox.primaryOf(e) === this.focusPrimary);
  }
  /** moons of this body get trails and orbits (the body the eye is near) */
  focusPrimary: Entity | null = null;

  update(cam: UPos, camDist: (p: Vector3) => number): void {
    const sb = this.sandbox;
    this.group.visible = sb.active;
    if (!sb.active) { this.arrow.line.visible = false; this.preview.line.visible = false; return; }
    const camV = cam.toVector3();
    // trails
    const seen = performance.now();
    if (this.showTrails) {
      for (const e of sb.entities.values()) {
        if (!this.wantsTrail(e)) continue;
        const p = sb.primaryOf(e);
        let t = this.trails.get(e.id);
        if (!t || t.primary !== (p?.id ?? -1)) {
          if (t) this.group.remove(t.line.line);
          const line = new DynLine(TRAIL_POINTS, e === this.selected ? [1, 0.9, 0.4] : e.kind === 'body' && e.body?.kind === 'moon' ? [0.45, 0.9, 0.65] : [0.5, 0.75, 1], 0.65);
          t = { primary: p?.id ?? -1, pts: new Float64Array(TRAIL_POINTS * 3), n: 0, head: 0, line, seen };
          this.trails.set(e.id, t);
          this.group.add(line.line);
        }
        t.seen = seen;
        // store positions relative to the primary; a new point every ~0.7 degrees of arc
        const rx = e.pos.x - (p?.pos.x ?? 0), ry = e.pos.y - (p?.pos.y ?? 0), rz = e.pos.z - (p?.pos.z ?? 0);
        const last = (t.head + TRAIL_POINTS - 1) % TRAIL_POINTS;
        const dx = rx - t.pts[last * 3], dy = ry - t.pts[last * 3 + 1], dz = rz - t.pts[last * 3 + 2];
        const r2 = rx * rx + ry * ry + rz * rz;
        if (t.n === 0 || dx * dx + dy * dy + dz * dz > 1.5e-4 * r2) {
          t.pts[t.head * 3] = rx; t.pts[t.head * 3 + 1] = ry; t.pts[t.head * 3 + 2] = rz;
          t.head = (t.head + 1) % TRAIL_POINTS;
          t.n = Math.min(TRAIL_POINTS, t.n + 1);
        }
        // draw: oldest first, ending at the body; relative to the primary's position now
        const ox = (p?.pos.x ?? 0) - camV.x, oy = (p?.pos.y ?? 0) - camV.y, oz = (p?.pos.z ?? 0) - camV.z;
        const L = t.line;
        let k = 0;
        for (let i = 0; i < t.n; i++) {
          const j = (t.head - t.n + i + TRAIL_POINTS) % TRAIL_POINTS;
          L.pos[k * 3] = ox + t.pts[j * 3]; L.pos[k * 3 + 1] = oy + t.pts[j * 3 + 1]; L.pos[k * 3 + 2] = oz + t.pts[j * 3 + 2];
          L.alpha[k] = ((i + 1) / t.n) ** 1.8; // fades away towards the tail
          k++;
        }
        if (k > 0 && k < TRAIL_POINTS) { L.pos[k * 3] = e.pos.x - camV.x; L.pos[k * 3 + 1] = e.pos.y - camV.y; L.pos[k * 3 + 2] = e.pos.z - camV.z; L.alpha[k] = 1; k++; }
        L.commit(k);
      }
    }
    for (const [id, t] of this.trails) {
      if (t.seen !== seen) { this.group.remove(t.line.line); this.trails.delete(id); }
    }
    // predicted orbits: planets about the star, moons of the focus, the selection
    const tNow = performance.now();
    this.morphDt = Math.max(0, Math.min(0.1, (tNow - this.morphNow) / 1000));
    this.morphNow = tNow;
    this.headN = 0;
    let used = 0;
    if (this.showOrbits) {
      for (const e of sb.entities.values()) {
        if (used >= MAX_ORBITS) break;
        if (!this.wantsTrail(e) || e === this.selected) continue;
        if (this.drawOrbit(e, e.vel, this.orbitLine(used), camV, false)) used++;
      }
    }
    for (let i = used; i < this.orbitLines.length; i++) this.orbitLines[i].line.visible = false;
    // the selection: its orbit (or the one being dragged) and the velocity handle
    const s = this.selected && sb.entities.get(this.selected.id) === this.selected ? this.selected : null;
    this.preview.line.visible = false;
    this.arrow.line.visible = false;
    this.arrowTip.points.visible = false;
    this.tipVisible = false;
    if (s) {
      const v = this.previewVel ?? s.vel;
      this.drawOrbit(s, v, this.preview, camV, true);
      const p = sb.primaryOf(s);
      const relV = v.clone().sub(p?.vel ?? new Vector3());
      const vc = p ? Math.sqrt((p.gm + s.gm) / Math.max(s.pos.distanceTo(p.pos), 1)) : Math.max(relV.length(), 1);
      const base = s.pos.clone().sub(camV);
      const len = this.arrowScale * camDist(s.pos) / Math.max(vc, 1e-9);
      this.tip.copy(base).addScaledVector(relV, len);
      const A = this.arrow;
      A.pos.set([base.x, base.y, base.z, this.tip.x, this.tip.y, this.tip.z]);
      A.alpha.set([1, 1]);
      A.commit(2);
      const T = this.arrowTip;
      T.pos.set([this.tip.x, this.tip.y, this.tip.z]);
      T.col.set([1, 0.85, 0.3, 1]);
      T.size[0] = 14;
      T.commit(1);
      this.tipVisible = true;
    }
    this.heads.commit(this.headN);
    for (const [id, m] of this.shown) if (m.seen !== this.morphNow) this.shown.delete(id);
    // dragging a body somewhere, or throwing something new
    const g = this.movePreview ? { a: this.movePreview.e.pos, b: this.movePreview.at } : this.placePreview ? { a: this.placePreview.from, b: this.placePreview.to } : null;
    if (g) {
      this.guide.pos.set([g.a.x - camV.x, g.a.y - camV.y, g.a.z - camV.z, g.b.x - camV.x, g.b.y - camV.y, g.b.z - camV.z]);
      this.guide.commit(2);
    } else this.guide.line.visible = false;
    this.fx.update(camV, sb.jd, this.pixelAngle);
    this.updateSwarm(camV);
    if (g) {
      // a marker where it will be
      const at = this.movePreview ? g.b : g.a;
      this.marker.pos.set([at.x - camV.x, at.y - camV.y, at.z - camV.z]);
      this.marker.col.set([0.6, 1, 0.75, 1]);
      this.marker.size[0] = 16;
      this.marker.commit(1);
    } else this.marker.points.visible = false;
  }

  private orbitLine(i: number): DynLine {
    while (this.orbitLines.length <= i) {
      const l = new DynLine(ORBIT_POINTS + 1, [0.45, 0.6, 1], 0.22);
      this.orbitLines.push(l);
      this.group.add(l.line);
    }
    return this.orbitLines[i];
  }

  /** Osculating conic of `e` (moving at `vel`) about its primary; an edit morphs the old one into it. */
  private drawOrbit(e: Entity, vel: Vector3, L: DynLine, camV: Vector3, selected: boolean): boolean {
    const p = this.sandbox.primaryOf(e);
    if (!p) { L.line.visible = false; return false; }
    const r = e.pos.clone().sub(p.pos), v = vel.clone().sub(p.vel);
    const mu = p.gm + e.gm;
    if (r.lengthSq() === 0 || mu <= 0) { L.line.visible = false; return false; }
    const el = stateToElements(r, v, mu, 0);
    const n = sampleOrbit(el, ORBIT_POINTS, this.tmp, r.length() * 6);
    const pts = this.morphed(selected ? -e.id - 1 : e.id, n, r.length(), selected && !!this.previewVel);
    const ox = p.pos.x - camV.x, oy = p.pos.y - camV.y, oz = p.pos.z - camV.z;
    for (let i = 0; i < n; i++) {
      L.pos[i * 3] = ox + pts[i * 3]; L.pos[i * 3 + 1] = oy + pts[i * 3 + 1]; L.pos[i * 3 + 2] = oz + pts[i * 3 + 2];
      L.alpha[i] = 1;
    }
    let k = n;
    if (el.e < 1) { L.pos.copyWithin(k * 3, 0, 3); L.alpha[k] = 1; k++; } // closed
    const col: [number, number, number] = selected ? [1, 0.85, 0.3] : e.kind !== 'body' ? [0.55, 1, 0.75] : [0.45, 0.6, 1];
    (L.line.material as ShaderMaterial).uniforms.uColor.value.set(...col);
    L.commit(k);
    // a glow where the body is now, on its path
    const H = this.heads, j = this.headN;
    if (j < H.max) {
      H.pos.set([e.pos.x - camV.x, e.pos.y - camV.y, e.pos.z - camV.z], j * 3);
      H.col.set([col[0] * 1.6, col[1] * 1.6, col[2] * 1.6, 0.9], j * 4);
      H.size[j] = selected ? 22 : 13;
      this.headN++;
    }
    return true;
  }

  /** orbits being morphed after an edit: the points shown (relative to the primary), and the morph */
  private shown = new Map<number, { pts: Float64Array; n: number; from: Float64Array | null; t: number; seen: number }>();
  private morphNow = performance.now();

  /**
   * The orbit points to draw for key `id` given the new ones in `tmp`: when they jump (an edit, a
   * kick, a new primary), the old orbit eases into the new one over MORPH_S instead of snapping.
   */
  private morphed(id: number, n: number, scale: number, immediate: boolean): Float64Array {
    const now = this.morphNow;
    let s = this.shown.get(id);
    if (!s || s.n !== n || immediate) {
      s = { pts: s?.pts ?? new Float64Array(ORBIT_POINTS * 3), n, from: null, t: 0, seen: now };
      s.pts.set(this.tmp.subarray(0, n * 3));
      this.shown.set(id, s);
      return s.pts;
    }
    s.seen = now;
    if (!s.from) {
      let d2 = 0;
      for (let i = 0; i < n * 3; i += 3) {
        const dx = this.tmp[i] - s.pts[i], dy = this.tmp[i + 1] - s.pts[i + 1], dz = this.tmp[i + 2] - s.pts[i + 2];
        d2 = Math.max(d2, dx * dx + dy * dy + dz * dz);
      }
      if (d2 > (0.03 * scale) ** 2) { s.from = s.pts.slice(0, n * 3); s.t = 0; }
    }
    if (s.from) {
      s.t += this.morphDt;
      const f = Math.min(1, s.t / MORPH_S), w = f * f * (3 - 2 * f);
      for (let i = 0; i < n * 3; i++) s.pts[i] = s.from[i] + (this.tmp[i] - s.from[i]) * w;
      if (f >= 1) s.from = null;
    } else s.pts.set(this.tmp.subarray(0, n * 3));
    return s.pts;
  }
  private morphDt = 0;

  /** Orbits morphing now (tests). */
  get morphing(): number { let k = 0; for (const s of this.shown.values()) if (s.from) k++; return k; }

  private updateSwarm(camV: Vector3): void {
    const S = this.swarm;
    let n = 0;
    for (const e of this.sandbox.entities.values()) {
      if (e.kind !== 'swarm' || n >= S.max) continue;
      S.pos[n * 3] = e.pos.x - camV.x; S.pos[n * 3 + 1] = e.pos.y - camV.y; S.pos[n * 3 + 2] = e.pos.z - camV.z;
      const sel = e === this.selected;
      S.col.set(sel ? [1, 0.9, 0.4, 1] : [0.75, 0.68, 0.6, 0.9], n * 4);
      S.size[n] = sel ? 7 : 4;
      n++;
    }
    S.commit(n);
  }
}
