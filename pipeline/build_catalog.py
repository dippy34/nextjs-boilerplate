"""The searchable catalogue of real objects: public/data/catalog/

About 200,000 real stars, white and brown dwarfs, pulsars, planet candidates, X-ray binaries,
quasars with black-hole masses, galaxies with distances, star clusters and nebulae, each with a
real 3D position (heliocentric, from a distance estimate; the estimate's quality is flagged) so it
can be searched, shown on an info card and flown to. Sources (downloaded by catalog_sources.py; all
credited in CREDITS.md):

  s  stars          AT-HYG v4.0 (Hipparcos + Gliese stars within 900 pc, Gaia DR3 / Hipparcos distances)  CC BY-SA 4.0
  w  white dwarfs   Gentile Fusillo+ 2021 (Gaia EDR3), P_WD > 0.75 within 50 pc                VizieR J/MNRAS/508/3877
  d  brown dwarfs   Kirkpatrick+ 2021, the 20 pc census of L, T and Y dwarfs                     VizieR J/ApJS/253/7
  p  pulsars        ATNF Pulsar Catalogue v2 (Manchester+ 2005), best distances (psrcat DIST)
  t  planet hosts   TESS Objects of Interest (NASA Exoplanet Archive), not false positives
  x  X-ray binaries Avakyan+ 2023 (LMXB) and Neumann+ 2023 (HMXB) XRBcats                         VizieR J/A+A/675/A199, 677/A134
  q  quasars        Shen+ 2011 SDSS DR7 quasars with virial black-hole masses (the 1,900 nearest) VizieR J/ApJS/194/45
                    + 8 famous quasars and blazars (3C 273, OJ 287, TON 618, ...) with published masses
  g  galaxies       Cosmicflows-4 (Tully+ 2023) distances, OpenNGC names/sizes (CC BY-SA 4.0),
                    Karachentsev+ 2013 Updated Nearby Galaxy Catalog                            VizieR J/ApJ/944/94, J/AJ/145/101
  c  clusters       Hunt & Reffert 2023 (Gaia DR3), Harris 1996 (2010 ed.) globulars             VizieR J/A+A/673/A114, VII/202
  n  nebulae        planetary nebulae: Chornay & Walton 2021 (Gaia EDR3 central-star distances);
                    supernova remnants: Green 2019 + Ranasinghe & Leahy 2023 distances;
                    H II regions: Anderson+ 2014 WISE catalogue (with distances), Sharpless names

Distance flags: m = measured (parallax, standard candles, TRGB, cluster fits ...), e = estimated
(dispersion-measure model, kinematic, statistical), z = from redshift (Planck 2018 cosmology,
comoving distance; Hubble flow for nearby galaxies).

Output
  manifest.json          categories (fields, counts, featured rows), index chunk table, credits
  rec/<c>/<k>.tsv        records of category c, rows k*CHUNK.. (tab-separated, fields per category)
  idx/<k>.txt            search index: "label<TAB>category<TAB>row(base 36)<TAB>rank" sorted by
                         normalised key (norm(label), the same function as src/universe/CatalogSearch.ts)
"""
from __future__ import annotations

import csv
import gzip
import io
import json
import math
import re
import shutil
import subprocess
import tarfile
import unicodedata
import warnings
from collections import defaultdict

import numpy as np

from catalog_sources import DIR as RAWDIR, cds_file, cds_path, fetch_all
from common import OUT, write_json

warnings.filterwarnings("ignore")
DEST = OUT / "catalog"
CHUNK = 4000          # records per file
IDX_CHUNK = 8000      # index lines per file (few, larger files: static hosts cap the file count)

GREEK = {"Alp": "α", "Bet": "β", "Gam": "γ", "Del": "δ", "Eps": "ε", "Zet": "ζ", "Eta": "η", "The": "θ",
         "Iot": "ι", "Kap": "κ", "Lam": "λ", "Mu": "μ", "Nu": "ν", "Xi": "ξ", "Omi": "ο", "Pi": "π",
         "Rho": "ρ", "Sig": "σ", "Tau": "τ", "Ups": "υ", "Phi": "φ", "Chi": "χ", "Psi": "ψ", "Ome": "ω"}
GREEK_NAMES = {"α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta", "ε": "epsilon", "ζ": "zeta", "η": "eta",
               "θ": "theta", "ι": "iota", "κ": "kappa", "λ": "lambda", "μ": "mu", "ν": "nu", "ξ": "xi",
               "ο": "omicron", "π": "pi", "ρ": "rho", "σ": "sigma", "ς": "sigma", "τ": "tau", "υ": "upsilon",
               "φ": "phi", "χ": "chi", "ψ": "psi", "ω": "omega"}


def norm(s: str) -> str:
    """Search key: lower case, Greek letters spelled out, accents dropped, Gliese/GJ/Gl and Messier
    unified, everything but a-z0-9 removed. Mirrored exactly by normKey() in CatalogSearch.ts."""
    s = s.lower()
    s = "".join(GREEK_NAMES.get(c, c) for c in s)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"^(gliese|gl|gj)[\s_.-]*(?=\d)", "gj", s)
    s = re.sub(r"^messier[\s_.-]*(?=\d)", "m", s)
    return re.sub(r"[^a-z0-9]", "", s)


def fnum(v, sig: int = 4) -> str:
    if v is None or (isinstance(v, float) and not math.isfinite(v)):
        return ""
    v = float(v)
    if v == 0:
        return "0"
    s = f"{v:.{sig}g}"
    if "e" in s:
        m, e = s.split("e")
        s = f"{m}e{int(e)}"
    return s


def fcoord(v: float) -> str:
    return f"{v:.5f}".rstrip("0").rstrip(".")


def val(x):
    """astropy masked/str cell -> float or None"""
    try:
        if x is None or getattr(x, "mask", False) is True:
            return None
        s = str(x).strip()
        if s in ("", "--", "-", "*"):
            return None
        f = float(s)
        return f if math.isfinite(f) else None
    except (TypeError, ValueError):
        return None


def sval(x) -> str:
    s = str(x).strip()
    return "" if s in ("--", "None") else s


def cds(cat: str, name: str):
    from astropy.io import ascii
    return ascii.read(str(cds_file(cat, name)), format="cds", readme=str(cds_path(cat, "ReadMe")))


def hms(h, m, s) -> float:
    return 15.0 * (float(h) + float(m) / 60 + float(s or 0) / 3600)


def dms(sign, d, m, s) -> float:
    v = float(d) + float(m) / 60 + float(s or 0) / 3600
    return -v if str(sign).strip() == "-" else v


def gal_to_radec(l_deg, b_deg):
    from astropy.coordinates import SkyCoord
    import astropy.units as u
    c = SkyCoord(l=np.atleast_1d(l_deg) * u.deg, b=np.atleast_1d(b_deg) * u.deg, frame="galactic").icrs
    return c.ra.deg, c.dec.deg


_COSMO = None
H0, OM = 67.66, 0.30966          # Planck 2018 (TT,TE,EE+lowE+lensing+BAO), flat; radiation neglected


def comoving_pc(z: float) -> float:
    """Comoving distance (pc) in flat LCDM, Planck 2018 parameters."""
    global _COSMO
    if _COSMO is None:
        zs = np.linspace(0, 10, 100001)
        inv_e = 1.0 / np.sqrt(OM * (1 + zs) ** 3 + (1 - OM))
        dc = np.concatenate([[0], np.cumsum((inv_e[1:] + inv_e[:-1]) * 0.5 * np.diff(zs))])
        _COSMO = (zs, dc * 299792.458 / H0 * 1e6)
    return float(np.interp(z, *_COSMO))


# ---------------------------------------------------------------- categories
class Cat:
    def __init__(self, code: str, name: str, label: str, fields: list[str], credit: str):
        self.code, self.name, self.label, self.fields, self.credit = code, name, label, fields, credit
        self.rows: list[dict] = []

    def add(self, name: str, aliases: list[str], ra: float, dec: float, dist: float, dflag: str, rank: int, **kw):
        if not (dist and dist > 0 and math.isfinite(dist)) or ra is None or dec is None:
            return
        seen, al = {name}, []
        for a in aliases:
            a = (a or "").strip()
            if a and a not in seen and "|" not in a and "\t" not in a:
                seen.add(a)
                al.append(a)
        self.rows.append(dict(name=name, aliases=al, ra=ra % 360.0, dec=dec, dist=dist, dflag=dflag,
                              rank=max(0, min(9, int(rank))), **kw))


COMMON = ["name", "aliases", "ra", "dec", "distPc", "distFlag"]


def stars() -> Cat:
    c = Cat("s", "stars", "Stars", COMMON + ["vmag", "absMag", "spect", "ci"],
            "AT-HYG v4.0 (D. Nash, astronexus), CC BY-SA 4.0: Hipparcos, Tycho-2, Gaia DR3, Gliese")
    with gzip.open(RAWDIR / "athyg_40.csv.gz", "rt") as f:
        for r in csv.DictReader(f):
            if not (r["hip"] or r["gl"]) or r["proper"] == "Sol":
                continue
            names = []
            if r["proper"]:
                names.append(r["proper"])
            con = r["con"]
            if r["bayer"] and con:
                b = r["bayer"]
                m = re.match(r"([A-Za-z]+)(-?\d*)", b)
                g = GREEK.get(m.group(1)) if m else None
                names.append(f"{g}{m.group(2).lstrip('-')} {con}" if g else f"{b} {con}")
            if r["flam"] and con:
                names.append(f"{r['flam']} {con}")
            if r["gl"]:
                gl = r["gl"].strip()
                names.append(gl if not re.match(r"^[\d.]+[A-Z]*$", gl) else f"Gl {gl}")
            if r["hd"]:
                names.append(f"HD {r['hd']}")
            if r["hr"]:
                names.append(f"HR {r['hr']}")
            if r["hip"]:
                names.append(f"HIP {r['hip']}")
            dist = val(r["dist"])
            if not dist or dist > 900:
                continue
            mag = val(r["mag"])
            rank = 0 if r["proper"] else (1 if r["bayer"] else 2 if (mag or 99) < 6.5 else 4 if (mag or 99) < 9 else 6)
            c.add(names[0], names[1:], float(r["ra"]) * 15.0, float(r["dec"]), dist,
                  "m" if r["dist_src"] in ("G_R3", "GAIA", "HIP", "T") or r["dist_src"].startswith("G") else "e",
                  rank, vmag=mag, absMag=val(r["absmag"]), spect=r["spect"], ci=val(r["ci"]))
    return c


def white_dwarfs() -> Cat:
    c = Cat("w", "white-dwarfs", "White dwarfs", COMMON + ["gmag", "teff", "massSun"],
            "Gentile Fusillo+ 2021, Gaia EDR3 white dwarfs (VizieR J/MNRAS/508/3877)")
    lines = [l for l in (RAWDIR / "wd100pc.tsv").read_text().splitlines() if l and not l.startswith("#")]
    head = lines[0].split("\t")
    for l in lines[3:]:
        r = dict(zip(head, [x.strip() for x in l.split("\t")]))
        plx = val(r["Plx"])
        if not plx or plx <= 20 or (val(r["Pwd"]) or 0) < 0.75:
            continue
        name = "WD " + r["WDJname"].replace("WDJ", "J")
        c.add(name, [r["WDJname"]], float(r["_RAJ2000"]), float(r["_DEJ2000"]), 1000.0 / plx, "m",
              4 if plx > 50 else 7, gmag=val(r["GmagCorr"]), teff=val(r["TeffH"]), massSun=val(r["MassH"]))
    return c


def brown_dwarfs() -> Cat:
    c = Cat("d", "brown-dwarfs", "Brown dwarfs", COMMON + ["spt", "teff"],
            "Kirkpatrick+ 2021, the 20 pc census of L, T and Y dwarfs (VizieR J/ApJS/253/7)")
    t11, t4 = cds("J/ApJS/253/7", "table11.dat"), cds("J/ApJS/253/7", "table4.dat")
    pos = {}
    for r in t4:
        pos.setdefault(sval(r["PName"]), (float(r["RAdeg"]), float(r["DEdeg"])))
    for r in t11:
        plx = val(r["plx"])
        p = pos.get(sval(r["PName"]))
        if not plx or not p:
            continue
        fn = f"{sval(r['Cat'])} {sval(r['FName'])}".strip()
        other = sval(r["OName"])
        name = other if other else fn
        spt = sval(r["SpTIR"]) or sval(r["SpTO"])
        c.add(name, [fn, f"WISE {sval(r['PName'])}" if False else ""], p[0], p[1], 1000.0 / plx, "m",
              3 if other else 5, spt=spt, teff=val(r["Teff"]))
    return c


def pulsars() -> Cat:
    c = Cat("p", "pulsars", "Pulsars", COMMON + ["periodS", "dm", "assoc", "type", "binary"],
            "ATNF Pulsar Catalogue (Manchester+ 2005, AJ 129, 1993), https://www.atnf.csiro.au/research/pulsar/psrcat/")
    tdir = RAWDIR / "psrcat_tar"
    if not (tdir / "psrcat").exists():
        with tarfile.open(RAWDIR / "psrcat_pkg.tar.gz") as tf:
            tf.extractall(RAWDIR)
        subprocess.run(["bash", "makeit"], cwd=tdir, check=True, capture_output=True)
    out = subprocess.run(["./psrcat", "-db_file", "psrcat.db", "-c", "PSRJ PSRB RAJD DECJD P0 DIST DIST_A PX DM ASSOC TYPE BINARY",
                          "-nohead", "-nonumber", "-o", "short_csv"], cwd=tdir, capture_output=True, text=True).stdout
    famous = {"B0531+21": "Crab Pulsar", "B0833-45": "Vela Pulsar", "J0437-4715": None, "B1919+21": None,
              "B1913+16": "Hulse-Taylor binary pulsar", "J0737-3039A": "Double Pulsar (A)", "J0737-3039B": "Double Pulsar (B)",
              "B1257+12": "Lich (PSR B1257+12)", "J1748-2446ad": None, "B1937+21": None,
              "J0633+1746": "Geminga"}
    for line in out.splitlines():
        f = [x.strip() for x in line.split(";")]
        if len(f) < 12:
            continue
        j, b, ra, dec, p0, dist, dista, px, dm, assoc, typ, binary = f[:12]
        d = val(dist)
        if d is None or val(ra) is None:
            continue
        names = [f"PSR {j}"] + ([f"PSR {b}"] if b and b != "*" else [])
        nick = famous.get(b) or famous.get(j)
        if nick:
            names.insert(0, nick)
        flag = "m" if (val(dista) is not None or (val(px) or 0) > 0) else "e"
        clean = lambda t: ",".join(dict.fromkeys(x for x in re.sub(r"\[[^\]]*(\]|$)", "", t).split(",") if x and not x.endswith(":")))  # noqa: E731
        a = clean(assoc if assoc != "*" else "")
        c.add(names[0], names[1:], val(ra), val(dec), d * 1000.0, flag, 1 if nick else (5 if b and b != "*" else 7),
              periodS=val(p0), dm=val(dm), assoc=a[:80], type=clean(typ if typ != "*" else "")[:30],
              binary="" if binary == "*" else binary)
    return c


def toi_hosts() -> Cat:
    c = Cat("t", "toi", "TESS candidates", COMMON + ["tmag", "teff", "radSun", "planets"],
            "NASA Exoplanet Archive, TESS Objects of Interest (TOI) table")
    hosts = defaultdict(list)
    with open(RAWDIR / "toi.csv") as f:
        for r in csv.DictReader(f):
            if r["tfopwg_disp"] in ("FP", "FA"):
                continue
            hosts[r["toipfx"]].append(r)
    for pfx, rs in hosts.items():
        r0 = rs[0]
        d = val(r0["st_dist"])
        if not d:
            continue
        pl = []
        for r in sorted(rs, key=lambda r: r["toi"]):
            pl.append(":".join([f"TOI-{r['toi']}", fnum(val(r["pl_orbper"]), 5), fnum(val(r["pl_rade"]), 3),
                                fnum(val(r["pl_eqt"]), 3), r["tfopwg_disp"]]))
        known = any(r["tfopwg_disp"] in ("CP", "KP") for r in rs)
        c.add(f"TOI-{pfx}", [f"TIC {r0['tid']}"] + [f"TOI-{r['toi']}" for r in rs], val(r0["ra"]), val(r0["dec"]), d, "m",
              4 if known else 6, tmag=val(r0["st_tmag"]), teff=val(r0["st_teff"]), radSun=val(r0["st_rad"]), planets=";".join(pl))
    return c


def xrbs() -> Cat:
    c = Cat("x", "x-ray-binaries", "X-ray binaries", COMMON + ["class", "xrayType", "spType", "porbDays", "massSun", "blackHole"],
            "XRBcats: Avakyan+ 2023 (LMXB, VizieR J/A+A/675/A199), Neumann+ 2023 (HMXB, J/A+A/677/A134)")
    for r in cds("J/A+A/675/A199", "lmxbcat.dat"):
        d = val(r["MeanDist"])
        xt = sval(r["XrayType"])
        bh = 2 if re.search(r"\bBH\b(?!\?)", xt) else (1 if "BH?" in xt else 0)
        alt = [a.strip() for a in sval(r["AName"]).split(",")]
        c.add(sval(r["Name"]), alt, val(r["RAdeg"]), val(r["DEdeg"]), d, "e", 2 if bh else 5,
              **{"class": "LMXB"}, xrayType=xt, spType=sval(r["SpType"]), porbDays=val(r["Porb"]), massSun=val(r["Mx"]), blackHole=bh)
    for r in cds("J/A+A/677/A134", "hmxbcat.dat"):
        d = val(r["Dist"])
        m = val(r["Mass"])
        bh = 2 if (m or 0) > 3 else 0
        alt = [a.strip() for a in sval(r["AltName"]).split(",")]
        c.add(sval(r["Name"]), alt, val(r["RAdeg"]), val(r["DEdeg"]), d, "e", 2 if bh else 5,
              **{"class": "HMXB"}, xrayType=sval(r["XrayType"]), spType=sval(r["SpType"]), porbDays=val(r["Porb"]), massSun=m, blackHole=bh)
    return c


# Famous quasars and blazars outside the SDSS list (too bright for SDSS, or beyond z = 5), with
# published black-hole masses. Positions and redshifts: SIMBAD (2026), or the J2000 name.
FAMOUS_QSO = [
    # name, aliases, ra, dec, z, mass (Sun), reference
    ("3C 273", ["PG 1226+023", "QSO B1226+023"], 187.27792, 2.05239, 0.15757, 2.6e8,
     "GRAVITY Collaboration 2018, Nature 563, 657 (resolved broad-line region)"),
    ("OJ 287", ["PG 0851+202", "PKS 0851+202"], 133.70365, 20.10851, 0.306, 1.835e10,
     "Dey et al. 2018, ApJ 866, 11 (the primary of the binary black hole)"),
    ("TON 618", ["Ton 618", "QSO B1225+317"], 187.10402, 31.47712, 2.219, 6.6e10, "Shemmer et al. 2004, ApJ 614, 547 (C IV virial mass)"),
    ("S5 0014+81", ["QSO B0014+810"], 4.28531, 81.58559, 3.378, 4e10, "Ghisellini et al. 2010, MNRAS 405, 387 (accretion-disk fit)"),
    ("Markarian 421", ["Mrk 421"], 166.11381, 38.20883, 0.0300, 2e8, "Barth, Ho & Sargent 2003, ApJ 583, 134 (velocity dispersion)"),
    ("Markarian 501", ["Mrk 501"], 253.46757, 39.76017, 0.03412, 1e9, "Barth, Ho & Sargent 2003, ApJ 583, 134 (velocity dispersion)"),
    ("J0313-1806", ["DES J031343.84-180636.4"], 48.43267, -18.11011, 7.642, 1.6e9,
     "Wang et al. 2021, ApJL 907, L1 (the most distant quasar known)"),
    ("ULAS J1342+0928", [], 205.53375, 9.47739, 7.5413, 7.8e8, "Bañados et al. 2018, Nature 553, 473"),
]


def quasars(limit: int = 1900) -> Cat:
    c = Cat("q", "quasars", "Quasars", COMMON + ["z", "logMassSun", "logLbol", "iAbsMag", "ref"],
            "Shen+ 2011, SDSS DR7 quasar properties with virial black-hole masses (VizieR J/ApJS/194/45); famous quasars: "
            "published masses (reference on each card)")
    t = cds("J/ApJS/194/45", "catalog.dat")
    for name, al, ra, dec, z, m, ref in FAMOUS_QSO:
        c.add(name, al, ra, dec, comoving_pc(z), "z", 0, z=z, logMassSun=round(math.log10(m), 3), logLbol=None, iAbsMag=None, ref=ref)
    rows = [r for r in t if (val(r["logBH"]) or 0) > 0]
    rows.sort(key=lambda r: float(r["z"]))
    for r in rows[:limit]:
        z = float(r["z"])
        c.add(f"SDSS J{sval(r['SDSS'])}", [], float(r["RAdeg"]), float(r["DEdeg"]), comoving_pc(z), "z", 6,
              z=z, logMassSun=val(r["logBH"]), logLbol=val(r["logLbol"]), iAbsMag=val(r["iMAG"]))
    return c


def galaxies() -> Cat:
    c = Cat("g", "galaxies", "Galaxies", COMMON + ["morph", "majArcmin", "minArcmin", "paDeg", "bmag", "method"],
            "Cosmicflows-4 (Tully+ 2023, VizieR J/ApJ/944/94); OpenNGC (M. Verga, CC BY-SA 4.0); "
            "Karachentsev+ 2013 Updated Nearby Galaxy Catalog (VizieR J/AJ/145/101)")
    g: dict[str, dict] = {}
    for r in cds("J/ApJ/944/94", "table2.dat"):
        pgc = int(r["PGC"])
        g[f"pgc{pgc}"] = dict(names=[f"PGC {pgc}"], ra=float(r["RAdeg"]), dec=float(r["DEdeg"]),
                             dist=10 ** (float(r["DM"]) / 5 + 1), flag="m", method="CF4", morph="", maj=None, mn=None, pa=None, bmag=None, rank=7)
    # OpenNGC: names, sizes, types; distance from the redshift when Cosmicflows has none
    def ngc_rows(path):
        with open(path, newline="") as f:
            yield from csv.DictReader(f, delimiter=";")
    gal_types = {"G", "GPair", "GTrpl", "GGroup"}
    for path in (RAWDIR / "openngc.csv", RAWDIR / "openngc_addendum.csv"):
        for r in ngc_rows(path):
            if r["Type"] not in gal_types or not r["RA"]:
                continue
            ids = [x.strip() for x in (r["Identifiers"] or "").split(",") if x.strip()]
            pgc = next((int(m.group(1)) for x in ids if (m := re.match(r"PGC 0*(\d+)", x))), None)
            nm = r["Name"]
            m = re.match(r"(NGC|IC)0*(\d+)(.*)", nm)
            pretty = f"{m.group(1)} {m.group(2)}{m.group(3)}" if m else nm
            names = []
            if r["Common names"]:
                names += [x.strip() for x in r["Common names"].split(",")]
            if r["M"]:
                names.append(f"M {int(r['M'])}")
            names.append(pretty)
            names += [re.sub(r"^(PGC|UGC) 0*(\d)", r"\1 \2", x) for x in ids if re.match(r"^(UGC|PGC|MCG|ESO|Arp|Mrk) ", x)]
            ra = hms(*r["RA"].split(":"))
            sd = r["Dec"]
            dec = dms(sd[0], *sd[1:].split(":"))
            maj, mn, pa = val(r["MajAx"]), val(r["MinAx"]), val(r["PosAng"])
            bmag = val(r["B-Mag"]) or val(r["V-Mag"])
            rank = 0 if r["M"] or r["Common names"] else (3 if (bmag or 99) < 12 else 5)
            key = f"pgc{pgc}" if pgc is not None else f"ngc:{nm}"
            if key in g:
                e = g[key]
                e["names"] = names + [n for n in e["names"] if n not in names]
                e.update(morph=r["Hubble"], maj=maj, mn=mn, pa=pa, bmag=bmag, rank=rank)
            else:
                z = val(r["Redshift"])
                if not z or z <= 0.0005:
                    continue
                d = (z * 299792.458 / 70.0) * 1e6 if z < 0.03 else comoving_pc(z)
                g[key] = dict(names=names, ra=ra, dec=dec, dist=d, flag="z", method="redshift", morph=r["Hubble"],
                              maj=maj, mn=mn, pa=pa, bmag=bmag, rank=rank)
    # Karachentsev's nearby galaxies: TRGB/Cepheid distances, matched by position (2 arcmin)
    t1, t2 = cds("J/AJ/145/101", "table1.dat"), cds("J/AJ/145/101", "table2.dat")
    keys = list(g)
    ras = np.radians([g[k]["ra"] for k in keys])
    des = np.radians([g[k]["dec"] for k in keys])
    vec = np.stack([np.cos(des) * np.cos(ras), np.cos(des) * np.sin(ras), np.sin(des)], 1)
    for r in t1:
        ra = hms(r["RAh"], r["RAm"], r["RAs"])
        dec = dms(r["DE-"], r["DEd"], r["DEm"], r["DEs"])
        d = val(r["Dist"])
        if not d:
            continue
        v = np.array([math.cos(math.radians(dec)) * math.cos(math.radians(ra)),
                      math.cos(math.radians(dec)) * math.sin(math.radians(ra)), math.sin(math.radians(dec))])
        i = int(np.argmax(vec @ v))
        name = sval(r["Name"])
        pretty = re.sub(r"^([A-Za-z]+)(\d)", r"\1 \2", name)
        if math.degrees(math.acos(min(1.0, float(vec[i] @ v)))) * 60 < 2:
            e = g[keys[i]]
            e.update(dist=d * 1e6, flag="m", method=f"UNGC {sval(r['f_Dist'])}".strip())
            if pretty not in e["names"]:
                e["names"].append(pretty)
            e["rank"] = min(e["rank"], 3)
        else:
            g[f"ungc:{name}"] = dict(names=[pretty], ra=ra, dec=dec, dist=d * 1e6, flag="m", method=f"UNGC {sval(r['f_Dist'])}".strip(),
                                    morph=sval(r["TT"]), maj=val(r["a26"]), mn=None, pa=None, bmag=val(r["Bmag"]), rank=4)
    for e in g.values():
        c.add(e["names"][0], e["names"][1:], e["ra"], e["dec"], e["dist"], e["flag"], e["rank"],
              morph=e["morph"] or "", majArcmin=e["maj"], minArcmin=e["mn"], paDeg=e["pa"], bmag=e["bmag"], method=e["method"])
    return c


def clusters() -> Cat:
    c = Cat("c", "clusters", "Star clusters", COMMON + ["type", "r50Deg", "members", "logAge", "extinctionAv"],
            "Hunt & Reffert 2023, star clusters in Gaia DR3 (VizieR J/A+A/673/A114); Harris 1996 (2010 edition) "
            "globular clusters (VizieR VII/202)")
    seen = set()
    nice = {"Melotte_22": "Pleiades", "Melotte_25": "Hyades", "NGC_2632": "Beehive Cluster (Praesepe)", "NGC_869": "h Persei",
            "NGC_884": "χ Persei", "Melotte_111": "Coma Star Cluster", "NGC_6705": "Wild Duck Cluster", "NGC_104": "47 Tucanae",
            "NGC_5139": "Omega Centauri", "NGC_6121": "M4", "NGC_2516": "Southern Beehive", "IC_2602": "Southern Pleiades",
            "Collinder_399": "Brocchi's Cluster", "NGC_3532": "Wishing Well Cluster", "NGC_7092": "M39"}
    for r in cds("J/A+A/673/A114", "clusters.dat"):
        raw = sval(r["Name"])
        nm = raw.replace("_", " ")
        al = [x.replace("_", " ") for x in sval(r["AllNames"]).split(",") if x]
        names = [nice[raw]] + [nm] if raw in nice else [nm]
        d = val(r["dist50"])
        typ = sval(r["Type"])
        n = int(r["N"])
        rank = 0 if raw in nice else (2 if typ == "g" or n > 1000 else 4 if n > 200 else 6)
        c.add(names[0], names[1:] + al, float(r["RAdeg"]), float(r["DEdeg"]), d, "m", rank,
              type=typ, r50Deg=val(r["r50"]), members=n, logAge=val(r["logAge50"]), extinctionAv=val(r["AV50"]))
        seen |= {norm(x) for x in names + al}
    nice_gc = {"NGC 104": "47 Tucanae", "NGC 5139": "Omega Centauri", "NGC 6205": "Hercules Globular Cluster (M13)",
               "NGC 7078": "Great Pegasus Cluster (M15)", "NGC 6656": "Sagittarius Cluster (M22)"}
    for r in cds("VII/202", "catalog"):
        ident, nm = sval(r["ID"]), sval(r["Name"])
        if norm(ident) in seen or (nm and norm(nm) in seen):
            continue
        al = [x for x in (nm, ident) if x]
        c.add(nice_gc.get(ident, al[0]), al if ident in nice_gc else al[1:], hms(r["RAh"], r["RAm"], r["RAs"]), dms(r["DE-"], r["DEd"], r["DEm"], r["DEs"]),
              (val(r["Rsun"]) or 0) * 1000, "m", 0 if ident in nice_gc else 2, type="g", r50Deg=None, members=None, logAge=None, extinctionAv=None)
    return c


def nebulae() -> Cat:
    c = Cat("n", "nebulae", "Nebulae", COMMON + ["kind", "majArcmin", "minArcmin", "note"],
            "Planetary nebulae: Chornay & Walton 2021 (VizieR J/A+A/656/A110); supernova remnants: Green 2019 "
            "(VizieR VII/297) with Ranasinghe & Leahy 2023 distances (J/ApJS/265/53); H II regions: Anderson+ 2014 "
            "WISE catalogue (J/ApJS/212/1), Sharpless 1959 (VII/20)")
    # planetary nebulae (central-star distances: parallax + statistical prior)
    for r in cds("J/A+A/656/A110", "tablea1.dat"):
        d = val(r["rcomb"])
        if not d:
            continue
        nm = sval(r["Name"])
        rad = val(r["pnRad"])
        c.add(nm or f"PN G{sval(r['PNG'])}", [f"PN G{sval(r['PNG'])}"], val(r["pnRAdeg"]) or val(r["RAdeg"]),
              val(r["pnDEdeg"]) or val(r["DEdeg"]), d, "m" if (val(r["plx"]) or 0) > 0 else "e",
              3 if re.match(r"^(NGC|IC|M) ", nm or "") else 6,
              kind="planetary", majArcmin=(2 * rad / 60 if rad else None), minArcmin=None, note="")
    # supernova remnants
    def gkey(s: str) -> str:
        m = re.match(r"G?\s*(\d+\.\d)\s*([+-])\s*(\d+\.\d)", s.strip())
        return f"{float(m.group(1)):.1f}{m.group(2)}{float(m.group(3)):.1f}" if m else s.strip()
    dist = {}
    for r in cds("J/ApJS/265/53", "table1.dat"):
        if val(r["X"]) and sval(r["l_X"]) not in ("<", ">"):
            dist[gkey(sval(r["SNR"]))] = val(r["X"])
    for r in cds("VII/297", "snrs.dat"):
        g = sval(r["SNR"])
        d = dist.get(gkey(g))
        if not d:
            continue
        nm = sval(r["Names"])
        names = [x.strip() for x in nm.split(",") if x.strip()] if nm else []
        if names and names[0] in ("Cassiopeia A", "Cas A"):
            names = ["Cassiopeia A", "Cas A"] + [n for n in names[1:] if n not in ("Cassiopeia A", "Cas A")]
        c.add(names[0] if names else f"SNR G{g.lstrip('G')}", names[1:] + [f"SNR G{g.lstrip('G')}"],
              hms(r["RAh"], r["RAm"], r["RAs"]), dms(r["DE-"], r["DEd"], r["DEm"], 0), d * 1000, "e", 3 if names else 6,
              kind="snr", majArcmin=val(r["MajDiam"]), minArcmin=val(r["MinDiam"]), note=sval(r["type"]))
    # H II regions with distances (WISE), Sharpless designations where they match
    sh = {int(r["Sh2"]): r for r in cds("VII/20", "catalog.dat")}
    t2, t6 = cds("J/ApJS/212/1", "table2.dat"), cds("J/ApJS/212/1", "table6.dat")
    d6 = {sval(r["WISE"]): r for r in t6}
    rows = [(r, d6.get(sval(r["WISE"]))) for r in t2]
    rows = [(r, q) for r, q in rows if q is not None and val(q["Dist"])]
    ra, de = gal_to_radec([float(r["GLON"]) for r, _ in rows], [float(r["GLAT"]) for r, _ in rows])
    for (r, q), a, b in zip(rows, ra, de):
        hn = sval(r["HIIName"])
        names = []
        m = re.match(r"^S(\d+)$", hn)
        if m:
            names.append(f"Sh 2-{m.group(1)}")
            sh.pop(int(m.group(1)), None)
        elif hn:
            names.append(hn)
        w = f"WISE G{sval(r['WISE'])}"
        rad = val(r["Rad"])
        c.add(names[0] if names else w, names[1:] + [w], float(a), float(b), val(q["Dist"]) * 1000, "e", 3 if names else 7,
              kind="emission", majArcmin=(2 * rad / 60 if rad else None), minArcmin=None, note=sval(r["Cl"]))
    return c


# ---------------------------------------------------------------- output
def b36(n: int) -> str:
    s = ""
    while True:
        n, r = divmod(n, 36)
        s = "0123456789abcdefghijklmnopqrstuvwxyz"[r] + s
        if n == 0:
            return s


def word_keys(name: str) -> list[str]:
    """Extra keys for multi-word proper names: each later word start ("Magellanic Cloud", "Cloud")."""
    if re.search(r"\d", name) and not re.match(r"^[A-Za-z' ]+$", name):
        return []
    words = re.findall(r"[^\s\-()]+", name)
    return [" ".join(words[i:]) for i in range(1, len(words)) if len(words[i]) >= 4 and words[i][0].isalpha()]


def write(cats: list[Cat]) -> dict:
    if DEST.exists():
        shutil.rmtree(DEST)
    (DEST / "idx").mkdir(parents=True)
    index = []
    man_cats = {}
    for c in cats:
        # nearest first within a category: featured lists and chunk locality
        c.rows.sort(key=lambda r: (r["rank"], r["dist"]))
        d = DEST / "rec" / c.code
        d.mkdir(parents=True)
        lines = []
        for i, r in enumerate(c.rows):
            f = [r["name"], "|".join(r["aliases"]), fcoord(r["ra"]), fcoord(r["dec"]), fnum(r["dist"], 5), r["dflag"]]
            for k in c.fields[len(COMMON):]:
                v = r.get(k)
                f.append(fnum(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else ("" if v is None else str(v)))
            lines.append("\t".join(x.replace("\t", " ").replace("\n", " ") for x in f))
            for lab in [r["name"], *r["aliases"]] + word_keys(r["name"]):
                k = norm(lab)
                if len(k) >= 2:
                    index.append((k, lab, c.code, i, r["rank"]))
        for k in range(0, len(lines), CHUNK):
            (d / f"{k // CHUNK}.tsv").write_text("\n".join(lines[k:k + CHUNK]) + "\n")
        featured = [i for i, r in enumerate(c.rows[:400]) if r["rank"] <= 3][:48] or list(range(min(48, len(c.rows))))
        man_cats[c.code] = {"name": c.name, "label": c.label, "count": len(c.rows), "chunk": CHUNK,
                            "files": (len(lines) + CHUNK - 1) // CHUNK, "fields": c.fields, "credit": c.credit,
                            "featured": featured}
        print(f"  {c.code} {c.label}: {len(c.rows)}", flush=True)
    # index: sorted by key, duplicates of the same object under the same key dropped
    index.sort(key=lambda e: (e[0], e[4], len(e[1])))
    seen, uniq = set(), []
    for e in index:
        t = (e[0], e[2], e[3])
        if t not in seen:
            seen.add(t)
            uniq.append(e)
    chunks = []
    for k in range(0, len(uniq), IDX_CHUNK):
        part = uniq[k:k + IDX_CHUNK]
        (DEST / "idx" / f"{k // IDX_CHUNK}.txt").write_text("\n".join(f"{e[1]}\t{e[2]}\t{b36(e[3])}\t{e[4]}" for e in part) + "\n")
        chunks.append(part[0][0])
    total = sum(len(c.rows) for c in cats)
    man = {"version": 1, "objects": total, "keys": len(uniq), "chunk": CHUNK, "indexChunks": chunks,
           "units": "heliocentric ICRS (J2000) RA/Dec in degrees, distance in parsecs",
           "distFlags": {"m": "measured", "e": "estimated (model / kinematic / statistical)", "z": "from redshift (Planck 2018)"},
           "categories": man_cats}
    write_json(DEST / "manifest.json", man)
    size = sum(p.stat().st_size for p in DEST.rglob("*") if p.is_file())
    print(f"  {total} objects, {len(uniq)} search keys, {size / 1e6:.1f} MB", flush=True)
    return man


def main() -> None:
    fetch_all()
    cats = [stars(), galaxies(), clusters(), nebulae(), pulsars(), xrbs(), quasars(), white_dwarfs(), brown_dwarfs(), toi_hosts()]
    write(cats)


if __name__ == "__main__":
    main()
