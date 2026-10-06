// Main-thread cost by subsystem (src/core/hitch.ts) in software GL: for each scenario (sitting
// still, autopilot trips across scales), resets the hitch detector, runs it, then prints the
// per-subsystem averages and maxima (ms of JS per frame), how often each subsystem was the
// costliest part of a late frame, and the frames that compiled shaders or created textures.
// SwiftShader is far too slow for absolute numbers: read it for the relative offenders.
// Usage: node scripts/shots/hitch.mjs [baseUrl] [outFile.json] [scenario...]
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const base = process.argv[2] ?? 'http://127.0.0.1:4173/';
const outFile = process.argv[3] ?? 'out-hitch.json';
const only = new Set(process.argv.slice(4));
const T = '2026-10-01T20:00:00Z';

const SCENARIOS = [
  { name: 'earth-idle', query: `time=${T}&target=Earth&dist=3`, frames: 40 },
  { name: 'to-jupiter', query: `time=${T}&target=Earth&dist=3`, go: 'Jupiter', frames: 80 },
  { name: 'to-saturn-rings', query: `time=${T}&target=Jupiter&dist=3`, go: 'Saturn', frames: 80 },
  { name: 'to-betelgeuse', query: `time=${T}&target=Sun&dist=50`, go: 'Betelgeuse', frames: 100 },
  { name: 'to-andromeda', query: `time=${T}&target=Sun&dist=50`, go: 'Andromeda Galaxy', frames: 100 },
  { name: 'to-sgr-a', query: `time=${T}&target=Sun&dist=50`, go: 'Sagittarius A*', frames: 100 },
];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = [];
for (const sc of SCENARIOS) {
  if (only.size && !only.has(sc.name)) continue;
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.on('pageerror', (e) => console.log('pageerror', String(e).slice(0, 300)));
  await page.goto(`${base}?${sc.query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.app && window.app.frameCount > 15, null, { timeout: 180000 });
  await page.evaluate((go) => {
    const a = window.app;
    a.hitch.reset();
    a.hitch.keep = 1000;
    if (go) { const o = a.findByName(go); a.select(o); a.goTo(o); }
  }, sc.go ?? null);
  const f0 = await page.evaluate(() => window.app.frameCount);
  await page.waitForFunction((n) => window.app.frameCount > n, f0 + sc.frames, { timeout: 600000 });
  const r = await page.evaluate(() => {
    const h = window.app.hitch;
    const sum = h.summary().map((s) => ({ name: s.name, avg: +s.avg.toFixed(2), max: +s.max.toFixed(2) }));
    const compiles = h.records.filter((x) => x.programs || x.textures).map((x) => ({ frameMs: x.frameMs, programs: x.programs, compiled: x.compiled, textures: x.textures, top: x.sections.slice(0, 3) }));
    // the worst JS frames (the main thread's own stalls; software GL makes every frame "late")
    const worst = [...h.records].sort((a, b) => b.jsMs - a.jsMs).slice(0, 5).map((x) => ({ jsMs: x.jsMs, top: x.sections.filter(([n]) => n !== '(outside JS)').slice(0, 4) }));
    return { lateCompiles: h.lateCompiles.slice(0, 40), frames: h.frames, hitches: h.count, offenders: h.offenders(), summary: sum, compiles: compiles.slice(0, 20), worst };
  });
  report.push({ scenario: sc.name, ...r });
  console.log(`\n== ${sc.name}: ${r.hitches} late of ${r.frames} frames`);
  console.log('  avg/max ms:', r.summary.slice(0, 10).map((s) => `${s.name} ${s.avg}/${s.max}`).join(', '));
  console.log('  costliest-in-late-frame:', r.offenders.slice(0, 6).map(([n, c]) => `${n}×${c}`).join(', '));
  for (const w of r.worst) console.log(`  worst JS ${w.jsMs} ms:`, w.top.map(([n, ms]) => `${n} ${ms}`).join(', '));
  if (r.compiles.length) console.log('  frames with compiles/uploads:', r.compiles.slice(0, 6).map((c) => `${c.frameMs}ms p${c.programs}${c.compiled?.length ? ' ' + c.compiled.join('+') : ''} t${c.textures} [${c.top.map(([n, ms]) => `${n} ${ms}`).join(', ')}]`).join(' | '));
  if (r.lateCompiles.length) console.log('  compiled after warm-up:', r.lateCompiles.map((c) => `${c.name}@${c.frame}`).join(', '));
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/hitch-${sc.name}.png`, timeout: 180000 });
  await page.close();
}
fs.writeFileSync(outFile, JSON.stringify(report, null, 1));
await browser.close();
