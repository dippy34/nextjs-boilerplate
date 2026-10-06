// Drives God mode in headless Chromium: the physics editor (mass/radius/density, Kepler elements,
// the math lines), reversing Earth's orbit, Kepler III after a mass change, deleting the Earth (the
// Moon wanders off), the N-body switch, a black hole, a collision, undo, save/load, reset, and the
// in-headset God tab with an emulated Meta Quest 3.
// Usage: node scripts/god.mjs [baseUrl] [outDir]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const outDir = process.argv[3] ?? 'screenshots';
const skipVr = process.argv.includes('--no-vr');
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  ...(process.env.TRUSTED_SPKI ? [`--ignore-certificate-errors-spki-list=${process.env.TRUSTED_SPKI}`] : [])] });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); };
const shot = (page, name) => page.screenshot({ path: path.join(outDir, name), timeout: 180000 });

// ------------------------------------------------------------------ desktop
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 240000 }); };
  // helpers in the page: Earth's heliocentric state, entities by name
  const helio = (name) => page.evaluate((n) => {
    const a = window.app, b = a.findByName(n), s = a.system.sun;
    const r = b.pos.clone().sub(s.pos), v = b.vel.clone().sub(s.vel), h = r.clone().cross(v).normalize();
    // the ecliptic pole in ICRF
    return { au: r.length() / 1.495978707e11, hEcl: h.y * -0.3977771559 + h.z * 0.9174820621, v: v.length(), valid: b.valid, gm: b.gm };
  }, name);

  await page.goto(`${base}?time=2026-10-01T20:00:00Z&target=Earth&dist=60&az=60&el=25`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.app && window.app.frameCount > 10 && window.app.god, null, { timeout: 120000 });
  await page.evaluate(() => { try { localStorage.removeItem('space-explorer-god-universe'); } catch { /* */ } });

  // 1. the real ephemeris until something changes
  let st = await page.evaluate(() => ({ active: window.app.god.active, badge: document.querySelector('.god-badge')?.textContent }));
  check('starts on the real ephemeris', !st.active && /Real ephemeris/.test(st.badge ?? ''), JSON.stringify(st));
  await page.keyboard.press('KeyY');
  await frames(3);
  st = await page.evaluate(() => ({ open: !document.querySelector('.god-panel').classList.contains('hidden'), name: document.querySelector('.god-panel h4')?.textContent }));
  check('Y opens the God panel on the selection', st.open && st.name === 'Earth', JSON.stringify(st));
  await shot(page, 'god1-panel.png');

  // 2. reverse Earth's orbit: the sandbox takes over and Earth goes round the other way
  const before = await helio('Earth');
  await page.click('button[data-a="v"][data-k="reverse"]');
  await frames(3);
  const after = await helio('Earth');
  st = await page.evaluate(() => ({ active: window.app.god.active, badge: document.querySelector('.god-badge')?.textContent, n: window.app.god.sandbox.entities.size }));
  check('an edit leaves the real ephemeris (Kepler orbits by default)', st.active && /Kepler/.test(st.badge ?? '') && st.n > 300, JSON.stringify(st));
  check('Reverse orbit flips Earth to a retrograde orbit', before.hEcl > 0.99 && after.hEcl < -0.99 && Math.abs(after.v - before.v) < 50, `${before.hEcl.toFixed(3)} -> ${after.hEcl.toFixed(3)}`);
  const jd0 = await page.evaluate(() => window.app.clock.jdTdb);
  await page.evaluate(() => { window.app.clock.rate = 86400 * 10; window.app.clock.paused = false; });
  await page.waitForFunction((j) => window.app.clock.jdTdb > j + 30, jd0, { timeout: 240000 });
  const later = await helio('Earth');
  check('the simulation runs: Earth keeps its retrograde orbit near 1 AU', later.hEcl < -0.99 && Math.abs(later.au - 1) < 0.03, JSON.stringify(later));
  await page.evaluate(() => { window.app.clock.paused = true; });
  await frames(2);
  await shot(page, 'god2-reversed.png');

  // 3. undo brings the prograde orbit back
  await page.keyboard.press('Control+KeyZ');
  await frames(3);
  const undone = await helio('Earth');
  check('Ctrl+Z undoes the edit', undone.hEcl > 0.99, `${undone.hEcl.toFixed(3)}`);

  // 4. the editor: type a mass (radius kept, density follows); Kepler III speeds the Moon up
  const moonP = () => page.evaluate(() => { const v = window.app.god.sandbox.orbitOf(window.app.god.sandbox.entityOf(301)); const a = v.el.q / (1 - v.el.e); return 2 * Math.PI * Math.sqrt(a ** 3 / v.el.mu) / 86400; });
  await page.fill('input[data-f="mass"]', '4');
  await page.press('input[data-f="mass"]', 'Enter');
  await frames(6);
  st = await page.evaluate(() => {
    const b = window.app.system.byId.get(399);
    return { gm: b.gm, r: b.radius, rho: document.querySelector('input[data-f="density"]')?.value, g: document.querySelector('[data-live="g"]')?.textContent, math: document.querySelector('[data-live-m="g"]')?.textContent };
  });
  check('typing 4 Earth masses: radius kept, density and g follow, with the working shown', Math.abs(st.gm / (4 * 3.986e14) - 1) < 0.01 && Math.abs(st.r - 6371e3) < 1e3 && Math.abs(Number(st.rho) - 22.05) < 0.2 && /^39\.\d+ m\/s²$/.test(st.g) && /^g = GM \/ R² = /.test(st.math), JSON.stringify(st));
  const p4 = await moonP();
  check("Kepler III: the Moon goes round a 4x heavier Earth twice as fast", Math.abs(p4 - 27.32 / 2) < 0.6, `${p4.toFixed(2)} d`);
  await page.keyboard.press('Control+KeyZ');
  await frames(4);
  // orbital elements: set Earth's a to 1.5 AU: P = 1.84 yr from Kepler III, shown with its formula
  await page.fill('input[data-f="a"]', '1.5');
  await page.press('input[data-f="a"]', 'Enter');
  await frames(6);
  st = await page.evaluate(() => ({ P: document.querySelector('[data-live="P"]')?.textContent, au: (() => { const a = window.app; return a.system.byId.get(399).pos.distanceTo(a.system.sun.pos) / 1.495978707e11; })() }));
  check('setting a = 1.5 AU puts Earth there; P = 2π√(a³/GM) reads 671 d (1.84 yr)', /^67[01]\d* d$/.test(st.P ?? '') && st.au > 1.48 && st.au < 1.53, JSON.stringify(st));
  await page.keyboard.press('Control+KeyZ');
  await frames(2);

  // climate drawn: 5 bar on Earth thickens its air; a heavier Sun shines brighter (main sequence)
  await page.evaluate(() => { const g = window.app.god; g.sandbox.setPhys(399, { pressure: 5.065, molar: 0.02897 }); g.setPhysical(10, { massKg: 1.2 * 1.98847e30 }); });
  await frames(30);
  st = await page.evaluate(() => {
    const a = window.app, tw = a.atmospheres.tweaks?.get(a.system.byId.get(399));
    return { density: tw?.density, h: tw?.hScale };
  });
  const lum = await page.evaluate(() => window.app.god.debugState().sunLight);
  check('5 bar thickens Earth\'s drawn atmosphere; a 1.2 M☉ Sun is ~2x brighter', st.density > 3 && st.density < 7 && lum > 1.9 && lum < 2.3, JSON.stringify({ ...st, lum }));
  await page.keyboard.press('Control+KeyZ');
  await page.keyboard.press('Control+KeyZ');
  await frames(3);

  // 5. delete the Earth: the Moon wanders off round the Sun
  await page.keyboard.press('Delete');
  await frames(3);
  const moonFree = await page.evaluate(() => {
    const a = window.app, m = a.system.byId.get(301), e = a.system.byId.get(399);
    return { earthValid: e.valid, earthGm: e.gm, moonValid: m.valid, mode: a.god.sandbox.entityOf(301)?.mode, primary: a.god.sandbox.primaryOf(a.god.sandbox.entityOf(301))?.name };
  });
  check('Delete removes Earth; the Moon now orbits the Sun', !moonFree.earthValid && moonFree.earthGm === 0 && moonFree.moonValid && moonFree.primary === 'Sun', JSON.stringify(moonFree));
  // (still gone a moment later: the ephemeris must not bring it back)
  await frames(3);
  st = await page.evaluate(() => window.app.system.byId.get(399).valid);
  check('a deleted body stays deleted', st === false, `${st}`);
  await page.keyboard.press('Control+KeyZ');
  await frames(2);
  st = await page.evaluate(() => ({ valid: window.app.system.byId.get(399).valid, primary: window.app.god.sandbox.primaryOf(window.app.god.sandbox.entityOf(301))?.name }));
  check('undo brings Earth back', st.valid && st.primary === 'Earth', JSON.stringify(st));

  // 6. the N-body switch, then a black hole of 10 Suns near Earth: drawn by the black-hole layer, felt by everything
  await page.click('input[data-c="nbody"]');
  await frames(4);
  st = await page.evaluate(() => ({ mode: window.app.god.sandbox.mode, badge: document.querySelector('.god-badge')?.textContent }));
  check('"Simulate gravity" switches to the N-body simulation', st.mode === 'nbody' && /N-body/.test(st.badge), JSON.stringify(st));
  const holeId = await page.evaluate(() => {
    const a = window.app, e = a.system.byId.get(399);
    const pos = e.pos.clone().add(e.vel.clone().normalize().multiplyScalar(3e9));
    return a.god.spawn('hole', 10, pos);
  });
  await frames(4);
  st = await page.evaluate((id) => {
    const a = window.app, h = a.blackHoles.find((x) => x.key === `god:${id}`);
    const e = a.god.sandbox.entityOf(id);
    return { hole: !!h, mass: h?.massSun, at: h ? h.upos.toVector3().distanceTo(e.pos) : -1, sel: a.selection?.name };
  }, holeId);
  check('spawning a black hole adds it to the black-hole layer at its simulated place', st.hole && Math.abs(st.mass - 10) < 1e-6 && st.at < 1, JSON.stringify(st));
  await page.evaluate((id) => { const a = window.app; const h = a.blackHoles.find((x) => x.key === `god:${id}`); a.select(h); a.placeNear(h, h.radius * 4e4, 30, 12); }, holeId);
  await frames(6);
  await shot(page, 'god3-blackhole.png');
  // it pulls Earth in: Earth gets swallowed (or torn apart) within a few months
  await page.evaluate(() => { const a = window.app; a.placeNear(a.system.byId.get(399), 3e9, 30, 30); a.clock.rate = 86400 * 5; a.clock.paused = false; });
  await page.waitForFunction(() => !window.app.system.byId.get(399).valid, null, { timeout: 240000 }).catch(() => undefined);
  st = await page.evaluate((id) => ({ earth: window.app.system.byId.get(399).valid, holeMass: window.app.god.sandbox.entityOf(id)?.gm / 1.32712440041e20 }), holeId);
  check('the black hole swallows Earth', !st.earth && st.holeMass > 10, JSON.stringify(st));
  await page.evaluate(() => { window.app.clock.paused = true; });

  // 7. a collision: the Moon thrown at Mars merges with it (mass and momentum kept), with a flash
  await page.keyboard.press('Control+KeyZ'); // (the swallow is not an edit: this undoes the black hole)
  await frames(2);
  st = await page.evaluate(() => window.app.god.sandbox.mode);
  check('undo keeps the N-body mode', st === 'nbody', st);
  const coll = await page.evaluate(() => {
    const a = window.app, sb = a.god.sandbox, m = sb.entityOf(301), mars = sb.entityOf(499);
    // put the Moon 200,000 km from Mars, heading straight at it at 5 km/s
    const dir = m.pos.clone().sub(mars.pos).normalize();
    const pos = mars.pos.clone().addScaledVector(dir, 2e8);
    a.god.setPosition(301, pos, mars.vel.clone().addScaledVector(dir, -5000));
    a.placeNear(a.system.byId.get(499), 1.2e8, 30, 20);
    a.select(a.system.byId.get(499));
    const p0 = mars.vel.clone().multiplyScalar(mars.gm).add(mars.vel.clone().addScaledVector(dir, -5000).multiplyScalar(m.gm));
    return { gm: mars.gm + m.gm, p: p0.toArray() };
  });
  await page.evaluate(() => { const a = window.app; a.clock.rate = 3600; a.clock.paused = false; });
  await page.waitForFunction(() => !window.app.god.sandbox.entityOf(301), null, { timeout: 240000 }).catch(() => undefined);
  await frames(2);
  st = await page.evaluate((c) => {
    const a = window.app, mars = a.god.sandbox.entityOf(499);
    return { moonGone: !a.god.sandbox.entityOf(301) && !a.system.byId.get(301).valid, gmErr: Math.abs(mars.gm - c.gm) / c.gm, flashes: a.god.layer.bursts?.length ?? -1 };
  }, coll);
  check('a collision merges the Moon into Mars, keeping the mass', st.moonGone && st.gmErr < 1e-9, JSON.stringify(st));
  await page.evaluate(() => { window.app.clock.paused = true; });
  await frames(2);
  await shot(page, 'god4-collision.png');

  // 8. save and load
  st = await page.evaluate(() => {
    const sb = window.app.god.sandbox;
    const ok = sb.save(), n = sb.entities.size;
    sb.undo();
    const back = sb.load();
    return { ok, back, same: sb.entities.size === n, json: sb.exportJson().length };
  });
  check('save and load a universe', st.ok && st.back && st.same && st.json > 1000, JSON.stringify(st));

  // 9. create a planet with the panel tool, placed by clicking in the view
  await page.evaluate(() => { const a = window.app; a.select(a.system.byId.get(399).valid ? a.system.byId.get(399) : a.system.sun); a.god.panel.refresh(); });
  await frames(2);
  await page.selectOption('select[data-c="type"]', 'giant');
  await page.click('button[data-a="place"]');
  await frames(2);
  await page.mouse.click(400, 380);
  await frames(4);
  st = await page.evaluate(() => {
    const a = window.app, sel = a.selection, e = a.god.entityOf(sel);
    return { name: sel?.name, kind: e?.kind, type: e?.spawn?.type, sys: a.activeSystems.some((s) => s.planets[0] === sel), body: a.system.bodies.some((b) => b.id === e?.id) };
  });
  check('Place creates a gas giant where clicked (drawn as a generated planet, in system.bodies)', st.kind === 'planet' && st.type === 'giant' && st.sys && st.body, JSON.stringify(st));

  // 10. reset to the real universe
  await page.click('button[data-a="reset"]');
  await frames(3);
  st = await page.evaluate(() => {
    const a = window.app, e = a.system.byId.get(399), m = a.system.byId.get(301), mars = a.system.byId.get(499);
    return { active: a.god.active, badge: document.querySelector('.god-badge')?.textContent, earth: e.valid, moon: m.valid, marsGm: mars.gm,
      spawned: a.system.bodies.filter((b) => b.meta.spawned).length, holes: a.blackHoles.filter((h) => h.key.startsWith('god:')).length };
  });
  check('Reset restores the real universe', !st.active && /Real/.test(st.badge) && st.earth && st.moon && Math.abs(st.marsGm - 4.2828e13) < 1e10 && st.spawned === 0 && st.holes === 0, JSON.stringify(st));
  // 11. the universe console: a loop, a print with its formula, a creation, an error, undo
  await page.keyboard.press('Backquote');
  await frames(2);
  const type = async (line) => { await page.fill('.god-console input', line); await page.press('.god-console input', 'Enter'); await frames(3); };
  await type('for p in planets: p.e = 0');
  st = await page.evaluate(() => {
    const g = window.app.god, sb = g.sandbox;
    const es = [199, 299, 399, 499, 599, 699, 799, 899].map((id) => sb.orbitOf(sb.entityOf(id)).el.e);
    return { maxE: Math.max(...es), open: !document.querySelector('.god-console').classList.contains('hidden'), undo: sb.undoStack?.length };
  });
  check('console: for p in planets: p.e = 0 circularizes every planet', st.open && st.maxE < 1e-6, JSON.stringify(st));
  await type('undo');
  st = await page.evaluate(() => { const sb = window.app.god.sandbox; return sb.orbitOf(sb.entityOf(499)).el.e; });
  check('console: one undo restores the whole loop', st > 0.09, `${st}`);
  await type('print Earth.T_s');
  await type('create planet "Nova" mass=3 Mearth density=4.5 g/cm3 a=1.6 AU around Sun');
  await type('Earth.mass = 2');
  st = await page.evaluate(() => {
    const g = window.app.god, out = [...document.querySelectorAll('.god-console .out div')].map((d) => d.textContent);
    const id = g.console.runner.world.find('Nova'), v = id !== null ? g.sandbox.entityOf(id) : null;
    const o = v ? g.sandbox.orbitOf(v) : null;
    return { ts: out.find((l) => l.startsWith('Earth.T_s = ')), math: out.find((l) => l.includes('T_s = T_eq + ΔT_greenhouse')), nova: !!v,
      rho: v ? v.gm / 6.6743e-11 / (4 / 3 * Math.PI * v.radius ** 3) / 1000 : 0, a: o ? o.el.q / (1 - o.el.e) / 1.495978707e11 : 0, err: out[out.length - 1] };
  });
  check('console: print shows the formula; create makes Nova (4.5 g/cm³ at 1.6 AU)', /K/.test(st.ts ?? '') && !!st.math && st.nova && Math.abs(st.rho - 4.5) < 0.01 && Math.abs(st.a - 1.6) < 0.01, JSON.stringify(st));
  check('console: a missing unit is explained', /mass needs a unit/.test(st.err ?? ''), st.err);
  await shot(page, 'god7-console.png');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.app.god.reset());
  await frames(2);
  check('no errors on the desktop', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

// ------------------------------------------------------------------ headset
if (!skipVr) {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript({ path: 'node_modules/iwer/build/iwer.min.js' });
  await page.addInitScript(() => {
    const d = new IWER.XRDevice(IWER.metaQuest3);
    d.stereoEnabled = true;
    d.installRuntime({ forceInstall: true, polyfillLayers: true });
    window.__xrDevice = d;
  });
  const frames = (n) => page.evaluate((k) => new Promise((res) => {
    const start = window.app.frameCount;
    const t = setInterval(() => { if (window.app.frameCount >= start + k) { clearInterval(t); res(); } }, 10);
  }), n);
  await page.goto(`${base}?time=2026-10-01T20:00:00Z&target=Earth&dist=4&az=40&el=10`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.app && window.app.frameCount > 5 && window.app.vr, null, { timeout: 120000 });
  await page.evaluate(() => window.app.vr.enter());
  await page.waitForFunction(() => window.app.vr.active, null, { timeout: 60000 });
  await frames(20);
  // open the menu on the God tab and press its buttons with the controller laser
  const st0 = await page.evaluate(() => window.app.vr.debugGod?.() ?? null);
  check('the headset menu has a God tab', !!st0 && st0.tab === true, JSON.stringify(st0));
  const press = async (id) => {
    const ok = await page.evaluate((b) => window.app.vr.debugPressGod(b), id);
    await frames(6);
    return ok;
  };
  if (st0) {
    await press('open');
    await frames(10);
    await page.screenshot({ path: path.join(outDir, 'god5-vr-tab.png'), timeout: 180000 });
    const pressed = await press('v:reverse');
    const s1 = await page.evaluate(() => ({ active: window.app.god.active, hEcl: (() => { const a = window.app, b = a.system.byId.get(399), s = a.system.sun; const h = b.pos.clone().sub(s.pos).cross(b.vel.clone().sub(s.vel)).normalize(); return h.y * -0.3977771559 + h.z * 0.9174820621; })() }));
    check('VR: Reverse orbit from the God tab', pressed && s1.active && s1.hEcl < -0.99, JSON.stringify(s1));
    // the editor in the headset: mass x1.1 with a nudge, and a derived value's working
    const gm0 = await page.evaluate(() => window.app.system.byId.get(399).gm);
    const nud = await press('mass:3');
    const m1 = await page.evaluate(() => window.app.system.byId.get(399).gm);
    check('VR: mass nudge x1.1', nud && Math.abs(m1 / gm0 - 1.1) < 1e-6, `${(m1 / gm0).toFixed(4)}`);
    const shown = await press('math:P');
    check('VR: tap a derived value to show its math', shown, '');
    await frames(4);
    await page.screenshot({ path: path.join(outDir, 'god6-vr-math.png'), timeout: 180000 });
    await press('spawn:hole');
    const s2 = await page.evaluate(() => window.app.blackHoles.filter((h) => h.key.startsWith('god:')).length);
    check('VR: create a black hole from the God tab', s2 === 1, `${s2}`);
    // grab with the grip and throw: the selected body leaves at the hand's speed (scaled)
    const s3 = await page.evaluate(() => window.app.vr.debugThrow?.() ?? null);
    check('VR: grip grabs the selection and throws it', !!s3 && s3.thrown && s3.speedChange > 0, JSON.stringify(s3));
    const m3 = await page.evaluate(() => window.app.god.sandbox.mode);
    check('VR: grabbing switches Kepler mode to the N-body simulation', m3 === 'nbody', m3);
    await page.evaluate(() => window.app.god.reset());
    await frames(3);
    const pre = await press('preset:0');
    const s5 = await page.evaluate(() => { const sb = window.app.god.sandbox; return Math.max(...[399, 499, 599].map((id) => sb.orbitOf(sb.entityOf(id)).el.e)); });
    check('VR: a preset script (circular orbits) runs from the God tab', pre && s5 < 1e-6, `${s5}`);
    await press('reset');
    const s4 = await page.evaluate(() => window.app.god.active);
    check('VR: reset to the real universe', s4 === false, `${s4}`);
  }
  check('no errors in the headset', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
