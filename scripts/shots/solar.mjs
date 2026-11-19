// Solar System close-ups for visual review: Saturn from above its rings, Jupiter, the Sun.
// Usage: node scripts/shots/solar.mjs [base] [outprefix] [time]
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/solar';
const time = process.argv[4] ?? '2026-10-01T20:00:00Z';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 180000 }); };
await page.goto(`${base}?time=${time}&paused=1&target=Saturn&dist=5`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
await page.evaluate(() => { const a = window.app; if (a.orbits) a.orbits.enabled = false; });
// [label, body id, distance (radii), elevation above the equator (deg), azimuth from the Sun (deg)]
const VIEWS = [
  ['saturn-above-rings', 699, 5.5, 28, 35],
  ['saturn-sunward', 699, 3.2, 12, 10],
  ['jupiter', 599, 3.0, 8, 30],
  ['sun-3r', 10, 3.0, 10, 0],
  ['sun-1.1r', 10, 1.1, 10, 0],
  ['sun-1.02r', 10, 1.02, 10, 0],
];
for (const [label, id, dist, el, az] of VIEWS.filter(([l]) => !process.env.VIEWS || process.env.VIEWS.split(',').includes(l))) {
  await page.evaluate(({ id, dist, el, az }) => {
    const a = window.app; const b = a.system.byId.get(id);
    a.select(b);
    const V = b.upos.sub(b.upos).constructor;
    const pole = new V().setFromMatrixColumn(b.orientation, 2).normalize();
    let s = id === 10 ? new V(1, 0, 0) : a.system.sun.upos.sub(b.upos).normalize();
    s.addScaledVector(pole, -s.dot(pole)).normalize();
    const side = new V().crossVectors(pole, s).normalize();
    const azr = az * Math.PI / 180, elr = el * Math.PI / 180;
    const dir = s.clone().multiplyScalar(Math.cos(azr)).addScaledVector(side, Math.sin(azr)).multiplyScalar(Math.cos(elr)).addScaledVector(pole, Math.sin(elr)).normalize();
    a.rig.upos.copy(b.upos).addVec(dir, dist * b.radius);
    if (dist < 1.5) {
      // near the surface: look along it, towards the limb
      a.rig.lookAt(side.clone().addScaledVector(dir, -0.35).normalize(), dir);
    } else a.rig.lookAt(dir.clone().negate(), pole);
  }, { id, dist, el, az });
  await frames(20);
  await page.screenshot({ path: `${out}-${label}.png`, timeout: 180000 });
  console.log(label);
}
console.log('errors', errors.length, errors.slice(0, 3).join(' | '));
await browser.close();
