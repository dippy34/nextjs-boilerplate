// QA playthrough: plays the game like a player does, on the desktop and in an emulated Meta Quest 3
// (IWER, as scripts/vr.mjs), and flags anomalies automatically:
//   black / white / flat frames, NaN anywhere (positions, readouts, visible text), overlapping UI
//   panels, text overflowing its box or the screen, readouts stuck at 0 while moving, labels far from
//   their objects, popping (big changes between two frames of a still view), console errors,
//   and in the headset: menu reach and text legibility, the comfort vignette, apparent size.
// Every scene runs in its own try/catch with a time limit, so one broken scene doesn't stop the run.
// Writes <outDir>/report.json and <outDir>/report.md (one line per anomaly, with the screenshot).
// Usage: node scripts/playtest.mjs [baseUrl] [outDir] [desktop|vr|all] [--only=scene,scene]
// SwiftShader renders at 1–3 fps: frame times are only comparable between scenes, never Quest speed.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const base = args[0] ?? 'http://127.0.0.1:5173/';
const outDir = args[1] ?? 'screenshots/playtest';
const which = args[2] ?? 'all';
const only = flags.only ? new Set(String(flags.only).split(',')) : null;
const SCENE_MS = Number(flags.sceneMs ?? 9 * 60e3);
const T = '2026-10-01T20:00:00Z';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  ...(process.env.TRUSTED_SPKI ? [`--ignore-certificate-errors-spki-list=${process.env.TRUSTED_SPKI}`] : [])] });

const report = { base, started: new Date().toISOString(), scenes: [], anomalies: [], metrics: {} };
let current = { name: '', errors: [] };
const scenePages = new Set();
let onSceneFail = () => {};
const flag = (kind, detail, shot = null, severity = 2) => {
  const a = { scene: current.name, kind, detail: String(detail).slice(0, 400), shot, severity };
  report.anomalies.push(a);
  console.log(`  ANOMALY [${a.scene}] ${kind}: ${a.detail}${shot ? ` (${shot})` : ''}`);
};
const metric = (k, v) => { report.metrics[`${current.name}.${k}`] = v; console.log(`  metric ${current.name}.${k} = ${JSON.stringify(v)}`); };

// ------------------------------------------------------------------ page helpers
async function openPage(query, { vr = false, w = 1280, h = 720 } = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  scenePages.add(page);
  page.__errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text()); });
  page.on('pageerror', (e) => page.__errors.push(String(e)));
  if (vr) {
    await page.addInitScript({ path: 'node_modules/iwer/build/iwer.min.js' });
    await page.addInitScript(() => {
      const d = new IWER.XRDevice(IWER.metaQuest3);
      d.stereoEnabled = true;
      d.installRuntime({ forceInstall: true, polyfillLayers: true });
      window.__xrDevice = d;
    });
  }
  await page.goto(`${base}${query}`, { waitUntil: 'load', timeout: 180000 });
  return page;
}
const ready = (page) => page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 300000 });
const frames = async (page, n, timeout = 300000) => {
  const f = await page.evaluate(() => window.app.frameCount);
  await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout });
};
/** ms per frame (SwiftShader: only relative between builds and scenes) */
const frameMs = async (page, n = 20, runs = 3) => {
  // median of `runs` samples of n frames each, after 3 settling frames; single short samples swing ~2x
  await frames(page, 3);
  const ms = [];
  for (let i = 0; i < runs; i++) { const t0 = Date.now(); await frames(page, n); ms.push((Date.now() - t0) / n); }
  return Math.round(ms.sort((a, b) => a - b)[runs >> 1]);
};

// Image statistics of a PNG, decoded in the page: mean/std luminance, lit/white fractions, and a
// 32x18 grid of block means (for frame-to-frame popping).
const imgStats = (page, png, fromPng = false) => page.evaluate(async ([b64, fromPng]) => {
  // the 3D view alone (the canvas keeps its drawing buffer), so HUD text can't hide a black frame
  const cv = document.querySelector('canvas');
  const bmp = !fromPng && cv && cv.width > 0 ? cv : await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
  const W = 160, H = 90; const c = new OffscreenCanvas(W, H); const ctx = c.getContext('2d');
  ctx.drawImage(bmp, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data; let s = 0, s2 = 0, lit = 0, white = 0, magenta = 0;
  const grid = new Array(32 * 18).fill(0);
  for (let i = 0; i < W * H; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], bl = d[i * 4 + 2]; const l = (r + g + bl) / 3;
    s += l; s2 += l * l; if (l > 40) lit++; if (l > 245) white++;
    if (r > 200 && bl > 200 && g < 60) magenta++;
    const x = i % W, y = (i / W) | 0; grid[((y / 5) | 0) * 32 + ((x / 5) | 0)] += l / 25;
  }
  const n = W * H; const mean = s / n;
  return { mean: +mean.toFixed(1), std: +Math.sqrt(Math.max(0, s2 / n - mean * mean)).toFixed(1), lit: +(lit / n).toFixed(3), white: +(white / n).toFixed(3), magenta: +(magenta / n).toFixed(4), grid };
}, [png.toString('base64'), fromPng]);

// DOM checks: NaN/undefined in visible text, overflowing text, overlapping panels, off-screen UI.
const domCheck = (page) => page.evaluate(() => {
  const vw = innerWidth, vh = innerHeight;
  const vis = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const visDeep = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) if (!vis(e)) return false; return true; };
  const out = { nan: [], overflow: [], offscreen: [], overlap: [] };
  const all = [...document.body.querySelectorAll('*')].filter((e) => !['CANVAS', 'SCRIPT', 'STYLE', 'svg', 'path'].includes(e.tagName));
  for (const el of all) {
    if (!el.childNodes.length) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (!own || !visDeep(el)) continue;
    if (/\bNaN\b|\bundefined\b|\bInfinity\b|\[object /.test(own)) out.nan.push(own.slice(0, 80));
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (el.closest('#labels, .labels') || el.classList.contains('label')) continue;
    if (cs.overflowX !== 'auto' && cs.overflowX !== 'scroll' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && cs.display !== 'inline') out.overflow.push(`${el.className || el.tagName}: "${own.slice(0, 40)}" ${el.scrollWidth}>${el.clientWidth}px`);
    if (r.right > vw + 2 || r.bottom > vh + 2 || r.left < -2 || r.top < -2) out.offscreen.push(`${el.className || el.tagName}: "${own.slice(0, 40)}" @${r.left | 0},${r.top | 0} ${r.width | 0}x${r.height | 0}`);
  }
  // top-level UI panels: positioned, visible, not full-screen overlays, not inside another panel
  const panels = all.filter((el) => { const cs = getComputedStyle(el); if (!/fixed|absolute/.test(cs.position) || !visDeep(el)) return false; if (el.classList.contains('label') || el.closest('#labels, .labels')) return false; const r = el.getBoundingClientRect(); if (r.width * r.height < 600) return false; if (r.width > vw * 0.9 && r.height > vh * 0.9) return false; return el.textContent.trim().length > 0; })
    .filter((el, _, arr) => !arr.some((o) => o !== el && o.contains(el)));
  for (let i = 0; i < panels.length; i++) for (let j = i + 1; j < panels.length; j++) {
    const a = panels[i].getBoundingClientRect(), b = panels[j].getBoundingClientRect();
    const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const frac = (ix * iy) / Math.min(a.width * a.height, b.width * b.height);
    if (frac > 0.15) out.overlap.push(`${panels[i].className || panels[i].tagName} × ${panels[j].className || panels[j].tagName} (${Math.round(frac * 100)}%)`);
  }
  out.panels = panels.length;
  for (const k of ['nan', 'overflow', 'offscreen', 'overlap']) out[k] = [...new Set(out[k])].slice(0, 8);
  return out;
});

// The selected object's label vs where the object projects on screen.
const labelCheck = (page) => page.evaluate(() => {
  const a = window.app, o = a.selection; if (!o || !o.upos) return null;
  const cam = a.renderer.camera; cam.updateMatrixWorld(true);
  const rel = o.upos.sub(a.rig.upos);
  const p = rel.clone().add(cam.getWorldPosition(rel.clone())).project(cam);
  if (p.z > 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) return { name: o.name, onScreen: false };
  const sx = (p.x * 0.5 + 0.5) * innerWidth, sy = (0.5 - p.y * 0.5) * innerHeight;
  const el = [...document.querySelectorAll('.label')].find((e) => e.style.display !== 'none' && e.textContent === o.name);
  if (!el) return { name: o.name, onScreen: true, label: false, sx, sy };
  const r = el.getBoundingClientRect();
  return { name: o.name, onScreen: true, label: true, dist: Math.round(Math.hypot(r.left - sx, r.bottom - sy)), sx: Math.round(sx), sy: Math.round(sy) };
});

const stateNaN = (page) => page.evaluate(() => {
  const a = window.app; const bad = [];
  const v = a.rig.upos.toVector3(); if (![v.x, v.y, v.z].every(Number.isFinite)) bad.push('rig position');
  if (!a.rig.quat.toArray().every(Number.isFinite)) bad.push('rig orientation');
  // (NaN in tImpact/tAp/tPe/ap/pe means "none": no impact ahead, no apsis; displays check isFinite)
  const ro = a.game?.flight?.on ? a.game.flight.readout : null; if (ro) for (const [k, x] of Object.entries(ro)) if (typeof x === 'number' && Number.isNaN(x) && !/^(tImpact|tAp|tPe|ap|pe)$/.test(k)) bad.push(`flight.readout.${k}`);
  return bad;
});

/** screenshot + every automatic check; returns the image stats */
async function look(page, name, { pop = true, label = true, vr = false } = {}) {
  const file = path.join(outDir, `${name}.png`);
  const png = await page.screenshot({ path: file, timeout: 180000 });
  const st = await imgStats(page, png, vr);
  const rel = path.relative('.', file);
  if (st.mean < 4 && st.std < 3) flag('black frame', `mean ${st.mean}, std ${st.std}`, rel, 1);
  else if (st.white > 0.6) flag('white frame', `${Math.round(st.white * 100)}% white`, rel, 1);
  else if (st.std < 1.5) flag('flat frame', `mean ${st.mean}, std ${st.std}`, rel, 2);
  if (st.magenta > 0.01) flag('magenta pixels (shader error colour?)', `${(st.magenta * 100).toFixed(1)}%`, rel, 2);
  if (!vr) {
    const dom = await domCheck(page);
    if (dom.nan.length) flag('NaN/undefined in visible text', dom.nan.join(' | '), rel, 1);
    if (dom.overlap.length) flag('overlapping UI', dom.overlap.join(' | '), rel, 3);
    if (dom.overflow.length) flag('text overflow', dom.overflow.join(' | '), rel, 3);
    if (dom.offscreen.length) flag('UI off screen', dom.offscreen.join(' | '), rel, 3);
  }
  const bad = await stateNaN(page);
  if (bad.length) flag('NaN in state', bad.join(', '), rel, 1);
  if (label && !vr) {
    const l = await labelCheck(page);
    if (l?.onScreen && l.label && l.dist > 120) flag('label far from its object', `${l.name}: ${l.dist}px from (${l.sx},${l.sy})`, rel, 2);
  }
  if (pop) {
    // the clock is held: two frames of a still view should be nearly identical
    const paused = await page.evaluate(() => { const p = window.app.clock.paused; window.app.clock.paused = true; return p; });
    await frames(page, 2);
    const png2 = await page.screenshot({ timeout: 180000 });
    await page.evaluate((p) => { window.app.clock.paused = p; }, paused);
    const st2 = await imgStats(page, png2, vr);
    let worst = 0, n = 0;
    for (let i = 0; i < st.grid.length; i++) { const d = Math.abs(st.grid[i] - st2.grid[i]); worst = Math.max(worst, d); if (d > 25) n++; }
    if (n > 3 || worst > 60) {
      const f2 = path.join(outDir, `${name}-b.png`); fs.writeFileSync(f2, png2);
      flag('popping between frames (still view)', `${n} blocks changed >25, worst ${worst.toFixed(0)} (compare ${path.relative('.', f2)})`, rel, 2);
    }
  }
  console.log(`  shot ${rel} mean=${st.mean} std=${st.std} lit=${st.lit}`);
  return st;
}

async function scene(name, fn, ms = SCENE_MS) {
  if (only && !only.has(name)) return;
  current = { name, errors: [] };
  const t0 = Date.now(); console.log(`== ${name}`);
  let ok = true, err = null;
  try {
    await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error(`scene timed out after ${ms / 1000} s`)), ms))]);
  } catch (e) {
    ok = false; err = String(e?.message ?? e).split('\n')[0]; flag('scene failed', err, null, 1);
    for (const pg of scenePages) await pg.close().catch(() => undefined);
    onSceneFail();
  }
  scenePages.clear();
  current = { name: `${name} (after end)`, errors: [] };
  report.scenes.push({ name, ok, err, s: Math.round((Date.now() - t0) / 1000) });
}
const drainErrors = (page) => {
  const e = [...new Set(page.__errors)]; page.__errors.length = 0;
  if (e.length) flag('console errors', `${e.length}: ${e.slice(0, 3).join(' | ')}`, null, 2);
};
/** apparent angular diameter (deg) of an object from the explorer */
const angSize = (page, nm) => page.evaluate((n) => { const a = window.app, o = a.findByName(n); const d = o.upos.sub(a.rig.upos).length(); return +(2 * Math.atan(o.radius / d) * 180 / Math.PI).toFixed(2); }, nm);
const place = (page, nm, dist, az = 35, el = 15, select = true) => page.evaluate(([n, d, az, el, s]) => { const a = window.app, o = a.findByName(n); if (s) a.select(o); a.placeNear(o, typeof d === 'string' ? Number(d) : d * (o.radius ?? 1), az, el); }, [nm, dist, az, el, select]);

// ================================================================== desktop
if (which !== 'vr') {
  await scene('title', async () => {
    const page = await openPage('');
    await page.waitForSelector('#start-menu', { timeout: 60000 });
    await ready(page);
    await page.waitForFunction(() => !document.querySelector('#start-menu [data-id="sim"]')?.disabled, null, { timeout: 120000 });
    await frames(page, 4);
    await look(page, 'd01-title', { pop: false, label: false });
    const t0 = Date.now();
    await page.click('#start-menu [data-id="sim"]');
    await page.waitForFunction(() => document.getElementById('start-menu')?.classList.contains('sm-out') ?? true, null, { timeout: 60000 });
    metric('simulatorStartS', (Date.now() - t0) / 1000);
    await frames(page, 6);
    await look(page, 'd02-simulator', { pop: false });
    const hud = await page.evaluate(() => getComputedStyle(document.querySelector('.hud-bottom')).visibility);
    if (hud === 'hidden') flag('HUD still hidden after Simulator', hud, null, 2);
    drainErrors(page); await page.close();
  });

  // one page for the solar-system places: deep links skip the title
  let page = null;
  const solar = async () => { if (page) await page.close().catch(() => undefined); page = await openPage(`?time=${T}&paused=1&target=Earth&dist=3&menu=0`); await ready(page); return page; };

  await scene('earth', async () => {
    const p = await solar();
    await place(p, 'Earth', 3, 40, 10); await frames(p, 8);
    await look(p, 'd03-earth');
    metric('angDeg', await angSize(p, 'Earth')); metric('frameMs', await frameMs(p));
    await place(p, 'Earth', 1.15, 200, 5); await frames(p, 8);
    await look(p, 'd04-earth-low');
    drainErrors(p);
  });

  await scene('moonwalk', async () => {
    const p = await solar();
    await p.evaluate(() => { window.app.terrain.budgetMs = 60; });
    const lm = await p.evaluate(() => { const a = window.app; const m = a.findByName('Moon'); const l = a.landmarks.find((x) => x.world === m); a.select(l); a.rig.setAnchor(m); a.rig.upos.copy(l.upos).addVec(l.up(), 300); const up = l.up(); const t = new up.constructor(0, 0, 1); const f = t.sub(up.clone().multiplyScalar(t.dot(up))).normalize(); a.rig.lookAt(f, up); return l.name; });
    metric('landmark', lm);
    await p.waitForFunction(() => window.app.terrain.owner && window.app.terrain.hScale > 0.99, null, { timeout: 400000 });
    await p.evaluate(() => { const a = window.app; const bl = a.terrain.below(a.rig.upos); a.rig.upos.addVec(a.rig.upos.sub(bl.centre).normalize(), bl.ground + 1.7 - bl.dist); });
    await frames(p, 3);
    await p.evaluate(() => window.app.walk.start());
    await p.waitForFunction(() => window.app.walk.state === 'walk', null, { timeout: 400000 });
    await frames(p, 6);
    await look(p, 'd05-moon-walk', { label: false });
    const a0 = await p.evaluate(() => window.app.rig.upos.toVector3().toArray());
    await p.keyboard.down('KeyW'); await frames(p, 10); await p.keyboard.up('KeyW');
    const a1 = await p.evaluate(() => window.app.rig.upos.toVector3().toArray());
    const walked = Math.hypot(a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]);
    metric('walkedM', +walked.toFixed(2));
    if (!(walked > 0.3)) flag('walking does not move (W held 10 frames)', `${walked.toFixed(2)} m`, null, 1);
    const alt = await p.evaluate(() => { const a = window.app; const bl = a.terrain.below(a.rig.upos); return bl ? bl.dist - bl.ground : null; });
    metric('eyeHeightM', alt === null ? null : +alt.toFixed(2));
    if (alt !== null && (alt < 0.5 || alt > 5)) flag('walking eye height wrong', `${alt.toFixed(2)} m above ground`, null, 1);
    await look(p, 'd06-moon-walked', { label: false });
    await p.evaluate(() => window.app.walk.exit(true));
    drainErrors(p);
  });

  await scene('saturn', async () => {
    const p = await solar();
    await place(p, 'Saturn', 3, 30, 18); await frames(p, 8);
    await look(p, 'd07-saturn');
    metric('angDeg', await angSize(p, 'Saturn'));
    await p.evaluate(() => {
      const a = window.app, spot = a.findByName("Saturn's rings"); a.select(spot); a.rig.upos.copy(spot.upos);
      const sat = a.findByName('Saturn'); const toSat = sat.upos.sub(a.rig.upos).normalize();
      const pole = new toSat.constructor().setFromMatrixColumn(sat.orientation, 2).normalize();
      a.rig.lookAt(toSat.clone().addScaledVector(pole, 0.06).normalize(), pole);
    });
    await frames(p, 12);
    await look(p, 'd08-in-rings', { label: false });
    metric('frameMs', await frameMs(p));
    drainErrors(p);
  });

  await scene('jupiter', async () => {
    const p = await solar();
    await place(p, 'Jupiter', 2.5, 50, 8); await frames(p, 8);
    await look(p, 'd09-jupiter');
    drainErrors(p);
  });

  await scene('nebula', async () => {
    const p = await solar();
    const at = async (k, nm) => {
      await p.evaluate((kk) => { const a = window.app, o = a.findByName('Orion Nebula'); a.select(o); const d = o.upos.sub(a.rig.upos).normalize(); a.rig.upos.copy(o.upos).addVec(d, -o.radius * kk); a.rig.lookAt(d); }, k);
      await frames(p, 10);
      const st = await look(p, nm, { label: k > 1.5 });
      metric(`frameMs@${k}R`, await frameMs(p));
      return st;
    };
    await at(3, 'd10-orion-approach');
    const inside = await at(0.6, 'd11-orion-inside');
    await at(0.1, 'd12-orion-core');
    if (inside.lit < 0.05) flag('inside the nebula looks empty/dark', `lit ${inside.lit}`, 'd11-orion-inside.png', 2);
    drainErrors(p);
  });

  await scene('andromeda', async () => {
    const p = await solar();
    await p.evaluate(() => { const a = window.app, o = a.findByName('Andromeda Galaxy'); a.select(o); const d = o.upos.sub(a.rig.upos).normalize(); a.rig.upos.copy(o.upos).addVec(d, -o.radius * 4); a.rig.lookAt(d); });
    await frames(p, 10);
    await look(p, 'd13-andromeda-far');
    await p.evaluate(() => { const a = window.app, o = a.findByName('Andromeda Galaxy'); a.select(null);
      const v = o.normal.clone().multiplyScalar(0.01).addScaledVector(o.major, 1).normalize();
      a.rig.upos.copy(o.upos).addVec(v, o.radius * 0.45); a.rig.lookAt(v.clone().negate()); });
    const ok = await p.waitForFunction(() => window.app.procStars.pending < 50, null, { timeout: 300000 }).then(() => true).catch(() => false);
    if (!ok) flag('Andromeda stars still streaming after 300 s', '', null, 2);
    await frames(p, 10);
    const st = await look(p, 'd14-in-andromeda', { label: false });
    const near = await p.evaluate(() => window.app.procStars.nearest(window.app.camPc, 30, 40).length);
    metric('nearStars30pc', near); metric('frameMs', await frameMs(p));
    if (near < 5) flag('inside Andromeda: no individual stars nearby', `${near} stars within 30 pc`, 'd14-in-andromeda.png', 1);
    if (st.lit < 0.05) flag('inside Andromeda the sky is nearly black', `lit ${st.lit}`, 'd14-in-andromeda.png', 1);
    drainErrors(p);
  });

  await scene('blackhole', async () => {
    const p = await solar();
    for (const [k, nm] of [[2000, 'd15-bh-far'], [60, 'd16-bh-mid'], [8, 'd17-bh-close']]) {
      await place(p, 'Cygnus X-1', k, 30, 10); await frames(p, 10);
      await look(p, nm);
      metric(`angDeg@${k}Rs`, await angSize(p, 'Cygnus X-1'));
    }
    metric('frameMs', await frameMs(p));
    await place(p, 'Sagittarius A*', 6, 30, 10); await frames(p, 10);
    await look(p, 'd18-sgra');
    drainErrors(p);
  });
  if (page) { await page.close(); page = null; }

  await scene('ship', async () => {
    const p = await openPage(`?time=${T}&target=Earth&dist=1.0628&az=40&el=5&ship=cockpit&menu=0`);
    await ready(p);
    await p.waitForFunction(() => window.app.game?.flight?.on, null, { timeout: 120000 });
    await frames(p, 6);
    const ro = () => p.evaluate(() => { const f = window.app.game.flight, r = f.readout; return { alt: r.altitude, v: r.orbitSpeed, ap: r.ap, pe: r.pe, landed: r.landed, ending: f.ending?.title ?? null, cockpit: { ...window.app.game.cockpit.readout } }; });
    let r = await ro(); metric('orbit', { alt: Math.round(r.alt / 1e3), v: Math.round(r.v) });
    if (!(r.v > 5000)) flag('orbit speed readout ~0 in low Earth orbit', JSON.stringify(r).slice(0, 200), null, 1);
    await look(p, 'd19-ship-orbit', { pop: false });
    // cockpit -> chase must keep physics and the HUD running (bug: setMode called flight.disable)
    await p.keyboard.press('KeyV'); await frames(p, 2);
    const c0 = await p.evaluate(() => ({ mode: window.app.game.mode, on: window.app.game.flight.on, pos: window.app.game.flight.ship.upos.toVector3().toArray(), hud: document.querySelector('.fl-panel')?.textContent ?? '' }));
    await frames(p, 8);
    const c1 = await p.evaluate(() => ({ on: window.app.game.flight.on, pos: window.app.game.flight.ship.upos.toVector3().toArray(), hud: document.querySelector('.fl-panel')?.textContent ?? '' }));
    const moved = Math.hypot(...c1.pos.map((x, i) => x - c0.pos[i]));
    metric('chase', { mode: c0.mode, on: c1.on, movedM: Math.round(moved), hudChanged: c0.hud !== c1.hud });
    if (c0.mode === 'chase' && (!c1.on || moved < 1)) flag('switching to the chase view freezes the ship (physics off)', `flight.on=${c1.on}, moved ${moved.toFixed(1)} m in 8 frames`, null, 1);
    else if (c0.mode === 'chase' && c0.hud && c0.hud === c1.hud) flag('switching to the chase view freezes the flight HUD', 'HUD text unchanged over 8 frames', null, 2);
    await look(p, 'd19b-ship-chase', { pop: false, label: false });
    while (await p.evaluate(() => window.app.game.mode) !== 'cockpit') { await p.keyboard.press('KeyV'); await frames(p, 2); }
    // warp to the Moon
    await p.evaluate(() => { const a = window.app; const e = a.findByName('Earth'); a.placeNear(e, e.radius * 12, 60, 10); a.select(a.findByName('Moon')); });
    await frames(p, 4);
    await p.keyboard.press('KeyJ');
    await frames(p, 3);
    const warping = await p.evaluate(() => ({ ap: window.app.rig.autopilot, warp: window.app.game.cockpit.readout.warp }));
    if (!warping.ap) flag('J does not warp to the selected Moon', JSON.stringify(warping), null, 1);
    await look(p, 'd20-ship-warp', { pop: false, label: false });
    const spd = await p.evaluate(() => window.app.game.cockpit.readout);
    metric('warpReadout', spd);
    if (warping.ap && /^0(\.0+)?\b/.test(String(spd.speed ?? spd.distance ?? ''))) flag('warp readout stuck at 0', JSON.stringify(spd), 'd20-ship-warp.png', 2);
    await p.waitForFunction(() => !window.app.rig.autopilot, null, { timeout: 300000 });
    await frames(p, 4);
    await look(p, 'd21-ship-arrived', { pop: false });
    // dock at the station of the world we are at
    const hasStation = await p.evaluate(() => window.app.game.traffic.stations.length);
    if (hasStation) {
      await p.evaluate(() => { const a = window.app; const s = a.game.traffic.stations[0]; a.select(s); a.goTo(s); });
      await p.waitForFunction(() => !window.app.rig.autopilot, null, { timeout: 300000 });
      // record the station's on-screen presence every frame while the docking computer flies
      await p.evaluate(() => { const a = window.app, s = a.game.traffic.stations[0]; window.__stn = []; const V = s.group.position.constructor;
        const tick = () => { if (a.game.docked) return; if (a.game.isDocking ?? a.game.docking) { s.group.updateMatrixWorld(true); const w = s.group.getWorldPosition(new V()); const c = a.renderer.camera.getWorldPosition(new V()); window.__stn.push({ vis: s.group.visible && (s.group.parent !== null), d: w.distanceTo(c) }); } if (window.__stn.length < 400) requestAnimationFrame(tick); };
        requestAnimationFrame(tick); });
      await p.keyboard.down('KeyW');
      await p.waitForFunction(() => window.app.game.docked !== null || window.app.game.docking !== null, null, { timeout: 120000 }).catch(() => undefined);
      await p.keyboard.up('KeyW');
      const docked = await p.waitForFunction(() => window.app.game.docked !== null, null, { timeout: 120000 }).then(() => true).catch(() => false);
      if (!docked) flag('docking computer did not dock', '', null, 2);
      const stn = await p.evaluate(() => window.__stn);
      const ds = stn.map((x) => x.d).sort((x, y) => x - y); const med = ds[ds.length >> 1] ?? 0;
      const gone = stn.filter((x) => !x.vis || x.d > med * 20 + 5e3).length;
      metric('stationDuringDocking', { frames: stn.length, gone, medianM: Math.round(med) });
      if (gone) flag('docking station disappears while the docking computer flies', `${gone}/${stn.length} frames hidden or misplaced (median distance ${Math.round(med)} m)`, null, 1);
      await frames(p, 6);
      await look(p, 'd22-ship-docked', { pop: false });
      await p.keyboard.down('KeyS'); await frames(p, 6); await p.keyboard.up('KeyS');
    } else flag('no station near the Moon to dock with', '', null, 3);
    // land on the Moon
    await p.evaluate(() => { const a = window.app; const m = a.findByName('Moon'); a.select(m); a.placeNear(m, m.radius + 5000, 30, 20); a.clock.paused = true; });
    await p.waitForFunction(() => window.app.terrain.owner === window.app.findByName('Moon') && !!window.app.terrain.below(window.app.rig.upos), null, { timeout: 240000 }).catch(() => undefined);
    await p.evaluate(() => { window.app.game.flight.hoverOverGround(12); window.app.clock.paused = false; });
    await p.waitForFunction(() => !!window.app.game.flight.readout.landed || !!window.app.game.flight.ending, null, { timeout: 240000 }).catch(() => undefined);
    r = await ro();
    if (r.landed !== 'Moon') flag('landing on the Moon failed', JSON.stringify({ landed: r.landed, ending: r.ending, alt: r.alt }), null, 1);
    await frames(p, 4);
    await look(p, 'd23-ship-landed', { pop: false });
    // launch: full throttle off the surface
    const alt0 = await p.evaluate(() => window.app.rig.altitude);
    await p.keyboard.down('KeyW'); await p.keyboard.down('ShiftLeft'); await frames(p, 20);
    await p.keyboard.up('ShiftLeft'); await p.keyboard.up('KeyW');
    await frames(p, 10);
    const alt1 = await p.evaluate(() => window.app.rig.altitude);
    r = await ro();
    metric('launch', { alt0: Math.round(alt0), alt1: Math.round(alt1), v: Math.round(r.v) });
    if (!(alt1 > alt0 + 5)) flag('cannot launch from the Moon (W/Shift held 20 frames)', `alt ${alt0.toFixed(1)} -> ${alt1.toFixed(1)} m`, null, 1);
    await look(p, 'd24-ship-launch', { pop: false });
    drainErrors(p); await p.close();
  }, 20 * 60e3);

  await scene('god', async () => {
    const p = await openPage(`?time=${T}&target=Earth&dist=60&az=60&el=25&menu=0`);
    await ready(p);
    await p.waitForFunction(() => window.app.god, null, { timeout: 60000 });
    await p.evaluate(() => { try { localStorage.removeItem('space-explorer-god-universe'); } catch { /* */ } });
    await p.keyboard.press('KeyY'); await frames(p, 3);
    await look(p, 'd25-god-panel', { pop: false });
    await p.click('button[data-a="v"][data-k="reverse"]'); await frames(p, 3);
    const rev = await p.evaluate(() => { const a = window.app, b = a.findByName('Earth'), s = a.system.sun; const h = b.pos.clone().sub(s.pos).cross(b.vel.clone().sub(s.vel)).normalize(); return h.y * -0.3977771559 + h.z * 0.9174820621; });
    if (!(rev < -0.9)) flag('Reverse orbit did not reverse Earth', `hEcl ${rev}`, null, 1);
    await p.evaluate(() => { window.app.clock.rate = 86400 * 5; window.app.clock.paused = false; });
    await frames(p, 8);
    await look(p, 'd26-god-reversed', { pop: false });
    await p.evaluate(() => { window.app.clock.paused = true; window.app.select(window.app.findByName('Earth')); });
    await p.keyboard.press('Delete'); await frames(p, 3);
    const del = await p.evaluate(() => window.app.system.byId.get(399).valid);
    if (del) flag('Delete did not remove Earth', '', null, 1);
    await look(p, 'd27-god-deleted', { pop: false, label: false });
    const holeId = await p.evaluate(() => { const a = window.app, e = a.system.byId.get(301); return a.god.spawn('hole', 10, e.pos.clone().add(e.vel.clone().normalize().multiplyScalar(3e9))); });
    await frames(p, 4);
    await p.evaluate((id) => { const a = window.app; const h = a.blackHoles.find((x) => x.key === `god:${id}`); if (h) { a.select(h); a.placeNear(h, h.radius * 4e4, 30, 12); } }, holeId);
    await frames(p, 6);
    const holeShown = await p.evaluate((id) => !!window.app.blackHoles.find((x) => x.key === `god:${id}`), holeId);
    if (!holeShown) flag('dropped black hole not drawn', '', null, 1);
    await look(p, 'd28-god-blackhole', { pop: false });
    await p.keyboard.press('Backquote'); await frames(p, 2);
    for (const line of ['for p in planets: p.e = 0', 'print(earth)', 'create planet Nova mass=2 earth a=1.6 au']) {
      await p.fill('.god-console input', line); await p.press('.god-console input', 'Enter'); await frames(p, 3);
    }
    const con = await p.evaluate(() => document.querySelector('.god-console')?.textContent.slice(-400));
    metric('consoleTail', con);
    await look(p, 'd29-god-console', { pop: false, label: false });
    await p.keyboard.press('Escape');
    await p.evaluate(() => window.app.god.reset());
    drainErrors(p); await p.close();
  });
}

// ================================================================== Quest 3 (IWER)
if (which !== 'desktop') {
  let page = null;
  onSceneFail = () => { page = null; };
  const vrPage = async () => {
    if (page && !page.isClosed()) { scenePages.add(page); return page; }
    page = await openPage(`?time=${T}&paused=1&target=Earth&dist=4&az=40&el=10&menu=0`, { vr: true, w: 960, h: 540 });
    await ready(page);
    await page.evaluate(() => window.app.vr.enter());
    await page.waitForFunction(() => window.app.vr.active && window.app.renderer.presenting, null, { timeout: 60000 });
    await frames(page, 8);
    return page;
  };
  const closeMenu = (p) => p.evaluate(() => { const m = window.app.vr.menu; if (m.isOpen) m.panel.setVisible(false); });
  const headInfo = (p, nm) => p.evaluate((n) => {
    const a = window.app; const xr = a.renderer.gl.xr.getCamera(); const cams = xr.cameras ?? [];
    const ipd = cams.length > 1 ? cams[0].getWorldPosition(xr.position.clone()).distanceTo(cams[1].getWorldPosition(xr.position.clone())) : null;
    const o = n ? a.findByName(n) : null; const d = o ? o.upos.sub(a.rig.upos).length() : null;
    return { ipdM: ipd, rigScale: a.renderer.rig?.scale?.x ?? null, angDeg: o ? +(2 * Math.atan(o.radius / d) * 180 / Math.PI).toFixed(2) : null, distR: o ? +(d / o.radius).toFixed(2) : null };
  }, nm);

  await scene('vr-menu', async () => {
    const p = await vrPage();
    await p.waitForFunction(() => window.app.vr.menu.isOpen, null, { timeout: 180000 });
    await frames(p, 2);
    await look(p, 'v01-menu', { vr: true, pop: false });
    // reach and legibility of the menu panel
    const m = await p.evaluate(() => {
      const a = window.app, panel = a.vr.menu.panel; panel.mesh.updateMatrixWorld(true);
      const xr = a.renderer.gl.xr.getCamera(); const head = xr.getWorldPosition(panel.mesh.position.clone());
      const pc = panel.mesh.getWorldPosition(panel.mesh.position.clone());
      const s = panel.mesh.getWorldScale(panel.mesh.position.clone()).x;
      const g = panel.mesh.geometry.parameters; const dist = pc.distanceTo(head);
      const fwd = xr.getWorldDirection(pc.clone()); const to = pc.clone().sub(head).normalize();
      const off = Math.acos(Math.min(1, fwd.dot(to))) * 180 / Math.PI;
      const wM = g.width * s; const angW = 2 * Math.atan(wM / 2 / dist) * 180 / Math.PI;
      const pxPerDeg = panel.width / angW;
      // 24 px canvas text (the menu's small size) as an angle; ~0.35° is the floor of comfortable reading
      const text24Deg = 24 / pxPerDeg;
      return { distM: +dist.toFixed(2), widthM: +wM.toFixed(2), angW: +angW.toFixed(1), offAxisDeg: +off.toFixed(1), canvasPx: panel.width, pxPerDeg: +pxPerDeg.toFixed(1), text24Deg: +text24Deg.toFixed(2), headY: +head.y.toFixed(2), panelY: +pc.y.toFixed(2) };
    });
    metric('menu', m);
    if (m.distM > 2.5 || m.distM < 0.4) flag('VR menu out of comfortable reach', `${m.distM} m away`, 'v01-menu.png', 2);
    if (m.angW > 90) flag('VR menu wider than comfortable view (head turning needed)', `${m.angW}° wide`, 'v01-menu.png', 2);
    if (m.offAxisDeg > 30) flag('VR menu opens off to the side of the gaze', `${m.offAxisDeg}° off axis`, 'v01-menu.png', 2);
    if (m.text24Deg < 0.35) flag('VR menu small text below legibility', `24 px text = ${m.text24Deg}°`, 'v01-menu.png', 2);
    if (m.pxPerDeg < 18) flag('VR menu texture blurry (under Quest 3 ~25 px/°)', `${m.pxPerDeg} px/°`, 'v01-menu.png', 3);
    metric('head', await headInfo(p, 'Earth'));
    drainErrors(p);
  });

  await scene('vr-travel', async () => {
    const p = await vrPage();
    await closeMenu(p);
    await p.evaluate(() => { const a = window.app; const s = a.findByName('Saturn'); a.select(s); a.goTo(s); });
    const samples = [];
    for (let i = 0; i < 8; i++) {
      samples.push(await p.evaluate(() => ({ t: window.app.vr.travelling, vig: window.app.vr.vignette?.visible ?? null, tun: window.app.vr.vig?.tunnel.value ?? null })));
      await frames(p, 2);
    }
    metric('vignetteDuringTravel', samples);
    if (samples.some((s) => s.t) && !samples.some((s) => s.vig)) flag('no comfort vignette during VR travel', JSON.stringify(samples.slice(0, 3)), null, 2);
    await p.waitForFunction(() => !window.app.vr.travelling && !window.app.rig.autopilot, null, { timeout: 400000 });
    await frames(p, 4);
    await look(p, 'v02-saturn', { vr: true });
    metric('saturn', await headInfo(p, 'Saturn')); metric('frameMs', await frameMs(p));
    drainErrors(p);
  });

  for (const [nm, k, shot] of [['Earth', 1.5, 'v03-earth-close'], ['Jupiter', 2, 'v04-jupiter']]) {
    await scene(`vr-${nm.toLowerCase()}`, async () => {
      const p = await vrPage(); await closeMenu(p);
      await place(p, nm, k, 40, 8); await frames(p, 6);
      await look(p, shot, { vr: true });
      metric('head', await headInfo(p, nm)); metric('frameMs', await frameMs(p));
      drainErrors(p);
    });
  }

  await scene('vr-blackhole', async () => {
    const p = await vrPage(); await closeMenu(p);
    await place(p, 'Cygnus X-1', 10, 30, 10); await frames(p, 6);
    await look(p, 'v05-blackhole', { vr: true });
    metric('head', await headInfo(p, 'Cygnus X-1')); metric('frameMs', await frameMs(p));
    drainErrors(p);
  });

  await scene('vr-nebula', async () => {
    const p = await vrPage(); await closeMenu(p);
    await p.evaluate(() => { const a = window.app, o = a.findByName('Orion Nebula'); a.select(o); const d = o.upos.sub(a.rig.upos).normalize(); a.rig.upos.copy(o.upos).addVec(d, -o.radius * 0.6); a.rig.lookAt(d); });
    await frames(p, 8);
    await look(p, 'v06-orion-inside', { vr: true });
    metric('frameMs', await frameMs(p));
    drainErrors(p);
  });

  await scene('vr-andromeda', async () => {
    const p = await vrPage(); await closeMenu(p);
    await p.evaluate(() => { const a = window.app, o = a.findByName('Andromeda Galaxy'); a.select(null);
      const v = o.normal.clone().multiplyScalar(0.01).addScaledVector(o.major, 1).normalize();
      a.rig.upos.copy(o.upos).addVec(v, o.radius * 0.45); a.rig.lookAt(v.clone().negate()); });
    await p.waitForFunction(() => window.app.procStars.pending < 50, null, { timeout: 300000 }).catch(() => flag('VR: Andromeda stars still streaming after 300 s', '', null, 2));
    await frames(p, 6);
    await look(p, 'v07-in-andromeda', { vr: true });
    metric('frameMs', await frameMs(p));
    drainErrors(p);
  });

  await scene('vr-god', async () => {
    const p = await vrPage();
    const g = await p.evaluate(() => window.app.vr.debugGod?.() ?? null);
    metric('godTab', g);
    if (!g?.tab) flag('VR menu has no God tab', JSON.stringify(g), null, 1);
    await p.evaluate(() => window.app.vr.menu.open('god'));
    await frames(p, 4);
    await look(p, 'v08-god-tab', { vr: true, pop: false });
    drainErrors(p);
  });
  if (page) await page.close();
}

await browser.close();

// ------------------------------------------------------------------ report
report.finished = new Date().toISOString();
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));
const md = [`# Playtest ${report.base}`, `${report.started} → ${report.finished}`, '', '## Scenes', '',
  ...report.scenes.map((s) => `- ${s.ok ? 'ok' : '**FAILED**'} ${s.name} (${s.s} s)${s.err ? ` — ${s.err}` : ''}`), '',
  '## Anomalies (severity 1 = worst)', '',
  ...report.anomalies.sort((a, b) => a.severity - b.severity).map((a) => `- [${a.severity}] **${a.scene}** ${a.kind}: ${a.detail}${a.shot ? ` — \`${a.shot}\`` : ''}`), '',
  '## Metrics', '', '```', ...Object.entries(report.metrics).map(([k, v]) => `${k} = ${JSON.stringify(v)}`), '```', ''];
fs.writeFileSync(path.join(outDir, 'report.md'), md.join('\n'));
console.log(`\n${report.scenes.filter((s) => s.ok).length}/${report.scenes.length} scenes ran, ${report.anomalies.length} anomalies -> ${path.join(outDir, 'report.md')}`);
