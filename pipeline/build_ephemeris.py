"""Convert JPL DE442S (NAIF generic SPK kernel) into streamable chunks.

DE442S stores Chebyshev (SPK type 2) position polynomials with uniform
record lengths. We keep the same polynomials but split the time span into
10-year chunks that the browser fetches on demand.

Storage: the constant coefficient c0 (the large mean position) is kept as
float64; higher-order coefficients are much smaller in magnitude and are
stored as float32. The reconstruction error is measured below against
jplephem's own evaluation of the original kernel and written to the index.
"""
from __future__ import annotations

import numpy as np
from jplephem.spk import SPK

from common import OUT, RAW, download, write_json

KERNEL_URL = "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de442s.bsp"
CHUNK_DAYS = 3652.5
DEST = OUT / "ephem"


def cheb_eval(c0, cr, x):
    """c0: (3,), cr: (3, n-1) coefficients for T1..T(n-1); x in [-1, 1]."""
    n = cr.shape[1] + 1
    t_prev, t = 1.0, x
    pos = c0.copy()
    for k in range(1, n):
        pos += cr[:, k - 1] * t
        t_prev, t = t, 2 * x * t - t_prev
    return pos


def main() -> None:
    path = download(KERNEL_URL, RAW / "de442s.bsp", min_size=30_000_000)
    kernel = SPK.open(str(path))
    DEST.mkdir(parents=True, exist_ok=True)
    segs = []
    for s in kernel.segments:
        init, intlen, coef = s.load_array()  # init: JD (TDB), intlen: days, coef: (3, nrec, ncoef)
        if np.abs(coef).max() == 0.0:
            continue  # Mercury/Venus barycentre -> body offsets are identically zero
        segs.append(dict(center=s.center, target=s.target, init=float(init), intlen=float(intlen),
                         coef=coef, seg=s))
    segs.sort(key=lambda d: (d["center"], d["target"]))
    jd0 = max(d["init"] for d in segs)
    jd1 = min(d["init"] + d["intlen"] * d["coef"].shape[1] for d in segs)

    index = {
        "source": "JPL DE442S (NAIF generic kernel de442s.bsp), Chebyshev type-2 records, positions in km, TDB",
        "jdStart": jd0, "jdEnd": jd1, "chunkDays": CHUNK_DAYS,
        "segments": [dict(center=d["center"], target=d["target"], init=d["init"], intlen=d["intlen"],
                          ncoef=int(d["coef"].shape[2])) for d in segs],
        "chunks": [],
    }
    t = jd0
    total = 0
    while t < jd1:
        t_end = min(t + CHUNK_DAYS, jd1)
        parts64, parts32, table = [], [], []
        off64 = off32 = 0
        for d in segs:
            nrec_all = d["coef"].shape[1]
            k0 = int(np.floor((t - d["init"]) / d["intlen"]))
            k1 = int(np.ceil((t_end - d["init"]) / d["intlen"]))
            k0, k1 = max(0, k0), min(nrec_all, k1)
            c = d["coef"][:, k0:k1, :]  # (3, n, ncoef)
            c = np.transpose(c, (1, 0, 2))  # (n, 3, ncoef)
            p64 = np.ascontiguousarray(c[:, :, 0], dtype="<f8")
            p32 = np.ascontiguousarray(c[:, :, 1:], dtype="<f4")
            parts64.append(p64.tobytes())
            parts32.append(p32.tobytes())
            table.append([k0, k1 - k0, off64, off32])
            off64 += p64.nbytes
            off32 += p32.nbytes
        blob = b"".join(parts64)
        base32 = len(blob)
        blob += b"".join(parts32)
        for row in table:
            row[3] += base32
        year = 2000 + (t - 2451545.0) / 365.25
        name = f"de442s_{int(np.floor(year))}.bin"
        (DEST / name).write_bytes(blob)
        total += len(blob)
        index["chunks"].append({"file": name, "jd0": t, "jd1": t_end, "seg": table})
        t = t_end

    # Accuracy check against jplephem evaluating the original kernel.
    rng = np.random.default_rng(42)
    worst = {}
    for d in segs:
        err = 0.0
        coef = d["coef"]
        for jd in rng.uniform(jd0, jd1, 400):
            k = min(int((jd - d["init"]) // d["intlen"]), coef.shape[1] - 1)
            x = 2 * (jd - (d["init"] + k * d["intlen"])) / d["intlen"] - 1
            c0 = coef[:, k, 0].astype("<f8")
            cr = coef[:, k, 1:].astype("<f4").astype("<f8")
            mine = cheb_eval(c0, cr, x)
            ref = d["seg"].compute(jd)
            err = max(err, float(np.linalg.norm(mine - ref)))
        worst[f"{d['center']}->{d['target']}"] = round(err, 6)
    index["maxErrorKm"] = worst
    print("max reconstruction error (km):", worst)
    write_json(DEST / "index.json", index, compact=False)
    print(f"  {len(index['chunks'])} chunks, {total/1e6:.1f} MB total")


if __name__ == "__main__":
    main()
