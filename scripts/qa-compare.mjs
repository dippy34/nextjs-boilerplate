// Regression gate: compares two playtest runs (scripts/playtest.mjs), baseline vs candidate.
// Writes <outDir>/COMPARE.md: scene status, frame times side by side (flagged when the candidate is
// >30% slower), anomalies new in the candidate, anomalies fixed; plus a side-by-side JPEG
// (baseline left, candidate right) for every screenshot both runs took.
// Usage: node scripts/qa-compare.mjs <baselineDir> <candidateDir> <outDir> [baseLabel] [candLabel]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [baseDir, candDir, outDir, bl = 'baseline', cl = 'candidate'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const load = (d) => JSON.parse(fs.readFileSync(path.join(d, 'report.json'), 'utf8'));
const B = load(baseDir), C = load(candDir);
const key = (a) => `${a.scene} · ${a.kind}`;
const bKeys = new Set(B.anomalies.map(key)), cKeys = new Set(C.anomalies.map(key));
const regress = [];

const lines = [`# Regression gate: ${cl} vs ${bl}`, '', `Baseline: ${B.base} (${B.started})`, `Candidate: ${C.base} (${C.started})`, '',
  'SwiftShader frame times only compare scenes within this machine, not Quest speed.', '', '## Scenes', '', `| scene | ${bl} | ${cl} |`, '|---|---|---|'];
const scenes = [...new Set([...B.scenes, ...C.scenes].map((s) => s.name))];
for (const n of scenes) {
  const b = B.scenes.find((s) => s.name === n), c = C.scenes.find((s) => s.name === n);
  const f = (s) => (s ? (s.ok ? `ok (${s.s} s)` : `**FAILED** ${s.err ?? ''}`) : '—');
  lines.push(`| ${n} | ${f(b)} | ${f(c)} |`);
  if (b?.ok && c && !c.ok) regress.push(`scene ${n} fails: ${c.err}`);
}
lines.push('', '## Frame time (ms, lower is better)', '', `| metric | ${bl} | ${cl} | ratio |`, '|---|---|---|---|');
for (const k of Object.keys(C.metrics).filter((k) => /frameMs/.test(k))) {
  const b = B.metrics[k], c = C.metrics[k];
  const r = b ? c / b : null;
  const bad = r !== null && r > 1.3 && c - b > 50; // frameMs is a median of 3×20 frames (scripts/playtest.mjs)
  if (bad) regress.push(`${k} slower: ${b} -> ${c} ms (x${r.toFixed(2)})`);
  lines.push(`| ${k} | ${b ?? '—'} | ${c} | ${r === null ? '—' : `${bad ? '**' : ''}x${r.toFixed(2)}${bad ? '**' : ''}`} |`);
}
const newA = C.anomalies.filter((a) => !bKeys.has(key(a)));
const fixedA = B.anomalies.filter((a) => !cKeys.has(key(a)));
for (const a of newA) if (a.severity <= 2) regress.push(`new: [${a.severity}] ${key(a)}: ${a.detail.slice(0, 120)}`);
lines.push('', `## New in ${cl} (${newA.length})`, '', ...newA.map((a) => `- [${a.severity}] **${a.scene}** ${a.kind}: ${a.detail}${a.shot ? ` — \`${a.shot}\`` : ''}`));
lines.push('', `## Fixed in ${cl} (${fixedA.length})`, '', ...fixedA.map((a) => `- [${a.severity}] **${a.scene}** ${a.kind}: ${a.detail.slice(0, 160)}`));
lines.push('', `## Still present in both (${C.anomalies.length - newA.length})`, '', ...C.anomalies.filter((a) => bKeys.has(key(a))).map((a) => `- [${a.severity}] **${a.scene}** ${a.kind}: ${a.detail.slice(0, 160)}`));
lines.push('', '## Other metrics', '', '```', ...Object.keys({ ...B.metrics, ...C.metrics }).filter((k) => !/frameMs/.test(k)).map((k) => `${k}\n  ${bl}: ${JSON.stringify(B.metrics[k])}\n  ${cl}: ${JSON.stringify(C.metrics[k])}`), '```');

// side-by-side images
const shots = fs.readdirSync(candDir).filter((f) => /^[dv]\d+[a-z]?-.*\.png$/.test(f) && !/-b\.png$/.test(f) && fs.existsSync(path.join(baseDir, f))).sort();
if (shots.length) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const f of shots) {
    const b64 = (d) => fs.readFileSync(path.join(d, f)).toString('base64');
    const jpg = await page.evaluate(async ([a, b, la, lb]) => {
      const img = async (s) => createImageBitmap(await (await fetch(`data:image/png;base64,${s}`)).blob());
      const [ia, ib] = await Promise.all([img(a), img(b)]);
      const h = 360, wa = Math.round(ia.width * h / ia.height), wb = Math.round(ib.width * h / ib.height);
      const c = document.createElement('canvas'); c.width = wa + wb + 4; c.height = h; const x = c.getContext('2d');
      x.fillStyle = '#f0f'; x.fillRect(0, 0, c.width, h);
      x.drawImage(ia, 0, 0, wa, h); x.drawImage(ib, wa + 4, 0, wb, h);
      x.font = 'bold 16px sans-serif'; x.fillStyle = '#ff0'; x.fillText(la, 8, h - 10); x.fillText(lb, wa + 12, h - 10);
      return c.toDataURL('image/jpeg', 0.72).split(',')[1];
    }, [b64(baseDir), b64(candDir), bl, cl]);
    fs.writeFileSync(path.join(outDir, f.replace(/\.png$/, '.jpg')), Buffer.from(jpg, 'base64'));
  }
  await browser.close();
  lines.push('', '## Side by side', '', ...shots.map((f) => `- ${f.replace(/\.png$/, '')}: \`${f.replace(/\.png$/, '.jpg')}\``));
}
lines.splice(6, 0, '## Verdict', '', regress.length ? `**WORSE: ${regress.length} regression(s)**` : '**Not worse** on these checks', '', ...regress.map((r) => `- ${r}`), '');
fs.writeFileSync(path.join(outDir, 'COMPARE.md'), lines.join('\n'));
console.log(regress.length ? `WORSE (${regress.length}):\n${regress.join('\n')}` : 'not worse');
