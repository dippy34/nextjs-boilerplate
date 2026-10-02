# Data pipeline

Reproducibly turns the original catalogues into the compact, streamable files in `public/data/`.
Raw downloads are cached in `data-raw/` (git-ignored, ~0.5 GB). Run everything with:

```bash
bash pipeline/run_all.sh        # or: npm run data
```

| Script | Input | Output |
|---|---|---|
| `fetch_textures.py` | NASA / USGS global maps, spacecraft full-disk images | `textures/*.jpg`, `textures/manifest.json` (credits, longitude convention, measured disk colours) |
| `build_ephemeris.py` | JPL DE442S (`de442s.bsp`) | `ephem/de442s_YYYY.bin` (10-year Chebyshev chunks; c0 float64, higher terms float32) + `index.json` with the measured reconstruction error (≤1.7 km planets, 8 m Moon) |
| `build_solar_system.py` | NAIF pck00011 / gm_de440 / naif0012, JPL satellite elements & physical parameters, JPL approximate planet elements, SBDB (large bodies, numbered asteroids H<15, all comets), PDS Voyager ring profile | `solar/system.json`, `solar/asteroids.bin`, `solar/comets.json`, `solar/rings.json`, `textures/saturn_rings.png` |
| `fetch_horizons_moons.py` | JPL Horizons vectors for 74 moons (1950–2100, three incommensurate samplings) | `data-raw/horizons_moons.json` (used by the second `build_solar_system.py` pass) |
| `fetch_gaia.py` | ESA Gaia Archive TAP (Gaia DR3, d < 100 pc subset) | `data-raw/gaia_dr3_100pc.csv` |
| `build_stars.py` | AT-HYG v4.0, HYG v4.4, the Gaia subset | `stars/` (CC BY-SA 4.0) and `stars-gaia/` (CC BY-NC 3.0 IGO): brightest-first octree tiles, `named.json` |

## Moon calibration

JPL's published satellite mean elements describe orbit shape and orientation well, but their mean
longitudes drift (and the Saturnian rows use a different longitude origin). For every moon with a
measured size, `build_solar_system.py` compares the mean-element model with JPL Horizons and fits:

* the orbit pole (inclination, node and node rate) where it is well determined,
* corrections to the mean longitude (offset, rate, quadratic term, and one libration term when a
  periodogram finds one — e.g. the Mimas–Tethys resonance),
* the sign/interpretation of the published precession rates,

choosing the candidate with the lowest error. Distant or Sun-perturbed moons (Triton, Titan, Iapetus,
Hyperion, the Jovian irregulars, …) instead use Horizons osculating elements every 91.3 days. The
runtime model in `src/universe/SolarSystem.ts` is a line-by-line mirror of `satellite_position()`;
`tests/astro.test.ts` checks it against independent Horizons vectors.
