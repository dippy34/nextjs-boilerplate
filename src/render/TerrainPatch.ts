import { PlanetTerrain } from './PlanetTerrain';

export { cameraBodyFixed, type TerrainCandidate } from './PlanetTerrain';

/**
 * The old single landing patch was replaced by planet-wide level-of-detail terrain
 * (render/PlanetTerrain.ts). This name stays for the modules that still import it; `threshold`
 * here is the altitude gate of terrain candidates (ExoPlanetLayer offers worlds below threshold x 1.2),
 * so every solid world gets terrain from the same distance.
 */
export class TerrainPatch extends PlanetTerrain {
  static override threshold(g: { radius: number }): number {
    return PlanetTerrain.reach(g) / 1.2;
  }
}
