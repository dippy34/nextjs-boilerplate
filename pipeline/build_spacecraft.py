"""Real spacecraft positions for the engine: public/data/spacecraft.json

Source (downloaded here): JPL Horizons (https://ssd.jpl.nasa.gov/horizons/), which serves the
missions' own reconstructed and predicted trajectories. Vectors are ICRF, TDB, in km.

  deep-space probes   state vectors relative to the Solar System barycentre, sampled every few days
                      over each mission's span (cubic Hermite interpolation in the engine)
  JWST                vectors relative to Earth (halo orbit around Sun-Earth L2)
  ISS, Hubble         osculating elements relative to Earth at one epoch; the engine propagates
                      them as a precessing Kepler orbit (approximate away from that epoch)
"""
from __future__ import annotations

import re
import time

import requests

from common import OUT, UA, write_json
from fetch_horizons_moons import fetch_series

API = "https://ssd.jpl.nasa.gov/api/horizons.api"

# name, Horizons id, centre, start, stop, step, description
PROBES = [
    ("Voyager 1", -31, 0, "1977-09-08", "2030-12-31", "10 d", "Interstellar probe launched 1977; flew past Jupiter (1979) and Saturn (1980); left the heliosphere in 2012. The most distant human-made object."),
    ("Voyager 2", -32, 0, "1977-08-23", "2030-12-31", "10 d", "Launched 1977; the only spacecraft to visit Uranus (1986) and Neptune (1989); entered interstellar space in 2018."),
    ("New Horizons", -98, 0, "2006-01-20", "2030-12-31", "5 d", "Flew past Pluto and Charon in July 2015 and Arrokoth in 2019; now in the Kuiper belt."),
    ("Parker Solar Probe", -96, 0, "2018-08-13", "2030-12-31", "12 h", "Flies through the Sun's corona; at closest approach (6.1 million km) it is the fastest human-made object (~190 km/s)."),
    ("Europa Clipper", -159, 0, "2024-10-15", "2030-04-01", "2 d", "Launched 2024; arrives at Jupiter in 2030 to study the ocean world Europa."),
    ("Juice", -28, 0, "2023-04-15", "2031-07-01", "2 d", "ESA's JUpiter ICy moons Explorer; launched 2023, arrives at Jupiter in 2031 to study Ganymede, Callisto and Europa."),
    ("Lucy", -49, 0, "2021-10-17", "2033-03-01", "3 d", "Tours the Trojan asteroids that share Jupiter's orbit (2027-2033)."),
    ("Psyche", -255, 0, "2023-10-14", "2029-12-01", "3 d", "Heading for the metal-rich asteroid 16 Psyche (arrival 2029)."),
    ("James Webb Space Telescope", -170, 399, "2022-01-25", "2030-12-31", "1 d", "Infrared space telescope orbiting the Sun-Earth L2 point, 1.5 million km from Earth."),
]
# name, Horizons id, size (m), description
ORBITERS = [
    ("International Space Station", -125544, 109, "Crewed laboratory in low Earth orbit since 1998, ~420 km up, one orbit every ~93 minutes."),
    ("Hubble Space Telescope", -48, 13, "Optical space telescope in low Earth orbit since 1990, ~520 km up."),
]
SIZE = {"Voyager 1": 3.7, "Voyager 2": 3.7, "New Horizons": 2.7, "Parker Solar Probe": 3.0, "Europa Clipper": 30.5, "Juice": 27.0,
        "Lucy": 14.0, "Psyche": 25.0, "James Webb Space Telescope": 21.2}
KIND = {"Voyager 1": "voyager", "Voyager 2": "voyager", "New Horizons": "newhorizons", "Parker Solar Probe": "parker",
        "Europa Clipper": "clipper", "Juice": "clipper", "Lucy": "lucy", "Psyche": "clipper", "James Webb Space Telescope": "jwst",
        "International Space Station": "iss", "Hubble Space Telescope": "hubble"}


def elements(target: int, epoch: str) -> dict | None:
    q = {"format": "json", "COMMAND": f"'{target}'", "EPHEM_TYPE": "'ELEMENTS'", "CENTER": "'500@399'",
         "START_TIME": f"'{epoch}'", "STOP_TIME": f"'{epoch} 00:02'", "STEP_SIZE": "'1 m'",
         "REF_PLANE": "'FRAME'", "REF_SYSTEM": "'ICRF'", "OUT_UNITS": "'KM-S'", "CSV_FORMAT": "'YES'", "TIME_TYPE": "'TDB'"}
    for attempt in range(4):
        try:
            r = requests.get(API, params=q, headers=UA, timeout=120)
            r.raise_for_status()
            res = r.json().get("result", "")
            m = re.search(r"\$\$SOE\s*(.*?)\s*\$\$EOE", res, re.S)
            if not m:
                print(res[-600:])
                return None
            p = [x.strip() for x in m.group(1).strip().splitlines()[0].split(",")]
            # JDTDB, Cal, EC, QR, IN, OM, W, Tp, N, MA, TA, A, AD, PR
            return {"jd": float(p[0]), "e": float(p[2]), "i": float(p[4]), "node": float(p[5]), "w": float(p[6]),
                    "M": float(p[9]), "a": float(p[11]), "nDegS": float(p[8])}
        except Exception as e:  # noqa: BLE001
            print(f"  retry {target}: {e}")
            time.sleep(2 * (attempt + 1))
    return None


def series(target: int, center: int, start: str, stop: str, step: str) -> dict | None:
    """Fetch, shrinking the end date if Horizons has no trajectory that far."""
    for s in [stop, "2028-12-31", "2027-06-30", "2026-12-31", "2026-06-30"]:
        if s < start:
            continue
        d = fetch_series(target, center, start, s, step)
        if d and d["jd"]:
            return d
    return None


def main() -> None:
    out = {"probes": [], "orbiters": [], "source": "JPL Horizons, https://ssd.jpl.nasa.gov/horizons/"}
    for name, sid, center, start, stop, step, desc in PROBES:
        print(f"[{name}]")
        d = series(sid, center, start, stop, step)
        if not d:
            print("  FAILED")
            continue
        print(f"  {len(d['jd'])} samples {d['jd'][0]:.1f}..{d['jd'][-1]:.1f}")
        out["probes"].append({"name": name, "id": sid, "center": center, "size": SIZE[name], "kind": KIND[name], "about": desc,
                              "jd": [round(j, 5) for j in d["jd"]], "km": [[round(c, 1) for c in v] for v in d["km"]]})
    for name, sid, size, desc in ORBITERS:
        print(f"[{name}]")
        el = elements(sid, "2026-10-01")
        if not el:
            print("  FAILED")
            continue
        print(f"  a={el['a']:.1f} km e={el['e']:.5f} i={el['i']:.2f}")
        out["orbiters"].append({"name": name, "id": sid, "size": size, "kind": KIND[name], "about": desc, **el})
    write_json(OUT / "spacecraft.json", out)


if __name__ == "__main__":
    main()
