// Black hole review shots: Cygnus X-1 at 30 rs, Sgr A* at 10 and 3 rs, M87* with its jet, and
// (with time running) a few frames of the disk moving. LITE=1 renders with the headset tier.
// usage: [LITE=1] [ONLY=name,name] node scripts/shots/blackholes.mjs http://127.0.0.1:4174/ /tmp/out/bh
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/bh';
const T = '2026-10-01T12:00:00Z';
export const SCENES = [
  { name: 'cygx1-30rs', query: `target=Cygnus X-1&dist=30&fov=70` },
  { name: 'sgra-10rs', query: `target=Sagittarius A*&dist=10&fov=70` },
  { name: 'sgra-3rs', query: `target=Sagittarius A*&dist=3&fov=70` },
  { name: 'm87-jet', query: `target=M87*&dist=60&az=60&el=35&fov=70` },
  { name: 'sgra-1.6rs', query: `target=Sagittarius A*&dist=1.6&fov=70` },
];
const only = new Set((process.env.ONLY ?? '').split(',').filter(Boolean));
const lite = process.env.LITE === '1';
const raw = process.env.RAW === '1'; // without the holes (the scene they lens)
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 960), height: Number(process.env.H ?? 540) } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 600000 }); };
for (const sc of SCENES) {
  if (only.size && !only.has(sc.name)) continue;
  await page.goto(`${base}?time=${T}&paused=1&${sc.query}`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 300000 });
  await page.evaluate(([lite, raw]) => {
    const a = window.app;
    a.labels.enabled = false;
    if (a.orbits) a.orbits.enabled = false;
    for (const el of document.querySelectorAll('.hud, #hud, .panel, .info')) el.style.display = 'none';
    if (raw) a.holes.group.visible = false;
    if (lite) { a.holes.vr = true; a.renderer.scene.traverse((o) => { const u = o.material?.uniforms?.uLite; if (u) u.value = 1; }); }
  }, [lite, raw]);
  await frames(Number(process.env.SETTLE ?? 30));
  const info = await page.evaluate(() => { const v = window.app.holes.views[0]; return v ? { name: v.bh.name, distRs: v.dist / v.bh.radius, inside: v.inside } : null; });
  await page.screenshot({ path: `${out}-${sc.name}.png`, timeout: 180000 });
  console.log('shot', sc.name, JSON.stringify(info));
}
console.log(errors.length ? `errors:\n${errors.slice(0, 10).join('\n')}` : 'no errors');
await browser.close();
