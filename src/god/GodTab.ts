import type { App } from '../app/App';
import { COLORS, FONT, type Panel } from '../vr/Panel';
import { QUICK_CREATE } from './Actions';
import { bodyView, type BodyView } from './BodyView';
import { SPAWN_TYPES } from './God';
import { PRESETS } from './script/ConsoleUI';
import {
  AU, type Derived, density, equilibriumTemp, escapeVelocity, M_EARTH, M_SUN, num, orbitalPeriod, schwarzschildRadius, surfaceGravity, surfaceTemp,
} from './physics';
import { HINT_STEPS } from './verbs';

/** derived value whose working is shown at the bottom of the tab */
let shownMath: string | null = null;
/** what the last preset script said */
let scriptSaid: string | null = null;

/** the full editor is showing instead of the simple verbs */
let advanced = false;

/**
 * The headset menu's God tab. Simple first: the selection's name in big type, eight big verbs
 * (heavier, lighter, bigger, smaller, push with the laser, faster, reverse, delete), the caption
 * saying what the physics did, three big Create buttons, undo and reset, and the "Try:" guide.
 * "Advanced" swaps in the full editor (paintGodAdvanced).
 */
export function paintGodTab(p: Panel, a: { x: number; y: number; w: number; h: number }, app: App, close: () => void): void {
  if (advanced) { paintGodAdvanced(p, a, app, close); return; }
  const g = app.god, sb = g.sandbox, act = g.actions;
  g.vr.armed = true;
  const run = (f: () => void) => () => { f(); p.dirty = true; };
  const id = g.selectedId();
  const v = id !== null ? bodyView(g, id) : null;
  // header: the selection, big; undo, reset, advanced
  if (v) {
    p.text(v.name, a.x + 10, a.y + 28, 50, COLORS.sel, 700, 'left', 700);
    const kind = v.kind === 'hole' ? 'black hole' : v.kind;
    p.text(`${kind}${v.orbit ? ` · orbits ${v.orbit.parentName}` : ''}${sb.active ? (sb.mode === 'nbody' ? ' · gravity simulated' : ' · edited') : ''}`, a.x + 12, a.y + 76, 24, COLORS.dim, 400, 'left', 760);
  } else {
    p.text('Pick something', a.x + 10, a.y + 28, 50, COLORS.sel, 700);
    p.text('Point at a planet, moon or star and pull the trigger', a.x + 12, a.y + 76, 24, COLORS.dim);
  }
  p.button('god:undo', a.x + 800, a.y, 220, 76, '↶ Undo', run(() => act.undo()), { size: 32, disabled: !sb.canUndo });
  p.button('god:reset', a.x + 1034, a.y, 250, 76, '⟲ Real', run(() => act.reset()), { size: 32, disabled: !sb.active, sub: 'universe' });
  p.button('god:adv', a.x + 1298, a.y, 222, 76, '⚙ Advanced', run(() => { advanced = true; }), { size: 28 });
  // the verbs: 4 x 2 big buttons
  const top = a.y + 110, bw = (a.w - 3 * 14) / 4, bh = 112;
  const verb = (i: number, key: string, label: string, sub: string, f: () => void, opts: { disabled?: boolean; color?: string; active?: boolean } = {}) => {
    const x = a.x + (i % 4) * (bw + 14), y = top + Math.floor(i / 4) * (bh + 14);
    p.button(`god:v:${key}`, x, y, bw, bh, label, run(f), { size: 36, sub, ...opts, disabled: opts.disabled || !v });
  };
  const vid = v?.id ?? null;
  verb(0, 'heavier', '⬆ Heavier', '2× the mass', () => act.run('heavier', vid));
  verb(1, 'lighter', '⬇ Lighter', 'half the mass', () => act.run('lighter', vid));
  verb(2, 'bigger', '⤢ Bigger', '2× the size', () => act.run('bigger', vid), { disabled: v?.kind === 'hole' });
  verb(3, 'smaller', '⤡ Smaller', 'half the size', () => act.run('smaller', vid), { disabled: v?.kind === 'hole' });
  verb(4, 'push', '➜ Push', g.tool === 'push' ? 'aim, pull trigger' : 'aim with the laser', () => {
    g.tool = 'push';
    app.vr?.flash('Aim the laser where to push it, pull the trigger');
    close();
  }, { disabled: !v?.orbit, active: g.tool === 'push' });
  verb(5, 'faster', '⏩ Faster', '+20% speed forward', () => act.run('push', vid, 'forward'), { disabled: !v?.orbit });
  verb(6, 'reverse', '⇄ Reverse', 'orbit the other way', () => act.run('reverse', vid), { disabled: !v?.orbit });
  verb(7, 'delete', '✕ Delete', 'its moons stay', () => act.run('delete', vid), { color: COLORS.warn });
  // what the physics did
  const cy = top + 2 * (bh + 14) + 4, ch = 118;
  const fresh = act.caption && performance.now() - act.captionAt < 3000;
  p.rect(a.x, cy, a.w, ch, 18, fresh ? 'rgba(255, 200, 100, 0.16)' : 'rgba(0, 0, 0, 0.35)', fresh ? '#ffd27a' : 'rgba(255, 200, 100, 0.3)', 3);
  wrap(p, act.caption || 'Press a button: the orbit line morphs, the body glows, and this says what physics did.', a.x + 24, cy + 36, a.w - 48, 30, act.caption ? COLORS.text : COLORS.dim, 2);
  // create
  const ky = cy + ch + 18;
  p.text('Create', a.x + 10, ky + 46, 32, COLORS.text, 700);
  const cw = (a.w - 200 - 2 * 14) / 3;
  QUICK_CREATE.forEach((q, i) => p.button(`god:q:${q.type}`, a.x + 200 + i * (cw + 14), ky, cw, 92, `${q.icon} ${q.label}`, run(() => act.create(q.type)), { size: 34 }));
  // the guide, or how to grab
  const hy = a.y + a.h - 46;
  const hints = act.hints;
  if (hints.visible && hints.next) {
    p.text(`Try (${hints.done.size + 1}/${HINT_STEPS.length}): ${hints.next.text}`, a.x + 10, hy + 20, 28, '#ffd27a', 600, 'left', a.w - 200);
    p.button('god:hintskip', a.x + a.w - 170, hy - 6, 170, 52, 'Skip', run(() => hints.skip()), { size: 24 });
  } else {
    p.text('Right grip on a body: grab it, swing, let go to throw it', a.x + 10, hy + 20, 26, COLORS.dim);
  }
}

/** Word-wrapped text, up to `maxLines` lines. */
function wrap(p: Panel, t: string, x: number, y: number, w: number, size: number, color: string, maxLines: number): void {
  const c = p.ctx;
  c.font = `500 ${size}px ${FONT}`;
  const words = t.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    const next = cur ? `${cur} ${wd}` : wd;
    if (c.measureText(next).width > w && cur) { lines.push(cur); cur = wd; } else cur = next;
  }
  if (cur) lines.push(cur);
  lines.slice(0, maxLines).forEach((l, i) => p.text(i === maxLines - 1 && lines.length > maxLines ? `${l} ${lines.slice(maxLines).join(' ')}` : l, x, y + i * size * 1.45, size, color, 500, 'left', w));
}

/**
 * The full editor in the headset: the same editor as the desktop panel, with nudge buttons instead
 * of typed values. Left: physical properties; right: the orbit; tap a derived value to see its
 * formula with the numbers in. Below: create, N-body switch, undo and reset. The right grip
 * grabs and throws bodies.
 */
function paintGodAdvanced(p: Panel, a: { x: number; y: number; w: number; h: number }, app: App, close: () => void): void {
  const g = app.god;
  const sb = g.sandbox;
  g.vr.armed = true;
  const act = (f: () => void) => () => { f(); p.dirty = true; };
  // header: state of the universe
  p.text(!sb.active ? '● Real ephemeris' : sb.mode === 'nbody' ? '● N-body simulation' : '● Edited (Kepler orbits)', a.x + 10, a.y + 26, 28, sb.active ? COLORS.warn : COLORS.accent, 700);
  p.button('god:nbody', a.x + 720, a.y, 330, 60, sb.active && sb.mode === 'nbody' ? '✓ Simulate gravity' : 'Simulate gravity', act(() => g.setSimulation(!(sb.active && sb.mode === 'nbody'))), { size: 24, active: sb.active && sb.mode === 'nbody' });
  p.button('god:undo', a.x + 1064, a.y, 140, 60, '↶ Undo', act(() => g.actions.undo()), { size: 24, disabled: !sb.canUndo });
  p.button('god:reset', a.x + 1218, a.y, 200, 60, '⟲ Real', act(() => g.actions.reset()), { size: 24, disabled: !sb.active });
  p.button('god:simple', a.x + 1432, a.y, 88, 60, '◂', act(() => { advanced = false; }), { size: 30 });

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
    else if (scriptSaid) p.text(scriptSaid, a.x + 10, a.y + a.h - 172, 19, '#ffd27a', 400, 'left', a.w - 20);
  }
  // ready-made scripts (the console's examples), right column
  {
    const y = a.y + 76 + 48 + 7 * 56, x0 = a.x + 10 + 765, bw = (735 - 5 * 6) / 6;
    PRESETS.forEach((pr, i) => p.button(`god:preset:${i}`, x0 + i * (bw + 6), y, bw, 48, pr.label, act(() => {
      const r = g.console.run(pr.script);
      scriptSaid = r.lines.filter((l) => !l.startsWith('  ')).slice(-2).join('  ·  ') || pr.label;
      shownMath = null;
    }), { size: 15 }));
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
