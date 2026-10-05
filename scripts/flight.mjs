// Real-physics ship flight in headless Chromium: orbit HUD and predicted path, a burn that changes
// the orbit, on-rails time warp, mass lock, a crash and respawn, a landing, a stellar black hole's
// tides and a supermassive one's horizon. Usage: node scripts/flight.mjs [baseUrl] [outDir]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const outDir = process.argv[3] ?? 'screenshots';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  ...(process.env.TRUSTED_SPKI ? [`--ignore-certificate-errors-spki-list=${process.env.TRUSTED_SPKI}`] : [])] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); };
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 240000 }); };
const shot = (name) => page.screenshot({ path: path.join(outDir, name), timeout: 180000 });
const state = () => page.evaluate(() => {
  const f = window.app.game.flight, r = f.readout;
  return {
    on: f.on, frame: r.frame, alt: r.altitude, ap: r.ap, pe: r.pe, e: r.conic?.e ?? null, v: r.orbitSpeed, rails: r.rails, limited: r.limited,
    pts: f.predictor.count, events: f.predictor.events.map((e) => e.kind), tidal: r.tidal, dil: r.dilation, warning: r.warning,
    ending: f.ending?.title ?? null, landed: r.landed, fuel: r.fuel, g: r.gForce, sas: r.sas, throttle: r.throttle,
  };
});
const waitFor = (fn, arg, timeout = 240000) => page.waitForFunction(fn, arg, { timeout }).then(() => true).catch(() => false);

// 1. boarding in low Earth orbit: physics on, a circular orbit, the predicted path and its apsides
await page.goto(`${base}?time=2026-10-01T20:00:00Z&target=Earth&dist=1.0628&az=40&el=5&ship=cockpit&menu=0`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 120000 });
await waitFor(() => window.app.game.flight.predictor.count > 50 && window.app.game.flight.predictor.done);
let st = await state();
check('in the ship, physics flight is on, orbiting Earth', st.on && st.frame === 'Earth', JSON.stringify({ frame: st.frame, alt: st.alt }));
check('boarding drops into a circular orbit at ~400 km', st.e !== null && st.e < 0.01 && Math.abs(st.alt - 400e3) < 30e3, `e=${st.e?.toFixed(4)} alt=${(st.alt / 1e3).toFixed(0)} km v=${st.v.toFixed(0)}`);
check('the predicted path is drawn with its apsides', st.pts > 50 && st.events.includes('ap') && st.events.includes('pe'), `${st.pts} pts ${st.events.join(',')}`);
await frames(5);
await shot('f1-orbit-hud.png');
const hudText = await page.evaluate(() => document.querySelector('.fl-panel')?.textContent ?? '');
check('the desktop HUD shows the orbit', /apoapsis/.test(hudText) && /periapsis/.test(hudText) && /ship clock/.test(hudText), hudText.slice(0, 80).replace(/\s+/g, ' '));

// 2. chase view with the orbit line
await page.keyboard.press('KeyV');
await frames(8);
await shot('f2-chase-orbit.png');
await page.keyboard.press('KeyV'); // chase -> off
await frames(2);
await page.keyboard.press('KeyV'); // off -> cockpit (boards again where we are)
await frames(4);

// 3. mass lock: the warp drive will not engage in low orbit
await page.evaluate(() => { const a = window.app; a.select(a.findByName('Moon')); });
await frames(2);
await page.keyboard.press('KeyJ');
await frames(3);
st = await page.evaluate(() => ({ ap: window.app.rig.autopilot, lock: window.app.game.flight.massLock() }));
check('warp is mass-locked in low orbit', !st.ap && st.lock.startsWith('Mass-locked'), st.lock);

// 4. a prograde burn raises the apoapsis (SAS holds prograde)
const before = await state();
await page.evaluate(() => { window.app.game.flight.sas = 'prograde'; });
await waitFor(() => { const f = window.app.game.flight; const s = f.ship; const D = f.core.frame; const v = s.vel.clone().sub(D.vel).normalize(); const fwd = s.quat.clone(); const n = new v.constructor(0, 0, -1).applyQuaternion(fwd); return n.dot(v) > 0.995; }, null, 120000);
await page.keyboard.down('KeyZ');
await frames(2);
await page.keyboard.up('KeyZ');
await waitFor(() => window.app.game.flight.readout.ap > 900e3, null, 120000);
const burning = await state();
await shot('f3-burn.png');
// X cuts the engine (held until a frame has seen it: software rendering is slow)
await page.keyboard.down('KeyX');
await waitFor(() => window.app.game.flight.ship.throttle === 0, null, 120000);
await page.keyboard.up('KeyX');
const after = await state();
check('a prograde burn raises the apoapsis and burns propellant', after.ap > before.ap + 400e3 && after.fuel < before.fuel, `Ap ${(before.ap / 1e3).toFixed(0)} -> ${(after.ap / 1e3).toFixed(0)} km, fuel ${(before.fuel * 100).toFixed(1)} -> ${(after.fuel * 100).toFixed(1)} %`);
check('the burn is felt (g-force), X cuts the engine', burning.g > 1 && burning.g < 2 && after.throttle === 0, `g ${burning.g.toFixed(2)} while burning`);

// 5. time warp: x1000 coasting goes on rails
await page.evaluate(() => { const a = window.app; a.clock.rate = 1000; });
await waitFor(() => window.app.game.flight.rails);
st = await state();
check('time warp x1000 coasts on rails', st.rails, JSON.stringify({ rails: st.rails, alt: Math.round(st.alt / 1e3) }));
await page.evaluate(() => { window.app.flightClock(); });

// 6. crash: dropped 3 km over the Moon with no orbital speed
await page.evaluate(() => { const a = window.app; const m = a.findByName('Moon'); a.placeNear(m, m.radius + 3000, 10, 10); a.clock.rate = 10; });
await frames(3);
st = await state();
check('teleported over the Moon, falling', st.frame === 'Moon' && st.alt < 4000, JSON.stringify({ frame: st.frame, alt: st.alt }));
const crashed = await waitFor(() => window.app.game.flight.ending !== null, null, 240000);
st = await state();
check('hitting the Moon fast is a crash', crashed && st.ending === 'CRASHED', String(st.ending));
await page.waitForTimeout(500);
await shot('f4-crash.png');
const respawned = await waitFor(() => window.app.game.flight.ending === null, null, 120000);
st = await state();
check('after the crash: respawn in a safe orbit', respawned && st.frame === 'Moon' && st.pe > 50e3, `pe ${(st.pe / 1e3).toFixed(0)} km`);

// 7. landing: let go 12 m over the Moon (lands at ~6 m/s)
await page.evaluate(() => { const a = window.app; a.flightClock(); const m = a.findByName('Moon'); a.placeNear(m, m.radius + 5000, 200, 30); });
await waitFor(() => window.app.terrain.owner === window.app.findByName('Moon') && !!window.app.terrain.below(window.app.rig.upos));
await page.evaluate(() => window.app.game.flight.hoverOverGround(12));
const landed = await waitFor(() => !!window.app.game.flight.readout.landed || window.app.game.flight.ending !== null, null, 240000);
st = await state();
check('a gentle drop is a landing', landed && st.landed === 'Moon' && !st.ending, JSON.stringify({ landed: st.landed, ending: st.ending }));
await shot('f5-landed.png');

// 8. a stellar black hole: tides near the limit, then torn apart inside it
await page.evaluate(() => { const a = window.app; const h = a.findByName('Cygnus X-1'); a.select(h); a.placeNear(h, 6.5e6, 20, 8); });
await waitFor(() => window.app.game.flight.readout.frame === 'Cygnus X-1');
await waitFor(() => window.app.game.flight.predictor.count > 50);
await frames(10);
st = await state();
check('orbiting Cygnus X-1: tides felt, path predicted', st.frame === 'Cygnus X-1' && st.tidal > 9.8 && st.pts > 50, JSON.stringify({ tidal: (st.tidal / 9.80665).toFixed(1), alt: st.alt, pts: st.pts, dil: st.dil }));
await shot('f6-stellar-bh.png');
await page.evaluate(() => { const a = window.app; const f = a.game.flight; const D = f.core.frame; const rel = f.ship.upos.sub(D.upos); f.core.setCircularOrbit(D, 2.0e6, rel, new rel.constructor(0, 0, 1)); a.rig.upos.copy(f.ship.upos); });
const torn = await waitFor(() => window.app.game.flight.ending !== null, null, 60000);
st = await state();
check('too close to a stellar black hole: torn apart before the horizon', torn && st.ending === 'TORN APART', String(st.ending));
await page.waitForTimeout(400);
await shot('f7-spaghetti.png');
await waitFor(() => window.app.game.flight.ending === null, null, 120000);

// 9. Sgr A*: survive to the horizon (tides are gentle), clocks slow, then no return
await page.evaluate(() => { const a = window.app; const h = a.findByName('Sagittarius A*'); a.select(h); a.placeNear(h, h.radius * 3, 30, 10); });
await waitFor(() => window.app.game.flight.readout.frame === 'Sagittarius A*');
await page.evaluate(() => { const a = window.app; const f = a.game.flight; const D = f.core.frame; f.ship.vel.copy(D.vel); a.rig.upos.copy(f.ship.upos); a.clock.rate = 60; });
await frames(6);
st = await state();
check('near Sgr A*: time dilation shown, tides survivable', st.dil < 0.9 && st.tidal < 9.8 * 5, JSON.stringify({ dil: st.dil, tidal: st.tidal }));
await shot('f8-sgra.png');
const fell = await waitFor(() => window.app.game.flight.ending !== null, null, 240000);
st = await state();
check('falling into Sgr A*: the horizon ends the flight ("no return")', fell && st.ending === 'NO RETURN', String(st.ending));
await page.waitForTimeout(2500);
await shot('f9-horizon.png');

// 10. demo shots: re-entry glow (low, fast, in Earth's air) and a close pass by a stellar black hole
await page.evaluate(() => { const a = window.app; a.clock.rate = 1; const e = a.findByName('Earth'); a.select(e); a.placeNear(e, e.radius + 400e3, 60, 5); });
await waitFor(() => window.app.game.flight.readout.frame === 'Earth');
await page.evaluate(() => { const a = window.app; const f = a.game.flight; const D = f.core.frame; const rel = f.ship.upos.sub(D.upos); f.core.setCircularOrbit(D, D.radius + 72e3, rel, new rel.constructor(0, 0, 1)); a.rig.upos.copy(f.ship.upos); f.sas = 'retrograde'; });
const glowing = await waitFor(() => window.app.game.flight.ship.heatFlux > 3e5, null, 120000);
st = await state();
check('demo: re-entry heats the hull (plasma glow)', glowing, `${(await page.evaluate(() => window.app.game.flight.ship.heatFlux / 1e6)).toFixed(2)} MW/m², ${st.warning}`);
await shot('f10-reentry.png');
await page.evaluate(() => { const a = window.app; const h = a.findByName('Cygnus X-1'); a.select(h); a.placeNear(h, 2e7, 20, 8); });
await waitFor(() => window.app.game.flight.readout.frame === 'Cygnus X-1');
await page.evaluate(() => { const a = window.app; const f = a.game.flight; const D = f.core.frame; const rel = f.ship.upos.sub(D.upos); const rl = Math.cbrt((2 * D.gm * 22) / (100 * 9.80665)); f.core.setCircularOrbit(D, rl * 1.1, rel, new rel.constructor(0, 0, 1)); a.rig.upos.copy(f.ship.upos); });
await waitFor(() => window.app.game.flight.predictor.count > 50 && window.app.game.flight.readout.warnLevel === 2, null, 120000);
st = await state();
check('demo: close pass by Cygnus X-1 with the tidal warning', /TIDAL/.test(st.warning) && !st.ending, `${st.warning}`);
await shot('f11-bh-pass.png');

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} flight checks passed`);
process.exit(failed ? 1 : 0);
