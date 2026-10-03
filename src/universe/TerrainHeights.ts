import type { Vector3 } from 'three';
import { ExoGround } from './ExoTerrain';
import type { ExoPlanet } from './Planets';
import { type Ground, TerrainSource } from './Terrain';
import type { HeightFn } from './TerrainTiles';

/**
 * A world's height function as plain data, so that a Web Worker can rebuild exactly the same
 * function the main thread has (workers/terrainTiles.worker.ts). The heights code itself is not
 * copied: the worker runs TerrainSource.height / ExoGround.height on the transferred state.
 */
export type HeightSpec =
  | {
      kind: 'body'; name: string; radius: number; radii: number[]; craters: number;
      /** the global elevation model (TerrainSource's HeightMap without its filtered levels) */
      key: string | null; manifestMap: unknown; map: unknown;
      /** sharper regional patches loaded so far (with their filtered levels) */
      patches: unknown[];
    }
  | { kind: 'exo'; name: string; radius: number; type: number; seed: number; seaLevel: number; craters: number; lite: boolean };

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Plain-data description of `g`'s heights, or null if it is not a kind the worker knows. */
export function heightSpec(g: Ground, source: TerrainSource | null): HeightSpec | null {
  if (g instanceof ExoGround) {
    const e = g as any;
    return { kind: 'exo', name: g.name, radius: g.radius, type: e.type, seed: e.seed, seaLevel: e.seaLevel, craters: e.craters, lite: g.lite };
  }
  if (!source) return null;
  const s = source as any;
  const body = g.owner as any;
  if (!s.grounds?.get?.(body) || s.grounds.get(body) !== g) return null;
  const key: string | null = source.keyOf(body);
  let map: any = null;
  if (key) {
    const m = s.maps.get(key);
    if (!m) return null;
    map = { ...m, levels: undefined };
  }
  const patches = key ? [...(s.patches.get(key) ?? [])] : [];
  return {
    kind: 'body', name: body.name, radius: body.radius, radii: [...body.radii], craters: source.craters.get(body) ?? 0.8,
    key, manifestMap: key ? s.manifest.maps[key] : null, map, patches,
  };
}

/** Rebuild the height function of a spec (in a worker, or on the main thread for tests). */
export function heightFromSpec(spec: HeightSpec): HeightFn {
  if (spec.kind === 'exo') {
    const g = new ExoGround({ name: spec.name, radius: spec.radius } as ExoPlanet, spec.type, spec.seed, spec.seaLevel, spec.craters);
    g.lite = spec.lite;
    return (n: Vector3, sp: number) => g.height(n, sp);
  }
  const src = Object.create(TerrainSource.prototype) as any;
  const body = { name: spec.name, radius: spec.radius, radii: spec.radii };
  src.manifest = { maps: spec.key ? { [spec.key]: spec.manifestMap } : {}, patches: [] };
  src.maps = new Map(spec.key && spec.map ? [[spec.key, { ...(spec.map as object) }]] : []);
  src.patches = new Map(spec.key ? [[spec.key, spec.patches]] : []);
  src.craters = new Map([[body, spec.craters]]);
  src.versions = new Map();
  return (n: Vector3, sp: number) => (src as TerrainSource).height(body as any, n, sp);
}
