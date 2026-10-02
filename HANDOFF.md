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
* This round: autopilot uses a two-stretch log-distance Hermite curve (`src/app/CameraRig.ts`,
  test `tests/rig.test.ts`); destination textures are prefetched and every shader is compiled up front
  (`App.warmUp`, `BodiesLayer.prefetch`), no 8k maps in VR (upload stalls); VR travel = blink, re-aim,
  open eyes, one continuous flight. New star look (`src/render/shaders/psf.ts`): coloured core,
  halo/spikes sized by brightness above the limit, saturation `uSat`.

## In progress: black holes

* Data done: `pipeline/build_blackholes.py` -> `public/data/blackholes.json` (23 BHs: BlackCAT
  dynamical BHs, Sgr A*, M87*, Cyg X-1, Gaia BH1-3; companions with Roche-lobe radii and orbits).
* `src/universe/BlackHoles.ts`: `BlackHole` SpaceObject (radius = Schwarzschild radius), companion as
  a `CatalogStar` on its orbit, disk plane from the catalogue inclination. Not wired into the app yet.
* Next: `src/render/BlackHoleLayer.ts` — camera-centred BackSide sphere at the BH distance; per pixel:
  impact parameter b (in rs); weak field (b > 40) deflect by 2/b; strong field integrate
  d²u/dφ² = −u + 1.5u² (rs = 1) from r = 60 rs, capture at u ≥ 1, accretion-disk plane crossings
  (Novikov–Thorne T profile, Doppler beaming g⁴ + gravitational redshift); background from a
  CubeCamera capture of sky + star fields (layer 1), refreshed every ~2 s. Then App: load, update
  companions (`bh.update(jd)`, add companion to `near.stars`), picking, labels, search, menu tab
  "Black holes", arrival ~18 rs.

## Next after that

1. Procedural galaxy: parametric Milky Way (disk, bulge/bar, arms, dust), deterministic procedural
   star cells beyond the catalogues (billions, brightest-first LOD), volumetric galaxy from outside.
2. Planetary systems everywhere: NASA Exoplanet Archive (pscomppars) + deterministic generator per
   star; GPU-generated planet surfaces, atmospheres, rings; menu/travel integration.

## Checks before every deploy

`npm run typecheck`, `npm test`, then with `npx vite preview --port 4173` running:
`node scripts/interact.mjs http://127.0.0.1:4173/ out`, `node scripts/verify.mjs ...`,
`node scripts/vr.mjs http://127.0.0.1:4173/ out` (IWER Quest 3 emulator; 23 checks). On a machine
with a real GPU these run far faster than in the cloud container (software rendering, ~1 fps).

## Licences to keep in mind

Gaia DR3 supplement (`public/data/stars-gaia/`) is CC BY-NC: drop it for a paid store app. AT-HYG
tiles are CC BY-SA 4.0; OPAL maps CC BY 4.0; NASA/USGS/NOAA public domain. See `CREDITS.md`.
