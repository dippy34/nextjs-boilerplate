// Planet look review: Earth, Mars, Jupiter, Saturn, Neptune from far (a phase view), mid distance
// and close to the limb (in the upper atmosphere).
// Usage: node scripts/shots/planets.mjs [base] [outprefix] [time]
//   PL    comma list of planet names (default the five above)
//   KS    comma list of views: far, mid, near, limb (default all)
//   LITE=1 the headset tier's cheaper shader variant
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/planets';
const time = process.argv[4] ?? '2026-10-01T20:00:00Z';
const names = (process.env.PL ?? 'Earth,Mars,Jupiter,Saturn,Neptune').split(',');
const views = (process.env.KS ?? 'far,mid,near,limb').split(',');
const lite = process.env.LITE === '1';
// [distance (radii), azimuth from the Sun (deg), elevation (deg)]
const VIEW = { far: [9, 70, 15], mid: [2.6, 40, 18], near: [1.35, 25, 10], limb: [1.12, 80, 5] };
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 1280), height: Number(process.env.H ?? 720) } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 180000 }); };
await page.goto(`${base}?time=${time}&paused=1&target=Earth&dist=5`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
// HIDEUI=1: only the 3D view
if (process.env.HIDEUI === '1') await page.addStyleTag({ content: '* { visibility: hidden !important } canvas { visibility: visible !important }' });
await page.evaluate(() => { const a = window.app; if (a.orbits) a.orbits.enabled = false; if (a.labels) a.labels.enabled = false; });
if (lite) await page.evaluate(() => { const u = window.app.bodies?.meshes; for (const m of u?.values() ?? []) if (m.material.uniforms.uLite) m.material.uniforms.uLite.value = 1; });
for (const name of names) {
  for (const v of views) {
    const [dist, az, el] = VIEW[v];
    await page.evaluate(({ name, dist, az, el, limb }) => {
      const a = window.app; const b = a.system.bodies.find((x) => x.name === name);
      a.select(b);
      const V = b.upos.sub(b.upos).constructor;
      const pole = new V().setFromMatrixColumn(b.orientation, 2).normalize();
      const s = a.system.sun.upos.sub(b.upos).normalize();
      s.addScaledVector(pole, -s.dot(pole)).normalize();
      const side = new V().crossVectors(pole, s).normalize();
      const azr = az * Math.PI / 180, elr = el * Math.PI / 180;
      const dir = s.clone().multiplyScalar(Math.cos(azr)).addScaledVector(side, Math.sin(azr)).multiplyScalar(Math.cos(elr)).addScaledVector(pole, Math.sin(elr)).normalize();
      a.rig.upos.copy(b.upos).addVec(dir, dist * b.radius);
      // limb: look at the horizon (20 degrees down; it dips 27 degrees at 1.12 radii) along the day side
      if (limb) a.rig.lookAt(new V().crossVectors(dir, pole).normalize().multiplyScalar(Math.cos(0.35)).addScaledVector(dir, -Math.sin(0.35)).normalize(), dir);
      else a.rig.lookAt(dir.clone().negate(), pole);
    }, { name, dist, az, el, limb: v === 'limb' });
    await frames(12);
    for (let i = 0, last = 0; i < 30; i++) {
      const x = await page.evaluate(() => window.app.bodies.surfaceExposure.value);
      if (i > 0 && Math.abs(Math.log(x / last)) < 0.02) break;
      last = x;
      await frames(3);
    }
    await page.screenshot({ path: `${out}-${name}-${v}.png`, timeout: 180000 });
    console.log('shot', name, v);
  }
}
console.log('errors', errors.length, errors.slice(0, 3).join(' | '));
await browser.close();
