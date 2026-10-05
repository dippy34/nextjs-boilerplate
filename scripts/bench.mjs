// Runs the benchmark (src/perf/Bench.ts) in headless Chromium: on the desktop via ?bench=1, then in an
// emulated Meta Quest 3 (IWER) started from the VR menu's Benchmark button, with short holds. SwiftShader
// renders at 1-3 fps, so this proves the route runs, the numbers are filled in and the code decodes,
// not the Quest's speed. Also checks the perf HUD (F3) draws. Usage: node scripts/bench.mjs [baseUrl] [outDir]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { decode, format } from './bench-decode.mjs';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const outDir = process.argv[3] ?? 'screenshots';
const hold = process.env.HOLD ?? '1.5';
const only = process.env.ONLY; // 'desktop' | 'vr'
fs.mkdirSync(outDir, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); };
const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

function checkResult(tag, code, scenes) {
  let d = null;
  try { d = decode(code); } catch (e) { check(`${tag}: code decodes`, false, String(e)); return null; }
  check(`${tag}: code decodes, ${code.length} chars < 1500`, code.length < 1500);
  check(`${tag}: all ${scenes} scenes measured`, d.s.length === scenes && d.s.every((s) => s.n > 0 && s.med > 0), d.s.map((s) => `${s.id}:${s.n}`).join(' '));
  check(`${tag}: draw calls and triangles recorded`, d.s.every((s) => s.dc > 0 && s.tri > 0));
  check(`${tag}: device info`, !!d.ua && !!d.gl && d.hz > 0, `${d.gl} ${d.hz} Hz`);
  console.log(format(d));
  return d;
}

if (only !== 'vr') {
  const browser = await chromium.launch({ args });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}?bench=1&benchhold=${hold}&perf=1`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.app && window.app.frameCount > 5, null, { timeout: 300000 });
  await page.waitForFunction(() => document.querySelector('#bench-banner')?.style.display === 'block', null, { timeout: 300000 });
  check('desktop: ?bench=1 starts the run and shows progress', true, await page.evaluate(() => document.querySelector('#bench-banner').textContent));
  await page.screenshot({ path: path.join(outDir, 'bench-running.png'), timeout: 180000 });
  await page.waitForFunction(() => window.perfTools.bench.last, null, { timeout: 1800000 });
  const code = await page.evaluate(() => window.perfTools.bench.last.code);
  checkResult('desktop', code, 10);
  const panel = await page.evaluate(() => ({ rows: document.querySelectorAll('#bench-result tbody tr').length, code: document.querySelector('#bench-result textarea')?.value }));
  check('desktop: result panel with the table and the code', panel.rows === 10 && panel.code === code);
  await page.screenshot({ path: path.join(outDir, 'bench-result.png'), timeout: 180000 });
  const back = await page.evaluate(() => ({ god: window.app.god.active, ship: window.app.game.mode, paused: window.app.clock.paused, saved: localStorage.getItem('space-explorer-bench') !== null }));
  check('desktop: state restored after the run (no sandbox, no ship)', !back.god && back.ship === 'off', JSON.stringify(back));
  check('desktop: last result kept', back.saved);
  // copy fallback: no clipboard permission in headless: the button still selects or copies
  await page.click('#bench-result .copy');
  await page.waitForTimeout(500);
  check('desktop: Copy button answers', (await page.evaluate(() => document.querySelector('#bench-result .msg').textContent)).length > 0);
  await page.click('#bench-result .close');
  const hud = await page.evaluate(() => { const c = document.querySelector('#perf-hud'); return { shown: c.style.display, w: c.width }; });
  check('desktop: perf HUD (?perf=1) visible', hud.shown === 'block');
  await page.keyboard.press('F3');
  check('desktop: F3 hides it', await page.evaluate(() => document.querySelector('#perf-hud').style.display === 'none'));
  await page.keyboard.press('F3');
  check('desktop: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
}

if (only !== 'desktop') {
  const browser = await chromium.launch({ args });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript({ path: 'node_modules/iwer/build/iwer.min.js' });
  await page.addInitScript(() => {
    const d = new IWER.XRDevice(IWER.metaQuest3);
    d.stereoEnabled = true;
    d.installRuntime({ forceInstall: true, polyfillLayers: true });
    window.__xrDevice = d;
  });
  await page.goto(`${base}?time=2026-10-01T20:00:00Z&target=Earth&dist=4&paused=1&benchhold=${hold}`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 300000 });
  await page.waitForSelector('#vr-button', { state: 'visible', timeout: 60000 });
  await page.click('#vr-button');
  await page.waitForFunction(() => window.app.vr.active && window.app.renderer.presenting, null, { timeout: 60000 });
  await page.waitForFunction(() => window.app.vr.menu.isOpen, null, { timeout: 300000 });
  // the menu's Settings tab: Perf HUD and Benchmark buttons
  const clicked = await page.evaluate(() => {
    const p = window.app.vr.menu.panel;
    const reg = (id) => p.regions?.find((r) => r.id === id);
    const tab = reg('tab:settings'); if (!tab) return 'no settings tab';
    tab.onClick(); p.update();
    const hudB = reg('perf:hud'), benchB = reg('perf:bench');
    if (!hudB || !benchB) return 'no perf buttons';
    hudB.onClick(); benchB.onClick();
    return 'ok';
  });
  check('vr: Settings has Perf HUD and Benchmark, both work', clicked === 'ok', clicked);
  await page.waitForFunction(() => window.perfTools.bench.running, null, { timeout: 60000 }).catch(() => undefined);
  await page.waitForFunction(() => window.perfTools.bench.last, null, { timeout: 1800000 });
  await page.screenshot({ path: path.join(outDir, 'bench-vr.png'), timeout: 180000 });
  const code = await page.evaluate(() => window.perfTools.bench.last.code);
  const d = checkResult('vr', code, 10);
  if (d) check('vr: XR framebuffer and refresh recorded', Array.isArray(d.xr) && d.xr[0] > 0 && d.hz > 0, `${JSON.stringify(d.xr)} ${d.hz} Hz`);
  const vrHud = await page.evaluate(() => ({ hud: window.perfTools.hud.on, panels: window.app.vr.extraPanels.length, presenting: window.app.renderer.presenting }));
  check('vr: HUD on, result panel in the headset, still presenting', vrHud.hud && vrHud.panels > 0 && vrHud.presenting, JSON.stringify(vrHud));
  check('vr: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
