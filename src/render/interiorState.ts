import type { Galaxy } from '../universe/Galaxies';
import type { GalaxyModel } from './GalaxiesLayer';
import type { InteriorFrame } from './GalaxyInterior';

/**
 * Shared between GalaxiesLayer (which owns the galaxies and their models) and ProceduralStarLayer
 * (which draws the stars): the galaxy being entered, how far its stars have faded in, and the
 * share of its light the drawn stars carry as a function of distance from the eye (`F`, over
 * log10(pc) from F_LOG0 in steps of F_STEP), which the volume leaves out.
 */
export const F_N = 32, F_LOG0 = -0.5, F_STEP = 0.2;
export const INTERIOR: {
  galaxies: Galaxy[];
  models: Map<Galaxy, GalaxyModel> | null;
  frames: Map<number, InteriorFrame>;
  active: { gi: number; w: number; F: Float32Array } | null;
} = { galaxies: [], models: null, frames: new Map(), active: null };

