// scratch: generated planet surfaces from orbit
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/exo';
const names = (process.env.PL ?? 'Proxima Cen b,TRAPPIST-1 e,Kepler-22 b,51 Peg b').split(',');
const ks = (process.env.KS ?? '2.2').split(',').map(Number);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 240000 }); };
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
for (const n of names) {
  for (const k of ks) {
    const info = await page.evaluate(([n, k]) => {
      const a = window.app; const o = a.findByName(n); if (!o) return 'not found';
      a.select(o);
      for (let i = 0; i < 3; i++) o.system?.update(a.clock.jdTdb);
      const host = o.system.host;
      const ts = host.upos.sub(o.upos).normalize();
      const up = Math.abs(ts.z) < 0.9 ? ts.clone().set(0, 0, 1) : ts.clone().set(1, 0, 0);
      const sd = ts.clone().cross(up).normalize();
      const v = ts.clone().multiplyScalar(0.55).addScaledVector(sd, 0.83).normalize();
      a.rig.upos.copy(o.upos).addVec(v, o.radius * k);
      a.rig.lookAt(v.clone().negate());
      return `${o.spec.type} R=${(o.radius / 6.371e6).toFixed(2)} teq=${Math.round(o.spec.teqK)}`;
    }, [n, k]);
    await frames(10);
    await page.screenshot({ path: `${out}-${n.replace(/\s+/g, '_')}-${k}.png`, timeout: 240000 });
    console.log('shot', n, k, info);
  }
}
console.log('errors', errors.length, errors.slice(0, 3).join(' | '));
await browser.close();
