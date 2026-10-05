// Gameplay trailer footage "Take the controls": cockpit burn in LEO, chase cam, warp jump to the Moon.
// Usage: [RES=960x540] [EVERY=6] [AZ=40 EL=5] node scripts/trailer-ship.mjs <outDir>
// Fake clock (see trailer.mjs): one 1/24 s game step per frame, page capture through CDP so the DOM UI is included.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const FPS = 24;
const outDir = process.argv[2] || 'out-ship';
const [W, H] = (process.env.RES || '1920x1080').split('x').map(Number);
const EVERY = Number(process.env.EVERY || 1);
const AZ = process.env.AZ || '40', EL = process.env.EL || '5';
const TIME = process.env.TIME || '2026-10-01T20:00:00Z';
const CLIPS = [
  { id: 'a', sec: 5 },   // cockpit, full-throttle burn
  { id: 'b', sec: 4 },   // chase cam, engine burning
  { id: 'c', sec: 4 },   // warp jump toward the Moon
];

const INIT = () => {
  const realNow = performance.now.bind(performance);
  let fake = null;
  window.__setNow = (ms) => { fake = ms; };
  performance.now = () => (fake ?? realNow());
  const rAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => rAF((t) => cb(fake ?? t));
};
// keep the cockpit/flight HUD, the big warnings and the canopy; hide the info panel, status strip and stats bar
const CSS = '.hud-top,.hud-info,.hud-bottom,.hud-time,.hud-help,.hud-search{display:none !important}';

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(INIT);
const cdp = await page.context().newCDPSession(page);
await page.goto(`${BASE}?menu=0&governor=0&time=${TIME}&target=Earth&dist=1.0628&az=${AZ}&el=${EL}&ship=cockpit`, { waitUntil: 'load', timeout: 300000 });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 300000 });
await page.addStyleTag({ content: CSS });
await page.evaluate(() => { const a = window.app; a.labels.enabled = false; a.orbits.enabled = false; });

let tick = 0;
const rate = Number(process.env.RATE || 1);
const step = () => page.evaluate((t) => { window.__setNow(t); return new Promise((r) => requestAnimationFrame(() => r())); }, 100000 + (tick++ * 1000) / FPS);
const snap = async (file) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
};
const clipDir = (id) => { const d = path.join(outDir, id); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); return d; };
async function run(id, sec, onFrame) {
  const d = clipDir(id), n = Math.round(sec * FPS);
  for (let f = 0; f < n; f++) {
    if (onFrame) await onFrame(f);
    await step();
    if (f % EVERY === 0) await snap(path.join(d, `f${String(f).padStart(4, '0')}.jpg`));
  }
  console.log(`clip ${id}: ${n} frames, errors ${errors.length}`);
}
const warm = async (n) => { for (let k = 0; k < n; k++) await step(); };

// let exposure, textures and the orbit prediction settle (3 s of game time)
await page.evaluate(() => { window.app.clock.rate = 1; });
await warm(72);
await page.evaluate(() => console.log('ready'));
// (a) full-throttle burn, prograde held by SAS
await page.keyboard.down('KeyZ');
await page.evaluate((r) => { window.app.game.flight.sas = 'prograde'; window.app.clock.rate = r; }, rate);
await run('a', CLIPS[0].sec);
// (b) chase cam
// (the game switches flight physics off when going cockpit -> chase: board again, keeping the burning orbit)
await page.evaluate(() => { const f = window.app.game.flight, s = f.ship; window.__keep = { vel: s.vel.clone(), upos: s.upos.clone(), t: s.shipTime, u: f.universeTime }; });
await page.keyboard.press('KeyV');
await page.evaluate(() => {
  const a = window.app, f = a.game.flight, s = f.ship, k = window.__keep;
  f.enable(); s.vel.copy(k.vel); s.upos.copy(k.upos); a.rig.upos.copy(k.upos); f.core.syncRel(); s.shipTime = k.t; f.universeTime = k.u; f.sas = 'prograde'; s.throttle = 1;
});
await run('b', CLIPS[1].sec);
// (c) cut the engine, select the Moon, climb out of mass lock, warm up, then jump
await page.keyboard.up('KeyZ');
await page.keyboard.down('KeyX');
await page.evaluate(() => { const a = window.app; a.clock.rate = 1; a.select(a.findByName('Moon')); const e = a.findByName('Earth'); a.placeNear(e, e.radius * 12, 60, 10); });
await warm(5);
await page.keyboard.up('KeyX');
if (process.env.CABIN) await page.keyboard.press('KeyV');
await warm(72);
console.log('lock:', await page.evaluate(() => window.app.game.flight.massLock() || 'none'));
await page.keyboard.press('KeyJ');
await run('c', CLIPS[2].sec);
console.log('autopilot:', await page.evaluate(() => window.app.rig.autopilot));
await browser.close();

if (!process.env.NOENCODE) {
  for (const c of CLIPS) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS / EVERY), '-i', path.join(outDir, c.id, 'f%04d.jpg').replace(/f%04d/, 'f%04d'),
      '-c:v', 'libx264', '-crf', '16', '-preset', EVERY > 1 ? 'veryfast' : 'slow', '-pix_fmt', 'yuv420p', path.join(outDir, `ship-${c.id}.mp4`)]);
  }
}
