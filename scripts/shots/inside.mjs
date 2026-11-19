// scratch: inside a galaxy (as "fly into" places you) looking at its bulge, then back at the Milky Way
// usage: node inside.mjs <base> "Galaxy name" <outprefix>
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const name = process.argv[3] ?? 'Andromeda Galaxy';
const out = process.argv[4] ?? '/tmp/out/in';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 960), height: Number(process.env.H ?? 540) } });
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 300)));
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 300000 }); };
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 180000 });
const k = Number(process.env.K ?? 0.4);
await page.evaluate(([n, kk]) => { const a = window.app; const o = a.findByName(n); a.select(null);
  const from = a.rig.upos.sub(o.upos); const v = o.insideDir(from);
  a.rig.upos.copy(o.upos).addVec(v, o.radius * kk); a.rig.lookAt(v.clone().negate()); }, [name, k]);
await frames(5);
await page.waitForFunction(() => window.app.procStars.pending < 30, null, { timeout: 400000 }).catch(() => console.log('stars pending'));
await frames(4);
await page.screenshot({ path: `${out}-bulge.png`, timeout: 240000 });
await page.evaluate(() => { const a = window.app; const d = a.rig.upos.clone().set(0, 0, 0).sub(a.rig.upos).normalize(); a.rig.lookAt(d); });
await page.waitForFunction(() => window.app.procStars.pending < 30, null, { timeout: 400000 }).catch(() => console.log('stars pending'));
await frames(4);
await page.screenshot({ path: `${out}-milkyway.png`, timeout: 240000 });
console.log(await page.evaluate(() => JSON.stringify({ drawn: window.app.procStars.drawnStars })));
await browser.close();
