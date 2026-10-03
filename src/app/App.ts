import { Quaternion, Vector3 } from 'three';
import { blackbodyRGB, irradianceToMag, luminance, magToIrradiance, sunIrradianceAt } from '../astro/photometry';
import { formatUtc, SimClock, utcToTdb, dateToJdUtc } from '../core/time';
import { AU, DAY, formatDistance, formatSpeed, PC, SUN_RADIUS } from '../core/units';
import { AtmospheresLayer, type AtmosphereData } from '../render/Atmospheres';
import { BlackHoleLayer } from '../render/BlackHoleLayer';
import { BodiesLayer } from '../render/Bodies';
import { ExoPlanetLayer, type ExoView } from '../render/ExoPlanetLayer';
import { GalaxyGlow } from '../render/GalaxyLayer';
import { JetsLayer } from '../render/Jets';
import { Labels, type LabelCandidate } from '../render/Labels';
import { NearStarsLayer } from '../render/NearStars';
import { OrbitsLayer } from '../render/Orbits';
import { ProceduralStarLayer } from '../render/ProceduralStarLayer';
import { Renderer, type ViewInfo } from '../render/Renderer';
import { GLOBALS, LITE, depthK } from '../render/shaders/xr';
import { SkyLayer } from '../render/Sky';
import { Comet, SmallBodiesLayer } from '../render/SmallBodies';
import { StarFieldLayer } from '../render/StarField';
import { TileDetail } from '../render/TileDetail';
import { type CraftView, SpacecraftLayer } from '../render/SpacecraftLayer';
import { GalaxiesLayer } from '../render/GalaxiesLayer';
import { Galaxy, loadGalaxies } from '../universe/Galaxies';
import { loadSpacecraft, Spacecraft } from '../universe/Spacecraft';
import { Hud } from '../ui/Hud';
import { BlackHole, loadBlackHoles } from '../universe/BlackHoles';
import { Body, type SpaceObject } from '../universe/Body';
import { GALAXY, glowColumn } from '../universe/Galaxy';
import { MilkyWay } from '../universe/MilkyWay';
import { ExoPlanet, type PlanetarySystem } from '../universe/Planets';
import { SolarSystem } from '../universe/SolarSystem';
import { StarCatalog } from '../universe/StarCatalog';
import { CatalogStar, NamedStars } from '../universe/Stars';
import { CameraRig } from './CameraRig';
import { Game } from '../game/Game';
import { TrafficShip } from '../game/Traffic';
import { Input } from './Input';
import { Systems } from './Systems';
import { VRSupport } from './VR';

const DATA = `${import.meta.env.BASE_URL}data`;
/** catalogue stars closer than this (pc) are drawn individually by the near-star layer */
const NEAR_STAR_RADIUS = 0.02;
/** black-hole companions closer than this (pc) are drawn by the near-star layer */
const COMPANION_RADIUS = 2;
/** black holes are labelled within this distance (pc) */
const BH_LABEL_PC = 400;
const RATE_STEPS = [1, 10, 60, 600, 3600, 21600, DAY, 7 * DAY, 30.4375 * DAY, 365.25 * DAY, 3652.5 * DAY, 36525 * DAY];

export class App {
  readonly renderer: Renderer;
  readonly input: Input;
  readonly hud: Hud;
  readonly labels: Labels;
  readonly rig = new CameraRig();
  readonly clock: SimClock;
  selection: SpaceObject | null = null;
  /** dark-adapted limiting magnitude for stars ("star brightness") */
  starMagLimit = 7.5;
  /** stars are never dimmed below this fraction of the dark-adapted exposure */
  starFloor = 0.15;
  private logExposure = 0;
  private logStarCap = 0;
  private lastTime = performance.now();
  private fps = 60;
  private hudTimer = 0;
  private nearTimer = 0;
  private nearestStarDist = Infinity;
  /** compile every shader before it is first needed (set again when VR changes tone mapping) */
  warmupPending = false;
  private fieldMinDistPc = 0;
  /** one object per catalogue star so selection, labels and near-star rendering agree */
  private starCache = new Map<string, CatalogStar>();
  private camPc = new Vector3();
  private invQuat = new Quaternion();
  /** geometry of the current view (desktop camera or the headset's left eye) */
  view: ViewInfo = { quat: new Quaternion(), fovY: 50, aspect: 1, width: 1, height: 1, pixelAngle: 1e-3, pixelRatio: 1, far: Infinity, xr: false };
  vr!: VRSupport;
  sky!: SkyLayer;
  atmospheres!: AtmospheresLayer;
  blackHoles: BlackHole[] = [];
  holes!: BlackHoleLayer;
  jets!: JetsLayer;
  /** the Milky Way's unresolved light (from the galaxy model) */
  galaxy!: GalaxyGlow;
  /** procedural stars filling the galaxy beyond the catalogues */
  procStars!: ProceduralStarLayer;
  readonly milkyWay = new MilkyWay();
  exo!: ExoPlanetLayer;
  /** game mode: ship, cockpit, warp, traffic, missions */
  game!: Game;
  /** other galaxies (SIMBAD) */
  galaxies!: GalaxiesLayer;
  /** real spacecraft (JPL Horizons trajectories) */
  craft!: SpacecraftLayer;
  /** close-up map tiles for the body being approached */
  tiles!: TileDetail;
  /** systems drawn this frame: those of the stars around the explorer, plus a selected/targeted one */
  private nearSystems: PlanetarySystem[] = [];
  activeSystems: PlanetarySystem[] = [];
  private camGal = new Vector3();
  private cssW = 1;
  private cssH = 1;
  private rateIndex = 0;
  private rateSign = 1;
  frameCount = 0;

  private constructor(
    canvas: HTMLCanvasElement,
    hudRoot: HTMLElement,
    labelRoot: HTMLElement,
    readonly system: SolarSystem,
    readonly catalogs: StarCatalog[],
    readonly named: NamedStars,
    readonly starFields: StarFieldLayer[],
    readonly bodies: BodiesLayer,
    readonly orbits: OrbitsLayer,
    readonly small: SmallBodiesLayer,
    readonly near: NearStarsLayer,
    renderer: Renderer,
    readonly systems: Systems,
  ) {
    this.renderer = renderer;
    this.input = new Input(canvas);
    this.hud = new Hud(hudRoot);
    this.labels = new Labels(labelRoot);
    this.clock = SimClock.now();
  }

  static async create(canvas: HTMLCanvasElement, hudRoot: HTMLElement, labelRoot: HTMLElement): Promise<App> {
    const xrCapable = await VRSupport.detect();
    const renderer = new Renderer(canvas, xrCapable);
    const useGaia = new URLSearchParams(location.search).get('gaia') !== '0';
    const systems = new Systems();
    const [system, catalog, gaia, named, manifest, rings, atmoData, blackHoles] = await Promise.all([
      SolarSystem.load(DATA),
      StarCatalog.load('athyg', `${DATA}/stars`),
      useGaia ? StarCatalog.load('gaia', `${DATA}/stars-gaia`) : Promise.resolve(null),
      NamedStars.load(`${DATA}/stars`),
      fetch(`${DATA}/textures/manifest.json`).then((r) => r.json()),
      fetch(`${DATA}/solar/rings.json`).then((r) => r.json()),
      fetch(`${DATA}/solar/atmospheres.json`).then((r) => r.json()) as Promise<AtmosphereData>,
      loadBlackHoles(DATA).catch((e) => { console.warn('black holes', e); return [] as BlackHole[]; }),
      systems.load(DATA).catch((e) => console.warn('exoplanets', e)),
    ]);
    // Titan's visible disk is the top of its haze: shade it with the measured albedo spectrum
    // (Karkoschka 1998) rather than the Cassini near-infrared surface map.
    const spectral = (manifest as { spectralColors?: Record<string, { linearRGB: [number, number, number]; visualAlbedo: number }> }).spectralColors;
    const titan = system.bodies.find((b) => b.name === 'Titan');
    if (titan && spectral?.titan) {
      const [r, g, bl] = spectral.titan.linearRGB;
      const m = Math.max(r, g, bl);
      titan.texture = null;
      titan.color = [r / m, g / m, bl / m];
      titan.albedo = spectral.titan.visualAlbedo;
      titan.meta.albedo = spectral.titan.visualAlbedo;
    }
    const catalogs = gaia ? [catalog, gaia] : [catalog];
    const starField = new StarFieldLayer(catalog);
    const starFields = [starField, ...catalogs.slice(1).map((c) => new StarFieldLayer(c, starField.psf))];
    const bodies = new BodiesLayer(system, manifest, `${DATA}/textures`, starField.psf, rings);
    const orbits = new OrbitsLayer(system);
    const small = new SmallBodiesLayer(system, starField.psf);
    const near = new NearStarsLayer(starField.psf, bodies.surfaceExposure);
    const app = new App(canvas, hudRoot, labelRoot, system, catalogs, named, starFields, bodies, orbits, small, near, renderer, systems);
    systems.indexNamed(named);
    const sc = blackbodyRGB(system.sun.teff);
    const sl = luminance(sc);
    const atmospheres = new AtmospheresLayer(system, atmoData, bodies.surfaceExposure, [sc[0] / sl, sc[1] / sl, sc[2] / sl]);
    bodies.atmosphere = (b) => atmospheres.spec(b);
    const sky = new SkyLayer(`${DATA}/sky/milkyway_4k.jpg`);
    app.sky = sky;
    app.atmospheres = atmospheres;
    app.blackHoles = blackHoles;
    app.holes = new BlackHoleLayer(blackHoles, bodies.surfaceExposure, renderer.depthMode === 'reversed-z');
    app.jets = new JetsLayer(blackHoles);
    app.galaxy = new GalaxyGlow();
    app.procStars = new ProceduralStarLayer(starField.psf, starField.colorLut);
    app.exo = new ExoPlanetLayer(starField.psf, bodies.surfaceExposure);
    app.tiles = new TileDetail(`${DATA}/tiles`, xrCapable);
    const earthBody = system.byId.get(399)!;
    const craft = await loadSpacecraft(DATA, system.sun, earthBody).catch((e) => { console.warn('spacecraft', e); return [] as Spacecraft[]; });
    app.craft = new SpacecraftLayer(craft, bodies.surfaceExposure, starField.psf);
    const galaxyList = await loadGalaxies(DATA).catch((e) => { console.warn('galaxies', e); return [] as Galaxy[]; });
    // M87's light is centred on its black hole
    const m87 = galaxyList.find((g) => g.name === 'M87'), m87bh = blackHoles.find((b) => b.name === 'M87*');
    if (m87 && m87bh) m87.upos.copy(m87bh.upos);
    app.galaxies = new GalaxiesLayer(galaxyList);
    if (new URLSearchParams(location.search).get('procedural') === '0') app.procStars.enabled = false;
    const mw = new URLSearchParams(location.search).get('mw');
    if (mw !== null) sky.brightness = Number(mw);
    renderer.scene.add(sky.mesh, bodies.group, atmospheres.group, orbits.group, small.group, near.group, app.holes.group, app.jets.group, app.procStars.group, app.exo.group, app.craft.group, app.galaxies.group, ...starFields.map((f) => f.group));
    await small.load(DATA);
    await system.ephemeris.request(app.clock.jdTdb);
    app.vr = new VRSupport(app, xrCapable, DATA);
    app.game = new Game(app);
    bodies.uploader = (t) => renderer.gl.initTexture(t);
    app.warmupPending = true;
    app.applyUrl();
    app.bindKeys();
    app.resize();
    window.addEventListener('resize', () => app.resize());
    return app;
  }

  // ------------------------------------------------------------------ setup
  private resize(): void {
    const c = this.renderer.canvas;
    this.cssW = c.clientWidth || window.innerWidth;
    this.cssH = c.clientHeight || window.innerHeight;
    this.renderer.setSize(this.cssW, this.cssH, Math.min(window.devicePixelRatio || 1, 2));
  }

  private applyUrl(): void {
    const q = new URLSearchParams(location.search);
    const t = q.get('time');
    if (t) {
      const d = new Date(t);
      if (!Number.isNaN(d.getTime())) this.clock.jdTdb = utcToTdb(dateToJdUtc(d));
    }
    if (q.get('rate')) this.clock.rate = Number(q.get('rate'));
    if (q.get('paused') === '1') this.clock.paused = true;
    if (q.get('fov')) this.rig.fov = Number(q.get('fov'));
    if (q.get('starlimit')) this.starMagLimit = Number(q.get('starlimit'));
    if (q.get('belt')) this.small.boost = Number(q.get('belt'));
    this.system.update(this.clock.jdTdb);
    const camPc = q.get('campc');
    const target = q.get('target');
    const look = q.get('look');
    if (camPc) {
      const [x, y, z] = camPc.split(',').map(Number);
      this.rig.upos.set(x * PC, y * PC, z * PC);
      this.rig.lookAt(new Vector3(-x, -y, -z).normalize());
    } else if (target) {
      const obj = this.findByName(target);
      if (obj) {
        const dist = Number(q.get('dist') ?? 4) * Math.max(obj.radius, 1);
        this.placeNear(obj, dist, Number(q.get('az') ?? 35), Number(q.get('el') ?? 15));
        if (obj instanceof Galaxy && !q.get('el')) {
          const dir = obj.viewDir(this.rig.upos.sub(obj.upos, new Vector3()));
          this.rig.upos.copy(obj.upos).addVec(dir, dist);
          this.rig.lookAt(dir.clone().negate(), obj.major);
        }
        if (obj instanceof BlackHole && !q.get('el')) {
          // the view the autopilot arrives at: just above the disk plane
          const dir = obj.approachDir(this.rig.upos.sub(obj.upos, new Vector3()));
          this.rig.upos.copy(obj.upos).addVec(dir, dist);
          this.rig.lookAt(dir.clone().negate(), obj.diskNormal);
        }
        this.select(obj);
      }
    } else {
      const earth = this.system.byId.get(399)!;
      this.placeNear(earth, 3.4 * earth.radius, 35, 12);
      this.select(earth);
    }
    if (look) {
      const obj = this.findByName(look);
      if (obj) this.rig.lookAt(obj.upos.sub(this.rig.upos, new Vector3()).normalize());
    }
    const ship = q.get('ship');
    if (ship === 'cockpit' || ship === 'chase') this.game.setMode(ship);
  }

  /** Put the camera at `dist` from `obj`, `az` degrees around from the sunward direction, looking at it. */
  placeNear(obj: SpaceObject, dist: number, az = 35, el = 15): void {
    // lit side: towards the Sun, or towards its own star for a planet of another star
    const light = obj instanceof ExoPlanet ? obj.system.host.upos : this.system.sun.upos;
    const sunDir = light.sub(obj.upos, new Vector3());
    if (sunDir.lengthSq() < 1) sunDir.set(1, 0, 0);
    sunDir.normalize();
    const north = new Vector3(0, 0, 1);
    const axis = new Vector3().crossVectors(sunDir, north).normalize();
    const dir = sunDir.clone().applyAxisAngle(north, (az * Math.PI) / 180).applyAxisAngle(axis, (el * Math.PI) / 180);
    this.rig.upos.copy(obj.upos).addVec(dir, dist);
    this.rig.lookAt(dir.clone().negate(), north);
    this.rig.setAnchor(obj instanceof Body || obj instanceof Comet || obj instanceof ExoPlanet || obj instanceof Spacecraft || this.isCompanion(obj) ? obj : null);
  }

  /** true for the companion star of a black hole (it moves on its orbit). */
  isCompanion(obj: SpaceObject | null): boolean {
    return !!obj && this.blackHoles.some((b) => b.companion === obj);
  }

  private bindKeys(): void {
    this.input.onClick = (x, y) => {
      const hit = this.pick(x, y);
      this.select(hit);
    };
    this.input.onDoubleClick = (x, y) => {
      const hit = this.pick(x, y);
      if (hit) { this.select(hit); this.goTo(hit); }
    };
    this.hud.onSearch = (q) => this.searchItems(q);
    this.hud.onSearchPick = (id) => {
      const obj = this.resolveSearchId(id);
      if (obj) { this.select(obj); this.goTo(obj); }
    };
    this.input.onKey = (e) => {
      if (this.game?.active) this.game.audio.start();
      if (this.hud.searchOpen) return;
      switch (e.code) {
        case 'Space': this.togglePause(); e.preventDefault(); break;
        case 'BracketRight': this.timeFaster(); break;
        case 'BracketLeft': this.timeSlower(); break;
        case 'Backslash': this.timeReverse(); break;
        case 'Backspace': this.realTime(); e.preventDefault(); break;
        case 'KeyG': if (this.selection) this.goTo(this.selection); break;
        case 'KeyC': if (this.selection) this.center(this.selection); break;
        case 'KeyL': this.labels.enabled = !this.labels.enabled; this.hud.toast(`Labels ${this.labels.enabled ? 'on' : 'off'}`); break;
        case 'KeyO': this.orbits.enabled = !this.orbits.enabled; this.hud.toast(`Orbits ${this.orbits.enabled ? 'on' : 'off'}`); break;
        case 'KeyM': this.orbits.showMinor = !this.orbits.showMinor; this.hud.toast(`Minor-body orbits ${this.orbits.showMinor ? 'on' : 'off'}`); break;
        case 'KeyH': case 'F1': this.hud.toggleHelp(); e.preventDefault(); break;
        case 'KeyP': this.screenshot(); break;
        case 'Enter': case 'Slash': this.hud.openSearch(); e.preventDefault(); break;
        case 'Equal': case 'NumpadAdd': this.rig.speedFactor *= 2; break;
        case 'Minus': case 'NumpadSubtract': this.rig.speedFactor /= 2; break;
        case 'Escape': this.cancelOrDeselect(); break;
        case 'KeyV': this.game.cycle(); break;
        case 'KeyJ': this.game.warp(); break;
        case 'KeyN': this.game.audio.setEnabled(!this.game.audio.enabled); this.hud.toast(`Sound ${this.game.audio.enabled ? 'on' : 'off'}`); break;
        case 'KeyK': this.showMissions(); break;
        default:
          if (/^Digit\d$/.test(e.code)) {
            const ids = [10, 199, 299, 399, 499, 599, 699, 799, 899, 999];
            const b = this.system.byId.get(ids[Number(e.code.slice(5))]);
            if (b) { this.select(b); this.goTo(b); }
          }
      }
    };
  }

  // ------------------------------------------------------------------ actions
  togglePause(): void {
    this.clock.paused = !this.clock.paused;
  }
  timeFaster(): void {
    this.rateIndex = Math.min(RATE_STEPS.length - 1, this.rateIndex + 1);
    this.clock.rate = this.rateSign * RATE_STEPS[this.rateIndex];
    this.clock.paused = false;
  }
  timeSlower(): void {
    this.rateIndex = Math.max(0, this.rateIndex - 1);
    this.clock.rate = this.rateSign * RATE_STEPS[this.rateIndex];
  }
  timeReverse(): void {
    this.rateSign *= -1;
    this.clock.rate = this.rateSign * RATE_STEPS[this.rateIndex];
    this.hud.toast(this.rateSign < 0 ? 'Time reversed' : 'Time forward');
  }
  realTime(): void {
    this.clock.setUtcNow();
    this.rateIndex = 0;
    this.rateSign = 1;
    this.clock.rate = 1;
    this.clock.paused = false;
    this.hud.toast('Real time');
  }
  /** K: missions and recent discoveries. */
  showMissions(): void {
    const m = this.game.missions;
    const lines = m.list.map((x) => `${x.done ? '✔' : '○'} ${x.title}`).join('\n');
    const recent = m.log.slice(0, 5).map((e) => e.name).join(', ');
    this.hud.toast(`Missions ${m.doneCount}/${m.total}\n${lines}${recent ? `\nRecently discovered: ${recent}` : ''}`, 9);
  }

  cancelOrDeselect(): void {
    if (this.rig.autopilot) this.rig.cancelGoto();
    else this.select(null);
  }
  /** Human-readable time rate. */
  rateText(): string {
    const r = Math.abs(this.clock.rate);
    const t = r === 1 ? 'real time' : r < 60 ? `${r}×` : r < 3600 ? `${(r / 60).toFixed(0)} min/s` : r < DAY ? `${(r / 3600).toFixed(0)} h/s`
      : r < 365.25 * DAY ? `${(r / DAY).toFixed(r < 7 * DAY ? 0 : 1)} d/s` : `${(r / (365.25 * DAY)).toFixed(0)} yr/s`;
    return `${this.clock.rate < 0 ? '◀ ' : ''}${t}`;
  }

  select(obj: SpaceObject | null): void {
    this.selection = obj;
    this.rig.target = obj;
    this.orbits.selected = obj instanceof Body ? obj : null;
    if (obj instanceof CatalogStar) obj.resolve(this.named, () => undefined);
  }

  /**
   * Compile every material the scene can need (planets, rings, stars, glare, all atmospheres) up
   * front, so a shader is never compiled mid-flight. Runs inside a frame so the headset's variant
   * is compiled while presenting.
   */
  private warmUp(): void {
    const objs = [...this.bodies.warmupObjects(), ...this.atmospheres.warmupObjects(), ...this.holes.warmupObjects(), ...this.near.warmupObjects(), ...this.exo.warmupObjects(), ...this.craft.warmupObjects(), ...this.game.warmupObjects()];
    const was = objs.map((o) => o.visible);
    for (const o of objs) o.visible = true;
    void this.renderer.gl.compileAsync(this.renderer.scene, this.renderer.camera).catch(() => undefined);
    this.galaxy.compile(this.renderer.gl);
    objs.forEach((o, i) => { o.visible = was[i]; });
  }

  goTo(obj: SpaceObject): void {
    if (obj instanceof Body) this.bodies.prefetch(obj);
    if (obj instanceof BlackHole) {
      this.rig.flyTo(obj, obj.radius * 30, undefined, true, obj.approachDir(this.rig.upos.sub(obj.upos, new Vector3())));
      this.hud.toast(`Going to ${obj.name}`);
      return;
    }
    if (obj instanceof MilkyWay) {
      this.rig.flyTo(obj, obj.radius * 2.6, undefined, true, obj.viewDir());
      this.hud.toast('Leaving the galaxy');
      return;
    }
    if (obj instanceof Galaxy) {
      this.rig.flyTo(obj, obj.radius * 2.4, undefined, true, obj.viewDir(this.rig.upos.sub(obj.upos, new Vector3())));
      this.hud.toast(`Going to ${obj.name}`);
      return;
    }
    let d: number;
    if (obj instanceof Body) d = obj.kind === 'star' ? obj.radius * 8 : Math.max(obj.radius * 3.5, 2e3);
    else if (obj instanceof ExoPlanet) d = obj.radius * 3.5;
    else if (obj instanceof Spacecraft) d = Math.max(obj.radius * 5, 10);
    else if (obj instanceof TrafficShip) d = obj.radius * 6;
    else if (obj instanceof CatalogStar) d = Math.max(obj.radius * 4.5, 2e7);
    else if (obj instanceof Comet) d = obj.radius > 0 ? obj.radius * 60 : 2e7;
    else d = Math.max(obj.radius * 4, 1e6);
    this.rig.flyTo(obj, d);
    this.hud.toast(`Going to ${obj.name}`);
  }

  center(obj: SpaceObject): void {
    const dir = obj.upos.sub(this.rig.upos, new Vector3()).normalize();
    this.rig.lookAt(dir);
  }

  screenshot(): void {
    const a = document.createElement('a');
    a.href = this.renderer.screenshot();
    a.download = `space-explorer-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    a.click();
    this.hud.toast('Screenshot saved');
  }

  findByName(name: string): SpaceObject | null {
    const n = name.toLowerCase();
    const b = this.system.bodies.find((x) => x.name.toLowerCase() === n);
    if (b) return b;
    const gx = this.galaxies.galaxies.find((g) => g.name.toLowerCase() === n || g.data.simbad.toLowerCase().replace(/\s+/g, '') === n.replace(/\s+/g, '') || (n === 'andromeda' && g.name.startsWith('Andromeda')));
    if (gx) return gx;
    const sc = this.craft.craft.find((c) => c.name.toLowerCase() === n || (n === 'iss' && c.name.startsWith('International')) || (n === 'jwst' && c.name.startsWith('James')) || (n === 'hubble' && c.name.startsWith('Hubble')));
    if (sc) { sc.update(this.clock.jdTdb); return sc; }
    const c = this.small.cometObjects.find((x) => x.name.toLowerCase().includes(n));
    if (c) return c;
    const h = this.blackHoles.find((x) => x.name.toLowerCase() === n || x.data.aliases.some((a) => a.toLowerCase() === n));
    if (h) return h;
    const ps = this.procStars.find(name);
    if (ps) return ps;
    if (n === 'milky way' || n === 'galaxy' || n === 'the galaxy') return this.milkyWay;
    const xp = this.systems.findPlanet(name);
    if (xp) return this.exoPlanet(xp.i, xp.k);
    const s = this.named.list.find((x) => x.names.some((nm) => nm.toLowerCase() === n));
    if (s) return this.getStar(this.catalog, s.node, s.slot);
    const xh = this.systems.findHost(name);
    if (xh !== null) return this.exoHost(xh);
    // a generated planet: "<star> <letter>"
    const m = /^(.+)\s([b-k])$/i.exec(name.trim());
    if (m) {
      const host = this.findByName(m[1]);
      const sys = host instanceof CatalogStar ? this.systems.of(host) : null;
      const pl = sys?.planets.find((p) => p.name.toLowerCase() === n);
      if (sys && pl) { sys.update(this.clock.jdTdb); return pl; }
    }
    return null;
  }

  searchItems(q: string): { label: string; detail: string; id: string }[] {
    const n = q.toLowerCase();
    const out: { label: string; detail: string; id: string; score: number }[] = [];
    const score = (name: string) => {
      const l = name.toLowerCase();
      if (l === n) return 0;
      if (l.startsWith(n)) return 1 + l.length / 100;
      if (l.includes(n)) return 2 + l.length / 100;
      return -1;
    };
    for (const b of this.system.bodies) {
      const s = score(b.name);
      if (s >= 0) out.push({ label: b.name, detail: b.kind === 'moon' ? `moon of ${b.parent?.name}` : b.kind, id: `body:${b.id}`, score: s - (b.kind === 'planet' ? 0.5 : 0) });
    }
    this.small.cometObjects.forEach((c, i) => {
      const s = score(c.name);
      if (s >= 0) out.push({ label: c.name, detail: 'comet', id: `comet:${i}`, score: s + 0.2 });
    });
    {
      const s = Math.min(...['Milky Way', 'galaxy'].map(score).filter((x) => x >= 0));
      if (Number.isFinite(s)) out.push({ label: 'Milky Way', detail: 'our galaxy, seen from outside', id: 'mw:0', score: s - 0.2 });
    }
    this.blackHoles.forEach((h, i) => {
      const names = [h.name, ...h.data.aliases, 'black hole'];
      const best = Math.min(...names.map(score).filter((x) => x >= 0));
      if (Number.isFinite(best)) out.push({ label: h.name, detail: h.supermassive ? 'supermassive black hole' : 'black hole', id: `bh:${i}`, score: best - 0.1 });
      if (h.companion && score(h.companion.name) >= 0) out.push({ label: h.companion.name, detail: 'star orbiting a black hole', id: `bhc:${i}`, score: score(h.companion.name) + 0.3 });
    });
    for (const st of this.named.list) {
      let best = -1;
      for (const nm of st.names) {
        const s = score(nm);
        if (s >= 0 && (best < 0 || s < best)) best = s;
      }
      if (best >= 0) out.push({ label: st.names[0], detail: `star · ${st.names.slice(1, 3).join(', ')}`, id: `star:${st.index}`, score: best + (st.proper ? 0 : 0.3) });
    }
    out.push(...this.systems.search(q, score));
    this.galaxies.galaxies.forEach((g, i) => {
      const sc = Math.min(...[g.name, g.data.simbad, g.data.simbad.replace(/\s+/g, ''), 'galaxy'].map(score).filter((x) => x >= 0));
      if (Number.isFinite(sc)) out.push({ label: g.name, detail: `galaxy · ${((g.data.distPc * 3.2616) / 1e6).toFixed(g.data.distPc < 3e5 ? 2 : 1)} million ly`, id: `gx:${i}`, score: sc + (g.name === 'Milky Way' ? 0 : 0.05) });
    });
    this.craft.craft.forEach((c, i) => {
      const sc = Math.min(...[c.name, 'spacecraft', 'probe'].map(score).filter((x) => x >= 0));
      if (Number.isFinite(sc)) out.push({ label: c.name, detail: 'spacecraft', id: `sc:${i}`, score: sc - 0.1 });
    });
    out.sort((a, b) => a.score - b.score);
    return out.slice(0, 14);
  }

  resolveSearchId(id: string): SpaceObject | null {
    const [kind, v] = id.split(':');
    if (kind === 'body') return this.system.byId.get(Number(v)) ?? null;
    if (kind === 'comet') return this.small.cometObjects[Number(v)] ?? null;
    if (kind === 'bh') return this.blackHoles[Number(v)] ?? null;
    if (kind === 'mw') return this.milkyWay;
    if (kind === 'bhc') return this.blackHoles[Number(v)]?.companion ?? null;
    if (kind === 'star') { const st = this.named.list[Number(v)]; return this.getStar(this.catalog, st.node, st.slot); }
    if (kind === 'xh') return this.exoHost(Number(v));
    if (kind === 'sc') return this.craft.craft[Number(v)] ?? null;
    if (kind === 'gx') return this.galaxies.galaxies[Number(v)] ?? null;
    if (kind === 'xp') return this.exoPlanet(Number(v), Number(id.split(':')[2]));
    return null;
  }

  /** The star of confirmed-planet system `i`: the catalogue's copy when the archive names one, else built from the archive. */
  exoHost(i: number): CatalogStar {
    const ni = this.systems.namedHost(i);
    if (ni !== null) {
      const st = this.named.list[ni];
      const cs = this.getStar(this.catalog, st.node, st.slot);
      this.systems.claim(cs, i);
      return cs;
    }
    return this.systems.hostStar(i);
  }

  /** Planet `k` of confirmed-planet system `i` (its system becomes active so it moves and is drawn). */
  exoPlanet(i: number, k: number): ExoPlanet | null {
    const sys = this.systems.of(this.exoHost(i));
    if (!sys) return null;
    const name = this.systems.planetName(i, k);
    const pl = sys.planets.find((p) => p.name === name) ?? sys.planets[k] ?? null;
    if (pl) sys.update(this.clock.jdTdb);
    return pl;
  }

  // ------------------------------------------------------------------ per-frame helpers
  /** camera-relative vector -> CSS pixel coordinates; null if behind the camera */
  project(rel: Vector3): { x: number; y: number } | null {
    const v = rel.clone().applyQuaternion(this.invQuat);
    if (v.z >= 0) return null;
    const t = Math.tan((this.view.fovY * Math.PI) / 360);
    const aspect = this.view.aspect;
    const nx = v.x / -v.z / (t * aspect);
    const ny = v.y / -v.z / t;
    return { x: (nx * 0.5 + 0.5) * this.view.width, y: (-ny * 0.5 + 0.5) * this.view.height };
  }

  private chooseAnchor(): void {
    let best: Body | null = null;
    let bestSoi = Infinity;
    const rel = new Vector3();
    for (const b of this.system.bodies) {
      if (!b.valid) continue;
      const soi = b.soiRadius();
      if (soi >= bestSoi) continue;
      const d = b.upos.sub(this.rig.upos, rel).length();
      if (d < soi) { best = b; bestSoi = soi; }
    }
    // close to a ship (game mode) or a spacecraft: ride along with it
    for (const sh of this.game.traffic.ships) {
      if (sh.upos.sub(this.rig.upos, rel).length() < sh.radius * 300) { this.rig.setAnchor(sh); return; }
    }
    for (const cv of this.craft.views) {
      if (cv.dist < Math.max(300 * cv.craft.radius, 2000)) { this.rig.setAnchor(cv.craft); return; }
    }
    // an exoplanet whose Hill sphere we are in (planets of other stars carry the camera along)
    if (!best) {
      let bestExo: ExoPlanet | null = null;
      let bestD = Infinity;
      for (const ev of this.exo.views) {
        if (ev.dist < ev.planet.hill && ev.dist < bestD) { bestExo = ev.planet; bestD = ev.dist; }
      }
      if (bestExo) { this.rig.setAnchor(bestExo); return; }
    }
    const sel = this.selection;
    if (sel instanceof Comet) {
      const d = sel.upos.sub(this.rig.upos, rel).length();
      if (d < 1e9) { this.rig.setAnchor(sel); return; }
    }
    if (sel && this.isCompanion(sel) && sel.upos.sub(this.rig.upos, rel).length() < sel.radius * 60) {
      this.rig.setAnchor(sel);
      return;
    }
    this.rig.setAnchor(best);
  }

  private computeAltitude(): number {
    let alt = Infinity;
    const rel = new Vector3();
    for (const b of this.system.bodies) {
      if (!b.valid) continue;
      const d = b.upos.sub(this.rig.upos, rel).length() - b.radius;
      if (d < alt) alt = d;
    }
    if (this.selection instanceof Comet) alt = Math.min(alt, this.selection.upos.sub(this.rig.upos, rel).length() - this.selection.radius);
    alt = Math.min(alt, this.nearestStarDist);
    for (const ev of this.exo.views) alt = Math.min(alt, ev.dist - ev.planet.radius);
    for (const cv of this.craft.views) alt = Math.min(alt, cv.dist - cv.craft.radius);
    for (const h of this.blackHoles) {
      alt = Math.min(alt, h.upos.sub(this.rig.upos, rel).length() - h.radius);
      if (h.companion) alt = Math.min(alt, h.companion.upos.sub(this.rig.upos, rel).length() - h.companion.radius);
    }
    return Math.max(alt, 0.5);
  }

  /** Registry of selectable catalogue stars, keyed by octree node and slot. */
  get catalog(): StarCatalog {
    return this.catalogs[0];
  }

  getStar(cat: StarCatalog, node: number, slot: number): CatalogStar {
    const key = `star:${cat.id}:${node}:${slot}`;
    let cs = this.starCache.get(key);
    const n = cat.nodes[node];
    // named stars belong to the primary (AT-HYG) catalogue
    const nm = cat === this.catalog ? this.named.byNodeSlot.get(`${node}:${slot}`) : undefined;
    if (!cs) {
      const ref = { catalog: cat, node: n, slot };
      if (n.state === 'ready') {
        cs = new CatalogStar(key, cat.starPosition(ref), cat.starAbsMag(ref), nm?.teff ?? cat.starTeff(ref), nm?.spect ?? '', nm?.names ?? [], ref);
        cs.exact = true;
      } else {
        cs = new CatalogStar(key, nm!.pos.clone(), nm!.absMag, nm!.teff, nm!.spect, nm!.names, ref);
      }
      if (!nm) cs.resolve(this.named, () => undefined);
      this.starCache.set(key, cs);
    } else if (!cs.exact && n.state === 'ready') {
      cs.setPosition(cat.starPosition({ catalog: cat, node: n, slot }));
      cs.exact = true;
    }
    return cs;
  }

  private updateNearStars(): void {
    // Nearest catalogue stars (for speed control and individual rendering)
    let nearestNamed = Infinity;
    for (const s of this.named.list) {
      const d = s.pos.distanceTo(this.camPc);
      if (d < nearestNamed) nearestNamed = d;
    }
    const near = this.catalogs
      .flatMap((c) => c.nearest(this.camPc, Math.max(NEAR_STAR_RADIUS, Math.min(1, nearestNamed)), 12))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 12);
    const nearestCat = near.length ? near[0].dist : Infinity;
    // Lower bound on the distance of any star the star field draws (half, for motion between updates)
    const searchR = Math.max(NEAR_STAR_RADIUS, Math.min(1, nearestNamed));
    const beyond = near.find((x) => x.dist > NEAR_STAR_RADIUS);
    const bound = beyond ? beyond.dist : near.length < 12 ? searchR : NEAR_STAR_RADIUS;
    this.fieldMinDistPc = Math.min(bound, nearestNamed > NEAR_STAR_RADIUS ? nearestNamed : bound) * 0.5;
    this.nearestStarDist = Math.min(nearestNamed, nearestCat) * PC;
    const list: CatalogStar[] = [];
    for (const { ref, dist } of near) {
      if (dist > NEAR_STAR_RADIUS) break;
      const cs = this.getStar(ref.catalog, ref.node.id, ref.slot);
      list.push(cs);
      // nearest star surface distance
      this.nearestStarDist = Math.min(this.nearestStarDist, dist * PC - cs.radius);
    }
    for (const h of this.blackHoles) {
      if (h.companion && h.companion.upos.sub(this.rig.upos, new Vector3()).length() < COMPANION_RADIUS * PC) list.push(h.companion);
    }
    for (const { star, dist } of this.procStars.nearest(this.camPc, 1, 12)) {
      this.nearestStarDist = Math.min(this.nearestStarDist, dist * PC - star.radius);
      if (dist < NEAR_STAR_RADIUS) list.push(star);
    }
    // planetary systems of the stars around us; claim archive systems for their catalogue stars
    const systems: PlanetarySystem[] = [];
    for (const st of list) {
      if (this.isCompanion(st)) continue;
      const sys = this.systems.of(st);
      if (sys) systems.push(sys);
    }
    // confirmed-planet hosts the catalogues lack (or know only under another name)
    const tmp = new Vector3();
    for (const i of this.systems.hostsNear(this.camPc, NEAR_STAR_RADIUS)) {
      const h = this.systems.hostStar(i);
      const claimedBy = this.systems.claimedBy(i);
      if (claimedBy && list.some((x) => x.key === claimedBy)) continue;
      // the same star from a catalogue: same place (within catalogue distance errors) and brightness
      const twin = list.find((x) => !this.isCompanion(x) && x.upos.sub(h.upos, tmp).length() < 0.03 * PC && Math.abs(x.absMag - h.absMag) < 1.5);
      if (twin) {
        this.systems.claim(twin, i);
        const at = systems.findIndex((y) => y.host === twin);
        const sys = this.systems.of(twin);
        if (at >= 0) systems.splice(at, 1);
        if (sys) systems.push(sys);
        continue;
      }
      list.push(h);
      this.nearestStarDist = Math.min(this.nearestStarDist, h.upos.sub(this.rig.upos, tmp).length() - h.radius);
      const sys = this.systems.of(h);
      if (sys) systems.push(sys);
    }
    this.near.stars = list;
    this.nearSystems = systems;
  }

  /** A planet is labelled/pickable once resolved, or while the explorer is inside its system. */
  private exoShown(ev: ExoView): boolean {
    if (ev.pixelRadius >= 0.8 || ev.planet === this.selection) return true;
    const host = ev.planet.system.host;
    const dHost = host.upos.sub(this.rig.upos, new Vector3()).length();
    return dHost < Math.max(400 * AU, ev.planet.spec.aM * 25);
  }

  /** Spacecraft are labelled/pickable once resolved, when selected, or when near enough to find. */
  private craftShown(cv: CraftView): boolean {
    if (cv.pixelRadius > 0.5 || cv.craft === this.selection) return true;
    const reach = cv.craft.isOrbiter ? 3e7 : cv.craft.parentObject ? 5e9 : 0.3 * AU;
    return cv.dist < reach;
  }

  /** Systems to draw: the stars' around us, plus those of a selected or targeted planet or host. */
  private updateActiveSystems(): void {
    const act = [...this.nearSystems];
    for (const o of [this.selection, this.rig.target]) {
      let sys: PlanetarySystem | null = null;
      if (o instanceof ExoPlanet) sys = o.system;
      else if (o instanceof CatalogStar && !this.isCompanion(o) && o.upos.sub(this.rig.upos, new Vector3()).length() < 0.5 * PC) sys = this.systems.of(o);
      if (sys && !act.includes(sys)) act.push(sys);
    }
    this.activeSystems = act;
  }

  private updateExposure(dt: number): { xStar: number; xSurf: number; mLim: number; xDark: number } {
    const pixSA = (this.view.pixelAngle * this.view.pixelRatio) ** 2; // per CSS pixel
    const xDark = (0.01 * pixSA) / magToIrradiance(this.starMagLimit);
    let wBest = 0;
    let lBest = 1;
    // display level the eye settles a view-filling disk at: mid-grey for a lit surface, bright for
    // a self-luminous one (a star's or an accretion disk's)
    let keyBest = 0.45;
    const screen = this.view.width * this.view.height;
    for (const v of this.bodies.views.values()) {
      if (!v.resolved || v.pixelRadius < 2) continue;
      const p = this.project(v.rel);
      if (!p) continue;
      const pr = v.pixelRadius / this.view.pixelRatio;
      if (p.x < -pr || p.y < -pr || p.x > this.view.width + pr || p.y > this.view.height + pr) continue;
      const coverage = Math.min(1, (Math.PI * pr * pr) / screen);
      const w = smoothstep(0.0015, 0.08, coverage);
      if (w <= wBest) continue;
      const b = v.body;
      const L = b.kind === 'star'
        ? (AU / SUN_RADIUS) ** 2
        : (Math.min(1, 1.5 * b.albedo) * sunIrradianceAt(Math.max(b.pos.distanceTo(this.system.sun.pos), 1))) / Math.PI;
      wBest = w;
      lBest = L;
      keyBest = b.kind === 'star' ? 1.1 : 0.45;
    }
    for (const cv of this.craft.views) {
      if (cv.pixelRadius < 2) continue;
      const p = this.project(cv.rel);
      const pr = cv.pixelRadius / this.view.pixelRatio;
      if (!p || p.x < -pr || p.y < -pr || p.x > this.view.width + pr || p.y > this.view.height + pr) continue;
      const w = smoothstep(0.0015, 0.08, Math.min(1, (Math.PI * pr * pr) / screen));
      const L = (0.6 * sunIrradianceAt(Math.max(cv.craft.upos.sub(this.system.sun.upos, new Vector3()).length(), 1))) / Math.PI;
      if (w > wBest) { wBest = w; lBest = L; keyBest = 0.45; }
    }
    for (const ev of this.exo.views) {
      if (ev.pixelRadius < 2) continue;
      const p = this.project(ev.rel);
      const pr = ev.pixelRadius / this.view.pixelRatio;
      if (!p || p.x < -pr || p.y < -pr || p.x > this.view.width + pr || p.y > this.view.height + pr) continue;
      const w = smoothstep(0.0015, 0.08, Math.min(1, (Math.PI * pr * pr) / screen));
      if (w > wBest && ev.radiance > 0) { wBest = w; lBest = ev.radiance; keyBest = 0.45; }
    }
    for (const hv of this.holes.views) {
      if (!hv.diskRadiance) continue;
      const p = this.project(hv.rel);
      const pr = hv.innerDiskPx / this.view.pixelRatio;
      if (!p || p.x < -pr || p.y < -pr || p.x > this.view.width + pr || p.y > this.view.height + pr) continue;
      const w = smoothstep(0.0015, 0.08, Math.min(1, (Math.PI * pr * pr) / screen));
      if (w > wBest) { wBest = w; lBest = hv.diskRadiance; keyBest = 0.8; }
    }
    for (const s of this.near.stars) {
      const rel = s.upos.sub(this.rig.upos, new Vector3());
      const d = rel.length();
      const pr = Math.asin(Math.min(1, s.radius / d)) / this.view.pixelAngle / this.view.pixelRatio;
      const coverage = Math.min(1, (Math.PI * pr * pr) / screen);
      const w = smoothstep(0.0015, 0.08, coverage);
      if (w > wBest && this.project(rel)) {
        wBest = w;
        lBest = (magToIrradiance(s.absMag + 5 * Math.log10(d / PC) - 5) * d * d) / (Math.PI * s.radius * s.radius);
        keyBest = 1.1;
      }
    }
    const lx = Math.log(xDark);
    let target = wBest > 0 ? Math.min(lx, lx + (Math.log(keyBest / lBest) - lx) * wBest) : lx;
    // Eye adaptation to the brightest resolved disk in view: a planet disk should stay below ~1.6
    // (bright but not washed out) and only limits surface exposure; a resolved star disk dims everything.
    let diskCap = Infinity;
    let lightCap = Infinity;
    const margin = 40;
    const onScreen = (rel: Vector3) => {
      const p = this.project(rel);
      return !!p && p.x > -margin && p.y > -margin && p.x < this.view.width + margin && p.y < this.view.height + margin;
    };
    for (const v of this.bodies.views.values()) {
      if (!v.resolved || v.pixelRadius <= 1.5 || !onScreen(v.rel)) continue;
      const b = v.body;
      if (b.kind === 'star') lightCap = Math.min(lightCap, 1.8 / (AU / SUN_RADIUS) ** 2);
      else diskCap = Math.min(diskCap, 1.6 / ((Math.min(1, 1.5 * b.albedo) * sunIrradianceAt(Math.max(b.pos.distanceTo(this.system.sun.pos), 1))) / Math.PI));
    }
    for (const cv of this.craft.views) {
      if (cv.pixelRadius <= 1.5 || !onScreen(cv.rel)) continue;
      diskCap = Math.min(diskCap, 1.6 / ((0.6 * sunIrradianceAt(Math.max(cv.craft.upos.sub(this.system.sun.upos, new Vector3()).length(), 1))) / Math.PI));
    }
    for (const ev of this.exo.views) {
      if (ev.pixelRadius <= 1.5 || ev.radiance <= 0 || !onScreen(ev.rel)) continue;
      diskCap = Math.min(diskCap, 1.6 / ev.radiance);
    }
    for (const hv of this.holes.views) {
      // a hot inner disk only takes over the eye's adaptation once it covers part of the view
      if (!hv.diskRadiance || hv.innerDiskPx <= 1.5 || !onScreen(hv.rel)) continue;
      const pr = hv.innerDiskPx / this.view.pixelRatio;
      const w = smoothstep(0.0015, 0.08, Math.min(1, (Math.PI * pr * pr) / screen));
      diskCap = Math.min(diskCap, 2 / (hv.diskRadiance * Math.max(w, 1e-6)));
    }
    // Unresolved point sources never drive the exposure (their displayed glare is capped in the PSF).
    for (const s of this.near.stars) {
      const rel = s.upos.sub(this.rig.upos, new Vector3());
      if (!onScreen(rel)) continue;
      const d = rel.length();
      const pr = Math.asin(Math.min(1, s.radius / d)) / this.view.pixelAngle;
      if (pr <= 1.5) continue;
      const E = magToIrradiance(s.absMag + 5 * Math.log10(d / PC) - 5);
      // a star's disk is shown at ~1.4 (bright, but its colour and surface still show)
      lightCap = Math.min(lightCap, 1.4 / ((E * d * d) / (Math.PI * s.radius * s.radius)));
    }
    target = Math.min(target, Math.log(diskCap), Math.log(lightCap));
    if (this.frameCount < 3) this.logExposure = target;
    this.logExposure += (target - this.logExposure) * (1 - Math.exp(-dt * 2.5));
    const xSurf = Math.exp(this.logExposure);
    // Stars keep a floor exposure (artistic, SpaceEngine-like) unless a star/the Sun is in view.
    this.logStarCap += (Math.log(Math.min(lightCap, 1e30)) - this.logStarCap) * (1 - Math.exp(-dt * 2.5));
    if (this.frameCount < 3) this.logStarCap = Math.log(Math.min(lightCap, 1e30));
    const xStar = Math.max(xSurf, Math.min(xDark * this.starFloor, Math.exp(this.logStarCap)));
    const minEnergy = this.starFields[0].psf.uMinEnergy.value;
    const mLim = irradianceToMag((minEnergy * pixSA) / xStar);
    return { xStar, xSurf, mLim, xDark };
  }

  private pick(cx: number, cy: number): SpaceObject | null {
    let best: SpaceObject | null = null;
    let bestScore = Infinity;
    const consider = (obj: SpaceObject, p: { x: number; y: number } | null, radiusPx: number, bias: number) => {
      if (!p) return;
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d > Math.max(radiusPx, 9)) return;
      const s = d + bias;
      if (s < bestScore) { bestScore = s; best = obj; }
    };
    const mLim = this.lastMLim;
    for (const v of this.bodies.views.values()) {
      if (!v.resolved && v.apparentMag > mLim + 1.5) continue;
      consider(v.body, this.project(v.rel), v.pixelRadius / this.view.pixelRatio, v.resolved ? -6 : -3);
    }
    const rel = new Vector3();
    for (const c of this.small.cometObjects) {
      if (c.apparentMag > mLim) continue;
      consider(c, this.project(c.upos.sub(this.rig.upos, rel)), 0, 0);
    }
    for (const ev of this.exo.views) if (this.exoShown(ev)) consider(ev.planet, this.project(ev.rel), ev.pixelRadius / this.view.pixelRatio, ev.pixelRadius > 2 ? -6 : -3);
    for (const cv of this.craft.views) if (this.craftShown(cv)) consider(cv.craft, this.project(cv.rel), cv.pixelRadius / this.view.pixelRatio, -5);
    for (const gv of this.galaxies.views) if (gv.pixelRadius >= 2.5) consider(gv.galaxy, this.project(gv.rel), Math.min(gv.pixelRadius / this.view.pixelRatio, 80), 2);
    for (const sh of this.game.traffic.ships) {
      const r = sh.upos.sub(this.rig.upos, new Vector3());
      if (r.length() < 2e6) consider(sh, this.project(r), (Math.atan2(sh.radius, r.length()) / this.view.pixelAngle) / this.view.pixelRatio, -4);
    }
    for (const s of this.near.stars) consider(s, this.project(s.upos.sub(this.rig.upos, rel)), 0, -2);
    for (const { bh, rel: r, shadowPx } of this.labelledHoles()) consider(bh, this.project(r), shadowPx / this.view.pixelRatio, -4);
    if (best) return best;
    // Catalogue stars currently drawn
    let bestRef: { cat: StarCatalog; node: number; slot: number } | null = null;
    const cam = this.camPc;
    for (const cat of this.catalogs) for (const n of cat.needed) {
      const pos = cat.cpuPositions(n);
      if (!pos || !n.absMag) continue;
      for (let i = 0; i < n.drawCount; i++) {
        rel.set(pos[i * 3] - cam.x, pos[i * 3 + 1] - cam.y, pos[i * 3 + 2] - cam.z);
        const d = rel.length();
        if (d < NEAR_STAR_RADIUS) continue;
        const m = n.absMag[i] + 5 * Math.log10(d) - 5;
        if (m > mLim) continue;
        const p = this.project(rel);
        if (!p) continue;
        const ds = Math.hypot(p.x - cx, p.y - cy);
        if (ds > 9) continue;
        const s = ds + 0.4 * m;
        if (s < bestScore) { bestScore = s; bestRef = { cat, node: n.id, slot: i }; }
      }
    }
    let bestProc: (() => SpaceObject) | null = null;
    this.procStars.forEachVisible(cam, mLim, (r, m, star) => {
      if (r.length() < NEAR_STAR_RADIUS) return;
      const p = this.project(r);
      if (!p) return;
      const ds = Math.hypot(p.x - cx, p.y - cy);
      if (ds > 9) return;
      const sc = ds + 0.4 * m;
      if (sc < bestScore) { bestScore = sc; bestProc = star; }
    });
    if (bestProc) return (bestProc as () => SpaceObject)();
    if (!bestRef) return null;
    return this.getStar(bestRef.cat, bestRef.node, bestRef.slot);
  }
  private lastMLim = 6;

  /**
   * Pick along a ray (VR controller). `origin` and `dir` are camera-relative,
   * world-oriented. Objects within ~1.5° of the ray (or under it) qualify.
   */
  pickRay(origin: Vector3, dir: Vector3): SpaceObject | null {
    const d = dir.clone().normalize();
    const surface = this.rayHitBody(origin, d);
    if (surface) return surface;
    const tol = (1.5 * Math.PI) / 180;
    let best: SpaceObject | null = null;
    let bestScore = Infinity;
    const tmp = new Vector3();
    const angleTo = (rel: Vector3) => {
      tmp.copy(rel).sub(origin);
      const len = tmp.length();
      return { ang: Math.acos(Math.max(-1, Math.min(1, tmp.dot(d) / len))), len };
    };
    const consider = (obj: SpaceObject, rel: Vector3, radius: number, bias: number) => {
      const { ang, len } = angleTo(rel);
      const size = Math.asin(Math.min(1, radius / Math.max(len, radius * 1.0001)));
      if (ang > Math.max(tol, size)) return;
      const score = ang / tol + bias;
      if (score < bestScore) { bestScore = score; best = obj; }
    };
    const mLim = this.lastMLim;
    for (const v of this.bodies.views.values()) {
      if (!v.resolved && v.apparentMag > mLim + 1.5) continue;
      consider(v.body, v.rel, v.body.radius, v.resolved ? -1 : -0.3);
    }
    const rel = new Vector3();
    for (const c of this.small.cometObjects) {
      if (c.apparentMag > mLim) continue;
      consider(c, c.upos.sub(this.rig.upos, rel).clone(), c.radius, 0);
    }
    for (const ev of this.exo.views) if (this.exoShown(ev)) consider(ev.planet, ev.rel, ev.planet.radius, ev.pixelRadius > 2 ? -1 : -0.3);
    for (const cv of this.craft.views) if (this.craftShown(cv)) consider(cv.craft, cv.rel, cv.craft.radius, -0.6);
    for (const gv of this.galaxies.views) if (gv.pixelRadius >= 2.5) consider(gv.galaxy, gv.rel, gv.galaxy.radius * 0.5, 0.5);
    for (const sh of this.game.traffic.ships) {
      const r = sh.upos.sub(this.rig.upos, new Vector3());
      if (r.length() < 2e6) consider(sh, r, sh.radius, -0.6);
    }
    for (const st of this.near.stars) consider(st, st.upos.sub(this.rig.upos, rel).clone(), st.radius, -0.2);
    for (const { bh, rel: r } of this.labelledHoles()) consider(bh, r, bh.radius * 2.6, -0.5);
    if (best) return best;
    let bestRef: { cat: StarCatalog; node: number; slot: number } | null = null;
    const cam = this.camPc;
    const dpc = new Vector3();
    for (const cat of this.catalogs) for (const n of cat.needed) {
      const pos = cat.cpuPositions(n);
      if (!pos || !n.absMag) continue;
      for (let i = 0; i < n.drawCount; i++) {
        dpc.set(pos[i * 3] - cam.x, pos[i * 3 + 1] - cam.y, pos[i * 3 + 2] - cam.z);
        const dist = dpc.length();
        if (dist < NEAR_STAR_RADIUS) continue;
        const ang = Math.acos(Math.max(-1, Math.min(1, dpc.dot(d) / dist)));
        if (ang > tol) continue;
        const m = n.absMag[i] + 5 * Math.log10(dist) - 5;
        if (m > mLim) continue;
        const score = ang / tol + 0.08 * m;
        if (score < bestScore) { bestScore = score; bestRef = { cat, node: n.id, slot: i }; }
      }
    }
    let bestProc: (() => SpaceObject) | null = null;
    this.procStars.forEachVisible(cam, mLim, (r, m, star) => {
      const dist = r.length();
      if (dist < NEAR_STAR_RADIUS) return;
      const ang = Math.acos(Math.max(-1, Math.min(1, r.dot(d) / dist)));
      if (ang > tol) return;
      const score = ang / tol + 0.08 * m;
      if (score < bestScore) { bestScore = score; bestProc = star; }
    });
    if (bestProc) return (bestProc as () => SpaceObject)();
    return bestRef ? this.getStar(bestRef.cat, bestRef.node, bestRef.slot) : null;
  }

  /** Nearest resolved body whose sphere the ray actually hits (what you see along the ray). */
  private rayHitBody(origin: Vector3, d: Vector3): SpaceObject | null {
    let best: SpaceObject | null = null;
    let bestT = Infinity;
    const oc = new Vector3();
    for (const v of this.bodies.views.values()) {
      if (!v.resolved) continue;
      oc.copy(origin).sub(v.rel);
      const b = oc.dot(d);
      const c = oc.lengthSq() - v.body.radius * v.body.radius;
      const disc = b * b - c;
      if (disc < 0) continue;
      const t = -b - Math.sqrt(disc);
      if (t > 0 && t < bestT) { bestT = t; best = v.body; }
    }
    for (const ev of this.exo.views) {
      if (ev.pixelRadius < 0.8) continue;
      oc.copy(origin).sub(ev.rel);
      const b = oc.dot(d);
      const disc = b * b - (oc.lengthSq() - ev.planet.radius * ev.planet.radius);
      if (disc < 0) continue;
      const t = -b - Math.sqrt(disc);
      if (t > 0 && t < bestT) { bestT = t; best = ev.planet; }
    }
    return best;
  }

  /**
   * Cheap ray pick for per-frame hover in VR: Solar System bodies, comets, nearby stars and
   * named stars (no scan of the full catalogue).
   */
  pickRayFast(origin: Vector3, dir: Vector3, tolDeg = 2): SpaceObject | null {
    const d = dir.clone().normalize();
    const surface = this.rayHitBody(origin, d);
    if (surface) return surface;
    const tol = (tolDeg * Math.PI) / 180;
    let best: SpaceObject | null = null;
    let bestScore = Infinity;
    const tmp = new Vector3();
    const consider = (obj: SpaceObject, rel: Vector3, radius: number, bias: number) => {
      tmp.copy(rel).sub(origin);
      const len = tmp.length();
      const ang = Math.acos(Math.max(-1, Math.min(1, tmp.dot(d) / len)));
      const size = Math.asin(Math.min(1, radius / Math.max(len, radius * 1.0001)));
      if (ang > Math.max(tol, size)) return;
      const score = ang / tol + bias;
      if (score < bestScore) { bestScore = score; best = obj; }
    };
    const mLim = this.lastMLim;
    for (const v of this.bodies.views.values()) {
      if (!v.resolved && v.apparentMag > mLim + 1.5) continue;
      if (this.occluded(v.rel, v.body)) continue;
      consider(v.body, v.rel, v.body.radius, v.resolved ? -1 : -0.3);
    }
    const rel = new Vector3();
    for (const c of this.small.cometObjects) {
      if (c.apparentMag > mLim) continue;
      consider(c, c.upos.sub(this.rig.upos, rel).clone(), c.radius, 0);
    }
    for (const ev of this.exo.views) if (this.exoShown(ev)) consider(ev.planet, ev.rel, ev.planet.radius, ev.pixelRadius > 2 ? -1 : -0.3);
    for (const cv of this.craft.views) if (this.craftShown(cv)) consider(cv.craft, cv.rel, cv.craft.radius, -0.6);
    for (const gv of this.galaxies.views) if (gv.pixelRadius >= 2.5) consider(gv.galaxy, gv.rel, gv.galaxy.radius * 0.5, 0.5);
    for (const sh of this.game.traffic.ships) {
      const r = sh.upos.sub(this.rig.upos, new Vector3());
      if (r.length() < 2e6) consider(sh, r, sh.radius, -0.6);
    }
    for (const st of this.near.stars) consider(st, st.upos.sub(this.rig.upos, rel).clone(), st.radius, -0.2);
    for (const { bh, rel: r } of this.labelledHoles()) consider(bh, r, bh.radius * 2.6, -0.5);
    if (best) return best;
    const cam = this.camPc;
    let bestStar: { node: number; slot: number } | null = null;
    for (const s of this.named.list) {
      const dist = s.pos.distanceTo(cam);
      if (dist < NEAR_STAR_RADIUS) continue;
      const m = s.absMag + 5 * Math.log10(dist) - 5;
      if (m > Math.min(mLim, 6.5)) continue;
      rel.copy(s.pos).sub(cam);
      const ang = Math.acos(Math.max(-1, Math.min(1, rel.dot(d) / rel.length())));
      if (ang > tol) continue;
      const score = ang / tol + 0.1 * m;
      if (score < bestScore) { bestScore = score; bestStar = s; }
    }
    return bestStar ? this.getStar(this.catalog, bestStar.node, bestStar.slot) : null;
  }

  /** true if the segment camera -> rel is blocked by a resolved body or a black hole's shadow (other than `self`). */
  private occluded(rel: Vector3, self: SpaceObject | null): boolean {
    const dist = rel.length();
    for (const v of this.holes.views) {
      if (v.bh === self || v.dist > dist) continue;
      // shadow seen from the eye: angular radius asin(3√3/2 rs / d); objects behind it out to ~3
      // shadow radii are seen only as displaced, lensed images, so their labels would mislead
      const ang = Math.asin(Math.min(1, (2.598 * v.bh.radius) / v.dist));
      if (self !== v.bh.companion && rel.angleTo(v.rel) < 3 * ang) return true;
    }
    for (const o of this.occluders) {
      if (o.body === self) continue;
      if (o.dist > dist) continue;
      // ray-sphere test (camera at origin, direction rel/dist)
      const t = o.rel.dot(rel) / dist;
      if (t <= 0 || t > dist) continue;
      const d2 = o.rel.lengthSq() - t * t;
      if (d2 < o.body.radius * o.body.radius * 0.995) return true;
    }
    return false;
  }
  private occluders: { body: Body; rel: Vector3; dist: number }[] = [];

  /** Black holes worth a label/pick: near ones, ones being drawn, and the selection. */
  private labelledHoles(): { bh: BlackHole; rel: Vector3; shadowPx: number }[] {
    const out: { bh: BlackHole; rel: Vector3; shadowPx: number }[] = [];
    for (const bh of this.blackHoles) {
      const v = this.holes.views.find((x) => x.bh === bh);
      if (v) { out.push({ bh, rel: v.rel, shadowPx: v.shadowPx }); continue; }
      const rel = bh.upos.sub(this.rig.upos, new Vector3());
      if (bh === this.selection || rel.length() < BH_LABEL_PC * PC) out.push({ bh, rel, shadowPx: 0 });
    }
    return out;
  }

  /** Never let the camera reach an event horizon. */
  private keepOutsideHorizons(): void {
    const rel = new Vector3();
    for (const h of this.blackHoles) {
      this.rig.upos.sub(h.upos, rel);
      const d = rel.length();
      const min = h.radius * 1.15;
      if (d < min) this.rig.upos.copy(h.upos).addVec(d > 0 ? rel.divideScalar(d) : rel.set(0, 0, 1), min);
    }
  }

  private labelCandidates(): LabelCandidate[] {
    const out: LabelCandidate[] = [];
    this.occluders = [];
    for (const v of this.bodies.views.values()) {
      if (v.resolved && v.pixelRadius > 2) this.occluders.push({ body: v.body, rel: v.rel, dist: v.dist });
    }
    const mLim = this.lastMLim;
    const sel = this.selection;
    const dpr = this.view.pixelRatio;
    for (const v of this.bodies.views.values()) {
      const b = v.body;
      const isSel = b === sel;
      let show = isSel;
      let prio = 0;
      if (b.kind === 'star') { show = true; prio = 600; }
      else if (b.kind === 'planet') { show = show || v.apparentMag < mLim + 2 || v.resolved; prio = 500 - v.apparentMag; }
      else if (b.kind === 'dwarf') { show = show || v.apparentMag < mLim || v.resolved; prio = 380 - v.apparentMag; }
      else if (b.kind === 'moon') {
        const parentView = b.parent ? this.bodies.views.get(b.parent) : undefined;
        const sep = parentView ? b.pos.distanceTo(b.parent!.pos) / v.dist / this.view.pixelAngle / dpr : 0;
        show = show || ((v.apparentMag < mLim + 1 || v.resolved) && sep > 18 && (!b.radiusEstimated || v.resolved));
        prio = 300 - v.apparentMag + (b.radiusEstimated ? -50 : 0);
      } else {
        show = show || v.resolved || v.apparentMag < Math.min(mLim, 9);
        prio = 200 - v.apparentMag;
      }
      if (!show) continue;
      const p = this.project(v.rel);
      if (!p || this.occluded(v.rel, b)) continue;
      out.push({ rel: v.rel.clone(), key: b.key, text: b.name, x: p.x, y: p.y, radius: v.pixelRadius / dpr, priority: isSel ? 1e4 : prio, cls: isSel ? 'selected' : b.kind });
    }
    const rel = new Vector3();
    for (const c of this.small.cometObjects) {
      if (c.apparentMag > Math.min(mLim, 10) && c !== sel) continue;
      c.upos.sub(this.rig.upos, rel);
      const p = this.project(rel);
      if (p && !this.occluded(rel, null)) out.push({ rel: rel.clone(), key: c.key, text: c.name, x: p.x, y: p.y, radius: 2, priority: c === sel ? 1e4 : 250 - c.apparentMag, cls: c === sel ? 'selected' : 'comet' });
    }
    const cam = this.camPc;
    for (const s of this.named.list) {
      if (!s.proper) continue;
      const d = s.pos.distanceTo(cam);
      if (d < NEAR_STAR_RADIUS) continue;
      const m = s.absMag + 5 * Math.log10(d) - 5;
      if (m > Math.min(mLim - 4, 2.6)) continue;
      rel.copy(s.pos).sub(cam).multiplyScalar(PC);
      const p = this.project(rel);
      if (p && !this.occluded(rel, null)) out.push({ rel: rel.clone(), key: `named:${s.index}`, text: s.names[0], x: p.x, y: p.y, radius: 3, priority: 100 - m, cls: 'star' });
    }
    for (const s of this.near.stars) {
      const p = this.project(s.upos.sub(this.rig.upos, rel));
      if (p) out.push({ rel: rel.clone(), key: s.key, text: s.name, x: p.x, y: p.y, radius: 4, priority: s === sel ? 1e4 : 450, cls: s === sel ? 'selected' : 'star' });
    }
    for (const sh of this.game.traffic.ships) {
      const r = sh.upos.sub(this.rig.upos, new Vector3());
      if (r.length() > 1.5e6 && sh !== sel) continue;
      const p = this.project(r);
      if (p && !this.occluded(r, null)) out.push({ rel: r, key: sh.key, text: sh.name, x: p.x, y: p.y, radius: 3, priority: sh === sel ? 1e4 : 300, cls: sh === sel ? 'selected' : 'ship' });
    }
    for (const cv of this.craft.views) {
      if (!this.craftShown(cv)) continue;
      const p = this.project(cv.rel);
      if (p && !this.occluded(cv.rel, null)) {
        const isSel = cv.craft === sel;
        out.push({ rel: cv.rel.clone(), key: cv.craft.key, text: cv.craft.name, x: p.x, y: p.y, radius: cv.pixelRadius / dpr, priority: isSel ? 1e4 : 460, cls: isSel ? 'selected' : 'craft' });
      }
    }
    for (const ev of this.exo.views) {
      if (!this.exoShown(ev)) continue;
      const p = this.project(ev.rel);
      if (p && !this.occluded(ev.rel, null)) {
        const isSel = ev.planet === sel;
        out.push({ rel: ev.rel.clone(), key: ev.planet.key, text: ev.planet.name, x: p.x, y: p.y, radius: ev.pixelRadius / dpr, priority: isSel ? 1e4 : 470 + Math.min(ev.pixelRadius, 20), cls: isSel ? 'selected' : 'exoplanet' });
      }
    }
    for (const { bh, rel: r, shadowPx } of this.labelledHoles()) {
      const p = this.project(r);
      if (p && !this.occluded(r, bh)) out.push({ rel: r, key: bh.key, text: bh.name, x: p.x, y: p.y, radius: shadowPx / dpr, priority: bh === sel ? 1e4 : 420, cls: bh === sel ? 'selected' : 'blackhole' });
    }
    for (const gv of this.galaxies.views) {
      const isSel = gv.galaxy === sel;
      if (!isSel && gv.pixelRadius < 2.5) continue;
      const p = this.project(gv.rel);
      if (p) out.push({ rel: gv.rel.clone(), key: gv.galaxy.key, text: gv.galaxy.name, x: p.x, y: p.y, radius: Math.min(gv.pixelRadius / dpr, 60), priority: isSel ? 1e4 : 640 + Math.min(gv.pixelRadius, 50), cls: isSel ? 'selected' : 'galaxy' });
    }
    {
      const mw = this.milkyWay;
      const r = mw.upos.sub(this.rig.upos, new Vector3());
      if (r.length() > mw.radius * 1.4 || sel === mw) {
        const p = this.project(r);
        if (p) out.push({ rel: r, key: mw.key, text: mw.name, x: p.x, y: p.y, radius: 40, priority: sel === mw ? 1e4 : 700, cls: sel === mw ? 'selected' : 'galaxy' });
      }
    }
    if (sel instanceof CatalogStar && !this.near.stars.includes(sel)) {
      const p = this.project(sel.upos.sub(this.rig.upos, rel));
      if (p) out.push({ rel: rel.clone(), key: sel.key, text: sel.name, x: p.x, y: p.y, radius: 3, priority: 1e4, cls: 'selected' });
    }
    return out;
  }

  // ------------------------------------------------------------------ main loop
  start(): void {
    // setAnimationLoop follows the display's refresh, or the headset's while presenting.
    this.renderer.gl.setAnimationLoop(() => this.frame());
  }

  frame(): void {
    const now = performance.now();
    const rawDt = Math.max(0, (now - this.lastTime) / 1000);
    // Camera/controls use a clamped step for stability; the simulation clock follows real time.
    const dt = Math.min(0.1, rawDt);
    this.lastTime = now;
    if (rawDt > 0) this.fps += (1 / rawDt - this.fps) * 0.05;
    this.frameCount++;

    // 1. time and ephemerides
    this.clock.advance(Math.min(rawDt, 1));
    const jd = this.clock.jdTdb;
    this.system.update(jd, this.clock.paused ? 0 : Math.sign(this.clock.rate));
    for (const h of this.blackHoles) h.update(jd);
    // planets and spacecraft move before the camera follows its anchor (which may be one of them)
    for (const sys of this.activeSystems) sys.update(jd);
    for (const c of this.craft.craft) c.update(jd);

    if (this.selection instanceof CatalogStar && !this.selection.exact && this.selection.ref) {
      const r = this.selection.ref;
      this.getStar(r.catalog, r.node.id, r.slot);
    }
    // 2. camera: co-move with the reference body, then apply controls
    this.rig.followAnchor();
    this.chooseAnchor();
    this.camPc.set((this.rig.upos.xh + this.rig.upos.xl) / PC, (this.rig.upos.yh + this.rig.upos.yl) / PC, (this.rig.upos.zh + this.rig.upos.zl) / PC);
    if (this.nearTimer-- <= 0) {
      this.updateNearStars();
      this.nearTimer = 10;
    }
    this.rig.altitude = this.computeAltitude();
    if (this.vr.active) this.vr.updateInput(dt);
    this.rig.braking = this.input.keys.has('KeyX');
    this.rig.update(dt, this.input);
    this.keepOutsideHorizons();
    this.camPc.set((this.rig.upos.xh + this.rig.upos.xl) / PC, (this.rig.upos.yh + this.rig.upos.yl) / PC, (this.rig.upos.zh + this.rig.upos.zl) / PC);

    // The dolly carries the explorer's orientation; a headset pose is applied on top of it.
    this.renderer.rig.quaternion.copy(this.rig.quat);
    this.renderer.rig.updateMatrixWorld(true);
    const cam = this.renderer.camera;
    cam.fov = this.rig.fov;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
    this.view = this.renderer.viewInfo();
    this.invQuat.copy(this.view.quat).invert();
    // Headset runtimes may clamp the far plane: pull distant geometry inside it, and fit log depth to it.
    const finiteFar = this.view.xr && Number.isFinite(this.view.far);
    GLOBALS.uPullIn.value = finiteFar ? this.view.far * 0.5 : 0;
    LITE.uLite.value = this.vr.active ? 1 : 0;
    GLOBALS.uDepthK.value = finiteFar ? depthK(this.renderer.camera.far) : 1;

    // 3. exposure and level of detail
    const pixelAngle = this.view.pixelAngle;
    this.bodies.glareOn = this.vr.active;
    this.bodies.allowHi = !this.vr.active;
    this.bodies.update(this.rig.upos, pixelAngle, dt, this.view.quat);
    this.bodies.updateDetail(this.renderer.gl, this.tiles, pixelAngle, new Vector3(0, 0, -1).applyQuaternion(this.view.quat));
    this.atmospheres.steps = this.vr.active ? 10 : 16;
    this.atmospheres.update(this.rig.upos, this.bodies.views);
    this.updateActiveSystems();
    this.exo.showOrbits = this.orbits.enabled;
    this.exo.update(this.rig.upos, pixelAngle, this.activeSystems, jd, now / 1000);
    this.craft.update(this.rig.upos, pixelAngle, jd, this.system.sun, this.system.byId.get(399)!);
    this.holes.vr = this.vr.active;
    this.holes.update(this.rig.upos, pixelAngle, now / 1000);
    this.jets.update(this.rig.upos, pixelAngle, now / 1000);
    const { xStar, xSurf, mLim, xDark } = this.updateExposure(dt);
    const sunDistPc = this.camPc.length();
    GALAXY.toGal(this.camPc, this.camGal);
    this.galaxy.vr = this.vr.active;
    // one face per frame while travelling; all at once if we find ourselves far out with no map yet
    if (sunDistPc > 60) this.galaxy.update(this.renderer.gl, this.camGal, !this.galaxy.ready && sunDistPc > 150 ? 6 : 1);
    this.sky.updateWith(xStar / xDark, sunDistPc, this.galaxy.ready ? this.galaxy.target.texture : null, this.camGal);
    this.galaxies.update(this.rig.upos, pixelAngle, xStar / xDark, smoothstep(300, 1500, sunDistPc), this.view.quat);
    this.lastMLim = mLim;
    const psf = this.starFields[0].psf;
    psf.uExposure.value = xStar;
    const dpr = this.view.pixelRatio;
    psf.uPixelSA.value = (this.view.pixelAngle * dpr) ** 2;
    psf.uDpr.value = dpr;
    this.bodies.surfaceExposure.value = xSurf;
    for (const c of this.catalogs) c.update(this.camPc, mLim, this.fieldMinDistPc);
    for (const f of this.starFields) f.update(this.camPc, NEAR_STAR_RADIUS);
    this.procStars.update(this.camPc, mLim, NEAR_STAR_RADIUS, this.vr.active ? 2 : 4);
    this.near.update(this.rig.upos, pixelAngle, now / 1000, this.view.quat);
    this.orbits.focus = this.rig.anchor instanceof Body ? this.rig.anchor : null;
    this.orbits.update(this.rig.upos, pixelAngle, jd);
    this.small.update(this.rig.upos, jd);

    this.game.update(dt);

    // 4. draw
    if (this.warmupPending) {
      this.warmupPending = false;
      this.warmUp();
    }
    this.holes.capture(this.renderer.gl, this.renderer.scene, [this.renderer.rig, this.orbits.group, ...this.vr.sceneOverlays], psf);
    this.renderer.render();

    // 5. overlays
    if (this.vr.active) {
      this.labels.update([], this.cssW, this.cssH);
      this.vr.updateOverlays(this.labelCandidates(), dt);
    } else {
      this.labels.update(this.labelCandidates(), this.view.width, this.view.height);
    }
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.updateHud();
    }
  }

  private updateHud(): void {
    const c = this.clock;
    let selection = null;
    if (this.selection) {
      const d = this.selection.upos.sub(this.rig.upos, new Vector3()).length();
      const rows = this.selection.info();
      if (this.selection instanceof CatalogStar && !this.isCompanion(this.selection)) {
        const sys = this.systems.of(this.selection);
        if (sys) rows.push(['Planets', sys.real ? `${sys.planets.length} confirmed (NASA Exoplanet Archive)` : `${sys.planets.length} generated (not observed)`]);
      }
      selection = { name: this.selection.name, rows, distance: formatDistance(d) };
    }
    const drawn = this.starFields.reduce((a, f) => a + f.drawnStars, 0) + this.procStars.drawnStars;
    const loaded = this.catalogs.reduce((a, c) => a + c.loadedStars, 0);
    const total = this.catalogs.reduce((a, c) => a + c.totalStars, 0);
    const pending = this.catalogs.reduce((a, c) => a + c.pending, 0);
    this.hud.update({
      date: formatUtc(c.jdTdb),
      rate: this.rateText(),
      paused: c.paused,
      fps: this.fps,
      speed: formatSpeed(this.rig.speed),
      altitude: formatDistance(this.rig.altitude),
      reference: this.rig.anchor?.name ?? 'none (free space)',
      selection,
      stars: `${(drawn / 1e3).toFixed(0)}k stars drawn · ${(loaded / 1e6).toFixed(2)}M of ${(total / 1e6).toFixed(2)}M loaded`,
      loading: pending ? `streaming ${pending} star tiles` : '',
      depthMode: this.renderer.depthMode,
      ephemeris: this.system.usingDE ? 'Ephemeris: JPL DE442S' : 'Ephemeris: approximate elements',
      autopilot: this.rig.autopilot,
    });
  }

  /** Galaxy model column (L☉/pc², light beyond 300 pc) along world direction `dir` from the eye (debugging). */
  debugGlowColumn(dir: [number, number, number]): number {
    return glowColumn(this.camGal, GALAXY.dirToGal(new Vector3(...dir).normalize()), 400, 300);
  }

  /** Scripting helpers (used by automated tests and the browser console). */
  debugState() {
    return {
      jd: this.clock.jdTdb,
      camera: this.rig.upos.toVector3().toArray(),
      anchor: this.rig.anchor?.name ?? null,
      selection: this.selection?.name ?? null,
      starsDrawn: this.starFields.reduce((a, f) => a + f.drawnStars, 0),
      proceduralDrawn: this.procStars.drawnStars,
      proceduralPending: this.procStars.pending,
      starsLoaded: this.catalogs.reduce((a, c) => a + c.loadedStars, 0),
      pendingTiles: this.catalogs.reduce((a, c) => a + c.pending, 0),
      exposure: this.bodies.surfaceExposure.value,
      starExposure: this.starFields[0].psf.uExposure.value,
      mLim: this.lastMLim,
      depthMode: this.renderer.depthMode,
      usingDE: this.system.usingDE,
      fps: this.fps,
      autopilot: this.rig.autopilot,
    };
  }
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
