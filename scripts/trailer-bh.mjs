// Gameplay trailer clips "Real physics, real consequences": re-entry glow, tidal warning at Cygnus X-1, TORN APART.
// Usage: RES=960x540 STRIDE=6 node scripts/trailer-bh.mjs <outDir> [a b c]   (STRIDE>1 = cheap test, every Nth frame)
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const FPS = 24, STRIDE = +(process.env.STRIDE || 1);
const [outDir = '/tmp/bh-out', ...only] = process.argv.slice(2);
const [W, H] = (process.env.RES || '1920x1080').split('x').map(Number);

const INIT = () => {
  const realNow = performance.now.bind(performance);
  let fake = null;
  window.__setNow = (ms) => { fake = ms; };
  performance.now = () => (fake ?? realNow());
  const rAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => rAF((t) => cb(fake ?? t));
};
const HIDE = '.hud-info,.hud-bottom,.hud-top,.hud-help,.fl-keys{display:none !important}';

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(INIT);
const cdp = await page.context().newCDPSession(page);
await page.goto(`${BASE}?menu=0&governor=0&time=2026-10-01T20:00:00Z&target=Earth&dist=1.0628&az=40&el=5&ship=cockpit`, { waitUntil: 'load', timeout: 300000 });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 300000 });
await page.addStyleTag({ content: HIDE });
await page.evaluate(() => { const a = window.app; a.labels.enabled = false; a.orbits.enabled = false; a.select(null); });

let clock = 100000;
const tick = (fn, arg) => page.evaluate(([t, f, a]) => { window.__setNow(t); if (f) new Function('a', 'return (' + f + ')(a)')(a); return new Promise((r) => requestAnimationFrame(() => r())); }, [clock += 1000 / FPS, fn ? String(fn) : null, arg]);
const key = (k, down) => page.keyboard[down ? 'down' : 'up'](k);
const grab = async (file) => { const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true }); fs.writeFileSync(file, Buffer.from(data, 'base64')); };
const q = (fn) => page.evaluate(fn);
const log = async (tag) => console.log(tag, JSON.stringify(await q(() => { const f = window.app.game.flight, r = f.readout; return { frame: r.frame, alt: Math.round(r.altitude), heat: Math.round(f.ship.heatFlux / 1e3), tidal: +(r.tidal / 9.80665).toFixed(1), warn: r.warning, end: f.ending?.title ?? null }; })));

// record n frames; per(i) returns an optional state fn+arg run before each frame
async function record(id, n, per) {
  const dir = path.join(outDir, id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < n; i++) {
    const p = per ? per(i) : null;
    await tick(p?.[0], p?.[1]);
    if (i % STRIDE === 0) { await tick(); clock -= 1000 / FPS; await grab(path.join(dir, `f${String(i).padStart(4, '0')}.jpg`)); }
  }
  await log(id + ' end');
  if (STRIDE === 1) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'), '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', path.join(outDir, `bh-${id}.mp4`)]);
  }
}
const want = (id) => !only.length || only.includes(id);
const warm = async (n, per) => { for (let i = 0; i < n; i++) { const p = per?.(i); await tick(p?.[0], p?.[1]); } };

// ---- (a) re-entry, chase cam
await warm(30);
if (want('a')) {
  await tick('() => window.app.game.setMode(\'off\')'); await warm(2); await tick('() => window.app.game.setMode(\'chase\')'); await warm(8); // chase view with physics on (cockpit->chase would switch flight off)
  await tick(`() => { const a = window.app; a.select(null); const f = a.game.flight; const D = f.core.frame; const rel = f.ship.upos.sub(D.upos); f.core.setCircularOrbit(D, D.radius + ${+(process.env.ALT || 62e3)}, rel, new rel.constructor(0, 0, 1)); a.rig.upos.copy(f.ship.upos); f.sas = 'retrograde'; }`);
  await warm(40);
  let n = 0;
  while (n++ < 12 && (await q(() => window.app.game.flight.ship.heatFlux)) < 2.5e5) { await warm(6); await log('a warm'); }
  console.log('a: warm frames', n * 6); await log('a start');
  await record('a', 96);
}

// ---- (b) approach: tides climb, (c) too close: TORN APART. One scene, orbit radius scripted per frame.
if (want('b') || want('c')) {
  await tick(`() => { const a = window.app; a.game.setMode('off'); const h = a.findByName('Cygnus X-1'); a.select(h); a.placeNear(h, 2e7, +${process.env.AZ || 20}, +${process.env.EL || 8}); }`);
  await warm(4);
  await tick(`() => { const a = window.app; a.game.setMode('cockpit'); a.rig.fov = +${process.env.FOV || 60}; }`);
  await warm(6);
  const RL = await q(() => { const D = window.app.game.flight.core.frame; return Math.cbrt((2 * D.gm * 22) / (100 * 9.80665)); });
  console.log('rl', RL);
  const orbit = (k) => `() => { const a = window.app; const f = a.game.flight; if (f.ending) return; const D = f.core.frame; const rel = f.ship.upos.sub(D.upos); f.core.setCircularOrbit(D, ${RL} * ${k}, rel, new rel.constructor(0, 0, 1)); a.rig.upos.copy(f.ship.upos); f.sas = 'target'; }`;
  const K0 = +(process.env.K0 || 2.4), K1 = +(process.env.K1 || 1.12);
  await warm(72, () => [orbit(K0)]);
  const kb = (i) => K0 + (K1 - K0) * Math.pow(i / 95, 1.3);
  if (want('b')) await record('b', 96, (i) => [orbit(kb(i))]);
  else await warm(96, (i) => [orbit(kb(i))]);
  if (want('c')) {
    const kc = (i) => K1 - (K1 - 0.4) * Math.min(1, i / 40);
    await record('c', 72, (i) => [orbit(kc(i))]);
  }
}
await browser.close();
console.log('errors', errors.length, errors[0] || '');
