/**
 * God mode's universe console: a small language with units, parsed by hand (no eval, no Function),
 * run against a `ScriptWorld` (src/god/script/world.ts adapts God mode to it).
 *
 *   Earth.mass = 2 Mearth          Jupiter.a *= 0.5            Mars.e = 0.3
 *   create planet "Nova" mass=3 Mearth density=4.5 g/cm3 a=1.6 AU around Sun
 *   create blackhole mass=10 Msun a=40 AU                       reverse Moon
 *   for p in planets: p.e = 0      print Earth.T_s             simulate on / off, reset, undo, help
 *
 * Values carry dimensions (mass, length, time, temperature); assignments are checked against the
 * property's, and every result is echoed with its formula when it is a derived quantity.
 */

// ---------------------------------------------------------------- dimensions and units

/** exponents of [kg, m, s, K] */
export type Dim = [number, number, number, number];
export const NONE: Dim = [0, 0, 0, 0];
const dimEq = (a: Dim, b: Dim) => a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
const dimMul = (a: Dim, b: Dim, s = 1): Dim => [a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2], a[3] + s * b[3]];
const dimPow = (a: Dim, p: number): Dim => [a[0] * p, a[1] * p, a[2] * p, a[3] * p];

const MASS: Dim = [1, 0, 0, 0], LEN: Dim = [0, 1, 0, 0], TIME: Dim = [0, 0, 1, 0], TEMP: Dim = [0, 0, 0, 1];
const DENS: Dim = [1, -3, 0, 0], ACC: Dim = [0, 1, -2, 0], SPEED: Dim = [0, 1, -1, 0], PRESS: Dim = [1, -1, -2, 0], POWER: Dim = [1, 2, -3, 0];

export interface Value { v: number; d: Dim }

/** Units: factor to SI and dimension. Exponents may follow (cm3, m^2). */
export const UNITS: Record<string, [number, Dim]> = {
  kg: [1, MASS], g: [1e-3, MASS], t: [1e3, MASS],
  Mearth: [5.9722e24, MASS], Mjup: [1.89813e27, MASS], Msun: [1.98847e30, MASS], Mmoon: [7.342e22, MASS],
  m: [1, LEN], cm: [1e-2, LEN], km: [1e3, LEN], AU: [149_597_870_700, LEN], au: [149_597_870_700, LEN], ly: [9.4607304725808e15, LEN], pc: [3.0856775814913673e16, LEN],
  Rearth: [6.371e6, LEN], Rjup: [7.1492e7, LEN], Rsun: [6.957e8, LEN],
  s: [1, TIME], min: [60, TIME], h: [3600, TIME], d: [86400, TIME], day: [86400, TIME], days: [86400, TIME], yr: [365.25 * 86400, TIME], years: [365.25 * 86400, TIME],
  K: [1, TEMP],
  deg: [1, NONE], rad: [180 / Math.PI, NONE], mol: [1, NONE], '%': [0.01, NONE],
  Pa: [1, PRESS], bar: [1e5, PRESS], atm: [101325, PRESS],
  W: [1, POWER], Lsun: [3.828e26, POWER],
};

export function dimName(d: Dim): string {
  const known: [Dim, string][] = [[NONE, 'a plain number'], [MASS, 'a mass'], [LEN, 'a length'], [TIME, 'a time'], [TEMP, 'a temperature'], [DENS, 'a density'],
    [ACC, 'an acceleration'], [SPEED, 'a speed'], [PRESS, 'a pressure'], [POWER, 'a luminosity']];
  for (const [k, n] of known) if (dimEq(k, d)) return n;
  const names = ['kg', 'm', 's', 'K'];
  return d.map((x, i) => (x ? `${names[i]}${x === 1 ? '' : `^${x}`}` : '')).filter(Boolean).join('·');
}

// ---------------------------------------------------------------- properties

export interface PropDef {
  dim: Dim;
  /** can be set (otherwise derived, read-only) */
  set: boolean;
  /** what it is, for help */
  doc: string;
  /** examples of units for messages */
  unit: string;
}

export const PROPS: Record<string, PropDef> = {
  mass: { dim: MASS, set: true, doc: 'mass', unit: 'Mearth' },
  radius: { dim: LEN, set: true, doc: 'mean radius', unit: 'km' },
  density: { dim: DENS, set: true, doc: 'mean density', unit: 'g/cm3' },
  rpol: { dim: LEN, set: true, doc: 'polar radius', unit: 'km' },
  rotation: { dim: TIME, set: true, doc: 'rotation period (negative: retrograde)', unit: 'h' },
  obliquity: { dim: NONE, set: true, doc: 'axial tilt (degrees)', unit: 'deg' },
  a: { dim: LEN, set: true, doc: 'semi-major axis', unit: 'AU' },
  e: { dim: NONE, set: true, doc: 'eccentricity', unit: '' },
  i: { dim: NONE, set: true, doc: 'inclination (degrees)', unit: 'deg' },
  node: { dim: NONE, set: true, doc: 'longitude of the ascending node (degrees)', unit: 'deg' },
  peri: { dim: NONE, set: true, doc: 'argument of periapsis (degrees)', unit: 'deg' },
  M: { dim: NONE, set: true, doc: 'mean anomaly now (degrees)', unit: 'deg' },
  albedo: { dim: NONE, set: true, doc: 'Bond albedo', unit: '' },
  greenhouse: { dim: TEMP, set: true, doc: 'greenhouse warming', unit: 'K' },
  pressure: { dim: PRESS, set: true, doc: 'surface pressure', unit: 'bar' },
  molar: { dim: MASS, set: true, doc: 'mean molar mass of the air (per mol)', unit: 'g' },
  spin: { dim: NONE, set: true, doc: 'black-hole spin a (−1…1)', unit: '' },
  g: { dim: ACC, set: false, doc: 'surface gravity', unit: 'm/s2' },
  v_esc: { dim: SPEED, set: false, doc: 'escape velocity', unit: 'km/s' },
  P: { dim: TIME, set: false, doc: 'orbital period (Kepler III)', unit: 'd' },
  q: { dim: LEN, set: false, doc: 'periapsis distance', unit: 'AU' },
  Q: { dim: LEN, set: false, doc: 'apoapsis distance', unit: 'AU' },
  hill: { dim: LEN, set: false, doc: 'Hill sphere radius', unit: 'km' },
  T_eq: { dim: TEMP, set: false, doc: 'equilibrium temperature', unit: 'K' },
  T_s: { dim: TEMP, set: false, doc: 'surface temperature', unit: 'K' },
  H: { dim: LEN, set: false, doc: 'atmospheric scale height', unit: 'km' },
  L: { dim: POWER, set: false, doc: 'luminosity (stars)', unit: 'Lsun' },
  Teff: { dim: TEMP, set: false, doc: 'effective temperature (stars)', unit: 'K' },
  r_s: { dim: LEN, set: false, doc: 'Schwarzschild radius (black holes)', unit: 'km' },
  isco: { dim: LEN, set: false, doc: 'innermost stable circular orbit (black holes)', unit: 'km' },
};
const ALIASES: Record<string, string> = {
  m: 'mass', r: 'radius', rho: 'density', sma: 'a', ecc: 'e', inc: 'i', incl: 'i', tilt: 'obliquity', day: 'rotation', period: 'P',
  vesc: 'v_esc', Ts: 'T_s', Teq: 'T_eq', rs: 'r_s', Omega: 'node', omega: 'peri', gravity: 'g', temperature: 'T_s', luminosity: 'L',
};
export function propName(s: string): string | null {
  if (PROPS[s]) return s;
  if (ALIASES[s]) return ALIASES[s];
  const low = Object.keys(PROPS).find((k) => k.toLowerCase() === s.toLowerCase());
  return low ?? null;
}

// ---------------------------------------------------------------- the world it runs against

export type Collection = 'planets' | 'moons' | 'dwarfs' | 'asteroids' | 'stars' | 'created' | 'all' | 'children';
export interface Got { value: number; math?: string }

export interface ScriptWorld {
  /** id of a body by name (null: none) */
  find(name: string): number | null;
  nameOf(id: number): string;
  collection(kind: Collection, of: number | null): number[];
  get(id: number, prop: string): Got | null;
  set(id: number, prop: string, si: number): void;
  create(kind: string, name: string | null, params: Record<string, Value | string>, around: number | null): number;
  command(cmd: 'reverse' | 'delete' | 'select' | 'goto' | 'circularize', id: number): void;
  simulate(on: boolean): void;
  reset(): void;
  undo(): boolean;
  /** run several changes as one undo step */
  batch(fn: () => void): void;
  /** display of a value of this property (SI) */
  show(prop: string, si: number): string;
}

export class ScriptError extends Error {
  constructor(message: string, readonly col = -1) { super(message); }
}

// ---------------------------------------------------------------- lexer

type Tok = { k: 'num'; v: number; p: number } | { k: 'id'; v: string; p: number } | { k: 'str'; v: string; p: number } | { k: 'op'; v: string; p: number } | { k: 'end'; p: number };

export function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (c === '#') break; // comment to the end of the line
    const n = /^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/.exec(src.slice(i));
    if (n) { out.push({ k: 'num', v: Number(n[0]), p: i }); i += n[0].length; continue; }
    const id = /^[A-Za-z_][A-Za-z_0-9]*/.exec(src.slice(i));
    if (id) { out.push({ k: 'id', v: id[0], p: i }); i += id[0].length; continue; }
    if (c === '"' || c === "'") {
      const j = src.indexOf(c, i + 1);
      if (j < 0) throw new ScriptError('a quote is not closed', i);
      out.push({ k: 'str', v: src.slice(i + 1, j), p: i });
      i = j + 1;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (['+=', '-=', '*=', '/=', '**'].includes(two)) { out.push({ k: 'op', v: two === '**' ? '^' : two, p: i }); i += 2; continue; }
    if ('+-*/^()=.,:;%'.includes(c)) { out.push({ k: 'op', v: c, p: i }); i++; continue; }
    throw new ScriptError(`unexpected character "${c}"`, i);
  }
  out.push({ k: 'end', p: src.length });
  return out;
}

// ---------------------------------------------------------------- parser

export type Expr =
  | { t: 'num'; v: Value }
  | { t: 'prop'; target: string; prop: string; p: number }
  | { t: 'const'; name: string }
  | { t: 'neg'; e: Expr }
  | { t: 'bin'; op: string; a: Expr; b: Expr }
  | { t: 'call'; f: string; args: Expr[] };

export type Stmt =
  | { t: 'assign'; target: string; prop: string; op: string; e: Expr }
  | { t: 'create'; kind: string; name: string | null; params: Record<string, Expr | string>; around: string | null }
  | { t: 'cmd'; cmd: 'reverse' | 'delete' | 'select' | 'goto' | 'circularize'; target: string }
  | { t: 'simulate'; on: boolean }
  | { t: 'reset' } | { t: 'undo' }
  | { t: 'help'; topic: string | null }
  | { t: 'print'; e: Expr }
  | { t: 'list'; kind: Collection; of: string | null }
  | { t: 'for'; v: string; kind: Collection; of: string | null; body: Stmt[] };

const CONSTS: Record<string, Value> = {
  pi: { v: Math.PI, d: NONE }, G: { v: 6.6743e-11, d: [-1, 3, -2, 0] }, c: { v: 299_792_458, d: SPEED },
};
const FUNCS = ['sqrt', 'abs', 'min', 'max', 'log10', 'ln', 'exp', 'cbrt', 'round'];
const COLLECTIONS: Collection[] = ['planets', 'moons', 'dwarfs', 'asteroids', 'stars', 'created', 'all', 'children'];
const CREATE_KINDS = ['planet', 'moon', 'star', 'blackhole', 'hole', 'swarm', 'asteroids'];

class Parser {
  private i = 0;
  constructor(private toks: Tok[]) {}
  private peek(o = 0): Tok { return this.toks[Math.min(this.i + o, this.toks.length - 1)]; }
  private next(): Tok { return this.toks[this.i++]; }
  private isOp(v: string, o = 0): boolean { const t = this.peek(o); return t.k === 'op' && t.v === v; }
  private isId(v: string, o = 0): boolean { const t = this.peek(o); return t.k === 'id' && t.v.toLowerCase() === v; }
  private expectOp(v: string, what: string): void {
    const t = this.next();
    if (t.k !== 'op' || t.v !== v) throw new ScriptError(`expected "${v}" ${what}`, t.p);
  }
  get done(): boolean { return this.peek().k === 'end'; }

  /** statements separated by ";" */
  statements(): Stmt[] {
    const out: Stmt[] = [];
    while (!this.done) {
      if (this.isOp(';')) { this.next(); continue; }
      out.push(this.statement());
      if (!this.done && !this.isOp(';')) throw new ScriptError(`unexpected "${tokText(this.peek())}" after the statement`, this.peek().p);
    }
    return out;
  }

  private name(what: string): string {
    const t = this.next();
    if (t.k === 'id' || t.k === 'str') return t.v;
    throw new ScriptError(`expected ${what}`, t.p);
  }

  private collection(): { kind: Collection; of: string | null } {
    const t = this.next();
    const kind = t.k === 'id' ? COLLECTIONS.find((c) => c === t.v.toLowerCase() || `${c}` === `${t.v.toLowerCase()}s`) : undefined;
    if (!kind) throw new ScriptError(`expected one of ${COLLECTIONS.join(', ')}`, t.p);
    let of: string | null = null;
    if (this.isId('of')) { this.next(); of = this.name('a body after "of"'); }
    if (kind === 'children' && !of) throw new ScriptError('"children" needs "of <body>"', t.p);
    return { kind, of };
  }

  statement(): Stmt {
    const t = this.peek();
    if (t.k === 'id') {
      const w = t.v.toLowerCase();
      if (w === 'for') {
        this.next();
        const v = this.name('a loop variable after "for"');
        if (!this.isId('in')) throw new ScriptError('expected "in" after the loop variable', this.peek().p);
        this.next();
        const { kind, of } = this.collection();
        this.expectOp(':', 'after the collection (for p in planets: ...)');
        const body: Stmt[] = [this.statement()];
        while (this.isOp(';') && this.peek(1).k !== 'end') { this.next(); body.push(this.statement()); }
        return { t: 'for', v, kind, of, body };
      }
      if (w === 'create' || w === 'new' || w === 'add') {
        this.next();
        const kt = this.next();
        const kind = kt.k === 'id' ? kt.v.toLowerCase() : '';
        if (!CREATE_KINDS.includes(kind)) throw new ScriptError(`create what? ${CREATE_KINDS.join(', ')}`, kt.p);
        let name: string | null = null;
        if (this.peek().k === 'str') name = (this.next() as { v: string }).v;
        const params: Record<string, Expr | string> = {};
        let around: string | null = null;
        while (!this.done && !this.isOp(';')) {
          if (this.isId('around') || this.isId('orbiting')) { this.next(); around = this.name('a body after "around"'); continue; }
          const key = this.next();
          if (key.k !== 'id') throw new ScriptError('expected a parameter like mass=3 Mearth', key.p);
          this.expectOp('=', `after "${key.v}"`);
          if (this.peek().k === 'str') params[key.v] = (this.next() as { v: string }).v;
          else if (key.v === 'type' && this.peek().k === 'id') params[key.v] = (this.next() as { v: string }).v;
          else params[key.v] = this.expr();
        }
        return { t: 'create', kind, name, params, around };
      }
      if (['reverse', 'delete', 'remove', 'select', 'goto', 'circularize'].includes(w) && (this.peek(1).k === 'id' || this.peek(1).k === 'str') && !this.isOp('.', 2) ) {
        this.next();
        const target = this.name(`a body after "${w}"`);
        return { t: 'cmd', cmd: (w === 'remove' ? 'delete' : w) as 'reverse', target };
      }
      if (w === 'simulate' || w === 'nbody') {
        this.next();
        const o = this.next();
        if (o.k !== 'id' || !['on', 'off'].includes(o.v.toLowerCase())) throw new ScriptError('simulate on | simulate off', o.p);
        return { t: 'simulate', on: o.v.toLowerCase() === 'on' };
      }
      if (w === 'reset' && this.peek(1).k !== 'op') { this.next(); return { t: 'reset' }; }
      if (w === 'undo' && this.peek(1).k !== 'op') { this.next(); return { t: 'undo' }; }
      if (w === 'help' || w === '?') { this.next(); const n = this.peek(); if (n.k === 'id') { this.next(); return { t: 'help', topic: n.v }; } return { t: 'help', topic: null }; }
      if (w === 'print' || w === 'show') { this.next(); return { t: 'print', e: this.expr() }; }
      if (w === 'list') { this.next(); const c = this.collection(); return { t: 'list', kind: c.kind, of: c.of }; }
    }
    // assignment: target.prop op expr
    if ((t.k === 'id' || t.k === 'str') && this.isOp('.', 1) && this.peek(2).k === 'id') {
      const op = this.peek(3);
      if (op.k === 'op' && ['=', '+=', '-=', '*=', '/='].includes(op.v)) {
        const target = t.v; this.i += 2;
        const pt = this.next() as { v: string; p: number };
        const prop = propName(pt.v);
        if (!prop) throw new ScriptError(`unknown property "${pt.v}" (help properties)`, pt.p);
        this.next();
        return { t: 'assign', target, prop, op: op.v, e: this.expr() };
      }
    }
    return { t: 'print', e: this.expr() };
  }

  // expressions: + - , * / , unary -, ^, postfix units on numbers
  expr(): Expr {
    let a = this.term();
    while (this.isOp('+') || this.isOp('-')) { const op = (this.next() as { v: string }).v; a = { t: 'bin', op, a, b: this.term() }; }
    return a;
  }
  private term(): Expr {
    let a = this.unary();
    while (this.isOp('*') || this.isOp('/')) { const op = (this.next() as { v: string }).v; a = { t: 'bin', op, a, b: this.unary() }; }
    return a;
  }
  private unary(): Expr {
    if (this.isOp('-')) { this.next(); return { t: 'neg', e: this.unary() }; }
    if (this.isOp('+')) { this.next(); return this.unary(); }
    return this.power();
  }
  private power(): Expr {
    const a = this.primary();
    if (this.isOp('^')) { this.next(); return { t: 'bin', op: '^', a, b: this.unary() }; }
    return a;
  }
  private primary(): Expr {
    const t = this.next();
    if (t.k === 'num') {
      const u = this.unit();
      return { t: 'num', v: { v: t.v * u.f, d: u.d } };
    }
    if (t.k === 'op' && t.v === '(') {
      const e = this.expr();
      this.expectOp(')', 'to close the bracket');
      const u = this.unit();
      return u.f === 1 && dimEq(u.d, NONE) ? e : { t: 'bin', op: '*', a: e, b: { t: 'num', v: { v: u.f, d: u.d } } };
    }
    if (t.k === 'id' || t.k === 'str') {
      if (t.k === 'id' && FUNCS.includes(t.v) && this.isOp('(')) {
        this.next();
        const args: Expr[] = [];
        if (!this.isOp(')')) { args.push(this.expr()); while (this.isOp(',')) { this.next(); args.push(this.expr()); } }
        this.expectOp(')', `to close ${t.v}(`);
        return { t: 'call', f: t.v, args };
      }
      if (this.isOp('.')) {
        this.next();
        const pt = this.next();
        if (pt.k !== 'id') throw new ScriptError(`expected a property after "${t.v}."`, pt.p);
        const prop = propName(pt.v);
        if (!prop) throw new ScriptError(`unknown property "${pt.v}" (help properties)`, pt.p);
        return { t: 'prop', target: t.v, prop, p: t.p };
      }
      if (t.k === 'id' && CONSTS[t.v]) return { t: 'const', name: t.v };
      if (t.k === 'id' && UNITS[t.v]) return { t: 'num', v: { v: UNITS[t.v][0], d: UNITS[t.v][1] } }; // "AU" alone = 1 AU
      throw new ScriptError(`"${t.v}" is not a number, unit or property (did you mean ${t.v}.mass?)`, t.p);
    }
    throw new ScriptError(t.k === 'end' ? 'the expression stops too early' : `unexpected "${tokText(t)}"`, t.p);
  }

  /** a unit after a number: term (('/' term) | term)*, a term being name[exp] or name^n */
  private unit(): { f: number; d: Dim } {
    let f = 1, d: Dim = NONE;
    const first = this.unitTerm();
    if (!first) return { f, d };
    f = first.f; d = first.d;
    for (;;) {
      if (this.isOp('/') && unitLike(this.peek(1))) {
        this.next();
        const t = this.unitTerm()!;
        f /= t.f; d = dimMul(d, t.d, -1);
      } else if (this.isOp('%')) {
        this.next(); f *= 0.01;
      } else break;
    }
    return { f, d };
  }

  private unitTerm(): { f: number; d: Dim } | null {
    const t = this.peek();
    if (t.k === 'op' && t.v === '%') { this.next(); return { f: 0.01, d: NONE }; }
    if (!unitLike(t)) return null;
    const v = (t as { v: string }).v;
    let name = v, p = 1;
    if (!UNITS[v]) { const m = /^([A-Za-z]+?)(\d+)$/.exec(v)!; name = m[1]; p = Number(m[2]); }
    this.next();
    if (this.isOp('^') && this.peek(1).k === 'num') { this.next(); p = (this.next() as { v: number }).v; }
    const [uf, ud] = UNITS[name];
    return { f: uf ** p, d: dimPow(ud, p) };
  }
}

function unitLike(t: Tok): boolean {
  if (t.k !== 'id') return false;
  if (UNITS[t.v]) return true;
  const m = /^([A-Za-z]+?)(\d+)$/.exec(t.v);
  return !!m && !!UNITS[m[1]];
}
function tokText(t: Tok): string { return t.k === 'end' ? 'end of line' : String((t as { v: unknown }).v); }

export function parse(line: string): Stmt[] {
  return new Parser(lex(line)).statements();
}

/** Parse one expression (tests). */
export function parseExpr(src: string): Expr {
  const p = new Parser(lex(src));
  const e = p.expr();
  if (!p.done) throw new ScriptError('unexpected text after the expression');
  return e;
}

// ---------------------------------------------------------------- evaluation

export interface RunResult { ok: boolean; lines: string[] }

export class ScriptRunner {
  /** loop variables -> body ids */
  private vars = new Map<string, number>();
  constructor(readonly world: ScriptWorld) {}

  /** Run a script (several lines). Stops at the first error, reporting its line. */
  run(src: string): RunResult {
    const lines: string[] = [];
    const rows = src.split(/\r?\n/);
    for (let n = 0; n < rows.length; n++) {
      const row = rows[n];
      if (!row.trim() || row.trim().startsWith('#')) continue;
      try {
        for (const st of parse(row)) this.exec(st, lines);
      } catch (e) {
        const msg = e instanceof ScriptError ? e.message : String((e as Error)?.message ?? e);
        const where = rows.length > 1 ? `line ${n + 1}: ` : '';
        const col = e instanceof ScriptError && e.col >= 0 ? `\n  ${row}\n  ${' '.repeat(e.col)}^` : '';
        lines.push(`✗ ${where}${msg}${col}`);
        return { ok: false, lines };
      }
    }
    return { ok: true, lines };
  }

  private body(name: string): number {
    const v = this.vars.get(name);
    if (v !== undefined) return v;
    const id = this.world.find(name);
    if (id === null) throw new ScriptError(`no body called "${name}"`);
    return id;
  }

  private exec(st: Stmt, out: string[]): void {
    const w = this.world;
    switch (st.t) {
      case 'assign': {
        const def = PROPS[st.prop];
        if (!def.set) throw new ScriptError(`${st.prop} (${def.doc}) is derived and can't be set; change what it comes from`);
        const id = this.body(st.target);
        const val = this.eval(st.e);
        let si: number;
        if (st.op === '*=' || st.op === '/=') {
          if (!dimEq(val.d, NONE)) throw new ScriptError(`"${st.op}" takes a plain number (got ${dimName(val.d)})`);
          const cur = w.get(id, st.prop);
          if (!cur) throw new ScriptError(`${w.nameOf(id)} has no ${st.prop}`);
          si = st.op === '*=' ? cur.value * val.v : cur.value / val.v;
        } else {
          this.checkDim(st.prop, val);
          if (st.op === '=') si = val.v;
          else {
            const cur = w.get(id, st.prop);
            if (!cur) throw new ScriptError(`${w.nameOf(id)} has no ${st.prop}`);
            si = st.op === '+=' ? cur.value + val.v : cur.value - val.v;
          }
        }
        if (!Number.isFinite(si)) throw new ScriptError('the result is not a finite number');
        w.set(id, st.prop, si);
        const now = w.get(id, st.prop);
        out.push(`${w.nameOf(id)}.${st.prop} = ${w.show(st.prop, now?.value ?? si)}`);
        this.echoConsequences(id, st.prop, out);
        return;
      }
      case 'create': {
        const params: Record<string, Value | string> = {};
        for (const [k, e] of Object.entries(st.params)) params[k] = typeof e === 'string' ? e : this.eval(e);
        const around = st.around ? this.body(st.around) : null;
        const id = w.create(st.kind, st.name, params, around);
        out.push(`created ${w.nameOf(id)}`);
        const P = w.get(id, 'P');
        if (P?.math) out.push(`  ${P.math}`);
        return;
      }
      case 'cmd': {
        const id = this.body(st.target);
        const name = w.nameOf(id);
        w.command(st.cmd, id);
        out.push(st.cmd === 'reverse' ? `${name} now orbits the other way (i → ${w.show('i', w.get(id, 'i')?.value ?? 0)})` : `${st.cmd} ${name}`);
        return;
      }
      case 'simulate': w.simulate(st.on); out.push(st.on ? 'N-body simulation on: every body pulls on every other' : 'Kepler orbits: each body on its exact two-body orbit'); return;
      case 'reset': w.reset(); out.push('back to the real universe'); return;
      case 'undo': out.push(w.undo() ? 'undone' : 'nothing to undo'); return;
      case 'help': out.push(...help(st.topic)); return;
      case 'list': {
        const ids = w.collection(st.kind, st.of ? this.body(st.of) : null);
        out.push(ids.length ? ids.map((i) => w.nameOf(i)).join(', ') : `no ${st.kind}`);
        return;
      }
      case 'print': {
        if (st.e.t === 'prop') {
          const id = this.body(st.e.target);
          const g = w.get(id, st.e.prop);
          if (!g) throw new ScriptError(`${w.nameOf(id)} has no ${st.e.prop}`);
          out.push(`${w.nameOf(id)}.${st.e.prop} = ${w.show(st.e.prop, g.value)}`);
          if (g.math) out.push(`  ${g.math}`);
          return;
        }
        const v = this.eval(st.e);
        out.push(formatValue(v));
        return;
      }
      case 'for': {
        const ids = w.collection(st.kind, st.of ? this.body(st.of) : null);
        if (!ids.length) { out.push(`no ${st.kind}`); return; }
        const prev = this.vars.get(st.v);
        let n = 0;
        try {
          w.batch(() => {
            for (const id of ids) {
              this.vars.set(st.v, id);
              const sub: string[] = [];
              for (const b of st.body) this.exec(b, sub);
              // keep the echo short for long loops
              if (n < 12) out.push(...sub.filter((l) => !l.startsWith('  ')));
              n++;
            }
          });
        } finally {
          if (prev === undefined) this.vars.delete(st.v); else this.vars.set(st.v, prev);
        }
        if (n > 12) out.push(`… and ${n - 12} more`);
        return;
      }
    }
  }

  /** After a change, the derived values it moved, with their formulas. */
  private echoConsequences(id: number, prop: string, out: string[]): void {
    const show: string[] = prop === 'a' || prop === 'e' || prop === 'mass' ? ['P'] : prop === 'radius' || prop === 'density' ? ['g'] : prop === 'albedo' || prop === 'greenhouse' ? ['T_s'] : prop === 'pressure' || prop === 'molar' ? ['H'] : [];
    if (prop === 'mass') show.push('g');
    for (const k of show) {
      const g = this.world.get(id, k);
      if (g?.math) out.push(`  ${g.math}`);
    }
  }

  private checkDim(prop: string, v: Value): void {
    const def = PROPS[prop];
    if (dimEq(v.d, def.dim)) return;
    if (dimEq(v.d, NONE) && !dimEq(def.dim, NONE)) throw new ScriptError(`${prop} needs a unit: it is ${dimName(def.dim)} (e.g. ${prop} = 2 ${def.unit})`);
    throw new ScriptError(`${prop} is ${dimName(def.dim)}, but that is ${dimName(v.d)}`);
  }

  eval(e: Expr): Value {
    switch (e.t) {
      case 'num': return e.v;
      case 'const': return CONSTS[e.name];
      case 'neg': { const v = this.eval(e.e); return { v: -v.v, d: v.d }; }
      case 'prop': {
        const id = this.body(e.target);
        const g = this.world.get(id, e.prop);
        if (!g) throw new ScriptError(`${this.world.nameOf(id)} has no ${e.prop}`);
        return { v: g.value, d: PROPS[e.prop].dim };
      }
      case 'bin': {
        const a = this.eval(e.a), b = this.eval(e.b);
        switch (e.op) {
          case '+': case '-':
            if (!dimEq(a.d, b.d)) throw new ScriptError(`can't ${e.op === '+' ? 'add' : 'subtract'} ${dimName(b.d)} ${e.op === '+' ? 'to' : 'from'} ${dimName(a.d)}`);
            return { v: e.op === '+' ? a.v + b.v : a.v - b.v, d: a.d };
          case '*': return { v: a.v * b.v, d: dimMul(a.d, b.d) };
          case '/':
            if (b.v === 0) throw new ScriptError('division by zero');
            return { v: a.v / b.v, d: dimMul(a.d, b.d, -1) };
          case '^':
            if (!dimEq(b.d, NONE)) throw new ScriptError('a power must be a plain number');
            return { v: a.v ** b.v, d: dimPow(a.d, b.v) };
        }
        throw new ScriptError(`unknown operator ${e.op}`);
      }
      case 'call': {
        const args = e.args.map((x) => this.eval(x));
        const need = (n: number) => { if (args.length !== n) throw new ScriptError(`${e.f}() takes ${n} argument${n > 1 ? 's' : ''}`); };
        const plain = (v: Value) => { if (!dimEq(v.d, NONE)) throw new ScriptError(`${e.f}() takes a plain number`); return v.v; };
        switch (e.f) {
          case 'sqrt': need(1); return { v: Math.sqrt(args[0].v), d: dimPow(args[0].d, 0.5) };
          case 'cbrt': need(1); return { v: Math.cbrt(args[0].v), d: dimPow(args[0].d, 1 / 3) };
          case 'abs': need(1); return { v: Math.abs(args[0].v), d: args[0].d };
          case 'round': need(1); return { v: Math.round(args[0].v), d: args[0].d };
          case 'min': case 'max': {
            if (args.length < 2) throw new ScriptError(`${e.f}() takes at least 2 arguments`);
            for (const x of args) if (!dimEq(x.d, args[0].d)) throw new ScriptError(`${e.f}() needs values of the same kind`);
            return { v: e.f === 'min' ? Math.min(...args.map((x) => x.v)) : Math.max(...args.map((x) => x.v)), d: args[0].d };
          }
          case 'log10': need(1); return { v: Math.log10(plain(args[0])), d: NONE };
          case 'ln': need(1); return { v: Math.log(plain(args[0])), d: NONE };
          case 'exp': need(1); return { v: Math.exp(plain(args[0])), d: NONE };
        }
        throw new ScriptError(`unknown function ${e.f}()`);
      }
    }
  }
}

/** A value in SI with its unit. */
export function formatValue(v: Value): string {
  const n = (x: number) => (Math.abs(x) >= 1e5 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(4).replace(/\.?0+e/, 'e') : String(Number(x.toPrecision(6))));
  const unit = (d: Dim) => {
    const names = ['kg', 'm', 's', 'K'];
    const parts = d.map((x, i) => (Math.abs(x) < 1e-9 ? '' : `${names[i]}${x === 1 ? '' : x === Math.round(x) ? `^${x}` : `^${Number(x.toFixed(3))}`}`)).filter(Boolean);
    return parts.join('·');
  };
  return `${n(v.v)}${unit(v.d) ? ` ${unit(v.d)}` : ''}`;
}

export function help(topic: string | null): string[] {
  if (topic && /^prop/i.test(topic)) {
    return ['Properties (settable): ' + Object.entries(PROPS).filter(([, d]) => d.set).map(([k, d]) => `${k} (${d.doc})`).join(', '),
      'Derived (read-only, printed with their formula): ' + Object.entries(PROPS).filter(([, d]) => !d.set).map(([k, d]) => `${k} (${d.doc})`).join(', ')];
  }
  if (topic && /^unit/i.test(topic)) return ['Units: ' + Object.keys(UNITS).join(' ') + '  (combine: g/cm3, km/s, m/s2)'];
  return [
    'Change a body:      Earth.mass = 2 Mearth · Jupiter.a *= 0.5 · Mars.e = 0.3 · Moon.rotation = 24 h · Venus.i += 10',
    'Ask:                print Earth.T_s · Earth.g · Jupiter.P / Earth.P · sqrt(G * Sun.mass / 1 AU)',
    'Create:             create planet "Nova" mass=3 Mearth density=4.5 g/cm3 a=1.6 AU around Sun',
    '                    create moon mass=0.01 Mearth a=200000 km around Earth · create star mass=0.5 Msun a=30 AU',
    '                    create blackhole mass=10 Msun a=40 AU · create swarm a=2.8 AU   (planet type="ocean"|rocky|ice|lava|giant)',
    'Commands:           reverse Moon · circularize Mars · delete Earth · select Saturn · goto Saturn · list moons of Jupiter',
    'Loops:              for p in planets: p.e = 0 · for m in moons of Saturn: m.i = 0; m.e = 0',
    '                    (planets, moons, dwarfs, asteroids, stars, created, all, children of X)',
    'Universe:           simulate on | off (N-body) · undo · reset · help properties · help units',
    'Scripts: several lines (# comments) run top to bottom; a loop body is the rest of its line.',
  ];
}
