// scratch: a galaxy from several distances, seen from above its disc
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const names = (process.argv[3] ?? 'Andromeda Galaxy').split(',');
const out = process.argv[4] ?? '/tmp/claude-0/gal';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 180000 }); };
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
for (const name of names) for (const k of (process.env.KS ?? '0.25,1.5,4').split(',').map(Number)) {
  await page.evaluate(([n, kk, tilt]) => {
    const a = window.app; const o = a.findByName(n); a.select(o);
    const v = o.normal.clone().multiplyScalar(tilt).addScaledVector(o.major, 1).normalize();
    a.rig.upos.copy(o.upos).addVec(v, o.radius * kk);
    a.rig.lookAt(v.clone().negate());
  }, [name, k, Number(process.env.TILT ?? 0.6)]);
  await frames(10);
  const fps = await page.evaluate(() => window.app.fps);
  await page.screenshot({ path: `${out}-${name.split(' ')[0]}-${k}.png`, timeout: 240000 });
  console.log('shot', name, k, 'fps', Math.round(fps));
}
console.log('errors', errors.length, errors.slice(0, 2).join(' | '));
await browser.close();
