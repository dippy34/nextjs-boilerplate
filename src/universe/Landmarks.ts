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
}

/**
 * Places worth visiting on the landing terrain. Coordinates: USGS Gazetteer of Planetary
 * Nomenclature (IAU WGPSN) feature centres; landing sites from the mission teams' published
 * coordinates (Apollo 11: 0.674 N, 23.473 E; Curiosity's Bradbury Landing: 4.589 S, 137.441 E;
 * Perseverance's Octavia E. Butler Landing: 18.445 N, 77.451 E). Earth: the summits' surveyed
 * positions and heights, and the Grand Canyon at Grand Canyon Village (South Rim).
 */
export const LANDMARKS: LandmarkDef[] = [
  { name: 'Olympus Mons', body: 'Mars', lat: 18.65, lon: -133.8, h: 21e3, view: 70e3, about: 'the tallest volcano known, about 22 km above the Martian datum' },
  { name: 'Valles Marineris', body: 'Mars', lat: -13.9, lon: -59.2, h: -4e3, view: 45e3, about: 'a canyon system 4,000 km long and up to 7 km deep' },
  { name: 'Gale Crater (Curiosity)', body: 'Mars', lat: -4.589, lon: 137.441, h: -4.5e3, view: 8e3, about: 'where NASA\'s Curiosity rover landed in 2012' },
  { name: 'Jezero Crater (Perseverance)', body: 'Mars', lat: 18.445, lon: 77.451, h: -2.6e3, view: 8e3, about: 'where NASA\'s Perseverance rover landed in 2021' },
  { name: 'Apollo 11 landing site', body: 'Moon', lat: 0.674, lon: 23.473, h: -1.9e3, view: 4e3, about: 'Tranquility Base, 20 July 1969' },
  { name: 'Tycho', body: 'Moon', lat: -43.31, lon: -11.36, h: -2e3, view: 70e3, about: 'a young crater 85 km across with bright rays' },
  { name: 'Copernicus', body: 'Moon', lat: 9.62, lon: -20.08, h: -3e3, view: 75e3, about: 'a 93 km crater with terraced walls and central peaks' },
  { name: 'Shackleton (lunar south pole)', body: 'Moon', lat: -89.67, lon: 129.78, h: -1e3, view: 30e3, about: 'a crater whose floor never sees the Sun, near the Artemis landing regions' },
  { name: 'Caloris Basin', body: 'Mercury', lat: 31.5, lon: 162.7, h: 0, view: 300e3, about: 'an impact basin 1,550 km across' },
  { name: 'Mount Everest', body: 'Earth', lat: 27.988, lon: 86.925, h: 8.8e3, view: 45e3, about: 'the highest mountain above sea level, 8,849 m, in the Himalaya' },
  { name: 'Grand Canyon', body: 'Earth', lat: 36.06, lon: -112.14, h: 2.1e3, view: 30e3, about: 'a canyon 446 km long and up to 1.8 km deep, cut by the Colorado River' },
  { name: 'Kilimanjaro', body: 'Earth', lat: -3.0674, lon: 37.3556, h: 5.9e3, view: 40e3, about: 'the highest mountain in Africa, 5,895 m, a dormant volcano' },
  { name: 'Matterhorn (Alps)', body: 'Earth', lat: 45.9763, lon: 7.6586, h: 4.5e3, view: 35e3, about: 'a 4,478 m peak of the Alps on the Swiss-Italian border' },
  { name: 'Mauna Kea (Hawaii)', body: 'Earth', lat: 19.8207, lon: -155.468, h: 4.2e3, view: 70e3, about: 'a volcano 4,207 m above the sea and over 10 km from its base on the ocean floor' },
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

  /** Direction (world) to view the place from: above it, on the side lit by the Sun at `sunWorld`. */
  approachDir(sunWorld: Vector3): Vector3 {
    const up = this.up();
    const side = sunWorld.clone().addScaledVector(up, -sunWorld.dot(up));
    return up.clone().multiplyScalar(0.6).addScaledVector(side.lengthSq() > 1e-6 ? side.normalize() : up, 0.8).normalize();
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
