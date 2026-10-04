import { describe, expect, it } from 'vitest';
import { Governor, QUALITY } from '../src/render/Quality';

/** run `n` frames of `dt` ms from time `t`; returns the end time */
const run = (g: Governor, t: number, n: number, dt: number, budget = 1000 / 60): number => {
  for (let i = 0; i < n; i++) { t += dt; g.update(t, budget); }
  return t;
};

describe('quality governor', () => {
  it('holds full quality at frame rate, steps down when frames are missed, back up after a clean run', () => {
    QUALITY.level = 0;
    const g = new Governor(true);
    let t = run(g, 0, 600, 16.7);
    expect(QUALITY.level).toBe(0);
    // 30 fps on a 60 Hz budget: one level down, not more than one a second
    t = run(g, t, 35, 33.4);   // (a fifth of the window missed: about 10 frames)
    expect(QUALITY.level).toBe(1);
    t = run(g, t, 30, 33.4);   // a fresh window and 1 s later: another
    expect(QUALITY.level).toBe(2);
    // smooth again: one level up after 5 s without a miss
    t = run(g, t, 200, 16.7);
    expect(QUALITY.level).toBe(2);
    t = run(g, t, 150, 16.7);
    expect(QUALITY.level).toBe(1);
  });

  it('does not oscillate: a step up undone at once doubles the wait before the next', () => {
    QUALITY.level = 1;
    const g = new Governor(true);
    let t = run(g, 0, 320, 16.7);          // 5.3 s clean: up to 0
    expect(QUALITY.level).toBe(0);
    t = run(g, t, 20, 33.4);               // and straight back down
    expect(QUALITY.level).toBe(1);
    t = run(g, t, 320, 16.7);              // 5.3 s clean is no longer enough (wait now 10 s)
    expect(QUALITY.level).toBe(1);
    t = run(g, t, 330, 16.7);
    expect(QUALITY.level).toBe(0);
  });

  it('ignores pauses and does nothing when off', () => {
    QUALITY.level = 0;
    const g = new Governor(false);
    run(g, 0, 300, 50);
    expect(QUALITY.level).toBe(0);
    const h = new Governor(true);
    let t = run(h, 0, 100, 16.7);
    t += 5000; h.update(t, 1000 / 60);      // a paused tab
    run(h, t, 100, 16.7);
    expect(QUALITY.level).toBe(0);
  });
});
