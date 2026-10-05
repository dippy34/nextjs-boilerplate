/**
 * How the maps of the Solar System's planets are shown, so they look as in photographs: the
 * colour balance and saturation of the map (several maps are calibrated or muted: Viking's Mars is
 * pinkish grey, Cassini's Jupiter almost grey, the OPAL Neptune pale), the coloured haze over a
 * giant's clouds at the limb, Minnaert limb darkening of the cloud decks, and Earth's aurorae.
 *
 * `grade` multiplies the linear map colour; it is normalised here to unit luminance, so the
 * albedo (and the map's brightness) stays as measured: only the hue moves.
 */
export interface PlanetLook {
  grade: [number, number, number];
  sat: number;
  haze: [number, number, number];
  minnaert: number;
  aurora: number;
}

const NONE: PlanetLook = { grade: [1, 1, 1], sat: 1, haze: [0, 0, 0], minnaert: 1, aurora: 0 };

const LOOKS: Record<string, Partial<PlanetLook>> = {
  // Earth: Blue Marble is true colour already; a hint more saturation, aurorae
  Earth: { sat: 1.08, aurora: 1 },
  // Mars: butterscotch (HST and Mars Express true colour) from the Viking mosaic's pinkish grey
  Mars: { grade: [1.34, 0.9, 0.42], sat: 1.15, haze: [0.012, 0.008, 0.006] },
  // Jupiter: orange-brown belts and cream zones (Juno / Cassini true colour)
  Jupiter: { grade: [1.08, 0.99, 0.84], sat: 1.75, haze: [0.035, 0.032, 0.03], minnaert: 1.12 },
  // Saturn: pale gold
  Saturn: { grade: [1.04, 1.0, 0.9], sat: 1.25, haze: [0.035, 0.032, 0.026], minnaert: 1.1 },
  // Uranus: pale cyan, a thick haze at the limb
  Uranus: { grade: [0.95, 1.0, 1.03], sat: 1.1, haze: [0.03, 0.05, 0.055], minnaert: 1.05 },
  // Neptune: azure (between the recalibrated pale blue and Voyager's deep blue)
  Neptune: { grade: [0.72, 0.96, 1.6], sat: 1.25, haze: [0.02, 0.04, 0.07], minnaert: 1.05 },
  // Venus: pale yellow cloud tops
  Venus: { grade: [1.05, 1.0, 0.86], sat: 1.1, haze: [0.04, 0.038, 0.03] },
  // Titan: orange haze
  Titan: { haze: [0.05, 0.03, 0.008] },
};

/** luminance of a linear RGB colour */
const lum = (c: [number, number, number]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/** The look of a planet by name (neutral for bodies without an entry). */
export function planetLook(name: string): PlanetLook {
  const l = { ...NONE, ...LOOKS[name] };
  const L = lum(l.grade);
  return { ...l, grade: [l.grade[0] / L, l.grade[1] / L, l.grade[2] / L] };
}
