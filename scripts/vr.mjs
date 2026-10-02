// Drives the app inside an emulated Meta Quest 3 (IWER, Meta's WebXR emulator) in headless Chromium:
// enters immersive VR, flies, turns, selects with the controller ray, uses autopilot, exits.
// Usage: node scripts/vr.mjs [baseUrl] [outDir]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const outDir = process.argv[3] ?? 'screenshots';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  ...(process.env.TRUSTED_SPKI ? [`--ignore-certificate-errors-spki-list=${process.env.TRUSTED_SPKI}`] : [])] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript({ path: 'node_modules/iwer/build/iwer.min.js' });
await page.addInitScript(() => {
  const d = new IWER.XRDevice(IWER.metaQuest3);
  d.stereoEnabled = true; // two eyes, as on a real headset
  d.installRuntime({ forceInstall: true });
  window.__xrDevice = d;
});
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`); };
const frames = (n) => page.evaluate((k) => new Promise((res) => {
  const start = window.app.frameCount;
  const t = setInterval(() => { if (window.app.frameCount >= start + k) { clearInterval(t); res(); } }, 10);
}), n);
// Point an emulated controller ('controllers') or tracked hand ('hands') at a named body.
const aim = (kind, side, name) => page.evaluate(([k, h, nm]) => {
  const a = window.app;
  const body = a.system.bodies.find((b) => b.name === nm);
  const d = body.upos.sub(a.rig.upos).normalize().applyQuaternion(a.renderer.rig.quaternion.clone().invert());
  // shortest-arc quaternion taking the pointing axis (0,0,-1) onto d (in the dolly frame)
  const w = 1 - d.z; const n = Math.hypot(d.y, d.x, w);
  window.__xrDevice[k][h].quaternion.set(d.y / n, -d.x / n, 0, w / n);
}, [kind, side, name]);
const press = async (hand, id, n = 4) => {
  await page.evaluate(([h, b]) => window.__xrDevice.controllers[h].updateButtonValue(b, 1), [hand, id]);
  await frames(n);
  await page.evaluate(([h, b]) => window.__xrDevice.controllers[h].updateButtonValue(b, 0), [hand, id]);
  await frames(n);
};

await page.goto(`${base}?time=2026-10-01T20:00:00Z&target=Saturn&dist=8&az=30&el=15&paused=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 60000 });

// 1. Enter VR
await page.waitForSelector('#vr-button', { state: 'visible', timeout: 10000 });
check('Enter VR button shown when a headset is available', true);
await page.click('#vr-button');
await page.waitForFunction(() => window.app.vr.active && window.app.renderer.presenting, null, { timeout: 20000 });
const t0 = Date.now();
await frames(10); // frame-counted waits: software rendering in CI can run at ~1 fps
let st = await page.evaluate(() => {
  const a = window.app; const v = a.view;
  return { xr: v.xr, fov: v.fovY, w: v.width, h: v.height, labels: a.vr.labelsGroup.children.filter((s) => s.visible).length, button: document.querySelector('#vr-button').textContent };
});
check('immersive session renders frames', true, `10 frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
check('view comes from the headset eye', st.xr && st.fov > 60 && st.fov < 120, `fovY=${st.fov.toFixed(1)}° ${st.w}×${st.h}`);
check('3D labels placed in the scene', st.labels > 0, `${st.labels} labels`);
check('button switches to EXIT VR', st.button === 'EXIT VR');
await page.screenshot({ path: path.join(outDir, 'vr1-saturn-stereo.png') });

// 2. Select Saturn by pointing the right controller at it and pulling the trigger
await page.evaluate(() => window.app.select(null));
await aim('controllers', 'right', 'Saturn');
await frames(5);
await press('right', 'trigger');
st = await page.evaluate(() => window.app.selection?.name ?? null);
check('right trigger selects what the ray points at', st === 'Saturn', `selected ${st}`);

// 3. Left stick flies along the left controller
const p0 = await page.evaluate(() => window.app.rig.upos.toVector3().toArray());
await page.evaluate(() => window.__xrDevice.controllers.left.updateAxes('thumbstick', 0, -1));
await frames(15);
await page.evaluate(() => window.__xrDevice.controllers.left.updateAxes('thumbstick', 0, 0));
await frames(3);
const p1 = await page.evaluate(() => window.app.rig.upos.toVector3().toArray());
const moved = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
check('left stick flies', moved > 1e3, `moved ${(moved / 1e3).toFixed(0)} km`);

// 4. Right stick snap-turns 30°
const q0 = await page.evaluate(() => window.app.rig.quat.toArray());
await page.evaluate(() => window.__xrDevice.controllers.right.updateAxes('thumbstick', 1, 0));
await frames(6);
await page.evaluate(() => window.__xrDevice.controllers.right.updateAxes('thumbstick', 0, 0));
await frames(4);
const q1 = await page.evaluate(() => window.app.rig.quat.toArray());
const dot = Math.abs(q0[0] * q1[0] + q0[1] * q1[1] + q0[2] * q1[2] + q0[3] * q1[3]);
const turned = (2 * Math.acos(Math.min(1, dot)) * 180) / Math.PI;
check('right stick snap-turns', Math.abs(turned - 30) < 1, `${turned.toFixed(1)}°`);

// 5. X/Y change time rate, left trigger pauses/resumes
const r0 = await page.evaluate(() => window.app.clock.rate);
await press('left', 'y-button');
const r1 = await page.evaluate(() => window.app.clock.rate);
check('Y speeds up time', r1 > r0, `${r0} → ${r1}`);
const paused0 = await page.evaluate(() => window.app.clock.paused);
await press('left', 'trigger');
const paused1 = await page.evaluate(() => window.app.clock.paused);
check('left trigger toggles pause', paused0 !== paused1, `${paused0} → ${paused1}`);

// 6. A = go to selection
await press('right', 'a-button');
st = await page.evaluate(() => !!window.app.rig.autopilot);
check('A starts autopilot to the selection', st);
await page.waitForFunction(() => !window.app.rig.autopilot, null, { timeout: 300000 });
st = await page.evaluate(() => { const a = window.app; const s = a.system.bodies.find((b) => b.name === 'Saturn'); return s.upos.sub(a.rig.upos).length() / s.radius; });
check('autopilot arrives at Saturn in VR', st > 1.5 && st < 8, `${st.toFixed(2)} R`);
await frames(3);
await page.screenshot({ path: path.join(outDir, 'vr2-arrived.png') });

// 7. Hand tracking (no controllers): pinch selects, pinching the selection again flies there,
//    pinching empty sky stops the autopilot
const pinch = async () => {
  await page.evaluate(() => window.__xrDevice.hands.right.updatePinchValue(1));
  await frames(4);
  await page.evaluate(() => window.__xrDevice.hands.right.updatePinchValue(0));
  await frames(4);
};
await page.evaluate(() => { window.__xrDevice.primaryInputMode = 'hand'; window.app.select(null); });
await frames(6);
await aim('hands', 'right', 'Titan');
await frames(4);
await pinch();
st = await page.evaluate(() => window.app.selection?.name ?? null);
check('hand pinch selects', st === 'Titan', `selected ${st}`);
await pinch();
st = await page.evaluate(() => !!window.app.rig.autopilot);
check('pinching the selection again starts the autopilot', st);
await page.evaluate(() => { const q = window.__xrDevice.hands.right.quaternion; q.set(0.7071, 0, 0, 0.7071); }); // straight up
await frames(3);
await pinch();
st = await page.evaluate(() => ({ ap: !!window.app.rig.autopilot, sel: window.app.selection?.name ?? null }));
check('pinching empty sky stops the autopilot', !st.ap, JSON.stringify(st));
await page.evaluate(() => { window.__xrDevice.primaryInputMode = 'controller'; });

// 8. Exit VR (as the headset's system menu would): desktop rendering resumes with an un-rotated camera
await page.evaluate(() => window.app.vr.session.end());
await page.waitForFunction(() => !window.app.vr.active && !window.app.renderer.presenting, null, { timeout: 10000 });
await frames(5);
st = await page.evaluate(() => {
  const a = window.app; const c = a.renderer.camera;
  return { pos: c.position.length(), qw: Math.abs(c.quaternion.w), xr: a.view.xr, button: document.querySelector('#vr-button').textContent };
});
check('desktop rendering resumes after exit', !st.xr && st.button === 'ENTER VR');
check('camera pose reset to the dolly', st.pos === 0 && st.qw === 1, JSON.stringify(st));
await page.screenshot({ path: path.join(outDir, 'vr3-after-exit.png') });

check('no console errors', errors.length === 0, errors.slice(0, 5).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} VR checks passed`);
process.exit(failed.length ? 1 : 0);
