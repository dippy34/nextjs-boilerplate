// scratch: ground-level views at landmarks (materials, rocks)
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/ground';
const sites = (process.env.SITES ?? 'Apollo 17 landing site:Moon,Gale Crater (Curiosity):Mars,Mount Everest:Earth').split(',').map((s) => s.split(':'));
const views = (process.env.VIEWS ?? '2,40,400').split(',').map(Number);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 1280), height: Number(process.env.H ?? 720) } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 240000 }); };
for (const [name, body] of sites) {
  await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=${body}&dist=3`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
  await page.evaluate(() => { window.app.terrain.budgetMs = 80; });
  await page.evaluate((n) => {
    const a = window.app; const l = a.findByName(n);
    const jd0 = a.clock.jdTdb; let best = jd0, err = Infinity;
    for (let h = 0; h < (l.world.name === 'Moon' ? 30 * 24 : 26); h += l.world.name === 'Moon' ? 1 : 0.25) {
      a.system.update(jd0 + h / 24);
      const el = Math.asin(a.system.sun.upos.sub(l.world.upos).normalize().dot(l.up())) * 57.3;
      if (Math.abs(el - 22) < err) { err = Math.abs(el - 22); best = jd0 + h / 24; }
    }
    a.system.update(jd0); a.clock.jdTdb = best;
  }, name);
  await frames(3);
  for (const hgt of views) {
    await page.evaluate(([n, hgt, tiltEnv, azEnv]) => {
      const a = window.app; const l = a.findByName(n); a.select(l);
      const up = l.up();
      const sun = a.system.sun.upos.sub(l.world.upos).normalize();
      // look across the sunlight (side-lit ground), tilted down a little
      const flat = sun.clone().sub(up.clone().multiplyScalar(sun.dot(up))).normalize();
      const side = flat.clone().cross(up).normalize();
      const tilt = Number(tiltEnv ?? (hgt > 10 ? 0.45 : 0.18)); const az = Number(azEnv ?? 0);
      const hor = side.clone().multiplyScalar(Math.cos(az)).addScaledVector(flat, Math.sin(az));
      const look = hor.multiplyScalar(Math.cos(tilt)).addScaledVector(up, -Math.sin(tilt)).normalize();
      // ground under the landmark: its world position plus height
      a.rig.upos.copy(l.world.upos).addVec(up, l.world.radius + 30000);
      a.rig.lookAt(look, up);
      window.__site = { n, hgt };
    }, [name, hgt, process.env.TILT ?? null, process.env.AZ ?? null]);
    // let the terrain build, then drop to the wanted height above the ground there
    await page.waitForFunction((b) => window.app.terrain.owner?.name === b, body, { timeout: 120000 }).catch(() => undefined);
    for (let i = 0; i < 4; i++) {
      await frames(6);
      await page.evaluate((hgt) => {
        const a = window.app; const below = a.terrain.below(a.rig.upos);
        if (!below) return;
        const out = a.rig.upos.sub(below.centre).normalize();
        a.rig.upos.addVec(out, hgt - (below.dist - below.ground));
      }, hgt);
    }
    await frames(Number(process.env.SETTLE ?? 20));
    // optional tweak before the shot (debugging): EVAL is evaluated in the page
    if (process.env.EVAL) { const r = await page.evaluate(process.env.EVAL); if (r !== undefined) console.log('eval', JSON.stringify(r)); await frames(3); }
    const st = await page.evaluate(() => ({ alt: window.app.rig.altitude, owner: window.app.terrain.owner?.name, mat: (window.app.terrain.group.children.find((m) => m.material?.uniforms?.uMatOn)?.material.uniforms.uMatOn.value) ?? null, fps: Math.round(window.app.fps) }));
    await page.screenshot({ path: `${out}-${body}-${hgt}.png`, timeout: 240000 });
    console.log('shot', name, hgt, JSON.stringify(st));
  }
}
console.log('errors', errors.length, errors.slice(0, 3).join(' | '));
await browser.close();
