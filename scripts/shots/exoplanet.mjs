// Generated planet surfaces from orbit (and optionally from the ground), for looking at them.
//   PL  comma list of planet names, or `type:<planet type>[#n]` for the n-th generated planet of that
//       type around the bright stars below (lava hot desert terran ocean ice subneptune icegiant giant hotgiant)
//   KS  distances in planet radii from the centre (camera on the day side, across the light);
//       `g` = land 2.5 km up with the star 20° above the horizon
//   EL  camera elevation above the planet's orbital plane (degrees; rings)
//   SUN angle (degrees) between the view direction and the star direction seen from the planet (default 56)
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4174/';
const out = process.argv[3] ?? '/tmp/claude-0/exo';
const names = (process.env.PL ?? 'Proxima Cen b,TRAPPIST-1 e,Kepler-22 b,51 Peg b').split(',');
const ks = (process.env.KS ?? '2.2').split(',');
const sunAng = Number(process.env.SUN ?? 56);
const elev = Number(process.env.EL ?? 0);   // camera elevation above the system plane (degrees)
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 1280), height: Number(process.env.H ?? 720) } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const frames = async (n) => { const f = await page.evaluate(() => window.app.frameCount); await page.waitForFunction((x) => window.app.frameCount > x, f + n, { timeout: 240000 }); };
await page.goto(`${base}?time=2026-10-01T12:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.renderer && window.app.frameCount > 10, null, { timeout: 180000 });
const STARS = ['Rigil Kentaurus', 'Sirius', 'Procyon', 'Altair', 'Vega', 'Tau Ceti', 'Epsilon Eridani', 'Fomalhaut', 'Pollux',
  'Arcturus', 'Capella', 'Castor', 'Denebola', 'Alderamin', 'Mizar', 'Caph', 'Megrez', 'Alioth', 'Eltanin', 'Mirach', 'Hamal',
  'Achernar', 'Regulus', 'Spica', 'Aldebaran', 'Deneb', 'Polaris', 'Kochab', 'Schedar', 'Dubhe', 'Merak', 'Phecda', 'Alkaid',
  'Betelgeuse', 'Rigel', 'Bellatrix', 'Alnilam', 'Mintaka', 'Saiph', 'Antares', 'Shaula', 'Canopus', 'Mirfak', 'Algol', 'Alphard',
  'Rasalhague', 'Sadr', 'Enif', 'Alpheratz', 'Diphda', 'Menkar', 'Algenib', 'Scheat', 'Markab', 'Ankaa', 'Hadar', 'Acrux', 'Mimosa',
  'Gacrux', 'Peacock', 'Alnair', 'Atria', 'Avior', 'Wezen', 'Adhara', 'Naos', 'Suhail', 'Miaplacidus', 'Kaus Australis', 'Nunki'];
for (const n0 of names) {
  const name = await page.evaluate(([n, stars]) => {
    window.__exo = window.__exo ?? {};
    if (!n.startsWith('type:')) { window.__exo[n] = window.app.findByName(n); return n; }
    // type:<type>[<K or >K][#n]: the n-th generated planet of that type (and temperature)
    const m = /^([a-z]+)([<>]\d+)?(?:#(\d+))?$/.exec(n.slice(5));
    const [, t, tc, idx] = m;
    let k = Number(idx ?? 0);
    const names = [...stars, ...window.app.named.list.slice(0, 3000).map((s) => s.names[0])];
    for (const sn of names) {
      const s = window.app.findByName(sn);
      const sys = s && s.kind === 'star' ? window.app.systems.of(s) : null;
      for (const p of sys?.planets ?? []) {
        if (p.spec.type !== t || p.spec.real) continue;
        if (tc && (tc[0] === '<' ? p.spec.teqK >= Number(tc.slice(1)) : p.spec.teqK <= Number(tc.slice(1)))) continue;
        if (k-- === 0) { window.__exo[p.name] = p; return p.name; }
      }
    }
    return null;
  }, [n0, STARS]);
  if (!name) { console.log('no planet for', n0); continue; }
  for (const k of ks) {
    const place = () => page.evaluate(([n, k, sunAng, elev]) => {
      const a = window.app; const f = window.app.findByName(n); const o = f?.system ? f : window.__exo[n]; if (!o?.system) return 'not found';
      window.__exo[n] = o;
      a.select(o);
      for (let i = 0; i < 3; i++) o.system?.update(a.clock.jdTdb);
      const host = o.system.host;
      const ts = host.upos.sub(o.upos).normalize();
      const up = Math.abs(ts.z) < 0.9 ? ts.clone().set(0, 0, 1) : ts.clone().set(1, 0, 0);
      const sd = ts.clone().cross(up).normalize();
      if (k === 'g') {
        const el = (20 * Math.PI) / 180;
        const u = ts.clone().multiplyScalar(Math.sin(el)).addScaledVector(sd, Math.cos(el)).normalize();
        a.rig.upos.copy(o.upos).addVec(u, o.radius + 2500);
        const fwd = sd.clone().cross(u).normalize();
        a.rig.lookAt(fwd.multiplyScalar(Math.cos(0.1)).addScaledVector(u, -Math.sin(0.1)).normalize(), u);
      } else {
        const th = (sunAng * Math.PI) / 180;
        const v = ts.clone().multiplyScalar(Math.cos(th)).addScaledVector(sd, Math.sin(th)).normalize();
        const el = (elev * Math.PI) / 180;
        v.multiplyScalar(Math.cos(el)).addScaledVector(o.system.n, Math.sin(el)).normalize();
        a.rig.upos.copy(o.upos).addVec(v, o.radius * Number(k));
        a.rig.lookAt(v.clone().negate());
      }
      return `${o.spec.type} R=${(o.radius / 6.371e6).toFixed(2)} teq=${Math.round(o.spec.teqK)} rings=${o.spec.rings}`;
    }, [name, k, sunAng, elev]);
    let info = await place();
    // (the first visit to a system may rebuild its planets: place the camera again)
    // (the host star's position is refined once its catalogue entry loads)
    await frames(15);
    info = await place();
    if (info === 'not found') { console.log('not found', name); break; }
    if (k === 'g') await page.waitForFunction(() => window.app.terrain.owner === window.app.selection, null, { timeout: 120000 }).catch(() => undefined);
    await frames(k === 'g' ? 12 : 6);
    // let the eye adapt (the exposure follows the view at a few frames per second here)
    for (let i = 0, last = 0; i < 40; i++) {
      const x = await page.evaluate(() => window.app.bodies.surfaceExposure.value);
      if (i > 0 && Math.abs(Math.log(x / last)) < 0.02) break;
      last = x;
      await frames(3);
    }
    await page.screenshot({ path: `${out}-${name.replace(/\s+/g, '_')}-${k}.png`, timeout: 240000 });
    console.log('shot', name, k, info);
  }
}
console.log('errors', errors.length, errors.slice(0, 3).join(' | '));
await browser.close();
