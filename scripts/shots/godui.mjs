// God mode's interface, for before/after comparisons: the desktop panel (Y) on Earth, after
// pressing Heavier when the simple verbs exist, and the headset menu's God tab (the canvas
// itself, emulated Meta Quest 3).
// Usage: node scripts/shots/godui.mjs [baseUrl] [outDir] [prefix]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const outDir = process.argv[3] ?? 'screenshots';
const prefix = process.argv[4] ?? 'godui';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const url = `${base}?time=2026-10-01T20:00:00Z&target=Earth&dist=60&az=60&el=25`;
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript(() => { try { localStorage.clear(); } catch { /* */ } });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.app && window.app.frameCount > 10 && window.app.god, null, { timeout: 120000 });
  const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 240000 }); };
  await page.keyboard.press('KeyY');
  await frames(3);
  await page.screenshot({ path: path.join(outDir, `${prefix}-desktop.png`), timeout: 180000 });
  if (await page.$('button[data-v="heavier"]')) {
    await page.click('button[data-v="heavier"]');
    await frames(2);
    await page.screenshot({ path: path.join(outDir, `${prefix}-desktop-heavier.png`), timeout: 180000 });
  }
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.addInitScript({ path: 'node_modules/iwer/build/iwer.min.js' });
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch { /* */ }
    const d = new IWER.XRDevice(IWER.metaQuest3);
    d.installRuntime({ forceInstall: true, polyfillLayers: true });
  });
  await page.goto(url.replace('dist=60', 'dist=4'), { waitUntil: 'load' });
  await page.waitForFunction(() => window.app && window.app.frameCount > 5 && window.app.vr, null, { timeout: 120000 });
  await page.evaluate(() => window.app.vr.enter());
  await page.waitForFunction(() => window.app.vr.active, null, { timeout: 60000 });
  const tab = async (name) => {
    const data = await page.evaluate(() => { const m = window.app.vr.menu; m.panel.dirty = true; m.panel.update(); return m.panel.canvas.toDataURL('image/png'); });
    fs.writeFileSync(path.join(outDir, `${prefix}-${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
  };
  await page.evaluate(() => window.app.vr.debugPressGod('open'));
  await tab('vr');
  if (await page.evaluate(() => window.app.vr.menu.panel.has('god:v:heavier'))) {
    await page.evaluate(() => window.app.vr.debugPressGod('v:heavier'));
    await tab('vr-heavier');
    await page.evaluate(() => window.app.vr.debugPressGod('adv'));
    await tab('vr-advanced');
  }
  await page.close();
}
await browser.close();
console.log('done');
