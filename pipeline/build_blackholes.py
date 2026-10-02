"""Real black holes for the engine: public/data/blackholes.json

Sources (downloaded here):
  * BlackCAT (Corral-Santana et al. 2016, A&A 587, A61), VizieR J/A+A/587/A61:
    table A1 (positions, distances) and A4 (dynamical parameters: BH mass M1, orbital period,
    mass ratio q, inclination, companion spectral type) -- every dynamically confirmed BH with
    a distance.
  * SIMBAD (CDS) TAP: positions and parallaxes of Sgr A*, M87, Cyg X-1 and the companion stars of
    Gaia BH1/BH2/BH3 (by Gaia DR3 source id).
  * E. Mamajek, "A Modern Mean Dwarf Stellar Color and Effective Temperature Sequence"
    (Pecaut & Mamajek 2013, ApJS 208, 9; online table): companion spectral type -> Teff.

Masses/orbits not in those tables are published values typed in below, each with its paper.
Companion radii are Roche-lobe radii (Eggleton 1983) for the X-ray binaries, whose donors fill
their lobes; separations from Kepler's third law.
"""
from __future__ import annotations

import csv
import io
import math
import re

import requests

from common import OUT, RAW, UA, download, write_json

VIZ = "https://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=J/A%2BA/587/A61/{}&-out.all&-out.max=500"
SIMBAD_TAP = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync"
MAMAJEK = "https://www.pas.rochester.edu/~emamajek/EEM_dwarf_UBVIJHK_colors_Teff.txt"
G = 6.674e-11
MSUN = 1.98892e30
RSUN = 6.957e8
DAY = 86400.0

# Published parameters for black holes outside BlackCAT (masses, distances where SIMBAD has no
# parallax, orbits of the dormant Gaia BHs). Positions always come from SIMBAD.
EXTRA = [
    {"name": "Sagittarius A*", "simbad": "NAME Sgr A*", "kind": "supermassive", "massSun": 4.297e6, "distPc": 8277.0,
     "ref": "GRAVITY Collaboration 2022, A&A 657, L12 (mass, distance R0)"},
    {"name": "M87*", "simbad": "M 87", "kind": "supermassive", "massSun": 6.5e9, "distPc": 16.8e6,
     "ref": "Event Horizon Telescope Collaboration 2019, ApJL 875, L6 (mass, distance)"},
    {"name": "Cygnus X-1", "simbad": "Cyg X-1", "kind": "stellar", "massSun": 21.2, "distPc": 2220.0,
     "companion": {"spType": "O9.7Iab", "teff": 31100, "massSun": 40.6, "radiusSun": 22.3, "periodDays": 5.599829, "incDeg": 27.5, "roche": False},
     "ref": "Miller-Jones et al. 2021, Science 371, 1046 (BH 21.2 Msun, donor 40.6 Msun, d = 2.22 kpc); Orosz et al. 2011, ApJ 742, 84 (P, donor)"},
    {"name": "Gaia BH1", "simbad": "Gaia DR3 4373465352415301632", "kind": "stellar", "massSun": 9.62,
     "companion": {"spType": "G", "teff": 5850, "massSun": 0.93, "radiusSun": 0.99, "periodDays": 185.59, "incDeg": 126.6, "roche": False},
     "ref": "El-Badry et al. 2023, MNRAS 518, 1057"},
    {"name": "Gaia BH2", "simbad": "Gaia DR3 5870569352746779008", "kind": "stellar", "massSun": 8.94, "distPc": 1160.0,
     "companion": {"spType": "K giant", "teff": 4600, "massSun": 1.07, "radiusSun": 7.77, "periodDays": 1276.7, "incDeg": 34.9, "roche": False},
     "ref": "El-Badry et al. 2023, MNRAS 521, 4323"},
    {"name": "Gaia BH3", "simbad": "Gaia DR3 4318465066420528000", "kind": "stellar", "massSun": 32.70, "distPc": 590.0,
     "companion": {"spType": "G giant", "teff": 5212, "massSun": 0.76, "radiusSun": 4.94, "periodDays": 4253.1, "incDeg": 110.6, "roche": False},
     "ref": "Gaia Collaboration, Panuzzo et al. 2024, A&A 686, L2"},
]


def viz_table(name: str) -> list[dict[str, str]]:
    path = download(VIZ.format(name), RAW / "bh" / f"blackcat_{name}.tsv")
    lines = [l for l in path.read_text().splitlines() if l and not l.startswith("#")]
    header = lines[0].split("\t")
    rows = []
    for l in lines[3:]:  # header, units, dashes
        vals = l.split("\t")
        rows.append({h.strip(): (vals[i].strip() if i < len(vals) else "") for i, h in enumerate(header)})
    return rows


def sexa(ra: str, dec: str) -> tuple[float, float]:
    h, m, s = (float(x) for x in ra.split())
    d, dm, ds = dec.split()
    sign = -1 if d.startswith("-") else 1
    return 15 * (h + m / 60 + s / 3600), sign * (abs(float(d)) + float(dm) / 60 + float(ds) / 3600)


def simbad(ident: str) -> dict | None:
    q = ("SELECT b.main_id, b.ra, b.dec, b.plx_value FROM basic AS b JOIN ident AS i ON i.oidref = b.oid "
         f"WHERE i.id = '{ident}'")
    r = requests.get(SIMBAD_TAP, params={"request": "doQuery", "lang": "adql", "format": "csv", "query": q}, headers=UA, timeout=60)
    r.raise_for_status()
    rows = list(csv.DictReader(io.StringIO(r.text)))
    return rows[0] if rows else None


def mamajek_teff() -> list[tuple[str, float]]:
    path = download(MAMAJEK, RAW / "bh" / "mamajek.txt")
    out = []
    for l in path.read_text().splitlines():
        m = re.match(r"^([OBAFGKMLTY]\d(?:\.\d)?)V\s+(\d+)", l)
        if m:
            out.append((m.group(1), float(m.group(2))))
    return out


def teff_for(sp: str, table: list[tuple[str, float]]) -> float | None:
    m = re.match(r"([OBAFGKM])(\d(?:\.\d)?)?", sp.strip())
    if not m:
        return None
    cls, sub = m.group(1), float(m.group(2) or 5)
    best = None
    for s, t in table:
        if s[0] != cls:
            continue
        d = abs(float(s[1:]) - sub)
        if best is None or d < best[0]:
            best = (d, t)
    return best[1] if best else None


def roche(q: float) -> float:
    """Eggleton (1983) Roche-lobe radius / separation for mass ratio q = M_self / M_other."""
    q23 = q ** (2 / 3)
    return 0.49 * q23 / (0.6 * q23 + math.log(1 + q ** (1 / 3)))


def num(s: str) -> float | None:
    try:
        return float(s)
    except ValueError:
        return None


def main() -> None:
    teffs = mamajek_teff()
    a1 = {r["Name"]: r for r in viz_table("tablea1")}
    a4 = viz_table("tablea4")
    out = []
    for r in a4:
        name = r["Name"]
        base = a1.get(name) or next((v for k, v in a1.items() if k.replace(" ", "") == name.replace(" ", "")), None)
        m1, porb, q = num(r.get("M1", "")), num(r.get("Porb", "")), num(r.get("q", ""))
        if not base or m1 is None or porb is None:
            continue
        dist = num(base.get("Dist", ""))
        if dist is None:
            continue
        ra, dec = sexa(base["RAJ2000"], base["DEJ2000"])
        q = q if q is not None else 0.1
        m2 = q * m1
        P = porb * DAY
        a = (G * (m1 + m2) * MSUN * P * P / (4 * math.pi ** 2)) ** (1 / 3)
        sp = r.get("SpType", "")
        teff = teff_for(sp, teffs) or 4500
        out.append({
            "name": name.strip(), "aliases": [base.get("Ctp", "").strip(" ()")] if base.get("Ctp", "").strip() else [],
            "kind": "stellar", "raDeg": ra, "decDeg": dec, "distPc": dist * 1000, "massSun": m1,
            "companion": {"spType": sp, "teff": teff, "massSun": m2, "radiusM": roche(q) * a, "periodDays": porb,
                          "sepM": a, "incDeg": num(r.get("i", "")) or 60.0},
            "diskOuterM": 0.8 * roche(1 / q) * a,
            "ref": "BlackCAT, Corral-Santana et al. 2016, A&A 587, A61",
        })
    for e in EXTRA:
        s = simbad(e["simbad"])
        if not s:
            print(f"  SIMBAD: {e['simbad']} not found, skipped")
            continue
        dist = e.get("distPc")
        if dist is None and s.get("plx_value"):
            dist = 1000.0 / float(s["plx_value"])
        rec = {"name": e["name"], "aliases": [s["main_id"].strip()], "kind": e["kind"], "raDeg": float(s["ra"]), "decDeg": float(s["dec"]),
               "distPc": dist, "massSun": e["massSun"], "ref": e["ref"] + "; position: SIMBAD"}
        c = e.get("companion")
        if c:
            P = c["periodDays"] * DAY
            a = (G * (e["massSun"] + c["massSun"]) * MSUN * P * P / (4 * math.pi ** 2)) ** (1 / 3)
            rec["companion"] = {"spType": c["spType"], "teff": c["teff"], "massSun": c["massSun"], "radiusM": c["radiusSun"] * RSUN,
                                "periodDays": c["periodDays"], "sepM": a, "incDeg": c["incDeg"]}
            # wind-fed (Cyg X-1) or detached (Gaia BHs): only Cyg X-1 has a disk
            if e["name"] == "Cygnus X-1":
                rec["diskOuterM"] = 0.5 * roche(e["massSun"] / c["massSun"]) * a
        out.append(rec)
    for o in out:
        rs = 2 * G * o["massSun"] * MSUN / 299792458.0 ** 2
        print(f"  {o['name']:24s} {o['massSun']:>10.4g} Msun  d = {o['distPc']:>10.1f} pc  rs = {rs / 1e3:.4g} km"
              + (f"  P = {o['companion']['periodDays']:.3g} d, companion {o['companion']['spType']} {o['companion']['teff']:.0f} K" if o.get("companion") else ""))
    write_json(OUT / "blackholes.json", {"blackholes": out, "sources": [
        "BlackCAT (Corral-Santana et al. 2016), VizieR J/A+A/587/A61", "SIMBAD (CDS)", "Pecaut & Mamajek 2013 / Mamajek online table"]}, compact=False)


if __name__ == "__main__":
    main()
