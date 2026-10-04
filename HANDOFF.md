# Handoff: where the project stands

Branch: `claude/upbeat-allen-8ok26x` · Live: https://dippy34.github.io/nextjs-boilerplate/ ·
Deploy: `bash scripts/deploy-pages.sh` (builds and force-pushes `gh-pages`).

## Goal (from the owner)

A SpaceEngine-like explorer that is **native to VR** (Meta Quest), eventually published on the
Meta Horizon Store (likely as a Unity app built on a Mac; the web version stays as a demo). The owner
wants it to feel like SpaceEngine: visit "everything", black holes, beautiful stars and planets,
smooth travel. Real data wherever it exists (downloaded by `pipeline/`, credited in `CREDITS.md`),
procedural generation for the rest. Never use SpaceEngine's own files.

## Done

* Engine: Three.js + TypeScript + Vite, double-double positions, floating origin, log/reversed-Z depth,
  HDR, JPL DE442S ephemeris, 459 moons, small bodies, 2.75 M real stars (AT-HYG, Gaia DR3 100 pc).
* VR (WebXR): in-headset menu (Planets, Moons, Small worlds, Stars, Search keyboard, Settings), laser
  pointing, hover/haptics, info cards, wrist panel, hands. Renders into the XR render target.
* Visuals: NASA SVS Milky Way, atmospheres, relief maps (LOLA/MOLA/MESSENGER/ETOPO), 8k maps (desktop
  only), Hubble OPAL giants, spectral colours.
* Earlier: autopilot uses a two-stretch log-distance Hermite curve (`src/app/CameraRig.ts`,
  test `tests/rig.test.ts`); destination textures are prefetched and every shader is compiled up front
  (`App.warmUp`, `BodiesLayer.prefetch`), no 8k maps in VR (upload stalls); VR travel = blink, re-aim,
  open eyes, one continuous flight. New star look (`src/render/shaders/psf.ts`): coloured core,
  halo/spikes sized by brightness above the limit, saturation `uSat`.

* Black holes (done, live): `pipeline/build_blackholes.py` -> `public/data/blackholes.json` (23 real
  holes), `src/universe/BlackHoles.ts`, renderer `src/render/BlackHoleLayer.ts` + `shaders/blackhole.ts`
  (per-pixel Schwarzschild tracing over an environment cube captured at the eye, thin disks with
  Doppler/gravitational shifts). Note: three.js maps AlwaysDepth to NeverDepth with a reversed-Z
  buffer — the layer asks for NeverDepth there on purpose.
* Milky Way (done): `src/universe/Galaxy.ts` (parametric model, CPU reference `glowColumn`),
  `src/render/GalaxyLayer.ts` + `shaders/galaxy.ts` (glow ray-marched into a cube, one face per frame
  while moving), `Sky.updateWith` cross-fades the NASA map to it 120-700 pc from the Sun (calibration
  constants in `SkyLayer`). Procedural stars: `src/universe/ProceduralStars.ts` (bands x cells,
  deterministic, no catalogue duplicates), generated in `src/workers/stars.worker.ts`, drawn by
  `src/render/ProceduralStarLayer.ts`. "Milky Way" destination: `src/universe/MilkyWay.ts`.

* Overnight session (2026-10-03), all live:
  - Unique looks: per-star surfaces (`src/render/StarLook.ts`, `StarCorona.ts`), per-hole disks and
    jets (`Jets.ts`), procedural surfaces/lumpy shapes for map-less bodies, 4K moon maps.
    The corona quad is drawn on a scaled-down copy 1e4 km from the eye (a 1e12 m quad around a giant
    was garbled) and starts at the disk's elliptical outline; big star disks are exposed below white
    (`STAR_KEY`/`STAR_CAP` in App.ts). Catalogue stars move from the name list's rounded position to
    the octree's when their tile loads; `App.getStar` carries a parked explorer along.
  - GPU crash fix: point sprites of very distant stars overflowed the clipper (`POINT_CLIP` in
    `shaders/xr.ts` rescales point clip coordinates; meshes at Mpc use a per-object `uClipScale`).
  - Exoplanets: `src/app/Systems.ts` (archive <-> catalogue matching, claims), `src/universe/Planets.ts`
    (generator + Kepler systems), `src/render/ExoPlanetLayer.ts`, `shaders/planet.ts`.
  - Close-up tiles: `pipeline/build_tiles.py` -> `public/data/tiles/` (16k pyramids, 15 bodies),
    runtime `src/render/TileDetail.ts` (detail atlas around the view, bound by `BodiesLayer.updateDetail`).
  - Spacecraft (`pipeline/build_spacecraft.py`, `src/universe/Spacecraft.ts`, `src/render/SpacecraftLayer.ts`),
    galaxies (`build_galaxies.py`, `src/universe/Galaxies.ts`, `src/render/GalaxiesLayer.ts`), nebulae and
    clusters (`build_deepsky.py`, `src/universe/DeepSky.ts`, `src/render/DeepSkyLayer.ts`).
  - Game mode (`src/game/`): `Game.ts` (modes, warp, docking, landing, light), `Cockpit.ts`, `ShipModel.ts`
    (display-referred `litMaterial`), `WarpFx.ts`, `Traffic.ts` + `Station.ts`, `Missions.ts`, `Audio.ts`
    (Web Audio synthesis). CameraRig got `inertia`, `braking`, `thrust`, `stop()`, `gotoRemaining`.
  - VR quality tier: `LITE.uLite` (1 while presenting) trims the heavy procedural shaders.
  - Planet terrain (replaces the old single landing patch): `src/render/PlanetTerrain.ts` — a
    quadtree on the 6 faces of an equi-angular cube on every solid world within 2 radii
    (`PlanetTerrain.reach`), tiles of 64x64 cells (`universe/TerrainTiles.ts`: heights with a border
    for continuous normals, skirts, the parent's shape for geomorphing, relief shadows), split by
    screen-space error (`pixPerCell`), horizon-culled, at most `drawCap` drawn, built in Web Workers
    (`workers/terrainTiles.worker.ts`, `inFlight` jobs a frame; the tile holding the explorer comes
    with its whole column down to the detail wanted, `chain`). The worker rebuilds the same height
    function from plain data (`universe/TerrainHeights.ts`: `TerrainSource`/`ExoGround` state) and
    samples the elevation pyramids (`TerrainSource.elevSample`, below). Tiles morph in from their
    parent's shape and a rebuilt drawn tile morphs from its old shape, so `below()`/`groundRadius()`
    (the drawn triangles, exactly) never jump. The world's sphere is cut away entirely (`uHoleCos`
    -2) while the terrain covers it; the surface shader reads the close-up weight per vertex
    (`tileFragment`: `uHScale` -> `vHScale`, fading out with distance), so far tiles shade like the
    globe. `TerrainPatch.ts` is now an alias kept for importers. Heights: `pipeline/build_terrain.py`
    -> `public/data/terrain/` (coarse global maps), `src/universe/Terrain.ts` (map or pyramid +
    generated hills and craters below their resolution). Shot script: `scripts/shots/terrain-lod.mjs`.
    `App.keepAboveGround` and `computeAltitude` use `TerrainPatch.groundRadius`. Shadows: `aSun`
    is the Sun's clearance over the relief in penumbra widths (ray-marched per vertex, signed),
    and the shaders light a pixel by `clamp(0.5 + vSun, 0, 1)`. Earth: the map's `"sea": 0` makes
    lower ground flat water and limits generated hills to land (more on high ground); the painted
    clouds fade out on descent (`uCloudVis`, set in `Bodies`) while `render/CloudLayer.ts` (a
    sphere 7 km up, same map + generated billows) fades in, clearing again below 12-30 km. Draw order: atmosphere shell (19.8),
    terrain (19.9, transparent pass but opaque), terrain haze (19.95: `ATMO_HAZE_FRAG` on the
    terrain geometry, marching to the real ground), then cockpit/HUD (20+). Earth and Mars get a
    skylight term in BODY_FRAG (`uAtmo`); ground without craters (Earth) gets `bnAt` rock/soil
    detail on the split lattices. Landmarks may set `elev` (viewpoint elevation, degrees): Earth's
    mountains are seen from a few degrees above, across the sunlight.
  - Cockpit HUD (`src/game/HudMarkers.ts`): target bracket, flight-path marker, boresight.
  - Generated planets: `src/universe/ExoTerrain.ts` (CPU copy of EXO_FRAG `terrain()` so ground matches
    colours), Earth-like atmosphere shells for temperate/ocean types (`Atmospheres.updateExo`).
  - Saturn's rings up close: `src/render/RingParticles.ts` (instanced ice, density from the ring
    opacity texture, inertial ring frame from `universe/RingSpot.ts`, which is also the search target).
  - Comets: `src/render/CometTails.ts` (coma/ion/dust quad per active comet, sky display gain; nucleus
    mesh + jets for the nearest one within 30,000 km, fed to the exposure as `nucleusView`).
  - Landmarks: `src/universe/Landmarks.ts` (places with coordinates; search ids `lm:`; VR Places tab).
    Sharper regional heights around them: `pipeline/build_terrain_patches.py` -> `terrain/patches/`,
    loaded by `TerrainSource.nearPatches` (via `Ground.prepare`), blended in `TerrainSource.height`.
  - Tour (T, `App.tourItems` / `prepareTour`: time jumps for the eclipse and the next Jupiter shadow),
    photo mode (U).
  - Eclipses: `BodiesLayer.updateEclipses` picks up to 4 occluders per body; `sunVisible()` in
    `shaders/body.ts` (disc-overlap penumbra, red glow in Earth's shadow); `sunlit` feeds the exposure.
  - Walking: `App.keepAboveGround` keeps eye height within 4 m of the ground unless climbing.
  - Nebula volumes: `DeepSkyLayer` (VOL_FRAG ray-marches the nearest nebula from 8 radii in, replacing
    the billboards). Emission nebulae are a cavity around a young cluster: ridged filaments on the
    walls, teal near the stars, red beyond, dust pillars/lanes; 40 jittered steps (16 in VR).
  - Galaxy clouds: `GalaxiesLayer` turns the nearest galaxy into a 3D cloud from 40 radii in (`fillCloud`:
    disc, arms, bar, bulge, single stars; sprites of fixed size in space, so surface brightness holds
    at any distance and flux is kept below a pixel; distances in the shader are in galaxy radii, as
    metres squared overflow 32-bit floats); the disc picture fades out as the cloud fades in.
  - Galaxy volumes (`GalaxiesLayer`, VOL_FRAG): every galaxy is a box in its catalogued frame, ray-marched
    per pixel (old disc, young clumpy arms with H II knots, bulge, bar; a thinner dust layer that
    absorbs, more in blue); the step follows the height above the mid-plane so thin discs resolve at
    any angle; ellipticals are Sérsic spheroids normalised to the old picture's light (`sersicNorm`).
    The nearest galaxy's cloud sprites are dimmed by the dust in front of them (`dustTau`, exact
    through the dust layer's vertical profile).
  - Generated planet surfaces (`shaders/planet.ts`): warped continents, ridged mountain belts, relief
    shading from finite differences of `terrain()`, octaves down to the pixel (`detail`), climate
    biomes, cyclone clouds with shadows, sheared giant bands. `terrain()` is mirrored in
    `universe/ExoTerrain.ts` (`exoTerrain`); sea level = the quantile of the planet's land fraction
    (`exoQuantile`).
  - Ground materials (`render/Materials.ts`): Poly Haven CC0 scans in two texture arrays (colour ÷ mean,
    normal + height); `groundDetail` in the terrain shaders blends flat/steep/snow materials at three
    scales by slope and height, as detail around the world's own colour. `render/Rocks.ts` scatters
    rocks per body-fixed cell on the drawn ground (`TerrainPatch.groundRadius`).
  - Display curve (`shaders/tone.ts`): the ACES fit applied to luminance only, so hues and
    saturation survive (per-channel ACES bleached mid-tones: Saturn came out off-white); highlights
    above ~60% of white blend towards white. Same curve in the headset via `CustomToneMapping`.
  - Comet tails (`CometTails`, TAIL_FRAG): a box in the comet's frame (x away from the Sun, y in the
    orbit plane behind the motion from the orbital elements, z the orbit normal), in coma radii;
    1/b coma integrated analytically, ion tube with plasma rays and curved, striated dust fan
    ray-marched with steps that shrink near the tube's axis and the fan's plane.
  - Saturn's rings: `shaders/rings.ts` (per-ring particle colour, ringlets below the profile's
    resolution, backscattering phase function with opposition surge, penumbra, Saturnshine). Within
    3 km of the plane `RingParticles.slab` draws the whole ring as a medium (Gaussian layer, σ 4.5 m,
    measured optical depth, sunlight dimmed by the layer, self-gravity wakes) on a sphere around the
    eye; the ice chunks are shaded and fogged by the same layer (`LAYER_GLSL`).
  - Star surfaces: `shaders/star.ts` (arithmetic hash: `sin` of large arguments lined the granules
    up on a grid; granules ~1000 km on the Sun; bright points; mesogranulation); the corona glow
    fades close to a star (`StarCorona`).
  - Milky Way from outside: `MilkyWayVolume` ray-marches the galaxy model per pixel (with H II knots,
    OB associations, dust lanes on the arms' inner edges, feathers) and takes over from the glow cube
    a few kpc outside the disc.
  - Point sources fade in over the last ~1.3 mag above the cut-off (`psf.ts`).
  - Shot scripts for visual review: `scripts/shots/{comet,rings,solar}.mjs`.
  - Spacecraft models (`SpacecraftLayer.parts`): ISS (Sun-tracking arrays), Hubble, JWST, Voyager,
    New Horizons built from parts, baked per finish (`bake`); HULL_FRAG adds cells/foil/quilting/truss
    lattice from the part-local position (`aLoc`).
  - Tests: `scripts/terrain.mjs` (landing terrain, the Tycho / Olympus Mons / Everest patches and the
    atmosphere over terrain, 14 checks),
    `scripts/places.mjs` (rings, comet, lunar eclipse, Jupiter moon shadow, landmarks, inside the
    Orion Nebula).

## Global elevation pyramids (elevation worker)

`pipeline/build_elevation.py` (sources and resumable downloads in `pipeline/elevation_sources.py`,
raw files and int16 work grids in `data-raw/elevation/`, ~25 GB while building) ->
`public/data/elevation/<body>/<level>/<face>-<x>-<y>.png` + `manifest.json`, and `index.json`.
Runtime: `src/universe/Elevation.ts` (no DOM, Web-Worker safe), tests `tests/elevation.test.ts`
(fixture `tests/fixtures/elevation_points.json` is written by the build).

* Cube: faces 0..5 = +X,-X,+Y,-Y,+Z,-Z of the body-fixed frame (+X = 0 deg E, +Z = north); image
  right/down axes +X:(+Y,-Z) -X:(-Y,-Z) +Y:(-X,-Z) -Y:(+X,-Z) +Z:(+Y,+X) -Z:(+Y,-X); equi-angular
  (`normalize(N + tan((2u-1)pi/4) U + tan((2v-1)pi/4) V)`). Level L: 2^L x 2^L tiles a face, 256
  intervals a tile, 257 vertex-registered samples + a 1-sample apron = 259 x 259 16-bit greyscale
  PNG; height = manifest `offset` + `step` (1 m) x value.
* Bodies, MB, finest level: Moon 115 MB (all to 1.3 km, half to 666 m, landmarks 333 m), Mars 105
  (all to 2.6 km, most to 1.3 km, 650/325 m at the volcanoes, canyons and landing sites), Earth 80
  (sea floor to 9.8 km; land to 4.9 km, mountains to 1.2 km/611 m, landmarks 305 m), Mercury 25
  (1.9 km), Ceres 7.6, Vesta 7.0: 340 MB in all. Deep tiles are chosen greedily by the RMS detail
  they add over the parent x 2^(-level/2) under a per-body byte budget (`BODIES` in the script).
* API: `Elevation.configure({ base, maxBytes })` (absolute base inside a worker), `load(body)`,
  `levels(body)`, `request(body, face, level, x, y)`, `prefetch(body, dir, metresPerSample, ring)`,
  `sample(body, dirBF, metresPerSample)` (sync bicubic, metres above the reference, null when
  nothing loaded covers the point; blends adjacent levels; `lastMetresPerSample`/`lastLevel` say
  what it used), `maxLevelAt(body, dir)`, `exists`, `loaded`, `version(body)`; helpers
  `faceToDir`, `dirToFace`, `tileOf`, `decodePng16` (own PNG decoder over `DecompressionStream`,
  so heights stay exact 16-bit). LRU cache, 40 MB default, levels 0-1 never evicted.
* Regional levels (`pipeline/elevation_hires.py`, run by the build or `python3 build_elevation.py
  hires [earth|moon]`): Earth L8/L9 (153/76 m, 1551 tiles, 90 MB) from Copernicus DEM GLO-90 over the
  Alps, Everest Himalaya, Aconcagua, Grand Canyon, Kilimanjaro, Mauna Kea, Fuji, Denali; Moon L6/L7
  (167/83 m, 881 tiles, 45 MB) from SLDEM2015 in 10 x 10 degree boxes around the Apollo 11/15/17
  sites, Chang'e 4, Tycho, Copernicus. These levels list their tiles (`list`: flat face, x, y) instead
  of a bitmap. Elevation total now ~475 MB; the whole site ~910 MB (keep it under ~950).
* Reference surface for consumers: heights are metres above the body's ellipsoid (`radii`), exactly
  like the older `terrain/*.png` maps (Moon: the 1737.4 km sphere). `referenceRadius` is the mean
  radius for `metresPerSample` only. The tile worker (`workers/terrainTiles.worker.ts`) currently uses
  the pyramid only on near-spherical bodies and subtracts `ellipsoid - referenceRadius`; for the
  ellipsoidal bodies (Earth, Mars, Mercury, Ceres, Vesta) the right height is the sample itself
  (`h = v`), which would turn the pyramids on there too.
* Memory: each `ElevationStore` caps decoded tiles at 40 MB by default (about 300 tiles); a descent
  with ring-1 prefetch on every level needs about 10 MB (tested in `tests/elevation.test.ts` with a
  24 MB cap). With 3-4 tile workers that is at most 160 MB on Quest; lower `maxBytes` if needed.
* Regenerate: `cd pipeline && python3 build_elevation.py [body ...]` (downloads ~14 GB once, plus
  ~0.6 GB of Copernicus tiles and SLDEM rows by range requests).
* Mercury's older `public/data/terrain/mercury.png` was twice too tall: `terrain.json` now applies
  the GeoTIFF's 0.5 m scale (and `build_terrain.py` bakes it in on a rebuild); the pyramids were
  always right. Mars/Earth heights are relative to the
  areoid/geoid but the engine adds them to the ellipsoid (as before: the difference is a smooth,
  very long-wavelength undulation, kilometre-scale on Mars, ~100 m on Earth). Earth land below sea level (Dead Sea, Caspian) is stored as ocean in the fine levels.

## Next

1. Quest performance pass on a real headset (cockpit, planet/galaxy/nebula shaders, tile atlas size,
   black hole steps).
2. Terrain: stream sharper elevation tiles everywhere (the full LOLA/MOLA/ETOPO resolution; today
   only the landmark patches have it), a real cloud layer for Earth; OpenNGC for more deep-sky objects, a sharper galaxy
   impostor from outside.
3. Unity port planning (the data pipeline outputs are engine-agnostic JSON/JPEG).

## Checks before every deploy

`npm run typecheck`, `npm test`, then with `npx vite preview --port 4173` running:
`node scripts/interact.mjs http://127.0.0.1:4173/ out`, `node scripts/verify.mjs ...`,
`node scripts/vr.mjs http://127.0.0.1:4173/ out` (IWER Quest 3 emulator; 27 checks),
`node scripts/game.mjs http://127.0.0.1:4173/ out` (game mode; 16 checks),
`node scripts/terrain.mjs http://127.0.0.1:4173/ out` (landing terrain),
`node scripts/places.mjs http://127.0.0.1:4173/ out` (rings, comets, eclipses). Run them one at a time
(parallel runs starve the software renderer and screenshots time out). `SKIP_BUILD=1 bash
scripts/deploy-pages.sh` publishes the exact build that was verified. On a machine
with a real GPU these run far faster than in the cloud container (software rendering, ~1 fps).

## Licences to keep in mind

Gaia DR3 supplement (`public/data/stars-gaia/`) is CC BY-NC: drop it for a paid store app. AT-HYG
tiles are CC BY-SA 4.0; OPAL maps CC BY 4.0; NASA/USGS/NOAA public domain. See `CREDITS.md`.
