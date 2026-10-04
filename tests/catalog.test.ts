import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PC } from '../src/core/units';
import type { SpaceObject } from '../src/universe/Body';
import { BlackHole } from '../src/universe/BlackHoles';
import { Catalog, type CatalogHost } from '../src/universe/Catalog';
import { CatalogSearch, normKey, type CatalogManifest } from '../src/universe/CatalogSearch';

const ROOT = join(__dirname, '..', 'public', 'data', 'catalog');
const has = existsSync(join(ROOT, 'manifest.json'));
let fetches = 0;
const diskFetch = async (url: string) => {
  fetches++;
  const p = join(ROOT, url.replace(/^disk:\/\/catalog\//, ''));
  const ok = existsSync(p);
  const t = ok ? readFileSync(p, 'utf8') : '';
  return { ok, text: async () => t, json: async () => JSON.parse(t) as unknown };
};

describe('catalogue search keys', () => {
  it('normalises designations the way people type them', () => {
    expect(normKey('HD 209458')).toBe('hd209458');
    expect(normKey('Gliese 581')).toBe(normKey('Gl 581'));
    expect(normKey('GJ 581')).toBe('gj581');
    expect(normKey('Messier 31')).toBe(normKey('M 31'));
    expect(normKey('α Centauri')).toBe('alphacentauri');
    expect(normKey('Barnard’s Star')).toBe('barnardsstar');
    expect(normKey('PSR J0437-4715')).toBe('psrj04374715');
    expect(normKey('Ōmega')).toBe('omega');
  });
});

describe.skipIf(!has)('catalogue data', () => {
  const man = has ? (JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8')) as CatalogManifest) : null;

  it('holds 100,000-200,000 objects in at most 25 MB', () => {
    expect(man!.objects).toBeGreaterThanOrEqual(100_000);
    expect(man!.objects).toBeLessThanOrEqual(200_000);
    let bytes = 0;
    const walk = (d: string) => { for (const f of readdirSync(d, { withFileTypes: true })) { const p = join(d, f.name); if (f.isDirectory()) walk(p); else bytes += readFileSync(p).length; } };
    walk(ROOT);
    expect(bytes).toBeLessThanOrEqual(25e6);
    const total = Object.values(man!.categories).reduce((s, c) => s + c.count, 0);
    expect(total).toBe(man!.objects);
  });

  it('index files are sorted by the same key function as the pipeline (every key)', () => {
    let prev = '';
    for (let i = 0; i < man!.indexChunks.length; i++) {
      const lines = readFileSync(join(ROOT, 'idx', `${i}.txt`), 'utf8').split('\n').filter((l) => l);
      expect(normKey(lines[0].split('\t')[0])).toBe(man!.indexChunks[i]);
      for (const l of lines) {
        const k = normKey(l.split('\t')[0]);
        if (k < prev) throw new Error(`index ${i}: "${l}" (${k}) sorts before "${prev}"`);
        prev = k;
      }
    }
  });

  it('every record has a position, a distance and its category fields', () => {
    for (const [code, c] of Object.entries(man!.categories)) {
      const lines = readFileSync(join(ROOT, 'rec', code, '0.tsv'), 'utf8').split('\n').filter((l) => l);
      expect(lines.length).toBe(Math.min(c.count, c.chunk));
      for (const l of lines.slice(0, 200)) {
        const f = l.split('\t');
        expect(f.length).toBe(c.fields.length);
        expect(Number(f[2])).toBeGreaterThanOrEqual(0);
        expect(Math.abs(Number(f[3]))).toBeLessThanOrEqual(90);
        expect(Number(f[4])).toBeGreaterThan(0);
        expect(['m', 'e', 'z']).toContain(f[5]);
      }
    }
  });

  const search = new CatalogSearch('disk://catalog', diskFetch);

  it('finds designations, names and catalogue numbers', async () => {
    const top = async (q: string) => (await search.query(q, 5))[0];
    for (const [q, label] of [['HD 209458', 'HD 209458'], ['hd209458', 'HD 209458'], ['Gliese 581', 'Gl 581'], ['HIP 1234', 'HIP 1234'],
      ['NGC 4594', 'NGC 4594'], ['M 104', 'M 104'], ['Pleiades', 'Pleiades'], ['Crab Pulsar', 'Crab Pulsar'], ['TOI-700', 'TOI-700'],
      ['Cyg X-1', 'Cyg X-1'], ['3C 273', '3C 273'], ['TON 618', 'TON 618'], ['47 Tucanae', '47 Tucanae'], ['Omega Centauri', 'Omega Centauri'], ['Large Magellanic Cloud', 'Large Magellanic Cloud']] as const) {
      const h = await top(q);
      expect(h, q).toBeTruthy();
      expect(h.label, q).toBe(label);
      expect(h.exact, q).toBe(true);
    }
    // a word inside a longer proper name
    expect((await search.query('Magellanic', 5)).some((h) => h.label.includes('Magellanic'))).toBe(true);
    // prefixes: one hit per object, most notable first
    const pre = await search.query('Sirius', 10);
    expect(new Set(pre.map((h) => `${h.code}:${h.row}`)).size).toBe(pre.length);
  });

  it('a query fetches only a few index files', async () => {
    const s = new CatalogSearch('disk://catalog', diskFetch);
    await s.load();
    fetches = 0;
    await s.query('HD 10700', 5);
    expect(fetches).toBeLessThanOrEqual(3);
  });

  it('records give real positions (the Large Magellanic Cloud, Proxima Centauri)', async () => {
    const cat = new Catalog('disk://catalog', host(), diskFetch);
    for (const [q, dPc, tol] of [['Large Magellanic Cloud', 50000, 5000], ['Proxima Centauri', 1.30, 0.01], ['Pleiades', 135, 10]] as const) {
      cat.find(q);
      await until(() => cat.find(q).length > 0);
      const o = cat.resolve(cat.find(q)[0].id)!;
      expect(o, q).toBeTruthy();
      expect(o.name).toBe(q);
      const d = Math.hypot(o.upos.xh, o.upos.yh, o.upos.zh) / PC;
      expect(Math.abs(d - dPc), q).toBeLessThan(tol);
      expect(o.info().length).toBeGreaterThan(2);
    }
  });

  it('quasars and black-hole binaries become black holes for the black-hole layer', async () => {
    const holes: BlackHole[] = [];
    const cat = new Catalog('disk://catalog', host(holes), diskFetch);
    cat.find('Cyg X-1');
    await until(() => cat.find('Cyg X-1').length > 0);
    const o = cat.resolve(cat.find('Cyg X-1')[0].id);
    expect(o).toBeInstanceOf(BlackHole);
    expect(holes).toContain(o);
    expect((o as BlackHole).massSun).toBeGreaterThan(5);
    // the same id gives the same object (not a second hole)
    expect(cat.resolve(cat.find('Cyg X-1')[0].id)).toBe(o);
    expect(holes.length).toBe(1);
    const q = (await search.query('SDSS J0', 600)).filter((h) => h.code === 'q');
    await search.ensure(q);
    const cq = new Catalog('disk://catalog', host(holes), diskFetch);
    await cq.search.ensure(q);
    const bh = cq.resolve(`cat:${q[0].code}:${q[0].row}`) as BlackHole;
    expect(bh.supermassive).toBe(true);
    expect(bh.massSun).toBeGreaterThan(1e6);
  });

  it('browsing lists the notable objects of each category', async () => {
    const cat = new Catalog('disk://catalog', host(), diskFetch);
    await cat.search.load();
    for (const code of Object.keys(man!.categories) as (keyof CatalogManifest['categories'])[]) {
      expect(cat.featured(code)).toBeNull();          // loading
      await until(() => cat.featured(code) !== null);
      const list = cat.featured(code)!;
      expect(list.length, code).toBeGreaterThan(0);
      for (const o of list) expect(o.upos.xh).not.toBeNaN();
    }
  });
});

function host(holes: BlackHole[] = []): CatalogHost {
  return {
    addBlackHole: (d) => { const b = new BlackHole(holes.length, d); holes.push(b); return b; },
    addGalaxy: (d, make) => make(d, 1000),
    addDeepSky: (d, make) => make(d, 1000),
    existing: () => null as SpaceObject | null,
  };
}

async function until(f: () => boolean, ms = 10000): Promise<void> {
  const t0 = Date.now();
  while (!f()) {
    if (Date.now() - t0 > ms) throw new Error('timeout');
    await new Promise((r) => setTimeout(r, 5));
  }
}
