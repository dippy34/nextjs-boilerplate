"""Downloads for build_catalog.py (raw files in data-raw/catalog/, git-ignored; resumable).

`python3 catalog_sources.py` fetches everything. CDS (VizieR) catalogues come from the CDS archive
as ReadMe + data file (read with astropy's CDS reader); the white-dwarf selection is made by the
VizieR server (the full table is 1.8 GB).
"""
from __future__ import annotations

import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from common import RAW
from elevation_sources import fetch

DIR = RAW / "catalog"
CDS = "https://cdsarc.cds.unistra.fr/ftp/"

# catalogue -> data files (each read together with its ReadMe)
CDS_FILES = {
    "J/A+A/673/A114": ["clusters.dat"],                 # Hunt & Reffert 2023, star clusters with Gaia DR3
    "VII/202": ["catalog"],                             # Harris 1996/1997, Milky Way globular clusters
    "J/ApJ/944/94": ["table2.dat"],                     # Cosmicflows-4, galaxy distances
    "J/AJ/145/101": ["table1.dat", "table2.dat"],       # Karachentsev+ 2013, Updated Nearby Galaxy Catalog
    "J/ApJS/194/45": ["catalog.dat.gz"],                # Shen+ 2011, SDSS DR7 quasars with black-hole masses
    "J/ApJS/212/1": ["table2.dat", "table6.dat"],       # Anderson+ 2014, WISE catalogue of Galactic H II regions
    "J/A+A/656/A110": ["tablea1.dat"],                  # Chornay & Walton 2021, planetary-nebula central star distances
    "VII/297": ["snrs.dat"],                            # Green 2019, Galactic supernova remnants
    "J/A+A/675/A199": ["lmxbcat.dat"],                  # Avakyan+ 2023, low-mass X-ray binaries
    "J/A+A/677/A134": ["hmxbcat.dat"],                  # Neumann+ 2023, high-mass X-ray binaries
    "J/ApJS/253/7": ["table11.dat", "table4.dat"],      # Kirkpatrick+ 2021, 20 pc census of L, T and Y dwarfs
    "J/ApJS/265/53": ["table1.dat"],                    # Ranasinghe & Leahy 2023, Galactic SNR distances
    "VII/20": ["catalog.dat"],                          # Sharpless 1959, H II regions
}

ATHYG = "https://codeberg.org/astronexus/athyg/media/branch/main/data/athyg_40.csv.gz"
OPENNGC = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv"
OPENNGC_ADD = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/addendum.csv"
PSRCAT = "https://www.atnf.csiro.au/research/pulsar/psrcat/downloads/psrcat_pkg.tar.gz"
TOI = ("https://exoplanetarchive.ipac.caltech.edu/TAP/sync?format=csv&query="
       + urllib.parse.quote("select toi,tid,toipfx,tfopwg_disp,ra,dec,st_dist,st_tmag,st_teff,st_rad,pl_orbper,"
                            "pl_rade,pl_eqt from toi"))
# Gentile Fusillo+ 2021 Gaia EDR3 white dwarfs: high-confidence (P_WD > 0.75) within 100 pc
WD = ("https://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=J/MNRAS/508/3877/maincat&-out.max=unlimited"
      "&-out=WDJname,Plx,Pwd,GmagCorr,TeffH,MassH&-out.add=_RAJ,_DEJ&-oc.form=d&Pwd=%3E0.75&Plx=%3E10")


def cds_path(cat: str, name: str) -> Path:
    return DIR / cat.replace("/", "_").replace("+", "p") / name


def fetch_cds(url: str, dest: Path) -> Path:
    """CDS data files are stored plain or gzipped: take whichever exists."""
    if dest.exists() or dest.with_name(dest.name + ".gz").exists():
        return dest if dest.exists() else dest.with_name(dest.name + ".gz")
    try:
        return fetch(url, dest, retries=1)
    except Exception:  # noqa: BLE001
        if url.endswith(".gz") or url.endswith("ReadMe"):
            raise
        return fetch(url + ".gz", dest.with_name(dest.name + ".gz"))


def cds_file(cat: str, name: str) -> Path:
    p = cds_path(cat, name)
    return p if p.exists() else p.with_name(p.name + ".gz")


def fetch_all() -> None:
    jobs = []
    for cat, files in CDS_FILES.items():
        jobs.append((CDS + cat + "/ReadMe", cds_path(cat, "ReadMe"), True))
        for f in files:
            jobs.append((CDS + cat + "/" + f, cds_path(cat, f), True))
    jobs += [(u, p, False) for u, p in [
        (ATHYG, DIR / "athyg_40.csv.gz"), (OPENNGC, DIR / "openngc.csv"), (OPENNGC_ADD, DIR / "openngc_addendum.csv"),
        (PSRCAT, DIR / "psrcat_pkg.tar.gz"), (TOI, DIR / "toi.csv"), (WD, DIR / "wd100pc.tsv")]]
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(lambda j: (fetch_cds if j[2] else fetch)(j[0], j[1]), jobs))


if __name__ == "__main__":
    fetch_all()
    print("ok", file=sys.stderr)
