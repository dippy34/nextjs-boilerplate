"""Build the streamable star catalogue.

Inputs
  * AT-HYG v4.0 (Augmented Tycho-HYG; Tycho-2 + Gaia DR3 + Hipparcos + Yale BSC
    + Gliese; CC BY-SA 4.0) - 2.55 M stars with distances.
  * HYG v4.4 (CC BY-SA 4.0): Hipparcos-based V and B-V for stars that AT-HYG
    cross-references (Tycho VT photometry saturates for the brightest stars).
  * Gaia DR3 100 pc subset from fetch_gaia.py - adds faint nearby stars missing
    from Tycho-2 (de-duplicated against AT-HYG by Gaia source_id).

Output: two separately licensed datasets with the same layout
  public/data/stars/       AT-HYG (+HYG photometry)       CC BY-SA 4.0
  public/data/stars-gaia/  Gaia DR3 100 pc supplement     CC BY-NC 3.0 IGO (non-commercial)
Each contains:
  * index.json      - octree nodes
  * n/<id>.bin      - per-node render data, stars sorted brightest first
                      u16 nodes: 3 x uint16 position (normalised in node cube) + uint8 absMag + uint8 Teff  (8 B)
                      f32 nodes: 3 x float32 position (pc, relative to node centre) + uint8 absMag + uint8 Teff + 2 pad (16 B)
  * n/<id>.ids      - per-node uint32 designation codes (see IdCode below), fetched lazily on picking
  * named.json      - "notable" stars (proper / Bayer / Flamsteed / HR / Gliese) for search, labels, info
  * extra_ids.txt   - Gaia DR3 source_ids for stars with no classical designation

The octree is "brightest first": every node keeps the K intrinsically
brightest stars inside its cube that were not taken by an ancestor. The
runtime can then decide exactly whether any star of a node (or its subtree)
can be brighter than the current limiting magnitude.
"""
from __future__ import annotations

import csv
import gzip
import json
import math
from pathlib import Path

import numpy as np

from common import OUT, RAW, download, write_json

ATHYG_URL = "https://codeberg.org/astronexus/athyg/media/branch/main/data/athyg_40.csv.gz"
HYG_URL = "https://codeberg.org/astronexus/hyg/media/branch/main/data/hyg/CURRENT/hyg_v44.csv.gz"
NODE_CAP = 8192
MAX_DEPTH = 18
MAX_DIST_PC = 20000.0  # larger AT-HYG distances come from poor parallaxes
ROOT_HALF = 20480.0
ABSMAG_MIN, ABSMAG_STEP = -12.0, 0.125
TEFF_MIN, TEFF_MAX = 1000.0, 50000.0
ANGULAR_TOL = 3e-5  # rad (~6"): max quantisation error seen from the Sun for u16 nodes

GREEK = {"Alp": "α", "Bet": "β", "Gam": "γ", "Del": "δ", "Eps": "ε", "Zet": "ζ", "Eta": "η", "The": "θ",
         "Iot": "ι", "Kap": "κ", "Lam": "λ", "Mu": "μ", "Nu": "ν", "Xi": "ξ", "Omi": "ο", "Pi": "π",
         "Rho": "ρ", "Sig": "σ", "Tau": "τ", "Ups": "υ", "Phi": "φ", "Chi": "χ", "Psi": "ψ", "Ome": "ω"}


def bv_to_teff(bv):
    """Ballesteros (2012), EPL 97, 34008."""
    x = np.clip(bv, -0.4, 2.0)
    return 4600.0 * (1.0 / (0.92 * x + 1.7) + 1.0 / (0.92 * x + 0.62))


def bayer_name(bayer: str, con: str) -> str:
    if not bayer:
        return ""
    base = bayer.rstrip("0123456789-")
    num = bayer[len(base):].lstrip("-")
    g = GREEK.get(base, base)
    return f"{g}{('-' + num) if num else ''} {con}".strip()


def robust_polyfit(x, y, deg, iters=5, clip=3.0):
    m = np.isfinite(x) & np.isfinite(y)
    for _ in range(iters):
        c = np.polyfit(x[m], y[m], deg)
        r = y - np.polyval(c, x)
        s = 1.4826 * np.median(np.abs(r[m] - np.median(r[m])))
        m = m & (np.abs(r) < clip * s)
    return c, m


def eval_clamped(c, x, lo, hi):
    """Polynomial inside [lo, hi], linear continuation (matching slope) outside."""
    d = np.polyder(c)
    xc = np.clip(x, lo, hi)
    return np.polyval(c, xc) + (x - xc) * np.polyval(d, xc)


def main() -> None:
    src = download(ATHYG_URL, RAW / "athyg_40.csv.gz", min_size=150_000_000)
    print("reading AT-HYG ...")
    hyg_src = download(HYG_URL, RAW / "hyg_v44.csv.gz", min_size=10_000_000)
    hyg = {}
    with gzip.open(hyg_src, "rt") as f:
        for row in csv.DictReader(f):
            hyg[row["id"]] = (row["mag"], row["ci"])
    cols = ["id", "tyc", "gaia", "hyg", "hip", "hd", "hr", "gl", "bayer", "flam", "con", "proper",
            "dist", "x0", "y0", "z0", "mag", "absmag", "ci", "spect"]
    rows = {k: [] for k in cols}
    with gzip.open(src, "rt") as f:
        r = csv.reader(f)
        h = next(r)
        ix = {k: h.index(k) for k in cols}
        for row in r:
            if not row[ix["dist"]] or not row[ix["absmag"]] or row[ix["id"]] == "1":
                continue
            if float(row[ix["dist"]]) > MAX_DIST_PC:
                continue
            for k in cols:
                rows[k].append(row[ix[k]])
    n_a = len(rows["id"])
    # Prefer Hipparcos-based V / B-V from HYG where AT-HYG cross-references a HYG star.
    n_v = n_ci = 0
    for i in range(n_a):
        h = hyg.get(rows["hyg"][i])
        if not h:
            continue
        hv, hci = h
        if hv:
            d = float(rows["dist"][i])
            rows["absmag"][i] = str(float(hv) - 5 * math.log10(d) + 5)
            rows["mag"][i] = hv
            n_v += 1
        if hci:
            rows["ci"][i] = hci
            n_ci += 1
    print(f"  HYG v4.4 supplied V for {n_v} and B-V for {n_ci} stars")
    pos_a = np.stack([np.array(rows[k], dtype=np.float64) for k in ("x0", "y0", "z0")], axis=1)
    absmag_a = np.array(rows["absmag"], dtype=np.float64)
    vmag_a = np.array([float(v) if v else np.nan for v in rows["mag"]])
    ci = np.array([float(v) if v else np.nan for v in rows["ci"]])
    # Missing B-V: use the median B-V of stars of the same spectral class letter (measured from this catalogue).
    cls = np.array([s[:1] if s else "" for s in rows["spect"]])
    for letter in "OBAFGKM":
        sel = cls == letter
        med = np.nanmedian(ci[sel & np.isfinite(ci)]) if np.any(sel & np.isfinite(ci)) else np.nan
        ci[sel & ~np.isfinite(ci)] = med
    ci[~np.isfinite(ci)] = np.nanmedian(ci)
    teff_a = bv_to_teff(ci)
    print(f"  {n_a} AT-HYG stars")

    # ------------------------------------------------------------------ Gaia DR3 supplement
    gaia_ids_athyg = {g for g in rows["gaia"] if g}
    g = {k: [] for k in ("source_id", "ra", "dec", "parallax", "phot_g_mean_mag", "bp_rp", "teff_gspphot")}
    with open(RAW / "gaia_dr3_100pc.csv") as f:
        r = csv.DictReader(f)
        for row in r:
            for k in g:
                g[k].append(row[k])
    sid = np.array(g["source_id"])
    G = np.array(g["phot_g_mean_mag"], dtype=np.float64)
    bprp = np.array([float(v) if v else np.nan for v in g["bp_rp"]])
    teff_g = np.array([float(v) if v else np.nan for v in g["teff_gspphot"]])
    plx = np.array(g["parallax"], dtype=np.float64)
    in_athyg = np.array([s in gaia_ids_athyg for s in sid])
    print(f"  Gaia 100 pc: {len(sid)} sources, {in_athyg.sum()} already in AT-HYG")

    # Fit V - G as a function of BP-RP on the overlap (AT-HYG V/VT vs Gaia G).
    athyg_v_by_gaia = {gid: vmag_a[i] for i, gid in enumerate(rows["gaia"]) if gid}
    ov_v = np.array([athyg_v_by_gaia.get(s, np.nan) if m else np.nan for s, m in zip(sid, in_athyg)])
    ok = in_athyg & np.isfinite(ov_v) & np.isfinite(bprp)
    c_vg, m_vg = robust_polyfit(bprp[ok], ov_v[ok] - G[ok], 3)
    lo, hi = np.percentile(bprp[ok][m_vg], [0.5, 99.5])
    print(f"  V-G(BP-RP) fit on {m_vg.sum()} overlap stars, valid range [{lo:.2f}, {hi:.2f}], coeffs {np.round(c_vg, 5)}")
    # Fit log10 Teff as a function of BP-RP from GSP-Phot temperatures.
    okt = np.isfinite(teff_g) & np.isfinite(bprp)
    c_t, m_t = robust_polyfit(bprp[okt], np.log10(teff_g[okt]), 4)
    tlo, thi = np.percentile(bprp[okt][m_t], [0.5, 99.5])
    print(f"  log Teff(BP-RP) fit on {m_t.sum()} stars, range [{tlo:.2f}, {thi:.2f}]")

    keep = ~in_athyg & np.isfinite(bprp)
    print(f"  adding {keep.sum()} Gaia-only stars ({(~in_athyg & ~np.isfinite(bprp)).sum()} without BP-RP dropped)")
    ra, dec = np.radians(np.array(g["ra"], dtype=np.float64)[keep]), np.radians(np.array(g["dec"], dtype=np.float64)[keep])
    d_g = 1000.0 / plx[keep]
    pos_g = np.stack([d_g * np.cos(dec) * np.cos(ra), d_g * np.cos(dec) * np.sin(ra), d_g * np.sin(dec)], axis=1)
    V_g = G[keep] + eval_clamped(c_vg, bprp[keep], lo, hi)
    absmag_g = V_g - 5 * np.log10(d_g) + 5
    tg = teff_g[keep]
    tfit = 10 ** eval_clamped(c_t, bprp[keep], tlo, thi)
    teff_gs = np.where(np.isfinite(tg), tg, tfit)
    sid_g = sid[keep]

    # ------------------------------------------------------------------ designation codes (AT-HYG)
    named = []           # notable stars (search, labels)
    code = np.zeros(n_a, dtype=np.uint32)
    extra = []           # designations for stars without classical / HIP / HD / TYC ids
    notable_idx = np.full(n_a, -1, dtype=np.int64)
    for i in range(n_a):
        proper, bayer, flam, con = rows["proper"][i], rows["bayer"][i], rows["flam"][i], rows["con"][i]
        hr, gl, hip, hd = rows["hr"][i], rows["gl"][i], rows["hip"][i], rows["hd"][i]
        if proper or bayer or flam or hr or gl:
            desig = []
            if proper:
                desig.append(proper)
            if bayer:
                desig.append(bayer_name(bayer, con))
            if flam:
                desig.append(f"{flam} {con}")
            if hr:
                desig.append(f"HR {hr}")
            if gl:
                desig.append(gl if gl.startswith(("Gl", "GJ", "Wo", "NN")) else f"Gl {gl}")
            if hd:
                desig.append(f"HD {hd}")
            if hip:
                desig.append(f"HIP {hip}")
            if rows["tyc"][i]:
                desig.append(f"TYC {rows['tyc'][i]}")
            if rows["gaia"][i]:
                desig.append(f"Gaia DR3 {rows['gaia'][i]}")
            notable_idx[i] = len(named)
            named.append({"i": i, "names": desig, "spect": rows["spect"][i], "proper": bool(proper)})
        elif hip:
            code[i] = (1 << 30) | int(hip)
        elif hd:
            code[i] = (2 << 30) | int(hd)
        elif rows["tyc"][i]:
            t1, t2, t3 = (int(x) for x in rows["tyc"][i].split("-"))
            code[i] = (3 << 30) | (t1 << 16) | (t2 << 2) | (t3 - 1)
        else:
            extra.append(rows["gaia"][i] if rows["gaia"][i] else f"AT-HYG {rows['id'][i]}")
            notable_idx[i] = -2 - (len(extra) - 1)
    n_named = len(named)
    for i in range(n_a):
        if notable_idx[i] >= 0:
            code[i] = notable_idx[i]
        elif notable_idx[i] <= -2:
            code[i] = n_named + (-2 - notable_idx[i])
    print(f"  {n_named} notable stars, {len(extra)} extra designations")

    # ------------------------------------------------------------------ dataset 1: AT-HYG (+HYG photometry), CC BY-SA 4.0
    star_node, star_slot = write_octree(
        OUT / "stars", pos_a, absmag_a, teff_a, code, n_named, extra,
        source="AT-HYG v4.0 (Augmented Tycho-HYG) with HYG v4.4 photometry",
        license="CC BY-SA 4.0 (AT-HYG and HYG by David Nash / astronexus)")
    out = []
    for e in named:
        i = e["i"]
        p = pos_a[i]
        out.append([e["names"], round(float(p[0]), 10), round(float(p[1]), 10), round(float(p[2]), 10),
                    round(float(absmag_a[i]), 2), int(round(teff_a[i])), e["spect"], int(star_node[i]), int(star_slot[i]),
                    1 if e["proper"] else 0])
    write_json(OUT / "stars" / "named.json", {"layout": ["names", "x_pc", "y_pc", "z_pc", "absMag", "teff", "spect", "node", "slot", "proper"],
                                              "license": "CC BY-SA 4.0", "stars": out})

    # ------------------------------------------------------------------ dataset 2: Gaia DR3 100 pc supplement, CC BY-NC 3.0 IGO
    # Kept in its own files because the licences differ (Gaia data are non-commercial).
    write_octree(
        OUT / "stars-gaia", pos_g, absmag_g, teff_gs, np.arange(len(sid_g), dtype=np.uint32), 0, [str(x) for x in sid_g],
        source="Gaia DR3 (ESA/Gaia/DPAC): parallax > 10 mas, parallax_over_error > 10, RUWE < 1.4, not in AT-HYG",
        license="CC BY-NC 3.0 IGO (ESA/Gaia/DPAC)")


def write_octree(dest: Path, pos, absmag, teff, code, n_named: int, extra: list[str], source: str, license: str):
    """Write a brightest-first octree of stars. Returns (node index, slot) per input star."""
    pos = pos.copy()
    N = len(pos)
    order = np.argsort(absmag, kind="stable")  # brightest first
    nodes = []
    star_node = np.full(N, -1, dtype=np.int64)
    star_slot = np.full(N, -1, dtype=np.int64)
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "n").mkdir(exist_ok=True)
    for old in (dest / "n").glob("*"):
        old.unlink()

    def build(idx: np.ndarray, center: np.ndarray, half: float, depth: int, parent: int) -> int:
        nid = len(nodes)
        node = {"id": nid, "parent": parent, "depth": depth, "c": center.tolist(), "h": half, "children": []}
        nodes.append(node)
        if len(idx) <= NODE_CAP or depth >= MAX_DEPTH:
            mine, rest = idx, idx[:0]
        else:
            mine, rest = idx[:NODE_CAP], idx[NODE_CAP:]
        node["n"] = int(len(mine))
        node["mag"] = [float(absmag[mine].min()), float(absmag[mine].max())] if len(mine) else [99.0, 99.0]
        star_node[mine] = nid
        star_slot[mine] = np.arange(len(mine))
        node["_idx"] = mine
        if len(rest):
            p = pos[rest]
            octant = ((p[:, 0] >= center[0]).astype(int) | ((p[:, 1] >= center[1]).astype(int) << 1)
                      | ((p[:, 2] >= center[2]).astype(int) << 2))
            for o in range(8):
                sub = rest[octant == o]  # preserves brightness order
                if len(sub) == 0:
                    continue
                off = np.array([1 if o & 1 else -1, 1 if o & 2 else -1, 1 if o & 4 else -1], dtype=np.float64)
                cid = build(sub, center + off * half / 2, half / 2, depth + 1, nid)
                node["children"].append(cid)
        return nid

    in_root = np.all(np.abs(pos[order]) < ROOT_HALF, axis=1)
    build(order[in_root], np.zeros(3), ROOT_HALF, 0, -1)

    total_bytes = 0
    for node in nodes:
        mine = node.pop("_idx")
        c = np.array(node["c"])
        h = node["h"]
        p = pos[mine]
        dmin = float(np.linalg.norm(p, axis=1).min()) if len(mine) else 1.0
        step = 2 * h / 65535.0
        enc = "u" if step / max(dmin, 1e-6) <= ANGULAR_TOL else "f"
        am = np.clip(np.round((absmag[mine] - ABSMAG_MIN) / ABSMAG_STEP), 0, 255).astype(np.uint8)
        tq = np.clip(np.round((np.log(teff[mine]) - math.log(TEFF_MIN)) / (math.log(TEFF_MAX) - math.log(TEFF_MIN)) * 255), 0, 255).astype(np.uint8)
        if enc == "u":
            q = np.clip(np.round((p - (c - h)) / (2 * h) * 65535.0), 0, 65535).astype("<u2")
            rec = np.zeros(len(mine), dtype=[("q", "<u2", 3), ("m", "u1"), ("t", "u1")])
            rec["q"] = q
            deq = (c - h) + q.astype(np.float64) / 65535.0 * (2 * h)
        else:
            rel = (p - c).astype("<f4")
            rec = np.zeros(len(mine), dtype=[("p", "<f4", 3), ("m", "u1"), ("t", "u1"), ("pad", "u1", 2)])
            rec["p"] = rel
            deq = c + rel.astype(np.float64)
        rec["m"] = am
        rec["t"] = tq
        pos[mine] = deq  # keep catalogue positions identical to what the engine renders
        node["enc"] = enc
        (dest / "n" / f"{node['id']}.bin").write_bytes(rec.tobytes())
        (dest / "n" / f"{node['id']}.ids").write_bytes(code[mine].astype("<u4").tobytes())
        total_bytes += rec.nbytes + 4 * len(mine)

    for node in reversed(nodes):
        sub = node["mag"][0]
        for cid in node["children"]:
            sub = min(sub, nodes[cid]["subMag"])
        node["subMag"] = sub

    index = {
        "source": source, "license": license,
        "units": "parsec, ICRS equatorial, heliocentric",
        "nodeCapacity": NODE_CAP, "rootHalf": ROOT_HALF,
        "absMag": {"min": ABSMAG_MIN, "step": ABSMAG_STEP},
        "teff": {"min": TEFF_MIN, "max": TEFF_MAX, "encoding": "log"},
        "idCode": {"kinds": ["notable-or-extra", "HIP", "HD", "TYC"], "notableCount": n_named,
                   "tyc": "bits 16-29 TYC1, bits 2-15 TYC2, bits 0-1 TYC3-1"},
        "stars": int(sum(nd["n"] for nd in nodes)),
        "nodes": [[nd["id"], nd["parent"], nd["depth"], *[round(x, 6) for x in nd["c"]], nd["h"], nd["n"],
                   round(nd["mag"][0], 3), round(nd["mag"][1], 3), round(nd["subMag"], 3), nd["enc"], nd["children"]]
                  for nd in nodes],
        "nodeLayout": ["id", "parent", "depth", "cx", "cy", "cz", "half", "count", "magMin", "magMax", "subtreeMagMin", "enc", "children"],
    }
    write_json(dest / "index.json", index)
    (dest / "extra_ids.txt").write_text("\n".join(extra) + "\n")
    print(f"  {dest.name}: {len(nodes)} nodes, {index['stars']} stars, {total_bytes/1e6:.1f} MB tiles, "
          f"{sum(1 for n in nodes if n['enc'] == 'f')} float nodes")
    return star_node, star_slot


if __name__ == "__main__":
    main()
