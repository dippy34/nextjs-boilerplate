// Landing terrain in headless Chromium: real ground near the Moon, Mars and a moon without an
// elevation model. Usage: node scripts/terrain.mjs [baseUrl] [outDir]
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
// software GL (SwiftShader) renders planet-wide terrain at a few frames per second close to the
// ground; allow it the time, as the screenshot calls already do (a real GPU is far faster).
// software GL (SwiftShader) renders planet-wide terrain at a few frames per second close to the
// ground, so a batch of frames can take minutes; allow it the time (a real GPU / Quest is far faster).
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 360000 }); };

await page.goto(`${base}?time=2026-10-01T20:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 120000 });
// software rendering runs at a few frames per second: let the terrain build in fewer frames
await page.evaluate(() => { window.app.terrain.budgetMs = 60; });

/**
 * Put the explorer `alt` metres above the reference surface of `name`, at latitude/longitude
 * (degrees; null = where the Sun is `sunEl` degrees up), looking `pitch` degrees below the horizon,
 * `yaw` degrees from the direction away from the Sun.
 */
async function stand(name, { lat = null, lon = null, sunEl = 12, alt, pitch, yaw = 90 }) {
  if (lat !== null) {
    // a fixed site: step the (paused) clock to the hour when the Sun stands closest to sunEl there,
    // then let a few frames pass so the world (and the camera riding with it) settle at that time
    await page.evaluate(({ name, lat, lon, sunEl }) => {
      const a = window.app;
      const b = a.findByName(name);
      const V = b.upos.sub(a.rig.upos).constructor;
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
      const site = () => new V(Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)).applyMatrix4(b.orientation.clone()).normalize();
      const jd0 = a.clock.jdTdb;
      let best = jd0, bestErr = Infinity;
      for (let h = 0; h < 26; h += 0.25) {
        a.system.update(jd0 + h / 24);
        const s = a.system.sun.upos.sub(b.upos).normalize();
        const err = Math.abs((Math.asin(site().dot(s)) * 180) / Math.PI - sunEl);
        if (err < bestErr) { bestErr = err; best = jd0 + h / 24; }
      }
      a.system.update(jd0);
      a.clock.jdTdb = best;
    }, { name, lat, lon, sunEl });
    await frames(3);
  }
  await page.evaluate(({ name, lat, lon, sunEl, alt, pitch, yaw }) => {
    const a = window.app;
    const b = a.findByName(name);
    a.select(b);
    const V = b.upos.sub(a.rig.upos).constructor;
    const sun = a.system.sun.upos.sub(b.upos).normalize();
    let up;
    if (lat !== null) {
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
      up = new V(Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)).applyMatrix4(b.orientation.clone()).normalize();
    } else {
      // a point where the Sun stands sunEl degrees above the horizon
      const side = new V(0, 0, 1).cross(sun).normalize();
      const s = Math.sin((sunEl * Math.PI) / 180);
      up = sun.clone().multiplyScalar(s).addScaledVector(side, Math.sqrt(1 - s * s)).normalize();
    }
    a.rig.upos.copy(b.upos).addVec(up, b.radius + alt);
    // horizontal direction: `yaw` degrees around the vertical from "away from the Sun"
    const away = sun.clone().negate().addScaledVector(up, sun.dot(up)).normalize();
    const y = (yaw * Math.PI) / 180;
    const east = up.clone().cross(away).normalize();
    const hor = away.clone().multiplyScalar(Math.cos(y)).addScaledVector(east, Math.sin(y)).normalize();
    const p = (pitch * Math.PI) / 180;
    a.rig.lookAt(hor.multiplyScalar(Math.cos(p)).addScaledVector(up, -Math.sin(p)).normalize(), up);
  }, { name, lat, lon, sunEl, alt, pitch, yaw });
}

async function terrainScene(id, name, opts, expectDem) {
  await stand(name, opts);
  const t0 = Date.now();
  await page.waitForFunction((n) => window.app.terrain.owner?.name === n, name, { timeout: 120000 }).catch(() => undefined);
  const ms = Date.now() - t0;
  await page.waitForFunction(() => window.app.tiles.pending.size === 0, null, { timeout: 60000 }).catch(() => undefined);
  await frames(8);
  const st = await page.evaluate(() => {
    const a = window.app;
    const t = a.terrain;
    const o = t.owner;
    return { body: o?.name ?? null, hScale: t.hScale, alt: a.rig.altitude, dem: !!o && a.bodies.terrainSource.keyOf(o) !== null };
  });
  check(`${id}: terrain under the explorer on ${name}`, st.body === name && st.hScale > 0.99, `${JSON.stringify(st)} after ${ms} ms`);
  if (expectDem) check(`${id}: ${name} uses its elevation model`, st.dem);
  await page.screenshot({ path: path.join(outDir, `${id}.png`), timeout: 180000 });
  return st;
}

// 1. the Moon from 3 km, low Sun, looking along the ground
await terrainScene('t1-moon-3km', 'Moon', { sunEl: 8, alt: 3000, pitch: 12, yaw: 70 }, true);
// 2. standing on the Moon: the explorer stays above the ground
await stand('Moon', { sunEl: 8, alt: 3000, pitch: 4, yaw: 70 });
await page.waitForFunction(() => window.app.terrain.owner?.name === 'Moon', null, { timeout: 120000 }).catch(() => undefined);
await page.evaluate(() => {
  // 30 m above the ground actually below
  const a = window.app;
  const bl = a.terrain.below(a.rig.upos);
  if (bl) a.rig.upos.addVec(a.rig.upos.sub(bl.centre).normalize(), bl.ground + 30 - bl.dist);
});
await frames(20);
await page.keyboard.down('KeyF');   // down
await frames(40);
await page.keyboard.up('KeyF');
await frames(10);
let st = await page.evaluate(() => {
  const a = window.app;
  const b = a.terrain.owner;
  const d = b ? a.rig.upos.sub(b.upos).length() : 0;
  return { body: b?.name ?? null, alt: a.rig.altitude, aboveRef: d - (b?.radius ?? 0) };
});
check('t2: flying down stops above the ground', st.body === 'Moon' && st.alt > 1.4 && st.alt < 60, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 't2-moon-ground.png'), timeout: 180000 });
// 3. Olympus Mons from 30 km (MOLA heights; the summit is 21 km up)
await terrainScene('t3-olympus-mons', 'Mars', { lat: 18.65, lon: -133.8 - 2.5, sunEl: 25, alt: 30000, pitch: 25, yaw: 0 }, true);
// 4. a world without an elevation model: generated craters and hills
await terrainScene('t4-callisto-2km', 'Callisto', { sunEl: 10, alt: 2000, pitch: 10, yaw: 80 }, false);
// 5. a generated (or catalogued) rocky planet of another star: terrain from its own colour noise
st = await page.evaluate(() => {
  const a = window.app;
  const p = a.findByName('Proxima Cen b');
  a.select(p);
  a.placeNear(p, p.radius * 4, 30, 20);
  return { name: p?.name ?? null, type: p?.spec?.type ?? null };
});
console.log('exoplanet', JSON.stringify(st));
await frames(10);
await page.evaluate(() => {
  const a = window.app;
  const p = a.selection;
  const V = p.rel.constructor;
  // 3 km up where the star stands 20 degrees above the horizon
  const star = p.system.host.upos.sub(p.upos).normalize();
  const side = new V(0, 0, 1).cross(star).normalize();
  const el = (20 * Math.PI) / 180;
  const up = star.clone().multiplyScalar(Math.sin(el)).addScaledVector(side, Math.cos(el)).normalize();
  a.rig.upos.copy(p.upos).addVec(up, p.radius + 3000);
  const fwd = side.clone().cross(up).normalize();
  a.rig.lookAt(fwd.multiplyScalar(Math.cos(0.15)).addScaledVector(up, -Math.sin(0.15)).normalize(), up);
});
await page.waitForFunction(() => window.app.terrain.owner === window.app.selection, null, { timeout: 120000 }).catch(() => undefined);
await frames(8);
st = await page.evaluate(() => ({ owner: window.app.terrain.owner?.name ?? null, alt: window.app.rig.altitude, hScale: window.app.terrain.hScale }));
check('t5: terrain on a planet of another star', st.owner === 'Proxima Cen b' && st.hScale > 0.99, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 't5-exoplanet.png'), timeout: 180000 });

// 6. a temperate (or ocean) world of another star: land, sea and a blue sky
st = await page.evaluate(() => {
  const a = window.app;
  const names = ['Rigil Kentaurus', 'Sirius', 'Procyon', 'Altair', 'Vega', 'Tau Ceti', 'Epsilon Eridani', 'Fomalhaut', 'Pollux',
    'Arcturus', 'Capella', 'Castor', 'Denebola', 'Alderamin', 'Mizar', 'Caph', 'Megrez', 'Alioth', 'Eltanin', 'Mirach', 'Hamal',
    'Achernar', 'Regulus', 'Spica', 'Aldebaran', 'Deneb', 'Polaris', 'Kochab', 'Schedar', 'Dubhe', 'Merak', 'Phecda', 'Alkaid'];
  for (const n of names) {
    const s = a.findByName(n);
    const sys = s ? a.systems.of(s) : null;
    const p = sys?.planets.find((q) => q.spec.type === 'terran' || q.spec.type === 'ocean');
    if (p) return { star: n, planet: p.name, type: p.spec.type };
  }
  return null;
});
console.log('temperate', JSON.stringify(st));
if (st) {
  const pname = st.planet;
  await page.evaluate((n) => { const a = window.app; const p = a.findByName(n); a.select(p); a.placeNear(p, p.radius * 4, 30, 20); }, pname);
  await frames(10);
  await page.evaluate(() => {
    const a = window.app;
    const p = a.selection;
    const V = p.rel.constructor;
    const star = p.system.host.upos.sub(p.upos).normalize();
    const side = new V(0, 0, 1).cross(star).normalize();
    const el = (25 * Math.PI) / 180;
    const up = star.clone().multiplyScalar(Math.sin(el)).addScaledVector(side, Math.cos(el)).normalize();
    a.rig.upos.copy(p.upos).addVec(up, p.radius + 2500);
    const fwd = side.clone().cross(up).normalize();
    a.rig.lookAt(fwd.multiplyScalar(Math.cos(0.05)).addScaledVector(up, -Math.sin(0.05)).normalize(), up);
  });
  await page.waitForFunction(() => window.app.terrain.owner === window.app.selection, null, { timeout: 120000 }).catch(() => undefined);
  await frames(8);
  const t6 = await page.evaluate((n) => ({
    owner: window.app.terrain.owner?.name ?? null,
    sky: window.app.atmospheres.group.children.some((m) => m.visible && m.name === `${n} atmosphere`),
  }), pname);
  check('t6: a temperate planet of another star has ground and a sky', t6.owner === pname && t6.sky, JSON.stringify(t6));
  await page.screenshot({ path: path.join(outDir, 't6-temperate.png'), timeout: 180000 });
}

st = await page.evaluate(() => ({ fps: window.app.fps }));
console.log('fps', JSON.stringify(st));

// 7, 8. landmarks with sharper regional elevation patches (LOLA 128 px/deg, MOLA 463 m), from where
// "go to" arrives, at a time when the Sun is 20 degrees up there
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 120000 });
await page.evaluate(() => { window.app.terrain.budgetMs = 60; });
for (const [id, name, body, key] of [['t7-tycho', 'Tycho', 'Moon', 'moon'], ['t8-olympus-patch', 'Olympus Mons', 'Mars', 'mars'], ['t9-everest', 'Mount Everest', 'Earth', 'earth']]) {
  await page.evaluate((n) => {
    const a = window.app;
    const l = a.findByName(n);
    const jd0 = a.clock.jdTdb;
    let best = jd0, err = Infinity;
    for (let h = 0; h < 30 * 24; h += 1) {   // the Moon turns slowly: search a month in hours (Earth: the first day matches)
      a.system.update(jd0 + h / 24);
      const el = Math.asin(a.system.sun.upos.sub(l.world.upos).normalize().dot(l.up())) * 57.3;
      if (Math.abs(el - 20) < err) { err = Math.abs(el - 20); best = jd0 + h / 24; }
    }
    a.system.update(jd0);
    a.clock.jdTdb = best;
  }, name);
  await frames(3);
  await page.evaluate((n) => {
    const a = window.app;
    const l = a.findByName(n);
    a.select(l);
    const sun = a.system.sun.upos.sub(l.world.upos).normalize();
    const dir = l.approachDir(sun);
    a.rig.upos.copy(l.upos).addVec(dir, l.def.view);
    a.rig.lookAt(dir.clone().negate(), l.up());
  }, name);
  await page.waitForFunction((k) => (window.app.bodies.terrainSource.versions.get(k) ?? 0) > 0, key, { timeout: 120000 }).catch(() => undefined);
  await page.waitForFunction((b) => window.app.terrain.owner?.name === b, body, { timeout: 120000 }).catch(() => undefined);
  await frames(30);
  st = await page.evaluate((k) => ({ version: window.app.bodies.terrainSource.versions.get(k) ?? 0, owner: window.app.terrain.owner?.name ?? null,
    haze: window.app.terrain.group.children.find((m) => m.name === 'terrain haze')?.visible ?? false }), key);
  check(`${id}: sharper elevation patch loaded and drawn`, st.version > 0 && st.owner === body, JSON.stringify(st));
  if (body !== 'Moon') check(`${id}: the atmosphere is drawn over the terrain`, st.haze);
  await page.screenshot({ path: path.join(outDir, `${id}.png`), timeout: 180000 });
}

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} passed`);
await browser.close();
process.exit(failed ? 1 : 0);
