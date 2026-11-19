/**
 * Search over the catalogue of real objects (public/data/catalog, pipeline/build_catalog.py):
 * ~200,000 stars, white and brown dwarfs, pulsars, TESS planet hosts, X-ray binaries, quasars,
 * galaxies, star clusters and nebulae, under ~357,000 names and designations.
 *
 * The index is a list of names sorted by their normalised key (`normKey`, identical to the
 * pipeline's `norm`), split into files of 4,000 lines whose first keys are in the manifest. A
 * query loads only the one to three files that can hold keys starting with it, so the first
 * results arrive after fetching ~60 kB. Records (positions and properties) are in per-category
 * files of 2,000 rows, fetched for the results that are shown.
 *
 * No DOM: usable in a worker and in tests (pass a fetch replacement).
 */

const GREEK: Record<string, string> = {
  'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta', 'ι': 'iota',
  'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu', 'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron', 'π': 'pi', 'ρ': 'rho', 'σ': 'sigma', 'ς': 'sigma',
  'τ': 'tau', 'υ': 'upsilon', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega',
};

/** Search key of a name: lower case, Greek letters spelled out, no accents, Gliese/Gl/GJ and Messier unified, only a-z0-9. */
export function normKey(s: string): string {
  let t = '';
  for (const c of s.toLowerCase()) t += GREEK[c] ?? c;
  t = t.normalize('NFKD').replace(/\p{M}/gu, '');
  t = t.replace(/^(gliese|gl|gj)[\s_.-]*(?=\d)/, 'gj').replace(/^messier[\s_.-]*(?=\d)/, 'm');
  return t.replace(/[^a-z0-9]/g, '');
}

export type CatCode = 's' | 'w' | 'd' | 'p' | 't' | 'x' | 'q' | 'g' | 'c' | 'n';

export interface CatalogCategory {
  name: string;
  label: string;
  count: number;
  chunk: number;
  files: number;
  fields: string[];
  credit: string;
  /** rows to show when browsing (the most notable first) */
  featured: number[];
}

export interface CatalogManifest {
  version: number;
  objects: number;
  keys: number;
  chunk: number;
  indexChunks: string[];
  distFlags: Record<string, string>;
  categories: Record<CatCode, CatalogCategory>;
}

export interface CatalogHit {
  /** the name that matched */
  label: string;
  code: CatCode;
  row: number;
  /** 0 = most notable .. 9 */
  rank: number;
  exact: boolean;
}

/** A record: field name -> text (fields per category, see the manifest). */
export type CatalogRecord = Record<string, string>;

type Fetch = (url: string) => Promise<{ ok: boolean; text(): Promise<string>; json(): Promise<unknown> }>;

interface IndexChunk { keys: string[]; labels: string[]; codes: CatCode[]; rows: Int32Array; ranks: Uint8Array }

const lowerBound = (a: string[], k: string): number => {
  let lo = 0, hi = a.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < k) lo = m + 1; else hi = m; }
  return lo;
};

export class CatalogSearch {
  manifest: CatalogManifest | null = null;
  private loading: Promise<CatalogManifest | null> | null = null;
  private idx = new Map<number, Promise<IndexChunk>>();
  private rec = new Map<string, Promise<CatalogRecord[]>>();
  private recReady = new Map<string, CatalogRecord[]>();
  private fetchFn: Fetch;

  constructor(readonly base: string, fetchFn?: Fetch) {
    this.fetchFn = fetchFn ?? ((u) => fetch(u));
  }

  load(): Promise<CatalogManifest | null> {
    this.loading ??= this.fetchFn(`${this.base}/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<CatalogManifest>) : null))
      .then((m) => (this.manifest = m))
      .catch(() => null);
    return this.loading;
  }

  private chunk(i: number): Promise<IndexChunk> {
    let p = this.idx.get(i);
    if (!p) {
      p = this.fetchFn(`${this.base}/idx/${i}.txt`).then((r) => {
        if (!r.ok) throw new Error(`catalog index ${i}`);
        return r.text();
      }).then((t) => {
        const lines = t.split('\n').filter((l) => l);
        const c: IndexChunk = { keys: [], labels: [], codes: [], rows: new Int32Array(lines.length), ranks: new Uint8Array(lines.length) };
        lines.forEach((l, j) => {
          const f = l.split('\t');
          c.labels.push(f[0]);
          c.keys.push(normKey(f[0]));
          c.codes.push(f[1] as CatCode);
          c.rows[j] = parseInt(f[2], 36);
          c.ranks[j] = Number(f[3]) || 0;
        });
        return c;
      });
      p.catch(() => this.idx.delete(i));
      this.idx.set(i, p);
    }
    return p;
  }

  /**
   * Objects with a name starting with `q` (normalised), best first: exact names, then the more
   * notable, then shorter names. One hit per object.
   */
  async query(q: string, limit = 14): Promise<CatalogHit[]> {
    const m = await this.load();
    const k = normKey(q);
    if (!m || k.length < 2) return [];
    const first = m.indexChunks;
    // the chunks whose key range can hold keys with this prefix (at most three)
    // (equal keys may straddle a chunk boundary, so start one chunk before the first >= k)
    let i = Math.max(0, lowerBound(first, k) - 1);
    const hits: CatalogHit[] = [];
    const seen = new Set<string>();
    for (let n = 0; n < 3 && i < first.length; n++, i++) {
      if (n > 0 && !first[i].startsWith(k) && first[i] > k) break;
      const c = await this.chunk(i);
      for (let j = lowerBound(c.keys, k); j < c.keys.length && c.keys[j].startsWith(k); j++) {
        const id = `${c.codes[j]}:${c.rows[j]}`;
        if (seen.has(id)) continue;
        seen.add(id);
        hits.push({ label: c.labels[j], code: c.codes[j], row: c.rows[j], rank: c.ranks[j], exact: c.keys[j] === k });
        if (hits.length > 600) break;
      }
      if (hits.length > 600) break;
    }
    hits.sort((a, b) => Number(b.exact) - Number(a.exact) || a.rank - b.rank || a.label.length - b.label.length || (a.label < b.label ? -1 : 1));
    return hits.slice(0, limit);
  }

  private recKey(code: CatCode, file: number): string { return `${code}/${file}`; }

  /** The record of a row (null until its file has loaded: see `ensure`). */
  record(code: CatCode, row: number): CatalogRecord | null {
    const c = this.manifest?.categories[code];
    if (!c) return null;
    return this.recReady.get(this.recKey(code, Math.floor(row / c.chunk)))?.[row % c.chunk] ?? null;
  }

  /** Load the records of these rows. */
  async ensure(items: { code: CatCode; row: number }[]): Promise<void> {
    const m = await this.load();
    if (!m) return;
    const files = new Set<string>();
    for (const it of items) {
      const c = m.categories[it.code];
      if (c) files.add(this.recKey(it.code, Math.floor(it.row / c.chunk)));
    }
    await Promise.all([...files].map((f) => {
      let p = this.rec.get(f);
      if (!p) {
        const [code] = f.split('/') as [CatCode];
        const fields = m.categories[code].fields;
        p = this.fetchFn(`${this.base}/rec/${f}.tsv`).then((r) => {
          if (!r.ok) throw new Error(`catalog records ${f}`);
          return r.text();
        }).then((t) => t.split('\n').filter((l) => l).map((l) => {
          const v = l.split('\t');
          const o: CatalogRecord = {};
          fields.forEach((k, i) => { o[k] = v[i] ?? ''; });
          return o;
        }));
        p.then((rows) => this.recReady.set(f, rows)).catch(() => this.rec.delete(f));
        this.rec.set(f, p);
      }
      return p.catch(() => undefined);
    }));
  }
}
