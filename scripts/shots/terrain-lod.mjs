// Planet-wide terrain (render/PlanetTerrain.ts): descents from orbit to the ground at landmarks.
// SITES="Olympus Mons:Mars,Tycho:Moon" HEIGHTS=2000000,200000,20000,2000,2 node scripts/shots/terrain-lod.mjs http://127.0.0.1:4174/ /tmp/out/lod
// Each height: looking at the horizon across the sunlight (orbit: the limb), after the tiles settle.
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/lod';
const sites = (process.env.SITES ?? 'Olympus Mons:Mars').split(',').map((s) => s.split(':'));
const heights = (process.env.HEIGHTS ?? '2000000,200000,20000,2000,2').split(',').map(Number);
const sunEl = Number(process.env.SUN ?? 15);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 960), height: Number(process.env.H ?? 540) } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 240000 }); };
for (const [name, body] of sites) {
  await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=${body}&dist=3`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
  // a time when the Sun is `sunEl` degrees above the site's horizon
  await page.evaluate(([n, sunEl]) => {
    const a = window.app; const l = a.findByName(n);
    const jd0 = a.clock.jdTdb; let best = jd0, err = Infinity;
    const moon = l.world.name === 'Moon' || l.world.name === 'Mercury';
    for (let h = 0; h < (moon ? 60 * 24 : 26); h += moon ? 1 : 0.1) {
      a.system.update(jd0 + h / 24);
      const el = Math.asin(a.system.sun.upos.sub(l.world.upos).normalize().dot(l.up())) * 57.3;
      if (Math.abs(el - sunEl) < err) { err = Math.abs(el - sunEl); best = jd0 + h / 24; }
    }
    a.system.update(jd0); a.clock.jdTdb = best;
  }, [name, sunEl]);
  await frames(3);
  for (const hgt of heights) {
    const place = async () => page.evaluate(([n, hgt]) => {
      const a = window.app; const l = a.findByName(n); a.select(l);
      const up = l.up();
      const sun = a.system.sun.upos.sub(l.world.upos).normalize();
      const flat = sun.clone().sub(up.clone().multiplyScalar(sun.dot(up))).normalize();
      const side = flat.clone().cross(up).normalize();
      // look across the sunlight; at the horizon (its dip below level), a little below it
      const R = l.world.radius;
      const dip = Math.acos(R / (R + hgt));
      const down = hgt > 100e3 ? dip + 0.12 : dip + (hgt < 10 ? 0.12 : 0.06);
      const fwd = side.clone().multiplyScalar(0.8).addScaledVector(flat, -0.6).normalize();
      const look = fwd.clone().multiplyScalar(Math.cos(down)).addScaledVector(up, -Math.sin(down)).normalize();
      const below = a.terrain.below(a.rig.upos);
      const g = below && a.terrain.owner === l.world ? below.ground : R;
      a.rig.upos.copy(l.world.upos).addVec(up, g + hgt);
      a.rig.lookAt(look, up);
    }, [name, hgt]);
    await place();
    // let the tiles settle (refine, morph), re-placing at the wanted height above the drawn ground
    const t0 = Date.now();
    let st;
    for (let i = 0; i < 40; i++) {
      await frames(4);
      await place();
      st = await page.evaluate(() => ({ ...window.app.terrain.stats, owner: window.app.terrain.owner?.name ?? null, fps: Math.round(window.app.fps) }));
      if (i > 3 && (st.pending === 0 || st.pending === undefined) && st.owner) break;
      if (Date.now() - t0 > Number(process.env.MAXWAIT ?? 150) * 1000) break;
    }
    await frames(Number(process.env.SETTLE ?? 6));
    await page.screenshot({ path: `${out}-${body}-${name.replace(/\W+/g, '')}-${hgt}.png`, timeout: 240000 });
    console.log('shot', name, hgt, JSON.stringify(st), `${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}
console.log('errors', errors.length, [...new Set(errors)].slice(0, 5).join(' | '));
await browser.close();
