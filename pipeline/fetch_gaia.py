"""Query the ESA Gaia Archive (Gaia DR3) for the solar neighbourhood.

We do NOT download the full catalogue. We ask the TAP service for a
distance-limited subset: sources with parallax > 10 mas (d < 100 pc), a
parallax signal-to-noise > 10 and RUWE < 1.4 (well-behaved astrometry).
This adds the faint red/white dwarfs that are missing from Tycho-2 based
AT-HYG. Queries are split into parallax x right-ascension slices so each
synchronous request stays small; async jobs are used as a fallback (the
anonymous async queue is sometimes unavailable).
"""
from __future__ import annotations

import csv
import io
import sys
import time
import xml.etree.ElementTree as ET

import requests

from common import RAW, UA

TAP = "https://gea.esac.esa.int/tap-server/tap"
COLS = ("source_id, ra, dec, parallax, parallax_error, pmra, pmdec, radial_velocity, "
        "phot_g_mean_mag, bp_rp, teff_gspphot, ruwe")
SLICES = [(10, 11), (11, 12.5), (12.5, 15), (15, 20), (20, 35), (35, 1e6)]
RA_SLICES = [(0, 90), (90, 180), (180, 270), (270, 360.1)]
OUT = RAW / "gaia_dr3_100pc.csv"


def run_sync(query: str, tries: int = 4) -> str | None:
    for attempt in range(tries):
        try:
            r = requests.post(f"{TAP}/sync", headers=UA, timeout=900, data={
                "REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "QUERY": query})
            if r.ok and r.text.startswith("source_id"):
                return r.text
            print(f"  sync failed ({r.status_code}): {r.text[:200]}")
        except requests.RequestException as e:
            print(f"  sync error: {e}")
        time.sleep(5 * (attempt + 1))
    return None


def run_job(query: str, tries: int = 5) -> str:
    for attempt in range(tries):
        r = requests.post(f"{TAP}/async", headers=UA, allow_redirects=False, timeout=120, data={
            "REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "PHASE": "RUN", "QUERY": query})
        job = r.headers.get("Location")
        if not job:
            raise RuntimeError(f"no job location: {r.status_code} {r.text[:300]}")
        print("  job", job)
        while True:
            phase = requests.get(f"{job}/phase", headers=UA, timeout=60).text.strip()
            if phase in ("COMPLETED", "ERROR", "ABORTED"):
                break
            time.sleep(5)
        if phase == "COMPLETED":
            res = requests.get(f"{job}/results/result", headers=UA, timeout=600)
            res.raise_for_status()
            return res.text
        err = requests.get(f"{job}/error", headers=UA, timeout=60).text
        print(f"  job failed ({phase}), attempt {attempt+1}: {err[:200]}")
        time.sleep(10 * (attempt + 1))
    raise RuntimeError("Gaia job failed repeatedly")


def main() -> None:
    if OUT.exists() and "--force" not in sys.argv:
        print(f"{OUT} exists; skipping (use --force)")
        return
    header = None
    rows = []
    for lo, hi in SLICES:
      for ra0, ra1 in RA_SLICES:
        q = (f"SELECT {COLS} FROM gaiadr3.gaia_source WHERE parallax > {lo} AND parallax <= {hi} "
             f"AND ra >= {ra0} AND ra < {ra1} "
             "AND parallax_over_error > 10 AND ruwe < 1.4 AND phot_g_mean_mag IS NOT NULL")
        print(f"Gaia DR3 slice parallax ({lo}, {hi}] mas, RA [{ra0}, {ra1})", flush=True)
        text = run_sync(q) or run_job(q)
        rd = csv.reader(io.StringIO(text))
        h = next(rd)
        header = header or h
        n0 = len(rows)
        rows.extend(rd)
        print(f"  {len(rows) - n0} rows", flush=True)
    with open(OUT, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"wrote {OUT} with {len(rows)} rows")


if __name__ == "__main__":
    main()
