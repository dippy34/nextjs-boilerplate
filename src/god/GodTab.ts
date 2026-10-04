import type { App } from '../app/App';
import { COLORS, type Panel } from '../vr/Panel';
import { GM_EARTH, GM_SUN, SPAWN_TYPES } from './God';

/**
 * The headset menu's God tab: the sandbox switch, the selection's mass, velocity and spin, and
 * creation (next to the selection, or with the laser). The right grip grabs and throws bodies.
 */
export function paintGodTab(p: Panel, a: { x: number; y: number; w: number; h: number }, app: App, close: () => void): void {
  const g = app.god;
  const sb = g.sandbox;
  g.vr.armed = true;
  const act = (f: () => void) => () => { f(); p.dirty = true; };
  // status and universe
  p.text(sb.active ? '● Sandbox (simulated)' : '● Real ephemeris', a.x + 10, a.y + 34, 32, sb.active ? COLORS.warn : COLORS.accent, 700);
  p.text(sb.active ? `${sb.entities.size} bodies${sb.lagging ? ' · simulation behind' : ''}` : 'Change anything: the universe becomes a live simulation', a.x + 10, a.y + 74, 24, COLORS.dim);
  p.button('god:reset', a.x + 900, a.y, 300, 76, '⟲ Real universe', act(() => g.reset()), { size: 26, disabled: !sb.active });
  p.button('god:undo', a.x + 1214, a.y, 160, 76, '↶ Undo', act(() => g.undo()), { size: 26, disabled: !sb.canUndo });
  p.button('god:pause', a.x + 1388, a.y, 132, 76, app.clock.paused ? '▶' : '⏸', act(() => app.togglePause()), { size: 30 });

  const id = g.selectedId();
  const e = id !== null ? sb.entityOf(id) : null;
  const sel = app.selection;
  const y0 = a.y + 110;
  if (id === null || !sel) {
    p.text('Point at a planet, moon or star and pull the trigger to select it.', a.x + 10, y0 + 40, 28, COLORS.text);
  } else {
    const gm = e?.gm ?? (sel as { gm?: number }).gm ?? 0;
    const mass = gm >= 0.01 * GM_SUN ? `${(gm / GM_SUN).toPrecision(3)} Suns` : `${(gm / GM_EARTH).toPrecision(3)} Earths`;
    p.text(sel.name, a.x + 10, y0 + 30, 36, COLORS.sel, 700);
    p.text(`mass ${mass}`, a.x + 420, y0 + 30, 26, COLORS.text);
    const bw = 180, bh = 74, gap = 12;
    const row = (r: number, label: string, items: [string, string, () => void, boolean?][]) => {
      const y = y0 + 64 + r * (bh + gap);
      p.text(label, a.x + 10, y + bh / 2 + 2, 26, COLORS.dim, 600);
      items.forEach(([key, text, f, dis], i) => p.button(`god:${key}`, a.x + 170 + i * (bw + gap), y, bw, bh, text, act(f), { size: 24, disabled: dis }));
    };
    row(0, 'Mass', [['m:0.1', '÷10', () => g.scaleMass(id, 0.1)], ['m:0.5', '÷2', () => g.scaleMass(id, 0.5)], ['m:2', '×2', () => g.scaleMass(id, 2)],
      ['m:10', '×10', () => g.scaleMass(id, 10)], ['m:1000', '×1000', () => g.scaleMass(id, 1000)], ['del', '✕ Delete', () => g.remove(id)]]);
    row(1, 'Orbit', [['v:reverse', '⇄ Reverse', () => g.preset(id, 'reverse')], ['v:stop', '■ Stop', () => g.preset(id, 'stop')],
      ['v:circular', '◯ Circular', () => g.preset(id, 'circular')], ['v:escape', '↗ Escape', () => g.preset(id, 'escape')],
      ['v:push', '+15%', () => g.preset(id, 'push')], ['v:brake', '−15%', () => g.preset(id, 'brake')]]);
    row(2, 'Spin', [['s:faster', 'Faster', () => g.spin(id, 'faster')], ['s:slower', 'Slower', () => g.spin(id, 'slower')],
      ['s:reverse', 'Reverse', () => g.spin(id, 'reverse')], ['s:tilt0', 'Tilt 0°', () => g.spin(id, { tiltDeg: 0 })],
      ['s:tilt90', 'Tilt 90°', () => g.spin(id, { tiltDeg: 90 })], ['r:2', 'Size ×2', () => g.scaleRadius(id, 2)]]);
  }
  // creation
  const cy = a.y + 470;
  p.text('Create', a.x + 10, cy + 30, 30, COLORS.text, 700);
  p.button('god:laser', a.x + 1180, cy, 340, 64, g.tool === 'place' ? 'Laser: on (trigger)' : 'Place with laser', act(() => { g.tool = g.tool === 'place' ? 'none' : 'place'; }), { size: 24, active: g.tool === 'place' });
  const cols = 5, cw = (a.w - 20 - (cols - 1) * 12) / cols;
  SPAWN_TYPES.forEach((t, i) => {
    const x = a.x + 10 + (i % cols) * (cw + 12), y = cy + 80 + Math.floor(i / cols) * 92;
    p.button(`god:spawn:${t.type}`, x, y, cw, 80, t.label, act(() => {
      g.placeType = t.type;
      g.placeMass = t.mass;
      if (g.tool === 'place') { close(); return; } // aim with the laser, then pull the trigger
      g.spawnNearSelection(t.type, t.mass);
    }), { size: 24, active: g.placeType === t.type && g.tool === 'place' });
  });
  p.text('Right grip on a body: grab it, move it, throw it.', a.x + 10, a.y + a.h - 12, 24, COLORS.dim);
}
