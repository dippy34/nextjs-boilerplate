// Pull away from the Milky Way (seen from outside) and log each frame's mean brightness, to catch
// one-frame flashes at level-of-detail switches. usage: node scripts/shots/mwpull.mjs <base> [from kpc] [to kpc] [step pc]
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const [from, to, step] = [Number(process.argv[3] ?? 15), Number(process.argv[4] ?? 60), Number(process.argv[5] ?? 400)];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
page.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 300)));
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 180000 });
await page.evaluate(() => {
  const a = window.app, r = a.renderer, orig = r.render.bind(r);
  window.__lum = [];
  r.render = (...args) => {
    orig(...args);
    const gl = r.gl.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    r.gl.setRenderTarget(null);
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let s = 0, white = 0;
    for (let i = 0; i < px.length; i += 4) { const l = (px[i] + px[i + 1] + px[i + 2]) / 3; s += l; if (l > 240) white++; }
    window.__lum.push({ f: a.frameCount, d: window.__d ?? a.rig.upos.sub(a.milkyWay.upos).length() / 3.0856775814913673e16, mean: +(s / (w * h)).toFixed(1), white });
  };
});
if (process.env.FLY) {
  // a real flight outwards (the rig's own easing), every frame logged
  await page.evaluate((dd) => { const a = window.app, mw = a.milkyWay; const v = mw.viewDir();
    a.rig.upos.copy(mw.upos).addVec(v, dd * 3.0856775814913673e16); a.rig.lookAt(v.clone().negate());
    a.rig.flyTo(mw, mw.radius * 6, undefined, true, v); }, from * 1000);
  const f0 = await page.evaluate(() => window.app.frameCount);
  await page.waitForFunction((x) => window.app.frameCount > x + Number(600), f0, { timeout: 1500000 });
}
else for (let d = from * 1000; d <= to * 1000; d += step) {
  await page.evaluate((dd) => { const a = window.app, mw = a.milkyWay; window.__d = dd;
    const v = mw.viewDir(); a.rig.upos.copy(mw.upos).addVec(v, dd * 3.0856775814913673e16); a.rig.lookAt(v.clone().negate()); }, d);
  const f = await page.evaluate(() => window.app.frameCount);
  await page.waitForFunction((x) => window.app.frameCount > x + 1, f, { timeout: 120000 });
}
const lum = await page.evaluate(() => window.__lum);
let prev = null;
for (const l of lum) { if (l.d == null) continue; const jump = prev ? l.mean - prev.mean : 0; if (process.env.FLY && Math.abs(jump) <= 8 && l.f % 20) { prev = l; continue; } console.log(`${(l.d / 1000).toFixed(1)}kpc f${l.f} mean ${l.mean} white ${l.white}${Math.abs(jump) > 8 ? '  <-- JUMP ' + jump.toFixed(1) : ''}`); prev = l; }
await browser.close();
