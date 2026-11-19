import { G0, SHIP_SPEC } from '../sim/ShipPhysics';
import { type FlightReadout, fmtClock, fmtDist, fmtSpeed, fmtTime, sasLabel } from './Flight';

const CSS = `
.fl-panel { position: absolute; right: 10px; top: 76px; width: 300px; background: rgba(4, 10, 20, 0.72); border: 1px solid rgba(120, 220, 255, 0.35);
  border-radius: 8px; padding: 8px 11px; font: 12px/1.45 ui-monospace, 'SF Mono', Menlo, Consolas, monospace; color: #cfe8ff; pointer-events: none; }
.fl-panel .t { color: #7fd4ff; font-weight: 700; letter-spacing: 0.08em; font-size: 11px; display: flex; justify-content: space-between; }
.fl-panel .row { display: flex; justify-content: space-between; gap: 8px; }
.fl-panel .k { color: #7f9bb8; }
.fl-panel .v { color: #fff; text-align: right; }
.fl-panel .bad { color: #ff7a6a; }
.fl-panel .ok { color: #9dff8a; }
.fl-panel .bar { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; margin: 2px 0 4px; overflow: hidden; }
.fl-panel .bar i { display: block; height: 100%; background: #7fd4ff; }
.fl-panel .sep { border-top: 1px solid rgba(120, 220, 255, 0.18); margin: 4px 0; }
.fl-warn { position: absolute; top: 92px; left: 50%; transform: translateX(-50%); font: 700 20px/1.2 system-ui, sans-serif; letter-spacing: 0.06em;
  padding: 6px 16px; border-radius: 6px; pointer-events: none; text-shadow: 0 0 6px #000; white-space: nowrap; }
.fl-warn.l1 { color: #ffd166; background: rgba(40, 30, 0, 0.45); }
.fl-warn.l2 { color: #ff5a4a; background: rgba(50, 0, 0, 0.5); animation: fl-blink 0.8s steps(2) infinite; }
@keyframes fl-blink { 50% { opacity: 0.55; } }
.fl-end { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;
  font-family: system-ui, sans-serif; text-align: center; opacity: 0; transition: opacity 0.6s; }
.fl-end h1 { font-size: 54px; letter-spacing: 0.2em; margin: 0 0 14px; color: #fff; text-shadow: 0 0 24px rgba(255,120,80,0.8); }
.fl-end p { font-size: 17px; max-width: 640px; color: #e8eef8; text-shadow: 0 0 6px #000; margin: 0 20px; }
.fl-keys { position: absolute; right: 14px; bottom: 54px; font: 11px/1.5 system-ui, sans-serif; color: rgba(200, 220, 240, 0.7); text-align: right; pointer-events: none;
  background: rgba(4, 10, 20, 0.5); border-radius: 6px; padding: 6px 9px; }
.fl-keys b { color: #cfe8ff; font-weight: 600; }
`;

/** Desktop flight instruments: orbit, speeds, engine and clocks; warnings; the end-of-flight card. */
export class FlightHud {
  private el: HTMLElement;
  private panel: HTMLElement;
  private warn: HTMLElement;
  private end: HTMLElement;
  private keys: HTMLElement;
  private timer = 0;
  private lastWarn = '';

  constructor(root: HTMLElement) {
    if (!document.getElementById('flight-css')) {
      const st = document.createElement('style');
      st.id = 'flight-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    this.el = document.createElement('div');
    this.el.className = 'flight-hud';
    this.el.innerHTML = `<div class="fl-panel"></div><div class="fl-warn"></div><div class="fl-end"><h1></h1><p></p></div>
      <div class="fl-keys"><b>W/S</b> throttle · <b>Z/X</b> full/cut · <b>arrows/drag</b> pitch-yaw · <b>Q/E</b> roll<br>
      <b>A/D R/F Shift+W/S</b> RCS · <b>Y</b> SAS mode · <b>I</b> boosted drive · <b>[ ]</b> time warp · <b>J</b> warp drive</div>`;
    root.appendChild(this.el);
    this.panel = this.el.querySelector('.fl-panel')!;
    this.warn = this.el.querySelector('.fl-warn')!;
    this.end = this.el.querySelector('.fl-end')!;
    this.keys = this.el.querySelector('.fl-keys')!;
    this.setVisible(false);
  }

  setVisible(v: boolean): void {
    this.el.style.display = v ? '' : 'none';
  }

  /** End-of-flight card: title/text with opacity 0..1. */
  setEnd(title: string, text: string, opacity: number): void {
    (this.end.querySelector('h1') as HTMLElement).textContent = title;
    (this.end.querySelector('p') as HTMLElement).textContent = text;
    this.end.style.opacity = String(opacity);
    this.end.style.transition = opacity > 0 ? 'opacity 0.6s' : 'none';
  }

  update(dt: number, r: FlightReadout, showKeys: boolean): void {
    this.keys.style.display = showKeys ? '' : 'none';
    if (r.warning !== this.lastWarn) {
      this.lastWarn = r.warning;
      this.warn.textContent = r.warning;
      this.warn.className = `fl-warn ${r.warning ? `l${r.warnLevel}` : ''}`;
      this.warn.style.display = r.warning ? '' : 'none';
    }
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.1;
    const c = r.conic;
    const row = (k: string, v: string, cls = '') => `<div class="row"><span class="k">${k}</span><span class="v ${cls}">${v}</span></div>`;
    const bound = c && c.e < 1;
    let orbit = '';
    if (r.landed) orbit = row('status', `landed on ${r.landed}`, 'ok');
    else if (c || Number.isFinite(r.pe)) {
      if (Number.isFinite(r.ap) && (bound || r.ap > 0)) orbit += row('apoapsis', `${fmtDist(r.ap)} <span class="k">in</span> ${fmtTime(r.tAp)}`);
      else orbit += row('apoapsis', r.escape ? 'escape' : 'unbound', 'bad');
      orbit += row('periapsis', `${fmtDist(r.pe)}${Number.isFinite(r.tPe) ? ` <span class="k">in</span> ${fmtTime(r.tPe)}` : ''}`, r.pe < 0 ? 'bad' : '');
      if (c && bound) orbit += row('period · e · i', `${fmtTime(c.period)} · ${c.e.toFixed(3)} · ${(c.inc * 57.2958).toFixed(1)}°`);
    }
    if (Number.isFinite(r.tImpact) && !r.landed) orbit += row('impact in', fmtTime(r.tImpact), 'bad');
    if (r.encounter) orbit += row('encounter', r.encounter, 'ok');
    const warp = r.rate <= 0 ? 'paused' : `×${r.rate.toLocaleString()}${r.rails ? ' rails' : r.rate > 1 ? ' physics' : ''}${r.limited ? ' (limited)' : ''}`;
    const dil = r.dilation < 0.9999 ? ` <span class="bad">×${r.dilation.toPrecision(3)}</span>` : '';
    this.panel.innerHTML = `
      <div class="t"><span>ORBIT · ${r.frame.toUpperCase()}</span><span>${r.boosted ? 'BOOSTED' : 'REAL'}</span></div>
      ${row('altitude', fmtDist(r.altitude))}
      ${row('vertical', `${r.vertSpeed >= 0 ? '+' : ''}${fmtSpeed(r.vertSpeed)}`, r.vertSpeed < -50 && r.altitude < 20e3 ? 'bad' : '')}
      ${row('orbital · surface', `${fmtSpeed(r.orbitSpeed)} · ${fmtSpeed(r.surfSpeed)}`)}
      ${orbit}
      <div class="sep"></div>
      ${row('throttle', `${Math.round(r.throttle * 100)} %`)}<div class="bar"><i style="width:${r.throttle * 100}%"></i></div>
      ${row('propellant · Δv', `${r.boosted ? '∞' : `${Math.round(r.fuel * 100)} %`} · ${Number.isFinite(r.dv) ? fmtSpeed(r.dv) : '∞'}`, r.fuel < 0.1 && !r.boosted ? 'bad' : '')}
      ${row('g-force', `${r.gForce.toFixed(2)} g`, r.gForce > 6 ? 'bad' : '')}
      ${row('SAS', sasLabel(r.sas))}
      ${r.tidal > 0.01 ? row('tides', `${(r.tidal / G0).toPrecision(3)} g / ${(SHIP_SPEC.tidalLimit / G0).toFixed(0)} g`, r.tidal > SHIP_SPEC.tidalLimit * 0.3 ? 'bad' : '') : ''}
      ${r.hullTemp > 500 ? row('hull', `${Math.round(r.hullTemp)} K`, r.hullTemp > 1800 ? 'bad' : '') : ''}
      <div class="sep"></div>
      ${row('time warp', warp)}
      ${row('ship clock', fmtClock(r.shipTime) + dil)}
      ${row('universe clock', fmtClock(r.universeTime))}
      ${r.massLock ? row('warp drive', 'mass-locked', 'bad') : row('warp drive', 'ready', 'ok')}`;
  }
}
