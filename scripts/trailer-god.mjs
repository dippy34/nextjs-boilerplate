// Gameplay clips for the trailer, "Or play God": reverse Earth's orbit, hurl the Moon into Mars, black hole eats Earth.
// Fake clock + CDP page capture (game UI included), 24 fps. Usage:
//   RES=960x540 STEP=6 node scripts/trailer-god.mjs <outDir> [a b c]   cheap test (every STEP-th frame, no encode)
//   node scripts/trailer-god.mjs <outDir> [a b c]                      full 1920x1080 render, encodes god-<id>.mp4
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const FPS = 24;
const STEP = Number(process.env.STEP || 1);
const [outDir = '/tmp/god-out', ...only] = process.argv.slice(2);
const [W, H] = (process.env.RES || '1920x1080').split('x').map(Number);
const T0 = '2026-10-01T20:00:00Z';

const INIT = () => {
  const realNow = performance.now.bind(performance);
  let fake = null;
  window.__setNow = (ms) => { fake = ms; };
  performance.now = () => (fake ?? realNow());
  const rAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => rAF((t) => cb(fake ?? t));
};
// hide the selection info panel and the bottom strip; keep the time readout, God panel and toasts
const CSS = '.hud-info,.hud-bottom,.hud-top{display:none !important}';

const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// Camera helper: orbit `name` at `dist` metres, az/el degrees (placeNear points the camera at the body)
const cam = (name, dist, az, el) => `(()=>{const a=window.app;a.placeNear(a.findByName(${JSON.stringify(name)}),${dist},${az},${el});})()`;

// Ecliptic-frame camera: R metres from `name`, az/el degrees about the ecliptic pole, looking at it turned `yaw` degrees
// (so the body sits off to one side, clear of the God panel on the right)
const ecl = (name, R, az, el, yaw, fov) => `(()=>{const a=window.app,o=a.findByName(${JSON.stringify(name)}),V=a.renderer.camera.position.constructor;
const rot=(v,k,d)=>{const r=d*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return v.clone().multiplyScalar(c).add(k.clone().cross(v).multiplyScalar(s)).add(k.clone().multiplyScalar(k.dot(v)*(1-c)));};
const e1=new V(1,0,0),e3=new V(0,-0.3977771559,0.9174820621),e2=e3.clone().cross(e1),A=${az}*Math.PI/180,E=${el}*Math.PI/180;
const u=e1.clone().multiplyScalar(Math.cos(E)*Math.cos(A)).add(e2.clone().multiplyScalar(Math.cos(E)*Math.sin(A))).add(e3.clone().multiplyScalar(Math.sin(E)));
a.rig.upos.copy(o.upos).addVec(u,${R});let d=u.clone().negate();d=rot(d,e3,${yaw});a.rig.lookAt(d.normalize(),e3);a.rig.fov=${fov};})()`;

// Side-on camera for the Moon/Mars hit: D metres off Mars, perpendicular to the Moon's line of approach, with the Moon coming in from the left
const side = (D, yaw, fov) => `(()=>{const a=window.app,m=a.findByName('Mars'),V=a.renderer.camera.position.constructor;
const rot=(v,k,d)=>{const r=d*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return v.clone().multiplyScalar(c).add(k.clone().cross(v).multiplyScalar(s)).add(k.clone().multiplyScalar(k.dot(v)*(1-c)));};
const up=new V(0,-0.3977771559,0.9174820621),p=new V(...window.__p);
a.rig.upos.copy(m.upos).addVec(p,${D}).addVec(up,${D}*0.12);
let d=m.upos.sub(a.rig.upos,new V()).normalize();d=rot(d,up,${yaw});a.rig.lookAt(d.normalize(),up);a.rig.fov=${fov};})()`;

// Black-hole shot: camera on the sunlit side, hole at the left and Earth falling in from the right; `D` is the camera's distance from
// the hole, and the aim point slides from mid-way along Earth's fall (k) onto the hole, so a dolly-in ends on the lensing
const hole = (D, k, yaw, fov) => `(()=>{const a=window.app,V=a.renderer.camera.position.constructor,h=a.blackHoles.find((x)=>x.key==='god:'+window.__holeId);
const rot=(v,k,d)=>{const r=d*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return v.clone().multiplyScalar(c).add(k.clone().cross(v).multiplyScalar(s)).add(k.clone().multiplyScalar(k.dot(v)*(1-c)));};
const up=new V(0,-0.3977771559,0.9174820621),n=new V(...window.__n),sun=new V(...window.__s);
a.rig.upos.copy(h.upos).addVec(sun,${D}).addVec(up,${D}*0.3);
const T=h.upos.clone();T.addVec(n,${k});
let d=T.sub(a.rig.upos,new V()).normalize();d=rot(d,up,${yaw});a.rig.lookAt(d.normalize(),up);a.rig.fov=${fov};})()`;

const CLIPS = {
  // (a) 4 s: God panel on Earth, reverse orbit, fast time with orbit lines: Earth runs backwards round the Sun
  a: {
    sec: 4,
    url: `time=${T0}&paused=1&target=Earth&dist=60&az=60&el=25`,
    async setup(page) {
      await page.keyboard.press('KeyY');
      await page.evaluate(() => { const a = window.app; a.orbits.enabled = true; a.labels.enabled = true; a.select(a.system.byId.get(399)); a.clock.paused = true; });
    },
    pre: () => ecl('Sun', 3.6e11, 20, 50, 9, 62),
    start: async (page) => {
      await page.click('button[data-a="v"][data-k="reverse"]');
      await page.evaluate(() => { const a = window.app; a.orbits.enabled = true; a.labels.enabled = true; a.clock.paused = false; });
    },
    frame: (f, n) => ({ rate: 86400 * lerp(6, 40, ease(f / (n - 1))), cam: ecl('Sun', 3.6e11, 20 + f * 0.1, 50, 9, 62) }),
  },
  // (b) 4 s: Moon thrown at Mars, close camera on Mars, collision flash
  b: {
    sec: 4,
    url: `time=${T0}&paused=1&target=Mars&dist=30&az=60&el=25`,
    async setup(page) {
      await page.keyboard.press('KeyY');
      await page.click('input[data-c="nbody"]');
      await page.evaluate((B) => {
        const a = window.app, sb = a.god.sandbox, m = sb.entityOf(301), mars = sb.entityOf(499);
        const dir = m.pos.clone().sub(mars.pos).normalize();
        // camera on the sunlit side (Mars lit full), Moon flung in from the left, perpendicular to the sun line
        const up = new dir.constructor(0, -0.3977771559, 0.9174820621);
        const sunl = a.system.sun.pos.clone().sub(mars.pos); sunl.addScaledVector(up, -sunl.dot(up)).normalize();
        window.__p = sunl.toArray();
        dir.copy(sunl.clone().cross(up).normalize());
        a.god.setPosition(301, mars.pos.clone().addScaledVector(dir, B.start), mars.vel.clone().addScaledVector(dir, -B.v));
        a.select(a.system.byId.get(499)); a.god.panel.refresh(); a.labels.enabled = false;
      }, B);
    },
    pre: () => side(B.dist, B.yaw, B.fov),
    start: async (page) => { await page.evaluate(() => { window.app.clock.paused = false; }); },
    frame: (f, n) => ({ rate: B.rate, cam: side(B.dist, B.yaw, B.fov) }),
  },
  // (c) 5 s: black hole next to Earth with N-body on; Earth is dragged in and swallowed
  c: {
    sec: 5,
    url: `time=${T0}&paused=1&target=Earth&dist=20&az=60&el=25`,
    async setup(page) {
      await page.keyboard.press('KeyY');
      await page.click('input[data-c="nbody"]');
      await page.evaluate((d) => {
        const a = window.app, e = a.system.byId.get(399);
        const V = e.pos.constructor, e3 = new V(0, -0.3977771559, 0.9174820621); // hole 90 degrees off the Sun line, so the camera sees a half-lit Earth and keeps the Sun out of frame
        const sd = a.system.sun.pos.clone().sub(e.pos).normalize(), sun = e3.clone().cross(sd).normalize();
        window.__s = sd.toArray();
        const pos = e.pos.clone().addScaledVector(sun, -d); // Earth ends up to the right of the hole in the shot
        window.__holeId = a.god.spawn('hole', 10, pos);
        window.__n = sun.toArray();
        a.labels.enabled = !!window.__labels;
      }, C.hole);
    },
    pre: () => hole(C.D0, C.k, C.yaw, C.fov),
    start: async (page) => { await page.evaluate(() => { window.app.clock.paused = false; }); },
    frame: (f, n) => {
      // wide for the fall, then dolly in on the hole (log-eased) once Earth is gone
      const t = ease(Math.min(1, Math.max(0, (f / (n - 1) - C.dollyAt) / (C.dollyEnd - C.dollyAt))));
      return { rate: C.rate, cam: hole(C.D0 * (C.D1 / C.D0) ** t, C.k * (1 - t), C.yaw, C.fov) };
    },
  },
};
// tunables found while testing
const B = { dist: 3e7, yaw: -4, fov: 55, start: 3.2e7, v: 12000, rate: 1000 };
const C = { hole: 1e8, D0: 1.3e8, D1: 3e6, k: 1e8, yaw: 0, fov: 60, rate: 9, dollyAt: 0.62, dollyEnd: 0.8 };
for (const k of (process.env.TUNE || '').split(',').filter(Boolean)) { const [o, key, v] = k.split(/[.=]/); ({ B, C })[o][key] = Number(v); }

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'] });
for (const [id, clip] of Object.entries(CLIPS)) {
  if (only.length && !only.includes(id)) continue;
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(INIT);
  const cdp = await page.context().newCDPSession(page);
  await page.goto(`${BASE}?menu=0&governor=0&${clip.url}`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.app && window.app.frameCount > 10 && window.app.god, null, { timeout: 300000 });
  await page.addStyleTag({ content: CSS });
  await page.evaluate(() => { const a = window.app; a.labels.enabled = false; a.orbits.enabled = false; });
  if (process.env.LABELS) await page.evaluate(() => { window.__labels = true; });
  await clip.setup(page);
  const n = Math.round(clip.sec * FPS);
  const dir = path.join(outDir, `god-${id}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const step = async (ms, camExpr) => page.evaluate(([t, c]) => { window.__setNow(t); eval(c); return new Promise((r) => requestAnimationFrame(() => r())); }, [ms, camExpr]);
  // 3 s warm-up at the starting state (time paused) so exposure and textures settle
  for (let k = 72; k > 0; k--) await step(100000 - (k * 1000) / FPS, clip.pre());
  await clip.start(page);
  const t0 = Date.now();
  for (let f = 0; f < n; f += STEP) {
    const ms = 100000 + (f * 1000) / FPS, fr = clip.frame(f, n);
    // with STEP>1 the clock still has to advance by the skipped frames: set the rate and step through them
    for (let g = Math.max(0, f - STEP + 1); g <= f; g++) {
      const fg = clip.frame(g, n);
      await page.evaluate((r) => { window.app.clock.rate = r; }, fg.rate);
      await step(100000 + (g * 1000) / FPS, fg.cam);
    }
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true });
    fs.writeFileSync(path.join(dir, `f${String(f / STEP).padStart(4, '0')}.jpg`), Buffer.from(data, 'base64'));
  }
  console.log(`${id}: ${Math.ceil(n / STEP)} frames in ${Math.round((Date.now() - t0) / 1000)} s, errors ${errors.length}${errors.length ? ' ' + errors[0].slice(0, 160) : ''}`);
  await page.close();
  if (STEP === 1) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'),
      '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', path.join(outDir, `god-${id}.mp4`)]);
  }
}
await browser.close();
