/** Minimal Phase-1 heads-up display. Full UI (search panel, bookmarks, settings) arrives in Phase 5. */
export interface HudState {
  date: string;
  rate: string;
  paused: boolean;
  fps: number;
  speed: string;
  altitude: string;
  reference: string;
  selection: { name: string; rows: [string, string][]; distance: string } | null;
  stars: string;
  loading: string;
  depthMode: string;
  ephemeris: string;
  autopilot: boolean;
}

const HELP: [string, string][] = [
  ['Left drag', 'Look around'],
  ['Right drag / Shift+drag', 'Orbit around selection'],
  ['Wheel', 'Zoom to selection (or change flight speed)'],
  ['W A S D  R F', 'Fly (speed scales with altitude)'],
  ['Shift / Ctrl', '×10 / ×0.1 speed'],
  ['Q / E', 'Roll'],
  ['Click', 'Select object'],
  ['G', 'Go to selection'],
  ['C', 'Centre selection'],
  ['Enter or /', 'Find object by name'],
  ['Space', 'Pause / resume time'],
  ['[  ]', 'Slower / faster time'],
  ['\\', 'Reverse time'],
  ['Backspace', 'Real time, now'],
  ['L / O / M', 'Labels / orbits / minor-body orbits'],
  ['P', 'Screenshot (PNG)'],
  ['Esc', 'Stop autopilot / clear selection'],
  ['H', 'Toggle this help'],
];

export class Hud {
  private el: HTMLElement;
  private top: HTMLElement;
  private time: HTMLElement;
  private info: HTMLElement;
  private bottom: HTMLElement;
  private help: HTMLElement;
  private toastEl: HTMLElement;
  private search: HTMLElement;
  private searchInput: HTMLInputElement;
  private searchList: HTMLElement;
  private toastTimer = 0;
  onSearch: ((q: string) => { label: string; detail: string; id: string }[]) | null = null;
  onSearchPick: ((id: string) => void) | null = null;

  constructor(root: HTMLElement) {
    this.el = root;
    root.innerHTML = `
      <div class="hud-top"></div>
      <div class="hud-time"></div>
      <div class="hud-info"></div>
      <div class="hud-bottom"></div>
      <div class="hud-help hidden"><h3>Controls</h3><table>${HELP.map(([k, v]) => `<tr><td><kbd>${k}</kbd></td><td>${v}</td></tr>`).join('')}</table></div>
      <div class="hud-toast"></div>
      <div class="hud-search hidden"><input type="text" placeholder="Find: planet, moon, star, comet…" spellcheck="false"/><div class="results"></div></div>`;
    this.top = root.querySelector('.hud-top')!;
    this.time = root.querySelector('.hud-time')!;
    this.info = root.querySelector('.hud-info')!;
    this.bottom = root.querySelector('.hud-bottom')!;
    this.help = root.querySelector('.hud-help')!;
    this.toastEl = root.querySelector('.hud-toast')!;
    this.search = root.querySelector('.hud-search')!;
    this.searchInput = this.search.querySelector('input')!;
    this.searchList = this.search.querySelector('.results')!;
    this.searchInput.addEventListener('input', () => this.refreshSearch());
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeSearch();
      if (e.key === 'Enter') {
        const first = this.searchList.querySelector<HTMLElement>('[data-id]');
        if (first) this.pick(first.dataset.id!);
      }
      e.stopPropagation();
    });
    this.searchList.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
      if (t) this.pick(t.dataset.id!);
    });
  }

  get searchOpen(): boolean {
    return !this.search.classList.contains('hidden');
  }

  openSearch(): void {
    this.search.classList.remove('hidden');
    this.searchInput.value = '';
    this.searchList.innerHTML = '';
    this.searchInput.focus();
  }

  closeSearch(): void {
    this.search.classList.add('hidden');
    this.searchInput.blur();
  }

  private pick(id: string): void {
    this.closeSearch();
    this.onSearchPick?.(id);
  }

  private refreshSearch(): void {
    const q = this.searchInput.value.trim();
    const res = q && this.onSearch ? this.onSearch(q) : [];
    this.searchList.innerHTML = res
      .map((r) => `<div class="result" data-id="${escapeHtml(r.id)}"><span>${escapeHtml(r.label)}</span><small>${escapeHtml(r.detail)}</small></div>`)
      .join('');
  }

  toggleHelp(): void {
    this.help.classList.toggle('hidden');
  }

  toast(msg: string): void {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), 2200);
  }

  update(s: HudState): void {
    this.top.innerHTML = `<b>SPACE EXPLORER</b> <span class="dim">Phase 1</span> &nbsp; ${s.fps.toFixed(0)} fps · ${s.stars}${s.loading ? ` · <span class="warn">${s.loading}</span>` : ''} &nbsp; <span class="dim">H: help</span>`;
    this.time.innerHTML = `<div class="date">${s.date}</div><div class="rate">${s.paused ? '<span class="warn">PAUSED</span>' : s.rate}</div><div class="dim small">${s.ephemeris}</div>`;
    if (s.selection) {
      this.info.innerHTML = `<div class="name">${escapeHtml(s.selection.name)}</div>
        <table>${[['Distance', s.selection.distance] as [string, string], ...s.selection.rows].map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>
        <div class="dim small">G: go to · C: centre · right-drag: orbit</div>`;
      this.info.classList.remove('hidden');
    } else {
      this.info.classList.add('hidden');
    }
    this.bottom.innerHTML = `${s.autopilot ? '<span class="warn">AUTOPILOT</span> · ' : ''}Speed ${s.speed} · Altitude ${s.altitude} · Reference: ${escapeHtml(s.reference)} <span class="dim">· depth: ${s.depthMode}</span>`;
  }

  get root(): HTMLElement {
    return this.el;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
