import { Vector3 } from 'three';
import { PC } from '../core/units';
import { UPos } from '../core/upos';
import type { SpaceObject } from './Body';
import { GALAXY, R0 } from './Galaxy';

/** The Milky Way as a destination: centred on Sgr A*, sized by its stellar disk. */
export class MilkyWay implements SpaceObject {
  readonly key = 'galaxy:mw';
  readonly name = 'Milky Way';
  readonly kind = 'galaxy';
  readonly upos: UPos;
  /** radius of the bright stellar disk (m) */
  readonly radius = 15000 * PC;
  readonly parentObject = null;

  constructor() {
    const c = GALAXY.centre;
    this.upos = UPos.from(c.x * PC, c.y * PC, c.z * PC);
  }

  /** Direction (ICRF, from the centre) to view the galaxy from: above the north side, tilted 35° towards the Sun. */
  viewDir(): Vector3 {
    const north = new Vector3(0, 0, 1);
    const toSun = new Vector3(-1, 0, 0);
    const g = north.multiplyScalar(Math.cos((35 * Math.PI) / 180)).addScaledVector(toSun, Math.sin((35 * Math.PI) / 180));
    return g.applyMatrix3(GALAXY.axes).normalize();
  }

  info(): [string, string][] {
    return [
      ['Type', 'Barred spiral galaxy (our own)'],
      ['Stars', 'about 100–400 billion'],
      ['Stellar disk', 'scale length 2.6 kpc, ~50,000 light years across'],
      ['Bar', '~10,000 light years long, 27° from the Sun–centre line'],
      ['Sun', `${(R0 / 1000).toFixed(2)} kpc (${Math.round((R0 * 3.2616) / 1000)},000 light years) from the centre`],
      ['Centre', 'Sagittarius A*, a 4.3 million solar-mass black hole'],
      ['Model', 'parametric (disks, bar, arms, dust) with procedural stars; see CREDITS'],
    ];
  }
}
