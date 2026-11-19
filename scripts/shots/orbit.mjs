// scratch: Earth seen from low orbit (clouds, their shadows, ocean and land)
// usage: ALTS=400,2000 node scripts/shots/orbit.mjs http://127.0.0.1:4174/ /tmp/out/orbit
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/orbit';
const alts = (process.env.ALTS ?? '400,2000').split(',').map(Number);
// angle from the sub-solar point (degrees) and the view's tilt below the horizontal (degrees)
const sunAng = Number(process.env.SUNANG ?? 50);
const tilt = Number(process.env.TILT ?? 35);
const time = process.env.TIME ?? '2026-10-01T12:00:00Z';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 960), height: Number(process.env.H ?? 540) } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 240000 }); };
await page.goto(`${base}?time=${time}&paused=1&target=Earth&dist=3`, { waitUntil: 'load', timeout: 300000 });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
await frames(10);
for (const alt of alts) {
  await page.evaluate(([alt, sunAng, tilt, lat, lon]) => {
    const a = window.app; const e = a.findByName('Earth'); a.select(e);
    const sun = a.system.sun.upos.sub(e.upos).normalize();
    const at = lat === null ? null : sun.clone().set(Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180), Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180), Math.sin(lat * Math.PI / 180)).applyMatrix4(e.orientation.clone().setPosition(0, 0, 0));
    // a point sunAng degrees from the sub-solar point (towards the north-east)
    const pole = sun.clone().set(0, 0, 1);
    const side = pole.clone().cross(sun).normalize();
    const north = sun.clone().cross(side).normalize();
    const k = (sunAng * Math.PI) / 180;
    const dir = at ?? sun.clone().multiplyScalar(Math.cos(k)).addScaledVector(side.clone().add(north).normalize(), Math.sin(k)).normalize();
    a.rig.upos.copy(e.upos).addVec(dir, e.radius + alt * 1e3);
    // look across the light (side-lit cloud tops), tilted down
    const flat = sun.clone().sub(dir.clone().multiplyScalar(sun.dot(dir))).normalize();
    const across = flat.clone().cross(dir).normalize();
    const t = (tilt * Math.PI) / 180;
    a.rig.lookAt(across.multiplyScalar(Math.cos(t)).addScaledVector(dir, -Math.sin(t)).normalize(), dir);
  }, [alt, sunAng, alt > 1000 ? Number(process.env.TILT2 ?? 62) : tilt, process.env.LAT ? Number(process.env.LAT) : null, Number(process.env.LON ?? 0)]);
  await frames(Number(process.env.SETTLE ?? 12));
  await page.screenshot({ path: `${out}-${alt}.png`, timeout: 240000 });
  console.log('shot', alt, JSON.stringify(await page.evaluate(() => ({ alt: Math.round(window.app.rig.altitude), fps: Math.round(window.app.fps) }))));
}
console.log('errors', errors.length, errors.slice(0, 3).join(' | '));
await browser.close();
