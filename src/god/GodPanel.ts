import { QUICK_CREATE } from './Actions';
import { type BodyView, bodyView } from './BodyView';
import { type God, SPAWN_TYPES, type SpawnType } from './God';
import {
  apsides, AU, breakupPeriod, circularSpeed, type Derived, DAY, density, equatorSpeed, equilibriumTemp, escapeVelocity, flattening,
  fmtLength, habitableZone, hawkingTemp, hillRadius, isco, L_SUN, M_EARTH, M_JUPITER, M_SUN, mainSequence, num, orbitalPeriod,
  photonSphere, rocheLimit, scaleHeight, schwarzschildRadius, surfaceGravity, surfaceTemp, waterState,
} from './physics';
import { HINT_STEPS, type PushDir, type Verb } from './verbs';

const CSS = `
.god-badge { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); padding: 4px 12px; border-radius: 12px;
  font-size: 12px; pointer-events: auto; cursor: pointer; border: 1px solid var(--border); background: var(--panel); backdrop-filter: blur(4px);
  white-space: nowrap; user-select: none; }
.god-badge.real { color: #9fd8ff; }
.god-badge.sim { color: #ffd27a; border-color: rgba(255, 200, 100, 0.5); }
.god-badge .lag { color: #ff8a7a; margin-left: 6px; }
.god-panel { position: absolute; top: 70px; right: 10px; width: 400px; max-height: calc(100vh - 140px); overflow-y: auto;
  background: var(--panel); border: 1px solid rgba(255, 200, 100, 0.35); border-radius: 6px; padding: 8px 10px; pointer-events: auto;
  backdrop-filter: blur(4px); font-size: 12px; }
.god-panel h3 { margin: 0 0 6px; font-size: 14px; color: #ffd27a; display: flex; justify-content: space-between; align-items: center; }
.god-panel h4 { margin: 8px 0 2px; font-size: 15px; color: #fff; }
.god-panel details.grp { border-top: 1px solid rgba(127, 178, 255, 0.18); margin-top: 6px; padding-top: 4px; }
.god-panel details.grp > summary { cursor: pointer; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11.5px; }
.god-panel .row { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; margin: 3px 0; }
.god-panel .lab { color: var(--dim); min-width: 92px; }
.god-panel .unit { color: var(--dim); min-width: 30px; font-size: 11px; }
.god-panel .val { font-variant-numeric: tabular-nums; }
.god-panel button { background: rgba(127, 178, 255, 0.14); color: var(--fg); border: 1px solid var(--border); border-radius: 4px;
  padding: 2px 6px; font: inherit; cursor: pointer; }
.god-panel button.n { padding: 1px 3px; font-size: 10px; min-width: 26px; }
.god-panel .row select { font-size: 11px; padding: 1px 2px; }
.god-panel button:hover { background: rgba(127, 178, 255, 0.3); }
.god-panel button.on { background: rgba(255, 200, 100, 0.35); border-color: rgba(255, 200, 100, 0.7); }
.god-panel button.danger { border-color: rgba(255, 120, 100, 0.5); }
.god-panel button:disabled { opacity: 0.4; cursor: default; }
.god-panel input, .god-panel select { background: rgba(0, 0, 0, 0.45); color: #fff; border: 1px solid var(--border); border-radius: 4px; padding: 2px 4px; font: inherit; }
.god-panel input[type=text] { width: 70px; font-variant-numeric: tabular-nums; }
.god-panel input[type=range] { width: 100%; margin: 0; height: 12px; }
.god-panel .hint { color: var(--dim); font-size: 11px; margin-top: 3px; }
.god-panel .x { cursor: pointer; color: var(--dim); padding: 0 4px; }
.god-panel details.m { margin: 1px 0 1px 8px; }
.god-panel details.m > summary { cursor: pointer; list-style: none; display: flex; justify-content: space-between; gap: 8px; }
.god-panel details.m > summary::-webkit-details-marker { display: none; }
.god-panel details.m > summary span { color: var(--dim); }
.god-panel details.m > summary span::before { content: '▸ '; color: rgba(127, 178, 255, 0.6); }
.god-panel details.m[open] > summary span::before { content: '▾ '; }
.god-panel details.m > summary b { font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; }
.god-panel details.m code { display: block; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10.5px; color: #cfe3ff;
  background: rgba(0, 0, 0, 0.35); border-radius: 4px; padding: 3px 5px; margin: 2px 0 4px; white-space: pre-wrap; word-break: break-word; }
.god-panel label.chk { display: flex; gap: 6px; align-items: center; cursor: pointer; }
.god-panel .gs-name { font-size: 22px; font-weight: 700; color: #fff; line-height: 1.1; }
.god-panel .gs-sub { color: var(--dim); font-size: 12.5px; margin: 2px 0 6px; }
.god-panel .gs-facts { display: flex; gap: 6px; flex-wrap: wrap; margin: 0 0 8px; }
.god-panel .gs-facts span { background: rgba(127, 178, 255, 0.10); border-radius: 10px; padding: 2px 8px; font-size: 12px; color: #cfe3ff; font-variant-numeric: tabular-nums; }
.god-panel .gs-verbs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.god-panel .gs-verbs button { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; padding: 7px 10px; font-size: 15px; font-weight: 600;
  border-radius: 8px; min-height: 48px; text-align: left; }
.god-panel .gs-verbs button small { font-size: 11px; font-weight: 400; color: var(--dim); }
.god-panel .gs-verbs .wide { grid-column: 1 / -1; }
.god-panel .gs-push { grid-column: 1 / -1; display: flex; gap: 4px; align-items: stretch; }
.god-panel .gs-push > button:first-child { flex: 1; }
.god-panel .gs-push .pd { flex: 0 0 auto; min-height: 0; padding: 4px 7px; font-size: 12px; font-weight: 500; align-items: center; justify-content: center; }
.god-panel .gs-cap { margin: 8px 0 4px; padding: 8px 10px; border-radius: 8px; background: rgba(0, 0, 0, 0.35); border-left: 3px solid rgba(255, 200, 100, 0.4);
  font-size: 13.5px; line-height: 1.35; color: #f2f5fb; min-height: 20px; transition: background 0.4s, border-color 0.4s; }
.god-panel .gs-cap.fresh { background: rgba(255, 200, 100, 0.16); border-left-color: #ffd27a; }
.god-panel .gs-cap.empty { color: var(--dim); }
.god-panel .gs-sec { margin: 10px 0 4px; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11.5px; }
.god-panel .gs-create { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.god-panel .gs-create button { padding: 8px 4px; font-size: 14px; font-weight: 600; border-radius: 8px; }
.god-panel .gs-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
.god-panel .gs-row2 button { padding: 7px; font-size: 14px; border-radius: 8px; }
.god-panel .gs-try { margin: 10px 0 2px; padding: 8px 10px; border: 1px dashed rgba(127, 178, 255, 0.5); border-radius: 8px; font-size: 13px; }
.god-panel .gs-try b { color: #ffd27a; }
.god-panel .gs-try ol { margin: 4px 0 0; padding-left: 20px; }
.god-panel .gs-try li { margin: 2px 0; color: var(--dim); }
.god-panel .gs-try li.now { color: #fff; font-weight: 600; }
.god-panel .gs-try li.done { text-decoration: line-through; }
.god-panel .gs-try .x { float: right; font-size: 12px; }
.god-panel .gs-aim { color: #ffd27a; }
.god-panel details.adv { margin-top: 10px; border-top: 1px solid rgba(255, 200, 100, 0.25); padding-top: 6px; }
.god-panel details.adv > summary { cursor: pointer; color: #ffd27a; font-weight: 600; font-size: 13px; }
`;

/** Editable fields: how they nudge (multiply or add) and their slider span. */
const FIELDS: Record<string, { mul?: boolean; step?: number; slider?: number }> = {
  mass: { mul: true, slider: 0.1 }, radius: { mul: true, slider: 0.1 }, rpol: { mul: true }, density: { mul: true, slider: 0.1 },
  rot: { mul: true }, obl: { step: 1 }, a: { mul: true, slider: 0.1 }, e: { step: 0.01, slider: 0.05 }, i: { step: 1 }, node: { step: 1 }, peri: { step: 1 }, M: { step: 1 },
  albedo: { step: 0.01 }, greenhouse: { step: 1 }, pressure: { mul: true }, molar: { mul: true }, bhspin: { step: 0.01 },
};
const MASS_UNITS: Record<string, number> = { 'M⊕': M_EARTH, 'M♃': M_JUPITER, 'M☉': M_SUN, kg: 1 };

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

/**
 * God mode's desktop panel (Y): a SpaceEngine-style editor for the selected body, driven by real
 * physics (src/god/physics.ts). Physical, orbit, climate, star and black-hole groups; every value
 * can be typed or nudged (±1 %, ±0.1 %), and every derived value opens to show its formula with
 * the numbers in. Edits move bodies onto exact Kepler orbits; "Simulate gravity" switches to the
 * N-body simulation. Below: creating things, and the universe (undo, save, reset).
 */
export class GodPanel {
  open = false;
  private root: HTMLDivElement;
  private badge: HTMLDivElement;
  private body: HTMLDivElement;
  private lastKey = '';
  private timer = 0;
  private openMath = new Set<string>();
  private closedGroups = new Set<string>(['climate', 'advanced']);
  private massUnit = 'M⊕';
  private view: BodyView | null = null;

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
    this.root.addEventListener('toggle', (e) => {
      const d = e.target as HTMLDetailsElement;
      const k = d.dataset.m ?? d.dataset.g;
      if (!k) return;
      const set = d.dataset.m ? this.openMath : this.closedGroups;
      if (d.dataset.m ? d.open : !d.open) set.add(k); else set.delete(k);
    }, true);
    this.root.addEventListener('keydown', (e) => {
      // typing in a field keeps its keys; checkboxes, selects and buttons let shortcuts (Ctrl+Z) through
      const t = e.target as HTMLInputElement;
      if (t.tagName !== 'INPUT' || t.type !== 'text') return;
      if (e.key === 'Enter') t.blur();
      e.stopPropagation();
    });
    this.root.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.root.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
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
    const badge = !sb.active ? '● Real ephemeris' : sb.mode === 'nbody' ? `● Sandbox (N-body simulation)${lag}` : '● Edited (Kepler orbits)';
    if (this.badge.innerHTML !== badge) this.badge.innerHTML = badge;
    this.badge.className = `god-badge ${sb.active ? 'sim' : 'real'}${this.god.app.photoMode ? ' hidden' : ''}`;
    this.root.classList.toggle('hidden', !this.open || this.god.app.photoMode);
    if (!this.open) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.25;
    const id = this.god.selectedId();
    const v = id !== null ? bodyView(this.god, id) : null;
    this.view = v;
    const e = id !== null ? sb.entityOf(id) : null;
    // rebuild when what is edited changes (not while typing); the moving numbers refresh in place
    const key = `${sb.active}|${sb.mode}|${id}|${e?.gm}|${e?.radius}|${e?.spin.rate}|${e?.spin.axis.x}|${JSON.stringify(e?.orbit?.el ?? null)}|${JSON.stringify(e?.phys ?? null)}|${this.god.tool}|${this.god.placeType}|${sb.canUndo}|${this.god.derive}|${this.massUnit}|${sb.entities.size}|${this.god.actions.serial}|${this.god.actions.hints.done.size}|${this.god.actions.hints.skipped}`;
    const typing = this.root.contains(document.activeElement) && (document.activeElement as HTMLElement).tagName === 'INPUT';
    if (key !== this.lastKey && !typing) { this.lastKey = key; this.render(v); }
    else this.live(v);
  }

  // ---------------------------------------------------------------- building blocks

  private math(key: string, label: string, d: Derived): string {
    return `<details class="m" data-m="${key}" ${this.openMath.has(key) ? 'open' : ''}><summary><span>${label}</span><b data-live="${key}">${esc(d.text)}</b></summary><code data-live-m="${key}">${esc(d.math)}</code></details>`;
  }

  private field(key: string, label: string, value: string, unit: string, extra = ''): string {
    const f = FIELDS[key] ?? {};
    const nud = f.mul ? [['0.99', '−1%'], ['0.999', '−.1%'], ['1.001', '+.1%'], ['1.01', '+1%']]
      : [[String(-(f.step ?? 1)), `−${f.step ?? 1}`], [String(-(f.step ?? 1) / 10), `−${(f.step ?? 1) / 10}`], [String((f.step ?? 1) / 10), `+${(f.step ?? 1) / 10}`], [String(f.step ?? 1), `+${f.step ?? 1}`]];
    const slider = f.slider ? `<input type="range" min="-1" max="1" step="0.001" value="0" data-s="${key}" title="fine: drag and let go">` : '';
    return `<div class="row"><span class="lab">${label}</span><input type="text" data-f="${key}" value="${esc(value)}"><span class="unit">${unit}</span>${extra}
      ${nud.map(([k, t]) => `<button class="n" data-n="${key}" data-k="${k}">${t}</button>`).join('')}</div>${slider}`;
  }

  private group(key: string, title: string, inner: string): string {
    return `<details class="grp" data-g="${key}" ${this.closedGroups.has(key) ? '' : 'open'}><summary>${title}</summary>${inner}</details>`;
  }

  // ---------------------------------------------------------------- render

  private render(v: BodyView | null): void {
    this.body.innerHTML = this.simple(v)
      + `<details class="adv" data-g="advanced" ${this.closedGroups.has('advanced') ? '' : 'open'}><summary>⚙ Advanced: every value, the formulas, gravity, save</summary>${this.advanced(v)}</details>`;
  }

  /** The simple panel: a few big verbs on the selection, what the physics did, create, undo, the guide. */
  private simple(v: BodyView | null): string {
    const g = this.god, act = g.actions;
    let h = '';
    if (v) {
      const kind = v.kind === 'hole' ? 'black hole' : v.kind;
      h += `<div class="gs-name">${esc(v.name)}</div><div class="gs-sub">${kind}${v.orbit ? ` · orbits ${esc(v.orbit.parentName)}` : ''}</div>`;
      const facts: string[] = [];
      const m = v.massKg;
      facts.push(m >= 0.01 * M_SUN ? `${num(m / M_SUN, 3)} M☉` : m >= 0.5 * M_JUPITER ? `${num(m / M_JUPITER, 3)} Jupiters` : `${num(m / M_EARTH, 3)} Earths`);
      if (v.kind !== 'hole') facts.push(`${fmtLength(v.radius)} radius`);
      if (v.orbit && v.orbit.el.e < 1) {
        const P = orbitalPeriod(v.orbit.el.q / (1 - v.orbit.el.e), v.orbit.parentMassKg, m).value;
        facts.push(`${v.kind === 'moon' ? 'month' : 'year'} ${P > 2 * 3.15576e7 ? `${num(P / 3.15576e7, 3)} yr` : `${num(P / DAY, 3)} d`}`);
      }
      h += `<div class="gs-facts">${facts.map((f) => `<span>${f}</span>`).join('')}</div>`;
      const aiming = g.tool === 'push';
      h += `<div class="gs-verbs">
        <button data-v="heavier"><span>⬆ Heavier</span><small>2× the mass</small></button>
        <button data-v="lighter"><span>⬇ Lighter</span><small>half the mass</small></button>
        <button data-v="bigger" ${v.kind === 'hole' ? 'disabled' : ''}><span>⤢ Bigger</span><small>2× the size</small></button>
        <button data-v="smaller" ${v.kind === 'hole' ? 'disabled' : ''}><span>⤡ Smaller</span><small>half the size</small></button>
        <div class="gs-push"><button data-a="pushaim" class="${aiming ? 'on' : ''}" ${v.orbit ? '' : 'disabled'}><span>➜ Push</span><small class="${aiming ? 'gs-aim' : ''}">${aiming ? 'now click in the view where to push it (Esc: cancel)' : 'then click where to push it'}</small></button>
          ${(['forward', 'back', 'out', 'in'] as const).map((d) => `<button class="pd" data-v="push" data-k="${d}" ${v.orbit ? '' : 'disabled'} title="Push ${d}: +20% of the circular speed">${{ forward: '↑ fwd', back: '↓ back', out: '→ out', in: '← in' }[d]}</button>`).join('')}</div>
        <button data-v="reverse" ${v.orbit ? '' : 'disabled'}><span>⇄ Reverse orbit</span><small>same speed, other way</small></button>
        <button data-v="delete" class="danger"><span>✕ Delete</span><small>its moons stay</small></button>
      </div>`;
    } else {
      h += `<div class="gs-name">Pick something</div><div class="gs-sub">Click a planet, moon, star or black hole in the view, then change it here.</div>`;
    }
    const fresh = act.caption && performance.now() - act.captionAt < 3000;
    h += `<div class="gs-cap ${act.caption ? '' : 'empty'} ${fresh ? 'fresh' : ''}" data-cap>${act.caption ? esc(act.caption) : 'Press a button: the orbit line morphs and this line says what physics did.'}</div>`;
    h += `<div class="gs-sec">Create ${v ? `next to ${esc(v.name)}` : 'in the Solar System'}</div><div class="gs-create">${QUICK_CREATE.map((q) => `<button data-q="${q.type}">${q.icon} ${q.label}</button>`).join('')}</div>`;
    h += `<div class="gs-row2"><button data-a="undo" ${g.sandbox.canUndo ? '' : 'disabled'} title="Ctrl+Z">↶ Undo</button><button data-a="reset" ${g.sandbox.active ? '' : 'disabled'}>⟲ Real universe</button></div>`;
    h += `<div class="hint">${v ? 'Drag the body itself to move it, or the yellow arrow\'s tip to change its speed.' : ''}</div>`;
    const hints = act.hints;
    if (hints.visible) {
      const next = hints.next;
      h += `<div class="gs-try"><span class="x" data-a="hintskip" title="Hide the guide">skip ✕</span><b>Try:</b><ol>${HINT_STEPS.map((st) => `<li class="${hints.done.has(st.id) ? 'done' : st === next ? 'now' : ''}">${esc(st.text)}</li>`).join('')}</ol></div>`;
    }
    return h;
  }

  /** The full editor (SpaceEngine-style): every value typed or nudged, every derived value with its formula. */
  private advanced(v: BodyView | null): string {
    const g = this.god, sb = g.sandbox;
    let html = '';
    if (v) {
      html += `<h4>${esc(v.name)}</h4>`;
      if (v.kind === 'hole') html += this.holeGroup(v);
      else {
        html += this.physicalGroup(v);
        if (v.kind === 'star') html += this.starGroup(v);
      }
      if (v.orbit) html += this.orbitGroup(v);
      if (v.kind === 'planet' || v.kind === 'moon') html += this.climateGroup(v);
      html += `<div class="row" style="margin-top:6px"><button data-a="move" class="${g.tool === 'move' ? 'on' : ''}" title="Then drag it in the view">✥ Move</button>
        <button data-a="delete" class="danger">✕ Delete</button></div>`;
    } else {
      html += `<div class="hint" style="margin:6px 0">Select a planet, moon, star or black hole (click it) to edit it.</div>`;
    }
    html += this.group('create', 'Create', this.createInner());
    html += this.group('universe', 'Universe', `
      <label class="chk" title="Every body attracts every other (IAS15 integrator in a worker). Off: exact Kepler orbits, everything else on the real ephemeris.">
        <input type="checkbox" data-c="nbody" ${sb.active && sb.mode === 'nbody' ? 'checked' : ''}> Simulate gravity (N-body)</label>
      <div class="hint">${!sb.active ? 'The real Solar System (JPL DE442S ephemeris). Edits put bodies on exact Kepler orbits; the rest stays real.'
        : sb.mode === 'kepler' ? 'Kepler mode: edited bodies follow exact two-body orbits; their moons come along; the rest is the ephemeris.'
          : `N-body: ${sb.entities.size} bodies, ${Math.round(sb.stepsPerSecond).toLocaleString()} steps/s. Collisions merge, tides tear apart.`}</div>
      <div class="row"><button data-a="undo" ${sb.canUndo ? '' : 'disabled'} title="Ctrl+Z">↶ Undo</button>
        <button data-a="reset" ${sb.active ? '' : 'disabled'}>⟲ Real universe</button></div>
      <div class="row"><button data-a="save" ${sb.active ? '' : 'disabled'}>Save</button><button data-a="load" ${sb.hasSave() ? '' : 'disabled'}>Load</button>
        <button data-a="export" ${sb.active ? '' : 'disabled'}>Export JSON</button><button data-a="import">Import</button></div>
      <div class="row"><button data-a="hintrestart">Show the “Try:” guide again</button></div>`);
    return html;
  }

  private physicalGroup(v: BodyView): string {
    const g = this.god;
    const u = MASS_UNITS[this.massUnit];
    const rho = density(v.massKg, v.radius);
    const unitSel = `<select data-c="massUnit">${Object.keys(MASS_UNITS).map((k) => `<option ${k === this.massUnit ? 'selected' : ''}>${k}</option>`).join('')}</select>`;
    const derive = (k: string, t: string) => `<button class="n ${g.derive === k ? 'on' : ''}" data-a="derive" data-k="${k}">${t}</button>`;
    let h = this.field('mass', 'Mass', num(v.massKg / u, 5), '', unitSel)
      + this.field('radius', 'Radius', num(v.radius / 1e3, 6), 'km')
      + this.field('density', 'Density', num(rho.value, 5), 'g/cm³')
      + `<div class="row"><span class="lab">Derived:</span>${derive('density', 'density')}${derive('mass', 'mass')}${derive('radius', 'radius')}
         <span class="hint">follows the other two</span></div>`
      + this.math('rho', 'density ρ', rho)
      + this.math('g', 'surface gravity g', surfaceGravity(v.massKg, v.radius))
      + this.math('vesc', 'escape velocity', escapeVelocity(v.massKg, v.radius));
    if (v.kind !== 'star') {
      h += this.field('rpol', 'Polar radius', num(v.rpol / 1e3, 6), 'km') + this.math('flat', 'flattening f', flattening(v.req, v.rpol));
    }
    // rotation
    const P = v.rotation;
    h += `<div class="row"><span class="lab">Rotation</span>${v.locked ? '<span class="val">tidally locked</span>' : ''}</div>`
      + this.field('rot', 'Period', P === null ? (v.orbit ? num(orbitalPeriod(v.orbit.el.q / (1 - v.orbit.el.e), v.orbit.parentMassKg, v.massKg).value / 3600, 6) : '0') : Number.isFinite(P) ? num(Math.abs(P) / 3600, 6) : '0', 'h')
      + `<div class="row"><span class="lab">Direction</span><button class="n ${P !== null && P >= 0 ? 'on' : ''}" data-a="spindir" data-k="pro">prograde</button>
         <button class="n ${P !== null && P < 0 ? 'on' : ''}" data-a="spindir" data-k="retro">retrograde</button></div>`
      + this.field('obl', 'Obliquity', num(v.obliquity, 5), '°');
    if (P !== null && Number.isFinite(P) && P !== 0) h += this.math('veq', 'equator speed', equatorSpeed(v.req, P));
    h += this.math('pmin', 'break-up period', breakupPeriod(v.massKg, v.req));
    return this.group('phys', 'Physical', h);
  }

  private orbitGroup(v: BodyView): string {
    const o = v.orbit!;
    const el = o.el;
    const a = el.e < 1 ? el.q / (1 - el.e) : NaN;
    const far = a > 0.01 * AU;
    const n = a > 0 ? Math.sqrt(el.mu / a ** 3) : 0;
    let M = ((this.god.sandbox.jd - el.tp) * DAY * n * 180) / Math.PI;
    M = ((M % 360) + 360) % 360;
    const rhoP = density(o.parentMassKg, o.parentRadius).value, rho = density(v.massKg, v.radius).value;
    const ap = apsides(a, el.e);
    let h = `<div class="row"><span class="lab">Orbits</span><span class="val">${esc(o.parentName)}</span><span class="hint">ecliptic J2000 elements</span></div>`
      + this.field('a', 'a (semi-major)', num(far ? a / AU : a / 1e3, 7), far ? 'AU' : 'km')
      + this.field('e', 'e (eccentricity)', num(el.e, 5), '')
      + this.field('i', 'i (inclination)', num(el.i, 6), '°')
      + this.field('node', 'Ω (asc. node)', num(((el.node % 360) + 360) % 360, 6), '°')
      + this.field('peri', 'ω (periapsis)', num(((el.peri % 360) + 360) % 360, 6), '°')
      + this.field('M', 'M (mean anom.)', num(M, 5), '°')
      + this.math('P', 'period P (Kepler III)', orbitalPeriod(a, o.parentMassKg, v.massKg))
      + this.math('q', 'periapsis q', ap.peri) + this.math('Q', 'apoapsis Q', ap.apo)
      + this.math('vc', 'circular speed at a', circularSpeed(a, o.parentMassKg))
      + this.math('hill', 'Hill sphere', hillRadius(a, el.e, v.massKg, o.parentMassKg))
      + this.math('roche', `Roche limit of ${esc(o.parentName)}`, rocheLimit(o.parentRadius, rhoP, rho));
    h += `<div class="row"><button data-a="v" data-k="reverse" title="Same orbit, the other way round: i → 180° − i">⇄ Reverse direction</button><button data-a="v" data-k="circular">◯ Circularize</button></div>
      <div class="row"><button data-a="v" data-k="escape">↗ Escape</button><button data-a="v" data-k="stop" title="No speed relative to ${esc(o.parentName)}: it falls">■ Stop</button>
      <button data-a="v" data-k="push">+15% speed</button><button data-a="v" data-k="brake">−15%</button></div>
      <div class="hint">Or drag the yellow arrow's tip: the yellow line is the orbit it gives.</div>`;
    return this.group('orbit', 'Orbit', h);
  }

  private climateGroup(v: BodyView): string {
    let h = this.field('albedo', 'Bond albedo', num(v.albedo, 4), '') + this.field('greenhouse', 'Greenhouse ΔT', num(v.greenhouse, 5), 'K');
    if (v.light) {
      const teq = equilibriumTemp(v.light.lum, v.light.d, v.albedo);
      const ts = surfaceTemp(teq.value, v.greenhouse);
      h += `<div class="row"><span class="hint">lit by ${esc(v.light.name)}: ${num(v.light.lum / L_SUN)} L☉ at ${esc(fmtLength(v.light.d))}</span></div>`
        + this.math('teq', 'equilibrium T', teq) + this.math('ts', 'surface T', ts)
        + `<div class="row"><span class="lab">Water</span><span class="val" data-live="water">${esc(waterState(ts.value, v.pressure))}</span></div>`;
      if (v.pressure > 0) {
        h += this.field('pressure', 'Pressure', num(v.pressure, 5), 'bar') + this.field('molar', 'Molar mass', num(v.molar * 1000, 5), 'g/mol')
          + this.math('H', 'scale height H', scaleHeight(ts.value, v.molar, surfaceGravity(v.massKg, v.radius).value));
      } else {
        h += `<div class="row"><span class="lab">Atmosphere</span><span class="val">none</span><button class="n" data-a="addair">add 1 bar</button></div>`;
      }
    }
    return this.group('climate', 'Climate', h);
  }

  private starGroup(v: BodyView): string {
    const ms = mainSequence(v.massKg / M_SUN);
    const hz = habitableZone(ms.lum.value * L_SUN);
    const h = `<div class="hint">Main sequence: luminosity, size and colour follow from the mass.</div>`
      + this.math('L', 'luminosity', ms.lum) + this.math('Rms', 'radius', ms.radius) + this.math('T', 'temperature (colour)', ms.teff)
      + this.math('life', 'lifetime', ms.life) + this.math('hzi', 'habitable zone, inner', hz.inner) + this.math('hzo', 'habitable zone, outer', hz.outer);
    return this.group('star', 'Star', h);
  }

  private holeGroup(v: BodyView): string {
    const u = MASS_UNITS[this.massUnit];
    const unitSel = `<select data-c="massUnit">${Object.keys(MASS_UNITS).map((k) => `<option ${k === this.massUnit ? 'selected' : ''}>${k}</option>`).join('')}</select>`;
    const h = this.field('mass', 'Mass', num(v.massKg / u, 5), '', unitSel) + this.field('bhspin', 'Spin a', num(v.bhSpin, 3), '')
      + this.math('rs', 'event horizon r_s', schwarzschildRadius(v.massKg)) + this.math('ph', 'photon sphere', photonSphere(v.massKg))
      + this.math('isco', 'innermost stable orbit', isco(v.massKg, v.bhSpin)) + this.math('th', 'Hawking temperature', hawkingTemp(v.massKg));
    return this.group('hole', 'Black hole', h);
  }

  private createInner(): string {
    const g = this.god;
    const info = SPAWN_TYPES.find((t) => t.type === g.placeType)!;
    return `<div class="row"><select data-c="type">${SPAWN_TYPES.map((t) => `<option value="${t.type}" ${t.type === g.placeType ? 'selected' : ''}>${t.label}</option>`).join('')}</select>
      ${info.type === 'swarm' ? '<span class="hint">60 asteroids</span>' : `<input type="text" data-c="placeMass" value="${g.placeMass}"><span class="unit">${info.unit === 'sun' ? 'M☉' : 'M⊕'}</span>`}</div>
      <div class="row"><span class="lab">Orbit radius</span><input type="text" data-c="placeA" value="${g.placeA}"><span class="unit">${g.placeAUnit}</span>
        <button class="n" data-a="aunit">${g.placeAUnit === 'AU' ? 'km' : 'AU'}</button></div>
      <div class="row"><button data-a="spawnOrbit" title="On a circular orbit of that radius about the selection (or the Sun)">✚ Add on circular orbit</button>
        <button data-a="place" class="${g.tool === 'place' ? 'on' : ''}">✚ Place in view</button></div>
      <div class="hint">${g.tool === 'place' ? 'Click in the view: a circular orbit there. Drag to throw it.' : 'Radius from mass with a typical density; edit it afterwards.'}</div>`;
  }

  /** Moving values: refresh in place. */
  private live(v: BodyView | null): void {
    const cap = this.body.querySelector<HTMLElement>('[data-cap]');
    if (cap) cap.classList.toggle('fresh', performance.now() - this.god.actions.captionAt < 3000);
    if (!v) return;
    const set = (k: string, d: Derived) => {
      const b = this.body.querySelector<HTMLElement>(`[data-live="${k}"]`);
      if (b && b.textContent !== d.text) b.textContent = d.text;
      const m = this.body.querySelector<HTMLElement>(`[data-live-m="${k}"]`);
      if (m && m.textContent !== d.math) m.textContent = d.math;
    };
    if (v.light && v.kind !== 'star') {
      const teq = equilibriumTemp(v.light.lum, v.light.d, v.albedo);
      set('teq', teq);
      set('ts', surfaceTemp(teq.value, v.greenhouse));
    }
  }

  // ---------------------------------------------------------------- input

  private apply(key: string, value: number): void {
    const g = this.god, v = this.view;
    if (!v || !Number.isFinite(value)) return;
    const id = v.id;
    const deg = (x: number) => x;
    switch (key) {
      case 'mass': if (value > 0) g.setPhysical(id, { massKg: value * MASS_UNITS[this.massUnit] }); break;
      case 'radius': if (value > 0) g.setPhysical(id, { radius: value * 1e3 }); break;
      case 'density': if (value > 0) g.setPhysical(id, { densityKgM3: value * 1000 }); break;
      case 'rpol': if (value > 0) g.setPhysical(id, { rpol: value * 1e3 }); break;
      case 'rot': if (value > 0) g.setRotation(id, value * 3600, v.rotation !== null && v.rotation < 0); break;
      case 'obl': g.spin(id, { tiltDeg: Math.max(0, Math.min(180, value)) }); break;
      case 'a': {
        if (value <= 0 || !v.orbit) break;
        const el = v.orbit.el, a = el.q / (1 - el.e);
        g.setOrbit(id, { a: value * (a > 0.01 * AU ? AU : 1e3) });
        break;
      }
      case 'e': g.setOrbit(id, { e: Math.max(0, Math.min(0.99, value)) }); break;
      case 'i': g.setOrbit(id, { i: deg(Math.max(0, Math.min(180, value))) }); break;
      case 'node': g.setOrbit(id, { node: value }); break;
      case 'peri': g.setOrbit(id, { peri: value }); break;
      case 'M': g.setOrbit(id, { M: value }); break;
      case 'albedo': g.ensureActive(); g.sandbox.setPhys(id, { albedo: Math.max(0, Math.min(1, value)) }); break;
      case 'greenhouse': g.ensureActive(); g.sandbox.setPhys(id, { greenhouse: value }); break;
      case 'pressure': g.ensureActive(); g.sandbox.setPhys(id, { pressure: Math.max(0, value), molar: v.molar }); break;
      case 'molar': if (value > 0) { g.ensureActive(); g.sandbox.setPhys(id, { molar: value / 1000, pressure: v.pressure }); } break;
      case 'bhspin': g.ensureActive(); g.sandbox.setPhys(id, { spin: Math.max(-0.998, Math.min(0.998, value)) }); break;
    }
    this.refresh();
  }

  /** The field's current number (as shown). */
  private fieldValue(key: string): number {
    const inp = this.body.querySelector<HTMLInputElement>(`input[data-f="${key}"]`);
    return inp ? Number(inp.value) : NaN;
  }

  private click(ev: Event): void {
    const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-a],[data-n],[data-v],[data-q]');
    if (!t || (t as HTMLButtonElement).disabled) return;
    const g = this.god, sb = g.sandbox, app = g.app;
    if (t.dataset.v) { g.actions.run(t.dataset.v as Verb, this.view?.id ?? null, t.dataset.k as PushDir | undefined); this.refresh(); return; }
    if (t.dataset.q) { g.actions.create(t.dataset.q as SpawnType); this.refresh(); return; }
    if (t.dataset.n) {
      const key = t.dataset.n, k = Number(t.dataset.k);
      const cur = this.fieldValue(key);
      this.apply(key, FIELDS[key]?.mul ? cur * k : cur + k);
      return;
    }
    const a = t.dataset.a!, k = t.dataset.k;
    const id = this.view?.id ?? null;
    switch (a) {
      case 'close': this.toggle(); return;
      case 'reset': g.actions.reset(); break;
      case 'undo': g.actions.undo(); break;
      case 'pushaim': g.tool = g.tool === 'push' ? 'none' : 'push'; break;
      case 'hintskip': g.actions.hints.skip(); break;
      case 'hintrestart': g.actions.hints.restart(); break;
      case 'save': app.hud.toast(sb.save() ? 'Universe saved in this browser' : 'Could not save (storage unavailable)', 2); break;
      case 'load': app.hud.toast(sb.load() ? 'Universe loaded' : 'No saved universe', 2); break;
      case 'export': this.download(sb.exportJson()); break;
      case 'import': this.upload(); break;
      case 'derive': g.derive = k as typeof g.derive; break;
      case 'spindir': if (id !== null && this.view) {
        const P = this.view.rotation ?? (this.view.orbit ? orbitalPeriod(this.view.orbit.el.q / (1 - this.view.orbit.el.e), this.view.orbit.parentMassKg).value : DAY);
        g.setRotation(id, Math.abs(Number.isFinite(P) && P !== 0 ? P : DAY), k === 'retro');
      } break;
      case 'v': if (id !== null) g.preset(id, k as 'reverse'); break;
      case 'move': g.tool = g.tool === 'move' ? 'none' : 'move'; if (g.tool === 'move') app.hud.toast('Drag the selected body to a new place', 2); break;
      case 'delete': if (id !== null) g.remove(id); break;
      case 'place': g.tool = g.tool === 'place' ? 'none' : 'place'; break;
      case 'aunit': g.placeAUnit = g.placeAUnit === 'AU' ? 'km' : 'AU'; g.placeA = g.placeAUnit === 'AU' ? 1 : 400000; break;
      case 'spawnOrbit': g.spawnOnOrbit(g.placeType, g.placeMass, g.placeA * (g.placeAUnit === 'AU' ? AU : 1e3)); break;
      case 'addair': if (id !== null) { g.ensureActive(); sb.setPhys(id, { pressure: 1, molar: 0.029 }); } break;
    }
    this.refresh();
  }

  private change(ev: Event): void {
    const t = ev.target as HTMLInputElement;
    const g = this.god;
    if (t.dataset.f) { this.apply(t.dataset.f, Number(t.value)); return; }
    if (t.dataset.s) {
      // fine slider: up to ±slider (fraction, or absolute for e) around the value shown
      const key = t.dataset.s, f = FIELDS[key], x = Number(t.value), cur = this.fieldValue(key);
      if (x !== 0) this.apply(key, f.mul ? cur * (1 + x * (f.slider ?? 0.1)) : cur + x * (f.slider ?? 0.05));
      return;
    }
    const c = t.dataset.c;
    if (c === 'type') { g.placeType = t.value as SpawnType; g.placeMass = SPAWN_TYPES.find((x) => x.type === g.placeType)!.mass; this.refresh(); }
    else if (c === 'placeMass') { const v = Number(t.value); if (v > 0) g.placeMass = v; }
    else if (c === 'placeA') { const v = Number(t.value); if (v > 0) g.placeA = v; }
    else if (c === 'massUnit') { this.massUnit = t.value; this.refresh(); }
    else if (c === 'nbody') { g.setSimulation(t.checked); t.blur(); this.refresh(); }
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

