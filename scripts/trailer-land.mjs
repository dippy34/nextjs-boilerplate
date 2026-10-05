// Gameplay trailer footage, "Land anywhere": (a) a scripted Moon descent to touchdown at Apollo 17 with the flight HUD,
// (b) walking at the Apollo 17 site with Earth in the sky and a low-gravity jump.
//   node scripts/trailer-land.mjs <outDir> [a|b ...]      env: RES=1920x1080  STRIDE=1 (render every Nth frame)  BASE=url
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://127.0.0.1:4173/';
const FPS = 24;
const STRIDE = Number(process.env.STRIDE || 1);
const [outDir = '/tmp/land', ...only] = process.argv.slice(2);
const [W, H] = (process.env.RES || '1920x1080').split('x').map(Number);
const SUN_EL = Number(process.env.SUN_EL || 11); // sun height at the site: long shadows
const T_START = '2026-10-14T00:00:00Z';

const INIT = () => {
  const realNow = performance.now.bind(performance);
  let fake = null;
  window.__setNow = (ms) => { fake = ms; };
  performance.now = () => (fake ?? realNow());
  const rAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => rAF((t) => cb(fake ?? t));
};

// hide the selection panel, status strip, fps bar and clock; keep toast, flight HUD, warnings, walk HUD
const CSS = '.hud-info,.hud-bottom,.hud-top,.hud-time,.fl-keys{display:none !important}';

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'] });
fs.mkdirSync(outDir, { recursive: true });

async function open(extraQuery) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 160)));
  await page.addInitScript(INIT);
  const cdp = await page.context().newCDPSession(page);
  await page.goto(`${BASE}?menu=0&governor=0&time=${T_START}&target=Moon&dist=3&${extraQuery}`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 300000 });
  await page.addStyleTag({ content: CSS });
  await page.evaluate(() => { const a = window.app; a.labels.enabled = false; a.orbits.enabled = false; a.terrain.budgetMs = 60; a.terrain.budgetVrMs = 60; });
  return { page, cdp };
}

let clockMs = 100000;
const frame = (page, fn, arg) => {
  clockMs += 1000 / FPS;
  return page.evaluate(([t, f, a]) => {
    window.__setNow(t);
    if (f) (0, eval)(`(${f})`)(a);
    return new Promise((r) => requestAnimationFrame(() => r()));
  }, [clockMs, fn ? fn.toString() : null, arg]);
};
const raf = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
const grab = async (cdp, file) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
};
const waitFrames = (page, n) => page.evaluate((k) => new Promise((res) => { let c = 0; const t = setInterval(() => { if (++c >= k) { clearInterval(t); res(); } }, 30); }), n);

/** choose the hour (within two weeks of T_START) when the sun is SUN_EL° up at Apollo 17 and Earth is high in its sky */
async function pickTime(page) {
  return page.evaluate((sunEl) => {
    const a = window.app;
    const lm = a.landmarks.find((l) => l.name === 'Apollo 17 landing site');
    const b = lm.world, jd0 = a.clock.jdTdb;
    const earth = a.findByName('Earth');
    const deg = (x) => (Math.asin(x) * 180) / Math.PI;
    let best = jd0, bestErr = 1e9, info = null;
    for (let h = 0; h < 24 * 14; h++) {
      a.system.update(jd0 + h / 24);
      const up = lm.up();
      const s = a.system.sun.upos.sub(b.upos).normalize();
      const e = earth.upos.sub(b.upos).normalize();
      const se = deg(up.dot(s)), ee = deg(up.dot(e));
      if (ee < 35 || s.dot(e) > 0.9) continue;
      // sun rising (morning): light from the east, long shadows to the west; prefer low sun
      const err = Math.abs(se - sunEl);
      if (err < bestErr) { bestErr = err; best = jd0 + h / 24; info = { se, ee, h }; }
    }
    a.system.update(jd0);
    a.clock.jdTdb = best;
    return { best, info };
  }, SUN_EL);
}

const SHOTS = {
  // ---------------------------------------------------------------- a: powered descent to touchdown
  async a() {
    const { page, cdp } = await open('ship=cockpit&paused=1');
    console.log('time', JSON.stringify(await pickTime(page)));
    // stand the ship 300 m above the site until the terrain is built, then climb to the start altitude
    await page.evaluate(() => {
      const a = window.app, lm = a.landmarks.find((l) => l.name === 'Apollo 17 landing site');
      a.rig.setAnchor(lm.world);
      a.rig.upos.copy(lm.upos).addVec(lm.up(), 1500);
      a.game.flight.dropIntoOrbit(false);
    });
    await page.waitForFunction(() => window.app.terrain.owner?.name === 'Moon' && window.app.terrain.hScale > 0.99, null, { timeout: 300000 });
    await page.evaluate((rate) => {
      const a = window.app; const f = a.game.flight;
      f.toggleBoost(); if (!f.ship.boosted) f.toggleBoost();
      a.clock.paused = false; a.clock.rate = rate;
    }, Number(process.env.R || 6));
    const H0 = Number(process.env.H0 || 2600), TD = Number(process.env.TD || 120); // start altitude, frames of descent
    const n = Math.round(6 * FPS);
    const setup = { H0, TD, R: Number(process.env.R || 6) };
    // the descent controller (runs in the page before each rendered frame)
    const ctl = ([i, s]) => {
      const a = window.app, f = a.game.flight, ship = f.ship, core = f.core;
      const D = core.frame; if (!D) return;
      const st = (window.__land ??= { init: false });
      const rel0 = ship.upos.sub(D.upos);
      const up0 = rel0.clone().normalize();
      if (!st.init) {
        st.init = true;
        const lm = a.landmarks.find((l) => l.name === 'Apollo 17 landing site');
        st.lm = lm;
        const Vec = up0.constructor;
        // heading: tangent, pointing roughly west-to-east across the valley
        const north = new Vec(0, 0, 1);
        let east = new Vec().crossVectors(north, up0).normalize();
        st.hd = east.clone().multiplyScalar(-1); // fly toward the west, sun behind the left shoulder
        st.Vec = Vec;
        st.back = 1450; // metres of ground track covered in the descent
      }
      const Vec = st.Vec;
      const T = (s.TD / 24) * s.R; // game seconds of descent (time-warped x R)
      const u = Math.min(1, i / s.TD);
      const vf = 1.3; // touchdown sink rate
      const hT = s.H0 * (1 - u) ** 2 + vf * T * (1 - u);
      const gs = (2 * st.back / T) * (1 - u) * 1.0; // ground speed (integrates to st.back/ ... )
      const dt = s.R / 24;
      // advance along the heading, then put the ship at the target height over the terrain there
      const up = up0;
      const hd = st.hd.clone().addScaledVector(up, -st.hd.dot(up)).normalize();
      st.hd.copy(hd);
      const p = ship.upos.clone();
      p.addVec(hd, gs * dt);
      const bl = a.terrain.below(p);
      if (!bl) return;
      const ground = bl.ground;
      const dir = p.sub(bl.centre, new Vec()).normalize();
      const alt = i >= s.TD ? Math.max(0, ship.upos.sub(D.upos).length() - ground) : hT;
      if (i < s.TD + 1) {
        const r = ground + (i >= s.TD ? Math.min(alt, 0.6) : alt);
        ship.upos.copy(bl.centre).addVec(dir, r);
        const rel = ship.upos.sub(D.upos);
        const vUp = i >= s.TD ? -vf : -((2 * s.H0 / T) * (1 - u) + vf);
        ship.vel.copy(D.vel).add(new Vec().crossVectors(core.spin, rel)).addScaledVector(hd, i >= s.TD ? 0 : gs).addScaledVector(dir, vUp);
        core.landed = null; f.ending = null;
        core.syncRel(); a.rig.upos.copy(ship.upos);
      }
      // attitude: nose pitched down along the glide, flaring up for the landing
      const pitch = (-32 + 20 * u * u) * Math.PI / 180;
      const fwd = hd.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(dir, Math.sin(pitch)).normalize();
      const right = new Vec().crossVectors(fwd, dir).normalize();
      const upS = new Vec().crossVectors(right, fwd).normalize();
      const M = new (a.renderer.camera.matrix.constructor)().makeBasis(right, upS, fwd.clone().negate());
      ship.quat.setFromRotationMatrix(M);
      ship.angVel.set(0, 0, 0);
      // engine on during the braking burn
      ship.throttle = i < s.TD - 6 ? 0.55 + 0.35 * (1 - u) : 0;
      a.rig.thrust = ship.throttle;
    };
    // warm-up: 72 frames at the start pose (the controller holds i=0)
    for (let k = 0; k < 72; k++) await frame(page, ctl, [0, setup]);
    const dir = path.join(outDir, 'a'); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < n; i++) {
      await frame(page, ctl, [i, setup]);
      const ff = path.join(dir, `f${String(i).padStart(4, '0')}.jpg`);
      if (i % STRIDE === 0 && !fs.existsSync(ff)) { await raf(page); await grab(cdp, ff); }
      if (i % 24 === 0) console.log('a', i, JSON.stringify(await page.evaluate(() => { const r = window.app.game.flight.readout; return { alt: Math.round(r.altitude), v: Math.round(r.vertSpeed), landed: r.landed, end: window.app.game.flight.ending?.title ?? null }; })));
    }
    await page.close();
    return { dir, n };
  },

  // ---------------------------------------------------------------- b: walking at Apollo 17, jump, Earth overhead
  async b() {
    const { page, cdp } = await open('paused=1');
    console.log('time', JSON.stringify(await pickTime(page)));
    await page.evaluate(() => {
      const a = window.app, lm = a.landmarks.find((l) => l.name === 'Apollo 17 landing site');
      a.select(lm);
      a.rig.setAnchor(lm.world);
      a.rig.upos.copy(lm.upos).addVec(lm.up(), 400);
    });
    await page.waitForFunction(() => window.app.terrain.owner?.name === 'Moon' && window.app.terrain.hScale > 0.99, null, { timeout: 300000 });
    await waitFrames(page, 4);
    await page.evaluate(() => { const a = window.app; const bl = a.terrain.below(a.rig.upos); a.rig.upos.addVec(a.rig.upos.sub(bl.centre).normalize(), bl.ground + 20 - bl.dist); });
    await page.keyboard.press('KeyB');
    await page.waitForFunction(() => window.app.walk.state === 'walk', null, { timeout: 300000 });
    // face across the sun, toward Earth's azimuth, and look up a bit
    const setPose = ([yawDeg, pitchRad]) => {
      const a = window.app, w = a.walk;
      const lm = a.landmarks.find((l) => l.name === 'Apollo 17 landing site');
      const up = w.body.pos.clone().normalize();
      const e = a.findByName('Earth').upos.sub(lm.world.upos).normalize();
      const eh = e.clone().addScaledVector(up, -e.dot(up)).normalize(); // toward Earth, along the ground
      const side = new up.constructor().crossVectors(up, eh).normalize();
      w.fwd.copy(eh).multiplyScalar(Math.cos(yawDeg * Math.PI / 180)).addScaledVector(side, Math.sin(yawDeg * Math.PI / 180)).normalize();
      w.pitch = pitchRad;
    };
    await page.evaluate(setPose, [Number(process.env.YAW || 8), Number(process.env.PITCH || 0.46)]);
    await page.waitForTimeout(6000);
    clockMs = await page.evaluate(() => performance.now()); // continue from the real clock: a jump confuses terrain streaming
    for (let k = 0; k < 48; k++) await frame(page, null); // settle: terrain, rocks, exposure
    const n = Math.round(5 * FPS);
    const dir = path.join(outDir, 'b'); fs.mkdirSync(dir, { recursive: true });
    const JUMP = Number(process.env.JUMP || 48);
    await page.keyboard.down('KeyW');
    for (let i = 0; i < n; i++) {
      if (i === JUMP) await page.keyboard.down('Space');
      if (i === JUMP + 3) await page.keyboard.up('Space');
      if (i === 30) await page.keyboard.down('ShiftLeft');
      await frame(page, ([i]) => {
        const w = window.app.walk;
        // the view lifts a little toward Earth over the clip
        w.pitch = 0.46 + 0.10 * Math.sin((i / 119) * Math.PI);
      }, [i]);
      const ff = path.join(dir, `f${String(i).padStart(4, '0')}.jpg`);
      if (i % STRIDE === 0 && !fs.existsSync(ff)) { await raf(page); await grab(cdp, ff); }
      if (i % 24 === 0) console.log('b', i, JSON.stringify(await page.evaluate(() => { const d = window.app.walk.debug(); return { g: d.onGround, apex: +d.apex?.toFixed?.(2), spd: +d.speed.toFixed(2) }; })));
    }
    await page.keyboard.up('KeyW');
    await page.close();
    return { dir, n };
  },
};

for (const id of Object.keys(SHOTS)) {
  if (only.length && !only.includes(id)) continue;
  const t0 = Date.now();
  const { dir, n } = await SHOTS[id]();
  console.log(`${id}: ${Math.round((Date.now() - t0) / 1000)} s`);
  if (STRIDE === 1) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'), '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', path.join(outDir, `land-${id}.mp4`)]);
  }
}
await browser.close();
