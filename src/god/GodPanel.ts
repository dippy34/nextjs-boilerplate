import { Matrix4 } from 'three';
import { Body } from '../universe/Body';
import { BlackHole } from '../universe/BlackHoles';
import { type God, GM_EARTH, GM_SUN, SPAWN_TYPES, type SpawnType } from './God';
import type { Entity } from './Sandbox';

const CSS = `
.god-badge { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); padding: 4px 12px; border-radius: 12px;
  font-size: 12px; pointer-events: auto; cursor: pointer; border: 1px solid var(--border); background: var(--panel); backdrop-filter: blur(4px);
  white-space: nowrap; user-select: none; }
.god-badge.real { color: #9fd8ff; }
.god-badge.sim { color: #ffd27a; border-color: rgba(255, 200, 100, 0.5); }
.god-badge .lag { color: #ff8a7a; margin-left: 6px; }
.god-panel { position: absolute; top: 70px; right: 10px; width: 300px; max-height: calc(100vh - 140px); overflow-y: auto;
  background: var(--panel); border: 1px solid rgba(255, 200, 100, 0.35); border-radius: 6px; padding: 8px 10px; pointer-events: auto;
  backdrop-filter: blur(4px); font-size: 12px; }
.god-panel h3 { margin: 0 0 6px; font-size: 14px; color: #ffd27a; display: flex; justify-content: space-between; align-items: center; }
.god-panel h4 { margin: 10px 0 4px; font-size: 12px; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.god-panel .row { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin: 3px 0; }
.god-panel .lab { color: var(--dim); min-width: 62px; }
.god-panel .val { font-variant-numeric: tabular-nums; }
.god-panel button { background: rgba(127, 178, 255, 0.14); color: var(--fg); border: 1px solid var(--border); border-radius: 4px;
  padding: 3px 7px; font: inherit; cursor: pointer; }
.god-panel button:hover { background: rgba(127, 178, 255, 0.3); }
.god-panel button.on { background: rgba(255, 200, 100, 0.35); border-color: rgba(255, 200, 100, 0.7); }
.god-panel button.danger { border-color: rgba(255, 120, 100, 0.5); }
.god-panel button:disabled { opacity: 0.4; cursor: default; }
.god-panel input, .god-panel select { background: rgba(0, 0, 0, 0.45); color: #fff; border: 1px solid var(--border); border-radius: 4px; padding: 2px 5px; font: inherit; }
.god-panel input[type=number] { width: 78px; }
.god-panel input[type=range] { flex: 1; }
.god-panel .hint { color: var(--dim); font-size: 11px; margin-top: 3px; }
.god-panel .x { cursor: pointer; color: var(--dim); padding: 0 4px; }
`;

function fmtMass(gm: number): string {
  const me = gm / GM_EARTH;
  if (gm >= 0.01 * GM_SUN) return `${(gm / GM_SUN).toPrecision(3)} M☉`;
  if (me >= 50) return `${(me / 317.83).toPrecision(3)} M♃ (${me.toPrecision(3)} M⊕)`;
  return `${me.toPrecision(3)} M⊕`;
}
function fmtSpeed(v: number): string { return v >= 1000 ? `${(v / 1000).toFixed(2)} km/s` : `${v.toFixed(1)} m/s`; }
function fmtPeriod(rate: number): string {
  if (!rate) return 'not spinning';
  const h = (2 * Math.PI) / Math.abs(rate) / 3600;
  return `${h < 48 ? `${h.toFixed(2)} h` : `${(h / 24).toFixed(2)} d`}${rate < 0 ? ' (retrograde)' : ''}`;
}

/** God mode's desktop panel (Y): the sandbox switch, the selection's properties and the creation tools. */
export class GodPanel {
  open = false;
  private root: HTMLDivElement;
  private badge: HTMLDivElement;
  private body: HTMLDivElement;
  private lastKey = '';
  private timer = 0;

  constructor(private god: God) {
    const hud = document.getElementById('hud') ?? document.body;
    if (!document.getElementById('god-css')) {
      const st = document.createElement('style');
      st.id = 'god-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    this.badge = document.createElement('div');
    this.badge.className = 'god-badge real';
    this.badge.title = 'God mode (Y)';
    this.badge.addEventListener('click', () => this.toggle());
    hud.appendChild(this.badge);
    this.root = document.createElement('div');
    this.root.className = 'god-panel hidden';
    this.root.innerHTML = `<h3><span>⚡ God mode</span><span class="x" data-a="close" title="Close (Y)">✕</span></h3><div class="god-body"></div>`;
    this.body = this.root.querySelector('.god-body')!;
    hud.appendChild(this.root);
    this.root.addEventListener('click', (e) => this.click(e));
    this.root.addEventListener('change', (e) => this.change(e));
    this.root.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' && e.key === 'Enter') this.change(e);
      e.stopPropagation();
    });
    this.root.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  toggle(): void {
    this.open = !this.open;
    this.root.classList.toggle('hidden', !this.open);
    if (!this.open && this.god.tool !== 'none') this.god.tool = 'none';
    this.refresh();
  }

  /** Re-render on the next update. */
  refresh(): void { this.lastKey = ''; this.timer = 0; }

  setHidden(h: boolean): void {
    this.badge.classList.toggle('hidden', h);
    this.root.classList.toggle('hidden', h || !this.open);
  }

  update(dt: number): void {
    const sb = this.god.sandbox;
    const lag = sb.active && sb.lagging ? '<span class="lag">simulation behind</span>' : '';
    const badge = sb.active ? `● Sandbox (simulated)${lag}` : '● Real ephemeris';
    if (this.badge.innerHTML !== badge) this.badge.innerHTML = badge;
    this.badge.className = `god-badge ${sb.active ? 'sim' : 'real'}${this.god.app.photoMode ? ' hidden' : ''}`;
    this.root.classList.toggle('hidden', !this.open || this.god.app.photoMode);
    if (!this.open) return;
    this.timer -= dt;
    const id = this.god.selectedId();
    const e = id !== null ? sb.entityOf(id) : null;
    // rebuild when what is shown changes; numbers refresh a few times a second
    const key = `${sb.active}|${id}|${e?.gm}|${e?.radius}|${e?.spin.rate}|${e?.spin.locked}|${this.god.tool}|${this.god.placeType}|${sb.canUndo}|${this.god.app.vr?.active}`;
    if (key === this.lastKey && this.timer > 0) return;
    const rebuild = key !== this.lastKey;
    this.lastKey = key;
    this.timer = 0.25;
    if (rebuild) this.render(id, e);
    else this.live(e);
  }

  private render(id: number | null, e: Entity | null): void {
    const g = this.god, sb = g.sandbox, app = g.app;
    const sel = app.selection;
    const name = e?.name ?? sel?.name ?? '';
    const canEdit = id !== null;
    const b = sel instanceof Body ? sel : null;
    const gm = e?.gm ?? b?.gm ?? 0;
    const radius = e?.radius ?? b?.radius ?? 0;
    const isHole = e?.kind === 'hole' || sel instanceof BlackHole;
    let html = `
      <div class="row">${sb.active
        ? `<button data-a="reset" title="Back to the JPL ephemeris">⟲ Reset to the real universe</button>`
        : `<span class="hint">The real Solar System (JPL DE442S). Change anything and it becomes a live N-body simulation.</span>`}</div>
      <div class="row"><button data-a="undo" ${sb.canUndo ? '' : 'disabled'} title="Ctrl+Z">↶ Undo</button>
        <button data-a="save" ${sb.active ? '' : 'disabled'}>Save</button><button data-a="load" ${sb.hasSave() ? '' : 'disabled'}>Load</button>
        <button data-a="export" ${sb.active ? '' : 'disabled'}>Export</button><button data-a="import">Import</button></div>`;
    if (canEdit) {
      const me = gm / GM_EARTH;
      const unitSun = gm >= 0.01 * GM_SUN;
      html += `<h4>${escape(name)}</h4>
        <div class="row"><span class="lab">Mass</span><span class="val" data-live="mass">${fmtMass(gm)}</span></div>
        <div class="row"><button data-a="mass" data-k="0.1">÷10</button><button data-a="mass" data-k="0.5">÷2</button><button data-a="mass" data-k="2">×2</button><button data-a="mass" data-k="10">×10</button><button data-a="mass" data-k="1000">×1000</button></div>
        <div class="row"><input type="range" min="-3" max="3" step="0.01" value="0" data-c="massSlider" title="×0.001 … ×1000"><span class="val" data-live="massK">×1</span></div>
        <div class="row"><input type="number" step="any" value="${(unitSun ? gm / GM_SUN : me).toPrecision(4)}" data-c="massValue"><span>${unitSun ? 'Suns' : 'Earth masses'}</span><button data-a="massSet" data-u="${unitSun ? 'sun' : 'earth'}">Set</button></div>`;
      if (!isHole) {
        html += `<div class="row"><span class="lab">Radius</span><input type="number" step="any" value="${(radius / 1e3).toPrecision(5)}" data-c="radius"><span>km</span><button data-a="radius" data-k="0.5">÷2</button><button data-a="radius" data-k="2">×2</button></div>`;
        const rate = e ? (e.spin.locked ? null : e.spin.rate) : null;
        html += `<div class="row"><span class="lab">Spin</span><span class="val" data-live="spin">${e ? (e.spin.locked ? 'tidally locked' : fmtPeriod(rate ?? 0)) : '—'}</span></div>
          <div class="row"><button data-a="spin" data-k="faster">Faster</button><button data-a="spin" data-k="slower">Slower</button><button data-a="spin" data-k="reverse">Reverse</button><button data-a="spin" data-k="stop">Stop</button></div>
          <div class="row"><span class="lab">Axial tilt</span><input type="number" min="0" max="180" step="1" value="${e ? Math.round(this.tilt(e)) : 0}" data-c="tilt"><span>°</span><button data-a="tilt">Set</button></div>`;
      }
      html += `<div class="row"><span class="lab">Speed</span><span class="val" data-live="speed">${e ? this.speedText(e) : '—'}</span></div>
        <div class="row"><button data-a="v" data-k="reverse" title="Same speed, the other way round">⇄ Reverse orbit</button><button data-a="v" data-k="stop" title="No speed relative to what it orbits: it falls">■ Stop</button></div>
        <div class="row"><button data-a="v" data-k="circular">◯ Circularize</button><button data-a="v" data-k="escape">↗ Escape</button><button data-a="v" data-k="push">+15%</button><button data-a="v" data-k="brake">−15%</button></div>
        <div class="hint">Drag the yellow arrow's tip to set the velocity; the yellow line is the orbit it gives.</div>
        <div class="row"><button data-a="move" class="${g.tool === 'move' ? 'on' : ''}" title="Then drag the body in the view">✥ Move</button><button data-a="delete" class="danger" title="Delete">✕ Delete</button></div>`;
    } else {
      html += `<div class="hint" style="margin-top:8px">Select a planet, moon or star (click it) to change it.</div>`;
    }
    html += `<h4>Create</h4>
      <div class="row"><select data-c="type">${SPAWN_TYPES.map((t) => `<option value="${t.type}" ${t.type === g.placeType ? 'selected' : ''}>${t.label}</option>`).join('')}</select>
        ${this.massInput()}</div>
      <div class="row"><button data-a="place" class="${g.tool === 'place' ? 'on' : ''}">✚ Place in view</button><button data-a="spawnHere">Next to selection</button></div>
      <div class="hint">${g.tool === 'place' ? 'Click in the view: it goes on a circular orbit there. Drag to throw it.' : 'Placed on the plane of the selection\'s orbit.'}</div>
      <div class="hint">${sb.active ? `${sb.entities.size} bodies · ${Math.round(sb.stepsPerSecond).toLocaleString()} steps/s` : ''}</div>`;
    this.body.innerHTML = html;
  }

  private massInput(): string {
    const info = SPAWN_TYPES.find((t) => t.type === this.god.placeType)!;
    if (info.type === 'swarm') return '<span class="hint">60 asteroids</span>';
    return `<input type="number" step="any" value="${this.god.placeMass}" data-c="placeMass"><span>${info.unit === 'sun' ? 'Suns' : 'Earths'}</span>`;
  }

  private speedText(e: Entity): string {
    const { p, v } = this.god.sandbox.relative(e);
    return `${fmtSpeed(v.length())}${p ? ` about ${escape(p.name)}` : ''}`;
  }

  /** Angle (deg) between the spin axis and the orbit normal. */
  private tilt(e: Entity): number {
    const { r, v } = this.god.sandbox.relative(e);
    const n = r.clone().cross(v).normalize();
    if (n.lengthSq() < 0.5) return 0;
    const m = this.god.sandbox.orient(e, new Matrix4()).elements;
    const ax = { x: m[8], y: m[9], z: m[10] };
    return (Math.acos(Math.max(-1, Math.min(1, ax.x * n.x + ax.y * n.y + ax.z * n.z))) * 180) / Math.PI;
  }

  /** Numbers that change while the simulation runs. */
  private live(e: Entity | null): void {
    if (!e) return;
    const set = (k: string, v: string) => { const el = this.body.querySelector<HTMLElement>(`[data-live="${k}"]`); if (el && el.innerHTML !== v) el.innerHTML = v; };
    set('speed', this.speedText(e));
    set('mass', fmtMass(e.gm));
  }

  private click(ev: Event): void {
    const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-a]');
    if (!t || (t as HTMLButtonElement).disabled) return;
    const g = this.god, sb = g.sandbox, app = g.app;
    const a = t.dataset.a!, k = t.dataset.k;
    const id = g.selectedId();
    const num = (c: string) => Number(this.body.querySelector<HTMLInputElement>(`[data-c="${c}"]`)?.value);
    switch (a) {
      case 'close': this.toggle(); return;
      case 'reset': g.reset(); break;
      case 'undo': g.undo(); break;
      case 'save': app.hud.toast(sb.save() ? 'Universe saved in this browser' : 'Could not save (storage unavailable)', 2); break;
      case 'load': app.hud.toast(sb.load() ? 'Universe loaded' : 'No saved universe', 2); break;
      case 'export': this.download(sb.exportJson()); break;
      case 'import': this.upload(); break;
      case 'mass': if (id !== null) g.scaleMass(id, Number(k)); break;
      case 'massSet': if (id !== null && num('massValue') > 0) g.setMass(id, num('massValue') * (t.dataset.u === 'sun' ? GM_SUN : GM_EARTH)); break;
      case 'radius': if (id !== null) g.scaleRadius(id, Number(k)); break;
      case 'spin': if (id !== null) g.spin(id, k as 'faster'); break;
      case 'tilt': if (id !== null) g.spin(id, { tiltDeg: num('tilt') }); break;
      case 'v': if (id !== null) g.preset(id, k as 'reverse'); break;
      case 'move': g.tool = g.tool === 'move' ? 'none' : 'move'; if (g.tool === 'move') app.hud.toast('Drag the selected body to a new place', 2); break;
      case 'delete': if (id !== null) g.remove(id); break;
      case 'place': g.tool = g.tool === 'place' ? 'none' : 'place'; break;
      case 'spawnHere': g.spawnNearSelection(g.placeType, g.placeMass); break;
    }
    this.refresh();
  }

  private change(ev: Event): void {
    const t = ev.target as HTMLInputElement;
    const c = t.dataset.c;
    const g = this.god;
    const id = g.selectedId();
    if (c === 'type') { g.placeType = t.value as SpawnType; g.placeMass = SPAWN_TYPES.find((x) => x.type === g.placeType)!.mass; this.refresh(); }
    else if (c === 'placeMass') { const v = Number(t.value); if (v > 0) g.placeMass = v; }
    else if (c === 'massSlider' && id !== null && ev.type === 'change') {
      const k = 10 ** Number(t.value);
      if (k !== 1) g.scaleMass(id, k);
      this.refresh();
    } else if (c === 'radius' && id !== null && ev.type === 'change') { const v = Number(t.value); if (v > 0) g.setRadius(id, v * 1e3); }
  }

  private download(json: string): void {
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `universe-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch { this.god.app.hud.toast('Export failed', 2); }
  }

  private upload(): void {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json,.json';
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) return;
      void f.text().then((txt) => {
        const ok = this.god.sandbox.loadState(txt, this.god.app.clock.jdTdb);
        this.god.app.hud.toast(ok ? 'Universe imported' : 'Not a saved universe', 2);
        this.refresh();
      });
    };
    inp.click();
  }
}

function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
