import { Vector3 } from 'three';
import type { SpaceObject } from '../universe/Body';
import type { God } from './God';
import { pushCaption } from './verbs';

/**
 * God mode in the headset: the right grip grabs the body under the laser (once God mode is in
 * use) and drags it along the laser at the distance it was grabbed at; letting go drops it there,
 * thrown with the laser point's speed, scaled to the time rate (a flick that would cross the view
 * in a second of what you see gives the speed that crosses it in a second of simulated time).
 * While a creation tool is chosen, the trigger places the new thing at the laser.
 */
export class GodVR {
  /** grip grabs bodies (set once the God tab has been used, so the grip keeps orbiting before that) */
  armed = false;
  private grab: { id: number; dist: number; samples: { t: number; p: Vector3 }[] } | null = null;
  /** the body under the laser last frame (a light tick when it changes: "this can be grabbed") */
  private hoverId: number | null = null;
  private lastBuzz = 0;

  private buzz(intensity: number, ms: number): void { this.god.app.vr?.pulse(intensity, ms); }

  constructor(private god: God) {}

  get grabbing(): boolean { return this.grab !== null; }

  /**
   * Right grip, every frame (ray in scene coordinates, relative to the explorer). True while the
   * grip is God mode's (so it does not also orbit the view).
   */
  grip(squeeze: boolean, origin: Vector3, dir: Vector3, hover: SpaceObject | null): boolean {
    const g = this.god;
    const eye = g.app.rig.upos.toVector3();
    if (!squeeze) {
      if (!this.grab) return false;
      this.release(eye.add(origin), dir);
      return true;
    }
    if (!this.armed) return false;
    const absOrigin = eye.clone().add(origin);
    if (!this.grab) {
      const hid = g.idOf(hover);
      if (hid !== this.hoverId) { this.hoverId = hid; if (hid !== null) this.buzz(0.12, 12); }
    }
    if (!this.grab) {
      const target = hover ?? g.app.selection;
      const id = g.idOf(hover);
      if (id === null || !target) return false;
      g.ensureActive();
      // thrown things fly, collide and get pulled: that is the N-body simulation
      g.needGravity('what you throw flies, collides and gets pulled');
      const e = g.sandbox.entityOf(id);
      if (!e) return false;
      this.grab = { id, dist: e.pos.distanceTo(absOrigin), samples: [] };
      if (g.app.selection !== target) g.app.select(target);
      g.audio.whoosh();
      this.buzz(0.7, 60);
      g.layer.startMorph(e, g.sandbox.primaryOf(e));
      g.app.vr?.flash(`Holding ${e.name}: swing and let go to throw`);
    }
    const e = g.sandbox.entityOf(this.grab.id);
    if (!e) { this.grab = null; return false; }
    const at = absOrigin.addScaledVector(dir, this.grab.dist);
    const now = performance.now();
    this.grab.samples.push({ t: now, p: at.clone() });
    while (this.grab.samples.length > 2 && now - this.grab.samples[0].t > 150) this.grab.samples.shift();
    g.layer.movePreview = { e, at };
    // a faint rumble while held, stronger the faster the hand moves
    if (now - this.lastBuzz > 120 && this.grab.samples.length > 1) {
      const s0 = this.grab.samples[0], dtS = (now - s0.t) / 1000;
      const sp = dtS > 0 ? at.distanceTo(s0.p) / dtS / Math.max(this.grab.dist, 1) : 0; // laser sweep, rad/s
      this.buzz(Math.min(0.5, 0.06 + sp * 0.2), 40);
      this.lastBuzz = now;
    }
    return true;
  }

  private release(absOrigin: Vector3, dir: Vector3): void {
    const gr = this.grab!;
    this.grab = null;
    const g = this.god;
    g.layer.movePreview = null;
    const e = g.sandbox.entityOf(gr.id);
    if (!e) return;
    const at = absOrigin.addScaledVector(dir, gr.dist);
    const s = gr.samples;
    const first = s[0], last = s[s.length - 1];
    const dtReal = first && last ? (last.t - first.t) / 1000 : 0;
    const shown = dtReal > 0.02 ? last.p.clone().sub(first.p).divideScalar(dtReal) : new Vector3();
    const c = g.actions.ctx(e);
    g.drop(gr.id, at, shown);
    const after = g.sandbox.entityOf(gr.id);
    if (!after) return;
    const { r, v } = g.sandbox.relative(after);
    const thrown = shown.lengthSq() > 0 && v.length() > 0;
    const circ = Math.sqrt(((g.sandbox.primaryOf(after)?.gm ?? 0) + after.gm) / Math.max(r.length(), 1));
    // a throw that leaves a near-circular orbit reads as "dropped"
    const say = thrown && Math.abs(v.length() / Math.max(circ, 1e-9) - 1) > 0.05
      ? pushCaption({ ...c, parentGm: g.sandbox.primaryOf(after)?.gm, parentName: g.sandbox.primaryOf(after)?.name }, r.toArray(), r.clone().cross(v).cross(r).setLength(circ).toArray(), v.toArray(), 'by hand').replace('Pushed by hand', 'Thrown')
      : `Dropped ${e.name} on a circular orbit${g.sandbox.primaryOf(after) ? ` round ${g.sandbox.primaryOf(after)!.name}` : ''}`;
    g.actions.say(say, { verb: 'grab' });
    g.app.vr?.flash(say);
    this.buzz(thrown ? 0.9 : 0.4, thrown ? 90 : 40);
  }

  /** Trigger in space: place what the creation tool holds at the laser. True when it did. */
  trigger(origin: Vector3, dir: Vector3): boolean {
    const g = this.god;
    if (g.tool === 'push') {
      // aimed push: towards the laser point on the orbit plane
      g.tool = 'none';
      const id = g.selectedId(), sel = g.app.selection;
      const at = g.placeOnRay(g.app.rig.upos.toVector3().add(origin), dir);
      if (id === null || !sel || !at) return false;
      g.actions.push(id, at.sub(sel.upos.toVector3()));
      g.app.vr?.flash(g.actions.caption);
      return true;
    }
    if (g.tool !== 'place') return false;
    const eye = g.app.rig.upos.toVector3();
    const at = g.placeOnRay(eye.add(origin), dir);
    g.tool = 'none';
    if (!at) return false;
    const id = g.spawn(g.placeType, g.placeMass, at);
    if (id !== null) g.selectEntity(id);
    return true;
  }

  /** Test helper: grab the selection, move the laser point and let go. */
  debugThrow(): { thrown: boolean; speedChange: number } | null {
    const g = this.god;
    const id = g.selectedId();
    if (id === null) return null;
    g.ensureActive();
    const e = g.sandbox.entityOf(id);
    if (!e) return null;
    const v0 = e.vel.clone();
    const eye = g.app.rig.upos.toVector3();
    const dir0 = e.pos.clone().sub(eye).normalize();
    this.armed = true;
    this.grip(true, new Vector3(), dir0, g.objectOf(e));
    // sweep the laser sideways for a fifth of a second
    const side = new Vector3(0, 0, 1).cross(dir0).normalize();
    const t0 = performance.now();
    while (performance.now() - t0 < 200) { /* (time passes) */ }
    this.grip(true, new Vector3(), dir0.clone().addScaledVector(side, 0.05).normalize(), null);
    this.grip(false, new Vector3(), dir0.clone().addScaledVector(side, 0.05).normalize(), null);
    const after = g.sandbox.entityOf(id);
    return { thrown: !!after, speedChange: after ? after.vel.distanceTo(v0) : 0 };
  }
}
