// Trailer renderer: drives the game's camera frame by frame with a fake clock, screenshots each frame,
// encodes each shot to an MP4. Usage:
//   node scripts/_trailer.mjs story <outDir>              one still per shot (960x540), for framing
//   node scripts/_trailer.mjs render <outDir> [shot ...]   full frames at 1920x1080, 30 fps
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const FPS = 24;
const [mode = 'story', outDir = '/tmp/claude-0/trailer/out', ...only] = process.argv.slice(2);
const T0 = '2026-10-01T20:00:00Z';

// Each shot: URL to load, duration, and a camera keyframe pair (a -> b) eased over the shot.
// cam kinds: body (placeNear + optional look/yaw/pitch), bh (disk-plane approach), pc (galactic position in parsecs)
const SHOTS = [
  { id: '01-sky', sec: 7, url: `time=${T0}&paused=1&target=Pluto&dist=40&look=Sagittarius A*&fov=62`,
    a: { kind: 'body', name: 'Pluto', dist: 40, az: 35, el: 15, lookName: 'Sagittarius A*', yaw: -9, pitch: -2, fov: 62 },
    b: { kind: 'body', name: 'Pluto', dist: 40, az: 35, el: 15, lookName: 'Sagittarius A*', yaw: 6, pitch: 2, fov: 54 } },
  { id: '02-earth', sec: 5.5, url: `time=${T0}&paused=1&target=Earth&dist=3&fov=55`,
    a: { kind: 'body', name: 'Earth', dist: 2.5, az: 124, el: 10, yaw: 0, pitch: 0, fov: 55 },
    b: { kind: 'body', name: 'Earth', dist: 2.1, az: 134, el: 6, yaw: 0, pitch: 0, fov: 60 } },
  { id: '03-saturn', sec: 5.5, url: `time=${T0}&paused=1&target=Saturn&dist=2.6&az=40&el=4&fov=70`,
    a: { kind: 'body', name: 'Saturn', dist: 2.62, az: 39, el: 4.4, yaw: -13, pitch: 0, fov: 72 },
    b: { kind: 'body', name: 'Saturn', dist: 2.0, az: 52, el: 2.2, yaw: -6, pitch: 0, fov: 72 } },
  { id: '04-moon', sec: 4.5, url: `time=2026-10-14T06:00:00Z&paused=1&target=Moon&dist=3&fov=60`,
    a: { kind: 'rise', name: 'Moon', lookName: 'Earth', dist: 1.02, rise: -12.2, pitch: -1.5, fov: 14 },
    b: { kind: 'rise', name: 'Moon', lookName: 'Earth', dist: 1.02, rise: -10.0, pitch: -1.5, fov: 14 } },
  { id: '05-betelgeuse', sec: 3.5, url: `time=${T0}&paused=1&target=Betelgeuse&dist=3&fov=70`,
    a: { kind: 'body', name: 'Betelgeuse', dist: 2.4, az: 30, el: 10, yaw: 0, pitch: 0, fov: 70 },
    b: { kind: 'body', name: 'Betelgeuse', dist: 1.55, az: 45, el: 8, yaw: 8, pitch: 4, fov: 72 } },
  { id: '06-orion', sec: 5, url: `time=${T0}&paused=1&target=Orion Nebula&dist=1.5&fov=70`,
    a: { kind: 'body', name: 'Orion Nebula', dist: 1.2, az: 37, el: 14, yaw: 0, pitch: 0, fov: 68 },
    b: { kind: 'body', name: 'Orion Nebula', dist: 0.32, az: 42, el: 12, yaw: 4, pitch: 2, fov: 74 } },
  { id: '07-milkyway', sec: 4, url: `time=${T0}&paused=1&campc=-35159,-15148,14226&look=Sagittarius A*&fov=60`,
    a: { kind: 'pc', pc: [-21000, -9050, 8400], lookName: 'Sagittarius A*', yaw: 0, pitch: 0, fov: 62 },
    b: { kind: 'pc', pc: [-30500, -13150, 12350], lookName: 'Sagittarius A*', yaw: 2, pitch: -1.5, fov: 60 } },
  { id: '08-andromeda', sec: 5.5, url: `time=${T0}&paused=1&target=Andromeda Galaxy&dist=3&fov=60`,
    a: { kind: 'gal', name: 'Andromeda Galaxy', dist: 3.6, yaw: 0, pitch: 0, fov: 60 },
    b: { kind: 'gal', name: 'Andromeda Galaxy', dist: 2.3, yaw: 5, pitch: 2, fov: 62 } },
  { id: '09-blackhole', sec: 8, url: `time=${T0}&paused=1&target=Cygnus X-1&dist=60&fov=70`,
    a: { kind: 'bh', name: 'Cygnus X-1', dist: 70, orbit: -6, yaw: 0, pitch: 0, fov: 66 },
    b: { kind: 'bh', name: 'Cygnus X-1', dist: 7.5, orbit: 14, yaw: 0, pitch: 0, fov: 80 } },
];

if (process.env.SHOTS) SHOTS.splice(0, SHOTS.length, ...JSON.parse(fs.readFileSync(process.env.SHOTS, 'utf8')));

const ease = (t) => t * t * (3 - 2 * t); // smoothstep: heavy start and stop
const lerp = (a, b, t) => (typeof a === 'number' ? a + (b - a) * t : Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], t)) : a);
const mix = (A, B, t) => Object.fromEntries(Object.keys(A).map((k) => [k, lerp(A[k], B[k], t)]));

// injected before the app: a controllable clock, and a camera helper
const INIT = () => {
  const realNow = performance.now.bind(performance);
  let fake = null;
  window.__setNow = (ms) => { fake = ms; };
  performance.now = () => (fake ?? realNow());
  const rAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => rAF((t) => cb(fake ?? t));
  // read the frame back in the same animation frame the app drew it (Playwright's screenshot costs ~20 s under SwiftShader)
  window.__grab = (q) => new Promise((r) => rAF(() => r(window.app.renderer.gl.domElement.toDataURL('image/jpeg', q))));
  const PC = 3.0856775814913673e16;
  window.__cam = (c) => {
    const a = window.app; const V = a.renderer.camera.position.constructor;
    const rot = (v, axis, deg) => { // Rodrigues
      const r = (deg * Math.PI) / 180, k = axis.clone().normalize(), cos = Math.cos(r), sin = Math.sin(r);
      return v.clone().multiplyScalar(cos).add(k.clone().cross(v).multiplyScalar(sin)).add(k.clone().multiplyScalar(k.dot(v) * (1 - cos)));
    };
    let dir, up = new V(0, 0, 1);
    if (c.kind === 'pc') {
      a.rig.upos.set(c.pc[0] * PC, c.pc[1] * PC, c.pc[2] * PC);
      dir = a.findByName(c.lookName).upos.sub(a.rig.upos, new V()).normalize();
    } else {
      const obj = a.findByName(c.name);
      const R = Math.max(obj.radius, 1);
      if (c.kind === 'rise') {
        // camera just above the body's limb, `rise` degrees from perpendicular to the target: target rises over the horizon
        const tgt = c.lookName === 'Sun' ? a.system.sun : a.findByName(c.lookName);
        const u = tgt.upos.sub(obj.upos, new V()).normalize();
        const sun = a.system.sun.upos.sub(obj.upos, new V()).normalize();
        const p = (c.lookName === 'Sun' ? new V(0, 0, 1) : sun).clone();
        p.sub(u.clone().multiplyScalar(p.dot(u))).normalize();
        const q0 = c.spin ? rot(p, u, c.spin) : p;
        const ar = (c.rise * Math.PI) / 180;
        const q = q0.clone().multiplyScalar(Math.cos(ar)).add(u.clone().multiplyScalar(Math.sin(ar))).normalize();
        a.rig.upos.copy(obj.upos).addVec(q, c.dist * obj.radius);
        dir = tgt.upos.sub(a.rig.upos, new V()).normalize(); up = q.clone();
      } else if (c.kind === 'bh') {
        window.__bhDir ??= obj.approachDir(a.rig.upos.sub(obj.upos, new V())).clone();
        const d0 = rot(window.__bhDir, obj.diskNormal, c.orbit || 0);
        a.rig.upos.copy(obj.upos).addVec(d0, c.dist * R);
        dir = d0.clone().negate(); up = obj.diskNormal.clone();
      } else if (c.kind === 'gal') {
        window.__galDir ??= obj.viewDir(a.rig.upos.sub(obj.upos, new V())).clone();
        a.rig.upos.copy(obj.upos).addVec(window.__galDir, c.dist * R);
        dir = window.__galDir.clone().negate(); up = obj.major.clone();
      } else {
        a.placeNear(obj, c.dist * R, c.az, c.el);
        dir = (c.lookName ? a.findByName(c.lookName).upos : obj.upos).sub(a.rig.upos, new V()).normalize();
      }
    }
    const right = dir.clone().cross(up).normalize();
    if (right.lengthSq() < 0.5) right.set(1, 0, 0);
    if (c.yaw) dir = rot(dir, up, -c.yaw);
    if (c.pitch) dir = rot(dir, right, c.pitch);
    a.rig.lookAt(dir.normalize(), up);
    if (c.fov) a.rig.fov = c.fov;
  };
};

const HIDE_UI = 'body *:not(canvas){visibility:hidden !important} canvas{visibility:visible !important}';

async function settle(page, maxMs) {
  const t0 = Date.now();
  // one rendered frame at the new pose; more only while tiles or textures are still streaming in
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
  if (!(await page.evaluate(() => /streaming \d+ star tiles/.test(document.body.textContent)))) return;
  while (Date.now() - t0 < maxMs) {
    const busy = await page.evaluate(() => /streaming \d+ star tiles/.test(document.body.textContent));
    if (!busy) break;
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

const story = mode === 'story';
const [W, H] = (process.env.RES || (story ? '960x540' : '1920x1080')).split('x').map(Number);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const shot of SHOTS) {
  if (only.length && !only.includes(shot.id)) continue;
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(INIT);
  await page.goto(`${BASE}?menu=0&governor=0&${shot.url}`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 300000 });
  await page.addStyleTag({ content: HIDE_UI });
  await page.evaluate(() => { const a = window.app; a.labels.enabled = false; a.orbits.enabled = false; a.select(null); });
  const frames = story ? [0, Math.round(shot.sec * FPS) - 1] : [...Array(Math.round(shot.sec * FPS)).keys()];
  const n = Math.round(shot.sec * FPS);
  // let tiles and textures for the first pose load before the clock starts
  await page.evaluate((c) => window.__cam(c), shot.a); await settle(page, 20000);
  const dir = path.join(outDir, shot.id); fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  let last = -1;
  for (const f of frames) {
    const file = path.join(dir, `f${String(f).padStart(4, '0')}.jpg`);
    if (!story && fs.existsSync(file)) continue;
    const ms = 100000 + (f * 1000) / FPS, cam = mix(shot.a, shot.b, ease(f / (n - 1)));
    if (f !== last + 1) {
      // not continuing from the previous frame: run 3 s of game time at this pose so exposure and fades settle
      for (let k = 72; k > 0; k--) {
        await page.evaluate(([t, c]) => { window.__setNow(t); window.__cam(c); return new Promise((r) => requestAnimationFrame(() => r())); }, [ms - (k * 1000) / FPS / 1, cam]);
      }
    }
    last = f;
    await page.evaluate(([t, c]) => { window.__setNow(t); window.__cam(c); }, [ms, cam]);
    await settle(page, story ? 15000 : 2500);
    const data = await page.evaluate((q) => window.__grab(q), 0.95);
    fs.writeFileSync(file, Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'));
  }
  console.log(`${shot.id}: ${frames.length} frames in ${Math.round((Date.now() - t0) / 1000)} s, errors ${errors.length}${errors.length ? ' ' + errors[0].slice(0, 120) : ''}`);
  await page.close();
  if (!story) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'),
      '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', path.join(outDir, `${shot.id}.mp4`)]);
  }
}
await browser.close();
