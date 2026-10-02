# Space Explorer

A real-time, seamless, scale-free explorer of the real and procedurally generated universe — a
SpaceEngine-style desktop experience built on **real astronomical data** (JPL ephemerides, AT-HYG /
HYG / Gaia DR3 stars, JPL satellite and small-body catalogues, NASA/USGS planetary maps) with
deterministic procedural generation to come for everything the catalogues don't cover.

### ▶ Live: **https://dippy34.github.io/nextjs-boilerplate/**

Desktop browser with WebGL 2 recommended (keyboard + mouse); press **H** for controls.

![Earth](docs/img/01-earth.jpg)

| | |
|---|---|
| ![Saturn](docs/img/03-saturn.jpg) | ![Orion from Earth orbit](docs/img/07-sky-from-earth-orion.jpg) |
| ![40 pc above the Sun](docs/img/09-neighborhood.jpg) | ![Asteroid belt](docs/img/11-asteroid-belt.jpg) |
| ![Pluto and Charon](docs/img/12-pluto-charon.jpg) | ![Sirius](docs/img/13-sirius.jpg) |

*Screenshots are from headless Chromium with software (SwiftShader) rendering — the automated
verification run, not hand-picked renders.*

## Quick start

```bash
npm install
npm run dev          # http://127.0.0.1:5173
```

All processed data (≈75 MB) is committed under `public/data/`, so the app runs without the
pipeline. To rebuild every data file from the original sources, see [`pipeline/`](pipeline/README.md)
(`npm run data`, needs Python 3.10+ and ~0.5 GB of downloads).

Production build: `npm run build && npm run preview`.
Deploy to GitHub Pages: `bash scripts/deploy-pages.sh` (builds and force-pushes the `gh-pages` branch).

### Controls

| Input | Action |
|---|---|
| Left drag | Look around |
| Right drag / Shift + drag | Orbit around the selection |
| Wheel | Zoom towards the selection (free flight: change speed) |
| W A S D, R F | Fly; speed scales with altitude above the nearest surface |
| Shift / Ctrl | ×10 / ×0.1 speed · Q / E roll |
| Click / double-click | Select / select and go to |
| G · C | Go to selection (autopilot) · centre selection |
| Enter or `/` | Find by name (planets, 459 moons, 302 large asteroids/TNOs, 4,077 comets, 12,585 named stars) |
| 0–9 | Sun, Mercury … Pluto |
| Space · `[` `]` · `\` · Backspace | Pause · slower/faster time · reverse · real time now |
| L · O · M | Labels · orbits · minor-body orbits |
| P · H · Esc | Screenshot · help · stop autopilot / deselect |

URL parameters (also used by the automated tests): `time=2026-10-01T20:00:00Z`, `rate=86400`,
`paused=1`, `target=Saturn&dist=6&az=40&el=20` (distance in radii), `look=Betelgeuse`,
`campc=x,y,z` (camera position in parsecs), `fov=60`, `starlimit=7.5`, `gaia=0` (skip the
non-commercial Gaia dataset), `depth=log` (force logarithmic depth).

## Why Three.js (WebGL2) + TypeScript + Vite

* **Streaming is native to the web.** The star catalogue is an octree of ~1,200 binary tiles and the
  ephemeris is chunked by decade; the browser fetches exactly what the camera needs. A desktop shell
  (Tauri/Electron) can wrap it later without changing the engine.
* **Full shader control without boilerplate.** Three.js gives render targets, HDR formats, and both
  reversed-Z (`EXT_clip_control`) and logarithmic depth, while every material here is a hand-written
  GLSL `ShaderMaterial` (stars, PSF sprites, planets, rings, GPU Kepler propagation).
* **Verifiable here.** Each phase is run and checked in headless Chromium (Playwright + SwiftShader);
  that rules out Unity/Unreal in this environment, and makes Rust/wgpu (Bevy) iteration much slower.
* Babylon.js would also work; Three.js is lighter and its WebGPU path is available later for compute.

## Architecture

```
src/
  core/      units, double-double universal positions (UPos), time scales, reference frames
  astro/     DE442S chunk evaluator, Kepler/universal propagation, IAU rotation models, photometry
  universe/  Solar System (planets, 459 moons, minor bodies), streaming star catalogue, named stars
  render/    HDR renderer (bloom + ACES), star field, bodies (planets, rings, Sun), orbits,
             GPU asteroids, comets (Web Worker), near-star renderer, labels
  app/       main loop, camera rig (free fly / orbit / autopilot), input
  workers/   comet propagation (double precision, off the main thread)
pipeline/    Python: download → validate → convert raw catalogues into public/data/
tests/       unit tests incl. comparison against JPL Horizons reference vectors
scripts/     headless browser verification (scenario screenshots, interaction checks)
```

**Scale and precision.** Every object has a double-double position (≈32 significant digits, i.e.
millimetres at 100 Mpc). Each frame, positions are differenced against the camera in double-double,
converted to doubles and only then to float32 for the GPU — a floating origin, so the camera always
sits at (0,0,0). Depth uses a reversed-Z float32 buffer (logarithmic fallback). The camera co-moves
with whichever body's sphere of influence it is in, so time acceleration never leaves you behind.

**Photometry.** All light is in one physical unit system (radiance 1 = white Lambertian surface lit by
the Sun at 1 AU). Stars, unresolved planets, asteroids and comets are drawn as point-spread sprites
whose integrated value equals the physical irradiance at the camera, so a planet fading from disk to
dot keeps its brightness. Eye adaptation follows the brightest resolved disk in view; a perceptual
power law is applied to point sources (as SpaceEngine/Celestia do).

**Stars.** A brightest-first octree: each node holds the intrinsically brightest stars of its cube not
taken by an ancestor, so "could any star in this subtree be visible from here?" is an exact test and
tiles stream in without popping. Colours come from Planck spectra integrated against CIE colour
matching functions.

## Status

### Phase 1 — engine core ✅ (this commit)

Works and is verified (`npm test`, `npm run verify`, `npm run verify:interact`):

* Seamless scale from metres above a planet to kiloparsecs, floating origin, reversed-Z depth.
* 2,751,164 real stars streamed from two separately-licensed octrees (AT-HYG+HYG; Gaia DR3 100 pc
  supplement), physical brightness and blackbody colours, 12,585 named stars, picking with real
  designations (HIP/HD/TYC/Gaia DR3), stars resolve into limb-darkened disks when you fly to them.
* Solar System at the real date: JPL DE442S (1849–2150; validated against JPL Horizons to ≲50 km for
  Earth, 1 km for the Moon), JPL approximate elements outside that range, IAU rotation models (pck00011).
* 459 moons: JPL mean elements, calibrated against Horizons (median error 0.58° over 1950–2100), with
  Horizons osculating-element tables for Triton, Titan, Iapetus and the irregular moons (≤0.07°).
* 302 large asteroids/TNOs as full bodies, 75,565 numbered asteroids propagated on the GPU, 4,077
  comets propagated in a Web Worker.
* NASA/USGS global maps for 22 bodies, Earth night lights and clouds, Saturn's rings from the Voyager 2
  PPS occultation profile with planet↔ring shadows.
* Free flight with altitude-scaled speed (metres/s to parsecs/s), orbit mode, logarithmic go-to
  autopilot, time control (pause, ×1 … 100 years/s, reverse), labels, orbit lines, search, info panel,
  screenshots.

Known limitations (planned for later phases unless noted):

* Planets are textured ellipsoids — LOD terrain, atmospheres, oceans and landing are Phase 2.
* Saturn, Uranus, Neptune and Venus use procedural banding tinted with colours measured from real
  spacecraft images (no public-domain global maps exist); the Viking Mars mosaic is over-saturated.
* No Milky Way model yet: beyond ~1 kpc you only see catalogue stars (Phase 3 adds the galaxy,
  nebulae, clusters and procedural stars).
* Star radii are estimated from V magnitude and temperature (no bolometric correction). Gaia DR3
  places Sirius B 0.033 pc from Sirius A (a known astrometry problem for that binary).
* Moons without published sizes get a deterministic procedural radius, flagged "estimated".
* Comets are points (no coma/tail yet); the asteroid-belt brightness boost for distant asteroids is
  artistic (physical within 0.05 AU).
* Pluto has no ephemeris outside 1849–2150; no eclipses or body-on-body shadows yet (Phase 6).
* Performance has been verified only under software rendering (≈20–30 fps at 720p; ~3–5 ms JS per
  frame). GPU profiling and quality presets come in Phase 6.

### Roadmap

2. Planet rendering: cube-sphere quadtree terrain from real DEMs, Bruneton atmospheric scattering,
   oceans, clouds, space-to-surface descent and surface walking.
3. Milky Way model calibrated on Gaia star counts, nebulae and clusters (OpenNGC), procedural stars.
4. Procedural planetary systems + NASA Exoplanet Archive systems.
5. Full UI: search panel, bookmarks, settings and quality presets.
6. Polish: lens flares, eclipses, black holes, performance tuning.

## Data and credits

See [CREDITS.md](CREDITS.md). Licences differ per dataset — notably the Gaia DR3 supplement
(`public/data/stars-gaia/`) is **CC BY-NC 3.0 IGO (non-commercial)** and the AT-HYG/HYG-derived star
tiles are **CC BY-SA 4.0**. Source code is MIT.
