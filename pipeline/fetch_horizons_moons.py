"""Fetch JPL Horizons state vectors for the major planetary satellites.

The JPL mean elements (sats/elem) give orbit shape and orientation, but their
mean longitudes drift by tens of degrees over decades for some moons and the
SAT441-derived Saturnian rows use a different longitude origin. We calibrate
each moon's mean longitude against Horizons (which evaluates the full JPL
satellite ephemerides: JUP365, SAT441, URA184, NEP097/098, MAR099, PLU060).

Output: data-raw/horizons_moons.json  {naif_id: {"center": id, "jd": [...], "km": [[x,y,z], ...]}}
Sampling (ICRF, TDB, planet-centred) - three series with incommensurate steps
so the mean motion cannot alias:
  A 1950-01-01..2100-01-01 every 457 d
  B 1950-01-17..2100-01-01 every 391.27 d
  C 2025-06-01..2027-06-01 every 1.466 d (pins the mean motion unambiguously)
"""
from __future__ import annotations

import json
import re
import time

import requests

from common import RAW, UA

API = "https://ssd.jpl.nasa.gov/api/horizons.api"
OUT = RAW / "horizons_moons.json"
SERIES = [("1950-01-01", "2100-01-01", "457 d"), ("1950-01-17", "2100-01-01", "563431 m"), ("2025-06-01", "2027-06-01", "2111 m")]


def fetch(target: int, center: int) -> dict | None:
    out = {"center": center, "jd": [], "km": [], "source": ""}
    for start, stop, step in SERIES:
        d = fetch_series(target, center, start, stop, step)
        if not d:
            return None
        out["jd"] += d["jd"]
        out["km"] += d["km"]
        out["source"] = d["source"]
    return out


def fetch_series(target: int, center: int, start: str, stop: str, step: str) -> dict | None:
    q = {"format": "json", "COMMAND": f"'{target}'", "EPHEM_TYPE": "'VECTORS'", "CENTER": f"'500@{center}'",
         "START_TIME": f"'{start}'", "STOP_TIME": f"'{stop}'", "STEP_SIZE": f"'{step}'",
         "REF_PLANE": "'FRAME'", "REF_SYSTEM": "'ICRF'", "VEC_TABLE": "'1'", "OUT_UNITS": "'KM-S'",
         "CSV_FORMAT": "'YES'", "TIME_TYPE": "'TDB'"}
    for attempt in range(4):
        try:
            r = requests.get(API, params=q, headers=UA, timeout=120)
            r.raise_for_status()
            res = r.json().get("result", "")
            m = re.search(r"\$\$SOE\s*(.*?)\s*\$\$EOE", res, re.S)
            if not m:
                return None
            jd, km = [], []
            for line in m.group(1).strip().splitlines():
                p = [x.strip() for x in line.split(",")]
                jd.append(float(p[0]))
                km.append([float(p[2]), float(p[3]), float(p[4])])
            src = re.search(r"Target body name:.*?\{source: ([^}]+)\}", res)
            return {"center": center, "jd": jd, "km": km, "source": src.group(1) if src else ""}
        except Exception as e:  # noqa: BLE001
            print(f"  retry {target}: {e}")
            time.sleep(2 * (attempt + 1))
    return None


def fetch_elements(target: int, center: int, start="1950-01-01", stop="2100-01-01", step="91.3125 d") -> dict | None:
    """Osculating elements (ICRF equator frame, planet-centred) at regular epochs."""
    step_min = f"{round(float(step.split()[0]) * 1440)} m"
    q = {"format": "json", "COMMAND": f"'{target}'", "EPHEM_TYPE": "'ELEMENTS'", "CENTER": f"'500@{center}'",
         "START_TIME": f"'{start}'", "STOP_TIME": f"'{stop}'", "STEP_SIZE": f"'{step_min}'",
         "REF_PLANE": "'FRAME'", "REF_SYSTEM": "'ICRF'", "OUT_UNITS": "'KM-S'", "CSV_FORMAT": "'YES'", "TIME_TYPE": "'TDB'"}
    for attempt in range(4):
        try:
            r = requests.get(API, params=q, headers=UA, timeout=120)
            r.raise_for_status()
            res = r.json().get("result", "")
            m = re.search(r"\$\$SOE\s*(.*?)\s*\$\$EOE", res, re.S)
            if not m:
                return None
            rows = []
            for line in m.group(1).strip().splitlines():
                p = [x.strip() for x in line.split(",")]
                # JDTDB, Cal, EC, QR, IN, OM, W, Tp, N, MA, TA, A, AD, PR
                jd, e, q_, inc, om, w, tp, n = float(p[0]), float(p[2]), float(p[3]), float(p[4]), float(p[5]), float(p[6]), float(p[7]), float(p[8])
                rows.append([jd, q_, e, inc, om, w, tp, n * 86400.0])  # n in deg/day
            return {"center": center, "rows": rows}
        except Exception as e:  # noqa: BLE001
            print(f"  retry elements {target}: {e}")
            time.sleep(2 * (attempt + 1))
    return None


def main() -> None:
    system = json.loads((RAW.parent / "public" / "data" / "solar" / "system.json").read_text())
    have = json.loads(OUT.read_text()) if OUT.exists() else {}
    have = {k: v for k, v in have.items() if len(v.get("jd", [])) > 400}
    moons = [b for b in system["bodies"] if b["type"] == "moon" and b.get("radiusSource") and b["id"] != 301]
    print(f"{len(moons)} moons with measured sizes")
    for b in moons:
        key = str(b["id"])
        if key in have:
            continue
        d = fetch(b["id"], b["parent"])
        if d:
            have[key] = d
            print(f"  {b['name']}: {len(d['jd'])} vectors ({d['source']})")
        else:
            print(f"  {b['name']}: not available in Horizons")
        OUT.write_text(json.dumps(have))
    print(f"wrote {OUT} ({len(have)} moons)")


if __name__ == "__main__":
    main()
