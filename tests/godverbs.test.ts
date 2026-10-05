import { describe, expect, it } from 'vitest';
import {
  changeWord, createCaption, deleteCaption, factor, Hints, massCaption, orbitOf, pushCaption, pushVector, reverseCaption, sizeCaption,
} from '../src/god/verbs';

const GM_SUN = 1.32712440041e20, GM_EARTH = 3.986004418e14, AU = 1.495978707e11;
const earth = { name: 'Earth', kind: 'planet' as const, gm: GM_EARTH, parentGm: GM_SUN, parentName: 'Sun', satellites: ['Moon'] };

describe('god verbs: captions', () => {
  it('words a duration ratio', () => {
    expect(changeWord(1 / Math.sqrt(2))).toBe('29% shorter');
    expect(changeWord(Math.sqrt(2))).toBe('41% longer');
    expect(changeWord(1.001)).toBe('about the same');
    expect(changeWord(2.83)).toBe('2.8× longer');
    expect(factor(0.25)).toBe('¼');
    expect(factor(2)).toBe('2×');
  });
  it('2× mass: the Moon\'s month is 29% shorter (Kepler III)', () => {
    expect(massCaption(earth, 2)).toBe('2× mass → Moon\'s month is 29% shorter (Kepler III: P ∝ 1/√M)');
    expect(massCaption({ ...earth, satellites: [] }, 2)).toMatch(/surface gravity 2×.*year barely changes: Sun is 333,000× heavier/);
    expect(massCaption({ name: 'Sun', kind: 'star', gm: GM_SUN, satellites: ['Mercury', 'Venus'] }, 0.5)).toMatch(/planets' years are 41% longer/);
    expect(massCaption({ name: 'BH', kind: 'hole', gm: GM_SUN }, 2)).toMatch(/event horizon is 2× as wide/);
  });
  it('a planet as heavy as its star changes its own year', () => {
    expect(massCaption({ ...earth, satellites: [], gm: GM_SUN * 0.1 }, 2)).toMatch(/its own year is 4% shorter/);
  });
  it('2× radius, same mass: g ¼, density ⅛', () => {
    expect(sizeCaption(earth, 2)).toMatch(/surface gravity ¼, density ⅛/);
    expect(sizeCaption({ ...earth, kind: 'hole' }, 2)).toMatch(/set by its mass/);
  });
  it('vis-viva: Earth on a circular orbit, pushed forward 20 %', () => {
    const vc = Math.sqrt(GM_SUN / AU);
    const o = orbitOf([AU, 0, 0], [0, vc, 0], GM_SUN);
    expect(o.bound).toBe(true);
    expect(o.e).toBeLessThan(1e-9);
    expect(o.period / 86400).toBeCloseTo(365.25, 0);
    const v1: [number, number, number] = [0, vc * 1.2, 0];
    const p = orbitOf([AU, 0, 0], v1, GM_SUN);
    expect(p.apo / AU).toBeCloseTo(1.2 ** 2 / (2 - 1.2 ** 2), 3); // 2.57 AU
    expect(pushCaption({ ...earth, gm: 0 }, [AU, 0, 0], [0, vc, 0], v1, 'forward')).toMatch(/swings out to 2.6 AU, and its year is 2.4× longer/);
    expect(pushCaption({ ...earth, gm: 0 }, [AU, 0, 0], [0, vc, 0], [0, vc * 1.5, 0], 'forward')).toMatch(/leaves Sun forever/);
    expect(pushCaption({ ...earth, gm: 0 }, [AU, 0, 0], [0, vc, 0], [0, vc * 0.8, 0], 'back')).toMatch(/dips in to 0.47 AU/);
  });
  it('push directions follow the orbit', () => {
    expect(pushVector('forward', [1, 0, 0], [0, 2, 0])).toEqual([0, 1, 0]);
    expect(pushVector('in', [3, 0, 0], [0, 2, 0])).toEqual([-1, -0, -0]);
    expect(pushVector('up', [1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
  });
  it('reverse, delete, create', () => {
    expect(reverseCaption(earth)).toMatch(/backwards \(retrograde\)\. Same size orbit, same year/);
    expect(deleteCaption(earth)).toBe('Earth is gone → Moon now orbits Sun');
    expect(deleteCaption({ name: 'Sun', kind: 'star', gm: GM_SUN, satellites: ['Earth', 'Mars'] })).toMatch(/fly off/);
    expect(createCaption('Black hole', 'Earth', 0.3 * AU)).toMatch(/0.3 AU from Earth/);
  });
});

describe('god verbs: first-time guide', () => {
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };
  it('ticks steps off, remembers them, and can be skipped', () => {
    const store = mem();
    const h = new Hints(store);
    expect(h.visible).toBe(true);
    expect(h.next?.id).toBe('heavier');
    expect(h.note({ verb: 'heavier' })).toBe(true);
    expect(h.note({ verb: 'create', kind: 'planet' })).toBe(false);
    h.note({ verb: 'create', kind: 'hole' });
    expect(h.next?.id).toBe('reverse');
    const again = new Hints(store);
    expect([...again.done].sort()).toEqual(['heavier', 'hole']);
    again.skip();
    expect(new Hints(store).visible).toBe(false);
  });
});
