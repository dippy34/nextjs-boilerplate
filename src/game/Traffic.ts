import { Group, Matrix4, Quaternion, Vector3 } from 'three';
import { formatDistance } from '../core/units';
import { UPos } from '../core/upos';
import type { Body, SpaceObject } from '../universe/Body';
import { ShipModel, type ShipLook } from './ShipModel';
import { Station } from './Station';

const ROLES: { role: string; names: string[]; look: ShipLook }[] = [
  { role: 'Freighter', names: ['Aurora', 'Halcyon', 'Long Haul', 'Meridian', 'Tortoise'], look: { hull: [0.62, 0.6, 0.55], trim: [0.9, 0.62, 0.1], engine: [1.0, 0.7, 0.35], scale: 3.2 } },
  { role: 'Shuttle', names: ['Kestrel', 'Swift', 'Dragonfly', 'Comet', 'Lark'], look: { hull: [0.88, 0.88, 0.9], trim: [0.15, 0.4, 0.85], engine: [0.5, 0.8, 1.0], scale: 0.8 } },
  { role: 'Survey ship', names: ['Cartographer', 'Lantern', 'Wayfinder', 'Pathfinder'], look: { hull: [0.75, 0.78, 0.8], trim: [0.2, 0.75, 0.5], engine: [0.55, 1.0, 0.8], scale: 1.4 } },
  { role: 'Tanker', names: ['Reservoir', 'Wellspring', 'Barrel'], look: { hull: [0.55, 0.57, 0.6], trim: [0.8, 0.2, 0.2], engine: [1.0, 0.55, 0.4], scale: 2.6 } },
];

function rnd(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** A fictional ship in orbit (game mode): selectable and followable like any object. */
export class TrafficShip implements SpaceObject {
  readonly kind = 'ship';
  readonly key: string;
  readonly upos = new UPos();
  readonly radius: number;
  readonly vel = new Vector3();
  readonly model: ShipModel;
  readonly quat = new Quaternion();

  constructor(readonly name: string, readonly role: string, look: ShipLook, readonly body: Body,
    private r: number, private axisA: Vector3, private axisB: Vector3, private phase: number, private period: number) {
    this.key = `ship:${body.id}:${name}`;
    this.radius = 8 * look.scale;
    this.model = new ShipModel(look);
    this.model.group.matrixAutoUpdate = false;
    this.model.setThrust(0.35);
  }

  get parentObject(): SpaceObject { return this.body; }

  update(jd: number): void {
    const th = this.phase + (2 * Math.PI * (jd * 86400)) / this.period;
    const p = this.axisA.clone().multiplyScalar(Math.cos(th) * this.r).addScaledVector(this.axisB, Math.sin(th) * this.r);
    this.vel.copy(this.axisA).multiplyScalar(-Math.sin(th)).addScaledVector(this.axisB, Math.cos(th)).multiplyScalar((2 * Math.PI * this.r) / this.period);
    this.upos.copy(this.body.upos).addVec(p);
    // nose along the velocity, belly towards the planet
    const fwd = this.vel.clone().normalize();
    const down = p.clone().normalize().negate();
    const right = new Vector3().crossVectors(fwd, down.clone().negate()).normalize();
    const up = new Vector3().crossVectors(right, fwd);
    this.quat.setFromRotationMatrix(new Matrix4().makeBasis(right, up, fwd.negate()));
  }

  info(): [string, string][] {
    const alt = this.upos.sub(this.body.upos, new Vector3()).length() - this.body.radius;
    return [
      ['Type', `${this.role} (fictional, game mode)`],
      ['Orbiting', this.body.name],
      ['Altitude', formatDistance(alt)],
      ['Speed', `${(this.vel.length() / 1000).toFixed(2)} km/s`],
      ['Length', `${Math.round(14 * (this.radius / 8))} m`],
    ];
  }
}

/** Ships in orbit around the world the player is near (only in game mode). */
export class Traffic {
  readonly group = new Group();
  ships: TrafficShip[] = [];
  stations: Station[] = [];
  private body: Body | null = null;
  private time = 0;

  constructor() {
    this.group.name = 'traffic';
  }

  /** Populate the space around `body` (deterministic per body); null clears. */
  setBody(body: Body | null): void {
    if (body === this.body) return;
    for (const s of this.ships) this.group.remove(s.model.group);
    for (const s of this.stations) this.group.remove(s.group);
    this.ships = [];
    this.stations = [];
    this.body = body;
    if (!body || body.gm <= 0 || body.kind === 'star') return;
    let h = 0;
    for (const c of body.name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const r = rnd(h);
    const n = body.kind === 'planet' ? 9 : 5;
    for (let i = 0; i < n; i++) {
      const role = ROLES[Math.floor(r() * ROLES.length)];
      const name = `${role.names[Math.floor(r() * role.names.length)]}-${1 + Math.floor(r() * 9)}`;
      const rad = body.radius * (1.04 + Math.pow(r(), 2) * 2.5);
      const period = 2 * Math.PI * Math.sqrt(rad ** 3 / body.gm);
      // random orbit plane
      const nrm = new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      const a = new Vector3().crossVectors(nrm, Math.abs(nrm.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0)).normalize();
      const b = new Vector3().crossVectors(nrm, a);
      const ship = new TrafficShip(`${role.role} ${name}`, role.role, role.look, body, rad, a, b, r() * Math.PI * 2, period);
      this.ships.push(ship);
      this.group.add(ship.model.group);
    }
    // one station in a low orbit (above the atmosphere of a giant)
    if (body.radius > 1e5) {
      const rad = body.radius * (body.isGasGiant ? 1.6 : 1) + Math.max(400e3, body.radius * 0.07);
      const nrm = new Vector3(r() - 0.5, r() - 0.5, r() * 2 - 0.5).normalize();
      const a = new Vector3().crossVectors(nrm, Math.abs(nrm.z) < 0.9 ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0)).normalize();
      const b = new Vector3().crossVectors(nrm, a);
      const st = new Station(body, rad, a, b, r() * Math.PI * 2, 2 * Math.PI * Math.sqrt(rad ** 3 / body.gm), Math.floor(r() * 1000));
      this.stations.push(st);
      this.group.add(st.group);
    }
  }

  update(cam: UPos, jd: number, dt = 0): void {
    this.time += dt;
    for (const st of this.stations) st.update(jd, this.time);
    for (const s of this.ships) s.update(jd);
    this.place(cam);
  }

  /** Meshes relative to the camera; call again if the camera moves after update (docking snaps it). */
  place(cam: UPos): void {
    for (const st of this.stations) st.place(cam);
    const rel = new Vector3();
    for (const s of this.ships) {
      s.upos.sub(cam, rel);
      const g = s.model.group;
      g.visible = rel.length() < 3e6;
      if (g.visible) {
        g.matrix.compose(rel, s.quat, new Vector3().setScalar(g.scale.x));
        g.matrixWorldNeedsUpdate = true;
      }
    }
  }
}
