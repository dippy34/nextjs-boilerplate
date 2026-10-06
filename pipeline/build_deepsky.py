"""Nebulae and star clusters for the engine: public/data/deepsky.json

Source (downloaded here): SIMBAD (CDS, Strasbourg) via TAP - position, apparent size, object type,
distance (median of the published measurements in mesDistance, or the parallax), V magnitude.
Acknowledgement: "This research has made use of the SIMBAD database, operated at CDS, Strasbourg,
France" (Wenger et al. 2000, A&AS 143, 9).

The engine draws nebulae procedurally (emission clouds, planetary-nebula shells, supernova-remnant
filaments) at their catalogued size, generates the stars of globular clusters from a King profile,
and marks open clusters (whose stars are already in the star catalogues).
"""
from __future__ import annotations

import statistics

from build_galaxies import num, tap
from common import OUT, write_json

# (display name, SIMBAD identifier, kind, overrides). Overrides fill what SIMBAD lacks:
#   size: ("sh2", n) Sharpless (1959) catalogue diameter, VizieR VII/20; ("rcw", n) Rodgers, Campbell &
#         Whiteoak (1960) major axis, VizieR VII/216; ("simbad", id) another SIMBAD object;
#         ("pc", r, ref) a published physical radius
#   dist: ("simbad", id) distance of an associated object (ionising cluster, host galaxy, star);
#         ("pc", d, ref) a published distance
OBJECTS = [
    ("Orion Nebula", "M 42", "emission", {}),
    ("Lagoon Nebula", "M 8", "emission", {"size": ("sh2", 25), "dist": ("simbad", "NGC 6530")}),
    ("Eagle Nebula", "M 16", "emission", {"size": ("sh2", 49)}),
    ("Omega Nebula", "M 17", "emission", {"size": ("sh2", 45)}),
    ("Trifid Nebula", "M 20", "emission", {}),
    ("Carina Nebula", "NGC 3372", "emission", {"size": ("rcw", 53)}),
    ("Rosette Nebula", "NAME Rosette Nebula", "emission", {"size": ("sh2", 275)}),
    ("North America Nebula", "NGC 7000", "emission", {"size": ("sh2", 117)}),
    ("Tarantula Nebula", "NAME Tarantula Nebula", "emission", {"dist": ("simbad", "NAME LMC")}),
    ("California Nebula", "NGC 1499", "emission", {"size": ("sh2", 220), "dist": ("simbad", "HD 24912")}),
    ("Heart Nebula", "IC 1805", "emission", {"size": ("sh2", 190)}),
    ("Cat's Paw Nebula", "NGC 6334", "emission", {}),
    ("Ring Nebula", "M 57", "planetary", {}), ("Dumbbell Nebula", "M 27", "planetary", {}), ("Helix Nebula", "NGC 7293", "planetary", {}),
    ("Cat's Eye Nebula", "NGC 6543", "planetary", {}), ("Southern Ring Nebula", "NGC 3132", "planetary", {}), ("Owl Nebula", "M 97", "planetary", {}),
    ("Eskimo Nebula", "NGC 2392", "planetary", {}),
    ("Crab Nebula", "M 1", "snr", {}),
    ("Veil Nebula (Cygnus Loop)", "NAME Cygnus Loop", "snr", {"dist": ("pc", 735.0, "Fesen et al. 2018, MNRAS 481, 1786")}),
    ("Cassiopeia A", "NAME Cas A", "snr", {}),
    ("Pleiades", "M 45", "open", {}), ("Beehive Cluster", "M 44", "open", {}),
    ("Hyades", "Cl Melotte 25", "open", {"size": ("pc", 10.0, "tidal radius, Perryman et al. 1998, A&A 331, 81")}),
    ("Double Cluster (h Persei)", "NGC 869", "open", {}), ("Wild Duck Cluster", "M 11", "open", {}), ("Ptolemy Cluster", "M 7", "open", {}),
    ("Butterfly Cluster", "M 6", "open", {}), ("Jewel Box", "NGC 4755", "open", {}), ("M35", "M 35", "open", {}),
    ("Omega Centauri", "NGC 5139", "globular", {}), ("47 Tucanae", "NGC 104", "globular", {}), ("Hercules Cluster (M13)", "M 13", "globular", {}),
    ("M22", "M 22", "globular", {}), ("M4", "M 4", "globular", {}), ("M5", "M 5", "globular", {}), ("M3", "M 3", "globular", {}),
    ("M15", "M 15", "globular", {}), ("NGC 6397", "NGC 6397", "globular", {}), ("M92", "M 92", "globular", {}),
]

VIZ = "https://tapvizier.cds.unistra.fr/TAPVizieR/tap/sync"


def viz(q: str) -> list[dict[str, str]]:
    import csv as _csv
    import io as _io
    import requests as _rq
    from common import UA
    for attempt in range(5):
        try:
            r = _rq.get(VIZ, params={"request": "doQuery", "lang": "adql", "format": "csv", "query": q}, headers=UA, timeout=120)
            r.raise_for_status()
            return list(_csv.DictReader(_io.StringIO(r.text)))
        except Exception:  # noqa: BLE001
            if attempt == 4:
                raise
    return []


def simbad_dist(ident: str) -> tuple[float | None, int]:
    rows = tap(f"SELECT b.oid, b.plx_value FROM basic b JOIN ident i ON i.oidref = b.oid WHERE i.id = '{ident}'")
    if not rows:
        return None, 0
    pcs = []
    for d in tap(f"SELECT dist, unit FROM mesDistance WHERE oidref = {rows[0]['oid']}"):
        v, u = num(d["dist"]), (d["unit"] or "").strip()
        if v and v > 0:
            pcs.append(v * {"pc": 1, "kpc": 1e3, "Mpc": 1e6}.get(u, float("nan")))
    pcs = [p for p in pcs if p == p]
    if pcs:
        return statistics.median(pcs), len(pcs)
    plx = num(rows[0]["plx_value"])
    return (1000.0 / plx if plx and plx > 0.2 else None), 1


def main() -> None:
    out = []
    for name, ident, kind, over in OBJECTS:
        rows = tap(
            "SELECT b.oid, b.main_id, b.ra, b.dec, b.galdim_majaxis, b.galdim_minaxis, b.galdim_angle, b.otype, b.plx_value "
            f"FROM basic b JOIN ident i ON i.oidref = b.oid WHERE i.id = '{ident}'")
        if not rows:
            print(f"{name}: not found ({ident})")
            continue
        b = rows[0]
        oid = b["oid"]
        notes = []
        if "dist" in over and over["dist"][0] == "pc":
            dist, ndist = over["dist"][1], 1
            notes.append(f"distance: {over['dist'][2]}")
        elif "dist" in over:
            dist, ndist = simbad_dist(over["dist"][1])
            notes.append(f"distance of {over['dist'][1]} (SIMBAD)")
        else:
            dist, ndist = simbad_dist(ident)
        if dist is None:
            print(f"{name}: no distance")
            continue
        flux = {f["filter"]: num(f["flux"]) for f in tap(f"SELECT filter, flux FROM flux WHERE oidref = {oid} AND filter IN ('V', 'B')")}
        vmag = flux.get("V") if flux.get("V") is not None else (flux["B"] - 0.6 if flux.get("B") is not None else None)
        maj = num(b["galdim_majaxis"])
        mnr = num(b["galdim_minaxis"])
        if "size" in over:
            k = over["size"]
            if k[0] == "sh2":
                maj = num(viz(f'SELECT Diam FROM "VII/20/catalog" WHERE Sh2 = {k[1]}')[0]["Diam"])
                mnr = maj
                notes.append(f"size: Sharpless 2-{k[1]} (VizieR VII/20)")
            elif k[0] == "rcw":
                r0 = viz(f'SELECT MajAxis, MinAxis FROM "VII/216/rcw" WHERE RCW = {k[1]}')[0]
                maj, mnr = num(r0["MajAxis"]), num(r0["MinAxis"])
                notes.append(f"size: RCW {k[1]} (VizieR VII/216)")
            elif k[0] == "pc":
                import math
                maj = 2 * math.degrees(math.atan(k[1] / dist)) * 60
                mnr = maj
                notes.append(f"size: {k[2]}")
        if maj is None:
            print(f"{name}: no size")
            continue
        mnr = mnr or maj
        o = {"name": name, "simbad": b["main_id"], "kind": kind, "otype": b["otype"], "ra": float(b["ra"]), "dec": float(b["dec"]),
             "distPc": round(dist, 2), "nDist": ndist, "notes": notes, "majArcmin": maj, "minArcmin": mnr, "paDeg": num(b["galdim_angle"]) or 0.0, "vmag": vmag}
        print(f"{name}: {dist:.0f} pc ({ndist} meas.) {maj}'x{mnr}' {b['otype']} V={vmag} {notes}")
        out.append(o)
    write_json(OUT / "deepsky.json", {"source": "SIMBAD (CDS) via TAP", "objects": out}, compact=False)


if __name__ == "__main__":
    main()
