// Draw calls by material/object in software GL: wraps renderer.renderBufferDirect for one frame
// per scene and tallies the calls (and their passes: main, volume, captures) by material name.
// Usage: node scripts/shots/drawcalls.mjs [baseUrl] [scene...]
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4173/';
const only = new Set(process.argv.slice(3));
const T = '2026-10-01T20:00:00Z';
const SCENES = [
  { name: 'm31', query: `time=${T}&paused=1&target=Andromeda Galaxy&dist=1.5` },
  { name: 'orion', query: `time=${T}&paused=1&target=Orion Nebula&dist=1.2` },
  { name: 'earth-surface', query: `time=${T}&paused=1&target=Earth&dist=1.0003&el=5` },
  { name: 'earth-orbit', query: `time=${T}&paused=1&target=Earth&dist=3` },
];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const sc of SCENES) {
  if (only.size && !only.has(sc.name)) continue;
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  await page.goto(`${base}?${sc.query}`);
  await page.waitForFunction(() => window.app && window.app.frameCount > 30, null, { timeout: 300000 });
  const r = await page.evaluate(async () => {
    const gl = window.app.renderer.gl;
    const tally = new Map();
    let total = 0;
    const orig = gl.renderBufferDirect;
    gl.renderBufferDirect = function (camera, scene, geometry, material, object, group) {
      const target = gl.getRenderTarget();
      const pass = !target ? 'canvas' : target.isWebGLCubeRenderTarget ? 'cube' : (target.texture?.name || `rt${target.width}`);
      const key = `${material.name || material.type}|${object.name || object.type}|${pass}`;
      tally.set(key, (tally.get(key) ?? 0) + 1);
      total++;
      return orig.apply(this, arguments);
    };
    const f = window.app.frameCount;
    await new Promise((res) => { const tick = () => (window.app.frameCount > f + 1 ? res() : requestAnimationFrame(tick)); tick(); });
    gl.renderBufferDirect = orig;
    const calls = gl.info.render.calls;
    const byMat = new Map();
    for (const [k, n] of tally) { const m = k.split('|')[0]; byMat.set(m, (byMat.get(m) ?? 0) + n); }
    return { byMat: [...byMat].sort((a, b) => b[1] - a[1]), total, calls, top: [...tally].sort((a, b) => b[1] - a[1]).slice(0, 25) };
  });
  console.log(`\n== ${sc.name}: ${r.total} renderBufferDirect over ~2 frames (info.calls last pass ${r.calls})`);
  console.log('  by material:', r.byMat.map(([m, n]) => `${m} ${n / 2}`).join(', '));
  for (const [k, n] of r.top.slice(0, 8)) console.log(`  ${String(n).padStart(4)}  ${k}`);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/dc-${sc.name}.png`, timeout: 180000 });
  await page.close();
}
await browser.close();
