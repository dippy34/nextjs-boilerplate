import { describe, expect, it } from 'vitest';
import { droppedFrames, encode, estimateHz, median, onePercentLow, type BenchResult } from '../src/perf/benchCode';
import { SCENES } from '../src/perf/Bench';
import { LAYERS } from '../src/perf/Perf';
// @ts-expect-error: plain JS module (the team's decoder)
import { decode, format } from '../scripts/bench-decode.mjs';

function sample(): BenchResult {
  return {
    v: 1, at: '2026-10-05T12:34',
    ua: 'Linux; Android 14; Quest 3) AppleWebKit/537.36 OculusBrowser/41.2.0.7.47 SamsungBrowser/4.0 Chrome/138.0.7204.170 VR Safari/537.36',
    gl: 'Adreno (TM) 740', xr: [1680, 1760], px: [1920, 1080], hz: 72, gq: 1, hold: 8,
    s: SCENES.map((sc, i) => ({
      id: sc.id, n: 576, med: 13.888 + i, low: 41.66 + i * 3, drop: 12 * i, dc: 412.5 + i * 37, tri: 1234.56 + i, gpu: i % 3 ? 11.23 : -1,
      cpu: 6.66, heap: 187.4, q: i % 2 ? '1-3' : '0', top: [['render', 3.33], ['bodies', 1.27], ['terrain', 0.88], ['stars', 0.41]],
    })),
  };
}

describe('benchmark stats', () => {
  it('median, 1% low, drops, refresh', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    const xs = [...Array(99).fill(10), 100];
    expect(onePercentLow(xs)).toBe(100);
    expect(droppedFrames([16.7, 33.4, 50, 16.6], 1000 / 60)).toBe(3);
    expect(estimateHz(Array(100).fill(1000 / 72))).toBe(72);
    expect(estimateHz([...Array(50).fill(1000 / 90), ...Array(50).fill(40)])).toBe(90);
  });
});

describe('benchmark code', () => {
  it('round-trips through the decoder and stays short', async () => {
    const r = sample();
    const code = await encode(r);
    expect(code.startsWith('SB1z.')).toBe(true);
    expect(code.length).toBeLessThan(1500);
    expect(/^[A-Za-z0-9._-]+$/.test(code)).toBe(true);
    const d = decode(code);
    expect(d.ua).toBe(r.ua);
    expect(d.xr).toEqual([1680, 1760]);
    expect(d.s.length).toBe(SCENES.length);
    expect(d.s[1].med).toBe(14.9);
    expect(d.s[1].gpu).toBe(11.2);
    expect(d.s[0].gpu).toBe(-1);
    expect(d.s[3].q).toBe('1-3');
    expect(d.s[2].top[0]).toEqual(['render', 3.3]);
    expect(format(d)).toContain('cygx1');
  });
  it('has the ten scenes of the route and known layers', () => {
    expect(SCENES.map((s) => s.id)).toEqual(['orbit', 'surface', 'rings', 'jupiter', 'orion', 'cygx1', 'm31', 'mw', 'god', 'cockpit']);
    expect(new Set(LAYERS).size).toBe(LAYERS.length);
  });
});
