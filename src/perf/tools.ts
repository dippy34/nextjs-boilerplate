import { Matrix4, Vector3 } from 'three';
import type { App } from '../app/App';
import { COLORS, Panel } from '../vr/Panel';
import { Bench, SCENES, type BenchProgress } from './Bench';
import type { BenchResult } from './benchCode';
import { PERF } from './Perf';
import { PerfHud } from './PerfHud';

/**
 * Perf tools wiring: the perf HUD (F3), the benchmark (title screen, VR menu, ?bench=1), its
 * progress banner and result panel (desktop: a page panel with the code and a Copy button; in a
 * headset: a panel in front of you with the numbers, the code is copied after taking it off).
 */
export const PERF_TOOLS = {
  hud: null as PerfHud | null,
  bench: null as Bench | null,
  toggleHud(): void { this.hud?.toggle(); },
  runBench(): void { this.bench?.start(); },
};

const fps = (ms: number) => (ms > 0 ? Math.round(1000 / ms) : 0);

export function installPerfTools(app: App, closeTitle?: () => void): void {
  PERF.attach(app.renderer.gl);
  const hud = PERF_TOOLS.hud = new PerfHud(app);
  const bench = PERF_TOOLS.bench = new Bench(app);
  const ui = new BenchUi(app, bench);
  bench.onProgress = (p) => ui.progress(p);
  bench.onDone = (r) => ui.show(r.result, r.code);
  const q = new URLSearchParams(location.search);
  if (q.get('perf') === '1') hud.toggle(true);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'F3') { hud.toggle(); e.preventDefault(); }
    else if (e.code === 'Escape' && bench.running) bench.cancel();
  });
  if (q.get('bench') === '1') {
    // let the first frames (shader warm-up) pass, then leave the title screen and run
    let n = 0;
    const wait = () => { if (++n < 30) { PERF.listeners.add(once); return; } closeTitle?.(); bench.start(); };
    const once = () => { PERF.listeners.delete(once); wait(); };
    PERF.listeners.add(once);
  }
  (window as unknown as { perfTools: typeof PERF_TOOLS }).perfTools = PERF_TOOLS;
}

class BenchUi {
  private banner: HTMLDivElement;
  private vrPanel: Panel | null = null;
  private vrText: { title: string; lines: string[]; code?: string } = { title: '', lines: [] };
  private lastSec = -1;

  constructor(private app: App, private bench: Bench) {
    const style = document.createElement('style');
    style.textContent = `
#bench-banner{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:60;background:rgba(6,10,20,.88);color:#dde;font:600 16px system-ui,sans-serif;padding:10px 18px;border-radius:10px;border:1px solid #345;display:none}
#bench-banner button{margin-left:14px;font:inherit;background:#234;color:#dde;border:1px solid #456;border-radius:6px;padding:3px 10px;cursor:pointer}
#bench-result{position:fixed;inset:0;z-index:70;background:rgba(2,4,10,.92);color:#e6e9f2;font:15px system-ui,sans-serif;overflow:auto;padding:24px 16px}
#bench-result .br{max-width:980px;margin:0 auto}
#bench-result h2{font-size:28px;margin:0 0 6px}
#bench-result .dev{color:#9aa;font-size:13px;margin-bottom:14px;word-break:break-word}
#bench-result table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
#bench-result th,#bench-result td{padding:6px 8px;border-bottom:1px solid #223;text-align:right;white-space:nowrap}
#bench-result th:first-child,#bench-result td:first-child{text-align:left}
#bench-result td.bad{color:#ff7b6b}#bench-result td.ok{color:#8f8}
#bench-result .tw{overflow-x:auto}
#bench-result textarea{width:100%;box-sizing:border-box;height:120px;font:13px ui-monospace,monospace;background:#0b1220;color:#cfe;border:1px solid #345;border-radius:8px;padding:8px;margin-top:6px}
#bench-result .row{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;align-items:center}
#bench-result button{font:600 17px system-ui,sans-serif;padding:10px 22px;border-radius:8px;border:1px solid #4a6;background:#1d3a28;color:#dfe;cursor:pointer}
#bench-result button.sec{border-color:#456;background:#1a2433}`;
    document.head.appendChild(style);
    const b = this.banner = document.createElement('div');
    b.id = 'bench-banner';
    document.body.appendChild(b);
  }

  progress(p: BenchProgress): void {
    if (p.index < 0) { this.banner.style.display = 'none'; this.dropVr(); return; }
    const sec = Math.ceil(p.left);
    if (sec === this.lastSec && this.banner.style.display === 'block') return;
    this.lastSec = sec;
    const what = `Benchmark ${p.index + 1}/${p.total}: ${p.scene.label} · ${p.phase === 'settle' ? 'settling' : 'measuring'} ${sec} s`;
    if (this.app.vr.active) {
      this.banner.style.display = 'none';
      this.vrShow({ title: 'Benchmark running', lines: [what, '', 'Hold still and look ahead. Results follow.'] });
      return;
    }
    this.banner.style.display = 'block';
    this.banner.textContent = what;
    const c = document.createElement('button');
    c.textContent = 'Cancel (Esc)';
    c.onclick = () => this.bench.cancel();
    this.banner.appendChild(c);
  }

  show(r: BenchResult, code: string): void {
    this.banner.style.display = 'none';
    const budget = 1000 / r.hz;
    const lines = r.s.map((s) => `${(SCENES.find((x) => x.id === s.id)?.label ?? s.id).padEnd(26)} ${fps(s.med).toString().padStart(3)} fps  ${s.med.toFixed(1).padStart(5)} ms  1%low ${s.low.toFixed(0).padStart(3)}  drops ${s.drop}`);
    if (this.app.vr.active) this.vrShow({ title: `Benchmark done · ${r.hz} Hz`, lines: [...lines, '', 'Take the headset off: the code to paste is on the page.'], code });
    document.getElementById('bench-result')?.remove();
    const root = document.createElement('div');
    root.id = 'bench-result';
    const rows = r.s.map((s) => {
      const label = SCENES.find((x) => x.id === s.id)?.label ?? s.id;
      const cls = s.med > budget * 1.1 ? 'bad' : 'ok';
      return `<tr><td>${label}</td><td class="${cls}">${fps(s.med)}</td><td class="${cls}">${s.med.toFixed(1)}</td><td>${s.low.toFixed(1)}</td><td>${s.drop}/${s.n}</td>`
        + `<td>${s.cpu.toFixed(1)}</td><td>${s.gpu >= 0 ? s.gpu.toFixed(1) : '–'}</td><td>${Math.round(s.dc)}</td><td>${Math.round(s.tri)}k</td><td>${s.heap >= 0 ? Math.round(s.heap) : '–'}</td><td>${s.q}</td>`
        + `<td style="text-align:left">${s.top.slice(0, 3).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', ')}</td></tr>`;
    }).join('');
    root.innerHTML = `<div class="br"><h2>Benchmark</h2>
<div class="dev">${esc(r.gl)} · ${r.xr ? `headset ${r.xr[0]}×${r.xr[1]} per eye` : `canvas ${r.px[0]}×${r.px[1]}`} · ${r.hz} Hz (budget ${budget.toFixed(1)} ms) · GPU timer ${r.gq ? 'yes' : 'no'}<br>${esc(r.ua)}</div>
<div class="tw"><table><thead><tr><th>Scene</th><th>fps</th><th>median ms</th><th>1% low</th><th>dropped</th><th>CPU ms</th><th>GPU ms</th><th>calls</th><th>tris</th><th>heap MB</th><th>Q</th><th>slowest layers (CPU ms)</th></tr></thead><tbody>${rows}</tbody></table></div>
<p style="margin:18px 0 0">Send this code (${code.length} characters) to the coordinator:</p>
<textarea readonly spellcheck="false"></textarea>
<div class="row"><button class="copy">Copy code</button><button class="sec again">Run again</button><button class="sec close">Close</button><span class="msg"></span></div></div>`;
    document.body.appendChild(root);
    const ta = root.querySelector('textarea')!;
    ta.value = code;
    const msg = root.querySelector('.msg') as HTMLElement;
    const select = () => { ta.focus(); ta.select(); ta.setSelectionRange(0, code.length); };
    root.querySelector('.copy')!.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(code); msg.textContent = 'Copied.'; return; } catch { /* fall back */ }
      select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* */ }
      msg.textContent = ok ? 'Copied.' : 'Selected: press Ctrl+C (or long-press → Copy).';
    });
    ta.addEventListener('focus', select);
    root.querySelector('.again')!.addEventListener('click', () => { root.remove(); this.bench.start(); });
    root.querySelector('.close')!.addEventListener('click', () => root.remove());
  }

  private vrShow(t: { title: string; lines: string[]; code?: string }): void {
    this.vrText = t;
    if (!this.vrPanel) {
      const p = this.vrPanel = new Panel(1300, 820, 1.25, (pp) => this.paintVr(pp));
      this.app.renderer.rig.add(p.mesh);
      this.app.vr.extraPanels.push(p);
      // in front of the head, a little low, facing it
      const cam = this.app.renderer.camera;
      const head = cam.position.clone();
      const fwd = new Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      fwd.y = 0;
      if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1);
      const pos = head.clone().addScaledVector(fwd.normalize(), 1.6);
      pos.y -= 0.2;
      p.mesh.position.copy(pos);
      p.mesh.quaternion.setFromRotationMatrix(new Matrix4().lookAt(head, pos, new Vector3(0, 1, 0)));
    }
    this.vrPanel.dirty = true;
    this.vrPanel.update();
  }

  private paintVr(p: Panel): void {
    const t = this.vrText;
    p.rect(4, 4, p.width - 8, p.height - 8, 36, COLORS.bg, COLORS.border, 4);
    p.text(t.title, 50, 80, 48, '#ffffff', 600);
    p.ctx.font = '500 26px ui-monospace, monospace';
    t.lines.forEach((l, i) => { p.ctx.fillStyle = COLORS.text; p.ctx.fillText(l, 50, 150 + i * 40); });
    if (t.code) {
      p.button('bench:close', p.width - 260, 30, 210, 76, 'Close', () => this.dropVr(), { size: 30 });
      p.button('bench:again', p.width - 500, 30, 220, 76, 'Run again', () => { this.dropVr(); this.bench.start(); }, { size: 30 });
    } else {
      p.button('bench:cancel', p.width - 260, 30, 210, 76, 'Cancel', () => this.bench.cancel(), { size: 30, color: COLORS.warn });
    }
  }

  private dropVr(): void {
    const p = this.vrPanel;
    if (!p) return;
    p.mesh.removeFromParent();
    const list = this.app.vr.extraPanels;
    if (list.includes(p)) list.splice(list.indexOf(p), 1);
    this.vrPanel = null;
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
