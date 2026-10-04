// The title screen (src/app/StartMenu.ts) in headless Chromium: shown on the bare URL, skipped by
// deep links and ?menu=0, keyboard / mouse navigation, Story mode disabled, credits, Simulator
// starts the explorer; then in an emulated Meta Quest 3 (IWER): the in-headset choices.
// Usage: node scripts/start.mjs [baseUrl] [outDir] [desktop|vr|all]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const outDir = process.argv[3] ?? 'screenshots';
const which = process.argv[4] ?? 'all';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  ...(process.env.TRUSTED_SPKI ? [`--ignore-certificate-errors-spki-list=${process.env.TRUSTED_SPKI}`] : [])] });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); };
const errors = [];

async function openPage(query, vr = false) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  if (vr) {
    await page.addInitScript({ path: 'node_modules/iwer/build/iwer.min.js' });
    await page.addInitScript(() => {
      const d = new IWER.XRDevice(IWER.metaQuest3);
      d.stereoEnabled = true;
      d.installRuntime({ forceInstall: true, polyfillLayers: true });
      window.__xrDevice = d;
    });
  }
  await page.goto(`${base}${query}`, { waitUntil: 'load' });
  return page;
}
const framesOn = (page) => async (n) => {
  const f = await page.evaluate(() => window.app.frameCount);
  await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 600000 });
};
const menuState = (page) => page.evaluate(() => {
  const root = document.getElementById('start-menu');
  const focus = root?.querySelector('.sm-item.sm-focus');
  return {
    shown: !!root && !root.classList.contains('sm-out'),
    focus: focus?.dataset.id ?? null,
    story: root ? root.querySelector('[data-id="story"]')?.disabled : null,
    sim: root ? root.querySelector('[data-id="sim"]')?.disabled : null,
    credits: root ? !root.querySelector('.sm-credits').hidden : null,
  };
});

if (which !== 'vr') {
  // 1. the bare URL: the title screen, Simulator disabled while loading
  let page = await openPage('');
  await page.waitForSelector('#start-menu', { timeout: 30000 });
  let st = await menuState(page);
  check('title screen on the bare URL', st.shown, JSON.stringify(st));
  check('Story mode is shown but disabled', st.story === true);
  await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 300000 });
  await page.waitForFunction(() => !document.querySelector('#start-menu [data-id="sim"]').disabled, null, { timeout: 60000 });
  st = await menuState(page);
  check('Simulator is enabled and focused once loaded', st.sim === false && st.focus === 'sim', JSON.stringify(st));
  const hud = await page.evaluate(() => getComputedStyle(document.querySelector('.hud-bottom')).visibility);
  check('the HUD is hidden behind the title screen', hud === 'hidden', hud);
  // the live view drifts behind it
  const frames = framesOn(page);
  const c0 = await page.evaluate(() => window.app.rig.upos.toVector3().toArray());
  await frames(6);
  const c1 = await page.evaluate(() => window.app.rig.upos.toVector3().toArray());
  check('the view drifts behind the menu', Math.hypot(c1[0] - c0[0], c1[1] - c0[1], c1[2] - c0[2]) > 1, '');
  await page.screenshot({ path: path.join(outDir, 'start-1-title.png'), timeout: 300000 });
  // keys go to the menu, not the explorer (Space would pause time)
  const paused0 = await page.evaluate(() => window.app.clock.paused);
  await page.keyboard.press('ArrowDown');
  st = await menuState(page);
  const paused1 = await page.evaluate(() => window.app.clock.paused);
  check('↓ skips the disabled Story mode', st.focus !== 'story' && st.focus !== 'sim', JSON.stringify(st));
  // to Credits (the last item), open, back
  for (let i = 0; i < 4 && (await menuState(page)).focus !== 'credits'; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  st = await menuState(page);
  const listShown = await page.evaluate(() => getComputedStyle(document.querySelector('#start-menu .sm-list')).display !== 'none');
  check('Credits opens in place of the menu', st.credits === true && !listShown, JSON.stringify({ ...st, listShown }));
  await page.screenshot({ path: path.join(outDir, 'start-2-credits.png'), timeout: 300000 });
  await page.keyboard.press('Escape');
  st = await menuState(page);
  check('Escape goes back from the credits', st.credits === false, JSON.stringify(st));
  const rate0 = await page.evaluate(() => window.app.clock.rate);
  await page.keyboard.press(']'); // the explorer's "faster time"
  const rate1 = await page.evaluate(() => window.app.clock.rate);
  check('keys do not reach the explorer behind the menu', paused0 === paused1 && rate0 === rate1, JSON.stringify({ rate0, rate1 }));
  // mouse: hover and click Simulator
  await page.hover('#start-menu [data-id="sim"]');
  await page.click('#start-menu [data-id="sim"]');
  await page.waitForFunction(() => !document.getElementById('start-menu'), null, { timeout: 30000 });
  const after = await page.evaluate(() => ({ hud: getComputedStyle(document.querySelector('.hud-bottom')).visibility, labels: window.app.labels.enabled, menu: !!window.startMenu?.isOpen }));
  check('Simulator starts the explorer (menu gone, HUD and labels back)', after.hud !== 'hidden' && after.labels && !after.menu, JSON.stringify(after));
  await frames(3);
  await page.keyboard.press('KeyL');
  await frames(2);
  check('the explorer has the keyboard again', (await page.evaluate(() => window.app.labels.enabled)) === false);
  await page.screenshot({ path: path.join(outDir, 'start-3-simulator.png'), timeout: 300000 });
  await page.close();

  // 1b. a phone: touch, a narrow screen, tap to start
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const phone = await ctx.newPage();
    phone.on('pageerror', (e) => errors.push(String(e)));
    await phone.goto(base, { waitUntil: 'load' });
    await phone.waitForFunction(() => window.app && !document.querySelector('#start-menu [data-id="sim"]').disabled, null, { timeout: 300000 });
    const fits = await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    check('phone: the title screen fits the width (no sideways scroll)', fits);
    await phone.screenshot({ path: path.join(outDir, 'start-5-phone.png'), timeout: 300000 });
    await phone.tap('#start-menu [data-id="sim"]');
    await phone.waitForFunction(() => !document.getElementById('start-menu'), null, { timeout: 30000 });
    check('phone: a tap on Simulator starts', true);
    await ctx.close();
  }

  // 2. deep links and ?menu=0 skip it; ?menu=1 forces it
  for (const [q, want] of [['?time=2026-10-01T20:00:00Z&paused=1&target=Moon&dist=3', false], ['?menu=0', false], ['?target=Mars', false], ['?menu=1&target=Moon', true]]) {
    page = await openPage(q);
    await page.waitForFunction(() => window.app && window.app.frameCount > 3, null, { timeout: 300000 });
    const shown = await page.evaluate(() => !!document.getElementById('start-menu'));
    check(`${q}: title screen ${want ? 'shown' : 'skipped'}`, shown === want);
    await page.close();
  }
}

if (which !== 'desktop') {
  // 3. in a headset: "Enter VR" from the title screen, then the choices on a panel in front of you
  const page = await openPage('', true);
  const frames = framesOn(page);
  await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 300000 });
  await page.waitForFunction(() => !!document.querySelector('#start-menu [data-id="vr"]'), null, { timeout: 60000 });
  check('a headset adds "Enter VR" to the title screen', true);
  await page.click('#start-menu [data-id="vr"]');
  await page.waitForFunction(() => window.app.vr.active && window.app.renderer.presenting, null, { timeout: 60000 });
  await page.waitForFunction(() => window.app.vr.extraPanels.length > 0, null, { timeout: 300000 });
  await frames(30);
  const st = await page.evaluate(() => ({ vrMenu: window.app.vr.menu.isOpen, start: window.startMenu.isOpen }));
  check('in the headset: the title panel, not the explorer menu', !st.vrMenu && st.start, JSON.stringify(st));
  await page.screenshot({ path: path.join(outDir, 'start-4-vr-panel.png'), timeout: 300000 });
  // aim the right controller at the Simulator button and pull the trigger
  await page.evaluate(() => {
    const a = window.app, panel = a.vr.extraPanels[0];
    panel.dirty = true; panel.update();
    const r = panel.regions.find((x) => x.id === 'sm:sim');
    const g = panel.mesh.geometry.parameters;
    const lx = ((r.x + r.w / 2) / panel.width - 0.5) * g.width;
    const ly = (0.5 - (r.y + r.h / 2) / panel.height) * g.height;
    panel.mesh.updateMatrixWorld(true);
    const p = panel.mesh.localToWorld(a.renderer.camera.position.clone().set(lx, ly, 0));
    const rig = a.renderer.rig; rig.updateMatrixWorld(true);
    const hand = a.vr.hands.find((h) => h.handedness === 'right');
    hand.obj.updateMatrixWorld(true);
    const origin = hand.obj.getWorldPosition(p.clone());
    const d = p.clone().sub(origin).normalize().applyQuaternion(rig.quaternion.clone().invert());
    const w = 1 - d.z; const n = Math.hypot(d.y, d.x, w);
    window.__xrDevice.controllers.right.quaternion.set(d.y / n, -d.x / n, 0, w / n);
  });
  await frames(4);
  const hover = await page.evaluate(() => window.app.vr.extraPanels[0]?.hover);
  check('the laser highlights Simulator', hover === 'sm:sim', String(hover));
  await page.evaluate(() => window.__xrDevice.controllers.right.updateButtonValue('trigger', 1));
  await frames(3);
  await page.evaluate(() => window.__xrDevice.controllers.right.updateButtonValue('trigger', 0));
  await frames(3);
  const done = await page.evaluate(() => ({ start: window.startMenu.isOpen, panels: window.app.vr.extraPanels.length, hold: window.app.vr.holdMenu }));
  check('trigger on Simulator starts the explorer in the headset', !done.start && done.panels === 0 && !done.hold, JSON.stringify(done));
  await page.close();
}

console.log(errors.length ? `console errors:\n${errors.slice(0, 10).join('\n')}` : 'no console errors');
check('no console errors', errors.length === 0);
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
