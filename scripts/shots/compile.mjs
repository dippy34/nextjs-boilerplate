// Quick shader check: visits the new renderers and reports console errors (shader compile/link errors show up there).
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 400)); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 240000 }); };
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
for (const [name, k] of [['Andromeda Galaxy', 1.5], ['Ring Nebula', 1.5], ['Crab Nebula', 1.5], ['Proxima Cen b', 2.5], ['Moon', 1.02]]) {
  await page.evaluate(([n, k]) => {
    const a = window.app; const o = a.findByName(n); a.select(o);
    if (o.system) o.system.update(a.clock.jdTdb);
    const d = o.upos.sub(a.rig.upos).normalize();
    a.rig.upos.copy(o.upos).addVec(d, -o.radius * k);
    a.rig.lookAt(d);
  }, [name, k]);
  await frames(6);
  console.log('visited', name, 'errors so far', errors.length);
}
console.log('errors', errors.length, errors.slice(0, 4).join('\n'));
await browser.close();
