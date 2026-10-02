import {
  BackSide, BufferGeometry, CanvasTexture, CircleGeometry, Float32BufferAttribute, Group, Line, LineBasicMaterial, LinearFilter,
  Matrix4, Mesh, MeshBasicMaterial, Object3D, Quaternion, Raycaster, ShaderMaterial, SphereGeometry, Sprite, SpriteMaterial,
  SRGBColorSpace, Vector2, Vector3,
} from 'three';
import { formatUtc } from '../core/time';
import { formatDistance, formatSpeed } from '../core/units';
import type { LabelCandidate } from '../render/Labels';
import { Body, type SpaceObject } from '../universe/Body';
import { CatalogStar } from '../universe/Stars';
import { VRMenu, type VRSettings } from '../vr/Menu';
import { COLORS, Panel } from '../vr/Panel';
import type { App } from './App';

/**
 * Immersive VR (WebXR) for Quest / OpenXR headsets.
 *
 * Point and click: either controller's laser (trigger) or a hand pinch clicks the menu,
 * and in the sky selects what it points at (pointing at the selection again flies there).
 *   Y (left)        open / close the menu         X (left)   pause / resume time
 *   A (right)       fly to the selection          B (right)  back: close card / stop / deselect
 *   left stick      fly where the left hand points (speed scales with altitude), left grip x10
 *   right stick     turn (snap or smooth) and flight speed; with right grip: orbit / zoom the selection
 *   right stick click  labels on/off
 * Travel blinks, re-aims the view at the destination and flies straight there with a comfort vignette.
 */
interface Hand {
  index: number;
  obj: Group;     // target-ray space
  grip: Group;    // grip space
  ray: Line;
  cursor: Mesh;
  handedness: XRHandedness | 'none';
  source: XRInputSource | null;
  prev: boolean[];
  uiHit: { panel: Panel; id: string | null } | null;
  hoverObj: SpaceObject | null;
}

const SNAP = (30 * Math.PI) / 180;
const LABEL_DIST = 20; // m from the head
const LABEL_HEIGHT = 0.36; // m (~1 deg)
const MAX_LABELS = 24;

export class VRSupport {
  session: XRSession | null = null;
  readonly settings: VRSettings = { travel: 'smooth', turn: 'snap', labels: true, orbits: false };
  readonly menu: VRMenu;
  private wrist: Panel;
  private card: Panel;
  private cardObj: SpaceObject | null = null;
  private hands: Hand[] = [];
  private raycaster = new Raycaster();
  private turnArmed = true;
  private labelPool: Sprite[] = [];
  private labelTex = new Map<string, { tex: CanvasTexture; aspect: number }>();
  private labelsGroup = new Group();
  private hoverRing: Sprite;
  private hoverLabel: Sprite;
  private hoverKey = '';
  private vignette: Mesh;
  private vig = { fade: { value: 0 }, tunnel: { value: 0 } };
  private travel: { phase: 'out' | 'fly' | 'in'; t: number; target: SpaceObject } | null = null;
  private pendingMenu = false;
  private flashText = '';
  private flashUntil = 0;
  private wristTimer = 0;
  private saved = { starLimit: 7.5, orbits: true };
  private button: HTMLButtonElement | null = null;

  constructor(private app: App, readonly supported: boolean, dataBase: string) {
    this.labelsGroup.name = 'vr-labels';
    this.labelsGroup.visible = false;
    app.renderer.scene.add(this.labelsGroup);
    this.menu = new VRMenu({
      app,
      settings: this.settings,
      travelTo: (o: SpaceObject) => this.travelTo(o),
      closeMenu: () => this.menu.panel.setVisible(false),
      exitVR: () => { void this.session?.end(); },
    }, dataBase);
    this.menu.panel.setVisible(false);
    this.wrist = new Panel(900, 600, 0.2, (p) => this.paintWrist(p));
    this.card = new Panel(1000, 660, 0.56, (p) => this.paintCard(p));
    this.card.setVisible(false);
    for (const p of [this.menu.panel, this.card]) app.renderer.rig.add(p.mesh);

    this.hoverRing = new Sprite(new SpriteMaterial({ map: ringTexture(), transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    this.hoverRing.renderOrder = 900;
    this.hoverRing.visible = false;
    this.hoverLabel = new Sprite(new SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    this.hoverLabel.renderOrder = 901;
    this.hoverLabel.visible = false;
    app.renderer.scene.add(this.hoverRing, this.hoverLabel);

    this.vignette = new Mesh(new SphereGeometry(0.25, 32, 16), new ShaderMaterial({
      uniforms: { uFade: this.vig.fade, uTunnel: this.vig.tunnel },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uFade; uniform float uTunnel; varying vec3 vP; void main(){ float c = -normalize(vP).z; '
        + 'float a = max(uFade, uTunnel * (1.0 - smoothstep(0.62, 0.92, c))); gl_FragColor = vec4(0.0, 0.0, 0.0, a); }',
      side: BackSide, transparent: true, depthTest: false, depthWrite: false,
    }));
    this.vignette.renderOrder = 10000;
    this.vignette.frustumCulled = false;
    this.vignette.visible = false;
    app.renderer.camera.add(this.vignette);
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

  /** true while the travel blink/flight runs (for tests and the HUD) */
  get travelling(): boolean {
    return this.travel !== null;
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
    const app = this.app;
    app.renderer.setXrMode(true);
    this.saved = { starLimit: app.starMagLimit, orbits: app.orbits.enabled };
    app.starMagLimit = Math.min(app.starMagLimit, 6.8); // fewer, brighter points: keeps headset frame rates up
    app.orbits.enabled = this.settings.orbits;
    if (this.button) this.button.textContent = 'EXIT VR';
    if (this.hands.length === 0) for (let i = 0; i < 2; i++) this.hands.push(this.makeHand(i));
    for (const h of this.hands) { h.obj.visible = true; h.grip.visible = true; }
    this.labelsGroup.visible = true;
    this.vignette.visible = true;
    // fade in from black, then show the menu
    this.vig.fade.value = 1;
    this.travel = { phase: 'in', t: 0, target: app.selection ?? app.system.sun };
    this.pendingMenu = true;
    this.flash('Trigger: select · A: fly there · Y: menu');
  }

  private onEnd(): void {
    this.session = null;
    const app = this.app;
    const r = app.renderer;
    r.setXrMode(false);
    // three leaves the last head pose on the camera; the desktop view looks along the dolly
    r.camera.position.set(0, 0, 0);
    r.camera.quaternion.identity();
    r.camera.scale.set(1, 1, 1);
    app.starMagLimit = this.saved.starLimit;
    app.orbits.enabled = this.saved.orbits;
    for (const h of this.hands) { h.obj.visible = false; h.grip.visible = false; h.cursor.visible = false; }
    this.labelsGroup.visible = false;
    this.hoverRing.visible = this.hoverLabel.visible = false;
    this.menu.panel.setVisible(false);
    this.card.setVisible(false);
    this.vignette.visible = false;
    this.travel = null;
    this.pendingMenu = false;
    if (this.button) this.button.textContent = 'ENTER VR';
    window.dispatchEvent(new Event('resize'));
  }

  private makeHand(index: number): Hand {
    const xr = this.app.renderer.gl.xr;
    const obj = xr.getController(index);
    const grip = xr.getControllerGrip(index);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
    const ray = new Line(geo, new LineBasicMaterial({ color: 0x9cc4ff, transparent: true, opacity: 0.7, toneMapped: false, depthTest: false }));
    ray.scale.z = 4;
    ray.frustumCulled = false;
    ray.renderOrder = 950;
    obj.add(ray);
    const cursor = new Mesh(new CircleGeometry(0.008, 20), new MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false, toneMapped: false }));
    cursor.renderOrder = 1100;
    cursor.visible = false;
    this.app.renderer.rig.add(cursor);
    const hand: Hand = { index, obj, grip, ray, cursor, handedness: 'none', source: null, prev: [], uiHit: null, hoverObj: null };
    obj.addEventListener('connected', (e) => {
      const src = (e as unknown as { data: XRInputSource }).data;
      hand.source = src;
      hand.handedness = src.handedness;
      ray.visible = src.targetRayMode === 'tracked-pointer';
      if (src.handedness === 'left') this.attachWrist(grip);
    });
    obj.addEventListener('disconnected', () => {
      hand.source = null;
      hand.handedness = 'none';
      cursor.visible = false;
    });
    // Controllers live on the dolly so they move and turn with the explorer.
    this.app.renderer.rig.add(obj, grip);
    return hand;
  }

  private attachWrist(grip: Group): void {
    const m = this.wrist.mesh;
    if (m.parent === grip) return;
    m.parent?.remove(m);
    m.position.set(0, 0.035, 0.07);
    m.rotation.set(-Math.PI / 2 + 0.55, 0, 0);
    grip.add(m);
  }

  // ------------------------------------------------------------------ pointing
  private interactivePanels(): Panel[] {
    return [this.menu.panel, this.card, this.wrist].filter((p) => p.visible && p.mesh.parent);
  }

  /** UI hit along a world-space ray. */
  private uiRay(origin: Vector3, dir: Vector3): { panel: Panel; id: string | null; uv: Vector2; point: Vector3; dist: number } | null {
    this.raycaster.set(origin, dir);
    this.raycaster.far = 8;
    const meshes = this.interactivePanels().map((p) => p.mesh);
    for (const h of this.raycaster.intersectObjects(meshes, false)) {
      if (!h.uv) continue;
      const panel = h.object.userData.panel as Panel;
      const r = panel.regionAt(h.uv);
      return { panel, id: r?.id ?? null, uv: h.uv.clone(), point: h.point, dist: h.distance };
    }
    return null;
  }

  private handRay(h: Hand): { origin: Vector3; dir: Vector3 } {
    h.obj.updateMatrixWorld(true);
    const origin = new Vector3().setFromMatrixPosition(h.obj.matrixWorld);
    const dir = new Vector3(0, 0, -1).transformDirection(h.obj.matrixWorld);
    return { origin, dir };
  }

  /** Trigger / pinch. The ray comes from the event's own frame (exact for transient pointers). */
  private onSelect(e: XRInputSourceEvent): void {
    const src = e.inputSource;
    const rig = this.app.renderer.rig;
    rig.updateMatrixWorld(true);
    const ref = this.app.renderer.gl.xr.getReferenceSpace();
    const pose = ref ? e.frame.getPose(src.targetRaySpace, ref) : undefined;
    let origin: Vector3, dir: Vector3;
    if (pose) {
      const m = new Matrix4().fromArray(pose.transform.matrix).premultiply(rig.matrixWorld);
      origin = new Vector3().setFromMatrixPosition(m);
      dir = new Vector3(0, 0, -1).transformDirection(m);
    } else {
      const hand = this.hands.find((h) => h.source === src);
      if (!hand) return;
      ({ origin, dir } = this.handRay(hand));
    }
    const ui = this.uiRay(origin, dir);
    if (ui) {
      if (ui.id) {
        ui.panel.regionAt(ui.uv)?.onClick?.();
        ui.panel.dirty = true;
        this.pulse(src, 0.4, 25);
      }
      return;
    }
    if (this.travel) return;
    const hit = this.app.pickRay(origin, dir);
    if (hit && hit === this.app.selection) {
      this.travelTo(hit);
      return;
    }
    if (!hit) {
      if (this.card.visible) this.card.setVisible(false);
      else this.app.cancelOrDeselect();
      return;
    }
    this.app.select(hit);
    this.showCard(hit, dir);
    this.pulse(src, 0.3, 20);
  }

  private pulse(src: XRInputSource | null, intensity: number, ms: number): void {
    const act = (src?.gamepad as (Gamepad & { hapticActuators?: { pulse(v: number, d: number): Promise<boolean> }[] }) | undefined)?.hapticActuators?.[0];
    act?.pulse(intensity, ms).catch(() => undefined);
  }

  // ------------------------------------------------------------------ menu, card, travel
  toggleMenu(): void {
    if (this.menu.isOpen) { this.menu.panel.setVisible(false); return; }
    this.placeInFront(this.menu.panel.mesh, 1.25, 0.22);
    this.menu.open();
  }

  /** Put a rig-space object in front of the head (horizontal heading unless `dir` is given), facing it. */
  private placeInFront(obj: Object3D, dist: number, drop: number, yawOffset = 0, dir?: Vector3): void {
    const cam = this.app.renderer.camera;
    const head = cam.position.clone();
    const fwd = dir ? dir.clone() : new Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    if (!dir) fwd.y = 0;
    if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1);
    fwd.normalize();
    if (yawOffset) fwd.applyAxisAngle(new Vector3(0, 1, 0), yawOffset);
    const pos = head.clone().addScaledVector(fwd, dist);
    pos.y -= drop;
    obj.position.copy(pos);
    obj.quaternion.setFromRotationMatrix(new Matrix4().lookAt(head, pos, new Vector3(0, 1, 0)));
  }

  private showCard(obj: SpaceObject, worldDir: Vector3): void {
    this.cardObj = obj;
    const d = worldDir.clone().applyQuaternion(this.app.renderer.rig.quaternion.clone().invert());
    d.y = Math.max(-0.25, Math.min(0.25, d.y));
    if (this.menu.isOpen) this.placeInFront(this.card.mesh, 1.2, 0.2, 0.95);
    else this.placeInFront(this.card.mesh, 1.15, 0.36, 0, d);
    this.card.setVisible(true);
    this.card.dirty = true;
  }

  travelTo(obj: SpaceObject): void {
    this.app.select(obj);
    this.menu.panel.setVisible(false);
    this.card.setVisible(false);
    this.travel = { phase: 'out', t: 0, target: obj };
    this.flash(`Flying to ${obj.name}`);
  }

  /** Viewing distance on arrival: big and immersive, clear of rings. */
  private arrivalDistance(obj: SpaceObject): number {
    if (obj instanceof Body) {
      if (obj.kind === 'star') return obj.radius * 7;
      if (obj.name === 'Saturn' || obj.name === 'Uranus') return obj.radius * 4.6;
      return Math.max(obj.radius / Math.sin((24 * Math.PI) / 180), 3e3);
    }
    if (obj instanceof CatalogStar) return Math.max(obj.radius * 9, 1e9);
    return obj.radius > 0 ? obj.radius * 80 : 3e7;
  }

  private updateTravel(dt: number): void {
    const tr = this.travel;
    const rig = this.app.rig;
    const v = this.vig;
    if (!tr) {
      v.fade.value = Math.max(0, v.fade.value - dt * 3);
      v.tunnel.value = Math.max(0, v.tunnel.value - dt * 2);
      return;
    }
    tr.t += dt;
    if (tr.phase === 'out') {
      v.fade.value = Math.min(1, tr.t / 0.22);
      if (v.fade.value >= 1) {
        // re-aim while the view is black: the destination ends up straight ahead of the head
        const cam = this.app.renderer.camera;
        cam.updateMatrixWorld(true);
        const headFwd = new Vector3(0, 0, -1).applyQuaternion(cam.getWorldQuaternion(new Quaternion()));
        const toTarget = tr.target.upos.sub(rig.upos, new Vector3()).normalize();
        rig.quat.premultiply(new Quaternion().setFromUnitVectors(headFwd, toTarget)).normalize();
        const blink = this.settings.travel === 'blink';
        rig.flyTo(tr.target, this.arrivalDistance(tr.target), blink ? 0.05 : undefined, false);
        tr.phase = 'fly';
        tr.t = 0;
      }
      return;
    }
    if (tr.phase === 'fly') {
      if (this.settings.travel === 'blink') {
        if (!rig.autopilot) { tr.phase = 'in'; tr.t = 0; }
        return;
      }
      v.fade.value = Math.max(0, v.fade.value - dt * 3);
      const p = rig.gotoProgress;
      v.tunnel.value = 0.75 * Math.min(1, p * 8, (1 - p) * 4);
      if (!rig.autopilot) { tr.phase = 'in'; tr.t = 0; }
      return;
    }
    // 'in'
    v.fade.value = Math.max(0, v.fade.value - dt * 2.5);
    v.tunnel.value = Math.max(0, v.tunnel.value - dt * 2);
    if (v.fade.value <= 0 && v.tunnel.value <= 0) {
      const arrived = tr.target;
      this.travel = null;
      if (this.pendingMenu) {
        this.pendingMenu = false;
        this.toggleMenu();
      } else {
        this.flash(arrived.name);
      }
    }
  }

  // ------------------------------------------------------------------ per frame
  /** Controller state -> UI hover, rig inputs and actions. Called every frame while presenting. */
  updateInput(dt: number): void {
    if (!this.session) return;
    const app = this.app;
    const rig = app.rig;
    app.renderer.rig.updateMatrixWorld(true);
    for (const p of this.interactivePanels()) p.update();
    const headQ = app.renderer.camera.getWorldQuaternion(new Quaternion());
    for (const h of this.hands) {
      const src = h.source;
      if (!src) continue;
      // pointing: UI first, then the sky
      if (src.targetRayMode === 'tracked-pointer') {
        const { origin, dir } = this.handRay(h);
        const ui = this.uiRay(origin, dir);
        if (ui) {
          if (h.uiHit && h.uiHit.panel !== ui.panel) h.uiHit.panel.setHover(null);
          ui.panel.setHover(ui.id);
          h.uiHit = { panel: ui.panel, id: ui.id };
          h.ray.scale.z = Math.max(0.01, ui.dist);
          h.cursor.visible = true;
          h.cursor.position.copy(app.renderer.rig.worldToLocal(ui.point.clone()));
          h.cursor.quaternion.copy(ui.panel.mesh.getWorldQuaternion(new Quaternion())).premultiply(app.renderer.rig.quaternion.clone().invert());
          h.hoverObj = null;
        } else {
          if (h.uiHit) h.uiHit.panel.setHover(null);
          h.uiHit = null;
          h.ray.scale.z = 4;
          h.cursor.visible = false;
          const obj = this.travel ? null : app.pickRayFast(origin, dir);
          if (obj && obj !== h.hoverObj) this.pulse(src, 0.15, 12);
          h.hoverObj = obj;
        }
      }
      const gp = src.gamepad;
      if (!gp) continue;
      const ax = gp.axes.length >= 4 ? [gp.axes[2], gp.axes[3]] : [gp.axes[0] ?? 0, gp.axes[1] ?? 0];
      const x = Math.abs(ax[0]) > 0.15 ? ax[0] : 0;
      const y = Math.abs(ax[1]) > 0.15 ? ax[1] : 0;
      const pressed = gp.buttons.map((b) => b.pressed);
      const edge = (i: number) => !!pressed[i] && !h.prev[i];
      const squeeze = (gp.buttons[1]?.value ?? 0) > 0.5;
      if (h.handedness === 'left') {
        if ((x || y) && !this.travel) {
          const ctrlQ = h.obj.getWorldQuaternion(new Quaternion());
          const fwd = new Vector3(0, 0, -1).applyQuaternion(ctrlQ);
          const up = new Vector3(0, 1, 0).applyQuaternion(headQ);
          const right = new Vector3().crossVectors(fwd, up).normalize();
          const move = fwd.multiplyScalar(-y).add(right.multiplyScalar(x));
          const mag = Math.min(1, Math.hypot(x, y));
          rig.ext.move.copy(move.normalize().multiplyScalar(mag * mag));
        }
        rig.ext.boost = squeeze ? 10 : 1;
        if (edge(4)) { app.togglePause(); this.flash(app.clock.paused ? 'Time paused' : `Time: ${app.rateText()}`); }
        if (edge(5)) this.toggleMenu();
        if (edge(3)) app.realTime();
      } else if (h.handedness === 'right') {
        if (squeeze) {
          rig.ext.orbitX = x;
          rig.ext.zoom = y;
        } else if (!this.travel) {
          if (this.settings.turn === 'snap') {
            if (Math.abs(x) > 0.7 && this.turnArmed) {
              rig.turn(-Math.sign(x) * SNAP);
              this.turnArmed = false;
            } else if (Math.abs(x) < 0.3) {
              this.turnArmed = true;
            }
          } else if (x) {
            rig.turn(-x * dt * 1.2);
          }
          if (y) rig.speedFactor = Math.min(1e6, Math.max(1e-4, rig.speedFactor * Math.exp(-y * dt * 1.5)));
        }
        if (edge(4) && app.selection) this.travelTo(app.selection);
        if (edge(5)) this.back();
        if (edge(3)) { this.settings.labels = !this.settings.labels; this.flash(`Labels ${this.settings.labels ? 'on' : 'off'}`); }
      }
      h.prev = pressed;
    }
    this.updateTravel(dt);
  }

  private back(): void {
    if (this.travel) { this.app.rig.cancelGoto(); this.travel = { ...this.travel, phase: 'in', t: 0 }; return; }
    if (this.card.visible) { this.card.setVisible(false); return; }
    if (this.menu.isOpen) { this.menu.panel.setVisible(false); return; }
    this.app.cancelOrDeselect();
  }

  // ------------------------------------------------------------------ overlays
  updateOverlays(cands: LabelCandidate[], dt: number): void {
    if (!this.session) return;
    this.updateLabels(this.settings.labels && !this.travel ? cands : []);
    this.updateHover();
    if (this.menu.isOpen) this.menu.tick(dt);
    this.wristTimer -= dt;
    if (this.wristTimer <= 0) {
      this.wristTimer = 0.5;
      this.wrist.dirty = true;
      if (this.card.visible) this.card.dirty = true;
    }
    this.wrist.update();
    this.card.update();
    this.app.orbits.enabled = this.settings.orbits;
  }

  private headPose(): { head: Vector3; up: Vector3 } {
    const cam = this.app.renderer.camera;
    const head = cam.getWorldPosition(new Vector3());
    const up = new Vector3(0, 1, 0).applyQuaternion(cam.getWorldQuaternion(new Quaternion()));
    return { head, up };
  }

  private updateHover(): void {
    const obj = this.hands.find((x) => x.hoverObj)?.hoverObj ?? null;
    if (!obj) {
      this.hoverRing.visible = this.hoverLabel.visible = false;
      this.hoverKey = '';
      return;
    }
    const { head, up } = this.headPose();
    const rel = obj.upos.sub(this.app.rig.upos, new Vector3());
    const dist = rel.length();
    const dir = rel.clone().sub(head).normalize();
    const ang = Math.asin(Math.min(1, obj.radius / Math.max(dist, obj.radius * 1.0001)));
    const size = Math.max(ang * 2.3, (2.2 * Math.PI) / 180) * LABEL_DIST;
    this.hoverRing.position.copy(head).addScaledVector(dir, LABEL_DIST);
    this.hoverRing.scale.set(size, size, 1);
    // a ring marks small or distant things; a big disk just gets its label
    this.hoverRing.visible = ang < (1.5 * Math.PI) / 180;
    const text = `${obj.name}  ·  ${formatDistance(dist)}`;
    if (text !== this.hoverKey) {
      this.hoverKey = text;
      const { tex, aspect } = this.makeLabel(text, obj === this.app.selection ? COLORS.sel : '#ffffff', true);
      const m = this.hoverLabel.material;
      m.map?.dispose();
      m.map = tex;
      m.needsUpdate = true;
      this.hoverLabel.scale.set(LABEL_HEIGHT * 1.15 * aspect, LABEL_HEIGHT * 1.15, 1);
    }
    this.hoverLabel.position.copy(this.hoverRing.position).addScaledVector(up, -(size / 2 + LABEL_HEIGHT * 0.9));
    this.hoverLabel.visible = true;
  }

  private updateLabels(cands: LabelCandidate[]): void {
    for (const sp of this.labelPool) sp.visible = false;
    const { head, up } = this.headPose();
    const top = cands.filter((c) => c.rel).sort((a, b) => b.priority - a.priority).slice(0, MAX_LABELS);
    const placed: Vector3[] = [];
    const colors: Record<string, string> = { planet: '#9cc4ff', dwarf: '#ffbe7a', moon: '#9fe0bb', star: '#f3e3b0', comet: '#9feaff', selected: COLORS.sel };
    let n = 0;
    for (const c of top) {
      const dir = c.rel!.clone().sub(head).normalize();
      if (placed.some((p) => p.dot(dir) > 0.9992)) continue; // keep labels ~2.3 deg apart
      placed.push(dir);
      let sp = this.labelPool[n];
      if (!sp) {
        sp = new Sprite(new SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
        sp.renderOrder = 100;
        sp.frustumCulled = false;
        this.labelsGroup.add(sp);
        this.labelPool.push(sp);
      }
      n++;
      const key = `${c.cls}|${c.text}`;
      let t = this.labelTex.get(key);
      if (!t) {
        t = this.makeLabel(c.text, colors[c.cls] ?? '#d8e2f0', false);
        if (this.labelTex.size > 300) for (const [k, v] of this.labelTex) { v.tex.dispose(); this.labelTex.delete(k); if (this.labelTex.size < 200) break; }
        this.labelTex.set(key, t);
      }
      if (sp.material.map !== t.tex) { sp.material.map = t.tex; sp.material.needsUpdate = true; }
      // above the object (above the limb of a resolved body)
      const angR = Math.min(0.5, (c.radius || 0) * this.app.view.pixelAngle);
      sp.position.copy(head).addScaledVector(dir, LABEL_DIST).addScaledVector(up, LABEL_DIST * angR + LABEL_HEIGHT * 0.75);
      sp.scale.set(LABEL_HEIGHT * t.aspect, LABEL_HEIGHT, 1);
      sp.visible = true;
    }
  }

  private makeLabel(text: string, color: string, pill: boolean): { tex: CanvasTexture; aspect: number } {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    const font = '600 44px Inter, "Segoe UI", system-ui, sans-serif';
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + (pill ? 56 : 28);
    c.width = w;
    c.height = 64;
    ctx.font = font;
    if (pill) {
      ctx.fillStyle = 'rgba(8, 12, 22, 0.78)';
      ctx.beginPath();
      ctx.roundRect(2, 2, w - 4, 60, 30);
      ctx.fill();
      ctx.strokeStyle = 'rgba(127, 178, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, 34);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.minFilter = LinearFilter;
    return { tex, aspect: w / 64 };
  }

  flash(text: string): void {
    this.flashText = text;
    this.flashUntil = performance.now() + 3000;
    this.wrist.dirty = true;
    this.app.hud.toast(text);
  }

  private paintWrist(p: Panel): void {
    const app = this.app;
    p.rect(4, 4, p.width - 8, p.height - 8, 30, COLORS.bg, COLORS.border, 4);
    p.text(formatUtc(app.clock.jdTdb), 34, 50, 34, '#ffffff', 600);
    p.text(app.clock.paused ? 'PAUSED' : app.rateText(), 34, 92, 28, app.clock.paused ? COLORS.warn : COLORS.accent, 500);
    const sel = app.selection;
    if (sel) {
      p.text(sel.name, 34, 160, 46, COLORS.sel, 700, 'left', p.width - 60);
      const d = sel.upos.sub(app.rig.upos, new Vector3()).length();
      p.text(`${formatDistance(d)} away`, 34, 208, 28, COLORS.text);
    } else {
      p.text('Nothing selected', 34, 160, 34, COLORS.dim, 500);
    }
    p.text(`Speed ${formatSpeed(app.rig.speed)}`, 34, 258, 26, COLORS.dim);
    if (performance.now() < this.flashUntil) p.text(this.flashText, 34, 310, 28, COLORS.sel, 600, 'left', p.width - 60);
    p.button('w:menu', 24, 360, 270, 100, 'MENU', () => this.toggleMenu(), { active: this.menu.isOpen, size: 34 });
    p.button('w:go', 312, 360, 270, 100, 'FLY TO', () => { if (app.selection) this.travelTo(app.selection); }, { size: 34, disabled: !sel });
    p.button('w:time', 600, 360, 270, 100, app.clock.paused ? '▶ PLAY' : '⏸ PAUSE', () => app.togglePause(), { size: 30 });
    p.text('Y menu · A fly · B back · X pause', 34, 520, 24, COLORS.dim);
  }

  private paintCard(p: Panel): void {
    const o = this.cardObj;
    if (!o) return;
    const app = this.app;
    p.rect(4, 4, p.width - 8, p.height - 8, 30, COLORS.bg, COLORS.border, 4);
    p.text(o.name, 40, 64, 56, COLORS.sel, 700, 'left', p.width - 200);
    p.button('c:close', p.width - 120, 22, 92, 80, '✕', () => this.card.setVisible(false), { size: 36 });
    const d = o.upos.sub(app.rig.upos, new Vector3()).length();
    const rows = o.info().filter(([k]) => k !== 'Distance').slice(0, 5);
    p.text(`Distance  ${formatDistance(d)}`, 40, 140, 30, COLORS.text, 500);
    rows.forEach(([k, v], i) => {
      p.text(k, 40, 192 + i * 50, 28, COLORS.dim, 500);
      p.text(v, 330, 192 + i * 50, 28, COLORS.text, 500, 'left', p.width - 370);
    });
    p.button('c:go', 40, p.height - 130, 560, 100, `Fly to ${o.name}`, () => this.travelTo(o), { size: 36 });
    p.button('c:menu', 620, p.height - 130, 340, 100, 'Menu', () => { this.card.setVisible(false); this.toggleMenu(); }, { size: 34 });
  }
}

function ringTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.strokeStyle = 'rgba(255, 242, 122, 0.95)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.stroke();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
