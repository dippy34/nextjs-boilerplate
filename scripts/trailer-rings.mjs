// Gameplay trailer clips "Fly anywhere": (a) the ship skims through Saturn's rings, (b) docks at a station.
// Usage: [RES=960x540] [STEP=6] node scripts/trailer-rings.mjs <outDir> [a|b ...]
// Fake clock (see trailer.mjs): every frame is exactly 1/24 s of game time, captured with CDP incl. the game UI.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const FPS = 24;
const [outDir = '/tmp/w/out', ...only] = process.argv.slice(2);
const [W, H] = (process.env.RES || '1920x1080').split('x').map(Number);
const STEP = Number(process.env.STEP || 1); // capture every STEP-th frame (cheap tests); all frames are simulated
const T0 = '2026-10-01T20:00:00Z';

const INIT = () => {
  const realNow = performance.now.bind(performance);
  let fake = null;
  window.__setNow = (ms) => { fake = ms; };
  performance.now = () => (fake ?? realNow());
  const rAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => rAF((t) => cb(fake ?? t));
  window.__V = () => window.app.renderer.camera.position.constructor;
};

const HIDE = '.hud-info,.hud-bottom,.hud-top,#labels{display:none !important}';

const SHOTS = [
  { id: 'a', sec: 5.5,
    url: `time=${T0}&target=${encodeURIComponent("Saturn's rings")}&ship=chase`,
    // ship dives through the B ring plane at 450 m/s: ice chunks streak past, Saturn on the horizon
    setup: () => {
      const a = window.app, f = a.game.flight, s = f.ship, D = f.core.frame, V = window.__V();
      const spot = a.findByName("Saturn's rings"), pl = spot.planet, e = pl.orientation.elements;
      const pole = new V(e[8], e[9], e[10]).normalize();
      s.upos.copy(spot.upos);
      const rel = s.upos.sub(pl.upos, new V());
      const h0 = rel.dot(pole), sgn = h0 >= 0 ? 1 : -1;
      s.upos.addVec(pole, sgn * 14 - h0); // 14 m above the ring plane, on the lit face
      const radial = rel.clone().addScaledVector(pole, -rel.dot(pole)).normalize();
      const tang = new V().crossVectors(pole, radial).normalize();
      const vel = tang.clone().multiplyScalar(560 * Math.cos(0.5)).addScaledVector(radial, -560 * Math.sin(0.5)).addScaledVector(pole, -sgn * 4.5);
      s.vel.copy(D.vel).add(vel);
      const fwd = vel.clone().normalize(), up = pole.clone().multiplyScalar(sgn);
      const x = new V().crossVectors(fwd, up).normalize(), y = new V().crossVectors(x, fwd).normalize();
      const M = a.renderer.camera.matrix.constructor;
      s.quat.setFromRotationMatrix(new M().makeBasis(x, y, fwd.clone().negate()));
      s.angVel.set(0, 0, 0); s.throttle = 0; f.core.syncRel(); a.rig.upos.copy(s.upos);
      window.__shot = { sgn, pole };
    },
    frame: (f) => { window.app.game.flight.ship.throttle = f > 24 ? 0.5 : 0; },
  },
  { id: 'b', sec: 5.5, twice: true, url: `time=${T0}&target=Earth&dist=1.07&az=40&el=5&ship=cockpit`,
    // 260 m out on the hub axis at 90 m/s closing: throttle up at 1 s hands over to the docking computer
    setup: () => {
      const a = window.app, f = a.game.flight, s = f.ship, V = window.__V();
      const st = a.game.traffic.stations[0];
      a.select(st);
      s.upos.copy(st.port()).addVec(st.axis, window.__D0 || 260);
      s.vel.copy(st.body.vel).add(st.vel).addScaledVector(st.axis, -(window.__V0||90));
      const fwd = st.axis.clone().negate(), up = Math.abs(fwd.z) < 0.9 ? new V(0, 0, 1) : new V(1, 0, 0);
      const M = a.renderer.camera.matrix.constructor;
      s.quat.setFromRotationMatrix(new M().lookAt(new V(), fwd, up));
      s.angVel.set(0, 0, 0); s.throttle = 0; f.core.syncRel(); a.rig.upos.copy(s.upos);
    },
    frame: (f) => { if (f === 24 && !window.__NODOCK) window.app.game.flight.ship.throttle = 0.2; },
  },
];

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'] });
for (const shot of SHOTS) {
  if (only.length && !only.includes(shot.id)) continue;
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(INIT);
  const cdp = await page.context().newCDPSession(page);
  await page.goto(`${BASE}?menu=0&governor=0&${shot.url}`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 300000 });
  await page.addStyleTag({ content: HIDE });
  await page.evaluate(() => { const a = window.app; a.labels.enabled = false; a.orbits.enabled = false; });
  if (process.env.PRE) await page.evaluate(process.env.PRE);
  const step = (ms, fn, arg) => page.evaluate(([t, src, x]) => { window.__setNow(t); if (src) (0, eval)(`(${src})`)(x); return new Promise((r) => requestAnimationFrame(() => r())); }, [ms, fn && fn.toString(), arg]);
  // settle: ~3 s of game time at the start state
  let ms = 100000;
  for (let k = 0; k < 72; k++) { ms += 1000 / FPS; await step(ms); }
  await page.evaluate(`(${shot.setup.toString()})()`);
  const n = Math.round(shot.sec * FPS), dir = path.join(outDir, shot.id);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    ms += 1000 / FPS;
    await step(ms, shot.frame, f);
    // the game places the station before the docking computer snaps the camera: render again at the same instant
    if (shot.twice) await step(ms);
    if (f % STEP) continue;
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true });
    fs.writeFileSync(path.join(dir, `f${String(f / STEP).padStart(4, '0')}.jpg`), Buffer.from(data, 'base64'));
  }
  if (process.env.DBG) console.log(JSON.stringify(await page.evaluate(process.env.DBG)));
  console.log(`${shot.id}: ${n} frames in ${Math.round((Date.now() - t0) / 1000)} s, errors ${errors.length}${errors.length ? ' ' + errors[0].slice(0, 160) : ''}`);
  await page.close();
  if (STEP === 1) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'),
    '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', path.join(outDir, `rings-${shot.id}.mp4`)]);
}
await browser.close();
