import {
  BufferGeometry, CanvasTexture, Float32BufferAttribute, Group, Line, LineBasicMaterial, LinearFilter, Matrix4, Mesh,
  MeshBasicMaterial, PlaneGeometry, Quaternion, SRGBColorSpace, Sprite, SpriteMaterial, Vector3,
} from 'three';
import { formatUtc } from '../core/time';
import { formatDistance, formatSpeed } from '../core/units';
import type { LabelCandidate } from '../render/Labels';
import type { App } from './App';

/**
 * Immersive VR (WebXR) support: Quest / OpenXR headsets via any WebXR browser.
 *
 * Controls (xr-standard gamepad mapping):
 *   left stick   fly where the left controller points (speed scales with altitude)
 *   left grip    ×10 speed            left trigger   pause / resume time
 *   X / Y        slower / faster time  left stick click  real time, now
 *   right trigger select what the right ray points at
 *   A            go to selection      B              stop autopilot / clear selection
 *   right stick  snap turn (x) and flight speed (y)
 *   right grip + right stick         orbit around (x) / zoom to (y) the selection
 *   right stick click                labels on/off
 * Hand tracking / gaze-and-pinch (no gamepad): pinch to select, pinch the selection again to fly there,
 * pinch empty sky to stop or deselect.
 */
interface Hand {
  obj: Group;
  ray: Line;
  handedness: XRHandedness | 'none';
  source: XRInputSource | null;
  prev: boolean[];
}

const SNAP = (30 * Math.PI) / 180;
const LABEL_DIST = 20; // metres from the head
const LABEL_HEIGHT = 0.34; // metres (~1° tall)
const MAX_LABELS = 28;

export class VRSupport {
  session: XRSession | null = null;
  private hands: Hand[] = [];
  private turnArmed = true;
  private panel: Mesh | null = null;
  private panelCanvas = document.createElement('canvas');
  private panelTex: CanvasTexture | null = null;
  private panelTimer = 0;
  private labelPool: Sprite[] = [];
  private labelTex = new Map<string, { tex: CanvasTexture; aspect: number }>();
  private labelsGroup = new Group();
  private savedStarLimit = 7.5;
  private button: HTMLButtonElement | null = null;
  labelsOn = true;

  constructor(private app: App, readonly supported: boolean) {
    this.labelsGroup.name = 'vr-labels';
    this.app.renderer.scene.add(this.labelsGroup);
    if (supported) this.createButton();
  }

  /** True if the browser can start an immersive VR session (headset connected / built in). */
  static async detect(): Promise<boolean> {
    if (new URLSearchParams(location.search).get('xr') === '0') return false;
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (!xr) return false;
    try {
      return await Promise.race([
        xr.isSessionSupported('immersive-vr'),
        new Promise<boolean>((r) => setTimeout(() => r(false), 2500)),
      ]);
    } catch {
      return false;
    }
  }

  get active(): boolean {
    return this.session !== null;
  }

  private createButton(): void {
    const b = document.createElement('button');
    b.id = 'vr-button';
    b.textContent = 'ENTER VR';
    b.title = 'Enter immersive VR';
    b.addEventListener('click', () => (this.session ? this.session.end() : this.enter()));
    document.getElementById('app')!.appendChild(b);
    this.button = b;
  }

  async enter(): Promise<void> {
    if (this.session) return;
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr!;
    try {
      const session = await xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
      await this.app.renderer.gl.xr.setSession(session);
      this.session = session;
      session.addEventListener('end', () => this.onEnd());
      session.addEventListener('selectstart', (e) => this.onSelect(e as XRInputSourceEvent));
      this.onStart();
    } catch (err) {
      console.error('Could not start VR', err);
      this.app.hud.toast(`Could not start VR: ${err instanceof Error ? err.message : err}`);
    }
  }

  private onStart(): void {
    const r = this.app.renderer;
    r.setXrMode(true);
    this.savedStarLimit = this.app.starMagLimit;
    this.app.starMagLimit = Math.min(this.app.starMagLimit, 6.8); // fewer, brighter points: keeps headset frame rates up
    if (this.button) this.button.textContent = 'EXIT VR';
    if (this.hands.length === 0) {
      for (let i = 0; i < 2; i++) this.hands.push(this.makeHand(i));
    }
    for (const h of this.hands) h.obj.visible = true;
    this.labelsGroup.visible = true;
    this.flash('Left stick: fly · right trigger: select · A: go to');
  }

  private onEnd(): void {
    this.session = null;
    const r = this.app.renderer;
    r.setXrMode(false);
    // three leaves the last head pose on the camera; the desktop view looks along the dolly
    r.camera.position.set(0, 0, 0);
    r.camera.quaternion.identity();
    r.camera.scale.set(1, 1, 1);
    this.app.starMagLimit = this.savedStarLimit;
    for (const h of this.hands) h.obj.visible = false;
    this.labelsGroup.visible = false;
    if (this.button) this.button.textContent = 'ENTER VR';
    window.dispatchEvent(new Event('resize'));
  }

  private makeHand(index: number): Hand {
    const xr = this.app.renderer.gl.xr;
    const obj = xr.getController(index);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
    const ray = new Line(geo, new LineBasicMaterial({ color: 0x7fb2ff, transparent: true, opacity: 0.55, toneMapped: false, depthTest: false }));
    ray.scale.z = 4;
    ray.frustumCulled = false;
    obj.add(ray);
    const hand: Hand = { obj, ray, handedness: 'none', source: null, prev: [] };
    obj.addEventListener('connected', (e) => {
      const src = (e as unknown as { data: XRInputSource }).data;
      hand.source = src;
      hand.handedness = src.handedness;
      ray.visible = src.targetRayMode === 'tracked-pointer';
      if (src.handedness === 'left' || (!this.panel && src.handedness !== 'right')) this.attachPanel(obj);
    });
    obj.addEventListener('disconnected', () => {
      hand.source = null;
      hand.handedness = 'none';
    });
    // Controllers live on the dolly so they move and turn with the explorer.
    this.app.renderer.rig.add(obj);
    return hand;
  }

  /**
   * Trigger / pinch. The ray is taken from the event's own frame, which is exact
   * even for transient pointers (gaze-and-pinch) that exist only during the gesture.
   */
  private onSelect(e: XRInputSourceEvent): void {
    const src = e.inputSource;
    const handsOnly = !src.gamepad || !!src.hand || src.targetRayMode !== 'tracked-pointer';
    if (src.handedness === 'left' && !handsOnly) {
      this.app.togglePause();
      return;
    }
    const rigM = this.app.renderer.rig.matrixWorld;
    const ref = this.app.renderer.gl.xr.getReferenceSpace();
    const pose = ref ? e.frame.getPose(src.targetRaySpace, ref) : undefined;
    let m: Matrix4;
    if (pose) {
      m = new Matrix4().fromArray(pose.transform.matrix).premultiply(rigM);
    } else {
      const hand = this.hands.find((h) => h.source === src);
      if (!hand) return;
      hand.obj.updateMatrixWorld(true);
      m = hand.obj.matrixWorld.clone();
    }
    const origin = new Vector3().setFromMatrixPosition(m);
    const dir = new Vector3(0, 0, -1).transformDirection(m);
    const hit = this.app.pickRay(origin, dir);
    // Without thumbsticks (hand tracking), pinching the current selection again flies there.
    if (handsOnly && hit && hit === this.app.selection) {
      this.app.goTo(hit);
      this.flash(`Going to ${hit.name}`);
      return;
    }
    if (handsOnly && !hit) {
      this.app.cancelOrDeselect();
      return;
    }
    this.app.select(hit);
    if (hit) this.flash(handsOnly ? `${hit.name} — pinch again to go there` : `Selected ${hit.name}`);
  }

  private flashText = '';
  private flashUntil = 0;
  /** Short message on the wrist panel (and the desktop mirror). */
  private flash(text: string): void {
    this.flashText = text;
    this.flashUntil = performance.now() + 2500;
    this.panelTimer = 0;
    this.app.hud.toast(text);
  }

  /** Controller state -> camera rig inputs and actions. Called every frame while presenting. */
  updateInput(dt: number): void {
    const s = this.session;
    if (!s) return;
    const rig = this.app.rig;
    const headQ = this.app.renderer.camera.getWorldQuaternion(new Quaternion());
    for (const h of this.hands) {
      const src = h.source;
      const gp = src?.gamepad;
      if (!src || !gp) continue;
      const ax = gp.axes.length >= 4 ? [gp.axes[2], gp.axes[3]] : [gp.axes[0] ?? 0, gp.axes[1] ?? 0];
      const x = Math.abs(ax[0]) > 0.15 ? ax[0] : 0;
      const y = Math.abs(ax[1]) > 0.15 ? ax[1] : 0;
      const pressed = gp.buttons.map((b) => b.pressed);
      const edge = (i: number) => !!pressed[i] && !h.prev[i];
      const squeeze = (gp.buttons[1]?.value ?? 0) > 0.5;
      if (h.handedness === 'left') {
        if (x || y) {
          const ctrlQ = h.obj.getWorldQuaternion(new Quaternion());
          const fwd = new Vector3(0, 0, -1).applyQuaternion(ctrlQ);
          const up = new Vector3(0, 1, 0).applyQuaternion(headQ);
          const right = new Vector3().crossVectors(fwd, up).normalize();
          const move = fwd.multiplyScalar(-y).add(right.multiplyScalar(x));
          const mag = Math.min(1, Math.hypot(x, y));
          rig.ext.move.copy(move.normalize().multiplyScalar(mag * mag));
        }
        rig.ext.boost = squeeze ? 10 : 1;
        if (edge(4)) this.app.timeSlower();
        if (edge(5)) this.app.timeFaster();
        if (edge(3)) this.app.realTime();
      } else if (h.handedness === 'right') {
        if (squeeze) {
          rig.ext.orbitX = x;
          rig.ext.zoom = y;
        } else {
          if (Math.abs(x) > 0.7 && this.turnArmed) {
            rig.turn(-Math.sign(x) * SNAP);
            this.turnArmed = false;
          } else if (Math.abs(x) < 0.3) {
            this.turnArmed = true;
          }
          if (y) rig.speedFactor = Math.min(1e6, Math.max(1e-4, rig.speedFactor * Math.exp(-y * dt * 1.5)));
        }
        if (edge(4) && this.app.selection) this.app.goTo(this.app.selection);
        if (edge(5)) this.app.cancelOrDeselect();
        if (edge(3)) this.labelsOn = !this.labelsOn;
      }
      h.prev = pressed;
    }
  }

  // ------------------------------------------------------------------ overlays
  updateOverlays(cands: LabelCandidate[], dt: number): void {
    if (!this.session) return;
    this.updateLabels(cands);
    this.panelTimer -= dt;
    if (this.panel && this.panelTimer <= 0) {
      this.panelTimer = 0.25;
      this.drawPanel();
    }
  }

  private updateLabels(cands: LabelCandidate[]): void {
    for (const sp of this.labelPool) sp.visible = false;
    if (!this.labelsOn) return;
    const head = this.app.renderer.camera.getWorldPosition(new Vector3());
    const headUp = new Vector3(0, 1, 0).applyQuaternion(this.app.renderer.camera.getWorldQuaternion(new Quaternion()));
    const top = cands.filter((c) => c.rel).sort((a, b) => b.priority - a.priority).slice(0, MAX_LABELS);
    top.forEach((c, i) => {
      let sp = this.labelPool[i];
      if (!sp) {
        sp = new Sprite(new SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
        sp.renderOrder = 100;
        sp.frustumCulled = false;
        this.labelsGroup.add(sp);
        this.labelPool.push(sp);
      }
      const { tex, aspect } = this.labelTexture(c.text, c.cls);
      if (sp.material.map !== tex) {
        sp.material.map = tex;
        sp.material.needsUpdate = true;
      }
      const dir = c.rel!.clone().sub(head).normalize();
      sp.position.copy(head).addScaledVector(dir, LABEL_DIST).addScaledVector(headUp, LABEL_HEIGHT * 0.9);
      sp.scale.set(LABEL_HEIGHT * aspect, LABEL_HEIGHT, 1);
      sp.visible = true;
    });
  }

  private labelTexture(text: string, cls: string): { tex: CanvasTexture; aspect: number } {
    const key = `${cls}|${text}`;
    let t = this.labelTex.get(key);
    if (t) return t;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    const font = '600 44px Inter, "Segoe UI", system-ui, sans-serif';
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + 24;
    c.width = w;
    c.height = 64;
    ctx.font = font;
    const colors: Record<string, string> = { planet: '#9cc4ff', dwarf: '#ffbe7a', moon: '#9fe0bb', star: '#f3e3b0', comet: '#9feaff', selected: '#fff27a' };
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = colors[cls] ?? '#d8e2f0';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 12, 33);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.minFilter = LinearFilter;
    t = { tex, aspect: w / 64 };
    if (this.labelTex.size > 300) {
      for (const [k, v] of this.labelTex) { v.tex.dispose(); this.labelTex.delete(k); if (this.labelTex.size < 200) break; }
    }
    this.labelTex.set(key, t);
    return t;
  }

  private attachPanel(parent: Group): void {
    const c = this.panelCanvas;
    c.width = 1024;
    c.height = 640;
    this.panelTex = new CanvasTexture(c);
    this.panelTex.colorSpace = SRGBColorSpace;
    const mat = new MeshBasicMaterial({ map: this.panelTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    const mesh = new Mesh(new PlaneGeometry(0.2, 0.125), mat);
    mesh.position.set(0, 0.075, -0.04);
    mesh.rotation.x = -0.7;
    mesh.renderOrder = 200;
    mesh.frustumCulled = false;
    this.panel?.parent?.remove(this.panel);
    parent.add(mesh);
    this.panel = mesh;
    this.drawPanel();
  }

  private drawPanel(): void {
    const c = this.panelCanvas;
    const ctx = c.getContext('2d')!;
    const app = this.app;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(8, 12, 22, 0.86)';
    ctx.strokeStyle = 'rgba(127, 178, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(4, 4, c.width - 8, c.height - 8, 24);
    ctx.fill();
    ctx.stroke();
    let y = 56;
    const line = (text: string, size: number, color: string, weight = 400) => {
      ctx.font = `${weight} ${size}px Inter, "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = color;
      ctx.fillText(text, 32, y);
      y += size * 1.3;
    };
    line(formatUtc(app.clock.jdTdb), 34, '#ffffff', 600);
    line(app.clock.paused ? 'PAUSED' : app.rateText(), 28, app.clock.paused ? '#ffcc66' : '#7fb2ff');
    y += 8;
    const sel = app.selection;
    if (sel) {
      line(sel.name, 46, '#fff27a', 700);
      const dist = sel.upos.sub(app.rig.upos).length();
      line(`Distance  ${formatDistance(dist)}`, 28, '#d8e2f0');
      for (const [k, v] of sel.info().slice(0, 4)) line(`${k}  ${v}`.slice(0, 60), 26, '#aab6c8');
    } else {
      line('Point the right controller and pull the trigger to select', 26, '#aab6c8');
    }
    if (performance.now() < this.flashUntil) {
      y = c.height - 140;
      line(this.flashText.slice(0, 60), 30, '#fff27a', 600);
    }
    y = c.height - 96;
    line(`Speed ${formatSpeed(app.rig.speed)}  ·  Altitude ${formatDistance(app.rig.altitude)}`, 26, '#d8e2f0');
    line('L-stick fly · L-grip ×10 · R-stick turn/speed · A go to · B stop · X/Y time', 22, '#7f8ba0');
    if (this.panelTex) this.panelTex.needsUpdate = true;
  }
}
