#!/usr/bin/env bash
# Rebuild every engine data file from the original sources.
# Raw downloads are cached in data-raw/ (git-ignored); outputs go to public/data/.
set -euo pipefail
cd "$(dirname "$0")"
python3 -m pip install -q -r requirements.txt
python3 fetch_textures.py          # NASA/USGS planetary maps -> public/data/textures
python3 fetch_hires.py             # 8k maps, relief/water maps, Hubble OPAL giants, spectral colours
python3 fetch_moons_hires.py       # 4k maps of moons and dwarf planets from the full USGS mosaics
python3 build_tiles.py             # 16k tile pyramids for close-ups -> public/data/tiles
python3 build_thumbnails.py        # menu thumbnails rendered from the maps
python3 build_milkyway.py          # NASA SVS Deep Star Maps Milky Way -> public/data/sky
python3 fetch_atmospheres.py       # NASA fact sheets -> public/data/solar/atmospheres.json
python3 build_ephemeris.py         # JPL DE442S -> public/data/ephem
python3 build_solar_system.py      # PCK, GM, JPL satellite elements, SBDB, PDS rings -> public/data/solar
python3 fetch_horizons_moons.py    # JPL Horizons vectors for moon calibration (cached)
python3 build_solar_system.py      # second pass applies the Horizons calibration
python3 fetch_gaia.py              # Gaia DR3 100 pc subset (cached)
python3 build_stars.py             # AT-HYG + HYG + Gaia -> public/data/stars
python3 build_blackholes.py         # BlackCAT + SIMBAD + published masses -> public/data/blackholes.json
python3 build_exoplanets.py        # NASA Exoplanet Archive -> public/data/exoplanets.json
python3 build_spacecraft.py        # JPL Horizons trajectories -> public/data/spacecraft.json
python3 build_galaxies.py          # SIMBAD nearby galaxies -> public/data/galaxies.json
