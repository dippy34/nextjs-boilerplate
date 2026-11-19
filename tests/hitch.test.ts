import { describe, expect, it } from 'vitest';
import { HitchMonitor } from '../src/core/hitch';

describe('hitch detector', () => {
  /** a monitor on a fake clock; `frame` runs one frame whose subsystems take the given ms */
  const make = () => {
    let t = 0;
    const m = new HitchMonitor(() => t);
    m.budgetMs = 1000 / 72;
    const frame = (laps: [string, number][], after = 0, programs = 0, textures = 0) => {
      m.begin();
      for (const [name, ms] of laps) { t += ms; m.lap(name); }
      m.end(programs, textures);
      t += after;
    };
    return { m, frame };
  };

  it('ignores frames inside twice the budget', () => {
    const { m, frame } = make();
    for (let i = 0; i < 100; i++) frame([['bodies', 3], ['stars', 4]], 6);
    frame([], 0);
    expect(m.count).toBe(0);
  });

  it('records a late frame with its subsystems, costliest first, and the compiles in it', () => {
    const { m, frame } = make();
    frame([['bodies', 2]], 5, 10, 20);   // (first counts are the baseline)
    frame([['bodies', 2], ['stars', 25], ['labels', 1]], 4, 13, 21);
    frame([], 0);
    expect(m.count).toBe(1);
    const r = m.records[0];
    expect(r.frameMs).toBeCloseTo(32);
    expect(r.jsMs).toBeCloseTo(28);
    expect(r.sections[0]).toEqual(['stars', 25]);
    expect(r.sections.find(([n]) => n === '(outside JS)')?.[1]).toBeCloseTo(4);
    expect(r.programs).toBe(3);
    expect(r.textures).toBe(1);
    expect(m.offenders()).toEqual([['stars', 1]]);
  });

  it('blames time outside the JS when the laps are cheap (GPU, GC)', () => {
    const { m, frame } = make();
    frame([['bodies', 1]], 40);
    frame([], 0);
    expect(m.records[0].sections[0][0]).toBe('(outside JS)');
  });

  it('keeps running averages per subsystem and tells listeners', () => {
    const { m, frame } = make();
    const seen: number[] = [];
    m.onHitch((r) => seen.push(r.frameMs));
    for (let i = 0; i < 300; i++) frame([['bodies', 1], ['stars', 5]], 2);
    frame([['stars', 50]], 0);
    frame([], 0);
    const s = m.summary();
    expect(s[0].name).toBe('stars');
    expect(s[0].avg).toBeGreaterThan(4);
    expect(s[0].max).toBeGreaterThan(40);
    expect(seen.length).toBe(1);
  });

  it('names the programs compiled after warm-up', () => {
    let t = 0;
    const m = new HitchMonitor(() => t);
    const progs: { name: string }[] = [{ name: 'Sky' }];
    const frame = (ms = 5) => { m.begin(); t += ms; m.end(progs, 0); t += 5; };
    frame();
    progs.push({ name: 'Planet' });
    frame();                       // compiled during warm-up: not late
    m.markWarm();
    frame();
    progs.push({ name: 'GalaxyInterior' });
    frame(100);                    // (the compile makes this frame late)
    frame();
    expect(m.lateCompiles.map((c) => c.name)).toEqual(['GalaxyInterior']);
    expect(m.records.at(-1)?.compiled).toEqual(['GalaxyInterior']);
  });
});
