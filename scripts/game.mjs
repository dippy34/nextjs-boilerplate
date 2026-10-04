// Drives game mode in headless Chromium: cockpit, physics thrust, mass lock, warp, chase view, traffic,
// missions. Usage: node scripts/game.mjs [baseUrl] [outDir]
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

await page.goto(`${base}?time=2026-10-01T20:00:00Z&paused=1&target=Earth&dist=1.6&az=60&el=10`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 120000 });
await page.evaluate(() => localStorage.removeItem('space-explorer-game'));

// 1. V enters the cockpit
await page.keyboard.press('KeyV');
await frames(4);
let st = await page.evaluate(() => ({ mode: window.app.game.mode, cockpit: window.app.game.cockpit.group.visible, inertia: window.app.rig.inertia }));
check('V enters the cockpit', st.mode === 'cockpit' && st.cockpit && st.inertia > 0, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 'g1-cockpit.png'), timeout: 180000 });

// 2. traffic appears around Earth
st = await page.evaluate(() => ({ ships: window.app.game.traffic.ships.length, anchor: window.app.rig.anchor?.name }));
check('fictional traffic orbits the planet we are near', st.ships > 0 && st.anchor === 'Earth', JSON.stringify(st));

// 3. real physics: W throttles the main engine up (the orbital speed changes), X cuts it, the ship coasts
st = await page.evaluate(() => ({ on: window.app.game.flight.on, v: window.app.game.flight.readout.orbitSpeed, paused: window.app.clock.paused }));
check('boarding turns on physics flight with time running', st.on && !st.paused, JSON.stringify(st));
const v0 = st.v;
await page.keyboard.down('KeyW');
await frames(12);
await page.keyboard.up('KeyW');
const thr = await page.evaluate(() => window.app.game.flight.ship.throttle);
await page.keyboard.down('KeyX');
await frames(2);
await page.keyboard.up('KeyX');
await frames(2);
st = await page.evaluate(() => ({ thr: window.app.game.flight.ship.throttle, v: window.app.game.flight.readout.orbitSpeed, fuel: window.app.game.flight.readout.fuel }));
check('W throttles up and burns, X cuts the engine', thr > 0 && st.thr === 0 && Math.abs(st.v - v0) > 0.5 && st.fuel < 1, `throttle ${thr.toFixed(2)}, ${v0.toFixed(1)} -> ${st.v.toFixed(1)} m/s`);

// 4. cockpit screens show the target and the warp drive flies there
await page.evaluate(() => { const a = window.app; a.select(a.findByName('Moon')); });
await frames(20);
st = await page.evaluate(() => ({ ...window.app.game.cockpit.readout }));
check('cockpit shows the target', st.target === 'Moon' && st.warp === 'ready' && st.distance.length > 0, `${st.target} ${st.distance} ${st.warp}`);
st = await page.evaluate(() => { const h = window.app.game.hud; return { hud: h.group.visible, target: h.group.children[0].visible }; });
check('canopy HUD brackets the target', st.hud && st.target, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 'g1b-hud.png'), timeout: 180000 });
// (deep in Earth's gravity the drive is mass-locked: climb out first)
await page.keyboard.press('KeyJ');
await frames(3);
st = await page.evaluate(() => ({ ap: window.app.rig.autopilot, lock: window.app.game.flight.massLock() }));
check('the warp drive is mass-locked close to Earth', !st.ap && st.lock !== '', st.lock);
await page.evaluate(() => { const a = window.app; const e = a.findByName('Earth'); a.placeNear(e, e.radius * 12, 60, 10); });
await frames(3);
await page.keyboard.press('KeyJ');
await frames(4);
st = await page.evaluate(() => ({ ap: window.app.rig.autopilot, warp: window.app.game.cockpit.readout.warp, fx: window.app.game.warpFx.lines.visible }));
check('J engages the warp drive', st.ap === true, JSON.stringify(st));
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(outDir, 'g2-warp.png'), timeout: 180000 });
await page.waitForFunction(() => !window.app.rig.autopilot, null, { timeout: 300000 });
await frames(10);
st = await page.evaluate(() => { const a = window.app; const m = a.findByName('Moon'); return { anchor: a.rig.anchor?.name, d: m.upos.sub(a.rig.upos).length() / m.radius }; });
check('warp arrives at the Moon', st.anchor === 'Moon' && st.d < 6, JSON.stringify(st));

// 5. missions: arriving at the Moon completes "Fly to the Moon"
await page.waitForTimeout(1500);
await frames(10);
st = await page.evaluate(() => ({ done: window.app.game.missions.list.filter((m) => m.done).map((m) => m.id), log: window.app.game.missions.log.length }));
check('the Moon mission completes and the discovery is logged', st.done.includes('moon') && st.log > 0, JSON.stringify(st));

// 6. V again: chase view shows the ship
await page.keyboard.press('KeyV');
await frames(6);
st = await page.evaluate(() => ({ mode: window.app.game.mode, ship: window.app.game.ship.group.visible, cockpit: window.app.game.cockpit.group.visible }));
check('V switches to the chase view', st.mode === 'chase' && st.ship && !st.cockpit, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 'g3-chase.png'), timeout: 180000 });

// 7. docking: fly to the station around the Moon, then in along its axis
await page.keyboard.press('KeyV'); // chase -> off
await frames(2);
await page.keyboard.press('KeyV'); // off -> cockpit
await frames(6);
st = await page.evaluate(() => { const g = window.app.game; return { stations: g.traffic.stations.map((s) => s.name) }; });
check('a station orbits the world we are at', st.stations.length === 1, JSON.stringify(st));
await page.evaluate(() => { const a = window.app; const s = a.game.traffic.stations[0]; a.select(s); a.goTo(s); });
await page.waitForFunction(() => !window.app.rig.autopilot, null, { timeout: 300000 });
await frames(4);
await page.keyboard.down('KeyW');
await page.waitForFunction(() => window.app.game.docked !== null || window.app.game.docking !== null, null, { timeout: 120000 }).catch(() => undefined);
await page.keyboard.up('KeyW');
await page.waitForFunction(() => window.app.game.docked !== null, null, { timeout: 120000 }).catch(() => undefined);
st = await page.evaluate(() => { const g = window.app.game; return { docked: g.docked?.name ?? null, missions: g.missions.list.filter((m) => m.done).map((m) => m.id) }; });
check('the docking computer docks the ship', !!st.docked, JSON.stringify(st));
await frames(12);
await page.screenshot({ path: path.join(outDir, 'g4-docked.png'), timeout: 180000 });
await page.keyboard.down('KeyS');
await frames(6);
await page.keyboard.up('KeyS');
st = await page.evaluate(() => ({ docked: window.app.game.docked }));
check('thrust undocks', st.docked === null);

// 8. landing: come down onto the Moon
// (dropped 12 m over the ground with no speed: lunar gravity sets it down at ~6 m/s)
await page.evaluate(() => { const a = window.app; const m = a.findByName('Moon'); a.select(m); a.placeNear(m, m.radius + 12, 30, 20); });
await page.waitForFunction(() => !!window.app.game.flight.readout.landed || !!window.app.game.flight.ending, null, { timeout: 240000 }).catch(() => undefined);
await frames(4);
st = await page.evaluate(() => ({ landed: window.app.game.flight.readout.landed || null, alt: window.app.rig.altitude, ending: window.app.game.flight.ending?.title ?? null }));
check('the ship touches down on the Moon', st.landed === 'Moon' && st.alt < 15, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 'g5-landed.png'), timeout: 180000 });

// 9. V: off, classic flight back
await page.keyboard.press('KeyV');
await frames(2);
await page.keyboard.press('KeyV');
await frames(3);
st = await page.evaluate(() => ({ mode: window.app.game.mode, inertia: window.app.rig.inertia, ships: window.app.game.traffic.ships.length }));
check('V leaves ship mode', st.mode === 'off' && st.inertia === 0 && st.ships === 0, JSON.stringify(st));

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} game checks passed`);
process.exit(failed ? 1 : 0);
