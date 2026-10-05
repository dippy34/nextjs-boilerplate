import { describe, expect, it } from 'vitest';
import { meanLum64, strips, UploadQueue } from '../src/render/Uploads';

describe('budgeted texture uploads', () => {
  it('cuts a 4096x2048 map into 4 MB strips covering every row once', () => {
    const s = strips(4096, 2048);
    expect(s.length).toBe(8);
    expect(s[0]).toEqual([0, 256]);
    expect(s.reduce((a, [, n]) => a + n, 0)).toBe(2048);
    // an 8k map: twice the width, half the rows a strip
    expect(strips(8192, 4096).length).toBe(32);
    // small maps are one piece; odd heights end with a short strip
    expect(strips(512, 256).length).toBe(1);
    expect(strips(4096, 300).at(-1)).toEqual([256, 44]);
  });

  it('runs at least one piece a frame and stops when the budget is spent', async () => {
    let t = 0;
    const q = new UploadQueue(() => t);
    q.budgetMs = 3;
    const done: number[] = [];
    const p = q.addAll([0, 1, 2, 3, 4].map((i) => () => { t += 2; done.push(i); }));
    let resolved = false;
    void p.then(() => { resolved = true; });
    q.pump();
    expect(done).toEqual([0, 1]);   // 2 ms, 4 ms: over budget after the second
    q.budgetMs = 0.5;
    q.pump();
    expect(done).toEqual([0, 1, 2]); // (always one, even over budget)
    await Promise.resolve();
    expect(resolved).toBe(false);
    q.budgetMs = 100;
    q.pump();
    await p;
    expect(done).toEqual([0, 1, 2, 3, 4]);
    expect(q.pending).toBe(0);
  });

  it('keeps going after a failed piece', async () => {
    const q = new UploadQueue(() => 0);
    const ran: string[] = [];
    const a = q.add(() => { throw new Error('lost context'); });
    const b = q.add(() => ran.push('b'));
    const warn = console.warn;
    console.warn = () => undefined;
    q.pump();
    console.warn = warn;
    await b;
    expect(ran).toEqual(['b']);
    void a;
  });

  it('measures mean luminance, skipping no-data pixels', () => {
    const d = new Uint8ClampedArray(64 * 32 * 4).fill(255);
    expect(meanLum64(d)).toBeCloseTo(1, 5);
    // the southern half black (unimaged): still white on average
    for (let i = 64 * 16 * 4; i < d.length; i++) d[i] = 0;
    expect(meanLum64(d)).toBeCloseTo(1, 5);
  });
});
