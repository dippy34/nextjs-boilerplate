"""Build the Solar System description consumed by the engine.

Sources (all downloaded, nothing typed in from memory):
  * NAIF pck00011.tpc            - IAU rotation models (pole RA/Dec, prime meridian, nutation terms), radii
  * NAIF gm_de440.tpc            - GM values
  * NAIF naif0012.tls            - leap seconds (UTC <-> TDB)
  * JPL SSD sats/elem            - mean orbital elements of 459 planetary satellites
  * JPL SSD sats/phys_par        - satellite GM / mean radius
  * JPL SSD planets/phys_par     - planet + dwarf planet physical data (albedo, V(1,0), rotation)
  * JPL SSD planets/approx_pos   - Keplerian elements (3000 BC - 3000 AD) used outside DE442S coverage
  * JPL SBDB Query API           - large asteroids / TNOs, numbered asteroids (H < 15), all comets
  * PDS Rings Node VG_2801       - Voyager 2 PPS delta Sco occultation: Saturn ring normal opacity profile
"""
from __future__ import annotations

import json
import math
import re
import struct
import urllib.parse

import numpy as np
import requests
from PIL import Image

from common import AU_KM, OUT, RAW, UA, download, html_tables, write_json

DEST = OUT / "solar"
NAIF = "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/"
SSD = "https://ssd.jpl.nasa.gov/"
SBDB = "https://ssd-api.jpl.nasa.gov/sbdb_query.api"
RINGS = "https://pds-rings.seti.org/holdings/volumes/VG_28xx/VG_2801/EASYDATA/KM010/"

J2000 = 2451545.0
# SBDB primary designation -> texture key (avoids name clashes such as asteroid 85 Io vs Jupiter's Io)
SMALL_BODY_TEXTURES = {"1": "ceres", "4": "vesta"}


# ----------------------------------------------------------------------------- text kernels
def parse_text_kernel(text: str) -> dict[str, list]:
    """Parse the \\begindata sections of a NAIF text kernel into {name: [values]}."""
    out: dict[str, list] = {}
    blocks = re.findall(r"\\begindata(.*?)(?=\\begintext|\Z)", text, flags=re.S)
    data = "\n".join(blocks)
    for m in re.finditer(r"([A-Z0-9_]+)\s*(\+?=)\s*(\([^)]*\)|'[^']*'|[^\s]+)", data):
        name, op, raw = m.groups()
        raw = raw.strip()
        if raw.startswith("("):
            raw = raw[1:-1]
        vals: list = []
        for tok in re.findall(r"'[^']*'|@[^\s,]+|[^\s,]+", raw):
            if tok.startswith("'"):
                vals.append(tok.strip("'"))
            elif tok.startswith("@"):
                vals.append(tok)
            else:
                vals.append(float(tok.replace("D", "E").replace("d", "e")))
        if op == "+=" and name in out:
            out[name].extend(vals)
        else:
            out[name] = vals
    return out


def num(s: str):
    """First number in a table cell like '2440.53 [D] ±0.04' (None if absent)."""
    m = re.match(r"\s*([-+]?\d+(?:\.\d*)?(?:[eE][-+]?\d+)?)", s or "")
    return float(m.group(1)) if m else None


# ----------------------------------------------------------------------------- SBDB
def sbdb(fields: list[str], params: dict) -> list[dict]:
    q = {"fields": ",".join(fields), "full-prec": "true", **params}
    url = SBDB + "?" + urllib.parse.urlencode(q)
    cache = RAW / ("sbdb_" + re.sub(r"[^a-z0-9]+", "_", json.dumps(params).lower())[:80] + ".json")
    if not cache.exists():
        r = requests.get(url, headers=UA, timeout=600)
        r.raise_for_status()
        cache.write_text(r.text)
        print(f"  SBDB query -> {cache.name}")
    js = json.loads(cache.read_text())
    return [dict(zip(js["fields"], row)) for row in js["data"]]


def f(x):
    return None if x in (None, "") else float(x)


# ----------------------------------------------------------------------------- main
def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    pck = parse_text_kernel(download(NAIF + "pck/pck00011.tpc", RAW / "pck00011.tpc").read_text())
    gmk = parse_text_kernel(download(NAIF + "pck/gm_de440.tpc", RAW / "gm_de440.tpc").read_text())
    lsk = parse_text_kernel(download(NAIF + "lsk/naif0012.tls", RAW / "naif0012.tls").read_text())
    sat_elem = html_tables(download(SSD + "sats/elem/", RAW / "sat_elem.html").read_text())[0]
    sat_phys = html_tables(download(SSD + "sats/phys_par/", RAW / "sat_phys_par.html").read_text())[0]
    pl_phys_tables = html_tables(download(SSD + "planets/phys_par.html", RAW / "planet_phys_par.html").read_text())
    approx_html = download(SSD + "planets/approx_pos.html", RAW / "approx_pos.html").read_text()

    def gm(code: int):
        v = gmk.get(f"BODY{code}_GM")
        return v[0] if v else None

    def rotation(code: int):
        ra = pck.get(f"BODY{code}_POLE_RA")
        if not ra:
            return None
        rot = {"ra": ra, "dec": pck[f"BODY{code}_POLE_DEC"], "pm": pck[f"BODY{code}_PM"]}
        for k in ("RA", "DEC", "PM"):
            v = pck.get(f"BODY{code}_NUT_PREC_{k}")
            if v and any(x != 0 for x in v):
                rot["nut" + k.capitalize()] = v
        if any(k.startswith("nut") for k in rot):
            rot["system"] = code // 100 if code >= 100 else code
        return rot

    def radii(code: int):
        r = pck.get(f"BODY{code}_RADII")
        return r if r else None

    # nutation/precession angle tables per planetary system: [[a0 deg, a1 deg/century], ...]
    systems = {}
    for k, v in pck.items():
        m = re.fullmatch(r"BODY(\d)_NUT_PREC_ANGLES", k)
        if m:
            systems[m.group(1)] = [v[i:i + 2] for i in range(0, len(v), 2)]

    # ---- planets & dwarf planets physical table
    phys = {}
    for t in pl_phys_tables[:2]:
        for row in t[2:]:
            if len(row) < 11:
                continue
            phys[row[0]] = dict(eqRadius=num(row[1]), meanRadius=num(row[2]), rotPeriodDays=num(row[5]),
                                orbitPeriodYears=num(row[6]), V10=num(row[7]), albedo=num(row[8]))

    tex = json.loads((OUT / "textures" / "manifest.json").read_text())
    disk = {k: v["linearRGB"] for k, v in tex["diskColors"].items()}

    bodies = []

    def add(b):
        bodies.append({k: v for k, v in b.items() if v is not None})

    add(dict(id=10, name="Sun", type="star", parent=None, ephem={"kind": "spk", "chain": [[0, 10]]},
             radii=radii(10), gm=gm(10), rot=rotation(10), teff=5772, absMag=4.83,
             spectralType="G2V"))
    planets = [
        (199, "Mercury", 1, [[0, 1]], "mercury", None),
        (299, "Venus", 2, [[0, 2]], None, disk["venus"]),
        (399, "Earth", 3, [[0, 3], [3, 399]], "earth_day", None),
        (499, "Mars", 4, [[0, 4]], "mars", None),
        (599, "Jupiter", 5, [[0, 5]], "jupiter", None),
        (699, "Saturn", 6, [[0, 6]], None, disk["saturn"]),
        (799, "Uranus", 7, [[0, 7]], None, disk["uranus"]),
        (899, "Neptune", 8, [[0, 8]], None, disk["neptune"]),
        (999, "Pluto", 9, [[0, 9]], "pluto", None),
    ]
    for code, name, bary, chain, texture, color in planets:
        p = phys.get(name, {})
        add(dict(id=code, name=name, type="dwarf" if name == "Pluto" else "planet", parent=10,
                 ephem={"kind": "spk", "chain": chain,
                        "barycenter": bary if code not in (199, 299, 399) else None},
                 radii=radii(code), gm=gm(code) or gm(bary), systemGm=gm(bary), rot=rotation(code),
                 albedo=p.get("albedo"), V10=p.get("V10"), texture=texture, color=color,
                 rotPeriodDays=p.get("rotPeriodDays")))

    # ---- moons
    sat_pp = {}
    for row in sat_phys[2:]:
        if len(row) < 6:
            continue
        sat_pp[int(row[2])] = dict(gm=num(row[3]), radius=num(row[4]))
    planet_ids = {"Earth": 399, "Mars": 499, "Jupiter": 599, "Saturn": 699, "Uranus": 799,
                  "Neptune": 899, "Pluto": 999}
    seen = set()
    textures_by_name = {k for k in tex["maps"]}
    for row in sat_elem[1:]:
        (_, planet, sname, code, eph, frame, epoch, a, e, w, M, inc, node, P, Pw, Pn, ra, dec, tilt, ref) = row[:20]
        code = int(code)
        if code in seen:
            continue
        seen.add(code)
        y, mo, d = epoch.split("-")
        jd_epoch = 2451545.0 if epoch == "2000-01-01.5" else None
        if jd_epoch is None:
            day = float(d)
            jd_epoch = 367 * int(y) - (7 * (int(y) + (int(mo) + 9) // 12)) // 4 + (275 * int(mo)) // 9 + day + 1721013.5
        pp = sat_pp.get(code, {})
        r = radii(code)
        radius_src = "pck" if r else ("jpl-sats" if pp.get("radius") else None)
        if not r and pp.get("radius"):
            r = [pp["radius"]] * 3
        orbit = {
            "frame": frame.lower(), "epochJd": jd_epoch, "a": num(a), "e": num(e), "w": num(w), "M": num(M),
            "i": num(inc), "node": num(node), "P": num(P),
            "Pw": num(Pw), "Pnode": num(Pn), "poleRa": num(ra), "poleDec": num(dec), "ephemeris": eph,
        }
        texture = sname.lower() if sname.lower() in textures_by_name else None
        add(dict(id=code, name=sname, type="moon", parent=planet_ids[planet],
                 ephem={"kind": "satellite", "orbit": {k: v for k, v in orbit.items() if v is not None}},
                 radii=r, radiusSource=radius_src, gm=gm(code) or pp.get("gm"), rot=rotation(code),
                 texture=texture))

    # ---- large asteroids, dwarf planets and TNOs (diameter > 100 km, or H < 4.5)
    fields = ["spkid", "full_name", "pdes", "name", "class", "a", "e", "i", "om", "w", "ma", "epoch",
              "H", "diameter", "albedo", "rot_per", "GM", "extent", "BV", "spec_T", "spec_B"]
    big = {r["spkid"]: r for r in sbdb(fields, {"sb-kind": "a", "sb-cdata": json.dumps({"AND": ["diameter|GT|100"]})})}
    for r in sbdb(fields, {"sb-kind": "a", "sb-cdata": json.dumps({"AND": ["H|LT|4.5"]})}):
        big.setdefault(r["spkid"], r)
    n_big = 0
    for r in big.values():
        if r["pdes"] == "134340":  # Pluto comes from DE442S
            continue
        sid = int(r["spkid"])
        name = r["name"] or r["full_name"].strip()
        diam = f(r["diameter"])
        rad = None
        if r.get("extent"):
            ext = [float(x) for x in re.findall(r"[\d.]+", r["extent"])]
            if len(ext) == 3:
                rad = [x / 2 for x in ext]
        if rad is None and diam:
            rad = [diam / 2] * 3
        cls = r["class"]
        typ = "tno" if cls in ("TNO", "CEN") else "asteroid"
        dwarf = name in ("Ceres", "Eris", "Haumea", "Makemake")
        if rad is None and phys.get(name, {}).get("meanRadius"):
            rad = [phys[name]["meanRadius"]] * 3  # JPL dwarf-planet table
        albedo = f(r["albedo"]) or phys.get(name, {}).get("albedo")
        add(dict(id=sid, name=name, fullName=r["full_name"].strip(), type="dwarf" if dwarf else typ, parent=10,
                 orbitClass=cls,
                 ephem={"kind": "kepler", "frame": "ecliptic", "center": 10, "epochJd": f(r["epoch"]), "a": f(r["a"]) * AU_KM,
                        "e": f(r["e"]), "i": f(r["i"]), "node": f(r["om"]), "w": f(r["w"]), "M": f(r["ma"])},
                 radii=rad, radiusSource=("sbdb" if (f(r["diameter"]) or r.get("extent")) else "jpl-phys-par") if rad else None, gm=f(r["GM"]), H=f(r["H"]),
                 albedo=albedo, rotPeriodHours=f(r["rot_per"]), BV=f(r["BV"]),
                 spectralType=r["spec_T"] or r["spec_B"],
                 texture=SMALL_BODY_TEXTURES.get(r["pdes"])))
        n_big += 1

    # ---- leap seconds
    da = lsk["DELTA_AT"]
    months = {m: i + 1 for i, m in enumerate("JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split())}
    leaps = []
    for i in range(0, len(da), 2):
        yy, mm, dd = da[i + 1][1:].split("-")
        leaps.append([int(yy), months[mm], int(dd), int(da[i])])

    # ---- approximate Keplerian elements (fallback outside DE442S range)
    pres = re.findall(r"<h4>Table (2a|2b)</h4>.*?<pre>(.*?)</pre>", approx_html, flags=re.S)
    approx = {}
    for which, body in pres:
        lines = [ln for ln in body.splitlines() if ln.strip() and not re.match(r"^\s*-{5,}", ln)]
        if which == "2a":
            name = None
            for ln in lines:
                parts = ln.split()
                numeric = len(parts) >= 7 and all(re.fullmatch(r"[-\d.]+", x) for x in parts[-6:])
                if numeric and parts[0] in ("Mercury", "Venus", "EM", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"):
                    name = "EMB" if parts[0] == "EM" else parts[0]
                    vals = [float(x) for x in parts[-6:]]
                    approx[name] = {"el0": vals}
                elif name and len(parts) == 6 and re.match(r"^[-\d.\s]+$", ln):
                    approx[name]["rate"] = [float(x) for x in parts]
                    name = None
        else:
            for ln in lines:
                parts = ln.split()
                if parts[0] in approx and len(parts) == 5:
                    approx[parts[0]]["bcsf"] = [float(x) for x in parts[1:]]

    system = {
        "generated": "pipeline/build_solar_system.py",
        "sources": {
            "rotation": "NAIF pck00011.tpc (IAU WGCCRE)", "gm": "NAIF gm_de440.tpc",
            "satellites": "JPL SSD planetary satellite mean elements + physical parameters",
            "smallBodies": "JPL SBDB Query API (osculating elements, full precision)",
            "planets": "JPL SSD planetary physical parameters", "ephemeris": "JPL DE442S",
        },
        "nutPrecAngles": systems,
        "leapSeconds": leaps,
        "approxElements": approx,
        "bodies": bodies,
    }
    write_json(DEST / "system.json", system)
    print(f"  {len(bodies)} bodies ({n_big} large asteroids/TNOs), approx elements for {list(approx)}")

    # ---- numbered asteroid point cloud (GPU-propagated)
    rows = sbdb(["spkid", "a", "e", "i", "om", "w", "ma", "epoch", "H", "class"],
                {"sb-kind": "a", "sb-ns": "n", "sb-cdata": json.dumps({"AND": ["H|LT|15"]})})
    classes = ["MBA", "IMB", "OMB", "MCA", "APO", "ATE", "AMO", "IEO", "TJN", "CEN", "TNO", "HYA", "PAA", "AST"]
    ref = 2461000.5
    K = 0.01720209895 * 180 / math.pi  # Gaussian gravitational constant -> deg/day for a in AU
    buf = bytearray()
    n = 0
    big_ids = {str(r["spkid"]) for r in big.values()}
    for r in rows:
        a, e = f(r["a"]), f(r["e"])
        if str(r["spkid"]) in big_ids:
            continue  # rendered as a full body
        if a is None or e is None or e >= 1 or a <= 0:
            continue
        nmot = K / a ** 1.5
        m_ref = (f(r["ma"]) + nmot * (ref - f(r["epoch"]))) % 360.0
        cls = classes.index(r["class"]) if r["class"] in classes else len(classes) - 1
        buf += struct.pack("<8f", a, e, f(r["i"]), f(r["om"]), f(r["w"]), m_ref, f(r["H"]), cls)
        n += 1
    (DEST / "asteroids.bin").write_bytes(bytes(buf))
    write_json(DEST / "asteroids.json", {"count": n, "refEpochJd": ref, "stride": 8,
                                          "layout": ["a_au", "e", "i_deg", "node_deg", "peri_deg", "M_at_ref_deg", "H", "class"],
                                          "classes": classes, "frame": "ecliptic J2000, heliocentric",
                                          "source": "JPL SBDB Query API: numbered asteroids with H < 15"})
    print(f"  {n} asteroids in point cloud")

    # ---- comets
    crow = sbdb(["spkid", "full_name", "prefix", "e", "q", "i", "om", "w", "tp", "epoch", "M1", "K1", "diameter"],
                {"sb-kind": "c"})
    comets = []
    for r in crow:
        e, q, tp = f(r["e"]), f(r["q"]), f(r["tp"])
        if e is None or q is None or tp is None:
            continue
        comets.append([r["full_name"].strip(), r["prefix"] or "", round(e, 9), round(q, 9), f(r["i"]), f(r["om"]),
                       f(r["w"]), tp, f(r["M1"]), f(r["K1"]), f(r["diameter"]), int(r["spkid"])])
    write_json(DEST / "comets.json", {"layout": ["name", "prefix", "e", "q_au", "i", "node", "peri", "tp_jd", "M1", "K1", "diameter_km", "spkid"],
                                      "frame": "ecliptic J2000, heliocentric", "source": "JPL SBDB Query API: all comets",
                                      "comets": comets})
    print(f"  {len(comets)} comets")

    # ---- Saturn ring normal-opacity profile -> 1D texture
    tab = download(RINGS + "PS1P01.TAB", RAW / "PS1P01.TAB").read_text().splitlines()
    download(RINGS + "PS1P01.LBL", RAW / "PS1P01.LBL")
    rad, tau = [], []
    for ln in tab:
        p = [float(x) for x in ln.split(",")]
        rad.append(p[0])
        tau.append(5.0 if p[3] >= 99 else max(0.0, p[3]))
    rad, tau = np.array(rad), np.array(tau)
    width = 2048
    rr = np.linspace(rad[0], rad[-1], width)
    tt = np.interp(rr, rad, tau)
    alpha = 1.0 - np.exp(-tt)  # normal-incidence opacity
    img = (np.clip(alpha, 0, 1) * 255 + 0.5).astype(np.uint8)[None, :]
    Image.fromarray(img, "L").save(OUT / "textures" / "saturn_rings.png", optimize=True)
    write_json(DEST / "rings.json", {"saturn": {"innerKm": float(rad[0]), "outerKm": float(rad[-1]), "texture": "saturn_rings.png",
                                                "encoding": "alpha = 1 - exp(-tau_normal); tau=99 (opaque) mapped to 5",
                                                "source": "PDS Rings Node VG_2801 Voyager 2 PPS delta Sco occultation, 10 km resolution (PS1P01)"}},
               compact=False)


if __name__ == "__main__":
    main()
