// KTX2 vs JPG maps: the same views with ?ktx2=1 and ?ktx2=0, side by side, plus the mean
// brightness of each (compression must not change the albedo calibration) and whether the
// compressed copies were the ones drawn.
// Usage: node scripts/shots/ktx2.mjs [base] [outprefix]
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const out = process.argv[3] ?? '/tmp/claude-0/ktx2';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// [label, target, distance in radii]
const VIEWS = [['moon', 'Moon', 2.2], ['earth', 'Earth', 2.5], ['mars', 'Mars', 2.5]];
const results = {};
let fail = 0;
for (const k of ['1', '0']) {
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  const errors = [];
  const logs = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); logs.push(m.text()); });
  const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 180000 }); };
  await page.goto(`${base}?time=2026-10-01T20:00:00Z&paused=1&target=Moon&dist=3&ktx2=${k}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 180000 });
  for (const [label, name, dist] of VIEWS) {
    await page.evaluate(({ name, dist }) => {
      const a = window.app;
      const b = [...a.system.byId.values()].find((x) => x.name === name);
      a.select(b);
      const s = a.system.sun.upos.sub(b.upos).normalize();
      a.rig.upos.copy(b.upos).addVec(s, dist * b.radius);
      a.rig.lookAt(s.clone().negate(), new s.constructor(0, 0, 1));
    }, { name, dist });
    // (the maps load asynchronously: wait until the body's map is bound)
    await page.waitForFunction((name) => {
      const a = window.app;
      let ok = false;
      a.renderer.scene.traverse((o) => { if (o.material?.uniforms?.uHasMap?.value === 1 && o.name.includes(name)) ok = true; });
      return ok;
    }, name, { timeout: 180000 }).catch(() => undefined);
    await frames(6);
    const mean = await page.evaluate(() => {
      const c = document.createElement('canvas');
      const src = window.app.renderer.canvas;
      c.width = 160; c.height = 100;
      const g = c.getContext('2d');
      g.drawImage(src, 0, 0, 160, 100);
      const d = g.getImageData(0, 0, 160, 100).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2];
      return s / (d.length / 4) / 3;
    });
    results[`${label}-${k}`] = mean;
    await page.screenshot({ path: `${out}-${label}-ktx2_${k}.png`, timeout: 180000 });
  }
  const on = logs.some((l) => /KTX2 maps on/.test(l));
  console.log(`ktx2=${k}: loader ${on ? 'on' : 'off'}, errors ${errors.length} ${errors.slice(0, 3).join(' | ')}`);
  if (errors.length || on !== (k === '1')) fail++;
  await page.close();
}
for (const [label] of VIEWS) {
  const a = results[`${label}-1`], b = results[`${label}-0`];
  const ok = Math.abs(a - b) <= Math.max(2, 0.08 * b);
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: mean ${a.toFixed(1)} (KTX2) vs ${b.toFixed(1)} (JPG)`);
}
console.log(fail ? `${fail} failures` : 'all KTX2 checks passed');
await browser.close();
process.exit(fail ? 1 : 0);
