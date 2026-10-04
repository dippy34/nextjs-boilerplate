import { chromium } from '@playwright/test';
const base = process.argv[2];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', e=>console.log('ERR', String(e)));
const frame1 = async () => { const f = await page.evaluate(() => window.app.frameCount); const t=Date.now(); await page.waitForFunction((x) => window.app.frameCount > x, f, { timeout: 120000 }); return Date.now()-t; };
process.stdout.write('loading\n');
await page.goto(`${base}?time=2026-10-01T20:00:00Z&paused=1&target=Moon&dist=3`, { waitUntil: 'load' });
await page.waitForFunction(() => window.app && window.app.frameCount > 10, null, { timeout: 180000 });
process.stdout.write('loaded\n');
await page.evaluate(() => {
  const a = window.app; const b = a.findByName('Moon'); a.select(b);
  const sun = a.system.sun.upos.sub(b.upos).normalize();
  const side = new (b.upos.sub(a.rig.upos).constructor)(0,0,1).cross(sun).normalize();
  const up = sun.clone().multiplyScalar(Math.sin(0.14)).addScaledVector(side, Math.cos(0.14)).normalize();
  a.rig.upos.copy(b.upos).addVec(up, b.radius + 3000);
  const away = sun.clone().negate().addScaledVector(up, sun.dot(up)).normalize();
  a.rig.lookAt(away.clone().multiplyScalar(Math.cos(0.2)).addScaledVector(up,-Math.sin(0.2)).normalize(), up);
});
for (let i=0;i<25;i++){ const ms=await frame1(); const info=await page.evaluate(()=>window.app.terrain.stats); process.stdout.write(`f${i} ${ms}ms pending=${info.pending} drawn=${info.drawn} lvl=${info.level}\n`); if(i>5&&!info.pending){process.stdout.write('settled\n');break;} }
const g = await page.evaluate(()=>{let n=0,v=0;window.app.terrain.group.traverse(o=>{if(o.isMesh&&o.visible){n++;v+=o.geometry.attributes.position.count;}});return{n,v};});
process.stdout.write('meshes '+JSON.stringify(g)+'\n');
await browser.close();
