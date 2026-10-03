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
  - Landing terrain: `pipeline/build_terrain.py` -> `public/data/terrain/` (Moon/Mars/Mercury heights
    as 16-bit-in-RGB PNG), `src/universe/Terrain.ts` (heights: elevation model + generated hills and
    craters), `src/render/TerrainPatch.ts` (polar grid under the explorer, built a few rings per
    frame, drawn with the body's material; the sphere gets a hole via `uHoleDir`/`uHoleCos`).
    `App.keepAboveGround` and `computeAltitude` use `TerrainPatch.groundRadius`.
  - Cockpit HUD (`src/game/HudMarkers.ts`): target bracket, flight-path marker, boresight.
  - Generated planets: `src/universe/ExoTerrain.ts` (CPU copy of EXO_FRAG `terrain()` so ground matches
    colours), Earth-like atmosphere shells for temperate/ocean types (`Atmospheres.updateExo`).
  - Saturn's rings up close: `src/render/RingParticles.ts` (instanced ice, density from the ring
    opacity texture, inertial ring frame from `universe/RingSpot.ts`, which is also the search target).
  - Comets: `src/render/CometTails.ts` (coma/ion/dust quad per active comet, sky display gain; nucleus
    mesh + jets for the nearest one within 30,000 km, fed to the exposure as `nucleusView`).
  - Landmarks: `src/universe/Landmarks.ts` (places with coordinates; search ids `lm:`; VR Places tab).
  - Eclipses: `BodiesLayer.updateEclipses` picks up to 4 occluders per body; `sunVisible()` in
    `shaders/body.ts` (disc-overlap penumbra, red glow in Earth's shadow); `sunlit` feeds the exposure.
  - Walking: `App.keepAboveGround` keeps eye height within 4 m of the ground unless climbing.
  - Tests: `scripts/terrain.mjs` (landing terrain, 9 checks), `scripts/places.mjs` (rings, comet,
    lunar eclipse, Jupiter moon shadow).

## Next

1. Quest performance pass on a real headset (cockpit, planet/galaxy/nebula shaders, tile atlas size,
   black hole steps).
2. Terrain: stream sharper elevation tiles (the full LOLA/MOLA resolution), shadows, Earth;
   volumetric nebulae up close, OpenNGC for more deep-sky objects, a sharper galaxy impostor from outside.
3. Unity port planning (the data pipeline outputs are engine-agnostic JSON/JPEG).

## Checks before every deploy

`npm run typecheck`, `npm test`, then with `npx vite preview --port 4173` running:
`node scripts/interact.mjs http://127.0.0.1:4173/ out`, `node scripts/verify.mjs ...`,
`node scripts/vr.mjs http://127.0.0.1:4173/ out` (IWER Quest 3 emulator; 26 checks),
`node scripts/game.mjs http://127.0.0.1:4173/ out` (game mode; 16 checks),
`node scripts/terrain.mjs http://127.0.0.1:4173/ out` (landing terrain),
`node scripts/places.mjs http://127.0.0.1:4173/ out` (rings, comets, eclipses). Run them one at a time
(parallel runs starve the software renderer and screenshots time out). `SKIP_BUILD=1 bash
scripts/deploy-pages.sh` publishes the exact build that was verified. On a machine
with a real GPU these run far faster than in the cloud container (software rendering, ~1 fps).

## Licences to keep in mind

Gaia DR3 supplement (`public/data/stars-gaia/`) is CC BY-NC: drop it for a paid store app. AT-HYG
tiles are CC BY-SA 4.0; OPAL maps CC BY 4.0; NASA/USGS/NOAA public domain. See `CREDITS.md`.
