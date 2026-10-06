import { BoxGeometry, CylinderGeometry, Group, Matrix4, Mesh, Quaternion, TorusGeometry, Vector3 } from 'three';
import { formatDistance } from '../core/units';
import { UPos } from '../core/upos';
import type { Body, SpaceObject } from '../universe/Body';
import { litMaterial } from './ShipModel';

const NAMES = ['Gateway', 'Haven', 'Tiangong Ring', 'Daedalus', 'Meridian Hub', 'Arcadia', 'Lagrange House', 'Odyssey', 'Harbor', 'Polaris'];

/**
 * A fictional rotating space station (game mode) in orbit around a world: a 300 m ring spinning
 * for gravity on four spokes, a hub with a docking port at the front and solar arrays at the back.
 * The hub axis stays fixed in space (perpendicular to the orbit).
 */
export class Station implements SpaceObject {
  readonly kind = 'station';
  readonly key: string;
  readonly name: string;
  readonly upos = new UPos();
  readonly radius = 160;
  readonly vel = new Vector3();
  readonly group = new Group();
  /** hub axis (world): the docking port is at +axis */
  readonly axis = new Vector3();
  private ring = new Group();
  private quat = new Quaternion();
  /** distance from the centre to the docking port (m) */
  readonly portOffset = 75;

  constructor(readonly body: Body, private r: number, private a: Vector3, private b: Vector3, private phase: number, private period: number, index: number) {
    this.name = `${NAMES[index % NAMES.length]} Station`;
    this.key = `station:${body.id}:${index}`;
    this.axis.crossVectors(a, b).normalize();
    this.quat.setFromRotationMatrix(new Matrix4().makeBasis(a, b, this.axis));
    const white = litMaterial([0.62, 0.63, 0.66], 0.35);
    const grey = litMaterial([0.4, 0.42, 0.45], 0.5);
    const panel = litMaterial([0.08, 0.12, 0.28], 0.6);
    const lamp = litMaterial([0.5, 0.42, 0.25], 0, 1, 0);
    const green = litMaterial([0.12, 0.5, 0.22], 0, 1, 0);
    const red = litMaterial([0.55, 0.1, 0.08], 0, 1, 0);
    const add = (parent: Group, mesh: Mesh, p: [number, number, number] = [0, 0, 0], r: [number, number, number] = [0, 0, 0]) => {
      mesh.position.set(...p); mesh.rotation.set(...r); mesh.frustumCulled = false; parent.add(mesh); return mesh;
    };
    // spinning ring (in the local xy plane) with spokes and window lights
    add(this.ring, new Mesh(new TorusGeometry(150, 11, 12, 64), white));
    for (let k = 0; k < 4; k++) {
      const ang = (k * Math.PI) / 2;
      add(this.ring, new Mesh(new CylinderGeometry(3, 3, 140, 8), grey), [Math.cos(ang) * 75, Math.sin(ang) * 75, 0], [0, 0, ang - Math.PI / 2]);
    }
    for (let k = 0; k < 48; k++) {
      const ang = (k / 48) * Math.PI * 2;
      add(this.ring, new Mesh(new BoxGeometry(1.5, 1.5, 3), lamp), [Math.cos(ang) * 161, Math.sin(ang) * 161, 0], [0, 0, ang]);
    }
    this.group.add(this.ring);
    // hub along z, docking port at +z
    add(this.group, new Mesh(new CylinderGeometry(18, 18, 110, 20), white), [0, 0, 0], [Math.PI / 2, 0, 0]);
    add(this.group, new Mesh(new CylinderGeometry(7, 9, 22, 16), grey), [0, 0, 64], [Math.PI / 2, 0, 0]);
    // docking guide lights: green on the right, red on the left of the approach
    add(this.group, new Mesh(new BoxGeometry(0.8, 0.8, 0.8), green), [10, 0, 75]);
    add(this.group, new Mesh(new BoxGeometry(0.8, 0.8, 0.8), red), [-10, 0, 75]);
    add(this.group, new Mesh(new BoxGeometry(0.8, 0.8, 0.8), lamp), [0, 10, 75]);
    // solar arrays at the back
    for (const s of [-1, 1]) add(this.group, new Mesh(new BoxGeometry(180, 34, 0.8), panel), [s * 120, 0, -58]);
    add(this.group, new Mesh(new BoxGeometry(70, 4, 4), grey), [0, 0, -58]);
    this.group.matrixAutoUpdate = false;
    this.group.name = this.name;
  }

  get parentObject(): SpaceObject { return this.body; }

  /** World position of the docking port. */
  port(out = new UPos()): UPos {
    return out.copy(this.upos).addVec(this.axis, this.portOffset);
  }

  update(jd: number, time: number): void {
    const th = this.phase + (2 * Math.PI * (jd * 86400)) / this.period;
    const p = this.a.clone().multiplyScalar(Math.cos(th) * this.r).addScaledVector(this.b, Math.sin(th) * this.r);
    this.vel.copy(this.a).multiplyScalar(-Math.sin(th)).addScaledVector(this.b, Math.cos(th)).multiplyScalar((2 * Math.PI * this.r) / this.period);
    this.upos.copy(this.body.upos).addVec(p);
    this.ring.rotation.z = time * 0.2557; // sqrt(g / r): 1 g on the rim
  }

  place(cam: UPos): void {
    const rel = this.upos.sub(cam, new Vector3());
    this.group.visible = rel.length() < 5e5;
    if (this.group.visible) {
      this.group.matrix.compose(rel, this.quat, new Vector3(1, 1, 1));
      this.group.matrixWorldNeedsUpdate = true;
    }
  }

  info(): [string, string][] {
    const alt = this.upos.sub(this.body.upos, new Vector3()).length() - this.body.radius;
    return [
      ['Type', 'Space station (fictional, game mode)'],
      ['Orbiting', this.body.name],
      ['Altitude', formatDistance(alt)],
      ['Ring', '300 m across, turning every 25 s: 1 g on the rim'],
      ['Docking', 'approach the front of the hub along its axis: the docking computer takes over within 400 m'],
    ];
  }
}
