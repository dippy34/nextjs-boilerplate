// scratch: nebula look at several distances
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const name = process.argv[3] ?? 'Orion Nebula';
const out = process.argv[4] ?? '/tmp/claude-0/neb';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 180000 }); };
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
for (const k of (process.env.KS ?? '0.45,1.6,4,7').split(',').map(Number)) {
  await page.evaluate(([n, kk]) => {
    const a = window.app; const o = a.findByName(n); a.select(o);
    const d = o.upos.sub(a.rig.upos).normalize();
    a.rig.upos.copy(o.upos).addVec(d, -o.radius * kk);
    a.rig.lookAt(d);
  }, [name, k]);
  await frames(12);
  const fps = await page.evaluate(() => window.app.fps);
  await page.screenshot({ path: `${out}-${k}.png`, timeout: 180000 });
  console.log('shot', k, 'fps', Math.round(fps));
}
console.log('errors', errors.length, errors.slice(0, 2).join(' | '));
await browser.close();
