// Special places in headless Chromium: inside Saturn's rings (3D ice particles from the measured
// optical depth). Usage: node scripts/places.mjs [baseUrl] [outDir]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const outDir = process.argv[3] ?? 'screenshots';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  ...(process.env.TRUSTED_SPKI ? [`--ignore-certificate-errors-spki-list=${process.env.TRUSTED_SPKI}`] : [])] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); };
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 120000 }); };

await page.goto(`${base}?time=2026-10-01T20:00:00Z&paused=1&target=Saturn&dist=4`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 120000 });

// 1. search finds the rings as a destination
let st = await page.evaluate(() => window.app.searchItems('rings').map((r) => r.label));
check('search offers Saturn\'s rings', st.includes("Saturn's rings"), JSON.stringify(st.slice(0, 5)));

// 2. inside the B ring: particles around the explorer, Saturn in view
await page.evaluate(() => {
  const a = window.app;
  const spot = a.findByName("Saturn's rings");
  a.select(spot);
  a.rig.upos.copy(spot.upos);
  const sat = a.findByName('Saturn');
  const toSat = sat.upos.sub(a.rig.upos).normalize();
  const pole = toSat.constructor ? new toSat.constructor().setFromMatrixColumn(sat.orientation, 2).normalize() : null;
  // look towards Saturn, tipped a little out of the ring plane
  a.rig.lookAt(toSat.clone().addScaledVector(pole, 0.06).normalize(), pole);
});
await frames(12);
st = await page.evaluate(() => {
  const rp = window.app.bodies.ringParticles;
  return { visible: rp?.mesh.visible ?? false, count: rp?.mesh.count ?? 0, anchor: window.app.rig.anchor?.name ?? null };
});
check('ice particles surround the explorer in the B ring', st.visible && st.count > 300, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 'p1-saturn-rings.png') });

// 3. looking along the ring plane, away from Saturn
await page.evaluate(() => {
  const a = window.app;
  const sat = a.findByName('Saturn');
  const out = a.rig.upos.sub(sat.upos).normalize();
  const pole = new out.constructor().setFromMatrixColumn(sat.orientation, 2).normalize();
  const along = pole.clone().cross(out).normalize();
  a.rig.lookAt(along.addScaledVector(pole, -0.04).normalize(), pole);
});
await frames(6);
await page.screenshot({ path: path.join(outDir, 'p2-ring-plane.png') });

// 4. far above the rings: no particles drawn
await page.evaluate(() => {
  const a = window.app;
  const sat = a.findByName('Saturn');
  const pole = new (a.rig.upos.sub(sat.upos).constructor)().setFromMatrixColumn(sat.orientation, 2).normalize();
  a.rig.upos.addVec(pole, 50e3);
});
await frames(4);
st = await page.evaluate(() => window.app.bodies.ringParticles?.mesh.visible ?? false);
check('particles are only drawn inside the ring layer', st === false);

// 5. a comet near the Sun: coma and tails (the brightest active one in the catalogue right now)
st = await page.evaluate(() => {
  const a = window.app;
  const sun = a.system.sun.upos;
  let best = null;
  for (const c of a.small.cometObjects) {
    if (c.row[8] === null || !['P', 'C', 'I'].includes(c.row[1])) continue;
    const r = c.upos.sub(sun).length() / 1.495978707e11;
    const m = c.row[8] + (c.row[9] ?? 10) * Math.log10(Math.max(r, 0.1));   // total magnitude 1 AU from the observer
    if (r < 3 && (!best || m < best.m)) best = { c, m, r };
  }
  if (!best) return null;
  a.select(best.c);
  // 2 million km from the nucleus, to the side of the tail
  const axis = best.c.upos.sub(sun).normalize();
  const side = new axis.constructor(0, 0, 1).cross(axis).normalize();
  a.rig.upos.copy(best.c.upos).addVec(side, 2e9).addVec(axis, 1e9);
  a.rig.lookAt(best.c.upos.sub(a.rig.upos).normalize().addScaledVector(axis, 0.3).normalize());
  return { name: best.c.name, r: best.r };
});
console.log('comet', JSON.stringify(st));
await frames(20);
if (st) {
  const t = await page.evaluate(() => window.app.cometTails.group.children.filter((m) => m.visible).length);
  check('an active comet has a coma and tails', t > 0, `${t} drawn`);
  await page.screenshot({ path: path.join(outDir, 'p3-comet.png') });
  // up close: the nucleus with jets on its sunlit side
  await page.evaluate(() => {
    const a = window.app;
    const c = a.selection;
    const sun = a.system.sun.upos.sub(c.upos).normalize();
    const side = new sun.constructor(0, 0, 1).cross(sun).normalize();
    const dir = sun.clone().multiplyScalar(0.5).addScaledVector(side, 0.85).normalize();
    a.rig.upos.copy(c.upos).addVec(dir, 60e3);
    a.rig.lookAt(dir.clone().negate());
  });
  await frames(12);
  const n = await page.evaluate(() => ({ nucleus: window.app.cometTails.nucleus.visible, r: window.app.cometTails.nucleusView?.radius ?? 0 }));
  check('up close the comet has a nucleus', n.nucleus && n.r > 0, JSON.stringify(n));
  await page.screenshot({ path: path.join(outDir, 'p3b-comet-nucleus.png'), timeout: 180000 });
}

// 6. eclipses: the total lunar eclipse of 2026-03-03 (greatest 11:33 UTC): the Moon inside Earth's shadow
await page.goto(`${base}?time=2026-03-03T11:33:00Z&paused=1&target=Moon&dist=4`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 120000 });
await frames(20);
st = await page.evaluate(() => {
  const a = window.app;
  const moon = a.findByName('Moon');
  const m = a.bodies.meshes.get(moon).material.uniforms;
  return { occluders: m.uOccN.value, red: m.uOccRed.value.x };
});
check('the Moon is in Earth\'s shadow on 2026-03-03', st.occluders >= 1 && st.red === 1, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 'p4-lunar-eclipse.png') });

// 7. a shadow of a Galilean moon on Jupiter (searched for in the next two days)
await page.goto(`${base}?time=2026-10-01T00:00:00Z&paused=1&target=Jupiter&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 120000 });
st = await page.evaluate(() => {
  const a = window.app;
  const jup = a.findByName('Jupiter');
  const moons = ['Io', 'Europa', 'Ganymede', 'Callisto'].map((n) => a.findByName(n));
  const jd0 = a.clock.jdTdb;
  for (let k = 0; k < 2 * 96; k++) {
    const jd = jd0 + k / 96;
    a.system.update(jd);
    const sun = a.system.sun.upos.sub(jup.upos);
    const dS = sun.length();
    sun.divideScalar(dS);
    for (const m of moons) {
      const v = m.upos.sub(jup.upos);
      const along = v.dot(sun);
      const perp = Math.sqrt(v.lengthSq() - along * along);
      if (along > 0 && perp < jup.radius * 0.7) { a.system.update(jd0); a.clock.jdTdb = jd; return { moon: m.name, hours: k / 4 }; }
    }
  }
  a.system.update(jd0);
  return null;
});
console.log('transit', JSON.stringify(st));
if (st) {
  await frames(3);
  await page.evaluate(() => {
    // view Jupiter from close to the Sun's direction, so the shadow is on the visible face
    const a = window.app;
    const jup = a.findByName('Jupiter');
    const sun = a.system.sun.upos.sub(jup.upos).normalize();
    a.select(jup);
    a.rig.upos.copy(jup.upos).addVec(sun, jup.radius * 3.2);
    a.rig.lookAt(sun.clone().negate());
  });
  await frames(15);
  const j = await page.evaluate(() => { const a = window.app; return a.bodies.meshes.get(a.findByName('Jupiter')).material.uniforms.uOccN.value; });
  check(`${st.moon}'s shadow falls on Jupiter`, j >= 1, `occluders ${j}`);
  await page.screenshot({ path: path.join(outDir, 'p5-jupiter-shadow.png') });
}

// 8. landmarks: Valles Marineris and the Apollo 11 site, seen from where "go to" arrives
for (const [id, name, body] of [['p6-valles-marineris', 'Valles Marineris', 'Mars'], ['p7-apollo-11', 'Apollo 11 landing site', 'Moon']]) {
  await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=${body}&dist=3`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 120000 });
  await page.evaluate(() => { window.app.terrain.budgetMs = 60; });
  // the hour when the Sun stands about 30 degrees over the place (the clock is paused)
  await page.evaluate((n) => {
    const a = window.app;
    const l = a.findByName(n);
    const jd0 = a.clock.jdTdb;
    let best = jd0, err = Infinity;
    for (let h = 0; h < 26; h += 0.25) {
      a.system.update(jd0 + h / 24);
      const el = Math.asin(a.system.sun.upos.sub(l.world.upos).normalize().dot(l.up())) * 57.3;
      if (Math.abs(el - 30) < err) { err = Math.abs(el - 30); best = jd0 + h / 24; }
    }
    a.system.update(jd0);
    a.clock.jdTdb = best;
  }, name);
  await frames(3);
  const found = await page.evaluate((n) => {
    const a = window.app;
    const l = a.findByName(n);
    if (!l) return null;
    a.select(l);
    const sun = a.system.sun.upos.sub(l.world.upos).normalize();
    const dir = l.approachDir(sun);
    a.rig.upos.copy(l.upos).addVec(dir, l.def.view);
    a.rig.lookAt(dir.clone().negate(), l.up());
    return { name: l.name, sunUp: sun.dot(l.up()) };
  }, name);
  console.log('landmark', JSON.stringify(found));
  await page.waitForFunction((b) => window.app.terrain.owner?.name === b, body, { timeout: 120000 }).catch(() => undefined);
  await frames(8);
  const lt = await page.evaluate(() => window.app.terrain.owner?.name ?? null);
  check(`${name}: found and shown on real terrain`, !!found && lt === body, JSON.stringify({ found, terrain: lt }));
  await page.screenshot({ path: path.join(outDir, `${id}.png`), timeout: 180000 });
}
st = await page.evaluate(() => window.app.searchItems('mars').filter((r) => r.id.startsWith('lm:')).map((r) => r.label));
check('search lists places on Mars', st.length >= 3, JSON.stringify(st));

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} passed`);
await browser.close();
process.exit(failed ? 1 : 0);
