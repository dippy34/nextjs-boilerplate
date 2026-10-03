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

## Next

1. Planetary systems everywhere: NASA Exoplanet Archive (pscomppars) for real systems, plus a
   deterministic generator per star (procedural and catalogue stars); GPU-generated planet surfaces,
   atmospheres, rings; menu/travel integration; procedural stars become visitable systems.
2. Nebulae and star clusters (OpenNGC), other galaxies; a sharper galaxy impostor from outside.
3. Quest performance pass on a real headset (black hole steps, glow size, star counts).

## Checks before every deploy

`npm run typecheck`, `npm test`, then with `npx vite preview --port 4173` running:
`node scripts/interact.mjs http://127.0.0.1:4173/ out`, `node scripts/verify.mjs ...`,
`node scripts/vr.mjs http://127.0.0.1:4173/ out` (IWER Quest 3 emulator; 26 checks). On a machine
with a real GPU these run far faster than in the cloud container (software rendering, ~1 fps).

## Licences to keep in mind

Gaia DR3 supplement (`public/data/stars-gaia/`) is CC BY-NC: drop it for a paid store app. AT-HYG
tiles are CC BY-SA 4.0; OPAL maps CC BY 4.0; NASA/USGS/NOAA public domain. See `CREDITS.md`.
