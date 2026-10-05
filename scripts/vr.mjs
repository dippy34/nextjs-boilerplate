// Drives the app inside an emulated Meta Quest 3 (IWER, Meta's WebXR emulator) in headless Chromium:
// enters immersive VR, uses the in-headset menu with the controller laser, travels, searches with the
// virtual keyboard, selects in the sky, flies, turns, uses hand tracking, visits a black hole, exits.
// Usage: node scripts/vr.mjs [baseUrl] [outDir]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { asymmetricFrusta, measureDisparity } from './stereo.mjs';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const outDir = process.argv[3] ?? 'screenshots';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  ...(process.env.TRUSTED_SPKI ? [`--ignore-certificate-errors-spki-list=${process.env.TRUSTED_SPKI}`] : [])] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'warning' && /XR render target/.test(m.text())) errors.push(m.text()); });
// Mean brightness of what the headset shows (IWER composites the eye images into the page canvas).
const headsetBrightness = () => page.evaluate(() => {
  const src = document.querySelector('canvas');
  const c = document.createElement('canvas'); c.width = 96; c.height = 54;
  const ctx = c.getContext('2d'); ctx.drawImage(src, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data; let sum = 0, lit = 0;
  for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; sum += l; if (l > 40) lit++; }
  return { mean: sum / (d.length / 4), litFraction: lit / (d.length / 4) };
});
await page.addInitScript({ path: 'node_modules/iwer/build/iwer.min.js' });
await page.addInitScript(() => {
  const d = new IWER.XRDevice(IWER.metaQuest3);
  d.stereoEnabled = true; // two eyes, as on a real headset
  // Projection layers, like the Quest Browser: three then renders into layer textures, not the canvas.
  d.installRuntime({ forceInstall: true, polyfillLayers: true });
  window.__xrDevice = d;
});
// the real Quest 3's eye frusta are asymmetric (IWER's are not): stereo checks must hold with them
await page.addInitScript(asymmetricFrusta);
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); };
const frames = (n) => page.evaluate((k) => new Promise((res) => {
  const start = window.app.frameCount;
  const t = setInterval(() => { if (window.app.frameCount >= start + k) { clearInterval(t); res(); } }, 10);
}), n);
const press = async (hand, id, n = 4) => {
  await page.evaluate(([h, b]) => window.__xrDevice.controllers[h].updateButtonValue(b, 1), [hand, id]);
  await frames(n);
  await page.evaluate(([h, b]) => window.__xrDevice.controllers[h].updateButtonValue(b, 0), [hand, id]);
  await frames(n);
};
// Point an emulated controller/hand (in the dolly = reference-space frame) at a world point.
// The ray starts where three renders the right controller / hand (reference-space pose on the dolly).
const AIM = `(a, dev, p) => {
  const rig = a.renderer.rig; rig.updateMatrixWorld(true);
  const hand = a.vr.hands.find((h) => h.handedness === 'right');
  hand.obj.updateMatrixWorld(true);
  const origin = hand.obj.getWorldPosition(p.clone());
  const d = p.clone().sub(origin).normalize().applyQuaternion(rig.quaternion.clone().invert());
  const w = 1 - d.z; const n = Math.hypot(d.y, d.x, w);
  dev.quaternion.set(d.y / n, -d.x / n, 0, w / n);
}`;
/** aim the right controller at the centre of a hit region of a panel */
const aimRegion = (panelExpr, regionId) => page.evaluate(([aim, pe, id]) => {
  const a = window.app;
  const panel = new Function('a', `return ${pe};`)(a);
  panel.update();
  const r = panel.regions.find((x) => x.id === id);
  if (!r) throw new Error(`region ${id} not found`);
  const g = panel.mesh.geometry.parameters;
  const lx = ((r.x + r.w / 2) / panel.width - 0.5) * g.width;
  const ly = (0.5 - (r.y + r.h / 2) / panel.height) * g.height;
  panel.mesh.updateMatrixWorld(true);
  const p = panel.mesh.localToWorld(a.renderer.camera.position.clone().set(lx, ly, 0));
  new Function('return ' + aim)()(a, window.__xrDevice.controllers.right, p);
}, [AIM, panelExpr, regionId]);
const aimBody = (kind, name) => page.evaluate(([aim, k, nm]) => {
  const a = window.app;
  const body = a.system.bodies.find((b) => b.name === nm);
  new Function('return ' + aim)()(a, window.__xrDevice[k].right, body.upos.sub(a.rig.upos));
}, [AIM, kind, name]);
const waitTravel = async () => {
  await page.waitForFunction(() => window.app.vr.travelling, null, { timeout: 30000 }).catch(() => undefined);
  await page.waitForFunction(() => !window.app.vr.travelling && !window.app.rig.autopilot, null, { timeout: 400000 });
};
// Stereo: hide what is drawn near the head (menu, labels, lasers) so only the measured object counts
const quietHead = () => page.evaluate(() => {
  const v = window.app.vr;
  if (v.menu.isOpen) v.menu.panel.setVisible(false);
  v.labelsGroup.visible = false; v.hoverLabel.visible = false; v.hoverRing.visible = false; v.updateHover = () => {};
  for (const h of v.hands) { h.ray.visible = false; h.cursor.visible = false; }
});
const stereoCheck = async (name, expr, want, opts) => {
  const m = await measureDisparity(page, expr, opts);
  const err = Math.abs(m.measured - m[want]);
  // (0.6 px: a block match on a lit patch is good to a few tenths of a pixel)
  check(name, m.contrast > 3 && m.score < 0.3 && err < 0.6, `disparity ${m.measured} px; true ${m.truth}, at infinity ${m.infinity}; ${(m.dist / 1e3).toFixed(m.dist < 1e3 ? 3 : 0)} km; match ${m.score}`);
  return m;
};
const distR = (name) => page.evaluate((nm) => { const a = window.app; const b = a.system.bodies.find((x) => x.name === nm); return b.upos.sub(a.rig.upos).length() / b.radius; }, name);

await page.goto(`${base}?time=2026-10-01T20:00:00Z&target=Earth&dist=4&az=40&el=10&paused=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 60000 });

// 1. Enter VR: frames go to the headset, the menu opens after the fade-in
await page.waitForSelector('#vr-button', { state: 'visible', timeout: 10000 });
check('Enter VR button shown when a headset is available', true);
await page.click('#vr-button');
await page.waitForFunction(() => window.app.vr.active && window.app.renderer.presenting, null, { timeout: 90000 });
const t0 = Date.now();
await frames(8); // frame-counted waits: software rendering in CI can run at ~1 fps
const xrDraw = await page.evaluate(async () => {
  const gl = window.app.renderer.gl; const orig = gl.render.bind(gl); const seen = [];
  // (the reduced-resolution volume pass draws into its own target first: not the page canvas)
  gl.render = (sc, cam) => { const t = gl.getRenderTarget(); if (!t || t !== window.app.renderer.volTarget) seen.push(!!t && t.isXRRenderTarget === true); return orig(sc, cam); };
  await new Promise((res) => { const s = window.app.frameCount; const t = setInterval(() => { if (window.app.frameCount >= s + 3) { clearInterval(t); res(); } }, 10); });
  gl.render = orig;
  return { draws: seen.length, intoXR: seen.filter(Boolean).length };
});
check('immersive session renders frames', true, `${((Date.now() - t0) / 1000).toFixed(1)} s for 11 frames`);
check('VR frames are drawn into the headset framebuffer', xrDraw.draws > 0 && xrDraw.intoXR === xrDraw.draws, JSON.stringify(xrDraw));
await page.waitForFunction(() => window.app.vr.menu.isOpen, null, { timeout: 120000 });
let st = await page.evaluate(() => { const v = window.app.view; return { xr: v.xr, fov: v.fovY, w: v.width, h: v.height }; });
check('view comes from the headset eye', st.xr && st.fov > 60 && st.fov < 120, `fovY=${st.fov.toFixed(1)}° ${st.w}×${st.h}`);
{
  const g = await page.evaluate(() => window.__xrGpu ?? null);
  check('headset GPU settings applied (framebuffer scale, foveation asked for)', !!g && g.options.foveation === 1 && g.options.fbScale > 0 && g.width > 0, JSON.stringify(g));
}
check('menu opens in front of the user after entering', true);
await frames(2);
const lum = await headsetBrightness();
check('the headset image is not black', lum.litFraction > 0.02, JSON.stringify(lum));
await page.screenshot({ path: path.join(outDir, 'vr1-menu.png'), timeout: 180000 });

// 1b. Scale: the layer's depth stays away from the compositor (log depth would read as centimetres
//     there), Earth at 2 radii has no parallax, a rock 5 m away has true 6.3 cm stereo
st = await page.evaluate(() => { const L = window.app.renderer.gl.xr.getBaseLayer(); return { init: L?.madeWith ?? null, ignore: L?.ignoreDepthValues }; });
check('headset layer is made without depth for the compositor', !!st.init && st.init.depthFormat === 0 && st.ignore === true, JSON.stringify(st));
await page.evaluate(() => { const a = window.app; const e = a.system.bodies.find((b) => b.name === 'Earth'); a.placeNear(e, 2 * e.radius, 40, 10); a.rig.lookAt(e.upos.sub(a.rig.upos).normalize()); });
await quietHead();
await frames(4);
await stereoCheck('Earth at 2 radii: no parallax (as far as it is)', `(() => { const b = a.system.bodies.find((x) => x.name === 'Earth'); return b.upos.sub(a.rig.upos); })()`, 'infinity', { half: 60, search: 30 });
await page.evaluate(() => {
  const a = window.app; const src = a.rocks.meshes[0];
  const mat = src.material.clone();
  for (const k of ['uPullIn', 'uDepthK', 'uLite']) mat.uniforms[k] = src.material.uniforms[k];
  mat.uniforms.uExposure.value = 40; mat.uniforms.uRockColor.value.setRGB(0.5, 0.45, 0.4);
  const g = src.geometry.clone(); const ar = g.getAttribute('aRock'); ar.setXYZW(0, 0.5, 0.5, 1, 1); ar.needsUpdate = true;
  const m = new src.constructor(g, mat, 1); m.frustumCulled = false; m.name = 'stereo-rock';
  m.setMatrixAt(0, new src.matrix.constructor().makeScale(1.2, 0.9, 1)); m.instanceMatrix.needsUpdate = true;
  a.renderer.scene.add(m); window.__rock = m;
  const e = a.system.bodies.find((x) => x.name === 'Earth').upos.sub(a.rig.upos).normalize();
  a.rig.lookAt(e.clone().negate()); // against the dark sky
});
await frames(2);
await page.evaluate(() => { const a = window.app; window.__rock.position.copy(a.renderer.camera.position.clone().set(0, 0.9, -4.92).applyQuaternion(a.renderer.rig.quaternion)); });
await frames(3);
await stereoCheck('rock 5 m away: true stereo', 'window.__rock.position.clone()', 'truth', { half: 50, search: 40 });
await page.screenshot({ path: path.join(outDir, 'vr1b-rock.png'), timeout: 180000 });
await page.evaluate(() => { window.app.renderer.scene.remove(window.__rock); window.app.vr.labelsGroup.visible = true; });
await page.goto(`${base}?time=2026-10-01T20:00:00Z&target=Earth&dist=4&az=40&el=10&paused=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 60000 });
await page.click('#vr-button');
await page.waitForFunction(() => window.app.vr.active && window.app.renderer.presenting, null, { timeout: 90000 });
await page.waitForFunction(() => window.app.vr.menu.isOpen, null, { timeout: 120000 });

// 2. Laser + trigger on the Saturn tile: hover highlight, then travel there
const saturnKey = await page.evaluate(() => window.app.system.bodies.find((b) => b.name === 'Saturn').key);
await aimRegion('a.vr.menu.panel', `go:${saturnKey}`);
await frames(4);
st = await page.evaluate(() => window.app.vr.menu.panel.hover);
check('laser hover highlights the menu tile', st === `go:${saturnKey}`, `hover=${st}`);
await page.screenshot({ path: path.join(outDir, 'vr2-menu-hover.png'), timeout: 180000 });
await press('right', 'trigger');
st = await page.evaluate(() => ({ sel: window.app.selection?.name, menu: window.app.vr.menu.isOpen }));
check('clicking a tile selects it and closes the menu', st.sel === 'Saturn' && !st.menu, JSON.stringify(st));
await waitTravel();
let r = await distR('Saturn');
check('travel arrives at Saturn, framed for VR', r > 3.5 && r < 6, `${r.toFixed(2)} R`);
await frames(3);
await page.screenshot({ path: path.join(outDir, 'vr3-saturn.png'), timeout: 180000 });

// 3. Search with the virtual keyboard: Y opens the menu, type "IO", pick the first result
await press('left', 'y-button');
await page.waitForFunction(() => window.app.vr.menu.isOpen, null, { timeout: 30000 });
await aimRegion('a.vr.menu.panel', 'tab:search');
await frames(2);
await press('right', 'trigger');
for (const k of ['I', 'O']) {
  await aimRegion('a.vr.menu.panel', `key:${k}`);
  await frames(2);
  await press('right', 'trigger', 3);
}
st = await page.evaluate(() => window.app.vr.menu.query);
const firstResult = await page.evaluate((q) => window.app.searchItems(q)[0], st);
check('virtual keyboard types the query and finds Io', st === 'Io' && firstResult?.label === 'Io', `query="${st}" first=${firstResult?.label}`);
await page.screenshot({ path: path.join(outDir, 'vr4-search.png'), timeout: 180000 });
await aimRegion('a.vr.menu.panel', `res:${firstResult.id}`);
await frames(2);
await press('right', 'trigger');
await waitTravel();
r = await distR('Io');
check('search result flies to Io', r > 1.6 && r < 4, `${r.toFixed(2)} R`);
await frames(3);
await page.screenshot({ path: path.join(outDir, 'vr5-io.png'), timeout: 180000 });

// 4. Point at Jupiter in the sky (from a spot where nothing is in front of it): hover ring,
//    trigger selects and shows the info card; B closes it
await page.evaluate(() => { const a = window.app; const j = a.system.bodies.find((b) => b.name === 'Jupiter'); a.placeNear(j, j.radius * 8, 30, 12); a.select(null); });
await frames(3);
await aimBody('controllers', 'Jupiter');
await frames(4);
st = await page.evaluate(() => window.app.vr.hands.find((h) => h.hoverObj)?.hoverObj?.name ?? null);
check('pointing at Jupiter hovers it', st === 'Jupiter', `hover=${st}`);
await press('right', 'trigger');
st = await page.evaluate(() => ({ sel: window.app.selection?.name, card: window.app.vr.card.visible }));
check('trigger on the sky selects and opens the info card', st.sel === 'Jupiter' && st.card, JSON.stringify(st));
await frames(2);
await page.screenshot({ path: path.join(outDir, 'vr6-card.png'), timeout: 180000 });
await press('right', 'b-button');
st = await page.evaluate(() => window.app.vr.card.visible);
check('B closes the card', !st);

// 5. Left stick flies along the left controller; right stick snap-turns 30°
const p0 = await page.evaluate(() => window.app.rig.upos.toVector3().toArray());
await page.evaluate(() => window.__xrDevice.controllers.left.updateAxes('thumbstick', 0, -1));
await frames(12);
await page.evaluate(() => window.__xrDevice.controllers.left.updateAxes('thumbstick', 0, 0));
await frames(3);
const p1 = await page.evaluate(() => window.app.rig.upos.toVector3().toArray());
const moved = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
check('left stick flies', moved > 1e3, `moved ${(moved / 1e3).toFixed(0)} km`);
const q0 = await page.evaluate(() => window.app.rig.quat.toArray());
await page.evaluate(() => window.__xrDevice.controllers.right.updateAxes('thumbstick', 1, 0));
await frames(6);
await page.evaluate(() => window.__xrDevice.controllers.right.updateAxes('thumbstick', 0, 0));
await frames(4);
const q1 = await page.evaluate(() => window.app.rig.quat.toArray());
const dot = Math.abs(q0[0] * q1[0] + q0[1] * q1[1] + q0[2] * q1[2] + q0[3] * q1[3]);
const turned = (2 * Math.acos(Math.min(1, dot)) * 180) / Math.PI;
check('right stick snap-turns', Math.abs(turned - 30) < 1, `${turned.toFixed(1)}°`);

// 6. X pauses / resumes time
const paused0 = await page.evaluate(() => window.app.clock.paused);
await press('left', 'x-button');
const paused1 = await page.evaluate(() => window.app.clock.paused);
check('X toggles pause', paused0 !== paused1, `${paused0} → ${paused1}`);

// 7. Hand tracking: pinch selects, pinching the selection again travels, pinching empty sky stops
const pinch = async () => {
  await page.evaluate(() => window.__xrDevice.hands.right.updatePinchValue(1));
  await frames(4);
  await page.evaluate(() => window.__xrDevice.hands.right.updatePinchValue(0));
  await frames(4);
};
await page.evaluate(() => { window.__xrDevice.primaryInputMode = 'hand'; window.app.select(null); });
await frames(6);
await aimBody('hands', 'Jupiter');
await frames(4);
await pinch();
st = await page.evaluate(() => window.app.selection?.name ?? null);
check('hand pinch selects', st === 'Jupiter', `selected ${st}`);
await pinch();
st = await page.evaluate(() => window.app.vr.travelling);
check('pinching the selection again starts travel', st);
await page.waitForFunction(() => window.app.rig.autopilot, null, { timeout: 60000 }).catch(() => undefined);
await page.evaluate(() => { const q = window.__xrDevice.hands.right.quaternion; q.set(0.7071, 0, 0, 0.7071); }); // straight up
await frames(3);
await pinch();
await frames(6);
st = await page.evaluate(() => ({ ap: !!window.app.rig.autopilot }));
check('pinching empty sky stops the flight', !st.ap, JSON.stringify(st));
await page.evaluate(() => { window.__xrDevice.primaryInputMode = 'controller'; });

// 8. Black holes tab: fly to Gaia BH1; the lensing pass renders its environment and the headset image
await press('left', 'y-button');
await page.waitForFunction(() => window.app.vr.menu.isOpen, null, { timeout: 30000 });
await aimRegion('a.vr.menu.panel', 'tab:holes');
await frames(2);
await press('right', 'trigger');
const bhKey = await page.evaluate(() => window.app.blackHoles.find((h) => h.name === 'Gaia BH1').key);
await aimRegion('a.vr.menu.panel', `go:${bhKey}`);
await frames(2);
await press('right', 'trigger');
await waitTravel();
st = await page.evaluate(() => { const a = window.app; const h = a.blackHoles.find((x) => x.name === 'Gaia BH1'); return { r: h.upos.sub(a.rig.upos).length() / h.radius, drawn: a.holes.views.some((v) => v.bh === h) }; });
check('Black holes tab flies to Gaia BH1 and draws it', st.drawn && st.r > 15 && st.r < 21, `${st.r.toFixed(1)} rs, drawn=${st.drawn}`);
const bhDraw = await page.evaluate(async () => {
  const a = window.app; const gl = a.renderer.gl; const orig = gl.render.bind(gl); const main = []; let env = 0;
  gl.render = (sc, cam) => { const t = gl.getRenderTarget(); if (cam === a.renderer.camera && (!t || t !== a.renderer.volTarget)) main.push(!!t && t.isXRRenderTarget === true); else if (t && t.isWebGLCubeRenderTarget) env++; return orig(sc, cam); };
  await new Promise((res) => { const s = a.frameCount; const t = setInterval(() => { if (a.frameCount >= s + 3) { clearInterval(t); res(); } }, 10); });
  gl.render = orig;
  return { main: main.length, intoXR: main.filter(Boolean).length, env };
});
check('environment captured without breaking the headset framebuffer', bhDraw.env > 0 && bhDraw.main > 0 && bhDraw.intoXR === bhDraw.main, JSON.stringify(bhDraw));
const bhLum = await headsetBrightness();
check('the black hole view is not black', bhLum.litFraction > 0.02, JSON.stringify(bhLum));
await page.screenshot({ path: path.join(outDir, 'vr8-black-hole.png'), timeout: 180000 });
// 8a. 30 Schwarzschild radii from Gaia BH1: the hole and its lensed sky have no parallax
await page.evaluate(() => { const a = window.app; const h = a.blackHoles.find((x) => x.name === 'Gaia BH1'); a.placeNear(h, 30 * h.radius, 30, 12); a.rig.lookAt(h.upos.sub(a.rig.upos).normalize()); });
await quietHead();
await frames(10);
await stereoCheck('black hole at 30 rs: no parallax', `(() => { const h = a.blackHoles.find((x) => x.name === 'Gaia BH1'); return h.upos.sub(a.rig.upos); })()`, 'infinity', { half: 60, search: 30 });
await page.screenshot({ path: path.join(outDir, 'vr8a-black-hole-30rs.png'), timeout: 180000 });
await page.evaluate(() => { const v = window.app.vr; v.labelsGroup.visible = true; delete v.updateHover; for (const h of v.hands) h.ray.visible = true; });

// 8b. Places tab: fly to the Apollo 11 landing site; the Moon's real terrain is drawn there
await press('left', 'y-button');
await page.waitForFunction(() => window.app.vr.menu.isOpen, null, { timeout: 30000 });
await aimRegion('a.vr.menu.panel', 'tab:places');
await frames(2);
await press('right', 'trigger');
await aimRegion('a.vr.menu.panel', 'go:place:Apollo 11 landing site');
await frames(2);
await press('right', 'trigger');
await waitTravel();
await page.waitForFunction(() => window.app.terrain.owner?.name === 'Moon', null, { timeout: 120000 }).catch(() => undefined);
st = await page.evaluate(() => {
  const a = window.app;
  const l = a.findByName('Apollo 11 landing site');
  return { terrain: a.terrain.owner?.name ?? null, km: l.upos.sub(a.rig.upos).length() / 1e3 };
});
check('Places tab flies to the Apollo 11 site over real terrain', st.terrain === 'Moon' && st.km > 2 && st.km < 8, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 'vr8b-apollo-11.png'), timeout: 180000 });

// 9. Exit VR (as the headset's system menu would): desktop rendering resumes with an un-rotated camera
await page.evaluate(() => window.app.vr.session.end());
await page.waitForFunction(() => !window.app.vr.active && !window.app.renderer.presenting, null, { timeout: 10000 });
await frames(5);
st = await page.evaluate(() => {
  const a = window.app; const c = a.renderer.camera;
  return { pos: c.position.length(), qw: Math.abs(c.quaternion.w), xr: a.view.xr, button: document.querySelector('#vr-button').textContent };
});
check('desktop rendering resumes after exit', !st.xr && st.button === 'ENTER VR');
check('camera pose reset to the dolly', st.pos === 0 && st.qw === 1, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 'vr7-after-exit.png'), timeout: 180000 });

check('no console errors', errors.length === 0, errors.slice(0, 5).join(' | '));
await browser.close();
const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} VR checks passed`);
process.exit(failed.length ? 1 : 0);
