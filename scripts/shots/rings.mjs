// Inside Saturn's rings: towards Saturn, along the ring plane, straight down at the layer, and from
// 2 km above. Usage: node scripts/shots/rings.mjs [base] [outprefix]
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/rings';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 180000 }); };
await page.goto(`${base}?time=2026-10-01T20:00:00Z&paused=1&target=Saturn&dist=4`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
await page.evaluate(() => { const a = window.app; if (a.orbits) a.orbits.enabled = false; });
// [label, height above the ring spot (m), view: 'saturn' | 'along' | 'down', tip out of the plane]
const VIEWS = [['saturn', 0, 'saturn', 0.06], ['along', 0, 'along', -0.04], ['down', 0, 'down', 0], ['inside', -35, 'along', 0.02], ['above-2km', 2000, 'along', -0.25]];
for (const [label, dz, view, tip] of VIEWS) {
  const info = await page.evaluate(({ dz, view, tip }) => {
    const a = window.app;
    const spot = a.findByName("Saturn's rings");
    a.select(spot);
    const sat = a.findByName('Saturn');
    const V = sat.upos.sub(sat.upos).constructor;
    // "up": away from the ring on the side the explorer is placed (the sunlit face)
    const pole = new V().setFromMatrixColumn(sat.orientation, 2).normalize();
    if (spot.upos.sub(sat.upos).dot(pole) < 0) pole.negate();
    a.rig.upos.copy(spot.upos).addVec(pole, dz);
    const toSat = sat.upos.sub(a.rig.upos).normalize();
    const outward = toSat.clone().negate();
    const along = pole.clone().cross(outward).normalize();
    if (view === 'saturn') a.rig.lookAt(toSat.clone().addScaledVector(pole, tip).normalize(), pole);
    else if (view === 'along') a.rig.lookAt(along.addScaledVector(pole, tip).normalize(), pole);
    else a.rig.lookAt(pole.clone().negate().addScaledVector(along, 0.35).normalize(), along);
    const rp = a.bodies.ringParticles;
    return { slab: rp?.slab.visible ?? null, particles: rp?.mesh.count ?? 0 };
  }, { dz, view, tip });
  await frames(12);
  await page.screenshot({ path: `${out}-${label}.png`, timeout: 180000 });
  console.log(label, JSON.stringify(info));
}
console.log('errors', errors.length, errors.slice(0, 3).join(' | '));
await browser.close();
