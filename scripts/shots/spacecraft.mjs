// scratch: spacecraft models up close
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/craft';
const names = (process.env.CRAFT ?? 'International Space Station,Hubble Space Telescope,James Webb Space Telescope,Voyager 1,New Horizons').split(',');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 180000 }); };
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
for (const n of names) {
  for (const [k, side] of [[1.2, 0.8], [0.9, -0.6]]) {
    await page.evaluate(([n, k, side]) => {
      const a = window.app; const o = a.findByName(n); a.select(o);
      const sun = a.findByName('Sun');
      const ts = sun.upos.sub(o.upos).normalize();
      const up = Math.abs(ts.z) < 0.9 ? ts.clone().set(0, 0, 1) : ts.clone().set(1, 0, 0);
      const sd = ts.clone().cross(up).normalize();
      const v = ts.clone().multiplyScalar(0.75).addScaledVector(sd, side).addScaledVector(up, 0.35).normalize();
      a.rig.upos.copy(o.upos).addVec(v, o.radius * 2 * k + 2);
      a.rig.lookAt(v.clone().negate());
    }, [n, k, side]);
    await frames(8);
    await page.screenshot({ path: `${out}-${n.split(' ')[0]}-${k}.png`, timeout: 180000 });
    console.log('shot', n, k);
  }
}
console.log('errors', errors.length, errors.slice(0, 3).join(' | '));
await browser.close();
