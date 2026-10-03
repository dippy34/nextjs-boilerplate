import { Vector3 } from 'three';
import { blackbodyRGB, luminance, magToIrradiance } from '../astro/photometry';
import { formatUtc } from '../core/time';
import { AU, formatDistance, formatSpeed, PC } from '../core/units';
import type { App } from '../app/App';
import { Body } from '../universe/Body';
import { ShipAudio } from './Audio';
import { Cockpit } from './Cockpit';
import { Missions } from './Missions';
import { LIGHT, ShipModel } from './ShipModel';
import { Traffic } from './Traffic';
import { WarpFx } from './WarpFx';

export type ViewMode = 'off' | 'cockpit' | 'chase';

function eta(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return '';
  if (s < 90) return `${Math.round(s)} s`;
  if (s < 5400) return `${Math.round(s / 60)} min`;
  if (s < 172800) return `${(s / 3600).toFixed(1)} h`;
  if (s < 3.15e7 * 2) return `${(s / 86400).toFixed(0)} days`;
  return `${(s / 3.15576e7).toPrecision(3)} years`;
}

/**
 * Game mode: fly a ship. A cockpit (or a chase view of the ship on desktop) rides on the camera rig;
 * the rig switches to inertial flight; the warp drive is the autopilot with streaks and sound;
 * fictional traffic orbits the world you are near; missions and a discovery log track progress.
 */
export class Game {
  mode: ViewMode = 'off';
  readonly cockpit = new Cockpit();
  readonly ship = new ShipModel();
  readonly warpFx = new WarpFx();
  readonly traffic = new Traffic();
  readonly audio = new ShipAudio();
  readonly missions: Missions;
  private warping = false;
  private time = 0;
  private hudTimer = 0;

  constructor(private app: App) {
    // children of the camera dolly: they move with the explorer; in VR the head moves inside
    app.renderer.rig.add(this.cockpit.group, this.ship.group, this.warpFx.lines);
    this.ship.group.position.set(0, -3.4, -22);
    this.ship.group.visible = false;
    app.renderer.scene.add(this.traffic.group);
    this.missions = new Missions(app);
    this.missions.onComplete = (m) => {
      app.hud.toast(`Mission complete: ${m.title}!`);
      if (app.vr.active) app.vr.flash(`Mission complete: ${m.title}!`);
      this.audio.chime();
    };
  }

  get active(): boolean {
    return this.mode !== 'off';
  }

  private fovBefore = 50;

  setMode(m: ViewMode): void {
    if (m === 'chase' && this.app.vr.active) m = 'off';
    // desktop cockpit: a wider view, so the dashboard and canopy frame the scene
    if (m === 'cockpit' && this.mode !== 'cockpit') { this.fovBefore = this.app.rig.fov; this.app.rig.fov = Math.max(this.app.rig.fov, 72); }
    if (m !== 'cockpit' && this.mode === 'cockpit') this.app.rig.fov = this.fovBefore;
    this.mode = m;
    this.cockpit.group.visible = m === 'cockpit';
    this.ship.group.visible = m === 'chase';
    this.app.rig.inertia = m === 'off' ? 0 : 1.2;
    if (m === 'off') {
      this.traffic.setBody(null);
      this.warping = false;
      this.audio.update(0, 0, false);
    } else {
      this.audio.start();
    }
    const say = m === 'off' ? 'Ship mode off' : m === 'cockpit' ? 'Cockpit view: W/S thrust, mouse to steer, X brake, J warp to the selection, V to switch view' : 'Chase view (V: switch)';
    this.app.hud.toast(say);
    if (this.app.vr.active) this.app.vr.flash(m === 'off' ? 'Ship mode off' : 'In the cockpit: left stick to fly, A to warp');
  }

  /** V: off -> cockpit -> chase -> off (VR: cockpit on/off). */
  cycle(): void {
    const order: ViewMode[] = this.app.vr.active ? ['off', 'cockpit'] : ['off', 'cockpit', 'chase'];
    this.setMode(order[(order.indexOf(this.mode) + 1) % order.length]);
  }

  /** J: warp to the selected object. */
  warp(): void {
    const sel = this.app.selection;
    if (!sel) { this.app.hud.toast('Select a destination first (click it, or search with Enter)'); return; }
    if (!this.active) this.setMode(this.app.vr.active ? 'cockpit' : 'cockpit');
    if (this.app.vr.active) this.app.vr.travelTo(sel); else this.app.goTo(sel);
    this.warping = true;
    this.app.hud.toast(`Warp drive engaged: ${sel.name}`);
  }

  update(dt: number): void {
    this.missions.update(dt);
    if (!this.active) return;
    this.time += dt;
    const app = this.app, rig = app.rig;
    const travelling = rig.autopilot || app.vr.traveling;
    if (!travelling) this.warping = false;
    else if (app.vr.traveling) this.warping = true;
    this.updateLight();
    // traffic around the world we ride along with
    const anchor = rig.anchor instanceof Body && rig.anchor.kind !== 'star' ? rig.anchor : null;
    this.traffic.setBody(anchor);
    this.traffic.update(rig.upos, app.clock.jdTdb);
    // engines, warp streaks, sound
    const throttle = Math.min(1, Math.abs(rig.thrust) * (app.input.keys.has('ShiftLeft') || app.input.keys.has('ShiftRight') ? 1 : 0.6));
    this.ship.setThrust(this.warping ? 1 : throttle);
    this.warpFx.update(this.time, this.warping && !app.vr.active ? 1 : 0, dt);
    this.audio.update(this.warping ? 1 : throttle, this.warping ? 1 : 0, true);
    // cockpit screens
    this.hudTimer -= dt;
    if (this.hudTimer <= 0 && this.mode === 'cockpit') {
      this.hudTimer = 0.2;
      this.fillReadout();
    }
    this.cockpit.update(dt);
  }

  private fillReadout(): void {
    const app = this.app, rig = app.rig, r = this.cockpit.readout;
    r.speed = formatSpeed(rig.speed);
    r.throttle = rig.thrust;
    r.boost = app.input.keys.has('ShiftLeft') || app.input.keys.has('ShiftRight');
    r.altitude = formatDistance(rig.altitude);
    r.reference = rig.anchor?.name ?? 'deep space';
    const sel = app.selection;
    if (sel) {
      const d = sel.upos.sub(rig.upos, new Vector3()).length();
      r.target = sel.name;
      r.targetKind = sel.info()[0]?.[1] ?? sel.kind;
      r.distance = formatDistance(Math.max(0, d - sel.radius));
      r.eta = this.warping ? `warp: arriving in ${eta(rig.gotoRemaining)}` : rig.speed > 1 ? `at this speed: ${eta(d / rig.speed)}` : 'J: warp there';
      r.warp = this.warping ? 'warping' : 'ready';
    } else {
      r.target = 'none';
      r.targetKind = 'click something to target it';
      r.distance = '';
      r.eta = '';
      r.warp = 'no target';
    }
    r.time = `${formatUtc(app.clock.jdTdb).slice(0, 16)} · ${app.clock.paused ? 'paused' : app.rateText()}`;
    r.missions = `${this.missions.doneCount} / ${this.missions.total} complete`;
    r.hint = app.vr.active ? 'left stick: thrust · A: warp · B: back' : 'W/S thrust · X brake · J warp · V view · K missions';
  }

  /** Light the cockpit and ship by the nearest star (or faintly, in deep space). */
  private updateLight(): void {
    const app = this.app, rig = app.rig;
    const sun = app.system.sun;
    const toSun = sun.upos.sub(rig.upos, new Vector3());
    let dir = toSun.clone().normalize(), E = Math.PI * (AU / Math.max(toSun.length(), 1)) ** 2, teff = sun.teff;
    for (const s of app.near.stars) {
      const rel = s.upos.sub(rig.upos, new Vector3());
      const Es = magToIrradiance(s.absMag + 5 * Math.log10(Math.max(rel.length(), 1) / PC) - 5);
      if (Es > E) { E = Es; dir = rel.normalize(); teff = s.teff; }
    }
    LIGHT.uSunDir.value.copy(dir);
    LIGHT.uSun.value = Math.max(0, Math.min(1.3, 1 + 0.25 * Math.log10(E / Math.PI)));
    const c = blackbodyRGB(teff), l = luminance(c);
    LIGHT.uSunColor.value.set(c[0] / l, c[1] / l, c[2] / l);
  }

  /** Objects whose shaders the app compiles up front. */
  warmupObjects() {
    return [this.cockpit.group, this.ship.group];
  }
}
