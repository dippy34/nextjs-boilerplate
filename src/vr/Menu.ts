import { Vector3 } from 'three';
import type { App } from '../app/App';
import { formatUtc } from '../core/time';
import { formatDistance, LY } from '../core/units';
import { Body, type SpaceObject } from '../universe/Body';
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

type Tab = 'planets' | 'moons' | 'small' | 'stars' | 'search' | 'settings';
const TABS: [Tab, string][] = [['planets', 'Planets'], ['moons', 'Moons'], ['small', 'Small worlds'], ['stars', 'Stars'], ['search', 'Search'], ['settings', 'Settings']];
const PLANETS = ['Sun', 'Mercury', 'Venus', 'Earth', 'Moon', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ceres'];
const MOON_PARENTS = ['Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const STARS = ['Proxima Centauri', 'Rigil Kentaurus', 'Sirius', 'Betelgeuse', 'Rigel', 'Vega', 'Polaris', 'Arcturus', 'Antares', 'Aldebaran',
  'Canopus', 'Deneb', "Barnard's Star", 'Tau Ceti', 'Altair', 'Capella', 'Spica', 'Fomalhaut', 'Procyon', 'Mira'];
const COMETS = ['Halley', 'Hale-Bopp', 'Churyumov', 'Encke', 'Tempel 1', 'Wild 2', 'Hartley 2', 'Swift-Tuttle'];
const KEYS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL\'', 'ZXCVBNM-/'];

export class VRMenu {
  readonly panel: Panel;
  private tab: Tab = 'planets';
  private moonParent = 'Jupiter';
  private query = '';
  private thumbs: HTMLImageElement | null = null;
  private thumbIndex: { cell: number; bodies: Record<string, [number, number]> } | null = null;
  private refreshTimer = 0;

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
    TABS.forEach(([id, label], i) => {
      p.button(`tab:${id}`, 40 + i * 255, 122, 240, 76, label, () => { this.tab = id; p.dirty = true; }, { active: this.tab === id, size: 30 });
    });
    const area = { x: 40, y: 222, w: p.width - 80, h: p.height - 262 };
    switch (this.tab) {
      case 'planets': this.paintGrid(p, area, PLANETS.map((n) => app.findByName(n)).filter(nonNull), 4); break;
      case 'moons': this.paintMoons(p, area); break;
      case 'small': this.paintSmall(p, area); break;
      case 'stars': this.paintGrid(p, area, STARS.map((n) => app.findByName(n)).filter(nonNull).slice(0, 16), 4, 4); break;
      case 'search': this.paintSearch(p, area); break;
      case 'settings': this.paintSettings(p, area); break;
    }
  }

  private subtitle(o: SpaceObject): string {
    const app = this.host.app;
    const d = o.upos.sub(app.rig.upos, new Vector3()).length();
    if (o instanceof CatalogStar) return `${(d / LY).toFixed(d < 10 * LY ? 2 : 1)} light years`;
    if (o instanceof Body) {
      const kind = o.kind === 'moon' ? `moon of ${o.parent?.name}` : o.kind === 'star' ? 'star' : o.kind === 'dwarf' ? 'dwarf planet' : o.kind;
      return `${kind} · ${formatDistance(d)}`;
    }
    return `${o.kind} · ${formatDistance(d)}`;
  }

  private drawThumb(p: Panel, o: SpaceObject, cx: number, cy: number, r: number): void {
    const c = p.ctx;
    const idx = this.thumbIndex?.bodies[o.name];
    if (this.thumbs && this.thumbIndex && idx) {
      const s = this.thumbIndex.cell;
      c.drawImage(this.thumbs, idx[0] * s, idx[1] * s, s, s, cx - r, cy - r, 2 * r, 2 * r);
      return;
    }
    const col = o instanceof CatalogStar ? starColor(o) : o instanceof Body ? o.color : [0.7, 0.7, 0.7];
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
    p.region({ id, x, y, w, h, onClick: () => this.host.travelTo(o) });
  }

  private paintGrid(p: Panel, a: { x: number; y: number; w: number; h: number }, items: SpaceObject[], cols: number, rows = 3): void {
    const gap = 18;
    const w = (a.w - gap * (cols - 1)) / cols;
    const h = (a.h - gap * (rows - 1)) / rows;
    items.slice(0, cols * rows).forEach((o, i) => this.tile(p, o, a.x + (i % cols) * (w + gap), a.y + Math.floor(i / cols) * (h + gap), w, h));
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
    if (!this.query.trim()) p.text('Planets, 459 moons, asteroids, comets, 12,585 named stars', rx + 10, a.y + 40, 24, COLORS.dim, 400, 'left', rw - 20);
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
  }
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


