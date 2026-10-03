// scratch: evaluate an expression after placing the camera like galaxy.mjs (no screenshot)
import { chromium } from '@playwright/test';
const base = process.argv[2], spec = process.argv[3], expr = process.argv[4], pre = process.env.PRE, shot = process.env.SHOT;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 960), height: Number(process.env.H ?? 540) } });
page.on('pageerror', (e) => console.log('ERR', String(e)));
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
const [name, k, view] = spec.split('@');
await page.evaluate(([n, kk, vw]) => {
  const a = window.app; const o = a.findByName(n); a.select(o);
  const v = vw === 'earth' ? o.upos.sub(a.rig.upos.clone().set(0, 0, 0)).normalize().negate()
    : vw === 'face' ? o.normal.clone()
      : vw === 'edge' ? o.major.clone().multiplyScalar(0.3).addScaledVector(o.minor, 1).normalize()
        : o.normal.clone().multiplyScalar(Number(vw)).addScaledVector(o.major, 1).normalize();
  a.rig.upos.copy(o.upos).addVec(v, o.radius * Number(kk));
  a.rig.lookAt(v.clone().negate());
}, [name, k, view]);
if (pre) await page.evaluate(pre);
const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + 8, { timeout: 180000 });
console.log(await page.evaluate(expr));
if (shot) await page.screenshot({ path: shot, timeout: 240000 });
await browser.close();
