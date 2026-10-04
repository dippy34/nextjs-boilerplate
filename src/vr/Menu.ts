import { Vector3 } from 'three';
import { Landmark } from '../universe/Landmarks';
import { RingSpot } from '../universe/RingSpot';
import type { App } from '../app/App';
import { formatUtc } from '../core/time';
import { formatDistance, LY } from '../core/units';
import { BlackHole } from '../universe/BlackHoles';
import { Body, type SpaceObject } from '../universe/Body';
import { MilkyWay } from '../universe/MilkyWay';
import { Galaxy } from '../universe/Galaxies';
import { ExoPlanet, type PlanetType } from '../universe/Planets';
import { Spacecraft } from '../universe/Spacecraft';
import { DeepSkyObject } from '../universe/DeepSky';
import { CatalogStar } from '../universe/Stars';
import { COLORS, Panel } from './Panel';

export interface VRSettings {
  travel: 'smooth' | 'blink';
  turn: 'snap' | 'smooth';
  labels: boolean;
  orbits: boolean;
}

export interface MenuHost {
  app: App;
  settings: VRSettings;
  travelTo(obj: SpaceObject): void;
  closeMenu(): void;
  exitVR(): void;
}

type Tab = 'planets' | 'moons' | 'small' | 'stars' | 'exo' | 'nebulae' | 'holes' | 'craft' | 'places' | 'search' | 'settings';
const TABS: [Tab, string][] = [['planets', 'Planets'], ['moons', 'Moons'], ['small', 'Small'], ['stars', 'Stars'], ['exo', 'Exoplanets'], ['nebulae', 'Nebulae'], ['holes', 'Galaxies'], ['craft', 'Craft'], ['places', 'Places'], ['search', 'Search'], ['settings', 'Settings']];
const NEBULAE = ['Orion Nebula', 'Carina Nebula', 'Eagle Nebula', 'Lagoon Nebula', 'Ring Nebula', 'Helix Nebula', 'Crab Nebula', 'Veil Nebula (Cygnus Loop)',
  'Tarantula Nebula', 'Pleiades', 'Omega Centauri', 'Hercules Cluster (M13)'];
/** famous confirmed planets of other stars (NASA Exoplanet Archive names) */
const EXOPLANETS = ['Proxima Cen b', 'TRAPPIST-1 e', 'Kepler-186 f', '51 Peg b', 'HD 189733 b', '55 Cnc e', 'eps Eri b', 'TOI-700 d',
  'LHS 1140 b', 'K2-18 b', 'Kepler-452 b', 'HR 8799 e'];
const EXO_COLOR: Record<PlanetType, [number, number, number]> = {
  lava: [0.55, 0.18, 0.08], hot: [0.62, 0.55, 0.5], desert: [0.85, 0.6, 0.35], terran: [0.35, 0.55, 0.45], ocean: [0.2, 0.42, 0.8],
  ice: [0.88, 0.92, 0.98], subneptune: [0.55, 0.75, 0.85], icegiant: [0.35, 0.55, 0.95], giant: [0.85, 0.72, 0.55], hotgiant: [0.3, 0.22, 0.4],
};
const HOLES = ['Sagittarius A*', 'M87*', 'Cygnus X-1', 'Gaia BH1', 'Gaia BH2', 'Gaia BH3', '3A 0620-003', 'GS 2023+338', 'GRS 1915+105',
  'XTE J1118+480', '4U 1543-475'];
const GALAXIES = ['Andromeda Galaxy', 'Triangulum Galaxy', 'Large Magellanic Cloud', 'Small Magellanic Cloud', 'Whirlpool Galaxy', 'Sombrero Galaxy', 'Centaurus A', 'Pinwheel Galaxy', 'M87'];
const PLANETS = ['Sun', 'Mercury', 'Venus', 'Earth', 'Moon', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ceres'];
const MOON_PARENTS = ['Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
/** Places tab: the groups on the left, and the landmarks shown under Highlights */
const PLACE_GROUPS = ['Highlights', 'Earth', 'Moon', 'Mars', 'Mercury', 'Ceres'];
const HIGHLIGHTS = ['Mount Everest', 'Grand Canyon', 'Olympus Mons', 'Valles Marineris', 'Apollo 11 landing site', 'Tycho'];
const STARS = ['Proxima Centauri', 'Rigil Kentaurus', 'Sirius', 'Betelgeuse', 'Rigel', 'Vega', 'Polaris', 'Arcturus', 'Antares', 'Aldebaran',
  'Canopus', 'Deneb', "Barnard's Star", 'Tau Ceti', 'Altair', 'Capella', 'Spica', 'Fomalhaut', 'Procyon', 'Mira'];
const COMETS = ['Halley', 'Hale-Bopp', 'Churyumov', 'Encke', 'Tempel 1', 'Wild 2', 'Hartley 2', 'Swift-Tuttle'];
const KEYS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL\'', 'ZXCVBNM-/'];

export class VRMenu {
  readonly panel: Panel;
  private tab: Tab = 'planets';
  private moonParent = 'Jupiter';
  private placeGroup = 'Highlights';
  /** Places tab: choosing a place lands there and walks (src/app/Walk.ts) instead of looking from above */
  private walkThere = false;
  private query = '';
  private thumbs: HTMLImageElement | null = null;
  private thumbIndex: { cell: number; bodies: Record<string, [number, number]> } | null = null;
  private refreshTimer = 0;
  private exoList: SpaceObject[] | null = null;

  constructor(private host: MenuHost, dataBase: string) {
    this.panel = new Panel(1600, 1000, 1.3, (p) => this.paint(p));
    const img = new Image();
    img.onload = () => { this.thumbs = img; this.panel.dirty = true; };
    img.src = `${dataBase}/textures/thumbs.jpg`;
    fetch(`${dataBase}/textures/thumbs.json`).then((r) => r.json()).then((j) => { this.thumbIndex = j; this.panel.dirty = true; }).catch(() => undefined);
  }

  open(tab?: Tab): void {
    if (tab) this.tab = tab;
    this.panel.setVisible(true);
    this.panel.dirty = true;
  }

  get isOpen(): boolean {
    return this.panel.visible;
  }

  /** Called every frame while visible: live distances and the clock refresh once a second. */
  tick(dt: number): void {
    this.refreshTimer -= dt;
    if (this.refreshTimer <= 0) {
      this.refreshTimer = 1;
      this.panel.dirty = true;
    }
    this.panel.update();
  }

  // ------------------------------------------------------------------ painting
  private paint(p: Panel): void {
    const app = this.host.app;
    p.rect(4, 4, p.width - 8, p.height - 8, 36, COLORS.bg, COLORS.border, 4);
    p.text('SPACE EXPLORER', 44, 62, 40, '#ffffff', 700);
    p.text(formatUtc(app.clock.jdTdb), 560, 48, 30, COLORS.text, 600);
    p.text(app.clock.paused ? 'PAUSED' : app.rateText(), 560, 84, 24, app.clock.paused ? COLORS.warn : COLORS.accent, 500);
    p.button('pause', 1080, 30, 170, 64, app.clock.paused ? '▶ Play' : '⏸ Pause', () => { app.togglePause(); p.dirty = true; }, { size: 28 });
    p.button('close', 1460, 26, 110, 72, '✕', () => this.host.closeMenu(), { size: 40 });
    // walking (src/app/Walk.ts): on the ground below, or land first
    p.button('walk', 1266, 30, 180, 64, app.walk.active ? 'Fly' : 'Walk', () => { if (!app.walk.active) this.host.closeMenu(); app.walk.toggle(); p.dirty = true; }, { size: 28, active: app.walk.active });
    const tw = (p.width - 80 + 12) / TABS.length;
    TABS.forEach(([id, label], i) => {
      p.button(`tab:${id}`, 40 + i * tw, 122, tw - 12, 76, label, () => { this.tab = id; p.dirty = true; }, { active: this.tab === id, size: 24 });
    });
    const area = { x: 40, y: 222, w: p.width - 80, h: p.height - 262 };
    switch (this.tab) {
      case 'planets': this.paintGrid(p, area, PLANETS.map((n) => app.findByName(n)).filter(nonNull), 4); break;
      case 'moons': this.paintMoons(p, area); break;
      case 'small': this.paintSmall(p, area); break;
      case 'stars': this.paintGrid(p, area, STARS.map((n) => app.findByName(n)).filter(nonNull).slice(0, 16), 4, 4); break;
      case 'exo':
        if (!this.exoList || !this.exoList.length) this.exoList = EXOPLANETS.map((n) => app.findByName(n)).filter(nonNull);
        this.paintGrid(p, area, this.exoList, 4, 3);
        if (!this.exoList.length) p.text('Loading the exoplanet catalogue…', area.x + 20, area.y + 40, 28, COLORS.dim);
        break;
      case 'craft': this.paintGrid(p, area, app.craft.craft.filter((c) => c.valid), 4, 3); break;
      case 'places': this.paintPlaces(p, area); break;
      case 'nebulae': this.paintGrid(p, area, NEBULAE.map((n) => app.findByName(n)).filter(nonNull), 4, 3); break;
      case 'holes': this.paintGrid(p, area, [app.milkyWay, ...GALAXIES.map((n) => app.findByName(n)).filter(nonNull), ...HOLES.slice(0, 6).map((n) => app.blackHoles.find((h) => h.name === n)).filter(nonNull)], 4, 4); break;
      case 'search': this.paintSearch(p, area); break;
      case 'settings': this.paintSettings(p, area); break;
    }
  }

  private subtitle(o: SpaceObject): string {
    const app = this.host.app;
    const d = o.upos.sub(app.rig.upos, new Vector3()).length();
    if (o instanceof CatalogStar) return `${(d / LY).toFixed(d < 10 * LY ? 2 : 1)} light years`;
    if (o instanceof MilkyWay) return 'our galaxy, from outside';
    if (o instanceof Landmark) return `on ${o.def.body} · ${o.def.about}`;
    if (o instanceof TourEvent) return o.about;
    if (o instanceof RingSpot) return 'among the ice of the B ring';
    if (o instanceof Galaxy) {
      const mly = d / LY / 1e6;
      return `galaxy · ${mly < 1 ? `${Math.round(mly * 1000)} thousand ly` : `${mly.toFixed(mly < 10 ? 1 : 0)} million ly`}`;
    }
    if (o instanceof DeepSkyObject) return `${o.kind} · ${Math.round(d / LY).toLocaleString()} ly`;
    if (o instanceof Spacecraft) {
      const au = o.upos.sub(app.system.sun.upos, new Vector3()).length() / 1.495978707e11;
      return o.isOrbiter ? `Earth orbit · ${formatDistance(d)}` : o.parentObject ? `near Earth · ${formatDistance(d)}` : `${au.toFixed(au > 10 ? 0 : 2)} AU from the Sun`;
    }
    if (o instanceof ExoPlanet) {
      const ly = o.system.host.upos.sub(app.rig.upos, new Vector3()).length() / LY;
      return `${o.info()[0][1].replace(/^Exoplanet: /, '').replace(/, found.*$/, '')} · ${ly < 0.01 ? formatDistance(d) : `${ly.toFixed(ly < 10 ? 2 : 0)} ly`}`;
    }
    if (o instanceof BlackHole) {
      const ly = d / LY;
      const dist = ly > 1e6 ? `${(ly / 1e6).toFixed(0)} million ly` : ly > 0.01 ? `${Math.round(ly).toLocaleString()} ly` : formatDistance(d);
      return `${o.supermassive ? `${(o.massSun / 1e6).toPrecision(3)} million Suns` : `${o.massSun.toFixed(1)} Suns`} · ${dist}`;
    }
    if (o instanceof Body) {
      const kind = o.kind === 'moon' ? `moon of ${o.parent?.name}` : o.kind === 'star' ? 'star' : o.kind === 'dwarf' ? 'dwarf planet' : o.kind;
      return `${kind} · ${formatDistance(d)}`;
    }
    return `${o.kind} · ${formatDistance(d)}`;
  }

  private drawThumb(p: Panel, o: SpaceObject, cx: number, cy: number, r: number): void {
    const c = p.ctx;
    // places show the world they are on
    const idx = this.thumbIndex?.bodies[o instanceof Landmark || o instanceof TourEvent ? o.world.name : o instanceof RingSpot ? 'Saturn' : o.name];
    if (this.thumbs && this.thumbIndex && idx) {
      const s = this.thumbIndex.cell;
      c.drawImage(this.thumbs, idx[0] * s, idx[1] * s, s, s, cx - r, cy - r, 2 * r, 2 * r);
      return;
    }
    if (o instanceof MilkyWay || (o instanceof Galaxy && (o.shape === 'spiral' || o.shape === 'barred'))) {
      // a small barred spiral: warm core, two bluish arms
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(255,236,200,1)');
      g.addColorStop(0.25, 'rgba(230,200,160,0.8)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(190,200,255,0.55)';
      c.lineWidth = r * 0.09;
      for (const a0 of [0, Math.PI]) {
        c.beginPath();
        for (let t = 0; t < 1; t += 0.02) {
          const rr = r * (0.18 + 0.75 * t), a = a0 + t * 4.2;
          const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a) * 0.75;
          if (t === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
      return;
    }
    if (o instanceof BlackHole) {
      // shadow with a lensed ring of disk light
      const ring = o.diskOuter > 0 ? (o.supermassive ? [255, 170, 90] : [170, 205, 255]) : [200, 200, 215];
      const g = c.createRadialGradient(cx, cy, r * 0.38, cx, cy, r);
      g.addColorStop(0, 'rgb(0,0,0)');
      g.addColorStop(0.08, `rgba(${ring.join(',')},1)`);
      g.addColorStop(0.3, `rgba(${ring.join(',')},0.35)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#000';
      c.beginPath();
      c.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
      c.fill();
      return;
    }
    const col = o instanceof CatalogStar ? starColor(o) : o instanceof Body ? o.color : o instanceof ExoPlanet ? EXO_COLOR[o.spec.type] : o instanceof Spacecraft ? [0.95, 0.78, 0.4] : o instanceof DeepSkyObject ? (o.data.kind === 'emission' ? [1, 0.35, 0.45] : o.data.kind === 'planetary' ? [0.4, 0.95, 0.9] : o.data.kind === 'snr' ? [0.6, 0.7, 1] : [1, 0.92, 0.75]) : [0.7, 0.7, 0.7];
    const g = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
    const css = (k: number) => `rgb(${Math.round(255 * Math.min(1, col[0] * k))},${Math.round(255 * Math.min(1, col[1] * k))},${Math.round(255 * Math.min(1, col[2] * k))})`;
    const glow = o instanceof CatalogStar;
    g.addColorStop(0, css(glow ? 1.2 : 1));
    g.addColorStop(glow ? 0.5 : 0.8, css(glow ? 0.95 : 0.55));
    g.addColorStop(1, glow ? 'rgba(0,0,0,0)' : css(0.12));
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
  }

  private tile(p: Panel, o: SpaceObject, x: number, y: number, w: number, h: number): void {
    const id = `go:${o.key}`;
    const hov = p.hover === id;
    const sel = this.host.app.selection === o;
    p.rect(x, y, w, h, 22, hov ? COLORS.cardHover : COLORS.card, hov ? COLORS.accent : sel ? COLORS.sel : 'rgba(255,255,255,0.08)', hov ? 4 : 2);
    const r = Math.min(h * 0.36, 70);
    this.drawThumb(p, o, x + 26 + r, y + h / 2, r);
    const tx = x + 52 + 2 * r;
    p.text(o.name, tx, y + h * 0.4, 34, sel ? COLORS.sel : COLORS.text, 700, 'left', w - (tx - x) - 16);
    p.text(this.subtitle(o), tx, y + h * 0.66, 22, COLORS.dim, 400, 'left', w - (tx - x) - 16);
    p.region({ id, x, y, w, h, onClick: () => {
      if (o instanceof TourEvent) { const t = this.host.app.prepareTour(o.what); if (t) this.host.travelTo(t); }
      // Places with "walk there" on (src/app/Walk.ts): land at the place and walk
      else if (o instanceof Landmark && this.walkThere && this.tab === 'places') { this.host.closeMenu(); this.host.app.walk.walkAt(o); }
      else this.host.travelTo(o);
    } });
  }

  private paintGrid(p: Panel, a: { x: number; y: number; w: number; h: number }, items: SpaceObject[], cols: number, rows = 3): void {
    const gap = 18;
    const w = (a.w - gap * (cols - 1)) / cols;
    const h = (a.h - gap * (rows - 1)) / rows;
    items.slice(0, cols * rows).forEach((o, i) => this.tile(p, o, a.x + (i % cols) * (w + gap), a.y + Math.floor(i / cols) * (h + gap), w, h));
  }

  /** Places: highlights (events and the best-known landmarks), or every landmark of one world. */
  private paintPlaces(p: Panel, a: { x: number; y: number; w: number; h: number }): void {
    const app = this.host.app;
    PLACE_GROUPS.forEach((n, i) => {
      p.button(`places:${n}`, a.x, a.y + i * 104, 250, 90, n, () => { this.placeGroup = n; p.dirty = true; }, { active: this.placeGroup === n, size: 30 });
    });
    p.button('places:walk', a.x, a.y + PLACE_GROUPS.length * 104 + 14, 250, 90, this.walkThere ? 'Walk there ✓' : 'Walk there', () => { this.walkThere = !this.walkThere; p.dirty = true; }, { active: this.walkThere, size: 26 });
    let items: (SpaceObject | null)[];
    if (this.placeGroup === 'Highlights') {
      const jup = app.findByName('Jupiter'), moon = app.findByName('Moon');
      items = [
        app.findByName("Saturn's rings"),
        jup ? new TourEvent('shadow', 'Moon shadow on Jupiter', jup, 'jumps to the next shadow transit') : null,
        moon ? new TourEvent('eclipse', 'Total lunar eclipse', moon, '3 March 2026, the Moon in Earth\'s shadow') : null,
        ...HIGHLIGHTS.map((n) => app.landmarks.find((l) => l.name === n) ?? null),
      ];
    } else {
      items = app.landmarks.filter((l) => l.def.body === this.placeGroup);
    }
    this.paintGrid(p, { x: a.x + 280, y: a.y, w: a.w - 280, h: a.h }, items.filter(nonNull), 3, 4);
  }

  private paintMoons(p: Panel, a: { x: number; y: number; w: number; h: number }): void {
    const app = this.host.app;
    MOON_PARENTS.forEach((n, i) => {
      p.button(`parent:${n}`, a.x, a.y + i * 104, 250, 90, n, () => { this.moonParent = n; p.dirty = true; }, { active: this.moonParent === n, size: 30 });
    });
    const parent = app.system.bodies.find((b) => b.name === this.moonParent);
    const moons = app.system.bodies
      .filter((b) => b.kind === 'moon' && b.parent === parent && !b.radiusEstimated)
      .sort((x, y) => y.radius - x.radius);
    this.paintGrid(p, { x: a.x + 280, y: a.y, w: a.w - 280, h: a.h }, moons, 3, 4);
    if (!moons.length) p.text('No moons with measured sizes', a.x + 300, a.y + 40, 28, COLORS.dim);
  }

  private paintSmall(p: Panel, a: { x: number; y: number; w: number; h: number }): void {
    const app = this.host.app;
    const worlds = app.system.bodies
      .filter((b) => (b.kind === 'dwarf' || b.kind === 'asteroid' || b.kind === 'tno') && !b.radiusEstimated)
      .sort((x, y) => y.radius - x.radius)
      .slice(0, 8);
    const comets: SpaceObject[] = [];
    for (const n of COMETS) {
      const c = app.small.cometObjects.find((x) => x.name.includes(n));
      if (c && comets.length < 4) comets.push(c);
    }
    this.paintGrid(p, a, [...worlds, ...comets], 4, 3);
  }

  private paintSearch(p: Panel, a: { x: number; y: number; w: number; h: number }): void {
    const app = this.host.app;
    p.rect(a.x, a.y, 920, 80, 18, 'rgba(0,0,0,0.45)', COLORS.accent, 3);
    p.text(this.query ? `${this.query}▏` : 'Type a name…', a.x + 24, a.y + 42, 36, this.query ? '#ffffff' : COLORS.dim, 500);
    const kw = 88, kh = 92, gap = 4;
    KEYS.forEach((row, ri) => {
      const ox = a.x + ri * 22;
      [...row].forEach((ch, ci) => {
        p.button(`key:${ch}`, ox + ci * (kw + gap), a.y + 104 + ri * (kh + gap), kw, kh, ch, () => this.type(ch), { size: 36 });
      });
    });
    const by = a.y + 104 + 4 * (kh + gap);
    p.button('key:space', a.x + 100, by, 480, kh, 'space', () => this.type(' '), { size: 30 });
    p.button('key:back', a.x + 590, by, 200, kh, '⌫', () => { this.query = this.query.slice(0, -1); p.dirty = true; }, { size: 36 });
    p.button('key:clear', a.x + 800, by, 120, kh, 'clear', () => { this.query = ''; p.dirty = true; }, { size: 26 });
    // results
    const rx = a.x + 950, rw = a.w - 950;
    const results = this.query.trim() ? app.searchItems(this.query.trim()).slice(0, 8) : [];
    if (!this.query.trim()) p.text('Planets, 459 moons, asteroids, comets, 12,585 named stars, 6,333 exoplanets, spacecraft, nebulae, clusters, 47 galaxies, 23 black holes', rx + 10, a.y + 40, 24, COLORS.dim, 400, 'left', rw - 20);
    results.forEach((r, i) => {
      p.button(`res:${r.id}`, rx, a.y + i * 92, rw, 82, r.label, () => {
        const o = app.resolveSearchId(r.id);
        if (o) this.host.travelTo(o);
      }, { sub: r.detail, align: 'left', size: 30 });
    });
  }

  private type(ch: string): void {
    if (this.query.length < 28) this.query += ch.toLowerCase() === ch ? ch : ch.toLowerCase();
    if (this.query.length === 1) this.query = this.query.toUpperCase();
    this.panel.dirty = true;
  }

  private paintSettings(p: Panel, a: { x: number; y: number; w: number; h: number }): void {
    const app = this.host.app;
    const s = this.host.settings;
    const row = (i: number, label: string) => {
      p.text(label, a.x + 10, a.y + 40 + i * 104, 32, COLORS.text, 600);
      return a.y + i * 104;
    };
    const toggle = (id: string, x: number, y: number, on: boolean, labels: [string, string], set: (v: boolean) => void) => {
      p.button(`${id}:a`, x, y, 200, 80, labels[0], () => { set(true); p.dirty = true; }, { active: on, size: 28 });
      p.button(`${id}:b`, x + 214, y, 200, 80, labels[1], () => { set(false); p.dirty = true; }, { active: !on, size: 28 });
    };
    const X = a.x + 470;
    toggle('labels', X, row(0, 'Labels'), s.labels, ['On', 'Off'], (v) => { s.labels = v; });
    toggle('orbits', X, row(1, 'Orbit lines'), s.orbits, ['On', 'Off'], (v) => { s.orbits = v; app.orbits.enabled = v; });
    toggle('travel', X, row(2, 'Travel'), s.travel === 'smooth', ['Fly', 'Blink'], (v) => { s.travel = v ? 'smooth' : 'blink'; });
    toggle('turn', X, row(3, 'Turning'), s.turn === 'snap', ['Snap', 'Smooth'], (v) => { s.turn = v ? 'snap' : 'smooth'; });
    const y4 = row(4, 'Milky Way');
    p.button('mw:-', X, y4, 120, 80, '−', () => { app.sky.brightness = Math.max(0, app.sky.brightness - 0.25); p.dirty = true; }, { size: 40 });
    p.text(`${Math.round(app.sky.brightness * 100)} %`, X + 210, y4 + 40, 30, COLORS.text, 600, 'center');
    p.button('mw:+', X + 294, y4, 120, 80, '+', () => { app.sky.brightness = Math.min(3, app.sky.brightness + 0.25); p.dirty = true; }, { size: 40 });
    const y5 = row(5, 'Stars');
    p.button('st:-', X, y5, 120, 80, '−', () => { app.starMagLimit = Math.max(4, app.starMagLimit - 0.5); p.dirty = true; }, { size: 40 });
    p.text(`mag ${app.starMagLimit.toFixed(1)}`, X + 210, y5 + 40, 30, COLORS.text, 600, 'center');
    p.button('st:+', X + 294, y5, 120, 80, '+', () => { app.starMagLimit = Math.min(10, app.starMagLimit + 0.5); p.dirty = true; }, { size: 40 });
    toggle('ship', X, row(6, 'Spaceship'), app.game.active, ['Cockpit', 'Off'], (v) => { app.game.setMode(v ? 'cockpit' : 'off'); });
    // time controls on the right
    const tx = a.x + 1000;
    p.text('Time', tx, a.y + 40, 32, COLORS.text, 600);
    const tb = (id: string, i: number, label: string, f: () => void) =>
      p.button(id, tx + (i % 2) * 260, a.y + 80 + Math.floor(i / 2) * 100, 245, 84, label, () => { f(); p.dirty = true; }, { size: 28 });
    tb('t:slow', 0, '◀◀ Slower', () => app.timeSlower());
    tb('t:fast', 1, 'Faster ▶▶', () => app.timeFaster());
    tb('t:rev', 2, '⇄ Reverse', () => app.timeReverse());
    tb('t:now', 3, 'Now', () => app.realTime());
    p.button('exit', tx, a.y + 400, 505, 90, 'Exit VR', () => this.host.exitVR(), { size: 32, color: COLORS.warn });
    // walking options (src/app/Walk.ts)
    const ws = app.walk.settings;
    p.text('Walking', tx, a.y + 530, 30, COLORS.text, 600);
    p.button('wk:vig', tx, a.y + 556, 245, 70, ws.vignette ? 'Vignette on' : 'Vignette off', () => { ws.vignette = !ws.vignette; p.dirty = true; }, { size: 24, active: ws.vignette });
    p.button('wk:h', tx + 260, a.y + 556, 245, 70, ws.height === 'standing' ? 'Standing' : 'Seated', () => { ws.height = ws.height === 'standing' ? 'seated' : 'standing'; p.dirty = true; }, { size: 24 });
    const ms = app.game.missions;
    p.text(`Missions: ${ms.doneCount} / ${ms.total}`, tx, a.y + 664, 26, COLORS.warn, 600);
    ms.list.filter((m) => !m.done).slice(0, 1).forEach((m, i) => p.text(`○ ${m.title}`, tx, a.y + 704 + i * 38, 22, COLORS.dim, 500, 'left', 520));
  }
}

/** A tour event as a menu tile (the clock is set when it is chosen); shows its world's picture. */
class TourEvent implements SpaceObject {
  readonly kind = 'event';
  readonly radius = 0;
  readonly parentObject = null;
  constructor(readonly what: string, readonly name: string, readonly world: SpaceObject, readonly about: string) {}
  get key(): string { return `event:${this.what}`; }
  get upos() { return this.world.upos; }
  info(): [string, string][] { return [['Event', this.about]]; }
}

function nonNull<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}

function starColor(s: CatalogStar): [number, number, number] {
  const t = s.teff || 5800;
  // compact Planck-ish tint for the menu thumbnails only
  if (t > 9000) return [0.75, 0.85, 1.0];
  if (t > 6500) return [0.92, 0.94, 1.0];
  if (t > 5200) return [1.0, 0.95, 0.85];
  if (t > 4000) return [1.0, 0.82, 0.6];
  return [1.0, 0.7, 0.45];
}


