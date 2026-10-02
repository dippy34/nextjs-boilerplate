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
* **PDS Ring-Moon Systems Node**, volume VG_2801: Voyager 2 PPS δ Scorpii occultation, Saturn ring normal opacity at 10 km resolution (`PS1P01.TAB`) — <https://pds-rings.seti.org/>

## Planetary maps (`public/data/textures/`)

Per-map source URLs and credits are in `public/data/textures/manifest.json` and shown in the app.

| Body | Source | Credit |
|---|---|---|
| Earth (day) | NASA Earth Observatory, Blue Marble: Next Generation (Oct 2004) | NASA Earth Observatory / Reto Stöckli |
| Earth (night) | NASA Earth Observatory, Black Marble 2016 | NASA Earth Observatory / Suomi NPP VIIRS |
| Earth (clouds) | NASA Earth Observatory Blue Marble cloud composite | NASA / MODIS |
| Moon | NASA SVS CGI Moon Kit (LRO LROC WAC colour) | NASA's Scientific Visualization Studio |
| Mercury | MESSENGER MDIS global mosaic | NASA/JHUAPL/Carnegie Institution of Washington, via USGS Astrogeology |
| Mars | Viking global colour mosaic | NASA/JPL/USGS |
| Jupiter | Cassini cylindrical map (PIA07782) | NASA/JPL/Space Science Institute |
| Io, Europa, Ganymede, Callisto | Galileo SSI / Voyager global mosaics | NASA/JPL/USGS |
| Titan, Enceladus, Tethys, Dione, Rhea, Iapetus | Cassini ISS (–Voyager) global mosaics | NASA/JPL/Space Science Institute, via USGS Astrogeology |
| Triton | Voyager 2 global colour mosaic | NASA/JPL/USGS |
| Pluto, Charon | New Horizons LORRI/MVIC global mosaics | NASA/JHUAPL/SwRI, via USGS Astrogeology |
| Ceres, Vesta | Dawn FC global mosaics | NASA/JPL-Caltech/UCLA/MPS/DLR/IDA, via USGS Astrogeology |
| Saturn, Uranus, Neptune, Venus (disk colour only) | Cassini PIA11141; Voyager 2 PIA18182, PIA01492; Mariner 10 PIA23791 | NASA/JPL-Caltech (/Space Science Institute) |

USGS Astrogeology products and NASA imagery are U.S. Government works. Under the JPL image use policy
(<https://www.jpl.nasa.gov/jpl-image-use-policy>) JPL images may be used for any purpose with credit
("Courtesy NASA/JPL-Caltech" unless the caption says otherwise); images owned by third parties may
carry restrictions on commercial use — check the caption of each PIA image before commercial use.

## Algorithms and code

* [three.js](https://threejs.org/) (MIT), [Vite](https://vite.dev/) (MIT), [jplephem](https://github.com/brandon-rhodes/python-jplephem) (MIT, pipeline), NumPy, Pillow, Requests.
* ACES filmic curve fit: Stephen Hill, BakingLab (MIT).
* Bloom downsampling filter: J. Jimenez, *Next Generation Post Processing in Call of Duty: Advanced Warfare*, SIGGRAPH 2014.
* CIE 1931 colour-matching function fit: Wyman, Sloan & Shirley, *JCGT* 2(2), 2013.
* IAU H,G asteroid photometric system: Bowell et al. 1989.
* IAU rotation models: Archinal et al. (IAU WGCCRE), as distributed in NAIF pck00011.
* Galactic frame: Hipparcos/ICRS realisation of the IAU 1958 Galactic system (ESA 1997).

## Licence of this repository

Source code: MIT (see `LICENSE`). Data files keep the licences of their sources as listed above.
