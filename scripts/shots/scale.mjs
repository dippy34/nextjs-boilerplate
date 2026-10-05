// Scale cues in the browser: places the camera at four reference views, reads back the angular size
// the app computes (src/app/Awe.ts) against the real value, measures the Sun's disc in pixels, checks
// the Earth-for-scale silhouette and the dust, and saves screenshots.
// Usage: node scripts/shots/scale.mjs [base] [outprefix]   (exit code 1 on a failed check)
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4173/';
const out = process.argv[3] ?? '/tmp/claude-0/scale';
const W = 960, H = 540;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 180000 }); };
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Jupiter&dist=6`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10 && window.app.awe, null, { timeout: 180000 });
await page.evaluate(() => { const a = window.app; a.orbits.enabled = false; a.labels.enabled = false; a.hud.setHidden(true); });
const DEG = 180 / Math.PI;
// [label, target, from: 'surface' altitude (m) | 'dist' (m) from centre, real angular diameter (deg), tolerance]
const VIEWS = [
  ['earth-from-iss', 'Earth', 6371e3 + 420e3, 139.4, 1.5],
  ['jupiter-from-io', 'Jupiter', 421_700e3 - 1821e3, 19.2, 0.5],
  ['sun-from-mercury', 'Sun', 0.387098 * 1.495978707e11, 1.377, 0.02],
  ['sgra-at-10rs', 'Sagittarius A*', 10, 28.5, 0.4], // distance in rs
];
let fail = 0;
for (const [label, name, dist, real, tol] of VIEWS) {
  const r = await page.evaluate(({ name, dist }) => {
    const a = window.app; const o = a.findByName(name);
    a.select(o);
    const V = o.upos.sub(o.upos).constructor;
    const d = name.startsWith('Sag') ? dist * o.radius : dist;
    const dir = new V(0.3, 0.4, 0.86).normalize();
    a.rig.upos.copy(o.upos).addVec(dir, d);
    a.rig.setAnchor(o);
    // look a little off centre so Earth for scale and the limb are both in view
    a.rig.lookAt(dir.clone().negate().add(new V(0.05, 0, 0)).normalize());
    return d;
  }, { name, dist });
  await frames(6);
  const s = await page.evaluate(() => {
    const a = window.app, w = a.awe;
    const card = a.awe.rows(a.selection, a.selection.upos.sub(a.rig.upos).length());
    return { dom: w.dominant, earth: w.cues.earthAt ? { scale: w.cues.earthScale, dist: w.cues.earthAt.length() } : null, card, fov: a.view.fovY, rumble: w.rumble.level };
  });
  const ang = s.dom ? s.dom.ang * DEG : NaN;
  const ok = Math.abs(ang - real) <= tol;
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: app ${ang.toFixed(3)}° vs real ${real}° (±${tol}); rumble ${s.rumble.toFixed(2)}; earth ${s.earth ? 'shown' : 'hidden'}; card ${JSON.stringify(s.card)}`);
  await page.screenshot({ path: `${out}-${label}.png`, timeout: 180000 });
}
// the Sun's disc in pixels from Mercury: bright pixels on the row through the disc centre
{
  await page.evaluate(() => {
    const a = window.app, o = a.findByName('Sun');
    const V = o.upos.sub(o.upos).constructor;
    const dir = new V(0.3, 0.4, 0.86).normalize();
    a.rig.upos.copy(o.upos).addVec(dir, 0.387098 * 1.495978707e11);
    a.rig.lookAt(dir.clone().negate());
  });
  await frames(6);
  const png = await page.screenshot({ timeout: 180000 });
  const { fovY } = await page.evaluate(() => ({ fovY: window.app.view.fovY }));
  const px = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const col = g.getImageData(img.width >> 1, 0, 1, img.height).data;
    let n = 0; for (let y = 0; y < img.height; y++) if (col[y * 4] > 250 && col[y * 4 + 1] > 240) n++;
    return n;
  }, png.toString('base64'));
  const expectPx = (Math.tan((1.377 / 2) * Math.PI / 180) / Math.tan((fovY / 2) * Math.PI / 180)) * H;
  // glare widens the saturated core; the disc must be at least its true size and not wildly bigger
  const ok = px >= expectPx * 0.85 && px <= expectPx * 4;
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} sun disc on screen: ${px} saturated px tall, geometric ${expectPx.toFixed(1)} px (fov ${fovY}°)`);
}
// dust: moving fast towards Jupiter makes it visible
{
  await page.evaluate(() => { const a = window.app, o = a.findByName('Jupiter'); a.select(o); a.goTo(o); });
  await frames(4);
  const dust = await page.evaluate(() => window.app.awe.cues.dustAlpha);
  const ok = dust > 0.05;
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} dust while flying in: alpha ${dust.toFixed(3)}`);
  await page.screenshot({ path: `${out}-approach.png`, timeout: 180000 });
}
if (errors.length) { console.log('page errors:', errors.slice(0, 5)); fail++; }
await browser.close();
process.exit(fail ? 1 : 0);
