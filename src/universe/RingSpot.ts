import { Matrix4, Vector3 } from 'three';
import type { UPos } from '../core/upos';
import type { Body, SpaceObject } from './Body';

/**
 * Non-rotating frame of a planet's equatorial (ring) plane: z along the pole, x fixed in space.
 * Ring particles are drawn in it, so they hold still around an explorer hovering in the rings.
 */
export function ringFrame(orientation: Matrix4): Matrix4 {
  const z = new Vector3().setFromMatrixColumn(orientation, 2).normalize();
  const x = new Vector3(0, 0, 1).cross(z);
  if (x.lengthSq() < 1e-8) x.set(1, 0, 0);
  x.normalize();
  const y = new Vector3().crossVectors(z, x);
  return new Matrix4().makeBasis(x, y, z);
}

/**
 * A place inside Saturn's rings to fly to: in the B ring (105,000 km from the centre, the densest
 * part), a little above the particle layer, on the side lit by the Sun when it was first asked for.
 */
export class RingSpot implements SpaceObject {
  readonly kind = 'place';
  readonly key = 'place:saturn-rings';
  readonly name = "Saturn's rings";
  readonly radius = 0;
  private local: Vector3;

  constructor(readonly planet: Body, sunWorld: Vector3, readonly ringRadius = 105_000e3) {
    // 60 degrees around from the sub-solar direction (lit, with the planet off to the side)
    const f = ringFrame(planet.orientation);
    const inv = f.clone().invert();
    const s = sunWorld.clone().sub(new Vector3()).applyMatrix4(inv);
    const a0 = Math.atan2(s.y, s.x) + Math.PI / 3;
    this.local = new Vector3(Math.cos(a0) * ringRadius, Math.sin(a0) * ringRadius, 40);
  }

  get parentObject(): SpaceObject { return this.planet; }

  /** Direction (world) to arrive from: outward from the planet, a little above the ring plane. */
  approachDir(): Vector3 {
    const f = ringFrame(this.planet.orientation);
    const out = this.local.clone().setZ(0).normalize().applyMatrix4(f);
    const pole = new Vector3().setFromMatrixColumn(f, 2);
    return out.addScaledVector(pole, 0.15).normalize();
  }

  get upos(): UPos {
    return this.planet.upos.clone().addVec(this.local.clone().applyMatrix4(ringFrame(this.planet.orientation)));
  }

  info(): [string, string][] {
    return [
      ['Type', 'Place: inside the B ring of Saturn'],
      ['Distance from Saturn', `${(this.ringRadius / 1e3).toLocaleString()} km from the centre`],
      ['Particles', 'drawn from the ring\'s measured optical depth (Voyager 2 PPS occultation); sizes and layout generated'],
    ];
  }
}
