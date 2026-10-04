// Walking views for visual review: standing at Apollo 17 and in Gale Crater, bootprints behind
// you after a walk, dust in the air after a jump on the Moon.
// Usage: node scripts/shots/walk.mjs [base] [outprefix]
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/walk';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 900000 }); };
const shot = async (name) => { await page.screenshot({ path: `${out}-${name}.png`, timeout: 600000 }); console.log('saved', `${out}-${name}.png`); };
await page.goto(`${base}?time=2026-10-01T20:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
await page.evaluate(() => { window.app.terrain.budgetMs = 60; });

/** Stand at a landmark with the Sun `sunEl` degrees up, walking; `yaw` degrees from away-from-the-Sun. */
async function standAt(name, sunEl, yaw) {
  await page.evaluate(({ name, sunEl }) => {
    const a = window.app;
    const lm = a.landmarks.find((l) => l.name === name);
    const jd0 = a.clock.jdTdb;
    let best = jd0, bestErr = Infinity;
    for (let h = 0; h < 24 * 30; h++) {
      a.system.update(jd0 + h / 24);
      const s = a.system.sun.upos.sub(lm.world.upos).normalize();
      const err = Math.abs((Math.asin(lm.up().dot(s)) * 180) / Math.PI - sunEl);
      if (err < bestErr) { bestErr = err; best = jd0 + h / 24; }
    }
    a.system.update(jd0);
    a.clock.jdTdb = best;
    a.select(lm);
  }, { name, sunEl });
  await frames(3);
  await page.evaluate(({ name, yaw }) => {
    const a = window.app;
    const lm = a.landmarks.find((l) => l.name === name);
    const up = lm.up();
    a.rig.setAnchor(lm.world);
    a.rig.upos.copy(lm.upos).addVec(up, 300);
    const sun = a.system.sun.upos.sub(lm.world.upos).normalize();
    const away = sun.clone().negate().addScaledVector(up, sun.dot(up)).normalize();
    const east = up.clone().cross(away).normalize();
    const y = (yaw * Math.PI) / 180;
    a.rig.lookAt(away.multiplyScalar(Math.cos(y)).addScaledVector(east, Math.sin(y)).normalize(), up);
  }, { name, yaw });
  await page.waitForFunction(() => window.app.terrain.owner && window.app.terrain.hScale > 0.99, null, { timeout: 400000 });
  await page.evaluate(() => { const a = window.app; const bl = a.terrain.below(a.rig.upos); a.rig.upos.addVec(a.rig.upos.sub(bl.centre).normalize(), bl.ground + 1.7 - bl.dist); });
  await frames(3);
  await page.evaluate(() => { window.app.walk.start(); window.app.labels.enabled = false; });
  await page.waitForFunction(() => window.app.walk.state === 'walk', null, { timeout: 400000 });
  await frames(6);
}

const turn = (deg, pitch = 0) => page.evaluate(({ deg, pitch }) => {
  const w = window.app.walk;
  w.turn((deg * Math.PI) / 180);
  w.pitch = (pitch * Math.PI) / 180;
}, { deg, pitch });

await standAt('Apollo 17 landing site', 14, 90);
await shot('apollo17');
// walk away from the Sun, then turn round to see the prints
await turn(-90, 0);
await page.keyboard.down('KeyW');
await frames(14);
await page.keyboard.up('KeyW');
await frames(4);
await turn(180, -30);
await frames(4);
await shot('apollo17-bootprints');
// jump while running: dust in the air
await turn(180, -8);
await page.keyboard.down('ShiftLeft');
await page.keyboard.down('KeyW');
await frames(10);
await page.keyboard.up('KeyW');
await page.keyboard.up('ShiftLeft');
await page.waitForFunction(() => window.app.walk.body.onGround, null, { timeout: 400000 });
await page.keyboard.press('Space');
await page.waitForFunction(() => !window.app.walk.body.onGround, null, { timeout: 400000 });
await page.waitForFunction(() => window.app.walk.body.onGround, null, { timeout: 400000 });
await frames(2);
await turn(160, -25);
await shot('apollo17-dust');
await page.evaluate(() => window.app.walk.exit(true));

await standAt('Gale Crater (Curiosity)', 25, 150);
await shot('gale');
await turn(0, 20);
await shot('gale-sky');

console.log(errors.length ? errors.slice(0, 5).join('\n') : 'no errors');
await browser.close();
