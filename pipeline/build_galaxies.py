"""Nearby galaxies for the engine: public/data/galaxies.json

Source (downloaded here): SIMBAD (CDS, Strasbourg) via TAP -
  basic      position, apparent size (major/minor axis, arcmin), position angle, morphological type
  mesDistance  published distance measurements; the median of the redshift-independent ones is used
  flux       V (or B) magnitude
Acknowledgement: "This research has made use of the SIMBAD database, operated at CDS, Strasbourg,
France" (Wenger et al. 2000, A&AS 143, 9).

The galaxies are the Local Group's large members and the brightest nearby galaxies; the engine
draws each as a procedural disc or ellipsoid of light with the catalogued size and orientation.
"""
from __future__ import annotations

import csv
import io
import statistics
import time

import requests

from common import OUT, UA, write_json

TAP = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync"
# (display name, SIMBAD identifier)
GALAXIES = [
    ("Andromeda Galaxy", "M 31"), ("Triangulum Galaxy", "M 33"), ("Large Magellanic Cloud", "NAME LMC"),
    ("Small Magellanic Cloud", "NAME SMC"), ("M32", "M 32"), ("M110", "M 110"), ("NGC 185", "NGC 185"), ("NGC 147", "NGC 147"),
    ("Barnard's Galaxy", "NGC 6822"), ("IC 1613", "IC 1613"), ("Sagittarius Dwarf", "NAME Sgr dSph"), ("Fornax Dwarf", "NAME Fornax dSph"),
    ("Sculptor Dwarf", "NAME Sculptor dSph"), ("Leo I", "NAME Leo I dSph"), ("Carina Dwarf", "NAME Carina dSph"),
    ("Draco Dwarf", "NAME Draco dSph"), ("Ursa Minor Dwarf", "NAME UMi dSph"), ("WLM", "NAME WLM Galaxy"),
    ("Bode's Galaxy", "M 81"), ("Cigar Galaxy", "M 82"), ("Sculptor Galaxy", "NGC 253"), ("Centaurus A", "NAME Centaurus A"),
    ("Pinwheel Galaxy", "M 101"), ("Whirlpool Galaxy", "M 51"), ("Sombrero Galaxy", "M 104"), ("M87", "M 87"),
    ("Black Eye Galaxy", "M 64"), ("Sunflower Galaxy", "M 63"), ("Southern Pinwheel", "M 83"), ("M94", "M 94"),
    ("Needle Galaxy", "NGC 4565"), ("M106", "M 106"), ("IC 342", "IC 342"), ("NGC 300", "NGC 300"), ("NGC 55", "NGC 55"),
    ("M74", "M 74"), ("M77", "M 77"), ("NGC 1300", "NGC 1300"), ("M100", "M 100"), ("M49", "M 49"), ("M60", "M 60"),
    ("Cartwheel Galaxy", "NAME Cartwheel Galaxy"), ("NGC 4631", "NGC 4631"), ("NGC 891", "NGC 891"), ("M66", "M 66"), ("M65", "M 65"),
    ("Sextans B", "NAME Sextans B"), ("Leo II", "NAME Leo II dSph"),
]


def tap(q: str) -> list[dict[str, str]]:
    for attempt in range(6):
        try:
            r = requests.get(TAP, params={"request": "doQuery", "lang": "adql", "format": "csv", "query": q}, headers=UA, timeout=120)
            r.raise_for_status()
            return list(csv.DictReader(io.StringIO(r.text)))
        except requests.RequestException as e:
            if attempt == 5:
                raise
            print(f"  retry ({e.__class__.__name__})")
            time.sleep(2 ** attempt)
    return []


def num(s: str | None) -> float | None:
    try:
        return float(s) if s not in (None, "") else None
    except ValueError:
        return None


def main() -> None:
    out = []
    for name, ident in GALAXIES:
        rows = tap(
            "SELECT b.oid, b.main_id, b.ra, b.dec, b.galdim_majaxis, b.galdim_minaxis, b.galdim_angle, b.morph_type, b.otype "
            f"FROM basic b JOIN ident i ON i.oidref = b.oid WHERE i.id = '{ident}'")
        if not rows:
            print(f"{name}: not found ({ident})")
            continue
        b = rows[0]
        oid = b["oid"]
        dists = tap(f"SELECT dist, unit, method FROM mesDistance WHERE oidref = {oid}")
        pcs = []
        for d in dists:
            v, u, m = num(d["dist"]), (d["unit"] or "").strip(), (d.get("method") or "").strip().lower()
            if v is None or v <= 0 or m in ("z", "redshift", "tf?"):
                continue
            pcs.append(v * {"pc": 1, "kpc": 1e3, "Mpc": 1e6}.get(u, float("nan")))
        pcs = [p for p in pcs if p == p]
        if not pcs:
            print(f"{name}: no distance")
            continue
        dist = statistics.median(pcs)
        flux = {f["filter"]: num(f["flux"]) for f in tap(f"SELECT filter, flux FROM flux WHERE oidref = {oid} AND filter IN ('V', 'B')")}
        vmag = flux.get("V") if flux.get("V") is not None else (flux["B"] - 0.8 if flux.get("B") is not None else None)
        maj, mnr = num(b["galdim_majaxis"]), num(b["galdim_minaxis"])
        if maj is None:
            print(f"{name}: no size")
            continue
        g = {"name": name, "simbad": b["main_id"], "ra": float(b["ra"]), "dec": float(b["dec"]), "distPc": round(dist, 1),
             "nDist": len(pcs), "majArcmin": maj, "minArcmin": mnr if mnr else maj, "paDeg": num(b["galdim_angle"]) or 0.0,
             "morph": (b["morph_type"] or "").strip(), "otype": b["otype"], "vmag": vmag}
        print(f"{name}: {dist / 1e6:.3f} Mpc ({len(pcs)} measurements) {maj}'x{mnr}' PA {g['paDeg']} {g['morph']} V={vmag}")
        out.append(g)
    write_json(OUT / "galaxies.json", {"source": "SIMBAD (CDS) via TAP", "galaxies": out}, compact=False)


if __name__ == "__main__":
    main()
