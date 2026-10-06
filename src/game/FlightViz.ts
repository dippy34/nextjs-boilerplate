import {
  BufferAttribute, BufferGeometry, CanvasTexture, DynamicDrawUsage, Group, LinearFilter, Line, Mesh, MeshBasicMaterial,
  NormalBlending, PlaneGeometry, type PerspectiveCamera, type Quaternion, ShaderMaterial, SRGBColorSpace, Vector3,
} from 'three';
import type { UPos } from '../core/upos';
import { FIX_LOGDEPTH, GLOBALS, OUTPUT_FRAGMENT, PROJECT_PARS } from '../render/shaders/xr';
import type { PredictEvent, Predictor } from '../sim/Predict';
import { fmtDist, fmtTime } from './Flight';

const VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
attribute float aT;
varying float vT;
void main() {
  vT = aT;
  gl_Position = projectView(modelViewMatrix * vec4(position, 1.0));
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;
const FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform vec3 uColor2;
uniform float uAlpha;
varying float vT;
void main() {
  // fades along the path: the near future bright, later orbits fainter
  vec3 c = mix(uColor, uColor2, clamp(vT, 0.0, 1.0));
  gl_FragColor = vec4(c, uAlpha * (1.0 - 0.6 * clamp(vT, 0.0, 1.0)));
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

const MAX_POINTS = 2400;

/** A flat label sprite drawn on a canvas, kept at a fixed apparent size in front of the eye. */
class Tag {
  readonly mesh: Mesh;
  private canvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private tex: CanvasTexture;
  private last = '';

  constructor() {
    this.canvas.width = 256;
    this.canvas.height = 96;
    this.ctx = this.canvas.getContext('2d')!;
    this.tex = new CanvasTexture(this.canvas);
    this.tex.colorSpace = SRGBColorSpace;
    this.tex.minFilter = LinearFilter;
    this.mesh = new Mesh(new PlaneGeometry(1, 96 / 256), new MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    this.mesh.renderOrder = 998;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  set(title: string, sub: string, color: string): void {
    const key = `${title}|${sub}|${color}`;
    if (key === this.last) return;
    this.last = key;
    const c = this.ctx;
    c.clearRect(0, 0, 256, 96);
    // a diamond on the left marks the exact spot
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(16, 30); c.lineTo(28, 42); c.lineTo(16, 54); c.lineTo(4, 42); c.closePath(); c.fill();
    c.font = '700 30px system-ui, sans-serif';
    c.textBaseline = 'middle';
    c.shadowColor = 'rgba(0,0,0,0.9)';
    c.shadowBlur = 6;
    c.fillText(title, 38, 30);
    c.font = '500 24px system-ui, sans-serif';
    c.fillStyle = 'rgba(230,240,255,0.95)';
    c.fillText(sub, 38, 66);
    this.tex.needsUpdate = true;
  }
}

/**
 * The predicted path (drawn relative to the body it is computed about, like an orbit line) with
 * apoapsis, periapsis, impact, escape and encounter markers; and a screen-space quad on the
 * camera for the g-force vignette, the re-entry plasma and the end-of-flight fades.
 */
export class FlightViz {
  readonly group = new Group();
  readonly screen: Mesh;
  private line: Line;
  private pos = new Float32Array(MAX_POINTS * 3);
  private tAttr = new Float32Array(MAX_POINTS);
  private mat: ShaderMaterial;
  private tags: Tag[] = [];
  private screenMat: ShaderMaterial;
  private shown: Predictor | null = null;
  private shownCount = -1;

  constructor() {
    this.group.name = 'flight-path';
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(this.pos, 3).setUsage(DynamicDrawUsage));
    geo.setAttribute('aT', new BufferAttribute(this.tAttr, 1).setUsage(DynamicDrawUsage));
    this.mat = new ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uColor: { value: new Vector3(0.35, 0.95, 1.0) }, uColor2: { value: new Vector3(0.25, 0.45, 1.0) }, uAlpha: { value: 0.9 }, uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK },
      transparent: true, depthWrite: false, depthTest: true,
    });
    this.line = new Line(geo, this.mat);
    this.line.frustumCulled = false;
    this.line.matrixAutoUpdate = false;
    this.line.renderOrder = 5;
    this.group.add(this.line);
    for (let i = 0; i < 8; i++) {
      const t = new Tag();
      this.tags.push(t);
      this.group.add(t.mesh);
    }
    // full-view quad hung on the camera
    this.screenMat = new ShaderMaterial({
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uVig; uniform float uPlasma; uniform float uFade; uniform vec3 uFadeColor; uniform float uTime; uniform float uRed;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float r = length(p * vec2(1.0, 0.85));
          // g-force: the edges close in (grey, then red for negative/extreme)
          float vig = smoothstep(1.25 - uVig * 0.9, 1.45 - uVig * 0.6, r) * min(1.0, uVig * 1.4);
          vec3 col = mix(vec3(0.0), vec3(0.35, 0.0, 0.0), uRed);
          float a = vig;
          // re-entry plasma: an orange-white sheath flickering at the edges and the bottom
          float flick = 0.75 + 0.25 * sin(uTime * 37.0 + p.x * 13.0) * sin(uTime * 23.0 + p.y * 9.0);
          float edge = smoothstep(0.55, 1.25, r + 0.25 * (1.0 - vUv.y));
          float pl = uPlasma * edge * flick;
          col = mix(col, vec3(1.0, 0.45 + 0.35 * uPlasma, 0.12 + 0.3 * uPlasma), clamp(pl / max(a + pl, 1e-3), 0.0, 1.0));
          a = max(a, pl * 0.85);
          // fades (crash white-out, horizon black)
          col = mix(col, uFadeColor, uFade);
          a = max(a, uFade);
          gl_FragColor = vec4(col, a);
        }`,
      uniforms: { uVig: { value: 0 }, uPlasma: { value: 0 }, uFade: { value: 0 }, uFadeColor: { value: new Vector3() }, uTime: { value: 0 }, uRed: { value: 0 } },
      transparent: true, depthTest: false, depthWrite: false, blending: NormalBlending,
    });
    this.screen = new Mesh(new PlaneGeometry(2, 2), this.screenMat);
    this.screen.position.set(0, 0, -0.12);
    this.screen.renderOrder = 1000;
    this.screen.frustumCulled = false;
    this.screen.visible = false;
  }

  /** Fit the quad to the camera's view (desktop) or a wide square (VR). */
  fitScreen(cam: PerspectiveCamera, xr: boolean): void {
    const d = 0.12;
    const h = 2 * d * Math.tan((cam.fov * Math.PI) / 360) * (xr ? 2.2 : 1.02);
    const w = h * (xr ? 1.2 : cam.aspect) * 1.02;
    this.screen.scale.set(w / 2, h / 2, 1);
  }

  setEffects(vig: number, red: number, plasma: number, fade: number, fadeColor: [number, number, number], time: number): void {
    const u = this.screenMat.uniforms;
    u.uVig.value = vig;
    u.uRed.value = red;
    u.uPlasma.value = plasma;
    u.uFade.value = fade;
    u.uFadeColor.value.set(...fadeColor);
    u.uTime.value = time;
    this.screen.visible = vig > 0.002 || plasma > 0.002 || fade > 0.002;
  }

  /**
   * Draw `p` (points relative to `frameUpos`) from camera `cam`; marker tags face the eye and keep
   * their size. `viewQuat` is the eye's world orientation.
   */
  update(p: Predictor | null, frameUpos: UPos | null, cam: UPos, viewQuat: Quaternion, pixelAngle: number, visible: boolean, groundR = 0): void {
    const show = visible && !!p && !!frameUpos && p.count > 1;
    this.line.visible = show;
    for (const t of this.tags) t.mesh.visible = false;
    if (!show) return;
    const rel = frameUpos!.sub(cam, _v);
    this.line.matrix.makeTranslation(rel.x, rel.y, rel.z);
    this.line.matrixWorldNeedsUpdate = true;
    if (p !== this.shown || p!.count !== this.shownCount) {
      this.shown = p;
      this.shownCount = p!.count;
      const n = Math.min(p!.count, MAX_POINTS);
      for (let i = 0; i < n * 3; i++) this.pos[i] = p!.points[i];
      for (let i = 0; i < n; i++) this.tAttr[i] = i / Math.max(1, n - 1);
      const g = this.line.geometry;
      g.setDrawRange(0, n);
      (g.attributes.position as BufferAttribute).needsUpdate = true;
      (g.attributes.aT as BufferAttribute).needsUpdate = true;
    }
    // markers
    let k = 0;
    const seen = new Set<string>();
    for (const e of p!.events) {
      if (k >= this.tags.length) break;
      const key = e.kind;
      if ((key === 'ap' || key === 'pe') && seen.has(key)) continue;
      seen.add(key);
      const t = this.tags[k++];
      const [title, sub, color] = describe(e, groundR);
      t.set(title, sub, color);
      // place it along the true direction, 30 m out, with a fixed apparent size
      const world = _w.copy(e.pos).add(rel);
      const dist = world.length();
      if (dist <= 0) continue;
      const D = 30;
      t.mesh.position.copy(world).multiplyScalar(D / dist);
      const size = Math.max(pixelAngle * 150, 0.004) * D;
      t.mesh.scale.setScalar(size);
      t.mesh.quaternion.copy(viewQuat);
      // shift so the diamond (not the centre) sits on the point
      t.mesh.position.addScaledVector(_x.set(1, 0, 0).applyQuaternion(viewQuat), size * 0.44);
      t.mesh.visible = true;
    }
  }
}

function describe(e: PredictEvent, R: number): [string, string, string] {
  switch (e.kind) {
    case 'ap': return ['Ap', `${fmtDist(e.r - R)} · ${fmtTime(e.t)}`, '#7fd4ff'];
    case 'pe': return ['Pe', `${fmtDist(e.r - R)} · ${fmtTime(e.t)}`, e.r < R ? '#ff5a4a' : '#7fd4ff'];
    case 'impact': return [e.body ? `Impact ${e.body.name}` : 'Impact', `in ${fmtTime(e.t)}`, '#ff5a4a'];
    case 'horizon': return ['Event horizon', `in ${fmtTime(e.t)}`, '#ff5a4a'];
    case 'escape': return ['Escape', `in ${fmtTime(e.t)}`, '#ffd166'];
    case 'encounter': return [`${e.body?.name ?? ''} encounter`, `in ${fmtTime(e.t)}`, '#9dff8a'];
  }
}

const _v = new Vector3();
const _w = new Vector3();
const _x = new Vector3();
