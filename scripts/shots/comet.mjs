// Comet tails from several directions: face-on to the orbit plane, edge-on, oblique, and from the
// nucleus looking down the tail. Usage: node scripts/shots/comet.mjs [base] [outdir] [time]
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/comet';
const time = process.argv[4] ?? '2026-10-01T20:00:00Z';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 180000 }); };
await page.goto(`${base}?time=${time}&paused=1&target=Sun&dist=50`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10 && window.app.small?.cometObjects?.length > 100, null, { timeout: 180000 });
const name = await page.evaluate(() => {
  const a = window.app; const sun = a.system.sun.upos; let best = null;
  for (const c of a.small.cometObjects) {
    if (c.row[8] === null || !['P', 'C', 'I'].includes(c.row[1])) continue;
    const r = c.upos.sub(sun).length() / 1.495978707e11;
    const m = c.row[8] + (c.row[9] ?? 10) * Math.log10(Math.max(r, 0.1));
    if (r < 3 && (!best || m < best.m)) best = { c, m, r };
  }
  a.select(best.c);
  return `${best.c.name} r=${best.r.toFixed(2)} AU`;
});
await frames(5);
const VIEWS = [['face', [0, 0, 1]], ['edge', [0, 1, 0]], ['oblique', [-0.3, 0.6, 0.75]], ['behind', [-1, 0.12, 0.08]]];
for (const [label, w] of VIEWS) {
  const info = await page.evaluate((w) => {
    const a = window.app; const c = a.selection;
    const m = a.cometTails.meshes[0]; const e = m.matrix.elements; const u = m.material.uniforms;
    const V = c.upos.sub(c.upos).constructor;
    const col = (k) => new V(e[k * 4], e[k * 4 + 1], e[k * 4 + 2]);
    const X = col(0), Y = col(1), Z = col(2);
    const Rc = X.length() / u.uBoxE.value.x;
    X.normalize(); Y.normalize(); Z.normalize();
    const L = Math.max(u.uLi.value, u.uLd.value) * Rc;
    const dir = X.clone().multiplyScalar(w[0]).addScaledVector(Y, w[1]).addScaledVector(Z, w[2]).normalize();
    const behind = w[0] < -0.5;
    const centre = behind ? c.upos.clone() : c.upos.clone().addVec(X, 0.9 * L);
    const d = behind ? 6 * Rc : 3.2 * L;
    a.rig.upos.copy(centre).addVec(dir, d);
    a.rig.lookAt(behind ? X.clone() : dir.clone().negate());
    return { Rc: +(Rc / 1e3).toFixed(0), L: +(L / 1e3).toFixed(0), li: +u.uLi.value.toFixed(1), ld: +u.uLd.value.toFixed(1), L0: +u.uL0.value.toExponential(2), visible: m.visible };
  }, w);
  await frames(12);
  await page.screenshot({ path: `${out}-${label}.png`, timeout: 180000 });
  console.log(label, JSON.stringify(info));
}
console.log(name, 'errors', errors.length, errors.slice(0, 3).join(' | '));
await browser.close();
