// Star review shots: the sky as points (from space and from a surface), nearby stars (glare,
// spikes, corona) and star surfaces up close. LITE=1 renders with the headset tier's shaders.
// usage: [LITE=1] [ONLY=name,name] node scripts/shots/stars.mjs http://127.0.0.1:4174/ /tmp/out/stars
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/stars';
const T = '2026-10-01T12:00:00Z';
export const SCENES = [
  // the sky as points
  { name: 'a1-sky-sagittarius', query: `target=Pluto&dist=40&look=Sagittarius A*&fov=70` },
  { name: 'a2-sky-orion', query: `target=Earth&dist=1.6&az=180&el=0&look=Betelgeuse&fov=70` },
  { name: 'a3-sky-cygnus', query: `target=Pluto&dist=40&look=Deneb&fov=50` },
  { name: 'a4-sky-narrow-pleiades', query: `target=Pluto&dist=40&look=Alcyone&fov=12` },
  { name: 'a5-moon-surface-night', query: `target=Moon&dist=1.004&az=0&el=-2&look=Rigel&fov=80` },
  // nearby stars
  { name: 'b1-sun-1au', query: `target=Sun&dist=215&az=30&el=5&fov=60` },
  { name: 'b2-alpha-cen-3au', query: `target=Rigil Kentaurus&dist=530&fov=60` },
  { name: 'b3-sirius-light-hours', query: `target=Sirius&dist=2500&fov=60` },
  // surfaces up close
  { name: 'c1-sun-close', query: `target=Sun&dist=2.2&fov=60` },
  { name: 'c2-proxima-close', query: `target=Proxima Centauri&dist=2.5&fov=60` },
  { name: 'c3-betelgeuse-close', query: `target=Betelgeuse&dist=2.5&fov=60` },
  { name: 'c4-rigel-close', query: `target=Rigel&dist=2.5&fov=60` },
  { name: 'c5-vega-close', query: `target=Vega&dist=2.5&fov=60` },
  { name: 'c6-sirius-b-close', query: `target=Sirius B&dist=2.5&fov=60` },
  { name: 'c7-sun-surface', query: `target=Sun&dist=1.04&el=10&fov=60` },
  { name: 'c8-betelgeuse-surface', query: `target=Betelgeuse&dist=1.15&el=10&fov=60` },
];
const only = new Set((process.env.ONLY ?? '').split(',').filter(Boolean));
const lite = process.env.LITE === '1';
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
  await page.evaluate((lite) => {
    const a = window.app;
    a.labels.enabled = false;
    if (a.orbits) a.orbits.enabled = false;
    for (const el of document.querySelectorAll('.hud, #hud, .panel, .info')) el.style.display = 'none';
    if (lite) a.renderer.scene.traverse((o) => { const u = o.material?.uniforms?.uLite; if (u) u.value = 1; });
  }, lite);
  await frames(Number(process.env.SETTLE ?? 40));
  const sel = await page.evaluate(() => window.app.selection?.name ?? null);
  await page.screenshot({ path: `${out}-${sc.name}.png`, timeout: 300000 });
  console.log('shot', sc.name, sel);
}
// d1: star tiles streaming over a slow connection (as on a headset on weak Wi-Fi): the first frame
// with Vega's disk, while the eye is still adapted to the dark, must not be black (an additive layer
// over a disk shown far above white overflowed half-float and turned into NaN blocks in the bloom)
let failed = false;
if (!only.size || only.has('d1-vega-streaming')) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 5e6 / 8, uploadThroughput: 1e6 / 8 });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${base}?time=2026-10-01T20:00:00Z&paused=1&target=Vega&dist=4&az=40&el=10`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.app && window.app.frameCount >= 2, null, { timeout: 900000 });
  // stop the loop right after the first frame that draws Vega's disk
  await page.evaluate(() => {
    const a = window.app; const r = a.renderer; const rr = r.render.bind(r);
    r.render = () => { rr(); if (!window.__vegaFrame && a.near.stars.length) { window.__vegaFrame = a.frameCount; a.renderer.gl.setAnimationLoop(null); } };
  });
  await page.waitForFunction(() => window.__vegaFrame, null, { timeout: 900000 });
  const png = await page.screenshot({ path: `${out}-d1-vega-streaming.png` });
  const black = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(img.width / 4, img.height / 4, img.width / 2, img.height / 2).data;
    let n = 0; for (let i = 0; i < d.length; i += 4) if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] < 8) n++;
    return n / (d.length / 4);
  }, png.toString('base64'));
  const ok = black < 0.3;
  failed ||= !ok;
  console.log(`${ok ? 'PASS' : 'FAIL'} d1-vega-streaming: central half black ${(black * 100).toFixed(1)} % (frame ${await page.evaluate(() => window.__vegaFrame)})`);
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
}
console.log('errors', errors.length, errors.slice(0, 3).join(' | '));
if (failed) process.exitCode = 1;
await browser.close();
