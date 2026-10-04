import { Matrix4, Quaternion, Vector3 } from 'three';
import { blackbodyRGB, luminance, magToIrradiance } from '../astro/photometry';
import { formatUtc } from '../core/time';
import { AU, formatDistance, formatSpeed, PC } from '../core/units';
import type { App } from '../app/App';
import { Body } from '../universe/Body';
import { ShipAudio } from './Audio';
import { Cockpit } from './Cockpit';
import { Missions } from './Missions';
import { LIGHT, ShipModel } from './ShipModel';
import { Traffic, TrafficShip } from './Traffic';
import { WarpFx } from './WarpFx';
import { HudMarkers } from './HudMarkers';
import { Station } from './Station';
import { ExoPlanet, type PlanetType } from '../universe/Planets';
import { Flight, fmtDist, fmtSpeed as fmtSpd, fmtTime, sasLabel } from './Flight';
import { FlightHud } from './FlightHud';
import { FlightViz } from './FlightViz';
import { G0 } from '../sim/ShipPhysics';

/** generated planet types with a surface to land on */
const SOLID_TYPES = new Set<PlanetType>(['lava', 'hot', 'desert', 'terran', 'ocean', 'ice']);

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
  readonly hud = new HudMarkers();
  readonly traffic = new Traffic();
  readonly audio = new ShipAudio();
  readonly missions: Missions;
  /** real-physics flight (on whenever you are in the ship) */
  readonly flight: Flight;
  readonly viz = new FlightViz();
  readonly flightHud: FlightHud;
  private warping = false;
  private time = 0;
  private hudTimer = 0;
  /** docking in progress: offset of the camera from the hold point when it started (station axes) */
  private docking: { station: Station; t: number; from: Vector3; q0: Quaternion } | null = null;
  /** station we are docked at */
  docked: Station | null = null;
  /** world we have touched down on */
  landed: Body | ExoPlanet | null = null;
  get isDocking(): boolean {
    return this.docking !== null;
  }
  /** seconds before the docking computer may engage again (after undocking) */
  private dockCooldown = 0;

  constructor(private app: App) {
    // children of the camera dolly: they move with the explorer; in VR the head moves inside
    app.renderer.rig.add(this.cockpit.group, this.ship.group, this.warpFx.lines, this.hud.group);
    this.ship.group.position.set(0, -3.4, -22);
    this.ship.group.visible = false;
    app.renderer.scene.add(this.traffic.group);
    this.flight = new Flight(app);
    app.renderer.scene.add(this.viz.group);
    app.renderer.camera.add(this.viz.screen);
    this.flightHud = new FlightHud(document.getElementById('hud') ?? document.body);
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
    this.hud.group.visible = m === 'cockpit';
    this.ship.group.visible = m === 'chase';
    this.app.rig.inertia = m === 'off' ? 0 : 1.2;
    if (m !== 'off' && !this.flight.on) {
      // a flight starts in real time
      this.app.flightClock();
      this.flight.enable();
    }
    else this.flight.disable();
    this.flightHud.setVisible(m !== 'off' && !this.app.vr.active);
    if (m === 'off') {
      this.docked = null;
      this.docking = null;
      this.landed = null;
      this.traffic.setBody(null);
      this.warping = false;
      this.audio.update(0, 0, false);
    } else {
      this.audio.start();
    }
    const say = m === 'off' ? 'Ship mode off' : m === 'cockpit'
      ? 'In the ship: real physics. W/S throttle, arrows or drag to turn, Y SAS mode, I boosted drive, J warp, V view'
      : 'Chase view (V: switch)';
    this.app.hud.toast(say, m === 'cockpit' ? 4 : 2.2);
    if (this.app.vr.active) this.app.vr.flash(m === 'off' ? 'Ship mode off' : 'Real physics: left grip throttle, right stick steer, left stick RCS, stick click SAS');
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
    // honest physics: the drive cannot be engaged deep in a gravity well
    const lock = this.flight.massLock();
    if (lock) {
      this.app.hud.toast(lock, 4);
      if (this.app.vr.active) this.app.vr.flash('Mass-locked: climb higher first');
      return;
    }
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
    // (riding along with a station or ship keeps the traffic of the world it orbits)
    const a = rig.anchor;
    const world = a instanceof Station || a instanceof TrafficShip ? a.body : a instanceof Body && a.kind !== 'star' ? a : null;
    this.traffic.setBody(world);
    this.traffic.update(rig.upos, app.clock.jdTdb, dt);
    this.updateDocking(dt);
    if (!this.flight.on) this.updateLanding(dt);
    this.updateFlightFx(dt);
    // engines, warp streaks, sound
    const throttle = this.flight.on ? this.flight.ship.throttle * (this.flight.ship.fuel > 0 || this.flight.ship.boosted ? 1 : 0)
      : Math.min(1, Math.abs(rig.thrust) * (app.input.keys.has('ShiftLeft') || app.input.keys.has('ShiftRight') ? 1 : 0.6));
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
    if (this.mode === 'cockpit') this.updateHud();
  }

  /** Predicted path, g-force vignette, re-entry plasma, end-of-flight fades and the desktop instruments. */
  private updateFlightFx(dt: number): void {
    const app = this.app, f = this.flight;
    if (!f.on) { this.viz.update(null, null, app.rig.upos, app.view.quat, app.view.pixelAngle, false); this.viz.setEffects(0, 0, 0, 0, [0, 0, 0], 0); return; }
    const r = f.readout, ship = f.ship;
    const D = f.core.frame;
    const travelling = app.rig.autopilot || app.vr.traveling;
    // (apsides are given as heights over the surface; for a black hole, from its centre)
    const R = D && D.rs === 0 ? f.core.groundR || D.radius : 0;
    this.viz.update(f.predictor, f.predictor.frame?.upos ?? null, app.rig.upos, app.view.quat, app.view.pixelAngle, !travelling && !!D, R);
    this.viz.fitScreen(app.renderer.camera, app.vr.active);
    // vignette from about 3 g (gentle: comfort in VR), red-out from tides
    const vig = Math.max(0, Math.min(1, (r.gForce - 3) / 7)) * (app.vr.active ? 0.6 : 1) + Math.min(0.6, r.tidal / (100 * G0));
    const plasma = Math.max(0, Math.min(1, Math.log10(Math.max(ship.heatFlux, 1) / 3e4) / 2));
    let fade = 0, fadeCol: [number, number, number] = [0, 0, 0];
    const e = f.ending;
    if (e) {
      const t = f.endingT;
      if (e.ev.kind === 'horizon') fade = Math.min(1, t / (e.total * 0.6));
      else { fadeCol = e.ev.kind === 'spaghetti' ? [0.6, 0.05, 0.02] : [1, 0.85, 0.7]; fade = Math.max(0.55, 1 - t * 0.5); }
      if (e.t < 0.6) fade *= e.t / 0.6;
    }
    this.viz.setEffects(vig, Math.min(1, r.tidal / (30 * G0)), plasma, fade, fadeCol, performance.now() / 1000);
    if (!app.vr.active) {
      this.flightHud.setVisible(true);
      this.flightHud.update(dt, r, this.mode === 'cockpit' || this.mode === 'chase');
      this.flightHud.setEnd(e?.title ?? '', e?.text ?? '', e ? Math.min(1, f.endingT * 2) * (e.t < 0.6 ? e.t / 0.6 : 1) : 0);
    } else this.flightHud.setVisible(false);
    if (app.vr.active && r.warnLevel === 2 && r.warning !== this.lastVrWarn) app.vr.flash(r.warning);
    this.lastVrWarn = r.warning;
  }
  private lastVrWarn = '';

  /** Canopy markers: target bracket, flight-path marker. */
  private updateHud(): void {
    const app = this.app, rig = app.rig;
    const inv = rig.quat.clone().invert();
    const sel = app.selection;
    let tdir: Vector3 | null = null, text = '';
    if (sel && !this.docked) {
      const rel = sel.upos.sub(rig.upos, new Vector3());
      const d = rel.length();
      tdir = rel.normalize().applyQuaternion(inv);
      text = `${sel.name}|${formatDistance(Math.max(0, d - sel.radius))}`;
    }
    const v = rig.vel;
    const vdir = v.lengthSq() > 1e-6 && rig.speed > 0.5 ? v.clone().normalize().applyQuaternion(inv) : null;
    this.hud.update(tdir, text, vdir);
  }

  /** Where a docked ship sits: 14 m in front of the port, on the hub axis. */
  private holdPoint(st: Station): Vector3 {
    return st.port().sub(this.app.rig.upos, new Vector3()).addScaledVector(st.axis, 14);
  }

  private holdQuat(st: Station): Quaternion {
    // facing the port along the axis; "up" fixed in the station frame
    const fwd = st.axis.clone().negate();
    const up = Math.abs(fwd.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0);
    return new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(new Vector3(), fwd, up));
  }

  private updateDocking(dt: number): void {
    const app = this.app, rig = app.rig;
    // (VR: the grip throttle; in physics flight the engine is held at zero while the computer flies)
    const moving = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyR', 'KeyF'].some((k) => app.input.keys.has(k)) || Math.abs(rig.thrust) > 0.05 || (this.flight.on && this.flight.gripThrottle > 0.05);
    if (this.flight.on && (this.docked || this.docking)) this.flight.ship.throttle = 0;
    this.dockCooldown = Math.max(0, this.dockCooldown - dt);
    if (this.docked) {
      const st = this.docked;
      if (moving || !this.traffic.stations.includes(st)) {
        this.docked = null;
        this.dockCooldown = 20;
        rig.upos.addVec(st.axis, 25);
        app.hud.toast(`Undocked from ${st.name}`);
        return;
      }
      rig.upos.addVec(this.holdPoint(st));
      rig.stop();
      return;
    }
    if (this.docking && moving && this.docking.t > 0.15) {
      // the pilot takes the controls back
      this.docking = null;
      this.dockCooldown = 10;
      app.hud.toast('Docking cancelled');
    }
    if (this.docking) {
      const d = this.docking;
      d.t = Math.min(1, d.t + dt / 3.5);
      const s = d.t * d.t * (3 - 2 * d.t);
      const target = this.holdPoint(d.station);
      rig.upos.addVec(target.addScaledVector(d.from, 1 - s));
      rig.quat.copy(d.q0).slerp(this.holdQuat(d.station), s);
      rig.stop();
      if (d.t >= 1) {
        this.docked = d.station;
        this.docking = null;
        app.hud.toast(`Docked at ${d.station.name}. Thrust to undock.`);
        if (app.vr.active) app.vr.flash(`Docked at ${d.station.name}`);
        this.audio.chime();
      }
      return;
    }
    if (rig.autopilot || app.vr.traveling || this.dockCooldown > 0) return;
    for (const st of this.traffic.stations) {
      const rel = rig.upos.sub(st.port(), new Vector3());
      const dist = rel.length();
      // physics flight: within 25 km, velocity matched to the station (< 150 m/s) and thrusting
      // towards it, the docking computer takes over; otherwise in front of the port, on the axis, slow
      const f = this.flight;
      const flightDock = f.on && dist < 25e3 && f.ship.throttle > 0
        && f.ship.vel.clone().sub(st.body.vel).sub(st.vel).length() < 150;
      if (!flightDock && (dist > 400 || dist < 1)) continue;
      if (flightDock || (rel.dot(st.axis) / dist > 0.75 && rig.speed < 400)) {
        const hold = this.holdPoint(st);
        this.docking = { station: st, t: 0, from: hold.negate(), q0: rig.quat.clone() };
        this.flight.ship.throttle = 0;
        app.hud.toast(`Docking computer engaged: ${st.name}`);
        break;
      }
    }
  }

  /** Touch down when coming in slowly over a solid surface. */
  private updateLanding(dt: number): void {
    const app = this.app, rig = app.rig;
    void dt;
    const a = rig.anchor;
    if (this.landed) {
      if (a !== this.landed || rig.altitude > 40) { this.landed = null; app.hud.toast('Lift-off'); }
      return;
    }
    const solid = (a instanceof Body && a.kind !== 'star' && !a.isGasGiant) || (a instanceof ExoPlanet && SOLID_TYPES.has(a.spec.type));
    if (!solid || this.docked) return;
    // (flight speed already scales with altitude, so coming down to 10 m is a gentle touchdown)
    if (rig.altitude < 10 && !rig.autopilot) {
      this.landed = a;
      rig.stop();
      // level the ship: local vertical up
      const up = rig.upos.sub(a.upos, new Vector3()).normalize();
      const fwd = rig.forward(new Vector3());
      const flat = fwd.sub(up.clone().multiplyScalar(fwd.dot(up))).normalize();
      if (flat.lengthSq() > 0.5) rig.quat.setFromRotationMatrix(new Matrix4().lookAt(new Vector3(), flat, up));
      app.hud.toast(`Touchdown on ${a.name}!`);
      if (app.vr.active) app.vr.flash(`Touchdown on ${a.name}!`);
      this.audio.chime();
    }
  }

  private fillReadout(): void {
    const app = this.app, rig = app.rig, r = this.cockpit.readout;
    r.speed = formatSpeed(rig.speed);
    r.throttle = rig.thrust;
    r.boost = app.input.keys.has('ShiftLeft') || app.input.keys.has('ShiftRight');
    r.altitude = formatDistance(rig.altitude);
    r.reference = this.docked ? `DOCKED · ${this.docked.name}` : this.landed ? `LANDED · ${this.landed.name}` : rig.anchor?.name ?? 'deep space';
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
    r.hint = app.vr.active ? 'L grip: throttle · R stick: steer · L stick: RCS · A: warp' : 'W/S throttle · Y SAS · I boost · J warp · V view';
    const f = this.flight;
    if (f.on) {
      const fr = f.readout;
      r.speed = fmtSpd(fr.orbitSpeed);
      r.throttle = fr.throttle;
      r.boost = fr.boosted;
      r.altitude = fmtDist(fr.altitude);
      r.reference = this.docked ? r.reference : fr.landed ? `LANDED · ${fr.landed}` : `orbiting ${fr.frame}`;
      r.flight = {
        lines: [
          `Ap ${Number.isFinite(fr.ap) ? fmtDist(fr.ap) : '—'}  ${Number.isFinite(fr.tAp) ? fmtTime(fr.tAp) : ''}`,
          `Pe ${Number.isFinite(fr.pe) ? fmtDist(fr.pe) : '—'}  ${Number.isFinite(fr.tPe) ? fmtTime(fr.tPe) : ''}`,
          Number.isFinite(fr.tImpact) && !fr.landed ? `IMPACT in ${fmtTime(fr.tImpact)}` : `surface ${fmtSpd(fr.surfSpeed)}  vert ${fmtSpd(fr.vertSpeed)}`,
        ],
        g: `${fr.gForce.toFixed(1)} g`,
        sas: sasLabel(fr.sas),
        fuel: fr.boosted ? 1 : fr.fuel,
        clocks: `ship ${fmtTime(fr.shipTime)} · univ ${fmtTime(fr.universeTime)}${fr.dilation < 0.9999 ? ` · ×${fr.dilation.toPrecision(3)}` : ''}`,
        warning: fr.warning,
        lock: fr.massLock ? 'MASS-LOCKED' : '',
      };
    } else r.flight = null;
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
