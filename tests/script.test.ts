import { describe, expect, it } from 'vitest';
import { type Collection, lex, parse, parseExpr, PROPS, ScriptRunner, type ScriptWorld, type Value } from '../src/god/script/Script';

/** A tiny world: bodies with SI properties, recording what was done. */
class FakeWorld implements ScriptWorld {
  bodies = new Map<number, { name: string; kind: string; props: Record<string, number>; parent?: number }>();
  log: string[] = [];
  batches = 0;
  constructor() {
    this.add(10, 'Sun', 'star', { mass: 1.989e30, radius: 6.96e8 });
    this.add(399, 'Earth', 'planet', { mass: 5.972e24, radius: 6.371e6, a: 1.496e11, e: 0.0167, i: 0 }, 10);
    this.add(499, 'Mars', 'planet', { mass: 6.417e23, radius: 3.39e6, a: 2.279e11, e: 0.0934, i: 1.85 }, 10);
    this.add(301, 'Moon', 'moon', { mass: 7.342e22, radius: 1.737e6, a: 3.844e8, e: 0.055, i: 5.1 }, 399);
    this.add(10001, 'Proxima Cen b', 'planet', { mass: 6e24, radius: 7e6, a: 7e9, e: 0.1, i: 0 }, 10);
  }
  add(id: number, name: string, kind: string, props: Record<string, number>, parent?: number): void { this.bodies.set(id, { name, kind, props, parent }); }
  find(name: string): number | null {
    for (const [id, b] of this.bodies) if (b.name.toLowerCase() === name.toLowerCase()) return id;
    return null;
  }
  nameOf(id: number): string { return this.bodies.get(id)!.name; }
  collection(kind: Collection, of: number | null): number[] {
    const out: number[] = [];
    for (const [id, b] of this.bodies) {
      if (kind === 'planets' && b.kind === 'planet') out.push(id);
      if (kind === 'moons' && b.kind === 'moon' && (of === null || b.parent === of)) out.push(id);
      if (kind === 'children' && b.parent === of) out.push(id);
    }
    return out;
  }
  get(id: number, prop: string) {
    const b = this.bodies.get(id)!;
    if (prop === 'P') { const a = b.props.a; const M = this.bodies.get(b.parent!)!.props.mass; return { value: 2 * Math.PI * Math.sqrt(a ** 3 / (6.6743e-11 * M)), math: 'P = 2π√(a³ / GM) = …' }; }
    if (prop === 'g') return { value: 6.6743e-11 * b.props.mass / b.props.radius ** 2, math: 'g = GM / R² = …' };
    const v = b.props[prop];
    return v === undefined ? null : { value: v };
  }
  set(id: number, prop: string, si: number): void { this.bodies.get(id)!.props[prop] = si; this.log.push(`${this.nameOf(id)}.${prop}=${si}`); }
  create(kind: string, name: string | null, params: Record<string, Value | string>, around: number | null): number {
    const id = 20000 + this.bodies.size;
    const p: Record<string, number> = {};
    for (const [k, v] of Object.entries(params)) if (typeof v !== 'string') p[k] = v.v;
    this.add(id, name ?? `${kind} ${id}`, kind, { radius: 1e6, ...p }, around ?? 10);
    this.log.push(`create ${kind} ${name} around ${around} ${JSON.stringify(params)}`);
    return id;
  }
  command(cmd: string, id: number): void { this.log.push(`${cmd} ${this.nameOf(id)}`); }
  simulate(on: boolean): void { this.log.push(`simulate ${on}`); }
  reset(): void { this.log.push('reset'); }
  undo(): boolean { this.log.push('undo'); return true; }
  batch(fn: () => void): void { this.batches++; fn(); }
  show(prop: string, si: number): string { return `${si} ${PROPS[prop].unit}`; }
}

const run = (src: string, w = new FakeWorld()) => ({ w, r: new ScriptRunner(w).run(src) });

describe('console: lexer and parser', () => {
  it('lexes numbers, names, strings, operators', () => {
    const t = lex('create planet "Nova" mass=3e24 kg a*=0.5');
    expect(t.map((x) => x.k)).toEqual(['id', 'id', 'str', 'id', 'op', 'num', 'id', 'id', 'op', 'num', 'end']);
  });
  it('parses the statement kinds', () => {
    expect(parse('Earth.mass = 2 Mearth')[0]).toMatchObject({ t: 'assign', target: 'Earth', prop: 'mass', op: '=' });
    expect(parse('Jupiter.a *= 0.5')[0]).toMatchObject({ t: 'assign', op: '*=', prop: 'a' });
    expect(parse('reverse Moon')[0]).toMatchObject({ t: 'cmd', cmd: 'reverse', target: 'Moon' });
    expect(parse('simulate on')[0]).toMatchObject({ t: 'simulate', on: true });
    expect(parse('for p in planets: p.e = 0')[0]).toMatchObject({ t: 'for', v: 'p', kind: 'planets', body: [{ t: 'assign', target: 'p', prop: 'e' }] });
    expect(parse('for m in moons of Saturn: m.i = 0; m.e = 0')[0]).toMatchObject({ t: 'for', of: 'Saturn', body: [{ prop: 'i' }, { prop: 'e' }] });
    expect(parse('create planet "Nova" mass=3 Mearth density=4.5 g/cm3 a=1.6 AU around Sun')[0]).toMatchObject({ t: 'create', kind: 'planet', name: 'Nova', around: 'Sun' });
    expect(parse('"Proxima Cen b".e = 0.2')[0]).toMatchObject({ t: 'assign', target: 'Proxima Cen b' });
    expect(parse('a = 1; b = 2'.replace(/a|b/g, (x) => (x === 'a' ? 'Earth.e' : 'Mars.e'))).length).toBe(2);
    expect(parse('Earth.ecc = 0.1')[0]).toMatchObject({ prop: 'e' }); // alias
  });
});

describe('console: units and dimensions', () => {
  const val = (src: string) => new ScriptRunner(new FakeWorld()).eval(parseExpr(src));
  it('converts units to SI', () => {
    expect(val('2 Mearth').v).toBeCloseTo(2 * 5.9722e24, -18);
    expect(val('1.6 AU').v).toBeCloseTo(1.6 * 149597870700, -2);
    expect(val('4.5 g/cm3').v).toBeCloseTo(4500, 6);
    expect(val('11.2 km/s').v).toBeCloseTo(11200, 6);
    expect(val('9.81 m/s^2').d).toEqual([0, 1, -2, 0]);
    expect(val('24 h').v).toBe(86400);
    expect(val('1 bar').v).toBe(1e5);
    expect(val('50%').v).toBeCloseTo(0.5, 12);
    expect(val('(1 + 2) km').v).toBe(3000);
  });
  it('does arithmetic with dimensions', () => {
    expect(val('1 AU + 1000 km').v).toBeCloseTo(149597870700 + 1e6, -2);
    const v = val('sqrt(G * 1 Msun / 1 AU)');
    expect(v.v / 1000).toBeCloseTo(29.78, 1);
    expect(v.d).toEqual([0, 1, -1, 0]);
    expect(val('2^10').v).toBe(1024);
    expect(val('-3 km').v).toBe(-3000);
    expect(val('Earth.mass / Moon.mass').v).toBeCloseTo(81.3, 0);
  });
});

describe('console: running against a world', () => {
  it('sets, scales and adds with units, and echoes the formula', () => {
    const { w, r } = run('Earth.mass = 2 Mearth\nMars.a *= 0.5\nMars.i += 10');
    expect(r.ok).toBe(true);
    expect(w.bodies.get(399)!.props.mass).toBeCloseTo(2 * 5.9722e24, -18);
    expect(w.bodies.get(499)!.props.a).toBeCloseTo(2.279e11 / 2, 0);
    expect(w.bodies.get(499)!.props.i).toBeCloseTo(11.85, 9);
    expect(r.lines.some((l) => l.includes('P = 2π√'))).toBe(true);
    expect(r.lines.some((l) => l.includes('g = GM / R²'))).toBe(true);
  });
  it('loops over a collection as one undo step', () => {
    const { w, r } = run('for p in planets: p.e = 0');
    expect(r.ok).toBe(true);
    expect([399, 499, 10001].map((id) => w.bodies.get(id)!.props.e)).toEqual([0, 0, 0]);
    expect(w.bodies.get(301)!.props.e).toBe(0.055);
    expect(w.batches).toBe(1);
    // the loop variable does not leak
    expect(run('for p in planets: p.e = 0\np.e = 1').r.lines.at(-1)).toMatch(/no body called "p"/);
  });
  it('creates, commands, prints', () => {
    const { w, r } = run('create planet "Nova" mass=3 Mearth density=4.5 g/cm3 a=1.6 AU around Sun\nreverse Moon\nsimulate on\nprint Earth.g\nprint Mars.P / Earth.P');
    expect(r.ok).toBe(true);
    expect(w.log.find((l) => l.startsWith('create planet Nova around 10'))).toBeTruthy();
    expect(w.log).toContain('reverse Moon');
    expect(w.log).toContain('simulate true');
    expect(r.lines.some((l) => /^Earth\.g = 9\.8/.test(l))).toBe(true);
    expect(Number(r.lines.at(-1))).toBeCloseTo(1.88, 1);
  });
  it('explains mistakes', () => {
    const err = (src: string) => run(src).r.lines.at(-1)!;
    expect(err('Earth.mass = 2')).toMatch(/mass needs a unit: it is a mass \(e\.g\. mass = 2 Mearth\)/);
    expect(err('Earth.a = 3 kg')).toMatch(/a is a length, but that is a mass/);
    expect(err('Earth.g = 10 m/s2')).toMatch(/derived and can't be set/);
    expect(err('Pluto.mass = 1 Mearth')).toMatch(/no body called "Pluto"/);
    expect(err('Earth.colour = 3')).toMatch(/unknown property "colour"/);
    expect(err('Earth.a *= 2 km')).toMatch(/takes a plain number/);
    expect(err('1 AU + 1 kg')).toMatch(/can't add a mass to a length/);
    expect(err('create spaceship')).toMatch(/create what\?/);
    expect(err('for p in galaxies: p.e = 0')).toMatch(/expected one of planets/);
    expect(err('Earth.e = (0.1')).toMatch(/expected "\)"/);
    expect(err('Earth.e = 0.1 $')).toMatch(/unexpected character "\$"/);
    // the error points at its column
    expect(run('Earth.colour = 3').r.lines.at(-1)).toContain('\n  Earth.colour = 3\n        ^');
    // a script stops at its first error and says which line
    const r = run('Earth.e = 0.1\nEarth.mass = 2\nMars.e = 0');
    expect(r.r.ok).toBe(false);
    expect(r.r.lines.at(-1)).toMatch(/^✗ line 2:/);
    expect(r.w.bodies.get(499)!.props.e).toBe(0.0934);
  });
  it('help lists the language', () => {
    const { r } = run('help');
    expect(r.lines.join('\n')).toMatch(/for p in planets: p\.e = 0/);
    expect(run('help properties').r.lines[0]).toMatch(/mass \(mass\)/);
  });
});
