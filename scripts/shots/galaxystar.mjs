import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 300)));
await page.goto('http://127.0.0.1:4174/?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3', { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 180000 });
await page.evaluate(() => { const a = window.app; const o = a.findByName('Andromeda Galaxy'); a.select(null);
  const v = o.normal.clone().multiplyScalar(0.01).addScaledVector(o.major, 1).normalize();
  a.rig.upos.copy(o.upos).addVec(v, o.radius * 0.45); a.rig.lookAt(v.clone().negate()); });
await page.waitForFunction(() => window.app.procStars.pending < 50, null, { timeout: 300000 }).catch(() => console.log('pending'));
const info = await page.evaluate(() => {
  const a = window.app; const near = a.procStars.nearest(a.camPc, 30, 40);
  // a sun-like or bright star with planets
  let pick = null;
  for (const n of near) { const sys = a.systems.of(n.star); if (sys && sys.planets?.length) { pick = n.star; break; } }
  pick = pick ?? near[0]?.star;
  if (!pick) return 'no star';
  window.__pick = pick;
  a.select(pick);
  const dir = pick.upos.sub(a.rig.upos).normalize();
  a.rig.upos.copy(pick.upos).addVec(dir, -Math.max(pick.radius * 4.5, 2e7) * 30);
  a.rig.lookAt(dir);
  const sys = a.systems.of(pick);
  return JSON.stringify({ name: pick.name, info: pick.info(), near: near.length, planets: sys ? sys.planets.length : 0 });
});
console.log(info);
const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + 15, { timeout: 300000 });
await page.screenshot({ path: '/tmp/out/star1.png', timeout: 240000 });
// go to a planet
const pl = await page.evaluate(() => { const a = window.app; const sys = a.systems.of(window.__pick); const p = sys?.planets?.[0]; if (!p) return 'none'; a.select(p); a.goTo(p); return p.name; });
console.log('planet', pl);
await page.waitForTimeout(20000);
const f2 = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f2 + 10, { timeout: 300000 });
await page.screenshot({ path: '/tmp/out/star2.png', timeout: 240000 });
await browser.close();
