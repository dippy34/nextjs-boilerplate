import { Vector3 } from 'three';
import { SUN_RADIUS } from '../core/units';
import { UPos } from '../core/upos';
import { Rumble } from '../game/Rumble';
import { ScaleCues } from '../render/ScaleCues';
import { BlackHole } from '../universe/BlackHoles';
import { Body, type SpaceObject } from '../universe/Body';
import { M_SUN_KG, R_EARTH_M, angularDiameter, rumbleLevel, rumblePitch, scaleRows, shadowDiameter } from '../universe/Scale';
import type { App } from './App';

const G = 6.6743e-11;

/** Mass (kg) of anything selectable: measured where known, else a rough estimate from its size. */
export function massOf(o: SpaceObject): number {
  if (o instanceof Body && o.gm > 0) return o.gm / G;
  const m = (o as { massSun?: number }).massSun;
  if (typeof m === 'number' && m > 0) return m * M_SUN_KG;
  const r = Math.max(o.radius, 0);
  if (r > 0.05 * SUN_RADIUS) return M_SUN_KG * (r / SUN_RADIUS) ** 1.25; // a star
  return 3000 * (4 / 3) * Math.PI * r ** 3; // rock and ice
}

/** Angular diameter (rad) of `o` seen from `dist` m: a black hole's shadow, otherwise its disc. */
export function apparentSize(o: SpaceObject, dist: number): number {
  return o instanceof BlackHole ? shadowDiameter(o.radius, dist) : angularDiameter(o.radius, dist);
}

/**
 * The scale cues (dust parallax, Earth for scale, the rumble of something huge, the info card's
 * size rows), wired to the app. Construct after the renderer; `update` once a frame after the camera moved.
 */
export class Awe {
  readonly cues: ScaleCues;
  readonly rumble = new Rumble();
  private from = new UPos();
  private vel = new Vector3();
  private fromAnchor: SpaceObject | null = null;
  /** the body the rumble follows, and its angular size (for tests) */
  dominant: { name: string; ang: number; level: number } | null = null;

  constructor(private app: App) {
    this.cues = new ScaleCues(app.bodies.surfaceExposure, app.vr?.active ? 300 : 500);
    const q = new URLSearchParams(location.search);
    if (q.get('dust') === '0') this.cues.dustOn = false;
    if (q.get('earthref') === '0') this.cues.earthOn = false;
    app.renderer.scene.add(this.cues.group);
    this.rumble.arm();
  }

  /** Call after the anchor was followed and before controls move the camera. */
  beginFrame(): void {
    this.from.copy(this.app.rig.upos);
    this.fromAnchor = this.app.rig.anchor;
  }

  update(dt: number): void {
    const app = this.app;
    const cam = app.rig.upos;
    // velocity relative to the co-moving frame (the anchor's own orbit is not felt)
    if (dt > 0 && app.rig.anchor === this.fromAnchor) this.vel.copy(cam.sub(this.from, this.vel)).divideScalar(dt);
    else this.vel.set(0, 0, 0);
    if (!Number.isFinite(this.vel.x) || this.vel.lengthSq() > 1e40) this.vel.set(0, 0, 0);
    this.cues.updateDust(this.vel, dt, Math.max(app.rig.altitude, 1));

    // Earth for scale: against the selection when it is a giant (not Earth itself, not black holes:
    // Earth beside a black hole is sub-pixel; the info card carries that comparison)
    const sel = app.selection;
    const fwd = new Vector3(0, 0, -1).applyQuaternion(app.view.quat);
    if (sel && !(sel instanceof BlackHole) && sel.radius > 2.5 * R_EARTH_M && sel.name !== 'Earth') {
      const sun = app.system.sun;
      this.cues.updateEarth({ rel: sel.upos.sub(cam, new Vector3()), radius: sel.radius, sunRel: sun.upos.sub(cam, new Vector3()) }, fwd, app.view.pixelAngle);
    } else this.cues.updateEarth(null, fwd, app.view.pixelAngle);

    // rumble: the body that looms largest (weighted by mass) among the anchor, the selection and near holes
    let best: { name: string; ang: number; level: number; mass: number } | null = null;
    const consider = (o: SpaceObject | null) => {
      if (!o || !(o.radius > 0)) return;
      const d = o.upos.sub(cam, new Vector3()).length();
      const ang = apparentSize(o, d);
      const mass = massOf(o);
      const level = rumbleLevel(Math.min(ang, Math.PI), mass);
      if (!best || level > best.level) best = { name: o.name, ang, level, mass };
    };
    consider(app.rig.anchor);
    consider(sel);
    for (const h of app.blackHoles) if (h.upos.sub(cam, new Vector3()).length() < h.radius * 1e4) consider(h);
    const b = best as { name: string; ang: number; level: number; mass: number } | null;
    this.dominant = b ? { name: b.name, ang: b.ang, level: b.level } : null;
    this.rumble.setEnabled(app.game.audio.enabled);
    this.rumble.update(b ? b.level : 0, b ? rumblePitch(b.mass) : 40);
  }

  /** Info-card rows for the selection seen from `dist` (m). */
  rows(o: SpaceObject, dist: number): [string, string][] {
    return scaleRows(o.radius, dist, this.app.view.fovY, o instanceof BlackHole);
  }

  toggleEarth(): string {
    this.cues.earthOn = !this.cues.earthOn;
    return `Earth for scale ${this.cues.earthOn ? 'on' : 'off'}`;
  }
}
