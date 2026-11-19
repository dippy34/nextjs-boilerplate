import type { God } from '../God';
import { ScriptRunner } from './Script';
import { GodWorld } from './world';

const CSS = `
.god-console { position: absolute; left: 50%; bottom: 52px; transform: translateX(-50%); width: min(760px, 94vw); pointer-events: auto;
  background: rgba(6, 10, 18, 0.88); border: 1px solid rgba(255, 200, 100, 0.4); border-radius: 6px; backdrop-filter: blur(4px);
  font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; color: #dfe8f5; display: flex; flex-direction: column; max-height: 52vh; }
.god-console .out { overflow-y: auto; padding: 6px 10px; white-space: pre-wrap; word-break: break-word; min-height: 60px; flex: 1; }
.god-console .out .cmd { color: #ffd27a; }
.god-console .out .err { color: #ff9a8a; }
.god-console .out .math { color: #9fc8ff; }
.god-console .bar { display: flex; gap: 4px; align-items: center; border-top: 1px solid rgba(127, 178, 255, 0.2); padding: 4px 6px; }
.god-console .bar span { color: #ffd27a; }
.god-console input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font: inherit; padding: 3px 2px; }
.god-console button { background: rgba(127, 178, 255, 0.14); color: #dfe8f5; border: 1px solid rgba(127, 178, 255, 0.3); border-radius: 4px; font: inherit; font-size: 11px; padding: 2px 6px; cursor: pointer; }
.god-console select { background: rgba(0, 0, 0, 0.5); color: #dfe8f5; border: 1px solid rgba(127, 178, 255, 0.3); border-radius: 4px; font: inherit; font-size: 11px; }
.god-console textarea { margin: 0 6px 6px; height: 120px; background: rgba(0, 0, 0, 0.5); color: #fff; border: 1px solid rgba(127, 178, 255, 0.3); border-radius: 4px; font: inherit; padding: 4px; resize: vertical; }
`;

const HISTORY_KEY = 'space-explorer-god-console';
const SCRIPT_KEY = 'space-explorer-god-script';

/** Ready-made scripts (also the headset's buttons). */
export const PRESETS: { label: string; script: string }[] = [
  { label: 'Circular orbits', script: '# every planet on a circle in the ecliptic\nfor p in planets: p.e = 0; p.i = 0' },
  { label: 'Heavy Jupiter', script: '# ten Jupiters, then let gravity work it out\nJupiter.mass *= 10\nsimulate on' },
  { label: 'Second sun', script: '# a red dwarf companion at 30 AU\ncreate star "Nemesis" mass=0.3 Msun a=30 AU around Sun' },
  { label: 'Hot Earth', script: '# Earth at Venus\'s distance, with a thicker atmosphere\nEarth.a = 0.72 AU\nEarth.pressure = 5 bar\nprint Earth.T_s' },
  { label: 'Black hole', script: 'create blackhole "Abyss" mass=10 Msun a=40 AU around Sun\nsimulate on' },
  { label: 'Retrograde Moon', script: 'reverse Moon\nprint Moon.i' },
];

/**
 * The universe console (backquote): type statements of God mode's little language
 * (src/god/script/Script.ts), see each result with its formula, recall with the arrow keys, and
 * keep scripts as plain text. Scripts only run when you press Enter or Run.
 */
export class GodConsole {
  open = false;
  readonly runner: ScriptRunner;
  private root: HTMLDivElement;
  private out: HTMLDivElement;
  private input: HTMLInputElement;
  private area: HTMLTextAreaElement;
  private history: string[] = [];
  private hpos = -1;

  constructor(private god: God) {
    this.runner = new ScriptRunner(new GodWorld(god));
    try { this.history = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as string[]; } catch { this.history = []; }
    if (!document.getElementById('god-console-css')) {
      const st = document.createElement('style');
      st.id = 'god-console-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const hud = document.getElementById('hud') ?? document.body;
    this.root = document.createElement('div');
    this.root.className = 'god-console hidden';
    this.root.innerHTML = `
      <div class="out"></div>
      <textarea class="hidden" spellcheck="false" placeholder="A script: one statement per line, # for comments"></textarea>
      <div class="bar"><span>›</span><input type="text" spellcheck="false" placeholder="Earth.mass = 2 Mearth   ·   for p in planets: p.e = 0   ·   help">
        <button data-a="help">help</button><button data-a="script">script</button><select data-a="preset"><option value="">examples…</option>${PRESETS.map((p, i) => `<option value="${i}">${p.label}</option>`).join('')}</select>
        <button data-a="close" title="Close (\`)">✕</button></div>
      <div class="bar hidden" data-row="script"><button data-a="run">▶ Run script</button><button data-a="save">Save .txt</button><button data-a="load">Load .txt</button><button data-a="clear">Clear</button></div>`;
    hud.appendChild(this.root);
    this.out = this.root.querySelector('.out')!;
    this.input = this.root.querySelector('input')!;
    this.area = this.root.querySelector('textarea')!;
    try { this.area.value = localStorage.getItem(SCRIPT_KEY) ?? ''; } catch { /* (no storage) */ }
    this.input.addEventListener('keydown', (e) => this.key(e));
    this.area.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { this.runScript(); e.preventDefault(); }
      if (e.key === 'Escape') this.toggle();
      e.stopPropagation();
    });
    this.root.addEventListener('click', (e) => this.click(e));
    this.root.addEventListener('change', (e) => {
      const t = e.target as HTMLSelectElement;
      if (t.dataset.a === 'preset' && t.value !== '') {
        this.showScript(true);
        this.area.value = PRESETS[Number(t.value)].script;
        t.value = '';
      }
    });
    this.root.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.root.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
    this.print('Universe console: type help. Results show the formula they come from.', 'math');
  }

  toggle(): void {
    this.open = !this.open;
    this.root.classList.toggle('hidden', !this.open);
    if (this.open) setTimeout(() => this.input.focus(), 0);
    else this.input.blur();
  }

  /** Run a line or a script; returns the output lines (also printed). */
  run(src: string, echo = true): { ok: boolean; lines: string[] } {
    if (echo) for (const l of src.split('\n').filter((x) => x.trim())) this.print(`› ${l}`, 'cmd');
    const r = this.runner.run(src);
    for (const l of r.lines) this.print(l, l.startsWith('✗') ? 'err' : l.startsWith('  ') ? 'math' : '');
    this.god.panel.refresh();
    return r;
  }

  private print(text: string, cls: string): void {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = text;
    this.out.appendChild(d);
    while (this.out.childNodes.length > 400) this.out.firstChild?.remove();
    this.out.scrollTop = this.out.scrollHeight;
  }

  private key(e: KeyboardEvent): void {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const line = this.input.value.trim();
      if (!line) return;
      this.input.value = '';
      if (this.history[this.history.length - 1] !== line) this.history.push(line);
      if (this.history.length > 200) this.history.shift();
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history)); } catch { /* (no storage) */ }
      this.hpos = -1;
      this.run(line);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!this.history.length) return;
      if (this.hpos < 0) this.hpos = this.history.length;
      this.hpos = Math.max(0, Math.min(this.history.length, this.hpos + (e.key === 'ArrowUp' ? -1 : 1)));
      this.input.value = this.history[this.hpos] ?? '';
      e.preventDefault();
    } else if (e.key === 'Escape' || e.key === '`') {
      this.toggle();
      e.preventDefault();
    }
  }

  private showScript(on?: boolean): void {
    const show = on ?? this.area.classList.contains('hidden');
    this.area.classList.toggle('hidden', !show);
    this.root.querySelector('[data-row="script"]')!.classList.toggle('hidden', !show);
    if (show) this.area.focus();
  }

  private runScript(): void {
    try { localStorage.setItem(SCRIPT_KEY, this.area.value); } catch { /* (no storage) */ }
    this.run(this.area.value);
  }

  private click(ev: Event): void {
    const t = (ev.target as HTMLElement).closest<HTMLElement>('button[data-a]');
    if (!t) return;
    switch (t.dataset.a) {
      case 'help': this.run('help'); break;
      case 'script': this.showScript(); break;
      case 'close': this.toggle(); break;
      case 'run': this.runScript(); break;
      case 'clear': this.out.innerHTML = ''; break;
      case 'save': {
        const blob = new Blob([this.area.value], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'universe-script.txt';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        break;
      }
      case 'load': {
        // loaded into the editor, not run: press Run when it looks right
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.txt,text/plain';
        inp.onchange = () => { const f = inp.files?.[0]; if (f) void f.text().then((s) => { this.showScript(true); this.area.value = s; }); };
        inp.click();
        break;
      }
    }
  }
}
