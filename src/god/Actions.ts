import { Vector3 } from 'three';
import type { Entity } from './Sandbox';
import { type God, SPAWN_TYPES, type SpawnType } from './God';
import {
  type CaptionCtx, createCaption, deleteCaption, type HintEvent, Hints, MASS_STEP, massCaption, PUSH_FRACTION, type PushDir,
  pushCaption, pushVector, reverseCaption, SIZE_STEP, sizeCaption, type Verb,
} from './verbs';

/** What the three big Create buttons make. */
export const QUICK_CREATE: { type: SpawnType; label: string; icon: string }[] = [
  { type: 'terran', label: 'Planet', icon: '🪐' },
  { type: 'star', label: 'Star', icon: '☀' },
  { type: 'hole', label: 'Black hole', icon: '●' },
];

const DIR_WORD: Record<PushDir, string> = { forward: 'forward', back: 'backward', out: 'outward', in: 'inward', up: 'up', down: 'down' };

/**
 * God mode's simple verbs on the selected body: heavier, lighter, bigger, smaller, push, reverse,
 * delete, create, undo, reset. Each one edits the sandbox, morphs the orbit line from the old
 * orbit to the new one, makes the body glow, and leaves a one-line caption saying what the
 * physics did (src/god/verbs.ts). Used by the desktop panel and the headset's God tab.
 */
export class GodActions {
  /** the last caption and when it was said (performance.now) */
  caption = '';
  captionAt = 0;
  readonly hints = new Hints();
  /** bumps on every verb (UI repaint key) */
  serial = 0;

  constructor(private god: God) {}

  private ent(id: number): Entity | null {
    this.god.ensureActive();
    return this.god.sandbox.entityOf(id);
  }

  /** Name, kind, masses and satellites of an entity for the captions. */
  ctx(e: Entity): CaptionCtx {
    const sb = this.god.sandbox;
    const p = sb.primaryOf(e);
    const sats = [...sb.entities.values()].filter((x) => x !== e && x.kind !== 'swarm' && x.gm > 0 && sb.primaryOf(x) === e).sort((a, b) => b.gm - a.gm).map((x) => x.name);
    const bk = e.body?.kind;
    const kind: CaptionCtx['kind'] = e.kind === 'hole' ? 'hole' : e.kind === 'star' || bk === 'star' ? 'star' : bk === 'moon' || e.spawn?.type === 'moon' ? 'moon' : 'planet';
    return { name: e.name, kind, gm: e.gm, parentGm: p?.gm, parentName: p?.name, satellites: sats };
  }

  say(text: string, ev?: HintEvent): void {
    this.caption = text;
    this.captionAt = performance.now();
    this.serial++;
    if (ev && this.hints.note(ev)) this.god.audio.whoosh?.();
    this.god.panel.refresh();
  }

  /** Remember the orbit as it was, so the line morphs to the new one; glow. */
  private before(e: Entity): void {
    const p = this.god.sandbox.primaryOf(e);
    this.god.layer.startMorph(e, p);
  }

  run(verb: Verb, id: number | null, arg?: PushDir | Vector3 | SpawnType): void {
    if (verb === 'create') { this.create((arg as SpawnType) ?? 'terran'); return; }
    if (id === null) { this.say('Select something first: click a planet, moon or star'); return; }
    switch (verb) {
      case 'heavier': this.mass(id, MASS_STEP); break;
      case 'lighter': this.mass(id, 1 / MASS_STEP); break;
      case 'bigger': this.size(id, SIZE_STEP); break;
      case 'smaller': this.size(id, 1 / SIZE_STEP); break;
      case 'push': this.push(id, (arg as PushDir | Vector3) ?? 'forward'); break;
      case 'reverse': this.reverse(id); break;
      case 'delete': this.remove(id); break;
    }
  }

  mass(id: number, k: number): void {
    const e = this.ent(id);
    if (!e) return;
    const c = this.ctx(e);
    this.before(e);
    if (e.kind === 'hole') this.god.scaleMass(id, k);
    else this.god.sandbox.setMass(id, e.gm * k, e.radius);
    this.say(massCaption(c, k), { verb: k > 1 ? 'heavier' : 'lighter', name: e.name });
  }

  size(id: number, k: number): void {
    const e = this.ent(id);
    if (!e) return;
    const c = this.ctx(e);
    if (e.kind !== 'hole') { this.before(e); this.god.setRadius(id, e.radius * k); }
    this.say(sizeCaption(c, k), { verb: k > 1 ? 'bigger' : 'smaller', name: e.name });
  }

  /** Push along the orbit (forward, out, up…) or towards a world direction. */
  push(id: number, dir: PushDir | Vector3): void {
    const e = this.ent(id);
    if (!e) return;
    const sb = this.god.sandbox;
    const c = this.ctx(e);
    const { p, r, v } = sb.relative(e);
    const mu = (p?.gm ?? 0) + e.gm;
    const vc = p && r.length() > 0 ? Math.sqrt(mu / r.length()) : Math.max(v.length(), 1000);
    let d: Vector3, word: string;
    if (dir instanceof Vector3) {
      d = dir.clone().normalize();
      // name the aimed direction by its biggest part
      const parts: [PushDir, number][] = (['forward', 'out', 'up'] as PushDir[]).map((k) => [k, d.dot(new Vector3(...pushVector(k, r.toArray(), v.toArray())))]);
      const [k, x] = parts.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
      word = DIR_WORD[x >= 0 ? k : k === 'forward' ? 'back' : k === 'out' ? 'in' : 'down'];
    } else {
      d = new Vector3(...pushVector(dir, r.toArray(), v.toArray()));
      word = DIR_WORD[dir];
    }
    const nv = v.clone().addScaledVector(d, PUSH_FRACTION * vc);
    this.before(e);
    sb.setVelocity(id, nv.clone().add(p?.vel ?? new Vector3()));
    this.say(pushCaption(c, r.toArray(), v.toArray(), nv.toArray(), word), { verb: 'push', name: e.name });
  }

  reverse(id: number): void {
    const e = this.ent(id);
    if (!e) return;
    const c = this.ctx(e);
    this.before(e);
    this.god.preset(id, 'reverse');
    this.say(reverseCaption(c), { verb: 'reverse', name: e.name });
  }

  remove(id: number): void {
    const e = this.ent(id);
    if (!e) return;
    const c = this.ctx(e);
    this.god.remove(id);
    this.say(deleteCaption(c), { verb: 'delete', name: c.name });
  }

  create(type: SpawnType): void {
    const g = this.god;
    const info = SPAWN_TYPES.find((t) => t.type === type)!;
    const near = g.app.selection;
    const newId = g.spawnNearSelection(type, info.mass);
    if (newId === null) return;
    const e = g.sandbox.entityOf(newId);
    // a black hole or a second star only does something with gravity on
    if (type === 'hole' || type === 'star') g.needGravity('the new arrival pulls on everything');
    const nearName = near?.name ?? 'the Sun';
    const dist = e && near ? e.pos.distanceTo(near.upos.toVector3()) : 1.496e11;
    if (e) g.layer.glow(e);
    const label = type === 'hole' ? `${info.mass} M☉ black hole` : type === 'star' ? `${info.mass} M☉ star` : info.label;
    this.say(createCaption(label, nearName, dist), { verb: 'create', kind: type });
  }

  undo(): void {
    if (!this.god.sandbox.canUndo) { this.say('Nothing to undo'); return; }
    this.god.undo();
    this.say('Undone: back to how it was', { verb: 'undo' });
  }

  reset(): void {
    if (!this.god.sandbox.active) { this.say('Already the real universe'); return; }
    this.god.reset();
    this.say('The real Solar System is back (JPL ephemeris)', { verb: 'reset' });
  }

  /** Grabbed and thrown in the headset (for the guide). */
  noteGrab(): void { this.hints.note({ verb: 'grab' }); }
}
