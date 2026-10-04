import { Matrix4, Vector3 } from 'three';
import { COLORS, Panel } from '../vr/Panel';
import type { App } from './App';
import '../ui/start.css';

/**
 * The title screen: "Simulator" (the explorer as it is) and "Story mode" (coming soon), over the
 * live renderer drifting slowly round the Earth. Keyboard, mouse, touch and gamepad; in a headset
 * the same choices on a panel in front of you (src/vr/Panel.ts).
 *
 * Skipped when the URL carries a deep link (a target, a time, a camera position…, which is what
 * the test scripts use) or `?menu=0`; `?menu=1` shows it anyway.
 */

/** URL parameters that place the explorer somewhere: the title screen would only be in the way. */
const DEEP_LINK = ['target', 'time', 'campc', 'look', 'ship', 'paused', 'rate', 'dist', 'fov', 'lm'];

type Item = { id: 'sim' | 'story' | 'vr' | 'credits'; label: string; sub: string; disabled?: boolean; badge?: string };

export class StartMenu {
  /** whether the title screen should be shown for this URL */
  static wanted(search = location.search): boolean {
    const q = new URLSearchParams(search);
    if (q.get('menu') === '1') return true;
    if (q.get('menu') === '0') return false;
    return !DEEP_LINK.some((k) => q.has(k));
  }

  private root: HTMLDivElement;
  private list: HTMLDivElement;
  private status: HTMLDivElement;
  private credits: HTMLDivElement;
  private buttons = new Map<Item['id'], HTMLButtonElement>();
  private app: App | null = null;
  private open = true;
  private focus = 0;
  private padPrev: boolean[] = [];
  private padAxisArmed = true;
  private raf = 0;
  private vrPanel: Panel | null = null;
  private vrHover: string | null = null;
  private vrFrames = 0;
  private labelsBefore = true;
  private orbitsBefore = true;
  private vrLabelsBefore = true;
  private onKey = (e: KeyboardEvent) => this.key(e);

  constructor(host: HTMLElement = document.body) {
    const root = document.createElement('div');
    root.id = 'start-menu';
    root.innerHTML = `
      <div class="sm-shade"></div>
      <div class="sm-stars" aria-hidden="true"></div>
      <main class="sm-main" role="dialog" aria-label="Space Explorer">
        <header class="sm-head">
          <div class="sm-kicker">A real-scale universe</div>
          <h1 class="sm-title">SPACE<span>EXPLORER</span></h1>
          <div class="sm-sub">2.75 million real stars · every planet and moon · black holes · walk on other worlds</div>
        </header>
        <nav class="sm-list" aria-label="Main menu"></nav>
        <div class="sm-credits" hidden>
          <h2>Credits</h2>
          <p>Stars: AT-HYG and HYG (David Nash / astronexus, CC BY-SA 4.0) and ESA Gaia DR3 (ESA/Gaia/DPAC, CC BY-NC 3.0 IGO).</p>
          <p>Solar System: NASA/JPL ephemerides (DE442S), JPL Small-Body Database, NASA PDS elevation models and maps (LOLA, MOLA, MESSENGER), NASA SVS Milky Way.</p>
          <p>Exoplanets: NASA Exoplanet Archive. Galaxies, nebulae, black holes: published catalogues listed in CREDITS.md.</p>
          <p>Ground materials: Poly Haven (CC0). Built with three.js.</p>
          <button class="sm-back" type="button">Back</button>
        </div>
        <div class="sm-status" aria-live="polite"></div>
      </main>
      <footer class="sm-foot">
        <span class="sm-keys"><kbd>↑</kbd><kbd>↓</kbd> choose</span><span class="sm-keys"><kbd>Enter</kbd> start</span><span class="sm-keys">Gamepad <kbd>A</kbd></span><span class="sm-tap">Tap to choose</span>
      </footer>`;
    host.appendChild(root);
    this.root = root;
    this.list = root.querySelector('.sm-list')!;
    this.status = root.querySelector('.sm-status')!;
    this.credits = root.querySelector('.sm-credits')!;
    root.querySelector('.sm-back')!.addEventListener('click', () => this.showCredits(false));
    this.build();
    this.setLoading(true);
    window.addEventListener('keydown', this.onKey, true);
    const loop = () => { this.tick(); if (this.open) this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
    requestAnimationFrame(() => root.classList.add('sm-in'));
  }

  get isOpen(): boolean {
    return this.open;
  }

  private items(): Item[] {
    const vr = !!this.app?.vr.supported;
    return [
      { id: 'sim', label: 'Simulator', sub: 'Fly anywhere: planets, stars, galaxies, black holes. Land and walk.' },
      { id: 'story', label: 'Story mode', sub: 'A journey across the galaxy', disabled: true, badge: 'Coming soon' },
      ...(vr ? [{ id: 'vr' as const, label: 'Enter VR', sub: 'Put the headset on and choose there' }] : []),
      { id: 'credits', label: 'Credits', sub: 'Where the data comes from' },
    ];
  }

  private build(): void {
    this.list.innerHTML = '';
    this.buttons.clear();
    for (const it of this.items()) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `sm-item${it.id === 'credits' ? ' sm-small' : ''}`;
      b.dataset.id = it.id;
      b.disabled = !!it.disabled;
      if (it.disabled) b.setAttribute('aria-disabled', 'true');
      b.innerHTML = `<span class="sm-label">${it.label}${it.badge ? `<em class="sm-badge">${it.badge}</em>` : ''}</span><span class="sm-desc">${it.sub}</span>`;
      b.addEventListener('click', () => this.choose(it.id));
      b.addEventListener('mouseenter', () => { if (!b.disabled) this.setFocus(this.enabledIds().indexOf(it.id)); });
      this.list.appendChild(b);
      this.buttons.set(it.id, b);
    }
    this.setFocus(Math.min(this.focus, this.enabledIds().length - 1));
  }

  private enabledIds(): Item['id'][] {
    return [...this.buttons.entries()].filter(([, b]) => !b.disabled).map(([id]) => id);
  }

  private setFocus(i: number): void {
    const ids = this.enabledIds();
    if (!ids.length) return;
    this.focus = (i + ids.length) % ids.length;
    for (const [id, b] of this.buttons) b.classList.toggle('sm-focus', id === ids[this.focus]);
    if (this.credits.hidden) this.buttons.get(ids[this.focus])?.focus({ preventScroll: true });
  }

  private setLoading(on: boolean): void {
    const sim = this.buttons.get('sim')!;
    sim.disabled = on;
    sim.classList.toggle('sm-loading', on);
    this.status.textContent = on ? 'Loading the Solar System and 2.75 million stars…' : '';
    if (!on) this.setFocus(0);
  }

  /** The app is ready: the renderer drifts behind the menu, and Simulator can start. */
  attach(app: App): void {
    this.app = app;
    this.labelsBefore = app.labels.enabled;
    this.orbitsBefore = app.orbits.enabled;
    app.labels.enabled = false;
    app.orbits.enabled = false; // orbit lines would streak across the backdrop
    this.vrLabelsBefore = app.vr.settings.labels;
    app.vr.settings.labels = false;
    app.hud.setHidden(true);
    app.vr.holdMenu = true;
    this.build();
    this.setLoading(false);
  }

  /** Something went wrong while loading: the menu steps aside for the error. */
  fail(): void {
    this.close(false);
  }

  private choose(id: Item['id']): void {
    if (id === 'sim') { if (this.app) this.start(); }
    else if (id === 'vr') { void this.app?.vr.enter(); }
    else if (id === 'credits') this.showCredits(true);
  }

  private showCredits(on: boolean): void {
    this.credits.hidden = !on;
    this.list.hidden = on;
    if (on) (this.credits.querySelector('.sm-back') as HTMLButtonElement).focus();
    else this.setFocus(this.focus);
  }

  /** Simulator: the explorer as it is. */
  start(): void {
    const app = this.app;
    if (!app || !this.open) return;
    this.close(true);
    app.hud.setHidden(false);
    app.labels.enabled = this.labelsBefore;
    app.orbits.enabled = this.orbitsBefore;
    app.vr.settings.labels = this.vrLabelsBefore;
    app.vr.holdMenu = false;
    if (app.vr.active) app.vr.flash('Trigger: select · A: fly there · Y: menu');
    else app.hud.toast('H: help · T: tour · B: walk on the ground below', 4);
  }

  private close(animate: boolean): void {
    this.open = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey, true);
    this.dropVR();
    if (!animate) { this.root.remove(); return; }
    this.root.classList.add('sm-out');
    setTimeout(() => this.root.remove(), 700);
  }

  // ---------------------------------------------------------------- input
  private key(e: KeyboardEvent): void {
    if (!this.open) return;
    // the menu has the keyboard: nothing reaches the explorer's shortcuts behind it
    e.stopImmediatePropagation();
    if (!this.credits.hidden) {
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); this.showCredits(false); }
      return;
    }
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': e.preventDefault(); this.setFocus(this.focus - 1); break;
      case 'ArrowDown': case 's': case 'S': case 'Tab': e.preventDefault(); this.setFocus(this.focus + (e.shiftKey && e.key === 'Tab' ? -1 : 1)); break;
      case 'Enter': case ' ': e.preventDefault(); this.choose(this.enabledIds()[this.focus]); break;
    }
  }

  /** Per frame: gamepad, the drifting view, the headset panel. */
  private tick(): void {
    this.pollGamepad();
    const app = this.app;
    if (!app) return;
    // a slow drift round whatever the view is centred on
    if (app.rig.target && !app.rig.autopilot) app.rig.ext.orbitX = 0.006;
    if (app.vr.active) this.tickVR(app);
    else if (this.vrPanel) this.dropVR();
  }

  private dropVR(): void {
    const p = this.vrPanel;
    if (!p) return;
    p.mesh.removeFromParent();
    const list = this.app?.vr.extraPanels;
    if (list && list.includes(p)) list.splice(list.indexOf(p), 1);
    this.vrPanel = null;
    this.vrFrames = 0;
  }

  private pollGamepad(): void {
    const pads = navigator.getGamepads?.() ?? [];
    const gp = [...pads].find((p) => p && p.connected && p.mapping === 'standard');
    if (!gp) return;
    const pressed = gp.buttons.map((b) => b.pressed);
    const edge = (i: number) => !!pressed[i] && !this.padPrev[i];
    const ay = gp.axes[1] ?? 0;
    if (Math.abs(ay) < 0.3) this.padAxisArmed = true;
    if (!this.credits.hidden) {
      if (edge(0) || edge(1)) this.showCredits(false);
    } else {
      if (edge(12) || (ay < -0.6 && this.padAxisArmed)) { this.setFocus(this.focus - 1); this.padAxisArmed = false; }
      if (edge(13) || (ay > 0.6 && this.padAxisArmed)) { this.setFocus(this.focus + 1); this.padAxisArmed = false; }
      if (edge(0) || edge(9)) this.choose(this.enabledIds()[this.focus]);
    }
    this.padPrev = pressed;
  }

  // ---------------------------------------------------------------- in the headset
  private tickVR(app: App): void {
    // a few frames in, so the head pose is the real one
    if (!this.vrPanel && ++this.vrFrames > 4) {
      const p = new Panel(1100, 760, 1.15, (pp) => this.paintVR(pp));
      app.renderer.rig.add(p.mesh);
      app.vr.extraPanels.push(p);
      this.vrPanel = p;
      this.placeVR(app);
    }
    const p = this.vrPanel;
    if (!p) return;
    if (p.hover !== this.vrHover) { this.vrHover = p.hover; p.dirty = true; }
    p.update();
  }

  /** In front of the head, a little below the eyes, facing it. */
  private placeVR(app: App): void {
    const cam = app.renderer.camera;
    const head = cam.position.clone();
    const fwd = new Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1);
    fwd.normalize();
    const pos = head.clone().addScaledVector(fwd, 1.5);
    pos.y -= 0.15;
    const m = this.vrPanel!.mesh;
    m.position.copy(pos);
    m.quaternion.setFromRotationMatrix(new Matrix4().lookAt(head, pos, new Vector3(0, 1, 0)));
  }

  private paintVR(p: Panel): void {
    p.rect(4, 4, p.width - 8, p.height - 8, 40, COLORS.bg, COLORS.border, 4);
    p.text('A REAL-SCALE UNIVERSE', p.width / 2, 78, 26, COLORS.dim, 600, 'center');
    p.text('SPACE EXPLORER', p.width / 2, 150, 76, '#ffffff', 300, 'center');
    p.button('sm:sim', 120, 240, p.width - 240, 150, 'Simulator', () => this.start(),
      { size: 48, sub: 'Fly anywhere · land and walk' });
    p.button('sm:story', 120, 420, p.width - 240, 150, 'Story mode', () => undefined,
      { size: 48, sub: 'Coming soon', disabled: true });
    p.button('sm:exit', p.width / 2 - 150, 610, 300, 90, 'Exit VR', () => { void this.app?.vr.session?.end(); }, { size: 30, color: COLORS.warn });
  }
}
