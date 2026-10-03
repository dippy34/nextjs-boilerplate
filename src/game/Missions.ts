import { Vector3 } from 'three';
import { PC } from '../core/units';
import type { App } from '../app/App';
import { Body, type SpaceObject } from '../universe/Body';
import { Galaxy } from '../universe/Galaxies';
import { ExoPlanet } from '../universe/Planets';
import { Spacecraft } from '../universe/Spacecraft';
import { CatalogStar } from '../universe/Stars';
import { cameraBodyFixed } from '../render/TerrainPatch';

export interface Mission { id: string; title: string; detail: string; done: boolean }

interface Def { id: string; title: string; detail: string; check: (app: App, near: (o: SpaceObject | undefined | null, k: number) => boolean) => boolean }

const KEY = 'space-explorer-game';

/** Where the explorer is over a body: latitude and longitude (degrees, planetocentric) and altitude (m). */
function over(app: App, name: string): { lat: number; lon: number; alt: number } | null {
  const b = app.findByName(name);
  if (!(b instanceof Body)) return null;
  const bf = cameraBodyFixed(b.upos.sub(app.rig.upos, new Vector3()), b.orientation);
  const r = bf.length();
  return { lat: (Math.asin(bf.z / r) * 180) / Math.PI, lon: (Math.atan2(bf.y, bf.x) * 180) / Math.PI, alt: r - b.radius };
}
/** great-circle distance (degrees) between two latitude/longitude points */
function arc(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180;
  const c = Math.sin(lat1 * r) * Math.sin(lat2 * r) + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon1 - lon2) * r);
  return Math.acos(Math.max(-1, Math.min(1, c))) / r;
}

const DEFS: Def[] = [
  { id: 'moon', title: 'Fly to the Moon', detail: 'Get within 4 Moon radii', check: (a, near) => near(a.findByName('Moon'), 4) },
  { id: 'iss', title: 'Catch the ISS', detail: 'Within 1 km of the International Space Station', check: (a, near) => near(a.findByName('ISS'), 18) },
  { id: 'rings', title: "Skim Saturn's rings", detail: 'Within 2.3 radii of Saturn', check: (a, near) => near(a.findByName('Saturn'), 2.3) },
  { id: 'corona', title: "Touch the Sun's corona", detail: 'Within 3 solar radii', check: (a, near) => near(a.system.sun, 3) },
  { id: 'voyager', title: 'Find Voyager 1', detail: 'Within 1 km of the most distant spacecraft', check: (a, near) => near(a.findByName('Voyager 1'), 500) },
  { id: 'exo', title: 'Visit a world of another star', detail: 'Ride along with any exoplanet', check: (a) => a.rig.anchor instanceof ExoPlanet },
  { id: 'proxima', title: 'Reach the nearest exoplanet', detail: 'Proxima Centauri b', check: (a, near) => near(a.findByName('Proxima Cen b'), 6) },
  { id: 'hole', title: 'Face a black hole', detail: 'Within 60 Schwarzschild radii of any black hole', check: (a) => a.blackHoles.some((b) => b.upos.sub(a.rig.upos, new Vector3()).length() < b.radius * 60) },
  { id: 'outside', title: 'Leave the Milky Way', detail: '30,000 parsecs from the Sun', check: (a) => a.rig.upos.sub(a.system.sun.upos, new Vector3()).length() > 30000 * PC },
  { id: 'andromeda', title: 'Visit Andromeda', detail: 'Within 3 of its radii', check: (a, near) => near(a.findByName('Andromeda Galaxy'), 3) },
  { id: 'dock', title: 'Dock at a space station', detail: 'Ship mode: fly slowly into a station docking port', check: (a) => !!a.game?.docked },
  { id: 'land', title: 'Land on another world', detail: 'Ship mode: come down slowly onto any solid surface', check: (a) => !!a.game?.landed },
  { id: 'olympus', title: 'Fly over Olympus Mons', detail: 'Below 40 km over the tallest volcano known (Mars, 18.7° N 226° E)', check: (a) => {
    const o = over(a, 'Mars');
    return !!o && o.alt < 40e3 && arc(o.lat, o.lon, 18.65, -133.8) < 5;
  } },
  { id: 'southpole', title: "Land at the Moon's south pole", detail: 'Ship mode: touch down south of 80° S, where Artemis astronauts are headed', check: (a) => {
    const o = over(a, 'Moon');
    return !!o && a.game?.landed?.name === 'Moon' && o.lat < -80;
  } },
  { id: 'stars', title: 'Visit five stars', detail: 'Come close to five different stars', check: () => false },
  { id: 'log', title: 'Explorer', detail: 'Log 25 discoveries', check: () => false },
];

interface Saved { done: string[]; log: { name: string; kind: string; t: number }[]; stars: string[] }

/** Goals to fly to, and a log of every world, star, craft and galaxy visited (kept in the browser). */
export class Missions {
  private saved: Saved = { done: [], log: [], stars: [] };
  private timer = 0;
  onComplete: ((m: Mission) => void) | null = null;

  constructor(private app: App) {
    try {
      const s = localStorage.getItem(KEY);
      if (s) this.saved = { ...this.saved, ...JSON.parse(s) };
    } catch { /* private window: progress is not kept */ }
  }

  get list(): Mission[] {
    return DEFS.map((d) => ({ id: d.id, title: d.title, detail: d.detail, done: this.saved.done.includes(d.id) }));
  }

  get doneCount(): number { return this.saved.done.length; }
  get total(): number { return DEFS.length; }
  get log(): { name: string; kind: string; t: number }[] { return this.saved.log; }

  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.saved)); } catch { /* ignore */ }
  }

  /** Check goals and record discoveries (about once a second). */
  update(dt: number): void {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 1;
    const app = this.app;
    const near = (o: SpaceObject | undefined | null, k: number) => !!o && o.upos.sub(app.rig.upos, new Vector3()).length() < Math.max(o.radius, 1) * k;
    // discoveries: whatever the camera rides along with or is right next to
    const here: SpaceObject[] = [];
    const a = app.rig.anchor;
    if (a && (a instanceof Body || a instanceof ExoPlanet || a instanceof Spacecraft)) here.push(a);
    for (const s of app.near.stars) if (near(s, 30)) here.push(s);
    for (const b of app.blackHoles) if (near(b, 200)) here.push(b);
    if (app.selection instanceof Galaxy && near(app.selection, 4)) here.push(app.selection);
    let changed = false;
    for (const o of here) {
      if (!this.saved.log.some((e) => e.name === o.name)) {
        this.saved.log.unshift({ name: o.name, kind: o.kind, t: Date.now() });
        if (this.saved.log.length > 300) this.saved.log.pop();
        changed = true;
        app.hud.toast(`Discovered: ${o.name}`);
      }
      if (o instanceof CatalogStar && !this.saved.stars.includes(o.name)) { this.saved.stars.push(o.name); changed = true; }
    }
    for (const d of DEFS) {
      if (this.saved.done.includes(d.id)) continue;
      const ok = d.id === 'stars' ? this.saved.stars.length >= 5 : d.id === 'log' ? this.saved.log.length >= 25 : d.check(app, near);
      if (ok) {
        this.saved.done.push(d.id);
        changed = true;
        this.onComplete?.({ id: d.id, title: d.title, detail: d.detail, done: true });
      }
    }
    if (changed) this.save();
  }

  reset(): void {
    this.saved = { done: [], log: [], stars: [] };
    this.save();
  }
}

