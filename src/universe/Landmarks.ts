import { Vector3 } from 'three';
import type { UPos } from '../core/upos';
import type { Body, SpaceObject } from './Body';

/** A named place on a solid world, from planetocentric latitude / east longitude (IAU frames). */
interface LandmarkDef {
  name: string;
  body: string;
  lat: number;
  lon: number;
  /** approximate ground elevation there (m, from the elevation models), and viewing distance (m) */
  h: number;
  view: number;
  about: string;
  /** elevation (degrees) of the viewpoint seen from the place: low for mountains (seen against the sky); default 37 */
  elev?: number;
}

/**
 * Places worth visiting on the landing terrain. Coordinates: USGS Gazetteer of Planetary
 * Nomenclature (IAU WGPSN) feature centres; landing sites from the mission teams' published
 * coordinates (Apollo 11: 0.674 N, 23.473 E; Curiosity's Bradbury Landing: 4.589 S, 137.441 E;
 * Perseverance's Octavia E. Butler Landing: 18.445 N, 77.451 E; Apollo 15: 26.1322 N, 3.6339 E;
 * Apollo 17: 20.1908 N, 30.7717 E; Chang'e 4: 45.4446 S, 177.5991 E; Opportunity: 1.9462 S,
 * 354.4734 E; Spirit: 14.5684 S, 175.4726 E). Earth: the summits' surveyed
 * positions and heights, and the Grand Canyon at Grand Canyon Village (South Rim).
 */
export const LANDMARKS: LandmarkDef[] = [
  { name: 'Olympus Mons', body: 'Mars', lat: 18.65, lon: -133.8, h: 21e3, view: 70e3, about: 'the tallest volcano known, about 22 km above the Martian datum' },
  { name: 'Valles Marineris', body: 'Mars', lat: -13.9, lon: -59.2, h: -4e3, view: 45e3, about: 'a canyon system 4,000 km long and up to 7 km deep' },
  { name: 'Gale Crater (Curiosity)', body: 'Mars', lat: -4.589, lon: 137.441, h: -4.5e3, view: 8e3, about: 'where NASA\'s Curiosity rover landed in 2012' },
  { name: 'Opportunity (Eagle crater)', body: 'Mars', lat: -1.9462, lon: -5.5266, h: -1.4e3, view: 6e3, about: 'where NASA\'s Opportunity rover landed in 2004; it drove 45 km in 14 years' },
  { name: 'Spirit (Gusev crater)', body: 'Mars', lat: -14.5684, lon: 175.4726, h: -1.9e3, view: 8e3, about: 'where NASA\'s Spirit rover landed in 2004' },
  { name: 'Jezero Crater (Perseverance)', body: 'Mars', lat: 18.445, lon: 77.451, h: -2.6e3, view: 8e3, about: 'where NASA\'s Perseverance rover landed in 2021' },
  { name: 'Apollo 11 landing site', body: 'Moon', lat: 0.674, lon: 23.473, h: -1.9e3, view: 4e3, about: 'Tranquility Base, 20 July 1969' },
  { name: 'Apollo 15 landing site', body: 'Moon', lat: 26.1322, lon: 3.6339, h: -1.9e3, view: 15e3, about: 'Hadley Rille below the Apennine mountains, July 1971 (the first lunar rover)' },
  { name: 'Apollo 17 landing site', body: 'Moon', lat: 20.1908, lon: 30.7717, h: -2.6e3, view: 12e3, about: 'the Taurus-Littrow valley, December 1972, the last Apollo landing' },
  { name: "Chang'e 4 (far side)", body: 'Moon', lat: -45.4446, lon: 177.5991, h: -5.9e3, view: 8e3, about: 'the first landing on the Moon\'s far side, January 2019, in Von Kármán crater' },
  { name: 'Tycho', body: 'Moon', lat: -43.31, lon: -11.36, h: -2e3, view: 70e3, about: 'a young crater 85 km across with bright rays' },
  { name: 'Copernicus', body: 'Moon', lat: 9.62, lon: -20.08, h: -3e3, view: 75e3, about: 'a 93 km crater with terraced walls and central peaks' },
  { name: 'Shackleton (lunar south pole)', body: 'Moon', lat: -89.67, lon: 129.78, h: -1e3, view: 30e3, about: 'a crater whose floor never sees the Sun, near the Artemis landing regions' },
  { name: 'Caloris Basin', body: 'Mercury', lat: 31.5, lon: 162.7, h: 0, view: 300e3, about: 'an impact basin 1,550 km across' },
  { name: 'Mount Everest', body: 'Earth', lat: 27.988, lon: 86.925, h: 8.8e3, view: 25e3, elev: 9, about: 'the highest mountain above sea level, 8,849 m, in the Himalaya' },
  { name: 'Grand Canyon', body: 'Earth', lat: 36.06, lon: -112.14, h: 2.1e3, view: 14e3, elev: 25, about: 'a canyon 446 km long and up to 1.8 km deep, cut by the Colorado River' },
  { name: 'Kilimanjaro', body: 'Earth', lat: -3.0674, lon: 37.3556, h: 5.9e3, view: 35e3, elev: 9, about: 'the highest mountain in Africa, 5,895 m, a dormant volcano' },
  { name: 'Matterhorn (Alps)', body: 'Earth', lat: 45.9763, lon: 7.6586, h: 4.5e3, view: 25e3, elev: 10, about: 'a 4,478 m peak of the Alps on the Swiss-Italian border' },
  { name: 'Mauna Kea (Hawaii)', body: 'Earth', lat: 19.8207, lon: -155.468, h: 4.2e3, view: 60e3, elev: 7, about: 'a volcano 4,207 m above the sea and over 10 km from its base on the ocean floor' },
  { name: 'Mount Fuji', body: 'Earth', lat: 35.3606, lon: 138.7274, h: 3.7e3, view: 30e3, elev: 6, about: 'Japan\'s highest mountain, 3,776 m, a near-symmetrical volcanic cone' },
  { name: 'Denali', body: 'Earth', lat: 63.0695, lon: -151.0074, h: 6.1e3, view: 35e3, elev: 9, about: 'the highest mountain in North America, 6,190 m, in the Alaska Range' },
];

/** A landmark as a destination: a point on the ground there, turning with its world. */
export class Landmark implements SpaceObject {
  readonly kind = 'place';
  readonly key: string;
  readonly radius = 0;
  private dirBF: Vector3;

  constructor(readonly def: LandmarkDef, readonly world: Body) {
    this.key = `place:${def.name}`;
    const la = (def.lat * Math.PI) / 180, lo = (def.lon * Math.PI) / 180;
    this.dirBF = new Vector3(Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la));
  }

  get name(): string { return this.def.name; }
  get parentObject(): SpaceObject { return this.world; }

  /** world-space unit vertical at the place */
  up(): Vector3 { return this.dirBF.clone().transformDirection(this.world.orientation); }

  /**
   * Direction (world) to view the place from: above it, on the side lit by the Sun at `sunWorld`.
   * Low viewpoints (mountains) look across the sunlight a little, so slopes show light and shade.
   */
  approachDir(sunWorld: Vector3): Vector3 {
    const up = this.up();
    const side = sunWorld.clone().addScaledVector(up, -sunWorld.dot(up));
    if (side.lengthSq() < 1e-6) return up;
    side.normalize();
    const e = ((this.def.elev ?? 36.87) * Math.PI) / 180;
    const across = side.clone().cross(up);
    const k = this.def.elev === undefined ? 0 : 0.8;
    const horiz = side.multiplyScalar(1).addScaledVector(across, k).normalize();
    return up.clone().multiplyScalar(Math.sin(e)).addScaledVector(horiz, Math.cos(e)).normalize();
  }

  /** on the ground at the place */
  get upos(): UPos {
    return this.world.upos.clone().addVec(this.up(), this.world.radius + this.def.h);
  }

  info(): [string, string][] {
    const d = this.def;
    return [
      ['Type', `Place on ${d.body}`],
      ['About', d.about],
      ['Coordinates', `${Math.abs(d.lat).toFixed(2)}° ${d.lat >= 0 ? 'N' : 'S'}, ${Math.abs(d.lon).toFixed(2)}° ${d.lon >= 0 ? 'E' : 'W'}`],
      ['Ground', `real elevation model (${d.body}) with generated detail; fly down to land`],
    ];
  }
}
