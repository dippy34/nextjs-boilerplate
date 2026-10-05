import { chromium } from '@playwright/test';
import { measureDisparity, asymmetricFrusta } from './stereo.mjs';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', (e) => console.log('ERR', String(e)));
await page.addInitScript({ path: 'node_modules/iwer/build/iwer.min.js' });
await page.addInitScript(() => { const d = new IWER.XRDevice(IWER.metaQuest3); d.stereoEnabled = true; d.installRuntime({ forceInstall: true, polyfillLayers: true }); window.__xrDevice = d; });
if (process.env.ASYM) await page.addInitScript(asymmetricFrusta);
const frames = (n) => page.evaluate((k) => new Promise((res) => { const s = window.app.frameCount; const t = setInterval(() => { if (window.app.frameCount >= s + k) { clearInterval(t); res(); } }, 10); }), n);
await page.goto('http://127.0.0.1:5173/?time=2026-10-01T20:00:00Z&target=Earth&dist=2&az=40&el=10&paused=1', { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 120000 });
await page.click('#vr-button');
await page.waitForFunction(() => window.app.vr.active && window.app.renderer.presenting, null, { timeout: 30000 });
await page.waitForFunction(() => window.app.vr.menu.isOpen, null, { timeout: 180000 });
await page.evaluate(() => { window.app.vr.menu.panel.setVisible(false); window.app.vr.labelsGroup.visible = false; });
await frames(4);
console.log('view', await page.evaluate(() => { const c = document.querySelector('canvas'); const x = window.app.renderer.gl.xr.getCamera(); return { W: c.width, H: c.height, pull: 0, far: window.app.view.far, eyes: x.cameras.map((k) => k.position.clone().setFromMatrixPosition(k.matrixWorld).toArray()), P: x.cameras.map((k) => [k.projectionMatrix.elements[8], k.projectionMatrix.elements[0]]) }; }));
await page.screenshot({ path: '/tmp/claude-0/sp/earth.png', timeout: 180000 });
console.log('earth', await measureDisparity(page, `(() => { const b = a.system.bodies.find((x) => x.name === 'Earth'); return b.upos.sub(a.rig.upos); })()`, { half: 60, search: 30 }));

const earthExpr = `(() => { const b = a.system.bodies.find((x) => x.name === 'Earth'); return b.upos.sub(a.rig.upos); })()`;
// force a finite runtime far plane (as a Quest may report): the pull-in path
await page.evaluate(() => { const r = window.app.renderer; const o = r.viewInfo.bind(r); window.__vi = o; r.viewInfo = () => ({ ...o(), far: 2000 }); });
await frames(3);
console.log('pull', await page.evaluate(() => window.app.view.far));
console.log('earth-pull', await measureDisparity(page, earthExpr, { half: 60, search: 30 }));
// rock 5 m ahead, looking away from Earth
await page.evaluate(() => {
  const a = window.app; const T = window.THREE_V || a.renderer.camera.position.constructor;
  const src = a.rocks.meshes[0]; const mat = src.material.clone(); for (const k of ['uPullIn', 'uDepthK', 'uLite']) mat.uniforms[k] = src.material.uniforms[k]; mat.uniforms.uExposure.value = 40; mat.uniforms.uRockColor.value.setRGB(0.5, 0.45, 0.4); const g = src.geometry.clone(); const ar = g.getAttribute('aRock'); if (ar) { ar.setXYZW(0, 0.5, 0.5, 1, 1); ar.needsUpdate = true; } const m = new src.constructor(g, mat, 1);
  m.frustumCulled = false; m.name = 'probe-rock'; m.matrixAutoUpdate = true;
  a.renderer.scene.add(m); window.__rock = m;
  m.setMatrixAt(0, new src.matrix.constructor().makeScale(1.2, 0.9, 1.0)); m.instanceMatrix.needsUpdate = true;
  const e = a.system.bodies.find((x) => x.name === 'Earth').upos.sub(a.rig.upos).normalize();
  a.rig.lookAt(e.clone().negate());
});
await frames(2);
await page.evaluate(() => { const a = window.app; const f = a.renderer.camera.position.clone().set(0, 0.9, -4.92).applyQuaternion(a.renderer.rig.quaternion); window.__rock.position.copy(f); window.__rock.updateMatrixWorld(true); });
await frames(3);
await page.screenshot({ path: '/tmp/claude-0/sp/rock.png', timeout: 180000 });
console.log('rock-pull', await measureDisparity(page, `window.__rock.position.clone()`, { half: 50, search: 40 }));
await page.evaluate(() => { window.app.renderer.viewInfo = window.__vi; });
await frames(3);
console.log('rock', await measureDisparity(page, `window.__rock.position.clone()`, { half: 50, search: 40 }));

console.log('layer', await page.evaluate(() => { const r = window.app.renderer; const L = r.gl.xr.getBaseLayer(); return { ignore: L.ignoreDepthValues, depthTex: !!L.init?.depthFormat, initDepth: L.init?.depthFormat }; }));
await page.evaluate(() => { const a = window.app; window.__rock.visible = false; a.vr.hoverLabel.visible = false; a.vr.hoverRing.visible = false; a.vr.updateHover = () => {}; const h = a.blackHoles.find((x) => x.name === 'Gaia BH1'); a.placeNear(h, 30 * h.radius, 30, 12); a.rig.lookAt(h.upos.sub(a.rig.upos).normalize()); });
await frames(12);
await page.screenshot({ path: `/tmp/claude-0/sp/bh${process.env.ASYM ? 'a' : 's'}.png`, timeout: 180000 });
console.log('bh', await measureDisparity(page, `(() => { const h = a.blackHoles.find((x) => x.name === 'Gaia BH1'); return h.upos.sub(a.rig.upos); })()`, { half: 60, search: 30 }));
await browser.close();
