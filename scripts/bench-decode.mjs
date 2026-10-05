#!/usr/bin/env node
// Decodes a benchmark code (the "Run benchmark" result, src/perf/benchCode.ts) into a readable table.
// Usage: node scripts/bench-decode.mjs SB1z.xxxx [--json]     (or pipe the code on stdin)
import zlib from 'node:zlib';

const FIELDS = ['id', 'n', 'med', 'low', 'drop', 'dc', 'tri', 'gpu', 'cpu', 'heap', 'q', 'top'];

/** code -> result object (same shape as BenchResult in src/perf/benchCode.ts) */
export function decode(code) {
  const c = code.trim().replace(/\s+/g, '');
  const m = /^SB1(z?)\.([A-Za-z0-9_-]+)$/.exec(c);
  if (!m) throw new Error('not a benchmark code (expected SB1. or SB1z.)');
  let bytes = Buffer.from(m[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  if (m[1]) bytes = zlib.inflateRawSync(bytes);
  const [v, at, ua, gl, xr, px, hz, gq, hold, s] = JSON.parse(bytes.toString('utf8'));
  return {
    v, at, ua, gl, xr, px, hz, gq, hold,
    s: s.map((row) => Object.fromEntries(FIELDS.map((k, i) => [k, row[i]]))),
  };
}

export function format(r) {
  const fps = (ms) => (ms > 0 ? (1000 / ms).toFixed(0) : '-');
  const lines = [];
  lines.push(`benchmark ${r.at}  ${r.hold}s per scene  refresh ${r.hz} Hz (budget ${(1000 / r.hz).toFixed(1)} ms)`);
  lines.push(`UA: ${r.ua}`);
  lines.push(`GPU: ${r.gl}   ${r.xr ? `XR framebuffer ${r.xr[0]}x${r.xr[1]}` : `canvas ${r.px[0]}x${r.px[1]}`}   GPU timer: ${r.gq ? 'yes' : 'no'}`);
  const head = ['scene', 'med ms', 'fps', '1%low', 'drops', 'cpu ms', 'gpu ms', 'calls', 'ktri', 'heapMB', 'q', 'top CPU layers (ms)'];
  const rows = r.s.map((x) => [x.id, x.med.toFixed(1), fps(x.med), x.low.toFixed(1), `${x.drop}/${x.n}`, x.cpu.toFixed(1),
    x.gpu >= 0 ? x.gpu.toFixed(1) : '-', String(x.dc), x.tri.toFixed(0), x.heap >= 0 ? String(x.heap) : '-', x.q,
    x.top.map(([k, v]) => `${k} ${v}`).join(', ')]);
  const w = head.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)));
  const line = (row) => row.map((c, i) => (i === row.length - 1 ? c : c.padEnd(w[i]))).join('  ');
  lines.push(line(head));
  for (const row of rows) lines.push(line(row));
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  let code = args.find((a) => !a.startsWith('--'));
  if (!code) code = await new Promise((res) => { let d = ''; process.stdin.on('data', (c) => { d += c; }); process.stdin.on('end', () => res(d)); });
  const r = decode(code);
  console.log(json ? JSON.stringify(r, null, 2) : format(r));
}
