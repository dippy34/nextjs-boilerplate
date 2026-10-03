# Credits, data sources and licences

Everything below was downloaded from the original provider by the scripts in `pipeline/`; no
astronomical values were typed in by hand. Licences were checked at the source on 2026-10-01.
No SpaceEngine files, textures or data are used.

## Star catalogues

| Dataset | Use | Licence | Files |
|---|---|---|---|
| **AT-HYG v4.0** (Augmented Tycho-HYG), David Nash / astronexus — <https://codeberg.org/astronexus/athyg> | 2,532,538 stars: positions, distances (mostly Gaia DR3), magnitudes, colours, IDs, IAU names | **CC BY-SA 4.0** | `public/data/stars/` |
| **HYG v4.4**, David Nash / astronexus — <https://codeberg.org/astronexus/hyg> | Hipparcos-based V magnitudes and B−V for AT-HYG stars whose Tycho photometry saturates | **CC BY-SA 4.0** | merged into `public/data/stars/` |
| **Gaia DR3**, ESA/Gaia/DPAC — queried via the ESA Gaia Archive TAP service <https://gea.esac.esa.int/tap-server/tap> | 218,626 additional stars within 100 pc (parallax > 10 mas, parallax/error > 10, RUWE < 1.4) not in AT-HYG | **CC BY-NC 3.0 IGO** (non-commercial) — <https://www.cosmos.esa.int/web/gaia-users/license> | `public/data/stars-gaia/` (kept separate; disable with `?gaia=0`) |

The derived star tiles in `public/data/stars/` are an adaptation of AT-HYG/HYG and are shared under
CC BY-SA 4.0. The tiles in `public/data/stars-gaia/` are an adaptation of Gaia DR3 and may only be
used non-commercially.

Required Gaia acknowledgement: *This work has made use of data from the European Space Agency (ESA)
mission Gaia (https://www.cosmos.esa.int/gaia), processed by the Gaia Data Processing and Analysis
Consortium (DPAC, https://www.cosmos.esa.int/web/gaia/dpac/consortium). Funding for the DPAC has
been provided by national institutions, in particular the institutions participating in the Gaia
Multilateral Agreement.* AT-HYG itself incorporates Tycho-2, Hipparcos, Yale BSC, Gliese and Gaia DR3
data; see its ACKNOWLEDGMENTS.

The G→V and BP−RP→T<sub>eff</sub> relations used for the Gaia stars were fitted by the pipeline on the
overlap between the Gaia query and AT-HYG (and on Gaia GSP-Phot temperatures); B−V→T<sub>eff</sub> uses
Ballesteros (2012), *EPL* 97, 34008.

## Solar System

All from NASA/JPL or NASA PDS (U.S. Government works, freely available):

* **JPL DE442S** planetary ephemeris (NAIF generic kernel `de442s.bsp`) — <https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/>
* **NAIF PCK** `pck00011.tpc` (IAU WGCCRE rotation models, radii), `gm_de440.tpc` (GM), `naif0012.tls` (leap seconds) — <https://naif.jpl.nasa.gov/pub/naif/generic_kernels/>
* **JPL Solar System Dynamics**: planetary satellite mean elements and physical parameters, planetary physical parameters, Keplerian elements for approximate planet positions (E. M. Standish) — <https://ssd.jpl.nasa.gov/>
* **JPL Horizons API** — state vectors and osculating elements used to calibrate and validate moon orbits, and as test reference data — <https://ssd.jpl.nasa.gov/horizons/>
* **JPL Small-Body Database Query API** — osculating elements and physical data of asteroids, TNOs and comets — <https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html>
  Comet comas and tails (`src/render/CometTails.ts`) are a model driven by each comet's total-magnitude
  parameters M1 and K1 from this database: the coma radius grows with the comet's brightness at its
  distance from the Sun (about 10^5 km for a bright comet near 1 AU), the ion tail points away from the
  Sun and the dust tail lags along the orbit. Their integrated light follows the catalogue magnitude.
  Up close, the nucleus is drawn with the catalogue diameter where known (otherwise 4 km), a generated
  two-lobed shape in the manner of 67P/Churyumov-Gerasimenko, a dark surface (albedo about 0.05, as
  Rosetta measured for 67P) and gas jets on the sunlit side.
* **PDS Ring-Moon Systems Node**, volume VG_2801: Voyager 2 PPS δ Scorpii occultation, Saturn ring normal opacity at 10 km resolution (`PS1P01.TAB`) — <https://pds-rings.seti.org/>
  Inside the rings (`src/render/RingParticles.ts`) the number of drawn particles per area follows this
  optical depth; their sizes follow a power law with exponent about −3 between centimetres and metres
  (Zebker, Marouf & Tyler 1985, *Icarus* 64, 531; drawn from 0.25 to 7 m), in a layer of the order of
  ten metres thick. Positions, shapes and the (static, co-moving) layout are generated.

## Planetary maps (`public/data/textures/`)

Per-map source URLs and credits are in `public/data/textures/manifest.json` and shown in the app.
Maps marked "8k" have a high-resolution tier that is loaded only while the body fills a large part of
the view and is freed again afterwards.

The moons, dwarf planets and asteroids are 4096 × 2048 maps area-averaged from the **full-resolution
USGS Astrogeology mosaics** (`pipeline/fetch_moons_hires.py`; uncompressed GeoTIFFs read with HTTP range
requests): Europa (500 m), Ganymede (1.4 km, colour), Callisto (1 km), Io (1 km, colour), Titan (4 km),
Enceladus (110 m), Tethys (293 m), Dione (154 m), Rhea (417 m), Iapetus (783 m), Triton (600 m, colour),
Pluto and Charon (300 m), Ceres (Dawn, 20 px/deg), Vesta (Dawn, 74 px/deg) — NASA/JPL/USGS/SSI/JHUAPL/
SwRI/DLR, public domain — and **Phobos** (Mars Express HRSC SRC global mosaic, 16 px/deg; ESA/DLR/FU
Berlin, CC BY-SA 3.0 IGO). Each was aligned to the earlier preview by correlation.

Bodies without a map (most small moons, asteroids and Kuiper-belt objects) get a **procedural surface**
seeded by their name: crater fields at several scales, two-tone terrain, bright fresh ejecta, cracks on
icy bodies, and an irregular shape for bodies under ~200 km. Colours follow the measured albedo where
there is one (icy beyond Jupiter otherwise; Kuiper-belt objects from grey to tholin-red). Mapped bodies get
fine procedural craters below the map's resolution when seen very close. These are invented details.

| Body | Source | Credit / licence |
|---|---|---|
| Earth (day, 4k + 8k) | NASA Earth Observatory, Blue Marble: Next Generation, Oct 2004, 21600×10800 | NASA Earth Observatory / Reto Stöckli — public domain |
| Earth (night) | NASA Earth Observatory, Black Marble 2016 | NASA Earth Observatory / Suomi NPP VIIRS — public domain |
| Earth (clouds) | NASA Earth Observatory Blue Marble cloud composite | NASA / MODIS — public domain |
| Earth (relief + water mask) | **NOAA NCEI ETOPO 2022** 60″ surface elevation, DOI 10.25921/fd45-gt74 | NOAA — U.S. Government work, no restrictions |
| Moon (4k + 8k) | NASA SVS CGI Moon Kit (LRO LROC WAC colour) | NASA's Scientific Visualization Studio — public domain |
| Moon (relief) | NASA SVS CGI Moon Kit, LRO **LOLA** LDEM 16 px/deg | NASA SVS / LOLA team — public domain |
| Mercury (2k + 8k) | MESSENGER MDIS BDR global mosaic, 166 m/px (range-read from the USGS GeoTIFF) | NASA/JHUAPL/Carnegie Institution of Washington, via USGS Astrogeology — public domain |
| Mercury (relief) | MESSENGER USGS global DEM, 665 m/px v2 | NASA/JHUAPL/CIW, USGS — public domain |
| Mars (2k + 8k) | Viking MDIM 2.1 global colour mosaic, 232 m/px (range-read from the USGS GeoTIFF) | NASA/JPL/USGS — public domain |
| Mars (relief) | MGS **MOLA** global DEM, 463 m/px | NASA/JPL/GSFC, via USGS Astrogeology — public domain |
| Jupiter | Cassini cylindrical map PIA07782 (full 3601×1801) | NASA/JPL/Space Science Institute |
| **Saturn, Uranus, Neptune** | **Hubble OPAL** global maps, 2025 (Saturn 2025a F631N/F502N/F395N, Uranus 2025a and Neptune 2025b F657N/F547M/F467M), STScI MAST HLSP, DOI 10.17909/T9G593 | NASA/ESA Hubble, OPAL program (PI A. Simon) — **CC BY 4.0** |
| Io, Europa, Ganymede, Callisto | Galileo SSI / Voyager global mosaics | NASA/JPL/USGS |
| Titan surface, Enceladus, Tethys, Dione, Rhea, Iapetus | Cassini ISS (–Voyager) global mosaics | NASA/JPL/Space Science Institute, via USGS Astrogeology |
| Triton | Voyager 2 global colour mosaic | NASA/JPL/USGS |
| Pluto, Charon | New Horizons LORRI/MVIC global mosaics | NASA/JHUAPL/SwRI, via USGS Astrogeology |
| Ceres, Vesta | Dawn FC global mosaics | NASA/JPL-Caltech/UCLA/MPS/DLR/IDA, via USGS Astrogeology |
| Venus (disk colour) | Mariner 10 PIA23791 | NASA/JPL-Caltech |

OPAL acknowledgement: *This work used data acquired from the NASA/ESA HST Space Telescope, associated
with OPAL program (PI: Simon, GO13937), and archived by the Space Telescope Science Institute, which is
operated by the Association of Universities for Research in Astronomy, Inc., under NASA contract NAS
5-26555. All maps are available at http://dx.doi.org/10.17909/T9G593.* The OPAL maps supply the cloud
structure (each filter relative to its mean, limb-corrupted and unobserved latitudes masked and filled
zonally, planetographic latitude converted to the engine's ellipsoid); the overall colour comes from
the spectra below.

**Giant-planet and Titan colours**: E. Karkoschka (1998), *Icarus* 133, 134 — full-disk albedo spectra
300–1050 nm from ESO, 1995 (NASA PDS Atmospheres Node, volume GBAT_0001, `1995LOW.TAB`), integrated
against the CIE 1931 colour-matching functions and a 5772 K solar spectrum. Titan's disk is shaded
with its spectrum (the haze top) instead of the Cassini near-infrared surface map.

**Relief maps** are tangent-space normal maps computed from the elevation models above, with slopes
exaggerated ×2 (Moon, Mars, Mercury) and ×4 (Earth) so terrain reads at planet scale (stated in the
manifest). **Menu thumbnails** (`thumbs.jpg`) are rendered from these maps by `build_thumbnails.py`.

USGS Astrogeology products and NASA imagery are U.S. Government works. Under the JPL image use policy
(<https://www.jpl.nasa.gov/jpl-image-use-policy>) JPL images may be used for any purpose with credit
("Courtesy NASA/JPL-Caltech" unless the caption says otherwise); images owned by third parties may
carry restrictions on commercial use — check the caption of each PIA image before commercial use.

## Sky (`public/data/sky/`)

* **NASA SVS, Deep Star Maps 2020** (ID 4851, E. Wright), `milkyway_2020_4k.exr` — the star map of
  1.7 billion Hipparcos-2, Tycho-2 and Gaia DR2 stars with the bright (Hipparcos/Tycho) stars left out,
  i.e. the unresolved Milky Way behind the catalogue stars the engine draws itself.
  Credit: NASA/Goddard Space Flight Center Scientific Visualization Studio; Gaia DR2: ESA/Gaia/DPAC.
  NASA SVS content is public domain (<https://svs.gsfc.nasa.gov/help/>). The map is display-referred
  (clipped, non-linear: measured pixel sum ∝ flux^1.65 against AT-HYG), so its brightness in the engine is
  an artistic gain tied to the star exposure; structure and colour are the map's.

## Atmospheres

* Scale heights, surface (or 1-bar) pressures and temperatures: **NASA NSSDCA Planetary Fact Sheets**
  (<https://nssdc.gsfc.nasa.gov/planetary/factsheet/>), `pipeline/fetch_atmospheres.py`.
* Rayleigh scattering scales the Earth sea-level coefficients of Bruneton & Neyret (2008, *Computer
  Graphics Forum* 27(4)) by number density and gas refractivity. Aerosols (Earth haze, Mars dust, Venus
  upper haze, Titan haze), Venus cloud-top conditions and Titan's surface values (Huygens HASI,
  Fulchignoni et al. 2005, *Nature* 438, 785) are **approximate model parameters typed into
  `src/render/Atmospheres.ts`**, not downloaded data.
* Sun-path optical depth: Chapman grazing-incidence function in the closed form popularised by
  C. Schüler (GPU Pro 3, 2012).
* Temperate and ocean planets of other stars (generated ones, and catalogued ones, whose surfaces
  are unknown and drawn with a generated look) get an Earth-like atmosphere: the same N2 Rayleigh
  coefficients scaled to an assumed surface pressure (0.4–2.6 bar, varied per planet), a scale height
  from the planet's equilibrium temperature and gravity (mean molecular weight 29), and Earth-like
  haze. Plausible numbers, not measurements.

## Stars up close (`src/render/StarLook.ts`)

Each star's surface is generated from its temperature, size and luminosity plus a per-star seed:
granulation scaled by the pressure scale height (∝ T/g; a handful of giant cells on red supergiants, as
in simulations of Betelgeuse such as Freytag et al. 2002), quadratic limb darkening loosely following
Claret's V-band coefficients, starspots, faculae and flares by activity (strongest in cool dwarfs),
flattening and gravity darkening for fast-rotating hot stars (as measured by interferometry for Vega
and Altair). The corona glow and prominences are artistic.

## Black holes (`public/data/blackholes.json`, `pipeline/build_blackholes.py`)

* **BlackCAT** — Corral-Santana et al. 2016, *A&A* 587, A61, via CDS VizieR (J/A+A/587/A61, tables A1
  and A4): positions, distances, black-hole masses, orbital periods, mass ratios, inclinations and
  companion spectral types of the dynamically confirmed stellar black holes.
* **SIMBAD** (CDS, Strasbourg) TAP service: positions (and parallaxes where no distance is published) of
  Sgr A\*, M87, Cyg X-1 and the Gaia BH1–3 companions (queried by Gaia DR3 source id).
* Companion temperatures from spectral types: E. Mamajek's online table "A Modern Mean Dwarf Stellar
  Color and Effective Temperature Sequence" (Pecaut & Mamajek 2013, *ApJS* 208, 9).
* Published values typed into the pipeline, each cited in the data file: Sgr A\* — GRAVITY
  Collaboration 2022, *A&A* 657, L12; M87\* — Event Horizon Telescope Collaboration 2019, *ApJL* 875, L6;
  Cyg X-1 — Miller-Jones et al. 2021, *Science* 371, 1046 and Orosz et al. 2011, *ApJ* 742, 84;
  Gaia BH1/BH2 — El-Badry et al. 2023, *MNRAS* 518, 1057 and 521, 4323; Gaia BH3 — Gaia Collaboration,
  Panuzzo et al. 2024, *A&A* 686, L2.
* Companion radii of the X-ray binaries: Roche-lobe radius formula of P. P. Eggleton 1983, *ApJ* 268, 368.
* Rendering (`src/render/shaders/blackhole.ts`): photons traced in the Schwarzschild metric (Binet
  equation with the relativistic term); weak-field deflection 4GM/(c²b) with the second-order term
  15πG²M²/(4c⁴b²); thin-disk temperature profile of Shakura & Sunyaev 1973 / Novikov & Thorne 1973 with a
  zero-torque inner edge at the ISCO; Doppler and gravitational shifts applied to a blackbody spectrum.
  Disk orientations follow the catalogue inclinations (the node on the sky is unknown and fixed
  arbitrarily per object). Cygnus X-1 and GRS 1915+105 (persistent sources) are shown bright
  (inner disk 1–1.6 × 10⁷ K); the transient X-ray binaries in quiescence with cool disks of their own
  temperature (~6,000–12,000 K, from mass and a seed); binary disks show two-armed tidal spiral shocks.
  Jets: M87's optical jet (parabolic collimation r ∝ z^0.58, Asada & Nakamura 2012, *ApJL* 745, L28; the
  counter-jet is Doppler-dimmed) and the radio jets of Cygnus X-1 and GRS 1915+105 drawn faintly.
  The disks of
  Sgr A\* and M87\* are illustrative — their real accretion flows are faint and radiate mostly in
  radio. The streaky gas texture and its slowed-down rotation are procedural.

## Planets of other stars (`public/data/exoplanets.json`, `pipeline/build_exoplanets.py`)

| Dataset | Use | Licence | Files |
|---|---|---|---|
| **NASA Exoplanet Archive**, Planetary Systems Composite Parameters (`pscomppars`), queried via TAP <https://exoplanetarchive.ipac.caltech.edu/TAP> | 6,333 confirmed planets in 4,743 systems: orbits, sizes, masses, temperatures, discovery method and year, host-star properties and designations | US government work, no restrictions; acknowledgement requested (below) | `public/data/exoplanets.json` |

Required acknowledgement: *This research has made use of the NASA Exoplanet Archive, which is
operated by the California Institute of Technology, under contract with the National Aeronautics and
Space Administration under the Exoplanet Exploration Program.*

Values the archive lacks are filled in and flagged as estimated in the app: semi-major axis or period
from Kepler's third law, radius from mass (or the reverse) with the mean mass–radius relation of
Chen & Kipping (2017), *ApJ* 834, 17; eccentricity 0 and inclination 90° when unknown. The orientation
of each orbit on the sky and the planet's phase are mostly unmeasured, so the engine chooses them per
planet, deterministically (transit times set the phase where the archive has them).

Every other star gets a **generated** planetary system, labelled as such in the app. Planet counts,
sizes and spacings follow published occurrence statistics in spirit (small planets common around
Sun-like and M dwarfs, e.g. Fressin et al. 2013 *ApJ* 766, 81; Dressing & Charbonneau 2015 *ApJ* 807,
45; hot Jupiters around ~1 % of Sun-like stars, Wright et al. 2012 *ApJ* 753, 160), and surface
types follow from size and equilibrium temperature. Planet surfaces, clouds and rings are procedural
(`src/render/shaders/planet.ts`); no images are used.

## Spacecraft (`public/data/spacecraft.json`, `pipeline/build_spacecraft.py`)

| Dataset | Use | Licence | Files |
|---|---|---|---|
| **JPL Horizons** (NASA/JPL Solar System Dynamics), <https://ssd.jpl.nasa.gov/horizons/> | Trajectories of Voyager 1 & 2, New Horizons, Parker Solar Probe, Europa Clipper, Juice, Lucy, Psyche (barycentric state vectors) and the James Webb Space Telescope (Earth-centred); osculating orbital elements of the ISS and the Hubble Space Telescope | U.S. Government work (public domain) | `public/data/spacecraft.json` |

Trajectories are interpolated (cubic Hermite) between the Horizons samples. The ISS and Hubble are
propagated from one set of osculating elements (epoch 2026-10-01) with the Earth's J2 nodal and apsidal
precession, so their along-track positions drift away from that date. The spacecraft models are built
in code from simple shapes at their real sizes (`src/render/SpacecraftLayer.ts`); no 3D model files
are used. Mission descriptions summarise public NASA/ESA mission facts.

## Other galaxies (`public/data/galaxies.json`, `pipeline/build_galaxies.py`)

| Dataset | Use | Licence | Files |
|---|---|---|---|
| **SIMBAD** astronomical database (CDS, Strasbourg; Wenger et al. 2000, *A&AS* 143, 9), via TAP | Positions, apparent sizes, position angles and morphological types of 47 nearby galaxies; distances (median of the published redshift-independent measurements in SIMBAD's `mesDistance` table); V magnitudes | Free for scientific and educational use with acknowledgement | `public/data/galaxies.json` |

Acknowledgement: *This research has made use of the SIMBAD database, operated at CDS, Strasbourg,
France.* Each galaxy is drawn procedurally (`src/render/GalaxiesLayer.ts`): a disc with spiral arms,
bar, dust and star-forming knots chosen from its type, plus a bulge; ellipticals and dwarfs as a
soft spheroid. The inclination follows from the catalogued axis ratio. No galaxy images are used.

## Nebulae and star clusters (`public/data/deepsky.json`, `pipeline/build_deepsky.py`)

| Dataset | Use | Licence | Files |
|---|---|---|---|
| **SIMBAD** (CDS, Strasbourg), via TAP | Positions, sizes, types and distances (median of `mesDistance` measurements, or parallax) of 41 nebulae and star clusters | Free with acknowledgement (above) | `public/data/deepsky.json` |
| **Sharpless (1959)** catalogue of H II regions, *ApJS* 4, 257 — VizieR VII/20 | Diameters of the Lagoon, Eagle, Omega, Rosette, North America, California and Heart nebulae (SIMBAD lists none) | Free with acknowledgement (VizieR) | merged into `deepsky.json` |
| **Rodgers, Campbell & Whiteoak (1960)** H-alpha emission regions, *MNRAS* 121, 103 — VizieR VII/216 | Size of the Carina Nebula (RCW 53) | Free with acknowledgement (VizieR) | merged |

Two published values fill gaps: the distance of the Cygnus Loop (735 pc; Fesen et al. 2018, *MNRAS*
481, 1786) and the tidal radius of the Hyades (10 pc; Perryman et al. 1998, *A&A* 331, 81). Some
nebulae take the distance of their ionising cluster (Lagoon: NGC 6530), of their host galaxy
(Tarantula: the LMC) or of their ionising star (California: ξ Per), all from SIMBAD. Nebulae are drawn
procedurally (`src/render/DeepSkyLayer.ts`); globular-cluster stars are generated (Plummer-like
density, an old population's luminosity mix); open clusters are shown with their real catalogue stars.
*This research has made use of the VizieR catalogue access tool, CDS, Strasbourg, France.*

## Close-up map tiles (`public/data/tiles/`, `pipeline/build_tiles.py`)

Tile pyramids (512-pixel JPEG tiles, up to 16384 x 8192) cut from the same full-resolution sources
as the base maps listed above, plus the NASA SVS CGI Moon Kit LROC WAC colour mosaic at 16k
(`lroc_color_poles_16k.tif`, <https://svs.gsfc.nasa.gov/4720>, public domain). Each pyramid is
aligned to its base map by correlation; bodies whose source is no sharper than the 4k base map
(Titan, Iapetus, Phobos) or that failed the alignment check (Pluto, Charon) have none.

## Landing terrain (`public/data/terrain/`, `pipeline/build_terrain.py`, `src/universe/Terrain.ts`)

Real 3D ground is built under the explorer near solid worlds. Large-scale heights are real
elevation models, resampled to 2048 x 1024 (about 5-10 km per sample) and stored as 16-bit
heights in PNG files; all are public domain (U.S. Government work):

- **Moon**: LRO LOLA gridded elevation, LDEM 16 ppd, NASA SVS CGI Moon Kit
  (`ldem_16_uint.tif`, <https://svs.gsfc.nasa.gov/4720>).
- **Mars**: MGS MOLA global DEM 463 m (NASA/JPL/GSFC), via USGS Astrogeology
  (`Mars_MGS_MOLA_DEM_mosaic_global_463m.tif`).
- **Mercury**: MESSENGER USGS global DEM 665 m v2 (NASA/JHUAPL/CIW), via USGS Astrogeology
  (`Mercury_Messenger_USGS_DEM_Global_665m_v2.tif`).
- **Earth**: NOAA NCEI ETOPO 2022 60 arc-second Global Relief Model (surface elevation),
  DOI 10.25921/fd45-gt74. Water (height at or below 0) is drawn as flat sea at sea level, so
  depressions such as the Dead Sea and the Caspian are flattened to 0 m.

Around the landmarks, sharper regional patches (`public/data/terrain/patches/`,
`pipeline/build_terrain_patches.py`) take over from the global maps, cut row by row with HTTP range
requests from:

- **Moon**: LRO LOLA gridded elevation `LDEM_128` (128 pixels per degree, about 237 m), PDS
  Geosciences Node, <https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/>
  (Apollo 11 site, Tycho, Copernicus).
- **Mars**: the MOLA 463 m DEM above at full or half resolution (Olympus Mons, Valles Marineris,
  Gale and Jezero craters).
- **Earth**: ETOPO 2022 15 arc-second (about 460 m) surface elevation tiles, NOAA NCEI,
  <https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/15s/15s_surface_elev_gtif/>
  (Mount Everest, the Grand Canyon, Kilimanjaro, the Matterhorn, Mauna Kea).

Landmark coordinates (`src/universe/Landmarks.ts`): the USGS/IAU Gazetteer of Planetary Nomenclature
(<https://planetarynames.wr.usgs.gov/>) for feature centres; the Apollo 11, Curiosity and Perseverance
landing sites as published by NASA and the mission teams; on Earth, the summits' commonly published
positions and heights (Everest 8,849 m, the 2020 China-Nepal survey). Their ground elevations are
rounded values read from the elevation models above.

Relief finer than these models, and all relief on other solid moons and dwarf planets, is
generated: fractal hills and crater fields (bowls with raised rims; depth-to-diameter 0.16 for small
craters and 0.09 for large ones, somewhat shallower than fresh lunar craters, about 0.2 for simple
craters in Pike 1977, as most craters are worn). It is plausible, not mapped.

## The Milky Way model and procedural stars (`src/universe/Galaxy.ts`, `ProceduralStars.ts`)

A parametric model (parameters typed in, not downloaded data), after published values:
* Distance to the Galactic centre R0 = 8277 pc and the centre's position: GRAVITY Collaboration 2022
  (*A&A* 657, L12) and SIMBAD (Sgr A\*).
* Thin/thick disk scale lengths and heights: Bland-Hawthorn & Gerhard 2016, *ARA&A* 54, 529 (review).
* Bar/bulge: the boxy "G2" density of Dwek et al. 1995, *ApJ* 445, 716, oriented as in Wegg & Gerhard
  2013, *MNRAS* 435, 1874 (27°).
* Nuclear star cluster: mass and size after Schödel et al. 2014, *A&A* 566, A47.
* Spiral arms: four logarithmic arms with a 12° pitch placed roughly as in Reid et al. 2019, *ApJ* 885,
  131, plus the local (Orion) spur.
* Dust: exponential layer (scale height 110 pc) normalised to ~0.8 mag of visual extinction per kpc
  near the Sun; colour dependence from Cardelli, Clayton & Mathis 1989, *ApJ* 345, 245.
* Stellar luminosity function (stars per pc³ per magnitude): rounded values of the usual local
  function (Bahcall & Soneira 1980, *ApJS* 44, 73; Reid, Gizis & Hawley 2002, *AJ* 124, 2721).
* The glow's brightness is calibrated against the NASA SVS map seen from the Sun (galactic latitudes
  2–5°), and its clumps (dust clouds, star clouds, H II knots) are procedural noise.
* Procedural stars are generated only where no catalogue has them: beyond 100 pc from the Sun and
  fainter than V = 11 as seen from the Sun, allowing for dust.

## Algorithms and code

* [three.js](https://threejs.org/) (MIT), [Vite](https://vite.dev/) (MIT), [jplephem](https://github.com/brandon-rhodes/python-jplephem) (MIT, pipeline), NumPy, Pillow, Requests, rasterio/GDAL, OpenEXR, Astropy (pipeline).
* Testing only (not shipped): [IWER](https://github.com/meta-quest/immersive-web-emulation-runtime) — Meta's WebXR emulator (MIT), [Playwright](https://playwright.dev/) (Apache-2.0), [Vitest](https://vitest.dev/) (MIT).
* ACES filmic curve fit: Stephen Hill, BakingLab (MIT).
* Bloom downsampling filter: J. Jimenez, *Next Generation Post Processing in Call of Duty: Advanced Warfare*, SIGGRAPH 2014.
* CIE 1931 colour-matching function fit: Wyman, Sloan & Shirley, *JCGT* 2(2), 2013.
* IAU H,G asteroid photometric system: Bowell et al. 1989.
* IAU rotation models: Archinal et al. (IAU WGCCRE), as distributed in NAIF pck00011.
* Galactic frame: Hipparcos/ICRS realisation of the IAU 1958 Galactic system (ESA 1997).

## Licence of this repository

Source code: MIT (see `LICENSE`). Data files keep the licences of their sources as listed above.
