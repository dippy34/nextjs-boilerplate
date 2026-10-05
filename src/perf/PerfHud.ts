import type { App } from '../app/App';
import { QUALITY } from '../render/Quality';
import { COLORS, Panel } from '../vr/Panel';
import { HISTORY, PERF } from './Perf';

/**
 * The perf HUD (F3, or Settings in the VR menu): frame time, CPU and GPU time, draw calls and
 * triangles, the quality level, a graph of the last 240 frames (bars: frame time against the
 * budget; line: draw calls), and the costliest lap timers (smoothed CPU ms per layer).
 * On a desktop a canvas in the corner; in a headset the same drawing on a small panel fixed to the
 * view, low and to the left.
 */
export class PerfHud {
  on = false;
  private canvas: HTMLCanvasElement;
  private vrPanel: Panel | null = null;
  private frame = 0;

  constructor(private app: App) {
    const c = this.canvas = document.createElement('canvas');
    c.width = 340; c.height = 300;
    c.id = 'perf-hud';
    c.style.cssText = 'position:fixed;top:8px;right:8px;width:340px;height:300px;z-index:40;pointer-events:none;display:none;border-radius:8px';
    document.body.appendChild(c);
    PERF.listeners.add(() => this.tick());
  }

  toggle(v = !this.on): void {
    this.on = v;
    this.canvas.style.display = v && !this.app.vr.active ? 'block' : 'none';
    if (!v && this.vrPanel) this.vrPanel.setVisible(false);
  }

  private tick(): void {
    if (!this.on || ++this.frame % (this.app.vr.active ? 18 : 6)) return;
    const vr = this.app.vr.active;
    this.canvas.style.display = vr ? 'none' : 'block';
    if (vr) {
      if (!this.vrPanel) {
        const p = this.vrPanel = new Panel(680, 600, 0.3, (pp) => this.draw(pp.ctx, pp.width, pp.height));
        p.mesh.position.set(-0.24, -0.16, -0.55);
        p.mesh.renderOrder = 1001;
        this.app.renderer.camera.add(p.mesh);
      }
      this.vrPanel.setVisible(true);
      this.vrPanel.dirty = true;
      this.vrPanel.update();
    } else {
      if (this.vrPanel) this.vrPanel.setVisible(false);
      const ctx = this.canvas.getContext('2d')!;
      ctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
      this.draw(ctx, 680, 600);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  /** Draw at 680 x 600. */
  private draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const xr = this.app.renderer.gl.xr;
    const rate = xr.isPresenting ? (xr.getSession() as XRSession & { frameRate?: number } | null)?.frameRate || 72 : 60;
    const budget = 1000 / rate;
    let sum = 0, cpu = 0, worst = 0, n = 0;
    for (let k = 0; k < 60; k++) {
      const i = (PERF.head - k + HISTORY) % HISTORY;
      if (!(PERF.frameMs[i] > 0)) continue;
      sum += PERF.frameMs[i]; cpu += PERF.cpuMs[i]; worst = Math.max(worst, PERF.frameMs[i]); n++;
    }
    const avg = n ? sum / n : 0;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(6,10,20,0.82)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '600 34px system-ui, sans-serif';
    ctx.fillStyle = avg > budget * 1.15 ? COLORS.warn : '#8f8';
    ctx.fillText(`${avg.toFixed(1)} ms  ${avg ? (1000 / avg).toFixed(0) : '-'} fps`, 18, 44);
    ctx.font = '500 24px system-ui, sans-serif';
    ctx.fillStyle = '#ccd';
    const gpu = PERF.gpuMs[PERF.head];
    ctx.fillText(`worst ${worst.toFixed(1)}  cpu ${(n ? cpu / n : 0).toFixed(1)}  gpu ${gpu >= 0 ? gpu.toFixed(1) : PERF.gpuAvailable ? '…' : 'n/a'}  Q${QUALITY.level}`, 18, 80);
    ctx.fillText(`${PERF.calls} calls  ${(PERF.triangles / 1000).toFixed(0)}k tris  budget ${budget.toFixed(1)} ms`, 18, 112);
    // graph: frame time bars (budget line), draw-call line
    const gx = 18, gy = 130, gw = w - 36, gh = 170;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(gx, gy, gw, gh);
    const maxMs = Math.max(budget * 3, 1);
    let maxCalls = 1;
    for (let k = 0; k < HISTORY; k++) maxCalls = Math.max(maxCalls, PERF.drawCalls[k]);
    const bw = gw / HISTORY;
    for (let k = 0; k < HISTORY; k++) {
      const i = (PERF.head + 1 + k) % HISTORY;
      const ms = PERF.frameMs[i];
      if (!(ms > 0)) continue;
      const bh = Math.min(1, ms / maxMs) * gh;
      ctx.fillStyle = ms > budget * 1.5 ? '#f55' : ms > budget * 1.15 ? '#fb4' : '#4c8';
      ctx.fillRect(gx + k * bw, gy + gh - bh, Math.max(1, bw), bh);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    const by = gy + gh - (budget / maxMs) * gh;
    ctx.beginPath(); ctx.moveTo(gx, by); ctx.lineTo(gx + gw, by); ctx.stroke();
    ctx.strokeStyle = '#6af';
    ctx.beginPath();
    for (let k = 0; k < HISTORY; k++) {
      const i = (PERF.head + 1 + k) % HISTORY;
      const y = gy + gh - (PERF.drawCalls[i] / maxCalls) * gh * 0.95;
      if (k) ctx.lineTo(gx + k * bw, y); else ctx.moveTo(gx, y);
    }
    ctx.stroke();
    ctx.font = '500 20px system-ui, sans-serif';
    ctx.fillStyle = '#6af';
    ctx.fillText(`calls (max ${maxCalls})`, gx + 6, gy + 22);
    // layers (CPU, smoothed)
    const laps = [...PERF.lapsAvg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    ctx.font = '500 23px ui-monospace, monospace';
    laps.forEach(([k, v], j) => {
      const x = gx + (j % 2) * (gw / 2), y = gy + gh + 36 + Math.floor(j / 2) * 32;
      ctx.fillStyle = v > budget * 0.25 ? COLORS.warn : '#ccd';
      ctx.fillText(`${k.padEnd(8)}${v.toFixed(2).padStart(6)}`, x, y);
    });
  }
}
