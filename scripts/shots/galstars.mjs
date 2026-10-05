// Inside other galaxies: Andromeda at 0.4 radii (towards its bulge, and towards the Milky Way from
// inside its disc) and M33 at 0.4 radii; prints drawn star counts, cells and tile budget.
// usage: node scripts/shots/galstars.mjs <base> <outprefix>
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/out/gs';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 960), height: Number(process.env.H ?? 540) } });
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 300)));
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 300000 }); };
const settle = async () => {
  await frames(3);
  await page.waitForFunction(() => window.app.procStars.pending < 20, null, { timeout: 400000 }).catch(() => console.log('stars pending'));
  await frames(4);
};
const stats = (tag) => page.evaluate((t) => { const s = window.app.procStars; return JSON.stringify({ t, drawn: s.drawnStars, cells: s.visible.length, pending: s.pending }); }, tag);
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 180000 });
const place = (name, k, look) => page.evaluate(([n, kk, lk]) => { const a = window.app; const o = a.findByName(n); a.select(null);
  // in the disc plane, 0.4 radii out along the major axis, a little above the plane
  const v = o.normal.clone().multiplyScalar(0.02).addScaledVector(o.major, 1).normalize();
  a.rig.upos.copy(o.upos).addVec(v, o.radius * kk);
  if (lk === 'centre') a.rig.lookAt(v.clone().negate());
  else { const d = a.rig.upos.clone().set(0, 0, 0).sub(a.rig.upos).normalize(); a.rig.lookAt(d); } }, [name, k, look]);
for (const [name, look, tag] of [['Andromeda Galaxy', 'centre', 'm31'], ['Andromeda Galaxy', 'sun', 'm31-mw'], ['Triangulum Galaxy', 'centre', 'm33']]) {
  await place(name, Number(process.env.K ?? 0.4), look);
  await settle();
  await page.screenshot({ path: `${out}-${tag}.png`, timeout: 180000 });
  console.log(await stats(tag));
}
await browser.close();
