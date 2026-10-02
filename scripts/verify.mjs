// Headless verification: loads scenarios in Chromium, waits for streaming to
// settle, saves screenshots and fails on console/page errors.
// Usage: node scripts/verify.mjs [baseUrl] [outDir] [scenarioName...]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const outDir = process.argv[3] ?? 'screenshots';
const only = new Set(process.argv.slice(4));
fs.mkdirSync(outDir, { recursive: true });

const T = '2026-10-01T20:00:00Z';
export const scenarios = [
  { name: '01-earth', query: `time=${T}&paused=1` },
  { name: '02-moon', query: `time=${T}&paused=1&target=Moon&dist=3.2&az=20` },
  { name: '03-saturn', query: `time=${T}&paused=1&target=Saturn&dist=6&az=40&el=20` },
  { name: '04-jupiter-system', query: `time=${T}&paused=1&target=Jupiter&dist=150&az=10&el=8` },
  { name: '05-inner-system', query: `time=${T}&paused=1&target=Sun&dist=600&az=0&el=60` },
  { name: '06-outer-system', query: `time=${T}&paused=1&target=Sun&dist=12000&az=0&el=45` },
  { name: '07-sky-from-earth-orion', query: `time=${T}&paused=1&target=Earth&dist=1.6&az=180&el=0&look=Betelgeuse&fov=70` },
  { name: '08-alpha-centauri', query: `time=${T}&paused=1&target=Rigil Kentaurus&dist=40` },
  { name: '09-neighborhood', query: `time=${T}&paused=1&campc=0,0,40&fov=70` },
  { name: '10-galaxy-scale', query: `time=${T}&paused=1&campc=0,0,4000&fov=70` },
  { name: '11-asteroid-belt', query: `time=${T}&paused=1&target=Sun&dist=1100&az=0&el=55&fov=60` },
  { name: '12-pluto-charon', query: `time=${T}&paused=1&target=Pluto&dist=12&az=60&el=10` },
  { name: '13-cygnus-x1', query: `time=${T}&paused=1&target=Cygnus X-1&dist=22` },
  { name: '14-sagittarius-a', query: `time=${T}&paused=1&target=Sagittarius A*&dist=20` },
  { name: '15-gaia-bh1', query: `time=${T}&paused=1&target=Gaia BH1&dist=25&fov=60` },
  { name: '16-cygnus-x1-far', query: `time=${T}&paused=1&target=Cygnus X-1&dist=3000` },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    // Optional: trust one extra CA by public-key hash (e.g. a TLS-intercepting corporate/sandbox proxy).
    ...(process.env.TRUSTED_SPKI ? [`--ignore-certificate-errors-spki-list=${process.env.TRUSTED_SPKI}`] : [])],
});
let failed = false;
for (const sc of scenarios) {
  if (only.size && !only.has(sc.name)) continue;
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  const t0 = Date.now();
  await page.goto(`${base}?${sc.query}`, { waitUntil: 'load' });
  try {
    await page.waitForFunction(() => window.app || window.appError, null, { timeout: 60000 });
    const appError = await page.evaluate(() => window.appError);
    if (appError) throw new Error(appError);
    // let tiles stream and exposure settle
    await page.waitForFunction(() => window.app.frameCount > 20 && window.app.debugState().pendingTiles === 0, null, { timeout: 120000 });
    await page.waitForTimeout(2500);
  } catch (e) {
    errors.push(`scenario error: ${e.message}`);
  }
  const state = await page.evaluate(() => (window.app ? window.app.debugState() : null)).catch(() => null);
  const file = path.join(outDir, `${sc.name}.png`);
  await page.screenshot({ path: file });
  const ms = Date.now() - t0;
  console.log(`${sc.name}: ${ms} ms`, JSON.stringify(state));
  if (errors.length) {
    failed = true;
    console.log(`  ERRORS:\n   ${errors.slice(0, 10).join('\n   ')}`);
  }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
