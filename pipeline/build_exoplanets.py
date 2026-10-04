"""Confirmed exoplanets for the engine: public/data/exoplanets.json

Source (downloaded here): NASA Exoplanet Archive, Planetary Systems Composite Parameters table
(`pscomppars`, one row per confirmed planet with the most complete parameter set), via TAP.
Acknowledgement requested by the archive: "This research has made use of the NASA Exoplanet Archive,
which is operated by the California Institute of Technology, under contract with the National
Aeronautics and Space Administration under the Exoplanet Exploration Program."

Planets are grouped into systems by host star. Values the archive lacks are filled in and flagged
("est" lists the estimated fields):
  * semi-major axis from the period and stellar mass (Kepler's third law), or the reverse;
  * radius from mass, or mass from radius, with the probabilistic mass-radius relation of
    Chen & Kipping 2017 (ApJ 834, 17), mean branch;
  * eccentricity 0, inclination 90° when unknown;
  * the orbit's node and the planet's phase are not measured for most planets: the engine chooses
    them deterministically per planet.
"""
from __future__ import annotations

import csv
import io
import math
import urllib.parse

from common import OUT, RAW, download, write_json

COLS = [
    "pl_name", "hostname", "sy_snum", "sy_pnum", "sy_dist", "ra", "dec", "sy_vmag",
    "pl_orbper", "pl_orbsmax", "pl_orbeccen", "pl_orbincl", "pl_orblper", "pl_tranmid",
    "pl_rade", "pl_bmasse", "pl_eqt", "pl_insol", "pl_dens",
    "st_teff", "st_rad", "st_mass", "st_spectype", "st_age",
    "hip_name", "hd_name", "gaia_dr3_id", "discoverymethod", "disc_year",
]
TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query={}&format=csv"
G = 6.674e-11
MSUN = 1.98892e30
MEARTH = 5.9722e24
AU = 1.495978707e11
DAY = 86400.0


def num(s: str) -> float | None:
    try:
        v = float(s)
        return v if math.isfinite(v) else None
    except (TypeError, ValueError):
        return None


def radius_from_mass(m: float) -> float:
    """Chen & Kipping 2017 mean relation, Earth units (Terran / Neptunian / Jovian / stellar)."""
    if m < 2.04:
        return m ** 0.279
    if m < 132:
        return 1.008 * 2.04 ** (0.279 - 0.589) * m ** 0.589
    r132 = 1.008 * 2.04 ** (0.279 - 0.589) * 132 ** 0.589
    if m < 26600:
        return r132 * (m / 132) ** -0.044
    return r132 * (26600 / 132) ** -0.044 * (m / 26600) ** 0.881


def mass_from_radius(r: float) -> float:
    """Inverse of radius_from_mass on its monotonic branches (Jovian radii map to ~1 Jupiter mass)."""
    if r < 2.04 ** 0.279:
        return r ** (1 / 0.279)
    r132 = radius_from_mass(132)
    if r < r132:
        return (r / (1.008 * 2.04 ** (0.279 - 0.589))) ** (1 / 0.589)
    return 318.0  # the Jovian branch is flat: radius says little about mass


def main() -> None:
    q = f"select {','.join(COLS)} from pscomppars"
    path = download(TAP.format(urllib.parse.quote(q)), RAW / "exoplanets" / "pscomppars.csv", min_size=100_000)
    rows = list(csv.DictReader(io.StringIO(path.read_text())))
    systems: dict[str, dict] = {}
    for r in rows:
        dist = num(r["sy_dist"])
        ra, dec = num(r["ra"]), num(r["dec"])
        if dist is None or ra is None or dec is None:
            continue
        host = r["hostname"].strip()
        s = systems.get(host)
        if s is None:
            ids = [x.strip() for x in (r["hip_name"], r["hd_name"], r["gaia_dr3_id"]) if x and x.strip()]
            s = systems[host] = {
                "host": host, "ids": ids, "ra": ra, "dec": dec, "distPc": dist,
                "teff": num(r["st_teff"]), "radSun": num(r["st_rad"]), "massSun": num(r["st_mass"]),
                "spType": (r["st_spectype"] or "").strip(), "vmag": num(r["sy_vmag"]), "stars": int(num(r["sy_snum"]) or 1),
                "planets": [],
            }
        est: list[str] = []
        mstar = s["massSun"] or 1.0
        P = num(r["pl_orbper"])
        a = num(r["pl_orbsmax"])
        if a is None and P is not None:
            a = (G * mstar * MSUN * (P * DAY) ** 2 / (4 * math.pi ** 2)) ** (1 / 3) / AU
            est.append("a")
        if P is None and a is not None:
            P = 2 * math.pi * math.sqrt((a * AU) ** 3 / (G * mstar * MSUN)) / DAY
            est.append("period")
        if a is None or P is None:
            continue
        rad, mass = num(r["pl_rade"]), num(r["pl_bmasse"])
        if rad is None and mass is not None:
            rad = radius_from_mass(mass)
            est.append("radius")
        if mass is None and rad is not None:
            mass = mass_from_radius(rad)
            est.append("mass")
        if rad is None:
            continue
        e = num(r["pl_orbeccen"])
        if e is None:
            e = 0.0
            est.append("e")
        inc = num(r["pl_orbincl"])
        if inc is None:
            inc = 90.0
            est.append("inc")
        s["planets"].append({
            "name": r["pl_name"].strip(), "aAU": round(a, 6), "periodDays": round(P, 6), "e": round(min(e, 0.97), 4),
            "incDeg": round(inc, 3), "omegaDeg": num(r["pl_orblper"]), "tTransit": num(r["pl_tranmid"]),
            "radiusEarth": round(rad, 4), "massEarth": round(mass, 4) if mass else None,
            "eqTempK": num(r["pl_eqt"]), "insol": num(r["pl_insol"]),
            "method": r["discoverymethod"], "year": int(num(r["disc_year"]) or 0), "est": est,
        })
    out = [s for s in systems.values() if s["planets"]]
    for s in out:
        s["planets"].sort(key=lambda p: p["aAU"])
    out.sort(key=lambda s: s["distPc"])
    n = sum(len(s["planets"]) for s in out)
    print(f"  {len(out)} systems, {n} planets; nearest: " + ", ".join(f"{s['host']} ({s['distPc']:.2f} pc)" for s in out[:5]))
    write_json(OUT / "exoplanets.json", {
        "source": "NASA Exoplanet Archive, Planetary Systems Composite Parameters (pscomppars)",
        "acknowledgement": "This research has made use of the NASA Exoplanet Archive, which is operated by the California "
                           "Institute of Technology, under contract with the National Aeronautics and Space Administration "
                           "under the Exoplanet Exploration Program.",
        "systems": out,
    })


if __name__ == "__main__":
    main()
