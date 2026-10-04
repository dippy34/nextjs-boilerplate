import type { App } from '../app/App';
import { COLORS, type Panel } from '../vr/Panel';
import { bodyView, type BodyView } from './BodyView';
import { SPAWN_TYPES } from './God';
import {
  AU, type Derived, density, equilibriumTemp, escapeVelocity, M_EARTH, M_SUN, num, orbitalPeriod, schwarzschildRadius, surfaceGravity, surfaceTemp,
} from './physics';

/** derived value whose working is shown at the bottom of the tab */
let shownMath: string | null = null;

/**
 * The headset menu's God tab: the same editor as the desktop panel, with nudge buttons instead
 * of typed values. Left: physical properties; right: the orbit; tap a derived value to see its
 * formula with the numbers in. Below: create, N-body switch, undo and reset. The right grip
 * grabs and throws bodies.
 */
export function paintGodTab(p: Panel, a: { x: number; y: number; w: number; h: number }, app: App, close: () => void): void {
  const g = app.god;
  const sb = g.sandbox;
  g.vr.armed = true;
  const act = (f: () => void) => () => { f(); p.dirty = true; };
  // header: state of the universe
  p.text(!sb.active ? '● Real ephemeris' : sb.mode === 'nbody' ? '● N-body simulation' : '● Edited (Kepler orbits)', a.x + 10, a.y + 26, 28, sb.active ? COLORS.warn : COLORS.accent, 700);
  p.button('god:nbody', a.x + 720, a.y, 330, 60, sb.active && sb.mode === 'nbody' ? '✓ Simulate gravity' : 'Simulate gravity', act(() => g.setSimulation(!(sb.active && sb.mode === 'nbody'))), { size: 24, active: sb.active && sb.mode === 'nbody' });
  p.button('god:undo', a.x + 1064, a.y, 140, 60, '↶ Undo', act(() => g.undo()), { size: 24, disabled: !sb.canUndo });
  p.button('god:reset', a.x + 1218, a.y, 200, 60, '⟲ Real', act(() => g.reset()), { size: 24, disabled: !sb.active });
  p.button('god:pause', a.x + 1432, a.y, 88, 60, app.clock.paused ? '▶' : '⏸', act(() => app.togglePause()), { size: 28 });

  const id = g.selectedId();
  const v = id !== null ? bodyView(g, id) : null;
  const y0 = a.y + 76;
  if (id === null || !v) {
    p.text('Point at a planet, moon or star and pull the trigger to select it.', a.x + 10, y0 + 40, 28, COLORS.text);
  } else {
    p.text(v.name, a.x + 10, y0 + 22, 32, COLORS.sel, 700);
    const rowH = 56;
    // one editable value: label, value, four nudges
    const field = (col: number, r: number, key: string, label: string, value: string, nudges: [string, () => void][]) => {
      const x = a.x + 10 + col * 765, y = y0 + 48 + r * rowH;
      p.text(label, x, y + 26, 22, COLORS.dim, 600);
      p.text(value, x + 330, y + 26, 22, COLORS.text, 600, 'right');
      nudges.forEach(([t, f], i) => p.button(`god:${key}:${i}`, x + 345 + i * 98, y, 90, 48, t, act(f), { size: 20 }));
    };
    // one derived value: tap to see its working
    const derived = (col: number, r: number, key: string, label: string, d: Derived) => {
      const x = a.x + 10 + col * 765, y = y0 + 48 + r * rowH;
      p.button(`god:math:${key}`, x, y, 735, 48, '', act(() => { shownMath = shownMath === key ? null : key; }), { active: shownMath === key });
      p.text(`▸ ${label}`, x + 16, y + 26, 21, COLORS.dim);
      p.text(d.text, x + 720, y + 26, 21, COLORS.text, 600, 'right');
      if (shownMath === key) mathLine = d.math;
    };
    let mathLine: string | null = null;
    const scale = (f: (k: number) => void): [string, () => void][] => [['÷1.1', () => f(1 / 1.1)], ['−1%', () => f(0.99)], ['+1%', () => f(1.01)], ['×1.1', () => f(1.1)]];
    const add = (step: number, f: (d: number) => void): [string, () => void][] => [[`−${step * 10}`, () => f(-step * 10)], [`−${step}`, () => f(-step)], [`+${step}`, () => f(step)], [`+${step * 10}`, () => f(step * 10)]];
    const m = v.massKg;
    const massText = m >= 0.01 * M_SUN ? `${num(m / M_SUN)} M☉` : `${num(m / M_EARTH)} M⊕`;
    field(0, 0, 'mass', 'Mass', massText, scale((k) => g.setPhysical(v.id, { massKg: m * k })));
    if (v.kind === 'hole') {
      derived(0, 1, 'rs', 'event horizon r_s', schwarzschildRadius(m));
    } else {
      field(0, 1, 'radius', 'Radius', `${num(v.radius / 1e3)} km`, scale((k) => g.setPhysical(v.id, { radius: v.radius * k })));
      const rho = density(m, v.radius);
      field(0, 2, 'density', 'Density', `${num(rho.value)} g/cm³`, scale((k) => g.setPhysical(v.id, { densityKgM3: rho.value * 1000 * k })));
      const P = v.rotation;
      field(0, 3, 'rot', 'Rotation', v.locked ? 'locked' : P !== null && Number.isFinite(P) ? `${num(Math.abs(P) / 3600)} h${P < 0 ? ' retro' : ''}` : '—',
        [['÷2', () => spinBy(app, v, 0.5)], ['−10%', () => spinBy(app, v, 1 / 1.1)], ['+10%', () => spinBy(app, v, 1.1)], ['Reverse', () => g.spin(v.id, 'reverse')]]);
      field(0, 4, 'obl', 'Obliquity', `${num(v.obliquity)}°`, add(1, (d) => g.spin(v.id, { tiltDeg: Math.max(0, Math.min(180, v.obliquity + d)) })));
      derived(0, 5, 'g', 'surface gravity g', surfaceGravity(m, v.radius));
      derived(0, 6, 'vesc', 'escape velocity', escapeVelocity(m, v.radius));
      if (v.light) {
        const teq = equilibriumTemp(v.light.lum, v.light.d, v.albedo);
        derived(0, 7, 'ts', 'surface temperature', surfaceTemp(teq.value, v.greenhouse));
      }
    }
    if (v.orbit) {
      const el = v.orbit.el;
      const aM = el.q / (1 - el.e);
      const far = aM > 0.01 * AU;
      p.text(`orbits ${v.orbit.parentName}`, a.x + 10 + 765 + 320, y0 + 22, 22, COLORS.dim);
      field(1, 0, 'a', 'a', far ? `${num(aM / AU)} AU` : `${num(aM / 1e3)} km`, scale((k) => g.setOrbit(v.id, { a: aM * k })));
      field(1, 1, 'e', 'e', num(el.e), add(0.01, (d) => g.setOrbit(v.id, { e: Math.max(0, Math.min(0.99, el.e + d)) })));
      field(1, 2, 'i', 'i', `${num(el.i)}°`, add(1, (d) => g.setOrbit(v.id, { i: Math.max(0, Math.min(180, el.i + d)) })));
      derived(1, 3, 'P', 'period (Kepler III)', orbitalPeriod(aM, v.orbit.parentMassKg, m));
      const y = y0 + 48 + 4 * rowH, x = a.x + 10 + 765;
      const pre: [string, string, 'reverse' | 'circular' | 'escape' | 'stop' | 'push' | 'brake'][] = [['v:reverse', '⇄ Reverse', 'reverse'], ['v:circular', '◯ Circular', 'circular'], ['v:escape', '↗ Escape', 'escape'],
        ['v:stop', '■ Stop', 'stop'], ['v:push', '+15%', 'push'], ['v:brake', '−15%', 'brake']];
      pre.forEach(([k, t, w], i) => p.button(`god:${k}`, x + (i % 3) * 248, y + Math.floor(i / 3) * 56, 236, 48, t, act(() => g.preset(v.id, w)), { size: 21 }));
      p.button('god:del', x + 496, y + 112, 236, 48, '✕ Delete', act(() => g.remove(v.id)), { size: 21, color: COLORS.warn });
    } else {
      p.button('god:del', a.x + 10 + 765, y0 + 48, 236, 48, '✕ Delete', act(() => g.remove(v.id)), { size: 21, color: COLORS.warn });
    }
    if (mathLine) p.text(mathLine, a.x + 10, a.y + a.h - 172, 19, '#cfe3ff', 400, 'left', a.w - 20);
  }
  // creation
  const cy = a.y + a.h - 150;
  p.text('Create', a.x + 10, cy + 22, 26, COLORS.text, 700);
  p.button('god:laser', a.x + 1180, cy - 4, 340, 52, g.tool === 'place' ? 'Laser: on (trigger)' : 'Place with laser', act(() => { g.tool = g.tool === 'place' ? 'none' : 'place'; }), { size: 22, active: g.tool === 'place' });
  const cols = 10, cw = (a.w - 20 - (cols - 1) * 8) / cols;
  SPAWN_TYPES.forEach((t, i) => {
    const x = a.x + 10 + i * (cw + 8), y = cy + 56;
    p.button(`god:spawn:${t.type}`, x, y, cw, 62, t.label.replace(' planet', '').replace('Asteroid swarm', 'Swarm'), act(() => {
      g.placeType = t.type;
      g.placeMass = t.mass;
      if (g.tool === 'place') { close(); return; } // aim with the laser, then pull the trigger
      g.spawnNearSelection(t.type, t.mass);
    }), { size: 18, active: g.placeType === t.type && g.tool === 'place' });
  });
  p.text('Right grip on a body: grab it, move it, throw it.', a.x + 10, a.y + a.h - 6, 20, COLORS.dim);
}

/** Scale the rotation rate (a locked moon starts from its orbital period). */
function spinBy(app: App, v: BodyView, k: number): void {
  const P = v.rotation ?? (v.orbit ? orbitalPeriod(v.orbit.el.q / (1 - v.orbit.el.e), v.orbit.parentMassKg).value : 86400);
  if (!Number.isFinite(P) || P === 0) return;
  app.god.setRotation(v.id, Math.abs(P) / k, P < 0);
}
