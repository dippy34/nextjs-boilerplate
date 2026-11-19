// GPU cost by object in software GL: for each scene, stops the app's loop, then times the scene
// render into the HDR target (median of a few, synchronised with a 1-pixel read) with everything,
// and with each group of meshes (by material name) hidden. The difference is that group's cost.
// `lite` runs the same scenes with the headset tier (LITE) forced on, without entering XR.
// Usage: node scripts/shots/profile.mjs [baseUrl] [outDir] [scene...] (env LITE=1 for the headset tier only,
// LITE=both for both)
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:4173/';
const outDir = process.argv[3] ?? 'out-profile';
const only = new Set(process.argv.slice(4));
fs.mkdirSync(outDir, { recursive: true });
const T = '2026-10-01T20:00:00Z';

const SCENES = [
  { name: 'earth', query: `time=${T}&paused=1&target=Earth&dist=2.5&az=30&el=10` },
  { name: 'saturn', query: `time=${T}&paused=1&target=Saturn&dist=6&az=40&el=20` },
  { name: 'jupiter', query: `time=${T}&paused=1&target=Jupiter&dist=3&az=20&el=5` },
  { name: 'rings', query: `time=${T}&paused=1&target=Saturn&dist=4`, setup: () => {
    const a = window.app;
    const spot = a.findByName("Saturn's rings");
    a.select(spot);
    a.rig.upos.copy(spot.upos);
    const sat = a.findByName('Saturn');
    const toSat = sat.upos.sub(a.rig.upos).normalize();
    const pole = new toSat.constructor().setFromMatrixColumn(sat.orientation, 2).normalize();
    a.rig.lookAt(toSat.clone().addScaledVector(pole, 0.06).normalize(), pole);
  } },
  { name: 'comet', query: `time=${T}&paused=1&target=Sun&dist=600`, setup: () => {
    const a = window.app;
    const sun = a.system.sun.upos;
    let best = null;
    for (const c of a.small.cometObjects) {
      if (c.row[8] === null || !['P', 'C', 'I'].includes(c.row[1])) continue;
      const r = c.upos.sub(sun).length() / 1.495978707e11;
      const m = c.row[8] + (c.row[9] ?? 10) * Math.log10(Math.max(r, 0.1));
      if (r < 3 && (!best || m < best.m)) best = { c, m, r };
    }
    if (!best) return;
    a.select(best.c);
    const axis = best.c.upos.sub(sun).normalize();
    const side = new axis.constructor(0, 0, 1).cross(axis).normalize();
    a.rig.upos.copy(best.c.upos).addVec(side, 2e9).addVec(axis, 1e9);
    a.rig.lookAt(best.c.upos.sub(a.rig.upos).normalize().addScaledVector(axis, 0.3).normalize());
  } },
  { name: 'cygnus-x1', query: `time=${T}&paused=1&target=Cygnus X-1&dist=30` },
  { name: 'sgr-a', query: `time=${T}&paused=1&target=Sagittarius A*&dist=20` },
  { name: 'exo', query: `time=${T}&paused=1&target=Altair f&dist=3.5&az=40&el=10` },
  { name: 'exo-giant', query: `time=${T}&paused=1&target=Procyon c&dist=5&az=30&el=20` },
  { name: 'iss', query: `time=${T}&paused=1&target=ISS&dist=2.2&az=200&el=25` },
];
const modes = process.env.LITE === 'both' ? [false, true] : [process.env.LITE === '1'];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = [];
for (const sc of SCENES) {
  if (only.size && !only.has(sc.name)) continue;
  for (const lite of modes) {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${base}?${sc.query}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.app || window.appError, null, { timeout: 90000 });
    if (lite) {
      await page.waitForFunction(() => window.app?.vr, null, { timeout: 90000 });
      await page.evaluate(() => { Object.defineProperty(window.app.vr, 'active', { get: () => true, configurable: true }); });
    }
    await page.waitForFunction(() => window.app.frameCount > 20 && window.app.debugState().pendingTiles === 0, null, { timeout: 180000 }).catch(() => undefined);
    if (sc.setup) {
      await page.evaluate(`(${sc.setup.toString()})()`);
      const f0 = await page.evaluate(() => window.app.frameCount);
      await page.waitForFunction((f) => window.app.frameCount > f + 15, f0, { timeout: 180000 });
    }
    await page.waitForTimeout(1500);
    const res = await page.evaluate(() => {
      const a = window.app;
      const r = a.renderer;
      const gl = r.gl;
      gl.setAnimationLoop(null);
      a.frame();
      const ctx = gl.getContext();
      const px = new Uint8Array(4);
      const target = r.hdr;
      const sync = () => {
        const fmt = ctx.getParameter(ctx.IMPLEMENTATION_COLOR_READ_FORMAT), typ = ctx.getParameter(ctx.IMPLEMENTATION_COLOR_READ_TYPE);
        const buf = typ === ctx.FLOAT ? new Float32Array(4) : typ === ctx.UNSIGNED_BYTE ? new Uint8Array(4) : new Uint16Array(4);
        ctx.readPixels(0, 0, 1, 1, fmt, typ, buf);
      };
      const time = () => {
        const ts = [];
        for (let i = 0; i < 5; i++) {
          gl.setRenderTarget(target);
          gl.clear();
          const t0 = performance.now();
          gl.render(r.scene, r.camera);
          sync();
          ts.push(performance.now() - t0);
        }
        gl.setRenderTarget(null);
        void px;
        return ts.sort((x, y) => x - y)[0];
      };
      // groups of drawn meshes by material name
      const groups = new Map();
      r.scene.traverseVisible((o) => {
        if (!(o.isMesh || o.isPoints || o.isLine)) return;
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        const key = (m && m.name) || `${o.name || o.parent?.name || o.type}:${m?.type ?? ''}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(o);
      });
      time();
      const total = time();
      // each group alone (everything else hidden), less the cost of drawing nothing
      const all = [...groups.values()].flat();
      for (const o of all) o.visible = false;
      const empty = time();
      const rows = [];
      for (const [key, objs] of groups) {
        for (const o of objs) o.visible = true;
        const t = time();
        for (const o of objs) o.visible = false;
        rows.push({ key, n: objs.length, ms: +(t - empty).toFixed(1) });
      }
      for (const o of all) o.visible = true;
      // the whole frame (updates, scene, post) once more
      const t0 = performance.now();
      a.frame();
      gl.getContext().readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, new Uint8Array(4));
      const frame = performance.now() - t0;
      rows.sort((x, y) => y.ms - x.ms);
      gl.setAnimationLoop(() => a.frame());
      return { total: +total.toFixed(1), empty: +empty.toFixed(1), frame: +frame.toFixed(1), rows: rows.slice(0, 12) };
    });
    const tag = `${sc.name}${lite ? '-lite' : ''}`;
    await page.screenshot({ path: path.join(outDir, `${tag}.png`), timeout: 180000 });
    console.log(`\n== ${tag}: scene ${res.total} ms (empty ${res.empty}), frame ${res.frame} ms${errors.length ? ' ERRORS ' + errors.join(' | ') : ''}`);
    for (const row of res.rows) console.log(`  ${String(row.ms).padStart(7)} ms  ${row.key} (${row.n})`);
    report.push({ scene: tag, ...res });
    await page.close();
  }
}
fs.writeFileSync(path.join(outDir, 'profile.json'), JSON.stringify(report, null, 1));
await browser.close();
